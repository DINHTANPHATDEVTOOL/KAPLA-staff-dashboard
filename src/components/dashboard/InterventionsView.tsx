// ==============================================================================
// KAPLA Staff Dashboard — T04: Academic Interventions (Phiếu can thiệp 4 bước)
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  X,
  FileCheck2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { InterventionTicket, InterventionStatus, Student, ClassRoom, UserProfile } from '../../types';
import { InterventionService, StudentService, realSupabase, MockStorageService } from '../../lib/supabase';

const getStatusMeta = (status: InterventionStatus, lang: 'vi' | 'en') => {
  if (lang === 'en') {
    switch (status) {
      case 'open':
        return {
          label: '1. Open',
          badge: 'bg-rose-100 text-rose-800 border-rose-300',
          color: 'border-l-rose-500',
          desc: 'Newly flagged academic risk requiring action plan',
        };
      case 'in_progress':
        return {
          label: '2. In Progress',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          color: 'border-l-amber-500',
          desc: 'Tutoring sessions actively underway',
        };
      case 'resolved':
        return {
          label: '3. Pending Verification',
          badge: 'bg-blue-100 text-blue-800 border-blue-300',
          color: 'border-l-blue-500',
          desc: 'Completed tutoring and re-assessment submitted, awaiting approval',
        };
      case 'verified':
        return {
          label: '4. Verified',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          color: 'border-l-emerald-500',
          desc: 'Academic recovery verified and signed off by HT / CM',
        };
    }
  }

  switch (status) {
    case 'open':
      return {
        label: '1. Mở (Open)',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        color: 'border-l-rose-500',
        desc: 'Mới phát hiện nguy cơ học thuật, cần lập kế hoạch xử lý',
      };
    case 'in_progress':
      return {
        label: '2. Đang xử lý (In Progress)',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        color: 'border-l-amber-500',
        desc: 'Đang triển khai các buổi kèm bổ trợ học thuật',
      };
    case 'resolved':
      return {
        label: '3. Đã xử lý (Resolved)',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        color: 'border-l-blue-500',
        desc: 'Đã hoàn tất bổ trợ và có kết quả đánh giá lại, chờ xác minh',
      };
    case 'verified':
      return {
        label: '4. Đã xác minh (Verified)',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        color: 'border-l-emerald-500',
        desc: 'Đã được Head Teacher hoặc CM phê duyệt đạt chuẩn',
      };
  }
};

