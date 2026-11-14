import { createClient } from '@supabase/supabase-js';

const url = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const key = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';
const client = createClient(url, key);

async function testAllAccounts() {
  console.log('======================================================================');
  console.log('  KIỂM THỬ XÁC THỰC VÀ DỮ LIỆU TRÊN SUPABASE CLOUD THỰC TẾ');
  console.log('======================================================================\n');

  const accounts = [
    { email: 'admin@kapla.edu.vn', role: 'System Admin' },
    { email: 'cm.nhi@kapla.edu.vn', role: 'Center Manager (CM)' },
    { email: 'ht.jamie@kapla.edu.vn', role: 'Head Teacher' },
    { email: 'hrt.minh@kapla.edu.vn', role: 'HRT Minh' },
    { email: 'hrt.tram@kapla.edu.vn', role: 'HRT Trâm' },
    { email: 'hrt.vy@kapla.edu.vn', role: 'HRT Vy' },
  ];

  let successCount = 0;

  for (const acc of accounts) {
    const res = await client.auth.signInWithPassword({
      email: acc.email,
      password: 'Kapla@2026',
    });

    if (res.error) {
      console.error(`  ❌ [FAIL] ${acc.email} (${acc.role}): ${res.error.message}`);
    } else {
      successCount++;
      console.log(`  ✅ [PASS] ${acc.email} (${acc.role}) — UUID: ${res.data.user.id}`);
    }
  }

  console.log('\n--- TRUY VẤN DỮ LIỆU CSDL CLOUD SUPABASE (DƯỚI QUYỀN ĐÃ ĐĂNG NHẬP) ---');
  
  // Login as admin for system-wide queries
  await client.auth.signInWithPassword({
    email: 'admin@kapla.edu.vn',
    password: 'Kapla@2026',
  });

  const { data: branches, error: bErr } = await client.from('branches').select('*');
  console.log(`  🏢 Chi nhánh trong DB: ${branches?.length || 0}`, branches?.map((b: any) => b.name) || bErr);

  const { data: profiles, error: pErr } = await client.from('profiles').select('*');
  console.log(`  👤 Nhân sự trong DB: ${profiles?.length || 0}`, profiles?.map((p: any) => p.full_name) || pErr);

  const { data: classes, error: cErr } = await client.from('classes').select('*');
  console.log(`  🏫 Lớp học trong DB: ${classes?.length || 0}`, classes?.map((c: any) => c.name) || cErr);

  const { data: students, error: sErr } = await client.from('students').select('*');
  console.log(`  🎓 Học viên trong DB: ${students?.length || 0}`);
  if (students && students.length > 0) {
    console.log('     Danh sách học viên thực tế:');
    students.slice(0, 5).forEach((s: any) => {
      console.log(`     - [${s.student_code}] ${s.full_name} (Hạn phí: ${s.tuition_expiry_date})`);
    });
  }

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ: ${successCount}/${accounts.length} TÀI KHOẢN ĐĂNG NHẬP THÀNH CÔNG TRÊN SUPABASE CLOUD!`);
  console.log('======================================================================\n');
}

testAllAccounts().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
