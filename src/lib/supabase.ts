// ==============================================================================
// KAPLA Staff Dashboard — Supabase Client & High-Fidelity Mock Layer
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Branch,
  UserProfile,
  BranchMembership,
  AuditLog,
  ClassRoom,
  Student,
  Enrollment,
  ClassTransfer,
  StudentTask,
  CareTaskStatus,
  StudentAssessment,
  InterventionTicket,
  InterventionStatus,
  ParentFeedback,
  FeedbackType,
  FeedbackChannel,
  FeedbackStatus,
  SupplementarySession,
  SupplementaryAttendee,
  SessionStatus,
  AttendanceStatus,
  RenewalRecord,
  RenewalStatus,
  RenewalRisk,
  SystemConfig,
  StaffRole,
  SystemRole,
  AccountStatus,
} from '../types';

const isDev = Boolean(import.meta.env.DEV);
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Check if credentials are placeholders or dummy values
export const isPlaceholderUrl =
  !rawSupabaseUrl ||
  rawSupabaseUrl.includes('PROJECT_REF') ||
  rawSupabaseUrl.includes('your-project') ||
  rawSupabaseUrl.includes('dummy');

export const isPlaceholderKey =
  !rawSupabaseAnonKey ||
  rawSupabaseAnonKey.includes('KHOA_PUBLISHABLE_HOAC_ANON') ||
  rawSupabaseAnonKey.includes('dummy') ||
  rawSupabaseAnonKey.includes('your_actual_anon_public_key');

// In production hosted over HTTPS (e.g. Netlify), http://127.0.0.1 or localhost is blocked as Mixed Content
const isRemoteHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const isLocalhostUrl = rawSupabaseUrl.includes('127.0.0.1') || rawSupabaseUrl.includes('localhost');
const isBlockedLocalhostOnHttps = isRemoteHttps && isLocalhostUrl;

export const hasValidSupabaseConfig =
  !isPlaceholderUrl && !isPlaceholderKey && !isBlockedLocalhostOnHttps;

// Real Supabase client instance (used when properly configured with reachable backend)
export const realSupabase: SupabaseClient | null = hasValidSupabaseConfig
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Mock mode is enabled if explicitly requested via VITE_ENABLE_DEV_MOCK=true
// OR automatically when real Supabase is not configured (e.g. Netlify preview without cloud backend)
const forceDevMock = import.meta.env.VITE_ENABLE_DEV_MOCK === 'true';
export const isDevMockMode = Boolean(forceDevMock || realSupabase === null);

if (!isDev) {
  if (hasValidSupabaseConfig) {
    console.info('[KAPLA Production] Kết nối cơ sở dữ liệu Supabase Cloud:', rawSupabaseUrl);
  } else {
    console.warn(
      '[KAPLA Demo Preview] Chưa cấu hình Supabase Cloud hoặc URL cục bộ không hỗ trợ trên HTTPS. Hệ thống kích hoạt chế độ Demo Standalone với đầy đủ 8 vai trò và học viên thực tế.'
    );
  }
}

// ==============================================================================
// Mock Storage Service with Enforced RBAC & Security Validation
// ==============================================================================

const STORAGE_KEYS = {
  BRANCHES: 'kapla_mock_branches',
  PROFILES: 'kapla_mock_profiles',
  MEMBERSHIPS: 'kapla_mock_memberships',
  CLASSES: 'kapla_mock_classes',
  AUDIT_LOGS: 'kapla_mock_audit_logs',
  CURRENT_USER: 'kapla_mock_auth_user',
  STUDENTS: 'kapla_mock_students',
  ENROLLMENTS: 'kapla_mock_enrollments',
  TRANSFERS: 'kapla_mock_transfers',
  CARE_TASKS: 'kapla_mock_care_tasks',
  ASSESSMENTS: 'kapla_mock_assessments',
  INTERVENTIONS: 'kapla_mock_interventions',
  FEEDBACK: 'kapla_mock_feedback',
  SUPPLEMENTARY: 'kapla_mock_supplementary',
  RENEWAL: 'kapla_mock_renewal',
  SYSTEM_CONFIG: 'kapla_system_config',
};

// Initial Seed Data with Two Core Branches
const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    code: 'PH',
    name: 'KAPLA Phạm Hùng',
    address: 'Tầng trệt & lửng, Topaz Elite, Phường 4, Quận 8, TP.HCM',
    phone: '028 7300 9088',
    status: 'active',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000002',
    code: 'BT',
    name: 'KAPLA Bình Tân',
    address: '35 Vành Đai Trong, P. Bình Trị Đông B, Q. Bình Tân, TP.HCM',
    phone: '028 7300 9089',
    status: 'active',
  },
  {
    id: 'a0000000-0000-0000-0000-000000000003',
    code: 'DA',
    name: 'KAPLA Dĩ An',
    address: '108 Võ Thị Sáu, P. Đông Hòa, TP. Dĩ An, Bình Dương',
    phone: '028 7300 9090',
    status: 'active',
  },
];

