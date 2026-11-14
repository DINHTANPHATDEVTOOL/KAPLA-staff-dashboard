// ==============================================================================
// KAPLA Staff Dashboard — T04: 4-Step Academic Interventions Workflow
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
import { InterventionTicket, InterventionStatus, Student, ClassRoom, UserProfile, DashboardNavSection } from '../../types';
import { InterventionService, StudentService, realSupabase, MockStorageService, subscribeToTableChanges } from '../../lib/supabase';
import { StudentProfileModal } from './StudentProfileModal';

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
        label: '1. Open',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        color: 'border-l-rose-500',
        desc: 'Academic risk detected, requiring action plan',
      };
    case 'in_progress':
      return {
        label: '2. In Progress',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        color: 'border-l-amber-500',
        desc: 'Conducting supplementary tutoring sessions',
      };
    case 'resolved':
      return {
        label: '3. Resolved',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        color: 'border-l-blue-500',
        desc: 'Supplementary sessions completed with reassessment results, awaiting verification',
      };
    case 'verified':
      return {
        label: '4. Verified',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        color: 'border-l-emerald-500',
        desc: 'Approved and verified to standard by Head Teacher or CM',
      };
  }
};

interface InterventionsViewProps {
  onNavigate?: (section: DashboardNavSection) => void;
}

