import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9231;

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

  async captureScreenshot(outputPath: string): Promise<void> {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res && res.data) {
      fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    }
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const tempDir = path.join(os.tmpdir(), `kapla-crm-screenshot-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const artifactDir = 'C:\\Users\\phatd\\.gemini\\antigravity\\brain\\77ba75ed-6481-4e36-9bb5-1d93d9f37f2d';

  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      `--remote-debugging-port=${CHROME_PORT}`,
      '--no-sandbox',
      '--disable-gpu',
      `--user-data-dir=${tempDir}`,
      '--window-size=1600,1050',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  await new Promise((r) => setTimeout(r, 1200));
  const res = await fetch(`http://127.0.0.1:${CHROME_PORT}/json`);
  const targets = await res.json();
  const pageTarget = targets.find((t: any) => t.type === 'page');

  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');

  console.log('Navigating to http://localhost:3000/login ...');
  await cdp.send('Page.navigate', { url: 'http://localhost:3000/login' });
  await new Promise((r) => setTimeout(r, 1500));

  // Sign in as CM Nhi
  console.log('Signing in as Center Manager (cm.nhi@kapla.edu.vn)...');
  await cdp.eval(`
    (() => {
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      const form = document.querySelector('form');
      if (emailInput && passInput && form) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(emailInput, 'cm.nhi@kapla.edu.vn');
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        setter.call(passInput, 'Kapla@2026');
        passInput.dispatchEvent(new Event('input', { bubbles: true }));
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      }
    })()
  `);

  await new Promise((r) => setTimeout(r, 2000));

  // Navigate to Students section
  console.log('Navigating to Students Directory...');
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button, a'));
      const stuBtn = btns.find(b => b.innerText && b.innerText.includes('Students'));
      if (stuBtn) stuBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot 1: Overview of Students Directory with Month Selector & Progress Tracker
  const screen1 = path.join(artifactDir, 'crm_monthly_filter_overview.png');
  await cdp.captureScreenshot(screen1);
  console.log('Saved screenshot 1:', screen1);

  // Click on "Filter: Date Field" dropdown to open Image 1 dropdown menu
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const filterBtn = btns.find(b => b.innerText && b.innerText.includes('Filter:'));
      if (filterBtn) filterBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Screenshot 2: Dropdown open (matching Image 1)
  const screen2 = path.join(artifactDir, 'crm_date_field_dropdown.png');
  await cdp.captureScreenshot(screen2);
  console.log('Saved screenshot 2:', screen2);

  // Click on "⚠️ Not Evaluated Yet" chip (Image 2)
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pendingChip = btns.find(b => b.innerText && b.innerText.includes('Not Evaluated Yet'));
      if (pendingChip) pendingChip.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Screenshot 3: Filtered list showing only un-assessed students with "+ Assess Now" buttons
  const screen3 = path.join(artifactDir, 'crm_pending_students_filtered.png');
  await cdp.captureScreenshot(screen3);
  console.log('Saved screenshot 3:', screen3);

  // Click "+ Assess Now" on the first row to open the modal
  await cdp.eval(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const assessBtn = btns.find(b => b.innerText && b.innerText.includes('Assess Now'));
      if (assessBtn) assessBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  // Screenshot 4: 4-Skill Cambridge Assessment modal opened directly from Student list
  const screen4 = path.join(artifactDir, 'crm_quick_assess_modal.png');
  await cdp.captureScreenshot(screen4);
  console.log('Saved screenshot 4:', screen4);

  cdp.close();
  chrome.kill();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch (e) {}
  console.log('Finished capturing all verification artifacts!');
}

run().catch(console.error);
