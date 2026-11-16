import ws from 'ws';
(globalThis as any).WebSocket = ws;
import { EmailNotificationService, MockStorageService } from '../src/lib/supabase';
import { buildKaplaEmailHtml } from '../src/lib/emailTemplate';

async function main() {
  console.log('======================================================================');
  console.log('  KAPLA — STAFF ONBOARDING NOTIFICATION TO CM & ADMIN VERIFICATION');
  console.log('======================================================================\n');

  // Clear previous test email logs
  EmailNotificationService.clearEmailLogs();

  const applicant = {
    fullName: 'Hoang Van Nam',
    email: 'hoang.nam.test@kapla.edu.vn',
    phone: '0987 654 321',
    preferredBranchId: 'a0000000-0000-0000-0000-000000000001',
    applicantId: 'u-nam-test-889',
  };

  // TEST 1: Trigger notifyCmAndAdminNewStaffRegistration
  console.log('--- TEST 1: Dispatch Onboarding Notification for New Staff ---');
  const entry = EmailNotificationService.notifyCmAndAdminNewStaffRegistration(applicant);

  console.log(`Dispatched ID: ${entry.id}`);
  console.log(`Recipients: ${entry.recipients.join(', ')}`);
  console.log(`Title: ${entry.title}`);
  console.log(`Action Type: ${entry.actionType}`);

  // Assertions
  if (!entry.recipients.includes('cm.nhi@kapla.edu.vn')) {
    throw new Error('FAILED: Center Manager (cm.nhi@kapla.edu.vn) is missing from target recipients!');
  }
  console.log('  ✅ [PASS] Center Manager (cm.nhi@kapla.edu.vn) is included in recipients');

  if (!entry.recipients.includes('admin@kapla.edu.vn')) {
    throw new Error('FAILED: System Admin (admin@kapla.edu.vn) is missing from target recipients!');
  }
  console.log('  ✅ [PASS] System Admin (admin@kapla.edu.vn) is included in recipients');

  if (entry.actionType !== 'onboarding') {
    throw new Error(`FAILED: Expected actionType 'onboarding', received '${entry.actionType}'`);
  }
  console.log('  ✅ [PASS] Action Type is strictly "onboarding"');

  if (!entry.title.includes(applicant.fullName) || (!entry.title.includes('KAPLA Phạm Hùng') && !entry.title.includes('KAPLA Pham Hung Campus'))) {
    throw new Error(`FAILED: Title does not reflect applicant name and campus: ${entry.title}`);
  }
  console.log(`  ✅ [PASS] Subject title accurately reflects applicant and campus: "${entry.title}"`);

  // TEST 2: Verify HTML Template Contents & Applicant Details
  console.log('\n--- TEST 2: Verify Complete Applicant Profile in Email HTML ---');
  const html = buildKaplaEmailHtml({
    subject: entry.title,
    title: `Staff Role Approval Request: ${applicant.fullName}`,
    userName: 'Center Manager (Phương Nhi) & System Administrator',
    text: entry.content,
    actionType: 'onboarding',
    recipients: entry.recipients,
    turnaround: 'Within 24 Hours',
    applicantInfo: {
      fullName: applicant.fullName,
      email: applicant.email,
      phone: applicant.phone,
      preferredBranchName: 'KAPLA Phạm Hùng',
      applicantId: applicant.applicantId,
      registeredAt: 'Nov 16, 2026, 05:45 PM (ICT)',
      status: 'Awaiting Role Approval (status: pending)',
    },
    actionUrl: 'https://kapla.io.vn/',
    actionButtonText: 'Review & Assign Staff Roles',
  });

  // Verify elements
  const checks = [
    { label: 'Applicant Name', target: applicant.fullName },
    { label: 'Work Email', target: applicant.email },
    { label: 'Contact Phone', target: applicant.phone },
    { label: 'Assigned Campus', target: 'KAPLA Phạm Hùng' },
    { label: 'Workflow Status', target: 'Awaiting Role Approval' },
    { label: 'Action CTA Button', target: 'Review &amp; Assign Staff Roles' },
    { label: 'Portal URL link', target: 'https://kapla.io.vn/' },
    { label: 'KAPLA Logo image', target: 'https://kapla.io.vn/assets/kapla-logo-color.png' },
    { label: 'Official Hotline', target: '028 7108 8899' },
    { label: 'Official Campus Address', target: 'Topaz Elite' },
    { label: 'Onboarding Badge SVG', target: 'Staff Onboarding Approval' },
  ];

  for (const c of checks) {
    if (!html.includes(c.target)) {
      throw new Error(`FAILED: Email HTML does not contain ${c.label} ("${c.target}")`);
    }
    console.log(`  ✅ [PASS] Email HTML contains ${c.label}: "${c.target}"`);
  }

  // TEST 3: Outbox Persistence & Log Retrieval
  console.log('\n--- TEST 3: Outbox Persistence in MockStorageService ---');
  const logs = MockStorageService.getEmailLogs();
  const saved = logs.find((l) => l.id === entry.id);
  if (!saved) {
    throw new Error('FAILED: Onboarding email log was not persisted in system outbox.');
  }
  console.log(`  ✅ [PASS] Notification persisted in outbox (Total logs: ${logs.length})`);

  // TEST 4: Automated Emails View Test Dispatcher Support
  console.log('\n--- TEST 4: Dispatch Test Onboarding Notification ---');
  const testEntry = EmailNotificationService.sendTestEmail(
    'cm.nhi@kapla.edu.vn',
    'Staff Onboarding & Role Approval Request',
    'Simulating live test from UI console.'
  );
  if (testEntry.actionType !== 'onboarding') {
    throw new Error(`FAILED: Test email expected actionType 'onboarding', received '${testEntry.actionType}'`);
  }
  console.log(`  ✅ [PASS] Test email recognized template as actionType "onboarding": ${testEntry.title}`);

  console.log('\n======================================================================');
  console.log('  🎉 ALL ONBOARDING NOTIFICATION TESTS PASSED (100%)!');
  console.log('  CM (Phương Nhi) and System Admin both receive automated notifications');
  console.log('  displaying FULL applicant information and immediate action links.');
  console.log('======================================================================');
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
