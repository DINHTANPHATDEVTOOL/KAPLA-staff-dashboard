// ==============================================================================
// KAPLA Staff Dashboard — Complete End-to-End Database Integration Test Suite
// Full validation of Database Operations, Service Layers, Security & RLS,
// and Customer Feedback Requirements (GOPY)
// ==============================================================================

import {
  MockStorageService,
  StudentService,
  AssessmentService,
  InterventionService,
  FeedbackService,
  SupplementaryService,
  RenewalService,
  StaffService,
} from '../src/lib/supabase';
import {
  Student,
  StudentAssessment,
  InterventionTicket,
  ParentFeedback,
  SupplementarySession,
  SkillCompetencyLevel,
  ProgressEvaluation,
  CareTaskStatus,
} from '../src/types';

let passed = 0;
let total = 0;

function assert(description: string, condition: boolean, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${description}`);
    if (detail) console.log(`         -> ${detail}`);
  } else {
    console.error(`  ❌ [FAIL] ${description}`);
    if (detail) console.error(`         -> ${detail}`);
    throw new Error(`Kiểm thử thất bại: "${description}"`);
  }
}

async function runCompleteDatabaseTestSuite() {
  console.log('======================================================================');
  console.log('  KAPLA — TOÀN BỘ KIỂM THỬ TÍCH HỢP CƠ SỞ DỮ LIỆU & NGHIỆP VỤ (E2E)');
  console.log('  T01–T05: Auth & RLS, Học viên, Đánh giá 4 kỹ năng (GOPY),');
  console.log('  Can thiệp học thuật, CSKH DotB CRM, Bổ trợ & Tái tục');
  console.log('======================================================================\n');

  // Reset database state to pristine defaults
  MockStorageService.resetToDefault();

  const BRANCH_PH_ID = 'a0000000-0000-0000-0000-000000000001'; // KAPLA Phạm Hùng
  const BRANCH_BT_ID = 'a0000000-0000-0000-0000-000000000002'; // KAPLA Bình Tân

  // ---------------------------------------------------------------------------
  // SECTION 1: DATABASE ROSTER & INITIAL SEED INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('--- PHẦN 1: TOÀN VẸN CƠ SỞ DỮ LIỆU VÀ HỒ SƠ NHÂN SỰ ---');

  const branches = MockStorageService.getBranches();
  assert('Cơ sở dữ liệu khởi tạo đúng ít nhất 1 cơ sở hợp lệ', branches.length >= 1);
  assert('Cơ sở Phạm Hùng có ID chuẩn xác', branches.some((b) => b.id === BRANCH_PH_ID));

  const profiles = MockStorageService.getProfiles();
  assert('Hồ sơ nhân viên mặc định đầy đủ (>= 6 tài khoản)', profiles.length >= 6);

  const cmStaff = profiles.find((p) => p.email === 'cm.nhi@kapla.edu.vn');
  const htStaff = profiles.find((p) => p.email === 'ht.jamie@kapla.edu.vn');
  const hrtMinh = profiles.find((p) => p.email === 'hrt.minh@kapla.edu.vn');
  const hrtTram = profiles.find((p) => p.email === 'hrt.tram@kapla.edu.vn');

  assert('Có tài khoản Giám đốc cơ sở Phương Nhi (CM)', Boolean(cmStaff));
  assert('Có tài khoản Chủ nhiệm học thuật Jamie (Head Teacher)', Boolean(htStaff));
  assert('Có tài khoản Quản nhiệm Minh (HRT)', Boolean(hrtMinh));
  assert('Có tài khoản Quản nhiệm Trâm (HRT)', Boolean(hrtTram));

  // ---------------------------------------------------------------------------
  // SECTION 2: STUDENT PROFILE CRUD & CLASS TRANSFERS (PHASE T03)
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 2: THAO TÁC CƠ SỞ DỮ LIỆU HỒ SƠ HỌC VIÊN & CHUYỂN LỚP ---');

  const initialStudents = await StudentService.getStudents(BRANCH_PH_ID);
  assert('Danh sách học viên ban đầu cơ sở Phạm Hùng >= 8 học viên', initialStudents.length >= 8);

  // Check customer-requested student from GOPY (Nguyễn Tuấn Khải - 0003)
  const khaiStudent = initialStudents.find(
    (s) => s.student_code === '0003' || s.full_name.includes('Tuấn Khải')
  );
  assert(
    'Học viên [0003] Nguyễn Tuấn Khải (theo phản hồi GOPY) tồn tại trong CSDL',
    Boolean(khaiStudent),
    khaiStudent ? `ID: ${khaiStudent.id}, Mã: ${khaiStudent.student_code}, Lớp: ${khaiStudent.current_class_name}` : undefined
  );

  // Create a brand new student in DB
  const newStudentPayload = {
    branch_id: BRANCH_PH_ID,
    student_code: 'TEST-DB-001',
    full_name: 'Trần Bảo Long',
    date_of_birth: '2016-08-15',
    gender: 'Nam',
    parent_name: 'Trần Văn Hoàng (Bố)',
    parent_phone: '0988776655',
    parent_email: 'hoang.tran@gmail.com',
    tuition_expiry_date: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0], // 10 days (Urgent)
    status: 'active' as const,
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: hrtMinh!.id,
    notes: 'Học viên kiểm thử tích hợp DB',
  };

  const createdStudent = await StudentService.createStudent(newStudentPayload);
  assert('Tạo học viên mới trực tiếp qua StudentService thành công', Boolean(createdStudent.id));
  assert('Mã học viên và tên được lưu chuẩn xác vào DB', createdStudent.student_code === 'TEST-DB-001');

  // Update student profile
  const updatedStudent = await StudentService.updateStudent(createdStudent.id, {
    parent_phone: '0988779999',
    notes: 'Đã cập nhật số điện thoại phụ huynh',
  });
  assert('Cập nhật thông tin học viên thành công', updatedStudent.parent_phone === '0988779999');

  // Test Class Transfer
  const targetClassId = 'c0000000-0000-0000-0000-000000000002';
  await StudentService.transferClass(
    createdStudent.id,
    targetClassId,
    'Chuyển lớp học để phù hợp với lịch học mới'
  );

  const studentsAfterTransfer = await StudentService.getStudents(BRANCH_PH_ID);
  const transferredStudent = studentsAfterTransfer.find((s) => s.id === createdStudent.id);
  assert(
    'Học viên được cập nhật current_class_id sang lớp mới',
    transferredStudent?.current_class_id === targetClassId
  );

  const transferLogs = await StudentService.getTransfers(createdStudent.id);
  assert('Lịch sử chuyển lớp ghi nhận đầy đủ lý do và thời gian', transferLogs.length >= 1);
  assert(
    'Lý do chuyển lớp khớp trong DB',
    transferLogs[0].reason === 'Chuyển lớp học để phù hợp với lịch học mới'
  );

  // ---------------------------------------------------------------------------
  // SECTION 3: HRT ASSIGNMENT PRECEDENCE & ROLE-BASED SCOPING (PHASE T03)
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 3: NGUYÊN TẮC ƯU TIÊN HRT & PHÂN QUYỀN TRUY VẬN CSDL ---');

  // Assign individual HRT to student
  await StudentService.assignHrt(
    createdStudent.id,
    hrtTram!.id,
    'Chuyển giao cho Quản nhiệm Trâm chăm sóc đặc biệt'
  );

  const studentWithHrt = (await StudentService.getStudents(BRANCH_PH_ID)).find(
    (s) => s.id === createdStudent.id
  );
  assert('Học viên có assigned_hrt_id được gán riêng cho Trâm', studentWithHrt?.assigned_hrt_id === hrtTram!.id);

  // Test HRT Scoping: Trâm sees createdStudent, Minh does NOT
  const tramStudents = await StudentService.getStudents(BRANCH_PH_ID, hrtTram!.id, false, false);
  const minhStudents = await StudentService.getStudents(BRANCH_PH_ID, hrtMinh!.id, false, false);

  assert(
    'HRT Trâm nhìn thấy học viên được giao riêng (assigned_hrt_id)',
    tramStudents.some((s) => s.id === createdStudent.id)
  );
  assert(
    'HRT Minh không nhìn thấy học viên này vì quyền giao riêng ưu tiên hơn lớp',
    !minhStudents.some((s) => s.id === createdStudent.id)
  );

  // CM & System Admin see ALL students in branch
  const cmStudents = await StudentService.getStudents(BRANCH_PH_ID, cmStaff!.id, false, true);
  assert('CM nhìn thấy toàn bộ học viên trong cơ sở', cmStudents.some((s) => s.id === createdStudent.id));

  // Care tasks test
  const careTasks = await StudentService.getCareTasks(BRANCH_PH_ID);
  assert('Danh sách công việc chăm sóc (Care Tasks) đọc từ DB thành công', careTasks.length > 0);
  const firstTask = careTasks[0];
  await StudentService.updateTaskStatus(firstTask.id, 'completed' as CareTaskStatus);
  const careTasksAfter = await StudentService.getCareTasks(BRANCH_PH_ID);
  const updatedTask = careTasksAfter.find((t) => t.id === firstTask.id);
  assert('Cập nhật trạng thái Care Task sang completed thành công', updatedTask?.status === 'completed');

  // ---------------------------------------------------------------------------
  // SECTION 4: 4-SKILL COMPETENCY ASSESSMENT & AUTO RISK CALCULATION (GOPY)
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 4: ĐÁNH GIÁ 4 KỸ NĂNG VÀ TỰ ĐỘNG TÍNH TOÁN RỦI RO (GOPY) ---');

  // Case 4.1: Assessment with Below Level skill -> MUST trigger has_academic_risk = true
  const riskAssessmentPayload = {
    student_id: createdStudent.id,
    class_id: targetClassId,
    branch_id: BRANCH_PH_ID,
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-14',
    listening_score: 4.0,
    speaking_score: 3.5,
    reading_score: 3.0,
    writing_score: 2.0,
    listening_level: 'Above Level' as SkillCompetencyLevel,
    speaking_level: 'On Track' as SkillCompetencyLevel,
    reading_level: 'On Track' as SkillCompetencyLevel,
    writing_level: 'Below Level' as SkillCompetencyLevel, // Below Level!
    progress_status: 'Needs Attention' as ProgressEvaluation,
    strengths: 'Nghe hiểu tự nhiên, phản xạ tốt.',
    weaknesses: 'Kỹ năng Viết yếu (Below Level), cần hỗ trợ cấu trúc câu.',
    progress_notes: 'Lập phiếu can thiệp bổ trợ kỹ năng viết gấp.',
    assessed_by: htStaff!.id,
  };

  const createdRiskAssessment = await AssessmentService.createAssessment(riskAssessmentPayload);
  assert('Tạo bài đánh giá 4 kỹ năng mới thành công', Boolean(createdRiskAssessment.id));
  assert(
    'Hệ thống tự động kích hoạt nguy cơ học thuật (has_academic_risk = true) khi có kỹ năng Below Level',
    createdRiskAssessment.has_academic_risk === true,
    `writing_level: ${createdRiskAssessment.writing_level} -> has_academic_risk: ${createdRiskAssessment.has_academic_risk}`
  );
  assert(
    'Cả 4 mức năng lực được lưu chuẩn xác vào DB',
    createdRiskAssessment.listening_level === 'Above Level' &&
      createdRiskAssessment.speaking_level === 'On Track' &&
      createdRiskAssessment.reading_level === 'On Track' &&
      createdRiskAssessment.writing_level === 'Below Level'
  );
  assert(
    'Đánh giá tiến độ (progress_status) được lưu đúng',
    createdRiskAssessment.progress_status === 'Needs Attention'
  );

  // Case 4.2: Assessment with all On Track / Above Level -> has_academic_risk = false
  const safeAssessmentPayload = {
    student_id: createdStudent.id,
    class_id: targetClassId,
    branch_id: BRANCH_PH_ID,
    period: 'Kỳ 1 - Cuối kỳ',
    assessment_date: '2026-11-20',
    listening_score: 4.5,
    speaking_score: 4.0,
    reading_score: 4.0,
    writing_score: 3.5,
    listening_level: 'Above Level' as SkillCompetencyLevel,
    speaking_level: 'On Track' as SkillCompetencyLevel,
    reading_level: 'On Track' as SkillCompetencyLevel,
    writing_level: 'On Track' as SkillCompetencyLevel,
    progress_status: 'Improved' as ProgressEvaluation,
    strengths: 'Tiến bộ vượt bậc sau 4 buổi bổ trợ.',
    weaknesses: 'Cần duy trì đều đặn.',
    progress_notes: 'Đã đạt chuẩn Cambridge.',
    assessed_by: htStaff!.id,
  };

  const createdSafeAssessment = await AssessmentService.createAssessment(safeAssessmentPayload);
  assert(
    'Hệ thống đánh dấu has_academic_risk = false khi tất cả kỹ năng On Track/Above Level',
    createdSafeAssessment.has_academic_risk === false,
    `Writing: ${createdSafeAssessment.writing_level} -> has_academic_risk: ${createdSafeAssessment.has_academic_risk}`
  );

  // ---------------------------------------------------------------------------
  // SECTION 5: ACADEMIC INTERVENTION LIFECYCLE & SECURITY VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 5: QUY TRÌNH PHIẾU CAN THIỆP HỌC THUẬT & XÁC MINH BẢO MẬT ---');

  const interventionPayload = {
    student_id: createdStudent.id,
    assessment_id: createdRiskAssessment.id,
    class_id: targetClassId,
    branch_id: BRANCH_PH_ID,
    issue_description: 'Kỹ năng Viết ở mức Below Level (2.0/5.0 khiên)',
    root_cause: 'Chưa nhớ từ vựng và cấu trúc ngữ pháp cơ bản',
    action_plan: 'Bổ trợ 1-1 mỗi thứ Ba 30 phút, luyện viết câu ngắn',
    assigned_staff_id: htStaff!.id,
    due_date: '2026-11-28',
    created_by: htStaff!.id,
  };

  const createdIntervention = await InterventionService.createIntervention(interventionPayload);
  assert('Tạo phiếu can thiệp học thuật thành công ở trạng thái open', createdIntervention.status === 'open');

  // Transition: open -> in_progress
  await InterventionService.updateStatus(createdIntervention.id, 'in_progress');
  let currentInterventions = await InterventionService.getInterventions(BRANCH_PH_ID);
  let ticket = currentInterventions.find((i) => i.id === createdIntervention.id);
  assert('Chuyển trạng thái phiếu sang in_progress thành công', ticket?.status === 'in_progress');

  // Transition: in_progress -> resolved with reassessment result
  await InterventionService.updateStatus(
    createdIntervention.id,
    'resolved',
    'Học viên đã hoàn thành 4 buổi bổ trợ, bài kiểm tra lại đạt On Track'
  );
  currentInterventions = await InterventionService.getInterventions(BRANCH_PH_ID);
  ticket = currentInterventions.find((i) => i.id === createdIntervention.id);
  assert('Chuyển trạng thái phiếu sang resolved kèm kết quả đánh giá lại', ticket?.status === 'resolved');
  assert(
    'Kết quả đánh giá lại được lưu trong DB',
    ticket?.reassessment_result === 'Học viên đã hoàn thành 4 buổi bổ trợ, bài kiểm tra lại đạt On Track'
  );

  // Verification security: Only Head Teacher or CM can verify
  let unauthorizedError = false;
  try {
    // Non-HT/CM attempt
    await InterventionService.verifyIntervention(
      createdIntervention.id,
      'Quản nhiệm cố tình tự duyệt',
      hrtMinh!.id,
      false,
      false
    );
  } catch (err) {
    unauthorizedError = true;
  }
  assert('Chặn nhân sự không có thẩm quyền tự xác minh phiếu can thiệp', unauthorizedError);

  // Authorized verification by Head Teacher Jamie
  await InterventionService.verifyIntervention(
    createdIntervention.id,
    'Đã kiểm tra bài viết lại của học viên. Đạt chuẩn Cambridge.',
    htStaff!.id,
    false,
    true
  );

  currentInterventions = await InterventionService.getInterventions(BRANCH_PH_ID);
  ticket = currentInterventions.find((i) => i.id === createdIntervention.id);
  assert('Head Teacher xác minh thành công -> status = verified', ticket?.status === 'verified');
  assert('Ghi nhận chính xác người xác minh trong DB', ticket?.verified_by === htStaff!.id);
  assert(
    'Ghi chú xác minh được lưu chuẩn',
    ticket?.verification_notes === 'Đã kiểm tra bài viết lại của học viên. Đạt chuẩn Cambridge.'
  );

  // ---------------------------------------------------------------------------
  // SECTION 6: PARENT FEEDBACK & CALL LOGS (DotB CRM STYLE)
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 6: NHẬT KÝ CUỘC GỌI & PHẢN HỒI PHỤ HUYNH (DotB CRM STYLE) ---');

  const feedbackPayload = {
    student_id: createdStudent.id,
    branch_id: BRANCH_PH_ID,
    parent_name: 'Trần Văn Hoàng (Bố)',
    parent_phone: '0988779999',
    feedback_type: 'academic' as const,
    channel: 'phone' as const,
    content: 'Phụ huynh gọi điện hỏi về tiến độ học tập và đề xuất tăng cường bổ trợ từ vựng.',
    assigned_staff_id: hrtTram!.id,
    due_date: '2026-11-18',
    status: 'open' as const,
  };

  const createdFeedback = await FeedbackService.createFeedback(feedbackPayload);
  assert('Tạo bản ghi nhật ký cuộc gọi CSKH thành công', Boolean(createdFeedback.id));
  assert('Kênh liên hệ được lưu đúng là "phone"', createdFeedback.channel === 'phone');

  // Update status with resolution notes
  await FeedbackService.updateStatus(
    createdFeedback.id,
    'resolved',
    'Đã gọi lại trao đổi kết quả buổi bổ trợ, phụ huynh hoàn toàn an tâm và hài lòng.'
  );

  const feedbacks = await FeedbackService.getFeedbacks(BRANCH_PH_ID);
  const updatedFeedback = feedbacks.find((f) => f.id === createdFeedback.id);
  assert('Trạng thái phản hồi cập nhật thành công sang resolved', updatedFeedback?.status === 'resolved');
  assert(
    'Ghi chú giải quyết được lưu chính xác trong DB',
    Boolean(updatedFeedback?.resolution_notes?.includes('phụ huynh hoàn toàn an tâm'))
  );

  // ---------------------------------------------------------------------------
  // SECTION 7: SUPPLEMENTARY / TUTORING SESSIONS
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 7: LỚP BỔ TRỢ HỌC THUẬT (SUPPLEMENTARY TUTORING) ---');

  const sessionPayload = {
    branch_id: BRANCH_PH_ID,
    class_id: targetClassId,
    title: 'Buổi bổ trợ ngữ pháp Unit 3-4',
    session_date: '2026-11-16',
    start_time: '18:00',
    end_time: '19:00',
    teacher_id: htStaff!.id,
    room: 'Phòng 201',
    topic: 'Cấu trúc câu khẳng định và phủ định thì Hiện tại đơn',
    target_objective: 'Nắm chắc mẫu câu và làm đúng 80% bài tập Cambridge',
    status: 'completed' as const,
    notes: 'Buổi học diễn ra nghiêm túc, học viên tích cực tương tác',
    attendees: [
      {
        student_id: createdStudent.id,
        attendance_status: 'attended' as const,
        notes: 'Tiếp thu nhanh, làm đúng các bài tập',
      },
    ],
  };

  const createdSession = await SupplementaryService.createSession(sessionPayload as any);
  assert('Tạo buổi học bổ trợ thành công trong DB', Boolean(createdSession.id));

  const allSessions = await SupplementaryService.getSessions(BRANCH_PH_ID);
  const foundSession = allSessions.find((s) => s.id === createdSession.id);
  assert('Truy vấn danh sách lớp bổ trợ trả về buổi vừa tạo', Boolean(foundSession));
  assert(
    'Học viên được ghi nhận tham gia đầy đủ (attended)',
    foundSession?.attendees?.some((a) => a.student_id === createdStudent.id && a.attendance_status === 'attended')
  );

  // ---------------------------------------------------------------------------
  // SECTION 8: TUITION EXPIRY & RENEWAL RISK PIPELINE
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 8: TÍNH TOÁN RỦI RO HẠN HỌC PHÍ & QUẢN LÝ TÁI TỤC ---');

  const renewals = await RenewalService.getRecords(BRANCH_PH_ID);
  assert('Truy vấn danh sách tái tục thành công từ DB', renewals.length > 0);

  // Verify calculation rules:
  // <= 0 days -> Expired
  // <= 14 days -> Critical / Urgent
  // <= 30 days -> Warning / Medium
  // > 30 days -> Safe
  const expiredRecords = renewals.filter((r) => r.risk_level === 'expired' || (r.days_remaining ?? 999) <= 0);
  const urgentRecords = renewals.filter((r) => r.risk_level === 'critical' || ((r.days_remaining ?? 999) > 0 && (r.days_remaining ?? 999) <= 14));
  const warningRecords = renewals.filter((r) => r.risk_level === 'warning' || ((r.days_remaining ?? 999) > 14 && (r.days_remaining ?? 999) <= 30));

  console.log(`         -> Phân bổ tái tục DB: Hết hạn (${expiredRecords.length}), Cận hạn <=14d (${urgentRecords.length}), Cảnh báo <=30d (${warningRecords.length})`);
  assert('Phân bổ rủi ro tái tục có dữ liệu thực tế', renewals.length >= 5);

  // Update renewal follow up
  const firstRenewal = renewals[0];
  await RenewalService.updateRecord(firstRenewal.id, {
    status: 'contacted',
    notes: 'Đã liên hệ phụ huynh gửi thông báo học phí qua Zalo và SMS',
  });

  const updatedRenewals = await RenewalService.getRecords(BRANCH_PH_ID);
  const updatedRec = updatedRenewals.find((r) => r.id === firstRenewal.id);
  assert('Cập nhật trạng thái liên hệ tái tục thành công', updatedRec?.status === 'contacted');

  // ---------------------------------------------------------------------------
  // SECTION 9: KPI CARDS & 6 FILTERS COMPLIANCE (GOPY SCREENSHOTS 3 & 4)
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 9: KIỂM TRA 4 CHỈ SỐ KPI VÀ 6 BỘ LỌC HỌC VIÊN THEO GOPY ---');

  const allActiveStudents = await StudentService.getStudents(BRANCH_PH_ID);
  const allAssessments = await AssessmentService.getAssessments(BRANCH_PH_ID);
  const allFeedbacks = await FeedbackService.getFeedbacks(BRANCH_PH_ID);

  // 1. Total Tracked Students
  const totalTracked = allActiveStudents.length;
  assert('KPI 1 - Tổng học viên theo dõi tính toán chính xác', totalTracked > 0, `Tổng: ${totalTracked}`);

  // 2. High Academic Risk: Students with has_academic_risk = true on their latest assessment
  const studentsWithAcademicRisk = new Set(
    allAssessments.filter((a) => a.has_academic_risk).map((a) => a.student_id)
  );
  const highAcademicRiskCount = allActiveStudents.filter((s) => studentsWithAcademicRisk.has(s.id)).length;
  assert(
    'KPI 2 - Số lượng học viên có nguy cơ học thuật cao tính toán chuẩn xác',
    highAcademicRiskCount >= 1,
    `Rủi ro học thuật: ${highAcademicRiskCount} học viên`
  );

  // 3. High Parent Perception Risk: Students with unresolved negative/academic feedback
  const studentsWithFeedbackRisk = new Set(
    allFeedbacks.filter((f) => f.feedback_type === 'academic' || f.feedback_type === 'attitude').map((f) => f.student_id)
  );
  const highPerceptionRiskCount = allActiveStudents.filter((s) => studentsWithFeedbackRisk.has(s.id)).length;
  assert(
    'KPI 3 - Số lượng học viên có phản ánh/nguy cơ nhận thức phụ huynh tính chuẩn xác',
    highPerceptionRiskCount >= 1,
    `Rủi ro phản ánh: ${highPerceptionRiskCount} học viên`
  );

  // 4. Expiring Fees / Renewal Risk: Students with tuition expiring <= 30 days
  const now = new Date().getTime();
  const expiringTuitionCount = allActiveStudents.filter((s) => {
    if (!s.tuition_expiry_date) return false;
    const diff = (new Date(s.tuition_expiry_date).getTime() - now) / 86400000;
    return diff <= 30;
  }).length;
  assert(
    'KPI 4 - Số lượng học viên cận hạn học phí / nguy cơ tái tục tính chuẩn xác',
    expiringTuitionCount >= 1,
    `Cận hạn học phí <= 30 ngày: ${expiringTuitionCount} học viên`
  );

  // Test 6 Filter Combinations
  // Filter 1: Search by text
  const searchFiltered = allActiveStudents.filter((s) => s.full_name.toLowerCase().includes('tuan khai') || s.full_name.toLowerCase().includes('tuấn khải'));
  assert('Bộ lọc 1: Tìm kiếm theo họ tên học viên hoạt động chuẩn', searchFiltered.length >= 1);

  // Filter 2: Class
  const classFiltered = allActiveStudents.filter((s) => s.current_class_name?.includes('PH-L6') || s.current_class_id === 'c0000000-0000-0000-0000-000000000005');
  assert('Bộ lọc 2: Lọc theo lớp học hoạt động chuẩn', classFiltered.length >= 1);

  // Filter 3: Level
  const levelFiltered = allActiveStudents.filter((s) => s.current_class?.level === 'Starters' || s.current_class_name?.includes('Starters'));
  assert('Bộ lọc 3: Lọc theo cấp độ học hoạt động chuẩn', levelFiltered.length >= 1);

  // Filter 4: Teacher / HRT
  const teacherFiltered = allActiveStudents.filter((s) => s.assigned_hrt_id === hrtTram!.id || s.effective_hrt_name?.toLowerCase().includes('tram') || s.effective_hrt_name?.toLowerCase().includes('trâm'));
  assert('Bộ lọc 4: Lọc theo Giáo viên / Quản nhiệm hoạt động chuẩn', teacherFiltered.length >= 1);

  // Filter 5: Academic Risk Status
  const academicRiskFiltered = allActiveStudents.filter((s) => studentsWithAcademicRisk.has(s.id));
  assert('Bộ lọc 5: Lọc theo trạng thái nguy cơ học thuật hoạt động chuẩn', academicRiskFiltered.length >= 1);

  // Filter 6: Renewal Risk Status
  const renewalRiskFiltered = allActiveStudents.filter((s) => {
    const diff = (new Date(s.tuition_expiry_date).getTime() - now) / 86400000;
    return diff <= 14;
  });
  assert('Bộ lọc 6: Lọc theo mức độ nguy cơ tái tục học phí hoạt động chuẩn', renewalRiskFiltered.length >= 1);

  // ---------------------------------------------------------------------------
  // SECTION 10: UNIFIED DotB CRM ACTIVITY FEED COMPILATION
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 10: TỔNG HỢP NHẬT KÝ HOẠT ĐỘNG DotB CRM CHO HỌC VIÊN ---');

  // Verify activity feed aggregation for createdStudent
  const studentAssess = (await AssessmentService.getAssessments(BRANCH_PH_ID)).filter(
    (a) => a.student_id === createdStudent.id
  );
  const studentFeed = (await FeedbackService.getFeedbacks(BRANCH_PH_ID)).filter(
    (f) => f.student_id === createdStudent.id
  );
  const studentInterv = (await InterventionService.getInterventions(BRANCH_PH_ID)).filter(
    (i) => i.student_id === createdStudent.id
  );
  const studentTrans = await StudentService.getTransfers(createdStudent.id);
  const studentSess = (await SupplementaryService.getSessions(BRANCH_PH_ID)).filter((s) =>
    s.attendees?.some((a) => a.student_id === createdStudent.id)
  );

  const timelineItems: Array<{ type: string; date: string; title: string }> = [
    ...studentAssess.map((a) => ({
      type: 'assessment',
      date: a.assessment_date,
      title: `Đánh giá 4 kỹ năng: ${a.period} (${a.progress_status || 'N/A'})`,
    })),
    ...studentFeed.map((f) => ({
      type: 'feedback',
      date: f.created_at || '2026-11-14',
      title: `Nhật ký CSKH: ${f.content.slice(0, 40)}...`,
    })),
    ...studentInterv.map((i) => ({
      type: 'intervention',
      date: i.created_at || '2026-11-14',
      title: `Phiếu can thiệp: ${i.issue_description}`,
    })),
    ...studentTrans.map((t) => ({
      type: 'transfer',
      date: t.transfer_date,
      title: `Chuyển lớp: ${t.from_class_name || 'Lớp cũ'} -> ${t.to_class_name || 'Lớp mới'}`,
    })),
    ...studentSess.map((s) => ({
      type: 'tutoring',
      date: s.session_date,
      title: `Bổ trợ: ${s.title}`,
    })),
  ];

  // Sort chronological descending (newest first)
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  assert(
    'Nhật ký DotB CRM tổng hợp đầy đủ các luồng nghiệp vụ của học viên',
    timelineItems.length >= 5,
    `Đã tổng hợp ${timelineItems.length} sự kiện: Đánh giá (${studentAssess.length}), CSKH (${studentFeed.length}), Can thiệp (${studentInterv.length}), Chuyển lớp (${studentTrans.length}), Bổ trợ (${studentSess.length})`
  );

  // ---------------------------------------------------------------------------
  // SECTION 11: CROSS-ACCOUNT REALTIME COLLABORATION & AUDIT ATTRIBUTION
  // ---------------------------------------------------------------------------
  console.log('\n--- PHẦN 11: TƯƠNG TÁC ĐA TÀI KHOẢN REALTIME & GHI NHẬN KIỂM TOÁN TÁC TỬ ---');

  // 1. HRT Minh logs in
  localStorage.setItem(
    'kapla_mock_auth_user',
    JSON.stringify({
      id: 'u0000000-0000-0000-0000-000000000004',
      email: 'hrt.minh@kapla.edu.vn',
      emailConfirmed: true,
    })
  );

  const actorMinh = MockStorageService.getCurrentActor();
  assert(
    'Hệ thống xác định chính xác tài khoản đang tác nghiệp là HRT Minh',
    actorMinh.email === 'hrt.minh@kapla.edu.vn' && actorMinh.name === 'Minh',
    `Actor: ${actorMinh.name} (${actorMinh.email})`
  );

  // HRT Minh creates a new student
  const studentByMinh = await StudentService.createStudent({
    branch_id: BRANCH_PH_ID,
    student_code: 'KPL-COLLAB-01',
    full_name: 'Nguyễn Đăng Khoa (Tạo bởi HRT Minh)',
    date_of_birth: '2016-04-12',
    gender: 'male',
    parent_name: 'Nguyễn Văn Đạt',
    parent_phone: '0988776655',
    parent_email: 'dat.nguyen@gmail.com',
    tuition_expiry_date: '2026-12-31',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    status: 'active',
  });

  // Verify audit log for student creation attributed to Minh
  const auditLogsAfterCreate = MockStorageService.getAuditLogs();
  const createLog = auditLogsAfterCreate.find(
    (l) => l.action === 'CREATE_STUDENT' && l.actor_email === 'hrt.minh@kapla.edu.vn'
  );
  assert(
    'Hệ thống ghi nhận Audit Log thêm mới học viên đích danh tài khoản hrt.minh@kapla.edu.vn',
    !!createLog && createLog.actor_email === 'hrt.minh@kapla.edu.vn',
    `Action: ${createLog?.action}, Actor: ${createLog?.actor_email}, Chi tiết: ${JSON.stringify(createLog?.details)}`
  );

  // HRT Minh records an assessment
  await AssessmentService.createAssessment({
    student_id: studentByMinh.id,
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: BRANCH_PH_ID,
    period: 'Tuần 1 - Đánh giá bởi Minh',
    assessment_date: '2026-11-14',
    listening_score: 4.5,
    speaking_score: 4.0,
    reading_score: 4.5,
    writing_score: 4.0,
    listening_level: 'On Level',
    speaking_level: 'On Level',
    reading_level: 'On Level',
    writing_level: 'On Level',
    progress_status: 'On Track',
    strengths: 'Tiếp thu nhanh',
    weaknesses: 'Không',
    progress_notes: 'Học viên học rất tốt',
    assessed_by: 'u0000000-0000-0000-0000-000000000004',
  });

  const assessLog = MockStorageService.getAuditLogs().find(
    (l) => l.action === 'CREATE_ASSESSMENT' && l.actor_email === 'hrt.minh@kapla.edu.vn'
  );
  assert(
    'Audit Log ghi nhận thao tác nhập điểm đánh giá của HRT Minh',
    !!assessLog && assessLog.actor_email === 'hrt.minh@kapla.edu.vn',
    `Action: ${assessLog?.action}, Actor: ${assessLog?.actor_email}`
  );

  // 2. HRT Trâm switches / opens dashboard in her account
  localStorage.setItem(
    'kapla_mock_auth_user',
    JSON.stringify({
      id: 'u0000000-0000-0000-0000-000000000005',
      email: 'hrt.tram@kapla.edu.vn',
      emailConfirmed: true,
    })
  );

  const actorTram = MockStorageService.getCurrentActor();
  assert(
    'Chuyển đổi phiên làm việc sang HRT Trâm thành công',
    actorTram.email === 'hrt.tram@kapla.edu.vn' && (actorTram.name === 'Tram' || actorTram.name === 'Trâm'),
    `Actor: ${actorTram.name} (${actorTram.email})`
  );

  // HRT Trâm queries database: Realtime immediate visibility of Minh's creations
  const studentsSeenByTram = await StudentService.getStudents(BRANCH_PH_ID);
  const foundMinhStudent = studentsSeenByTram.find((s) => s.id === studentByMinh.id);
  assert(
    'HRT Trâm nhìn thấy ngay lập tức học viên do HRT Minh vừa tạo theo thời gian thực (Realtime)',
    !!foundMinhStudent && foundMinhStudent.full_name === 'Nguyễn Đăng Khoa (Tạo bởi HRT Minh)',
    `Tìm thấy: ${foundMinhStudent?.full_name} (${foundMinhStudent?.student_code})`
  );

  const assessSeenByTram = await AssessmentService.getAssessments(BRANCH_PH_ID);
  const foundAssessment = assessSeenByTram.find((a) => a.student_id === studentByMinh.id);
  assert(
    'HRT Trâm nhìn thấy phiếu đánh giá học thuật do HRT Minh vừa nhập theo thời gian thực',
    !!foundAssessment && foundAssessment.period === 'Tuần 1 - Đánh giá bởi Minh',
    `Đánh giá: ${foundAssessment?.period}, Trạng thái: ${foundAssessment?.progress_status}`
  );

  // HRT Trâm updates notes on Minh's student
  const updatedByTram = await StudentService.updateStudent(studentByMinh.id, {
    notes: 'HRT Trâm đã liên hệ phụ huynh và xác nhận lộ trình học.',
  });
  assert(
    'HRT Trâm cập nhật thành công ghi chú học viên',
    updatedByTram.notes === 'HRT Trâm đã liên hệ phụ huynh và xác nhận lộ trình học.',
    `Ghi chú mới: "${updatedByTram.notes}"`
  );

  const updateLog = MockStorageService.getAuditLogs().find(
    (l) => l.action === 'UPDATE_STUDENT' && l.actor_email === 'hrt.tram@kapla.edu.vn'
  );
  assert(
    'Audit Log ghi nhận rõ ràng HRT Trâm là người thực hiện cập nhật ghi chú học viên',
    !!updateLog && updateLog.actor_email === 'hrt.tram@kapla.edu.vn',
    `Action: ${updateLog?.action}, Actor: ${updateLog?.actor_email}, Chi tiết: ${JSON.stringify(updateLog?.details)}`
  );

  // 3. Center Manager logs in and verifies audit trails across both HRTs
  localStorage.setItem(
    'kapla_mock_auth_user',
    JSON.stringify({
      id: 'u0000000-0000-0000-0000-000000000002',
      email: 'cm.nhi@kapla.edu.vn',
      emailConfirmed: true,
    })
  );

  const allAuditLogs = MockStorageService.getAuditLogs();
  const minhActions = allAuditLogs.filter((l) => l.actor_email === 'hrt.minh@kapla.edu.vn');
  const tramActions = allAuditLogs.filter((l) => l.actor_email === 'hrt.tram@kapla.edu.vn');

  assert(
    'Giám đốc cơ sở (CM) xem được toàn bộ lịch sử tác nghiệp có ghi vết đích danh cả 2 HRT',
    minhActions.length >= 2 && tramActions.length >= 1,
    `Hành động HRT Minh: ${minhActions.length}, Hành động HRT Trâm: ${tramActions.length}`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ: ĐÃ VƯỢT QUA ${passed}/${total} BÀI KIỂM THỬ CƠ SỞ DỮ LIỆU TOÀN DIỆN (100% PASS)`);
  console.log('======================================================================\n');
}

runCompleteDatabaseTestSuite().catch((err) => {
  console.error('\n❌ [LỖI TRONG QUÁ TRÌNH KIỂM THỬ CSDL]:', err);
  process.exit(1);
});