const DEFAULT_PROFILES: UserProfile[] = [
  {
    id: 'u0000000-0000-0000-0000-000000000001',
    email: 'admin@kapla.edu.vn',
    full_name: 'Admin',
    phone: '028 7300 9088',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'system_admin',
    status: 'active',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'cm.nhi@kapla.edu.vn',
    full_name: 'Phương Nhi',
    phone: '0912 345 678',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    email: 'ht.jamie@kapla.edu.vn',
    full_name: 'Jamie',
    phone: '0913 456 789',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    email: 'hrt.minh@kapla.edu.vn',
    full_name: 'Minh',
    phone: '0914 567 890',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000005',
    email: 'hrt.tram@kapla.edu.vn',
    full_name: 'Trâm',
    phone: '0915 678 901',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000006',
    email: 'hrt.vy@kapla.edu.vn',
    full_name: 'Vy',
    phone: '0916 789 012',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const DEFAULT_MEMBERSHIPS: BranchMembership[] = [
  {
    id: 'm0000000-0000-0000-0000-000000000001',
    user_id: 'u0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'CM',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000002',
    user_id: 'u0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'CM',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000003',
    user_id: 'u0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'Head Teacher',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000004',
    user_id: 'u0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'HRT',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000005',
    user_id: 'u0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'HRT',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000006',
    user_id: 'u0000000-0000-0000-0000-000000000006',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'HRT',
    is_primary: true,
    status: 'active',
  },
];

const DEFAULT_CLASSES: ClassRoom[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'PH-Starters-01',
    level: 'Starters',
    default_hrt_id: 'u0000000-0000-0000-0000-000000000004',
    default_hrt_name: 'Minh',
    main_teacher_name: 'Jamie',
    schedule: 'Thứ 2 & 4 (17:30 - 19:00)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'PH-Movers-02',
    level: 'Movers',
    default_hrt_id: 'u0000000-0000-0000-0000-000000000004',
    default_hrt_name: 'Minh',
    main_teacher_name: 'Jamie',
    schedule: 'Thứ 3 & 5 (17:30 - 19:00)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'PH-Flyers-01',
    level: 'Flyers',
    default_hrt_id: 'u0000000-0000-0000-0000-000000000005',
    default_hrt_name: 'Trâm',
    main_teacher_name: 'Jamie',
    schedule: 'Thứ 7 & CN (09:00 - 10:30)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'PH-Kangaroo-01',
    level: 'Movers',
    default_hrt_id: 'u0000000-0000-0000-0000-000000000006',
    default_hrt_name: 'Vy',
    main_teacher_name: 'Jamie',
    schedule: 'Thứ 7 & CN (14:30 - 16:00)',
    status: 'active',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l0000000-0000-0000-0000-000000000001',
    actor_email: 'admin@kapla.edu.vn',
    action: 'INIT_SYSTEM',
    details: { message: 'Khởi tạo hệ thống quản trị học vụ KAPLA Phạm Hùng' },
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'l0000000-0000-0000-0000-000000000002',
    actor_email: 'admin@kapla.edu.vn',
    action: 'APPROVE_USER_ROLE',
    target_user_email: 'cm.nhi@kapla.edu.vn',
    branch_name: 'KAPLA Phạm Hùng',
    details: { role: 'CM', system_role: 'staff' },
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-001',
    full_name: 'Nguyễn Bình An',
    date_of_birth: '2017-05-10',
    gender: 'male',
    parent_name: 'Nguyễn Văn Minh (Bố)',
    parent_phone: '0901 112 223',
    parent_email: 'minh.nguyen@gmail.com',
    tuition_expiry_date: '2026-12-31',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000006', // Giao riêng HRT Vy
    notes: 'Học viên có năng khiếu giao tiếp, tự tin nói chuyện với GV bản ngữ, đang được kèm bổ trợ viết câu.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-002',
    full_name: 'Trần Thái Bình',
    date_of_birth: '2017-08-20',
    gender: 'male',
    parent_name: 'Trần Thị Hà (Mẹ)',
    parent_phone: '0902 223 334',
    parent_email: 'ha.tran@gmail.com',
    tuition_expiry_date: '2026-11-20', // Sắp hết hạn
    status: 'warning',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: undefined, // Mặc định theo lớp -> Minh
    notes: 'Phụ huynh quan tâm tiến độ chuẩn Oxford, HRT Minh đã liên hệ tư vấn gói 6 tháng Starters 2.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-003',
    full_name: 'Lê Quốc Cường',
    date_of_birth: '2016-03-15',
    gender: 'male',
    parent_name: 'Lê Văn Sang (Bố)',
    parent_phone: '0903 334 445',
    parent_email: 'sang.le@gmail.com',
    tuition_expiry_date: '2027-02-28',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000002',
    assigned_hrt_id: undefined, // Mặc định theo lớp -> Minh
    notes: 'Học lực xuất sắc, phát âm chuẩn Oxford, chuẩn bị thi Cambridge Movers.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-004',
    full_name: 'Đặng Bảo Nam',
    date_of_birth: '2017-11-02',
    gender: 'male',
    parent_name: 'Đặng Quốc Tuấn (Bố)',
    parent_phone: '0904 556 677',
    parent_email: 'tuan.dang@gmail.com',
    tuition_expiry_date: '2026-11-10', // Đã quá hạn
    status: 'expired',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: undefined, // Mặc định theo lớp -> Minh
    notes: 'Học phí quá hạn, HRT Minh đã liên hệ nhắc phụ huynh xếp lịch đóng phí.',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-005',
    full_name: 'Phạm Minh Khôi',
    date_of_birth: '2015-09-18',
    gender: 'male',
    parent_name: 'Phạm Hải Đăng (Bố)',
    parent_phone: '0905 667 788',
    parent_email: 'dang.pham@gmail.com',
    tuition_expiry_date: '2026-11-25', // Sắp hết hạn
    status: 'warning',
    current_class_id: 'c0000000-0000-0000-0000-000000000003',
    assigned_hrt_id: undefined, // Mặc định theo lớp -> Trâm
    notes: 'Cấp độ Flyers, gia đình có nguyện vọng thi lấy chứng chỉ quốc tế 15 khiên.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-006',
    full_name: 'Hoàng Mai Chi',
    date_of_birth: '2016-07-25',
    gender: 'female',
    parent_name: 'Hoàng Kim Loan (Mẹ)',
    parent_phone: '0906 778 899',
    parent_email: 'loan.hoang@gmail.com',
    tuition_expiry_date: '2027-01-15',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000002',
    assigned_hrt_id: undefined, // Mặc định theo lớp -> Minh
    notes: 'Rất tích cực phát biểu, hoàn thành bài tập về nhà đầy đủ.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-007',
    full_name: 'Vũ Hải Yến',
    date_of_birth: '2017-01-05',
    gender: 'female',
    parent_name: 'Vũ Quốc Bảo (Bố)',
    parent_phone: '0907 889 900',
    parent_email: 'bao.vu@gmail.com',
    tuition_expiry_date: '2026-12-25',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000004',
    assigned_hrt_id: undefined, // Mặc định theo lớp -> Vy
    notes: 'Tiếp thu bài nhanh, đam mê học lập trình Robotics STEAM.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-008',
    full_name: 'Đỗ Tuấn Kiệt',
    date_of_birth: '2015-12-14',
    gender: 'male',
    parent_name: 'Đỗ Trọng Hiếu (Bố)',
    parent_phone: '0908 990 011',
    parent_email: 'hieu.do@gmail.com',
    tuition_expiry_date: '2026-11-18', // Sắp hết hạn 5 ngày
    status: 'warning',
    current_class_id: 'c0000000-0000-0000-0000-000000000003',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000005', // Giao riêng HRT Trâm
    notes: 'Kỹ năng Đọc cần cải thiện, HRT Trâm đang theo dõi sát sao.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

const DEFAULT_ENROLLMENTS: Enrollment[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-10-01',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-10-15',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-10-20',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-10-25',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000005',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-11-01',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000006',
    student_id: 'b0000000-0000-0000-0000-000000000006',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-11-01',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000007',
    student_id: 'b0000000-0000-0000-0000-000000000007',
    class_id: 'c0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-11-01',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000008',
    student_id: 'b0000000-0000-0000-0000-000000000008',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-11-01',
    status: 'active',
  },
];

const DEFAULT_TRANSFERS: ClassTransfer[] = [];

const DEFAULT_CARE_TASKS: StudentTask[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Gọi điện báo cáo tiến độ tuần 4 & bài viết cho PH em Nguyễn Bình An',
    task_type: 'care_call',
    due_date: '2026-11-20',
    status: 'pending',
    notes: 'Trao đổi kết quả bài kiểm tra mini-check viết câu và buổi học bổ trợ cùng Head Teacher Jamie.',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Nhắc tái tục học phí sắp hết hạn cho em Trần Thái Bình',
    task_type: 'tuition_reminder',
    due_date: '2026-11-18',
    status: 'pending',
    notes: 'Hạn học phí còn 7 ngày, gửi brochure lộ trình khóa Starters 2 chuẩn Oxford.',
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Xử lý học phí quá hạn em Đặng Bảo Nam',
    task_type: 'tuition_reminder',
    due_date: '2026-11-14',
    status: 'pending',
    notes: 'Đã quá hạn 3 ngày, gọi điện xác nhận lại lịch chuyển khoản của mẹ bé.',
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Gửi video clip thuyết trình trên lớp cho PH em Lê Quốc Cường',
    task_type: 'progress_report',
    due_date: '2026-11-19',
    status: 'pending',
    notes: 'Clip bé thuyết trình mini chủ đề My Favorite Sport với Head Teacher Jamie.',
  },
];

const DEFAULT_ASSESSMENTS: StudentAssessment[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-05',
    listening_score: 4.5,
    speaking_score: 4.0,
    reading_score: 3.5,
    writing_score: 2.5,
    strengths: 'Phát âm tự nhiên chuẩn Oxford, phản xạ nói nhanh, tương tác hào hứng với giáo viên bản ngữ.',
    weaknesses: 'Ngữ pháp viết câu đơn còn nhầm thì hiện tại đơn và chia động từ ngôi thứ 3 số ít.',
    progress_notes: 'Cần can thiệp bổ trợ kỹ năng Viết để củng cố trước kỳ thi Starters.',
    has_academic_risk: true,
    assessed_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-06',
    listening_score: 4.0,
    speaking_score: 4.5,
    reading_score: 4.0,
    writing_score: 4.0,
    strengths: 'Nắm từ vựng tốt, tích cực trong các hoạt động trò chơi ngôn ngữ.',
    weaknesses: 'Thỉnh thoảng mất tập trung ở 15 phút cuối buổi học.',
    has_academic_risk: false,
    assessed_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-08',
    listening_score: 4.5,
    speaking_score: 5.0,
    reading_score: 4.5,
    writing_score: 4.0,
    strengths: 'Khả năng nói lưu loát, dùng được các câu ghép cơ bản, ngữ điệu tự nhiên.',
    weaknesses: 'Cần đọc thêm truyện tiếng Anh nhiều trang để tăng tốc độ đọc.',
    has_academic_risk: false,
    assessed_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: '2026-11-07',
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 2.5,
    writing_score: 3.5,
    strengths: 'Nghe tốt bài hội thoại dài, từ vựng phong phú.',
    weaknesses: 'Kỹ năng Skimming và Scanning bài đọc dài còn hạn chế, hay bị bẫy từ đồng nghĩa.',
    has_academic_risk: true,
    assessed_by: 'u0000000-0000-0000-0000-000000000005', // HRT Trâm
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
];

const DEFAULT_INTERVENTIONS: InterventionTicket[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    assessment_id: 'd0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    issue_description: 'Kỹ năng Viết đạt 2.5/5 khiên, gặp khó khăn chia động từ hiện tại đơn và trật tự từ.',
    root_cause: 'Chưa nắm vững quy tắc thêm s/es và câu hỏi Do/Does trong câu nghi vấn.',
    action_plan: 'Kèm bổ trợ ngữ pháp 1-1 30 phút mỗi thứ 4, giao 4 phiếu bài tập viết Oxford.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000006', // HRT Vy
    due_date: '2026-11-25',
    reassessment_result: 'Học viên đã hoàn thành 4 phiếu bài tập, bài mini-test đạt 3.8/5 khiên.',
    status: 'verified',
    verified_by: 'u0000000-0000-0000-0000-000000000003', // Head Teacher Jamie
    verified_at: new Date().toISOString(),
    verification_notes: 'Head Teacher Jamie đã duyệt: Học viên An đạt tiến bộ rõ rệt, kết thúc can thiệp.',
    created_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    issue_description: 'Nói ngập ngừng, ngại giao tiếp khi trả lời câu hỏi mở của giáo viên bản ngữ.',
    root_cause: 'Vốn từ vựng chủ đề School & Hobbies còn hạn chế, sợ phát âm sai.',
    action_plan: 'Luyện phát âm qua flashcard Oxford và ghép cặp thực hành hội thoại đầu giờ.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    due_date: '2026-11-28',
    status: 'in_progress',
    created_by: 'u0000000-0000-0000-0000-000000000004',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    assessment_id: 'd0000000-0000-0000-0000-000000000004',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    issue_description: 'Đọc hiểu đoạn văn dài Flyers còn chậm, dễ mất kiên nhẫn khi gặp từ mới.',
    root_cause: 'Chưa có kỹ năng Skimming và Scanning bắt từ khóa chính trong bài thi Cambridge.',
    action_plan: 'Hướng dẫn kỹ thuật gạch chân từ khóa và đọc lướt tìm ý chính.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000005', // HRT Trâm
    due_date: '2026-11-22',
    reassessment_result: 'Đã hoàn thành 5 bài đọc luyện Flyers, độ chính xác tăng từ 50% lên 75%.',
    status: 'resolved',
    created_by: 'u0000000-0000-0000-0000-000000000005',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const DEFAULT_FEEDBACKS: ParentFeedback[] = [
  {
    id: 'f0000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Nguyễn Văn Minh (Bố)',
    parent_phone: '0901 112 223',
    feedback_type: 'academic_concern',
    channel: 'phone',
    content: 'Phụ huynh hỏi về lộ trình ôn thi chứng chỉ Cambridge Starters và nhờ thầy cô kèm thêm phần Viết câu.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000006', // HRT Vy
    due_date: '2026-11-20',
    status: 'resolved',
    resolution_notes: 'HRT Vy đã gọi tư vấn chi tiết lộ trình và xếp lịch học bổ trợ ngữ pháp thứ Tư hàng tuần.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Trần Thị Hà (Mẹ)',
    parent_phone: '0902 223 334',
    feedback_type: 'compliment',
    channel: 'zalo',
    content: 'Phụ huynh khen bé dạo này về nhà tự giác nghe bài hát tiếng Anh và nói chuyện tự tin hơn hẳn.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    due_date: '2026-11-18',
    status: 'resolved',
    resolution_notes: 'Đã gửi lời cảm ơn mẹ và gửi kèm video clip bé thuyết trình mini trên lớp.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Đặng Quốc Tuấn (Bố)',
    parent_phone: '0904 556 677',
    feedback_type: 'inquiry',
    channel: 'in_person',
    content: 'Gia đình muốn tìm hiểu đăng ký câu lạc bộ Robotics sáng tạo và hoạt động ngoại khóa cuối tuần.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000002', // CM Phương Nhi
    due_date: '2026-11-21',
    status: 'in_progress',
    resolution_notes: 'CM Phương Nhi đã tư vấn lịch trải nghiệm CLB Robotics thứ 7 tuần này.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Lê Văn Sang (Bố)',
    parent_phone: '0903 334 445',
    feedback_type: 'inquiry',
    channel: 'app',
    content: 'Phụ huynh cần bảng điểm tổng hợp giữa kỳ để đối chiếu tiến độ học tiếng Anh ở trường tiểu học.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    due_date: '2026-11-22',
    status: 'open',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const DEFAULT_SUPPLEMENTARY_SESSIONS: SupplementarySession[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Bổ trợ kỹ năng Viết & Cấu trúc câu đơn (Starters)',
    session_date: '2026-11-20',
    start_time: '17:30',
    end_time: '18:30',
    teacher_id: 'u0000000-0000-0000-0000-000000000003', // Jamie Alexander
    room: 'Phòng Oxford 201',
    topic: 'Quy tắc chia động từ ngôi thứ 3 số ít và viết mô tả tranh theo chuẩn Cambridge',
    target_objective: 'Học viên nhận diện đúng chủ ngữ và viết câu đúng ít nhất 80% phiếu bài tập',
    status: 'scheduled',
    attendees_count: 2,
    attendees: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        session_id: '10000000-0000-0000-0000-000000000001',
        student_id: 'b0000000-0000-0000-0000-000000000001',
        attendance_status: 'present',
        assessment_score: 3.5,
        teacher_feedback: 'Học sinh chú ý lắng nghe, làm đúng 4/5 câu viết mẫu.',
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        session_id: '10000000-0000-0000-0000-000000000001',
        student_id: 'b0000000-0000-0000-0000-000000000004',
        attendance_status: 'present',
        assessment_score: 3.0,
        teacher_feedback: 'Đã nhớ cấu trúc câu cơ bản, cần rèn luyện thêm chính tả.',
      },
    ],
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Luyện phản xạ Nói & Phát âm âm đuôi chuẩn Oxford (Movers)',
    session_date: '2026-11-14',
    start_time: '18:00',
    end_time: '19:00',
    teacher_id: 'u0000000-0000-0000-0000-000000000003', // Jamie Alexander
    room: 'Phòng Cambridge 302',
    topic: 'Mô tả sự khác biệt giữa hai bức tranh và kể lại câu chuyện 4 tranh',
    target_objective: 'Nói câu hoàn chỉnh có thì Quá khứ đơn, phát âm rõ âm đuôi /s/, /z/, /ed/',
    status: 'completed',
    attendees_count: 2,
    notes: 'Buổi học diễn ra hào hứng, các bạn tương tác nhóm sôi nổi.',
    attendees: [
      {
        id: '20000000-0000-0000-0000-000000000003',
        session_id: '10000000-0000-0000-0000-000000000002',
        student_id: 'b0000000-0000-0000-0000-000000000003',
        attendance_status: 'present',
        assessment_score: 4.5,
        teacher_feedback: 'Phát âm chuẩn, kể chuyện mạch lạc và giàu cảm xúc.',
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        session_id: '10000000-0000-0000-0000-000000000002',
        student_id: 'b0000000-0000-0000-0000-000000000006',
        attendance_status: 'present',
        assessment_score: 4.0,
        teacher_feedback: 'Tự tin phát biểu, tương tác tốt cùng bạn ghép đôi.',
      },
    ],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const DEFAULT_RENEWAL_RECORDS: RenewalRecord[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2026-11-20',
    days_remaining: 7,
    risk_level: 'high',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    status: 'contacted',
    last_contact_date: '2026-11-12',
    contact_count: 2,
    notes: 'Phụ huynh rất quan tâm khóa Starters nâng cao, hẹn thứ Bảy lên trung tâm chốt gói 6 tháng.',
    tuition_package: 'Gói Starters Pro (6 tháng - 24 tuần)',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2026-11-10',
    days_remaining: -3,
    risk_level: 'high',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    status: 'contacted',
    last_contact_date: '2026-11-11',
    contact_count: 3,
    notes: 'Học phí quá hạn 3 ngày. Mẹ bé báo tuần này bận công tác, chuyển khoản gia hạn vào thứ Sáu.',
    tuition_package: 'Gói Starters Foundation (1 năm)',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2026-11-25',
    days_remaining: 12,
    risk_level: 'medium',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000005', // HRT Trâm
    status: 'monitoring',
    last_contact_date: '2026-11-05',
    contact_count: 1,
    notes: 'Gia đình hài lòng tiến độ, chuẩn bị gửi thư ngỏ lộ trình Flyers Intensive.',
    tuition_package: 'Gói Flyers Intensive (6 tháng)',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2026-12-31',
    days_remaining: 48,
    risk_level: 'low',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000006', // HRT Vy
    status: 'monitoring',
    contact_count: 0,
    notes: 'Học phí còn an toàn > 45 ngày.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2027-02-28',
    days_remaining: 107,
    risk_level: 'low',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    status: 'renewed',
    contact_count: 1,
    notes: 'Gia đình đã tái tục gói 1 năm Movers Success.',
    tuition_package: 'Gói Movers Success (1 năm)',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    student_id: 'b0000000-0000-0000-0000-000000000008',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2026-11-18',
    days_remaining: 5,
    risk_level: 'high',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000005', // HRT Trâm
    status: 'contacted',
    contact_count: 1,
    notes: 'KAPLA Phạm Hùng: Sắp hết hạn 5 ngày, HRT Trâm đã gọi nhắc phụ huynh.',
    tuition_package: 'Gói Flyers Standard (6 tháng)',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  tuition_warning_days_threshold: 14,
  auto_email_alerts_enabled: true,
  cambridge_scale_max: 5.0,
  academic_risk_threshold: 3.0,
};

// Automatic LocalStorage Cache Invalidation for Clean Demo Testing
const DATA_VERSION_KEY = 'kapla_demo_data_version';
const CURRENT_DATA_VERSION = 'v2026_kapla_authentic_dataset_v3';
if (typeof window !== 'undefined') {
  const currentVer = localStorage.getItem(DATA_VERSION_KEY);
  if (currentVer !== CURRENT_DATA_VERSION) {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
  }
}

export class MockStorageService {
  private static ensureDevOnly(): void {
    if (typeof window !== 'undefined' && !import.meta.env.DEV) {
      if (hasValidSupabaseConfig && import.meta.env.VITE_ENABLE_DEV_MOCK === 'false') {
        throw new Error('Chính sách bảo mật KAPLA: Chế độ Mock bị từ chối vì hệ thống đang kết nối Supabase Cloud chính thức.');
      }
    }
  }

  static purgeStaleMockCacheIfOutdated(): void {
    if (typeof window === 'undefined') return;
    const currentVersion = '2026.11.13_v6_clean_names_only';
    const savedVersion = localStorage.getItem('kapla_demo_data_version');
    const studentsRaw = localStorage.getItem(STORAGE_KEYS.STUDENTS) || '';
    const profilesRaw = localStorage.getItem(STORAGE_KEYS.PROFILES) || '';
    if (
      savedVersion !== currentVersion ||
      profilesRaw.includes('cm.phamhung') ||
      profilesRaw.includes('hrt.mai') ||
      profilesRaw.includes('cskh.ph') ||
      profilesRaw.includes('Lê Nguyễn') ||
      profilesRaw.includes('Alexander') ||
      profilesRaw.includes('(CM)') ||
      profilesRaw.includes('(HRT)') ||
      profilesRaw.includes('(Head Teacher)') ||
      studentsRaw.includes('17945') ||
      studentsRaw.includes('HV-LK') ||
      studentsRaw.includes('OLD-') ||
      studentsRaw.includes('Thử Nghiệm')
    ) {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
      localStorage.setItem('kapla_demo_data_version', currentVersion);
    }
  }

  static getBranches(): Branch[] {
    this.ensureDevOnly();
    this.purgeStaleMockCacheIfOutdated();
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(DEFAULT_BRANCHES));
      return DEFAULT_BRANCHES;
    }
    return JSON.parse(raw);
  }

  static getProfiles(): UserProfile[] {
    this.purgeStaleMockCacheIfOutdated();
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(DEFAULT_PROFILES));
      return DEFAULT_PROFILES;
    }
    return JSON.parse(raw);
  }

  static saveProfiles(profiles: UserProfile[]): void {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  }

  /**
   * Safe profile update enforcing PostgreSQL trigger rules:
   * Non-admins CANNOT change status, system_role, rejection_reason, or email!
   */
  static updateProfileSecure(callerId: string, targetId: string, updates: Partial<UserProfile>): UserProfile {
    const profiles = this.getProfiles();
    const caller = profiles.find((p) => p.id === callerId);
    const targetIdx = profiles.findIndex((p) => p.id === targetId);
    if (targetIdx === -1) throw new Error('Không tìm thấy tài khoản.');

    const target = profiles[targetIdx];
    const isSysAdmin = caller?.system_role === 'system_admin' && caller?.status === 'active';

    if (!isSysAdmin) {
      if (updates.status !== undefined && updates.status !== target.status) {
        throw new Error('Quyền bị từ chối: Nhân viên không thể tự thay đổi trạng thái tài khoản.');
      }
      if (updates.system_role !== undefined && updates.system_role !== target.system_role) {
        throw new Error('Quyền bị từ chối: Nhân viên không thể tự thay đổi quyền hạn hệ thống.');
      }
      if (updates.rejection_reason !== undefined && updates.rejection_reason !== target.rejection_reason) {
        throw new Error('Quyền bị từ chối: Nhân viên không thể sửa lý do phê duyệt.');
      }
      if (updates.id !== undefined && updates.id !== target.id) {
        throw new Error('Quyền bị từ chối: Không thể sửa định danh ID.');
      }
      if (updates.email !== undefined && updates.email !== target.email) {
        throw new Error('Quyền bị từ chối: Không thể sửa email tài khoản.');
      }
    }

    const oldStatus = target.status;
    const oldSysRole = target.system_role;

    const updatedProfile: UserProfile = {
      ...target,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    profiles[targetIdx] = updatedProfile;
    this.saveProfiles(profiles);

    // Automatic Audit Logs for status or role changes
    if (updates.status !== undefined && updates.status !== oldStatus) {
      this.appendAuditLog({
        actor_email: caller?.email || 'system_trigger',
        action: 'PROFILE_STATUS_CHANGED',
        target_user_email: target.email,
        branch_id: target.preferred_branch_id,
        details: { old_status: oldStatus, new_status: updates.status, reason: updates.rejection_reason },
      });
    }

    if (updates.system_role !== undefined && updates.system_role !== oldSysRole) {
      this.appendAuditLog({
        actor_email: caller?.email || 'system_trigger',
        action: 'SYSTEM_ROLE_CHANGED',
        target_user_email: target.email,
        details: { old_role: oldSysRole, new_role: updates.system_role },
      });
    }

    return updatedProfile;
  }

  static getMemberships(): BranchMembership[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERSHIPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(DEFAULT_MEMBERSHIPS));
      return DEFAULT_MEMBERSHIPS;
    }
    return JSON.parse(raw);
  }

  static saveMemberships(m: BranchMembership[]): void {
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(m));
  }

  /**
   * Safe membership assignment enforcing PostgreSQL rules:
   * Caller must be system_admin OR CM of that exact branch!
   * Staff cannot self-assign. CM cannot appoint another CM.
   */
  static assignMembershipSecure(
    callerId: string,
    targetUserId: string,
    branchId: string,
    role: any
  ): BranchMembership {
    const profiles = this.getProfiles();
    const caller = profiles.find((p) => p.id === callerId);
    if (!caller || caller.status !== 'active') {
      throw new Error('Người thực hiện không hợp lệ hoặc tài khoản chưa kích hoạt.');
    }

    const isSysAdmin = caller.system_role === 'system_admin';
    const memberships = this.getMemberships();
    const isCMOfBranch = memberships.some(
      (m) => m.user_id === callerId && m.branch_id === branchId && m.role === 'CM' && m.status === 'active'
    );

    if (!isSysAdmin && !isCMOfBranch) {
      throw new Error('Quyền bị từ chối: Chỉ Quản trị hệ thống hoặc CM chi nhánh này mới có quyền cấp vai trò.');
    }

    if (callerId === targetUserId && !isSysAdmin) {
      throw new Error('Quyền bị từ chối: Không thể tự cấp hoặc sửa đổi vai trò của chính mình.');
    }

    if (role === 'CM' && !isSysAdmin) {
      throw new Error('Quyền bị từ chối: Chỉ Quản trị hệ thống mới có quyền bổ nhiệm Giám đốc cơ sở (CM).');
    }

    const existingIdx = memberships.findIndex((m) => m.user_id === targetUserId && m.branch_id === branchId);
    let resultMem: BranchMembership;

    if (existingIdx !== -1) {
      memberships[existingIdx].role = role;
      memberships[existingIdx].status = 'active';
      memberships[existingIdx].updated_at = new Date().toISOString();
      resultMem = memberships[existingIdx];
    } else {
      resultMem = {
        id: 'mem-' + Math.random().toString(36).substring(2, 9),
        user_id: targetUserId,
        branch_id: branchId,
        role,
        is_primary: true,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      memberships.push(resultMem);
    }

    this.saveMemberships(memberships);

    // Auto audit log
    const branches = this.getBranches();
    const branchName = branches.find((b) => b.id === branchId)?.name || 'Chi nhánh';
    const targetEmail = profiles.find((p) => p.id === targetUserId)?.email;

    this.appendAuditLog({
      actor_email: caller.email,
      action: 'APPROVE_USER_ROLE',
      target_user_email: targetEmail,
      branch_id: branchId,
      branch_name: branchName,
      details: { role, assigned_by: caller.email },
    });

    return resultMem;
  }

  /**
   * Operational classes query enforcing RLS rules:
   * Pending or Inactive users get ZERO rows!
   * Revoked members get ZERO rows dynamically!
   */
  static getClassesForUser(userId: string, branchId?: string): ClassRoom[] {
    const profiles = this.getProfiles();
    const user = profiles.find((p) => p.id === userId);
    if (!user || user.status !== 'active') {
      return []; // Strict RLS isolation: pending or disabled users cannot read business data
    }

    const isSysAdmin = user.system_role === 'system_admin';
    const memberships = this.getMemberships().filter((m) => m.user_id === userId && m.status === 'active');
    const allClasses = this.getClasses();

    return allClasses.filter((c) => {
      if (branchId && c.branch_id !== branchId) return false;
      if (isSysAdmin) return true;
      return memberships.some((m) => m.branch_id === c.branch_id);
    });
  }

  static getClasses(): ClassRoom[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
      return DEFAULT_CLASSES;
    }
    return JSON.parse(raw);
  }

  static getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));
      return DEFAULT_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  }

  static appendAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  static getStudents(): Student[] {
    this.ensureDevOnly();
    this.purgeStaleMockCacheIfOutdated();
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
      return DEFAULT_STUDENTS;
    }
    return JSON.parse(raw);
  }

  static getStudentsForCaller(
    callerId?: string,
    branchId?: string,
    isSysAdmin = false,
    isCm = false
  ): Student[] {
    const students = this.getStudents();
    const classes = this.getClasses();
    const branches = this.getBranches();
    const profiles = this.getProfiles();

    let filtered = students;
    if (branchId) {
      filtered = filtered.filter((s) => s.branch_id === branchId);
    }

    if (!isSysAdmin && !isCm && callerId) {
      filtered = filtered.filter((s) => {
        // Precedence Rule:
        // Priority 1: Specific HRT assigned
        if (s.assigned_hrt_id) {
          return s.assigned_hrt_id === callerId;
        }
        // Priority 2: Class default HRT
        const cls = classes.find((c) => c.id === s.current_class_id);
        return cls?.default_hrt_id === callerId;
      });
    }

    return filtered.map((s) => {
      const cls = classes.find((c) => c.id === s.current_class_id);
      const br = branches.find((b) => b.id === s.branch_id);
      const hrt = profiles.find((p) => p.id === s.assigned_hrt_id);
      const defHrt = cls?.default_hrt_id ? profiles.find((p) => p.id === cls.default_hrt_id) : null;
      return {
        ...s,
        branch: br,
        current_class: cls,
        assigned_hrt: hrt,
        effective_hrt_name: hrt ? `${hrt.full_name} (HRT riêng)` : defHrt ? `${defHrt.full_name} (Theo lớp)` : 'Chưa phân công',
      };
    });
  }

  static addStudent(payload: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Student {
    this.ensureDevOnly();
    const students = this.getStudents();
    const newStudent: Student = {
      ...payload,
      id: 's' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    students.unshift(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Also add enrollment
    if (payload.current_class_id) {
      const enrollments = this.getEnrollments();
      enrollments.push({
        id: 'e' + Math.random().toString(36).substring(2, 9),
        student_id: newStudent.id,
        class_id: payload.current_class_id,
        branch_id: payload.branch_id,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });
      localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));
    }

    return newStudent;
  }

  static updateStudent(studentId: string, updates: Partial<Student>): Student {
    this.ensureDevOnly();
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) throw new Error('Không tìm thấy học viên.');
    const updated: Student = {
      ...students[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    students[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return updated;
  }

  static deleteStudent(studentId: string): void {
    this.ensureDevOnly();
    const students = this.getStudents().filter((s) => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Cascade delete enrollments, care tasks, assessments, interventions, feedback, renewal
    const enrollments = this.getEnrollments().filter((e) => e.student_id !== studentId);
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));

    const rawTasks = localStorage.getItem(STORAGE_KEYS.CARE_TASKS);
    if (rawTasks) {
      const tasks = (JSON.parse(rawTasks) as StudentTask[]).filter((t) => t.student_id !== studentId);
      localStorage.setItem(STORAGE_KEYS.CARE_TASKS, JSON.stringify(tasks));
    }

    const rawAssess = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    if (rawAssess) {
      const assess = (JSON.parse(rawAssess) as StudentAssessment[]).filter((a) => a.student_id !== studentId);
      localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assess));
    }

    const rawInterventions = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
    if (rawInterventions) {
      const interventions = (JSON.parse(rawInterventions) as InterventionTicket[]).filter((i) => i.student_id !== studentId);
      localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    }

    const rawFeedback = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    if (rawFeedback) {
      const feedback = (JSON.parse(rawFeedback) as ParentFeedback[]).filter((f) => f.student_id !== studentId);
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));
    }

    const rawRenewal = localStorage.getItem(STORAGE_KEYS.RENEWAL);
    if (rawRenewal) {
      const renewal = (JSON.parse(rawRenewal) as RenewalRecord[]).filter((r) => r.student_id !== studentId);
      localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(renewal));
    }
  }

  static addStaff(payload: {
    full_name: string;
    email: string;
    phone?: string;
    branch_id: string;
    role: StaffRole;
    system_role: SystemRole;
  }): UserProfile {
    this.ensureDevOnly();
    const profiles = this.getProfiles();
    if (profiles.some((p) => p.email.toLowerCase() === payload.email.toLowerCase())) {
      throw new Error('Email nhân sự này đã tồn tại trong hệ thống.');
    }
    const newUid = 'u' + Math.random().toString(36).substring(2, 9);
    const newProfile: UserProfile = {
      id: newUid,
      email: payload.email,
      full_name: payload.full_name,
      phone: payload.phone || '',
      preferred_branch_id: payload.branch_id,
      system_role: payload.system_role,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    profiles.unshift(newProfile);
    this.saveProfiles(profiles);

    const memberships = this.getMemberships();
    memberships.push({
      id: 'm' + Math.random().toString(36).substring(2, 9),
      user_id: newUid,
      branch_id: payload.branch_id,
      role: payload.role,
      is_primary: true,
      status: 'active',
    });
    this.saveMemberships(memberships);

    this.appendAuditLog({
      actor_email: 'admin@kapla.edu.vn',
      action: 'ADD_STAFF_ACCOUNT',
      target_user_email: payload.email,
      branch_id: payload.branch_id,
      details: { role: payload.role, system_role: payload.system_role },
    });

    return newProfile;
  }

  static updateStaff(
    userId: string,
    updates: {
      full_name?: string;
      phone?: string;
      branch_id?: string;
      role?: StaffRole;
      system_role?: SystemRole;
      status?: AccountStatus;
    }
  ): UserProfile {
    this.ensureDevOnly();
    const profiles = this.getProfiles();
    const idx = profiles.findIndex((p) => p.id === userId);
    if (idx === -1) throw new Error('Không tìm thấy tài khoản nhân sự.');

    const target = profiles[idx];
    const updated: UserProfile = {
      ...target,
      full_name: updates.full_name ?? target.full_name,
      phone: updates.phone ?? target.phone,
      system_role: updates.system_role ?? target.system_role,
      status: updates.status ?? target.status,
      preferred_branch_id: updates.branch_id ?? target.preferred_branch_id,
      updated_at: new Date().toISOString(),
    };
    profiles[idx] = updated;
    this.saveProfiles(profiles);

    if (updates.role || updates.branch_id) {
      const memberships = this.getMemberships();
      const memIdx = memberships.findIndex((m) => m.user_id === userId);
      if (memIdx !== -1) {
        if (updates.role) memberships[memIdx].role = updates.role;
        if (updates.branch_id) memberships[memIdx].branch_id = updates.branch_id;
        if (updates.status && updates.status !== 'pending') memberships[memIdx].status = updates.status;
      } else if (updates.branch_id && updates.role) {
        memberships.push({
          id: 'm' + Math.random().toString(36).substring(2, 9),
          user_id: userId,
          branch_id: updates.branch_id,
          role: updates.role,
          is_primary: true,
          status: updates.status === 'inactive' ? 'inactive' : 'active',
        });
      }
      this.saveMemberships(memberships);
    }

    this.appendAuditLog({
      actor_email: 'admin@kapla.edu.vn',
      action: 'UPDATE_STAFF_PROFILE',
      target_user_email: target.email,
      details: updates,
    });

    return updated;
  }

  static deleteStaff(userId: string): void {
    this.ensureDevOnly();
    const profiles = this.getProfiles();
    const target = profiles.find((p) => p.id === userId);
    if (!target) throw new Error('Không tìm thấy tài khoản nhân sự để xóa.');

    const newProfiles = profiles.filter((p) => p.id !== userId);
    this.saveProfiles(newProfiles);

    const memberships = this.getMemberships().filter((m) => m.user_id !== userId);
    this.saveMemberships(memberships);

    this.appendAuditLog({
      actor_email: 'admin@kapla.edu.vn',
      action: 'DELETE_STAFF_ACCOUNT',
      target_user_email: target.email,
      details: { deleted_name: target.full_name },
    });
  }

  static getEnrollments(): Enrollment[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.ENROLLMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(DEFAULT_ENROLLMENTS));
      return DEFAULT_ENROLLMENTS;
    }
    return JSON.parse(raw);
  }

  static getTransfers(studentId?: string): ClassTransfer[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    const transfers: ClassTransfer[] = raw ? JSON.parse(raw) : DEFAULT_TRANSFERS;
    if (studentId) {
      return transfers.filter((t) => t.student_id === studentId);
    }
    return transfers;
  }

  static transferStudentClass(studentId: string, toClassId: string, reason: string): void {
    this.ensureDevOnly();
    const students = this.getStudents();
    const classes = this.getClasses();
    const studentIdx = students.findIndex((s) => s.id === studentId);
    if (studentIdx === -1) throw new Error('Không tìm thấy học viên.');

    const student = students[studentIdx];
    const targetClass = classes.find((c) => c.id === toClassId);
    if (!targetClass) throw new Error('Không tìm thấy lớp học đích.');

    const fromClassId = student.current_class_id || '';
    const fromBranchId = student.branch_id;
    const toBranchId = targetClass.branch_id;

    // Record transfer
    const transfers = this.getTransfers();
    const fromClass = classes.find((c) => c.id === fromClassId);
    transfers.unshift({
      id: 'tf-' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      from_class_id: fromClassId,
      to_class_id: toClassId,
      from_branch_id: fromBranchId,
      to_branch_id: toBranchId,
      transfer_date: new Date().toISOString(),
      reason,
      from_class_name: fromClass?.name,
      to_class_name: targetClass.name,
      transferred_by_name: 'Giám đốc cơ sở (CM)',
      created_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));

    // Update student
    student.current_class_id = toClassId;
    student.branch_id = toBranchId;
    student.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Update enrollments
    const enrollments = this.getEnrollments();
    enrollments.forEach((e) => {
      if (e.student_id === studentId && e.status === 'active') {
        e.status = 'transferred';
        e.end_date = new Date().toISOString().split('T')[0];
      }
    });
    enrollments.push({
      id: 'e' + Math.random().toString(36).substring(2, 9),
      student_id: studentId,
      class_id: toClassId,
      branch_id: toBranchId,
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
    });
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(enrollments));
  }

  static assignStudentHrt(studentId: string, hrtId: string | null, reason?: string): void {
    this.ensureDevOnly();
    const students = this.getStudents();
    const studentIdx = students.findIndex((s) => s.id === studentId);
    if (studentIdx === -1) throw new Error('Không tìm thấy học viên.');

    students[studentIdx].assigned_hrt_id = hrtId || undefined;
    students[studentIdx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  static getCareTasks(callerId?: string, branchId?: string, isSysAdmin = false, isCm = false): StudentTask[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.CARE_TASKS);
    const tasks: StudentTask[] = raw ? JSON.parse(raw) : DEFAULT_CARE_TASKS;
    const students = this.getStudents();
    const classes = this.getClasses();

    let filtered = tasks;
    if (branchId) {
      filtered = filtered.filter((t) => t.branch_id === branchId);
    }

    if (!isSysAdmin && !isCm && callerId) {
      filtered = filtered.filter((t) => {
        const student = students.find((s) => s.id === t.student_id);
        if (!student) return false;
        if (student.assigned_hrt_id) {
          return student.assigned_hrt_id === callerId;
        }
        const cls = classes.find((c) => c.id === student.current_class_id);
        return cls?.default_hrt_id === callerId;
      });
    }

    return filtered.map((t) => ({
      ...t,
      student: students.find((s) => s.id === t.student_id),
    }));
  }

  static updateTaskStatus(taskId: string, status: CareTaskStatus): void {
    this.ensureDevOnly();
    const tasks = this.getCareTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].status = status;
      tasks[idx].updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.CARE_TASKS, JSON.stringify(tasks));
    }
  }

  static getAssessments(branchId?: string, classId?: string): StudentAssessment[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.ASSESSMENTS);
    const assessments: StudentAssessment[] = raw ? JSON.parse(raw) : DEFAULT_ASSESSMENTS;
    const students = this.getStudents();
    const classes = this.getClasses();
    const profiles = this.getProfiles();

    let filtered = assessments;
    if (branchId) filtered = filtered.filter((a) => a.branch_id === branchId);
    if (classId) filtered = filtered.filter((a) => a.class_id === classId);

    return filtered.map((a) => {
      const student = students.find((s) => s.id === a.student_id);
      const cls = classes.find((c) => c.id === a.class_id);
      const assessor = profiles.find((p) => p.id === a.assessed_by);
      return {
        ...a,
        student,
        class: cls,
        assessed_by_name: assessor?.full_name || 'Giáo viên',
      };
    });
  }

  static addAssessment(payload: Omit<StudentAssessment, 'id' | 'has_academic_risk' | 'created_at' | 'updated_at'>): StudentAssessment {
    this.ensureDevOnly();
    const assessments = this.getAssessments();
    const hasRisk =
      payload.listening_score < 3.0 ||
      payload.speaking_score < 3.0 ||
      payload.reading_score < 3.0 ||
      payload.writing_score < 3.0;

    const newAssessment: StudentAssessment = {
      ...payload,
      id: 'as' + Math.random().toString(36).substring(2, 9),
      has_academic_risk: hasRisk,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    assessments.unshift(newAssessment);
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(assessments));
    return newAssessment;
  }

  static getInterventions(branchId?: string, classId?: string, status?: InterventionStatus): InterventionTicket[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.INTERVENTIONS);
    const interventions: InterventionTicket[] = raw ? JSON.parse(raw) : DEFAULT_INTERVENTIONS;
    const students = this.getStudents();
    const classes = this.getClasses();
    const profiles = this.getProfiles();

    let filtered = interventions;
    if (branchId) filtered = filtered.filter((i) => i.branch_id === branchId);
    if (classId) filtered = filtered.filter((i) => i.class_id === classId);
    if (status) filtered = filtered.filter((i) => i.status === status);

    return filtered.map((i) => {
      const student = students.find((s) => s.id === i.student_id);
      const cls = classes.find((c) => c.id === i.class_id);
      const staff = profiles.find((p) => p.id === i.assigned_staff_id);
      const verifier = profiles.find((p) => p.id === i.verified_by);
      return {
        ...i,
        student,
        class: cls,
        assigned_staff_name: staff?.full_name || 'Chưa gán',
        verified_by_name: verifier?.full_name,
      };
    });
  }

  static addIntervention(payload: Omit<InterventionTicket, 'id' | 'status' | 'verified_by' | 'verified_at' | 'verification_notes' | 'created_at' | 'updated_at'>): InterventionTicket {
    this.ensureDevOnly();
    const interventions = this.getInterventions();
    const newIntervention: InterventionTicket = {
      ...payload,
      id: 'iv' + Math.random().toString(36).substring(2, 9),
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    interventions.unshift(newIntervention);
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
    return newIntervention;
  }

  static updateInterventionStatus(
    id: string,
    status: InterventionStatus,
    reassessmentResult?: string
  ): void {
    this.ensureDevOnly();
    const interventions = this.getInterventions();
    const idx = interventions.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Không tìm thấy phiếu can thiệp.');

    if (status === 'verified') {
      throw new Error('Chỉ Head Teacher hoặc CM mới có quyền xác minh phiếu can thiệp!');
    }

    interventions[idx].status = status;
    if (reassessmentResult !== undefined) {
      interventions[idx].reassessment_result = reassessmentResult;
    }
    interventions[idx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
  }

  static verifyInterventionMock(
    callerId: string,
    id: string,
    verificationNotes: string,
    isSysAdmin = false,
    isHtOrCm = false
  ): void {
    this.ensureDevOnly();
    if (!isSysAdmin && !isHtOrCm) {
      throw new Error('Quyền bị từ chối: Chỉ Head Teacher hoặc CM chi nhánh mới có quyền xác minh phiếu can thiệp.');
    }

    const interventions = this.getInterventions();
    const idx = interventions.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Không tìm thấy phiếu can thiệp.');

    interventions[idx].status = 'verified';
    interventions[idx].verified_by = callerId;
    interventions[idx].verified_at = new Date().toISOString();
    interventions[idx].verification_notes = verificationNotes;
    interventions[idx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));
  }

  static getFeedbacks(branchId?: string, status?: FeedbackStatus): ParentFeedback[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const feedbacks: ParentFeedback[] = raw ? JSON.parse(raw) : DEFAULT_FEEDBACKS;
    if (!raw) localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(DEFAULT_FEEDBACKS));

    const students = this.getStudents();
    const profiles = this.getProfiles();
    const branches = this.getBranches();

    let filtered = [...feedbacks];
    if (branchId) filtered = filtered.filter((f) => f.branch_id === branchId);
    if (status) filtered = filtered.filter((f) => f.status === status);

    return filtered.map((f) => ({
      ...f,
      student: students.find((s) => s.id === f.student_id),
      branch: branches.find((b) => b.id === f.branch_id),
      assigned_staff_name: profiles.find((p) => p.id === f.assigned_staff_id)?.full_name || 'Chưa phân công',
    }));
  }

  static addFeedback(payload: Omit<ParentFeedback, 'id' | 'created_at' | 'updated_at'>): ParentFeedback {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const feedbacks: ParentFeedback[] = raw ? JSON.parse(raw) : DEFAULT_FEEDBACKS;
    const newFeedback: ParentFeedback = {
      ...payload,
      id: 'fb' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    feedbacks.unshift(newFeedback);
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbacks));
    return newFeedback;
  }

  static updateFeedback(id: string, updates: Partial<ParentFeedback>): void {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const feedbacks: ParentFeedback[] = raw ? JSON.parse(raw) : DEFAULT_FEEDBACKS;
    const idx = feedbacks.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Không tìm thấy phản hồi.');
    feedbacks[idx] = { ...feedbacks[idx], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbacks));
  }

  static getSupplementarySessions(branchId?: string, status?: SessionStatus): SupplementarySession[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTARY);
    const sessions: SupplementarySession[] = raw ? JSON.parse(raw) : DEFAULT_SUPPLEMENTARY_SESSIONS;
    if (!raw) localStorage.setItem(STORAGE_KEYS.SUPPLEMENTARY, JSON.stringify(DEFAULT_SUPPLEMENTARY_SESSIONS));

    const classes = this.getClasses();
    const profiles = this.getProfiles();
    const branches = this.getBranches();
    const students = this.getStudents();

    let filtered = [...sessions];
    if (branchId) filtered = filtered.filter((s) => s.branch_id === branchId);
    if (status) filtered = filtered.filter((s) => s.status === status);

    return filtered.map((s) => ({
      ...s,
      class: classes.find((c) => c.id === s.class_id),
      branch: branches.find((b) => b.id === s.branch_id),
      teacher_name: profiles.find((p) => p.id === s.teacher_id)?.full_name || 'Chưa gán',
      attendees: (s.attendees || []).map((a) => ({
        ...a,
        student: students.find((st) => st.id === a.student_id),
      })),
    }));
  }

  static addSupplementarySession(payload: Omit<SupplementarySession, 'id' | 'created_at' | 'updated_at'>): SupplementarySession {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTARY);
    const sessions: SupplementarySession[] = raw ? JSON.parse(raw) : DEFAULT_SUPPLEMENTARY_SESSIONS;
    const newSession: SupplementarySession = {
      ...payload,
      id: 'sp' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    sessions.unshift(newSession);
    localStorage.setItem(STORAGE_KEYS.SUPPLEMENTARY, JSON.stringify(sessions));
    return newSession;
  }

  static updateSupplementarySession(id: string, updates: Partial<SupplementarySession>): void {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTARY);
    const sessions: SupplementarySession[] = raw ? JSON.parse(raw) : DEFAULT_SUPPLEMENTARY_SESSIONS;
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Không tìm thấy buổi học.');
    sessions[idx] = { ...sessions[idx], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.SUPPLEMENTARY, JSON.stringify(sessions));
  }

  static getRenewalRecords(branchId?: string, status?: RenewalStatus): RenewalRecord[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.RENEWAL);
    const records: RenewalRecord[] = raw ? JSON.parse(raw) : DEFAULT_RENEWAL_RECORDS;
    if (!raw) localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(DEFAULT_RENEWAL_RECORDS));

    const students = this.getStudents();
    const profiles = this.getProfiles();
    const branches = this.getBranches();

    let filtered = [...records];
    if (branchId) filtered = filtered.filter((r) => r.branch_id === branchId);
    if (status) filtered = filtered.filter((r) => r.status === status);

    return filtered.map((r) => {
      const student = students.find((s) => s.id === r.student_id);
      return {
        ...r,
        student,
        branch: branches.find((b) => b.id === r.branch_id),
        assigned_hrt_name: profiles.find((p) => p.id === r.assigned_hrt_id)?.full_name || 'Chưa gán',
      };
    });
  }

  static updateRenewalRecord(id: string, updates: Partial<RenewalRecord>): void {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.RENEWAL);
    const records: RenewalRecord[] = raw ? JSON.parse(raw) : DEFAULT_RENEWAL_RECORDS;
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Không tìm thấy bản ghi tái tục.');
    records[idx] = { ...records[idx], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(records));
  }

  static getSystemConfig(): SystemConfig {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.SYSTEM_CONFIG);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(DEFAULT_SYSTEM_CONFIG));
      return DEFAULT_SYSTEM_CONFIG;
    }
    return JSON.parse(raw);
  }

  static updateSystemConfig(callerId: string, updates: Partial<SystemConfig>): SystemConfig {
    this.ensureDevOnly();
    const profiles = this.getProfiles();
    const caller = profiles.find((p) => p.id === callerId);
    if (caller?.system_role !== 'system_admin') {
      throw new Error('Quyền bị từ chối: Chỉ Quản trị hệ thống (System Admin) mới có quyền chỉnh sửa cấu hình hệ thống.');
    }
    const current = this.getSystemConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(updated));
    return updated;
  }

  static resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(DEFAULT_BRANCHES));
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(DEFAULT_PROFILES));
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(DEFAULT_MEMBERSHIPS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.ENROLLMENTS, JSON.stringify(DEFAULT_ENROLLMENTS));
    localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(DEFAULT_TRANSFERS));
    localStorage.setItem(STORAGE_KEYS.CARE_TASKS, JSON.stringify(DEFAULT_CARE_TASKS));
    localStorage.setItem(STORAGE_KEYS.ASSESSMENTS, JSON.stringify(DEFAULT_ASSESSMENTS));
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(DEFAULT_INTERVENTIONS));
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(DEFAULT_FEEDBACKS));
    localStorage.setItem(STORAGE_KEYS.SUPPLEMENTARY, JSON.stringify(DEFAULT_SUPPLEMENTARY_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(DEFAULT_RENEWAL_RECORDS));
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(DEFAULT_SYSTEM_CONFIG));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// ==============================================================================
// Unified StudentService Layer (Supports Live Supabase & Dev Mock)
// ==============================================================================

