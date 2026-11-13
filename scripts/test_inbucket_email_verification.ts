// ==============================================================================
// KAPLA — Test Luồng Xác Thực Email qua Inbucket/Mailpit API & Browser URL
// ==============================================================================

import WebSocket from 'ws';
(global as any).WebSocket = WebSocket;

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const MAILPIT_API = 'http://127.0.0.1:54324/api/v1';

async function runInbucketTest() {
  console.log('======================================================================');
  console.log('  KAPLA — Kiểm thử luồng gửi email xác thực và bóc tách link Inbucket');
  console.log('======================================================================\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const timestamp = Date.now();
  const testEmail = `teacher.inbucket.${timestamp}@kapla.edu.vn`;
  const testPassword = 'SecurePassword123!';

  console.log(`1. Đăng ký tài khoản mới: ${testEmail}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Giáo viên Test Inbucket',
        preferred_branch_id: 'a0000000-0000-0000-0000-000000000001',
      },
      emailRedirectTo: 'http://localhost:5173',
    },
  });

  if (signUpError) {
    throw new Error(`Đăng ký thất bại: ${signUpError.message}`);
  }
  console.log(`   -> Đăng ký thành công, user_id: ${signUpData.user?.id}`);
  console.log(`   -> Trạng thái email_confirmed_at ban đầu: ${signUpData.user?.email_confirmed_at || 'null (Chưa xác thực)'}`);

  // Chờ 1 giây để Mailpit nhận mail
  console.log('\n2. Kiểm tra hòm thư Mailpit / Inbucket trên port 54324...');
  await new Promise((r) => setTimeout(r, 1500));

  const listRes = await fetch(`${MAILPIT_API}/messages`);
  const listJson = await listRes.json();
  const messages = listJson.messages || [];

  const userMsg = messages.find((m: any) =>
    m.To.some((recipient: any) => recipient.Address.toLowerCase() === testEmail.toLowerCase())
  );

  if (!userMsg) {
    throw new Error(`Không tìm thấy thư xác thực gửi đến ${testEmail} trong Mailpit! Tổng số thư: ${messages.length}`);
  }

  console.log(`   -> Tìm thấy thư xác thực: Message ID: ${userMsg.ID}`);
  console.log(`   -> Tiêu đề: "${userMsg.Subject}"`);

  // Lấy chi tiết nội dung email
  const detailRes = await fetch(`${MAILPIT_API}/message/${userMsg.ID}`);
  const detailJson = await detailRes.json();
  const htmlBody = detailJson.HTML || detailJson.Text || '';

  // Trích xuất link xác thực
  const match = htmlBody.match(/href="([^"]+verify[^"]+)"/i) || htmlBody.match(/(http[^\s]+verify[^\s]+)/i);
  if (!match) {
    throw new Error('Không bóc tách được link xác thực từ nội dung email!');
  }

  let verifyUrl = match[1].replace(/&amp;/g, '&');
  console.log(`\n3. Trích xuất link xác thực thực tế từ email:`);
  console.log(`   -> Link: ${verifyUrl}`);

  // Gọi URL xác thực giả lập trình duyệt điều hướng tới link
  console.log('\n4. Thực hiện xác thực email qua link (HTTP GET mô phỏng trình duyệt)...');
  const verifyRes = await fetch(verifyUrl, {
    method: 'GET',
    redirect: 'manual', // Để xem redirect tới đâu
  });

  const redirectLocation = verifyRes.headers.get('location') || '';
  console.log(`   -> HTTP Status: ${verifyRes.status}`);
  console.log(`   -> Chuyển hướng về Web App: ${redirectLocation.substring(0, 80)}...`);

  // Kiểm tra lại trạng thái người dùng trong DB
  const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInErr) {
    throw new Error(`Đăng nhập sau xác thực thất bại: ${signInErr.message}`);
  }

  console.log(`\n5. Kiểm tra trạng thái tài khoản sau khi nhấp link xác thực:`);
  console.log(`   -> email_confirmed_at: ${signInData.user.email_confirmed_at}`);
  console.log(`   -> Xác thực email thành công 100%!`);

  console.log('\n======================================================================');
  console.log('  KẾT QUẢ: LUỒNG EMAIL INBUCKET HOẠT ĐỘNG HOÀN TOÀN CHÍNH XÁC');
  console.log('======================================================================');
}

runInbucketTest().catch((err) => {
  console.error('\n[LỖI TEST INBUCKET]:', err.message);
  process.exit(1);
});
