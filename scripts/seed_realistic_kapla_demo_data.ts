// ==============================================================================
// KAPLA — Master Clean & Seed Realistic Demo Dataset
// Populates authentic students, personnel roles, classes, assessments,
// interventions, parent feedback, supplementary tutoring, and renewal tracking.
// ==============================================================================

import WebSocket from 'ws';
(globalThis as any).WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Fixed valid hexadecimal UUIDs for predictable references across tables
export const IDS = {
  // Branches (hex 'a')
  BRANCH_PH: 'a0000000-0000-0000-0000-000000000001',
  BRANCH_BT: 'a0000000-0000-0000-0000-000000000002',
  BRANCH_DA: 'a0000000-0000-0000-0000-000000000003',

  // Classes (hex 'c')
  CLASS_PH_STARTERS: 'c0000000-0000-0000-0000-000000000001',
  CLASS_PH_MOVERS: 'c0000000-0000-0000-0000-000000000002',
  CLASS_PH_FLYERS: 'c0000000-0000-0000-0000-000000000003',
  CLASS_BT_STARTERS: 'c0000000-0000-0000-0000-000000000004',
  CLASS_BT_FLYERS: 'c0000000-0000-0000-0000-000000000005',

  // Students (hex 'b')
  STU_AN: 'b0000000-0000-0000-0000-000000000001',
  STU_BINH: 'b0000000-0000-0000-0000-000000000002',
  STU_CUONG: 'b0000000-0000-0000-0000-000000000003',
  STU_NAM: 'b0000000-0000-0000-0000-000000000004',
  STU_KHOI: 'b0000000-0000-0000-0000-000000000005',
  STU_CHI: 'b0000000-0000-0000-0000-000000000006',
  STU_DUNG: 'b0000000-0000-0000-0000-000000000007',
  STU_HUY: 'b0000000-0000-0000-0000-000000000008',
};

const DEMO_STAFF_ACCOUNTS = [
  {
    email: 'admin@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Quản trị viên Hệ Thống',
    systemRole: 'system_admin' as const,
    branchId: IDS.BRANCH_PH,
    role: 'CM' as const,
    title: '👑 Quản trị hệ thống (Toàn quyền)',
  },
  {
    email: 'cm.phamhung@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Hoàng Minh Tuấn (CM Phạm Hùng)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'CM' as const,
    title: 'Giám đốc cơ sở KAPLA Phạm Hùng',
  },
  {
    email: 'cm.binhtan@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Lê Hoàng Long (CM Bình Tân)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_BT,
    role: 'CM' as const,
    title: 'Giám đốc cơ sở KAPLA Bình Tân',
  },
  {
    email: 'ht.phamhung@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Nguyễn Thanh Sơn (Head Teacher)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'Head Teacher' as const,
    title: 'Trưởng bộ môn Học thuật Phạm Hùng',
  },
  {
    email: 'teacher.ph@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Teacher Alex Morgan (Bản ngữ Oxford)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'Main Teacher' as const,
    title: 'Giáo viên chính bản ngữ Oxford',
  },
  {
    email: 'hrt.mai@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Võ Tuyết Mai (HRT Starters & Flyers)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'HRT' as const,
    title: 'Giáo viên chủ nhiệm lớp Starters 01',
  },
  {
    email: 'hrt.linh@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Trần Gia Linh (HRT Movers & Riêng An)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'HRT' as const,
    title: 'Giáo viên chủ nhiệm lớp Movers & HRT riêng em An',
  },
  {
    email: 'ta.phuong@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Bùi Bích Phương (Trợ Giảng TA)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'TA' as const,
    title: 'Trợ giảng lớp học',
  },
  {
    email: 'teacher.support@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Cô Hoàng Thị Lan (GV Bổ Trợ)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'Supplementary Teacher' as const,
    title: 'Giáo viên chuyên trách học bổ trợ',
  },
  {
    email: 'cskh.ph@kapla.edu.vn',
    password: 'Kapla@2026',
    fullName: 'Phan Thảo Vy (CSKH & Tái Tục)',
    systemRole: 'staff' as const,
    branchId: IDS.BRANCH_PH,
    role: 'CSKH' as const,
    title: 'Nhân viên CSKH & Tư vấn tái tục',
  },
];

