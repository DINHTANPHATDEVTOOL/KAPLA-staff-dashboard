// ==============================================================================
// KAPLA Staff Dashboard — AppLayout (Dashboard Container)
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { OverviewView } from './OverviewView';
import { StaffApprovalView } from './StaffApprovalView';
import { BranchesClassesView } from './BranchesClassesView';
import { StudentListView } from './StudentListView';
import { CareTasksView } from './CareTasksView';
import { AssessmentsView } from './AssessmentsView';
import { InterventionsView } from './InterventionsView';
import { DashboardNavSection, UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { MockStorageService, realSupabase } from '../../lib/supabase';
import { Construction, Sparkles } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentBranch, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<DashboardNavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Check pending approval count for sidebar badge
  const checkPendingCount = async () => {
    try {
      if (realSupabase) {
        const { count } = await realSupabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');
        setPendingCount(count || 0);
      } else {
        const profiles = MockStorageService.getProfiles();
        const count = profiles.filter((p) => p.status === 'pending').length;
        setPendingCount(count);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkPendingCount();
  }, [activeSection]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshProfile();
      await checkPendingCount();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  // Render placeholder for phases T03 / T04
  const renderPlaceholder = (title: string, phase: string, desc: string) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xs">
      <div className="w-14 h-14 bg-blue-50 text-[#026fd7] rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
        <Construction className="w-7 h-7" />
      </div>
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
          Kế hoạch triển khai: {phase}
        </span>
        <h3 className="font-display text-lg font-bold text-slate-900 pt-2">
          {title}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {desc}
        </p>
      </div>
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setActiveSection('staff_roles')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Khám phá phân hệ Quản trị nhân sự & Phân quyền (T02)
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        pendingCount={pendingCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeSection={activeSection}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRefreshData={handleRefresh}
          refreshing={refreshing}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'overview' && (
            <OverviewView onNavigate={setActiveSection} />
          )}

          {activeSection === 'staff_roles' && (
            <StaffApprovalView />
          )}

          {activeSection === 'branches_classes' && (
            <BranchesClassesView />
          )}

          {activeSection === 'students' && (
            <StudentListView />
          )}

          {activeSection === 'care_tasks' && (
            <CareTasksView />
          )}

          {activeSection === 'assessments' && (
            <AssessmentsView onNavigateToIntervention={() => setActiveSection('interventions')} />
          )}

          {activeSection === 'interventions' && (
            <InterventionsView />
          )}

          {activeSection === 'feedback' &&
            renderPlaceholder(
              'Phản hồi & Khiếu nại từ phụ huynh',
              'Giai đoạn T04',
              'Tiếp nhận kỳ vọng phụ huynh, phân công người xử lý và ghi nhận kết quả phản hồi.'
            )}

          {activeSection === 'supplementary' &&
            renderPlaceholder(
              'Lớp học bổ trợ học vụ',
              'Giai đoạn T04',
              'Ghi nhận buổi học bổ trợ, điểm danh, mục tiêu bài học và kết quả rèn luyện.'
            )}

          {activeSection === 'renewal' &&
            renderPlaceholder(
              'Quản lý tái tục học phí',
              'Giai đoạn T04 & T05',
              'Cảnh báo học phí sắp hết hạn trước 15 ngày, tự động tạo hàng đợi gửi email thông báo cho HRT phụ trách.'
            )}

          {activeSection === 'logs' &&
            renderPlaceholder(
              'Nhật ký tác nghiệp chi tiết',
              'Giai đoạn T04',
              'Lịch sử theo dõi quá trình tương tác, thay đổi ngày hết hạn và kết quả xử lý của các phòng ban.'
            )}
        </main>
      </div>
    </div>
  );
};
