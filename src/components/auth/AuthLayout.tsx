// ==============================================================================
// KAPLA Staff Dashboard — AuthLayout (2-Column Desktop + Responsive Mobile)
// ==============================================================================

import React from 'react';
import { ShieldCheck, Award, GraduationCap, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { isDevMock, quickLoginAs } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      {/* ---------------------------------------------------------------------- */}
      {/* Left Column: Brand Showcase (Desktop only) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#012147] text-white flex-col justify-between p-10 xl:p-12 overflow-hidden">
        {/* Atmospheric Background Photo with soft overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('/assets/kapla-english-room.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#012147]/85 via-[#012147]/90 to-[#043264]/95" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src="/assets/kapla-logo-color.png"
            alt="KAPLA Logo"
            className="h-10 xl:h-11 w-auto object-contain drop-shadow"
          />
          <div className="h-7 w-px bg-white/20" />
          <div>
            <span className="font-display text-sm xl:text-base font-bold tracking-tight text-white block uppercase">
              Staff Portal
            </span>
            <span className="text-[11px] text-sky-200 font-medium tracking-wide">
              {t('brand.portalSubtitle', 'Hệ Thống Quản Lý Tiến Độ & Chăm Sóc Học Viên')}
            </span>
          </div>
        </div>

        {/* Core Value Pillars & Visual Campus Showcase */}
        <div className="relative z-10 my-auto py-4 space-y-4 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-300" />
            {t('brand.oxfordBadge', 'Độc quyền chuẩn Oxford Quality')}
          </div>

          <h1 className="font-display text-2xl xl:text-3xl font-extrabold leading-tight text-white">
            {t('brand.heroHeadline', 'Đồng hành cùng học viên bứt phá tiềm năng Anh ngữ.')}
          </h1>

          <p className="text-slate-300 text-xs xl:text-sm leading-relaxed">
            {t('brand.heroDesc', 'Nền tảng tác nghiệp nội bộ dành riêng cho đội ngũ Quản lý cơ sở (CM), Giám đốc học thuật, Giáo viên chính, HRT và Chăm sóc khách hàng trong việc theo dõi học tập, can thiệp kịp thời và gắn kết phụ huynh.')}
          </p>

          {/* Photographic Campus & Classroom Showcase Card */}
          <div className="relative rounded-2xl overflow-hidden border border-white/20 bg-white/5 backdrop-blur-md shadow-2xl p-3">
            {/* Main Campus Photo */}
            <div className="relative h-44 xl:h-52 rounded-xl overflow-hidden group">
              <img
                src="/assets/kapla-pham-hung.png"
                alt="KAPLA Flagship Campus"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#012147]/90 via-[#012147]/20 to-transparent" />

              {/* Floating Campus Badge */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{t('brand.campusBadge', 'Cơ sở Phạm Hùng • Flagship Campus TP.HCM')}</span>
              </div>

              {/* Oxford Quality Badge */}
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold shadow-sm uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                <span>Oxford Quality</span>
              </div>

              {/* Bottom Caption Overlay */}
              <div className="absolute bottom-2.5 left-3 right-3 text-white">
                <p className="text-xs font-semibold leading-tight drop-shadow">
                  {t('brand.campusHighlight', 'Không gian đào tạo tiếng Anh sáng tạo & STEM chuẩn Mỹ')}
                </p>
                <p className="text-[10px] text-sky-200 mt-0.5 line-clamp-1 drop-shadow">
                  {t('brand.campusSub', 'Hệ thống phòng học tương tác, thư viện Oxford và xưởng sáng chế Robotics.')}
                </p>
              </div>
            </div>

            {/* Thumbnail Row */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="relative h-20 rounded-lg overflow-hidden border border-white/10 group">
                <img
                  src="/assets/kapla-english-room.jpg"
                  alt="Phòng học Oxford Quality"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-medium text-white truncate drop-shadow">
                  {t('brand.classroomThumb', 'Phòng học Oxford Quality')}
                </span>
              </div>

              <div className="relative h-20 rounded-lg overflow-hidden border border-white/10 group">
                <img
                  src="/assets/kapla-robotics-room.jpg"
                  alt="STEAM & Robotics Lab"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-medium text-white truncate drop-shadow">
                  {t('brand.roboticsThumb', 'STEAM & Robotics Lab')}
                </span>
              </div>
            </div>
          </div>

          {/* Security & Multi-branch Pillars */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-900/40 border border-blue-700/40">
              <div className="p-1.5 rounded-lg bg-blue-800/60 text-blue-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{t('brand.securityPillar', 'Phân quyền chặt chẽ')}</p>
                <p className="text-[10px] text-slate-300 leading-tight mt-0.5">{t('brand.securityPillarDesc', 'Bảo mật thông tin phụ huynh và học phí theo từng vai trò')}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-blue-900/40 border border-blue-700/40">
              <div className="p-1.5 rounded-lg bg-blue-800/60 text-blue-300 shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{t('brand.multiBranchPillar', 'Đa chi nhánh từ gốc')}</p>
                <p className="text-[10px] text-slate-300 leading-tight mt-0.5">{t('brand.multiBranchPillarDesc', 'Triển khai tập trung, vận hành độc lập từng trung tâm')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Credit & Facility Info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            <span>KAPLA Education Systems © 2026</span>
          </div>
          <span className="text-[11px] bg-slate-800/80 px-2.5 py-1 rounded-md text-slate-300 font-mono">
            {t('brand.footerVersion', 'Phiên bản 2.1 (RLS Secured)')}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* Right Column: Form Interactive Container */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col justify-center py-10 px-4 sm:px-6 md:px-10 lg:px-14 xl:px-20 max-w-2xl mx-auto w-full">
        {/* Top Control Bar with Language Switcher */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="lg:hidden flex items-center">
              <img
                src="/assets/kapla-logo-dark.png"
                alt="KAPLA Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="text-[11px] font-semibold bg-blue-50 text-[#026fd7] px-2.5 py-0.5 rounded-full border border-blue-200">
              {t('brand.internalTag', 'Nội bộ')}
            </span>
          </div>

          {/* Bilingual Switcher */}
          <LanguageToggle />
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
