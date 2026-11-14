import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9238;

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

  // Sign in as CM Nhi
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

  // 1. Navigate to Parent Feedback view
  console.log('Navigating to Parent Feedback...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const fbBtn = btns.find(b => b.innerText && (b.innerText.includes('Feedback') || b.innerText.includes('Phản hồi')));
      if (fbBtn) fbBtn.click();
    })()
  `);
  await sleep(2000);

  const screenFeedback = path.join(artifactDir, 'customer_feedback_grouped_by_student.png');
  await cdp.captureScreenshot(screenFeedback);
  console.log('Saved screenshot 1:', screenFeedback);

  // 2. Navigate to Renewal View & Test Month Filter
  console.log('Navigating to Renewal Tracking...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const renBtn = btns.find(b => b.innerText && (b.innerText.includes('Renewal') || b.innerText.includes('Tái tục')));
      if (renBtn) renBtn.click();
    })()
  `);
  await sleep(2000);

  const screenRenewal = path.join(artifactDir, 'customer_renewal_monthly_filter.png');
  await cdp.captureScreenshot(screenRenewal);
  console.log('Saved screenshot 2:', screenRenewal);

  // 3. Navigate to Student Directory & Test Sort on-time & Permissions
  console.log('Navigating to Students Directory...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const stuBtn = btns.find(b => b.innerText && b.innerText.includes('Student Records'));
      if (stuBtn) stuBtn.click();
    })()
  `);
  await sleep(2500);

  const screenStudents = path.join(artifactDir, 'customer_students_sorted_ontime.png');
  await cdp.captureScreenshot(screenStudents);
  console.log('Saved screenshot 3:', screenStudents);

  // 4. Navigate to Activity Logs & Test Protected Trail
  console.log('Navigating to Activity Logs...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const logBtn = btns.find(b => b.innerText && b.innerText.includes('Activity Logs'));
      if (logBtn) logBtn.click();
    })()
  `);
  await sleep(2500);

  const screenLogs = path.join(artifactDir, 'customer_activity_logs_protected.png');
  await cdp.captureScreenshot(screenLogs);
  console.log('Saved screenshot 4:', screenLogs);

  cdp.close();
  chromeProc.kill();
  console.log('🎉 All 4 screenshots captured successfully!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
