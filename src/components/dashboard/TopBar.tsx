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
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LanguageToggle } from '../../context/LanguageContext';
import { RoleBadgeIcon } from '../common/CustomIcons';
import { DashboardNavSection } from '../../types';

interface TopBarProps {
  activeSection: DashboardNavSection;
  onOpenMobileMenu: () => void;
  onRefreshData?: () => void;
  refreshing?: boolean;
  onNavigate?: (section: DashboardNavSection) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onOpenMobileMenu,
  onRefreshData,
  refreshing = false,
  onNavigate,
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
  const { t, tDb, language } = useLanguage();

  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const sectionMeta = useMemo(() => {
    switch (activeSection) {
      case 'overview':
        return {
          title: t('topbar.overviewTitle', 'Academic Overview & Progress'),
          subtitle: t('topbar.overviewSub', 'Track students, risk levels, and intervention milestones.'),
        };
      case 'students':
        return {
          title: t('topbar.studentsTitle', 'Student Records Directory'),
          subtitle: t('topbar.studentsSub', 'Manage student records, HRT assignments, and tuition expiry.'),
        };
      case 'care_tasks':
        return {
          title: t('topbar.careTasksTitle', 'HRT Care Tasks & Worklist'),
          subtitle: t('topbar.careTasksSub', 'Student care follow-up enforcing designated HRT priority.'),
        };
      case 'assessments':
        return {
          title: t('topbar.assessmentsTitle', '4-Skill Competency Assessments'),
          subtitle: t('topbar.assessmentsSub', 'Evaluate Listening, Speaking, Reading, Writing on Cambridge & Oxford scales.'),
        };
      case 'interventions':
        return {
          title: t('topbar.interventionsTitle', 'Academic Interventions & Care Plans'),
          subtitle: t('topbar.interventionsSub', 'Track remediation plans, deadlines, and Head Teacher verification sign-offs.'),
        };
      case 'feedback':
        return {
          title: t('topbar.feedbackTitle', 'Parent Inquiries & Feedback'),
          subtitle: t('topbar.feedbackSub', 'Receive, categorize, and resolve parent inquiries under 48h SLA.'),
        };
      case 'supplementary':
        return {
          title: t('topbar.supplementaryTitle', 'Supplementary Tutoring Sessions'),
          subtitle: t('topbar.supplementarySub', 'Track tutoring attendance, session topics, and progress evaluations.'),
        };
      case 'renewal':
        return {
          title: t('topbar.renewalTitle', 'Tuition Renewals & Risk Management'),
          subtitle: t('topbar.renewalSub', 'Forecast upcoming expirations and manage proactive parent outreach.'),
        };
      case 'staff_roles':
        return {
          title: t('topbar.staffRolesTitle', 'Staff Roles & Permission Approvals'),
          subtitle: t('topbar.staffRolesSub', 'Review staff registrations, assign roles, and configure campus access.'),
        };
      case 'branches_classes':
        return {
          title: t('topbar.branchesClassesTitle', 'Campuses & Classrooms'),
          subtitle: t('topbar.branchesClassesSub', 'Manage campus locations, classrooms, and schedules.'),
        };
      case 'automated_emails':
        return {
          title: 'Automated Email Dispatch Center',
          subtitle: 'Automated notification dispatches from kapladashboard@gmail.com to HRT, Management & Teachers.',
        };
      case 'logs':
        return {
          title: t('topbar.logsTitle', 'Activity & Audit Trail'),
          subtitle: t('topbar.logsSub', 'Historical trace of operational actions and student interactions.'),
        };
      default:
        return {
          title: 'KAPLA Staff Dashboard',
          subtitle: t('brand.portalSubtitle', 'Academic Administration & Staff Operations Portal'),
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
          aria-label="Open menu"
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
      {/* Right: Branch Selector, Role Badge & User Profile */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Branch Selector (Admins or Multi-Branch staff can switch; Single-branch staff is fixed) */}
        {isSystemAdmin || availableBranches.length > 1 ? (
          <div className="relative">
            <button
              type="button"
              id="branch-selector-btn"
              onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#043264] bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all"
            >
              <Building2 className="w-3.5 h-3.5 text-[#026fd7]" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate">
                {currentBranch ? tDb(currentBranch.name) : t('topbar.selectBranch', 'Select Campus')}
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
                    {isSystemAdmin ? t('topbar.systemBranches', 'All System Campuses') : t('topbar.assignedBranches', 'Assigned Campus')}
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
                          <span className="block font-medium">{tDb(branch.name)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {`Code: ${branch.code}`}
                          </span>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#026fd7] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <div
            id="branch-fixed-badge"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-[#043264] bg-blue-50/80 border border-blue-200/80 rounded-xl"
            title={'Assigned Operating Campus'}
          >
            <Building2 className="w-3.5 h-3.5 text-[#026fd7]" />
            <span className="max-w-[130px] sm:max-w-[180px] truncate">
              {currentBranch ? tDb(currentBranch.name) : ('Campus')}
            </span>
          </div>
        )}

        {/* Role Badge with Bespoke Role Icon */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-2xs">
          <RoleBadgeIcon role={profile?.system_role || 'customer_service'} size="sm" />
          <span>
            {profile?.system_role === 'system_admin'
              ? ('System Admin')
              : activeRole || ('Staff')}
          </span>
        </div>

        {/* Automated Dispatch Email Quick Pill */}
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('automated_emails')}
            title="Automated Notification Dispatcher: kapladashboard@gmail.com"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span className="font-mono text-[11px]">kapladashboard@gmail.com</span>
          </button>
        )}

        {/* Refresh Action */}
        {onRefreshData && (
          <button
            type="button"
            onClick={onRefreshData}
            disabled={refreshing}
            title={t('topbar.refreshData', 'Refresh Data')}
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
                    {t('topbar.emailVerified', '● Email Verified')}
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
                    <span>{t('topbar.refreshData', 'Refresh Session')}</span>
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
                    <span>{t('auth.logout', 'Sign Out')}</span>
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
