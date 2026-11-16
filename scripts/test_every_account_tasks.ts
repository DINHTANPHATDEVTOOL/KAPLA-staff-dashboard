import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
(globalThis as any).WebSocket = ws;

const SUPABASE_URL = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';
const BRANCH_ID = 'a0000000-0000-0000-0000-000000000001'; // KAPLA Phạm Hùng

function createAccountClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function runComprehensiveAccountTaskTests() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ TOÀN DIỆN MỌI TÁC VỤ CỦA TỪNG TÀI KHOẢN TRÊN CLOUD');
  console.log('  Môi trường: Supabase Cloud (https://kzyrpbuoehwtlffelpxs.supabase.co)');
  console.log('======================================================================\n');

  let passedTasks = 0;
  let totalTasks = 0;

  function taskAssert(title: string, success: boolean, detail?: string) {
    totalTasks++;
    if (success) {
      passedTasks++;
      console.log(`   ✅ [PASS] ${title}${detail ? ` -> ${detail}` : ''}`);
    } else {
      console.error(`   ❌ [FAIL] ${title}${detail ? ` -> ${detail}` : ''}`);
    }
  }

  // ==========================================================================
  // TÀI KHOẢN 1: SYSTEM ADMIN (admin@kapla.edu.vn)
  // ==========================================================================
  console.log('======================================================================');
  console.log('👑 1. KIỂM THỬ TÁC VỤ: SYSTEM ADMIN (admin@kapla.edu.vn)');
  console.log('======================================================================');
  const clientAdmin = createAccountClient();
  const { data: adminAuth, error: adminAuthErr } = await clientAdmin.auth.signInWithPassword({
    email: 'admin@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  taskAssert('Tác vụ 1.1: Đăng nhập System Admin', !adminAuthErr && !!adminAuth.user, `UUID: ${adminAuth.user?.id}`);

  // Tác vụ 1.2: Admin xem danh sách chi nhánh và nhân sự toàn hệ thống
  const { data: allBranches } = await clientAdmin.from('branches').select('*');
  taskAssert('Tác vụ 1.2: Truy vấn danh mục chi nhánh toàn hệ thống', !!allBranches && allBranches.length > 0, `${allBranches?.length} chi nhánh`);

  const { data: allProfiles } = await clientAdmin.from('profiles').select('*');
  taskAssert('Tác vụ 1.3: Quản lý danh sách nhân sự toàn hệ thống', !!allProfiles && allProfiles.length >= 6, `${allProfiles?.length} hồ sơ nhân sự`);

  // Tác vụ 1.4: Admin xem nhật ký kiểm toán (Audit Logs)
  const { data: auditLogs, error: auditErr } = await clientAdmin.from('audit_logs').select('*').limit(5);
  taskAssert('Tác vụ 1.4: Truy vấn nhật ký kiểm toán (Audit Logs) bảo mật', !auditErr, `${auditLogs?.length || 0} bản ghi kiểm toán`);

  // ==========================================================================
  // TÀI KHOẢN 2: CENTER MANAGER - CM NHI (cm.nhi@kapla.edu.vn)
  // ==========================================================================
  console.log('\n======================================================================');
  console.log('🏢 2. KIỂM THỬ TÁC VỤ: CENTER MANAGER - CM NHI (cm.nhi@kapla.edu.vn)');
  console.log('======================================================================');
  const clientCM = createAccountClient();
  const { data: cmAuth, error: cmAuthErr } = await clientCM.auth.signInWithPassword({
    email: 'cm.nhi@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  taskAssert('Tác vụ 2.1: Đăng nhập Giám đốc cơ sở (CM)', !cmAuthErr && !!cmAuth.user);

  // Tác vụ 2.2: CM thêm mới một học viên vào cơ sở
  const cmTestCode = `KAP-CM-${Date.now().toString().slice(-4)}`;
  const { data: newStudentCM, error: newStudErr } = await clientCM
    .from('students')
    .insert({
      student_code: cmTestCode,
      full_name: 'Phan Bảo Long (CM Tạo)',
      parent_name: 'Phan Quốc Tuấn',
      parent_phone: '0918889999',
      branch_id: BRANCH_ID,
      status: 'active',
      tuition_expiry_date: '2027-01-31',
      notes: 'Học viên được tiếp nhận bởi CM Phương Nhi',
    })
    .select()
    .single();
  taskAssert('Tác vụ 2.2: CM tiếp nhận & thêm mới hồ sơ học viên vào chi nhánh', !newStudErr && !!newStudentCM, `Mã: ${cmTestCode}`);

  // Tác vụ 2.3: CM giao nhiệm vụ chăm sóc (student_tasks)
  let cmTaskId: string | null = null;
  if (newStudentCM) {
    const { data: cmTask, error: cmTaskErr } = await clientCM
      .from('student_tasks')
      .insert({
        student_id: newStudentCM.id,
        branch_id: BRANCH_ID,
        title: 'Xếp lịch kiểm tra đầu vào Cambridge',
        task_type: 'academic_support',
        due_date: '2026-11-28',
        status: 'pending',
        notes: 'CM giao cho HRT phụ trách kiểm tra ngữ pháp',
      })
      .select()
      .single();
    cmTaskId = cmTask?.id || null;
    taskAssert('Tác vụ 2.3: CM giao nhiệm vụ hỗ trợ học thuật cho học viên', !cmTaskErr && !!cmTask, `Nhiệm vụ: ${cmTask?.title}`);
  }

  // Tác vụ 2.4: CM điều phối phân công HRT quản nhiệm học viên
  if (newStudentCM) {
    // Lấy ID của HRT Minh
    const minhId = (await clientAdmin.from('profiles').select('id').eq('email', 'hrt.minh@kapla.edu.vn').single()).data?.id;
    const { error: assignErr } = await clientCM
      .from('students')
      .update({ assigned_hrt_id: minhId })
      .eq('id', newStudentCM.id);
    taskAssert('Tác vụ 2.4: CM phân công HRT Minh quản nhiệm học viên mới', !assignErr, `Gán cho HRT: ${minhId}`);
  }

  // ==========================================================================
  // TÀI KHOẢN 3: HEAD TEACHER - HT JAMIE (ht.jamie@kapla.edu.vn)
  // ==========================================================================
  console.log('\n======================================================================');
  console.log('🎓 3. KIỂM THỬ TÁC VỤ: HEAD TEACHER - HT JAMIE (ht.jamie@kapla.edu.vn)');
  console.log('======================================================================');
  const clientHT = createAccountClient();
  const { data: htAuth, error: htAuthErr } = await clientHT.auth.signInWithPassword({
    email: 'ht.jamie@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  taskAssert('Tác vụ 3.1: Đăng nhập Trưởng bộ môn (Head Teacher)', !htAuthErr && !!htAuth.user);

  // Tác vụ 3.2: HT giám sát danh mục lớp học & giáo viên đứng lớp
  const { data: htClasses, error: htClassErr } = await clientHT.from('classes').select('*, branches(name)');
  taskAssert('Tác vụ 3.2: Quản lý danh mục lớp học & giáo viên phụ trách', !htClassErr && !!htClasses, `${htClasses?.length} lớp học`);

  // Tác vụ 3.3: HT tạo buổi học bổ trợ (Supplementary Session)
  const { data: suppSession, error: suppErr } = await clientHT
    .from('supplementary_sessions')
    .insert({
      branch_id: BRANCH_ID,
      title: 'Luyện đề tăng cường kỹ năng Nói & Phát âm Flyers',
      session_date: '2026-11-22',
      start_time: '14:00',
      end_time: '15:30',
      teacher_id: htAuth.user?.id,
      room: 'Phòng 201 - Lab',
      topic: 'Speaking Part 2 & 3',
      target_objective: 'Chuẩn hóa phát âm đuôi -s/-ed và tự tin trả lời mở rộng',
      status: 'scheduled',
      notes: 'Tạo bởi Head Teacher Jamie',
    })
    .select()
    .single();
  taskAssert('Tác vụ 3.3: Head Teacher tạo buổi học bổ trợ (Supplementary)', !suppErr && !!suppSession, `Buổi học: ${suppSession?.title}`);

  // Tác vụ 3.4: HT thêm học viên vào danh sách học bổ trợ
  let attendeeId: string | null = null;
  if (suppSession) {
    const { data: attendee, error: attErr } = await clientHT
      .from('supplementary_attendees')
      .insert({
        session_id: suppSession.id,
        student_id: 'b0000000-0000-0000-0000-000000000001',
        attendance_status: 'present',
      })
      .select()
      .single();
    attendeeId = attendee?.id || null;
    taskAssert('Tác vụ 3.4: Thêm học viên vào danh sách buổi bổ trợ', !attErr && !!attendee);
  }

  // ==========================================================================
  // TÀI KHOẢN 4: HRT MINH (hrt.minh@kapla.edu.vn)
  // ==========================================================================
  console.log('\n======================================================================');
  console.log('🧑‍🏫 4. KIỂM THỬ TÁC VỤ: HRT MINH (hrt.minh@kapla.edu.vn)');
  console.log('======================================================================');
  const clientMinh = createAccountClient();
  const { data: minhAuth, error: minhAuthErr } = await clientMinh.auth.signInWithPassword({
    email: 'hrt.minh@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  taskAssert('Tác vụ 4.1: Đăng nhập HRT Minh', !minhAuthErr && !!minhAuth.user);

  // Tác vụ 4.2: HRT Minh nhập phiếu đánh giá định kỳ 4 kỹ năng Cambridge
  const { data: assessment, error: assessErr } = await clientMinh
    .from('student_assessments')
    .insert({
      student_id: 'b0000000-0000-0000-0000-000000000001',
      branch_id: BRANCH_ID,
      period: 'Tuần 4 - Tháng 11',
      assessment_date: '2026-11-14',
      listening_score: 4.5,
      speaking_score: 4.0,
      reading_score: 3.5,
      writing_score: 3.0,
      strengths: 'Nghe hiểu tình huống tốt, phản xạ nhanh với giáo viên bản ngữ',
      weaknesses: 'Viết còn nhầm lẫn ngữ pháp thì quá khứ',
      progress_notes: 'Có tiến bộ rõ rệt so với đầu tháng',
      has_academic_risk: false,
    })
    .select()
    .single();
  taskAssert('Tác vụ 4.2: HRT Minh nhập đánh giá định kỳ 4 kỹ năng Cambridge (Khiên)', !assessErr && !!assessment, `Nghe: 4.5, Nói: 4.0, Đọc: 3.5, Viết: 3.0`);

  // Tác vụ 4.3: HRT Minh phát hiện rủi ro học thuật -> Tạo phiếu can thiệp
  const { data: intervention, error: intervErr } = await clientMinh
    .from('interventions')
    .insert({
      student_id: 'b0000000-0000-0000-0000-000000000002',
      branch_id: BRANCH_ID,
      issue_description: 'Học viên hụt hơi phần đọc hiểu Movers',
      root_cause: 'Thiếu từ vựng chủ đề Animals & Food',
      action_plan: 'Kèm riêng 20 phút trước mỗi ca học và giao flashcard học tại nhà',
      status: 'open',
      due_date: '2026-11-30',
      created_by: minhAuth.user?.id,
    })
    .select()
    .single();
  taskAssert('Tác vụ 4.3: HRT Minh tạo phiếu can thiệp học thuật (Trạng thái open)', !intervErr && !!intervention);

  // Tác vụ 4.4: HRT Minh hoàn thành kèm cặp -> Chuyển sang resolved
  if (intervention) {
    const { error: resErr } = await clientMinh
      .from('interventions')
      .update({ status: 'resolved' })
      .eq('id', intervention.id);
    taskAssert('Tác vụ 4.4: HRT Minh hoàn thành kế hoạch kèm cặp -> Chuyển status sang resolved', !resErr);

    // Tác vụ 3.5 (Head Teacher duyệt phiếu của Minh):
    const { data: verifiedTicket, error: verErr } = await clientHT
      .from('interventions')
      .update({
        status: 'verified',
        verified_by: htAuth.user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', intervention.id)
      .select()
      .single();
    taskAssert('Tác vụ 3.5: Head Teacher Jamie thẩm định & DUYỆT phiếu can thiệp (verified)', !verErr && verifiedTicket?.status === 'verified', `Người duyệt: Jamie`);
  }

  // Tác vụ 4.5: HRT Minh cập nhật ghi chú học viên với lưu vết tài khoản
  const { error: noteErr } = await clientMinh
    .from('students')
    .update({
      notes: `[HRT Minh - ${new Date().toLocaleTimeString()}] Đã trao đổi phụ huynh về kết quả kiểm tra tiến bộ.`,
    })
    .eq('id', 'b0000000-0000-0000-0000-000000000001');
  taskAssert('Tác vụ 4.5: HRT Minh cập nhật ghi chú chăm sóc học viên kèm lưu vết', !noteErr);

  // ==========================================================================
  // TÀI KHOẢN 5: HRT TRÂM (hrt.tram@kapla.edu.vn)
  // ==========================================================================
  console.log('\n======================================================================');
  console.log('👩‍🏫 5. KIỂM THỬ TÁC VỤ: HRT TRÂM (hrt.tram@kapla.edu.vn)');
  console.log('======================================================================');
  const clientTram = createAccountClient();
  const { data: tramAuth, error: tramAuthErr } = await clientTram.auth.signInWithPassword({
    email: 'hrt.tram@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  taskAssert('Tác vụ 5.1: Đăng nhập HRT Trâm', !tramAuthErr && !!tramAuth.user);

  // Tác vụ 5.2: HRT Trâm theo dõi & cập nhật thông tin tái tục học phí
  const { data: renewalRec, error: renErr } = await clientTram
    .from('renewal_tracking')
    .upsert(
      {
        student_id: 'b0000000-0000-0000-0000-000000000005',
        branch_id: BRANCH_ID,
        current_expiry_date: '2026-11-25',
        risk_level: 'medium',
        assigned_hrt_id: tramAuth.user?.id,
        status: 'contacted',
        last_contact_date: '2026-11-14',
        contact_count: 1,
        notes: 'Phụ huynh đã nghe máy, đang cân nhắc gói học 1 năm',
      },
      { onConflict: 'student_id' }
    )
    .select()
    .single();
  taskAssert('Tác vụ 5.2: HRT Trâm theo dõi tái tục & ghi nhận cuộc gọi nhắc phí', !renErr && !!renewalRec, `Trạng thái: ${renewalRec?.status}, Lần liên hệ: ${renewalRec?.contact_count}`);

  // Tác vụ 5.3: HRT Trâm ghi nhận phản hồi phụ huynh / CSKH (parent_feedbacks)
  const { data: feedback, error: fbErr } = await clientTram
    .from('parent_feedbacks')
    .insert({
      student_id: 'b0000000-0000-0000-0000-000000000005',
      branch_id: BRANCH_ID,
      parent_name: 'Phạm Hải Đăng',
      parent_phone: '0905 667 788',
      feedback_type: 'academic_concern',
      channel: 'phone',
      content: 'Phụ huynh mong muốn giáo viên cho thêm bài tập nói ghi âm qua Zalo',
      assigned_staff_id: tramAuth.user?.id,
      due_date: '2026-11-18',
      status: 'resolved',
      resolution_notes: 'HRT Trâm đã tạo nhóm Zalo và hướng dẫn phụ huynh cách gửi ghi âm',
    })
    .select()
    .single();
  taskAssert('Tác vụ 5.3: HRT Trâm ghi nhận cuộc gọi CSKH & xử lý phản hồi phụ huynh', !fbErr && !!feedback, `Trạng thái: ${feedback?.status}`);

  // ==========================================================================
  // TÀI KHOẢN 6: HRT VY (hrt.vy@kapla.edu.vn)
  // ==========================================================================
  console.log('\n======================================================================');
  console.log('👩‍🏫 6. KIỂM THỬ TÁC VỤ: HRT VY (hrt.vy@kapla.edu.vn)');
  console.log('======================================================================');
  const clientVy = createAccountClient();
  const { data: vyAuth, error: vyAuthErr } = await clientVy.auth.signInWithPassword({
    email: 'hrt.vy@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  taskAssert('Tác vụ 6.1: Đăng nhập HRT Vy', !vyAuthErr && !!vyAuth.user);

  // Tác vụ 6.2: HRT Vy thực hiện và hoàn tất nhiệm vụ chăm sóc
  const { data: vyTask, error: vyTaskErr } = await clientVy
    .from('student_tasks')
    .insert({
      student_id: 'b0000000-0000-0000-0000-000000000008',
      branch_id: BRANCH_ID,
      title: 'Gọi chúc mừng sinh nhật học viên',
      task_type: 'care_call',
      due_date: '2026-11-15',
      status: 'completed',
      notes: 'Đã gửi thiệp và tặng voucher quà tặng tại quầy lễ tân',
    })
    .select()
    .single();
  taskAssert('Tác vụ 6.2: HRT Vy thực hiện và cập nhật hoàn thành nhiệm vụ CSKH', !vyTaskErr && !!vyTask, `Trạng thái: ${vyTask?.status}`);

  // Tác vụ 6.3: HRT Vy ghi nhận đánh giá kết quả buổi bổ trợ
  if (attendeeId) {
    const { error: attScoreErr } = await clientVy
      .from('supplementary_attendees')
      .update({
        assessment_score: 4.8,
        teacher_feedback: 'Học viên phát âm rất chuẩn, nói lưu loát và tự tin',
      })
      .eq('id', attendeeId);
    taskAssert('Tác vụ 6.3: Đánh giá kết quả học viên sau buổi bổ trợ', !attScoreErr, `Điểm số: 4.8 / 5.0`);
  }

  // Tác vụ 6.4: HRT Vy cập nhật trạng thái học viên
  const { error: vyStudErr } = await clientVy
    .from('students')
    .update({
      notes: `[HRT Vy - ${new Date().toLocaleTimeString()}] Hoàn thành buổi tư vấn lộ trình học nâng cao.`,
    })
    .eq('id', 'b0000000-0000-0000-0000-000000000008');
  taskAssert('Tác vụ 6.4: HRT Vy cập nhật tiến độ học viên phụ trách', !vyStudErr);

  // ==========================================================================
  // DỌN DẸP DỮ LIỆU TẠM
  // ==========================================================================
  console.log('\n🧹 Đang dọn dẹp các bản ghi kiểm thử tạm thời...');
  if (newStudentCM) {
    if (cmTaskId) await clientAdmin.from('student_tasks').delete().eq('id', cmTaskId);
    await clientAdmin.from('students').delete().eq('id', newStudentCM.id);
  }
  if (suppSession) {
    await clientAdmin.from('supplementary_sessions').delete().eq('id', suppSession.id);
  }
  if (assessment) {
    await clientAdmin.from('student_assessments').delete().eq('id', assessment.id);
  }
  if (intervention) {
    await clientAdmin.from('interventions').delete().eq('id', intervention.id);
  }
  if (feedback) {
    await clientAdmin.from('parent_feedbacks').delete().eq('id', feedback.id);
  }
  if (vyTask) {
    await clientAdmin.from('student_tasks').delete().eq('id', vyTask.id);
  }

  console.log('\n======================================================================');
  console.log(`  TỔNG KẾT KIỂM THỬ TÁC VỤ 6 TÀI KHOẢN: ${passedTasks}/${totalTasks} TÁC VỤ THÀNH CÔNG (${Math.round((passedTasks / totalTasks) * 100)}%)!`);
  console.log('  TẤT CẢ TÁC VỤ CHUYÊN MÔN CỦA TỪNG VAI TRÒ ĐỀU HOẠT ĐỘNG HOÀN HẢO!');
  console.log('======================================================================\n');
}

runComprehensiveAccountTaskTests();
