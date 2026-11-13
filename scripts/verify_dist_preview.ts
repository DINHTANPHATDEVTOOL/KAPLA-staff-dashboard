import { spawn } from 'node:child_process';
import http from 'node:http';
import WebSocket from 'ws';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testDist() {
  console.log('1. Starting vite preview on port 4173...');
  const previewProc = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'inherit' });
  await wait(2000);

  const CHROME_PORT = 9255;
  const tmpProfile = `/tmp/kapla_test_dist_${Date.now()}`;
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

    console.log('2. Navigating to preview URL http://localhost:4173...');
    await send('Page.navigate', { url: 'http://localhost:4173' });
    await wait(3000);

    const evalRes: any = await send('Runtime.evaluate', {
      expression: 'document.body.innerText',
      returnByValue: true,
    });

    const text = evalRes?.result?.value || '';
    console.log('--- Page text content in production preview ---');
    console.log(text.slice(0, 300) + '...');
    console.log('----------------------------------------------');

    const hasLogin = text.includes('Đăng nhập tài khoản') || text.includes('Sign in') || text.includes('Email cơ quan');
    const isStuck = text.includes('Đang kết nối hệ thống phân quyền KAPLA...');
    console.log('✓ Has Login Form:', hasLogin);
    console.log('✓ Is Stuck on connecting:', isStuck);

    if (hasLogin && !isStuck) {
      console.log('🎉 SUCCESS! Production bundle renders the Login Form perfectly without any freeze!');
    } else {
      console.error('❌ FAILED! Production bundle is still stuck.');
      process.exit(1);
    }
  } finally {
    previewProc.kill('SIGKILL');
    chromeProc.kill('SIGKILL');
  }
}

testDist().catch((e) => {
  console.error(e);
  process.exit(1);
});