export const StudentService = {
  async getStudents(
    branchId?: string,
    callerId?: string,
    isSysAdmin = false,
    isCm = false
  ): Promise<Student[]> {
    if (realSupabase) {
      let query = realSupabase
        .from('students')
        .select(`
          *,
          branch:branches(*),
          current_class:classes(*),
          assigned_hrt:profiles!students_assigned_hrt_id_fkey(*)
        `)
        .order('full_name');

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((s: any) => ({
          ...s,
          effective_hrt_name: s.assigned_hrt
            ? `${s.assigned_hrt.full_name} (HRT riêng)`
            : s.current_class?.default_hrt_name
            ? `${s.current_class.default_hrt_name} (Theo lớp)`
            : 'Chưa phân công',
        }));
      }
    }
    return MockStorageService.getStudentsForCaller(callerId, branchId, isSysAdmin, isCm);
  },

  async createStudent(payload: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Promise<Student> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('students')
        .insert({
          branch_id: payload.branch_id,
          student_code: payload.student_code,
          full_name: payload.full_name,
          date_of_birth: payload.date_of_birth,
          gender: payload.gender,
          parent_name: payload.parent_name,
          parent_phone: payload.parent_phone,
          parent_email: payload.parent_email,
          tuition_expiry_date: payload.tuition_expiry_date,
          status: payload.status || 'active',
          current_class_id: payload.current_class_id,
          assigned_hrt_id: payload.assigned_hrt_id,
          notes: payload.notes,
        })
        .select('*, branch:branches(*), current_class:classes(*)')
        .single();
      if (error) throw error;

      if (payload.current_class_id) {
        await realSupabase.from('enrollments').insert({
          student_id: data.id,
          class_id: payload.current_class_id,
          branch_id: payload.branch_id,
          status: 'active',
        });
      }
      return data;
    }
    return MockStorageService.addStudent(payload);
  },

  async transferClass(studentId: string, toClassId: string, reason: string): Promise<void> {
    if (realSupabase) {
      const { error } = await realSupabase.rpc('transfer_student_class', {
        p_student_id: studentId,
        p_to_class_id: toClassId,
        p_reason: reason,
      });
      if (error) throw error;
      return;
    }
    MockStorageService.transferStudentClass(studentId, toClassId, reason);
  },

  async assignHrt(studentId: string, hrtId: string | null, reason?: string): Promise<void> {
    if (realSupabase) {
      const { error } = await realSupabase.rpc('assign_student_hrt', {
        p_student_id: studentId,
        p_hrt_id: hrtId,
        p_reason: reason || null,
      });
      if (error) throw error;
      return;
    }
    MockStorageService.assignStudentHrt(studentId, hrtId, reason);
  },

  async getTransfers(studentId: string): Promise<ClassTransfer[]> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('class_transfers')
        .select(`
          *,
          from_class:classes!class_transfers_from_class_id_fkey(name),
          to_class:classes!class_transfers_to_class_id_fkey(name),
          transferred_by_user:profiles!class_transfers_transferred_by_fkey(full_name)
        `)
        .eq('student_id', studentId)
        .order('transfer_date', { ascending: false });
      if (!error && data) {
        return data.map((t: any) => ({
          ...t,
          from_class_name: t.from_class?.name,
          to_class_name: t.to_class?.name,
          transferred_by_name: t.transferred_by_user?.full_name,
        }));
      }
    }
    return MockStorageService.getTransfers(studentId);
  },

  async getCareTasks(
    branchId?: string,
    callerId?: string,
    isSysAdmin = false,
    isCm = false
  ): Promise<StudentTask[]> {
    if (realSupabase) {
      let query = realSupabase
        .from('student_tasks')
        .select(`
          *,
          student:students(*, current_class:classes(*))
        `)
        .order('due_date');
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      const { data, error } = await query;
      if (!error && data) return data;
    }
    return MockStorageService.getCareTasks(callerId, branchId, isSysAdmin, isCm);
  },

  async updateTaskStatus(taskId: string, status: CareTaskStatus): Promise<void> {
    if (realSupabase) {
      const { error } = await realSupabase
        .from('student_tasks')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', taskId);
      if (error) throw error;
      return;
    }
    MockStorageService.updateTaskStatus(taskId, status);
  },

  async updateStudent(studentId: string, updates: Partial<Student>): Promise<Student> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('students')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentId)
        .select('*, branch:branches(*), current_class:classes(*)')
        .single();
      if (error) throw error;
      return data;
    }
    return MockStorageService.updateStudent(studentId, updates);
  },

  async deleteStudent(studentId: string): Promise<void> {
    if (realSupabase) {
      const { error } = await realSupabase.from('students').delete().eq('id', studentId);
      if (error) throw error;
      return;
    }
    MockStorageService.deleteStudent(studentId);
  },
};

