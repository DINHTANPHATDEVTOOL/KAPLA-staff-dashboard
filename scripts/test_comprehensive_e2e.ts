// ==============================================================================
// KAPLA — Automated Comprehensive End-to-End Browser Test Suite
// Tests: Auth, Certificates, Language Switch, Admin CRUD (Staff & Students),
// Role Isolation, and UI State.
// ==============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';
import WebSocket from 'ws';
import fs from 'node:fs';
import path from 'node:path';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const SCREENSHOT_DIR = path.resolve('docs/screenshots/e2e');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runE2ESuite() {
  console.log('=== STARTING COMPREHENSIVE E2E BROWSER TEST SUITE ===\n');

  const CHROME_PORT = 9270;
  const tmpProfile = `/tmp/kapla_e2e_${Date.now()}`;
  const chromeProc = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--window-size=1440,900',
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${tmpProfile}`,
    'about:blank',
  ]);
  await wait(1500);

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

  try {
    const res: any = await new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${CHROME_PORT}/json`, (r) => {
          let d = '';
          r.on('data', (c) => (d += c));
          r.on('end', () => resolve(JSON.parse(d)));
        })
        .on('error', reject);
    });

    const pageTarget = res.find((t: any) => t.type === 'page') || res[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((r) => ws.on('open', r));

    let id = 0;
    const send = (method: string, params: any = {}): Promise<any> =>
      new Promise((resolve) => {
        const curId = ++id;
        const handler = (raw: string) => {
          const msg = JSON.parse(raw);
          if (msg.id === curId) {
            ws.off('message', handler);
            resolve(msg.result);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

    // Enforce 1440x900 desktop viewport
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });

    async function evaluate(code: string): Promise<any> {
      const res = await send('Runtime.evaluate', {
        expression: code,
        awaitPromise: true,
        returnByValue: true,
      });
      return res?.result?.value;
    }

    async function captureScreen(fileName: string) {
      const snap = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(path.join(SCREENSHOT_DIR, fileName), Buffer.from(snap.data, 'base64'));
    }

    // ------------------------------------------------------------------------
    // STAGE 1: AUTH & LOGIN PAGE AUDIT
    // ------------------------------------------------------------------------
    console.log('--- STAGE 1: AUTH & LOGIN PAGE ---');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await wait(2500);

    const loginText = await evaluate('document.body.innerText');
    assert(loginText.includes('Oxford Quality'), 'Login page displays Oxford Quality badge');
    assert(
      loginText.toLowerCase().includes('chứng nhận học thuật') ||
      loginText.toLowerCase().includes('global accreditations'),
      '03 Global Accreditations strip is present'
    );
    assert(loginText.includes('Admin'), 'Quick button "Admin" exists');
    assert(loginText.includes('CM Phương Nhi'), 'Quick button "CM Phương Nhi" exists');
    assert(loginText.includes('Head Teacher Jamie'), 'Quick button "Head Teacher Jamie" exists');
    assert(loginText.includes('HRT Minh'), 'Quick button "HRT Minh" exists');
    assert(loginText.includes('HRT Trâm'), 'Quick button "HRT Trâm" exists');
    assert(loginText.includes('HRT Vy'), 'Quick button "HRT Vy" exists');

    await captureScreen('01_login_screen_vietnamese.png');

    // Click certificate to open Lightbox
    await evaluate(`
      const certCard = Array.from(document.querySelectorAll('div')).find(d => d.textContent?.includes('Oxford Quality') && d.className?.includes('cursor-pointer'));
      if (certCard) certCard.click();
    `);
    await wait(500);
    const lightboxOpen = await evaluate(`Boolean(document.querySelector('.fixed.inset-0.z-50'))`);
    assert(lightboxOpen, 'Clicking accreditation certificate opens Lightbox preview');
    await captureScreen('02_certificate_lightbox_modal.png');

    // Close lightbox
    await evaluate(`
      const closeBtn = document.querySelector('.fixed.inset-0.z-50 button');
      if (closeBtn) closeBtn.click();
    `);
    await wait(400);

    // Test English Language Switch on Login Page
    await evaluate(`
      const enBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('English') || b.title?.includes('English'));
      if (enBtn) enBtn.click();
    `);
    await wait(500);
    const loginEnText = await evaluate('document.body.innerText');
    assert(loginEnText.includes('American Creative English'), 'English headline rendered in English mode');
    assert(loginEnText.includes('Global Accreditations'), 'Accreditations header switches to English');
    assert(!loginEnText.includes('03 Chứng Nhận Học Thuật'), 'Vietnamese header disappeared in English mode');
    await captureScreen('03_login_screen_english.png');

    // Switch back to Vietnamese for testing
    await evaluate(`
      const viBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Tiếng Việt') || b.title?.includes('Tiếng Việt'));
      if (viBtn) viBtn.click();
    `);
    await wait(400);

    // ------------------------------------------------------------------------
    // STAGE 2: LOGIN AS SYSTEM ADMIN & DASHBOARD AUDIT
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 2: SYSTEM ADMIN & DASHBOARD ---');
    await evaluate(`
      const adminBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Admin'));
      if (adminBtn) adminBtn.click();
    `);
    await wait(200);

    await evaluate(`
      const loginForm = document.querySelector('form');
      if (loginForm) loginForm.requestSubmit();
    `);
    await wait(2500);

    const dashText = await evaluate('document.body.innerText');
    assert(dashText.includes('KAPLA Phạm Hùng'), 'Dashboard header shows current branch KAPLA Phạm Hùng');
    assert(dashText.includes('Quản trị viên') || dashText.includes('Admin') || dashText.includes('Hệ Thống'), 'Logged in as Admin user');
    await captureScreen('04_admin_dashboard_overview.png');

    // ------------------------------------------------------------------------
    // STAGE 3: STAFF CRUD VIEW (PHÂN QUYỀN NHÂN SỰ)
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 3: STAFF CRUD VIEW ---');
    await evaluate(`
      const staffNav = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Phân quyền') || b.textContent?.includes('Nhân sự'));
      if (staffNav) staffNav.click();
    `);
    await wait(1500);

    // Switch to Tab 2: Danh sách nhân sự
    await evaluate(`
      const tab2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Danh sách nhân sự'));
      if (tab2) tab2.click();
    `);
    await wait(1500);

    const staffListText = await evaluate('document.body.innerText');
    assert(staffListText.includes('Thêm nhân sự'), '"+ Thêm nhân sự" button visible for Admin');
    assert(staffListText.includes('Phương Nhi'), 'Staff row for "Phương Nhi" rendered');
    assert(staffListText.includes('Jamie'), 'Staff row for "Jamie" rendered');
    assert(staffListText.includes('Minh'), 'Staff row for "Minh" rendered');
    assert(staffListText.includes('Trâm'), 'Staff row for "Trâm" rendered');
    assert(staffListText.includes('Vy'), 'Staff row for "Vy" rendered');
    assert(!staffListText.includes('Lê Nguyễn'), 'No unwanted extra prefix "Lê Nguyễn" in table');
    assert(!staffListText.includes('Alexander'), 'No unwanted extra last name "Alexander" in table');
    assert(!staffListText.includes('Nguyễn Hoàng Minh'), 'No unwanted full name "Nguyễn Hoàng Minh" in table');
    await captureScreen('05_staff_management_active_list.png');

    // Test Open Add Staff Modal
    await evaluate(`
      const addStaffBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Thêm nhân sự'));
      if (addStaffBtn) addStaffBtn.click();
    `);
    await wait(500);
    const addModalVisible = await evaluate(`Boolean(document.querySelector('form input[placeholder="an.nguyen@kapla.edu.vn"]'))`);
    assert(addModalVisible, 'Add Staff Modal opened with required form inputs');
    await captureScreen('06_add_staff_modal.png');

    // Close Add Staff Modal
    await evaluate(`
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Hủy');
      if (cancelBtn) cancelBtn.click();
    `);
    await wait(400);

    // ------------------------------------------------------------------------
    // STAGE 4: STUDENT CRUD VIEW (HỒ SƠ HỌC VIÊN)
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 4: STUDENT CRUD VIEW ---');
    await evaluate(`
      const stuNav = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Hồ sơ học viên'));
      if (stuNav) stuNav.click();
    `);
    await wait(1500);

    const stuText = await evaluate('document.body.innerText');
    assert(stuText.includes('KAP-PH-001'), 'Student KAP-PH-001 (Nguyễn Bình An) listed');
    assert(stuText.includes('KAP-PH-004'), 'Student KAP-PH-004 (Đặng Bảo Nam) listed');
    assert(stuText.includes('KAP-PH-008'), 'Student KAP-PH-008 (Hoàng Tiến Dũng) listed');
    await captureScreen('07_student_directory_list.png');

    // Test Search filter with React 19 synthetic setter
    await evaluate(`
      const searchInput = document.querySelector('input[placeholder*="Tìm theo tên"]') || document.querySelector('input[type="text"]');
      if (searchInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeSetter?.call(searchInput, 'Bình An');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await wait(500);
    const searchRes = await evaluate(`
      Array.from(document.querySelectorAll('td .font-semibold.text-slate-900')).map(e => e.textContent)
    `);
    assert(searchRes.length === 1 && searchRes[0] === 'Nguyễn Bình An', 'Student search filter works instantly ("Bình An" -> 1 result)');
    await captureScreen('08_student_search_filter.png');

    // Clear search
    await evaluate(`
      const searchInput = document.querySelector('input[placeholder*="Tìm theo tên"]') || document.querySelector('input[type="text"]');
      if (searchInput) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeSetter?.call(searchInput, '');
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await wait(500);

    // Test Edit Student Modal
    await evaluate(`
      const editBtn = document.querySelector('button[title*="Sửa thông tin học viên"]');
      if (editBtn) editBtn.click();
    `);
    await wait(500);
    const editModalTitle = await evaluate(`
      document.querySelector('h3.font-bold')?.textContent
    `);
    assert(editModalTitle?.includes('Chỉnh sửa hồ sơ học viên'), 'Edit Student Modal opens with student data');
    await captureScreen('09_edit_student_modal.png');

    // Close Edit Student Modal
    await evaluate(`
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Hủy');
      if (cancelBtn) cancelBtn.click();
    `);
    await wait(400);

    // ------------------------------------------------------------------------
    // STAGE 5: BILINGUAL INTEGRITY IN DASHBOARD
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 5: DASHBOARD BILINGUAL SWITCH ---');
    await evaluate(`
      const topEnBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('English') || b.title?.includes('English'));
      if (topEnBtn) topEnBtn.click();
    `);
    await wait(600);

    const enDashText = await evaluate('document.body.innerText');
    assert(enDashText.includes('Student Records'), 'Sidebar switched to "Student Records" in English');
    assert(enDashText.includes('Tuition Expiry'), 'Table headers switched to English ("Tuition Expiry")');
    assert(!enDashText.includes('Hạn học phí'), 'Vietnamese table header eliminated in English mode');
    await captureScreen('10_dashboard_student_directory_english.png');

    // ------------------------------------------------------------------------
    // STAGE 6: ROLE ISOLATION TEST (LOGOUT & LOGIN AS HRT MINH)
    // ------------------------------------------------------------------------
    console.log('\n--- STAGE 6: ROLE ISOLATION (HRT MINH) ---');
    // Logout
    await evaluate(`
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Đăng xuất') || b.textContent?.includes('Sign Out') || b.title?.includes('Logout'));
      if (logoutBtn) logoutBtn.click();
    `);
    await wait(2000);

    // Login as HRT Minh
    await evaluate(`
      const minhBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('HRT Minh'));
      if (minhBtn) minhBtn.click();
    `);
    await wait(200);

    await evaluate(`
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    `);
    await wait(2500);

    const hrtText = await evaluate('document.body.innerText');
    assert(hrtText.includes('Minh'), 'HRT Minh successfully logged into portal');
    assert(hrtText.includes('HRT'), 'Role badge displays HRT');
    await captureScreen('11_hrt_minh_dashboard.png');

    ws.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }

  console.log(`\n========================================`);
  console.log(`COMPREHENSIVE E2E TEST SUMMARY:`);
  console.log(`  PASSED: ${passCount}`);
  console.log(`  FAILED: ${failCount}`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

runE2ESuite().catch((err) => {
  console.error('E2E Test execution failed:', err);
  process.exit(1);
});
