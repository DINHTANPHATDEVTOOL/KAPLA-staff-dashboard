// ==============================================================================
// KAPLA — 5-ACCOUNT MULTI-DEVICE DATA EXCHANGE & REALTIME TEST SUITE
// Tests 5 independent authenticated accounts passing data back and forth in real time:
// 1. System Admin (admin@kapla.edu.vn)
// 2. Center Manager (cm.nhi@kapla.edu.vn)
// 3. Head Teacher (ht.jamie@kapla.edu.vn)
// 4. Homeroom Teacher Minh (hrt.minh@kapla.edu.vn)
// 5. Homeroom Teacher Trâm (hrt.tram@kapla.edu.vn)
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

async function waitForCondition(checkFn: () => boolean, timeoutMs = 8000, intervalMs = 150): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (checkFn()) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return checkFn();
}

async function run5AccountDataExchangeTest() {
  console.log('==============================================================================');
  console.log('  KAPLA — 5-ACCOUNT REALTIME LIVE DATA EXCHANGE TEST SUITE');
  console.log('  Testing 5 concurrent client sessions interacting with cloud database:');
  console.log('  [Account 1] admin@kapla.edu.vn    — System Admin');
  console.log('  [Account 2] cm.nhi@kapla.edu.vn   — Center Manager (CM)');
  console.log('  [Account 3] ht.jamie@kapla.edu.vn  — Head Teacher (HT)');
  console.log('  [Account 4] hrt.minh@kapla.edu.vn  — Homeroom Teacher (HRT Minh)');
  console.log('  [Account 5] hrt.tram@kapla.edu.vn  — Homeroom Teacher (HRT Trâm)');
  console.log('==============================================================================\n');

  // --------------------------------------------------------------------------
  // STEP 1: Authenticate all 5 Accounts Simultaneously
  // --------------------------------------------------------------------------
  console.log('--- STEP 1: Authenticating All 5 Separate User Accounts ---');

  const accountsConfig = [
    { key: 'admin', email: 'admin@kapla.edu.vn', role: 'System Admin' },
    { key: 'cm', email: 'cm.nhi@kapla.edu.vn', role: 'Center Manager (CM)' },
    { key: 'ht', email: 'ht.jamie@kapla.edu.vn', role: 'Head Teacher (HT)' },
    { key: 'hrtMinh', email: 'hrt.minh@kapla.edu.vn', role: 'Homeroom Teacher Minh' },
    { key: 'hrtTram', email: 'hrt.tram@kapla.edu.vn', role: 'Homeroom Teacher Trâm' },
  ];

  const clients: Record<string, SupabaseClient> = {};

  for (const acc of accountsConfig) {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email: acc.email,
      password: 'Kapla@2026',
    });
    assert(`Account [${acc.role}] authenticated successfully`, !authError && !!authData.user, `Email: ${acc.email} | UID: ${authData.user?.id}`);
    clients[acc.key] = client;
  }

  // --------------------------------------------------------------------------
  // STEP 2: Establish Realtime WebSocket Subscriptions across Accounts
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 2: Establishing Realtime WebSocket Streams for All 5 Accounts ---');

  const testStudentCode = 'ACC5-TEST-' + Date.now().toString().slice(-4);
  let targetStudentId = '';

  const eventsReceived: Record<string, { insert: boolean; update: boolean; delete: boolean }> = {
    admin: { insert: false, update: false, delete: false },
    cm: { insert: false, update: false, delete: false },
    ht: { insert: false, update: false, delete: false },
    hrtMinh: { insert: false, update: false, delete: false },
    hrtTram: { insert: false, update: false, delete: false },
  };

  const channels: any[] = [];

  const subscriptionPromises = accountsConfig.map((acc) => {
    return new Promise<void>((resolve) => {
      const ch = clients[acc.key]
        .channel(`stream-${acc.key}-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
          const code = (payload.new as any)?.student_code || (payload.old as any)?.student_code;
          const id = (payload.new as any)?.id || (payload.old as any)?.id;
          if (code === testStudentCode || id === targetStudentId) {
            if (payload.eventType === 'INSERT') {
              eventsReceived[acc.key].insert = true;
              console.log(`  ⚡ [WEBSOCKET] ${acc.role} received INSERT event for ${code}`);
            } else if (payload.eventType === 'UPDATE') {
              eventsReceived[acc.key].update = true;
              console.log(`  ⚡ [WEBSOCKET] ${acc.role} received UPDATE event for ${code || id}`);
            } else if (payload.eventType === 'DELETE') {
              eventsReceived[acc.key].delete = true;
              console.log(`  ⚡ [WEBSOCKET] ${acc.role} received DELETE event for ${id}`);
            }
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve();
          }
        });
      channels.push(ch);
    });
  });

  await Promise.all(subscriptionPromises);
  // Give Supabase Realtime cluster 2.5s to warm up CDC bindings across all 5 connections
  await new Promise((r) => setTimeout(r, 2500));
  assert('All 5 WebSocket listening channels confirmed SUBSCRIBED and ready', true);

  // --------------------------------------------------------------------------
  // STEP 3: Account 1 (Admin) Inserts New Student Record
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 3: Account 1 (Admin) Creates New Student Record ---');

  const studentPayload = {
    branch_id: BRANCH_ID,
    student_code: testStudentCode,
    full_name: 'Đặng Tuấn Kiệt',
    date_of_birth: '2019-11-05',
    gender: 'male',
    parent_name: '',
    parent_phone: '',
    tuition_expiry_date: '1970-01-01', // Blank tuition expiry
    status: 'active',
    notes: '[Nickname: Leo] Initial student enrollment by Admin',
  };

  const { data: insertedStudent, error: insertErr } = await clients.admin
    .from('students')
    .insert(studentPayload)
    .select('*, branch:branches(*), current_class:classes(*)')
    .single();

  targetStudentId = insertedStudent?.id || '';
  assert('Admin successfully wrote student to Supabase Cloud DB', !insertErr && !!insertedStudent, `Code: ${testStudentCode}`);

  // Allow WebSocket broadcast to reach all 5 clients
  await waitForCondition(
    () => eventsReceived.cm.insert && eventsReceived.ht.insert && eventsReceived.hrtMinh.insert && eventsReceived.hrtTram.insert,
    10000,
    100
  );

  assert('Account 2 (CM) received INSERT event in real time', eventsReceived.cm.insert);
  assert('Account 3 (HT) received INSERT event in real time', eventsReceived.ht.insert);
  assert('Account 4 (HRT Minh) received INSERT event in real time', eventsReceived.hrtMinh.insert);
  assert('Account 5 (HRT Trâm) received INSERT event in real time', eventsReceived.hrtTram.insert);

  // --------------------------------------------------------------------------
  // STEP 4: Account 4 (HRT Minh) Reads Student & Adds Care Notes
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 4: Account 4 (HRT Minh) Reads Student & Adds Daily Care Note ---');

  const { data: hrtMinhRead, error: hrtMinhErr } = await clients.hrtMinh
    .from('students')
    .select('*')
    .eq('student_code', testStudentCode)
    .single();

  assert('HRT Minh can immediately read student inserted by Admin', !hrtMinhErr && !!hrtMinhRead, `Student Name: ${hrtMinhRead?.full_name}`);
  assert('HRT Minh verifies student nickname is "Leo"', hrtMinhRead?.notes.includes('[Nickname: Leo]'));
  assert('HRT Minh verifies tuition expiry is blank (1970-01-01 in DB)', hrtMinhRead?.tuition_expiry_date === '1970-01-01');

  // Reset update tracking for the next exchange
  for (const k of Object.keys(eventsReceived)) eventsReceived[k].update = false;

  const noteByHRTMinh = '[Nickname: Leo] Updated by HRT Minh: Student completed Phonics Stage 2 assessment with flying colors.';
  const { data: hrtMinhUpdate, error: hrtMinhUpErr } = await clients.hrtMinh
    .from('students')
    .update({ notes: noteByHRTMinh })
    .eq('student_code', testStudentCode)
    .select()
    .single();

  assert('HRT Minh successfully saved updated progress note', !hrtMinhUpErr && !!hrtMinhUpdate);

  await waitForCondition(
    () => eventsReceived.admin.update && eventsReceived.cm.update && eventsReceived.ht.update && eventsReceived.hrtTram.update,
    10000,
    100
  );
  assert('Account 1 (Admin) received UPDATE event from HRT Minh in real time', eventsReceived.admin.update);
  assert('Account 2 (CM) received UPDATE event from HRT Minh in real time', eventsReceived.cm.update);
  assert('Account 3 (HT) received UPDATE event from HRT Minh in real time', eventsReceived.ht.update);
  assert('Account 5 (HRT Trâm) received UPDATE event from HRT Minh in real time', eventsReceived.hrtTram.update);

  // --------------------------------------------------------------------------
  // STEP 5: Account 3 (Head Teacher) Reads Update & Verifies Academic Standards
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 5: Account 3 (Head Teacher) Verifies HRT Minh’s Notes & Adds Evaluation ---');

  const { data: htRead, error: htErr } = await clients.ht
    .from('students')
    .select('*')
    .eq('student_code', testStudentCode)
    .single();

  assert('Head Teacher reads exact notes updated by HRT Minh', !htErr && htRead?.notes === noteByHRTMinh);

  for (const k of Object.keys(eventsReceived)) eventsReceived[k].update = false;

  const noteByHT = noteByHRTMinh + ' [Academic Verified by HT Jamie Ross Wallis: Ready for Cambridge Movers cohort]';
  const { data: htUpdate, error: htUpErr } = await clients.ht
    .from('students')
    .update({ notes: noteByHT })
    .eq('student_code', testStudentCode)
    .select()
    .single();

  assert('Head Teacher successfully updated academic endorsement on student', !htUpErr && !!htUpdate);

  await waitForCondition(
    () => eventsReceived.admin.update && eventsReceived.cm.update && eventsReceived.hrtMinh.update,
    10000,
    100
  );
  assert('Account 1 (Admin) received UPDATE event from Head Teacher', eventsReceived.admin.update);
  assert('Account 2 (CM) received UPDATE event from Head Teacher', eventsReceived.cm.update);
  assert('Account 4 (HRT Minh) received UPDATE event from Head Teacher', eventsReceived.hrtMinh.update);

  // --------------------------------------------------------------------------
  // STEP 6: Account 2 (Center Manager) Sets Tuition Expiry & Confirms Enrollment
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 6: Account 2 (Center Manager) Updates Tuition Expiry to 2027-04-30 ---');

  for (const k of Object.keys(eventsReceived)) eventsReceived[k].update = false;

  const newTuitionExpiry = '2027-04-30';
  const { data: cmUpdate, error: cmUpErr } = await clients.cm
    .from('students')
    .update({
      tuition_expiry_date: newTuitionExpiry,
      notes: noteByHT + ' [CM Nhi: Contract renewed for 12 months with Oxford curriculum package]',
    })
    .eq('student_code', testStudentCode)
    .select()
    .single();

  assert('Center Manager successfully updated tuition expiry and renewal note', !cmUpErr && !!cmUpdate);

  await waitForCondition(
    () => eventsReceived.admin.update && eventsReceived.hrtMinh.update && eventsReceived.hrtTram.update,
    10000,
    100
  );
  assert('Account 1 (Admin) received UPDATE event from Center Manager', eventsReceived.admin.update);
  assert('Account 4 (HRT Minh) received UPDATE event from Center Manager', eventsReceived.hrtMinh.update);
  assert('Account 5 (HRT Trâm) received UPDATE event from Center Manager', eventsReceived.hrtTram.update);

  // Verify Account 5 (HRT Trâm) reads the exact tuition expiry updated by CM
  const { data: tramRead } = await clients.hrtTram
    .from('students')
    .select('*')
    .eq('student_code', testStudentCode)
    .single();

  assert('Account 5 (HRT Trâm) reads updated tuition expiry: 2027-04-30', tramRead?.tuition_expiry_date === newTuitionExpiry);

  // --------------------------------------------------------------------------
  // STEP 7: Class Cohort Realtime Sync across All 5 Accounts
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 7: Cross-Account Class Cohort Realtime Synchronization ---');

  let cmReceivedClassChange = false;
  let hrtReceivedClassChange = false;

  let chClassCM: any;
  let chClassHRT: any;

  await Promise.all([
    new Promise<void>((resolve) => {
      chClassCM = clients.cm
        .channel(`cm-class-5acc-stream-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, (payload) => {
          if ((payload.new as any)?.name === 'PH-L9-0014') {
            cmReceivedClassChange = true;
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') resolve();
        });
    }),
    new Promise<void>((resolve) => {
      chClassHRT = clients.hrtMinh
        .channel(`hrt-class-5acc-stream-${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, (payload) => {
          if ((payload.new as any)?.name === 'PH-L9-0014') {
            hrtReceivedClassChange = true;
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') resolve();
        });
    }),
  ]);

  // Give CDC subscription 2s to attach on classes table
  await new Promise((r) => setTimeout(r, 2000));

  const testSchedule = 'Tue - Thu 19:00 - 20:50 (5-Account Synchronized)';
  const { error: clsErr } = await clients.admin
    .from('classes')
    .update({ schedule: testSchedule })
    .eq('name', 'PH-L9-0014');

  assert('Admin updated class PH-L9-0014 schedule in Supabase Cloud', !clsErr);

  await waitForCondition(() => cmReceivedClassChange && hrtReceivedClassChange, 10000, 100);
  assert('Center Manager received class change event in real time', cmReceivedClassChange);
  assert('HRT Minh received class change event in real time', hrtReceivedClassChange);

  // Both CM and HRT read updated schedule
  const { data: cmClsRead } = await clients.cm.from('classes').select('schedule').eq('name', 'PH-L9-0014').single();
  assert('Center Manager reads updated schedule: (5-Account Synchronized)', cmClsRead?.schedule === testSchedule);

  // Restore schedule
  await clients.admin.from('classes').update({ schedule: 'Tue - Thu 19:00 - 20:50' }).eq('name', 'PH-L9-0014');

  // --------------------------------------------------------------------------
  // STEP 8: Deletion by Center Manager & Realtime Cleanup across All 5 Accounts
  // --------------------------------------------------------------------------
  console.log('\n--- STEP 8: Center Manager Deletes Student Record & Broadcasts Deletion ---');

  const { error: delErr } = await clients.cm
    .from('students')
    .delete()
    .eq('student_code', testStudentCode);

  assert('Center Manager successfully deleted student record', !delErr);

  await waitForCondition(
    () => eventsReceived.admin.delete && eventsReceived.ht.delete && eventsReceived.hrtMinh.delete && eventsReceived.hrtTram.delete,
    10000,
    100
  );
  assert('Account 1 (Admin) received DELETE event in real time', eventsReceived.admin.delete);
  assert('Account 3 (HT) received DELETE event in real time', eventsReceived.ht.delete);
  assert('Account 4 (HRT Minh) received DELETE event in real time', eventsReceived.hrtMinh.delete);
  assert('Account 5 (HRT Trâm) received DELETE event in real time', eventsReceived.hrtTram.delete);

  // Verify record is completely purged from Supabase Cloud
  const { data: finalAdminCheck } = await clients.admin
    .from('students')
    .select('*')
    .eq('student_code', testStudentCode)
    .maybeSingle();

  assert('Student is completely purged from Supabase Cloud (0 Ghost Records)', finalAdminCheck === null);

  // Unsubscribe channels
  for (const ch of channels) {
    try {
      clients.admin.removeChannel(ch);
    } catch {}
  }
  try {
    clients.cm.removeChannel(chClassCM);
    clients.hrtMinh.removeChannel(chClassHRT);
  } catch {}

  console.log('\n==============================================================================');
  console.log(`  🎉 ALL ${passed}/${total} 5-ACCOUNT REALTIME DATA EXCHANGE TESTS PASSED (100%)!`);
  console.log('  Data exchanged flawlessly back and forth across Admin, CM, HT, HRT Minh, and HRT Trâm!');
  console.log('==============================================================================\n');
  process.exit(0);
}

run5AccountDataExchangeTest().catch((err) => {
  console.error('\n❌ 5-Account test suite encountered an error:', err);
  process.exit(1);
});
