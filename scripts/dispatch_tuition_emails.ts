// ==============================================================================
// KAPLA — TÁC VỤ GỬI EMAIL ĐỊNH KỲ NHẮC HỌC PHÍ CHO HRT PHỤ TRÁCH (T05)
// - Múi giờ Việt Nam (Asia/Ho_Chi_Minh = UTC+7)
// - Gom nhóm học viên vào 1 email duy nhất cho mỗi HRT mỗi ngày
// - Tích hợp Mailpit API (http://127.0.0.1:54324/api/v1/send)
// - Chống gửi trùng lặp & Ghi nhật ký đầy đủ (sent, skipped, failed)
// ==============================================================================

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const MAILPIT_SEND_URL = process.env.MAILPIT_SEND_URL || 'http://127.0.0.1:54324/api/v1/send';

export const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function getVietnamToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

export interface DispatchResult {
  success: boolean;
  target_date: string;
  queue_prepared: any;
  sent_emails: number;
  failed_emails: number;
  errors: any[];
}

export async function dispatchDailyTuitionEmails(customDate?: string): Promise<DispatchResult> {
  const targetDate = customDate || getVietnamToday();
  console.log(`[TuitionEmailDispatcher] Bắt đầu tác vụ kiểm tra hạn học phí cho ngày ${targetDate} (Asia/Ho_Chi_Minh)...`);

  // 1. Chuẩn bị hàng đợi trong DB (Tính toán HRT hiện tại, gom nhóm học viên, chống trùng)
  const { data: queuePrep, error: prepError } = await adminClient.rpc('prepare_daily_tuition_alert_queue', {
    p_target_date: targetDate,
  });

  if (prepError) {
    console.error('[TuitionEmailDispatcher] Lỗi khi chuẩn bị hàng đợi:', prepError);
    throw prepError;
  }

  console.log('[TuitionEmailDispatcher] Kết quả chuẩn bị hàng đợi:', queuePrep);

  // 2. Lấy danh sách email đang chờ gửi trong ngày
  const { data: pendingQueue, error: queueError } = await adminClient
    .from('email_dispatch_queue')
    .select('*')
    .eq('dispatch_date', targetDate)
    .eq('status', 'pending');

  if (queueError) {
    console.error('[TuitionEmailDispatcher] Lỗi lấy hàng đợi pending:', queueError);
    throw queueError;
  }

  let sentCount = 0;
  let failedCount = 0;
  const errors: any[] = [];

  console.log(`[TuitionEmailDispatcher] Tìm thấy ${pendingQueue?.length || 0} email tổng hợp cần gửi trong ngày ${targetDate}.`);

  // 3. Gửi từng email qua Mailpit
  for (const item of pendingQueue || []) {
    try {
      console.log(`  -> Gửi email cho HRT: ${item.recipient_name} <${item.recipient_email}> (${item.student_count} học viên)...`);

      const payload = {
        From: {
          Email: 'hocvu@kapla.edu.vn',
          Name: 'KAPLA Academic Operations',
        },
        To: [
          {
            Email: item.recipient_email,
            Name: item.recipient_name,
          },
        ],
        Subject: item.subject,
        Text: item.text_body,
        HTML: item.html_body,
      };

      const resp = await fetch(MAILPIT_SEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        throw new Error(`Mailpit HTTP ${resp.status}: ${await resp.text()}`);
      }

      const sendResult = await resp.json();
      console.log(`     [OK] Đã gửi thành công (Mailpit Message ID: ${sendResult.ID})`);

      // Cập nhật trạng thái Queue thành sent
      await adminClient
        .from('email_dispatch_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      // Cập nhật trạng thái các log học viên liên quan thành sent
      await adminClient
        .from('email_dispatch_logs')
        .update({ delivery_status: 'sent' })
        .eq('queue_id', item.id);

      sentCount++;
    } catch (err: any) {
      console.error(`     [FAIL] Lỗi gửi email cho ${item.recipient_email}:`, err.message);
      failedCount++;
      errors.push({ queue_id: item.id, recipient: item.recipient_email, error: err.message });

      // Cập nhật trạng thái failed
      await adminClient
        .from('email_dispatch_queue')
        .update({
          status: 'failed',
          error_reason: err.message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      await adminClient
        .from('email_dispatch_logs')
        .update({ delivery_status: 'failed' })
        .eq('queue_id', item.id);
    }
  }

  return {
    success: failedCount === 0,
    target_date: targetDate,
    queue_prepared: queuePrep,
    sent_emails: sentCount,
    failed_emails: failedCount,
    errors,
  };
}

// Chạy trực tiếp nếu file được gọi từ CLI
if (process.argv[1]?.endsWith('dispatch_tuition_emails.ts')) {
  const customDateArg = process.argv[2];
  dispatchDailyTuitionEmails(customDateArg)
    .then((result) => {
      console.log('\n[TuitionEmailDispatcher] Hoàn tất tác vụ:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('\n[TuitionEmailDispatcher] Lỗi nghiêm trọng:', err);
      process.exit(1);
    });
}
