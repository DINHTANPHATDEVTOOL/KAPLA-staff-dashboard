import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function inspectLiveSite() {
  const CHROME_PORT = 9260;
  const tmpProfile = `/tmp/kapla_inspect_${Date.now()}`;
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

    console.log('1. Navigating to https://kapla.io.vn ...');
    await send('Page.navigate', { url: 'https://kapla.io.vn' });
    await wait(4000);

    const initialText: any = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    console.log('--- Initial text on kapla.io.vn ---');
    console.log(initialText?.result?.value);

    // Click English language toggle
    console.log('2. Clicking English toggle...');
    await send('Runtime.evaluate', {
      expression: `
        const btns = Array.from(document.querySelectorAll('button'));
        const enBtn = btns.find(b => b.textContent?.includes('English') || b.title?.includes('English'));
        if (enBtn) enBtn.click();
      `,
    });
    await wait(2000);

    const enText: any = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });
    console.log('--- Text after clicking English ---');
    console.log(enText?.result?.value);

    // Also take screenshot
    const shot: any = await send('Page.captureScreenshot', { format: 'png' });
    if (shot?.data) {
      fs.writeFileSync('docs/screenshots/live_kapla_io_vn_en.png', Buffer.from(shot.data, 'base64'));
      console.log('✓ Captured docs/screenshots/live_kapla_io_vn_en.png');
    }
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

inspectLiveSite().catch(console.error);
