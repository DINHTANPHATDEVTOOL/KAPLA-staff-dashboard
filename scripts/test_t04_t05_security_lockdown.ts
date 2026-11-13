// ==============================================================================
// KAPLA — KIỂM THỬ SIẾT QUYỀN T04–T05 (SECURITY LOCKDOWN TEST)
// 1. Chỉ Admin và máy chủ được xem danh sách nhắc học phí
// 2. Chặn anon, nhân viên thường, và tài khoản bị khóa qua API (42501)
// 3. Rà soát quyền ghi phản hồi & bổ trợ theo vai trò, học viên và chi nhánh
// ==============================================================================

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

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

async function runSecurityLockdownTests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ SIẾT QUYỀN T04–T05 & BẢO MẬT API');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';

  // 1. Tạo các tài khoản kiểm thử:
  // - Admin
  const adminEmail = `admin.lockdown.${runId}@kapla.edu.vn`;
  const { data: adminUser } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Quản trị viên Hệ Thống' },
  });
  const adminId = adminUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active', system_role: 'system_admin' }).eq('id', adminId);

  // - HRT Phạm Hùng (nhân viên thường)
  const hrtEmail = `hrt.staff.${runId}@kapla.edu.vn`;
  const { data: hrtUser } = await adminClient.auth.admin.createUser({
    email: hrtEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Nhân viên HRT Phạm Hùng' },
  });
  const hrtId = hrtUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', hrtId);
  await adminClient.from('branch_memberships').insert({
    user_id: hrtId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    status: 'active',
  });

  // - Giáo viên Phạm Hùng
  const teacherEmail = `teacher.ph.${runId}@kapla.edu.vn`;
  const { data: teacherUser } = await adminClient.auth.admin.createUser({
    email: teacherEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Giáo viên Main Teacher PH' },
  });
  const teacherId = teacherUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', teacherId);
  await adminClient.from('branch_memberships').insert({
    user_id: teacherId,
    branch_id: BRANCH_PH_ID,
    role: 'Main Teacher',
    status: 'active',
  });

  // - Nhân viên Bình Tân (chi nhánh khác)
  const btStaffEmail = `staff.bt.${runId}@kapla.edu.vn`;
  const { data: btStaffUser } = await adminClient.auth.admin.createUser({
    email: btStaffEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Nhân viên HRT Bình Tân' },
  });
  const btStaffId = btStaffUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', btStaffId);
  await adminClient.from('branch_memberships').insert({
    user_id: btStaffId,
    branch_id: BRANCH_BT_ID,
    role: 'HRT',
    status: 'active',
  });

  // - Tài khoản bị khóa (suspended/inactive)
  const lockedEmail = `locked.staff.${runId}@kapla.edu.vn`;
  const { data: lockedUser } = await adminClient.auth.admin.createUser({
    email: lockedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Tài khoản Đã Khóa' },
  });
  const lockedId = lockedUser.user!.id;
  await adminClient.from('profiles').update({ status: 'suspended' }).eq('id', lockedId);
  await adminClient.from('branch_memberships').insert({
    user_id: lockedId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    status: 'suspended',
  });

  // Tạo học viên và lớp học thử nghiệm
  const { data: classPH } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-LOCK-${runId}`,
      level: 'Starters',
      default_hrt_id: hrtId,
      main_teacher_id: teacherId,
      status: 'active',
    })
    .select()
    .single();

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  const expiryStr = expiryDate.toISOString().split('T')[0];

  const { data: studentPH } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `HV-LK-${runId.toString().slice(-4)}`,
      full_name: `Học Viên Thử Nghiệm ${runId}`,
      parent_name: 'Phụ huynh Test',
      parent_phone: '0901112233',
      current_class_id: classPH.id,
      tuition_expiry_date: expiryStr,
      status: 'warning',
    })
    .select()
    .single();

  console.log('--- PHẦN 1: SIẾT QUYỀN get_students_due_for_tuition_alert ---');

  // 1.1 Khách chưa đăng nhập (Anon) gọi RPC
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: anonData, error: anonError } = await anonClient.rpc('get_students_due_for_tuition_alert', {
    p_days_threshold: 14,
  });
  assert(
    'Khách chưa đăng nhập (Anon) bị chặn gọi get_students_due_for_tuition_alert với lỗi 42501',
    anonError !== null && anonError.code === '42501',
    `Mã lỗi: ${anonError?.code}, Thông điệp: "${anonError?.message}"`
  );

  // 1.2 Nhân viên thường (HRT) gọi RPC
  const hrtClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await hrtClient.auth.signInWithPassword({ email: hrtEmail, password });
  const { data: hrtData, error: hrtError } = await hrtClient.rpc('get_students_due_for_tuition_alert', {
    p_days_threshold: 14,
  });
  assert(
    'Nhân viên thường (HRT) bị chặn gọi get_students_due_for_tuition_alert với mã lỗi 42501',
    hrtError !== null && hrtError.code === '42501',
    `Mã lỗi: ${hrtError?.code}, Thông điệp: "${hrtError?.message}"`
  );

  // 1.3 Tài khoản bị khóa (suspended) gọi RPC
  const lockedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await lockedClient.auth.signInWithPassword({ email: lockedEmail, password });
  const { data: lockedData, error: lockedError } = await lockedClient.rpc('get_students_due_for_tuition_alert', {
    p_days_threshold: 14,
  });
  assert(
    'Tài khoản bị khóa (suspended/inactive) bị chặn gọi get_students_due_for_tuition_alert với mã lỗi 42501',
    lockedError !== null && lockedError.code === '42501',
    `Mã lỗi: ${lockedError?.code}, Thông điệp: "${lockedError?.message}"`
  );

  // 1.4 Quản trị hệ thống (System Admin) gọi RPC
  const adminAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await adminAuthClient.auth.signInWithPassword({ email: adminEmail, password });
  const { data: adminData, error: adminRpcError } = await adminAuthClient.rpc('get_students_due_for_tuition_alert', {
    p_days_threshold: 14,
  });
  assert(
    'Quản trị hệ thống (System Admin) gọi get_students_due_for_tuition_alert thành công',
    adminRpcError === null && Array.isArray(adminData),
    `Số học viên trả về: ${adminData?.length || 0}`
  );

  // 1.5 Tiến trình máy chủ (service_role) gọi RPC
  const { data: serverData, error: serverRpcError } = await adminClient.rpc('get_students_due_for_tuition_alert', {
    p_days_threshold: 14,
  });
  assert(
    'Tiến trình máy chủ (Service Role) gọi get_students_due_for_tuition_alert thành công',
    serverRpcError === null && Array.isArray(serverData),
    `Số học viên trả về: ${serverData?.length || 0}`
  );

  console.log('\n--- PHẦN 2: SIẾT QUYỀN GHI PHẢN HỒI PHỤ HUYNH (parent_feedbacks) ---');

  // 2.1 Nhân viên chi nhánh khác (Bình Tân) cố ghi phản hồi cho học viên Phạm Hùng
  const btClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await btClient.auth.signInWithPassword({ email: btStaffEmail, password });

  const { error: btCrossFeedbackError } = await btClient.from('parent_feedbacks').insert({
    student_id: studentPH.id,
    branch_id: BRANCH_PH_ID,
    parent_name: 'Phụ huynh Bé An',
    parent_phone: '0901112233',
    feedback_type: 'academic_concern',
    channel: 'zalo',
    content: 'Phản hồi từ nhân viên Bình Tân gửi sang Phạm Hùng trái phép',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });
  assert(
    'Nhân viên ngoài chi nhánh bị chặn ghi phản hồi phụ huynh (RLS / Trigger 42501)',
    btCrossFeedbackError !== null && (btCrossFeedbackError.code === '42501' || btCrossFeedbackError.message.includes('Quyền bị từ chối')),
    `Mã lỗi: ${btCrossFeedbackError?.code}, Thông điệp: "${btCrossFeedbackError?.message}"`
  );

  // 2.2 Sai lệch branch_id giữa phản hồi và học viên (Payload branch_id != student.branch_id)
  const { error: mismatchBranchError } = await hrtClient.from('parent_feedbacks').insert({
    student_id: studentPH.id,
    branch_id: BRANCH_BT_ID, // Sai branch_id
    parent_name: 'Phụ huynh Bé An',
    parent_phone: '0901112233',
    feedback_type: 'complaint',
    channel: 'phone',
    content: 'Phản hồi lệch chi nhánh',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });
  assert(
    'Hệ thống chặn phản hồi có branch_id sai lệch so với branch_id của học viên (P0002 / RLS)',
    mismatchBranchError !== null,
    `Mã lỗi: ${mismatchBranchError?.code}, Thông điệp: "${mismatchBranchError?.message}"`
  );

  // 2.3 Nhân viên hợp lệ (HRT Phạm Hùng) ghi phản hồi đúng quy chuẩn
  const { data: validFeedback, error: validFeedbackError } = await hrtClient
    .from('parent_feedbacks')
    .insert({
      student_id: studentPH.id,
      branch_id: BRANCH_PH_ID,
      parent_name: 'Phụ huynh Bé An',
      parent_phone: '0901112233',
      feedback_type: 'compliment',
      channel: 'phone',
      content: 'Phụ huynh xác nhận bé rất hứng thú sau buổi học thử Robotics',
      due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    })
    .select()
    .single();
  assert(
    'HRT hợp lệ ghi phản hồi phụ huynh thành công với dữ liệu toàn vẹn',
    validFeedbackError === null && validFeedback?.id !== undefined,
    `Feedback ID: ${validFeedback?.id}, Type: ${validFeedback?.feedback_type}`
  );

  console.log('\n--- PHẦN 3: SIẾT QUYỀN TẠO LỚP HỌC BỔ TRỢ (supplementary_sessions) ---');

  // 3.1 HRT không phải giáo viên cố tình tạo lớp học bổ trợ
  const { error: hrtSuppError } = await hrtClient.from('supplementary_sessions').insert({
    branch_id: BRANCH_PH_ID,
    title: 'Buổi học bổ trợ trái phép',
    session_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    start_time: '18:00',
    end_time: '19:30',
    teacher_id: hrtId,
    topic: 'Grammar review',
    target_objective: 'Ôn tập ngữ pháp',
    notes: 'HRT cố tạo lớp học bổ trợ mà không có vai trò Teacher',
  });
  assert(
    'HRT (không có vai trò Teacher) bị chặn tạo buổi học bổ trợ (Trigger 42501)',
    hrtSuppError !== null && (hrtSuppError.code === '42501' || hrtSuppError.message.includes('Quyền bị từ chối')),
    `Mã lỗi: ${hrtSuppError?.code}, Thông điệp: "${hrtSuppError?.message}"`
  );

  // 3.2 Giáo viên hợp lệ tạo lớp học bổ trợ
  const teacherAuthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await teacherAuthClient.auth.signInWithPassword({ email: teacherEmail, password });

  const { data: validSupp, error: validSuppError } = await teacherAuthClient
    .from('supplementary_sessions')
    .insert({
      branch_id: BRANCH_PH_ID,
      title: 'Luyện kỹ năng Writing Starters',
      session_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      start_time: '18:00',
      end_time: '19:30',
      teacher_id: teacherId,
      topic: 'Sentence building',
      target_objective: 'Luyện viết câu hoàn chỉnh',
      notes: 'Lớp ôn luyện kỹ năng Writing cho học viên yếu',
    })
    .select()
    .single();
  assert(
    'Giáo viên cơ sở tạo buổi học bổ trợ thành công',
    validSuppError === null && validSupp?.id !== undefined,
    `Session ID: ${validSupp?.id}, Topic: ${validSupp?.topic}`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ: ${passed}/${total} BƯỚC ĐẠT 100%`);
  console.log('======================================================================\n');
}

runSecurityLockdownTests().catch((err) => {
  console.error('\nLỖI KIỂM THỬ:', err);
  process.exit(1);
});
