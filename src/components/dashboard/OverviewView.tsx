// ==============================================================================
// KAPLA Staff Portal — Academic Command & Operations Overview
// High-fidelity Oxford Quality visual design with live operational feed
// ==============================================================================

import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  MessageSquareHeart,
  CalendarClock,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertCircle,
  FileQuestion,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  BookOpen,
  PhoneCall,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { DashboardNavSection } from '../../types';
import { RoleBadgeIcon, DuotoneContainer } from '../common/CustomIcons';

interface OverviewViewProps {
  onNavigate: (section: DashboardNavSection) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { currentBranch, profile, activeRole } = useAuth();
  const { t, language } = useLanguage();

  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'error' | 'empty'>('normal');

  if (demoState === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-56 bg-slate-200 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl" />
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setDemoState('normal')}
            className="text-xs text-[#026fd7] underline font-medium"
          >
            {language === 'en' ? 'Exit Skeleton Loading View' : 'Quay lại giao diện chuẩn'}
          </button>
        </div>
      </div>
    );
  }

  if (demoState === 'error') {
    return (
      <div className="bg-white rounded-3xl border border-red-200 p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-display text-base font-bold text-slate-900">
          {language === 'en' ? 'Unable to load campus data' : 'Không thể tải dữ liệu chi nhánh'}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {language === 'en'
            ? 'Network timeout or session expired. Please verify your connection.'
            : 'Đã xảy ra lỗi kết nối với máy chủ dữ liệu hoặc phiên làm việc đã hết hạn. Vui lòng kiểm tra lại đường truyền mạng.'}
        </p>
        <button
          type="button"
          onClick={() => setDemoState('normal')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-all"
        >
          {language === 'en' ? 'Retry Connection' : 'Thử lại kết nối'}
        </button>
      </div>
    );
  }

  if (demoState === 'empty') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-sm">
        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h3 className="font-display text-base font-bold text-slate-900">
          {language === 'en' ? 'No students enrolled at this campus' : 'Chưa có hồ sơ học viên tại chi nhánh'}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {language === 'en'
            ? 'This campus has been freshly registered. Please enroll students to activate real-time tracking.'
            : 'Chi nhánh này mới được khởi tạo và chưa có học viên nào được ghi danh. Vui lòng thêm học viên đầu tiên để kích hoạt dashboard.'}
        </p>
        <button
          type="button"
          onClick={() => setDemoState('normal')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#026fd7] bg-blue-50 hover:bg-blue-100 transition-all"
        >
          {language === 'en' ? 'Restore Campus View' : 'Khôi phục hiển thị'}
        </button>
      </div>
    );
  }

  // Live Academic Activity Stream items
  const academicActivities = [
    {
      id: 1,
      type: 'intervention',
      student: 'Nguyễn Minh Khang',
      class: 'Oxford-Starters-01',
      actionVi: 'Đã hoàn thành buổi can thiệp phát âm cùng Lead Teacher Sarah',
      actionEn: 'Completed 1-on-1 phonics intervention session with Lead Teacher Sarah',
      timeVi: '15 phút trước',
      timeEn: '15 mins ago',
      badgeVi: 'Học vụ hoàn tất',
      badgeEn: 'Intervention Done',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: BookOpen,
      iconVariant: 'emerald' as const,
    },
    {
      id: 2,
      type: 'care',
      student: 'Lê Bảo Nam',
      class: 'Oxford-Starters-02',
      actionVi: 'HRT Mai đã ghi nhận cuộc gọi PH: Phụ huynh đồng thuận kế hoạch bồi dưỡng ngữ điệu 1:1',
      actionEn: 'HRT Mai completed parent call: Parent approved 1-on-1 intonation support plan',
      timeVi: '42 phút trước',
      timeEn: '42 mins ago',
      badgeVi: 'Chăm sóc PH',
      badgeEn: 'Parent Care',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: PhoneCall,
      iconVariant: 'purple' as const,
    },
    {
      id: 3,
      type: 'approval',
      student: 'Đỗ Hải Đăng',
      class: 'Oxford-Movers-01',
      actionVi: 'CM Trần Hoàng đã ký duyệt phiếu can thiệp HT-2026-004 (Đã tái đánh giá đạt)',
      actionEn: 'CM Tran Hoang signed & verified intervention HT-2026-004 (Re-assessment Passed)',
      timeVi: '2 giờ trước',
      timeEn: '2 hours ago',
      badgeVi: 'CM Duyệt',
      badgeEn: 'CM Verified',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: ShieldCheck,
      iconVariant: 'blue' as const,
    },
    {
      id: 4,
      type: 'renewal',
      student: 'Hoàng Anh Thư',
      class: 'Oxford-Flyers-02',
      actionVi: 'Gia hạn thành công gói học phí 6 tháng — Trạng thái: Đã tái tục niên khóa mới',
      actionEn: 'Tuition renewal completed for 6-month term — Status: Re-enrolled',
      timeVi: 'Hôm nay, 09:30',
      timeEn: 'Today, 09:30 AM',
      badgeVi: 'Tái tục thành công',
      badgeEn: 'Renewed',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: TrendingUp,
      iconVariant: 'emerald' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* Immersive Campus Command Hero Banner (With Real Campus Background) */}
      {/* -------------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden text-white shadow-xl bg-[#012147]">
        {/* Real Campus Background Image with Subtle Parallax/Zoom */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: "url('/assets/kapla-pham-hung.png')" }}
        />
        {/* Layered Rich Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#012147]/95 via-[#012147]/85 to-[#043264]/90 backdrop-blur-[0.5px]" />

        {/* Ambient Subtle Glow Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Campus Operational Status Badge */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('overview.campusHeroStatus', 'Cơ sở chuẩn Oxford Quality • Đang vận hành')}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-sky-200 text-xs font-medium border border-white/10">
                <Building2 className="w-3.5 h-3.5" />
                <span>{currentBranch?.name || (language === 'en' ? 'All Campuses' : 'Hệ Thống Toàn Cơ Sở')}</span>
              </span>
            </div>

            {/* Personalized Greeting */}
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {language === 'en'
                  ? `Welcome back, ${profile?.full_name || 'Educator'}!`
                  : `Xin chào, ${profile?.full_name || 'Thầy/Cô'}!`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed font-light">
                {language === 'en'
                  ? `Center Operations Console running with role-based isolation (${activeRole || 'Staff'}). All student interventions and care logs synchronized in real time.`
                  : `Hệ thống phân quyền học vụ đang vận hành theo vai trò ${activeRole || 'Nhân sự'}. Mọi tiến độ can thiệp, phản hồi phụ huynh và nhắc học phí được cập nhật tự động.`}
              </p>
            </div>

            {/* Campus Highlights Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-white">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('overview.campusHeroAttendance', 'Chuyên cần: 96.8%')}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-white">
                <Sparkles className="w-3.5 h-3.5 text-sky-300" />
                <span>{t('overview.campusHeroSatisfaction', 'Hài lòng: 4.9/5.0')}</span>
              </div>
            </div>
          </div>

          {/* Quick User Role Profile Summary Card */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 self-start lg:self-auto min-w-[240px] shadow-lg">
            <div className="flex items-center gap-3">
              <RoleBadgeIcon role={profile?.system_role || 'customer_service'} size="md" />
              <div>
                <p className="text-xs font-bold text-white leading-tight">{profile?.full_name}</p>
                <p className="text-[10px] text-sky-200 uppercase tracking-wider font-semibold mt-0.5">
                  {profile?.system_role || 'Staff Member'}
                </p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-slate-300">
              <span>{language === 'en' ? 'Active Assignment' : 'Nhiệm vụ'}</span>
              <span className="text-white font-medium">{currentBranch?.code || 'KAPLA-PH'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* KPI Highlight Metrics with Custom Duotone Badges & Smooth Lift */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">{t('overview.kpiStudents', 'Tổng học viên theo dõi')}</span>
            <DuotoneContainer icon={Users} variant="blue" size="sm" className="group-hover:scale-110" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-slate-900">48</span>
            <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              {language === 'en' ? '+4 this month' : '+4 tháng này'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{language === 'en' ? 'Enrolled at campus' : 'Ghi danh chính thức'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('interventions')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">{t('overview.kpiInterventions', 'Rủi ro học thuật cần can thiệp')}</span>
            <DuotoneContainer icon={AlertTriangle} variant="amber" size="sm" className="group-hover:scale-110" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-amber-600">3</span>
            <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-semibold">
              {t('overview.kpiInterventionsBadge', 'Cần xác minh')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{language === 'en' ? '2 In Progress, 1 Pending CM' : '2 Đang xử lý, 1 Chờ CM duyệt'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('feedback')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">{t('overview.kpiFeedback', 'Phản hồi phụ huynh đang mở')}</span>
            <DuotoneContainer icon={MessageSquareHeart} variant="purple" size="sm" className="group-hover:scale-110" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-slate-900">2</span>
            <span className="text-[11px] text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md font-semibold">
              {t('overview.kpiFeedbackBadge', 'Rèn luyện phát âm Oxford')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{language === 'en' ? '1 Support Received, 1 HRT' : '1 CSKH nhận, 1 HRT hỗ trợ'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
          </p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate('renewal')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">{t('overview.kpiRenewal', 'Học phí sắp hết hạn')}</span>
            <DuotoneContainer icon={CalendarClock} variant="rose" size="sm" className="group-hover:scale-110" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-rose-600">5</span>
            <span className="text-[11px] text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md font-semibold">
              {t('overview.kpiRenewalBadge', 'Chăm sóc gia hạn khóa')}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{language === 'en' ? 'HRT reminder email scheduled' : 'Đã lên lịch email nhắc HRT'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Quick Academic Actions & Workflows */}
      {/* -------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">
              {t('overview.quickActionsTitle', 'Tác vụ tác nghiệp học vụ nhanh')}
            </h3>
            <p className="text-[11px] text-slate-500">
              {t('overview.quickActionsSub', 'Truy cập tức thì các quy trình chăm sóc và can thiệp chuyên môn')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1 */}
          <div
            onClick={() => onNavigate('interventions')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-start gap-3.5 group"
          >
            <DuotoneContainer icon={AlertTriangle} variant="amber" size="md" className="group-hover:scale-105" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#026fd7] transition-colors truncate">
                  {t('overview.quickActionIntervention', 'Lập kế hoạch can thiệp học thuật')}
                </h4>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#026fd7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {t('overview.quickActionInterventionDesc', 'Mở phiếu hỗ trợ học sinh có nguy cơ học vụ và giao giáo viên phụ đạo.')}
              </p>
            </div>
          </div>

          {/* Action 2 */}
          <div
            onClick={() => onNavigate('supplementary')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-start gap-3.5 group"
          >
            <DuotoneContainer icon={GraduationCap} variant="blue" size="md" className="group-hover:scale-105" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#026fd7] transition-colors truncate">
                  {t('overview.quickActionTutoring', 'Lên lịch phụ đạo 1:1 chuyên sâu')}
                </h4>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#026fd7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {t('overview.quickActionTutoringDesc', 'Bổ trợ phát âm Oxford, ngữ điệu và phản xạ giao tiếp cho học viên.')}
              </p>
            </div>
          </div>

          {/* Action 3 */}
          <div
            onClick={() => onNavigate('feedback')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex items-start gap-3.5 group"
          >
            <DuotoneContainer icon={MessageSquareHeart} variant="purple" size="md" className="group-hover:scale-105" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#026fd7] transition-colors truncate">
                  {t('overview.quickActionFeedback', 'Ghi nhận phản hồi phụ huynh')}
                </h4>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#026fd7] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {t('overview.quickActionFeedbackDesc', 'Tiếp nhận nguyện vọng, đồng hành cùng gia đình và xử lý phản hồi kịp thời.')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Real-Time Academic Operations & Care Stream */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <DuotoneContainer icon={Clock} variant="navy" size="sm" />
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                {t('overview.activityFeedTitle', 'Nhật ký tác nghiệp học thuật thời gian thực')}
              </h3>
              <p className="text-[11px] text-slate-500">
                {t('overview.activityFeedSub', 'Cập nhật trực tiếp tiến độ can thiệp, phụ đạo và chăm sóc phụ huynh tại cơ sở')}
              </p>
            </div>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t('overview.activityFeedBadge', 'Hôm nay')}
          </span>
        </div>

        {/* Timeline Events */}
        <div className="divide-y divide-slate-100">
          {academicActivities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                className="py-3.5 flex items-start gap-3.5 hover:bg-slate-50/80 -mx-3 px-3 rounded-xl transition-all duration-200"
              >
                <DuotoneContainer icon={Icon} variant={act.iconVariant} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{act.student}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                        {act.class}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {language === 'en' ? act.timeEn : act.timeVi}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {language === 'en' ? act.actionEn : act.actionVi}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 hidden sm:inline-block ${act.badgeColor}`}
                >
                  {language === 'en' ? act.badgeEn : act.badgeVi}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