// ==============================================================================
// StaffService: Full CRUD for Personnel & System Roles
// ==============================================================================

export const StaffService = {
  async getStaff(branchId?: string): Promise<{ profiles: UserProfile[]; memberships: BranchMembership[] }> {
    if (realSupabase) {
      const { data: pData } = await realSupabase.from('profiles').select('*').order('created_at', { ascending: false });
      const { data: mData } = await realSupabase.from('branch_memberships').select('*, branch:branches(*)');
      return { profiles: pData || [], memberships: mData || [] };
    }
    return {
      profiles: MockStorageService.getProfiles(),
      memberships: MockStorageService.getMemberships(),
    };
  },

  async createStaff(payload: {
    full_name: string;
    email: string;
    phone?: string;
    branch_id: string;
    role: StaffRole;
    system_role: SystemRole;
    password?: string;
  }): Promise<UserProfile> {
    if (realSupabase) {
      const uid = 'u' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      const { data: pData, error: pErr } = await realSupabase.from('profiles').insert({
        id: uid,
        email: payload.email,
        full_name: payload.full_name,
        phone: payload.phone || null,
        preferred_branch_id: payload.branch_id,
        system_role: payload.system_role,
        status: 'active',
      }).select().single();
      if (pErr) throw pErr;

      await realSupabase.from('branch_memberships').insert({
        user_id: uid,
        branch_id: payload.branch_id,
        role: payload.role,
        is_primary: true,
        status: 'active',
      });
      return pData;
    }
    return MockStorageService.addStaff(payload);
  },

  async updateStaff(
    userId: string,
    updates: {
      full_name?: string;
      phone?: string;
      branch_id?: string;
      role?: StaffRole;
      system_role?: SystemRole;
      status?: AccountStatus;
    }
  ): Promise<UserProfile> {
    if (realSupabase) {
      const profileUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.full_name) profileUpdates.full_name = updates.full_name;
      if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
      if (updates.branch_id) profileUpdates.preferred_branch_id = updates.branch_id;
      if (updates.system_role) profileUpdates.system_role = updates.system_role;
      if (updates.status) profileUpdates.status = updates.status;

      const { data, error } = await realSupabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;

      if (updates.role && updates.branch_id) {
        await realSupabase
          .from('branch_memberships')
          .upsert({
            user_id: userId,
            branch_id: updates.branch_id,
            role: updates.role,
            status: updates.status || 'active',
            is_primary: true,
          }, { onConflict: 'user_id, branch_id' });
      }
      return data;
    }
    return MockStorageService.updateStaff(userId, updates);
  },

  async deleteStaff(userId: string): Promise<void> {
    if (realSupabase) {
      // First clean up memberships
      await realSupabase.from('branch_memberships').delete().eq('user_id', userId);
      // Remove profile
      const { error } = await realSupabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      return;
    }
    MockStorageService.deleteStaff(userId);
  },
};

