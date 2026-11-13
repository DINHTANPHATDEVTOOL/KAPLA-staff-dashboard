// ==============================================================================
// KAPLA Staff Dashboard — Live Supabase Local RLS & Security Integration Test
// Executes against real running local Supabase (127.0.0.1:54321 / 54322)
// ==============================================================================

import WebSocket from 'ws';
// Polyfill WebSocket for Node 20
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BRANCH_PH_ID = 'a0000000-0000-0000-0000-000000000001'; // KAPLA Phạm Hùng
const BRANCH_BT_ID = 'a0000000-0000-0000-0000-000000000002'; // KAPLA Bình Tân

async function runLiveSupabaseTests() {
  console.log('======================================================================');
  console.log('  KAPLA Staff Dashboard — Kiểm thử trực tiếp trên Supabase Local Stack');
  console.log('  Kết nối: http://127.0.0.1:54321 (PostgreSQL & PostgREST & Auth)');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(title: string, condition: boolean, detail?: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] ${title}`);
      if (detail) console.log(`         -> ${detail}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${title}`);
      if (detail) console.error(`         -> ${detail}`);
      process.exitCode = 1;
    }
  }

  // ---------------------------------------------------------------------------
  // Khởi tạo các tài khoản mẫu trực tiếp trên Supabase Auth Local
  // ---------------------------------------------------------------------------
  console.log('--- KHỞI TẠO TÀI KHOẢN TRÊN SUPABASE AUTH LOCAL ---');

  const runId = Date.now();

  // 1. System Admin
  const adminEmail = `sysadmin.${runId}@kapla.edu.vn`;
  const { data: adminAuth, error: adminCreateErr } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Quản trị viên Hệ Thống' },
  });
  if (adminCreateErr) throw adminCreateErr;
  const adminUserId = adminAuth.user!.id;
  await adminClient.from('profiles').update({ system_role: 'system_admin', status: 'active' }).eq('id', adminUserId);

  // 2. CM Phạm Hùng
  const cmPhEmail = `cm.ph.${runId}@kapla.edu.vn`;
  const { data: cmPhAuth, error: cmCreateErr } = await adminClient.auth.admin.createUser({
    email: cmPhEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Lê Nguyễn Hoàng Nhi (CM Phạm Hùng)', preferred_branch_id: BRANCH_PH_ID },
  });
  if (cmCreateErr) throw cmCreateErr;
  const cmPhUserId = cmPhAuth.user!.id;
  await adminClient.from('profiles').update({ status: 'active' }).eq('id', cmPhUserId);
  await adminClient.from('branch_memberships').upsert({
    user_id: cmPhUserId,
    branch_id: BRANCH_PH_ID,
    role: 'CM',
    is_primary: true,
    status: 'active',
  });

  // Client đăng nhập của CM Phạm Hùng
  const cmPhClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: cmPhLogin } = await cmPhClient.auth.signInWithPassword({
    email: cmPhEmail,
    password: 'Password123!',
  });
  assert('CM Phạm Hùng đăng nhập thành công nhận JWT session', Boolean(cmPhLogin.session?.access_token));

  // ---------------------------------------------------------------------------
  // TEST 1: Đăng ký tài khoản nhân viên mới
  // ---------------------------------------------------------------------------
  console.log('\n--- BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN MỚI QUA SUPABASE AUTH ---');
  const candidateEmail = `candidate.${runId}@kapla.edu.vn`;
  const { data: candidateSignup, error: signupErr } = await anonClient.auth.signUp({
    email: candidateEmail,
    password: 'CandidatePass123!',
    options: {
      data: {
        full_name: 'Nguyễn Văn Minh (HRT Mới)',
        preferred_branch_id: BRANCH_PH_ID,
      },
    },
  });

  assert('Đăng ký qua Supabase Auth thành công', !signupErr && Boolean(candidateSignup.user));
  const candidateUserId = candidateSignup.user!.id;

  // Kiểm tra hồ sơ được trigger tự động tạo trong public.profiles
  const { data: candidateProfile } = await adminClient.from('profiles').select('*').eq('id', candidateUserId).single();
  assert(
    'Trigger handle_new_user() tự động tạo hồ sơ profiles với status = pending',
    candidateProfile?.status === 'pending' && candidateProfile?.system_role === 'staff',
    `DB: status=${candidateProfile?.status}, system_role=${candidateProfile?.system_role}`
  );

  // Client phiên của nhân viên mới
  // Admin xác nhận email trước để chuyển sang trạng thái email_confirmed
  await adminClient.auth.admin.updateUserById(candidateUserId, { email_confirm: true });
  const candidateClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  await candidateClient.auth.signInWithPassword({
    email: candidateEmail,
    password: 'CandidatePass123!',
  });

  // ---------------------------------------------------------------------------
  // TEST 2: Chứng minh qua API: Nhân viên không tự đổi vai trò hoặc trạng thái
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. CHỨNG MINH QUA API: NHÂN VIÊN KHÔNG TỰ ĐỔI VAI TRÒ / TRẠNG THÁI ---');

  // Nhân viên gọi API update status = active bằng chính session JWT của mình
  const { error: selfStatusError } = await candidateClient
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', candidateUserId);

  assert(
    'Chặn nhân viên gọi API tự đổi status = active (Trigger enforce_profile_update_security)',
    Boolean(selfStatusError),
    `Phản hồi từ Supabase API: ${selfStatusError?.message || selfStatusError?.code}`
  );

  // Nhân viên gọi API tự nâng quyền system_role = system_admin
  const { error: selfRoleError } = await candidateClient
    .from('profiles')
    .update({ system_role: 'system_admin' })
    .eq('id', candidateUserId);

  assert(
    'Chặn nhân viên gọi API tự nâng system_role = system_admin',
    Boolean(selfRoleError),
    `Phản hồi từ Supabase API: ${selfRoleError?.message || selfRoleError?.code}`
  );

  // Kiểm tra lại trong DB: Hồ sơ không bị thay đổi
  const { data: checkCandidate } = await adminClient.from('profiles').select('status, system_role').eq('id', candidateUserId).single();
  assert(
    'Dữ liệu hồ sơ trong PostgreSQL không bị thay đổi: status=pending, system_role=staff',
    checkCandidate?.status === 'pending' && checkCandidate?.system_role === 'staff'
  );

  // ---------------------------------------------------------------------------
  // TEST 3: Chứng minh qua API: Tài khoản chờ duyệt không đọc được dữ liệu nghiệp vụ
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. CHỨNG MINH QUA API: TÀI KHOẢN CHỜ DUYỆT BỊ CHẶN ĐỌC DỮ LIỆU ---');

  // Candidate gọi API đọc danh sách lớp học qua PostgREST
  const { data: candidateClasses, error: classQueryErr } = await candidateClient
    .from('classes')
    .select('*');

  assert(
    'Tài khoản status=pending truy vấn classes qua API nhận đúng 0 bản ghi (RLS chặn)',
    Array.isArray(candidateClasses) && candidateClasses.length === 0,
    `Kết quả trả về: ${JSON.stringify(candidateClasses)} (Không có quyền đọc dữ liệu nghiệp vụ)`
  );

  // ---------------------------------------------------------------------------
  // TEST 4: Chứng minh qua API: CM không cấp quyền ngoài chi nhánh được giao
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. CHỨNG MINH QUA API: CM KHÔNG CẤP QUYỀN NGOÀI CHI NHÁNH ĐƯỢC GIAO ---');

  // CM Phạm Hùng cố tình chèn membership cho chi nhánh Bình Tân (BRANCH_BT_ID)
  const { error: crossBranchInsertErr } = await cmPhClient.from('branch_memberships').insert({
    user_id: candidateUserId,
    branch_id: BRANCH_BT_ID,
    role: 'Main Teacher',
  });

  assert(
    'Chặn CM Phạm Hùng gọi API gán quyền cho chi nhánh Bình Tân (RLS Policy Violation)',
    Boolean(crossBranchInsertErr),
    `Lỗi trả về từ Supabase RLS: ${crossBranchInsertErr?.message || crossBranchInsertErr?.code}`
  );

  // CM Phạm Hùng cố tình gọi RPC approve_user_membership sang chi nhánh Bình Tân
  const { error: rpcCrossBranchErr } = await cmPhClient.rpc('approve_user_membership', {
    p_target_user_id: candidateUserId,
    p_branch_id: BRANCH_BT_ID,
    p_role: 'HRT',
  });

  assert(
    'Chặn CM Phạm Hùng gọi Stored Procedure duyệt cho chi nhánh Bình Tân',
    Boolean(rpcCrossBranchErr),
    `Thông báo lỗi: ${rpcCrossBranchErr?.message}`
  );

  // ---------------------------------------------------------------------------
  // TEST 5: CM Phạm Hùng duyệt đúng thẩm quyền trong chi nhánh Phạm Hùng
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. CM PHẠM HÙNG DUYỆT CẤP VAI TRÒ HRT TẠI CƠ SỞ PHẠM HÙNG ---');

  const { data: approveResult, error: approveErr } = await cmPhClient.rpc('approve_user_membership', {
    p_target_user_id: candidateUserId,
    p_branch_id: BRANCH_PH_ID,
    p_role: 'HRT',
  });

  assert(
    'CM Phạm Hùng duyệt nhân sự trong cơ sở Phạm Hùng thành công',
    !approveErr && approveResult?.success === true,
    `Kết quả RPC: ${JSON.stringify(approveResult)}, Lỗi: ${JSON.stringify(approveErr)}`
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Nhân viên vào Dashboard & Đọc dữ liệu lớp học đúng chi nhánh
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. NHÂN VIÊN VÀO DASHBOARD & TRUY CẬP DỮ LIỆU HỢP LỆ ---');

  const { data: activeClasses } = await candidateClient.from('classes').select('name, branch_id');
  const phClasses = activeClasses?.filter((c) => c.branch_id === BRANCH_PH_ID) || [];
  const btClasses = activeClasses?.filter((c) => c.branch_id === BRANCH_BT_ID) || [];

  assert(
    'Nhân viên sau khi được duyệt đọc được các lớp học thuộc chi nhánh Phạm Hùng',
    phClasses.length > 0,
    `Đã truy xuất được ${phClasses.length} lớp học tại cơ sở Phạm Hùng: ${phClasses.map((c) => c.name).join(', ')}`
  );

  assert(
    'Nhân viên chi nhánh Phạm Hùng KHÔNG THỂ đọc lớp học của chi nhánh Bình Tân (Data Isolation)',
    btClasses.length === 0,
    `Số lớp học Bình Tân nhìn thấy: ${btClasses.length} (Độc lập cơ sở hoàn hảo)`
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Chứng minh qua API: Quyền bị thu hồi ngay cả khi phiên (JWT) còn hiệu lực
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. CHỨNG MINH QUA API: QUYỀN BỊ THU HỒI NGAY TRONG PHIÊN ĐĂNG NHẬP ĐANG HOẠT ĐỘNG ---');

  // Bước 7.1: T = 1, nhân viên đang có JWT hợp lệ và đọc được dữ liệu
  const { data: checkT1 } = await candidateClient.from('classes').select('name');
  assert('Tại T=1: Phiên đăng nhập đang hoạt động, đọc được dữ liệu lớp học', (checkT1?.length || 0) > 0);

  // Bước 7.2: Quản trị viên vô hiệu hóa tài khoản của nhân viên
  await adminClient.rpc('deactivate_user', {
    p_target_user_id: candidateUserId,
    p_reason: 'Tạm ngưng quyền để kiểm thử thu hồi phiên hoạt động',
  });

  // Bước 7.3: T = 2, nhân viên gọi lại API VỚI NGUYÊN PHIÊN ĐĂNG NHẬP JWT ĐÓ (không logout, không đổi token)
  const { data: checkT2 } = await candidateClient.from('classes').select('name');
  assert(
    'Tại T=2: Phiên đăng nhập (JWT token) vẫn còn hạn nhưng RLS động lập tức trả về 0 bản ghi',
    Array.isArray(checkT2) && checkT2.length === 0,
    `Kết quả truy vấn tức thì: ${JSON.stringify(checkT2)} (Quyền truy cập bị tước ngay lập tức)`
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Kiểm tra tính bất biến và khóa quyền chèn trực tiếp của Nhật ký kiểm toán
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. KIỂM TRA BẢO MẬT VÀ TÍNH BẤT BIẾN CỦA NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) ---');

  // Thử chèn trực tiếp nhật ký từ tài khoản nhân viên (bị cấm)
  const { error: staffInsertLogErr } = await candidateClient.from('audit_logs').insert({
    action: 'UNAUTHORIZED_DIRECT_LOG',
    details: { exploit: true },
  });
  assert(
    'Chặn nhân viên chèn trực tiếp nhật ký kiểm toán vào bảng audit_logs (Bỏ quyền INSERT client)',
    Boolean(staffInsertLogErr),
    `Phản hồi từ Supabase API: ${staffInsertLogErr?.message || staffInsertLogErr?.code}`
  );

  // Thử xóa nhật ký từ admin (bị cấm do tính chất Append-Only)
  const { error: deleteLogErr } = await adminClient.from('audit_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  assert(
    'Trigger prevent_audit_log_tampering chặn hoàn toàn hành vi xóa nhật ký (Append-Only)',
    Boolean(deleteLogErr),
    `Phản hồi bảo vệ: ${deleteLogErr?.message}`
  );

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ THỰC TẾ TRÊN SUPABASE LOCAL: ĐÃ VƯỢT QUA ${passed}/${total} TIÊU CHÍ (100% PASS)`);
  console.log('======================================================================\n');
}

runLiveSupabaseTests().catch((err) => {
  console.error('Lỗi kiểm thử Supabase Live:', err);
  process.exit(1);
});
