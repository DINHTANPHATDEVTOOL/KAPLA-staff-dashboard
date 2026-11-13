import { spawn } from 'node:child_process';
import http from 'node:http';
import WebSocket from 'ws';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testEnglishDashboard() {
  const CHROME_PORT = 9261;
  const tmpProfile = `/tmp/kapla_inspect_dash_${Date.now()}`;
  const chromeProc = spawn('google-chrome', [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    `--remote-debugging-port=${CHROME_PORT}`,
    `--user-data-dir=${tmpProfile}`,
    'about:blank',
  ]);
  await wait(1500);

  try {
    const res: any = await new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${CHROME_PORT}/json`, (r) => {
          let d = '';
          r.on('data', (c) => (d += c));
          r.on('end', () => resolve(JSON.parse(d)));
        })
        .on('error', reject);
    });

    const pageTarget = res.find((t: any) => t.type === 'page') || res[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((r) => ws.on('open', r));

    let id = 0;
    const send = (method: string, params: any = {}): Promise<any> =>
      new Promise((resolve) => {
        const curId = ++id;
        const handler = (raw: string) => {
          const msg = JSON.parse(raw);
          if (msg.id === curId) {
            ws.off('message', handler);
            resolve(msg.result);
          }
        };
        ws.on('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });

    ws.on('message', (raw: string) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.method === 'Runtime.consoleAPICalled') {
          console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map((a: any) => a.value || a.description).join(' '));
        }
      } catch (e) {}
    });

    await send('Page.navigate', { url: 'https://kapla.io.vn' });
    await wait(3000);

    // Click English language toggle
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const enBtn = btns.find(b => b.textContent?.includes('English') || b.title?.includes('English'));
        if (enBtn) enBtn.click();
      `,
    });
    await wait(500);

    // Fill in email and password and submit
    const submitResult: any = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const emailInput = document.getElementById('login-email');
          const pwInput = document.getElementById('login-password');
          if (emailInput && pwInput) {
            emailInput.value = 'admin@kapla.edu.vn';
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
            pwInput.value = 'Kapla@2026';
            pwInput.dispatchEvent(new Event('input', { bubbles: true }));
            const form = emailInput.closest('form');
            if (form) form.requestSubmit();
            return 'submitted';
          }
          return 'inputs not found';
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });
    console.log('Submit result:', submitResult?.result?.value);
    await wait(4000);

    // Check dashboard text in English
    const dashText: any = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    console.log('--- Dashboard text in English ---');
    console.log(dashText?.result?.value);

  } finally {
    chromeProc.kill('SIGKILL');
  }
}

testEnglishDashboard().catch(console.error);
