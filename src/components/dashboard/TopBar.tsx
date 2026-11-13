// ==============================================================================
// KAPLA Staff Dashboard — TopBar Component with Bilingual Support
// ==============================================================================

import React, { useState, useMemo } from 'react';
import {
  Menu,
  Building2,
  ChevronDown,
  ShieldCheck,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';
import { DashboardNavSection } from '../../types';

interface TopBarProps {
  activeSection: DashboardNavSection;
  onOpenMobileMenu: () => void;
  onRefreshData?: () => void;
  refreshing?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onOpenMobileMenu,
  onRefreshData,
  refreshing = false,
}) => {
  const {
    profile,
    currentBranch,
    availableBranches,
    activeRole,
    switchBranch,
    refreshProfile,
    signOut,
  } = useAuth();
  const { t } = useLanguage();

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sectionMeta = useMemo(() => {
    switch (activeSection) {
      case 'overview':
        return {
          title: t('topbar.overviewTitle', 'Tổng quan học vụ & Tiến độ'),
          subtitle: t('topbar.overviewSub', 'Theo dõi tổng thể học viên, mức độ rủi ro và các mốc can thiệp.'),
        };
      case 'students':
        return {
          title: t('topbar.studentsTitle', 'Hồ sơ học viên (Student Records)'),
          subtitle: t('topbar.studentsSub', 'Quản lý thông tin học tập, phân công HRT và hạn phí học viên.'),
        };
      case 'care_tasks':
        return {
          title: t('topbar.careTasksTitle', 'Công việc HRT (Care Worklist)'),
          subtitle: t('topbar.careTasksSub', 'Nhiệm vụ chăm sóc học viên theo quy tắc ưu tiên HRT riêng.'),
        };
      case 'assessments':
        return {
          title: t('topbar.assessmentsTitle', 'Đánh giá năng lực 4 kỹ năng'),
          subtitle: t('topbar.assessmentsSub', 'Ghi nhận Nghe - Nói - Đọc - Viết theo chuẩn Cambridge & Oxford Quality.'),
        };
      case 'interventions':
        return {
          title: t('topbar.interventionsTitle', 'Phiếu can thiệp học thuật (Academic Interventions)'),
          subtitle: t('topbar.interventionsSub', 'Theo dõi kế hoạch khắc phục, hạn xử lý và xác minh kết quả.'),
        };
      case 'feedback':
        return {
          title: t('topbar.feedbackTitle', 'Phản hồi & Kỳ vọng phụ huynh (Parent Feedback)'),
          subtitle: t('topbar.feedbackSub', 'Ghi nhận và điều phối giải quyết khiếu nại, góp ý từ phụ huynh.'),
        };
      case 'supplementary':
        return {
          title: t('topbar.supplementaryTitle', 'Lớp học bổ trợ (Supplementary Tutoring)'),
          subtitle: t('topbar.supplementarySub', 'Theo dõi điểm danh, nội dung bổ trợ và nhận xét sự tiến bộ.'),
        };
      case 'renewal':
        return {
          title: t('topbar.renewalTitle', 'Quản lý tái tục & Rủi ro học phí'),
          subtitle: t('topbar.renewalSub', 'Cảnh báo hạn tái tục, hỗ trợ chăm sóc phụ huynh trước hạn.'),
        };
      case 'staff_roles':
        return {
          title: t('topbar.staffRolesTitle', 'Quản trị nhân sự & Phân quyền'),
          subtitle: t('topbar.staffRolesSub', 'Phê duyệt tài khoản mới, phân bổ vai trò và chi nhánh công tác.'),
        };
      case 'branches_classes':
        return {
          title: t('topbar.branchesClassesTitle', 'Chi nhánh & Danh sách lớp học'),
          subtitle: t('topbar.branchesClassesSub', 'Cấu hình chi nhánh hoạt động và thiết lập phân công lớp.'),
        };
      case 'logs':
        return {
          title: t('topbar.logsTitle', 'Nhật ký tác nghiệp (Activity Logs)'),
          subtitle: t('topbar.logsSub', 'Lịch sử tương tác giữa các bộ phận chuyên môn và học viên.'),
        };
      default:
        return {
          title: 'KAPLA Staff Dashboard',
          subtitle: t('brand.portalSubtitle', 'Hệ thống quản lý đào tạo & chăm sóc học viên'),
        };
    }
  }, [activeSection, t]);

  const isSystemAdmin = profile?.system_role === 'system_admin';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* -------------------------------------------------------------------- */}
      {/* Left: Mobile Toggle & Page Title */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="font-display text-base font-bold text-slate-900 leading-tight">
            {sectionMeta.title}
          </h1>
          <p className="text-[11px] text-slate-500 hidden md:block">
            {sectionMeta.subtitle}
          </p>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Right: Language Switcher, Branch Selector, Role Badge & User Profile */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Bilingual Switcher (🇻🇳 Tiếng Việt / 🇺🇸 English (US)) */}
        <LanguageToggle />

        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#043264] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-[#026fd7]" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">
              {currentBranch ? currentBranch.name : t('topbar.selectBranch', 'Chọn chi nhánh')}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {branchDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setBranchDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {isSystemAdmin ? t('topbar.systemBranches', 'Chi nhánh toàn hệ thống') : t('topbar.assignedBranches', 'Chi nhánh phân bổ')}
                </div>
                {availableBranches.map((branch) => {
                  const isSelected = currentBranch?.id === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => {
                        switchBranch(branch.id);
                        setBranchDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? 'font-bold text-[#026fd7] bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block font-medium">{branch.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Mã: {branch.code}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#026fd7] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {profile?.system_role === 'system_admin'
              ? 'Quản trị hệ thống'
              : activeRole || 'Nhân viên'}
          </span>
        </div>

        {/* Refresh Action */}
        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            disabled={refreshing}
            title={t('topbar.refreshData', 'Làm mới dữ liệu')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}

        {/* User Account Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-[#043264] text-white flex items-center justify-center text-xs font-bold">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-40 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {profile?.full_name}
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                    {profile?.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t('topbar.emailVerified', '● Email đã xác thực')}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      refreshProfile();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t('topbar.refreshData', 'Làm mới phiên làm việc')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('auth.logout', 'Đăng xuất')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
