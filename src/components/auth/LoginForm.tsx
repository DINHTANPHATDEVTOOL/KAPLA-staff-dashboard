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
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError(t('auth.emailError', 'Please enter your work email.'));
      return;
    }
    if (!password) {
      setFormError(t('auth.passwordError', 'Please enter your password.'));
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
      title={t('auth.loginTitle', 'Sign In to Your Account')}
      subtitle={t('auth.loginSubtitle', 'Enter your assigned email and password to access the KAPLA system.')}
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
            {t('auth.emailLabel', 'Work Email')} <span className="text-red-500">*</span>
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
              placeholder={t('auth.emailPlaceholder', 'staff.name@kapla.edu.vn')}
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
              {t('auth.passwordLabel', 'Password')} <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setAuthScreen('forgot-password')}
              className="text-xs text-[#026fd7] hover:text-[#043264] font-medium transition-colors"
            >
              {t('auth.forgotPassword', 'Forgot password?')}
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
            {t('auth.rememberMe', 'Remember login status on this device')}
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
              {t('auth.signingIn', 'Authenticating...')}
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              {t('auth.signInBtn', 'Sign In to Dashboard')}
            </>
          )}
        </button>

        {/* Register Navigation */}
        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-600">
            {t('auth.newStaffPrompt', 'Are you new staff at KAPLA?')}{' '}
            <button
              type="button"
              onClick={() => setAuthScreen('register')}
              className="font-semibold text-[#026fd7] hover:text-[#043264] underline underline-offset-2 transition-colors cursor-pointer"
            >
              {t('auth.registerNow', 'Register Account Now')}
            </button>
          </p>
        </div>

        {/* Quick Role Fill for Fast Multi-Account Testing */}
        <div className="pt-3 border-t border-slate-100">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            {t('auth.quickLogin', 'Quick Test Login by Role')}
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@kapla.edu.vn');
                setPassword('Kapla@2026');
              }}
              className="p-2 rounded-xl bg-blue-50/70 hover:bg-blue-100 text-[#043264] border border-blue-200/60 font-medium text-left truncate transition-colors cursor-pointer"
            >
              <span className="font-bold block text-[11px]">System Admin</span>
              <span className="text-[10px] text-slate-500 truncate block font-mono">admin@kapla.edu.vn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('cm.nhi@kapla.edu.vn');
                setPassword('Kapla@2026');
              }}
              className="p-2 rounded-xl bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 font-medium text-left truncate transition-colors cursor-pointer"
            >
              <span className="font-bold block text-[11px]">Center Manager (CM)</span>
              <span className="text-[10px] text-slate-500 truncate block font-mono">cm.nhi@kapla.edu.vn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('ht.jamie@kapla.edu.vn');
                setPassword('Kapla@2026');
              }}
              className="p-2 rounded-xl bg-purple-50/70 hover:bg-purple-100 text-purple-800 border border-purple-200/60 font-medium text-left truncate transition-colors cursor-pointer"
            >
              <span className="font-bold block text-[11px]">Head Teacher (HT)</span>
              <span className="text-[10px] text-slate-500 truncate block font-mono">ht.jamie@kapla.edu.vn</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('hrt.minh@kapla.edu.vn');
                setPassword('Kapla@2026');
              }}
              className="p-2 rounded-xl bg-amber-50/70 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-medium text-left truncate transition-colors cursor-pointer"
            >
              <span className="font-bold block text-[11px]">Homeroom Teacher</span>
              <span className="text-[10px] text-slate-500 truncate block font-mono">hrt.minh@kapla.edu.vn</span>
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};
