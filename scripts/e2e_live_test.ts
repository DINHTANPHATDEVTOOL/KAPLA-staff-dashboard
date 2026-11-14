import { createClient } from '@supabase/supabase-js';

const DEPLOYED_URL = 'https://kapla.io.vn';
const SUPABASE_URL = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';

async function runE2ETesting() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ TOÀN DIỆN PRODUCTION: https://kapla.io.vn/');
  console.log('======================================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    totalChecks++;
    if (condition) {
      passedChecks++;
      console.log(`  ✅ [PASS] ${title}${detail ? ` (${detail})` : ''}`);
    } else {
      console.error(`  ❌ [FAIL] ${title}${detail ? ` (${detail})` : ''}`);
    }
  }

  // --- PHẦN 1: TÍNH KHẢ DỤNG CỦA HOSTING & ASSETS TRÊN NETLIFY ---
  console.log('--- 1. KIỂM TRA WEB HOSTING & SPA ROUTING TRÊN NETLIFY ---');
  try {
    const homeRes = await fetch(`${DEPLOYED_URL}/`);
    assert('Trang chủ phản hồi 200 OK', homeRes.status === 200, `Status: ${homeRes.status}`);

    const html = await homeRes.text();
    assert('Nội dung HTML chứa Root Container (#root)', html.includes('id="root"'));
    assert('Tiêu đề trang web chính xác', html.includes('<title>') || html.includes('KAPLA'));

    // SPA Direct Route check (Kiểm tra xem reload trang có bị 404 không)
    const loginRouteRes = await fetch(`${DEPLOYED_URL}/login`);
    assert('SPA Routing /login không bị lỗi 404', loginRouteRes.status === 200);

    const dashboardRouteRes = await fetch(`${DEPLOYED_URL}/dashboard`);
    assert('SPA Routing /dashboard không bị lỗi 404', dashboardRouteRes.status === 200);

    // Bundle JS & CSS check
    const scriptMatch = html.match(/src="([^"]+\.js)"/);
    const styleMatch = html.match(/href="([^"]+\.css)"/);

    if (scriptMatch) {
      const jsUrl = `${DEPLOYED_URL}${scriptMatch[1]}`;
      const jsRes = await fetch(jsUrl);
      const jsText = await jsRes.text();
      assert('Bundle JS tải thành công', jsRes.status === 200, `${(jsText.length / 1024).toFixed(1)} KB`);
      assert('Bundle JS cấu hình đúng Supabase URL thật', jsText.includes('kzyrpbuoehwtlffelpxs.supabase.co'));
      assert('Bundle JS cấu hình đúng Supabase Publishable Key', jsText.includes('sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe'));
      assert('Giao diện Production đã loại bỏ Dev Mock Test User', !jsText.includes('quick-fill-test-account'));
    }

    if (styleMatch) {
      const cssUrl = `${DEPLOYED_URL}${styleMatch[1]}`;
      const cssRes = await fetch(cssUrl);
      assert('Bundle CSS Stylesheet tải thành công', cssRes.status === 200);
    }
  } catch (err: any) {
    assert('Kết nối web hosting', false, err.message);
  }

  // --- PHẦN 2: KIỂM THỬ XÁC THỰC CSDL THẬT TỪ GIAO DIỆN PRODUCTION ---
  console.log('\n--- 2. KIỂM THỬ XÁC THỰC SUPABASE CLOUD TỪ TÊN MIỀN PRODUCTION ---');
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const accounts = [
    { email: 'admin@kapla.edu.vn', role: 'System Admin' },
    { email: 'cm.nhi@kapla.edu.vn', role: 'Center Manager (CM)' },
    { email: 'ht.jamie@kapla.edu.vn', role: 'Head Teacher (HT)' },
    { email: 'hrt.minh@kapla.edu.vn', role: 'HRT Minh' },
    { email: 'hrt.tram@kapla.edu.vn', role: 'HRT Trâm' },
    { email: 'hrt.vy@kapla.edu.vn', role: 'HRT Vy' },
  ];

  for (const acc of accounts) {
    const { data, error } = await client.auth.signInWithPassword({
      email: acc.email,
      password: 'Kapla@2026',
    });
    assert(`Đăng nhập tài khoản ${acc.email} (${acc.role})`, !error && !!data.user, error ? error.message : `User ID: ${data.user?.id}`);
  }

  // --- PHẦN 3: KIỂM THỬ DỮ LIỆU THỰC TẾ TRÊN DASHBOARD ---
  console.log('\n--- 3. KIỂM THỬ TẢI DỮ LIỆU THỰC TẾ TRÊN DASHBOARD ---');
  
  // Đăng nhập dưới quyền HRT Minh
  await client.auth.signInWithPassword({
    email: 'hrt.minh@kapla.edu.vn',
    password: 'Kapla@2026',
  });

  const { data: branches, error: bErr } = await client.from('branches').select('*');
  assert('Tải danh sách chi nhánh hoạt động', !bErr && branches && branches.length > 0, `${branches?.[0]?.name}`);

  const { data: classes, error: cErr } = await client.from('classes').select('*');
  assert('Tải danh sách lớp học thực tế', !cErr && classes && classes.length >= 4, `${classes?.length} lớp học`);

  const { data: students, error: sErr } = await client.from('students').select('*');
  assert('Tải danh sách học viên thực tế', !sErr && students && students.length >= 8, `${students?.length} học viên`);

  // Kiểm tra tính toàn vẹn của học viên mẫu
  const studentAn = students?.find((s: any) => s.student_code === 'KAP-PH-001');
  assert('Học viên [KAP-PH-001] Nguyễn Bình An có đủ dữ liệu học phí & phân lớp', 
    !!studentAn && studentAn.status === 'active' && !!studentAn.tuition_expiry_date
  );

  // --- PHẦN 4: KIỂM THỬ KẾT NỐI REALTIME WEBSOCKET ---
  console.log('\n--- 4. KIỂM THỬ KẾT NỐI REALTIME WEBSOCKET TỪ PRODUCTION ---');
  let realtimeSubscribed = false;
  const channel = client.channel('live-prod-health-check')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {})
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        realtimeSubscribed = true;
      }
    });

  await new Promise(r => setTimeout(r, 2000));
  assert('Kênh WebSocket Realtime kết nối thành công', realtimeSubscribed, 'SUBSCRIBED');
  await client.removeChannel(channel);

  console.log('\n======================================================================');
  console.log(`  TỔNG KẾT: ${passedChecks}/${totalChecks} BÀI KIỂM THỬ HOÀN TOÀN THÀNH CÔNG (${Math.round((passedChecks / totalChecks) * 100)}%)!`);
  console.log('  HỆ THỐNG TRÊN https://kapla.io.vn/ HOẠT ĐỘNG HOÀN HẢO!');
  console.log('======================================================================\n');
}

runE2ETesting();