// ==============================================================================
// Phase T04: AssessmentService & InterventionService
// ==============================================================================

export const AssessmentService = {
  async getAssessments(branchId?: string, classId?: string): Promise<StudentAssessment[]> {
    if (realSupabase) {
      let query = realSupabase
        .from('student_assessments')
        .select(`
          *,
          student:students(*),
          class:classes(*),
          assessor:profiles!student_assessments_assessed_by_fkey(*)
        `)
        .order('assessment_date', { ascending: false });

      if (branchId) query = query.eq('branch_id', branchId);
      if (classId) query = query.eq('class_id', classId);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((a: any) => ({
          ...a,
          assessed_by_name: a.assessor?.full_name || 'Giáo viên',
        }));
      }
    }
    return MockStorageService.getAssessments(branchId, classId);
  },

  async createAssessment(
    payload: Omit<StudentAssessment, 'id' | 'has_academic_risk' | 'created_at' | 'updated_at'>
  ): Promise<StudentAssessment> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('student_assessments')
        .insert({
          student_id: payload.student_id,
          class_id: payload.class_id,
          branch_id: payload.branch_id,
          period: payload.period,
          assessment_date: payload.assessment_date,
          listening_score: payload.listening_score,
          speaking_score: payload.speaking_score,
          reading_score: payload.reading_score,
          writing_score: payload.writing_score,
          strengths: payload.strengths,
          weaknesses: payload.weaknesses,
          progress_notes: payload.progress_notes,
          assessed_by: payload.assessed_by,
        })
        .select('*, student:students(*), class:classes(*)')
        .single();
      if (error) throw error;
      return data;
    }
    return MockStorageService.addAssessment(payload);
  },
};

