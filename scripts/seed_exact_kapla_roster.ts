// ==============================================================================
// KAPLA — Seed Exact Staff Roster (PH Campus Only) & Authentic Demo Dataset
// ==============================================================================

import WebSocket from 'ws';
(globalThis as any).WebSocket = WebSocket;
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BRANCH_PH_ID = 'a0000000-0000-0000-0000-000000000001';

const EXACT_STAFF = [
  {
    id: '10000000-0000-0000-0000-000000000000',
    email: 'admin@kapla.edu.vn',
    full_name: 'Admin',
    system_role: 'system_admin',
    role: 'Quản trị hệ thống',
    phone: '028 7300 9088',
  },
  {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'cm.nhi@kapla.edu.vn',
    full_name: 'Phương Nhi',
    system_role: 'staff',
    role: 'CM',
    phone: '0912 345 678',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    email: 'ht.jamie@kapla.edu.vn',
    full_name: 'Jamie',
    system_role: 'staff',
    role: 'Head Teacher',
    phone: '0913 456 789',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    email: 'hrt.minh@kapla.edu.vn',
    full_name: 'Minh',
    system_role: 'staff',
    role: 'HRT',
    phone: '0914 567 890',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    email: 'hrt.tram@kapla.edu.vn',
    full_name: 'Trâm',
    system_role: 'staff',
    role: 'HRT',
    phone: '0915 678 901',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    email: 'hrt.vy@kapla.edu.vn',
    full_name: 'Vy',
    system_role: 'staff',
    role: 'HRT',
    phone: '0916 789 012',
  },
];