export const InterventionsView: React.FC<InterventionsViewProps> = ({ onNavigate }) => {
  const { currentBranch, profile, activeRole } = useAuth();
  const { language, tDb } = useLanguage();
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
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
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
      console.error('Error loading intervention tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToTableChanges('interventions', loadData);
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
      setActionAlert({ type: 'success', text: 'Academic intervention ticket created successfully!' });
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
      setActionAlert({ type: 'error', text: err.message || 'Error creating ticket' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartProgress = async (id: string) => {
    try {
      await InterventionService.updateStatus(id, 'in_progress');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Update error');
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
      setActionAlert({ type: 'success', text: 'Intervention completed and reassessment submitted!' });
      await loadData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Update error' });
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
      setActionAlert({ type: 'success', text: 'Academic intervention ticket verified successfully!' });
      await loadData();
    } catch (err: any) {
      setActionAlert({ type: 'error', text: err.message || 'Verification error' });
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
              {'Academic Interventions'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {`4-step intervention workflow: Open → In Progress → Resolved → Verified by Head Teacher / CM at ${currentBranch?.name || 'KAPLA'}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {'Create Intervention Ticket'}
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
            {'1. Open'}
          </span>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.open}</div>
          <span className="text-[10px] text-slate-400">
            {'Newly flagged risk'}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'in_progress' ? 'all' : 'in_progress')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'in_progress' ? 'ring-2 ring-amber-500 bg-amber-50/50' : 'bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            {'2. In Progress'}
          </span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.inProgress}</div>
          <span className="text-[10px] text-slate-400">
            {'Tutoring underway'}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'resolved' ? 'all' : 'resolved')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'resolved' ? 'ring-2 ring-blue-500 bg-blue-50/50' : 'bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            {'3. Pending Verification'}
          </span>
          <div className="text-2xl font-bold text-blue-800 mt-1">{stats.resolved}</div>
          <span className="text-[10px] text-slate-400">
            {'Re-assessment submitted'}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'verified' ? 'all' : 'verified')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'verified' ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : 'bg-white hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            {'4. Verified'}
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.verified}</div>
          <span className="text-[10px] text-emerald-600">
            {'HT / CM approved'}
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
              'Search by student name, issue description...'
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
            <option value="all">{'All Stages'}</option>
            <option value="open">{'1. Open'}</option>
            <option value="in_progress">{'2. In Progress'}</option>
            <option value="resolved">{'3. Pending Verification'}</option>
            <option value="verified">{'4. Verified'}</option>
          </select>
        </div>
      </div>

      {/* Interventions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            {'Loading intervention tickets...'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              {'No Matching Intervention Tickets'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {'All students are meeting academic expectations.'}
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
                    <button
                      type="button"
                      onClick={() => {
                        const s = ticket.student || students.find((st) => st.id === ticket.student_id);
                        if (s) setSelectedStudentForProfile(s);
                      }}
                      className="font-bold text-slate-900 text-sm hover:text-[#026fd7] hover:underline cursor-pointer text-left"
                    >
                      {ticket.student?.full_name || ('Student')}
                    </button>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({ticket.class?.name || ('Class')})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${meta.badge}`}>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {'Due: '}{ticket.due_date}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-rose-700 block mb-1">
                      {'Issue & Root Cause:'}
                    </span>
                    <p className="text-slate-800 font-medium">{tDb(ticket.issue_description)}</p>
                    {ticket.root_cause && (
                      <p className="text-slate-500 mt-1">
                        {'Root Cause: '}{tDb(ticket.root_cause)}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-blue-700 block mb-1">
                      {'Intervention Plan:'}
                    </span>
                    <p className="text-slate-800">{tDb(ticket.action_plan)}</p>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {'Assigned to: '}
                      <strong>{ticket.assigned_staff_name || ('Unassigned')}</strong>
                    </span>
                  </div>
                </div>

                {ticket.reassessment_result && (
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
                    <span className="font-bold block mb-0.5">
                      {'Re-assessment Result:'}
                    </span>
                    <p>{tDb(ticket.reassessment_result)}</p>
                  </div>
                )}

                {ticket.status === 'verified' && (
                  <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">
                        {`Verified by: ${ticket.verified_by_name || 'Head Teacher / CM'}`}
                      </span>
                      {ticket.verification_notes && <p className="mt-0.5 italic">"{tDb(ticket.verification_notes)}"</p>}
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
                      {'Start Tutoring (In Progress)'}
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
                      {'Submit Re-assessment (Resolved)'}
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
                      {'Verify Academic Standards (Head Teacher / CM)'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Intervention Ticket */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {'Create Academic Intervention Ticket'}
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
                  {'Select Student *'}
                </label>
                <select
                  required
                  value={newForm.student_id}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">
                    {'-- Select student requiring intervention --'}
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_code}) - {s.current_class?.name || ('Unassigned')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Academic Issue Description *'}
                </label>
                <textarea
                  required
                  rows={2}
                  value={newForm.issue_description}
                  onChange={(e) => setNewForm({ ...newForm, issue_description: e.target.value })}
                  placeholder={
                    'e.g. Weak writing skills (2.0 shields), confused with present simple structure...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Root Cause'}
                </label>
                <textarea
                  rows={2}
                  value={newForm.root_cause}
                  onChange={(e) => setNewForm({ ...newForm, root_cause: e.target.value })}
                  placeholder={
                    'e.g. Missed past 2 sessions, has not reviewed Unit 3 vocabulary...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Detailed Intervention Plan *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={newForm.action_plan}
                  onChange={(e) => setNewForm({ ...newForm, action_plan: e.target.value })}
                  placeholder={
                    'e.g. 1-on-1 tutoring every Thursday (30 min), Oxford-aligned home practice worksheets...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Assigned Educator'}
                  </label>
                  <select
                    value={newForm.assigned_staff_id}
                    onChange={(e) => setNewForm({ ...newForm, assigned_staff_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">{'-- Select Teacher --'}</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Due Date *'}
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
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? ('Creating...')
                    : ('Create Intervention Ticket')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Reassessment (Resolved) */}
      {selectedForResolve && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {'Submit Re-assessment Results'}
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
                <p className="text-slate-500 text-[11px] mt-0.5">{tDb(selectedForResolve.issue_description)}</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Post-Intervention Re-assessment Result *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reassessmentResult}
                  onChange={(e) => setReassessmentResult(e.target.value)}
                  placeholder={
                    'e.g. Student completed 4 tutoring sessions, re-evaluation scored 3.5/5 shields...'
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
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-blue-700 hover:bg-blue-800 font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? ('Saving...')
                    : ('Submit for Verification')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Head Teacher / CM Verification Sign-off */}
      {selectedForVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {'Verify Academic Intervention'}
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
                  {'Issue: '}{tDb(selectedForVerify.issue_description)}
                </p>
                <p className="text-[11px] text-emerald-700 font-medium">
                  {'Result: '}{tDb(selectedForVerify.reassessment_result)}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Verification Feedback (Head Teacher / CM) *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder={
                    'e.g. Re-tested assessment and tutoring worksheets. Student satisfies academic requirements...'
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
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-purple-700 hover:bg-purple-800 font-semibold disabled:opacity-50"
                >
                  {submitting
                    ? ('Verifying...')
                    : ('Approve & Mark Verified')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Student Profile & Logcall Modal */}
      <StudentProfileModal
        student={selectedStudentForProfile}
        isOpen={Boolean(selectedStudentForProfile)}
        onClose={() => setSelectedStudentForProfile(null)}
        onOpenIntervention={(stu) => {
          setNewForm((prev) => ({
            ...prev,
            student_id: stu.id,
            class_id: stu.current_class_id || '',
          }));
          setShowCreateModal(true);
        }}
        onOpenAddAssessment={() => onNavigate?.('assessments')}
        onOpenAddFeedback={() => onNavigate?.('feedback')}
      />
    </div>
  );
};
