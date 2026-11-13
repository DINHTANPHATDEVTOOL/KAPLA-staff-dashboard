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
} from '../types';

const isDev = Boolean(import.meta.env.DEV);
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const forceDevMock = isDev && (import.meta.env.VITE_ENABLE_DEV_MOCK === 'true' || !supabaseUrl || supabaseUrl.includes('dummy'));

// Real Supabase client instance (used when configured)
export const realSupabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey && !supabaseAnonKey.includes('dummy')
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

// Mock mode is strictly restricted to development environment (import.meta.env.DEV).
// In production, mock fallback is permanently forbidden to prevent unauthorized bypass.
export const isDevMockMode = Boolean(isDev && (forceDevMock || realSupabase === null));

if (!isDev && (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes('dummy'))) {
  console.error('[KAPLA CRITICAL SECURITY WARNING] Missing production Supabase credentials. Mock fallback is disabled.');
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
    full_name: 'Quản trị viên Hệ Thống',
    phone: '0901 234 567',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'system_admin',
    status: 'active',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000002',
    email: 'cm.phamhung@kapla.edu.vn',
    full_name: 'Lê Nguyễn Hoàng Nhi (CM)',
    phone: '0902 345 678',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000003',
    email: 'cm.binhtan@kapla.edu.vn',
    full_name: 'Trần Minh Đức (CM)',
    phone: '0903 456 789',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000002',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000004',
    email: 'teacher.mai@kapla.edu.vn',
    full_name: 'Võ Thị Tuyết Mai',
    phone: '0904 567 890',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000005',
    email: 'teacher.linh@kapla.edu.vn',
    full_name: 'Nguyễn Thị Thùy Linh',
    phone: '0905 678 901',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'active',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'u0000000-0000-0000-0000-000000000006',
    email: 'new.staff@kapla.edu.vn',
    full_name: 'Đặng Tuấn Kiệt (Chờ duyệt)',
    phone: '0906 789 012',
    preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
    system_role: 'staff',
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const DEFAULT_MEMBERSHIPS: BranchMembership[] = [
  {
    id: 'm0000000-0000-0000-0000-000000000001',
    user_id: 'u0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'CM',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000002',
    user_id: 'u0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000002',
    role: 'CM',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000003',
    user_id: 'u0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    role: 'HRT',
    is_primary: true,
    status: 'active',
  },
  {
    id: 'm0000000-0000-0000-0000-000000000004',
    user_id: 'u0000000-0000-0000-0000-000000000005',
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
    default_hrt_name: 'Võ Thị Tuyết Mai',
    main_teacher_name: 'Teacher Alex (Bản ngữ)',
    ta_name: 'Trợ giảng Phương',
    schedule: 'Thứ 2 & 4 (17:30 - 19:00)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'PH-Movers-02',
    level: 'Movers',
    default_hrt_id: 'u0000000-0000-0000-0000-000000000005',
    default_hrt_name: 'Nguyễn Thị Thùy Linh',
    main_teacher_name: 'Teacher Sarah (Bản ngữ)',
    schedule: 'Thứ 3 & 5 (18:00 - 19:30)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000002',
    name: 'BT-Starters-01',
    level: 'Starters',
    schedule: 'Thứ 3 & 5 (17:30 - 19:00)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000002',
    name: 'BT-Flyers-01',
    level: 'Flyers',
    schedule: 'Thứ 7 & CN (14:30 - 16:00)',
    status: 'active',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l0000000-0000-0000-0000-000000000001',
    actor_email: 'admin@kapla.edu.vn',
    action: 'INIT_SYSTEM',
    details: { message: 'Khởi tạo hệ thống đa chi nhánh KAPLA' },
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'l0000000-0000-0000-0000-000000000002',
    actor_email: 'admin@kapla.edu.vn',
    action: 'APPROVE_USER_ROLE',
    target_user_email: 'cm.phamhung@kapla.edu.vn',
    branch_name: 'KAPLA Phạm Hùng',
    details: { role: 'CM', system_role: 'staff' },
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 's0000000-0000-0000-0000-000000000001',
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
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000005', // Giao riêng cho Linh
    notes: 'Học viên có năng khiếu giao tiếp, cần bổ trợ phần ngữ pháp đọc hiểu.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 's0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-002',
    full_name: 'Trần Thái Bình',
    date_of_birth: '2017-08-20',
    gender: 'male',
    parent_name: 'Trần Thị Hà (Mẹ)',
    parent_phone: '0902 223 334',
    parent_email: 'ha.tran@gmail.com',
    tuition_expiry_date: '2026-11-20', // Cận ngày hết hạn
    status: 'warning',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: undefined, // Mặc định theo lớp -> Mai
    notes: 'Phụ huynh quan tâm tiến độ nghe nói chuẩn Oxford.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 's0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-003',
    full_name: 'Lê Quốc Cường',
    date_of_birth: '2016-03-15',
    gender: 'male',
    parent_name: 'Lê Văn Sang (Bố)',
    parent_phone: '0903 334 445',
    tuition_expiry_date: '2027-02-28',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000002',
    assigned_hrt_id: undefined, // Mặc định theo lớp Movers -> Linh
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 's0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000002',
    student_code: 'KAP-BT-001',
    full_name: 'Hoàng Tiến Dũng',
    date_of_birth: '2017-01-05',
    gender: 'male',
    parent_name: 'Hoàng Văn Tuấn',
    parent_phone: '0904 445 556',
    tuition_expiry_date: '2026-12-15',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000003',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const DEFAULT_ENROLLMENTS: Enrollment[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    student_id: 's0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-10-01',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    student_id: 's0000000-0000-0000-0000-000000000002',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-10-15',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000003',
    student_id: 's0000000-0000-0000-0000-000000000003',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    start_date: '2026-10-20',
    status: 'active',
  },
  {
    id: 'e0000000-0000-0000-0000-000000000004',
    student_id: 's0000000-0000-0000-0000-000000000004',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000002',
    start_date: '2026-11-01',
    status: 'active',
  },
];

const DEFAULT_TRANSFERS: ClassTransfer[] = [];

const DEFAULT_CARE_TASKS: StudentTask[] = [
  {
    id: 't0000000-0000-0000-0000-000000000001',
    student_id: 's0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Gọi điện báo cáo tiến độ tuần 4 cho phụ huynh em An',
    task_type: 'care_call',
    due_date: '2026-11-20',
    status: 'pending',
    notes: 'Trao đổi kết quả bài kiểm tra mini-check 1',
  },
  {
    id: 't0000000-0000-0000-0000-000000000002',
    student_id: 's0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Nhắc tái tục học phí sắp hết hạn cho em Bình',
    task_type: 'tuition_reminder',
    due_date: '2026-11-18',
    status: 'pending',
    notes: 'Hạn học phí còn dưới 7 ngày, gửi lộ trình tiếp theo khóa Starters 2',
  },
  {
    id: 't0000000-0000-0000-0000-000000000003',
    student_id: 's0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000002',
    title: 'Kiểm tra điểm danh học viên Dũng',
    task_type: 'attendance_check',
    due_date: '2026-11-19',
    status: 'pending',
  },
];

export class MockStorageService {
  private static ensureDevOnly(): void {
    if (typeof window !== 'undefined' && !import.meta.env.DEV) {
      throw new Error('Chính sách bảo mật KAPLA: Chế độ Mock bị nghiêm cấm trên môi trường Production.');
    }
  }

  static getBranches(): Branch[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.BRANCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(DEFAULT_BRANCHES));
      return DEFAULT_BRANCHES;
    }
    return JSON.parse(raw);
  }

  static getProfiles(): UserProfile[] {
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
};