async function main() {
  console.log('======================================================================');
  console.log('  KAPLA — DỌN RÁC DATABASE & KHỞI TẠO BỘ DỮ LIỆU DEMO CHUẨN XÁC');
  console.log('======================================================================\n');

  // STEP 1: CLEAN UP DIRTY / TEST DATA
  console.log('🧹 [1/8] Dọn dẹp các bản ghi rác và dữ liệu thử nghiệm có timestamp...');

  // Truncate / delete transactional tables
  await admin.from('email_dispatch_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('email_dispatch_queue').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('renewal_tracking').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('supplementary_attendees').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('supplementary_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('parent_feedbacks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('interventions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('student_assessments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('student_tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('student_hrt_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('class_transfers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('classes').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete leftover test users (emails with numbers or test prefixes)
  const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const demoEmailSet = new Set(DEMO_STAFF_ACCOUNTS.map((a) => a.email));

  let deletedUsers = 0;
  for (const u of userList?.users || []) {
    if (!demoEmailSet.has(u.email || '')) {
      await admin.auth.admin.deleteUser(u.id);
      deletedUsers++;
    }
  }
  console.log(`   ✓ Đã xóa dữ liệu bảng rác và ${deletedUsers} tài khoản test tạm thời.`);

  // STEP 2: ENSURE CORE BRANCHES
  console.log('🏢 [2/8] Thiết lập 03 cơ sở đào tạo chuẩn...');
  const branches = [
    {
      id: IDS.BRANCH_PH,
      code: 'PH',
      name: 'KAPLA Phạm Hùng',
      address: 'Tầng trệt & lửng, Topaz Elite, Phường 4, Quận 8, TP.HCM',
      phone: '028 7300 9088',
      status: 'active',
    },
    {
      id: IDS.BRANCH_BT,
      code: 'BT',
      name: 'KAPLA Bình Tân',
      address: '35 Vành Đai Trong, P. Bình Trị Đông B, Q. Bình Tân, TP.HCM',
      phone: '028 7300 9089',
      status: 'active',
    },
    {
      id: IDS.BRANCH_DA,
      code: 'DA',
      name: 'KAPLA Dĩ An',
      address: '108 Võ Thị Sáu, P. Đông Hòa, TP. Dĩ An, Bình Dương',
      phone: '028 7300 9090',
      status: 'active',
    },
  ];

  for (const b of branches) {
    const { error } = await admin.from('branches').upsert(b, { onConflict: 'code' });
    if (error) console.error('Error upsert branch:', b.code, error);
  }
  console.log('   ✓ Đã cập nhật 3 cơ sở: Phạm Hùng (PH), Bình Tân (BT), Dĩ An (DA).');

  // STEP 3: SEED AUTHENTIC STAFF ACCOUNTS
  console.log('👥 [3/8] Khởi tạo 10 tài khoản nhân sự thật với đầy đủ các vai trò...');
  const staffIdMap: Record<string, string> = {};

  const { data: refreshedUserList } = await admin.auth.admin.listUsers({ perPage: 1000 });

  for (const acc of DEMO_STAFF_ACCOUNTS) {
    let user = (refreshedUserList?.users || []).find((u) => u.email === acc.email);

    if (!user) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, preferred_branch_id: acc.branchId },
      });
      if (error) {
        console.error(`   Lỗi tạo user ${acc.email}:`, error);
        continue;
      }
      user = created.user;
    } else {
      await admin.auth.admin.updateUserById(user.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.fullName, preferred_branch_id: acc.branchId },
      });
    }

    if (!user) continue;
    staffIdMap[acc.email] = user.id;

    // Update profile
    await admin
      .from('profiles')
      .update({
        status: 'active',
        full_name: acc.fullName,
        system_role: acc.systemRole,
        preferred_branch_id: acc.branchId,
        rejection_reason: null,
      })
      .eq('id', user.id);

    // Upsert branch membership
    const { data: mems } = await admin
      .from('branch_memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('branch_id', acc.branchId);

    if (!mems || mems.length === 0) {
      await admin.from('branch_memberships').insert({
        user_id: user.id,
        branch_id: acc.branchId,
        role: acc.role,
        is_primary: true,
        status: 'active',
      });
    } else {
      await admin
        .from('branch_memberships')
        .update({
          role: acc.role,
          status: 'active',
          is_primary: true,
        })
        .eq('id', mems[0].id);
    }

    console.log(`   ✓ [${acc.role}] ${acc.fullName} (${acc.email})`);
  }

  const maiId = staffIdMap['hrt.mai@kapla.edu.vn'];
  const linhId = staffIdMap['hrt.linh@kapla.edu.vn'];
  const htId = staffIdMap['ht.phamhung@kapla.edu.vn'];
  const cmPhId = staffIdMap['cm.phamhung@kapla.edu.vn'];
  const cskhId = staffIdMap['cskh.ph@kapla.edu.vn'];
  const supportTeacherId = staffIdMap['teacher.support@kapla.edu.vn'];

  // STEP 4: SEED CLASSES
  console.log('📚 [4/8] Khởi tạo các lớp học chuẩn chi nhánh...');
  const classesData = [
    {
      id: IDS.CLASS_PH_STARTERS,
      branch_id: IDS.BRANCH_PH,
      name: 'PH-Starters-01',
      level: 'Starters',
      default_hrt_id: maiId,
      schedule: 'Thứ 2 & 4 (17:30 - 19:00)',
      status: 'active',
    },
    {
      id: IDS.CLASS_PH_MOVERS,
      branch_id: IDS.BRANCH_PH,
      name: 'PH-Movers-02',
      level: 'Movers',
      default_hrt_id: linhId,
      schedule: 'Thứ 3 & 5 (18:00 - 19:30)',
      status: 'active',
    },
    {
      id: IDS.CLASS_PH_FLYERS,
      branch_id: IDS.BRANCH_PH,
      name: 'PH-Flyers-01',
      level: 'Flyers',
      default_hrt_id: maiId,
      schedule: 'Thứ 7 & CN (09:00 - 10:30)',
      status: 'active',
    },
    {
      id: IDS.CLASS_BT_STARTERS,
      branch_id: IDS.BRANCH_BT,
      name: 'BT-Starters-01',
      level: 'Starters',
      schedule: 'Thứ 3 & 5 (17:30 - 19:00)',
      status: 'active',
    },
    {
      id: IDS.CLASS_BT_FLYERS,
      branch_id: IDS.BRANCH_BT,
      name: 'BT-Flyers-01',
      level: 'Flyers',
      schedule: 'Thứ 7 & CN (14:30 - 16:00)',
      status: 'active',
    },
  ];

  for (const c of classesData) {
    const { error } = await admin.from('classes').upsert(c);
    if (error) console.error('Error inserting class:', c.name, error);
  }
  console.log('   ✓ Đã tạo 5 lớp: PH-Starters-01, PH-Movers-02, PH-Flyers-01, BT-Starters-01, BT-Flyers-01');

  // STEP 5: SEED REALISTIC STUDENTS & ENROLLMENTS & HRT PRECEDENCE
  console.log('🎒 [5/8] Khởi tạo học viên thật và quy tắc phân công HRT...');
  const studentsData = [
    {
      id: IDS.STU_AN,
      branch_id: IDS.BRANCH_PH,
      student_code: 'KAP-PH-001',
      full_name: 'Nguyễn Bình An',
      date_of_birth: '2017-05-10',
      gender: 'male',
      parent_name: 'Nguyễn Văn Minh (Bố)',
      parent_phone: '0901 112 223',
      parent_email: 'minh.nguyen@gmail.com',
      tuition_expiry_date: '2026-12-31',
      status: 'active',
      current_class_id: IDS.CLASS_PH_STARTERS,
      assigned_hrt_id: linhId, // Phân công riêng cho Linh!
      notes: 'Học viên có năng khiếu giao tiếp, tự tin nói chuyện với GV bản ngữ, đang được kèm bổ trợ viết câu.',
    },
    {
      id: IDS.STU_BINH,
      branch_id: IDS.BRANCH_PH,
      student_code: 'KAP-PH-002',
      full_name: 'Trần Thái Bình',
      date_of_birth: '2017-08-20',
      gender: 'male',
      parent_name: 'Trần Thị Hà (Mẹ)',
      parent_phone: '0902 223 334',
      parent_email: 'ha.tran@gmail.com',
      tuition_expiry_date: '2026-11-20', // Sắp hết hạn 7 ngày
      status: 'warning',
      current_class_id: IDS.CLASS_PH_STARTERS,
      assigned_hrt_id: null, // Theo lớp -> Mai
      notes: 'Phụ huynh quan tâm tiến độ chuẩn Oxford, HRT Mai đã liên hệ tư vấn gói 6 tháng Starters 2.',
    },
    {
      id: IDS.STU_CUONG,
      branch_id: IDS.BRANCH_PH,
      student_code: 'KAP-PH-003',
      full_name: 'Lê Quốc Cường',
      date_of_birth: '2016-03-15',
      gender: 'male',
      parent_name: 'Lê Văn Sang (Bố)',
      parent_phone: '0903 334 445',
      parent_email: 'sang.le@gmail.com',
      tuition_expiry_date: '2027-02-28',
      status: 'active',
      current_class_id: IDS.CLASS_PH_MOVERS,
      assigned_hrt_id: null, // Theo lớp -> Linh
      notes: 'Học lực xuất sắc, phát âm chuẩn Oxford, chuẩn bị thi Cambridge Movers.',
    },
    {
      id: IDS.STU_NAM,
      branch_id: IDS.BRANCH_PH,
      student_code: 'KAP-PH-004',
      full_name: 'Đặng Bảo Nam',
      date_of_birth: '2017-11-02',
      gender: 'male',
      parent_name: 'Đặng Quốc Tuấn (Bố)',
      parent_phone: '0904 556 677',
      parent_email: 'tuan.dang@gmail.com',
      tuition_expiry_date: '2026-11-10', // Đã quá hạn 3 ngày
      status: 'expired',
      current_class_id: IDS.CLASS_PH_STARTERS,
      assigned_hrt_id: null, // Theo lớp -> Mai
      notes: 'Học phí quá hạn 3 ngày, CSKH và HRT đã liên hệ nhắc phụ huynh đóng phí tuần này.',
    },
    {
      id: IDS.STU_KHOI,
      branch_id: IDS.BRANCH_PH,
      student_code: 'KAP-PH-005',
      full_name: 'Phạm Minh Khôi',
      date_of_birth: '2015-09-18',
      gender: 'male',
      parent_name: 'Phạm Hải Đăng (Bố)',
      parent_phone: '0905 667 788',
      parent_email: 'dang.pham@gmail.com',
      tuition_expiry_date: '2026-11-25', // Sắp hết hạn 12 ngày
      status: 'warning',
      current_class_id: IDS.CLASS_PH_FLYERS,
      assigned_hrt_id: null, // Theo lớp -> Mai
      notes: 'Cấp độ Flyers, gia đình có nguyện vọng thi lấy chứng chỉ quốc tế 15 khiên.',
    },
    {
      id: IDS.STU_CHI,
      branch_id: IDS.BRANCH_PH,
      student_code: 'KAP-PH-006',
      full_name: 'Hoàng Mai Chi',
      date_of_birth: '2016-07-25',
      gender: 'female',
      parent_name: 'Hoàng Kim Loan (Mẹ)',
      parent_phone: '0906 778 899',
      parent_email: 'loan.hoang@gmail.com',
      tuition_expiry_date: '2027-01-15',
      status: 'active',
      current_class_id: IDS.CLASS_PH_MOVERS,
      assigned_hrt_id: null, // Theo lớp -> Linh
      notes: 'Rất tích cực phát biểu, hoàn thành bài tập về nhà đầy đủ.',
    },
    {
      id: IDS.STU_DUNG,
      branch_id: IDS.BRANCH_BT,
      student_code: 'KAP-BT-001',
      full_name: 'Hoàng Tiến Dũng',
      date_of_birth: '2017-01-05',
      gender: 'male',
      parent_name: 'Hoàng Văn Tuấn (Bố)',
      parent_phone: '0907 889 900',
      parent_email: 'tuan.hoang@gmail.com',
      tuition_expiry_date: '2026-12-20',
      status: 'active',
      current_class_id: IDS.CLASS_BT_STARTERS,
      assigned_hrt_id: null,
      notes: 'Học viên chi nhánh Bình Tân, tiếp thu nhanh.',
    },
    {
      id: IDS.STU_HUY,
      branch_id: IDS.BRANCH_BT,
      student_code: 'KAP-BT-002',
      full_name: 'Vũ Gia Huy',
      date_of_birth: '2015-12-14',
      gender: 'male',
      parent_name: 'Vũ Đình Trọng (Bố)',
      parent_phone: '0908 990 011',
      parent_email: 'trong.vu@gmail.com',
      tuition_expiry_date: '2026-11-18', // Sắp hết hạn 5 ngày
      status: 'warning',
      current_class_id: IDS.CLASS_BT_FLYERS,
      assigned_hrt_id: null,
      notes: 'Chuẩn bị thi chứng chỉ Flyers tại cơ sở Bình Tân.',
    },
  ];

  for (const s of studentsData) {
    const { error: stuErr } = await admin.from('students').upsert(s);
    if (stuErr) console.error('Error inserting student:', s.student_code, stuErr);

    // Create enrollment
    const { error: enrErr } = await admin.from('enrollments').insert({
      student_id: s.id,
      class_id: s.current_class_id,
      branch_id: s.branch_id,
      start_date: '2026-10-01',
      status: 'active',
    });
    if (enrErr) console.error('Error inserting enrollment:', s.student_code, enrErr);
  }

  // Explicit HRT assignment record for An -> Linh
  const { error: hrtErr } = await admin.from('student_hrt_assignments').insert({
    student_id: IDS.STU_AN,
    hrt_id: linhId,
    assigned_by: cmPhId,
    assignment_type: 'specific',
    reason: 'Phụ huynh yêu cầu cô Linh phụ trách riêng để bám sát lộ trình thi Cambridge Starters',
  });
  if (hrtErr) console.error('Error inserting student_hrt_assignment:', hrtErr);

  console.log('   ✓ Đã tạo 8 học viên thật và thiết lập phân công riêng em An cho HRT Linh.');

  // STEP 6: SEED ASSESSMENTS & INTERVENTIONS
  console.log('📝 [6/8] Khởi tạo bài đánh giá năng lực 4 kỹ năng & phiếu can thiệp học thuật...');

  // Assessment 1: Nguyễn Bình An (Có rủi ro kỹ năng Viết)
  const assessAnId = 'd0000000-0000-0000-0000-000000000001';
  await admin.from('student_assessments').insert({
    id: assessAnId,
    student_id: IDS.STU_AN,
    class_id: IDS.CLASS_PH_STARTERS,
    branch_id: IDS.BRANCH_PH,
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-05',
    listening_score: 4.5,
    speaking_score: 4.0,
    reading_score: 3.5,
    writing_score: 2.5, // Academic Risk!
    strengths: 'Phát âm tự nhiên chuẩn Oxford, phản xạ nói nhanh, tương tác hào hứng với giáo viên bản ngữ.',
    weaknesses: 'Ngữ pháp viết câu đơn còn nhầm thì hiện tại đơn và chia động từ ngôi thứ 3 số ít.',
    progress_notes: 'Cần can thiệp bổ trợ kỹ năng Viết để củng cố trước kỳ thi Starters.',
    assessed_by: maiId,
  });

  // Assessment 2: Trần Thái Bình (Học lực tốt)
  await admin.from('student_assessments').insert({
    id: 'd0000000-0000-0000-0000-000000000002',
    student_id: IDS.STU_BINH,
    class_id: IDS.CLASS_PH_STARTERS,
    branch_id: IDS.BRANCH_PH,
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-06',
    listening_score: 4.0,
    speaking_score: 4.5,
    reading_score: 4.0,
    writing_score: 4.0,
    strengths: 'Nắm từ vựng tốt, tích cực trong các hoạt động trò chơi ngôn ngữ.',
    weaknesses: 'Thỉnh thoảng mất tập trung ở 15 phút cuối buổi học.',
    assessed_by: maiId,
  });

  // Assessment 3: Lê Quốc Cường (Xuất sắc)
  await admin.from('student_assessments').insert({
    id: 'd0000000-0000-0000-0000-000000000003',
    student_id: IDS.STU_CUONG,
    class_id: IDS.CLASS_PH_MOVERS,
    branch_id: IDS.BRANCH_PH,
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-08',
    listening_score: 4.5,
    speaking_score: 5.0,
    reading_score: 4.5,
    writing_score: 4.0,
    strengths: 'Khả năng nói lưu loát, dùng được các câu ghép cơ bản, ngữ điệu tự nhiên.',
    weaknesses: 'Cần đọc thêm truyện tiếng Anh nhiều trang để tăng tốc độ đọc.',
    assessed_by: linhId,
  });

  // Assessment 4: Phạm Minh Khôi (Flyers - Cần chú ý đọc hiểu)
  const assessKhoiId = 'd0000000-0000-0000-0000-000000000004';
  await admin.from('student_assessments').insert({
    id: assessKhoiId,
    student_id: IDS.STU_KHOI,
    class_id: IDS.CLASS_PH_FLYERS,
    branch_id: IDS.BRANCH_PH,
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-07',
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 2.5, // Risk
    writing_score: 3.5,
    strengths: 'Nghe tốt bài hội thoại dài, từ vựng phong phú.',
    weaknesses: 'Kỹ năng Skimming và Scanning bài đọc dài còn hạn chế, hay bị bẫy từ đồng nghĩa.',
    assessed_by: maiId,
  });

  // Interventions covering 4 workflow stages:
  // Step A: Insert all 4 as 'open'
  const iv1Id = 'e0000000-0000-0000-0000-000000000001';
  const iv2Id = 'e0000000-0000-0000-0000-000000000002';
  const iv3Id = 'e0000000-0000-0000-0000-000000000003';
  const iv4Id = 'e0000000-0000-0000-0000-000000000004';

  await admin.from('interventions').insert([
    {
      id: iv1Id,
      student_id: IDS.STU_AN,
      assessment_id: assessAnId,
      class_id: IDS.CLASS_PH_STARTERS,
      branch_id: IDS.BRANCH_PH,
      issue_description: 'Kỹ năng Viết đạt 2.5/5 khiên, gặp khó khăn chia động từ hiện tại đơn và trật tự từ.',
      root_cause: 'Chưa nắm vững quy tắc thêm s/es và câu hỏi Do/Does trong câu nghi vấn.',
      action_plan: 'Kèm bổ trợ ngữ pháp 1-1 30 phút mỗi thứ 4, giao 4 phiếu bài tập viết Oxford.',
      assigned_staff_id: linhId,
      due_date: '2026-11-25',
      status: 'open',
    },
    {
      id: iv2Id,
      student_id: IDS.STU_NAM,
      class_id: IDS.CLASS_PH_STARTERS,
      branch_id: IDS.BRANCH_PH,
      issue_description: 'Nói ngập ngừng, ngại giao tiếp khi trả lời câu hỏi mở của giáo viên bản ngữ.',
      root_cause: 'Vốn từ vựng chủ đề School & Hobbies còn hạn chế, sợ phát âm sai.',
      action_plan: 'Luyện phát âm qua flashcard Oxford và ghép cặp thực hành hội thoại đầu giờ.',
      assigned_staff_id: maiId,
      due_date: '2026-11-28',
      status: 'open',
    },
    {
      id: iv3Id,
      student_id: IDS.STU_KHOI,
      assessment_id: assessKhoiId,
      class_id: IDS.CLASS_PH_FLYERS,
      branch_id: IDS.BRANCH_PH,
      issue_description: 'Đọc hiểu đoạn văn dài Flyers còn chậm, dễ mất kiên nhẫn khi gặp từ mới.',
      root_cause: 'Chưa có kỹ năng Skimming và Scanning bắt từ khóa chính trong bài thi Cambridge.',
      action_plan: 'Hướng dẫn kỹ thuật gạch chân từ khóa và đọc lướt tìm ý chính.',
      assigned_staff_id: maiId,
      due_date: '2026-11-22',
      status: 'open',
    },
    {
      id: iv4Id,
      student_id: IDS.STU_DUNG,
      class_id: IDS.CLASS_BT_STARTERS,
      branch_id: IDS.BRANCH_BT,
      issue_description: 'Thường xuyên đi trễ 15 phút đầu giờ dẫn đến bỏ lỡ bài khởi động từ vựng.',
      root_cause: 'Gia đình bận kẹt xe giờ cao điểm tan tầm.',
      action_plan: 'Gửi video bài giảng mini trước buổi học và nhắc phụ huynh sắp xếp giờ đưa đón.',
      assigned_staff_id: null,
      due_date: '2026-11-30',
      status: 'open',
    },
  ]);

  // Step B: Progress iv2 (Nam) to 'in_progress'
  await admin.from('interventions').update({ status: 'in_progress' }).eq('id', iv2Id);

  // Step C: Progress iv3 (Khoi) to 'in_progress' -> 'resolved'
  await admin.from('interventions').update({ status: 'in_progress' }).eq('id', iv3Id);
  await admin
    .from('interventions')
    .update({
      status: 'resolved',
      reassessment_result: 'Đã hoàn thành 5 bài đọc luyện Flyers, độ chính xác tăng từ 50% lên 75%.',
    })
    .eq('id', iv3Id);

  // Step D: Progress iv1 (An) to 'in_progress' -> 'resolved' -> 'verified'
  await admin.from('interventions').update({ status: 'in_progress' }).eq('id', iv1Id);
  await admin
    .from('interventions')
    .update({
      status: 'resolved',
      reassessment_result: 'Học viên đã hoàn thành 4 phiếu bài tập, bài mini-test đạt 3.8/5 khiên.',
    })
    .eq('id', iv1Id);

  // To verify iv1, sign in as Head Teacher Nguyễn Thanh Sơn
  const htClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: htAuth } = await htClient.auth.signInWithPassword({
    email: 'ht.phamhung@kapla.edu.vn',
    password: 'Kapla@2026',
  });

  if (htAuth.session) {
    const { error: verErr } = await htClient.rpc('verify_intervention', {
      p_intervention_id: iv1Id,
      p_verification_notes:
        'Head Teacher Nguyễn Thanh Sơn đã duyệt: Học viên An đạt tiến bộ rõ rệt ở kỹ năng Viết, hoàn thành can thiệp.',
    });
    if (verErr) console.error('Error verifying intervention as HT:', verErr);
  }

  console.log('   ✓ Đã tạo 4 bài đánh giá 4 kỹ năng và 4 phiếu can thiệp (1 Mở, 1 Đang xử lý, 1 Đã xử lý, 1 Đã xác minh).');

  // STEP 7: SEED PARENT FEEDBACK, TUTORING & RENEWALS
  console.log('💬 [7/8] Khởi tạo phản hồi phụ huynh, buổi học bổ trợ & danh sách tái tục...');

  // Parent Feedback (feedback_type: academic_concern, complaint, inquiry, compliment, facility)
  const feedbacks = [
    {
      id: 'f0000000-0000-0000-0000-000000000001',
      student_id: IDS.STU_AN,
      branch_id: IDS.BRANCH_PH,
      parent_name: 'Nguyễn Văn Minh (Bố)',
      parent_phone: '0901 112 223',
      feedback_type: 'academic_concern',
      channel: 'phone',
      content: 'Phụ huynh hỏi về lộ trình ôn thi chứng chỉ Cambridge Starters và nhờ thầy cô kèm thêm phần Viết câu.',
      assigned_staff_id: linhId,
      due_date: '2026-11-20',
      status: 'resolved',
      resolution_notes: 'HRT Linh đã gọi tư vấn chi tiết lộ trình và xếp lịch học bổ trợ ngữ pháp thứ Tư hàng tuần.',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000002',
      student_id: IDS.STU_BINH,
      branch_id: IDS.BRANCH_PH,
      parent_name: 'Trần Thị Hà (Mẹ)',
      parent_phone: '0902 223 334',
      feedback_type: 'compliment',
      channel: 'zalo',
      content: 'Phụ huynh khen bé dạo này về nhà tự giác nghe bài hát tiếng Anh và nói chuyện tự tin hơn hẳn.',
      assigned_staff_id: maiId,
      due_date: '2026-11-18',
      status: 'resolved',
      resolution_notes: 'Đã gửi lời cảm ơn mẹ và gửi kèm video clip bé thuyết trình mini trên lớp.',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000003',
      student_id: IDS.STU_NAM,
      branch_id: IDS.BRANCH_PH,
      parent_name: 'Đặng Quốc Tuấn (Bố)',
      parent_phone: '0904 556 677',
      feedback_type: 'inquiry',
      channel: 'in_person',
      content: 'Gia đình muốn bé tham gia thêm hoạt động CLB Tiếng Anh cuối tuần và câu lạc bộ Robotics sáng tạo.',
      assigned_staff_id: cskhId,
      due_date: '2026-11-21',
      status: 'in_progress',
      resolution_notes: 'CSKH Vy đã tư vấn lịch trải nghiệm CLB Robotics thứ 7 tuần này.',
    },
    {
      id: 'f0000000-0000-0000-0000-000000000004',
      student_id: IDS.STU_CUONG,
      branch_id: IDS.BRANCH_PH,
      parent_name: 'Lê Văn Sang (Bố)',
      parent_phone: '0903 334 445',
      feedback_type: 'inquiry',
      channel: 'app',
      content: 'Phụ huynh cần bảng điểm tổng hợp giữa kỳ để đối chiếu tiến độ học tiếng Anh ở trường tiểu học.',
      assigned_staff_id: linhId,
      due_date: '2026-11-22',
      status: 'open',
    },
  ];

  for (const fb of feedbacks) {
    const { error } = await admin.from('parent_feedbacks').insert(fb);
    if (error) console.error('Error inserting parent feedback:', fb.id, error);
  }

  // Supplementary Tutoring Sessions
  const session1Id = '10000000-0000-0000-0000-000000000001';
  await admin.from('supplementary_sessions').insert({
    id: session1Id,
    branch_id: IDS.BRANCH_PH,
    class_id: IDS.CLASS_PH_STARTERS,
    title: 'Bổ trợ kỹ năng Viết & Cấu trúc câu đơn (Starters)',
    session_date: '2026-11-20',
    start_time: '17:30',
    end_time: '18:30',
    teacher_id: supportTeacherId,
    room: 'Phòng Oxford 201',
    topic: 'Quy tắc chia động từ ngôi thứ 3 số ít và viết mô tả tranh theo chuẩn Cambridge',
    target_objective: 'Học viên nhận diện đúng chủ ngữ và viết câu đúng ít nhất 80% phiếu bài tập',
    status: 'scheduled',
    notes: 'Lớp bổ trợ 1-1 tăng cường cho các học viên cần củng cố trước kỳ thi.',
  });

  await admin.from('supplementary_attendees').insert([
    {
      id: '20000000-0000-0000-0000-000000000001',
      session_id: session1Id,
      student_id: IDS.STU_AN,
      attendance_status: 'present',
      assessment_score: 3.5,
      teacher_feedback: 'Học sinh chú ý lắng nghe, làm đúng 4/5 câu viết mẫu.',
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      session_id: session1Id,
      student_id: IDS.STU_NAM,
      attendance_status: 'present',
      assessment_score: 3.0,
      teacher_feedback: 'Đã nhớ cấu trúc câu cơ bản, cần rèn luyện thêm chính tả.',
    },
  ]);

  const session2Id = '10000000-0000-0000-0000-000000000002';
  await admin.from('supplementary_sessions').insert({
    id: session2Id,
    branch_id: IDS.BRANCH_PH,
    class_id: IDS.CLASS_PH_MOVERS,
    title: 'Luyện phản xạ Nói & Phát âm âm đuôi chuẩn Oxford (Movers)',
    session_date: '2026-11-14',
    start_time: '18:00',
    end_time: '19:00',
    teacher_id: staffIdMap['teacher.ph@kapla.edu.vn'],
    room: 'Phòng Cambridge 302',
    topic: 'Mô tả sự khác biệt giữa hai bức tranh và kể lại câu chuyện 4 tranh',
    target_objective: 'Nói câu hoàn chỉnh có thì Quá khứ đơn, phát âm rõ âm đuôi /s/, /z/, /ed/',
    status: 'completed',
    notes: 'Buổi học diễn ra hào hứng, các bạn tương tác nhóm sôi nổi.',
  });

  await admin.from('supplementary_attendees').insert([
    {
      id: '20000000-0000-0000-0000-000000000003',
      session_id: session2Id,
      student_id: IDS.STU_CUONG,
      attendance_status: 'present',
      assessment_score: 4.5,
      teacher_feedback: 'Phát âm chuẩn, kể chuyện mạch lạc và giàu cảm xúc.',
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      session_id: session2Id,
      student_id: IDS.STU_CHI,
      attendance_status: 'present',
      assessment_score: 4.0,
      teacher_feedback: 'Tự tin phát biểu, tương tác tốt cùng bạn ghép đôi.',
    },
  ]);

  // Renewal Records
  const renewals = [
    {
      id: '30000000-0000-0000-0000-000000000001',
      student_id: IDS.STU_BINH,
      branch_id: IDS.BRANCH_PH,
      current_expiry_date: '2026-11-20',
      risk_level: 'high',
      assigned_hrt_id: maiId,
      status: 'contacted',
      last_contact_date: '2026-11-12',
      contact_count: 2,
      notes: 'Phụ huynh rất quan tâm khóa Starters nâng cao, hẹn thứ Bảy lên trung tâm chốt gói 6 tháng.',
      tuition_package: 'Gói Starters Pro (6 tháng - 24 tuần)',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      student_id: IDS.STU_NAM,
      branch_id: IDS.BRANCH_PH,
      current_expiry_date: '2026-11-10',
      risk_level: 'high',
      assigned_hrt_id: maiId,
      status: 'contacted',
      last_contact_date: '2026-11-11',
      contact_count: 3,
      notes: 'Học phí quá hạn 3 ngày. Mẹ bé báo tuần này bận công tác, chuyển khoản gia hạn vào thứ Sáu.',
      tuition_package: 'Gói Starters Foundation (1 năm)',
    },
    {
      id: '30000000-0000-0000-0000-000000000003',
      student_id: IDS.STU_KHOI,
      branch_id: IDS.BRANCH_PH,
      current_expiry_date: '2026-11-25',
      risk_level: 'medium',
      assigned_hrt_id: maiId,
      status: 'monitoring',
      last_contact_date: '2026-11-05',
      contact_count: 1,
      notes: 'Gia đình hài lòng tiến độ, chuẩn bị gửi thư ngỏ lộ trình Flyers Intensive.',
      tuition_package: 'Gói Flyers Intensive (6 tháng)',
    },
    {
      id: '30000000-0000-0000-0000-000000000004',
      student_id: IDS.STU_AN,
      branch_id: IDS.BRANCH_PH,
      current_expiry_date: '2026-12-31',
      risk_level: 'low',
      assigned_hrt_id: linhId,
      status: 'monitoring',
      contact_count: 0,
      notes: 'Học phí còn an toàn > 45 ngày.',
    },
    {
      id: '30000000-0000-0000-0000-000000000005',
      student_id: IDS.STU_CUONG,
      branch_id: IDS.BRANCH_PH,
      current_expiry_date: '2027-02-28',
      risk_level: 'low',
      assigned_hrt_id: linhId,
      status: 'renewed',
      contact_count: 1,
      notes: 'Gia đình đã tái tục gói 1 năm Movers Success.',
      tuition_package: 'Gói Movers Success (1 năm)',
    },
    {
      id: '30000000-0000-0000-0000-000000000006',
      student_id: IDS.STU_HUY,
      branch_id: IDS.BRANCH_BT,
      current_expiry_date: '2026-11-18',
      risk_level: 'high',
      assigned_hrt_id: null,
      status: 'contacted',
      contact_count: 1,
      notes: 'Cơ sở Bình Tân: Sắp hết hạn 5 ngày, CSKH đã gọi nhắc mẹ bé.',
      tuition_package: 'Gói Flyers Standard (6 tháng)',
    },
  ];

  for (const rn of renewals) {
    const { error } = await admin.from('renewal_tracking').upsert(rn, { onConflict: 'student_id' });
    if (error) console.error('Error inserting renewal tracking:', rn.id, error);
  }

  // HRT Care Tasks
  const tasks = [
    {
      id: '40000000-0000-0000-0000-000000000001',
      student_id: IDS.STU_AN,
      branch_id: IDS.BRANCH_PH,
      title: 'Gọi điện báo cáo tiến độ tuần 4 & bài viết cho PH em Nguyễn Bình An',
      task_type: 'care_call',
      due_date: '2026-11-20',
      status: 'pending',
      notes: 'Trao đổi kết quả bài kiểm tra mini-check viết câu và buổi học bổ trợ.',
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      student_id: IDS.STU_BINH,
      branch_id: IDS.BRANCH_PH,
      title: 'Nhắc tái tục học phí sắp hết hạn cho em Trần Thái Bình',
      task_type: 'tuition_reminder',
      due_date: '2026-11-18',
      status: 'pending',
      notes: 'Hạn học phí còn 7 ngày, gửi brochure lộ trình khóa Starters 2.',
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      student_id: IDS.STU_NAM,
      branch_id: IDS.BRANCH_PH,
      title: 'Xử lý học phí quá hạn em Đặng Bảo Nam',
      task_type: 'tuition_reminder',
      due_date: '2026-11-14',
      status: 'pending',
      notes: 'Đã quá hạn 3 ngày, gọi điện xác nhận lại lịch chuyển khoản của mẹ bé.',
    },
    {
      id: '40000000-0000-0000-0000-000000000004',
      student_id: IDS.STU_CUONG,
      branch_id: IDS.BRANCH_PH,
      title: 'Gửi video clip thuyết trình trên lớp cho PH em Lê Quốc Cường',
      task_type: 'progress_report',
      due_date: '2026-11-19',
      status: 'pending',
      notes: 'Clip bé thuyết trình mini chủ đề My Favorite Sport.',
    },
  ];

  for (const t of tasks) {
    const { error } = await admin.from('student_tasks').insert(t);
    if (error) console.error('Error inserting student task:', t.id, error);
  }
  console.log('   ✓ Đã tạo phản hồi phụ huynh, 2 buổi bổ trợ có điểm danh, 6 bản ghi tái tục và 4 công việc HRT.');

  // STEP 8: AUDIT LOGS
  console.log('📋 [8/8] Khởi tạo nhật ký tác nghiệp thực tế...');
  const logs = [
    {
      actor_email: 'admin@kapla.edu.vn',
      action: 'INIT_SYSTEM',
      details: { message: 'Khởi tạo hệ thống quản trị đào tạo đa chi nhánh KAPLA' },
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    },
    {
      actor_email: 'admin@kapla.edu.vn',
      action: 'APPROVE_USER_ROLE',
      target_user_email: 'cm.phamhung@kapla.edu.vn',
      branch_name: 'KAPLA Phạm Hùng',
      details: { role: 'CM', system_role: 'staff' },
      created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    },
    {
      actor_email: 'cm.phamhung@kapla.edu.vn',
      action: 'ASSIGN_HRT',
      target_user_email: 'hrt.linh@kapla.edu.vn',
      branch_name: 'KAPLA Phạm Hùng',
      details: {
        student_name: 'Nguyễn Bình An',
        hrt_name: 'Trần Gia Linh',
        reason: 'Phụ huynh yêu cầu cô Linh phụ trách riêng',
      },
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    {
      actor_email: 'ht.phamhung@kapla.edu.vn',
      action: 'VERIFY_INTERVENTION',
      target_user_email: 'hrt.linh@kapla.edu.vn',
      branch_name: 'KAPLA Phạm Hùng',
      details: {
        student_name: 'Nguyễn Bình An',
        status: 'verified',
        notes: 'Tiến bộ rõ rệt ở kỹ năng Viết',
      },
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ];

  for (const l of logs) {
    await admin.from('audit_logs').insert(l);
  }
  console.log('   ✓ Đã tạo nhật ký tác nghiệp chuẩn chỉnh.');

  console.log('\n======================================================================');
  console.log('  🎉 HOÀN TẤT DỌN RÁC VÀ KHỞI TẠO DỮ LIỆU DEMO THẬT CHO TOÀN BỘ HỆ THỐNG');
  console.log('======================================================================');
  console.log('  Học viên: Nguyễn Bình An, Trần Thái Bình, Lê Quốc Cường, Đặng Bảo Nam, Phạm Minh Khôi, Hoàng Mai Chi, Hoàng Tiến Dũng, Vũ Gia Huy');
  console.log('  Nhân sự: admin@kapla.edu.vn, cm.phamhung, cm.binhtan, ht.phamhung, teacher.ph, hrt.mai, hrt.linh, ta.phuong, teacher.support, cskh.ph');
  console.log('  Mật khẩu dùng chung cho tất cả: Kapla@2026\n');
}

main().catch(console.error);
