// ==============================================================================
// KAPLA Staff Portal — AuthLayout (2-Column Desktop + Responsive Mobile)
// High-fidelity Oxford Quality visual design with full-bleed campus background
// ==============================================================================

import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  GraduationCap,
  Building2,
  BookOpen,
  Cpu,
  Sparkles,
  ZoomIn,
  X,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

interface AccreditationCert {
  id: string;
  title: string;
  subtitleVi: string;
  subtitleEn: string;
  short: string;
  year: string;
  image: string;
  issuer: string;
  accentBorder: string;
  tagColor: string;
}

const GLOBAL_ACCREDITATIONS: AccreditationCert[] = [
  {
    id: 'oxford',
    title: 'Oxford Quality Programme',
    subtitleVi: 'Chứng nhận kiểm định độc quyền từ Nhà xuất bản Đại học Oxford (Oxford University Press) 2025–2028.',
    subtitleEn: 'Exclusive Oxford Quality Certification by Oxford University Press (2025–2028).',
    short: 'Oxford Quality',
    year: '2025 – 2028',
    image: '/assets/oxford-quality-certificate.png',
    issuer: 'Oxford University Press',
    accentBorder: 'hover:border-amber-400 group-hover:border-amber-400/80',
    tagColor: 'text-amber-300',
  },
  {
    id: 'cambridge',
    title: 'Cambridge English Qualifications',
    subtitleVi: 'Trung tâm luyện thi Cambridge Bronze Preparation Centre — Chuẩn hóa YLE 15/15 khiên & KET/PET.',
    subtitleEn: 'Cambridge Bronze Preparation Centre — Standardized YLE 15/15 shields & KET/PET.',
    short: 'Cambridge English',
    year: 'Bronze Centre',
    image: '/assets/cambridge-qualification.png',
    issuer: 'Cambridge Assessment English',
    accentBorder: 'hover:border-sky-400 group-hover:border-sky-400/80',
    tagColor: 'text-sky-300',
  },
  {
    id: 'natgeo',
    title: 'Partner of Emerging Excellence',
    subtitleVi: 'Đối tác học thuật quốc tế cùng National Geographic Learning và Oxford University Press.',
    subtitleEn: 'Global Academic Partner with National Geographic Learning & Oxford University Press.',
    short: 'NatGeo Learning',
    year: 'Emerging Excellence',
    image: '/assets/partner-emerging-excellence.png',
    issuer: 'National Geographic Learning & Oxford',
    accentBorder: 'hover:border-emerald-400 group-hover:border-emerald-400/80',
    tagColor: 'text-emerald-300',
  },
];

