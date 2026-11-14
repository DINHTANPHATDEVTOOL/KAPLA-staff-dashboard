// ==============================================================================
// KAPLA Staff Dashboard — T03: HRT Care Tasks & Reminder Scheduling
// Authorized roles: SOO, HT, CM, Admin can create reminder appointments / tasks
// Categories: 1. Task Admin, 2. Call care, 3. Call EPP, 4. Parent Meeting, 5. Tutoring
// Automated Notification Sender: kapladashboard@gmail.com
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  PhoneCall,
  Calendar,
  Sparkles,
  Check,
  Search,
  Filter,
  Plus,
  Mail,
  X,
  User,
  Shield,
  Phone,
  Users,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StudentTask, CareTaskStatus, CareTaskType, Student } from '../../types';
import {
  StudentService,
  subscribeToTableChanges,
  EmailNotificationService,
  AutomatedEmailPayload,
} from '../../lib/supabase';

export const CareTasksView: React.FC = () => {
  const { profile, activeRole, currentBranch } = useAuth();
  const { tDb } = useLanguage();
  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const isHT = activeRole === 'Head Teacher' || (activeRole as string) === 'HT';
  const isSOO = (activeRole as string) === 'SOO';

  // Customer Specification: SOO, HT, CM (and System Admin) have permission to create reminder appointments / tasks
  const canCreateReminder = isSysAdmin || isCM || isHT || isSOO;

  // 5 Specific Categories requested by Customer
  const TASK_TYPE_META: Record<
    string,
    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    task_admin: { label: 'Task Admin', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: Shield },
    call_care: { label: 'Call care', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: PhoneCall },
    call_epp: { label: 'Call EPP', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Phone },
    parent_meeting: { label: 'Parent Meeting', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Users },
    tutoring: { label: 'Tutoring', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap },
    // Aliases for backward compatibility
    care_call: { label: 'Call care', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: PhoneCall },
    tuition_reminder: { label: 'Call EPP', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Phone },
    progress_report: { label: 'Tutoring', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap },
    attendance_check: { label: 'Task Admin', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: Shield },
    academic_support: { label: 'Tutoring', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: GraduationCap },
  };

  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Notification state
  const [emailNotification, setEmailNotification] = useState<AutomatedEmailPayload | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State for Scheduling Reminder / Care Task
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newReminder, setNewReminder] = useState<{
    student_id: string;
    task_type: CareTaskType;
    title: string;
    due_date: string;
    notes: string;
  }>({
    student_id: '',
    task_type: 'call_care',
    title: '',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // default tomorrow
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [taskData, studentData] = await Promise.all([
        StudentService.getCareTasks(branchId, profile?.id, isSysAdmin, isCM || isHT || isSOO),
        StudentService.getStudents(branchId, profile?.id, isSysAdmin, isCM || isHT || isSOO),
      ]);
      setTasks(taskData);
      setStudents(studentData);
    } catch (err) {
      console.error('Error loading care tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToTableChanges('student_tasks', loadData);
  }, [currentBranch?.id, profile?.id, isSysAdmin, isCM, isHT, isSOO]);

  const handleToggleStatus = async (task: StudentTask) => {
    const nextStatus: CareTaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await StudentService.updateTaskStatus(task.id, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
    } catch (err: any) {
      console.error('Error updating task status:', err);
    }
  };

  // Submit new reminder / task
  const handleCreateReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;
    if (!newReminder.student_id) {
      setActionMessage({ type: 'error', text: 'Please select a student for this reminder.' });
      return;
    }
    if (!newReminder.title.trim()) {
      setActionMessage({ type: 'error', text: 'Please enter a reminder title.' });
      return;
    }

    setSubmitting(true);
    setActionMessage(null);

    try {
      const selectedStudent = students.find((s) => s.id === newReminder.student_id);
      const effectiveHrt = selectedStudent?.effective_hrt_name || selectedStudent?.assigned_hrt?.full_name || 'Assigned HRT';

      const created = await StudentService.createCareTask({
        student_id: newReminder.student_id,
        branch_id: currentBranch.id,
        title: newReminder.title.trim(),
        task_type: newReminder.task_type,
        due_date: newReminder.due_date,
        status: 'pending',
        notes: newReminder.notes.trim() || undefined,
      });

      // Dispatch automated notification email from kapladashboard@gmail.com
      const mailPayload = EmailNotificationService.dispatchAutomatedEmail({
        title: `Reminder Scheduled: ${created.title} (${TASK_TYPE_META[created.task_type]?.label || 'Task'})`,
        actionType: 'reminder',
        recipients: [
          `Assigned HRT: ${effectiveHrt}`,
          `Center Manager (CM): Campus Care Operations`,
          `Supervisor: ${profile?.full_name || 'Management'} (${activeRole})`,
          `All Teachers: Main Teacher & Academic Staff`,
        ],
        metadata: {
          studentName: selectedStudent?.full_name,
          dueDate: created.due_date,
          category: TASK_TYPE_META[created.task_type]?.label,
        },
      });

      setEmailNotification(mailPayload);
      setActionMessage({
        type: 'success',
        text: `Reminder scheduled successfully! Automated notification dispatched from ${EmailNotificationService.SENDER_EMAIL}.`,
      });

      setShowCreateModal(false);
      setNewReminder({
        student_id: '',
        task_type: 'call_care',
        title: '',
        due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        notes: '',
      });

      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to schedule reminder appointment.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const typeKey = t.task_type === 'care_call' ? 'call_care' : t.task_type === 'tuition_reminder' ? 'call_epp' : t.task_type === 'progress_report' ? 'tutoring' : t.task_type;
      const matchType = filterType === 'all' || t.task_type === filterType || typeKey === filterType;
      const studentName = t.student?.full_name || '';
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchType && matchSearch;
    });
  }, [tasks, filterStatus, filterType, searchTerm]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  const isDueTomorrow = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const dueMid = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueMid - nowMid) / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              HRT Care Tasks & Reminder Worklist
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Student care and reminder duties with automated staff alerts at {currentBranch?.name ? tDb(currentBranch.name) : 'KAPLA'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Automated Email Sender Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-[#043264] font-medium">
            <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Auto Dispatch: <strong className="font-mono">{EmailNotificationService.SENDER_EMAIL}</strong></span>
          </div>

          {/* Customer Requirement: SOO, HT, CM (and Admin) can create reminder appointments */}
          {canCreateReminder && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Reminder / Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Message Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button type="button" onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Automated Email Notification Banner */}
      {emailNotification && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-100 text-[#043264] rounded-xl mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#043264]">
                  Automated Notification Dispatched
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  From: {EmailNotificationService.SENDER_EMAIL}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-1">{emailNotification.title}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Recipients:</span>
                {emailNotification.recipients.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-blue-200 text-[#043264] font-medium">
                    <Check className="w-3 h-3 text-emerald-600" />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEmailNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 self-start sm:self-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Tasks
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            Action Needed
          </span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Completed
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.completed}</div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by task title, student name, or notes..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Customer Requirement: Category Filter with the 5 classifications */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 font-medium"
            >
              <option value="all">All Classifications (5 Types)</option>
              <option value="task_admin">1. Task Admin</option>
              <option value="call_care">2. Call care</option>
              <option value="call_epp">3. Call EPP</option>
              <option value="parent_meeting">4. Parent Meeting</option>
              <option value="tutoring">5. Tutoring</option>
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading care tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              No Care Tasks Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All student care duties and reminder appointments within your responsibility have been completed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const meta = TASK_TYPE_META[task.task_type] || TASK_TYPE_META.call_care;
              const IconComp = meta.icon;
              const isDone = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-start sm:items-center justify-between gap-4 transition-colors ${
                    isDone ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 sm:mt-0 cursor-pointer ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                      title={isDone ? 'Mark Pending' : 'Mark Completed'}
                    >
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 5 HRT Task classifications badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${meta.color}`}
                        >
                          <IconComp className="w-3 h-3" />
                          {meta.label}
                        </span>

                        <span className="text-[11px] text-slate-500 font-medium">
                          Student:{' '}
                          <span className="text-slate-900 font-semibold">
                            {task.student?.full_name || 'Student'}
                          </span>
                          {task.student?.current_class && ` (${task.student.current_class.name})`}
                        </span>

                        {isDueTomorrow(task.due_date) && !isDone && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            ⏰ Due Tomorrow (1-Day Reminder)
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-semibold mt-1 text-slate-800 ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {tDb(task.title)}
                      </h4>

                      {task.notes && <p className="text-[11px] text-slate-500 mt-0.5">{tDb(task.notes)}</p>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Due: {task.due_date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODAL: SCHEDULE REMINDER / CARE TASK (SOO, HT, CM, Admin)           */}
      {/* ==================================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-[#043264] rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Schedule Reminder Appointment / Task</h3>
                  <p className="text-[11px] text-slate-500">
                    Authorized roles (SOO, HT, CM, Admin) • Auto-dispatch via <strong className="font-mono text-blue-700">{EmailNotificationService.SENDER_EMAIL}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateReminderSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Field 1: Student Selection */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Select Student <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newReminder.student_id}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const stu = students.find((s) => s.id === sid);
                    setNewReminder((prev) => ({
                      ...prev,
                      student_id: sid,
                      title: prev.title || (stu ? `Follow-up call with parents of ${stu.full_name}` : ''),
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043264]/20 bg-white"
                >
                  <option value="">-- Choose student from {currentBranch?.name || 'campus'} --</option>
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.full_name} ({stu.student_code}) • {stu.current_class?.name || 'Unassigned'} • HRT: {stu.effective_hrt_name || 'Class Default'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: 5 HRT Task Classifications (Customer Specification) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HRT Task Classification <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {[
                    { id: 'task_admin', label: '1. Task Admin', desc: 'Administrative paperwork & documentation' },
                    { id: 'call_care', label: '2. Call care', desc: 'Routine student care & progress check-in' },
                    { id: 'call_epp', label: '3. Call EPP', desc: 'Educational progression & tuition renewal' },
                    { id: 'parent_meeting', label: '4. Parent Meeting', desc: 'In-person / online consultation conference' },
                    { id: 'tutoring', label: '5. Tutoring', desc: '1-on-1 supplementary academic tutoring' },
                  ].map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all ${
                        newReminder.task_type === cat.id
                          ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="task_classification"
                          checked={newReminder.task_type === cat.id}
                          onChange={() => setNewReminder({ ...newReminder, task_type: cat.id as CareTaskType })}
                          className="text-[#043264]"
                        />
                        <span className="font-bold text-slate-800">{cat.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-5">{cat.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Field 3: Task Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reminder / Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                  placeholder="E.g., Call parents to discuss mid-term Cambridge progress"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              {/* Field 4: Due Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Due Date / Reminder Appointment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newReminder.due_date}
                  onChange={(e) => setNewReminder({ ...newReminder, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              {/* Field 5: Notes & Directives */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notes & Directives for Assigned Staff
                </label>
                <textarea
                  rows={3}
                  value={newReminder.notes}
                  onChange={(e) => setNewReminder({ ...newReminder, notes: e.target.value })}
                  placeholder="Specific talking points, meeting agendas, or tutoring objectives..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              {/* Automated Mail Notice */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-slate-600 text-[11px]">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">Automated Notification Dispatch:</span>{' '}
                  Submitting will record the task in the database and automatically dispatch notification emails from{' '}
                  <span className="font-mono font-bold text-blue-700">{EmailNotificationService.SENDER_EMAIL}</span> to the assigned HRT, Class Teachers, and Center Manager.
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Save & Dispatch Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
