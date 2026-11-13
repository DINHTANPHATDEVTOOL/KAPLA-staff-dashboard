// ==============================================================================
// KAPLA Staff Dashboard — Sidebar Navigation
// ==============================================================================

import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  AlertTriangle,
  MessageSquareHeart,
  BookOpenCheck,
  CalendarClock,
  History,
  ShieldCheck,
  Building2,
  X,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { DashboardNavSection } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeSection: DashboardNavSection;
  onSelectSection: (section: DashboardNavSection) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  pendingCount?: number;
}

interface NavItem {
  id: DashboardNavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  adminOrCmOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  mobileOpen,
  onCloseMobile,
  pendingCount = 0,
}) => {
  const { profile, activeRole, currentBranch, signOut } = useAuth();
  const isCMOrAdmin = profile?.system_role === 'system_admin' || activeRole === 'CM';

  const navItems: NavItem[] = [
    { id: 'overview', label: 'Tổng quan học vụ', icon: LayoutDashboard },
    { id: 'students', label: 'Hồ sơ học viên', icon: Users },
    { id: 'assessments', label: 'Đánh giá năng lực', icon: ClipboardCheck },
    { id: 'interventions', label: 'Phiếu can thiệp', icon: AlertTriangle },
    { id: 'feedback', label: 'Phản hồi phụ huynh', icon: MessageSquareHeart },
    { id: 'supplementary', label: 'Lớp học bổ trợ', icon: BookOpenCheck },
    { id: 'renewal', label: 'Quản lý tái tục', icon: CalendarClock },
    { id: 'logs', label: 'Nhật ký tác nghiệp', icon: History },
    {
      id: 'staff_roles',
      label: 'Nhân sự & Phân quyền',
      icon: ShieldCheck,
      badge: pendingCount,
      adminOrCmOnly: false, // visible to staff to view team directory, but approval tab is restricted
    },
    {
      id: 'branches_classes',
      label: 'Chi nhánh & Lớp học',
      icon: Building2,
      adminOrCmOnly: false,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#012147] text-slate-200 w-64 xl:w-72 shrink-0 select-none border-r border-[#043264]/40">
      {/* -------------------------------------------------------------------- */}
      {/* Brand Header */}
      {/* -------------------------------------------------------------------- */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#043264]">
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg shadow-sm">
            <img
              src="/assets/kapla-logo-color.png"
              alt="KAPLA Logo"
              className="h-7 w-auto object-contain"
            />
          </div>
          <div>
            <span className="font-display text-sm font-bold tracking-tight text-white block leading-tight">
              KAPLA Staff
            </span>
            <span className="text-[10px] text-sky-200 font-medium tracking-wide truncate block max-w-[140px]">
              {currentBranch?.name || 'Hệ Thống KAPLA'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Đóng thanh điều hướng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Navigation List */}
      {/* -------------------------------------------------------------------- */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectSection(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                isActive
                  ? 'bg-[#026fd7] text-white shadow-sm shadow-[#026fd7]/30'
                  : 'text-slate-300 hover:bg-[#043264]/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* -------------------------------------------------------------------- */}
      {/* Footer Profile & Logout Card */}
      {/* -------------------------------------------------------------------- */}
      <div className="p-3 border-t border-[#043264] bg-[#001733]/60">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-[#026fd7] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
            {profile?.full_name?.charAt(0) || 'K'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">
              {profile?.full_name || 'Nhân viên KAPLA'}
            </p>
            <p className="text-[10px] text-sky-300 truncate mt-0.5">
              {profile?.system_role === 'system_admin'
                ? '👑 Quản trị hệ thống'
                : activeRole || 'Nhân viên'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            title="Đăng xuất"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0">{sidebarContent}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative z-10 flex h-full animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
