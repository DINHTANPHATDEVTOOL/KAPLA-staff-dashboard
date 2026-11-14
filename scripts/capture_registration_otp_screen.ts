import { spawn } from 'node:child_process';
import WebSocket from 'ws';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHROME_PORT = 9256;
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
  console.log('🚀 Launching Chrome to capture Registration OTP screens...');
  const tmpDir = path.join(os.tmpdir(), `chrome_otp_cap_${Date.now()}`);
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
      'http://localhost:3000/register',
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

    console.log('Navigating to http://localhost:3000 ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000' });
    await sleep(2500);

    // Switch to Register screen
    console.log('Switching to Register screen...');
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const regBtn = btns.find(b => b.textContent && /register/i.test(b.textContent));
        if (regBtn) {
          regBtn.click();
        } else {
          console.warn('Register button not found');
        }
      })()
    `);
    await sleep(2000);

    // Verify we are on register form
    const isRegister = await cdp.eval(`Boolean(document.getElementById('reg-fullname'))`);
    console.log(`Is on register screen: ${isRegister}`);

    // Step 1: Fill registration details
    console.log('Filling in registration form details...');
    await cdp.eval(`
      (() => {
        const nameInput = document.getElementById('reg-fullname');
        const emailInput = document.getElementById('reg-email');
        const phoneInput = document.getElementById('reg-phone');
        const passInput = document.getElementById('reg-pass');
        const confirmPassInput = document.getElementById('reg-confirm-pass');

        function setNativeValue(element, value) {
          if (!element) return;
          const proto = Object.getPrototypeOf(element);
          const desc = Object.getOwnPropertyDescriptor(proto, 'value');
          if (desc && desc.set) {
            desc.set.call(element, value);
          } else {
            element.value = value;
          }
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setNativeValue(nameInput, 'Robert Christopher');
        setNativeValue(emailInput, 'robert.christopher@kapla.edu.vn');
        setNativeValue(phoneInput, '0912 345 678');
        setNativeValue(passInput, 'Password@2026');
        setNativeValue(confirmPassInput, 'Password@2026');
      })()
    `);
    await sleep(1000);

    const step1Path = path.join(ARTIFACT_DIR, 'customer_registration_step1_form.png');
    await cdp.captureScreenshot(step1Path);
    console.log(`📸 Captured: ${step1Path}`);

    // Click submit button to send OTP
    console.log('Clicking "Continue & Send Verification OTP"...');
    await cdp.eval(`
      (() => {
        const btn = document.querySelector('button[type="submit"]');
        if (btn) btn.click();
      })()
    `);

    // Wait for step 2 (OTP code input screen)
    console.log('Waiting for OTP verification step...');
    await sleep(3500);

    const step2Path = path.join(ARTIFACT_DIR, 'customer_registration_step2_otp.png');
    await cdp.captureScreenshot(step2Path);
    console.log(`📸 Captured: ${step2Path}`);

    // Retrieve pending OTP from sessionStorage and fill it in
    const pendingOtp = await cdp.eval(`
      (() => {
        const raw = sessionStorage.getItem('kapla_pending_registration_otp');
        if (!raw) return null;
        try {
          return JSON.parse(raw).otp;
        } catch(e) {
          return null;
        }
      })()
    `);
    console.log(`Found pending OTP from storage: ${pendingOtp}`);

    if (pendingOtp) {
      await cdp.eval(`
        (() => {
          const otpInput = document.getElementById('otp-input');
          if (otpInput) {
            const valueSetter = Object.getOwnPropertyDescriptor(otpInput.__proto__, 'value').set;
            valueSetter.call(otpInput, '${pendingOtp}');
            otpInput.dispatchEvent(new Event('input', { bubbles: true }));
            otpInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        })()
      `);
      await sleep(1000);
      const step2FilledPath = path.join(ARTIFACT_DIR, 'customer_registration_step2_otp_filled.png');
      await cdp.captureScreenshot(step2FilledPath);
      console.log(`📸 Captured: ${step2FilledPath}`);
    }

    cdp.close();
  } finally {
    try {
      chromeProc.kill();
    } catch (e) {}
  }
}

main().catch(console.error);