const BACKGROUND_OPTIONS = [
  { id: 'pham_hung', nameVi: 'KAPLA Phạm Hùng', nameEn: 'Pham Hung Campus', src: '/assets/kapla-pham-hung.png' },
  { id: 'binh_tan', nameVi: 'KAPLA Bình Tân', nameEn: 'Binh Tan Campus', src: '/assets/kapla-binh-tan.jpg' },
  { id: 'oxford_room', nameVi: 'Phòng học Oxford', nameEn: 'Oxford Classroom', src: '/assets/kapla-english-room.jpg' },
];

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { t, language } = useLanguage();
  const [activeBg, setActiveBg] = useState<string>('/assets/kapla-pham-hung.png');
  const [selectedCert, setSelectedCert] = useState<AccreditationCert | null>(null);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-100/80 selection:bg-blue-100 selection:text-blue-900">
      {/* ---------------------------------------------------------------------- */}
      {/* Left Column: Authentic Oxford Quality Showcase (Desktop only) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#012147] text-white flex-col justify-between p-8 xl:p-12 overflow-hidden">
        {/* Full-bleed Characteristic KAPLA Campus Background Photo (Clear & Vivid) */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-65 scale-105 transition-all duration-700 ease-out"
          style={{ backgroundImage: `url('${activeBg}')` }}
        />
        {/* Translucent Brand Gradient for Vivid Imagery & Pristine Legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#012147]/80 via-[#012147]/65 to-[#043264]/75 backdrop-blur-[0.5px]" />

        {/* Ambient Subtle Glow Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#026fd7]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header & Campus Photo Switcher */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
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

          {/* Interactive Characteristic Background Switcher */}
          <div className="flex items-center gap-1 bg-black/40 border border-white/15 p-1 rounded-xl backdrop-blur-md shadow-xs">
            <ImageIcon className="w-3 h-3 text-sky-300 ml-1.5 mr-0.5" />
            {BACKGROUND_OPTIONS.map((bg) => {
              const isActive = activeBg === bg.src;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setActiveBg(bg.src)}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={language === 'en' ? `Show ${bg.nameEn}` : `Xem ${bg.nameVi}`}
                >
                  {language === 'en' ? bg.nameEn : bg.nameVi}
                </button>
              );
            })}
          </div>
        </div>

        {/* Core Value Pillars & Authentic Educational Credentials */}
        <div className="relative z-10 my-auto py-6 space-y-4 max-w-lg">
          {/* Oxford Quality Accreditation Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-semibold tracking-wide backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('brand.oxfordBadge', 'Chứng nhận Oxford Quality 2025–2028 • Oxford University Press')}</span>
          </div>

          <div>
            <h1 className="font-display text-2xl xl:text-3.5xl font-extrabold leading-tight text-white tracking-tight drop-shadow-sm">
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
            <p className="text-slate-200 text-xs xl:text-sm leading-relaxed font-normal mt-2 drop-shadow-xs">
              {t(
                'brand.heroDesc',
                'Hệ thống tiếng Anh duy nhất tại Việt Nam đạt 03 chứng nhận uy tín toàn cầu: Oxford Quality, Emerging Excellence và Cambridge English Qualifications. Chương trình phát triển toàn diện chuẩn CCSS & NGSS của Mỹ kết hợp Lập trình Robotics.'
              )}
            </p>
          </div>

          {/* Authentic Global Accreditation Strip with Hover Zoom & Click Fullscreen */}
          <div className="p-3.5 rounded-2xl bg-[#001733]/70 border border-white/20 backdrop-blur-xl shadow-xl">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-[11px] font-bold tracking-wider text-amber-300 uppercase flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {language === 'en' ? '03 Global Accreditations (Hover to Preview)' : '03 Chứng Nhận Học Thuật Toàn Cầu'}
              </span>
              <span className="text-[10px] text-sky-200 font-medium flex items-center gap-1">
                <ZoomIn className="w-3 h-3 text-sky-300" />
                {language === 'en' ? 'Hover to Zoom / Click to Expand' : 'Rê chuột để phóng to • Bấm để xem'}
              </span>
            </div>

            {/* 3 Interactive Certificate Zoom Cards */}
            <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
              {GLOBAL_ACCREDITATIONS.map((cert) => (
                <div
                  key={cert.id}
                  onClick={() => setSelectedCert(cert)}
                  className={`group relative p-2.5 rounded-xl bg-white/10 border border-white/15 flex flex-col items-center cursor-pointer transition-all duration-300 hover:bg-white/20 hover:scale-[1.03] ${cert.accentBorder} shadow-sm`}
                >
                  {/* Floating Enlarge Preview Tooltip on Hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 hidden group-hover:flex flex-col items-center z-50 pointer-events-none transition-all duration-300 animate-in fade-in zoom-in-95">
                    <div className="w-72 sm:w-80 rounded-2xl overflow-hidden border-2 border-amber-300/90 shadow-2xl shadow-black/90 bg-[#001733] p-2 ring-1 ring-white/20 text-left">
                      <div className="relative overflow-hidden rounded-xl bg-slate-900 aspect-video flex items-center justify-center">
                        <img
                          src={cert.image}
                          alt={cert.title}
                          className="w-full h-full object-contain rounded-lg transition-transform duration-500 scale-100 group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-300 border border-amber-400/40 flex items-center gap-1">
                          <Maximize2 className="w-3 h-3" />
                          <span>{language === 'en' ? 'Click to open' : 'Bấm phóng to'}</span>
                        </div>
                      </div>
                      <div className="p-2 pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${cert.tagColor}`}>{cert.title}</span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300 font-mono">
                            {cert.year}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-snug mt-1">
                          {language === 'en' ? cert.subtitleEn : cert.subtitleVi}
                        </p>
                      </div>
                    </div>
                    {/* Tooltip triangle */}
                    <div className="w-3 h-3 bg-[#001733] rotate-45 -mt-1.5 border-r-2 border-b-2 border-amber-300/90" />
                  </div>

                  {/* Thumbnail and Title */}
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900/60 flex items-center justify-center border border-white/10">
                    <img
                      src={cert.image}
                      alt={cert.title}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 p-1 rounded-md text-white">
                      <ZoomIn className="w-3 h-3" />
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-white mt-1.5 truncate max-w-full">
                    {cert.short}
                  </span>
                  <span className="text-[9px] text-slate-300 leading-tight truncate max-w-full mt-0.5">
                    {cert.year}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Impact Stats Bento Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#001733]/65 border border-white/15 backdrop-blur-md hover:bg-[#001733]/85 transition-all">
              <div className="font-display text-2xl font-black text-amber-300 tracking-tight">03</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {t('brand.statAccreditationLabel', 'Chứng nhận Toàn cầu')}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {t('brand.statAccreditationSub', 'Oxford • Cambridge • NatGeo')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#001733]/65 border border-white/15 backdrop-blur-md hover:bg-[#001733]/85 transition-all">
              <div className="font-display text-2xl font-black text-sky-300 tracking-tight">15/15</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {t('brand.statCambridgeLabel', 'Khiên Cambridge')}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {t('brand.statCambridgeSub', 'Starters • Movers • Flyers')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#001733]/65 border border-white/15 backdrop-blur-md hover:bg-[#001733]/85 transition-all">
              <div className="font-display text-2xl font-black text-emerald-300 tracking-tight">11</div>
              <div className="text-xs font-semibold text-white mt-0.5">
                {t('brand.statCentresLabel', 'Trung tâm Hoạt động')}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {t('brand.statCentresSub', 'TP.HCM & Bình Dương')}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#001733]/65 border border-white/15 backdrop-blur-md hover:bg-[#001733]/85 transition-all">
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
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#001733]/65 border border-white/15 backdrop-blur-md text-xs">
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

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#001733]/65 border border-white/15 backdrop-blur-md text-xs">
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
          <p className="text-[10px] text-slate-300 font-medium flex items-center gap-1.5 pt-0.5">
            <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
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
      {/* Lightbox Modal: Fullscreen Certificate Viewer */}
      {/* ---------------------------------------------------------------------- */}
      {selectedCert && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedCert(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-900 border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${selectedCert.tagColor}`}>
                  {selectedCert.issuer}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  {selectedCert.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {language === 'en' ? selectedCert.subtitleEn : selectedCert.subtitleVi}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 transition-colors"
                title="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Display */}
            <div className="relative bg-black rounded-xl overflow-hidden border border-slate-800 aspect-video flex items-center justify-center p-2">
              <img
                src={selectedCert.image}
                alt={selectedCert.title}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'en' ? 'Official Academic Accreditation • Verified' : 'Chứng nhận đào tạo chính thức • Đã xác thực'}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                {language === 'en' ? 'Close Viewer' : 'Đóng cửa sổ'}
              </button>
            </div>
          </div>
        </div>
      )}

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