export const InterventionService = {
  async getInterventions(
    branchId?: string,
    classId?: string,
    status?: InterventionStatus
  ): Promise<InterventionTicket[]> {
    if (realSupabase) {
      let query = realSupabase
        .from('interventions')
        .select(`
          *,
          student:students(*),
          class:classes(*),
          assigned_staff:profiles!interventions_assigned_staff_id_fkey(*),
          verifier:profiles!interventions_verified_by_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (branchId) query = query.eq('branch_id', branchId);
      if (classId) query = query.eq('class_id', classId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((i: any) => ({
          ...i,
          assigned_staff_name: i.assigned_staff?.full_name || 'Chưa gán',
          verified_by_name: i.verifier?.full_name,
        }));
      }
    }
    return MockStorageService.getInterventions(branchId, classId, status);
  },

  async createIntervention(
    payload: Omit<
      InterventionTicket,
      'id' | 'status' | 'verified_by' | 'verified_at' | 'verification_notes' | 'created_at' | 'updated_at'
    >
  ): Promise<InterventionTicket> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('interventions')
        .insert({
          student_id: payload.student_id,
          assessment_id: payload.assessment_id,
          class_id: payload.class_id,
          branch_id: payload.branch_id,
          issue_description: payload.issue_description,
          root_cause: payload.root_cause,
          action_plan: payload.action_plan,
          assigned_staff_id: payload.assigned_staff_id,
          due_date: payload.due_date,
          status: 'open',
          created_by: payload.created_by,
        })
        .select('*, student:students(*), class:classes(*)')
        .single();
      if (error) throw error;
      return data;
    }
    return MockStorageService.addIntervention(payload);
  },

  async updateStatus(
    id: string,
    status: InterventionStatus,
    reassessmentResult?: string
  ): Promise<void> {
    if (realSupabase) {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (reassessmentResult !== undefined) {
        updates.reassessment_result = reassessmentResult;
      }
      const { error } = await realSupabase
        .from('interventions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return;
    }
    MockStorageService.updateInterventionStatus(id, status, reassessmentResult);
  },

  async verifyIntervention(
    id: string,
    verificationNotes: string,
    callerId?: string,
    isSysAdmin = false,
    isHtOrCm = false
  ): Promise<void> {
    if (realSupabase) {
      const { error } = await realSupabase.rpc('verify_intervention', {
        p_intervention_id: id,
        p_verification_notes: verificationNotes,
      });
      if (error) throw error;
      return;
    }
    MockStorageService.verifyInterventionMock(callerId || '', id, verificationNotes, isSysAdmin, isHtOrCm);
  },
};

// ==============================================================================
// Phase T04 Extended: FeedbackService, SupplementaryService & RenewalService
// Phase T05: SystemConfigService (Configurable Tuition Alert & HRT Dispatch)
// ==============================================================================

export const FeedbackService = {
  async getFeedbacks(branchId?: string, status?: FeedbackStatus): Promise<ParentFeedback[]> {
    if (realSupabase) {
      let query = realSupabase
        .from('parent_feedbacks')
        .select(`
          *,
          student:students(*),
          branch:branches(*),
          assigned_staff:profiles!parent_feedbacks_assigned_staff_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (branchId) query = query.eq('branch_id', branchId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((f: any) => ({
          ...f,
          assigned_staff_name: f.assigned_staff?.full_name || 'Chưa phân công',
        }));
      }
    }
    return MockStorageService.getFeedbacks(branchId, status);
  },

  async createFeedback(payload: Omit<ParentFeedback, 'id' | 'created_at' | 'updated_at'>): Promise<ParentFeedback> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('parent_feedbacks')
        .insert({
          student_id: payload.student_id,
          branch_id: payload.branch_id,
          parent_name: payload.parent_name,
          parent_phone: payload.parent_phone,
          feedback_type: payload.feedback_type,
          channel: payload.channel,
          content: payload.content,
          assigned_staff_id: payload.assigned_staff_id,
          due_date: payload.due_date,
          status: payload.status || 'open',
        })
        .select('*, student:students(*), branch:branches(*)')
        .single();
      if (error) throw error;
      return data;
    }
    return MockStorageService.addFeedback(payload);
  },

  async updateStatus(id: string, status: FeedbackStatus, resolutionNotes?: string): Promise<void> {
    if (realSupabase) {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (resolutionNotes) updates.resolution_notes = resolutionNotes;
      const { error } = await realSupabase.from('parent_feedbacks').update(updates).eq('id', id);
      if (error) throw error;
      return;
    }
    MockStorageService.updateFeedback(id, { status, resolution_notes: resolutionNotes });
  },
};

