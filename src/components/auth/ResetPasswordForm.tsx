// ==============================================================================
// KAPLA Staff Dashboard — Reset Password Form
// ==============================================================================

import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const ResetPasswordForm: React.FC = () => {
  const { resetPassword, setAuthScreen } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await resetPassword(newPassword);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setErrorMsg(res.error || 'Cập nhật mật khẩu thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Đặt lại mật khẩu mới"
      subtitle="Thiết lập mật khẩu an toàn mới cho tài khoản nhân sự KAPLA."
    >
      {isSuccess ? (
        <div className="text-center space-y-4 py-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Cập nhật mật khẩu thành công!
          </h3>
          <p className="text-xs text-slate-600">
            Bây giờ bạn có thể đăng nhập bằng mật khẩu mới vừa tạo.
          </p>
          <button
            type="button"
            onClick={() => setAuthScreen('login')}
            className="w-full mt-4 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-all"
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          <div>
            <label htmlFor="reset-pass" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reset-pass"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reset-confirm" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reset-confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7] focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-all disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Cập nhật mật khẩu'
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
