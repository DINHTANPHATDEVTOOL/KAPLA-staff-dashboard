// ==============================================================================
// KAPLA Staff Portal — AuthLayout (2-Column Desktop + Responsive Mobile)
// High-fidelity Oxford Quality visual design with full-bleed campus background
// ==============================================================================

import React from 'react';
import { ShieldCheck, Award, GraduationCap, Building2 } from 'lucide-react';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100/80 selection:bg-blue-100 selection:text-blue-900">
      {/* ---------------------------------------------------------------------- */}
      {/* Left Column: Full-Bleed Atmospheric Campus Showcase (Desktop only) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#012147] text-white flex-col justify-between p-10 xl:p-14 overflow-hidden">
        {/* Full-bleed Architectural Campus Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: "url('/assets/kapla-pham-hung.png')" }}
        />
        {/* Deep Brand Gradient Overlay for Pristine Legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#012147]/95 via-[#012147]/85 to-[#043264]/92 backdrop-blur-[1px]" />

        {/* Ambient Subtle Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#026fd7]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header — Clean Logo Placement on Dark Navy (No White Box) */}
        <div className="relative z-10 flex items-center gap-3.5">
          <img
            src="/assets/kapla-logo-color.png"
            alt="KAPLA Logo"
            className="h-10 xl:h-12 w-auto object-contain drop-shadow-md"
          />
          <div className="h-7 w-px bg-white/20" />
          <div>
            <span className="font-display text-xs xl:text-sm font-bold tracking-tight text-white block uppercase">
              Staff Portal
            </span>
            <span className="text-[11px] text-sky-200 font-medium tracking-wide">
              {t('brand.portalSubtitle', 'Hệ Thống Quản Trị Học Vụ & Chăm Sóc Học Viên')}
            </span>
          </div>
        </div>

        {/* Core Value Pillars & Visual Campus Showcase */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          {/* Oxford Quality Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs">
            <Award className="w-4 h-4 text-amber-300" />
            <span>{t('brand.oxfordBadge', 'Độc quyền chuẩn Oxford Quality')}</span>
          </div>

          <h1 className="font-display text-2xl xl:text-4xl font-extrabold leading-tight text-white tracking-tight">
            {t('brand.heroHeadline', 'Đồng hành cùng học viên bứt phá tiềm năng Anh ngữ.')}
          </h1>

          <p className="text-slate-300 text-xs xl:text-sm leading-relaxed font-light">
            {t('brand.heroDesc', 'Nền tảng tác nghiệp nội bộ dành riêng cho đội ngũ Quản lý cơ sở (CM), Giám đốc học thuật, Giáo viên chính, HRT và Chăm sóc khách hàng trong việc theo dõi học tập, can thiệp kịp thời và gắn kết phụ huynh.')}
          </p>

          {/* Glassmorphism Key Academic Credentials */}
          <div className="space-y-3 pt-2">
            {/* Campus Highlight */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/10 transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-[#026fd7] text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">
                    {language === 'en' ? 'Flagship Campuses • HCMC' : 'Hệ Thống 02 Cơ Sở Đào Tạo Quốc Tế'}
                  </p>
                  <span className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {language === 'en' ? 'Active' : 'Hoạt động'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-tight mt-1">
                  {language === 'en'
                    ? 'Pham Hung (Dist. 8) & Nguyen Thi Thap (Dist. 7) — Oxford Interactive Classrooms & STEAM Labs.'
                    : 'Phạm Hùng (Q.8) & Nguyễn Thị Thập (Q.7) — Phòng học tương tác thông minh, Thư viện Oxford và Xưởng Robotics.'}
                </p>
              </div>
            </div>

            {/* Academic Quality */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/10 transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">
                  {language === 'en' ? '100% Oxford Quality Certified Academic Staff' : '100% Giảng Viên & Quản Lý Học Thuật Chuẩn Oxford'}
                </p>
                <p className="text-[11px] text-slate-300 leading-tight mt-1">
                  {language === 'en'
                    ? 'Standardized 4-skill rubrics, 1-on-1 personalized interventions, and periodic progress monitoring.'
                    : 'Khung đánh giá 4 kỹ năng chuẩn hóa, lộ trình phụ đạo cá nhân hóa và báo cáo học tập định kỳ.'}
                </p>
              </div>
            </div>

            {/* Enterprise Security */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg hover:bg-white/10 transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-white/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">
                  {language === 'en' ? 'Enterprise Multi-Branch Row-Level Security' : 'Bảo Mật Phân Quyền Đa Cơ Sở & Vai Trò (RLS)'}
                </p>
                <p className="text-[11px] text-slate-300 leading-tight mt-1">
                  {language === 'en'
                    ? 'Student profiles, tuition records, and audit logs strictly isolated by campus assignment.'
                    : 'Hồ sơ học viên, thông tin học phí và nhật ký tác nghiệp được phân quyền độc lập theo từng chi nhánh.'}
                </p>
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
            {/* Mobile Logo with Dark Navy Text */}
            <div className="lg:hidden flex items-center">
              <img
                src="/assets/kapla-logo-dark.png"
                alt="KAPLA Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold bg-blue-50 text-[#026fd7] px-2.5 py-1 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#026fd7]" />
              {t('brand.internalTag', 'Cổng thông tin nội bộ')}
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
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md shadow-slate-200/50 p-6 sm:p-8 backdrop-blur-sm">
          {children}
        </div>
      </div>
    </div>
  );
};
