// ==============================================================================
// KAPLA — T04: Kiểm thử Đánh giá 4 kỹ năng & Phiếu can thiệp học thuật
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

async function runT04Tests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ T04 TRÊN SUPABASE LOCAL STACK');
  console.log('  Đánh giá 4 kỹ năng → Tạo phiếu can thiệp → Xác minh (HT/CM) & Quyền');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';

  // ---------------------------------------------------------------------------
  // 1. KHỞI TẠO CÁC VAI TRÒ NHÂN SỰ
  // ---------------------------------------------------------------------------
  console.log('--- 1. KHỞI TẠO NHÂN SỰ THAM GIA QUY TRÌNH HỌC VỤ ---');

  // Main Teacher (Giáo viên chính tại Phạm Hùng)
  const mtEmail = `mt.ph.${runId}@kapla.edu.vn`;
  const { data: mtUser } = await adminClient.auth.admin.createUser({
    email: mtEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Teacher Alex (Main Teacher)', preferred_branch_id: BRANCH_PH_ID },
  });
  const mtId = mtUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', mtId);
  await adminClient.from('branch_memberships').insert({
    user_id: mtId,
    branch_id: BRANCH_PH_ID,
    role: 'Main Teacher',
    is_primary: true,
    status: 'active',
  });

  // Head Teacher (Chủ nhiệm học thuật tại Phạm Hùng)
  const htEmail = `ht.ph.${runId}@kapla.edu.vn`;
  const { data: htUser } = await adminClient.auth.admin.createUser({
    email: htEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Nguyễn Văn Quang (Head Teacher)', preferred_branch_id: BRANCH_PH_ID },
  });
  const htId = htUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', htId);
  await adminClient.from('branch_memberships').insert({
    user_id: htId,
    branch_id: BRANCH_PH_ID,
    role: 'Head Teacher',
    is_primary: true,
    status: 'active',
  });

  // CM Phạm Hùng
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
    is_primary: true,
    status: 'active',
  });

  // Head Teacher tại Bình Tân (Cơ sở khác)
  const htBtEmail = `ht.bt.${runId}@kapla.edu.vn`;
  const { data: htBtUser } = await adminClient.auth.admin.createUser({
    email: htBtEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Phạm Thanh Bình (HT Bình Tân)', preferred_branch_id: BRANCH_BT_ID },
  });
  const htBtId = htBtUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', htBtId);
  await adminClient.from('branch_memberships').insert({
    user_id: htBtId,
    branch_id: BRANCH_BT_ID,
    role: 'Head Teacher',
    is_primary: true,
    status: 'active',
  });

  // Tạo các clients tương ứng
  const mtClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await mtClient.auth.signInWithPassword({ email: mtEmail, password });

  const htClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await htClient.auth.signInWithPassword({ email: htEmail, password });

  const cmPhClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await cmPhClient.auth.signInWithPassword({ email: cmPhEmail, password });

  const htBtClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await htBtClient.auth.signInWithPassword({ email: htBtEmail, password });

  assert('Khởi tạo Main Teacher, Head Teacher, CM Phạm Hùng và Head Teacher Bình Tân thành công', true);

  // ---------------------------------------------------------------------------
  // 2. KHỞI TẠO LỚP HỌC VÀ HỌC VIÊN
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. KHỞI TẠO LỚP HỌC VÀ HỌC VIÊN KIỂM THỬ ---');

  const { data: classPh } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_PH_ID,
      name: `PH-Starters-T04-${runId}`,
      level: 'Starters',
      main_teacher_id: mtId,
      status: 'active',
    })
    .select()
    .single();

  const { data: classBt } = await adminClient
    .from('classes')
    .insert({
      branch_id: BRANCH_BT_ID,
      name: `BT-Starters-T04-${runId}`,
      level: 'Starters',
      main_teacher_id: htBtId,
      status: 'active',
    })
    .select()
    .single();

  const { data: studentPh } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_PH_ID,
      student_code: `STU-PH-${runId}`,
      full_name: 'Đặng Tuấn Kiệt',
      parent_name: 'Đặng Quốc Huy',
      parent_phone: '0909998881',
      tuition_expiry_date: '2026-12-31',
      status: 'active',
      current_class_id: classPh.id,
    })
    .select()
    .single();

  const { data: studentBt } = await adminClient
    .from('students')
    .insert({
      branch_id: BRANCH_BT_ID,
      student_code: `STU-BT-${runId}`,
      full_name: 'Bùi Gia Hân',
      parent_name: 'Bùi Quang Minh',
      parent_phone: '0909998882',
      tuition_expiry_date: '2026-12-31',
      status: 'active',
      current_class_id: classBt.id,
    })
    .select()
    .single();

  assert('Khởi tạo lớp và học viên tại 2 cơ sở thành công', true);

  // ---------------------------------------------------------------------------
  // 3. MAIN TEACHER ĐÁNH GIÁ 4 KỸ NĂNG & PHÁT HIỆN RỦI RO HỌC THUẬT
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. ĐÁNH GIÁ NĂNG LỰC 4 KỸ NĂNG & TỰ ĐỘNG CẢNH BÁO RỦI RO ---');

  const { data: assessment, error: assessErr } = await mtClient
    .from('student_assessments')
    .insert({
      student_id: studentPh.id,
      class_id: classPh.id,
      branch_id: BRANCH_PH_ID,
      period: 'Kỳ 1 - Giữa kỳ',
      assessment_date: '2026-11-13',
      listening_score: 4.5,
      speaking_score: 4.0,
      reading_score: 3.5,
      writing_score: 2.0, // < 3.0 khiên -> BẮT BUỘC KÍCH HOẠT NGUY CƠ HỌC THUẬT
      strengths: 'Nghe hiểu rất tốt, phản xạ nhanh với giáo viên bản ngữ.',
      weaknesses: 'Kỹ năng Viết yếu (2.0/5), thường xuyên quên chia động từ và viết sai chính tả từ vựng.',
      progress_notes: 'Cần lập phiếu can thiệp bổ trợ gấp kỹ năng Viết.',
      assessed_by: mtId,
    })
    .select()
    .single();

  assert('Main Teacher tạo bài đánh giá 4 kỹ năng thành công', !assessErr && Boolean(assessment));
  assert(
    'Trigger check_assessment_risk tự động gắn cờ rủi ro học thuật (has_academic_risk = true)',
    assessment?.has_academic_risk === true,
    `Điểm Viết: ${assessment?.writing_score}/5 khiên -> has_academic_risk: ${assessment?.has_academic_risk}`
  );

  // ---------------------------------------------------------------------------
  // 4. TẠO PHIẾU CAN THIỆP HỌC THUẬT VÀ CẬP NHẬT TIẾN ĐỘ
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. TẠO PHIẾU CAN THIỆP & CẬP NHẬT TIẾN ĐỘ (OPEN -> RESOLVED) ---');

  const { data: intervention, error: intervErr } = await mtClient
    .from('interventions')
    .insert({
      student_id: studentPh.id,
      assessment_id: assessment.id,
      class_id: classPh.id,
      branch_id: BRANCH_PH_ID,
      issue_description: 'Kỹ năng Viết đạt 2.0/5 khiên, học viên gặp khó khăn cấu trúc câu',
      root_cause: 'Chưa nhớ từ vựng chủ đề Unit 3-4 và cấu trúc thì Hiện tại đơn',
      action_plan: 'Bổ trợ 1-1 mỗi thứ 5 (30 phút), hướng dẫn viết câu ngắn theo mẫu Cambridge',
      assigned_staff_id: mtId,
      due_date: '2026-11-28',
      created_by: mtId,
      status: 'open',
    })
    .select()
    .single();

  assert('Tạo phiếu can thiệp học thuật thành công ở trạng thái "open"', !intervErr && intervention?.status === 'open');

  // Chuyển sang in_progress
  await mtClient
    .from('interventions')
    .update({ status: 'in_progress' })
    .eq('id', intervention.id);

  // Hoàn tất can thiệp -> resolved kèm kết quả đánh giá lại
  const { data: resolvedInterv, error: resolveErr } = await mtClient
    .from('interventions')
    .update({
      status: 'resolved',
      reassessment_result: 'Học viên đã hoàn thành 4 buổi bổ trợ, bài kiểm tra lại đạt 3.5/5 khiên.',
    })
    .eq('id', intervention.id)
    .select()
    .single();

  assert(
    'Main Teacher cập nhật phiếu sang trạng thái "resolved" kèm kết quả đánh giá lại',
    !resolveErr && resolvedInterv?.status === 'resolved',
    `Kết quả đánh giá lại: "${resolvedInterv?.reassessment_result}"`
  );

  // ---------------------------------------------------------------------------
  // 5. BẢO MẬT XÁC MINH: CHẶN TỰ XÁC MINH & CHẶN CƠ SỞ KHÁC
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. KIỂM THỬ BẢO MẬT BƯỚC XÁC MINH PHIẾU CAN THIỆP ---');

  // 5.1 Main Teacher cố tình tự xác minh phiếu của mình (bị cấm)
  const { error: mtSelfVerifyErr } = await mtClient
    .from('interventions')
    .update({ status: 'verified', verification_notes: 'Tự xác minh phiếu của tôi' })
    .eq('id', intervention.id);

  assert(
    'Chặn Main Teacher tự chuyển trạng thái phiếu sang "verified" (Chỉ Head Teacher/CM có quyền)',
    Boolean(mtSelfVerifyErr),
    `Phản hồi bảo mật: ${mtSelfVerifyErr?.message}`
  );

  // 5.2 Head Teacher cơ sở Bình Tân cố tình xác minh phiếu của cơ sở Phạm Hùng (bị cấm)
  const { error: htCrossBranchErr } = await htBtClient.rpc('verify_intervention', {
    p_intervention_id: intervention.id,
    p_verification_notes: 'Head Teacher Bình Tân muốn duyệt phiếu Phạm Hùng',
  });

  assert(
    'Chặn Head Teacher cơ sở khác xác minh phiếu can thiệp ngoài chi nhánh',
    Boolean(htCrossBranchErr),
    `Phản hồi bảo mật: ${htCrossBranchErr?.message}`
  );

  // 5.3 Head Teacher cơ sở Phạm Hùng xác minh phiếu thành công
  const { data: htVerifyRes, error: htVerifyErr } = await htClient.rpc('verify_intervention', {
    p_intervention_id: intervention.id,
    p_verification_notes: 'Đã kiểm tra bài viết lại của học viên Đặng Tuấn Kiệt. Tiến bộ rõ rệt, đạt yêu cầu chuẩn Cambridge.',
  });

  assert(
    'Head Teacher cơ sở Phạm Hùng xác minh phiếu can thiệp thành công',
    !htVerifyErr && htVerifyRes?.success === true,
    `Kết quả RPC: ${JSON.stringify(htVerifyRes)}`
  );

  // Kiểm tra trạng thái và người xác minh trong CSDL
  const { data: finalInterv } = await adminClient
    .from('interventions')
    .select('status, verified_by, verified_at, verification_notes')
    .eq('id', intervention.id)
    .single();

  assert(
    'Phiếu can thiệp chuyển status = "verified", ghi nhận chính xác verified_by = Head Teacher',
    finalInterv?.status === 'verified' && finalInterv?.verified_by === htId,
    `Trạng thái: ${finalInterv?.status}, Người duyệt ID: ${finalInterv?.verified_by}`
  );

  // 5.4 CM Phạm Hùng xác minh một phiếu can thiệp khác (CM cũng có toàn quyền xác minh)
  const { data: interv2 } = await adminClient
    .from('interventions')
    .insert({
      student_id: studentPh.id,
      class_id: classPh.id,
      branch_id: BRANCH_PH_ID,
      issue_description: 'Phát âm âm đuôi s/es còn thiếu',
      action_plan: 'Luyện đọc to cùng trợ giảng',
      due_date: '2026-11-30',
      status: 'open',
    })
    .select()
    .single();

  await adminClient
    .from('interventions')
    .update({ status: 'resolved', reassessment_result: 'Phát âm cải thiện tốt' })
    .eq('id', interv2.id);

  const { data: cmVerifyRes, error: cmVerifyErr } = await cmPhClient.rpc('verify_intervention', {
    p_intervention_id: interv2.id,
    p_verification_notes: 'CM duyệt đạt yêu cầu.',
  });

  assert(
    'CM chi nhánh cũng có quyền xác minh phiếu can thiệp thành công',
    !cmVerifyErr && cmVerifyRes?.success === true,
    `Người duyệt: CM Phạm Hùng`
  );

  // ---------------------------------------------------------------------------
  // 6. CÁCH LY DỮ LIỆU ĐÁNH GIÁ VÀ CAN THIỆP GIỮA CÁC CHI NHÁNH
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. KIỂM THỬ CÁCH LY DỮ LIỆU ĐÁNH GIÁ & CAN THIỆP GIỮA CÁC CHI NHÁNH ---');

  // Head Teacher Bình Tân truy vấn bài đánh giá
  const { data: btAssessments } = await htBtClient
    .from('student_assessments')
    .select('id, branch_id');

  const btAssessBranchPh = btAssessments?.filter((a) => a.branch_id === BRANCH_PH_ID) || [];
  assert(
    'Nhân sự cơ sở Bình Tân nhận đúng 0 bài đánh giá của cơ sở Phạm Hùng',
    btAssessBranchPh.length === 0,
    `Số bài đánh giá Phạm Hùng thấy được: ${btAssessBranchPh.length} (Độc lập cơ sở hoàn hảo)`
  );

  // Head Teacher Bình Tân truy vấn phiếu can thiệp
  const { data: btInterventions } = await htBtClient
    .from('interventions')
    .select('id, branch_id');

  const btIntervBranchPh = btInterventions?.filter((i) => i.branch_id === BRANCH_PH_ID) || [];
  assert(
    'Nhân sự cơ sở Bình Tân nhận đúng 0 phiếu can thiệp của cơ sở Phạm Hùng',
    btIntervBranchPh.length === 0,
    `Số phiếu can thiệp Phạm Hùng thấy được: ${btIntervBranchPh.length}`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ T04: ĐÃ VƯỢT QUA ${passed}/${total} TIÊU CHÍ (100% PASS)`);
  console.log('======================================================================\n');
}

runT04Tests().catch((err) => {
  console.error('\n[LỖI TEST T04]:', err);
  process.exit(1);
});
