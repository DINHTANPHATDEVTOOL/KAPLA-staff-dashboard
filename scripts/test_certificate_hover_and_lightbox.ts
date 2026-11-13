// ==============================================================================
// KAPLA — Verify Certificate Hover Zoom and Lightbox Modal
// ==============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CHROME_PORT = 9231;

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

  async captureScreenshot(outputPath: string): Promise<void> {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    if (res?.data) {
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    }
  }

  close() {
    this.ws?.close();
  }
}

async function waitForHttp(url: string, retries = 20): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await new Promise<string>((resolve, reject) => {
        http.get(url, (r) => {
          let data = '';
          r.on('data', (c) => (data += c));
          r.on('end', () => resolve(data));
        }).on('error', reject);
      });
      return JSON.parse(res);
    } catch {
      await wait(300);
    }
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  const profileDir = `/tmp/kapla-cert-profile-${Date.now()}`;
  fs.mkdirSync(profileDir, { recursive: true });

  const chromeProc = spawn(
    'google-chrome',
    [
      '--headless=new',
      `--remote-debugging-port=${CHROME_PORT}`,
      `--user-data-dir=${profileDir}`,
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
    const client = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('Page.navigate', { url: FRONTEND_URL });

    // Wait until login form renders
    for (let i = 0; i < 30; i++) {
      const text = await client.eval('document.body.innerText');
      if (text && text.includes('Đăng nhập tài khoản')) break;
      await wait(300);
    }

    // Capture standard login view with clear background
    await wait(1000);
    await client.captureScreenshot('docs/screenshots/18_vivid_kapla_background_login.png');
    console.log('[1] Đã lưu ảnh nền rõ nét đặc trưng của KAPLA!');

    // Click Oxford Quality certificate card to open Lightbox
    console.log('[2] Kiểm tra thao tác phóng to chứng nhận (Lightbox Modal)...');
    await client.eval(`
      const certCard = Array.from(document.querySelectorAll('span')).find(s => s.textContent === 'Oxford Quality')?.closest('.group');
      if (certCard) certCard.click();
    `);
    await wait(600);

    const hasLightbox = await client.eval(`
      !!document.querySelector('img[src*="oxford-quality-certificate"]')
    `);
    console.log(`    Lightbox hiển thị: ${hasLightbox}`);

    await client.captureScreenshot('docs/screenshots/19_certificate_fullscreen_lightbox.png');
    console.log('[3] Đã lưu ảnh phóng to chứng nhận:', 'docs/screenshots/19_certificate_fullscreen_lightbox.png');

    // Copy to brain artifacts
    const artifactDir = '/home/rd/.gemini/antigravity/brain/9996d84d-1d5c-4614-9f39-19af09d3d17b/screenshots';
    fs.mkdirSync(artifactDir, { recursive: true });
    fs.copyFileSync('docs/screenshots/18_vivid_kapla_background_login.png', path.join(artifactDir, '18_vivid_kapla_background_login.png'));
    fs.copyFileSync('docs/screenshots/19_certificate_fullscreen_lightbox.png', path.join(artifactDir, '19_certificate_fullscreen_lightbox.png'));

    client.close();
  } finally {
    chromeProc.kill('SIGKILL');
    await wait(300);
    try {
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
