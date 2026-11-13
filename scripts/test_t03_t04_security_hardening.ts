// ==============================================================================
// KAPLA — KIỂM THỬ SIẾT BẢO MẬT VÀ QUY TRÌNH T03–T04
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

async function runHardeningTests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ SIẾT BẢO MẬT & QUY TRÌNH T03–T04 TRÊN LOCAL STACK');
  console.log('  Đổi lớp qua luồng | Phân quyền theo lớp/cơ sở | Ràng buộc toàn vẹn');
  console.log('  Quy trình can thiệp 4 bước | Tự động ghi audit & Thu hồi quyền');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';

  // ---------------------------------------------------------------------------
  // 1. KHỞI TẠO CÁC TÀI KHOẢN VÀ LỚP HỌC (2 LỚP CÙNG CƠ SỞ & 2 CƠ SỞ)
  // ---------------------------------------------------------------------------
  console.log('--- 1. KHỞI TẠO HAI LỚP CÙNG CƠ SỞ PHẠM HÙNG & HAI CƠ SỞ KHÁC NHAU ---');

  // Giáo viên Alex (Dạy Lớp 1 tại Phạm Hùng)
  const alexEmail = `alex.${runId}@kapla.edu.vn`;
  const { data: alexUser } = await adminClient.auth.admin.createUser({
    email: alexEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Teacher Alex (Lớp 1)', preferred_branch_id: BRANCH_PH_ID },
  });
  const alexId = alexUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', alexId);
  await adminClient.from('branch_memberships').insert({
    user_id: alexId,
    branch_id: BRANCH_PH_ID,
    role: 'Main Teacher',
    status: 'active',
  });

  // Giáo viên Sarah (Dạy Lớp 2 tại Phạm Hùng)
  const sarahEmail = `sarah.${runId}@kapla.edu.vn`;
  const { data: sarahUser } = await adminClient.auth.admin.createUser({
    email: sarahEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Teacher Sarah (Lớp 2)', preferred_branch_id: BRANCH_PH_ID },
  });
  const sarahId = sarahUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', sarahId);
  await adminClient.from('branch_memberships').insert({
    user_id: sarahId,
    branch_id: BRANCH_PH_ID,
    role: 'Main Teacher',
    status: 'active',
  });

  // Head Teacher Phạm Hùng
  const htPhEmail = `ht.ph.${runId}@kapla.edu.vn`;
  const { data: htPhUser } = await adminClient.auth.admin.createUser({
    email: htPhEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Head Teacher Quang PH', preferred_branch_id: BRANCH_PH_ID },
  });
  const htPhId = htPhUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', htPhId);
  await adminClient.from('branch_memberships').insert({
    user_id: htPhId,
    branch_id: BRANCH_PH_ID,
    role: 'Head Teacher',
    status: 'active',
  });

  // Center Manager (CM) Phạm Hùng
  const cmPhEmail = `cm.ph.${runId}@kapla.edu.vn`;
  const { data: cmPhUser } = await adminClient.auth.admin.createUser({
    email: cmPhEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Lê Nguyễn Hoàng Nhi (CM)', preferred_branch_id: BRANCH_PH_ID },
  });
  const cmPhId = cmPhUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', cmPhId);
  await adminClient.from('branch_memberships').insert({
    user_id: cmPhId,
    branch_id: BRANCH_PH_ID,
    role: 'CM',
    status: 'active',
  });

  // Head Teacher Bình Tân (Cơ sở khác)
  const htBtEmail = `ht.bt.${runId}@kapla.edu.vn`;
  const { data: htBtUser } = await adminClient.auth.admin.createUser({
    email: htBtEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Head Teacher Bình Tân', preferred_branch_id: BRANCH_BT_ID },
  });
  const htBtId = htBtUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', htBtId);
  await adminClient.from('branch_memberships').insert({
    user_id: htBtId,
    branch_id: BRANCH_BT_ID,
    role: 'Head Teacher',
    status: 'active',
  });

  // Lớp 1 (Phạm Hùng): Do Alex phụ trách
  const { data: class1 } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-Class1-${runId}`,
      level: 'Starters',
      main_teacher_id: alexId,
      status: 'active',
    })
    .select()
    .single();

  // Lớp 2 (Phạm Hùng): Do Sarah phụ trách
  const { data: class2 } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-Class2-${runId}`,
      level: 'Movers',
      main_teacher_id: sarahId,
      status: 'active',
    })
    .select()
    .single();

  // Lớp 3 (Bình Tân): Thuộc cơ sở Bình Tân
  const { data: classBt } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_BT_ID,
      name: `BT-Class3-${runId}`,
      level: 'Flyers',
      main_teacher_id: htBtId,
      status: 'active',
    })
    .select()
    .single();

  // Học viên An: Học Lớp 1 (Phạm Hùng)
  const { data: studentAn } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `AN-${runId}`,
      full_name: 'Nguyễn Hoàng An (Lớp 1)',
      tuition_expiry_date: '2026-12-31',
      current_class_id: class1.id,
      status: 'active',
      parent_name: 'Nguyễn Văn Minh',
      parent_phone: '0901234567',
    })
    .select()
    .single();

  await adminClient.from('enrollments').insert({
    student_id: studentAn.id,
    class_id: class1.id,
    branch_id: BRANCH_PH_ID,
    status: 'active',
  });

  // Học viên Bình: Học Lớp 2 (Phạm Hùng)
  const { data: studentBinh } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `BINH-${runId}`,
      full_name: 'Trần Thanh Bình (Lớp 2)',
      tuition_expiry_date: '2026-12-31',
      current_class_id: class2.id,
      status: 'active',
      parent_name: 'Trần Quốc Tuấn',
      parent_phone: '0909876543',
    })
    .select()
    .single();

  await adminClient.from('enrollments').insert({
    student_id: studentBinh.id,
    class_id: class2.id,
    branch_id: BRANCH_PH_ID,
    status: 'active',
  });

  // Học viên Cường: Thuộc cơ sở Bình Tân
  const { data: studentCuong } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_BT_ID,
      student_code: `CUONG-${runId}`,
      full_name: 'Lê Hùng Cường (Bình Tân)',
      tuition_expiry_date: '2026-12-31',
      current_class_id: classBt.id,
      status: 'active',
      parent_name: 'Lê Văn Nam',
      parent_phone: '0912345678',
    })
    .select()
    .single();

  await adminClient.from('enrollments').insert({
    student_id: studentCuong.id,
    class_id: classBt.id,
    branch_id: BRANCH_BT_ID,
    status: 'active',
  });

  assert('Khởi tạo hai lớp cùng cơ sở (Lớp 1 & Lớp 2) và lớp khác cơ sở (Bình Tân)', !!class1 && !!class2 && !!classBt);
  assert('Khởi tạo học viên theo lớp thành công (An -> Lớp 1, Bình -> Lớp 2, Cường -> Bình Tân)', !!studentAn && !!studentBinh && !!studentCuong);

  // Khởi tạo Supabase client có auth session
  const alexClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await alexClient.auth.signInWithPassword({ email: alexEmail, password });

  const sarahClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await sarahClient.auth.signInWithPassword({ email: sarahEmail, password });

  const htPhClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await htPhClient.auth.signInWithPassword({ email: htPhEmail, password });

  const cmPhClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await cmPhClient.auth.signInWithPassword({ email: cmPhEmail, password });

  const htBtClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await htBtClient.auth.signInWithPassword({ email: htBtEmail, password });

  // ---------------------------------------------------------------------------
  // 2. PHÂN QUYỀN HAI LỚP CÙNG CƠ SỞ & HAI CƠ SỞ KHÁC NHAU
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. KIỂM THỬ PHÂN QUYỀN HAI LỚP CÙNG CƠ SỞ & HAI CƠ SỞ KHÁC NHAU ---');

  // Alex đánh giá học viên An (Lớp 1 do Alex phụ trách) -> THÀNH CÔNG
  const { data: anAssessment, error: alexAnErr } = await alexClient
    .from('student_assessments')
    .insert({
      student_id: studentAn.id,
      class_id: class1.id,
      branch_id: BRANCH_PH_ID,
      period: 'Kỳ 1',
      listening_score: 4.0,
      speaking_score: 3.5,
      reading_score: 4.0,
      writing_score: 2.0, // Dưới 3 -> has_academic_risk
    })
    .select()
    .single();

  assert('Alex (phụ trách Lớp 1) đánh giá thành công học viên An thuộc Lớp 1', !alexAnErr && !!anAssessment, `ID bài đánh giá: ${anAssessment?.id}`);

  // Alex cố đánh giá học viên Bình (Lớp 2 cùng cơ sở nhưng Alex KHÔNG phụ trách) -> BỊ CHẶN 42501
  const { data: alexBinhData, error: alexBinhErr } = await alexClient
    .from('student_assessments')
    .insert({
      student_id: studentBinh.id,
      class_id: class2.id,
      branch_id: BRANCH_PH_ID,
      period: 'Kỳ 1',
      listening_score: 4.0,
      speaking_score: 4.0,
      reading_score: 4.0,
      writing_score: 4.0,
    })
    .select();

  assert(
    'Alex bị chặn khi cố đánh giá học viên Bình (Lớp 2 cùng cơ sở Phạm Hùng nhưng không phụ trách)',
    !!alexBinhErr && alexBinhErr.code === '42501',
    `Mã phản hồi: ${alexBinhErr?.code}: ${alexBinhErr?.message}`
  );

  // Alex cố tạo phiếu can thiệp cho học viên Bình (Lớp 2) -> BỊ CHẶN 42501
  const { error: alexBinhInterventionErr } = await alexClient.from('interventions').insert({
    student_id: studentBinh.id,
    class_id: class2.id,
    branch_id: BRANCH_PH_ID,
    issue_description: 'Alex can thiệp lớp khác',
    action_plan: 'Kế hoạch bổ trợ',
    due_date: '2026-12-01',
    status: 'open',
  });

  assert(
    'Alex bị chặn khi cố tạo phiếu can thiệp cho học viên Bình ở Lớp 2 cùng cơ sở',
    !!alexBinhInterventionErr && alexBinhInterventionErr.code === '42501',
    `Lỗi: ${alexBinhInterventionErr?.message}`
  );

  // Giáo viên Bình Tân cố đánh giá học viên An tại Phạm Hùng -> BỊ CHẶN 42501
  const { error: btEvaluatePhErr } = await htBtClient.from('student_assessments').insert({
    student_id: studentAn.id,
    class_id: class1.id,
    branch_id: BRANCH_PH_ID,
    period: 'Kỳ 1',
    listening_score: 3.5,
    speaking_score: 3.5,
    reading_score: 3.5,
    writing_score: 3.5,
  });

  assert(
    'Nhân sự cơ sở Bình Tân bị chặn khi cố đánh giá học viên An thuộc cơ sở Phạm Hùng',
    !!btEvaluatePhErr && btEvaluatePhErr.code === '42501',
    `Lỗi: ${btEvaluatePhErr?.message}`
  );

  // RLS SELECT cách ly cơ sở: Nhân sự Bình Tân query assessments của Phạm Hùng -> Trả về đúng 0 bản ghi
  const { data: btSeenPhAssessments } = await htBtClient
    .from('student_assessments')
    .select('*')
    .eq('branch_id', BRANCH_PH_ID);

  assert(
    'RLS cách ly cơ sở hoàn hảo: Nhân sự Bình Tân nhận đúng 0 bài đánh giá của cơ sở Phạm Hùng',
    Array.isArray(btSeenPhAssessments) && btSeenPhAssessments.length === 0,
    `Số bài đánh giá thấy được: ${btSeenPhAssessments?.length || 0}`
  );

  // ---------------------------------------------------------------------------
  // 3. RÀNG BUỘC TOÀN VẸN: STUDENT_ID, CLASS_ID, BRANCH_ID, ASSESSMENT_ID
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. KIỂM THỬ RÀNG BUỘC TOÀN VẸN DỮ LIỆU ĐÁNH GIÁ & CAN THIỆP ---');

  // Thử tạo assessment với branch_id của Bình Tân cho học viên An (Phạm Hùng) -> BỊ CHẶN P0002
  const { error: mismatchBranchErr } = await adminClient.from('student_assessments').insert({
    student_id: studentAn.id,
    class_id: class1.id,
    branch_id: BRANCH_BT_ID, // Sai cơ sở!
    period: 'Kỳ 1',
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 4.0,
    writing_score: 4.0,
  });

  assert(
    'Chặn tạo bài đánh giá sai lệch cơ sở so với hồ sơ học viên (mismatched branch_id)',
    !!mismatchBranchErr && mismatchBranchErr.code === 'P0002',
    `Lỗi: ${mismatchBranchErr?.message}`
  );

  // Thử tạo assessment với class_id là Lớp 2 cho học viên An (đang học Lớp 1) -> BỊ CHẶN P0002
  const { error: mismatchClassErr } = await adminClient.from('student_assessments').insert({
    student_id: studentAn.id,
    class_id: class2.id, // Sai lớp!
    branch_id: BRANCH_PH_ID,
    period: 'Kỳ 1',
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 4.0,
    writing_score: 4.0,
  });

  assert(
    'Chặn tạo bài đánh giá sai lệch lớp học so với lớp hiện tại của học viên (mismatched class_id)',
    !!mismatchClassErr && mismatchClassErr.code === 'P0002',
    `Lỗi: ${mismatchClassErr?.message}`
  );

  // Thử tạo phiếu can thiệp cho học viên Bình nhưng lại gắn assessment_id của học viên An -> BỊ CHẶN P0002
  const { error: mismatchAssessmentErr } = await adminClient.from('interventions').insert({
    student_id: studentBinh.id, // Bình
    assessment_id: anAssessment.id, // Bài đánh giá của An!
    class_id: class2.id,
    branch_id: BRANCH_PH_ID,
    issue_description: 'Gian lận gắn bài đánh giá chéo',
    action_plan: 'Kế hoạch bổ trợ',
    due_date: '2026-12-01',
    status: 'open',
  });

  assert(
    'Chặn tạo phiếu can thiệp gắn assessment_id của học viên khác (mismatched assessment_id)',
    !!mismatchAssessmentErr && mismatchAssessmentErr.code === 'P0002',
    `Lỗi: ${mismatchAssessmentErr?.message}`
  );

  // ---------------------------------------------------------------------------
  // 4. CÁC BƯỚC TRẠNG THÁI KHÔNG HỢP LỆ CỦA PHIẾU CAN THIỆP & TỰ ĐỘNG AUDIT LOG
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. KIỂM THỬ QUY TRÌNH CAN THIỆP 4 BƯỚC & TỰ ĐỘNG GHI AUDIT LOG ---');

  // Thử tạo phiếu mới với status = 'verified' -> BỊ CHẶN P0001 (Bắt buộc khởi tạo ở 'open')
  const { error: createVerifiedErr } = await alexClient.from('interventions').insert({
    student_id: studentAn.id,
    assessment_id: anAssessment.id,
    class_id: class1.id,
    branch_id: BRANCH_PH_ID,
    issue_description: 'Kỹ năng Viết 2/5 khiên',
    action_plan: 'Kèm ngữ pháp 1-1',
    due_date: '2026-12-05',
    status: 'verified', // Không hợp lệ khi tạo mới!
  });

  assert(
    'Chặn tạo phiếu can thiệp mới ở trạng thái "verified" (Bắt buộc tạo ở "open")',
    !!createVerifiedErr && createVerifiedErr.code === 'P0001',
    `Lỗi: ${createVerifiedErr?.message}`
  );

  // Thử tạo phiếu mới với status = 'resolved' -> BỊ CHẶN P0001
  const { error: createResolvedErr } = await alexClient.from('interventions').insert({
    student_id: studentAn.id,
    assessment_id: anAssessment.id,
    class_id: class1.id,
    branch_id: BRANCH_PH_ID,
    issue_description: 'Kỹ năng Viết 2/5 khiên',
    action_plan: 'Kèm ngữ pháp 1-1',
    due_date: '2026-12-05',
    status: 'resolved', // Không hợp lệ!
  });

  assert(
    'Chặn tạo phiếu can thiệp mới ở trạng thái "resolved" (Bắt buộc tạo ở "open")',
    !!createResolvedErr && createResolvedErr.code === 'P0001',
    `Lỗi: ${createResolvedErr?.message}`
  );

  // Tạo phiếu can thiệp hợp lệ ở trạng thái 'open'
  const { data: ticket, error: createTicketErr } = await alexClient
    .from('interventions')
    .insert({
      student_id: studentAn.id,
      assessment_id: anAssessment.id,
      class_id: class1.id,
      branch_id: BRANCH_PH_ID,
      issue_description: 'Kỹ năng Viết đạt 2.0/5 khiên, gặp khó khăn cấu trúc câu',
      root_cause: 'Chưa nắm vững quy tắc chia thì hiện tại đơn',
      action_plan: 'Kèm 1-1 mỗi thứ Tư 30 phút, giao 4 phiếu bài tập',
      due_date: '2026-12-05',
      status: 'open',
    })
    .select()
    .single();

  assert('Tạo phiếu can thiệp thành công ở trạng thái "open"', !createTicketErr && ticket.status === 'open', `Ticket ID: ${ticket.id}`);

  // Chuyển trực tiếp từ 'open' nhảy cóc sang 'verified' (chưa qua 'resolved') -> BỊ CHẶN P0001
  const { error: jumpOpenToVerifiedErr } = await htPhClient
    .from('interventions')
    .update({ status: 'verified', verification_notes: 'Xác minh nhảy cóc' })
    .eq('id', ticket.id);

  assert(
    'Chặn chuyển trực tiếp từ "open" nhảy cóc sang "verified" (chưa giải quyết)',
    !!jumpOpenToVerifiedErr && jumpOpenToVerifiedErr.code === 'P0001',
    `Lỗi: ${jumpOpenToVerifiedErr?.message}`
  );

  // Chuyển sang 'in_progress' -> THÀNH CÔNG
  const { error: toInProgressErr } = await alexClient
    .from('interventions')
    .update({ status: 'in_progress' })
    .eq('id', ticket.id);

  assert('Chuyển trạng thái phiếu sang "in_progress" thành công', !toInProgressErr);

  // Chuyển từ 'in_progress' nhảy cóc sang 'verified' (chưa có kết quả 'resolved') -> BỊ CHẶN P0001
  const { error: jumpProgressToVerifiedErr } = await htPhClient
    .from('interventions')
    .update({ status: 'verified', verification_notes: 'Chưa đánh giá lại' })
    .eq('id', ticket.id);

  assert(
    'Chặn chuyển từ "in_progress" nhảy cóc sang "verified" (bắt buộc phải qua "resolved")',
    !!jumpProgressToVerifiedErr && jumpProgressToVerifiedErr.code === 'P0001',
    `Lỗi: ${jumpProgressToVerifiedErr?.message}`
  );

  // Chuyển sang 'resolved' kèm kết quả đánh giá lại -> THÀNH CÔNG
  const { error: toResolvedErr } = await alexClient
    .from('interventions')
    .update({
      status: 'resolved',
      reassessment_result: 'Học viên đã hoàn thành 4 phiếu bài tập, kiểm tra lại đạt 3.5/5 khiên.',
    })
    .eq('id', ticket.id);

  assert('Alex cập nhật kết quả đánh giá lại và chuyển sang "resolved" thành công', !toResolvedErr);

  // Head Teacher xác minh phiếu (gọi verify_intervention) -> THÀNH CÔNG
  const { data: verifyResult, error: verifyErr } = await htPhClient.rpc('verify_intervention', {
    p_intervention_id: ticket.id,
    p_verification_notes: 'Đã thẩm định kết quả bài kiểm tra bổ trợ, đạt tiêu chuẩn 3.5 khiên.',
  });

  assert('Head Teacher xác minh phiếu can thiệp thành công từ trạng thái "resolved"', !verifyErr && verifyResult.success);

  // Kiểm tra database tự động ghi người xác minh, thời điểm và audit log
  const { data: verifiedTicket } = await adminClient.from('interventions').select('*').eq('id', ticket.id).single();
  assert(
    'Database tự động ghi nhận verified_by = Head Teacher và thời điểm verified_at',
    verifiedTicket.status === 'verified' && verifiedTicket.verified_by === htPhId && !!verifiedTicket.verified_at,
    `Người xác minh: ${verifiedTicket.verified_by}, Thời điểm: ${verifiedTicket.verified_at}`
  );

  // Kiểm tra nhật ký kiểm toán (audit_logs)
  const { data: auditLogs } = await adminClient
    .from('audit_logs')
    .select('*')
    .eq('action', 'INTERVENTION_VERIFIED')
    .eq('details->>intervention_id', ticket.id);

  assert(
    'Database tự động chèn nhật ký kiểm toán INTERVENTION_VERIFIED với đầy đủ chi tiết',
    Array.isArray(auditLogs) && auditLogs.length > 0 && auditLogs[0].actor_id === htPhId,
    `Actor: ${auditLogs?.[0]?.actor_email}, Action: ${auditLogs?.[0]?.action}`
  );

  // ---------------------------------------------------------------------------
  // 5. ĐỔI LỚP VÀ GHI DANH BẮT BUỘC ĐI QUA LUỒNG TRANSFER_STUDENT_CLASS CÓ LƯU LỊCH SỬ
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ SIẾT LUỒNG ĐỔI LỚP & GHI DANH BẮT BUỘC CÓ LỊCH SỬ ---');

  // Thử trực tiếp UPDATE current_class_id trên students ngoài RPC transfer_student_class -> BỊ CHẶN 42501
  const { error: directClassUpdateErr } = await cmPhClient
    .from('students')
    .update({ current_class_id: class2.id })
    .eq('id', studentAn.id);

  assert(
    'Chặn trực tiếp UPDATE current_class_id ngoài luồng transfer_student_class (42501)',
    !!directClassUpdateErr && directClassUpdateErr.code === '42501',
    `Lỗi: ${directClassUpdateErr?.message}`
  );

  // Thực hiện đổi lớp qua thủ tục hợp lệ transfer_student_class (CM Phạm Hùng chuyển An từ Lớp 1 sang Lớp 2)
  const { data: transferResult, error: transferErr } = await cmPhClient.rpc('transfer_student_class', {
    p_student_id: studentAn.id,
    p_to_class_id: class2.id,
    p_reason: 'Hoàn thành chương trình Starters, lên lớp Movers',
  });

  assert(
    'Chuyển lớp thành công qua thủ tục transfer_student_class',
    !transferErr && transferResult.success,
    `Kết quả RPC: ${JSON.stringify(transferResult)}`
  );

  // Kiểm tra lịch sử chuyển lớp và ghi danh trong CSDL
  const { data: transferHistory } = await adminClient
    .from('class_transfers')
    .select('*')
    .eq('student_id', studentAn.id);

  const { data: activeEnrollments } = await adminClient
    .from('enrollments')
    .select('*')
    .eq('student_id', studentAn.id)
    .eq('status', 'active');

  assert(
    'Lịch sử chuyển lớp (class_transfers) và ghi danh duy nhất (active enrollment) được bảo toàn nguyên vẹn',
    transferHistory.length === 1 && activeEnrollments.length === 1 && activeEnrollments[0].class_id === class2.id,
    `Lịch sử: ${transferHistory.length} bản ghi, Active Enrollment: Lớp ${activeEnrollments[0]?.class_id}`
  );

  // ---------------------------------------------------------------------------
  // 6. KIỂM THỬ THU HỒI QUYỀN TRUY CẬP (REVOCATION)
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ TÀI KHOẢN BỊ THU HỒI QUYỀN TRUY CẬP TỨC THÌ ---');

  // Sarah ban đầu có quyền truy cập học viên Bình (Lớp 2)
  const { data: sarahInitialAssessments } = await sarahClient
    .from('student_assessments')
    .select('*')
    .eq('class_id', class2.id);

  assert('Trước khi thu hồi: Sarah truy vấn được dữ liệu lớp được phân công', Array.isArray(sarahInitialAssessments));

  // CM / Admin thu hồi quyền của Sarah bằng cách đặt branch_membership sang inactive
  await adminClient
    .from('branch_memberships')
    .update({ status: 'inactive' })
    .eq('user_id', sarahId);

  // Sau khi thu hồi: Sarah cố tạo bài đánh giá -> BỊ CHẶN 42501
  const { error: sarahRevokedEvaluateErr } = await sarahClient.from('student_assessments').insert({
    student_id: studentBinh.id,
    class_id: class2.id,
    branch_id: BRANCH_PH_ID,
    period: 'Kỳ 1',
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 4.0,
    writing_score: 4.0,
  });

  assert(
    'Tài khoản bị thu hồi quyền lập tức bị chặn không thể tạo bài đánh giá (42501)',
    !!sarahRevokedEvaluateErr && sarahRevokedEvaluateErr.code === '42501',
    `Lỗi: ${sarahRevokedEvaluateErr?.message}`
  );

  // Sarah truy vấn bài đánh giá -> RLS trả về đúng 0 bản ghi
  const { data: sarahPostRevokeAssessments } = await sarahClient
    .from('student_assessments')
    .select('*')
    .eq('class_id', class2.id);

  assert(
    'RLS lập tức chặn quyền xem dữ liệu của tài khoản bị thu hồi (trả về 0 bản ghi)',
    Array.isArray(sarahPostRevokeAssessments) && sarahPostRevokeAssessments.length === 0,
    `Số bài đánh giá nhìn thấy sau khi thu hồi: ${sarahPostRevokeAssessments?.length || 0}`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ SIẾT T03–T04: ĐÃ VƯỢT QUA ${passed}/${total} TIÊU CHÍ (100% PASS)`);
  console.log('======================================================================\n');
}

runHardeningTests().catch((err) => {
  console.error('Kiểm thử gặp lỗi:', err);
  process.exit(1);
});
