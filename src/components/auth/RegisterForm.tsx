// ==============================================================================
// KAPLA Staff Dashboard — Register Form with Live Email OTP Verification
// Dispatches real OTP from kapladashboard@gmail.com via Google SMTP
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Building2,
  AlertCircle,
  Loader2,
  Info,
  CheckCircle2,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuthLayout } from './AuthLayout';
import { RegistrationOtpService } from '../../lib/otpService';

export const RegisterForm: React.FC = () => {
  const { signUp, availableBranches, setAuthScreen } = useAuth();
  const { t } = useLanguage();

  // Step: 'form' -> Enter details | 'otp' -> Enter 6-digit OTP code
  const [step, setStep] = useState<'form' | 'otp'>('form');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredBranchId, setPreferredBranchId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: any = null;
    if (step === 'otp' && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendCooldown]);

  // Handle Step 1: Validate & Send OTP to Real Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessNotice(null);

    if (!fullName.trim()) {
      setFormError(t('auth.nameError', 'Please enter your full name.'));
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError(t('auth.emailInvalidError', 'Please enter a valid work email address.'));
      return;
    }
    if (password.length < 6) {
      setFormError(t('auth.passwordLengthError', 'Password must be at least 6 characters.'));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t('auth.passwordMismatchError', 'Confirmation password does not match.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await RegistrationOtpService.generateAndSendOtp({
        fullName,
        email,
        phone,
        preferredBranchId: preferredBranchId || undefined,
        password,
      });

      if (!res.success && res.error) {
        setFormError(res.error);
        return;
      }

      setStep('otp');
      setResendCooldown(60);
      setCanResend(false);
      setSuccessNotice(`Verification code dispatched to ${email.trim()} via Google SMTP (kapladashboard@gmail.com).`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to dispatch verification code. Please check your network.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || submitting) return;
    setSubmitting(true);
    setFormError(null);
    setSuccessNotice(null);

    try {
      const res = await RegistrationOtpService.generateAndSendOtp({
        fullName,
        email,
        phone,
        preferredBranchId: preferredBranchId || undefined,
        password,
      });

      if (!res.success && res.error) {
        setFormError(res.error);
        return;
      }

      setResendCooldown(60);
      setCanResend(false);
      setSuccessNotice(`A fresh verification code has been dispatched to ${email.trim()}.`);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to resend code.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Step 2: Verify OTP & Create Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!otpCode.trim() || otpCode.replace(/\s+/g, '').length < 6) {
      setFormError('Please enter the complete 6-digit verification code.');
      return;
    }

    setSubmitting(true);
    try {
      const verifyResult = RegistrationOtpService.verifyOtp(otpCode);
      if (!verifyResult.success || !verifyResult.payload) {
        setFormError(verifyResult.error || 'Invalid or expired OTP code.');
        return;
      }

      const p = verifyResult.payload;
      // Complete sign-up through AuthContext
      const res = await signUp(p.fullName, p.email, p.password, p.phone, p.preferredBranchId);
      if (!res.success && res.error) {
        setFormError(res.error);
        return;
      }

      // Clear pending OTP upon success
      RegistrationOtpService.clearPending();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={step === 'form' ? t('auth.registerTitle', 'Staff Account Registration') : 'Verify Email Address'}
      subtitle={
        step === 'form'
          ? t('auth.registerSubtitle', 'Register an internal staff account across KAPLA educational campuses.')
          : `We sent a 6-digit verification code to ${email}`
      }
    >
      {/* Step 1: Registration Form */}
      {step === 'form' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{formError}</div>
            </div>
          )}

          {/* Workflow Info notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold">{t('auth.workflowLabel', 'Real Email OTP Verification:')}</span>{' '}
              {t(
                'auth.workflowDesc',
                'Upon entering your information, a real 6-digit OTP code will be sent to your work email via kapladashboard@gmail.com.'
              )}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="reg-fullname" className="block text-xs font-semibold text-slate-700 mb-1">
              {t('auth.fullNameLabel', 'Staff Full Name')} <span className="text-red-500">*</span>
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
                placeholder={t('auth.fullNamePlaceholder', 'E.g., Alexander William')}
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Email & Phone in 2 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.emailLabel', 'Work Email')} <span className="text-red-500">*</span>
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
                  placeholder={t('auth.emailPlaceholder', 'ten@gmail.com')}
                  className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.phoneLabel', 'Phone Number')}
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
              {t('auth.preferredBranchLabel', 'Preferred Campus')}{' '}
              <span className="text-slate-400 font-normal">({t('auth.branchHint', 'for reviewer reference')})</span>
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
                <option value="">{t('auth.selectBranchOption', '-- Select Preferred Campus --')}</option>
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
                {t('auth.passwordLabel', 'Password')} <span className="text-red-500">*</span>
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
                  placeholder={t('auth.passwordRule', 'Minimum 6 characters')}
                  className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-confirm-pass" className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.confirmPasswordLabel', 'Confirm Password')} <span className="text-red-500">*</span>
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
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter password')}
                  className="w-full pl-10 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Submit -> Send OTP */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#043264] hover:bg-[#012147] active:scale-[0.99] transition-all shadow-sm shadow-[#043264]/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending OTP via kapladashboard@gmail.com...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Continue & Send Verification OTP</span>
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="pt-3 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              {t('auth.alreadyHaveAccount', 'Already have a staff account?')}{' '}
              <button
                type="button"
                onClick={() => setAuthScreen('login')}
                className="font-semibold text-[#026fd7] hover:text-[#043264] underline underline-offset-2 transition-colors cursor-pointer"
              >
                {t('auth.backToLogin', 'Sign In Now')}
              </button>
            </p>
          </div>
        </form>
      )}

      {/* Step 2: OTP Verification Screen */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in zoom-in-95">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{formError}</div>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="flex-1">{successNotice}</div>
            </div>
          )}

          {/* Target Email Banner */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-center space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Verification Code Sent To:
            </span>
            <div className="font-mono text-sm font-bold text-[#043264]">{email}</div>
            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Official Sender: <strong className="font-mono">kapladashboard@gmail.com</strong></span>
            </div>
          </div>

          {/* 6-Digit OTP Input Box */}
          <div>
            <label htmlFor="otp-input" className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
              Enter 6-Digit OTP Code <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="otp-input"
                type="text"
                required
                maxLength={6}
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="••••••"
                className="w-full text-center py-3 text-2xl font-mono font-bold tracking-[0.5em] bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#043264] focus:border-[#043264] transition-all text-slate-900 placeholder:text-slate-300 placeholder:tracking-[0.2em]"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-1.5">
              Check your inbox (or spam folder) for the email sent from <strong>kapladashboard@gmail.com</strong>.
            </p>
          </div>

          {/* Submit Verify */}
          <button
            type="submit"
            disabled={submitting || otpCode.length < 6}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying OTP & Creating Account...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify OTP & Complete Registration</span>
              </>
            )}
          </button>

          {/* Resend and Edit Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setOtpCode('');
                setFormError(null);
                setSuccessNotice(null);
              }}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Edit Details / Change Email</span>
            </button>

            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting}
                className="font-semibold text-[#026fd7] hover:text-[#043264] inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP Code</span>
              </button>
            ) : (
              <span className="text-slate-400 font-mono">
                Resend in {resendCooldown}s
              </span>
            )}
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
