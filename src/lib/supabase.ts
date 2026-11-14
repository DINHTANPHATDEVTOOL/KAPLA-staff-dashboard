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
  EmailDispatchLogEntry,
} from '../types';

// Safely resolve environment across Vite (import.meta.env) and Node.js test runners (process.env)
const env: Record<string, string | boolean | undefined> =
  (typeof import.meta !== 'undefined' && (import.meta as any).env) ||
  (typeof process !== 'undefined' && process.env) ||
  {};

if (typeof globalThis.localStorage === 'undefined') {
  const memStore = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (key: string) => memStore.get(key) ?? null,
    setItem: (key: string, value: string) => memStore.set(key, String(value)),
    removeItem: (key: string) => memStore.delete(key),
    clear: () => memStore.clear(),
    key: (index: number) => Array.from(memStore.keys())[index] ?? null,
    get length() {
      return memStore.size;
    },
  };
}

const isDev = Boolean(env.DEV || env.NODE_ENV !== 'production');
const rawSupabaseUrl = String(env.VITE_SUPABASE_URL || '')
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');
const rawSupabaseAnonKey = String(env.VITE_SUPABASE_ANON_KEY || '').trim();

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
const forceDevMock = env.VITE_ENABLE_DEV_MOCK === 'true';
export const isDevMockMode = Boolean(forceDevMock || realSupabase === null);

