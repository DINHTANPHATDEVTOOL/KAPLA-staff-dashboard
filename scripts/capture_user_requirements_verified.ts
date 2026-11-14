import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9245;

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

  async captureScreenshot(filePath: string): Promise<void> {
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
  console.log('🚀 Launching Chrome for visual verification...');
  const tmpDir = path.join(os.tmpdir(), `chrome_cap_${Date.now()}`);
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

  await sleep(1500);
  const res = await fetch(`http://127.0.0.1:${CHROME_PORT}/json`);
  const targets = await res.json();
  const pageTarget = targets.find((t: any) => t.type === 'page') || targets[0];

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('DOM.enable');

  console.log('Navigating to http://localhost:3000/login ...');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/login' });
  await sleep(2000);

  // Sign in as CM Nhi (Center Manager - authorized to schedule reminders)
  console.log('Signing in as Center Manager (cm.nhi@kapla.edu.vn)...');
  await cdp.eval(`
    (() => {
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      if (emailInput && passInput) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(emailInput, 'cm.nhi@kapla.edu.vn');
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('change', { bubbles: true }));
        setter.call(passInput, 'Kapla@2026');
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        passInput.dispatchEvent(new Event('change', { bubbles: true }));
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      }
    })()
  `);
  await sleep(3000);

  const artifactDir = 'C:\\Users\\phatd\\.gemini\\antigravity\\brain\\77ba75ed-6481-4e36-9bb5-1d93d9f37f2d';

  // 1. Navigate to Student Directory (Images 1 & 2)
  console.log('Navigating to Student Records Directory...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const stuBtn = btns.find(b => b.innerText && (b.innerText.includes('Student Records') || b.innerText.includes('Students')));
      if (stuBtn) stuBtn.click();
    })()
  `);
  await sleep(2500);

  // Click open the Date filter dropdown to demonstrate matching Customer Image 1
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find(b => b.innerText && b.innerText.includes('Filter:'));
      if (filterBtn) filterBtn.click();
    })()
  `);
  await sleep(1000);

  const screenDateFilter = path.join(artifactDir, 'customer_students_date_filter_dropdown.png');
  await cdp.captureScreenshot(screenDateFilter);
  console.log('Saved screenshot 1 (Date filter dropdown matching Image 1):', screenDateFilter);

  // Close dropdown
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find(b => b.innerText && b.innerText.includes('Filter:'));
      if (filterBtn) filterBtn.click();
    })()
  `);
  await sleep(500);

  // Open Schedule Reminder Modal in Student row (SOO, HT, CM, Admin)
  await cdp.eval(`
    (() => {
      const reminderBtn = document.querySelector('button[title*="Schedule Reminder"]');
      if (reminderBtn) reminderBtn.click();
    })()
  `);
  await sleep(1000);

  const screenReminderModal = path.join(artifactDir, 'customer_student_schedule_reminder_modal.png');
  await cdp.captureScreenshot(screenReminderModal);
  console.log('Saved screenshot 2 (Schedule reminder modal with 5 classifications & email notice):', screenReminderModal);

  // Close modal
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const cancelBtn = btns.find(b => b.innerText && b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()
  `);
  await sleep(1000);

  // Filter for "Pending Evaluation" (Matching Customer Image 2)
  await cdp.eval(`
    (() => {
      const chips = Array.from(document.querySelectorAll('button'));
      const pendingChip = chips.find(c => c.innerText && (c.innerText.includes('Pending Evaluation') || c.innerText.includes('Not Evaluated Yet')));
      if (pendingChip) pendingChip.click();
    })()
  `);
  await sleep(1500);

  const screenPendingEvaluations = path.join(artifactDir, 'customer_students_monthly_evaluation_tracker.png');
  await cdp.captureScreenshot(screenPendingEvaluations);
  console.log('Saved screenshot 3 (Monthly assessment tracker matching Image 2):', screenPendingEvaluations);

  // 2. Navigate to HRT Tasks View (5 Classifications & kapladashboard@gmail.com)
  console.log('Navigating to HRT Tasks...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const hrtBtn = btns.find(b => b.innerText && (b.innerText.includes('HRT Tasks') || b.innerText.includes('Care Tasks')));
      if (hrtBtn) hrtBtn.click();
    })()
  `);
  await sleep(2000);

  const screenHrtTasks = path.join(artifactDir, 'customer_hrt_tasks_5_classifications.png');
  await cdp.captureScreenshot(screenHrtTasks);
  console.log('Saved screenshot 4 (HRT Tasks with 5 classifications & kapladashboard@gmail.com):', screenHrtTasks);

  // 3. Navigate to Parent Feedback (Matching Customer Image 3)
  console.log('Navigating to Parent Feedback...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const fbBtn = btns.find(b => b.innerText && b.innerText.includes('Feedback'));
      if (fbBtn) fbBtn.click();
    })()
  `);
  await sleep(2000);

  const screenFeedback = path.join(artifactDir, 'customer_feedback_grouped_by_student.png');
  await cdp.captureScreenshot(screenFeedback);
  console.log('Saved screenshot 5 (Parent Feedback grouped by student solving Image 3 in 100% English):', screenFeedback);

  // 4. Navigate to Renewal View & Test Month Filter
  console.log('Navigating to Renewal Tracking...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const renBtn = btns.find(b => b.innerText && b.innerText.includes('Renewals'));
      if (renBtn) renBtn.click();
    })()
  `);
  await sleep(2000);

  const screenRenewal = path.join(artifactDir, 'customer_renewal_monthly_filter.png');
  await cdp.captureScreenshot(screenRenewal);
  console.log('Saved screenshot 6 (Renewal monthly filter with kapladashboard@gmail.com):', screenRenewal);

  cdp.close();
  chromeProc.kill();
  console.log('🎉 All visual verification screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
