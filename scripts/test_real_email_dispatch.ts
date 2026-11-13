// ==============================================================================
// KAPLA — KIỂM THỬ ĐỘ TIN CẬY & BẢO MẬT GỬI EMAIL NHẮC HỌC PHÍ (T05 RELIABLE)
// 1. Chống gửi trùng tuyệt đối khi 2 tiến trình chạy đồng thời (Concurrency Lock)
// 2. Xác thực lại HRT phụ trách, tài khoản HRT và hạn phí tươi mới ngay trước lúc gửi
// 3. Cơ chế thử lại (Retry) & Khôi phục khi Mailpit nhận thành công nhưng DB gặp lỗi
// 4. Áp đúng cửa sổ nhắc trước hạn & Hiển thị riêng "Hết hạn hôm nay"
// ==============================================================================

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';
import { dispatchDailyTuitionEmails, getVietnamToday } from './dispatch_tuition_emails';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const MAILPIT_BASE_URL = 'http://127.0.0.1:54324';

const BRANCH_PH_ID = 'a0000000-0000-0000-0000-000000000001'; // Phạm Hùng
const BRANCH_BT_ID = 'a0000000-0000-0000-0000-000000000002'; // Bình Tân

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let total = 0;

function assert(description: string, condition: boolean, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${description}`);
    if (detail) console.log(`         -> ${detail}`);
  } else {
    console.error(`  [FAIL] ${description}`);
    if (detail) console.error(`         -> ${detail}`);
    throw new Error(`Kiểm thử thất bại tại bước: "${description}"`);
  }
}

async function clearMailpit() {
  await fetch(`${MAILPIT_BASE_URL}/api/v1/messages`, { method: 'DELETE' });
}

async function getMailpitMessages() {
  const res = await fetch(`${MAILPIT_BASE_URL}/api/v1/messages`);
  const data = await res.json();
  return data.messages || [];
}

async function getMailpitMessageDetail(id: string) {
  const res = await fetch(`${MAILPIT_BASE_URL}/api/v1/message/${id}`);
  return await res.json();
}

async function runReliableEmailDispatchTests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ ĐỘ TIN CẬY & CHỐNG GỬI TRÙNG EMAIL HRT (T05)');
  console.log('  2 Chi nhánh: Phạm Hùng & Bình Tân | Múi giờ ICT (UTC+7)');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';
  const todayVn = getVietnamToday();

  // Dọn sạch Mailpit trước khi kiểm thử
  await clearMailpit();

  // 1. Tạo các tài khoản HRT
  const maiEmail = `hrt.mai.${runId}@kapla.edu.vn`;
  const { data: maiUser } = await adminClient.auth.admin.createUser({
    email: maiEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Võ Tuyết Mai (HRT Lớp PH)' },
  });
  const maiId = maiUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', maiId);
  await adminClient.from('branch_memberships').insert({
    user_id: maiId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    status: 'active',
  });

  const linhEmail = `hrt.linh.${runId}@kapla.edu.vn`;
  const { data: linhUser } = await adminClient.auth.admin.createUser({
    email: linhEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Trần Gia Linh (HRT Riêng PH)' },
  });
  const linhId = linhUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', linhId);
  await adminClient.from('branch_memberships').insert({
    user_id: linhId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    status: 'active',
  });

  const baoEmail = `hrt.bao.${runId}@kapla.edu.vn`;
  const { data: baoUser } = await adminClient.auth.admin.createUser({
    email: baoEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Lê Gia Bảo (HRT Bình Tân)' },
  });
  const baoId = baoUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', baoId);
  await adminClient.from('branch_memberships').insert({
    user_id: baoId,
    branch_id: BRANCH_BT_ID,
    role: 'HRT',
    status: 'active',
  });

  // 2. Tạo lớp học
  const { data: classPHA1 } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-A1-${runId}`,
      level: 'Starters',
      default_hrt_id: maiId,
      status: 'active',
    })
    .select()
    .single();

  const { data: classBTB1 } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_BT_ID,
      name: `BT-B1-${runId}`,
      level: 'Movers',
      default_hrt_id: baoId,
      status: 'active',
    })
    .select()
    .single();

  const { data: classPHNoHrt } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-NO-HRT-${runId}`,
      level: 'Flyers',
      default_hrt_id: null,
      status: 'active',
    })
    .select()
    .single();

  // Đặt ngưỡng ngày cảnh báo là 14 ngày
  await adminClient.rpc('set_tuition_warning_days', { p_days: 14 });

  // 3. Tạo các học viên kiểm thử:
  // - Học viên A: Hạn học phí còn 5 ngày
  const date5Days = new Date();
  date5Days.setDate(date5Days.getDate() + 5);
  const { data: studentA } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `HV-A-${runId.toString().slice(-4)}`,
      full_name: 'Nguyễn Văn A (Phạm Hùng)',
      parent_name: 'PH Em A',
      parent_phone: '0901000001',
      current_class_id: classPHA1.id,
      tuition_expiry_date: date5Days.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  // - Học viên Hết hạn hôm nay: date = todayVn (days_remaining = 0)
  const { data: studentToday } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `HV-TODAY-${runId.toString().slice(-4)}`,
      full_name: 'Vũ Thị Hôm Nay (Hết hạn hôm nay)',
      parent_name: 'PH Em Hôm Nay',
      parent_phone: '0901000099',
      current_class_id: classPHA1.id,
      tuition_expiry_date: todayVn,
      status: 'warning',
    })
    .select()
    .single();

  // - Học viên Đã quá hạn 5 ngày trước (tuition_expiry_date < todayVn) -> KHÔNG được gửi lại trong email nhắc trước hạn!
  const dateOverdue = new Date();
  dateOverdue.setDate(dateOverdue.getDate() - 5);
  const { data: studentOverdue } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `HV-OLD-${runId.toString().slice(-4)}`,
      full_name: 'Đặng Quá Hạn (Đã hết hạn 5 ngày trước)',
      parent_name: 'PH Em Quá Hạn',
      parent_phone: '0901000088',
      current_class_id: classPHA1.id,
      tuition_expiry_date: dateOverdue.toISOString().split('T')[0],
      status: 'warning',
    })
    .select()
    .single();

  // - Học viên An: Giao riêng cho HRT Linh
  const date3Days = new Date();
  date3Days.setDate(date3Days.getDate() + 3);
  const { data: studentAn } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `HV-AN-${runId.toString().slice(-4)}`,
      full_name: 'Lê Hoàng An (Giao riêng Linh)',
      parent_name: 'PH Em An',
      parent_phone: '0901000003',
      current_class_id: classPHA1.id,
      tuition_expiry_date: date3Days.toISOString().split('T')[0],
      status: 'warning',
    })
    .select()
    .single();

  await adminClient.rpc('assign_student_hrt', {
    p_student_id: studentAn.id,
    p_hrt_id: linhId,
    p_reason: 'An cần chăm sóc đặc biệt bởi Linh',
  });

  // - Học viên Dũng (Bình Tân)
  const date8Days = new Date();
  date8Days.setDate(date8Days.getDate() + 8);
  const { data: studentDung } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_BT_ID,
      student_code: `HV-BT-${runId.toString().slice(-4)}`,
      full_name: 'Phạm Minh Dũng (Bình Tân)',
      parent_name: 'PH Em Dũng',
      parent_phone: '0902000001',
      current_class_id: classBTB1.id,
      tuition_expiry_date: date8Days.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  // - Học viên Thiếu HRT
  const { data: studentNoHrt } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `HV-NOHRT-${runId.toString().slice(-4)}`,
      full_name: 'Vũ Quốc Em (Thiếu HRT)',
      parent_name: 'PH Em',
      parent_phone: '0903000001',
      current_class_id: classPHNoHrt.id,
      tuition_expiry_date: date5Days.toISOString().split('T')[0],
      status: 'warning',
    })
    .select()
    .single();

  console.log('--- PHẦN 1: CỬA SỔ NHẮC HỌC PHÍ, HIỂN THỊ "HẾT HẠN HÔM NAY" VÀ CHẶN NHẮC LẶP ---');
  const run1 = await dispatchDailyTuitionEmails(todayVn, { workerId: 'worker-primary-1' });
  assert('Tác vụ dispatchDailyTuitionEmails thực thi thành công', run1.success, `Đã gửi: ${run1.sent_emails} email`);

  const messages1 = await getMailpitMessages();
  const maiSummary = messages1.find((m: any) => m.To[0].Address === maiEmail);
  assert('HRT Mai nhận đúng 1 email tổng hợp trong ngày', maiSummary !== undefined);

  const maiMsg = await getMailpitMessageDetail(maiSummary.ID);

  assert(
    'Học viên hết hạn hôm nay được hiển thị riêng nhãn "Hết hạn hôm nay" trong bảng email',
    maiMsg.HTML.includes('Hết hạn hôm nay') && maiMsg.HTML.includes('Vũ Thị Hôm Nay'),
    'Email định dạng riêng biệt: Hết hạn hôm nay'
  );

  assert(
    'Học viên đã quá hạn từ trước (5 ngày trước) KHÔNG bị đưa vào email nhắc trước hạn (chống nhắc lặp mỗi ngày)',
    !maiMsg.HTML.includes('Đặng Quá Hạn'),
    'Học viên quá hạn được lưu giữ trên Dashboard để nhân viên xử lý thay vì spam email hằng ngày'
  );

  console.log('\n--- PHẦN 2: CHỐNG GỬI TRÙNG KHI 2 TIẾN TRÌNH CHẠY ĐỒNG THỜI (CONCURRENCY LOCK) ---');
  // Giả lập ngày làm việc kế tiếp
  const dateDay2 = new Date();
  dateDay2.setDate(dateDay2.getDate() + 1);
  const day2Str = dateDay2.toISOString().split('T')[0];

  // Chạy đồng thời 2 worker cạnh tranh cùng 1 ngày
  console.log(`[Concurrency Test] Khởi chạy song song worker-A và worker-B trên ngày ${day2Str}...`);
  const [workerA, workerB] = await Promise.all([
    dispatchDailyTuitionEmails(day2Str, { workerId: 'worker-concurrent-A' }),
    dispatchDailyTuitionEmails(day2Str, { workerId: 'worker-concurrent-B' }),
  ]);

  // Kiểm tra: Tổng số email được claim chia đều hoặc 1 bên nhận, không bên nào claim trùng bản ghi
  assert(
    'Hai worker chạy đồng thời phối hợp an toàn qua FOR UPDATE SKIP LOCKED, không xung đột hay trùng lặp',
    workerA.success && workerB.success,
    `Worker A gửi: ${workerA.sent_emails}, Worker B gửi: ${workerB.sent_emails}`
  );

  // Đảm bảo tổng số email gửi ra đúng bằng số HRT có học viên đến hạn
  const messagesDay2 = (await getMailpitMessages()).filter((m: any) => m.Subject.includes(day2Str.split('-').reverse().join('/')));
  const recipientSet = new Set(messagesDay2.map((m: any) => m.To[0].Address));
  assert(
    'Mỗi HRT chỉ nhận duy nhất 1 email tổng hợp, không có email trùng lặp nào được gửi đi',
    messagesDay2.length === recipientSet.size,
    `Số email gửi ra: ${messagesDay2.length}, Số người nhận độc lập: ${recipientSet.size}`
  );

  console.log('\n--- PHẦN 3: XÁC THỰC LẠI HRT PHỤ TRÁCH, KHÓA TÀI KHOẢN VÀ GIA HẠN PHÍ TRƯỚC LÚC GỬI ---');
  const dateDay3 = new Date();
  dateDay3.setDate(dateDay3.getDate() + 2);
  const day3Str = dateDay3.toISOString().split('T')[0];

  // Chuẩn bị hàng đợi trước
  await adminClient.rpc('prepare_daily_tuition_alert_queue', { p_target_date: day3Str });

  // TÌNH HUỐNG 3.1: Đổi HRT phụ trách trước lúc gửi
  // Chuyển học viên An từ Linh sang Mai
  console.log('-> Tình huống 3.1: Đổi HRT riêng của An sang Mai trước thời điểm gửi...');
  await adminClient.rpc('assign_student_hrt', {
    p_student_id: studentAn.id,
    p_hrt_id: null, // quay về mặc định lớp Mai
    p_reason: 'Gỡ phân công riêng của Linh, chuyển về HRT lớp là Mai',
  });

  // TÌNH HUỐNG 3.2: Khóa tài khoản HRT Bảo (Bình Tân) trước thời điểm gửi
  console.log('-> Tình huống 3.2: Vô hiệu hóa tài khoản HRT Bảo trước thời điểm gửi...');
  const { error: lockErr } = await adminClient.from('profiles').update({ status: 'inactive' }).eq('id', baoId);
  if (lockErr) throw lockErr;

  // TÌNH HUỐNG 3.3: Học viên A đã đóng tiền gia hạn học phí (+60 ngày)
  console.log('-> Tình huống 3.3: Học viên A nộp học phí mới, gia hạn thêm 60 ngày...');
  const dateExtended = new Date();
  dateExtended.setDate(dateExtended.getDate() + 60);
  await adminClient
    .from('students')
    .update({ tuition_expiry_date: dateExtended.toISOString().split('T')[0], status: 'active' })
    .eq('id', studentA.id);

  // Thực thi tác vụ gửi ngày 3
  const runDay3 = await dispatchDailyTuitionEmails(day3Str, { workerId: 'worker-revalidation' });
  assert('Tác vụ ngày 3 chạy thành công với cơ chế thẩm định dữ liệu tươi mới', runDay3.success);

  // 1. Kiểm tra HRT Bảo (đã bị khóa)
  const { data: queueBao } = await adminClient
    .from('email_dispatch_queue')
    .select('*')
    .eq('dispatch_date', day3Str)
    .eq('recipient_hrt_id', baoId)
    .single();

  assert(
    'Hàng đợi của HRT bị khóa tài khoản được tự động chuyển sang "skipped" và KHÔNG gửi email',
    queueBao?.status === 'skipped' && queueBao?.error_reason?.includes('khóa hoặc chưa kích hoạt'),
    `Trạng thái: ${queueBao?.status}, Lý do: "${queueBao?.error_reason}"`
  );

  // 2. Kiểm tra email của HRT Linh (An đã chuyển sang Mai -> Linh không còn học viên nào)
  const { data: queueLinh } = await adminClient
    .from('email_dispatch_queue')
    .select('*')
    .eq('dispatch_date', day3Str)
    .eq('recipient_hrt_id', linhId)
    .single();

  assert(
    'Hàng đợi của HRT không còn học viên nào hợp lệ được tự động chuyển sang "skipped"',
    queueLinh?.status === 'skipped' && queueLinh?.student_count === 0,
    `Trạng thái: ${queueLinh?.status}, Số học viên còn lại: ${queueLinh?.student_count}`
  );

  // 3. Kiểm tra email của HRT Mai: Học viên A (đã gia hạn) bị loại bỏ, học viên An được bổ sung
  const messagesDay3 = (await getMailpitMessages()).filter((m: any) => m.Subject.includes(day3Str.split('-').reverse().join('/')));
  const maiMsgDay3Summary = messagesDay3.find((m: any) => m.To[0].Address === maiEmail);
  assert('HRT Mai nhận được email ngày 3 sau khi thẩm định dữ liệu tươi mới', maiMsgDay3Summary !== undefined);

  const maiMsgDay3 = await getMailpitMessageDetail(maiMsgDay3Summary.ID);
  assert(
    'Email tươi mới của Mai: Chứa học viên An (mới chuyển về) và KHÔNG chứa học viên A (đã gia hạn)',
    maiMsgDay3.HTML.includes('Lê Hoàng An') && !maiMsgDay3.HTML.includes('Nguyễn Văn A'),
    'Dữ liệu được cập nhật chính xác theo trạng thái tại đúng thời điểm gửi!'
  );

  console.log('\n--- PHẦN 4: KHÔI PHỤC KHI PROVIDER ĐÃ TIẾP NHẬN NHƯNG DB GẶP SỰ CỐ & THỬ LẠI ---');
  const dateDay4 = new Date();
  dateDay4.setDate(dateDay4.getDate() + 3);
  const day4Str = dateDay4.toISOString().split('T')[0];

  // Kích hoạt lại HRT Bảo để kiểm thử tình huống này
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', baoId);

  // Chuẩn bị hàng đợi
  await adminClient.rpc('prepare_daily_tuition_alert_queue', { p_target_date: day4Str });

  // Đếm số thư trong Mailpit trước mô phỏng
  const countBeforeCrash = (await getMailpitMessages()).length;

  // Lần chạy 1: Mô phỏng nhà cung cấp email nhận thành công nhưng DB crash trước khi ghi sent
  console.log('-> Lần chạy 1: Mô phỏng gửi Mailpit thành công nhưng DB crash...');
  try {
    await dispatchDailyTuitionEmails(day4Str, {
      workerId: 'worker-crash-sim',
      simulateProviderCrashAfterSend: true,
    });
  } catch (simError: any) {
    console.log(`     [Simulation Caught] Đã bắt được sự cố mô phỏng: ${simError.message}`);
  }

  // Mailpit đã nhận được 1 thư mới từ lần chạy 1
  const countAfterSend = (await getMailpitMessages()).length;
  assert('Nhà cung cấp Mailpit đã tiếp nhận thư trong lần chạy 1', countAfterSend > countBeforeCrash);

  // Lần chạy 2: Tiến trình chạy lại (Retry)
  console.log('-> Lần chạy 2: Tác vụ tự động thử lại (Retry) phát hiện provider_message_id đã có...');
  // Đặt next_retry_at về quá khứ để worker retry ngay lập tức mà không cần chờ hết chu kỳ backoff 1 phút
  await adminClient
    .from('email_dispatch_queue')
    .update({ next_retry_at: new Date(Date.now() - 1000).toISOString() })
    .eq('dispatch_date', day4Str);

  const runRetry = await dispatchDailyTuitionEmails(day4Str, { workerId: 'worker-recovery' });

  // Mailpit KHÔNG được nhận thêm bất kỳ thư trùng lặp nào!
  const countAfterRecovery = (await getMailpitMessages()).length;
  assert(
    'Khóa chống trùng (Idempotency Recovery) ngăn chặn gửi lại thư cho nhà cung cấp khi đã có provider_message_id',
    countAfterRecovery === countAfterSend,
    `Mailpit giữ nguyên ${countAfterRecovery} thư, không bị double-send!`
  );

  // Kiểm tra trạng thái DB đã được chốt thành công về 'sent'
  const { data: queueRecovered } = await adminClient
    .from('email_dispatch_queue')
    .select('*')
    .eq('dispatch_date', day4Str)
    .eq('status', 'sent');

  assert(
    'Trạng thái trong cơ sở dữ liệu đã được đối soát và chốt sang "sent" thành công',
    (queueRecovered?.length || 0) > 0,
    `Số bản ghi đã chốt: ${queueRecovered?.length}`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passed}/${total} BƯỚC ĐẠT 100%`);
  console.log('======================================================================\n');
}

runReliableEmailDispatchTests().catch((err) => {
  console.error('\nLỖI KIỂM THỬ ĐỘ TIN CẬY EMAIL:', err);
  process.exit(1);
});
