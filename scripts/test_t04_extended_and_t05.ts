// ==============================================================================
// KAPLA — KIỂM THỬ T04 MỞ RỘNG (FEEDBACK, BỔ TRỢ, TÁI TỤC) & CẤU HÌNH T05
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

async function runExtendedTests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ T04 MỞ RỘNG & T05 CẤU HÌNH NGƯỠNG HỌC PHÍ');
  console.log('  Phản hồi phụ huynh → Học bổ trợ → Tái tục & Email HRT phụ trách');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';

  // 1. Khởi tạo Admin, HRT Mai, HRT Linh
  const adminEmail = `admin.${runId}@kapla.edu.vn`;
  const { data: adminUser } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Quản trị viên Hệ Thống' },
  });
  const adminId = adminUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active', system_role: 'system_admin' }).eq('id', adminId);

  const maiEmail = `mai.${runId}@kapla.edu.vn`;
  const { data: maiUser } = await adminClient.auth.admin.createUser({
    email: maiEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Võ Tuyết Mai (HRT Lớp)', preferred_branch_id: BRANCH_PH_ID },
  });
  const maiId = maiUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', maiId);
  await adminClient.from('branch_memberships').insert({
    user_id: maiId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    status: 'active',
  });

  const linhEmail = `linh.${runId}@kapla.edu.vn`;
  const { data: linhUser } = await adminClient.auth.admin.createUser({
    email: linhEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Trần Gia Linh (HRT Riêng)', preferred_branch_id: BRANCH_PH_ID },
  });
  const linhId = linhUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', linhId);
  await adminClient.from('branch_memberships').insert({
    user_id: linhId,
    branch_id: BRANCH_PH_ID,
    role: 'HRT',
    status: 'active',
  });

  // Tạo lớp học A1 do Mai là HRT mặc định
  const { data: classA1 } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-A1-T05-${runId}`,
      level: 'Starters',
      default_hrt_id: maiId,
      status: 'active',
    })
    .select()
    .single();

  // Học viên An: Học Lớp A1, nhưng được phân công HRT riêng là Linh!
  // Hạn học phí: 10 ngày nữa (nằm trong ngưỡng cảnh báo)
  const expiryAn = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
  const { data: studentAn } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `AN-T05-${runId}`,
      full_name: 'Nguyễn Bình An (HRT riêng Linh)',
      current_class_id: classA1.id,
      assigned_hrt_id: linhId, // HRT riêng!
      tuition_expiry_date: expiryAn,
      status: 'active',
      parent_name: 'Nguyễn Hoàng Nam',
      parent_phone: '0908123456',
    })
    .select()
    .single();

  // Học viên Bình: Học Lớp A1, không có HRT riêng (dùng HRT lớp là Mai)
  // Hạn học phí: 18 ngày nữa (chỉ cảnh báo nếu ngưỡng >= 18 ngày)
  const expiryBinh = new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0];
  const { data: studentBinh } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `BINH-T05-${runId}`,
      full_name: 'Trần Thái Bình (HRT mặc định Mai)',
      current_class_id: classA1.id,
      assigned_hrt_id: null, // Không có HRT riêng!
      tuition_expiry_date: expiryBinh,
      status: 'active',
      parent_name: 'Trần Quốc Tuấn',
      parent_phone: '0918234567',
    })
    .select()
    .single();

  assert('Khởi tạo nhân sự (Admin, Mai, Linh) và học viên (An, Bình) thành công', !!studentAn && !!studentBinh);

  // Client có auth session
  const adminSessionClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await adminSessionClient.auth.signInWithPassword({ email: adminEmail, password });

  const maiSessionClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await maiSessionClient.auth.signInWithPassword({ email: maiEmail, password });

  // ---------------------------------------------------------------------------
  // 1. KIỂM THỬ PHÂN HỆ PHẢN HỒI PHỤ HUYNH (PARENT FEEDBACK)
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. KIỂM THỬ TIẾP NHẬN & XỬ LÝ PHẢN HỒI PHỤ HUYNH ---');

  const { data: feedback, error: fbCreateErr } = await maiSessionClient
    .from('parent_feedbacks')
    .insert({
      student_id: studentAn.id,
      branch_id: BRANCH_PH_ID,
      parent_name: 'Nguyễn Hoàng Nam',
      parent_phone: '0908123456',
      feedback_type: 'academic_concern',
      channel: 'phone',
      content: 'Phụ huynh hỏi về lộ trình ôn thi chứng chỉ Cambridge Starters và muốn giáo viên kèm thêm kỹ năng Viết.',
      assigned_staff_id: linhId,
      due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      status: 'open',
    })
    .select()
    .single();

  assert('Tiếp nhận phản hồi phụ huynh thành công (trạng thái: open)', !fbCreateErr && feedback?.status === 'open');

  // Cập nhật phản hồi sang resolved kèm ghi chú giải quyết
  const { error: fbResolveErr } = await maiSessionClient
    .from('parent_feedbacks')
    .update({
      status: 'resolved',
      resolution_notes: 'HRT Linh đã gọi điện giải thích lộ trình và xếp lịch học bổ trợ ngữ pháp vào thứ Tư.',
    })
    .eq('id', feedback.id);

  assert('Cập nhật tiến trình giải quyết phản hồi thành công (trạng thái: resolved)', !fbResolveErr);

  // ---------------------------------------------------------------------------
  // 2. KIỂM THỬ PHÂN HỆ LỚP HỌC BỔ TRỢ (SUPPLEMENTARY SESSIONS)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ LỚP HỌC BỔ TRỢ (LẬP LỊCH, ĐIỂM DANH, ĐÁNH GIÁ) ---');

  const { data: session, error: sessErr } = await maiSessionClient
    .from('supplementary_sessions')
    .insert({
      branch_id: BRANCH_PH_ID,
      class_id: classA1.id,
      title: 'Bổ trợ kỹ năng Viết & Ngữ pháp câu đơn (Starters)',
      session_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      start_time: '17:30',
      end_time: '18:30',
      teacher_id: maiId,
      room: 'Phòng Oxford 201',
      topic: 'Quy tắc chia thì Hiện tại đơn và viết mô tả tranh 5 câu',
      target_objective: 'Đạt tối thiểu 80% câu đúng trong bài kiểm tra mini',
      status: 'scheduled',
    })
    .select()
    .single();

  assert('Lập lịch buổi học bổ trợ thành công (trạng thái: scheduled)', !sessErr && !!session);

  // Điểm danh và ghi nhận kết quả đánh giá cho học viên An
  const { data: attendee, error: attErr } = await maiSessionClient
    .from('supplementary_attendees')
    .insert({
      session_id: session.id,
      student_id: studentAn.id,
      attendance_status: 'present',
      assessment_score: 3.5,
      teacher_feedback: 'Học sinh chú ý lắng nghe, viết đúng 4/5 câu mẫu.',
    })
    .select()
    .single();

  assert('Ghi nhận điểm danh và đánh giá học viên bổ trợ thành công (3.5/5 khiên)', !attErr && attendee?.assessment_score === 3.5);

  // ---------------------------------------------------------------------------
  // 3. KIỂM THỬ CẤU HÌNH NGƯỠNG HỌC PHÍ T05 (SYSTEM ADMIN CONFIGURABLE)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ CẤU HÌNH NGƯỠNG CẢNH BÁO HỌC PHÍ T05 ---');

  // Đọc ngưỡng mặc định (14 ngày)
  await adminClient
    .from('system_settings')
    .update({ value: { days: 14, auto_email_enabled: true } })
    .eq('key', 'tuition_warning_threshold');

  const { data: defaultThresholdData } = await adminSessionClient.rpc('get_tuition_warning_days');
  assert('Đọc ngưỡng cảnh báo học phí mặc định thành công (14 ngày)', defaultThresholdData === 14, `Ngưỡng: ${defaultThresholdData} ngày`);

  // Nhân viên thường (Mai) cố tình thay đổi cấu hình hệ thống -> BỊ CHẶN 42501
  const { error: nonAdminConfigErr } = await maiSessionClient.rpc('update_system_setting', {
    p_key: 'tuition_warning_threshold',
    p_value: { days: 30, auto_email_enabled: true },
  });

  assert(
    'Chặn nhân viên thường (không phải Admin) thay đổi cấu hình hệ thống (42501)',
    !!nonAdminConfigErr && nonAdminConfigErr.code === '42501',
    `Lỗi: ${nonAdminConfigErr?.message}`
  );

  // Quản trị hệ thống (Admin) cập nhật ngưỡng từ 14 ngày lên 21 ngày
  const { data: adminUpdateRes, error: adminUpdateErr } = await adminSessionClient.rpc('update_system_setting', {
    p_key: 'tuition_warning_threshold',
    p_value: { days: 21, auto_email_enabled: true },
  });

  assert('Quản trị hệ thống cập nhật ngưỡng cảnh báo học phí thành công (21 ngày)', !adminUpdateErr && adminUpdateRes.success);

  // Xác nhận lại ngưỡng mới qua hàm get_tuition_warning_days
  const { data: newThreshold } = await adminSessionClient.rpc('get_tuition_warning_days');
  assert('Hệ thống áp dụng ngay ngưỡng mới 21 ngày cho toàn hệ thống', newThreshold === 21, `Ngưỡng mới: ${newThreshold} ngày`);

  // ---------------------------------------------------------------------------
  // 4. KIỂM THỬ TÁC VỤ EMAIL NHẮC HRT THỰC SỰ PHỤ TRÁCH TẠI THỜI ĐIỂM GỬI
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ TÁC VỤ EMAIL CHỈ GỬI ĐẾN ĐÚNG HRT PHỤ TRÁCH ---');

  // Gọi get_students_due_for_tuition_alert với ngưỡng 21 ngày:
  // Cả An (còn 10 ngày) và Bình (còn 18 ngày) đều nằm trong ngưỡng!
  const { data: alertStudents, error: alertErr } = await adminSessionClient.rpc('get_students_due_for_tuition_alert', {
    p_days_threshold: 21,
  });

  assert('Lấy danh sách học viên đến hạn cảnh báo theo ngưỡng 21 ngày thành công', !alertErr && Array.isArray(alertStudents));

  const anAlert = alertStudents?.find((s: any) => s.student_id === studentAn.id);
  const binhAlert = alertStudents?.find((s: any) => s.student_id === studentBinh.id);

  assert('Học viên An (10 ngày) và Bình (18 ngày) đều được phát hiện trong phạm vi cảnh báo', !!anAlert && !!binhAlert);

  // KIỂM TRA QUY TẮC CỐT LÕI:
  // Học viên An có HRT riêng là Linh -> Email cảnh báo PHẢI GỬI ĐẾN LINH (không gửi cho Mai)!
  assert(
    'Quy tắc HRT riêng: Email nhắc học phí của học viên An được gửi chính xác đến HRT riêng Linh',
    anAlert?.effective_hrt_id === linhId && anAlert?.effective_hrt_email === linhEmail,
    `Email nhận: ${anAlert?.effective_hrt_email} (Đúng là Linh: ${linhEmail})`
  );

  // Học viên Bình không có HRT riêng -> Email cảnh báo PHẢI GỬI ĐẾN HRT LỚP LÀ MAI (không gửi cho Linh)!
  assert(
    'Quy tắc HRT lớp: Email nhắc học phí của học viên Bình được gửi chính xác đến HRT lớp Mai',
    binhAlert?.effective_hrt_id === maiId && binhAlert?.effective_hrt_email === maiEmail,
    `Email nhận: ${binhAlert?.effective_hrt_email} (Đúng là Mai: ${maiEmail})`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ T04 MỞ RỘNG & T05: ĐÃ VƯỢT QUA ${passed}/${total} TIÊU CHÍ (100% PASS)`);
  console.log('======================================================================\n');
}

runExtendedTests().catch((err) => {
  console.error('Kiểm thử gặp lỗi:', err);
  process.exit(1);
});
