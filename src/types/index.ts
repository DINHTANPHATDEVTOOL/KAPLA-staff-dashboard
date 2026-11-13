// ==============================================================================
// KAPLA Staff Dashboard — Core Type Definitions (Phases T01 & T02)
// ==============================================================================

export type StaffRole =
  | 'CM'
  | 'Head Teacher'
  | 'Main Teacher'
  | 'HRT'
  | 'TA'
  | 'Supplementary Teacher'
  | 'CSKH';

export type SystemRole = 'system_admin' | 'staff';

export type AccountStatus = 'pending' | 'active' | 'inactive';

export interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  preferred_branch_id?: string;
  system_role: SystemRole;
  status: AccountStatus;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BranchMembership {
  id: string;
  user_id: string;
  branch_id: string;
  role: StaffRole;
  is_primary: boolean;
  status: 'active' | 'inactive';
  branch?: Branch;
  created_at?: string;
  updated_at?: string;
}

export interface ClassRoom {
  id: string;
  branch_id: string;
  name: string;
  level: string;
  default_hrt_id?: string;
  default_hrt_name?: string;
  main_teacher_id?: string;
  main_teacher_name?: string;
  ta_id?: string;
  ta_name?: string;
  schedule?: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_email?: string;
  action: string;
  target_user_id?: string;
  target_user_email?: string;
  branch_id?: string;
  branch_name?: string;
  details: Record<string, unknown>;
  created_at: string;
}

export type AuthScreen =
  | 'login'
  | 'register'
  | 'verify-email'
  | 'pending-approval'
  | 'forgot-password'
  | 'reset-password'
  | 'disabled';

export type DashboardNavSection =
  | 'overview'
  | 'students'
  | 'assessments'
  | 'interventions'
  | 'feedback'
  | 'supplementary'
  | 'renewal'
  | 'logs'
  | 'staff_roles'
  | 'branches_classes';

// -----------------------------------------------------------------------------
// Role Labels & Metadata in Vietnamese
// -----------------------------------------------------------------------------

export const ALL_STAFF_ROLES: StaffRole[] = [
  'CM',
  'Head Teacher',
  'Main Teacher',
  'HRT',
  'TA',
  'Supplementary Teacher',
  'CSKH',
];

export const ROLE_LABELS: Record<StaffRole, string> = {
  CM: 'Giám đốc cơ sở (CM)',
  'Head Teacher': 'Chủ nhiệm học thuật (Head Teacher)',
  'Main Teacher': 'Giáo viên chính (Main Teacher)',
  HRT: 'Giáo viên chủ nhiệm (HRT)',
  TA: 'Trợ giảng (TA)',
  'Supplementary Teacher': 'Giáo viên bổ trợ',
  CSKH: 'Chăm sóc khách hàng (CSKH)',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  CM: 'Quản lý nhân sự, lớp và hồ sơ trong chi nhánh. Duyệt nhân viên trong chi nhánh được giao.',
  'Head Teacher': 'Theo dõi học thuật chi nhánh và xác minh phiếu can thiệp.',
  'Main Teacher': 'Đánh giá học thuật và lập phiếu can thiệp cho lớp được phân công.',
  HRT: 'Theo dõi danh sách học viên phụ trách, ghi phản hồi phụ huynh và theo dõi tái tục.',
  TA: 'Ghi nhận hỗ trợ và cập nhật quan sát học thuật trong phạm vi được giao.',
  'Supplementary Teacher': 'Ghi buổi bổ trợ, điểm danh, kết quả và nhận xét cho học viên được giao.',
  CSKH: 'Xử lý phản hồi phụ huynh và chăm sóc tái tục trong phạm vi được giao.',
};

export const STATUS_LABELS: Record<AccountStatus, { label: string; color: string; badge: string }> = {
  pending: {
    label: 'Chờ phê duyệt',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  active: {
    label: 'Đang hoạt động',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  inactive: {
    label: 'Đã vô hiệu hóa',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
  },
};