async function run() {
  console.log('=== SEEDING EXACT KAPLA ROSTER (PH CAMPUS ONLY) ===');

  try {
    await supabase.rpc('disable_audit_triggers');
  } catch {}

  // 1. Clean out existing transactional tables
  console.log('1. Truncating transactional tables...');
  await supabase.from('email_dispatch_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('email_dispatch_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('renewal_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('supplementary_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('supplementary_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('parent_feedbacks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('interventions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('student_assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('student_hrt_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('class_transfers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('branch_memberships').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Purge auth users not in EXACT_STAFF
  const allowedEmails = EXACT_STAFF.map((s) => s.email);
  const { data: userList } = await supabase.auth.admin.listUsers();
  for (const u of userList?.users || []) {
    if (!allowedEmails.includes(u.email || '')) {
      console.log(' - Deleting auth user:', u.email);
      await supabase.auth.admin.deleteUser(u.id);
    }
  }

  // Delete profiles not in allowed
  await supabase.from('profiles').delete().not('email', 'in', `(${allowedEmails.map((e) => `'${e}'`).join(',')})`);

  // 2. Ensure Branch: KAPLA Phạm Hùng
  console.log('2. Upserting Branch KAPLA Phạm Hùng...');
  await supabase.from('branches').upsert([
    {
      id: BRANCH_PH_ID,
      code: 'PH',
      name: 'KAPLA Phạm Hùng',
      address: 'Tầng trệt & lửng, Topaz Elite, Phường 4, Quận 8, TP.HCM',
      phone: '028 7300 9088',
      status: 'active',
    },
  ]);

  // 3. Upsert Auth Users & Profiles & Memberships
  console.log('3. Upserting Staff Accounts...');
  for (const staff of EXACT_STAFF) {
    const existing = userList?.users.find((u) => u.email === staff.email);
    if (!existing) {
      await supabase.auth.admin.createUser({
        email: staff.email,
        password: 'Kapla@2026',
        email_confirm: true,
        user_metadata: { full_name: staff.full_name },
      });
    } else {
      await supabase.auth.admin.updateUserById(existing.id, {
        password: 'Kapla@2026',
        email_confirm: true,
      });
    }

    // Upsert profile
    const uid = existing?.id || staff.id;
    await supabase.from('profiles').upsert({
      id: uid,
      email: staff.email,
      full_name: staff.full_name,
      system_role: staff.system_role,
      status: 'active',
      phone: staff.phone,
      preferred_branch_id: BRANCH_PH_ID,
    });

    // Upsert membership
    await supabase.from('branch_memberships').insert({
      user_id: uid,
      branch_id: BRANCH_PH_ID,
      role: staff.role,
      is_primary: true,
      status: 'active',
    });

    staff.id = uid; // update local ref
  }

  // 4. Classes at Phạm Hùng
  console.log('4. Seeding Classes at Phạm Hùng...');
  const hrtMinhId = EXACT_STAFF.find((s) => s.email === 'hrt.minh@kapla.edu.vn')!.id;
  const hrtTramId = EXACT_STAFF.find((s) => s.email === 'hrt.tram@kapla.edu.vn')!.id;
  const hrtVyId = EXACT_STAFF.find((s) => s.email === 'hrt.vy@kapla.edu.vn')!.id;
  const htJamieId = EXACT_STAFF.find((s) => s.email === 'ht.jamie@kapla.edu.vn')!.id;

  const CLASSES = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      branch_id: BRANCH_PH_ID,
      name: 'PH-Starters-01',
      level: 'Starters',
      default_hrt_id: hrtMinhId,
      main_teacher_id: htJamieId,
      schedule: 'Thứ 2 & 4 (17:30 - 19:00)',
      status: 'active',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      branch_id: BRANCH_PH_ID,
      name: 'PH-Movers-02',
      level: 'Movers',
      default_hrt_id: hrtMinhId,
      main_teacher_id: htJamieId,
      schedule: 'Thứ 3 & 5 (17:30 - 19:00)',
      status: 'active',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      branch_id: BRANCH_PH_ID,
      name: 'PH-Flyers-01',
      level: 'Flyers',
      default_hrt_id: hrtTramId,
      main_teacher_id: htJamieId,
      schedule: 'Thứ 7 & CN (09:00 - 10:30)',
      status: 'active',
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      branch_id: BRANCH_PH_ID,
      name: 'PH-Robotics-01',
      level: 'Starters',
      default_hrt_id: hrtVyId,
      main_teacher_id: htJamieId,
      schedule: 'Chủ Nhật (15:00 - 17:00)',
      status: 'active',
    },
  ];

  await supabase.from('classes').insert(CLASSES);

  // 5. Students at Phạm Hùng
  console.log('5. Seeding Students at Phạm Hùng...');
  const STUDENTS = [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-001',
      full_name: 'Nguyễn Bình An',
      date_of_birth: '2017-05-10',
      gender: 'male',
      parent_name: 'Nguyễn Văn Minh (Bố)',
      parent_phone: '0901 112 223',
      parent_email: 'minh.nguyen@gmail.com',
      tuition_expiry_date: '2026-12-31',
      status: 'active',
      current_class_id: CLASSES[0].id,
      assigned_hrt_id: hrtMinhId,
      notes: 'Học viên tự tin giao tiếp chuẩn Oxford, tiếp thu nhanh.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-002',
      full_name: 'Trần Thái Bình',
      date_of_birth: '2017-08-20',
      gender: 'male',
      parent_name: 'Trần Thị Hà (Mẹ)',
      parent_phone: '0902 223 334',
      parent_email: 'ha.tran@gmail.com',
      tuition_expiry_date: '2026-11-20',
      status: 'warning',
      current_class_id: CLASSES[0].id,
      assigned_hrt_id: null,
      notes: 'Học phí sắp hết hạn (còn 7 ngày), HRT Minh đã liên hệ phụ huynh.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-003',
      full_name: 'Lê Quốc Cường',
      date_of_birth: '2016-03-15',
      gender: 'male',
      parent_name: 'Lê Văn Sang (Bố)',
      parent_phone: '0903 334 445',
      parent_email: 'sang.le@gmail.com',
      tuition_expiry_date: '2027-02-28',
      status: 'active',
      current_class_id: CLASSES[1].id,
      assigned_hrt_id: null,
      notes: 'Học lực xuất sắc, phát âm chuẩn Oxford, chuẩn bị thi Cambridge Movers.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000004',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-004',
      full_name: 'Đặng Bảo Nam',
      date_of_birth: '2017-11-02',
      gender: 'male',
      parent_name: 'Đặng Quốc Tuấn (Bố)',
      parent_phone: '0904 556 677',
      parent_email: 'tuan.dang@gmail.com',
      tuition_expiry_date: '2026-11-10',
      status: 'expired',
      current_class_id: CLASSES[0].id,
      assigned_hrt_id: null,
      notes: 'Học phí quá hạn 3 ngày, cần liên hệ phụ huynh hỗ trợ đóng phí.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000005',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-005',
      full_name: 'Phạm Minh Khôi',
      date_of_birth: '2015-09-18',
      gender: 'male',
      parent_name: 'Phạm Hải Đăng (Bố)',
      parent_phone: '0905 667 788',
      parent_email: 'dang.pham@gmail.com',
      tuition_expiry_date: '2026-11-25',
      status: 'warning',
      current_class_id: CLASSES[2].id,
      assigned_hrt_id: null,
      notes: 'Cấp độ Flyers, gia đình mong muốn thi lấy chứng chỉ Cambridge 15 khiên.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000006',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-006',
      full_name: 'Hoàng Mai Chi',
      date_of_birth: '2016-07-25',
      gender: 'female',
      parent_name: 'Hoàng Kim Loan (Mẹ)',
      parent_phone: '0906 778 899',
      parent_email: 'loan.hoang@gmail.com',
      tuition_expiry_date: '2027-01-15',
      status: 'active',
      current_class_id: CLASSES[1].id,
      assigned_hrt_id: null,
      notes: 'Học tập chăm chỉ, hoàn thành bài tập về nhà đầy đủ.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000007',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-007',
      full_name: 'Vũ Gia Huy',
      date_of_birth: '2015-12-14',
      gender: 'male',
      parent_name: 'Vũ Đình Trọng (Bố)',
      parent_phone: '0908 990 011',
      parent_email: 'trong.vu@gmail.com',
      tuition_expiry_date: '2026-11-18',
      status: 'warning',
      current_class_id: CLASSES[2].id,
      assigned_hrt_id: null,
      notes: 'Học phí sắp hết hạn (5 ngày), HRT Trâm đã nhắc lịch tái tục.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000008',
      branch_id: BRANCH_PH_ID,
      student_code: 'KAP-PH-008',
      full_name: 'Hoàng Tiến Dũng',
      date_of_birth: '2017-01-05',
      gender: 'male',
      parent_name: 'Hoàng Văn Phúc (Bố)',
      parent_phone: '0907 889 900',
      parent_email: 'phuc.hoang@gmail.com',
      tuition_expiry_date: '2026-12-20',
      status: 'active',
      current_class_id: CLASSES[3].id,
      assigned_hrt_id: null,
      notes: 'Đam mê Robotics STEM, hòa đồng với các bạn trong lớp.',
    },
  ];

  await supabase.from('students').insert(STUDENTS);

  // 6. Care Tasks
  console.log('6. Seeding Care Tasks...');
  await supabase.from('student_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('student_tasks').insert([
    {
      student_id: STUDENTS[0].id,
      branch_id: BRANCH_PH_ID,
      assigned_hrt_id: hrtMinhId,
      task_type: 'weekly_report',
      title: 'Báo cáo tiến độ tuần 4 cho phụ huynh em Bình An',
      due_date: '2026-11-16',
      status: 'pending',
      notes: 'Kèm video thực hành nói với GV Jamie.',
    },
    {
      student_id: STUDENTS[1].id,
      branch_id: BRANCH_PH_ID,
      assigned_hrt_id: hrtMinhId,
      task_type: 'tuition_reminder',
      title: 'Nhắc tái tục học phí cho bé Thái Bình (còn 7 ngày)',
      due_date: '2026-11-18',
      status: 'pending',
      notes: 'Tư vấn lộ trình Cambridge Starters giai đoạn 2.',
    },
    {
      student_id: STUDENTS[3].id,
      branch_id: BRANCH_PH_ID,
      assigned_hrt_id: hrtMinhId,
      task_type: 'tuition_urgent',
      title: 'Xử lý học phí quá hạn bé Bảo Nam (quá hạn 3 ngày)',
      due_date: '2026-11-14',
      status: 'in_progress',
      notes: 'Phụ huynh hẹn chuyển khoản vào thứ 7 tuần này.',
    },
    {
      student_id: STUDENTS[4].id,
      branch_id: BRANCH_PH_ID,
      assigned_hrt_id: hrtTramId,
      task_type: 'cambridge_guidance',
      title: 'Hướng dẫn luyện đề Flyers cho bé Minh Khôi',
      due_date: '2026-11-20',
      status: 'completed',
      notes: 'Đã hoàn thành bàn giao bộ đề mẫu 15 khiên.',
    },
  ]);

  // 7. Assessments
  console.log('7. Seeding Assessments...');
  await supabase.from('student_assessments').insert([
    {
      student_id: STUDENTS[0].id,
      branch_id: BRANCH_PH_ID,
      assessed_by: htJamieId,
      assessment_period: 'Tháng 11/2026 (Giữa kỳ)',
      listening_shields: 5,
      speaking_shields: 5,
      reading_shields: 4,
      writing_shields: 3,
      overall_rating: 'good',
      strengths: 'Phát âm tự nhiên chuẩn Oxford, tự tin tương tác.',
      areas_for_improvement: 'Cần rèn luyện thêm cách viết câu hoàn chỉnh (Sentence structure).',
      teacher_notes: 'Đã xếp lịch phụ đạo bổ trợ kỹ năng Viết vào tối thứ 6.',
    },
    {
      student_id: STUDENTS[2].id,
      branch_id: BRANCH_PH_ID,
      assessed_by: htJamieId,
      assessment_period: 'Tháng 11/2026 (Giữa kỳ)',
      listening_shields: 5,
      speaking_shields: 5,
      reading_shields: 5,
      writing_shields: 4,
      overall_rating: 'good',
      strengths: 'Kỹ năng toàn diện, vốn từ vựng phong phú.',
      areas_for_improvement: 'Tiếp tục duy trì tốc độ đọc hiểu.',
      teacher_notes: 'Đủ điều kiện tham gia kỳ thi thử Cambridge Movers đạt tối thiểu 14/15 khiên.',
    },
  ]);

  // 8. Interventions
  console.log('8. Seeding Interventions...');
  await supabase.from('interventions').insert([
    {
      student_id: STUDENTS[0].id,
      branch_id: BRANCH_PH_ID,
      status: 'open',
      priority: 'high',
      issue_description: 'Kỹ năng Viết đạt 3/5 khiên, gặp khó khăn cấu trúc câu ghép.',
      action_plan: 'Kèm cặp 1-1 tăng cường kỹ năng Sentence building, giao bài tập viết có dàn ý.',
      target_resolution_date: '2026-11-25',
      assigned_staff_id: hrtMinhId,
      created_by: htJamieId,
    },
  ]);

  // 9. Parent Feedback
  console.log('9. Seeding Parent Feedback...');
  await supabase.from('parent_feedbacks').insert([
    {
      student_id: STUDENTS[0].id,
      branch_id: BRANCH_PH_ID,
      parent_name: 'Nguyễn Văn Minh',
      parent_phone: '0901 112 223',
      feedback_type: 'academic_concern',
      channel: 'phone',
      content: 'Phụ huynh quan tâm điểm Viết của bé Bình An, mong trung tâm hỗ trợ kèm thêm.',
      assigned_staff_id: hrtMinhId,
      status: 'in_progress',
      action_notes: 'HRT Minh đã trao đổi lộ trình phụ đạo với Head Teacher Jamie.',
    },
    {
      student_id: STUDENTS[7].id,
      branch_id: BRANCH_PH_ID,
      parent_name: 'Hoàng Văn Phúc',
      parent_phone: '0907 889 900',
      feedback_type: 'compliment',
      channel: 'direct',
      content: 'Bé Tiến Dũng rất hào hứng với phòng Lab Robotics, cảm ơn trung tâm.',
      assigned_staff_id: hrtVyId,
      status: 'resolved',
      action_notes: 'Đã gửi tặng học viên huy hiệu Robotics Star.',
    },
  ]);

  // 10. Supplementary Sessions
  console.log('10. Seeding Supplementary Sessions...');
  const { data: sess } = await supabase.from('supplementary_sessions').insert([
    {
      branch_id: BRANCH_PH_ID,
      teacher_id: htJamieId,
      session_type: 'group',
      topic: 'Kỹ năng viết câu chuẩn Cambridge Starters',
      target_skill: 'writing',
      learning_objectives: 'Thực hành viết câu miêu tả tranh có hỗ trợ từ vựng Oxford.',
      scheduled_date: '2026-11-15',
      start_time: '18:00',
      end_time: '19:00',
      room: 'Phòng Oxford A1',
      status: 'upcoming',
    },
  ]).select().single();

  if (sess) {
    await supabase.from('supplementary_attendance').insert([
      {
        session_id: sess.id,
        student_id: STUDENTS[0].id,
        attendance_status: 'present',
        shields_earned: 4,
        teacher_feedback: 'Em Bình An tiến bộ rõ rệt trong việc đặt câu.',
      },
    ]);
  }

  // 11. Renewal Tracking
  console.log('11. Seeding Renewal Tracking...');
  await supabase.from('renewal_tracking').insert([
    {
      student_id: STUDENTS[1].id,
      branch_id: BRANCH_PH_ID,
      expiration_date: '2026-11-20',
      days_remaining: 7,
      risk_level: 'high',
      status: 'contacted',
      assigned_hrt_id: hrtMinhId,
      target_package: 'Gói 6 tháng Cambridge Starters Pro',
      contact_progress: 'HRT Minh đã tư vấn qua Zalo, phụ huynh đồng ý gia hạn vào ngày 18/11.',
    },
    {
      student_id: STUDENTS[3].id,
      branch_id: BRANCH_PH_ID,
      expiration_date: '2026-11-10',
      days_remaining: -3,
      risk_level: 'high',
      status: 'action_needed',
      assigned_hrt_id: hrtMinhId,
      target_package: 'Gói 12 tháng Starters & STEAM',
      contact_progress: 'Phụ huynh đi công tác, hẹn thứ 7 ghé trung tâm đóng học phí.',
    },
    {
      student_id: STUDENTS[4].id,
      branch_id: BRANCH_PH_ID,
      expiration_date: '2026-11-25',
      days_remaining: 12,
      risk_level: 'medium',
      status: 'monitoring',
      assigned_hrt_id: hrtTramId,
      target_package: 'Gói 6 tháng Flyers Intensive',
      contact_progress: 'Đã gửi thư ngỏ tiến độ học tập và ưu đãi tái tục sớm.',
    },
  ]);

  console.log('=== SEED COMPLETED SUCCESSFULLY! ===');
}

run().catch(console.error);
