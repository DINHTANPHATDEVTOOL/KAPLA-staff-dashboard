// ==============================================================================
// KAPLA — Capture Clean Demo Screenshots Across All Modules
// ==============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CHROME_PORT = 9233;
const ARTIFACT_DIR = '/home/rd/.gemini/antigravity/brain/9996d84d-1d5c-4614-9f39-19af09d3d17b/screenshots';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  async captureScreenshot(filename: string): Promise<void> {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res?.data) {
      const buffer = Buffer.from(res.data, 'base64');
      const docsPath = path.resolve('docs/screenshots', filename);
      fs.mkdirSync(path.dirname(docsPath), { recursive: true });
      fs.writeFileSync(docsPath, buffer);

      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
      fs.writeFileSync(artifactPath, buffer);
      console.log(`✓ Saved ${filename} (${buffer.length} bytes)`);
    } else {
      console.error(`✗ Failed to capture screenshot ${filename}`);
    }
  }

  close() {
    this.ws?.close();
  }
}

async function waitForHttp(url: string, retries = 30): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await new Promise<string>((resolve, reject) => {
        http
          .get(url, (r) => {
            let data = '';
            r.on('data', (c) => (data += c));
            r.on('end', () => resolve(data));
          })
          .on('error', reject);
      });
      return JSON.parse(res);
    } catch {
      await wait(300);
    }
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  const tmpDir = path.join('/tmp', `kapla_chrome_demo_${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  const chromeProc = spawn(
    'google-chrome',
    [
      '--headless=new',
      `--remote-debugging-port=${CHROME_PORT}`,
      `--user-data-dir=${tmpDir}`,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    const targets = await waitForHttp(`http://127.0.0.1:${CHROME_PORT}/json`);
    const pageTarget = targets.find((t: any) => t.type === 'page') || targets[0];
    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    // 1. Visit Login Page & Clear old local storage to ensure fresh demo data
    await cdp.send('Page.navigate', { url: FRONTEND_URL });
    for (let i = 0; i < 30; i++) {
      const text = await cdp.eval('document.body.innerText');
      if (text && (text.includes('Đăng nhập tài khoản') || text.includes('Sign in'))) {
        break;
      }
      await wait(300);
    }
    await wait(1000);
    await cdp.captureScreenshot('20_clean_login_with_all_staff_roles.png');

    // 2. Login as CM Phạm Hùng via Quick Fill button
    await cdp.eval(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const cmBtn = buttons.find(b => b.textContent?.includes('CM Phạ') || b.title?.includes('cm.phamhung'));
      if (cmBtn) {
        cmBtn.click();
      } else {
        const emailInput = document.getElementById('login-email');
        const pwInput = document.getElementById('login-password');
        const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputSetter.call(emailInput, 'cm.phamhung@kapla.edu.vn');
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        nativeInputSetter.call(pwInput, 'Kapla@2026');
        pwInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      setTimeout(() => {
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('type') === 'submit');
        if (submitBtn) submitBtn.click();
      }, 300);
    `);

    // Wait until logged in (check for sidebar or overview)
    for (let i = 0; i < 40; i++) {
      const text = await cdp.eval('document.body.innerText');
      if (text && (text.includes('Hoàng Minh Tuấn') || text.includes('KAPLA Phạm Hùng') || text.includes('Tổng quan học thuật') || text.includes('Student Records'))) {
        break;
      }
      await wait(300);
    }
    await wait(2000);

    // 3. Capture Academic Overview / Dashboard
    await cdp.eval(`document.getElementById('nav-overview')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('21_clean_academic_overview_dashboard.png');

    // 4. Capture Student Records (Student Master)
    await cdp.eval(`document.getElementById('nav-students')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('22_clean_student_master_directory.png');

    // 5. Capture HRT Tasks
    await cdp.eval(`document.getElementById('nav-care_tasks')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('23_clean_hrt_care_tasks.png');

    // 6. Capture Competency Assessments
    await cdp.eval(`document.getElementById('nav-assessments')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('24_clean_competency_assessments.png');

    // 7. Capture Academic Interventions
    await cdp.eval(`document.getElementById('nav-interventions')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('25_clean_academic_interventions.png');

    // 8. Capture Parent Feedback
    await cdp.eval(`document.getElementById('nav-feedback')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('26_clean_parent_feedback.png');

    // 9. Capture Supplementary Tutoring
    await cdp.eval(`document.getElementById('nav-supplementary')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('27_clean_supplementary_tutoring.png');

    // 10. Capture Renewal & Retention
    await cdp.eval(`document.getElementById('nav-renewal')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('28_clean_renewal_and_retention.png');

    // 11. Capture Staff & Permissions
    await cdp.eval(`document.getElementById('nav-staff_roles')?.click();`);
    await wait(2000);
    await cdp.captureScreenshot('29_clean_staff_and_permissions.png');

    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

main().catch(console.error);
