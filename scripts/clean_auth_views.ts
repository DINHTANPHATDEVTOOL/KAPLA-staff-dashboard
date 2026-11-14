import fs from 'node:fs';
import path from 'node:path';

// 1. AuthLayout.tsx
let p = path.resolve('src/components/auth/AuthLayout.tsx');
let c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  `subtitleVi: 'Chứng nhận kiểm định độc quyền từ Nhà xuất bản Đại học Oxford (Oxford University Press) 2025–2028.',`,
  `subtitleVi: 'Exclusive Oxford Quality Certification by Oxford University Press (2025–2028).',`
);
c = c.replace(
  `subtitleVi: 'Trung tâm luyện thi Cambridge Bronze Preparation Centre — Chuẩn hóa YLE 15/15 khiên & KET/PET.',`,
  `subtitleVi: 'Cambridge Bronze Preparation Centre — Standardized YLE 15/15 shields & KET/PET.',`
);
c = c.replace(
  `subtitleVi: 'Đối tác học thuật quốc tế cùng National Geographic Learning và Oxford University Press.',`,
  `subtitleVi: 'Global Academic Partner with National Geographic Learning & Oxford University Press.',`
);
c = c.replace(`nameVi: 'KAPLA Phạm Hùng'`, `nameVi: 'Pham Hung Campus'`);
c = c.replace(`nameVi: 'KAPLA Bình Tân'`, `nameVi: 'Binh Tan Campus'`);
c = c.replace(`nameVi: 'Phòng học Oxford'`, `nameVi: 'Oxford Classroom'`);

