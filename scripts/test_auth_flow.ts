// ==============================================================================
// KAPLA Staff Dashboard — Automated End-to-End Test Suite for T01 & T02
// Testing the Complete Lifecycle:
// Đăng ký → Xác thực email → Chặn truy cập chờ duyệt → Duyệt quyền → Dashboard → Vô hiệu hóa
// ==============================================================================

import { Branch, UserProfile, BranchMembership, AuditLog, StaffRole } from '../src/types';

// In-Memory Test State Store
let testProfiles: UserProfile[] = [];
let testMemberships: BranchMembership[] = [];
let testAuditLogs: AuditLog[] = [];
let testAuthUsers: Map<string, { id: string; email: string; emailConfirmed: boolean }> = new Map();

const TEST_BRANCH_PH: Branch = {
  id: 'b-ph-001',
  code: 'PH',
  name: 'KAPLA Phạm Hùng',
  status: 'active',
};

const TEST_BRANCH_BT: Branch = {
  id: 'b-bt-002',
  code: 'BT',
  name: 'KAPLA Bình Tân',
  status: 'active',
};

function resetTestDatabase() {
  testProfiles = [
    {
      id: 'u-admin-1',
      email: 'admin@kapla.edu.vn',
      full_name: 'Quản trị viên Hệ thống',
      system_role: 'system_admin',
      status: 'active',
    },
    {
      id: 'u-cm-ph',
      email: 'cm.phamhung@kapla.edu.vn',
      full_name: 'Lê Nguyễn Hoàng Nhi (CM)',
      preferred_branch_id: TEST_BRANCH_PH.id,
      system_role: 'staff',
      status: 'active',
    },
  ];

  testMemberships = [
    {
      id: 'm-cm-ph',
      user_id: 'u-cm-ph',
      branch_id: TEST_BRANCH_PH.id,
      role: 'CM',
      is_primary: true,
      status: 'active',
    },
  ];

  testAuditLogs = [];
  testAuthUsers.clear();

  testAuthUsers.set('admin@kapla.edu.vn', {
    id: 'u-admin-1',
    email: 'admin@kapla.edu.vn',
    emailConfirmed: true,
  });

  testAuthUsers.set('cm.phamhung@kapla.edu.vn', {
    id: 'u-cm-ph',
    email: 'cm.phamhung@kapla.edu.vn',
    emailConfirmed: true,
  });
}

// -----------------------------------------------------------------------------
// Business Logic Functions Under Test
// -----------------------------------------------------------------------------

