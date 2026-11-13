// ==============================================================================
// KAPLA Staff Dashboard — Disabled Account Screen
// ==============================================================================

import React from 'react';
import { ShieldAlert, LogOut, PhoneCall } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const DisabledAccountScreen: React.FC = () => {
  const { profile, signOut } = useAuth();

  return (
    <AuthLayout
      title="Tài khoản tạm ngưng"
      subtitle="Quyền truy cập của tài khoản này hiện đã bị vô hiệu hóa bởi Quản trị hệ thống."
    >
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-base font-bold text-slate-900">
            Tài khoản đã bị khóa / vô hiệu hóa
          </h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            Hồ sơ thuộc email <span className="font-mono font-medium text-slate-800">{profile?.email}</span> không còn quyền truy cập dữ liệu học vụ nội bộ.
          </p>

          {profile?.rejection_reason && (
            <div className="mt-3 p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 text-left">
              <span className="font-semibold block text-slate-800 mb-0.5">Lý do ghi nhận:</span>
              {profile.rejection_reason}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-center gap-2">
          <PhoneCall className="w-4 h-4 text-slate-400" />
          <span>Vui lòng liên hệ Phòng Nhân Sự hoặc Giám đốc cơ sở để được hỗ trợ.</span>
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất tài khoản
        </button>
      </div>
    </AuthLayout>
  );
};