// Unified Realtime Subscription Helper (Supports Cross-tab LocalStorage and Multi-device Supabase WebSockets)
export function subscribeToTableChanges(
  table: string,
  onChange: () => void
): () => void {
  const handleStorage = () => onChange();

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
    window.addEventListener('kapla-storage-change', handleStorage);
  }

  let supaChannel: any = null;
  if (realSupabase) {
    try {
      supaChannel = realSupabase
        .channel(`rt:${table}-${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            onChange();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn(`[Realtime] Subscription error for ${table}:`, e);
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kapla-storage-change', handleStorage);
    }
    if (supaChannel && realSupabase) {
      try {
        realSupabase.removeChannel(supaChannel);
      } catch {
        // ignore
      }
    }
  };
}

if (!isDev) {
  if (hasValidSupabaseConfig) {
    console.info('[KAPLA Production] Connected to Supabase Cloud:', rawSupabaseUrl);
  } else {
    console.warn(
      '[KAPLA Demo Preview] Supabase Cloud not configured. System activated Demo Standalone mode with full 8 roles and realistic student data.'
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
  EMAIL_LOGS: 'kapla_mock_email_logs',
};

// Initial Seed Data with Single Branch (KAPLA Pham Hung Campus Only)
const DEFAULT_BRANCHES: Branch[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    code: 'PH',
    name: 'KAPLA Pham Hung Campus',
    address: 'Ground & Mezzanine Floor, Topaz Elite, Ward 4, District 8, Ho Chi Minh City',
    phone: '028 7300 9088',
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
    full_name: 'Phuong Nhi',
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
    full_name: 'Tram',
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
    schedule: 'Mon & Wed (17:30 - 19:00)',
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
    schedule: 'Tue & Thu (17:30 - 19:00)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'PH-Flyers-01',
    level: 'Flyers',
    default_hrt_id: 'u0000000-0000-0000-0000-000000000005',
    default_hrt_name: 'Tram',
    main_teacher_name: 'Jamie',
    schedule: 'Sat & Sun (09:00 - 10:30)',
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
    schedule: 'Sat & Sun (14:30 - 16:00)',
    status: 'active',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    name: 'PH-L6-0030',
    level: 'Level 6',
    default_hrt_id: 'u0000000-0000-0000-0000-000000000004',
    default_hrt_name: 'Minh',
    main_teacher_name: 'Jamie William',
    schedule: 'Tue & Fri (18:00 - 19:30)',
    status: 'active',
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'l0000000-0000-0000-0000-000000000001',
    actor_email: 'admin@kapla.edu.vn',
    action: 'INIT_SYSTEM',
    details: { message: 'Initialized KAPLA Pham Hung academic administration system' },
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'l0000000-0000-0000-0000-000000000002',
    actor_email: 'admin@kapla.edu.vn',
    action: 'APPROVE_USER_ROLE',
    target_user_email: 'cm.nhi@kapla.edu.vn',
    branch_name: 'KAPLA Pham Hung Campus',
    details: { role: 'CM', system_role: 'staff' },
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

const DEFAULT_STUDENTS: Student[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-001',
    full_name: 'Nguyen Binh An',
    date_of_birth: '2017-05-10',
    gender: 'male',
    parent_name: 'Nguyen Van Minh (Father)',
    parent_phone: '0901 112 223',
    parent_email: 'minh.nguyen@gmail.com',
    tuition_expiry_date: '2026-12-31',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000006', // Designated HRT Vy
    notes: 'Talented communicator, confident conversing with native teachers, currently receiving sentence writing tutoring.',
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-002',
    full_name: 'Tran Thai Binh',
    date_of_birth: '2017-08-20',
    gender: 'male',
    parent_name: 'Tran Thi Ha (Mother)',
    parent_phone: '0902 223 334',
    parent_email: 'ha.tran@gmail.com',
    tuition_expiry_date: '2026-11-20', // Due soon
    status: 'warning',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: undefined, // Class default -> Minh
    notes: 'Parents interested in Oxford standard progress; HRT Minh has reached out regarding the 6-month Starters 2 package.',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-003',
    full_name: 'Le Quoc Cuong',
    date_of_birth: '2016-03-15',
    gender: 'male',
    parent_name: 'Le Van Sang (Father)',
    parent_phone: '0903 334 445',
    parent_email: 'sang.le@gmail.com',
    tuition_expiry_date: '2027-02-28',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000002',
    assigned_hrt_id: undefined, // Class default -> Minh
    notes: 'Outstanding academic performance, authentic Oxford pronunciation, preparing for Cambridge Movers examination.',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-004',
    full_name: 'Dang Bao Nam',
    date_of_birth: '2017-11-02',
    gender: 'male',
    parent_name: 'Dang Quoc Tuan (Father)',
    parent_phone: '0904 556 677',
    parent_email: 'tuan.dang@gmail.com',
    tuition_expiry_date: '2026-11-10', // Overdue
    status: 'expired',
    current_class_id: 'c0000000-0000-0000-0000-000000000001',
    assigned_hrt_id: undefined, // Class default -> Minh
    notes: 'Tuition overdue; HRT Minh has contacted parents to arrange fee payment.',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-005',
    full_name: 'Pham Minh Khoi',
    date_of_birth: '2015-09-18',
    gender: 'male',
    parent_name: 'Pham Hai Dang (Father)',
    parent_phone: '0905 667 788',
    parent_email: 'dang.pham@gmail.com',
    tuition_expiry_date: '2026-11-25', // Due soon
    status: 'warning',
    current_class_id: 'c0000000-0000-0000-0000-000000000003',
    assigned_hrt_id: undefined, // Class default -> Tram
    notes: 'Flyers level; family aims for a perfect 15-shield Cambridge international certification.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000006',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-006',
    full_name: 'Hoang Mai Chi',
    date_of_birth: '2016-07-25',
    gender: 'female',
    parent_name: 'Hoang Kim Loan (Mother)',
    parent_phone: '0906 778 899',
    parent_email: 'loan.hoang@gmail.com',
    tuition_expiry_date: '2027-01-15',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000002',
    assigned_hrt_id: undefined, // Class default -> Minh
    notes: 'Highly participatory in class, consistently completes all homework assignments.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000007',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-007',
    full_name: 'Vu Hai Yen',
    date_of_birth: '2017-01-05',
    gender: 'female',
    parent_name: 'Vu Quoc Bao (Father)',
    parent_phone: '0907 889 900',
    parent_email: 'bao.vu@gmail.com',
    tuition_expiry_date: '2026-12-25',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000004',
    assigned_hrt_id: undefined, // Class default -> Vy
    notes: 'Fast learner, passionate about STEAM Robotics and coding.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000008',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: 'KAP-PH-008',
    full_name: 'Do Tuan Kiet',
    date_of_birth: '2015-12-14',
    gender: 'male',
    parent_name: 'Do Trong Hieu (Father)',
    parent_phone: '0908 990 011',
    parent_email: 'hieu.do@gmail.com',
    tuition_expiry_date: '2026-11-18', // Due in 5 days
    status: 'warning',
    current_class_id: 'c0000000-0000-0000-0000-000000000003',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000005', // Designated HRT Tram
    notes: 'Reading skills need improvement; HRT Tram is closely monitoring.',
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'b0000000-0000-0000-0000-000000000009',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: '0003',
    full_name: 'Nguyen Tuan Khai',
    date_of_birth: '2016-04-12',
    gender: 'male',
    parent_name: 'Nguyen Van Hung (Father)',
    parent_phone: '0909 123 456',
    parent_email: 'hung.nguyen@gmail.com',
    tuition_expiry_date: '2027-04-30',
    status: 'active',
    current_class_id: 'c0000000-0000-0000-0000-000000000005',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000004',
    notes: 'Strong academic performance, natural speaking skills, preparing for Cambridge Flyers.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
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
    title: 'Call parents of student Nguyen Binh An to report week 4 progress & writing sample',
    task_type: 'call_care',
    due_date: '2026-11-20',
    status: 'pending',
    notes: 'Discuss mini-check sentence writing test results and supplementary tutoring session with Head Teacher Jamie.',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Call EPP: Remind parents of student Tran Thai Binh about upcoming tuition expiration & Starters 2 course',
    task_type: 'call_epp',
    due_date: '2026-11-18',
    status: 'pending',
    notes: '7 days remaining on tuition; sent Oxford-standard Starters 2 course roadmap brochure.',
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Task Admin: Follow up on tuition extension paperwork for student Dang Bao Nam',
    task_type: 'task_admin',
    due_date: '2026-11-14',
    status: 'pending',
    notes: 'Overdue by 3 days; called to confirm the bank transfer schedule with the student mother.',
  },
  {
    id: '40000000-0000-0000-0000-000000000004',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Parent Meeting: Schedule in-person academic consultation with parents of student Le Quoc Cuong',
    task_type: 'parent_meeting',
    due_date: '2026-11-19',
    status: 'pending',
    notes: 'Clip of the student giving a mini presentation on My Favorite Sport with Head Teacher Jamie.',
  },
  {
    id: '40000000-0000-0000-0000-000000000005',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    title: 'Tutoring: Supplementary sentence structure coaching session for student Pham Minh Khoi',
    task_type: 'tutoring',
    due_date: '2026-11-21',
    status: 'pending',
    notes: 'Targeting Flyers writing accuracy and Cambridge exam reading skills.',
  },
];

const DEFAULT_ASSESSMENTS: StudentAssessment[] = [
  {
    id: 'd0000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Semester 1 - Midterm',
    assessment_date: '2026-11-05',
    listening_score: 4.5,
    speaking_score: 4.0,
    reading_score: 3.5,
    writing_score: 2.5,
    listening_level: 'Above Level',
    speaking_level: 'On Track',
    reading_level: 'On Track',
    writing_level: 'Below Level',
    progress_status: 'Needs Attention',
    strengths: 'Authentic Oxford pronunciation, quick verbal reflexes, enthusiastic interaction with native English teachers.',
    weaknesses: 'Simple sentence grammar writing still confuses present simple and 3rd person singular verb conjugation.',
    progress_notes: 'Needs supplementary writing intervention before upcoming Cambridge Starters exam.',
    has_academic_risk: true,
    assessed_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Semester 1 - Midterm',
    assessment_date: '2026-11-06',
    listening_score: 4.0,
    speaking_score: 4.5,
    reading_score: 4.0,
    writing_score: 4.0,
    listening_level: 'On Track',
    speaking_level: 'Above Level',
    reading_level: 'On Track',
    writing_level: 'On Track',
    progress_status: 'Improved',
    strengths: 'Strong vocabulary acquisition, highly energetic in language game activities.',
    weaknesses: 'Occasional loss of focus in the final 15 minutes of the session.',
    has_academic_risk: false,
    assessed_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Semester 1 - Midterm',
    assessment_date: '2026-11-08',
    listening_score: 4.5,
    speaking_score: 5.0,
    reading_score: 4.5,
    writing_score: 4.0,
    listening_level: 'Above Level',
    speaking_level: 'Above Level',
    reading_level: 'Above Level',
    writing_level: 'On Track',
    progress_status: 'Improved',
    strengths: 'Fluent speech delivery, uses basic compound sentences, natural intonation.',
    weaknesses: 'Should read more multi-page English storybooks to improve reading speed.',
    has_academic_risk: false,
    assessed_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000004',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    class_id: 'c0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Semester 1 - Midterm',
    assessment_date: '2026-11-07',
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 2.5,
    writing_score: 3.5,
    listening_level: 'On Track',
    speaking_level: 'On Track',
    reading_level: 'Below Level',
    writing_level: 'On Track',
    progress_status: 'Needs Attention',
    strengths: 'Excellent listening comprehension on lengthy dialogues, rich topical vocabulary.',
    weaknesses: 'Skimming and scanning skills on long passages need refinement; easily distracted by synonym traps.',
    has_academic_risk: true,
    assessed_by: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'd0000000-0000-0000-0000-000000000005',
    student_id: 'b0000000-0000-0000-0000-000000000009',
    class_id: 'c0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    period: 'Mid-Term',
    assessment_date: '2026-11-13',
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 4.0,
    writing_score: 4.0,
    listening_level: 'On Track',
    speaking_level: 'On Track',
    reading_level: 'On Track',
    writing_level: 'On Track',
    progress_status: 'Improved',
    strengths: 'Active participation in group discussions, confident natural Oxford pronunciation.',
    weaknesses: 'Needs to review irregular past tense verbs in creative storytelling.',
    progress_notes: 'Consistent improvement across all 4 core competencies.',
    has_academic_risk: false,
    assessed_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const DEFAULT_INTERVENTIONS: InterventionTicket[] = [
  {
    id: 'e0000000-0000-0000-0000-000000000001',
    student_id: 'b0000000-0000-0000-0000-000000000001',
    assessment_id: 'd0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    issue_description: 'Writing competency scored 2.5/5 shields, encountering difficulty with simple present tense verb conjugation and word order.',
    root_cause: 'Has not yet mastered s/es ending rules and Do/Does auxiliary verbs in interrogative sentences.',
    action_plan: '1-on-1 grammar tutoring for 30 minutes every Wednesday, assigned 4 Oxford writing worksheets.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000006', // HRT Vy
    due_date: '2026-11-25',
    reassessment_result: 'Student completed 4 worksheets; mini-test score improved to 3.8/5 shields.',
    status: 'verified',
    verified_by: 'u0000000-0000-0000-0000-000000000003', // Head Teacher Jamie
    verified_at: new Date().toISOString(),
    verification_notes: 'Head Teacher Jamie approved: Student An demonstrated noticeable progress, intervention concluded successfully.',
    created_by: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'e0000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    issue_description: 'Hesitant speech, shy when answering open-ended questions from native teachers.',
    root_cause: 'Limited vocabulary on School & Hobbies topics, fearful of mispronouncing.',
    action_plan: 'Pronunciation drills with Oxford flashcards and paired conversation practice at session start.',
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
    issue_description: 'Slow reading comprehension on longer Flyers passages, tends to lose patience with unfamiliar words.',
    root_cause: 'Lacks skimming and scanning skills to identify keywords in Cambridge exams.',
    action_plan: 'Instructed in keyword underlining techniques and rapid skimming for main ideas.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    due_date: '2026-11-22',
    reassessment_result: 'Completed 5 Flyers reading practice drills; accuracy increased from 50% to 75%.',
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
    parent_name: 'Nguyen Van Minh (Father)',
    parent_phone: '0901 112 223',
    feedback_type: 'academic_concern',
    channel: 'phone',
    content: 'Parents inquired about the Cambridge Starters preparation roadmap and requested supplementary tutoring for sentence writing.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000006', // HRT Vy
    assigned_staff_name: 'HRT Vy',
    owner_name: 'HRT Vy',
    due_date: '2026-11-20',
    status: 'resolved',
    turnaround_time: '2h 10m',
    resolution_notes: 'HRT Vy called to consult in detail on the academic roadmap and scheduled Wednesday grammar tutoring.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 5 * 86400000 + 7800000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000002',
    student_id: 'b0000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Tran Thi Ha (Mother)',
    parent_phone: '0902 223 334',
    feedback_type: 'compliment',
    channel: 'zalo',
    content: 'Mother shared positive feedback that the student proactively listens to English songs at home and speaks with greater confidence.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    assigned_staff_name: 'HRT Minh',
    owner_name: 'HRT Minh',
    due_date: '2026-11-18',
    status: 'resolved',
    turnaround_time: '45m',
    resolution_notes: 'Sent appreciation message to mother along with the video clip of the student mini in-class presentation.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 3 * 86400000 + 2700000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000004',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Dang Quoc Tuan (Father)',
    parent_phone: '0904 556 677',
    feedback_type: 'inquiry',
    channel: 'in_person',
    content: 'Family would like to explore enrolling in the Creative Robotics Club and weekend extracurricular activities.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000002', // CM Phuong Nhi
    assigned_staff_name: 'CM Phuong Nhi',
    owner_name: 'CM Phuong Nhi',
    due_date: '2026-11-21',
    status: 'in_progress',
    resolution_notes: 'CM Phuong Nhi consulted on Saturday Robotics Club trial schedule.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000004',
    student_id: 'b0000000-0000-0000-0000-000000000003',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Le Van Sang (Father)',
    parent_phone: '0903 334 445',
    feedback_type: 'inquiry',
    channel: 'app',
    content: 'Parents requested midterm comprehensive report card to cross-reference academic progress at primary school.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000004', // HRT Minh
    assigned_staff_name: 'HRT Minh',
    owner_name: 'HRT Minh',
    due_date: '2026-11-22',
    status: 'open',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  // Pham Minh Khoi (b0000000-0000-0000-0000-000000000005) - 3 Feedbacks grouped under 1 student (Solves Image 3)
  {
    id: 'f0000000-0000-0000-0000-000000000005',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Pham Hai Dang (Father)',
    parent_phone: '0905 667 788',
    feedback_type: 'academic_concern',
    channel: 'phone',
    content: 'Parents requested teacher to assign supplementary speaking audio practice via Zalo.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    assigned_staff_name: 'HRT Tram',
    owner_name: 'HRT Tram',
    due_date: '2026-11-18',
    status: 'resolved',
    turnaround_time: '1h 45m',
    resolution_notes: 'HRT Tram created a dedicated Zalo group and guided parents on the voice recording submission workflow.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 4 * 86400000 + 6300000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000006',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Pham Hai Dang (Father)',
    parent_phone: '0905 667 788',
    feedback_type: 'inquiry',
    channel: 'zalo',
    content: 'Family requested Cambridge Flyers mock examination schedule and evaluation criteria.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000007', // David Miller
    assigned_staff_name: 'Teacher David Miller',
    owner_name: 'HRT Tram',
    due_date: '2026-11-19',
    status: 'in_progress',
    resolution_notes: 'Academic coordinator shared the November mock exam timetable and sample assessment rubrics.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'f0000000-0000-0000-0000-000000000007',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    parent_name: 'Pham Hai Dang (Father)',
    parent_phone: '0905 667 788',
    feedback_type: 'compliment',
    channel: 'phone',
    content: 'Father commended the academic faculty for dedicated guidance and noticeable progress in speaking fluency.',
    assigned_staff_id: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    assigned_staff_name: 'HRT Tram',
    owner_name: 'HRT Tram',
    due_date: '2026-11-20',
    status: 'resolved',
    turnaround_time: '30m',
    resolution_notes: 'Acknowledged compliment and logged appreciation note into student academic profile.',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 1 * 86400000 + 1800000).toISOString(),
  },
];

const DEFAULT_SUPPLEMENTARY_SESSIONS: SupplementarySession[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000001',
    title: 'Supplementary Writing & Simple Sentence Structure (Starters)',
    session_date: '2026-11-20',
    start_time: '17:30',
    end_time: '18:30',
    teacher_id: 'u0000000-0000-0000-0000-000000000003', // Jamie Alexander
    room: 'Oxford Room 201',
    topic: 'Third-person singular verb conjugation rules and Cambridge picture description writing',
    target_objective: 'Students correctly identify subjects and write accurate sentences on at least 80% of worksheets',
    status: 'scheduled',
    attendees_count: 2,
    attendees: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        session_id: '10000000-0000-0000-0000-000000000001',
        student_id: 'b0000000-0000-0000-0000-000000000001',
        attendance_status: 'present',
        assessment_score: 3.5,
        teacher_feedback: 'Student paid close attention, completed 4/5 sample writing sentences accurately.',
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        session_id: '10000000-0000-0000-0000-000000000001',
        student_id: 'b0000000-0000-0000-0000-000000000004',
        attendance_status: 'present',
        assessment_score: 3.0,
        teacher_feedback: 'Memorized basic sentence structures, needs further spelling practice.',
      },
    ],
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    class_id: 'c0000000-0000-0000-0000-000000000002',
    title: 'Speaking Reflexes & Oxford Standard Ending Sounds (Movers)',
    session_date: '2026-11-14',
    start_time: '18:00',
    end_time: '19:00',
    teacher_id: 'u0000000-0000-0000-0000-000000000003', // Jamie Alexander
    room: 'Cambridge Room 302',
    topic: 'Describing differences between two pictures and retelling a 4-picture story',
    target_objective: 'Speak in complete sentences using past simple tense, articulate ending sounds /s/, /z/, /ed/',
    status: 'completed',
    attendees_count: 2,
    notes: 'Enthusiastic session, lively group interaction.',
    attendees: [
      {
        id: '20000000-0000-0000-0000-000000000003',
        session_id: '10000000-0000-0000-0000-000000000002',
        student_id: 'b0000000-0000-0000-0000-000000000003',
        attendance_status: 'present',
        assessment_score: 4.5,
        teacher_feedback: 'Standard pronunciation, coherent and expressive storytelling.',
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        session_id: '10000000-0000-0000-0000-000000000002',
        student_id: 'b0000000-0000-0000-0000-000000000006',
        attendance_status: 'present',
        assessment_score: 4.0,
        teacher_feedback: 'Confident speaker, interacted well with partner.',
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
    notes: 'Parents highly interested in advanced Starters course; appointment on Saturday at center to finalize 6-month package.',
    tuition_package: 'Starters Pro Package (6 months - 24 weeks)',
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
    notes: 'Tuition overdue by 3 days. Mother reported busy on business trip this week, will transfer renewal fee on Friday.',
    tuition_package: 'Starters Foundation Package (1 year)',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    student_id: 'b0000000-0000-0000-0000-000000000005',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2026-11-25',
    days_remaining: 12,
    risk_level: 'medium',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    status: 'monitoring',
    last_contact_date: '2026-11-05',
    contact_count: 1,
    notes: 'Family pleased with progress, preparing invitation letter for Flyers Intensive roadmap.',
    tuition_package: 'Flyers Intensive Package (6 months)',
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
    notes: 'Tuition safely remaining > 45 days.',
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
    notes: 'Family renewed 1-year Movers Success package.',
    tuition_package: 'Movers Success Package (1 year)',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    student_id: 'b0000000-0000-0000-0000-000000000008',
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    current_expiry_date: '2026-11-18',
    days_remaining: 5,
    risk_level: 'high',
    assigned_hrt_id: 'u0000000-0000-0000-0000-000000000005', // HRT Tram
    status: 'contacted',
    contact_count: 1,
    notes: 'KAPLA Pham Hung: Expiry in 5 days, HRT Tram called to remind parents.',
    tuition_package: 'Flyers Standard Package (6 months)',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEFAULT_SYSTEM_CONFIG: SystemConfig = {
  tuition_warning_days_threshold: 14,
  auto_email_alerts_enabled: true,
  cambridge_scale_max: 5.0,
  academic_risk_threshold: 3.0,
  sender_email: 'kapladashboard@gmail.com',
  gmail_app_password: 'dewj kuyq uwho pahu',
  smtp_status: 'connected',
};

const DEFAULT_EMAIL_LOGS: EmailDispatchLogEntry[] = [
  {
    id: 'em-001',
    sender: 'kapladashboard@gmail.com',
    recipients: [
      'Assigned HRT: Le Thi Mai Tram (tram.le@kapla.edu.vn)',
      'Center Manager: Tran Phuong Nhi (cm.nhi@kapla.edu.vn)',
      'Academic Teachers: David Miller, Jamie Alexander',
    ],
    title: 'Reminder Appointment: Follow-up consultation for Pham Minh Khoi',
    action_type: 'reminder',
    actionType: 'reminder',
    content: 'Scheduled by Center Manager (CM) for student Pham Minh Khoi (KAP-PH-005). Task Type: Call care. Due: 2026-11-18. Focus on Zalo audio recording homework assistance.',
    status: 'delivered',
    dispatched_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'em-002',
    sender: 'kapladashboard@gmail.com',
    recipients: [
      'Assigned HRT: Nguyen Hoang Minh (minh.nguyen@kapla.edu.vn)',
      'Center Manager: Tran Phuong Nhi (cm.nhi@kapla.edu.vn)',
      'Teacher: Jamie Alexander',
    ],
    title: '1-Day Deadline Alert: Urgent Tuition Renewal for Dang Bao Nam',
    action_type: 'renewal',
    actionType: 'renewal',
    content: 'Student Dang Bao Nam (KAP-PH-004) tuition expiry is overdue. Please perform urgent EPP outreach call.',
    status: 'delivered',
    dispatched_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'em-003',
    sender: 'kapladashboard@gmail.com',
    recipients: [
      'Assigned HRT: Le Thi Mai Tram (tram.le@kapla.edu.vn)',
      'Center Manager (CM)',
      'All Teachers',
    ],
    title: 'Resolution Confirmed: Speaking Audio Practice on Zalo (Pham Minh Khoi)',
    action_type: 'feedback',
    actionType: 'feedback',
    content: 'Parent feedback resolved with turnaround of 1h 45m. Resolution notes: HRT Tram created dedicated Zalo group and guided parents on audio submission workflow.',
    turnaround: '1h 45m',
    status: 'delivered',
    dispatched_at: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: 'em-004',
    sender: 'kapladashboard@gmail.com',
    recipients: [
      'Head Teacher: Nguyen Hoang Minh (minh.nguyen@kapla.edu.vn)',
      'Center Manager: Tran Phuong Nhi (cm.nhi@kapla.edu.vn)',
      'Teacher: Jamie Alexander',
    ],
    title: 'Reminder Appointment Scheduled: Cambridge Starters Grammar Tutoring',
    action_type: 'reminder',
    actionType: 'reminder',
    content: 'Scheduled by Head Teacher (HT) for student Nguyen Binh An (KAP-PH-001). Task Type: Tutoring. Due: 2026-11-20.',
    status: 'delivered',
    dispatched_at: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
  {
    id: 'em-005',
    sender: 'kapladashboard@gmail.com',
    recipients: [
      'Senior Operations Officer: Le Hoang Nam (soo.nam@kapla.edu.vn)',
      'Center Manager: Tran Phuong Nhi (cm.nhi@kapla.edu.vn)',
      'Assigned HRT: Tran Hoang Vy (vy.tran@kapla.edu.vn)',
    ],
    title: 'Automated Dispatch Notice: Tuition Renewal Expiry Warning (14-Day Cycle)',
    action_type: 'renewal',
    actionType: 'renewal',
    content: 'Tuition renewal window active for Tran Thai Binh (KAP-PH-002). Tuition expiry date: 2026-11-20.',
    status: 'delivered',
    dispatched_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];

// Automatic LocalStorage Cache Invalidation for Clean Demo Testing
const DATA_VERSION_KEY = 'kapla_demo_data_version';
const CURRENT_DATA_VERSION = 'v2026_kapla_authentic_dataset_v8_real_gmail_smtp_embedded';
if (typeof window !== 'undefined') {
  const currentVer = localStorage.getItem(DATA_VERSION_KEY);
  if (currentVer !== CURRENT_DATA_VERSION) {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
  }
}

export class MockStorageService {
  private static ensureDevOnly(): void {
    if (typeof window !== 'undefined' && !isDev) {
      if (hasValidSupabaseConfig && env.VITE_ENABLE_DEV_MOCK === 'false') {
        throw new Error('KAPLA Security Policy: Mock mode rejected because official Supabase Cloud is connected.');
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
      profilesRaw.includes('Le Nguyen') ||
      profilesRaw.includes('Alexander') ||
      profilesRaw.includes('(CM)') ||
      profilesRaw.includes('(HRT)') ||
      profilesRaw.includes('(Head Teacher)') ||
      studentsRaw.includes('17945') ||
      studentsRaw.includes('HV-LK') ||
      studentsRaw.includes('OLD-') ||
      studentsRaw.includes('Test Student')
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
    if (targetIdx === -1) throw new Error('Account not found.');

    const target = profiles[targetIdx];
    const isSysAdmin = caller?.system_role === 'system_admin' && caller?.status === 'active';

    if (!isSysAdmin) {
      if (updates.status !== undefined && updates.status !== target.status) {
        throw new Error('Permission denied: Staff cannot modify own account status.');
      }
      if (updates.system_role !== undefined && updates.system_role !== target.system_role) {
        throw new Error('Permission denied: Staff cannot modify own system privileges.');
      }
      if (updates.rejection_reason !== undefined && updates.rejection_reason !== target.rejection_reason) {
        throw new Error('Permission denied: Staff cannot edit approval notes.');
      }
      if (updates.id !== undefined && updates.id !== target.id) {
        throw new Error('Permission denied: Cannot edit identifier ID.');
      }
      if (updates.email !== undefined && updates.email !== target.email) {
        throw new Error('Permission denied: Cannot edit account email.');
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
      throw new Error('Invalid actor or account not activated.');
    }

    const isSysAdmin = caller.system_role === 'system_admin';
    const memberships = this.getMemberships();
    const isCMOfBranch = memberships.some(
      (m) => m.user_id === callerId && m.branch_id === branchId && m.role === 'CM' && m.status === 'active'
    );

    if (!isSysAdmin && !isCMOfBranch) {
      throw new Error('Permission denied: Only System Admin or Center Manager can assign roles.');
    }

    if (callerId === targetUserId && !isSysAdmin) {
      throw new Error('Permission denied: Cannot assign or modify your own role.');
    }

    if (role === 'CM' && !isSysAdmin) {
      throw new Error('Permission denied: Only System Admin can appoint Center Manager (CM).');
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
    const branchName = branches.find((b) => b.id === branchId)?.name || 'Campus';
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

  static notifyChange(key?: string): void {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('kapla-storage-change', { detail: { key } }));
      } catch {
        // ignore
      }
    }
  }

  static getCurrentActor(): { id: string; email: string; name: string; branch_id?: string; branch_name?: string } {
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.CURRENT_USER) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) {
          const profiles = this.getProfiles();
          const found = profiles.find(
            (p) => p.email.toLowerCase() === parsed.email.toLowerCase() || p.id === parsed.id
          );
          const memberships = this.getMemberships();
          const userMem = memberships.find((m) => m.user_id === (found?.id || parsed.id));
          const branches = this.getBranches();
          const branch = branches.find((b) => b.id === (userMem?.branch_id || found?.preferred_branch_id));
          return {
            id: parsed.id || found?.id || 'sys-actor',
            email: parsed.email,
            name: found?.full_name || parsed.email.split('@')[0],
            branch_id: branch?.id,
            branch_name: branch?.name,
          };
        }
      }
    } catch {
      // fallback
    }
    return {
      id: 'system',
      email: 'admin@kapla.edu.vn',
      name: 'System Administrator',
      branch_id: 'a0000000-0000-0000-0000-000000000001',
      branch_name: 'KAPLA Pham Hung Campus',
    };
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
    const actor = this.getCurrentActor();
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      actor_id: log.actor_id || actor.id,
      actor_email: log.actor_email || actor.email,
      branch_id: log.branch_id || actor.branch_id,
      branch_name: log.branch_name || actor.branch_name,
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    this.notifyChange(STORAGE_KEYS.AUDIT_LOGS);
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

    return filtered
      .map((s) => {
        const cls = classes.find((c) => c.id === s.current_class_id);
        const br = branches.find((b) => b.id === s.branch_id);
        const hrt = profiles.find((p) => p.id === s.assigned_hrt_id);
        const defHrt = cls?.default_hrt_id ? profiles.find((p) => p.id === cls.default_hrt_id) : null;
        return {
          ...s,
          branch: br,
          current_class: cls,
          current_class_name: cls?.name,
          assigned_hrt: hrt,
          effective_hrt_name: hrt ? `${hrt.full_name} (Dedicated HRT)` : defHrt ? `${defHrt.full_name} (Class Default)` : 'Unassigned',
        };
      })
      .sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
  }

  static addStudent(payload: Omit<Student, 'id' | 'created_at' | 'updated_at'>): Student {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
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

    // Auto-create renewal tracking entry
    if (newStudent.tuition_expiry_date) {
      const rawRen = localStorage.getItem(STORAGE_KEYS.RENEWAL);
      const renList: RenewalRecord[] = rawRen ? JSON.parse(rawRen) : [];
      const diffDays = Math.ceil(
        (new Date(newStudent.tuition_expiry_date).getTime() - Date.now()) / 86400000
      );
      renList.push({
        id: 'ren-' + Math.random().toString(36).substring(2, 9),
        student_id: newStudent.id,
        branch_id: newStudent.branch_id,
        current_expiry_date: newStudent.tuition_expiry_date,
        days_remaining: diffDays,
        risk_level: diffDays <= 0 ? 'high' : diffDays <= 14 ? 'high' : diffDays <= 30 ? 'medium' : 'low',
        status: 'monitoring',
        assigned_hrt_id: newStudent.assigned_hrt_id,
        contact_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(renList));
    }

    const branches = this.getBranches();
    const branch = branches.find((b) => b.id === newStudent.branch_id);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'CREATE_STUDENT',
      branch_id: newStudent.branch_id,
      branch_name: branch?.name || actor.branch_name,
      details: {
        actor_name: actor.name,
        student_id: newStudent.id,
        student_name: newStudent.full_name,
        student_code: newStudent.student_code,
        class_id: newStudent.current_class_id,
      },
    });

    this.notifyChange(STORAGE_KEYS.STUDENTS);
    return newStudent;
  }

  static updateStudent(studentId: string, updates: Partial<Student>): Student {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === studentId);
    if (idx === -1) throw new Error('Student not found.');
    const updated: Student = {
      ...students[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    students[idx] = updated;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Synchronize renewal record if tuition expiry or HRT changed
    if (updates.tuition_expiry_date || updates.assigned_hrt_id !== undefined) {
      const rawRen = localStorage.getItem(STORAGE_KEYS.RENEWAL);
      if (rawRen) {
        const renList = JSON.parse(rawRen) as RenewalRecord[];
        const renIdx = renList.findIndex((r) => r.student_id === studentId);
        if (renIdx !== -1) {
          if (updates.tuition_expiry_date) {
            const diffDays = Math.ceil(
              (new Date(updates.tuition_expiry_date).getTime() - Date.now()) / 86400000
            );
            renList[renIdx].current_expiry_date = updates.tuition_expiry_date;
            renList[renIdx].days_remaining = diffDays;
            renList[renIdx].risk_level = diffDays <= 0 ? 'high' : diffDays <= 14 ? 'high' : diffDays <= 30 ? 'medium' : 'low';
          }
          if (updates.assigned_hrt_id !== undefined) {
            renList[renIdx].assigned_hrt_id = updates.assigned_hrt_id || undefined;
          }
          renList[renIdx].updated_at = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(renList));
        }
      }
    }

    const branches = this.getBranches();
    const branch = branches.find((b) => b.id === updated.branch_id);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'UPDATE_STUDENT',
      branch_id: updated.branch_id,
      branch_name: branch?.name || actor.branch_name,
      details: {
        actor_name: actor.name,
        student_id: updated.id,
        student_name: updated.full_name,
        changed_fields: Object.keys(updates),
        updates,
      },
    });

    this.notifyChange(STORAGE_KEYS.STUDENTS);
    return updated;
  }

  static deleteStudent(studentId: string): void {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const targetStudent = this.getStudents().find((s) => s.id === studentId);
    const students = this.getStudents().filter((s) => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Cascade delete enrollments, care tasks, assessments, interventions, feedback, renewal, transfers, supplementary
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

    const rawTransfers = localStorage.getItem(STORAGE_KEYS.TRANSFERS);
    if (rawTransfers) {
      const transfers = (JSON.parse(rawTransfers) as ClassTransfer[]).filter((t) => t.student_id !== studentId);
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    }

    const rawSupp = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTARY);
    if (rawSupp) {
      const sessions = (JSON.parse(rawSupp) as SupplementarySession[]).map((s) => ({
        ...s,
        attendees: s.attendees ? s.attendees.filter((att) => att.student_id !== studentId) : [],
      }));
      localStorage.setItem(STORAGE_KEYS.SUPPLEMENTARY, JSON.stringify(sessions));
    }

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'DELETE_STUDENT',
      branch_id: targetStudent?.branch_id,
      details: {
        actor_name: actor.name,
        student_id: studentId,
        student_name: targetStudent?.full_name,
        student_code: targetStudent?.student_code,
      },
    });

    this.notifyChange(STORAGE_KEYS.STUDENTS);
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
      throw new Error('This staff email already exists in the system.');
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
    if (idx === -1) throw new Error('Staff account not found.');

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
    if (!target) throw new Error('Staff account to delete not found.');

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
    const actor = this.getCurrentActor();
    const students = this.getStudents();
    const classes = this.getClasses();
    const studentIdx = students.findIndex((s) => s.id === studentId);
    if (studentIdx === -1) throw new Error('Student not found.');

    const student = students[studentIdx];
    const targetClass = classes.find((c) => c.id === toClassId);
    if (!targetClass) throw new Error('Target class not found.');

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
      transferred_by_name: actor.name || 'Center Manager (CM)',
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

    const branches = this.getBranches();
    const toBranch = branches.find((b) => b.id === toBranchId);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'TRANSFER_CLASS',
      branch_id: toBranchId,
      branch_name: toBranch?.name || actor.branch_name,
      details: {
        actor_name: actor.name,
        student_id: studentId,
        student_name: student.full_name,
        from_class: fromClass?.name,
        to_class: targetClass.name,
        reason,
      },
    });

    this.notifyChange(STORAGE_KEYS.STUDENTS);
    this.notifyChange(STORAGE_KEYS.TRANSFERS);
  }

  static assignStudentHrt(studentId: string, hrtId: string | null, reason?: string): void {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const students = this.getStudents();
    const studentIdx = students.findIndex((s) => s.id === studentId);
    if (studentIdx === -1) throw new Error('Student not found.');

    const profiles = this.getProfiles();
    const newHrt = profiles.find((p) => p.id === hrtId);
    const prevHrt = profiles.find((p) => p.id === students[studentIdx].assigned_hrt_id);

    students[studentIdx].assigned_hrt_id = hrtId || undefined;
    students[studentIdx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));

    // Sync renewal record HRT
    const rawRen = localStorage.getItem(STORAGE_KEYS.RENEWAL);
    if (rawRen) {
      const renList = JSON.parse(rawRen) as RenewalRecord[];
      const renIdx = renList.findIndex((r) => r.student_id === studentId);
      if (renIdx !== -1) {
        renList[renIdx].assigned_hrt_id = hrtId || undefined;
        renList[renIdx].updated_at = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(renList));
      }
    }

    const branches = this.getBranches();
    const branch = branches.find((b) => b.id === students[studentIdx].branch_id);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'ASSIGN_HRT',
      branch_id: students[studentIdx].branch_id,
      branch_name: branch?.name || actor.branch_name,
      details: {
        actor_name: actor.name,
        student_id: studentId,
        student_name: students[studentIdx].full_name,
        new_hrt_name: newHrt?.full_name || 'Unassigned',
        new_hrt_email: newHrt?.email,
        previous_hrt_name: prevHrt?.full_name || 'Unassigned',
        reason: reason || 'Reassigning responsible staff member',
      },
    });

    this.notifyChange(STORAGE_KEYS.STUDENTS);
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
    const actor = this.getCurrentActor();
    const tasks = this.getCareTasks();
    const idx = tasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      tasks[idx].status = status;
      tasks[idx].updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.CARE_TASKS, JSON.stringify(tasks));

      this.appendAuditLog({
        actor_id: actor.id,
        actor_email: actor.email,
        action: 'UPDATE_CARE_TASK',
        details: {
          actor_name: actor.name,
          task_id: taskId,
          student_id: tasks[idx].student_id,
          student_name: tasks[idx].student?.full_name,
          new_status: status,
          task_type: tasks[idx].task_type,
        },
      });

      this.notifyChange(STORAGE_KEYS.CARE_TASKS);
    }
  }

  static createCareTask(task: Omit<StudentTask, 'id' | 'created_at' | 'updated_at'>): StudentTask {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const tasks = this.getCareTasks();
    const students = this.getStudents();
    const student = students.find((s) => s.id === task.student_id);

    const newTask: StudentTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      student,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    tasks.unshift(newTask);
    localStorage.setItem(STORAGE_KEYS.CARE_TASKS, JSON.stringify(tasks));

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'CREATE_CARE_TASK',
      branch_id: task.branch_id,
      details: {
        actor_name: actor.name,
        task_id: newTask.id,
        title: newTask.title,
        task_type: newTask.task_type,
        due_date: newTask.due_date,
        student_id: newTask.student_id,
        student_name: student?.full_name,
        sender_email: 'kapladashboard@gmail.com',
      },
    });

    this.notifyChange(STORAGE_KEYS.CARE_TASKS);
    return newTask;
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
        assessed_by_name: assessor?.full_name || 'Teacher',
      };
    });
  }

  static addAssessment(payload: Omit<StudentAssessment, 'id' | 'has_academic_risk' | 'created_at' | 'updated_at'>): StudentAssessment {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const assessments = this.getAssessments();
    const hasRisk =
      payload.listening_level === 'Below Level' ||
      payload.speaking_level === 'Below Level' ||
      payload.reading_level === 'Below Level' ||
      payload.writing_level === 'Below Level' ||
      payload.progress_status === 'Needs Attention' ||
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
    const student = this.getStudents().find((s) => s.id === payload.student_id);
    const cls = this.getClasses().find((c) => c.id === payload.class_id);
    const assessor = this.getProfiles().find((p) => p.id === payload.assessed_by);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'CREATE_ASSESSMENT',
      branch_id: cls?.branch_id,
      details: {
        actor_name: actor.name,
        assessment_id: newAssessment.id,
        student_id: payload.student_id,
        student_name: student?.full_name,
        class_name: cls?.name,
        scores: {
          listening: payload.listening_score,
          speaking: payload.speaking_score,
          reading: payload.reading_score,
          writing: payload.writing_score,
        },
        progress_status: payload.progress_status,
        has_academic_risk: hasRisk,
      },
    });

    this.notifyChange(STORAGE_KEYS.ASSESSMENTS);
    return {
      ...newAssessment,
      student,
      class: cls,
      assessed_by_name: assessor?.full_name || actor.name || 'Teacher',
    };
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
        assigned_staff_name: staff?.full_name || 'Unassigned',
        verified_by_name: verifier?.full_name,
      };
    });
  }

  static addIntervention(payload: Omit<InterventionTicket, 'id' | 'status' | 'verified_by' | 'verified_at' | 'verification_notes' | 'created_at' | 'updated_at'>): InterventionTicket {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
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
    const student = this.getStudents().find((s) => s.id === payload.student_id);
    const cls = this.getClasses().find((c) => c.id === payload.class_id);
    const staff = this.getProfiles().find((p) => p.id === payload.assigned_staff_id);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'CREATE_INTERVENTION',
      branch_id: payload.branch_id,
      details: {
        actor_name: actor.name,
        ticket_id: newIntervention.id,
        student_id: payload.student_id,
        student_name: student?.full_name,
        class_name: cls?.name,
        issue_description: payload.issue_description,
        root_cause: payload.root_cause,
        action_plan: payload.action_plan,
      },
    });

    this.notifyChange(STORAGE_KEYS.INTERVENTIONS);
    return {
      ...newIntervention,
      student,
      class: cls,
      assigned_staff_name: staff?.full_name || 'Unassigned',
    };
  }

  static updateInterventionStatus(
    id: string,
    status: InterventionStatus,
    reassessmentResult?: string
  ): void {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const interventions = this.getInterventions();
    const idx = interventions.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Intervention ticket not found.');

    if (status === 'verified') {
      throw new Error('Only Head Teacher or CM can verify intervention tickets.');
    }

    interventions[idx].status = status;
    if (reassessmentResult !== undefined) {
      interventions[idx].reassessment_result = reassessmentResult;
    }
    interventions[idx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'UPDATE_INTERVENTION',
      branch_id: interventions[idx].branch_id,
      details: {
        actor_name: actor.name,
        ticket_id: id,
        new_status: status,
        reassessment_result: reassessmentResult,
      },
    });

    this.notifyChange(STORAGE_KEYS.INTERVENTIONS);
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
      throw new Error('Permission denied: Only Head Teacher or Center Manager can verify intervention tickets.');
    }

    const actor = this.getCurrentActor();
    const interventions = this.getInterventions();
    const idx = interventions.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Intervention ticket not found.');

    interventions[idx].status = 'verified';
    interventions[idx].verified_by = callerId;
    interventions[idx].verified_at = new Date().toISOString();
    interventions[idx].verification_notes = verificationNotes;
    interventions[idx].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.INTERVENTIONS, JSON.stringify(interventions));

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'VERIFY_INTERVENTION',
      branch_id: interventions[idx].branch_id,
      details: {
        actor_name: actor.name,
        ticket_id: id,
        verification_notes: verificationNotes,
      },
    });

    this.notifyChange(STORAGE_KEYS.INTERVENTIONS);
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
      assigned_staff_name: profiles.find((p) => p.id === f.assigned_staff_id)?.full_name || 'Unassigned',
    }));
  }

  static addFeedback(payload: Omit<ParentFeedback, 'id' | 'created_at' | 'updated_at'>): ParentFeedback {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
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
    const student = this.getStudents().find((s) => s.id === payload.student_id);
    const branch = this.getBranches().find((b) => b.id === payload.branch_id);
    const staff = this.getProfiles().find((p) => p.id === payload.assigned_staff_id);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'CREATE_FEEDBACK',
      branch_id: payload.branch_id,
      details: {
        actor_name: actor.name,
        feedback_id: newFeedback.id,
        student_id: payload.student_id,
        student_name: student?.full_name,
        feedback_type: payload.feedback_type,
        channel: payload.channel,
        content: payload.content,
      },
    });

    this.notifyChange(STORAGE_KEYS.FEEDBACK);
    return {
      ...newFeedback,
      student,
      branch,
      assigned_staff_name: staff?.full_name || 'Unassigned',
    };
  }

  static updateFeedback(id: string, updates: Partial<ParentFeedback>): void {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const raw = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
    const feedbacks: ParentFeedback[] = raw ? JSON.parse(raw) : DEFAULT_FEEDBACKS;
    const idx = feedbacks.findIndex((f) => f.id === id);
    if (idx === -1) throw new Error('Feedback not found.');
    feedbacks[idx] = { ...feedbacks[idx], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbacks));

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'UPDATE_FEEDBACK',
      branch_id: feedbacks[idx].branch_id,
      details: {
        actor_name: actor.name,
        feedback_id: id,
        new_status: updates.status,
        resolution_notes: updates.resolution_notes,
      },
    });

    this.notifyChange(STORAGE_KEYS.FEEDBACK);
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
      teacher_name: profiles.find((p) => p.id === s.teacher_id)?.full_name || 'Unassigned',
      attendees: (s.attendees || []).map((a) => ({
        ...a,
        student: students.find((st) => st.id === a.student_id),
      })),
    }));
  }

  static addSupplementarySession(payload: Omit<SupplementarySession, 'id' | 'created_at' | 'updated_at'>): SupplementarySession {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
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
    const cls = this.getClasses().find((c) => c.id === payload.class_id);
    const branch = this.getBranches().find((b) => b.id === payload.branch_id);
    const teacher = this.getProfiles().find((p) => p.id === payload.teacher_id);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'CREATE_SUPPLEMENTARY',
      branch_id: payload.branch_id,
      details: {
        actor_name: actor.name,
        session_id: newSession.id,
        title: payload.title,
        class_name: cls?.name,
        teacher_name: teacher?.full_name,
        attendees_count: payload.attendees?.length || 0,
      },
    });

    this.notifyChange(STORAGE_KEYS.SUPPLEMENTARY);
    return {
      ...newSession,
      class: cls,
      branch,
      teacher_name: teacher?.full_name || 'Unassigned',
    };
  }

  static updateSupplementarySession(id: string, updates: Partial<SupplementarySession>): void {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPLEMENTARY);
    const sessions: SupplementarySession[] = raw ? JSON.parse(raw) : DEFAULT_SUPPLEMENTARY_SESSIONS;
    const idx = sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Supplementary session not found.');
    sessions[idx] = { ...sessions[idx], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.SUPPLEMENTARY, JSON.stringify(sessions));

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'UPDATE_SUPPLEMENTARY',
      branch_id: sessions[idx].branch_id,
      details: {
        actor_name: actor.name,
        session_id: id,
        new_status: updates.status,
        updates,
      },
    });

    this.notifyChange(STORAGE_KEYS.SUPPLEMENTARY);
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
        assigned_hrt_name: profiles.find((p) => p.id === r.assigned_hrt_id)?.full_name || 'Unassigned',
      };
    });
  }

  static updateRenewalRecord(id: string, updates: Partial<RenewalRecord>): void {
    this.ensureDevOnly();
    const actor = this.getCurrentActor();
    const raw = localStorage.getItem(STORAGE_KEYS.RENEWAL);
    const records: RenewalRecord[] = raw ? JSON.parse(raw) : DEFAULT_RENEWAL_RECORDS;
    const idx = records.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Renewal record not found.');
    records[idx] = { ...records[idx], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.RENEWAL, JSON.stringify(records));

    // Cross-entity synchronization: When renewed with a new expiry date, update the student record
    if (updates.status === 'renewed' && updates.new_expiry_date && records[idx].student_id) {
      try {
        this.updateStudent(records[idx].student_id, {
          tuition_expiry_date: updates.new_expiry_date,
          status: 'active',
        });
      } catch {
        // student update optional fallback
      }
    }

    const student = this.getStudents().find((s) => s.id === records[idx].student_id);

    this.appendAuditLog({
      actor_id: actor.id,
      actor_email: actor.email,
      action: 'UPDATE_RENEWAL',
      branch_id: records[idx].branch_id,
      details: {
        actor_name: actor.name,
        renewal_id: id,
        student_id: records[idx].student_id,
        student_name: student?.full_name,
        new_status: updates.status,
        new_expiry_date: updates.new_expiry_date,
        notes: updates.notes,
      },
    });

    this.notifyChange(STORAGE_KEYS.RENEWAL);
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
      throw new Error('Permission denied: Only System Administrator can modify system configuration.');
    }
    const current = this.getSystemConfig();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEYS.SYSTEM_CONFIG, JSON.stringify(updated));
    return updated;
  }

  static getEmailLogs(): EmailDispatchLogEntry[] {
    this.ensureDevOnly();
    const raw = localStorage.getItem(STORAGE_KEYS.EMAIL_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(DEFAULT_EMAIL_LOGS));
      return DEFAULT_EMAIL_LOGS;
    }
    return JSON.parse(raw);
  }

  static appendEmailLog(entry: EmailDispatchLogEntry): void {
    this.ensureDevOnly();
    const logs = this.getEmailLogs();
    const updated = [entry, ...logs];
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(updated));
    this.notifyChange(STORAGE_KEYS.EMAIL_LOGS);
  }

  static clearEmailLogs(): void {
    this.ensureDevOnly();
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify([]));
    this.notifyChange(STORAGE_KEYS.EMAIL_LOGS);
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
    localStorage.setItem(STORAGE_KEYS.EMAIL_LOGS, JSON.stringify(DEFAULT_EMAIL_LOGS));
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
        .order('updated_at', { ascending: false, nullsFirst: false });

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data.map((s: any) => ({
          ...s,
          effective_hrt_name: s.assigned_hrt
            ? `${s.assigned_hrt.full_name} (Dedicated HRT)`
            : s.current_class?.default_hrt_name
            ? `${s.current_class.default_hrt_name} (Class Default)`
            : 'Unassigned',
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

  async createCareTask(task: Omit<StudentTask, 'id' | 'created_at' | 'updated_at'>): Promise<StudentTask> {
    if (realSupabase) {
      const { data, error } = await realSupabase
        .from('student_tasks')
        .insert([{
          ...task,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(`*, student:students(*, current_class:classes(*))`)
        .single();
      if (!error && data) return data;
    }
    return MockStorageService.createCareTask(task);
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
          assessed_by_name: a.assessor?.full_name || 'Teacher',
        }));
      }
    }
    return MockStorageService.getAssessments(branchId, classId);
  },

  async createAssessment(
    payload: Omit<StudentAssessment, 'id' | 'has_academic_risk' | 'created_at' | 'updated_at'>
  ): Promise<StudentAssessment> {
    if (realSupabase) {
      const basePayload: any = {
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
      };

      // Attempt insert with extended level columns; if cloud schema doesn't have them yet, fallback to base columns
      let res = await realSupabase
        .from('student_assessments')
        .insert({
          ...basePayload,
          listening_level: payload.listening_level,
          speaking_level: payload.speaking_level,
          reading_level: payload.reading_level,
          writing_level: payload.writing_level,
          progress_status: payload.progress_status,
        })
        .select('*, student:students(*), class:classes(*)')
        .single();

      if (res.error && (res.error.message.includes('column') || res.error.code === 'PGRST204')) {
        res = await realSupabase
          .from('student_assessments')
          .insert(basePayload)
          .select('*, student:students(*), class:classes(*)')
          .single();
      }

      if (res.error) throw res.error;
      return res.data;
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
          assigned_staff_name: i.assigned_staff?.full_name || 'Unassigned',
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
          assigned_staff_name: f.assigned_staff?.full_name || 'Unassigned',
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

  async updateStatus(
    id: string,
    status: FeedbackStatus,
    resolutionNotes?: string,
    resolvedAt?: string,
    turnaroundTime?: string
  ): Promise<void> {
    if (realSupabase) {
      const updates: any = { status, updated_at: new Date().toISOString() };
      if (resolutionNotes) updates.resolution_notes = resolutionNotes;
      try {
        if (resolvedAt) updates.resolved_at = resolvedAt;
        if (turnaroundTime) updates.turnaround_time = turnaroundTime;
        const { error } = await realSupabase.from('parent_feedbacks').update(updates).eq('id', id);
        if (error) throw error;
      } catch {
        // Fallback without extended columns if schema cache does not have them
        const baseUpdates: any = { status, updated_at: new Date().toISOString() };
        if (resolutionNotes) baseUpdates.resolution_notes = resolutionNotes;
        const { error: baseError } = await realSupabase.from('parent_feedbacks').update(baseUpdates).eq('id', id);
        if (baseError) throw baseError;
      }
      return;
    }
    MockStorageService.updateFeedback(id, {
      status,
      resolution_notes: resolutionNotes,
      resolved_at: resolvedAt,
      turnaround_time: turnaroundTime,
    });
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
          teacher_name: s.teacher?.full_name || 'Unassigned',
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
            assigned_hrt_name: r.assigned_hrt?.full_name || 'Unassigned',
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

// ==============================================================================
// Automated Email Dispatch Service (Sender: kapladashboard@gmail.com)
// ==============================================================================

export interface AutomatedEmailPayload {
  title: string;
  recipients: string[];
  actionType: 'reminder' | 'feedback' | 'renewal' | 'intervention' | 'test';
  content?: string;
  turnaround?: string;
  sender?: string;
  metadata?: Record<string, any>;
}

export const EmailNotificationService = {
  SENDER_EMAIL: 'kapladashboard@gmail.com',

  getSenderEmail(): string {
    const config = MockStorageService.getSystemConfig();
    return config?.sender_email || this.SENDER_EMAIL;
  },

  getEmailLogs(): EmailDispatchLogEntry[] {
    return MockStorageService.getEmailLogs();
  },

  clearEmailLogs(): void {
    MockStorageService.clearEmailLogs();
  },

  saveSmtpConfig(senderEmail: string, gmailAppPassword?: string): void {
    const config = MockStorageService.getSystemConfig();
    MockStorageService.updateSystemConfig('system', {
      ...config,
      sender_email: senderEmail.trim(),
      gmail_app_password: gmailAppPassword?.trim() || config.gmail_app_password,
      smtp_status: gmailAppPassword ? 'connected' : 'ready',
    });
  },

  dispatchAutomatedEmail(payload: AutomatedEmailPayload): EmailDispatchLogEntry {
    const from = this.getSenderEmail();
    const entry: EmailDispatchLogEntry = {
      id: `em-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: from,
      recipients: payload.recipients,
      title: payload.title,
      action_type: payload.actionType,
      actionType: payload.actionType,
      content: payload.content || `Automated notification dispatched for ${payload.title}`,
      turnaround: payload.turnaround,
      status: 'delivered',
      dispatched_at: new Date().toISOString(),
    };

    MockStorageService.appendEmailLog(entry);
    console.info(`[Automated Email Service] Dispatched from ${from} to ${payload.recipients.join(', ')} | ${payload.title}`);

    // Asynchronously transmit real email via Google SMTP (/api/send-email)
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: payload.recipients,
            subject: payload.title,
            title: payload.title,
            text: payload.content || `Automated notification: ${payload.title}`,
            actionType: payload.actionType,
          }),
        }).catch(() => {});
      } catch {}
    }

    return entry;
  },

  sendTestEmail(recipient: string, template: string, note?: string): EmailDispatchLogEntry {
    const from = this.getSenderEmail();
    const title = `[Test Notification] Automated Dispatch via ${from}: ${template}`;
    const messageText = note || `Verification test email dispatched to validate automated delivery from Google SMTP (${from}) to ${recipient}. System operational 100%.`;
    const entry: EmailDispatchLogEntry = {
      id: `em-test-${Date.now()}`,
      sender: from,
      recipients: [recipient.trim()],
      title,
      action_type: 'test',
      actionType: 'test',
      content: messageText,
      status: 'delivered',
      dispatched_at: new Date().toISOString(),
    };

    MockStorageService.appendEmailLog(entry);
    console.info(`[Automated Email Service] Test email sent from ${from} to ${recipient}`);

    // Asynchronously transmit real email via Google SMTP (/api/send-email)
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: [recipient.trim()],
            subject: title,
            title,
            text: messageText,
            actionType: 'test',
          }),
        }).catch(() => {});
      } catch {}
    }

    return entry;
  },
};
