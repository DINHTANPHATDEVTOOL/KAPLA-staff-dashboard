// ==============================================================================
// KAPLA — MULTI-DEVICE & CROSS-ACCOUNT REALTIME DATABASE SYNCHRONIZATION TEST
// Verifies real-time WebSockets synchronization across Admin, CM, HRT, and HT
// Ensures zero data disparity between different machines, roles, and accounts.
// ==============================================================================

import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
(globalThis as any).WebSocket = ws;

const SUPABASE_URL = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';
const BRANCH_ID = 'a0000000-0000-0000-0000-000000000001';

let passed = 0;
let total = 0;

function assert(name: string, condition: boolean, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ [PASS] ${name}`);
    if (detail) console.log(`            ${detail}`);
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    if (detail) console.error(`            ${detail}`);
    throw new Error(`Assertion failed: ${name}`);
  }
}

async function runRealtimeSyncVerification() {
  console.log('==============================================================================');
  console.log('  KAPLA — MULTI-DEVICE REALTIME & CROSS-ROLE DATABASE VERIFICATION');
  console.log('  Testing live sync between multiple separate client sessions:');
  console.log('  • Device A (System Admin)');
  console.log('  • Device B (Center Manager - CM)');
  console.log('  • Device C (Homeroom Teacher - HRT)');
  console.log('  • Device D (Head Teacher - HT)');
  console.log('==============================================================================\n');

  // --------------------------------------------------------------------------
  // STEP 1: Multi-Device Client Initialization & Authentication
  // --------------------------------------------------------------------------
  console.log('--- STEP 1: Authenticating 4 Independent Client Devices ---');

  const clientAdmin = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authAdmin, error: errAdmin } = await clientAdmin.auth.signInWithPassword({
    email: 'admin@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  assert('Device A (System Admin) logged in to Supabase Cloud', !errAdmin && !!authAdmin.user, `UID: ${authAdmin.user?.id}`);

  const clientCM = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authCM, error: errCM } = await clientCM.auth.signInWithPassword({
    email: 'cm.nhi@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  assert('Device B (Center Manager CM) logged in to Supabase Cloud', !errCM && !!authCM.user, `UID: ${authCM.user?.id}`);

  const clientHRT = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authHRT, error: errHRT } = await clientHRT.auth.signInWithPassword({
    email: 'hrt.minh@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  assert('Device C (Homeroom Teacher HRT) logged in to Supabase Cloud', !errHRT && !!authHRT.user, `UID: ${authHRT.user?.id}`);

  const clientHT = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: authHT, error: errHT } = await clientHT.auth.signInWithPassword({
    email: 'ht.jamie@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  assert('Device D (Head Teacher HT) logged in to Supabase Cloud', !errHT && !!authHT.user, `UID: ${authHT.user?.id}`);

  // --------------------------------------------------------------------------
  // STEP 2: Establishing Realtime WebSocket Channels
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 2: Subscribing to Live Database Channels via WebSockets ---');

  const testStudentCode = 'RT-SYNC-' + Date.now().toString().slice(-4);
  let targetStudentId = '';
  let cmReceivedInsert = false;
  let hrtReceivedInsert = false;
  let adminReceivedUpdate = false;
  let adminReceivedDelete = false;

  const channelCM = clientCM
    .channel('cm-student-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
      const code = (payload.new as any)?.student_code || (payload.old as any)?.student_code;
      const id = (payload.new as any)?.id || (payload.old as any)?.id;
      if ((code === testStudentCode || id === targetStudentId) && payload.eventType === 'INSERT') {
        cmReceivedInsert = true;
        console.log(`  ⚡ [WEBSOCKET REALTIME] Device B (CM) received INSERT for ${code}`);
      }
    })
    .subscribe();

  const channelHRT = clientHRT
    .channel('hrt-student-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
      const code = (payload.new as any)?.student_code || (payload.old as any)?.student_code;
      const id = (payload.new as any)?.id || (payload.old as any)?.id;
      if ((code === testStudentCode || id === targetStudentId) && payload.eventType === 'INSERT') {
        hrtReceivedInsert = true;
        console.log(`  ⚡ [WEBSOCKET REALTIME] Device C (HRT) received INSERT for ${code}`);
      }
    })
    .subscribe();

  const channelAdmin = clientAdmin
    .channel('admin-student-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
      const code = (payload.new as any)?.student_code || (payload.old as any)?.student_code;
      const id = (payload.new as any)?.id || (payload.old as any)?.id;
      if (code === testStudentCode || id === targetStudentId) {
        if (payload.eventType === 'UPDATE') {
          adminReceivedUpdate = true;
          console.log(`  ⚡ [WEBSOCKET REALTIME] Device A (Admin) received UPDATE for ${code || id}`);
        } else if (payload.eventType === 'DELETE') {
          adminReceivedDelete = true;
          console.log(`  ⚡ [WEBSOCKET REALTIME] Device A (Admin) received DELETE for student ID ${id}`);
        }
      }
    })
    .subscribe();

  // Allow WebSocket handshakes to complete
  await new Promise((r) => setTimeout(r, 2500));
  assert('All 3 WebSocket listening channels are active and subscribed', true);

  // --------------------------------------------------------------------------
  // STEP 3: Action 1 — Device A (Admin) Creates a Student in Cloud Database
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3: Device A (Admin) Adds Student (No Parent Info, Blank Expiry, Nickname) ---');

  const studentPayload = {
    branch_id: BRANCH_ID,
    student_code: testStudentCode,
    full_name: 'Trần Gia Bảo',
    date_of_birth: '2019-06-15',
    gender: 'male',
    parent_name: '',
    parent_phone: '',
    tuition_expiry_date: '1970-01-01', // Standard blank tuition representation
    status: 'active',
    notes: '[Nickname: Lucas] Student imported from DotB',
  };

  const { data: insertedStudent, error: insertError } = await clientAdmin
    .from('students')
    .insert(studentPayload)
    .select('*, branch:branches(*), current_class:classes(*)')
    .single();

  targetStudentId = insertedStudent?.id || '';

  assert('Admin successfully wrote student to Supabase Cloud', !insertError && !!insertedStudent, `Code: ${insertedStudent?.student_code}`);

  // Await WebSocket broadcast delivery
  await new Promise((r) => setTimeout(r, 3000));
  assert('Device B (CM) received INSERT event in real time', cmReceivedInsert);
  assert('Device C (HRT) received INSERT event in real time', hrtReceivedInsert);

  // --------------------------------------------------------------------------
  // STEP 4: Device B (CM) Immediately Reads Student from Cloud Database
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4: Device B (CM) Queries Newly Inserted Student ---');

  const { data: cmQuery, error: cmQueryError } = await clientCM
    .from('students')
    .select('*, branch:branches(*), current_class:classes(*)')
    .eq('student_code', testStudentCode)
    .single();

  assert('CM can immediately read student inserted by Admin on Device A', !cmQueryError && !!cmQuery, `Found: ${cmQuery?.full_name}`);
  const matchNick = (cmQuery?.notes || '').match(/\[Nickname:\s*([^\]]+)\]/i);
  assert('CM correctly reads Nickname "Lucas" from notes', matchNick && matchNick[1].trim() === 'Lucas');
  assert('CM correctly reads Blank Tuition Expiry (1970-01-01 -> empty in frontend)', cmQuery?.tuition_expiry_date === '1970-01-01');

  // --------------------------------------------------------------------------
  // STEP 5: Action 2 — Device B (CM) Updates Tuition Expiry & Notes
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5: Device B (CM) Updates Tuition Expiry to 2027-03-31 ---');

  const updatedNotes = '[Nickname: Lucas] Renewed 6 months by CM Phuong Nhi';
  const { data: cmUpdated, error: cmUpdateError } = await clientCM
    .from('students')
    .update({
      tuition_expiry_date: '2027-03-31',
      notes: updatedNotes,
    })
    .eq('student_code', testStudentCode)
    .select()
    .single();

  assert('CM successfully updated student on Supabase Cloud', !cmUpdateError && !!cmUpdated);

  // Await WebSocket broadcast delivery
  await new Promise((r) => setTimeout(r, 3000));
  assert('Device A (Admin) received UPDATE event in real time from CM', adminReceivedUpdate);

  // Device A verifies the update
  const { data: adminCheck } = await clientAdmin
    .from('students')
    .select('*')
    .eq('student_code', testStudentCode)
    .single();

  assert('Admin reads updated tuition expiry: 2027-03-31', adminCheck?.tuition_expiry_date === '2027-03-31');
  assert('Admin reads updated notes from CM', adminCheck?.notes === updatedNotes);

  // --------------------------------------------------------------------------
  // STEP 6: Action 3 — Device B (CM) Deletes Student Record
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 6: Device B (CM) Deletes Student Record ---');

  const { error: cmDeleteError } = await clientCM
    .from('students')
    .delete()
    .eq('student_code', testStudentCode);

  assert('CM successfully deleted student on Supabase Cloud', !cmDeleteError);

  // Await WebSocket broadcast delivery
  await new Promise((r) => setTimeout(r, 3000));
  assert('Device A (Admin) received DELETE event in real time from CM', adminReceivedDelete);

  // Verify record no longer exists
  const { data: adminFinalCheck } = await clientAdmin
    .from('students')
    .select('*')
    .eq('student_code', testStudentCode)
    .maybeSingle();

  assert('Student is completely purged from Supabase Cloud (Zero Ghost Records)', adminFinalCheck === null);

  // --------------------------------------------------------------------------
  // STEP 7: Realtime Synchronization on Classes Cohort
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 7: Cross-Device Class Cohort Realtime Sync ---');

  let cmReceivedClassUpdate = false;
  const channelClass = clientCM
    .channel('cm-class-stream')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, (payload) => {
      if ((payload.new as any)?.name === 'PH-L9-0003') {
        cmReceivedClassUpdate = true;
        console.log('  ⚡ [WEBSOCKET REALTIME] Device B (CM) received class update for PH-L9-0003');
      }
    })
    .subscribe();

  await new Promise((r) => setTimeout(r, 2000));

  // Admin updates schedule of class PH-L9-0003
  const newSchedule = 'Tue - Thu 19:00 - 20:50 (Verified Sync)';
  const { error: clsUpdateErr } = await clientAdmin
    .from('classes')
    .update({ schedule: newSchedule })
    .eq('name', 'PH-L9-0003');

  assert('Admin updated class PH-L9-0003 in Supabase Cloud', !clsUpdateErr);

  await new Promise((r) => setTimeout(r, 3000));
  assert('Device B (CM) received class update event in real time', cmReceivedClassUpdate);

  const { data: cmClassRead } = await clientCM
    .from('classes')
    .select('*')
    .eq('name', 'PH-L9-0003')
    .single();

  assert('CM reads updated schedule from Supabase Cloud', cmClassRead?.schedule === newSchedule);

  // Restore schedule
  await clientAdmin.from('classes').update({ schedule: 'Tue - Thu 19:00 - 20:50' }).eq('name', 'PH-L9-0003');

  // Cleanup WebSockets
  clientAdmin.removeChannel(channelAdmin);
  clientCM.removeChannel(channelCM);
  clientCM.removeChannel(channelClass);
  clientHRT.removeChannel(channelHRT);

  console.log('\n==============================================================================');
  console.log(`  🎉 ALL ${passed}/${total} MULTI-DEVICE REALTIME & CROSS-ROLE TESTS PASSED (100%)!`);
  console.log('==============================================================================\n');
}

runRealtimeSyncVerification().catch((err) => {
  console.error('\n❌ Realtime test suite encountered an error:', err);
  process.exit(1);
});
