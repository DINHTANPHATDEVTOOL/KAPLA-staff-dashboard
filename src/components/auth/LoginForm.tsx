// ==============================================================================
// KAPLA Staff Dashboard — Login Form
// ==============================================================================

import React, { useState } from 'react';
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuthLayout } from './AuthLayout';

export const LoginForm: React.FC = () => {
  const { signIn, setAuthScreen } = useAuth();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError(t('auth.emailError', 'Vui lòng nhập địa chỉ email cơ quan.'));
      return;
    }
    if (!password) {
      setFormError(t('auth.passwordError', 'Vui lòng nhập mật khẩu.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await signIn(email, password);
      if (!res.success && res.error) {
        setFormError(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.loginTitle', 'Đăng nhập tài khoản')}
      subtitle={t('auth.loginSubtitle', 'Nhập email và mật khẩu được cấp để truy cập vào hệ thống KAPLA.')}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* Email Field */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            {t('auth.emailLabel', 'Email cơ quan')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder', 'ten.nhanvien@kapla.edu.vn')}
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold text-slate-700"
            >
              {t('auth.passwordLabel', 'Mật khẩu')} <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setAuthScreen('forgot-password')}
              className="text-xs text-[#026fd7] hover:text-[#043264] font-medium transition-colors"
            >
              {t('auth.forgotPassword', 'Quên mật khẩu?')}
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-[#026fd7] border-slate-300 rounded focus:ring-[#026fd7]"
          />
          <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 cursor-pointer">
            {t('auth.rememberMe', 'Ghi nhớ trạng thái đăng nhập trên thiết bị này')}
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#043264] hover:bg-[#012147] active:scale-[0.99] transition-all shadow-sm shadow-[#043264]/20 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('auth.signingIn', 'Đang xác thực...')}
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              {t('auth.signInBtn', 'Đăng nhập hệ thống')}
            </>
          )}
        </button>

        {/* Register Navigation */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            {t('auth.newStaffPrompt', 'Bạn là nhân sự mới của KAPLA?')}{' '}
            <button
              type="button"
              onClick={() => setAuthScreen('register')}
              className="font-semibold text-[#026fd7] hover:text-[#043264] underline underline-offset-2 transition-colors"
            >
              {t('auth.registerNow', 'Đăng ký tài khoản ngay')}
            </button>
          </p>
        </div>

        {/* Quick Fill Test Accounts */}
        <div className="pt-4 border-t border-dashed border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {t('auth.demoAccountsHeader', 'Chọn nhanh tài khoản thử nghiệm:')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">PW: Kapla@2026</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {[
              { labelVi: '👑 Admin', labelEn: '👑 Admin', email: 'admin@kapla.edu.vn' },
              { labelVi: '🏢 CM Phạm Hùng', labelEn: '🏢 CM Pham Hung', email: 'cm.phamhung@kapla.edu.vn' },
              { labelVi: '🏢 CM Bình Tân', labelEn: '🏢 CM Binh Tan', email: 'cm.binhtan@kapla.edu.vn' },
              { labelVi: '👩‍🏫 HRT Mai (A1)', labelEn: '👩‍🏫 HRT Mai (A1)', email: 'hrt.mai@kapla.edu.vn' },
              { labelVi: '👩‍💼 HRT Linh (Riêng)', labelEn: '👩‍💼 HRT Linh (Special)', email: 'hrt.linh@kapla.edu.vn' },
              { labelVi: '🧑‍🏫 Giáo viên chính', labelEn: '🧑‍🏫 Main Teacher', email: 'teacher.ph@kapla.edu.vn' },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('Kapla@2026');
                }}
                className="text-left px-2.5 py-1.5 text-[11px] rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 transition-colors font-medium text-slate-700 truncate"
                title={`${language === 'en' ? acc.labelEn : acc.labelVi} (${acc.email})`}
              >
                {language === 'en' ? acc.labelEn : acc.labelVi}
              </button>
            ))}
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};
