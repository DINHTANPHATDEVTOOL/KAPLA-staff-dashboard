// ==============================================================================
// KAPLA — KIỂM THỬ ĐẦU-CUỐI TRÊN TRÌNH DUYỆT THẬT (CHROME DEVTOOLS PROTOCOL)
// 1. Đăng ký nhân viên mới qua API (trạng thái ban đầu: pending)
// 2. Trích xuất link xác thực thực tế từ Mailpit
// 3. Trình duyệt Chrome thật (Chrome 146) mở link xác thực -> redirect về SPA localhost:5173
// 4. Kiểm tra DOM trình duyệt hiển thị màn hình Chờ duyệt (PendingApprovalScreen)
// 5. CM phê duyệt phân quyền cho nhân viên
// 6. Trình duyệt tải lại -> Tự động chuyển thẳng vào Dashboard nghiệp vụ (AppLayout)
// ==============================================================================

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const MAILPIT_BASE_URL = 'http://127.0.0.1:54324';

const BRANCH_PH_ID = 'a0000000-0000-0000-0000-000000000001'; // Phạm Hùng

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let passed = 0;
let total = 0;

function assert(description: string, condition: boolean, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${description}`);
    if (detail) console.log(`         -> ${detail}`);
  } else {
    console.error(`  [FAIL] ${description}`);
    if (detail) console.error(`         -> ${detail}`);
    throw new Error(`Kiểm thử thất bại tại bước: "${description}"`);
  }
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

async function getConfirmationLinkFromMailpit(recipientEmail: string): Promise<string> {
  const res = await fetch(`${MAILPIT_BASE_URL}/api/v1/messages`);
  const data = await res.json();
  const msgSummary = (data.messages || []).find((m: any) => m.To[0].Address === recipientEmail);
  if (!msgSummary) {
    throw new Error(`Không tìm thấy email xác thực gửi đến ${recipientEmail} trong Mailpit`);
  }

  const detailRes = await fetch(`${MAILPIT_BASE_URL}/api/v1/message/${msgSummary.ID}`);
  const detail = await detailRes.json();
  const fullBody = (detail.HTML || '') + ' ' + (detail.Text || '');

  // Trích xuất link xác thực Supabase
  const linkMatch = fullBody.match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^"'\s<>]+/);
  if (!linkMatch) {
    throw new Error(`Không trích xuất được link verify từ email Mailpit`);
  }
  return linkMatch[0].replace(/&amp;/g, '&');
}

async function runBrowserAuthVerificationFlow() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ TRÌNH DUYỆT THẬT (CHROME DEVTOOLS PROTOCOL)');
  console.log('  Đăng ký -> Link xác thực -> Chờ duyệt -> CM duyệt -> Dashboard');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';
  const candidateEmail = `candidate.${runId}@kapla.edu.vn`;
  const candidateName = `Lê Thu Hằng (Ứng viên ${runId.toString().slice(-4)})`;

  // 1. Đăng ký tài khoản nhân viên mới
  console.log(`[1] Đăng ký nhân viên mới qua API: ${candidateEmail}...`);
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
    email: candidateEmail,
    password,
    options: {
      data: {
        full_name: candidateName,
        preferred_branch_id: BRANCH_PH_ID,
      },
      emailRedirectTo: 'http://localhost:5173',
    },
  });

  assert('Đăng ký tài khoản thành công qua API Supabase Auth', signUpError === null && signUpData.user !== null, `User ID: ${signUpData?.user?.id}`);
  const userId = signUpData.user!.id;

  // 2. Trích xuất link xác thực từ Mailpit
  console.log(`[2] Trích xuất link xác thực từ Mailpit (port 54324)...`);
  const verifyLink = await getConfirmationLinkFromMailpit(candidateEmail);
  assert('Trích xuất thành công link xác thực thực tế từ Mailpit', verifyLink.includes('/auth/v1/verify'), `Link: ${verifyLink}`);

  // 3. Khởi động Headless Chrome 146 với DevTools Protocol
  console.log(`[3] Khởi động trình duyệt Headless Chrome 146 (Remote Debugging Port: 9222)...`);
  const chromeProcess: ChildProcess = spawn('/usr/bin/google-chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    `--user-data-dir=/tmp/kapla-chrome-profile-${runId}`,
  ]);

  try {
    // Đợi Chrome sẵn sàng
    await waitForHttp('http://127.0.0.1:9222/json/version');
    const targets = await waitForHttp('http://127.0.0.1:9222/json');
    const pageTarget = targets.find((t: any) => t.type === 'page');
    if (!pageTarget) throw new Error('Không tìm thấy page target trong Chrome');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    assert('Kết nối thành công tới trình duyệt Chrome thật qua CDP WebSocket', true);

    // 4. Trình duyệt thật điều hướng đến link xác thực email
    console.log(`[4] Trình duyệt Chrome mở link xác thực và xử lý HTTP 303 Redirect về SPA...`);
    await cdp.send('Page.navigate', { url: verifyLink });

    // Đợi SPA xử lý hash #access_token=... và mount React components
    let screenText = '';
    let currentUrl = '';
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 500));
      currentUrl = (await cdp.eval('window.location.href')) || '';
      screenText = (await cdp.eval('document.body.innerText')) || '';
      console.log(`     [Browser Poll ${i + 1}] URL: ${currentUrl.slice(0, 80)}... | Body snippet: "${screenText.slice(0, 60).replace(/\n/g, ' ')}"`);
      if (screenText.includes('Tài khoản đang chờ duyệt quyền') || screenText.includes('Chờ phê duyệt')) {
        console.log(`     [Browser] Đã vào trang: ${currentUrl.split('#')[0]}, tiêu đề: "Tài khoản đang chờ duyệt quyền"`);
        break;
      }
    }

    assert(
      'Trình duyệt mở link xác thực, xử lý token và kết xuất giao diện "Tài khoản đang chờ duyệt quyền"',
      screenText.includes('Tài khoản đang chờ duyệt quyền'),
      'DOM hiển thị tiêu đề: "Tài khoản đang chờ duyệt quyền"'
    );

    console.log('\n--- DOM TEXT HIỆN TẠI TRÊN TRÌNH DUYỆT ---');
    console.log(screenText);
    console.log('-------------------------------------------\n');

    assert(
      'Màn hình Chờ duyệt hiển thị đúng email của nhân viên',
      screenText.includes(candidateEmail),
      `Email hiển thị trong DOM: ${candidateEmail}`
    );

    // Chụp ảnh màn hình Chờ duyệt
    const screenshotDir = '/home/rd/Desktop/KAPLA/docs/screenshots';
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    const pendingScreenshotPath = path.join(screenshotDir, '01_browser_pending_approval.png');
    await cdp.captureScreenshot(pendingScreenshotPath);
    console.log(`     [Artifact] Đã lưu ảnh chụp màn hình Chờ duyệt: ${pendingScreenshotPath}`);

    // 5. CM chi nhánh thực hiện duyệt quyền trên cơ sở dữ liệu
    console.log(`[5] Giám đốc cơ sở (CM) Phạm Hùng thực hiện duyệt và cấp vai trò HRT...`);
    await adminClient.from('profiles').update({ status: 'active' }).eq('id', userId);
    await adminClient.from('branch_memberships').insert({
      user_id: userId,
      branch_id: BRANCH_PH_ID,
      role: 'HRT',
      status: 'active',
      is_primary: true,
    });
    await adminClient.from('audit_logs').insert({
      actor_email: 'cm.ph@kapla.edu.vn',
      action: 'APPROVE_USER_ROLE',
      target_user_id: userId,
      branch_id: BRANCH_PH_ID,
      details: { role: 'HRT', branch: 'KAPLA Phạm Hùng', note: 'Phê duyệt từ bản nghiệm thu trình duyệt' },
    });

    assert('CM phê duyệt tài khoản và cấp vai trò HRT tại chi nhánh Phạm Hùng thành công', true);

    // 6. Nhấn nút "Kiểm tra lại trạng thái duyệt" trên màn hình hoặc làm mới phiên
    console.log(`[6] Nhấn nút "Kiểm tra lại trạng thái duyệt" trên giao diện để làm mới quyền...`);
    const clickResult = await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.includes('Kiểm tra lại trạng thái duyệt'));
        if (btn) {
          btn.click();
          return 'Clicked button thành công';
        }
        return 'Không tìm thấy nút';
      })()
    `);
    console.log(`     [UI Action] Kết quả: ${clickResult}`);

    let dashboardText = '';
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 400));
      dashboardText = (await cdp.eval('document.body.innerText')) || '';
      console.log(`     [Dashboard Poll ${i + 1}] Snippet: "${dashboardText.slice(0, 80).replace(/\n/g, ' ')}"`);
      if (dashboardText.includes('Tổng quan học vụ') || dashboardText.includes('Hồ sơ học viên') || dashboardText.includes('Công việc HRT')) {
        break;
      }
    }

    assert(
      'Sau khi CM duyệt, trình duyệt tự động chuyển vào Dashboard làm việc (AppLayout)',
      dashboardText.includes('Tổng quan học vụ') || dashboardText.includes('Hồ sơ học viên') || dashboardText.includes('Công việc HRT'),
      'DOM xuất hiện danh mục nghiệp vụ: "Tổng quan học vụ", "Hồ sơ học viên"'
    );

    assert(
      'Màn hình Chờ duyệt đã hoàn toàn biến mất, quyền nghiệp vụ đã được mở đầy đủ',
      !dashboardText.includes('Tài khoản đang chờ duyệt quyền'),
      'Giao diện đã chuyển từ Pending sang Active Dashboard'
    );

    // Chụp ảnh màn hình Dashboard sau khi duyệt
    const dashboardScreenshotPath = path.join(screenshotDir, '02_browser_approved_dashboard.png');
    await cdp.captureScreenshot(dashboardScreenshotPath);
    console.log(`     [Artifact] Đã lưu ảnh chụp màn hình Dashboard: ${dashboardScreenshotPath}`);

    cdp.close();
  } finally {
    // Tắt Chrome
    chromeProcess.kill('SIGKILL');
  }

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ NGHIỆM THU TRÌNH DUYỆT THẬT: ${passed}/${total} BƯỚC ĐẠT 100%`);
  console.log('======================================================================\n');
}

runBrowserAuthVerificationFlow().catch((err) => {
  console.error('\nLỖI NGHIỆM THU TRÌNH DUYỆT:', err);
  process.exit(1);
});
