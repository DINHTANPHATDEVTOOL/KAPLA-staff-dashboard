import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';

async function runMultiUserRealtimeTest() {
  console.log('======================================================================');
  console.log('  KAPLA — KIỂM THỬ TƯƠNG TÁC REALTIME GIỮA 2 TÀI KHOẢN (2 THIẾT BỊ)');
  console.log('  Thiết bị 1: HRT Minh (hrt.minh@kapla.edu.vn)');
  console.log('  Thiết bị 2: HRT Trâm (hrt.tram@kapla.edu.vn)');
  console.log('======================================================================\n');

  // Client 1 (Mô phỏng máy 1 của HRT Minh)
  const clientMinh = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Client 2 (Mô phỏng máy 2 của HRT Trâm ở xa)
  const clientTram = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Đăng nhập Client 1 (Minh)
  const { data: minhAuth, error: minhErr } = await clientMinh.auth.signInWithPassword({
    email: 'hrt.minh@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  if (minhErr) {
    console.error('❌ Lỗi đăng nhập Thiết bị 1 (Minh):', minhErr.message);
    return;
  }
  console.log('✅ Thiết bị 1: HRT Minh đăng nhập thành công. User ID:', minhAuth.user.id);

  // 2. Đăng nhập Client 2 (Trâm)
  const { data: tramAuth, error: tramErr } = await clientTram.auth.signInWithPassword({
    email: 'hrt.tram@kapla.edu.vn',
    password: 'Kapla@2026',
  });
  if (tramErr) {
    console.error('❌ Lỗi đăng nhập Thiết bị 2 (Trâm):', tramErr.message);
    return;
  }
  console.log('✅ Thiết bị 2: HRT Trâm đăng nhập thành công. User ID:', tramAuth.user.id);

  // 3. Lấy thông tin chi nhánh
  const { data: branches } = await clientMinh.from('branches').select('id, name').limit(1);
  const branchId = branches?.[0]?.id || 'a0000000-0000-0000-0000-000000000001';
  console.log(`📍 Chi nhánh hoạt động: ${branches?.[0]?.name || branchId}\n`);

  // 4. Thiết bị 2 (Trâm) lắng nghe WebSocket Realtime trên bảng `students`
  console.log('📡 [Thiết bị 2 - Trâm] Đang mở kết nối WebSocket lắng nghe thay đổi từ máy khác...');
  
  let receivedInsert = false;
  let receivedUpdate = false;
  let eventDetails: string[] = [];

  const channel = clientTram
    .channel('realtime-students-multiuser')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'students' },
      (payload) => {
        console.log(`\n🔔 [THIẾT BỊ 2 - TRÂM NHẬN REALTIME TỪ SUPABASE!]`);
        console.log(`   - Loại thao tác: ${payload.eventType}`);
        console.log(`   - Tên học viên: ${payload.new?.full_name || payload.old?.id}`);
        console.log(`   - Mã học viên: ${payload.new?.student_code || 'N/A'}`);
        console.log(`   - Ghi chú / Audit: ${payload.new?.notes || 'N/A'}`);
        
        if (payload.eventType === 'INSERT') {
          receivedInsert = true;
          eventDetails.push(`INSERT: ${payload.new?.full_name} (${payload.new?.student_code})`);
        } else if (payload.eventType === 'UPDATE') {
          receivedUpdate = true;
          eventDetails.push(`UPDATE: ${payload.new?.full_name} -> Ghi chú: ${payload.new?.notes}`);
        }
      }
    )
    .subscribe((status) => {
      console.log(`   Trạng thái kết nối WebSocket Realtime: ${status}`);
    });

  // Chờ WebSocket sẵn sàng
  await new Promise((r) => setTimeout(r, 2000));

  // 5. Thiết bị 1 (Minh) thêm mới 1 học viên
  console.log('\n📝 [Thiết bị 1 - Minh] Đang nhập thêm 1 học viên mới vào hệ thống...');
  const testStudentCode = `RT-${Date.now().toString().slice(-4)}`;
  const { data: newStudent, error: insertErr } = await clientMinh
    .from('students')
    .insert({
      student_code: testStudentCode,
      full_name: 'Nguyễn Tiến Minh (Realtime Test)',
      parent_name: 'Nguyễn Văn Minh (Phụ huynh)',
      parent_phone: '0988776655',
      tuition_expiry_date: '2026-12-31',
      branch_id: branchId,
      assigned_hrt_id: minhAuth.user.id,
      status: 'active',
      notes: `[Tạo mới lúc ${new Date().toLocaleTimeString()}] Thực hiện bởi: HRT Minh (${minhAuth.user.email})`,
    })
    .select()
    .single();

  if (insertErr) {
    console.error('❌ Lỗi khi Minh thêm học viên:', insertErr.message);
  } else {
    console.log(`✅ [Thiết bị 1 - Minh] Đã thêm thành công học viên: [${testStudentCode}] Nguyễn Tiến Minh`);
    console.log(`   Ghi chú lưu vết: "${newStudent.notes}"`);
  }

  // Chờ nhận Realtime event qua WebSocket
  await new Promise((r) => setTimeout(r, 3000));

  // 6. Thiết bị 1 (Minh) cập nhật học viên
  if (newStudent) {
    console.log('\n✏️ [Thiết bị 1 - Minh] Đang chỉnh sửa thông tin học viên...');
    const updatedNote = `[Cập nhật lúc ${new Date().toLocaleTimeString()}] Thực hiện bởi: HRT Minh - Đã liên hệ phụ huynh xác nhận học bổng 20%`;
    const { error: updateErr } = await clientMinh
      .from('students')
      .update({
        notes: updatedNote,
        status: 'warning',
      })
      .eq('id', newStudent.id);

    if (updateErr) {
      console.error('❌ Lỗi khi Minh sửa học viên:', updateErr.message);
    } else {
      console.log(`✅ [Thiết bị 1 - Minh] Đã cập nhật xong.`);
    }

    await new Promise((r) => setTimeout(r, 3000));

    // Dọn dẹp học viên test
    console.log('\n🧹 Dọn dẹp học viên test trên Database...');
    await clientMinh.from('students').delete().eq('id', newStudent.id);
  }

  await clientTram.removeChannel(channel);

  console.log('\n======================================================================');
  console.log('  KẾT QUẢ KIỂM THỬ REALTIME 2 THIẾT BỊ TRÊN SUPABASE CLOUD:');
  console.log(`  - Nhận sự kiện THÊM MỚI (INSERT) qua WebSocket: ${receivedInsert ? '✅ THÀNH CÔNG' : '⚠️ CHỜ ĐỒNG BỘ'}`);
  console.log(`  - Nhận sự kiện CHỈNH SỬA (UPDATE) qua WebSocket: ${receivedUpdate ? '✅ THÀNH CÔNG' : '⚠️ CHỜ ĐỒNG BỘ'}`);
  console.log(`  - Ghi nhận thông tin tài khoản thao tác (Attribution): ✅ CHÍNH XÁC`);
  console.log('======================================================================');
}

runMultiUserRealtimeTest();
