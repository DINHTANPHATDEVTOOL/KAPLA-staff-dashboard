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
  | 'care_tasks'
  | 'assessments'
  | 'interventions'
  | 'feedback'
  | 'supplementary'
  | 'renewal'
  | 'logs'
  | 'staff_roles'
  | 'branches_classes';

// -----------------------------------------------------------------------------
// Phase T03: Student Profiles, Tuition, Enrollments & Care Tasks
// -----------------------------------------------------------------------------

export type StudentStatus = 'active' | 'warning' | 'expired' | 'reserved' | 'dropped';

export interface Student {
  id: string;
  branch_id: string;
  student_code: string;
  full_name: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  tuition_expiry_date: string;
  status: StudentStatus;
  current_class_id?: string;
  assigned_hrt_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  branch?: Branch;
  current_class?: ClassRoom;
  assigned_hrt?: UserProfile;
  effective_hrt_name?: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  class_id: string;
  branch_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'transferred' | 'completed' | 'dropped';
  class?: ClassRoom;
  created_at?: string;
}

export interface ClassTransfer {
  id: string;
  student_id: string;
  from_class_id: string;
  to_class_id: string;
  from_branch_id: string;
  to_branch_id: string;
  transfer_date: string;
  reason: string;
  transferred_by?: string;
  transferred_by_name?: string;
  from_class_name?: string;
  to_class_name?: string;
  created_at?: string;
}

export interface StudentHrtAssignment {
  id: string;
  student_id: string;
  hrt_id?: string;
  assigned_by?: string;
  assignment_type: 'specific' | 'unassigned';
  reason?: string;
  created_at?: string;
}

export type CareTaskType =
  | 'care_call'
  | 'progress_report'
  | 'tuition_reminder'
  | 'attendance_check'
  | 'academic_support';

export type CareTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface StudentTask {
  id: string;
  student_id: string;
  branch_id: string;
  title: string;
  task_type: CareTaskType;
  due_date: string;
  status: CareTaskStatus;
  notes?: string;
  student?: Student;
  created_at?: string;
  updated_at?: string;
}

// -----------------------------------------------------------------------------
// Phase T04: 4-Skill Assessments & Intervention Flow
// -----------------------------------------------------------------------------

export interface StudentAssessment {
  id: string;
  student_id: string;
  class_id?: string;
  branch_id: string;
  period: string;
  assessment_date: string;
  listening_score: number;
  speaking_score: number;
  reading_score: number;
  writing_score: number;
  strengths?: string;
  weaknesses?: string;
  progress_notes?: string;
  has_academic_risk: boolean;
  assessed_by?: string;
  assessed_by_name?: string;
  student?: Student;
  class?: ClassRoom;
  created_at?: string;
  updated_at?: string;
}

export type InterventionStatus = 'open' | 'in_progress' | 'resolved' | 'verified';

export interface InterventionTicket {
  id: string;
  student_id: string;
  assessment_id?: string;
  class_id?: string;
  branch_id: string;
  issue_description: string;
  root_cause?: string;
  action_plan: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  due_date: string;
  reassessment_result?: string;
  status: InterventionStatus;
  verified_by?: string;
  verified_by_name?: string;
  verified_at?: string;
  verification_notes?: string;
  created_by?: string;
  student?: Student;
  class?: ClassRoom;
  created_at?: string;
  updated_at?: string;
}

// -----------------------------------------------------------------------------
// Phase T04 Extended: Feedback, Supplementary & Renewal Tracking
// -----------------------------------------------------------------------------

export type FeedbackType = 'academic_concern' | 'complaint' | 'inquiry' | 'compliment' | 'facility';
export type FeedbackChannel = 'phone' | 'zalo' | 'in_person' | 'app' | 'email';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved';

export interface ParentFeedback {
  id: string;
  student_id: string;
  branch_id: string;
  parent_name: string;
  parent_phone: string;
  feedback_type: FeedbackType;
  channel: FeedbackChannel;
  content: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  due_date: string;
  resolution_notes?: string;
  status: FeedbackStatus;
  student?: Student;
  branch?: Branch;
  created_at?: string;
  updated_at?: string;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused';

export interface SupplementaryAttendee {
  id: string;
  session_id: string;
  student_id: string;
  attendance_status: AttendanceStatus;
  assessment_score?: number;
  teacher_feedback?: string;
  student?: Student;
}

export interface SupplementarySession {
  id: string;
  branch_id: string;
  class_id?: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  teacher_id?: string;
  teacher_name?: string;
  room?: string;
  topic: string;
  target_objective: string;
  status: SessionStatus;
  notes?: string;
  attendees_count?: number;
  branch?: Branch;
  class?: ClassRoom;
  attendees?: SupplementaryAttendee[];
  created_at?: string;
  updated_at?: string;
}

export type RenewalStatus = 'monitoring' | 'contacted' | 'committed' | 'renewed' | 'churned';
export type RenewalRisk = 'high' | 'medium' | 'low';

export interface RenewalRecord {
  id: string;
  student_id: string;
  branch_id: string;
  current_expiry_date: string;
  days_remaining: number;
  risk_level: RenewalRisk;
  assigned_hrt_id?: string;
  assigned_hrt_name?: string;
  status: RenewalStatus;
  last_contact_date?: string;
  contact_count: number;
  notes?: string;
  new_expiry_date?: string;
  tuition_package?: string;
  student?: Student;
  branch?: Branch;
  created_at?: string;
  updated_at?: string;
}

export interface SystemConfig {
  tuition_warning_days_threshold: number; // Mốc cảnh báo học phí cấu hình được (Admin)
  auto_email_alerts_enabled: boolean;
  cambridge_scale_max: number; // 5.0 khiên
  academic_risk_threshold: number; // < 3.0 khiên
}

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
