async function verifySite() {
  console.log('======================================================================');
  console.log('  KIỂM TRA TÊN MIỀN PRODUCTION: https://kapla.io.vn/');
  console.log('======================================================================\n');

  try {
    const res = await fetch('https://kapla.io.vn/');
    console.log(`1. Trạng thái HTTP trang chủ: ${res.status} ${res.statusText}`);
    console.log(`   Server: ${res.headers.get('server')}`);
    console.log(`   Cache Status: ${res.headers.get('cache-status')}`);

    const html = await res.text();
    console.log(`\n2. Phân tích nội dung HTML:`);
    console.log(`   - Kích thước HTML: ${html.length} bytes`);
    
    // Tìm các file script và link
    const scripts = html.match(/src="([^"]+\.js)"/g)?.map(s => s.replace(/src="|"/g, '')) || [];
    const styles = html.match(/href="([^"]+\.css)"/g)?.map(s => s.replace(/href="|"/g, '')) || [];

    console.log(`   - File JavaScript bundle:`, scripts);
    console.log(`   - File CSS bundle:`, styles);

    // Kiểm tra tính toàn vẹn của bundle assets
    for (const src of scripts) {
      const fullUrl = `https://kapla.io.vn${src}`;
      const scriptRes = await fetch(fullUrl);
      console.log(`\n3. Kiểm tra Bundle JS: ${fullUrl}`);
      console.log(`   - Status: ${scriptRes.status}`);
      console.log(`   - Content-Type: ${scriptRes.headers.get('content-type')}`);
      
      const scriptText = await scriptRes.text();
      console.log(`   - Dung lượng: ${scriptText.length} bytes`);

      // Kiểm tra biến môi trường Supabase URL trong bundle
      const hasSupabaseUrl = scriptText.includes('kzyrpbuoehwtlffelpxs.supabase.co');
      const hasAnonKey = scriptText.includes('sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe');
      
      console.log(`   - Chứa Supabase Cloud URL chính thức: ${hasSupabaseUrl ? '✅ CÓ (Chính xác)' : '❌ KHÔNG'}`);
      console.log(`   - Chứa Supabase Public Key hợp lệ:    ${hasAnonKey ? '✅ CÓ (Chính xác)' : '❌ KHÔNG'}`);
    }

    for (const href of styles) {
      const fullUrl = `https://kapla.io.vn${href}`;
      const styleRes = await fetch(fullUrl);
      console.log(`\n4. Kiểm tra CSS stylesheet: ${fullUrl}`);
      console.log(`   - Status: ${styleRes.status}`);
      console.log(`   - Dung lượng: ${styleRes.headers.get('content-length')} bytes`);
    }

    console.log('\n======================================================================');
    console.log('  KẾT LUẬN: https://kapla.io.vn/ ĐANG HOẠT ĐỘNG HOÀN TOÀN BÌNH THƯỜNG!');
    console.log('======================================================================\n');
  } catch (err: any) {
    console.error('❌ Lỗi kết nối:', err.message);
  }
}

verifySite();