c = c.replace(
  `{t('brand.portalSubtitle', 'Cổng Thông Tin Học Vụ & Quản Trị Trung Tâm')}`,
  `{t('brand.portalSubtitle', 'Academic Administration & Staff Operations Portal')}`
);
c = c.replace(
  `<span>{t('brand.oxfordBadge', 'Chứng nhận Oxford Quality 2025–2028 • Oxford University Press')}</span>`,
  `<span>{t('brand.oxfordBadge', 'Certified Oxford Quality 2025–2028 • Oxford University Press')}</span>`
);
c = c.replace(
  `KAPLA — Tiếng Anh Sáng Tạo Mỹ{' '}\n                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-extrabold">\n                    chuẩn Oxford Quality\n                  </span>`,
  `KAPLA — American Creative English{' '}\n                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 font-extrabold">\n                    Oxford Quality Standard\n                  </span>`
);
c = c.replace(
  `'Hệ thống tiếng Anh duy nhất tại Việt Nam đạt 03 chứng nhận uy tín toàn cầu: Oxford Quality, Emerging Excellence và Cambridge English Qualifications. Chương trình phát triển toàn diện chuẩn CCSS & NGSS của Mỹ kết hợp Lập trình Robotics.'`,
  `'The only English education system in Vietnam accredited by 03 prestigious global institutions: Oxford Quality, Emerging Excellence, and Cambridge English Qualifications. Comprehensive US CCSS & NGSS curriculum integrated with STEAM Robotics.'`
);
c = c.replace(
  `{language === 'en' ? '03 Global Accreditations (Hover to Preview)' : '03 Chứng Nhận Học Thuật Toàn Cầu'}`,
  `{'03 Global Academic Accreditations (Click to Preview)'}`
);
c = c.replace(
  `{language === 'en' ? 'Hover to Zoom / Click to Expand' : 'Rê chuột để phóng to • Bấm để xem'}`,
  `{'Hover to Zoom / Click to Expand'}`
);
c = c.replace(
  `<span>{language === 'en' ? 'Click to open' : 'Bấm phóng to'}</span>`,
  `<span>Click to zoom</span>`
);
c = c.replace(
  `{t('brand.statAccreditationLabel', 'Chứng nhận Toàn cầu')}`,
  `{t('brand.statAccreditationLabel', 'Global Accreditations')}`
);
c = c.replace(
  `{t('brand.statCambridgeLabel', 'Khiên Cambridge')}`,
  `{t('brand.statCambridgeLabel', 'Cambridge Shields')}`
);
c = c.replace(
  `{t('brand.statCentresLabel', 'Trung tâm Hoạt động')}`,
  `{t('brand.statCentresLabel', 'Active Campuses')}`
);
c = c.replace(
  `{t('brand.statCentresSub', 'TP.HCM & Bình Dương')}`,
  `{t('brand.statCentresSub', 'HCMC & Binh Duong')}`
);
c = c.replace(
  `{t('brand.statSteamLabel', 'Chuẩn CCSS & NGSS Mỹ')}`,
  `{t('brand.statSteamLabel', 'US CCSS & NGSS')}`
);
c = c.replace(
  `{t('brand.statSteamSub', 'Tích hợp Lập trình Robotics')}`,
  `{t('brand.statSteamSub', 'Integrated STEAM Robotics')}`
);
c = c.replace(
  `{t('brand.featureOxfordTitle', 'Lớp học không bàn ghế chuẩn Oxford Quality')}`,
  `{t('brand.featureOxfordTitle', 'Chair-free Classrooms Oxford Standard')}`
);
c = c.replace(
  `'Phương pháp Big Question Learning — kích hoạt tư duy chủ động và rèn luyện kỹ năng 4C.'`,
  `'Big Question Learning Methodology — activates proactive critical thinking and trains 4C skills.'`
);
c = c.replace(
  `{t('brand.featureSteamTitle', 'Hệ sinh thái STEAM & Robotics chuẩn Mỹ')}`,
  `{t('brand.featureSteamTitle', 'US STEAM & Robotics Ecosystem')}`
);
c = c.replace(
  `'Phòng Lab lập trình hiện đại, tích hợp Khoa học máy tính & Toán Kangaroo (IKMC).'`,
  `'Modern coding lab integrating computer science, Kangaroo Math (IKMC), and FIDE Chess.'`
);
c = c.replace(
  `'Mạng lưới 11 trung tâm: KAPLA Phạm Hùng • Bình Tân • Tân Kỳ Tân Quý • Bàu Cát • Nguyễn Văn Lượng • Dĩ An...'`,
  `'Network of 11 campuses: KAPLA Pham Hung, Binh Tan, Tan Ky Tan Quy, Bau Cat, Nguyen Van Luong, Di An...'`
);
c = c.replace(
  `{t('brand.footerVersion', 'Phiên bản 2.1 (RLS Secured)')}`,
  `{t('brand.footerVersion', 'Version 2.1 (RLS Secured)')}`
);
c = c.replace(`title="Đóng"`, `title="Close"`);
c = c.replace(
  `<span>{language === 'en' ? 'Official Academic Accreditation • Verified' : 'Chứng nhận đào tạo chính thức • Đã xác thực'}</span>`,
  `<span>Official Academic Accreditation • Verified</span>`
);
c = c.replace(
  `{language === 'en' ? 'Close Viewer' : 'Đóng cửa sổ'}`,
  `Close Viewer`
);
fs.writeFileSync(p, c, 'utf-8');

