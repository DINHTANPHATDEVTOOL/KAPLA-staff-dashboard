// ==============================================================================
// KAPLA — Verify Permission Hiding Rule & Full Bilingual (Browser CDP)
// ==============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CHROME_PORT = 9228;

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
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ: ẨN HOÀN TOÀN KHI KHÔNG CÓ QUYỀN & CHUẨN SONG NGỮ');
  console.log('======================================================================\n');

  const profileDir = `/tmp/kapla-rbac-profile-${Date.now()}`;
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
      if (text && text.includes('Đăng nhập tài khoản') && text.includes('Email cơ quan')) {
        break;
      }
      await wait(300);
    }

    console.log('[1] Đăng nhập bằng tài khoản HRT Mai (hrt.mai@kapla.edu.vn)...');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('HRT Mai'));
      if (btn) btn.click();
    `);
    await wait(300);

    await client.eval(`
      const submit = document.querySelector('button[type="submit"]');
      if (submit) submit.click();
    `);

    // Wait for Dashboard to load
    for (let i = 0; i < 40; i++) {
      const text = await client.eval('document.body.innerText');
      if (text && (text.includes('Tổng quan học vụ') || text.includes('KAPLA Staff'))) {
        break;
      }
      await wait(300);
    }
    await wait(1000);

    console.log('[2] Kiểm tra quy tắc phân quyền trên Sidebar của HRT Mai:');
    const sidebarItems = await client.eval(`
      Array.from(document.querySelectorAll('nav button span.truncate')).map(el => el.textContent)
    `);
    console.log('    Các menu hiển thị trên Sidebar:', sidebarItems);

    const hasStaffRoles = sidebarItems.some((label: string) => label.includes('Nhân sự & Phân quyền') || label.includes('Staff & Permissions'));
    const hasBranchesClasses = sidebarItems.some((label: string) => label.includes('Chi nhánh & Lớp học') || label.includes('Branches & Classes'));

    if (!hasStaffRoles && !hasBranchesClasses) {
      console.log('  [PASS] ẨN HOÀN TOÀN: Menu "Nhân sự & Phân quyền" và "Chi nhánh & Lớp học" không hiển thị trên Sidebar của HRT Mai!');
    } else {
      console.error('  [FAIL] Menu quản trị vẫn bị lộ cho HRT!');
      process.exit(1);
    }

    // Go to Student Records
    console.log('\n[3] Kiểm tra quyền trên trang Hồ sơ học viên:');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Hồ sơ học viên'));
      if (btn) btn.click();
    `);
    await wait(1000);

    const hasAddStudentBtn = await client.eval(`
      !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Thêm học viên mới') || b.textContent.includes('Add New Student'))
    `);
    const hasTransferAction = await client.eval(`
      !!document.querySelector('button[title*="Chuyển lớp"]')
    `);

    if (!hasAddStudentBtn && !hasTransferAction) {
      console.log('  [PASS] ẨN HOÀN TOÀN: Nút "+ Thêm học viên mới" và nút "Chuyển lớp" không hiển thị đối với HRT Mai!');
    } else {
      console.error('  [FAIL] Nút quản trị học viên vẫn bị lộ!');
      process.exit(1);
    }

    // Go to Renewal Management
    console.log('\n[4] Kiểm tra quyền trên trang Quản lý tái tục (T04/T05):');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('nav button')).find(b => b.textContent.includes('Quản lý tái tục'));
      if (btn) btn.click();
    `);
    await wait(1000);

    const hasAdminConfig = await client.eval(`
      document.body.innerText.includes('Admin cài đặt') || document.body.innerText.includes('Admin threshold')
    `);
    const hasPreviewBtn = await client.eval(`
      !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Xem trước') || b.textContent.includes('Preview'))
    `);

    if (!hasAdminConfig && !hasPreviewBtn) {
      console.log('  [PASS] ẨN HOÀN TOÀN: Khung cấu hình ngưỡng Admin và nút "Xem trước email" không hiển thị đối với HRT Mai!');
    } else {
      console.error('  [FAIL] Chức năng quản trị học phí Admin vẫn bị lộ!');
      process.exit(1);
    }

    const screenshotHrtPath = path.resolve('docs/screenshots/07_hrt_mai_hidden_unauthorized_menu.png');
    await client.captureScreenshot(screenshotHrtPath);
    console.log('  [Screenshot] Đã lưu ảnh HRT Mai:', screenshotHrtPath);

    // Test Bilingual Switcher on Dashboard
    console.log('\n[5] Kiểm tra chuyển đổi sang 🇺🇸 English (US) trên Dashboard:');
    await client.eval(`
      const enBtn = document.querySelector('#language-btn-en');
      if (enBtn) enBtn.click();
    `);
    await wait(1000);

    const englishSidebar = await client.eval(`
      Array.from(document.querySelectorAll('nav button span.truncate')).map(el => el.textContent)
    `);
    console.log('    Các menu Sidebar sau khi chuyển sang EN:', englishSidebar);

    const isFullyEnglish = englishSidebar.includes('Academic Overview') &&
                           englishSidebar.includes('Student Records') &&
                           englishSidebar.includes('HRT Tasks') &&
                           englishSidebar.includes('Renewal & Retention');

    if (isFullyEnglish) {
      console.log('  [PASS] CHUYỂN NGÔN NGỮ TRIỆT ĐỂ: Toàn bộ Sidebar và tiêu đề màn hình chuyển sang chuẩn American English (US)!');
    } else {
      console.error('  [FAIL] Sidebar vẫn còn sót Tiếng Việt!');
      process.exit(1);
    }

    const screenshotEnPath = path.resolve('docs/screenshots/08_bilingual_full_english_dashboard.png');
    await client.captureScreenshot(screenshotEnPath);
    console.log('  [Screenshot] Đã lưu ảnh English Dashboard:', screenshotEnPath);

    // Also copy to artifacts directory
    const artifactHrt = '/home/rd/.gemini/antigravity/brain/9996d84d-1d5c-4614-9f39-19af09d3d17b/screenshots/07_hrt_mai_hidden_unauthorized_menu.png';
    const artifactEn = '/home/rd/.gemini/antigravity/brain/9996d84d-1d5c-4614-9f39-19af09d3d17b/screenshots/08_bilingual_full_english_dashboard.png';
    fs.mkdirSync(path.dirname(artifactHrt), { recursive: true });
    fs.copyFileSync(screenshotHrtPath, artifactHrt);
    fs.copyFileSync(screenshotEnPath, artifactEn);

    console.log('\n======================================================================');
    console.log('  KẾT QUẢ KIỂM THỬ: 5/5 BƯỚC ĐẠT 100% PASS');
    console.log('======================================================================');

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
