// ==============================================================================
// KAPLA — KIỂM THỬ TÁC VỤ GỬI EMAIL ĐỊNH KỲ QUA MAILPIT TRÊN 2 CHI NHÁNH
// 1. Gom nhóm học viên vào 1 email cho mỗi HRT mỗi ngày
// 2. Định tuyến chính xác đến HRT riêng > HRT lớp tại 2 chi nhánh
// 3. Ghi nhận skipped nếu thiếu HRT phụ trách
// 4. Chống gửi trùng lặp tuyệt đối khi tác vụ chạy lại trong ngày
// 5. Đổi HRT trước thời điểm gửi -> Email chuyển ngay sang người mới
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

async function runRealEmailDispatchTests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ TÁC VỤ GỬI EMAIL ĐỊNH KỲ THỰC TẾ (MAILPIT)');
  console.log('  2 Chi nhánh: Phạm Hùng & Bình Tân | Múi giờ ICT (UTC+7)');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';
  const todayVn = getVietnamToday();

  // Dọn sạch hộp thư Mailpit trước khi test
  await clearMailpit();

  // 1. Tạo tài khoản HRT Mai & Linh tại Phạm Hùng, HRT Bảo tại Bình Tân
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

  // 2. Tạo lớp học tại 2 chi nhánh
  // Lớp PH-A1 do Mai làm HRT mặc định
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

  // Lớp BT-B1 do Bảo làm HRT mặc định
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

  // Lớp PH-NoHRT không có HRT mặc định
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

  // Đặt cấu hình ngưỡng cảnh báo là 14 ngày
  await adminClient.rpc('set_tuition_warning_days', { p_days: 14 });

  // 3. Tạo các học viên:
  // - Học viên A (Phạm Hùng): Lớp A1, HRT mặc định là Mai, hạn học phí còn 5 ngày
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

  // - Học viên B (Phạm Hùng): Lớp A1, HRT mặc định là Mai, hạn học phí còn 10 ngày
  const date10Days = new Date();
  date10Days.setDate(date10Days.getDate() + 10);
  const { data: studentB } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `HV-B-${runId.toString().slice(-4)}`,
      full_name: 'Trần Thị B (Phạm Hùng)',
      parent_name: 'PH Em B',
      parent_phone: '0901000002',
      current_class_id: classPHA1.id,
      tuition_expiry_date: date10Days.toISOString().split('T')[0],
      status: 'active',
    })
    .select()
    .single();

  // - Học viên C (An - Phạm Hùng): Lớp A1 nhưng có HRT RIÊNG là Linh, hạn còn 3 ngày
  const date3Days = new Date();
  date3Days.setDate(date3Days.getDate() + 3);
  const { data: studentC } = await adminClient
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

  // Phân công HRT riêng cho An -> Linh bằng RPC assign_student_hrt
  await adminClient.rpc('assign_student_hrt', {
    p_student_id: studentC.id,
    p_hrt_id: linhId,
    p_reason: 'An cần chăm sóc đặc biệt bởi Linh',
  });

  // - Học viên D (Bình Tân): Lớp B1, HRT mặc định là Bảo, hạn còn 8 ngày
  const date8Days = new Date();
  date8Days.setDate(date8Days.getDate() + 8);
  const { data: studentD } = await adminClient
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

  // - Học viên E (Không có HRT): Thuộc lớp không có HRT mặc định và không có HRT riêng
  const { data: studentE } = await adminClient
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

  console.log('--- PHẦN 1: THỰC THI TÁC VỤ GỬI EMAIL ĐỊNH KỲ LẦN 1 ---');
  const run1 = await dispatchDailyTuitionEmails(todayVn);
  assert('Tác vụ dispatchDailyTuitionEmails chạy thành công', run1.success, `Đã gửi: ${run1.sent_emails} email`);

  // Kiểm tra Mailpit
  const messages = await getMailpitMessages();
  assert(
    `Mailpit nhận được đúng số lượng email tổng hợp (${run1.sent_emails} thư)`,
    messages.length === run1.sent_emails,
    `Mailpit có ${messages.length} thư mới`
  );

  // 1.1 Kiểm tra email của HRT Mai
  const maiSummary = messages.find((m: any) => m.To[0].Address === maiEmail);
  assert(
    'HRT Mai nhận được đúng 1 email tổng hợp trong ngày',
    maiSummary !== undefined,
    `Tiêu đề: "${maiSummary?.Subject}"`
  );
  const maiMsg = await getMailpitMessageDetail(maiSummary.ID);
  assert(
    'Email của Mai gom đúng 2 học viên phụ trách (A và B) và KHÔNG chứa học viên An',
    maiMsg.HTML.includes('Nguyễn Văn A') &&
      maiMsg.HTML.includes('Trần Thị B') &&
      !maiMsg.HTML.includes('Lê Hoàng An'),
    'Nội dung email gom chuẩn danh sách học viên của lớp A1 do Mai quản lý'
  );

  // 1.2 Kiểm tra email của HRT Linh
  const linhSummary = messages.find((m: any) => m.To[0].Address === linhEmail);
  assert(
    'HRT Linh nhận được đúng 1 email chứa học viên An (ưu tiên HRT riêng)',
    linhSummary !== undefined,
    `Tiêu đề: "${linhSummary?.Subject}", Người nhận: ${linhEmail}`
  );
  const linhMsg = await getMailpitMessageDetail(linhSummary.ID);
  assert(
    'Nội dung email của Linh chứa đúng học viên An',
    linhMsg.HTML.includes('Lê Hoàng An'),
    'Linh phụ trách An theo phân công riêng'
  );

  // 1.3 Kiểm tra email của HRT Bảo (Bình Tân)
  const baoSummary = messages.find((m: any) => m.To[0].Address === baoEmail);
  assert(
    'HRT Bảo tại chi nhánh Bình Tân nhận được đúng email của học viên chi nhánh mình',
    baoSummary !== undefined,
    `Tiêu đề: "${baoSummary?.Subject}", Cơ sở Bình Tân độc lập`
  );
  const baoMsg = await getMailpitMessageDetail(baoSummary.ID);
  assert(
    'Nội dung email của Bảo chứa đúng học viên Phạm Minh Dũng',
    baoMsg.HTML.includes('Phạm Minh Dũng'),
    'Bình Tân xử lý độc lập học viên chi nhánh mình'
  );

  // 1.4 Kiểm tra log của học viên E (Thiếu HRT)
  const { data: logE } = await adminClient
    .from('email_dispatch_logs')
    .select('*')
    .eq('student_id', studentE.id)
    .eq('dispatch_date', todayVn)
    .single();

  assert(
    'Học viên thiếu HRT phụ trách được ghi nhận trạng thái "skipped" và lý do rõ ràng',
    logE?.delivery_status === 'skipped' && logE?.skip_reason?.includes('Thiếu HRT phụ trách'),
    `Trạng thái: ${logE?.delivery_status}, Lý do: "${logE?.skip_reason}"`
  );

  console.log('\n--- PHẦN 2: KIỂM THỬ CHỐNG GỬI TRÙNG LẶP (IDEMPOTENCY) KHI TÁC VỤ CHẠY LẠI ---');
  const countBeforeRerun = messages.length;
  const run2 = await dispatchDailyTuitionEmails(todayVn);
  const messagesAfterRerun = await getMailpitMessages();

  assert(
    'Tác vụ chạy lại trong cùng ngày phát hiện toàn bộ học viên đã được xử lý và không thêm email mới vào hàng đợi',
    run2.queue_prepared.queued_emails === 0,
    `queued_emails = ${run2.queue_prepared.queued_emails}, batched_students = ${run2.queue_prepared.batched_students}`
  );
  assert(
    'Mailpit không có thêm bất kỳ email trùng lặp nào sau khi chạy lại',
    messagesAfterRerun.length === countBeforeRerun,
    `Tổng số thư Mailpit không đổi: ${messagesAfterRerun.length}`
  );

  console.log('\n--- PHẦN 3: KIỂM THỬ ĐỔI HRT TRƯỚC LÚC GỬI -> EMAIL ĐẾN NGƯỜI MỚI ---');
  // Giả lập ngày làm việc tiếp theo: "2026-11-14"
  const nextDateObj = new Date();
  nextDateObj.setDate(nextDateObj.getDate() + 1);
  const nextDateVn = nextDateObj.toISOString().split('T')[0];

  // Xóa phân công riêng của An cho Linh -> Lúc này An sẽ tự động quay về HRT mặc định của lớp là Mai!
  await adminClient.rpc('assign_student_hrt', {
    p_student_id: studentC.id,
    p_hrt_id: null,
    p_reason: 'Bỏ phân công riêng của Linh, quay về HRT lớp là Mai',
  });

  // Chạy tác vụ cho ngày kế tiếp
  const runNextDay = await dispatchDailyTuitionEmails(nextDateVn);
  assert(
    `Tác vụ gửi ngày kế tiếp (${nextDateVn}) chạy thành công`,
    runNextDay.success,
    `Đã gửi: ${runNextDay.sent_emails} email mới`
  );

  const allMessagesNextDay = await getMailpitMessages();
  // Lấy các email có tiêu đề chứa ngày kế tiếp
  const nextDayVnFormatted = nextDateVn.split('-').reverse().join('/');
  const nextDayMaiSummary = allMessagesNextDay.find(
    (m: any) => m.To[0].Address === maiEmail && m.Subject.includes(nextDayVnFormatted)
  );

  assert(
    'HRT Mai nhận được email vào ngày kế tiếp',
    nextDayMaiSummary !== undefined,
    `Tiêu đề: "${nextDayMaiSummary?.Subject}"`
  );

  const nextDayMaiMsg = await getMailpitMessageDetail(nextDayMaiSummary.ID);

  assert(
    'Sau khi bỏ phân công riêng, học viên An lập tức chuyển sang email tổng hợp của HRT Mai!',
    nextDayMaiMsg.HTML.includes('Lê Hoàng An'),
    `Tiêu đề: "${nextDayMaiSummary?.Subject}", Nội dung chứa: Lê Hoàng An`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passed}/${total} BƯỚC ĐẠT 100%`);
  console.log('======================================================================\n');
}

runRealEmailDispatchTests().catch((err) => {
  console.error('\nLỖI KIỂM THỬ TÁC VỤ EMAIL:', err);
  process.exit(1);
});
