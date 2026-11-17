// ==============================================================================
// KAPLA Staff Dashboard — Core Type Definitions (Phases T01 & T02)
// ==============================================================================

export type StaffRole =
  | 'CM'
  | 'Head Teacher'
  | 'HT'
  | 'Main Teacher'
  | 'HRT'
  | 'TA'
  | 'Supplementary Teacher'
  | 'CSKH'
  | 'EC'
  | 'SOO';

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

export interface StaffDirectoryItem {
  id: string;
  user_id: string;
  full_name: string;
  role: StaffRole;
  email: string;
  phone?: string;
  assigned_classes: string[];
  status: AccountStatus;
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
  | 'branches_classes'
  | 'automated_emails';

export interface EmailDispatchLogEntry {
  id: string;
  sender: string;
  recipients: string[];
  title: string;
  action_type: 'reminder' | 'feedback' | 'renewal' | 'intervention' | 'test' | 'onboarding';
  actionType: 'reminder' | 'feedback' | 'renewal' | 'intervention' | 'test' | 'onboarding';
  content?: string;
  turnaround?: string;
  status: 'delivered' | 'pending' | 'failed';
  dispatched_at: string;
}

// -----------------------------------------------------------------------------
// Phase T03: Student Profiles, Tuition, Enrollments & Care Tasks
// -----------------------------------------------------------------------------

export type StudentStatus = 'active' | 'warning' | 'expired' | 'reserved' | 'dropped';

export interface Student {
  id: string;
  branch_id: string;
  student_code: string;
  full_name: string;
  nickname?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  tuition_expiry_date?: string;
  status: StudentStatus;
  current_class_id?: string;
  assigned_hrt_id?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  branch?: Branch;
  current_class?: ClassRoom;
  current_class_name?: string;
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
  | 'task_admin'
  | 'call_care'
  | 'call_epp'
  | 'parent_meeting'
  | 'tutoring'
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

export type SkillCompetencyLevel = 'Below Level' | 'On Track' | 'Above Level' | 'N/A';
export type ProgressEvaluation = 'Improved' | 'Maintained' | 'Needs Attention' | 'First Assessment';

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
  listening_level?: SkillCompetencyLevel;
  speaking_level?: SkillCompetencyLevel;
  reading_level?: SkillCompetencyLevel;
  writing_level?: SkillCompetencyLevel;
  progress_status?: ProgressEvaluation | string;
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
  owner_id?: string;
  owner_name?: string;
  due_date: string;
  resolution_notes?: string;
  resolved_at?: string;
  turnaround_time?: string;
  status: FeedbackStatus;
  student?: Student;
  branch?: Branch;
  created_at?: string;
  updated_at?: string;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'attended';

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
  tuition_warning_days_threshold: number; // Configurable tuition warning threshold (Admin)
  auto_email_alerts_enabled: boolean;
  cambridge_scale_max: number; // 5.0 shields
  academic_risk_threshold: number; // < 3.0 shields
  email_provider?: 'gmail_smtp' | 'resend';
  sender_email?: string; // Automated notification dispatch email (kapladashboard@gmail.com)
  gmail_app_password?: string;
  resend_api_key?: string;
  resend_sender?: string;
  smtp_status?: 'ready' | 'connected' | 'unverified';
}

// -----------------------------------------------------------------------------
// Role Labels & Metadata
// -----------------------------------------------------------------------------

export const ALL_STAFF_ROLES: StaffRole[] = [
  'CM',
  'Head Teacher',
  'HT',
  'Main Teacher',
  'HRT',
  'TA',
  'Supplementary Teacher',
  'CSKH',
  'EC',
  'SOO',
];

export const ROLE_LABELS: Record<StaffRole, string> = {
  CM: 'Center Manager (CM)',
  'Head Teacher': 'Head Teacher (HT)',
  HT: 'Head Teacher (HT)',
  'Main Teacher': 'Main Teacher',
  HRT: 'Homeroom Teacher (HRT)',
  TA: 'Teaching Assistant (TA)',
  'Supplementary Teacher': 'Supplementary Teacher',
  CSKH: 'Customer Service (CSKH)',
  EC: 'Educational Consultant (EC)',
  SOO: 'Senior Operations Officer (SOO)',
};

export const ROLE_DESCRIPTIONS: Record<StaffRole, string> = {
  CM: 'Branch director managing personnel, classes, cohorts, and campus operations.',
  'Head Teacher': 'Academic lead supervising curriculum quality, teacher assignments, and standard verification.',
  HT: 'Academic lead supervising curriculum quality, teacher assignments, and standard verification.',
  'Main Teacher': 'Classroom educator conducting academic evaluations and issuing intervention tickets.',
  HRT: 'Homeroom teacher tracking designated students, parent care logs, and renewal follow-ups.',
  TA: 'Teaching assistant recording classroom support notes and academic observations.',
  'Supplementary Teacher': 'Tutoring educator conducting supplementary sessions, attendance, and progress assessments.',
  CSKH: 'Customer care specialist handling inquiries, escalations, and parent feedback.',
  EC: 'Educational consultant managing enrollments, consultations, and student records.',
  SOO: 'Senior operations officer overseeing campus operations and teacher staffing.',
};

export const STATUS_LABELS: Record<AccountStatus, { label: string; color: string; badge: string }> = {
  pending: {
    label: 'Pending Approval',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  active: {
    label: 'Active',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  inactive: {
    label: 'Disabled',
    color: 'text-rose-700 bg-rose-50 border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
  },
};
