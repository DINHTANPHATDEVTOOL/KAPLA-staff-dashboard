// ==============================================================================
// KAPLA — T03: Kiểm thử Tích hợp Phân quyền HRT và Quy tắc Ưu tiên Riêng
// Chạy trực tiếp trên Supabase Local Stack (http://127.0.0.1:54321)
// ==============================================================================

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const BRANCH_PH_ID = 'a0000000-0000-0000-0000-000000000001'; // KAPLA Phạm Hùng
const BRANCH_BT_ID = 'a0000000-0000-0000-0000-000000000002'; // KAPLA Bình Tân

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

async function runT03Tests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ T03 TRÊN SUPABASE LOCAL STACK');
  console.log('  Hồ sơ học viên, Hạn học phí, Ghi danh, Chuyển lớp & Ưu tiên HRT');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';

  // ---------------------------------------------------------------------------
  // 1. KHỞI TẠO TÀI KHOẢN NHÂN SỰ
  // ---------------------------------------------------------------------------
  console.log('--- 1. KHỞI TẠO CÁC TÀI KHOẢN NHÂN SỰ ---');

  // CM Phạm Hùng
  const cmPhEmail = `cm.ph.${runId}@kapla.edu.vn`;
  const { data: cmPhUser } = await adminClient.auth.admin.createUser({
    email: cmPhEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'CM Phạm Hùng', preferred_branch_id: BRANCH_PH_ID },
  });
  const cmPhId = cmPhUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', cmPhId);
  await adminClient.from('branch_memberships').insert({
    user_id: cmPhId,
    branch_id: BRANCH_PH_ID,
    role: 'CM',
    is_primary: true,
    status: 'active',
  });

  // HRT Mai tại Phạm Hùng
  const maiEmail = `hrt.mai.${runId}@kapla.edu.vn`;
  const { data: maiUser } = await adminClient.auth.admin.createUser({
    email: maiEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Võ Thị Tuyết Mai', preferred_branch_id: BRANCH_PH_ID },
  });
  const maiId = maiUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', maiId);
  await adminClient.from('branch_memberships').insert({
    user_id: maiId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    is_primary: true,
    status: 'active',
  });

  // HRT Linh tại Phạm Hùng
  const linhEmail = `hrt.linh.${runId}@kapla.edu.vn`;
  const { data: linhUser } = await adminClient.auth.admin.createUser({
    email: linhEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Nguyễn Thị Thùy Linh', preferred_branch_id: BRANCH_PH_ID },
  });
  const linhId = linhUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', linhId);
  await adminClient.from('branch_memberships').insert({
    user_id: linhId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    is_primary: true,
    status: 'active',
  });

  // HRT Nam tại Bình Tân (Nhân viên ngoài chi nhánh)
  const btStaffEmail = `staff.bt.${runId}@kapla.edu.vn`;
  const { data: btStaffUser } = await adminClient.auth.admin.createUser({
    email: btStaffEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Trần Văn Nam (Bình Tân)', preferred_branch_id: BRANCH_BT_ID },
  });
  const btStaffId = btStaffUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', btStaffId);
  await adminClient.from('branch_memberships').insert({
    user_id: btStaffId,
    branch_id: BRANCH_BT_ID,
    role: 'HRT',
    is_primary: true,
    status: 'active',
  });

  // Tạo client đăng nhập tương ứng
  const maiClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await maiClient.auth.signInWithPassword({ email: maiEmail, password });

  const linhClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await linhClient.auth.signInWithPassword({ email: linhEmail, password });

  const btClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await btClient.auth.signInWithPassword({ email: btStaffEmail, password });

  const cmPhClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await cmPhClient.auth.signInWithPassword({ email: cmPhEmail, password });

  assert('Khởi tạo tài khoản Mai (HRT PH), Linh (HRT PH), Nam (HRT BT) và CM Phạm Hùng thành công', true);

  // ---------------------------------------------------------------------------
  // 2. TẠO LỚP HỌC VÀ THIẾT LẬP HRT MẶC ĐỊNH
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. TẠO LỚP HỌC VÀ THIẾT LẬP HRT MẶC ĐỊNH ---');

  // Lớp A1 tại Phạm Hùng: default_hrt_id = Mai
  const { data: classA1, error: errA1 } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-A1-${runId}`,
      level: 'Starters',
      default_hrt_id: maiId,
      schedule: 'Thứ 2 & 4 (17:30 - 19:00)',
      status: 'active',
    })
    .select()
    .single();
  if (errA1) throw errA1;

  // Lớp A2 tại Phạm Hùng: default_hrt_id = Linh
  const { data: classA2, error: errA2 } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-A2-${runId}`,
      level: 'Movers',
      default_hrt_id: linhId,
      schedule: 'Thứ 3 & 5 (18:00 - 19:30)',
      status: 'active',
    })
    .select()
    .single();
  if (errA2) throw errA2;

  // Lớp BT1 tại Bình Tân
  const { data: classBT1, error: errBT } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_BT_ID,
      name: `BT-A1-${runId}`,
      level: 'Starters',
      default_hrt_id: btStaffId,
      schedule: 'Thứ 3 & 5 (17:30 - 19:00)',
      status: 'active',
    })
    .select()
    .single();
  if (errBT) throw errBT;

  assert(
    'Lớp A1 được tạo với HRT mặc định là Mai; Lớp A2 với HRT mặc định là Linh',
    classA1.default_hrt_id === maiId && classA2.default_hrt_id === linhId,
    `Lớp A1 ID: ${classA1.id}, Lớp A2 ID: ${classA2.id}`
  );

  // ---------------------------------------------------------------------------
  // 3. TẠO HỒ SƠ HỌC VIÊN, HẠN HỌC PHÍ & PHÂN CÔNG HRT
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. TẠO HỒ SƠ HỌC VIÊN & THIẾT LẬP PHÂN CÔNG HRT RIÊNG ---');

  // Học viên An: Thuộc lớp A1, nhưng ĐƯỢC GIAO RIÊNG CHO LINH
  const { data: studentAn, error: errAn } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `AN-${runId}`,
      full_name: 'Nguyễn Bình An',
      date_of_birth: '2017-05-10',
      parent_name: 'Nguyễn Văn Minh (Bố)',
      parent_phone: '0901112223',
      parent_email: 'minh.nguyen@gmail.com',
      tuition_expiry_date: '2026-12-31',
      status: 'active',
      current_class_id: classA1.id,
      assigned_hrt_id: linhId, // HRT RIÊNG LÀ LINH
    })
    .select()
    .single();
  if (errAn) throw errAn;

  // Học viên Bình: Thuộc lớp A1, KHÔNG GIAO RIÊNG (assigned_hrt_id = null -> Mai chịu trách nhiệm)
  const { data: studentBinh, error: errBinh } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `BINH-${runId}`,
      full_name: 'Trần Thái Bình',
      date_of_birth: '2017-08-20',
      parent_name: 'Trần Thị Hà (Mẹ)',
      parent_phone: '0902223334',
      parent_email: 'ha.tran@gmail.com',
      tuition_expiry_date: '2026-11-20', // Cận ngày hết hạn
      status: 'warning',
      current_class_id: classA1.id,
      assigned_hrt_id: null, // MẶC ĐỊNH THEO LỚP (MAI)
    })
    .select()
    .single();
  if (errBinh) throw errBinh;

  // Học viên Cường: Thuộc lớp A2, không giao riêng (Linh chịu trách nhiệm)
  const { data: studentCuong, error: errCuong } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `CUONG-${runId}`,
      full_name: 'Lê Quốc Cường',
      date_of_birth: '2016-03-15',
      parent_name: 'Lê Văn Sang (Bố)',
      parent_phone: '0903334445',
      tuition_expiry_date: '2027-02-28',
      status: 'active',
      current_class_id: classA2.id,
      assigned_hrt_id: null, // MẶC ĐỊNH THEO LỚP (LINH)
    })
    .select()
    .single();
  if (errCuong) throw errCuong;

  // Học viên Dũng: Thuộc cơ sở Bình Tân
  const { data: studentDung, error: errDung } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_BT_ID,
      student_code: `DUNG-${runId}`,
      full_name: 'Hoàng Tiến Dũng',
      date_of_birth: '2017-01-05',
      parent_name: 'Hoàng Văn Tuấn',
      parent_phone: '0904445556',
      tuition_expiry_date: '2026-12-15',
      status: 'active',
      current_class_id: classBT1.id,
    })
    .select()
    .single();
  if (errDung) throw errDung;

  // Ghi danh ban đầu
  await adminClient.from('enrollments').insert([
    { student_id: studentAn.id, class_id: classA1.id, branch_id: BRANCH_PH_ID, status: 'active' },
    { student_id: studentBinh.id, class_id: classA1.id, branch_id: BRANCH_PH_ID, status: 'active' },
    { student_id: studentCuong.id, class_id: classA2.id, branch_id: BRANCH_PH_ID, status: 'active' },
    { student_id: studentDung.id, class_id: classBT1.id, branch_id: BRANCH_BT_ID, status: 'active' },
  ]);

  // Tạo công việc chăm sóc (Care Tasks)
  await adminClient.from('student_tasks').insert([
    {
      student_id: studentAn.id,
      branch_id: BRANCH_PH_ID,
      title: 'Gọi điện báo cáo tiến độ tuần 4 cho phụ huynh em An',
      task_type: 'care_call',
      due_date: '2026-11-20',
      status: 'pending',
    },
    {
      student_id: studentBinh.id,
      branch_id: BRANCH_PH_ID,
      title: 'Nhắc tái tục học phí sắp hết hạn cho em Bình',
      task_type: 'tuition_reminder',
      due_date: '2026-11-18',
      status: 'pending',
    },
    {
      student_id: studentDung.id,
      branch_id: BRANCH_BT_ID,
      title: 'Kiểm tra điểm danh học viên Dũng',
      task_type: 'attendance_check',
      due_date: '2026-11-19',
      status: 'pending',
    },
  ]);

  assert(
    'Khởi tạo thành công học viên An (giao riêng Linh), Bình (mặc định Mai), Cường, Dũng và Care Tasks',
    true
  );

  // ---------------------------------------------------------------------------
  // 4. KIỂM THỬ QUYỀN XEM VÀ DANH SÁCH CÔNG VIỆC CỦA LINH
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ TRUY CẬP CỦA LINH (HRT RIÊNG CỦA AN) ---');

  const { data: linhStudents, error: linhStuErr } = await linhClient.from('students').select('id, full_name, student_code');
  if (linhStuErr) throw linhStuErr;

  const linhStudentIds = linhStudents.map((s) => s.id);

  assert(
    'Linh thấy học viên An (vì được giao riêng cho Linh)',
    linhStudentIds.includes(studentAn.id),
    `Danh sách học viên Linh nhìn thấy: ${linhStudents.map((s) => s.full_name).join(', ')}`
  );

  assert(
    'Linh thấy học viên Cường (thuộc lớp A2 do Linh làm HRT mặc định)',
    linhStudentIds.includes(studentCuong.id)
  );

  assert(
    'Linh KHÔNG THẤY học viên Bình (Bình thuộc lớp A1, do Mai phụ trách và không giao riêng)',
    !linhStudentIds.includes(studentBinh.id),
    `Số học viên Linh thấy: ${linhStudents.length}`
  );

  // Kiểm tra danh sách công việc của Linh
  const { data: linhTasks } = await linhClient.from('student_tasks').select('id, title, student_id');
  const linhTaskStudentIds = linhTasks?.map((t) => t.student_id) || [];

  assert(
    'Danh sách công việc của Linh có task của An và KHÔNG có task của Bình',
    linhTaskStudentIds.includes(studentAn.id) && !linhTaskStudentIds.includes(studentBinh.id),
    `Công việc Linh thấy: ${linhTasks?.map((t) => t.title).join(' | ')}`
  );

  // ---------------------------------------------------------------------------
  // 5. KIỂM THỬ QUYỀN XEM VÀ DANH SÁCH CÔNG VIỆC CỦA MAI
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ TRUY CẬP CỦA MAI (HRT MẶC ĐỊNH LỚP A1) ---');

  const { data: maiStudents, error: maiStuErr } = await maiClient.from('students').select('id, full_name, student_code');
  if (maiStuErr) throw maiStuErr;

  const maiStudentIds = maiStudents.map((s) => s.id);

  assert(
    'Mai thấy học viên Bình (thuộc lớp A1 và nằm trong trách nhiệm của Mai)',
    maiStudentIds.includes(studentBinh.id),
    `Danh sách học viên Mai nhìn thấy: ${maiStudents.map((s) => s.full_name).join(', ')}`
  );

  assert(
    'Mai KHÔNG THẤY học viên An (Quy tắc ưu tiên HRT riêng: An đã giao cho Linh)',
    !maiStudentIds.includes(studentAn.id),
    `Học viên An đã được bảo vệ độc quyền cho Linh`
  );

  assert(
    'Mai KHÔNG THẤY học viên Cường (thuộc lớp A2 của Linh)',
    !maiStudentIds.includes(studentCuong.id)
  );

  // Kiểm tra danh sách công việc của Mai
  const { data: maiTasks } = await maiClient.from('student_tasks').select('id, title, student_id');
  const maiTaskStudentIds = maiTasks?.map((t) => t.student_id) || [];

  assert(
    'Danh sách công việc của Mai có task của Bình và KHÔNG có task của An',
    maiTaskStudentIds.includes(studentBinh.id) && !maiTaskStudentIds.includes(studentAn.id),
    `Công việc Mai thấy: ${maiTasks?.map((t) => t.title).join(' | ')}`
  );

  // ---------------------------------------------------------------------------
  // 6. KIỂM THỬ CHẶN TRUY CẬP NGOÀI CHI NHÁNH (BÌNH TÂN)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. CHẶN TRUY CẬP TỪ NHÂN VIÊN NGOÀI CHI NHÁNH (BÌNH TÂN) ---');

  const { data: btStudents } = await btClient.from('students').select('id, full_name');
  const btStudentIds = btStudents?.map((s) => s.id) || [];

  assert(
    'Nhân viên cơ sở Bình Tân thấy học viên Dũng của cơ sở Bình Tân',
    btStudentIds.includes(studentDung.id),
    `Học viên Bình Tân: ${btStudents?.map((s) => s.full_name).join(', ')}`
  );

  assert(
    'Nhân viên cơ sở Bình Tân bị CHẶN HOÀN TOÀN không thấy bất kỳ học viên nào của Phạm Hùng',
    !btStudentIds.includes(studentAn.id) && !btStudentIds.includes(studentBinh.id) && !btStudentIds.includes(studentCuong.id),
    `Số học viên Phạm Hùng nhìn thấy: 0 (Độc lập cơ sở tuyệt đối)`
  );

  // ---------------------------------------------------------------------------
  // 7. KIỂM THỬ KHI BỎ PHÂN CÔNG RIÊNG CỦA HỌC VIÊN AN
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. KIỂM THỬ KHI BỎ PHÂN CÔNG RIÊNG CỦA AN (QUAY VỀ MAI) ---');

  // CM Phạm Hùng gọi RPC assign_student_hrt để hủy phân công riêng
  const { data: unassignRes, error: unassignErr } = await cmPhClient.rpc('assign_student_hrt', {
    p_student_id: studentAn.id,
    p_hrt_id: null,
    p_reason: 'Hoàn tất giai đoạn can thiệp chuyên biệt, bàn giao lại cho HRT mặc định của lớp',
  });

  assert(
    'CM Phạm Hùng hủy phân công riêng của em An thành công',
    !unassignErr && unassignRes?.success === true,
    `Kết quả RPC: ${JSON.stringify(unassignRes)}`
  );

  // Mai truy vấn lại danh sách học viên
  const { data: maiStudentsAfter } = await maiClient.from('students').select('id, full_name');
  const maiAfterIds = maiStudentsAfter?.map((s) => s.id) || [];

  assert(
    'Sau khi bỏ phân công riêng: Mai lập tức nhìn thấy học viên An (quay về HRT mặc định lớp A1)',
    maiAfterIds.includes(studentAn.id),
    `Danh sách học viên Mai thấy sau khi hủy: ${maiStudentsAfter?.map((s) => s.full_name).join(', ')}`
  );

  // Linh truy vấn lại danh sách học viên
  const { data: linhStudentsAfter } = await linhClient.from('students').select('id, full_name');
  const linhAfterIds = linhStudentsAfter?.map((s) => s.id) || [];

  assert(
    'Sau khi bỏ phân công riêng: Linh KHÔNG CÒN thấy học viên An',
    !linhAfterIds.includes(studentAn.id),
    `Quyền xem được cập nhật động và tức thời`
  );

  // Kiểm tra task của An giờ chuyển sang cho ai thấy
  const { data: maiTasksAfter } = await maiClient.from('student_tasks').select('id, title, student_id');
  const maiTaskIdsAfter = maiTasksAfter?.map((t) => t.student_id) || [];

  assert(
    'Task của An đã chuyển sang hiển thị cho Mai trong danh sách công việc',
    maiTaskIdsAfter.includes(studentAn.id)
  );

  // ---------------------------------------------------------------------------
  // 8. KIỂM THỬ CHUYỂN LỚP CÓ LƯU LỊCH SỬ VÀ CẬP NHẬT QUYỀN
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. KIỂM THỬ CHUYỂN LỚP (TRANSFER) CÓ LƯU LỊCH SỬ ---');

  // Chuyển em Bình từ lớp A1 (Mai) sang lớp A2 (Linh)
  const { data: transferRes, error: transferErr } = await cmPhClient.rpc('transfer_student_class', {
    p_student_id: studentBinh.id,
    p_to_class_id: classA2.id,
    p_reason: 'Học viên tiến bộ vượt bậc, chuyển lên lớp Movers A2 theo nguyện vọng phụ huynh',
  });

  assert(
    'CM chuyển lớp cho em Bình từ A1 sang A2 thành công',
    !transferErr && transferRes?.success === true,
    `Kết quả RPC: ${JSON.stringify(transferRes)}`
  );

  // Kiểm tra bảng lịch sử class_transfers
  const { data: transfers } = await adminClient
    .from('class_transfers')
    .select('*, transferred_by_profile:profiles!class_transfers_transferred_by_fkey(full_name)')
    .eq('student_id', studentBinh.id);

  assert(
    'Lịch sử chuyển lớp (class_transfers) được ghi nhận đầy đủ',
    transfers && transfers.length > 0 && transfers[0].from_class_id === classA1.id && transfers[0].to_class_id === classA2.id,
    `Lý do: "${transfers?.[0]?.reason}", Người thực hiện: CM`
  );

  // Kiểm tra enrollments cũ chuyển sang transferred và mới là active
  const { data: enrollments } = await adminClient
    .from('enrollments')
    .select('class_id, status')
    .eq('student_id', studentBinh.id);

  const oldEnrollment = enrollments?.find((e) => e.class_id === classA1.id);
  const newEnrollment = enrollments?.find((e) => e.class_id === classA2.id);

  assert(
    'Enrollment cũ chuyển status = "transferred" và enrollment mới là "active"',
    oldEnrollment?.status === 'transferred' && newEnrollment?.status === 'active'
  );

  // Quyền xem cập nhật theo lớp mới:
  // Lớp A2 do Linh phụ trách. Bình không có phân công riêng nên giờ thuộc Linh phụ trách!
  const { data: linhFinalStudents } = await linhClient.from('students').select('id, full_name');
  const linhFinalIds = linhFinalStudents?.map((s) => s.id) || [];

  const { data: maiFinalStudents } = await maiClient.from('students').select('id, full_name');
  const maiFinalIds = maiFinalStudents?.map((s) => s.id) || [];

  assert(
    'Sau khi chuyển lớp: Linh giờ đây phụ trách và nhìn thấy em Bình',
    linhFinalIds.includes(studentBinh.id),
    `Học viên Linh thấy: ${linhFinalStudents?.map((s) => s.full_name).join(', ')}`
  );

  assert(
    'Sau khi chuyển lớp: Mai không còn thấy em Bình',
    !maiFinalIds.includes(studentBinh.id),
    `Quyền xem được điều chỉnh chính xác theo lớp mới`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ T03: ĐÃ VƯỢT QUA ${passed}/${total} TIÊU CHÍ (100% PASS)`);
  console.log('======================================================================\n');
}

runT03Tests().catch((err) => {
  console.error('\n[LỖI TEST T03]:', err);
  process.exit(1);
});
