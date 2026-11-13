// ==============================================================================
// KAPLA Staff Dashboard — Supabase Client & Mock Fallback Layer
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
// In-Memory / LocalStorage Mock Database for Offline Testing & Verification
// ==============================================================================

const STORAGE_KEYS = {
  BRANCHES: 'kapla_mock_branches',
  PROFILES: 'kapla_mock_profiles',
  MEMBERSHIPS: 'kapla_mock_memberships',
  CLASSES: 'kapla_mock_classes',
  AUDIT_LOGS: 'kapla_mock_audit_logs',
  CURRENT_USER: 'kapla_mock_auth_user',
};

// Initial Seed Data
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
  {
    id: 'l0000000-0000-0000-0000-000000000003',
    actor_email: 'cm.phamhung@kapla.edu.vn',
    action: 'APPROVE_USER_ROLE',
    target_user_email: 'teacher.mai@kapla.edu.vn',
    branch_name: 'KAPLA Phạm Hùng',
    details: { role: 'HRT' },
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
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
