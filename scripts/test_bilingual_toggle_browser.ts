// ==============================================================================
// KAPLA — KIỂM THỬ TRÌNH DUYỆT THẬT: SONG NGỮ VI / EN-US & LƯU TRỮ
// ==============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

const FRONTEND_URL = 'http://localhost:5173';
const CHROME_PORT = 9224;

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
    if (res && res.data) {
      fs.writeFileSync(outputPath, Buffer.from(res.data, 'base64'));
    }
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function waitForHttp(url: string, retries = 30, interval = 200): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {}
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error(`Timeout chờ HTTP URL: ${url}`);
}

function assert(description: string, condition: boolean, extra: string = '') {
  if (!condition) {
    console.error(`  [FAIL] ${description} ${extra ? `-> ${extra}` : ''}`);
    throw new Error(`Kiểm thử thất bại tại bước: "${description}"`);
  }
  console.log(`  [PASS] ${description}`);
  if (extra) console.log(`         -> ${extra}`);
}

async function main() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ TRÌNH DUYỆT THẬT: SONG NGỮ VI / EN-US & LƯU TRỮ');
  console.log('======================================================================\n');

  const profileDir = path.join('/tmp', `kapla-bilingual-profile-${Date.now()}`);
  fs.mkdirSync(profileDir, { recursive: true });

  const chromeProcess = spawn(
    'google-chrome',
    [
      '--headless=new',
      `--remote-debugging-port=${CHROME_PORT}`,
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--user-data-dir=${profileDir}`,
      '--window-size=1400,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let passed = 0;
  const total = 7;

  try {
    await waitForHttp(`http://127.0.0.1:${CHROME_PORT}/json/version`);
    const targets = await waitForHttp(`http://127.0.0.1:${CHROME_PORT}/json`);
    const pageTarget = targets.find((t: any) => t.type === 'page');
    if (!pageTarget) throw new Error('Không tìm thấy page target trong Chrome');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    // 1. Mở trang đăng nhập
    console.log('[1] Truy cập ứng dụng tại http://localhost:5173...');
    await cdp.send('Page.navigate', { url: FRONTEND_URL });

    let initialText = '';
    for (let i = 0; i < 30; i++) {
      await wait(400);
      initialText = (await cdp.eval('document.body ? document.body.innerText : ""')) || '';
      if (initialText.includes('Đăng nhập tài khoản') && initialText.includes('Email cơ quan')) break;
    }

    assert(
      'Màn hình đăng nhập mặc định hiển thị Tiếng Việt',
      initialText.includes('Đăng nhập tài khoản') && initialText.includes('Email cơ quan'),
      `Nội dung DOM: "${initialText.slice(0, 100).replace(/\n/g, ' ')}"`
    );
    passed++;

    // 2. Kiểm tra sự hiện diện của nút chuyển ngôn ngữ
    console.log('[2] Kiểm tra nút chuyển đổi ngôn ngữ 🇻🇳 Tiếng Việt / 🇺🇸 English (US)...');
    const toggleExists = await cdp.eval(`
      (() => {
        const viBtn = document.getElementById('language-btn-vi');
        const enBtn = document.getElementById('language-btn-en');
        return Boolean(viBtn && enBtn);
      })()
    `);
    assert(
      'Nút chuyển đổi song ngữ xuất hiện đầy đủ trên giao diện',
      Boolean(toggleExists),
      'Đã tìm thấy language-btn-vi và language-btn-en'
    );
    passed++;

    // 3. Thao tác bấm chuyển sang English (US)
    console.log('[3] Bấm nút chuyển sang 🇺🇸 English (US)...');
    await cdp.eval(`
      (() => {
        const enBtn = document.getElementById('language-btn-en');
        if (enBtn) enBtn.click();
      })()
    `);

    let enText = '';
    for (let i = 0; i < 20; i++) {
      await wait(300);
      enText = (await cdp.eval('document.body ? document.body.innerText : ""')) || '';
      if (enText.includes('Sign in to your account')) break;
    }

    assert(
      'Giao diện tài khoản chuyển ngay lập tức sang American English (US)',
      enText.includes('Sign in to your account') && enText.includes('Work Email'),
      'DOM cập nhật: "Sign in to your account", "Work Email", "Sign In to Portal"'
    );
    passed++;

    // 4. Kiểm tra lưu trữ trên LocalStorage
    console.log('[4] Kiểm tra persistence trong LocalStorage của trình duyệt...');
    const storedLang = await cdp.eval(`localStorage.getItem('kapla_language')`);
    assert(
      'Lựa chọn ngôn ngữ được lưu bền vững vào LocalStorage (kapla_language = "en")',
      storedLang === 'en',
      `Giá trị thực tế trong LocalStorage: "${storedLang}"`
    );
    passed++;

    // 5. Tải lại trang (F5 Reload) để chứng minh lưu nhớ cấu hình
    console.log('[5] Tải lại trang (F5 Reload) để kiểm tra tính năng ghi nhớ...');
    await cdp.send('Page.navigate', { url: FRONTEND_URL });

    let reloadedText = '';
    for (let i = 0; i < 25; i++) {
      await wait(400);
      reloadedText = (await cdp.eval('document.body ? document.body.innerText : ""')) || '';
      if (reloadedText.includes('Sign in to your account')) break;
    }

    assert(
      'Sau khi tải lại trang, giao diện vẫn duy trì English (US) mà không bị mất cấu hình',
      reloadedText.includes('Sign in to your account') && reloadedText.includes('Work Email'),
      'Trình duyệt tự động nạp ngôn ngữ đã lưu từ LocalStorage'
    );
    passed++;

    // 6. Chuyển lại về Tiếng Việt
    console.log('[6] Bấm chuyển lại sang 🇻🇳 Tiếng Việt...');
    await cdp.eval(`
      (() => {
        const viBtn = document.getElementById('language-btn-vi');
        if (viBtn) viBtn.click();
      })()
    `);

    let revertedText = '';
    for (let i = 0; i < 20; i++) {
      await wait(300);
      revertedText = (await cdp.eval('document.body ? document.body.innerText : ""')) || '';
      if (revertedText.includes('Đăng nhập tài khoản')) break;
    }
    const storedLangVi = await cdp.eval(`localStorage.getItem('kapla_language')`);

    assert(
      'Giao diện chuyển lại Tiếng Việt mượt mà và LocalStorage cập nhật "vi"',
      revertedText.includes('Đăng nhập tài khoản') && storedLangVi === 'vi',
      'DOM có "Đăng nhập tài khoản", LocalStorage: "vi"'
    );
    passed++;

    // 7. Chuyển lại EN và chụp ảnh màn hình làm minh chứng
    console.log('[7] Chuyển lại EN và chụp ảnh màn hình giao diện song ngữ...');
    await cdp.eval(`
      (() => {
        const enBtn = document.getElementById('language-btn-en');
        if (enBtn) enBtn.click();
      })()
    `);
    await wait(600);

    const screenshotDir = path.join(process.cwd(), 'docs', 'screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, '04_browser_bilingual_login_en.png');
    await cdp.captureScreenshot(screenshotPath);
    console.log(`     [Artifact] Đã lưu ảnh chụp giao diện English: ${screenshotPath}`);
    assert('Đã lưu ảnh chụp giao diện song ngữ thành công', fs.existsSync(screenshotPath));
    passed++;

    cdp.close();
  } catch (err) {
    console.error('Lỗi trong quá trình kiểm thử:', err);
    throw err;
  } finally {
    try {
      chromeProcess.kill('SIGKILL');
      await wait(400);
      fs.rmSync(profileDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ KIỂM THỬ TRÌNH DUYỆT THẬT: ${passed}/${total} BƯỚC ĐẠT 100%`);
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\nLỖI KIỂM THỬ:', err);
  process.exit(1);
});