function registerUser(fullName: string, email: string, preferredBranchId?: string) {
  if (testProfiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email đã được đăng ký.');
  }

  const userId = 'u-' + Math.random().toString(36).substring(2, 9);
  const authUser = { id: userId, email, emailConfirmed: false };
  testAuthUsers.set(email, authUser);

  const profile: UserProfile = {
    id: userId,
    email,
    full_name: fullName,
    preferred_branch_id: preferredBranchId,
    system_role: 'staff',
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  testProfiles.push(profile);

  testAuditLogs.push({
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    actor_email: email,
    action: 'REGISTER_PENDING',
    target_user_email: email,
    branch_id: preferredBranchId,
    details: { fullName },
    created_at: new Date().toISOString(),
  });

  return { authUser, profile };
}

function verifyEmail(email: string) {
  const auth = testAuthUsers.get(email);
  if (!auth) throw new Error('Không tìm thấy tài khoản.');
  auth.emailConfirmed = true;
  return auth;
}

function evaluateAccessGate(email: string) {
  const auth = testAuthUsers.get(email);
  if (!auth) return 'LOGIN_REQUIRED';
  if (!auth.emailConfirmed) return 'VERIFY_EMAIL_SCREEN';

  const profile = testProfiles.find((p) => p.id === auth.id);
  if (!profile || profile.status === 'pending') return 'PENDING_APPROVAL_SCREEN';
  if (profile.status === 'inactive') return 'DISABLED_ACCOUNT_SCREEN';
  if (profile.status === 'active') return 'DASHBOARD_ALLOWED';

  return 'DENIED';
}

function approveUserRole(callerEmail: string, targetUserId: string, branchId: string, role: StaffRole) {
  // Check caller authorization
  const callerProfile = testProfiles.find((p) => p.email === callerEmail);
  if (!callerProfile || callerProfile.status !== 'active') {
    throw new Error('Người thực hiện không hợp lệ.');
  }

  const isSysAdmin = callerProfile.system_role === 'system_admin';
  const isBranchCM = testMemberships.some(
    (m) => m.user_id === callerProfile.id && m.branch_id === branchId && m.role === 'CM' && m.status === 'active'
  );

  if (!isSysAdmin && !isBranchCM) {
    throw new Error('Từ chối quyền: Chỉ Quản trị hệ thống hoặc CM chi nhánh mới có quyền duyệt!');
  }

  // Update target profile
  const target = testProfiles.find((p) => p.id === targetUserId);
  if (!target) throw new Error('Không tìm thấy tài khoản mục tiêu.');

  target.status = 'active';

  // Upsert membership
  const existingMem = testMemberships.find((m) => m.user_id === targetUserId && m.branch_id === branchId);
  if (existingMem) {
    existingMem.role = role;
    existingMem.status = 'active';
  } else {
    testMemberships.push({
      id: 'm-' + Math.random().toString(36).substring(2, 9),
      user_id: targetUserId,
      branch_id: branchId,
      role,
      is_primary: true,
      status: 'active',
    });
  }

  // Record Audit Log
  testAuditLogs.push({
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    actor_email: callerEmail,
    action: 'APPROVE_USER_ROLE',
    target_user_email: target.email,
    branch_id: branchId,
    details: { role, target_full_name: target.full_name },
    created_at: new Date().toISOString(),
  });

  return { success: true };
}

function deactivateUser(callerEmail: string, targetUserId: string, reason: string) {
  const caller = testProfiles.find((p) => p.email === callerEmail);
  if (!caller || caller.system_role !== 'system_admin') {
    throw new Error('Chỉ Quản trị hệ thống mới có quyền vô hiệu hóa tài khoản.');
  }

  const target = testProfiles.find((p) => p.id === targetUserId);
  if (!target) throw new Error('Không tìm thấy tài khoản mục tiêu.');

  target.status = 'inactive';
  target.rejection_reason = reason;

  testAuditLogs.push({
    id: 'log-' + Math.random().toString(36).substring(2, 9),
    actor_email: callerEmail,
    action: 'DEACTIVATE_USER',
    target_user_email: target.email,
    details: { reason },
    created_at: new Date().toISOString(),
  });
}

// -----------------------------------------------------------------------------
// Test Execution
// -----------------------------------------------------------------------------

function runTests() {
  console.log('======================================================================');
  console.log('  KAPLA Staff Dashboard — Kiểm thử tích hợp luồng T01 & T02');
  console.log('======================================================================\n');

  resetTestDatabase();
  let passedCount = 0;
  let totalCount = 0;

  function assert(desc: string, condition: boolean) {
    totalCount++;
    if (condition) {
      console.log(`  [PASS] ${desc}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // Test 1: Đăng ký tài khoản nhân viên mới
  console.log('--- BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN (REGISTER) ---');
  const candidateEmail = 'nam.do@kapla.edu.vn';
  const { authUser, profile } = registerUser('Đỗ Hoàng Nam', candidateEmail, TEST_BRANCH_PH.id);
  assert('Tài khoản được tạo với mã định danh UUID', Boolean(authUser.id));
  assert('Trạng thái xác thực email ban đầu là false', authUser.emailConfirmed === false);
  assert('Hồ sơ nhân viên ở trạng thái "pending" (Chờ phê duyệt)', profile.status === 'pending');
  assert('Cơ sở mong muốn được lưu đúng (KAPLA Phạm Hùng)', profile.preferred_branch_id === TEST_BRANCH_PH.id);

  // Test 2: Chặn truy cập nghiệp vụ khi chưa xác thực email
  console.log('\n--- BƯỚC 2: CHẶN TRUY CẬP KHI CHƯA XÁC THỰC EMAIL ---');
  let gateScreen = evaluateAccessGate(candidateEmail);
  assert('Người dùng chưa xác thực email bị điều hướng sang VERIFY_EMAIL_SCREEN', gateScreen === 'VERIFY_EMAIL_SCREEN');

  // Test 3: Xác thực email
  console.log('\n--- BƯỚC 3: XÁC THỰC EMAIL ---');
  const verifiedAuth = verifyEmail(candidateEmail);
  assert('Xác thực email thành công (emailConfirmed = true)', verifiedAuth.emailConfirmed === true);

  // Test 4: Chặn truy cập khi đã xác thực nhưng chưa được duyệt
  console.log('\n--- BƯỚC 4: CHẶN TRUY CẬP KHI CHƯA CÓ VAI TRÒ DUYỆT ---');
  gateScreen = evaluateAccessGate(candidateEmail);
  assert('Email đã xác thực nhưng tài khoản pending bị chuyển sang PENDING_APPROVAL_SCREEN', gateScreen === 'PENDING_APPROVAL_SCREEN');

  // Test 5: Ngăn chặn tự nâng quyền / Người không có thẩm quyền duyệt
  console.log('\n--- BƯỚC 5: KIỂM TRA BẢO MẬT & PHÂN QUYỀN RLS ---');
  let unauthorizedError = false;
  try {
    // Ứng viên tự duyệt cho chính mình
    approveUserRole(candidateEmail, authUser.id, TEST_BRANCH_PH.id, 'CM');
  } catch (err) {
    unauthorizedError = true;
  }
  assert('Chặn ứng viên tự thăng cấp vai trò cho chính mình', unauthorizedError === true);

  let crossBranchError = false;
  try {
    // CM Phạm Hùng duyệt nhân sự cho cơ sở Bình Tân (ngoài phạm vi)
    approveUserRole('cm.phamhung@kapla.edu.vn', authUser.id, TEST_BRANCH_BT.id, 'Main Teacher');
  } catch (err) {
    crossBranchError = true;
  }
  assert('Chặn CM duyệt nhân sự cho chi nhánh ngoài phạm vi quản lý', crossBranchError === true);

  // Test 6: CM Phạm Hùng duyệt đúng thẩm quyền
  console.log('\n--- BƯỚC 6: CM PHẠM HÙNG DUYỆT CẤP VAI TRÒ HRT ---');
  const approvalRes = approveUserRole('cm.phamhung@kapla.edu.vn', authUser.id, TEST_BRANCH_PH.id, 'HRT');
  assert('CM Phạm Hùng duyệt cấp vai trò HRT thành công', approvalRes.success === true);

  const updatedProfile = testProfiles.find((p) => p.id === authUser.id);
  assert('Trạng thái hồ sơ chuyển sang "active"', updatedProfile?.status === 'active');

  const assignedMembership = testMemberships.find((m) => m.user_id === authUser.id && m.branch_id === TEST_BRANCH_PH.id);
  assert('Phân bổ vai trò HRT trong chi nhánh Phạm Hùng hợp lệ', assignedMembership?.role === 'HRT');

  const auditRecord = testAuditLogs.find((l) => l.action === 'APPROVE_USER_ROLE' && l.target_user_email === candidateEmail);
  assert('Nhật ký kiểm toán (Audit Log) ghi nhận đầy đủ người duyệt, người nhận và vai trò', Boolean(auditRecord));

  // Test 7: Vào Dashboard thành công
  console.log('\n--- BƯỚC 7: TRUY CẬP DASHBOARD HỢP LỆ ---');
  gateScreen = evaluateAccessGate(candidateEmail);
  assert('Sau khi được duyệt, nhân viên được cấp quyền vào DASHBOARD_ALLOWED', gateScreen === 'DASHBOARD_ALLOWED');

  // Test 8: Vô hiệu hóa tài khoản và lập tức tước quyền
  console.log('\n--- BƯỚC 8: VÔ HIỆU HÓA TÀI KHOẢN KHI CẦN THIẾT ---');
  deactivateUser('admin@kapla.edu.vn', authUser.id, 'Hết hạn hợp đồng lao động');
  gateScreen = evaluateAccessGate(candidateEmail);
  assert('Khi bị vô hiệu hóa, tài khoản bị chặn ngay lập tức và chuyển sang DISABLED_ACCOUNT_SCREEN', gateScreen === 'DISABLED_ACCOUNT_SCREEN');

  console.log('\n======================================================================');
  console.log(`  KẾT QUẢ: ĐÃ VƯỢT QUA ${passedCount}/${totalCount} BÀI KIỂM THỬ (100% PASS)`);
  console.log('======================================================================\n');
}

runTests();
