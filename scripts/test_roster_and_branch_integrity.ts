// ==============================================================================
// KAPLA — Automated Database Roster & Branch Integrity Test
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(globalThis as any).WebSocket = WebSocket;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EXPECTED_STAFF = [
  { email: 'admin@kapla.edu.vn', name: 'Admin', systemRole: 'system_admin', role: 'CM' },
  { email: 'cm.nhi@kapla.edu.vn', name: 'Phương Nhi', systemRole: 'staff', role: 'CM' },
  { email: 'ht.jamie@kapla.edu.vn', name: 'Jamie', systemRole: 'staff', role: 'Head Teacher' },
  { email: 'hrt.minh@kapla.edu.vn', name: 'Minh', systemRole: 'staff', role: 'HRT' },
  { email: 'hrt.tram@kapla.edu.vn', name: 'Trâm', systemRole: 'staff', role: 'HRT' },
  { email: 'hrt.vy@kapla.edu.vn', name: 'Vy', systemRole: 'staff', role: 'HRT' },
];

const PH_BRANCH_ID = 'a0000000-0000-0000-0000-000000000001';

async function run() {
  console.log('=== TEST 1: DATABASE INTEGRITY & EXACT ROSTER AUDIT ===\n');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failCount++;
    }
  }

  // 1. Check Profiles count and content
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').order('email');
  assert(!pErr, 'Query profiles table successfully');
  assert(profiles?.length === 6, `Profiles count is exactly 6 (Found: ${profiles?.length})`);

  for (const exp of EXPECTED_STAFF) {
    const found = profiles?.find((p) => p.email === exp.email);
    assert(Boolean(found), `Staff profile exists for ${exp.email}`);
    assert(found?.full_name === exp.name, `Exact clean name for ${exp.email} is "${exp.name}" (Found: "${found?.full_name}")`);
    assert(found?.system_role === exp.systemRole, `System role for ${exp.email} is "${exp.systemRole}"`);
    assert(found?.preferred_branch_id === PH_BRANCH_ID, `Preferred branch for ${exp.email} is Pham Hung`);
  }

  // 2. Check Auth Users
  const { data: userList } = await supabase.auth.admin.listUsers();
  assert(userList?.users.length === 6, `auth.users count is exactly 6 (Found: ${userList?.users.length})`);
  for (const exp of EXPECTED_STAFF) {
    const foundUser = userList?.users.find((u) => u.email === exp.email);
    assert(Boolean(foundUser), `auth.user exists for ${exp.email}`);
  }

  // 3. Check Branches
  const { data: branches, error: bErr } = await supabase.from('branches').select('*');
  assert(!bErr, 'Query branches table successfully');
  assert(branches?.length === 1, `Branches count is exactly 1 (Found: ${branches?.length})`);
  assert(branches?.[0]?.id === PH_BRANCH_ID, `Single branch is KAPLA Phạm Hùng (${branches?.[0]?.name})`);
  assert(branches?.[0]?.code === 'PH', `Branch code is "PH"`);

  // 4. Check Branch Memberships
  const { data: memberships, error: mErr } = await supabase.from('branch_memberships').select('*, profile:profiles(*)');
  assert(!mErr, 'Query branch_memberships successfully');
  assert(memberships?.length === 6, `Memberships count is exactly 6 (Found: ${memberships?.length})`);
  for (const m of memberships || []) {
    assert(m.branch_id === PH_BRANCH_ID, `Membership for user ${(m.profile as any)?.email} is assigned to Pham Hung`);
    assert(m.status === 'active', `Membership for user ${(m.profile as any)?.email} is active`);
  }

  // 5. Check Classes
  const { data: classes, error: cErr } = await supabase.from('classes').select('*');
  assert(!cErr, 'Query classes table successfully');
  assert(classes?.length === 4, `Classes count is exactly 4 at Pham Hung (Found: ${classes?.length})`);
  for (const c of classes || []) {
    assert(c.branch_id === PH_BRANCH_ID, `Class ${c.name} belongs to Pham Hung branch`);
  }

  // 6. Check Students
  const { data: students, error: sErr } = await supabase.from('students').select('*').order('student_code');
  assert(!sErr, 'Query students table successfully');
  assert(students?.length === 8, `Students count is exactly 8 at Pham Hung (Found: ${students?.length})`);
  for (const s of students || []) {
    assert(s.branch_id === PH_BRANCH_ID, `Student ${s.full_name} (${s.student_code}) belongs to Pham Hung branch`);
    assert(s.student_code.startsWith('KAP-PH-'), `Student code is standardized prefix KAP-PH- (${s.student_code})`);
  }

  console.log(`\n========================================`);
  console.log(`ROSTER INTEGRITY TEST SUMMARY:`);
  console.log(`  PASSED: ${passCount}`);
  console.log(`  FAILED: ${failCount}`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
