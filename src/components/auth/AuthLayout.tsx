// ==============================================================================
// KAPLA Staff Portal — AuthLayout (2-Column Desktop + Responsive Mobile)
// High-fidelity Oxford Quality visual design with full-bleed campus background
// ==============================================================================

import React from 'react';
import { ShieldCheck, Award, GraduationCap, Building2, BookOpen, Cpu, Sparkles } from 'lucide-react';
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
      {/* Left Column: Authentic Oxford Quality Showcase (Desktop only) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#012147] text-white flex-col justify-between p-8 xl:p-12 overflow-hidden">
        {/* Full-bleed Architectural Campus Background Photo */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: "url('/assets/kapla-pham-hung.png')" }}
        />
        {/* Deep Brand Gradient Overlay for Pristine Legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#012147]/95 via-[#012147]/88 to-[#043264]/92 backdrop-blur-[1px]" />

        {/* Ambient Subtle Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#026fd7]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header — Clean Logo Placement on Dark Navy */}
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
              {t('brand.portalSubtitle', 'Cổng Thông Tin Học Vụ & Quản Trị Trung Tâm')}
            </span>
          </div>
        </div>

        {/* Core Value Pillars & Authentic Educational Credentials */}
        <div className="relative z-10 my-auto py-6 space-y-4 max-w-lg">
          {/* Oxford Quality Accreditation Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide backdrop-blur-md shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('brand.oxfordBadge', 'Chứng nhận Oxford Quality 2025–2028 • Oxford University Press')}</span>
          </div>

          <div>
            <h1 className="font-display text-2xl xl:text-3.5xl font-extrabold leading-tight text-white tracking-tight">
              {language === 'en' ? (
                <>
                  KAPLA — American Creative English{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-amber-200 to-amber-400 block mt-0.5">
                    with Oxford Quality Standards
                  </span>
                </>
              ) : (
                <>
                  KAPLA — Tiếng Anh Sáng Tạo Mỹ{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-amber-200 to-amber-400 block mt-0.5">
                    chuẩn Oxford Quality
                  </span>
                </>
              )}
            </h1>
            <p className="text-slate-300 text-xs xl:text-sm leading-relaxed font-light mt-2.5">
              {t(
                'brand.heroDesc',
                'Hệ thống tiếng Anh duy nhất tại Việt Nam đạt 03 chứng nhận uy tín toàn cầu: Oxford Quality, Emerging Excellence và Cambridge English Qualifications. Chương trình phát triển toàn diện chuẩn CCSS & NGSS của Mỹ kết hợp Lập trình Robotics.'
              )}
            </p>
          </div>

          {/* Authentic Global Accreditation Strip */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-950/40 to-slate-900/60 border border-white/15 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[11px] font-bold tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {language === 'en' ? '03 Prestigious Global Accreditations' : '03 Chứng Nhận Học Thuật Toàn Cầu'}
              </span>
              <span className="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {language === 'en' ? 'Official Partner' : 'Đối tác chính thức'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              {/* Oxford Quality */}
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center hover:bg-white/10 transition-all">
                <img
                  src="/assets/oxford-quality-certificate.png"
                  alt="Oxford Quality"
                  className="h-8 w-auto object-contain rounded drop-shadow"
                />
                <span className="text-[11px] font-bold text-white mt-1.5">Oxford Quality</span>
                <span className="text-[9px] text-slate-300 leading-tight">2025 – 2028</span>
              </div>

              {/* Cambridge English */}
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center hover:bg-white/10 transition-all">
                <img
                  src="/assets/cambridge-qualification.png"
                  alt="Cambridge English"
                  className="h-8 w-auto object-contain rounded drop-shadow"
                />
                <span className="text-[11px] font-bold text-white mt-1.5">Cambridge</span>
                <span className="text-[9px] text-slate-300 leading-tight">Bronze Centre</span>
              </div>

              {/* NatGeo / Emerging Excellence */}
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center hover:bg-white/10 transition-all">
                <img
                  src="/assets/partner-emerging-excellence.png"
                  alt="Emerging Excellence"
                  className="h-8 w-auto object-contain rounded drop-shadow"
                />
                <span className="text-[11px] font-bold text-white mt-1.5">NatGeo Learning</span>
                <span className="text-[9px] text-slate-300 leading-tight">Excellence Partner</span>
              </div>
            </div>
          </div>

          {/* Key Impact Stats Bento Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="font-display text-2xl font-black text-amber-300 tracking-tight">03</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {t('brand.statAccreditationLabel', 'Chứng nhận Toàn cầu')}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {t('brand.statAccreditationSub', 'Oxford • Cambridge • NatGeo')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="font-display text-2xl font-black text-sky-300 tracking-tight">15/15</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {t('brand.statCambridgeLabel', 'Khiên Cambridge')}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {t('brand.statCambridgeSub', 'Starters • Movers • Flyers')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="font-display text-2xl font-black text-emerald-300 tracking-tight">11</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {t('brand.statCentresLabel', 'Trung tâm Hoạt động')}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {t('brand.statCentresSub', 'TP.HCM & Bình Dương')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="font-display text-2xl font-black text-indigo-300 tracking-tight">100%</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {t('brand.statSteamLabel', 'Chuẩn CCSS & NGSS Mỹ')}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {t('brand.statSteamSub', 'Tích hợp Lập trình Robotics')}
              </div>
            </div>
          </div>

          {/* Authentic Curriculum Highlights */}
          <div className="space-y-2 pt-0.5">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-sky-300 flex items-center justify-center shrink-0 border border-sky-400/20">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {t('brand.featureOxfordTitle', 'Lớp học không bàn ghế chuẩn Oxford Quality')}
                </p>
                <p className="text-[11px] text-slate-300 truncate">
                  {t(
                    'brand.featureOxfordDesc',
                    'Phương pháp Big Question Learning — kích hoạt tư duy chủ động và rèn luyện kỹ năng 4C.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-400/20">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {t('brand.featureSteamTitle', 'Hệ sinh thái STEAM & Robotics chuẩn Mỹ')}
                </p>
                <p className="text-[11px] text-slate-300 truncate">
                  {t(
                    'brand.featureSteamDesc',
                    'Phòng Lab lập trình hiện đại, tích hợp Khoa học máy tính & Toán Kangaroo (IKMC).'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Campus Network Ticker */}
          <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 pt-0.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">
              {t(
                'brand.campusTicker',
                'Mạng lưới 11 trung tâm: KAPLA Phạm Hùng • Bình Tân • Tân Kỳ Tân Quý • Bàu Cát • Nguyễn Văn Lượng • Dĩ An...'
              )}
            </span>
          </p>
        </div>

        {/* Footer Credit */}
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
