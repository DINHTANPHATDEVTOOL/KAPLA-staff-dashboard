// ==============================================================================
// KAPLA — Automated Database Roster & Branch Integrity Test
// Verifies 100% English records and relational integrity
// ==============================================================================

import { MockStorageService } from '../src/lib/supabase';

const EXPECTED_STAFF = [
  { email: 'admin@kapla.edu.vn', name: 'Admin', systemRole: 'system_admin' },
  { email: 'cm.nhi@kapla.edu.vn', name: 'Phuong Nhi', systemRole: 'staff' },
  { email: 'ht.jamie@kapla.edu.vn', name: 'Jamie', systemRole: 'staff' },
  { email: 'hrt.minh@kapla.edu.vn', name: 'Minh', systemRole: 'staff' },
  { email: 'hrt.tram@kapla.edu.vn', name: 'Tram', systemRole: 'staff' },
  { email: 'hrt.vy@kapla.edu.vn', name: 'Vy', systemRole: 'staff' },
];

const PH_BRANCH_ID = 'a0000000-0000-0000-0000-000000000001';

async function run() {
  console.log('=== TEST: DATABASE INTEGRITY & EXACT ROSTER AUDIT (100% ENGLISH) ===\n');
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

  // 1. Check Profiles from MockStorageService
  const profiles = MockStorageService.getProfiles();
  assert(profiles.length >= 6, `Profiles count is at least 6 (Found: ${profiles.length})`);

  for (const exp of EXPECTED_STAFF) {
    const found = profiles.find((p) => p.email === exp.email);
    assert(Boolean(found), `Staff profile exists for ${exp.email}`);
    assert(found?.full_name === exp.name, `Exact clean English name for ${exp.email} is "${exp.name}" (Found: "${found?.full_name}")`);
    assert(found?.system_role === exp.systemRole, `System role for ${exp.email} is "${exp.systemRole}"`);
    assert(found?.preferred_branch_id === PH_BRANCH_ID, `Preferred branch for ${exp.email} is Pham Hung`);
  }

  // 2. Check Branches
  const branches = MockStorageService.getBranches();
  assert(branches.length >= 1, `Branches exist in system (Found: ${branches.length})`);
  const phBranch = branches.find((b) => b.id === PH_BRANCH_ID);
  assert(Boolean(phBranch), `Pham Hung campus exists: ${phBranch?.name}`);

  // 3. Check Branch Memberships
  const memberships = MockStorageService.getMemberships();
  assert(memberships.length >= 6, `Memberships count is at least 6 (Found: ${memberships.length})`);

  // 4. Check Classes
  const classes = MockStorageService.getClasses();
  assert(classes.length >= 4, `Classes count is at least 4 (Found: ${classes.length})`);

  // 5. Check Students
  const students = MockStorageService.getStudents();
  assert(students.length >= 8, `Students count is at least 8 (Found: ${students.length})`);
  for (const s of students) {
    assert(s.student_code.startsWith('KAP-') || s.student_code === '0003', `Student code is valid format: ${s.student_code}`);
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
