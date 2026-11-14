// ==============================================================================
// KAPLA — Capture Live UI Email Dispatch in AutomatedEmailsView
// ==============================================================================

import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9260;
const ARTIFACT_DIR = 'C:\\Users\\phatd\\.gemini\\antigravity\\brain\\77ba75ed-6481-4e36-9bb5-1d93d9f37f2d';

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
  console.log('🚀 Launching Chrome to test live UI email dispatch...');
  const tmpDir = path.join(os.tmpdir(), `chrome_email_ui_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CHROME_PORT}`,
      `--user-data-dir=${tmpDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--headless=new',
      '--window-size=1440,960',
      'http://localhost:3000/login',
    ],
    { stdio: 'ignore' }
  );

  try {
    await sleep(2000);
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

    // Sign in as Center Manager (cm.nhi@kapla.edu.vn)
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

    // Navigate to Automated Emails view by clicking sidebar or topbar badge
    console.log('Navigating to Automated Emails view...');
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const emailLink = btns.find(el => el.innerText && (el.innerText.includes('Automated Emails') || el.innerText.includes('kapladashboard@gmail.com')));
        if (emailLink) emailLink.click();
      })()
    `);
    await sleep(2500);

    // Fill in the Test Notification Dispatcher form
    console.log('Filling in Test Email Dispatcher form in UI...');
    await cdp.eval(`
      (() => {
        const emailInput = document.querySelector('input[placeholder*="Enter staff or personal email"]');
        const noteInput = document.querySelector('textarea[placeholder*="Custom test message"]');
        
        function setNative(elem, val) {
          if (!elem) return;
          const proto = Object.getPrototypeOf(elem);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          if (desc && desc.set) desc.set.call(elem, val);
          else elem.value = val;
          elem.dispatchEvent(new Event('input', { bubbles: true }));
          elem.dispatchEvent(new Event('change', { bubbles: true }));
        }

        if (emailInput) setNative(emailInput, 'kapladashboard@gmail.com');
        if (noteInput) setNative(noteInput, 'Live test dispatch triggered from KAPLA operations console.');
      })()
    `);
    await sleep(800);

    // Click "Dispatch Test Email Now"
    console.log('Clicking "Dispatch Test Email Now"...');
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const dispatchBtn = btns.find(b => b.innerText && b.innerText.includes('Dispatch Test Email Now'));
        if (dispatchBtn) dispatchBtn.click();
      })()
    `);
    await sleep(3500);

    // Capture screenshot showing the success toast and outbox
    const screenshotPath = path.join(ARTIFACT_DIR, 'customer_automated_emails_live_test_sent.png');
    await cdp.captureScreenshot(screenshotPath);
    console.log(`📸 Captured UI verification screenshot: ${screenshotPath}`);

    cdp.close();
  } finally {
    try {
      chromeProc.kill();
    } catch (e) {}
  }
}

main().catch(console.error);