export const SupplementaryService = {
  async getSessions(branchId?: string, status?: SessionStatus): Promise<SupplementarySession[]> {
    if (realSupabase) {
      let query = realSupabase
        .from('supplementary_sessions')
        .select(`
          *,
          class:classes(*),
          branch:branches(*),
          teacher:profiles!supplementary_sessions_teacher_id_fkey(*),
          attendees:supplementary_attendees(*, student:students(*))
        `)
        .order('session_date', { ascending: false });

      if (branchId) query = query.eq('branch_id', branchId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((s: any) => ({
          ...s,
          teacher_name: s.teacher?.full_name || 'Chưa gán',
          attendees_count: s.attendees?.length || 0,
        }));
      }
    }
    return MockStorageService.getSupplementarySessions(branchId, status);
  },

  async createSession(payload: Omit<SupplementarySession, 'id' | 'created_at' | 'updated_at'>): Promise<SupplementarySession> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('supplementary_sessions')
        .insert({
          branch_id: payload.branch_id,
          class_id: payload.class_id,
          title: payload.title,
          session_date: payload.session_date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          teacher_id: payload.teacher_id,
          room: payload.room,
          topic: payload.topic,
          target_objective: payload.target_objective,
          status: payload.status || 'scheduled',
          notes: payload.notes,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    return MockStorageService.addSupplementarySession(payload);
  },

  async updateSessionStatus(id: string, status: SessionStatus, notes?: string): Promise<void> {
    if (realSupabase) {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (notes) updates.notes = notes;
      const { error } = await realSupabase.from('supplementary_sessions').update(updates).eq('id', id);
      if (error) throw error;
      return;
    }
    MockStorageService.updateSupplementarySession(id, { status, notes });
  },
};

export const RenewalService = {
  async getRecords(branchId?: string, status?: RenewalStatus): Promise<RenewalRecord[]> {
    if (realSupabase) {
      let query = realSupabase
        .from('renewal_tracking')
        .select(`
          *,
          student:students(*),
          branch:branches(*),
          assigned_hrt:profiles!renewal_tracking_assigned_hrt_id_fkey(*)
        `)
        .order('current_expiry_date', { ascending: true });

      if (branchId) query = query.eq('branch_id', branchId);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (!error && data) {
        return data.map((r: any) => {
          const daysRemaining = Math.ceil(
            (new Date(r.current_expiry_date).getTime() - new Date().getTime()) / 86400000
          );
          return {
            ...r,
            days_remaining: daysRemaining,
            assigned_hrt_name: r.assigned_hrt?.full_name || 'Chưa gán',
          };
        });
      }
    }
    return MockStorageService.getRenewalRecords(branchId, status);
  },

  async updateRecord(id: string, updates: Partial<RenewalRecord>): Promise<void> {
    if (realSupabase) {
      const { error } = await realSupabase
        .from('renewal_tracking')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return;
    }
    MockStorageService.updateRenewalRecord(id, updates);
  },
};

export const SystemConfigService = {
  async getConfig(): Promise<SystemConfig> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('system_settings')
        .select('value')
        .eq('key', 'tuition_warning_threshold')
        .single();
      if (!error && data?.value) {
        return {
          tuition_warning_days_threshold: data.value.days ?? 14,
          auto_email_alerts_enabled: data.value.auto_email_enabled ?? true,
          cambridge_scale_max: 5.0,
          academic_risk_threshold: 3.0,
        };
      }
    }
    return MockStorageService.getSystemConfig();
  },

  async updateThreshold(days: number, callerId?: string): Promise<SystemConfig> {
    if (realSupabase) {
      const { error } = await realSupabase.rpc('update_system_setting', {
        p_key: 'tuition_warning_threshold',
        p_value: { days, auto_email_enabled: true },
      });
      if (error) throw error;
      return {
        tuition_warning_days_threshold: days,
        auto_email_alerts_enabled: true,
        cambridge_scale_max: 5.0,
        academic_risk_threshold: 3.0,
      };
    }
    return MockStorageService.updateSystemConfig(callerId || '', {
      tuition_warning_days_threshold: days,
    });
  },

  async getStudentsDueForTuitionAlert(daysThreshold?: number, includeOverdue: boolean = false): Promise<any[]> {
    if (realSupabase) {
      const { data, error } = await realSupabase.rpc('get_students_due_for_tuition_alert', {
        p_days_threshold: daysThreshold || null,
        p_include_overdue: includeOverdue,
      });
      if (!error && data) return data;
    }
    // Fallback: calculate using local mock student data + effective HRT rule
    const students = MockStorageService.getStudents();
    const threshold = daysThreshold ?? MockStorageService.getSystemConfig().tuition_warning_days_threshold;
    const now = new Date();

    return students
      .filter((s) => {
        const diff = Math.ceil((new Date(s.tuition_expiry_date).getTime() - now.getTime()) / 86400000);
        return diff <= threshold;
      })
      .map((s) => ({
        student_id: s.id,
        student_code: s.student_code,
        student_name: s.full_name,
        branch_id: s.branch_id,
        tuition_expiry_date: s.tuition_expiry_date,
        effective_hrt_id: s.assigned_hrt_id || s.current_class?.default_hrt_id,
        effective_hrt_name: s.effective_hrt_name,
      }));
  },
};
