// ==============================================================================
// KAPLA Staff Dashboard — Verify Email Screen
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { MailCheck, RefreshCw, LogOut, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const VerifyEmailScreen: React.FC = () => {
  const { user, verifyEmailConfirm, signOut, setAuthScreen } = useAuth();
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    setNotice(null);
    setErrorNotice(null);
    try {
      // simulate or call resend
      setCooldown(60);
      setNotice('Đã gửi lại email xác thực! Vui lòng kiểm tra cả hộp thư chính và thư mục Spam.');
    } catch {
      setErrorNotice('Không thể gửi lại email xác thực. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  const handleSimulateConfirm = async () => {
    setErrorNotice(null);
    setNotice(null);
    const res = await verifyEmailConfirm();
    if (res.success) {
      setNotice('Xác thực email thành công! Đang chuyển hướng...');
    } else {
      setErrorNotice(res.error || 'Xác thực thất bại.');
    }
  };

  return (
    <AuthLayout
      title="Xác thực hòm thư email"
      subtitle="Bảo vệ hệ thống và đảm bảo thông báo học vụ đến đúng nhân viên phụ trách."
    >
      <div className="text-center space-y-5">
        {/* Verification Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#026fd7] shadow-inner">
          <MailCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-slate-600">
            Hệ thống đã gửi liên kết xác nhận đến địa chỉ:
          </p>
          <p className="font-mono text-sm font-semibold text-[#043264] bg-slate-100 py-1.5 px-3 rounded-lg inline-block border border-slate-200">
            {user?.email || 'email@kapla.edu.vn'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto pt-1 leading-relaxed">
            Vui lòng kiểm tra hòm thư và nhấn vào đường link xác thực để kích hoạt hồ sơ chuyển sang bước chờ duyệt quyền.
          </p>
        </div>

        {notice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Resend & Test Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email xác thực'}
          </button>

          {/* Dev/Testing immediate activation button */}
          <button
            type="button"
            onClick={handleSimulateConfirm}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#026fd7] hover:bg-[#043264] transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Xác nhận email ngay [Môi trường thử nghiệm]
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Sign Out or Switch Account */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setAuthScreen('login')}
            className="hover:text-slate-800 underline underline-offset-2"
          >
            Quay lại Đăng nhập
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
