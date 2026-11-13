// ==============================================================================
// KAPLA Staff Dashboard — Pending Approval Screen
// ==============================================================================

import React, { useState } from 'react';
import { Clock, ShieldAlert, RefreshCw, LogOut, CheckCircle2, Building, User, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuthLayout } from './AuthLayout';
import { MockStorageService } from '../../lib/supabase';

export const PendingApprovalScreen: React.FC = () => {
  const { profile, user, availableBranches, signOut, refreshProfile, isDevMock } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [fastApproving, setFastApproving] = useState(false);

  const preferredBranch = availableBranches.find((b) => b.id === profile?.preferred_branch_id);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  // Dev Testing Helper: Fast Approve directly from this screen
  const handleFastApprove = async () => {
    if (!profile) return;
    setFastApproving(true);
    try {
      const targetBranchId = preferredBranch?.id || availableBranches[0]?.id || 'a0000000-0000-0000-0000-000000000001';
      
      // Update in MockStorage
      const profiles = MockStorageService.getProfiles();
      const idx = profiles.findIndex((p) => p.id === profile.id);
      if (idx !== -1) {
        profiles[idx].status = 'active';
        MockStorageService.saveProfiles(profiles);
      }

      const memberships = MockStorageService.getMemberships();
      memberships.push({
        id: 'mem-' + Math.random().toString(36).substring(2, 9),
        user_id: profile.id,
        branch_id: targetBranchId,
        role: 'HRT', // default approved as HRT
        is_primary: true,
        status: 'active',
      });
      MockStorageService.saveMemberships(memberships);

      MockStorageService.appendAuditLog({
        actor_email: 'system@kapla.edu.vn',
        action: 'APPROVE_USER_ROLE',
        target_user_email: profile.email,
        branch_id: targetBranchId,
        details: { role: 'HRT', fast_approved: true },
      });

      await refreshProfile();
    } finally {
      setFastApproving(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.pendingTitle', 'Tài khoản đang chờ duyệt quyền')}
      subtitle={t(
        'auth.pendingSubtitle',
        'Email đã xác thực thành công. Vui lòng chờ Giám đốc cơ sở (CM) cấp quyền để truy cập dữ liệu.'
      )}
    >
      <div className="space-y-6">
        {/* Status Highlight Banner */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
            <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-amber-900 uppercase tracking-wide">
              {t('auth.pendingStatusLabel', 'Trạng thái: Đang chờ phân bổ vai trò')}
            </h4>
            <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
              {t(
                'auth.pendingSecurityNotice',
                'Nhằm đảm bảo an toàn thông tin học viên và bảo mật học phí, hệ thống chỉ mở quyền sau khi CM chi nhánh hoặc Quản trị hệ thống phê duyệt phân công cụ thể.'
              )}
            </p>
          </div>
        </div>

        {/* Profile Card Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="font-semibold text-slate-700">
              {t('auth.accountSummaryTitle', 'Thông tin tài khoản đăng ký:')}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-medium text-[10px]">
              {t('auth.pendingBadge', 'Chờ phê duyệt')}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 w-24">{t('auth.fullNameLabel', 'Họ và tên')}:</span>
              <span className="font-medium text-slate-900">{profile?.full_name || 'Nhân viên mới'}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 w-24">Email:</span>
              <span className="font-mono text-slate-900">{profile?.email || user?.email}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-700">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-500 w-24">{t('auth.registeredBranch', 'Cơ sở đăng ký')}:</span>
              <span className="font-medium text-[#043264]">
                {preferredBranch ? `${preferredBranch.name} (${preferredBranch.code})` : t('common.none', 'Chưa chọn')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-all shadow-sm disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? t('auth.checking', 'Đang kiểm tra...') : t('auth.checkStatusBtn', 'Kiểm tra lại trạng thái duyệt')}
          </button>

          {/* Dev helper to fast approve */}
          {isDevMock && (
            <button
              type="button"
              onClick={handleFastApprove}
              disabled={fastApproving}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {fastApproving ? 'Đang kích hoạt...' : '⚡ Phê duyệt nhanh tài khoản này làm HRT [Thử nghiệm]'}
            </button>
          )}
        </div>

        {/* Sign Out Option */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {t('topbar.emailVerified', 'Email đã xác thực')}
          </span>

          <button
            type="button"
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('auth.logout', 'Đăng xuất')}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
