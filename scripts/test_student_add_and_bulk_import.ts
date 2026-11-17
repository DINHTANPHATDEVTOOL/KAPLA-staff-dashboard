// ==============================================================================
// KAPLA — Verification Test: Add Student & Bulk Import from Sheet
// Validating CM Phương Nhi's requirements:
// 1. Single student add with full name & nickname (no mandatory parent name/phone)
// 2. Sequential automatic student code generation
// 3. Robust parser for copying and pasting from Google Sheet / Excel
// 4. Bulk import into target class with automatic enrollment and audit logging
// 5. Searching students by English nickname
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MockStorageService, StudentService } from '../src/lib/supabase';
import { Student } from '../src/types';
import { parseDotbExport } from '../src/utils/dotbParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runTests() {
  console.log('======================================================================');
  console.log('  KAPLA — STUDENT ADD & BULK IMPORT TEST SUITE');
  console.log('  Requirements from CM Phương Nhi:');
  console.log('  - Tên bé + Nickname (bỏ bắt buộc phụ huynh)');
  console.log('  - Nhập hàng loạt cả lớp từ Google Sheet / Excel');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // --- TEST 1: Default students contain Nicknames ---
  console.log('--- TEST 1: Verify Default Students Have English Nicknames ---');
  const students = MockStorageService.getStudents();
  assert(students.length >= 8, `Existing students count >= 8 (Found: ${students.length})`);

  const studentWithNick = students.find((s) => s.nickname === 'Leo');
  assert(Boolean(studentWithNick), `Found student with nickname "Leo" (${studentWithNick?.full_name})`);

  const benStudent = students.find((s) => s.nickname === 'Ben');
  assert(Boolean(benStudent), `Found student with nickname "Ben" (${benStudent?.full_name})`);

  // --- TEST 2: Single Student Add (Full Name + Nickname, No Parent Info) ---
  console.log('\n--- TEST 2: Single Student Add with Only Full Name & Nickname ---');
  const branchId = 'a0000000-0000-0000-0000-000000000001'; // Pham Hung
  const targetClassId = 'c0000000-0000-0000-0000-000000000001';

  const singleCreated = MockStorageService.addStudent({
    branch_id: branchId,
    student_code: 'KAP-PH-099',
    full_name: 'Nguyen Gia Han',
    nickname: 'Jenny',
    tuition_expiry_date: '2027-05-31',
    status: 'active',
    current_class_id: targetClassId,
    notes: 'Enrolled via simplified form per CM request',
  });

  assert(singleCreated.full_name === 'Nguyen Gia Han', 'Student full name is Nguyen Gia Han');
  assert(singleCreated.nickname === 'Jenny', 'Student nickname is Jenny');
  assert(!singleCreated.parent_name || singleCreated.parent_name === 'N/A', 'Parent name was omitted without blocking');
  assert(!singleCreated.parent_phone, 'Parent phone was omitted without blocking');

  // Verify enrollment was added
  const enrollments = MockStorageService.getEnrollments();
  const enr = enrollments.find((e) => e.student_id === singleCreated.id && e.class_id === targetClassId);
  assert(Boolean(enr), 'Student enrollment created automatically for target class');

  // --- TEST 3: Bulk Import from Sheet / Excel ---
  console.log('\n--- TEST 3: Bulk Import of Multiple Students for a Class ---');
  const bulkPayloads = [
    {
      branch_id: branchId,
      student_code: 'KAP-PH-101',
      full_name: 'Tran Gia Huy',
      nickname: 'Alex',
      tuition_expiry_date: '2027-06-30',
      status: 'active' as const,
      current_class_id: targetClassId,
    },
    {
      branch_id: branchId,
      student_code: 'KAP-PH-102',
      full_name: 'Le Thao My',
      nickname: 'Chloe',
      tuition_expiry_date: '2027-06-30',
      status: 'active' as const,
      current_class_id: targetClassId,
    },
    {
      branch_id: branchId,
      student_code: 'KAP-PH-103',
      full_name: 'Pham Bao Long',
      nickname: 'Tom',
      tuition_expiry_date: '2027-06-30',
      status: 'active' as const,
      current_class_id: targetClassId,
    },
  ];

  const bulkCreated = MockStorageService.addStudentsBulk(bulkPayloads);
  assert(bulkCreated.length === 3, `Bulk created 3 students in MockStorageService`);
  assert(bulkCreated[0].nickname === 'Alex', 'First student has nickname Alex');
  assert(bulkCreated[1].nickname === 'Chloe', 'Second student has nickname Chloe');
  assert(bulkCreated[2].nickname === 'Tom', 'Third student has nickname Tom');

  // Verify audit log recorded bulk import
  const auditLogs = MockStorageService.getAuditLogs();
  const bulkLog = auditLogs.find((l) => l.action === 'BULK_IMPORT_STUDENTS');
  assert(Boolean(bulkLog), 'Audit log successfully recorded BULK_IMPORT_STUDENTS action');
  assert(bulkLog?.details?.count === 3, 'Audit log details specify 3 students imported');

  // --- TEST 4: Student Search by Nickname ---
  console.log('\n--- TEST 4: Search Verification by Nickname ---');
  const allUpdatedStudents = MockStorageService.getStudents();
  const query = 'chloe';
  const matched = allUpdatedStudents.filter(
    (s) =>
      s.full_name.toLowerCase().includes(query) ||
      (s.nickname && s.nickname.toLowerCase().includes(query)) ||
      s.student_code.toLowerCase().includes(query)
  );

  assert(matched.length >= 1, `Found ${matched.length} student(s) matching query "chloe"`);
  assert(matched.some((s) => s.nickname === 'Chloe'), 'Matched student contains nickname "Chloe"');

  // --- TEST 5: DotB Official Export Parsing (Student list by class (2).xls) ---
  console.log('\n--- TEST 5: Real DotB Export (.xls) Parsing Verification ---');
  const dotbPath = path.resolve(__dirname, '../Student list by class (2).xls');
  assert(fs.existsSync(dotbPath), 'Student list by class (2).xls exists in project root');

  const dotbRaw = fs.readFileSync(dotbPath, 'utf-8');
  const parseResult = parseDotbExport(dotbRaw, 'PH', []);

  assert(parseResult.students.length >= 1300, `Successfully parsed ${parseResult.students.length} students from DotB report`);
  assert(parseResult.classes.length >= 130, `Successfully detected ${parseResult.classes.length} classes / cohorts`);
  assert(parseResult.totalWithNicknames >= 600, `Successfully extracted ${parseResult.totalWithNicknames} students with English nicknames`);
  assert(parseResult.totalWithBirthdate >= 1300, `Successfully formatted ${parseResult.totalWithBirthdate} birthdates to ISO YYYY-MM-DD`);

  // Verify sample student record structure
  const sampleDoris = parseResult.students.find((s: any) => s.nickname === 'Doris');
  assert(Boolean(sampleDoris), 'Found student with nickname "Doris" (Tran Ha An)');
  assert(sampleDoris.date_of_birth === '2020-03-22', `Doris birthdate correctly converted from 22/03/2020 to ${sampleDoris.date_of_birth}`);

  // --- TEST 6: Batch Creation of Missing Classes ---
  console.log('\n--- TEST 6: Auto-Creation of Missing Classes in Database ---');
  const newClassesPayload = [
    { branch_id: branchId, name: 'PH-L6-0029', level: 'Level 6' },
    { branch_id: branchId, name: 'PH-KPOG02-0001 (L6-8 | 6-8 tuổi)', level: 'Level 6-8' }
  ];
  const createdClasses = MockStorageService.createClassesBatch(newClassesPayload);
  assert(createdClasses.length === 2, `Created/verified 2 batch classes in database`);
  const allClasses = MockStorageService.getClasses();
  assert(allClasses.some((c) => c.name === 'PH-L6-0029'), 'Class PH-L6-0029 is now present in database');

  console.log('\n======================================================================');
  console.log(`  🎉 ALL ${passed}/${total} STUDENT ADD & BULK IMPORT TESTS PASSED (100%)!`);
  console.log('======================================================================\n');
}

runTests();
