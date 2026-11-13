// ==============================================================================
// KAPLA Staff Dashboard — Forgot Password Form
// ==============================================================================

import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const ForgotPasswordForm: React.FC = () => {
  const { requestPasswordReset, setAuthScreen } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestPasswordReset(email);
      if (res.success) {
        setSentSuccess(true);
      } else {
        setErrorMsg(res.error || 'Gửi yêu cầu thất bại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Khôi phục mật khẩu"
      subtitle="Nhập email tài khoản để nhận liên kết khôi phục mật khẩu bảo mật."
    >
      {sentSuccess ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Đã gửi liên kết khôi phục!
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Vui lòng kiểm tra hòm thư <span className="font-mono font-semibold">{email}</span> và làm theo hướng dẫn để đặt lại mật khẩu.
          </p>

          <button
            type="button"
            onClick={() => setAuthScreen('login')}
            className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-all"
          >
            Quay lại Đăng nhập
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
            <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email công việc <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@kapla.edu.vn"
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
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi liên kết đặt lại mật khẩu
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={() => setAuthScreen('login')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#026fd7] hover:text-[#043264] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại màn hình Đăng nhập
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
