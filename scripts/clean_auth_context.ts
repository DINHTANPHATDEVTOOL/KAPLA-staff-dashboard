import fs from 'node:fs';
import path from 'node:path';

const filePath = path.resolve('src/context/AuthContext.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(
  `activeRole: StaffRole | 'Quản trị hệ thống' | null;`,
  `activeRole: StaffRole | 'System Administrator' | null;`
);

content = content.replace(
  `console.warn('[KAPLA Branches] Không thể tải chi nhánh từ Supabase Cloud:', e);`,
  `console.warn('[KAPLA Branches] Unable to load branches from Supabase Cloud:', e);`
);

content = content.replace(
  `console.warn('[KAPLA Sync] Lỗi đồng bộ tài khoản từ Supabase Cloud:', e);`,
  `console.warn('[KAPLA Sync] Supabase Cloud profile sync error:', e);`
);

content = content.replace(
  `console.warn('[KAPLA Sync] Lỗi nạp mock profile:', e);`,
  `console.warn('[KAPLA Sync] Mock profile load error:', e);`
);

content = content.replace(
  `console.warn('[KAPLA Auth] Không thể kết nối session từ Supabase Cloud, chuyển sang kiểm tra Local Session:', supaErr);`,
  `console.warn('[KAPLA Auth] Could not connect session from Supabase Cloud, checking local session:', supaErr);`
);

content = content.replace(
  `console.error('[KAPLA Init] Lỗi trong quá trình khởi tạo:', err);`,
  `console.error('[KAPLA Init] Error during initialization:', err);`
);

content = content.replace(
  `throw new Error('Email hoặc mật khẩu không chính xác.');`,
  `throw new Error('Incorrect email or password.');`
);

content = content.replace(
  `return { success: false, error: 'Đăng nhập không thành công.' };`,
  `return { success: false, error: 'Sign in failed.' };`
);

content = content.replace(
  `const msg = err instanceof Error ? err.message : 'Lỗi hệ thống khi đăng nhập.';`,
  `const msg = err instanceof Error ? err.message : 'System error during sign in.';`
);

content = content.replace(
  `throw new Error('Email này đã được đăng ký trong hệ thống.');`,
  `throw new Error('This email is already registered in the system.');`
);

content = content.replace(
  `return { success: false, error: 'Đăng ký không thành công.' };`,
  `return { success: false, error: 'Registration failed.' };`
);

content = content.replace(
  `const msg = err instanceof Error ? err.message : 'Lỗi hệ thống khi đăng ký.';`,
  `const msg = err instanceof Error ? err.message : 'System error during registration.';`
);

content = content.replace(
  `if (!activeEmail) throw new Error('Không xác định được địa chỉ email.');`,
  `if (!activeEmail) throw new Error('Could not identify email address.');`
);

content = content.replace(
  `const msg = err instanceof Error ? err.message : 'Xác thực email thất bại.';`,
  `const msg = err instanceof Error ? err.message : 'Email verification failed.';`
);

content = content.replace(
  `const msg = err instanceof Error ? err.message : 'Không thể gửi email đặt lại mật khẩu.';`,
  `const msg = err instanceof Error ? err.message : 'Unable to send password reset email.';`
);

content = content.replace(
  `const msg = err instanceof Error ? err.message : 'Cập nhật mật khẩu thất bại.';`,
  `const msg = err instanceof Error ? err.message : 'Password update failed.';`
);

content = content.replace(
  `const activeRole: StaffRole | 'Quản trị hệ thống' | null =`,
  `const activeRole: StaffRole | 'System Administrator' | null =`
);

content = content.replace(
  `? 'Quản trị hệ thống'`,
  `? 'System Administrator'`
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('src/context/AuthContext.tsx updated to English!');
