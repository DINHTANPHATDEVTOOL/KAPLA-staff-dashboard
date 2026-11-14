import fs from 'node:fs';
import path from 'node:path';

// 1. AuthLayout.tsx
let p = path.resolve('src/components/auth/AuthLayout.tsx');
let c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  `KAPLA — Tiếng Anh Sáng Tạo Mỹ{' '}\n                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-extrabold">\n                    chuẩn Oxford Quality\n                  </span>`,
  `KAPLA — American Creative English{' '}\n                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-extrabold">\n                    Oxford Quality Standard\n                  </span>`
);
// In case CRLF:
c = c.replace(
  `KAPLA — Tiếng Anh Sáng Tạo Mỹ{' '}\r\n                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-extrabold">\r\n                    chuẩn Oxford Quality\r\n                  </span>`,
  `KAPLA — American Creative English{' '}\r\n                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-extrabold">\r\n                    Oxford Quality Standard\r\n                  </span>`
);
fs.writeFileSync(p, c, 'utf-8');

// 2. ForgotPasswordForm.tsx
p = path.resolve('src/components/auth/ForgotPasswordForm.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`setErrorMsg('Vui lòng nhập địa chỉ email của bạn.');`, `setErrorMsg('Please enter your work email address.');`);
c = c.replace(`setErrorMsg(res.error || 'Gửi yêu cầu thất bại.');`, `setErrorMsg(res.error || 'Failed to send request.');`);
c = c.replace(`title="Khôi phục mật khẩu"`, `title="Recover Password"`);
c = c.replace(`subtitle="Nhập email tài khoản để nhận liên kết khôi phục mật khẩu bảo mật."`, `subtitle="Enter your account email to receive a secure password recovery link."`);
c = c.replace(`Đã gửi liên kết khôi phục!`, `Recovery Link Sent!`);
c = c.replace(`Vui lòng kiểm tra hòm thư <span className="font-mono font-semibold">{email}</span> và làm theo hướng dẫn để đặt lại mật khẩu.`, `Please check your inbox <span className="font-mono font-semibold">{email}</span> and follow the instructions to reset your password.`);
c = c.replace(`Quay lại Đăng nhập`, `Back to Sign In`);
c = c.replace(`Email công việc <span className="text-red-500">*</span>`, `Work Email <span className="text-red-500">*</span>`);
c = c.replace(`Gửi liên kết đặt lại mật khẩu`, `Send Password Reset Link`);
c = c.replace(`Quay lại màn hình Đăng nhập`, `Return to Sign In screen`);
fs.writeFileSync(p, c, 'utf-8');

// 3. LoginForm.tsx
p = path.resolve('src/components/auth/LoginForm.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`{t('auth.rememberMe', 'Ghi nhớ trạng thái đăng nhập trên thiết bị này')}`, `{t('auth.rememberMe', 'Remember login status on this device')}`);
c = c.replace(`{t('auth.newStaffPrompt', 'Bạn là nhân sự mới của KAPLA?')}{' '}`, `{t('auth.newStaffPrompt', 'Are you new staff at KAPLA?')}{' '}`);
fs.writeFileSync(p, c, 'utf-8');

// 4. PendingApprovalScreen.tsx
p = path.resolve('src/components/auth/PendingApprovalScreen.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`title={t('auth.pendingTitle', 'Tài khoản đang chờ duyệt quyền')}`, `title={t('auth.pendingTitle', 'Account Pending Role Approval')}`);
c = c.replace(
  `'Email đã xác thực thành công. Vui lòng chờ Giám đốc cơ sở (CM) cấp quyền để truy cập dữ liệu.'`,
  `'Email verified successfully. Please wait for the Center Manager (CM) to grant roles to access data.'`
);
c = c.replace(
  `{t('auth.pendingStatusLabel', 'Trạng thái: Đang chờ phân bổ vai trò')}`,
  `{t('auth.pendingStatusLabel', 'Status: Awaiting Role Assignment')}`
);
c = c.replace(
  `'Nhằm đảm bảo an toàn thông tin học viên và bảo mật học phí, hệ thống chỉ mở quyền sau khi CM chi nhánh hoặc Quản trị hệ thống phê duyệt phân công cụ thể.'`,
  `'To safeguard student privacy and tuition records, system access is granted after the Center Manager or System Admin approves role assignments.'`
);
c = c.replace(
  `{t('auth.accountSummaryTitle', 'Thông tin tài khoản đăng ký:')}`,
  `{t('auth.accountSummaryTitle', 'Registered Account Summary:')}`
);
c = c.replace(`{t('auth.pendingBadge', 'Chờ phê duyệt')}`, `{t('auth.pendingBadge', 'Pending Approval')}`);
c = c.replace(`{t('auth.fullNameLabel', 'Họ và tên')}:`, `{t('auth.fullNameLabel', 'Full Name')}:`);
c = c.replace(`'Nhân viên mới'`, `'New Staff'`);
c = c.replace(`{t('auth.registeredBranch', 'Cơ sở đăng ký')}:`, `{t('auth.registeredBranch', 'Registered Campus')}:`);
c = c.replace(`t('common.none', 'Chưa chọn')`, `t('common.none', 'None')`);
c = c.replace(`t('auth.checking', 'Đang kiểm tra...')`, `t('auth.checking', 'Checking...')`);
c = c.replace(`t('auth.checkStatusBtn', 'Kiểm tra lại trạng thái duyệt')`, `t('auth.checkStatusBtn', 'Check Approval Status')`);
c = c.replace(`{fastApproving ? 'Đang kích hoạt...' : '⚡ Phê duyệt nhanh tài khoản này làm HRT [Thử nghiệm]'}`, `{fastApproving ? 'Activating...' : '⚡ Quick Approve this account as HRT [Demo Mode]'}`);
c = c.replace(`{t('topbar.emailVerified', 'Email đã xác thực')}`, `{t('topbar.emailVerified', 'Email Verified')}`);
fs.writeFileSync(p, c, 'utf-8');

// 5. RegisterForm.tsx
p = path.resolve('src/components/auth/RegisterForm.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`setFormError(t('auth.nameError', 'Vui lòng nhập họ và tên đầy đủ.'));`, `setFormError(t('auth.nameError', 'Please enter your full name.'));`);
c = c.replace(`setFormError(t('auth.emailInvalidError', 'Vui lòng nhập địa chỉ email hợp lệ.'));`, `setFormError(t('auth.emailInvalidError', 'Please enter a valid work email address.'));`);
c = c.replace(`setFormError(t('auth.passwordLengthError', 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.'));`, `setFormError(t('auth.passwordLengthError', 'Password must be at least 6 characters.'));`);
c = c.replace(`setFormError(t('auth.passwordMismatchError', 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập.'));`, `setFormError(t('auth.passwordMismatchError', 'Confirmation password does not match.'));`);
c = c.replace(
  `subtitle={t('auth.registerSubtitle', 'Đăng ký tài khoản tác nghiệp nội bộ tại các chi nhánh thuộc hệ thống KAPLA.')}`,
  `subtitle={t('auth.registerSubtitle', 'Register an internal staff account across KAPLA educational campuses.')}`
);
fs.writeFileSync(p, c, 'utf-8');

// 6. VerifyEmailScreen.tsx
p = path.resolve('src/components/auth/VerifyEmailScreen.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  `{cooldown > 0 ? \`Gửi lại sau \${cooldown}s\` : 'Resend Verification Email'}`,
  `{cooldown > 0 ? \`Resend in \${cooldown}s\` : 'Resend Verification Email'}`
);
fs.writeFileSync(p, c, 'utf-8');

console.log('Final auth components clean done!');
