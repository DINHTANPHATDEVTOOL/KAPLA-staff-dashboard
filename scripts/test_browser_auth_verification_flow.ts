// ==============================================================================
// KAPLA — KIỂM THỬ ĐẦU-CUỐI TRÊN TRÌNH DUYỆT THẬT (CHROME DEVTOOLS PROTOCOL)
// 1. Đăng ký nhân viên mới qua API (trạng thái ban đầu: pending)
// 2. Trích xuất link xác thực thực tế từ Mailpit
// 3. Trình duyệt Chrome thật (Chrome 146) mở link xác thực -> redirect về SPA localhost:5173
// 4. Kiểm tra DOM trình duyệt hiển thị màn hình Chờ duyệt (PendingApprovalScreen)
// 5. CM đăng nhập trên GIAO DIỆN TRÌNH DUYỆT, vào tab Nhân sự & Phân quyền
// 6. CM mở modal và bấm nút "Xác nhận cấp quyền" TRỰC TIẾP TRÊN UI TRÌNH DUYỆT
// 7. CM đăng xuất, nhân viên mới đăng nhập lại trên UI -> Vào thẳng Dashboard làm việc
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

  // Trích xuất link xác thực Supabase và giải mã &amp;
  const linkMatch = fullBody.match(/http:\/\/127\.0\.0\.1:54321\/auth\/v1\/verify\?[^"'\s<>]+/);
  if (!linkMatch) {
    throw new Error(`Không trích xuất được link verify từ email Mailpit`);
  }
  return linkMatch[0].replace(/&amp;/g, '&');
}

async function runBrowserAuthVerificationFlow() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ TRÌNH DUYỆT THẬT (CHROME DEVTOOLS PROTOCOL)');
  console.log('  Đăng ký -> Xác thực -> Chờ duyệt -> CM DUYỆT TRÊN GIAO DIỆN -> Dashboard');
  console.log('======================================================================\n');

  const runId = Date.now();
  const password = 'Password123!';
  const candidateEmail = `candidate.${runId}@kapla.edu.vn`;
  const candidateName = `Lê Thu Hằng (Ứng viên ${runId.toString().slice(-4)})`;

  // 1. Khởi tạo tài khoản Giám đốc cơ sở (CM) Phạm Hùng
  const cmEmail = `cm.ph.${runId}@kapla.edu.vn`;
  const { data: cmUser } = await adminClient.auth.admin.createUser({
    email: cmEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Hoàng Minh Tuấn (CM Phạm Hùng)', preferred_branch_id: BRANCH_PH_ID },
  });
  const cmId = cmUser.user!.id;
  await adminClient.from('profiles').update({ status: 'active', preferred_branch_id: BRANCH_PH_ID }).eq('id', cmId);
  await adminClient.from('branch_memberships').insert({
    user_id: cmId,
    branch_id: BRANCH_PH_ID,
    role: 'CM',
    status: 'active',
    is_primary: true,
  });

  // 2. Đăng ký tài khoản nhân viên mới
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
  const candidateUserId = signUpData.user!.id;

  // 3. Trích xuất link xác thực từ Mailpit
  console.log(`[2] Trích xuất link xác thực từ Mailpit (port 54324)...`);
  const verifyLink = await getConfirmationLinkFromMailpit(candidateEmail);
  assert('Trích xuất thành công link xác thực thực tế từ Mailpit', verifyLink.includes('/auth/v1/verify'), `Link: ${verifyLink}`);

  // 4. Khởi động Headless Chrome 146 với DevTools Protocol
  console.log(`[3] Khởi động trình duyệt Headless Chrome 146 (Remote Debugging Port: 9222)...`);
  const screenshotDir = '/home/rd/Desktop/KAPLA/docs/screenshots';
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const chromeProcess: ChildProcess = spawn('/usr/bin/google-chrome', [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,900',
    `--user-data-dir=/tmp/kapla-chrome-profile-${runId}`,
  ]);

  try {
    await waitForHttp('http://127.0.0.1:9222/json/version');
    const targets = await waitForHttp('http://127.0.0.1:9222/json');
    const pageTarget = targets.find((t: any) => t.type === 'page');
    if (!pageTarget) throw new Error('Không tìm thấy page target trong Chrome');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    assert('Kết nối thành công tới trình duyệt Chrome thật qua CDP WebSocket', true);

    // 5. Ứng viên mở link xác thực -> Nhận HTTP 303 Redirect về SPA -> Chờ duyệt
    console.log(`[4] Trình duyệt Chrome mở link xác thực và xử lý HTTP 303 Redirect về SPA...`);
    await cdp.send('Page.navigate', { url: verifyLink });

    let screenText = '';
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 400));
      screenText = (await cdp.eval('document.body.innerText')) || '';
      if (screenText.includes('Tài khoản đang chờ duyệt quyền') || screenText.includes('Chờ phê duyệt')) {
        break;
      }
    }

    assert(
      'Trình duyệt mở link xác thực, xử lý token và kết xuất giao diện "Tài khoản đang chờ duyệt quyền"',
      screenText.includes('Tài khoản đang chờ duyệt quyền'),
      'DOM hiển thị tiêu đề: "Tài khoản đang chờ duyệt quyền"'
    );

    assert(
      'Màn hình Chờ duyệt hiển thị đúng email của nhân viên ứng tuyển',
      screenText.includes(candidateEmail),
      `Email hiển thị trong DOM: ${candidateEmail}`
    );

    // Chụp ảnh màn hình 1: Ứng viên chờ duyệt
    const pendingScreenshotPath = path.join(screenshotDir, '01_browser_pending_approval.png');
    await cdp.captureScreenshot(pendingScreenshotPath);
    console.log(`     [Artifact 1] Đã lưu ảnh chụp màn hình Chờ duyệt: ${pendingScreenshotPath}`);

    // 6. Ứng viên bấm Đăng xuất trên màn hình Chờ duyệt
    console.log(`[5] Ứng viên bấm Đăng xuất để nhường phiên cho Giám đốc cơ sở (CM) đăng nhập...`);
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const logoutBtn = btns.find(b => b.innerText.includes('Đăng xuất'));
        if (logoutBtn) logoutBtn.click();
      })()
    `);

    // Chờ giao diện hiển thị form Đăng nhập
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const loginCheck = (await cdp.eval('document.body.innerText')) || '';
      if (loginCheck.includes('Đăng nhập vào cổng học vụ') || loginCheck.includes('Email cơ quan')) {
        break;
      }
    }

    // 7. CM đăng nhập TRỰC TIẾP TRÊN GIAO DIỆN TRÌNH DUYỆT
    console.log(`[6] Giám đốc cơ sở (CM) điền thông tin và đăng nhập TRỰC TIẾP TRÊN GIAO DIỆN TRÌNH DUYỆT...`);
    await cdp.eval(`
      (() => {
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const form = document.querySelector('form');
        if (emailInput && passInput && form) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(emailInput, '${cmEmail}');
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          setter.call(passInput, '${password}');
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      })()
    `);

    // Chờ CM vào Dashboard
    let cmDashboardText = '';
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 400));
      cmDashboardText = (await cdp.eval('document.body.innerText')) || '';
      if (cmDashboardText.includes('Nhân sự & Phân quyền') || cmDashboardText.includes('Tổng quan học vụ')) {
        break;
      }
    }
    assert('CM đăng nhập thành công qua form đăng nhập trên giao diện trình duyệt', cmDashboardText.includes('Nhân sự & Phân quyền'));

    // 8. CM click menu "Nhân sự & Phân quyền" trên Sidebar
    console.log(`[7] CM bấm chọn mục "Nhân sự & Phân quyền" trên thanh điều hướng Sidebar...`);
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button, a'));
        const staffMenu = btns.find(b => b.innerText.includes('Nhân sự & Phân quyền'));
        if (staffMenu) staffMenu.click();
      })()
    `);

    // Chờ bảng danh sách chờ duyệt tải xong
    let pendingListText = '';
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 400));
      pendingListText = (await cdp.eval('document.body.innerText')) || '';
      if (pendingListText.includes('Danh sách tài khoản nhân viên đang chờ phê duyệt') && pendingListText.includes(candidateEmail)) {
        break;
      }
    }
    assert(
      'Giao diện CM hiển thị danh sách chờ duyệt có chứa ứng viên mới đăng ký',
      pendingListText.includes(candidateEmail),
      `Ứng viên ${candidateName} có mặt trong danh sách chờ duyệt của CM`
    );

    // 9. CM bấm nút "Phê duyệt & Cấp vai trò" trên hàng của ứng viên
    console.log(`[8] CM bấm nút "Phê duyệt & Cấp vai trò" để mở Modal phê duyệt trên UI...`);
    const clickModalRes = await cdp.eval(`
      (() => {
        const rows = Array.from(document.querySelectorAll('tr'));
        const targetRow = rows.find(r => r.innerText.includes('${candidateEmail}'));
        if (!targetRow) return 'Không tìm thấy dòng của candidate';
        const btns = Array.from(targetRow.querySelectorAll('button'));
        const btn = btns.find(b => b.innerText.includes('Phê duyệt'));
        if (!btn) return 'Không tìm thấy nút Phê duyệt. Các nút hiện có: ' + btns.map(b => b.innerText).join(', ') + ' | InnerText: ' + targetRow.innerText;
        btn.click();
        return 'Đã click nút Phê duyệt thành công';
      })()
    `);
    console.log(`     [UI Action] Kết quả: ${clickModalRes}`);

    // Chờ Modal phê duyệt mở
    let modalText = '';
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 300));
      modalText = (await cdp.eval('document.body.innerText')) || '';
      if (modalText.includes('Xác nhận cấp quyền') || modalText.includes('Phê duyệt vai trò')) {
        break;
      }
    }
    assert('Modal "Phê duyệt vai trò nhân sự" mở thành công trên giao diện', modalText.includes('Xác nhận cấp quyền') || modalText.includes('Phê duyệt vai trò'));

    // 10. CM bấm nút "Xác nhận phân quyền" trên Modal
    console.log(`[9] CM bấm nút "Xác nhận phân quyền" trong Modal để cấp quyền HRT...`);
    const clickConfirmRes = await cdp.eval(`
      (() => {
        const modalBtns = Array.from(document.querySelectorAll('button'));
        const confirmBtn = modalBtns.find(b => b.innerText.includes('Xác nhận phân quyền') || b.innerText.includes('Xác nhận cấp quyền'));
        if (confirmBtn) {
          confirmBtn.click();
          return 'CLICKED: ' + confirmBtn.innerText.trim();
        }
        return 'NOT_FOUND: ' + modalBtns.map(b => b.innerText.trim()).join(', ');
      })()
    `);
    console.log(`     [UI Action] Kết quả: ${clickConfirmRes}`);

    // Chờ thông báo thành công xuất hiện trên giao diện
    let successNoticeText = '';
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 400));
      successNoticeText = (await cdp.eval('document.body.innerText')) || '';
      if (
        successNoticeText.includes('Đã phê duyệt tài khoản') ||
        successNoticeText.includes('Đã duyệt thành công') ||
        successNoticeText.includes('thành công')
      ) {
        break;
      }
    }

    assert(
      'CM phê duyệt và cấp vai trò HRT cho nhân viên THÀNH CÔNG TRỰC TIẾP TRÊN GIAO DIỆN TRÌNH DUYỆT',
      successNoticeText.includes('Đã phê duyệt tài khoản') ||
        successNoticeText.includes('Đã duyệt thành công') ||
        successNoticeText.includes('với vai trò HRT'),
      `Thông báo UI: "${successNoticeText.slice(0, 100).replace(/\n/g, ' ')}"`
    );

    // Chụp ảnh màn hình 2: CM duyệt thành công trên UI
    const cmApprovedScreenshotPath = path.join(screenshotDir, '02_browser_cm_approval_on_ui.png');
    await cdp.captureScreenshot(cmApprovedScreenshotPath);
    console.log(`     [Artifact 2] Đã lưu ảnh chụp CM duyệt trên UI: ${cmApprovedScreenshotPath}`);

    // 11. CM đăng xuất khỏi hệ thống
    console.log(`[10] CM đăng xuất khỏi giao diện...`);
    await cdp.eval(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const logoutBtn = btns.find(b => b.innerText.includes('Đăng xuất'));
        if (logoutBtn) logoutBtn.click();
      })()
    `);

    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 300));
      const logoutCheck = (await cdp.eval('document.body.innerText')) || '';
      if (logoutCheck.includes('Đăng nhập vào cổng học vụ')) break;
    }

    // 12. Nhân viên mới (đã được duyệt) đăng nhập vào hệ thống TRÊN TRÌNH DUYỆT
    console.log(`[11] Nhân viên mới đăng nhập lại trên giao diện trình duyệt...`);
    await cdp.eval(`
      (() => {
        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');
        const form = document.querySelector('form');
        if (emailInput && passInput && form) {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          setter.call(emailInput, '${candidateEmail}');
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          setter.call(passInput, '${password}');
          passInput.dispatchEvent(new Event('input', { bubbles: true }));
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      })()
    `);

    // Chờ vào Dashboard của nhân viên mới
    let candidateDashboardText = '';
    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 400));
      candidateDashboardText = (await cdp.eval('document.body.innerText')) || '';
      if (candidateDashboardText.includes('Tổng quan học vụ') || candidateDashboardText.includes('Hồ sơ học viên')) {
        break;
      }
    }

    assert(
      'Sau khi được CM duyệt trên UI, nhân viên mới đăng nhập và vào thẳng Dashboard tác nghiệp (AppLayout)',
      candidateDashboardText.includes('Tổng quan học vụ') || candidateDashboardText.includes('Hồ sơ học viên'),
      'DOM hiển thị đầy đủ các thanh chức năng nghiệp vụ của HRT'
    );

    assert(
      'Màn hình Chờ duyệt đã hoàn toàn biến mất, quyền nghiệp vụ đã được mở đầy đủ cho nhân viên mới',
      !candidateDashboardText.includes('Tài khoản đang chờ duyệt quyền'),
      'Chuyển trạng thái từ Pending sang Active hoàn tất trên trình duyệt'
    );

    // Chụp ảnh màn hình 3: Dashboard của nhân viên mới
    const candidateDashboardScreenshotPath = path.join(screenshotDir, '03_browser_approved_dashboard.png');
    await cdp.captureScreenshot(candidateDashboardScreenshotPath);
    console.log(`     [Artifact 3] Đã lưu ảnh chụp Dashboard nhân viên mới: ${candidateDashboardScreenshotPath}`);

    cdp.close();
  } finally {
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
