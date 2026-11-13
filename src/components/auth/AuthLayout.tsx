// ==============================================================================
// KAPLA Staff Dashboard — AuthLayout (2-Column Desktop + Responsive Mobile)
// ==============================================================================

import React from 'react';
import { ShieldCheck, Award, GraduationCap, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { isDevMock, quickLoginAs } = useAuth();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      {/* ---------------------------------------------------------------------- */}
      {/* Left Column: Brand Showcase (Desktop only) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#012147] text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background photo with subtle dark navy overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30"
          style={{ backgroundImage: "url('/assets/kapla-english-room.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#012147]/95 via-[#043264]/90 to-[#012147]/98" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-md border border-white/20">
            <img
              src="/assets/kapla-logo-color.png"
              alt="KAPLA Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-white block">
              KAPLA Staff Portal
            </span>
            <span className="text-xs text-sky-200 font-medium tracking-wide">
              Hệ Thống Quản Lý Tiến Độ & Chăm Sóc Học Viên
            </span>
          </div>
        </div>

        {/* Core Value Pillars */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-300" />
            Độc quyền chuẩn Oxford Quality
          </div>

          <h1 className="font-display text-3xl xl:text-4xl font-extrabold leading-tight text-white">
            Đồng hành cùng học viên bứt phá tiềm năng Anh ngữ.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Nền tảng tác nghiệp nội bộ dành riêng cho đội ngũ Quản lý cơ sở (CM), Giám đốc học thuật, Giáo viên chính, HRT và Chăm sóc khách hàng trong việc theo dõi học tập, can thiệp kịp thời và gắn kết phụ huynh.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/60">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-700/50 text-blue-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Phân quyền chặt chẽ</p>
                <p className="text-[11px] text-slate-400">Bảo mật thông tin phụ huynh và học phí theo từng vai trò</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-900/60 border border-blue-700/50 text-blue-300">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Đa chi nhánh từ gốc</p>
                <p className="text-[11px] text-slate-400">Triển khai tập trung, vận hành độc lập từng trung tâm</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit & Facility Info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span>KAPLA Education Systems © 2026</span>
          </div>
          <span className="text-[11px] bg-slate-800/80 px-2.5 py-1 rounded-md text-slate-300 font-mono">
            Phiên bản 2.1 (RLS Secured)
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Right Column: Form Interactive Container */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 max-w-2xl mx-auto w-full">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img
              src="/assets/kapla-logo-color.png"
              alt="KAPLA Logo"
              className="h-9 w-auto object-contain"
            />
            <div>
              <p className="font-display text-base font-bold text-slate-900 leading-tight">
                KAPLA Staff
              </p>
              <p className="text-[11px] text-slate-500">Hệ Thống Quản Lý Nội Bộ</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
            Internal
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="mb-6">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Form Slot */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {children}
        </div>

        {/* Development Helper Quick Switch Pills */}
        {isDevMock && (
          <div className="mt-8 p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-2.5">
            <div className="flex items-center justify-between font-semibold text-amber-900">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                Chế độ thử nghiệm luồng Auth & Phân quyền (Mock Data):
              </span>
              <span className="text-[10px] bg-amber-200/60 px-1.5 py-0.5 rounded text-amber-800">
                1-Click Login
              </span>
            </div>
            <p className="text-amber-800/90 text-[11px] leading-tight">
              Bấm vào tài khoản bên dưới để đăng nhập ngay và kiểm thử phân quyền các vai trò:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => quickLoginAs('admin@kapla.edu.vn')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium transition-colors shadow-2xs"
              >
                👑 Quản trị hệ thống
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('cm.phamhung@kapla.edu.vn')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium transition-colors shadow-2xs"
              >
                🏢 CM Phạm Hùng
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('cm.binhtan@kapla.edu.vn')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium transition-colors shadow-2xs"
              >
                🏢 CM Bình Tân
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('teacher.mai@kapla.edu.vn')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-medium transition-colors shadow-2xs"
              >
                👩‍🏫 HRT Mai (PH)
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('new.staff@kapla.edu.vn')}
                className="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-medium transition-colors shadow-2xs"
              >
                ⏳ Staff Đang Chờ Duyệt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
