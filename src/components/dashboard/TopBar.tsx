// ==============================================================================
// KAPLA Staff Dashboard — TopBar Component
// ==============================================================================

import React, { useState } from 'react';
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
import { DashboardNavSection } from '../../types';

interface TopBarProps {
  activeSection: DashboardNavSection;
  onOpenMobileMenu: () => void;
  onRefreshData?: () => void;
  refreshing?: boolean;
}

const SECTION_TITLES: Record<DashboardNavSection, { title: string; subtitle: string }> = {
  overview: {
    title: 'Tổng quan học vụ & Tiến độ',
    subtitle: 'Theo dõi tổng thể học viên, mức độ rủi ro và các mốc can thiệp.',
  },
  students: {
    title: 'Hồ sơ học viên (Student Master)',
    subtitle: 'Quản lý thông tin học tập, phân công HRT và hạn phí học viên.',
  },
  care_tasks: {
    title: 'Công việc HRT (Care Worklist)',
    subtitle: 'Nhiệm vụ chăm sóc học viên theo quy tắc ưu tiên HRT riêng.',
  },
  assessments: {
    title: 'Đánh giá năng lực 4 kỹ năng',
    subtitle: 'Ghi nhận Nghe - Nói - Đọc - Viết theo chuẩn Cambridge & Oxford Quality.',
  },
  interventions: {
    title: 'Phiếu can thiệp học thuật',
    subtitle: 'Theo dõi kế hoạch khắc phục, hạn xử lý và xác minh kết quả.',
  },
  feedback: {
    title: 'Phản hồi & Kỳ vọng phụ huynh',
    subtitle: 'Ghi nhận và điều phối giải quyết khiếu nại, góp ý từ phụ huynh.',
  },
  supplementary: {
    title: 'Lớp học bổ trợ (Supplementary)',
    subtitle: 'Theo dõi điểm danh, nội dung bổ trợ và nhận xét sự tiến bộ.',
  },
  renewal: {
    title: 'Quản lý tái tục & Rủi ro học phí',
    subtitle: 'Cảnh báo hạn tái tục, hỗ trợ chăm sóc phụ huynh trước 15 ngày.',
  },
  logs: {
    title: 'Nhật ký tác nghiệp (Follow-up Logs)',
    subtitle: 'Lịch sử tương tác giữa các bộ phận chuyên môn và học viên.',
  },
  staff_roles: {
    title: 'Quản trị nhân sự & Phân quyền',
    subtitle: 'Phê duyệt tài khoản mới, phân bổ vai trò và chi nhánh công tác.',
  },
  branches_classes: {
    title: 'Chi nhánh & Danh sách lớp học',
    subtitle: 'Cấu hình chi nhánh hoạt động và thiết lập phân công lớp.',
  },
};

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

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sectionMeta = SECTION_TITLES[activeSection] || {
    title: 'KAPLA Staff Dashboard',
    subtitle: 'Hệ thống quản lý đào tạo & chăm sóc học viên',
  };

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
      {/* Right: Branch Selector, Role Badge & User Profile Menu */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#043264] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all"
          >
            <Building2 className="w-3.5 h-3.5 text-[#026fd7]" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">
              {currentBranch ? currentBranch.name : 'Chọn chi nhánh'}
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
                  {isSystemAdmin ? 'Chi nhánh toàn hệ thống' : 'Chi nhánh phân bổ'}
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
            title="Làm mới dữ liệu"
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
                    ● Email đã xác thực
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
                    Đồng bộ phiên đăng nhập
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Đăng xuất tài khoản
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
