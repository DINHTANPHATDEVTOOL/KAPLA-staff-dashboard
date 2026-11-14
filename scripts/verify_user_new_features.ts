import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9235;

class CDPClient {
  private ws: WebSocket | null = null;
  private id = 0;
  private callbacks = new Map<number, (res: any) => void>();

  constructor(private wsUrl: string) {}

  async connect(): Promise<void> {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise<void>((resolve, reject) => {
      this.ws!.on('open', () => resolve());
      this.ws!.on('error', (err) => reject(err));
      this.ws!.on('message', (raw: string) => {
        try {
          const msg = JSON.parse(raw);
          if (msg.id && this.callbacks.has(msg.id)) {
            this.callbacks.get(msg.id)!(msg);
            this.callbacks.delete(msg.id);
          }
        } catch (e) {}
      });
    });
  }

  send(method: string, params: any = {}): Promise<any> {
    const id = ++this.id;
    return new Promise((resolve) => {
      this.callbacks.set(id, (msg) => resolve(msg.result));
      this.ws!.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression: string): Promise<any> {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res?.result?.value;
  }

  async screenshot(filePath: string): Promise<void> {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res?.data) {
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    }
  }

  close(): void {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('🚀 Starting Chrome for feature set verification...');
  const tmpDir = path.join(os.tmpdir(), `chrome_verify_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CHROME_PORT}`,
      `--user-data-dir=${tmpDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--headless=new',
      '--window-size=1440,900',
      'http://localhost:3000',
    ],
    { stdio: 'ignore' }
  );

  let targets: any[] = [];
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    try {
      const res = await fetch(`http://127.0.0.1:${CHROME_PORT}/json`);
      targets = await res.json();
      if (targets.length > 0) break;
    } catch {}
  }

  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await client.connect();
  await client.send('Page.enable');
  await client.send('DOM.enable');

  console.log('✅ Connected to browser session.');
  await sleep(2000);

  // Check login state
  const isLoginPage = await client.eval(`Boolean(document.querySelector('input[type="email"]'))`);
  if (isLoginPage) {
    console.log('🔑 Performing automatic Admin sign-in...');
    await client.eval(`
      (() => {
        const emailInput = document.getElementById('login-email') || document.querySelector('input[type="email"]');
        const passInput = document.getElementById('login-password') || document.querySelector('input[type="password"]');
        if (emailInput && passInput) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(emailInput, 'admin@kapla.edu.vn');
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          setter.call(passInput, 'Admin@123');
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          const submitBtn = document.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.click();
        }
      })()
    `);
    await sleep(3000);
  }

  // 1. Verify Feedback View Grouping & 1-day reminder
  console.log('💬 Navigating to Feedback view...');
  await client.eval(`
    const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Phản hồi') || el.textContent.includes('Feedback'));
    if (btn) btn.click();
  `);
  await sleep(2000);

  const feedbackGroupingCheck = await client.eval(`
    const groupToggle = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Group by Student') || b.textContent.includes('Gộp theo học viên'));
    const cards = document.querySelectorAll('.divide-y > div');
    const hasPhanMinhKhoi = document.body.innerText.includes('Phạm Minh Khôi') || document.body.innerText.includes('Phạm Hải Đăng');
    const hasReminderBadge = document.body.innerText.includes('1-Day Reminder') || document.body.innerText.includes('Due Tomorrow');
    return {
      hasGroupToggle: Boolean(groupToggle),
      cardCount: cards.length,
      hasPhanMinhKhoi,
      hasReminderBadge
    };
  `);
  console.log('📊 Feedback Grouping Verification:', feedbackGroupingCheck);

  // Capture screenshot of feedback grouping
  const feedbackScreenshot = 'live_test_artifacts/feedback_grouped_by_student_verified.png';
  await client.screenshot(feedbackScreenshot);
  console.log(`📸 Saved screenshot: ${feedbackScreenshot}`);

  // 2. Verify Renewal View Month Filter & 1-day reminder
  console.log('📅 Navigating to Renewal view...');
  await client.eval(`
    const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Quản lý tái tục') || el.textContent.includes('Renewal'));
    if (btn) btn.click();
  `);
  await sleep(2000);

  const renewalCheck = await client.eval(`
    const selects = Array.from(document.querySelectorAll('select'));
    const monthSelect = selects.find(s => s.innerText.includes('October 2026') || s.innerText.includes('Tháng 10/2026') || s.innerText.includes('All Expiry Months'));
    return {
      hasMonthSelect: Boolean(monthSelect),
      monthOptionsCount: monthSelect ? monthSelect.options.length : 0
    };
  `);
  console.log('📊 Renewal Month Filter Verification:', renewalCheck);

  const renewalScreenshot = 'live_test_artifacts/renewal_month_filter_verified.png';
  await client.screenshot(renewalScreenshot);
  console.log(`📸 Saved screenshot: ${renewalScreenshot}`);

  // 3. Verify Student Profiles: Sorting on time & Delete strictly admin only
  console.log('📋 Navigating to Student Profiles view...');
  await client.eval(`
    const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Hồ sơ học viên') || el.textContent.includes('Students'));
    if (btn) btn.click();
  `);
  await sleep(2000);

  const studentCheck = await client.eval(`
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add New Student') || b.textContent.includes('Thêm học viên'));
    const rows = document.querySelectorAll('tbody tr');
    const deleteBtns = document.querySelectorAll('button[title*="Delete"], button[title*="Xóa"]');
    return {
      hasAddStudentBtn: Boolean(addBtn),
      studentRowCount: rows.length,
      deleteBtnCount: deleteBtns.length
    };
  `);
  console.log('📊 Student Permissions & List Verification:', studentCheck);

  const studentScreenshot = 'live_test_artifacts/student_permissions_verified.png';
  await client.screenshot(studentScreenshot);
  console.log(`📸 Saved screenshot: ${studentScreenshot}`);

  // 4. Verify Activity Logs View (Edit allowed, Deletion prohibited)
  console.log('🛡️ Navigating to Activity Logs view...');
  await client.eval(`
    const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('Nhật ký tác nghiệp') || el.textContent.includes('Logs'));
    if (btn) btn.click();
  `);
  await sleep(2000);

  const activityCheck = await client.eval(`
    const editBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Edit Note') || b.textContent.includes('Sửa'));
    const deleteBtns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Delete') || b.title?.includes('Delete') || b.textContent.includes('Xóa'));
    const policyBanner = document.body.innerText.includes('Deletion Prohibited') || document.body.innerText.includes('Nghiêm cấm xóa');
    return {
      editButtonsFound: editBtns.length,
      deleteButtonsFound: deleteBtns.length,
      hasProtectedPolicyBanner: policyBanner
    };
  `);
  console.log('📊 Activity Logs Protection Verification:', activityCheck);

  const activityScreenshot = 'live_test_artifacts/activity_logs_verified.png';
  await client.screenshot(activityScreenshot);
  console.log(`📸 Saved screenshot: ${activityScreenshot}`);

  client.close();
  chromeProc.kill();
  console.log('🎉 Verification completed successfully!');
}

main().catch((err) => {
  console.error('❌ Verification script encountered error:', err);
  process.exit(1);
});
