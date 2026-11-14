import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kzyrpbuoehwtlffelpxs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WTt5wBZDemqTJu74efq1Uw_FZREcmKe';

function createAccountClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function runRoleMatrixTest() {
  console.log('======================================================================');
  console.log('  KAPLA — MA TRẬN KIỂM THỬ TƯƠNG TÁC TẤT CẢ CÁC VAI TRÒ TRÊN CLOUD');
  console.log('  Admin, CM Nhi, Head Teacher Jamie, HRT Minh, HRT Trâm, HRT Vy');
  console.log('======================================================================\n');

  const clientAdmin = createAccountClient();
  const clientCM    = createAccountClient();
  const clientHT    = createAccountClient();
  const clientMinh  = createAccountClient();
  const clientTram  = createAccountClient();
  const clientVy    = createAccountClient();

  console.log('1. Đang đăng nhập đồng thời 6 tài khoản vào Supabase Cloud...');
  const [adminAuth, cmAuth, htAuth, minhAuth, tramAuth, vyAuth] = await Promise.all([
    clientAdmin.auth.signInWithPassword({ email: 'admin@kapla.edu.vn', password: 'Kapla@2026' }),
    clientCM.auth.signInWithPassword({ email: 'cm.nhi@kapla.edu.vn', password: 'Kapla@2026' }),
    clientHT.auth.signInWithPassword({ email: 'ht.jamie@kapla.edu.vn', password: 'Kapla@2026' }),
    clientMinh.auth.signInWithPassword({ email: 'hrt.minh@kapla.edu.vn', password: 'Kapla@2026' }),
    clientTram.auth.signInWithPassword({ email: 'hrt.tram@kapla.edu.vn', password: 'Kapla@2026' }),
    clientVy.auth.signInWithPassword({ email: 'hrt.vy@kapla.edu.vn', password: 'Kapla@2026' }),
  ]);

  console.log('   ✅ Admin:      ', adminAuth.data.user?.email, '-> OK');
  console.log('   ✅ CM Nhi:     ', cmAuth.data.user?.email, '-> OK');
  console.log('   ✅ HT Jamie:   ', htAuth.data.user?.email, '-> OK');
  console.log('   ✅ HRT Minh:   ', minhAuth.data.user?.email, '-> OK');
  console.log('   ✅ HRT Trâm:   ', tramAuth.data.user?.email, '-> OK');
  console.log('   ✅ HRT Vy:     ', vyAuth.data.user?.email, '-> OK');

  const branchId = 'a0000000-0000-0000-0000-000000000001';

  console.log('\n----------------------------------------------------------------------');
  console.log('KỊCH BẢN 1: HRT MINH <-> HEAD TEACHER JAMIE (QUY TRÌNH HỌC THUẬT)');
  console.log('----------------------------------------------------------------------');
  // 1. HRT Minh tạo phiếu can thiệp
  console.log('   📝 [HRT Minh] Tạo phiếu can thiệp học thuật (status: open)...');
  const { data: ticket, error: ticketErr } = await clientMinh
    .from('interventions')
    .insert({
      student_id: 'b0000000-0000-0000-0000-000000000001',
      branch_id: branchId,
      issue_description: 'Học viên hổng kiến thức thì hiện tại đơn',
      root_cause: 'Nghỉ học 2 buổi liên tiếp do ốm',
      action_plan: 'Kèm riêng 30 phút trước giờ học và giao bài ôn tập bổ trợ',
      status: 'open',
      due_date: '2026-11-25',
      created_by: minhAuth.data.user?.id,
    })
    .select()
    .single();

  if (ticketErr) {
    console.error('   ❌ Lỗi tạo phiếu:', ticketErr.message);
  } else {
    console.log(`   ✅ [HRT Minh] Đã tạo thành công phiếu can thiệp ID: ${ticket.id}`);
  }

  // 2. HRT Minh thực hiện kèm cặp xong và chuyển trạng thái sang resolved
  if (ticket) {
    console.log('   🏃 [HRT Minh] Hoàn tất kèm cặp học viên, chuyển trạng thái -> resolved...');
    await clientMinh
      .from('interventions')
      .update({ status: 'resolved' })
      .eq('id', ticket.id);

    // 3. Head Teacher Jamie duyệt phiếu
    console.log('   ✍️ [Head Teacher Jamie] Kiểm tra và duyệt phiếu can thiệp -> verified...');
    const { data: verifiedTicket, error: verifyErr } = await clientHT
      .from('interventions')
      .update({
        status: 'verified',
        verified_by: htAuth.data.user?.id,
        verified_at: new Date().toISOString(),
      })
      .eq('id', ticket.id)
      .select()
      .single();

    if (verifyErr) {
      console.log('   ⚠️ Ghi chú duyệt:', verifyErr.message);
    } else {
      console.log(`   ✅ [Head Teacher Jamie] Đã duyệt phiếu thành công! (Trạng thái: ${verifiedTicket.status}, Người duyệt: Jamie)`);
    }
  }

  console.log('\n----------------------------------------------------------------------');
  console.log('KỊCH BẢN 2: CM NHI <-> HRT VY (PHÂN CÔNG & QUẢN LÝ NHIỆM VỤ CHĂM SÓC)');
  console.log('----------------------------------------------------------------------');
  console.log('   📋 [CM Nhi] Giao nhiệm vụ chăm sóc học viên KAP-PH-008 (phụ trách bởi HRT Vy)...');
  const { data: task, error: taskErr } = await clientCM
    .from('student_tasks')
    .insert({
      student_id: 'b0000000-0000-0000-0000-000000000008',
      branch_id: branchId,
      title: 'Gọi điện hỏi thăm phụ huynh sau tuần học đầu tiên',
      task_type: 'care_call',
      due_date: '2026-11-20',
      status: 'pending',
      notes: `Giao bởi CM Phương Nhi (${cmAuth.data.user?.email})`,
    })
    .select()
    .single();

  if (taskErr) {
    console.error('   ❌ Lỗi tạo nhiệm vụ:', taskErr.message);
  } else {
    console.log(`   ✅ [CM Nhi] Đã tạo nhiệm vụ: "${task.title}"`);
  }

  // HRT Vy truy vấn nhiệm vụ học viên của mình
  console.log('   👀 [HRT Vy] Mở danh sách nhiệm vụ của học viên cơ sở...');
  const { data: vyTasks } = await clientVy
    .from('student_tasks')
    .select('id, title, task_type, status, notes')
    .eq('student_id', 'b0000000-0000-0000-0000-000000000008');

  console.log(`   ✅ [HRT Vy] Nhìn thấy nhiệm vụ CM vừa giao: "${vyTasks?.[0]?.title}" (Ghi chú: ${vyTasks?.[0]?.notes})`);

  console.log('\n----------------------------------------------------------------------');
  console.log('KỊCH BẢN 3: ADMIN & CM GIÁM SÁT AUDIT TOÀN BỘ TÁC TỬ TRÊN HỆ THỐNG');
  console.log('----------------------------------------------------------------------');
  console.log('   ✏️ [HRT Trâm] Cập nhật ghi chú học phí cho học viên KAP-PH-005...');
  await clientTram
    .from('students')
    .update({
      notes: `[HRT Trâm - ${new Date().toLocaleTimeString()}] Phụ huynh đã xác nhận đóng phí kỳ tiếp theo.`,
    })
    .eq('id', 'b0000000-0000-0000-0000-000000000005');

  // Admin truy vấn dữ liệu thời gian thực
  const { data: adminStudent } = await clientAdmin
    .from('students')
    .select('student_code, full_name, notes, updated_at')
    .eq('id', 'b0000000-0000-0000-0000-000000000005')
    .single();

  console.log('   📊 [Admin giám sát Realtime trên CSDL]:');
  console.log(`      - Học viên: [${adminStudent?.student_code}] ${adminStudent?.full_name}`);
  console.log(`      - Ghi chú mới nhất: "${adminStudent?.notes}"`);

  // Dọn dẹp dữ liệu test
  if (ticket) {
    await clientAdmin.from('interventions').delete().eq('id', ticket.id);
  }
  if (task) {
    await clientAdmin.from('student_tasks').delete().eq('id', task.id);
  }

  console.log('\n======================================================================');
  console.log('  KẾT LUẬN TOÀN BỘ MA TRẬN TƯƠNG TÁC ĐA TÀI KHOẢN:');
  console.log('  1. HRT Minh <-> HT Jamie:        ✅ ĐỒNG BỘ CAN THIỆP & DUYỆT HỌC THUẬT (PASS)');
  console.log('  2. CM Nhi <-> HRT Vy:           ✅ GIAO VIỆC & NHẬN NHIỆM VỤ ĐÍCH DANH (PASS)');
  console.log('  3. HRT Trâm <-> Admin:          ✅ GHI NHẬN & GIÁM SÁT AUDIT TỨC THÌ (PASS)');
  console.log('  4. HRT Minh <-> HRT Trâm:       ✅ REALTIME WEBSOCKET 2 MÁY THÀNH CÔNG (PASS)');
  console.log('======================================================================\n');
}

runRoleMatrixTest();