// 2. DisabledAccountScreen.tsx
p = path.resolve('src/components/auth/DisabledAccountScreen.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`title="Tài khoản tạm ngưng"`, `title="Account Suspended"`);
c = c.replace(
  `subtitle="Quyền truy cập của tài khoản này hiện đã bị vô hiệu hóa bởi Quản trị hệ thống."`,
  `subtitle="Access for this account has been disabled by System Administration."`
);
c = c.replace(`Tài khoản đã bị khóa / vô hiệu hóa`, `Account Disabled / Suspended`);
c = c.replace(
  `Hồ sơ thuộc email <span className="font-mono font-medium text-slate-800">{profile?.email}</span> không còn quyền truy cập dữ liệu học vụ nội bộ.`,
  `The profile associated with email <span className="font-mono font-medium text-slate-800">{profile?.email}</span> no longer has access to academic data.`
);
c = c.replace(
  `<span className="font-semibold block text-slate-800 mb-0.5">Lý do ghi nhận:</span>`,
  `<span className="font-semibold block text-slate-800 mb-0.5">Recorded Reason:</span>`
);
c = c.replace(
  `<span>Vui lòng liên hệ Phòng Nhân Sự hoặc Giám đốc cơ sở để được hỗ trợ.</span>`,
  `<span>Please contact Human Resources or the Center Manager for assistance.</span>`
);
c = c.replace(`Đăng xuất tài khoản`, `Sign Out`);
fs.writeFileSync(p, c, 'utf-8');

// 3. ForgotPasswordForm.tsx
p = path.resolve('src/components/auth/ForgotPasswordForm.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  `setError('Vui lòng nhập địa chỉ email cơ quan.');`,
  `setError('Please enter your work email.');`
);
c = c.replace(
  `setError(res.error || 'Gửi email đặt lại mật khẩu thất bại.');`,
  `setError(res.error || 'Failed to send password reset email.');`
);
c = c.replace(`title="Quên mật khẩu"`, `title="Forgot Password"`);
c = c.replace(
  `subtitle="Nhập email tài khoản nhân sự KAPLA để nhận hướng dẫn khôi phục mật khẩu."`,
  `subtitle="Enter your KAPLA staff email to receive password reset instructions."`
);
c = c.replace(`Đã gửi email khôi phục!`, `Password Reset Email Sent!`);
c = c.replace(
  `Hệ thống đã gửi liên kết đặt lại mật khẩu đến:`,
  `The system has sent a reset link to:`
);
c = c.replace(
  `Vui lòng kiểm tra hộp thư (bao gồm cả thư mục Spam) và làm theo hướng dẫn.`,
  `Please check your inbox (including Spam folder) and follow the instructions.`
);
c = c.replace(`Quay lại đăng nhập`, `Back to Sign In`);
c = c.replace(
  `Email cơ quan <span className="text-red-500">*</span>`,
  `Work Email <span className="text-red-500">*</span>`
);
c = c.replace(`Đang gửi...`, `Sending...`);
c = c.replace(`Gửi email đặt lại mật khẩu`, `Send Password Reset Email`);
fs.writeFileSync(p, c, 'utf-8');

// 4. LoginForm.tsx
p = path.resolve('src/components/auth/LoginForm.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(
  `setFormError(t('auth.emailError', 'Vui lòng nhập địa chỉ email cơ quan.'));`,
  `setFormError(t('auth.emailError', 'Please enter your work email.'));`
);
c = c.replace(
  `setFormError(t('auth.passwordError', 'Vui lòng nhập mật khẩu.'));`,
  `setFormError(t('auth.passwordError', 'Please enter your password.'));`
);
c = c.replace(
  `title={t('auth.loginTitle', 'Đăng nhập tài khoản')}`,
  `title={t('auth.loginTitle', 'Sign In to Your Account')}`
);
c = c.replace(
  `subtitle={t('auth.loginSubtitle', 'Nhập email và mật khẩu được cấp để truy cập vào hệ thống KAPLA.')}`,
  `subtitle={t('auth.loginSubtitle', 'Enter your assigned email and password to access the KAPLA system.')}`
);
c = c.replace(
  `{t('auth.emailLabel', 'Email cơ quan')} <span className="text-red-500">*</span>`,
  `{t('auth.emailLabel', 'Work Email')} <span className="text-red-500">*</span>`
);
c = c.replace(
  `placeholder={t('auth.emailPlaceholder', 'ten.nhanvien@kapla.edu.vn')}`,
  `placeholder={t('auth.emailPlaceholder', 'staff.name@kapla.edu.vn')}`
);
c = c.replace(
  `{t('auth.passwordLabel', 'Mật khẩu')} <span className="text-red-500">*</span>`,
  `{t('auth.passwordLabel', 'Password')} <span className="text-red-500">*</span>`
);
c = c.replace(
  `{t('auth.forgotPassword', 'Quên mật khẩu?')}`,
  `{t('auth.forgotPassword', 'Forgot password?')}`
);
c = c.replace(
  `{t('auth.rememberMe', 'Ghi nhớ đăng nhập trên thiết bị này')}`,
  `{t('auth.rememberMe', 'Remember login on this device')}`
);
c = c.replace(
  `{t('auth.signingIn', 'Đang xác thực...')}`,
  `{t('auth.signingIn', 'Authenticating...')}`
);
c = c.replace(
  `{t('auth.signInBtn', 'Đăng nhập hệ thống')}`,
  `{t('auth.signInBtn', 'Sign In to Dashboard')}`
);
c = c.replace(
  `{t('auth.newStaffPrompt', 'Bạn là nhân sự mới?')}{' '}`,
  `{t('auth.newStaffPrompt', 'New staff member?')}{' '}`
);
c = c.replace(
  `{t('auth.registerNow', 'Đăng ký tài khoản ngay')}`,
  `{t('auth.registerNow', 'Register Account Now')}`
);
fs.writeFileSync(p, c, 'utf-8');

// 5. PendingApprovalScreen.tsx
p = path.resolve('src/components/auth/PendingApprovalScreen.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`title="Tài khoản đang chờ duyệt quyền"`, `title="Account Pending Approval"`);
c = c.replace(
  `subtitle="Hồ sơ nhân sự của bạn đã được ghi nhận. Quản trị viên hoặc Giám đốc cơ sở (CM) sẽ xem xét cấp vai trò nghiệp vụ."`,
  `subtitle="Your staff profile has been recorded. Center Manager (CM) or System Admin will review and assign roles."`
);
c = c.replace(`Hồ sơ đang được xem xét`, `Profile Under Review`);
c = c.replace(
  `Tài khoản <span className="font-mono font-medium text-slate-800">{profile?.email}</span> đã được ghi nhận vào hệ thống phân quyền KAPLA.`,
  `Account <span className="font-mono font-medium text-slate-800">{profile?.email}</span> is registered in the KAPLA permissions system.`
);
c = c.replace(
  `<span className="font-semibold block text-slate-800 mb-0.5">Quy trình cấp quyền:</span>`,
  `<span className="font-semibold block text-slate-800 mb-0.5">Approval Process:</span>`
);
c = c.replace(
  `Giám đốc cơ sở (CM) của chi nhánh bạn chọn sẽ nhận thông báo, kiểm tra phân công và kích hoạt vai trò học vụ phù hợp (CM, Head Teacher, Lead Teacher, HRT, CSKH...).`,
  `The Center Manager (CM) of your chosen campus will review assignments and activate your academic role (CM, Head Teacher, Lead Teacher, HRT, CSKH...).`
);
c = c.replace(
  `Thời gian xét duyệt thông thường từ 1–2 giờ làm việc.`,
  `Typical review turnaround is 1–2 business hours.`
);
c = c.replace(
  `{checking ? 'Đang kiểm tra...' : 'Kiểm tra lại trạng thái duyệt'}`,
  `{checking ? 'Checking...' : 'Check Approval Status'}`
);
c = c.replace(`Quay lại Đăng nhập`, `Back to Sign In`);
c = c.replace(`Đăng xuất`, `Sign Out`);
fs.writeFileSync(p, c, 'utf-8');

// 6. RegisterForm.tsx
p = path.resolve('src/components/auth/RegisterForm.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`setFormError('Vui lòng nhập họ và tên.');`, `setFormError('Please enter full name.');`);
c = c.replace(`setFormError('Vui lòng nhập email cơ quan.');`, `setFormError('Please enter work email.');`);
c = c.replace(`setFormError('Email phải có định dạng @kapla.edu.vn hoặc email hợp lệ.');`, `setFormError('Email must be @kapla.edu.vn or a valid email.');`);
c = c.replace(`setFormError('Mật khẩu phải có tối thiểu 6 ký tự.');`, `setFormError('Password must be at least 6 characters.');`);
c = c.replace(`setFormError('Mật khẩu xác nhận không khớp.');`, `setFormError('Passwords do not match.');`);
c = c.replace(`title={t('auth.registerTitle', 'Đăng ký tài khoản nhân viên')}`, `title={t('auth.registerTitle', 'Staff Account Registration')}`);
c = c.replace(
  `subtitle={t('auth.registerSubtitle', 'Tạo tài khoản công tác để được xét duyệt phân quyền theo cơ sở.')}`,
  `subtitle={t('auth.registerSubtitle', 'Create a staff account to be granted campus operational roles.')}`
);
c = c.replace(`Thông báo nội bộ KAPLA:`, `KAPLA Internal Notice:`);
c = c.replace(`t('auth.domainWarning', 'Đăng ký chỉ dành cho nhân sự trực thuộc hệ thống KAPLA.')`, `t('auth.domainWarning', 'Registration is restricted to official KAPLA system personnel.')`);
c = c.replace(`t('auth.workflowLabel', 'Quy trình cấp quyền:')`, `t('auth.workflowLabel', 'Role Provisioning Workflow:')`);
c = c.replace(
  `'Sau khi đăng ký, bạn cần xác thực email. Quản lý cơ sở (CM) sẽ xem xét chi nhánh mong muốn và cấp vai trò nghiệp vụ tương ứng.'`,
  `'After registration and email verification, the Center Manager (CM) will review your campus preference and assign operational roles.'`
);
c = c.replace(`{t('auth.fullNameLabel', 'Họ và tên nhân viên')}`, `{t('auth.fullNameLabel', 'Staff Full Name')}`);
c = c.replace(`placeholder={t('auth.fullNamePlaceholder', 'Ví dụ: Nguyễn Văn An')}`, `placeholder={t('auth.fullNamePlaceholder', 'E.g., Alexander William')}`);
c = c.replace(`{t('auth.emailLabel', 'Email công việc')}`, `{t('auth.emailLabel', 'Work Email')}`);
c = c.replace(`{t('auth.phoneLabel', 'Số điện thoại')}`, `{t('auth.phoneLabel', 'Phone Number')}`);
c = c.replace(`{t('auth.preferredBranchLabel', 'Cơ sở công tác mong muốn')}`, `{t('auth.preferredBranchLabel', 'Preferred Campus')}`);
c = c.replace(`{t('auth.branchHint', 'thông tin cho người duyệt')}`, `{t('auth.branchHint', 'for reviewer reference')}`);
c = c.replace(`{t('auth.selectBranchOption', '-- Chọn chi nhánh công tác dự kiến --')}`, `{t('auth.selectBranchOption', '-- Select Preferred Campus --')}`);
c = c.replace(`{t('auth.passwordLabel', 'Mật khẩu')}`, `{t('auth.passwordLabel', 'Password')}`);
c = c.replace(`placeholder={t('auth.passwordRule', 'Tối thiểu 6 ký tự')}`, `placeholder={t('auth.passwordRule', 'Minimum 6 characters')}`);
c = c.replace(`{t('auth.confirmPasswordLabel', 'Xác nhận mật khẩu')}`, `{t('auth.confirmPasswordLabel', 'Confirm Password')}`);
c = c.replace(`placeholder={t('auth.confirmPasswordPlaceholder', 'Nhập lại mật khẩu')}`, `placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter password')}`);
c = c.replace(`{t('auth.registering', 'Đang tạo hồ sơ...')}`, `{t('auth.registering', 'Creating profile...')}`);
c = c.replace(`{t('auth.registerBtn', 'Đăng ký tài khoản')}`, `{t('auth.registerBtn', 'Register Account')}`);
c = c.replace(`{t('auth.alreadyHaveAccount', 'Đã có tài khoản nhân viên?')}`, `{t('auth.alreadyHaveAccount', 'Already have a staff account?')}`);
c = c.replace(`{t('auth.backToLogin', 'Đăng nhập ngay')}`, `{t('auth.backToLogin', 'Sign In Now')}`);
fs.writeFileSync(p, c, 'utf-8');

// 7. ResetPasswordForm.tsx
p = path.resolve('src/components/auth/ResetPasswordForm.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');`, `setErrorMsg('New password must be at least 6 characters.');`);
c = c.replace(`setErrorMsg('Mật khẩu xác nhận không khớp.');`, `setErrorMsg('Passwords do not match.');`);
c = c.replace(`setErrorMsg(res.error || 'Cập nhật mật khẩu thất bại.');`, `setErrorMsg(res.error || 'Password update failed.');`);
c = c.replace(`title="Đặt lại mật khẩu mới"`, `title="Set New Password"`);
c = c.replace(`subtitle="Thiết lập mật khẩu an toàn mới cho tài khoản nhân sự KAPLA."`, `subtitle="Set a new secure password for your KAPLA staff account."`);
c = c.replace(`Cập nhật mật khẩu thành công!`, `Password Updated Successfully!`);
c = c.replace(`Bây giờ bạn có thể đăng nhập bằng mật khẩu mới vừa tạo.`, `You can now sign in using your new credentials.`);
c = c.replace(`Đăng nhập ngay`, `Sign In Now`);
c = c.replace(`Mật khẩu mới <span className="text-red-500">*</span>`, `New Password <span className="text-red-500">*</span>`);
c = c.replace(`placeholder="Tối thiểu 6 ký tự"`, `placeholder="Minimum 6 characters"`);
c = c.replace(`Xác nhận mật khẩu mới <span className="text-red-500">*</span>`, `Confirm New Password <span className="text-red-500">*</span>`);
c = c.replace(`placeholder="Nhập lại mật khẩu mới"`, `placeholder="Re-enter new password"`);
c = c.replace(`Đang lưu...`, `Saving...`);
c = c.replace(`'Cập nhật mật khẩu'`, `'Update Password'`);
fs.writeFileSync(p, c, 'utf-8');

// 8. VerifyEmailScreen.tsx
p = path.resolve('src/components/auth/VerifyEmailScreen.tsx');
c = fs.readFileSync(p, 'utf-8');
c = c.replace(`setNotice('Đã gửi lại email xác thực! Vui lòng kiểm tra cả hộp thư chính và thư mục Spam.');`, `setNotice('Verification email resent! Please check inbox and spam folders.');`);
c = c.replace(`setErrorNotice('Không thể gửi lại email xác thực. Vui lòng thử lại sau.');`, `setErrorNotice('Could not resend email. Please try again later.');`);
c = c.replace(`setNotice('Xác thực email thành công! Đang chuyển hướng...');`, `setNotice('Email verified successfully! Redirecting...');`);
c = c.replace(`setErrorNotice(res.error || 'Xác thực thất bại.');`, `setErrorNotice(res.error || 'Verification failed.');`);
c = c.replace(`title="Xác thực hòm thư email"`, `title="Verify Your Email Address"`);
c = c.replace(`subtitle="Bảo vệ hệ thống và đảm bảo thông báo học vụ đến đúng nhân viên phụ trách."`, `subtitle="Protects system security and ensures academic alerts reach the assigned staff."`);
c = c.replace(`Hệ thống đã gửi liên kết xác nhận đến địa chỉ:`, `A verification link has been sent to:`);
c = c.replace(`Vui lòng kiểm tra hòm thư và nhấn vào đường link xác thực để kích hoạt hồ sơ chuyển sang bước chờ duyệt quyền.`, `Please check your inbox and click the link to advance your account to pending approval.`);
c = c.replace(`Gửi lại email xác thực`, `Resend Verification Email`);
c = c.replace(`Xác nhận email ngay [Môi trường thử nghiệm]`, `Confirm Email Instantly [Demo Sandbox]`);
c = c.replace(`Quay lại Đăng nhập`, `Back to Sign In`);
c = c.replace(`Đăng xuất`, `Sign Out`);
fs.writeFileSync(p, c, 'utf-8');

console.log('All auth components updated to English!');
