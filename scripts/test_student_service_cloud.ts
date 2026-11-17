import ws from 'ws';
(globalThis as any).WebSocket = ws;

async function testStudentServiceOnCloud() {
  const { realSupabase, StudentService } = await import('../src/lib/supabase');
  console.log('======================================================================');
  console.log('  TESTING StudentService CRUD DIRECTLY ON SUPABASE CLOUD');
  console.log('======================================================================\n');

  if (!realSupabase) {
    throw new Error('realSupabase is not initialized!');
  }

  // 1. Sign in as Admin
  const { data: authData, error: authErr } = await realSupabase.auth.signInWithPassword({
    email: 'admin@kapla.edu.vn',
    password: 'Kapla@2026'
  });
  if (authErr || !authData.user) {
    throw new Error('Admin login failed: ' + authErr?.message);
  }
  console.log('1. Admin authenticated:', authData.user.email);

  // 2. Test StudentService.createStudent
  const singleCode = 'STU-SVC-' + Date.now().toString().slice(-4);
  const singleStudent = await StudentService.createStudent({
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: singleCode,
    full_name: 'Nguyễn Bách Khoa',
    nickname: 'Leo',
    date_of_birth: '2019-05-15',
    gender: 'male',
    parent_name: undefined,
    parent_phone: undefined,
    tuition_expiry_date: '',
    status: 'active',
    notes: 'Single student creation test'
  });
  console.log('2. StudentService.createStudent created:', singleStudent.student_code, singleStudent.full_name, singleStudent.nickname);

  // 3. Test StudentService.createStudentsBulk
  const bulkCode1 = 'BULK-1-' + Date.now().toString().slice(-4);
  const bulkCode2 = 'BULK-2-' + Date.now().toString().slice(-4);
  const bulkStudents = await StudentService.createStudentsBulk([
    {
      branch_id: 'a0000000-0000-0000-0000-000000000001',
      student_code: bulkCode1,
      full_name: 'Trần Hạ An',
      nickname: 'Doris',
      date_of_birth: '2020-03-22',
      gender: 'female',
      parent_name: undefined,
      parent_phone: undefined,
      tuition_expiry_date: '',
      status: 'active',
      notes: 'DotB Bulk import test 1'
    },
    {
      branch_id: 'a0000000-0000-0000-0000-000000000001',
      student_code: bulkCode2,
      full_name: 'Đặng Tuấn Kiệt',
      nickname: 'Alex',
      date_of_birth: '2018-11-09',
      gender: 'male',
      parent_name: undefined,
      parent_phone: undefined,
      tuition_expiry_date: '',
      status: 'active',
      notes: 'DotB Bulk import test 2'
    }
  ]);
  console.log('3. StudentService.createStudentsBulk created:', bulkStudents.length, 'students');

  // 4. Test CM sign in and read all students
  const { data: cmAuth } = await realSupabase.auth.signInWithPassword({
    email: 'cm.nhi@kapla.edu.vn',
    password: 'Kapla@2026'
  });
  console.log('4. CM authenticated:', cmAuth.user?.email);

  const cmStudents = await StudentService.getStudents('a0000000-0000-0000-0000-000000000001', cmAuth.user?.id, false, true);
  console.log('5. CM retrieved total students:', cmStudents.length);

  const foundSingle = cmStudents.find(s => s.student_code === singleCode);
  const foundBulk1 = cmStudents.find(s => s.student_code === bulkCode1);
  const foundBulk2 = cmStudents.find(s => s.student_code === bulkCode2);

  console.log('   - Found Single student for CM:', Boolean(foundSingle), foundSingle?.full_name, 'Nickname:', foundSingle?.nickname);
  console.log('   - Found Bulk student 1 for CM:', Boolean(foundBulk1), foundBulk1?.full_name, 'Nickname:', foundBulk1?.nickname);
  console.log('   - Found Bulk student 2 for CM:', Boolean(foundBulk2), foundBulk2?.full_name, 'Nickname:', foundBulk2?.nickname);

  if (!foundSingle || !foundBulk1 || !foundBulk2) {
    throw new Error('CM failed to find students created by Admin!');
  }

  // 6. Test CM updating a student
  const updatedByCm = await StudentService.updateStudent(foundSingle.id, {
    nickname: 'Leo King',
    notes: 'Updated by CM Nhi'
  });
  console.log('6. CM updated student:', updatedByCm.id, 'New Nickname:', updatedByCm.nickname);

  // 7. Cleanup
  console.log('7. Cleaning up test students...');
  await StudentService.deleteStudent(singleStudent.id);
  await StudentService.deleteStudent(bulkStudents[0].id);
  await StudentService.deleteStudent(bulkStudents[1].id);
  console.log('8. Cleanup complete!');

  console.log('\n======================================================================');
  console.log('  🎉 ALL StudentService CLOUD SYNC TESTS PASSED (100%)!');
  console.log('======================================================================\n');
}

testStudentServiceOnCloud();
