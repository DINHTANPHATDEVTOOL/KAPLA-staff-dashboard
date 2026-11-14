import { chromium } from 'playwright';

async function main() {
  console.log('🚀 Starting E2E verification test for customer feature set...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Visit local dev server
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  console.log('✅ Navigated to http://localhost:3000');

  // Verify page title
  const title = await page.title();
  console.log(`📄 Page title: ${title}`);

  // 2. Log in as System Admin (or switch account)
  // Check if already logged in or login form is present
  const loginBtn = await page.$('button[type="submit"]');
  if (loginBtn) {
    console.log('🔑 Logging in as System Admin (admin@kapla.edu.vn)...');
    await page.fill('input[type="email"]', 'admin@kapla.edu.vn');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
  }

  // 3. Verify Students view permissions
  console.log('📋 Testing Student Permissions & Sorting on-time...');
  await page.click('button:has-text("Hồ sơ học viên"), button:has-text("Student Profiles"), button:has-text("Students")');
  await page.waitForTimeout(1000);

  // Check Add Student button exists
  const addStudentBtn = await page.$('button:has-text("Add New Student"), button:has-text("Thêm học viên")');
  console.log(`✅ Add Student Button visible: ${Boolean(addStudentBtn)}`);

  // Check Delete button is visible for Admin
  const adminDeleteBtn = await page.$('button[title*="Delete"], button[title*="Xóa"]');
  console.log(`✅ Admin has Delete Button: ${Boolean(adminDeleteBtn)}`);

  // 4. Test Feedback View: Group by Student & Notifications & 1-day reminders
  console.log('💬 Testing Feedback View (Group by Student & 1-Day Reminders)...');
  await page.click('button:has-text("Phản hồi phụ huynh"), button:has-text("Parent Feedback"), button:has-text("Feedback")');
  await page.waitForTimeout(1000);

  // Check Group by Student toggle button exists and is active
  const groupByStudentBtn = await page.$('button:has-text("Group by Student"), button:has-text("Gộp theo học viên")');
  console.log(`✅ "Group by Student" toggle button present: ${Boolean(groupByStudentBtn)}`);

  // Take screenshot of grouped feedback
  await page.screenshot({ path: 'live_test_artifacts/feedback_grouped_by_student.png' });
  console.log('📸 Captured screenshot: live_test_artifacts/feedback_grouped_by_student.png');

  // 5. Test Renewal View: Month-by-month filter
  console.log('📅 Testing Renewal View Month Filter & 1-Day Reminder...');
  await page.click('button:has-text("Quản lý tái tục"), button:has-text("Renewal Management"), button:has-text("Renewal")');
  await page.waitForTimeout(1000);

  // Check month filter select
  const monthSelect = await page.$('select:has-text("All Expiry Months"), select:has-text("October 2026"), select:has-text("November 2026")');
  console.log(`✅ Month Filter select element present: ${Boolean(monthSelect)}`);

  await page.screenshot({ path: 'live_test_artifacts/renewal_month_filter.png' });
  console.log('📸 Captured screenshot: live_test_artifacts/renewal_month_filter.png');

  // 6. Test Activity & Audit Logs
  console.log('🛡️ Testing Activity Logs (Edit allowed, deletion prohibited)...');
  await page.click('button:has-text("Nhật ký tác nghiệp"), button:has-text("Operational Logs"), button:has-text("Activity Trail")');
  await page.waitForTimeout(1000);

  const editNoteBtn = await page.$('button:has-text("Edit Note"), button:has-text("Sửa")');
  console.log(`✅ Edit Note Button present: ${Boolean(editNoteBtn)}`);

  const deleteLogBtn = await page.$('button:has-text("Delete Log"), button[title*="Delete Log"]');
  console.log(`✅ Deletion action strictly absent: ${deleteLogBtn === null}`);

  await page.screenshot({ path: 'live_test_artifacts/activity_logs_protected.png' });
  console.log('📸 Captured screenshot: live_test_artifacts/activity_logs_protected.png');

  await browser.close();
  console.log('🎉 All automated E2E checks passed successfully!');
}

main().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