export const InterventionsView: React.FC = () => {
  const { currentBranch, profile, activeRole } = useAuth();
  const { language } = useLanguage();
  const isSysAdmin = profile?.system_role === 'system_admin';
  const isHeadTeacher = activeRole === 'Head Teacher';
  const isCM = activeRole === 'CM';
  const canVerify = isSysAdmin || isHeadTeacher || isCM;

  const [interventions, setInterventions] = useState<InterventionTicket[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedForResolve, setSelectedForResolve] = useState<InterventionTicket | null>(null);
  const [selectedForVerify, setSelectedForVerify] = useState<InterventionTicket | null>(null);

  // Form states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newForm, setNewForm] = useState({
    student_id: '',
    class_id: '',
    issue_description: '',
    root_cause: '',
    action_plan: '',
    assigned_staff_id: '',
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  });

  const [reassessmentResult, setReassessmentResult] = useState<string>('');
  const [verificationNotes, setVerificationNotes] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [intervList, stuList] = await Promise.all([
        InterventionService.getInterventions(branchId),
        StudentService.getStudents(branchId, profile?.id, true, true),
      ]);
      setInterventions(intervList);
      setStudents(stuList);

      if (realSupabase) {
        let cq = realSupabase.from('classes').select('*').eq('status', 'active');
        if (branchId) cq = cq.eq('branch_id', branchId);
        const { data: cData } = await cq;
        if (cData) setClasses(cData);

        const { data: mData } = await realSupabase
          .from('branch_memberships')
          .select('user_id, role, profile:profiles(*)')
          .eq('status', 'active');
        if (mData) {
          const tList = mData
            .filter((m: any) => m.profile && ['Main Teacher', 'Head Teacher', 'HRT', 'Supplementary Teacher'].includes(m.role))
            .map((m: any) => m.profile);
          setTeachers(tList);
        }
      } else {
        const cls = MockStorageService.getClasses();
        setClasses(branchId ? cls.filter((c) => c.branch_id === branchId) : cls);

        const profs = MockStorageService.getProfiles();
        setTeachers(profs.filter((p) => p.status === 'active'));
      }
    } catch (err) {
      console.error('Lỗi tải phiếu can thiệp:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id]);

  const handleStudentSelect = (studentId: string) => {
    const stu = students.find((s) => s.id === studentId);
    setNewForm({
      ...newForm,
      student_id: studentId,
      class_id: stu?.current_class_id || '',
      assigned_staff_id: stu?.assigned_hrt_id || stu?.current_class?.default_hrt_id || profile?.id || '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !newForm.student_id) return;
    setSubmitting(true);
    setActionAlert(null);
    try {
      await InterventionService.createIntervention({
        student_id: newForm.student_id,
        class_id: newForm.class_id || undefined,
        branch_id: currentBranch.id,
        issue_description: newForm.issue_description.trim(),
        root_cause: newForm.root_cause.trim() || undefined,
        action_plan: newForm.action_plan.trim(),
        assigned_staff_id: newForm.assigned_staff_id || undefined,
        due_date: newForm.due_date,
        created_by: profile?.id,
      });
      setActionAlert({ type: 'success', text: 'Tạo phiếu can thiệp học thuật thành công!' });
      setShowCreateModal(false);
      setNewForm({
        student_id: '',
        class_id: '',
        issue_description: '',
        root_cause: '',
        action_plan: '',
        assigned_staff_id: '',
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      });
      await loadData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Lỗi khi tạo phiếu' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartProgress = async (id: string) => {
    try {
      await InterventionService.updateStatus(id, 'in_progress');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi cập nhật');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForResolve) return;
    setSubmitting(true);
    try {
      await InterventionService.updateStatus(selectedForResolve.id, 'resolved', reassessmentResult.trim());
      setSelectedForResolve(null);
      setReassessmentResult('');
      setActionAlert({ type: 'success', text: 'Đã hoàn tất can thiệp và nộp kết quả đánh giá lại!' });
      await loadData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Lỗi cập nhật' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForVerify) return;
    setSubmitting(true);
    try {
      await InterventionService.verifyIntervention(
        selectedForVerify.id,
        verificationNotes.trim(),
        profile?.id,
        isSysAdmin,
        isHeadTeacher || isCM
      );
      setSelectedForVerify(null);
      setVerificationNotes('');
      setActionAlert({ type: 'success', text: 'Đã xác minh phiếu can thiệp học thuật thành công!' });
      await loadData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Lỗi xác minh' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    return interventions.filter((i) => {
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;
      const stuName = i.student?.full_name || '';
      const matchSearch =
        stuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.issue_description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [interventions, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const open = interventions.filter((i) => i.status === 'open').length;
    const inProgress = interventions.filter((i) => i.status === 'in_progress').length;
    const resolved = interventions.filter((i) => i.status === 'resolved').length;
    const verified = interventions.filter((i) => i.status === 'verified').length;
    return { open, inProgress, resolved, verified, total: interventions.length };
  }, [interventions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {language === 'en' ? 'Academic Interventions' : 'Phiếu can thiệp học thuật'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? `4-step intervention workflow: Open → In Progress → Resolved → Verified by Head Teacher / CM at ${currentBranch?.name || 'KAPLA'}`
              : `Quy trình can thiệp 4 bước: Mở → Đang xử lý → Đã xử lý → Head Teacher / CM xác minh tại ${currentBranch?.name || 'KAPLA'}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {language === 'en' ? 'Create Intervention Ticket' : 'Tạo phiếu can thiệp'}
        </button>
      </div>

      {actionAlert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{actionAlert.text}</span>
          <button type="button" onClick={() => setActionAlert(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 Pipeline Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter(statusFilter === 'open' ? 'all' : 'open')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'open' ? 'ring-2 ring-rose-500 bg-rose-50/50' : 'bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            {language === 'en' ? '1. Open' : '1. Mở (Open)'}
          </span>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.open}</div>
          <span className="text-[10px] text-slate-400">
            {language === 'en' ? 'Newly flagged risk' : 'Mới phát hiện rủi ro'}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'in_progress' ? 'ring-2 ring-amber-500 bg-amber-50/50' : 'bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            {language === 'en' ? '2. In Progress' : '2. Đang xử lý'}
          </span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.inProgress}</div>
          <span className="text-[10px] text-slate-400">
            {language === 'en' ? 'Tutoring underway' : 'Đang kèm bổ trợ'}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'resolved' ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            {language === 'en' ? '3. Pending Verification' : '3. Chờ xác minh'}
          </span>
          <div className="text-2xl font-bold text-blue-800 mt-1">{stats.resolved}</div>
          <span className="text-[10px] text-slate-400">
            {language === 'en' ? 'Re-assessment submitted' : 'Đã nộp kết quả lại'}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'verified' ? 'all' : 'verified')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'verified' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : 'bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            {language === 'en' ? '4. Verified' : '4. Đã xác minh'}
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.verified}</div>
          <span className="text-[10px] text-emerald-600">
            {language === 'en' ? 'HT / CM approved' : 'HT / CM đã duyệt'}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Search by student name, issue description...'
                : 'Tìm theo tên học sinh, mô tả vấn đề học tập...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">{language === 'en' ? 'All Stages' : 'Tất cả giai đoạn'}</option>
            <option value="open">{language === 'en' ? '1. Open' : '1. Mở (Open)'}</option>
            <option value="in_progress">{language === 'en' ? '2. In Progress' : '2. Đang xử lý'}</option>
            <option value="resolved">{language === 'en' ? '3. Pending Verification' : '3. Đã xử lý (Chờ xác minh)'}</option>
            <option value="verified">{language === 'en' ? '4. Verified' : '4. Đã xác minh'}</option>
          </select>
        </div>
      </div>

      {/* Interventions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            {language === 'en' ? 'Loading intervention tickets...' : 'Đang tải danh sách phiếu can thiệp...'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              {language === 'en' ? 'No Matching Intervention Tickets' : 'Không có phiếu can thiệp nào phù hợp'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'en' ? 'All students are meeting academic expectations.' : 'Học viên đang duy trì tiến độ học tập tốt.'}
            </p>
          </div>
        ) : (
          filtered.map((ticket) => {
            const meta = getStatusMeta(ticket.status, language);

            return (
              <div
                key={ticket.id}
                className={`p-5 rounded-2xl bg-white border border-slate-200 border-l-4 ${meta.color} shadow-xs space-y-3`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {ticket.student?.full_name || (language === 'en' ? 'Student' : 'Học viên')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({ticket.class?.name || (language === 'en' ? 'Class' : 'Lớp')})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {language === 'en' ? 'Due: ' : 'Hạn: '}{ticket.due_date}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-rose-700 block mb-1">
                      {language === 'en' ? 'Issue & Root Cause:' : 'Vấn đề & Nguyên nhân:'}
                    </span>
                    <p className="text-slate-800 font-medium">{ticket.issue_description}</p>
                    {ticket.root_cause && (
                      <p className="text-slate-500 mt-1">
                        {language === 'en' ? 'Root Cause: ' : 'Nguyên nhân: '}{ticket.root_cause}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-blue-700 block mb-1">
                      {language === 'en' ? 'Intervention Plan:' : 'Kế hoạch can thiệp:'}
                    </span>
                    <p className="text-slate-800">{ticket.action_plan}</p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {language === 'en' ? 'Assigned to: ' : 'Phụ trách: '}
                      <strong>{ticket.assigned_staff_name || (language === 'en' ? 'Unassigned' : 'Chưa gán')}</strong>
                    </span>
                  </div>
                </div>

                {ticket.reassessment_result && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
                    <span className="font-bold block mb-0.5">
                      {language === 'en' ? 'Re-assessment Result:' : 'Kết quả đánh giá lại:'}
                    </span>
                    <p>{ticket.reassessment_result}</p>
                  </div>
                )}

                {ticket.status === 'verified' && (
                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        {language === 'en'
                          ? `Verified by: ${ticket.verified_by_name || 'Head Teacher / CM'}`
                          : `Đã xác minh bởi: ${ticket.verified_by_name || 'Head Teacher / CM'}`}
                      </span>
                      {ticket.verification_notes && <p className="mt-0.5 italic">"{ticket.verification_notes}"</p>}
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  {ticket.status === 'open' && (
                    <button
                      type="button"
                      onClick={() => handleStartProgress(ticket.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                    >
                      {language === 'en' ? 'Start Tutoring (In Progress)' : 'Bắt đầu xử lý (In Progress)'}
                    </button>
                  )}

                  {ticket.status === 'in_progress' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedForResolve(ticket);
                        setReassessmentResult('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200"
                    >
                      {language === 'en' ? 'Submit Re-assessment (Resolved)' : 'Nộp kết quả đánh giá lại (Resolved)'}
                    </button>
                  )}

                  {ticket.status === 'resolved' && canVerify && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedForVerify(ticket);
                        setVerificationNotes('');
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-xs flex items-center gap-1.5"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Verify Academic Standards (Head Teacher / CM)' : 'Xác minh đạt chuẩn (Head Teacher / CM)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tạo Phiếu Can Thiệp */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'en' ? 'Create Academic Intervention Ticket' : 'Lập phiếu can thiệp học thuật'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Select Student *' : 'Chọn học sinh *'}
                </label>
                <select
                  required
                  value={newForm.student_id}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">
                    {language === 'en' ? '-- Select student requiring intervention --' : '-- Chọn học sinh cần can thiệp --'}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_code}) - {s.current_class?.name || (language === 'en' ? 'Unassigned' : 'Chưa xếp lớp')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Academic Issue Description *' : 'Mô tả vấn đề học tập *'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={newForm.issue_description}
                  onChange={(e) => setNewForm({ ...newForm, issue_description: e.target.value })}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Weak writing skills (2.0 shields), confused with present simple structure...'
                      : 'VD: Kỹ năng Viết yếu (2.0 khiên), nhầm lẫn cấu trúc câu hiện tại đơn...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Root Cause' : 'Nguyên nhân cốt lõi'}
                </label>
                <textarea
                  rows={2}
                  value={newForm.root_cause}
                  onChange={(e) => setNewForm({ ...newForm, root_cause: e.target.value })}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Missed past 2 sessions, has not reviewed Unit 3 vocabulary...'
                      : 'VD: Nghỉ học 2 buổi trước, chưa nắm từ vựng Unit 3...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Detailed Intervention Plan *' : 'Kế hoạch can thiệp chi tiết *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newForm.action_plan}
                  onChange={(e) => setNewForm({ ...newForm, action_plan: e.target.value })}
                  placeholder={
                    language === 'en'
                      ? 'e.g. 1-on-1 tutoring every Thursday (30 min), Oxford-aligned home practice worksheets...'
                      : 'VD: Kèm 1-1 mỗi thứ 5 (30 phút), giao phiếu bài tập về nhà theo chuẩn Oxford...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Assigned Educator' : 'Người phụ trách xử lý'}
                  </label>
                  <select
                    value={newForm.assigned_staff_id}
                    onChange={(e) => setNewForm({ ...newForm, assigned_staff_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">{language === 'en' ? '-- Select Teacher --' : '-- Chọn giáo viên --'}</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Due Date *' : 'Hạn xử lý (Due date) *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newForm.due_date}
                    onChange={(e) => setNewForm({ ...newForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? (language === 'en' ? 'Creating...' : 'Đang tạo...')
                    : (language === 'en' ? 'Create Intervention Ticket' : 'Tạo phiếu can thiệp')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nộp Kết Quả Đánh Giá Lại (Resolved) */}
      {selectedForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'en' ? 'Submit Re-assessment Results' : 'Nộp kết quả đánh giá lại'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedForResolve(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolve} className="space-y-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-800">{selectedForResolve.student?.full_name}</span>
                <p className="text-slate-500 text-[11px] mt-0.5">{selectedForResolve.issue_description}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Post-Intervention Re-assessment Result *' : 'Kết quả đánh giá lại sau can thiệp *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reassessmentResult}
                  onChange={(e) => setReassessmentResult(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Student completed 4 tutoring sessions, re-evaluation scored 3.5/5 shields...'
                      : 'VD: Học viên đã hoàn thành 4 buổi bổ trợ, bài kiểm tra lại đạt 3.5/5 khiên...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedForResolve(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? (language === 'en' ? 'Saving...' : 'Đang lưu...')
                    : (language === 'en' ? 'Submit for Verification' : 'Hoàn tất và chờ xác minh')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Minh (Verified) Dành Riêng Cho Head Teacher / CM */}
      {selectedForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'en' ? 'Verify Academic Intervention' : 'Xác minh can thiệp học thuật'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForVerify(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerify} className="space-y-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-800">{selectedForVerify.student?.full_name}</span>
                <p className="text-[11px] text-slate-600">
                  {language === 'en' ? 'Issue: ' : 'Vấn đề: '}{selectedForVerify.issue_description}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {language === 'en' ? 'Result: ' : 'Kết quả: '}{selectedForVerify.reassessment_result}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Verification Feedback (Head Teacher / CM) *' : 'Nhận xét xác minh của Head Teacher / CM *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={
                    language === 'en'
                      ? 'e.g. Re-tested assessment and tutoring worksheets. Student satisfies academic requirements...'
                      : 'VD: Đã kiểm tra lại bài kiểm tra và phiếu bổ trợ. Học viên đạt chuẩn yêu cầu...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedForVerify(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-purple-700 hover:bg-purple-800 font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? (language === 'en' ? 'Verifying...' : 'Đang xác minh...')
                    : (language === 'en' ? 'Approve & Mark Verified' : 'Duyệt đạt chuẩn (Verified)')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
