// ==============================================================================
// KAPLA — TÁC VỤ GỬI EMAIL ĐỊNH KỲ NHẮC HỌC PHÍ CHO HRT PHỤ TRÁCH (T05 RELIABLE)
// 1. Chống gửi trùng khi 2 tiến trình chạy đồng thời (FOR UPDATE SKIP LOCKED)
// 2. Khóa chống gửi trùng (idempotency_key) & Kiểm tra provider_message_id
// 3. Xác thực lại HRT phụ trách, tài khoản HRT và hạn phí tươi mới ngay trước khi gửi
// 4. Cơ chế thử lại có giới hạn (max_retries = 3) & Kiểm tra kết quả ghi DB nghiêm ngặt
// 5. Cửa sổ nhắc trước hạn chuẩn (không gửi lại học viên đã quá hạn nhiều ngày)
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
  worker_id: string;
  target_date: string;
  queue_prepared: any;
  claimed_emails: number;
  sent_emails: number;
  skipped_emails: number;
  failed_emails: number;
  errors: any[];
}

export async function dispatchDailyTuitionEmails(
  customDate?: string,
  options?: {
    workerId?: string;
    batchSize?: number;
    simulateProviderCrashAfterSend?: boolean; // For testing provider-succeeded-but-db-failed
  }
): Promise<DispatchResult> {
  const targetDate = customDate || getVietnamToday();
  const workerId = options?.workerId || `worker-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const batchSize = options?.batchSize || 20;

  console.log(`[TuitionEmailDispatcher] [${workerId}] Bắt đầu tác vụ kiểm tra hạn học phí cho ngày ${targetDate} (Asia/Ho_Chi_Minh)...`);

  // 1. Chuẩn bị hàng đợi trong DB (Gom nhóm học viên theo HRT, áp cửa sổ nhắc trước hạn)
  const { data: queuePrep, error: prepError } = await adminClient.rpc('prepare_daily_tuition_alert_queue', {
    p_target_date: targetDate,
  });

  if (prepError) {
    console.error(`[TuitionEmailDispatcher] [${workerId}] Lỗi khi chuẩn bị hàng đợi:`, prepError);
    throw prepError;
  }

  console.log(`[TuitionEmailDispatcher] [${workerId}] Kết quả chuẩn bị hàng đợi:`, queuePrep);

  // 2. Nhận hàng đợi nguyên tử với khóa FOR UPDATE SKIP LOCKED
  //    Đảm bảo 2 tiến trình chạy đồng thời không bao giờ nhận trùng bản ghi
  const { data: claimedQueue, error: claimError } = await adminClient.rpc('claim_tuition_email_queue_batch', {
    p_dispatch_date: targetDate,
    p_worker_id: workerId,
    p_batch_size: batchSize,
  });

  if (claimError) {
    console.error(`[TuitionEmailDispatcher] [${workerId}] Lỗi khi claim hàng đợi:`, claimError);
    throw claimError;
  }

  const items = claimedQueue || [];
  console.log(`[TuitionEmailDispatcher] [${workerId}] Đã nhận thành công ${items.length} email cần xử lý từ hàng đợi.`);

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors: any[] = [];

  // 3. Xử lý từng email trong lô đã nhận
  for (const item of items) {
    try {
      console.log(`  -> [${workerId}] Đang thẩm định lại dữ liệu trước khi gửi cho Queue ID: ${item.id} (HRT: ${item.recipient_name})...`);

      // 3.1 Thẩm định lại dữ liệu tươi mới ngay trước thời điểm gửi (Pre-dispatch Revalidation)
      const { data: revalResult, error: revalError } = await adminClient.rpc('revalidate_and_rebuild_queue_item', {
        p_queue_id: item.id,
        p_target_date: targetDate,
      });

      if (revalError) {
        throw new Error(`Lỗi thẩm định dữ liệu tươi mới: ${revalError.message}`);
      }

      if (!revalResult || !revalResult.can_send) {
        console.log(`     [BỎ QUA] Không đủ điều kiện gửi (Lý do: ${revalResult?.reason || 'không rõ'}). Đã cập nhật skipped.`);
        skippedCount++;
        continue;
      }

      console.log(`     [ĐỦ ĐIỀU KIỆN] ${revalResult.student_count} học viên hợp lệ. Đang kiểm tra khóa chống trùng...`);

      // 3.2 Kiểm tra nếu email đã được nhà cung cấp ghi nhận trước đó (trường hợp crash khi ghi DB lần trước)
      let providerMessageId = revalResult.provider_message_id;

      if (!providerMessageId) {
        // Gọi nhà cung cấp email (Mailpit) kèm khóa chống gửi trùng Idempotency Key
        const payload = {
          From: {
            Email: 'hocvu@kapla.edu.vn',
            Name: 'KAPLA Academic Operations',
          },
          To: [
            {
              Email: revalResult.recipient_email,
              Name: revalResult.recipient_name,
            },
          ],
          Subject: revalResult.subject,
          Text: revalResult.text_body,
          HTML: revalResult.html_body,
          Headers: {
            'X-Idempotency-Key': revalResult.idempotency_key,
          },
        };

        const resp = await fetch(MAILPIT_SEND_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': revalResult.idempotency_key,
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          throw new Error(`Mailpit HTTP ${resp.status}: ${await resp.text()}`);
        }

        const sendResult = await resp.json();
        providerMessageId = sendResult.ID;
        console.log(`     [OK] Mailpit đã tiếp nhận thư (Message ID: ${providerMessageId})`);

        // Mô phỏng trường hợp Provider đã nhận nhưng hệ thống gặp sự cố trước khi chốt DB
        if (options?.simulateProviderCrashAfterSend) {
          // Lưu tạm provider_message_id nhưng để status là failed để test luồng retry
          await adminClient
            .from('email_dispatch_queue')
            .update({ provider_message_id: providerMessageId, status: 'failed', error_reason: 'Mô phỏng sự cố mạng sau khi gửi' })
            .eq('id', item.id);
          throw new Error('Mô phỏng sự cố mạng sau khi nhà cung cấp email đã nhận thư thành công');
        }
      } else {
        console.log(`     [IDEMPOTENCY RECOVERY] Phát hiện Provider Message ID đã tồn tại (${providerMessageId}). Không gửi lại email, tiến hành chốt trạng thái DB.`);
      }

      // 3.3 Chốt trạng thái gửi thành công vào Database (Atomic Finalize)
      const { data: finalizeData, error: finalizeError } = await adminClient.rpc('finalize_tuition_email_dispatch', {
        p_queue_id: item.id,
        p_success: true,
        p_provider_message_id: providerMessageId,
        p_error_message: null,
      });

      if (finalizeError) {
        throw new Error(`Lỗi chốt trạng thái sent trong database: ${finalizeError.message}`);
      }

      console.log(`     [HOÀN TẤT] Đã chốt trạng thái sent nguyên tử cho Queue ID: ${item.id}`);
      sentCount++;
    } catch (err: any) {
      console.error(`     [FAIL] Lỗi gửi email cho Queue ID ${item.id}:`, err.message);
      failedCount++;
      errors.push({ queue_id: item.id, error: err.message });

      // Cập nhật trạng thái lỗi kèm lịch retry vào DB
      try {
        const { error: fErr } = await adminClient.rpc('finalize_tuition_email_dispatch', {
          p_queue_id: item.id,
          p_success: false,
          p_provider_message_id: null,
          p_error_message: err.message,
        });
        if (fErr) {
          console.error(`     [CRITICAL] Không thể ghi trạng thái failed vào DB:`, fErr.message);
        }
      } catch (innerErr: any) {
        console.error(`     [CRITICAL] Exception khi chốt trạng thái failed:`, innerErr.message);
      }
    }
  }

  return {
    success: failedCount === 0,
    worker_id: workerId,
    target_date: targetDate,
    queue_prepared: queuePrep,
    claimed_emails: items.length,
    sent_emails: sentCount,
    skipped_emails: skippedCount,
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
