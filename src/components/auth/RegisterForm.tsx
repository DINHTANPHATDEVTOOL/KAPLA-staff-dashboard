// ==============================================================================
// KAPLA Staff Dashboard — Register Form
// ==============================================================================

import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Phone, Building2, AlertCircle, Loader2, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuthLayout } from './AuthLayout';

export const RegisterForm: React.FC = () => {
  const { signUp, availableBranches, setAuthScreen } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredBranchId, setPreferredBranchId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError(t('auth.nameError', 'Vui lòng nhập họ và tên đầy đủ.'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError(t('auth.emailInvalidError', 'Vui lòng nhập địa chỉ email hợp lệ.'));
      return;
    }
    if (password.length < 6) {
      setFormError(t('auth.passwordLengthError', 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.'));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t('auth.passwordMismatchError', 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await signUp(fullName, email, password, phone, preferredBranchId || undefined);
      if (!res.success && res.error) {
        setFormError(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.registerTitle', 'Đăng ký tài khoản nhân viên')}
      subtitle={t('auth.registerSubtitle', 'Đăng ký tài khoản tác nghiệp nội bộ tại các chi nhánh thuộc hệ thống KAPLA.')}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* Workflow Info notice */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">{t('auth.workflowLabel', 'Quy trình cấp quyền:')}</span>{' '}
            {t(
              'auth.workflowDesc',
              'Sau khi đăng ký, bạn cần xác thực email. Quản lý cơ sở (CM) sẽ xem xét chi nhánh mong muốn và cấp vai trò nghiệp vụ tương ứng.'
            )}
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="reg-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('auth.fullNameLabel', 'Họ và tên nhân viên')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              id="reg-fullname"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('auth.fullNamePlaceholder', 'Ví dụ: Nguyễn Văn An')}
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Email & Phone in 2 cols */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.emailLabel', 'Email công việc')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder', 'ten@kapla.edu.vn')}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.phoneLabel', 'Số điện thoại')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="reg-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xx xxx xxx"
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Preferred Branch */}
        <div>
          <label htmlFor="reg-branch" className="block text-xs font-semibold text-slate-700 mb-1">
            {t('auth.preferredBranchLabel', 'Cơ sở công tác mong muốn')}{' '}
            <span className="text-slate-400 font-normal">({t('auth.branchHint', 'thông tin cho người duyệt')})</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              id="reg-branch"
              value={preferredBranchId}
              onChange={(e) => setPreferredBranchId(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all text-slate-800"
            >
              <option value="">{t('auth.selectBranchOption', '-- Chọn chi nhánh công tác dự kiến --')}</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label htmlFor="reg-pass" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.passwordLabel', 'Mật khẩu')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reg-pass"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordRule', 'Tối thiểu 6 ký tự')}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm-pass" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.confirmPasswordLabel', 'Xác nhận mật khẩu')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reg-confirm-pass"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder', 'Nhập lại mật khẩu')}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#043264] hover:bg-[#012147] active:scale-[0.99] transition-all shadow-sm shadow-[#043264]/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('auth.registering', 'Đang tạo hồ sơ...')}
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              {t('auth.registerBtn', 'Đăng ký tài khoản')}
            </>
          )}
        </button>

        {/* Back to Login */}
        <div className="pt-3 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            {t('auth.alreadyHaveAccount', 'Đã có tài khoản nhân viên?')}{' '}
            <button
              type="button"
              onClick={() => setAuthScreen('login')}
              className="font-semibold text-[#026fd7] hover:text-[#043264] underline underline-offset-2 transition-colors"
            >
              {t('auth.backToLogin', 'Đăng nhập ngay')}
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};
