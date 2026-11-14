import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const ACCOUNTS = [
  { email: 'admin@kapla.edu.vn', role: 'System Admin' },
  { email: 'cm.nhi@kapla.edu.vn', role: 'Center Manager (CM)' },
  { email: 'ht.jamie@kapla.edu.vn', role: 'Head Teacher' },
  { email: 'hrt.minh@kapla.edu.vn', role: 'HRT Minh' },
  { email: 'hrt.tram@kapla.edu.vn', role: 'HRT Trâm' },
  { email: 'hrt.vy@kapla.edu.vn', role: 'HRT Vy' },
];

async function main() {
  console.log('======================================================================');
  console.log('  KAPLA — KHỞI TẠO TÀI KHOẢN CHUẨN GOTRUE VÀ KIỂM THỬ XÁC THỰC');
  console.log('======================================================================\n');

  console.log('1. Đang đăng ký 6 tài khoản qua Supabase Auth API chuẩn (Kapla@2026)...');
  for (const acc of ACCOUNTS) {
    try {
      const { data, error } = await client.auth.signUp({
        email: acc.email,
        password: 'Kapla@2026',
      });

      if (error) {
        console.log(`   - ${acc.email}: ${error.message}`);
      } else {
        console.log(`   ✅ ${acc.email} (${acc.role}): Khởi tạo thành công (UUID: ${data.user?.id})`);
      }
    } catch (e: any) {
      console.log(`   - ${acc.email} fetch error: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 800));
  }

  console.log('\n2. Kiểm thử đăng nhập thực tế 6 tài khoản trên Supabase Cloud...');
  let passCount = 0;
  for (const acc of ACCOUNTS) {
    const { data, error } = await client.auth.signInWithPassword({
      email: acc.email,
      password: 'Kapla@2026',
    });

    if (error) {
      console.error(`   ❌ [FAIL] ${acc.email}: ${error.message}`);
    } else {
      passCount++;
      console.log(`   ✅ [PASS] ${acc.email} (${acc.role}) — Phiên đăng nhập hợp lệ!`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n======================================================================`);
  console.log(`  KẾT QUẢ ĐĂNG NHẬP: ${passCount}/${ACCOUNTS.length} TÀI KHOẢN PASS!`);
  console.log(`======================================================================\n`);
}

main();
