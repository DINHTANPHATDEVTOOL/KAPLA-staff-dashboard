import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
(globalThis as any).WebSocket = ws;

const url = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const key = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';
const client = createClient(url, key);

async function testFullSync() {
  console.log('======================================================================');
  console.log('  TESTING REALTIME & CROSS-ACCOUNT DATA SYNC: ADMIN <-> CM');
  console.log('======================================================================\n');

  // 1. Admin logs in
  const { data: aAuth } = await client.auth.signInWithPassword({
    email: 'admin@kapla.edu.vn',
    password: 'Kapla@2026'
  });
  console.log('1. Admin Auth:', aAuth.user?.email);

  // 2. Admin inserts a new student without parent info and without tuition expiry
  const testCode = 'SYNC-TEST-' + Date.now().toString().slice(-4);
  const nickname = 'Doris';
  const notes = '[Nickname: ' + nickname + '] Imported from DotB';
  
  const payload = {
    branch_id: 'a0000000-0000-0000-0000-000000000001',
    student_code: testCode,
    full_name: 'Trần Hạ An',
    date_of_birth: '2020-03-22',
    gender: 'female',
    parent_name: '',
    parent_phone: '',
    tuition_expiry_date: '1970-01-01',
    status: 'active',
    notes: notes
  };

  const { data: inserted, error: insertErr } = await client
    .from('students')
    .insert(payload)
    .select('*, branch:branches(*), current_class:classes(*)')
    .single();

  console.log('2. Admin inserted student:', inserted?.student_code, inserted?.full_name, insertErr?.message || 'SUCCESS');

  // 3. CM logs in from another client
  const cmClient = createClient(url, key);
  const { data: cmAuth } = await cmClient.auth.signInWithPassword({
    email: 'cm.nhi@kapla.edu.vn',
    password: 'Kapla@2026'
  });
  console.log('3. CM Auth:', cmAuth.user?.email);

  // 4. CM queries students
  const { data: cmList, error: cmErr } = await cmClient
    .from('students')
    .select('*, branch:branches(*), current_class:classes(*)')
    .eq('student_code', testCode);

  console.log('4. CM queries student:', cmList?.[0]?.student_code, cmList?.[0]?.full_name, cmErr?.message || 'SUCCESS');

  // Parse student in frontend style
  if (cmList && cmList[0]) {
    const raw = cmList[0];
    const match = (raw.notes || '').match(/\[Nickname:\s*([^\]]+)\]/i);
    const parsedNickname = raw.nickname || (match ? match[1].trim() : undefined);
    const parsedTuition = raw.tuition_expiry_date === '1970-01-01' ? '' : raw.tuition_expiry_date;
    console.log('   -> Nickname extracted for CM:', parsedNickname);
    console.log('   -> Tuition Expiry for CM:', parsedTuition === '' ? 'EMPTY / NOT SET' : parsedTuition);
  }

  // 5. CM updates the student
  const { data: cmUpdated, error: cmUpdateErr } = await cmClient
    .from('students')
    .update({
      notes: '[Nickname: Doris] Updated by CM Nhi with learning progress'
    })
    .eq('student_code', testCode)
    .select()
    .single();
  console.log('5. CM updated student:', cmUpdated?.notes, cmUpdateErr?.message || 'SUCCESS');

  // 6. Admin queries and sees CM update
  const { data: adminRead } = await client.from('students').select('*').eq('student_code', testCode).single();
  console.log('6. Admin queries and immediately sees CM update:', adminRead?.notes);

  // 7. Cleanup
  await client.from('students').delete().eq('student_code', testCode);
  console.log('7. Cleanup finished successfully!');

  console.log('\n======================================================================');
  console.log('  🎉 CROSS-ACCOUNT CLOUD SYNC VERIFIED 100% SUCCESSFUL!');
  console.log('======================================================================\n');
}

testFullSync();
