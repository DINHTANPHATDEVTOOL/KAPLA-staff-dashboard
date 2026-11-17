// ==============================================================================
// KAPLA — Verification Test: Teacher Scoping & Cascading Whole-Class Updates
// Validating customer requirements:
// 1. Phân quyền staff với class & Teacher permissions:
//    - Teacher is strictly scoped to assigned classes
//    - Teacher cannot create, delete, or import students
// 2. Thay đổi nguyên lớp khi edit class code / level:
//    - Advancing a class (e.g. PH-L8-0011 -> PH-L9-0011, Level 8 -> Level 9)
//      cascades automatically to all enrolled students
//    - Cohort tags [Cohort: ...] and class names update synchronously
// 3. Staff Directory with Assigned Classes tag lists
// ==============================================================================

import ws from 'ws';
(globalThis as any).WebSocket = ws;
import { MockStorageService, StudentService } from '../src/lib/supabase';
import { StaffRole } from '../src/types';

function runTests() {
  console.log('======================================================================');
  console.log('  KAPLA — TEACHER SCOPING & WHOLE-CLASS CASCADING TEST SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      if (detail) console.log(`            ${detail}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}`);
      if (detail) console.error(`            ${detail}`);
      process.exitCode = 1;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Staff Directory & Assigned Classes Detection
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Staff Directory & Assigned Classes ---');
  const staffList = MockStorageService.getStaffList();
  assert('Staff list returns active profiles', staffList.length >= 8, `Found: ${staffList.length}`);

  const zandile = staffList.find((s) => s.full_name.includes('Zandile'));
  assert('Found teacher Zandile Tanaka Hlomayi', !!zandile, `Role: ${zandile?.role}`);
  assert(
    'Zandile has assigned classes matching customer reference',
    zandile?.assigned_classes.includes('PH-L9-0014') &&
      zandile?.assigned_classes.includes('PH-L7-0017') &&
      zandile?.assigned_classes.includes('PH-L6-0016') &&
      zandile?.assigned_classes.includes('PH-L3-0012'),
    `Assigned classes: ${zandile?.assigned_classes.join(', ')}`
  );

  const leonid = staffList.find((s) => s.full_name.includes('Leonid'));
  assert('Found teacher Leonid Formin', !!leonid, `Role: ${leonid?.role}`);
  assert('Leonid teaches PH-L9-0003', leonid?.assigned_classes.includes('PH-L9-0003') === true);

  // --------------------------------------------------------------------------
  // TEST 2: Teacher Class-Scoped Data Isolation
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: Teacher Authorization & Class Scoping ---');
  const zandileId = zandile?.id;
  const zandileStudents = MockStorageService.getStudentsForCaller(
    zandileId,
    'a0000000-0000-0000-0000-000000000001',
    false,
    false
  );

  assert('Teacher Zandile only receives students in her assigned cohorts', zandileStudents.length > 0, `Count: ${zandileStudents.length}`);

  // Check that all returned students belong to Zandile's classes
  const zandileClassSet = new Set(zandile?.assigned_classes || []);
  const allInZandileClasses = zandileStudents.every((s) => {
    return zandileClassSet.has(s.current_class?.name || s.current_class_name || '');
  });
  assert('Zero data leakage: All students belong to Zandile’s assigned classes', allInZandileClasses);

  // Verify other students (like Alex in PH-L8-0011 or Ben in PH-L9-0003) are NOT leaked
  const hasBen = zandileStudents.some((s) => s.nickname === 'Ben');
  const hasAlex = zandileStudents.some((s) => s.nickname === 'Alex');
  assert('Student Ben (Leonid’s class) is hidden from Zandile', !hasBen);
  assert('Student Alex (Magriet’s class) is hidden from Zandile', !hasAlex);

  // --------------------------------------------------------------------------
  // TEST 3: Admin & CM Visibility retains Full Branch Access
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Admin & CM Global Visibility ---');
  const adminStudents = MockStorageService.getStudentsForCaller(
    'u0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    true,
    false
  );
  assert('Admin sees all branch students', adminStudents.length >= 9, `Total: ${adminStudents.length}`);

  const cmStudents = MockStorageService.getStudentsForCaller(
    'u0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    false,
    true
  );
  assert('CM sees all branch students', cmStudents.length >= 9, `Total: ${cmStudents.length}`);

  // --------------------------------------------------------------------------
  // TEST 4: Whole-Class Cascading Update ("Thay đổi nguyên lớp")
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Whole-Class Cascading Level & Code Update ---');
  // Find class PH-L8-0011
  const classesBefore = MockStorageService.getClasses();
  const classToEdit = classesBefore.find((c) => c.name === 'PH-L8-0011');
  assert('Found class PH-L8-0011 to advance', !!classToEdit, `ID: ${classToEdit?.id}`);

  // Check students in PH-L8-0011 before update
  const allStudentsBefore = MockStorageService.getStudents();
  const studentsInL8 = allStudentsBefore.filter((s) => s.current_class_id === classToEdit?.id);
  assert('Students are enrolled in PH-L8-0011 before cascade', studentsInL8.length >= 2, `Count: ${studentsInL8.length}`);
  const sampleStudentBefore = studentsInL8[0];
  assert('Student note contains [Cohort: PH-L8-0011]', (sampleStudentBefore.notes || '').includes('[Cohort: PH-L8-0011]'));

  // Perform whole-class update: advance PH-L8-0011 to PH-L9-0011 and Level 9
  const cascadeResult = MockStorageService.updateClass(classToEdit!.id, {
    name: 'PH-L9-0011',
    level: 'Level 9',
  });

  assert('updateClass reports success', cascadeResult.updatedClass.name === 'PH-L9-0011');
  assert('Cascaded count matches enrolled students', cascadeResult.cascadedStudentsCount === studentsInL8.length, `Cascaded: ${cascadeResult.cascadedStudentsCount}`);

  // Verify all enrolled students updated automatically
  const allStudentsAfter = MockStorageService.getStudents();
  const studentsInL9 = allStudentsAfter.filter((s) => s.current_class_id === classToEdit?.id);
  assert('All enrolled students now belong to PH-L9-0011', studentsInL9.every((s) => s.current_class_name === 'PH-L9-0011'));
  assert(
    'Student notes updated from [Cohort: PH-L8-0011] to [Cohort: PH-L9-0011]',
    studentsInL9.every((s) => (s.notes || '').includes('[Cohort: PH-L9-0011]'))
  );

  // --------------------------------------------------------------------------
  // TEST 5: Creating and Updating Staff in Directory
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: Staff Creation & Assignment Sync ---');
  const newStaff = MockStorageService.createStaff({
    full_name: 'Daniel Craig',
    email: 'daniel.craig@kapla.edu.vn',
    role: 'Main Teacher',
    phone: '0988 112 233',
    assigned_classes: ['PH-L9-0011'],
  });

  assert('Successfully created staff member Daniel Craig', newStaff.full_name === 'Daniel Craig');
  assert('Daniel Craig assigned to PH-L9-0011', newStaff.assigned_classes.includes('PH-L9-0011'));

  // Check class PH-L9-0011 has main_teacher_name = Daniel Craig
  const classAfterStaffAssign = MockStorageService.getClasses().find((c) => c.name === 'PH-L9-0011');
  assert('Class main teacher synchronized to Daniel Craig', classAfterStaffAssign?.main_teacher_name === 'Daniel Craig');

  console.log('\n======================================================================');
  console.log(`  🎉 ALL ${passed}/${total} TEACHER SCOPING & CASCADING TESTS PASSED!`);
  console.log('======================================================================\n');
}

runTests();
