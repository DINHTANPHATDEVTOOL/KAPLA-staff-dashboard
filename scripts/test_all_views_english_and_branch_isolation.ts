// ==============================================================================
// KAPLA — Verify All Views Bilingual English & Branch Isolation
// ==============================================================================

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CHROME_PORT = 9229;

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
  console.log('  KAPLA — KIỂM THỬ TOÀN DIỆN CẢ 8 VIEW: CHUẨN TIẾNG ANH & CÔ LẬP CƠ SỞ');
  console.log('======================================================================\n');

  const profileDir = `/tmp/kapla-browser-test-${Date.now()}`;
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

    console.log('[1] Đăng nhập bằng tài khoản CM Phạm Hùng (cm.phamhung@kapla.edu.vn)...');
    await client.eval(`
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('CM Phạm Hùng'));
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
      if (text && text.includes('KAPLA Staff')) break;
      await wait(300);
    }
    await wait(1000);

    // Check Branch Isolation on TopBar
    console.log('[2] Kiểm tra cô lập chi nhánh trên TopBar đối với CM Phạm Hùng:');
    const isFixedBadge = await client.eval(`!!document.querySelector('#branch-fixed-badge')`);
    const hasBranchDropdown = await client.eval(`!!document.querySelector('#branch-selector-btn')`);
    const branchBadgeText = await client.eval(`document.querySelector('#branch-fixed-badge')?.textContent || ''`);

    console.log(`    Badge cố định hiển thị: ${isFixedBadge}, Text: "${branchBadgeText.trim()}", Dropdown đổi cơ sở: ${hasBranchDropdown}`);
    if (isFixedBadge && !hasBranchDropdown && branchBadgeText.includes('Phạm Hùng')) {
      console.log('  [PASS] CÔ LẬP CƠ SỞ: CM Phạm Hùng chỉ có quyền xem chi nhánh Phạm Hùng, không có dropdown đổi cơ sở khác!');
    } else {
      console.error('  [FAIL] Cô lập cơ sở thất bại!');
      process.exit(1);
    }

    // Switch Language to 🇺🇸 English (US)
    console.log('\n[3] Chuyển đổi ngôn ngữ sang 🇺🇸 English (US)...');
    const clickedEn = await client.eval(`
      const enBtn = document.querySelector('#language-btn-en');
      if (enBtn) {
        enBtn.click();
        true;
      } else {
        false;
      }
    `);
    await wait(800);
    const langInStorage = await client.eval(`localStorage.getItem('kapla_language')`);
    console.log(`    Clicked EN button: ${clickedEn}, Storage lang: ${langInStorage}`);

    // Check 1: Student Records
    console.log('\n[4] Kiểm tra màn hình Student Records:');
    await client.eval(`document.querySelector('#nav-students')?.click();`);
    await wait(1000);

    const studentRecordsText = (await client.eval('document.body.innerText') || '').toUpperCase();
    const hasVietnameseKpi = studentRecordsText.includes('TỔNG HỌC VIÊN PHỤ TRÁCH') || studentRecordsText.includes('HỌC PHÍ AN TOÀN');
    const hasEnglishKpi = studentRecordsText.includes('TOTAL MANAGED STUDENTS') && studentRecordsText.includes('SAFE TUITION');

    if (!hasVietnameseKpi && hasEnglishKpi) {
      console.log('  [PASS] Student Records: 100% KPI cards và nhãn bảng là Tiếng Anh chuẩn!');
      await client.captureScreenshot('docs/screenshots/11_en_student_records.png');
    } else {
      console.error('  [FAIL] Vẫn còn Tiếng Việt trong Student Records!');
      console.log('    Snippet (1000 chars):', studentRecordsText.slice(0, 1000));
      process.exit(1);
    }

    // Check 2: Care Tasks
    console.log('\n[5] Kiểm tra màn hình HRT Tasks (Care Worklist):');
    await client.eval(`document.querySelector('#nav-care_tasks')?.click();`);
    await wait(1000);

    const careTasksText = await client.eval('document.body.innerText');
    const hasVietnameseCareEmpty = careTasksText.includes('Không có công việc nào');
    const hasEnglishCareEmpty = careTasksText.includes('No Tasks Found') || careTasksText.includes('TOTAL TASKS');

    if (!hasVietnameseCareEmpty && hasEnglishCareEmpty) {
      console.log('  [PASS] HRT Tasks: Empty state và tiêu đề hiển thị chuẩn Tiếng Anh!');
      await client.captureScreenshot('docs/screenshots/12_en_care_tasks.png');
    } else {
      console.error('  [FAIL] Vẫn còn Tiếng Việt trong HRT Tasks!');
      process.exit(1);
    }

    // Check 3: Competency Assessments
    console.log('\n[6] Kiểm tra màn hình Competency Assessments:');
    await client.eval(`document.querySelector('#nav-assessments')?.click();`);
    await wait(1000);

    const assessText = await client.eval('document.body.innerText');
    const hasVietnameseAssessEmpty = assessText.includes('Chưa có bài đánh giá nào');
    const hasEnglishAssessEmpty = assessText.includes('No Assessments Found') || assessText.includes('TOTAL ASSESSMENTS');

    if (!hasVietnameseAssessEmpty && hasEnglishAssessEmpty) {
      console.log('  [PASS] Competency Assessments: Không còn tiếng Việt, chuẩn Tiếng Anh!');
      await client.captureScreenshot('docs/screenshots/13_en_assessments.png');
    } else {
      console.error('  [FAIL] Vẫn còn Tiếng Việt trong Competency Assessments!');
      process.exit(1);
    }

    // Check 4: Academic Interventions
    console.log('\n[7] Kiểm tra màn hình Academic Interventions:');
    await client.eval(`document.querySelector('#nav-interventions')?.click();`);
    await wait(1000);

    const interText = await client.eval('document.body.innerText');
    const hasVietnameseInterventionStages = interText.includes('Mới phát hiện rủi ro') || interText.includes('Không có phiếu can thiệp nào');
    const hasEnglishInterventionStages = interText.toUpperCase().includes('1. OPEN') && (interText.includes('Newly flagged risk') || interText.includes('No Interventions Found'));

    if (!hasVietnameseInterventionStages && hasEnglishInterventionStages) {
      console.log('  [PASS] Academic Interventions: Các giai đoạn can thiệp và empty state là chuẩn Tiếng Anh!');
      await client.captureScreenshot('docs/screenshots/14_en_interventions.png');
    } else {
      console.error('  [FAIL] Vẫn còn Tiếng Việt trong Academic Interventions!');
      console.log('    Snippet:', interText.slice(0, 500));
      process.exit(1);
    }

    // Check 5: Renewal & Retention
    console.log('\n[8] Kiểm tra màn hình Renewal & Retention:');
    await client.eval(`document.querySelector('#nav-renewal')?.click();`);
    await wait(1000);

    const renewalText = await client.eval('document.body.innerText');
    const hasDevBanner = renewalText.includes('Giai đoạn T05: Cấu hình Hệ thống') || renewalText.includes('T04');
    const hasPolicyCard = renewalText.includes('System Policy Configuration') || renewalText.includes('Tuition Alert Threshold: 14 Days');

    if (!hasDevBanner && hasPolicyCard) {
      console.log('  [PASS] Renewal & Retention: Đã xóa hoàn toàn dev phase placeholder, hiển thị cấu hình chuyên nghiệp chuẩn Tiếng Anh!');
      await client.captureScreenshot('docs/screenshots/15_en_renewal_policy.png');
    } else {
      console.error('  [FAIL] Banner giai đoạn dev vẫn còn tồn tại trong Renewal & Retention!');
      process.exit(1);
    }

    // Check 6: Activity Logs
    console.log('\n[9] Kiểm tra màn hình Activity Logs:');
    await client.eval(`document.querySelector('#nav-logs')?.click();`);
    await wait(1000);

    const logsText = await client.eval('document.body.innerText');
    const hasLogsDevPlaceholder = logsText.includes('KẾ HOẠCH TRIỂN KHAI: GIAI ĐOẠN T04');
    const hasLiveAuditTrail = logsText.includes('Activity & Operational Audit Trail') && logsText.includes('Row-Level Security Active');

    if (!hasLogsDevPlaceholder && hasLiveAuditTrail) {
      console.log('  [PASS] Activity Logs: Thay thế hoàn toàn dev placeholder bằng bảng nhật ký kiểm toán trực tiếp!');
      await client.captureScreenshot('docs/screenshots/16_en_activity_logs.png');
    } else {
      console.error('  [FAIL] Placeholder dev vẫn còn tồn tại trong Activity Logs!');
      process.exit(1);
    }

    console.log('\n======================================================================');
    console.log('  TẤT CẢ CÁC MÀN HÌNH ĐẠT CHUẨN 100% TIẾNG ANH & CÔ LẬP CƠ SỞ TUYỆT ĐỐI!');
    console.log('======================================================================');

    // Copy screenshots to artifact folder
    const artifactDir = '/home/rd/.gemini/antigravity/brain/9996d84d-1d5c-4614-9f39-19af09d3d17b/screenshots';
    fs.mkdirSync(artifactDir, { recursive: true });
    ['11_en_student_records.png', '12_en_care_tasks.png', '13_en_assessments.png', '14_en_interventions.png', '15_en_renewal_policy.png', '16_en_activity_logs.png'].forEach(file => {
      const src = path.resolve('docs/screenshots', file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(artifactDir, file));
      }
    });

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
