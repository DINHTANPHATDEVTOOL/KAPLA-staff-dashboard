// ==============================================================================
// KAPLA Staff Dashboard — Supabase Client & High-Fidelity Mock Layer
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Branch, UserProfile, BranchMembership, AuditLog, ClassRoom } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const forceDevMock = import.meta.env.VITE_ENABLE_DEV_MOCK === 'true' || !supabaseUrl || supabaseUrl.includes('dummy');

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

export const isDevMockMode = forceDevMock || realSupabase === null;

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

export class MockStorageService {
  static getBranches(): Branch[] {
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

  static resetToDefault(): void {
    localStorage.setItem(STORAGE_KEYS.BRANCHES, JSON.stringify(DEFAULT_BRANCHES));
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(DEFAULT_PROFILES));
    localStorage.setItem(STORAGE_KEYS.MEMBERSHIPS, JSON.stringify(DEFAULT_MEMBERSHIPS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(DEFAULT_CLASSES));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT_LOGS));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}
