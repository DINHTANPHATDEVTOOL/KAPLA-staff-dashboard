// ==============================================================================
// KAPLA Staff Dashboard — T04: Parent Feedback & Inquiries
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareHeart,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Building2,
  Calendar,
  Sparkles,
  X,
  Send,
  MessageCircle,
  HelpCircle,
  ThumbsUp,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  Bell,
  Layers,
  Check,
  Timer,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ParentFeedback, FeedbackType, FeedbackChannel, FeedbackStatus, Student, UserProfile, DashboardNavSection } from '../../types';
import { FeedbackService, StudentService, realSupabase, MockStorageService, subscribeToTableChanges, EmailNotificationService } from '../../lib/supabase';
import { StudentProfileModal } from './StudentProfileModal';

interface FeedbackViewProps {
  onNavigate?: (section: DashboardNavSection) => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({ onNavigate }) => {
  const { currentBranch, profile } = useAuth();
  const { language, t, tDb } = useLanguage();

  const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: any; color: string }> = useMemo(() => ({
    academic_concern: { label: 'Academic Concern', icon: HelpCircle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    complaint: { label: 'Complaint / Escalation', icon: AlertTriangle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    inquiry: { label: 'Inquiry', icon: MessageCircle, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    compliment: { label: 'Commendation', icon: ThumbsUp, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    facility: { label: 'Facilities', icon: Building2, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  }), [language]);

  const CHANNEL_CONFIG: Record<FeedbackChannel, { label: string; icon: any }> = useMemo(() => ({
    phone: { label: 'Phone Call', icon: Phone },
    zalo: { label: 'Zalo', icon: MessageCircle },
    in_person: { label: 'In-Person Meeting', icon: User },
    app: { label: 'Parent App', icon: Sparkles },
    email: { label: 'Email', icon: Mail },
  }), [language]);

  const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; badge: string }> = useMemo(() => ({
    open: { label: 'New Inquiry', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    in_progress: { label: 'In Progress', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    resolved: { label: 'Resolved', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  }), [language]);
  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffs, setStaffs] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Customer Specification: Group feedback by student (Image 3) + 1-day reminder + Turnaround time
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [emailNotification, setEmailNotification] = useState<{
    title: string;
    recipients: string[];
    actionType: 'create' | 'resolve';
    turnaround?: string;
  } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedFeedbackForResolve, setSelectedFeedbackForResolve] = useState<ParentFeedback | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolveStatus, setResolveStatus] = useState<FeedbackStatus>('resolved');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper functions: Turnaround calculation & 1-day deadline reminder
  const calculateTurnaround = (createdAt?: string, resolvedAt?: string) => {
    if (!createdAt) return 'Completed';
    const start = new Date(createdAt).getTime();
    const end = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
    const diffMs = Math.max(0, end - start);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours >= 24) {
      const days = Math.floor(diffHours / 24);
      const remHours = diffHours % 24;
      return `${days}d ${remHours}h`;
    }
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
    return `${Math.max(1, diffMinutes)}m`;
  };

  const isDueTomorrow = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const dueMid = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueMid - nowMid) / (1000 * 60 * 60 * 24));
    return diffDays === 1;
  };

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const dueMid = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return dueMid < nowMid;
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  // Form New Feedback
  const [newFeedback, setNewFeedback] = useState({
    student_id: '',
    parent_name: '',
    parent_phone: '',
    feedback_type: 'academic_concern' as FeedbackType,
    channel: 'phone' as FeedbackChannel,
    content: '',
    assigned_staff_id: '',
    due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [fData, sData] = await Promise.all([
        FeedbackService.getFeedbacks(branchId),
        StudentService.getStudents(branchId),
      ]);
      setFeedbacks(fData);
      setStudents(sData);

      // Load branch staffs
      if (realSupabase) {
        const { data: mData } = await realSupabase
          .from('branch_memberships')
          .select('user_id, role, profile:profiles(*)')
          .eq('status', 'active');
        if (mData) {
          const staffList = mData.map((m: any) => m.profile).filter(Boolean);
          setStaffs(staffList);
        }
      } else {
        setStaffs(MockStorageService.getProfiles());
      }
    } catch (err: any) {
      console.error('Error loading feedback data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToTableChanges('parent_feedbacks', loadData);
  }, [currentBranch?.id]);

  // Handle student select auto-fill parent info
  const handleStudentSelect = (studentId: string) => {
    const s = students.find((st) => st.id === studentId);
    setNewFeedback((prev) => ({
      ...prev,
      student_id: studentId,
      parent_name: s?.parent_name || '',
      parent_phone: s?.parent_phone || '',
      assigned_staff_id: s?.assigned_hrt_id || prev.assigned_staff_id,
    }));
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.student_id || !newFeedback.content.trim()) {
      setMessage({ type: 'error', text: 'Please select a student and provide feedback description.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const selectedStudent = students.find((s) => s.id === newFeedback.student_id);
      const assignedStaff = staffs.find((p) => p.id === newFeedback.assigned_staff_id);
      const assignedStaffName = assignedStaff?.full_name || selectedStudent?.effective_hrt_name || 'Designated Staff';
      const ownerName = profile?.full_name || profile?.email || 'Logged Staff';

      await FeedbackService.createFeedback({
        student_id: newFeedback.student_id,
        branch_id: selectedStudent?.branch_id || currentBranch?.id || '',
        parent_name: newFeedback.parent_name || 'Parent',
        parent_phone: newFeedback.parent_phone || 'N/A',
        feedback_type: newFeedback.feedback_type,
        channel: newFeedback.channel,
        content: newFeedback.content.trim(),
        assigned_staff_id: newFeedback.assigned_staff_id || undefined,
        assigned_staff_name: assignedStaffName,
        owner_id: profile?.id,
        owner_name: ownerName,
        due_date: newFeedback.due_date,
        status: 'open',
      });

      // Customer Specification: Email notification dispatched to Assignee, Owner, and CM + Teacher get ALL notifications
      const recipientsList = [
        `Assigned Staff: ${assignedStaffName}`,
        `Ticket Owner: ${ownerName}`,
        `Center Manager (CM): All Center Inquiries & Escalations`,
        `Class Teachers: Main Teacher & HRT Staff`,
      ];
      EmailNotificationService.dispatchAutomatedEmail({
        title: `New Inquiry for ${selectedStudent?.full_name || 'Student'} (${newFeedback.parent_phone})`,
        actionType: 'feedback',
        recipients: recipientsList,
        content: `Parent inquiry registered: "${newFeedback.content.trim()}". Assigned to: ${assignedStaffName}. Due date: ${newFeedback.due_date}`,
      });

      setEmailNotification({
        title: `New Inquiry for ${selectedStudent?.full_name || 'Student'} (${newFeedback.parent_phone})`,
        actionType: 'create',
        recipients: recipientsList,
      });

      setMessage({ type: 'success', text: 'Parent feedback registered and instant notifications dispatched successfully.' });
      setShowAddModal(false);
      setNewFeedback({
        student_id: '',
        parent_name: '',
        parent_phone: '',
        feedback_type: 'academic_concern',
        channel: 'phone',
        content: '',
        assigned_staff_id: '',
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create feedback record.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedbackForResolve) return;

    setSubmitting(true);
    try {
      const resolvedAt = new Date().toISOString();
      const turnaround = calculateTurnaround(selectedFeedbackForResolve.created_at, resolvedAt);

      await FeedbackService.updateStatus(
        selectedFeedbackForResolve.id,
        resolveStatus,
        resolutionNotes.trim(),
        resolvedAt,
        turnaround
      );

      const assignedStaffName = selectedFeedbackForResolve.assigned_staff_name || 'Designated Staff';
      const ownerName = selectedFeedbackForResolve.owner_name || 'Ticket Owner';

      // Customer Specification: Resolution turnaround time + Email dispatched to Owner, Assignee, CM & Teachers
      const resolveRecipients = [
        `Assigned Staff: ${assignedStaffName}`,
        `Ticket Owner: ${ownerName}`,
        `Center Manager (CM): Full Notification Log`,
        `Class Teachers: Academic Lead & HRT Staff`,
      ];
      EmailNotificationService.dispatchAutomatedEmail({
        title: `Parent Feedback Resolved: "${selectedFeedbackForResolve.content.slice(0, 45)}..."`,
        actionType: 'feedback',
        turnaround,
        recipients: resolveRecipients,
        content: `Parent feedback ticket resolved in ${turnaround}. Resolution notes: ${resolutionNotes.trim() || 'No additional notes'}. Handled by: ${assignedStaffName}.`,
      });

      setEmailNotification({
        title: `Feedback resolved: "${selectedFeedbackForResolve.content.slice(0, 45)}..."`,
        actionType: 'resolve',
        turnaround,
        recipients: resolveRecipients,
      });

      setMessage({
        type: 'success',
        text: `Feedback resolved in ${turnaround}! Turnaround recorded and notifications dispatched.`,
      });
      setSelectedFeedbackForResolve(null);
      setResolutionNotes('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Resolution update failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchesSearch =
        f.parent_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.parent_phone?.includes(searchTerm);

      const matchesType = typeFilter === 'all' || f.feedback_type === typeFilter;
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [feedbacks, searchTerm, typeFilter, statusFilter]);

  // Customer Specification: Consolidate / group multiple feedbacks for the same student (Image 3)
  const groupedFeedbacks = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        key: string;
        studentId: string;
        studentName: string;
        studentCode: string;
        parentName: string;
        parentPhone: string;
        student?: Student;
        feedbacks: ParentFeedback[];
        openCount: number;
        inProgressCount: number;
        resolvedCount: number;
      }
    >();

    filteredFeedbacks.forEach((f) => {
      const s = f.student || students.find((st) => st.id === f.student_id);
      const studentName = s?.full_name || f.student?.full_name || f.parent_name || 'Student';
      // Group key by student id, or fallback to normalized student name or parent phone
      const groupKey = f.student_id || studentName.toLowerCase().trim() || f.parent_phone;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          key: groupKey,
          studentId: f.student_id,
          studentName,
          studentCode: s?.student_code || f.student?.student_code || '',
          parentName: f.parent_name || s?.parent_name || '',
          parentPhone: f.parent_phone || s?.parent_phone || '',
          student: s,
          feedbacks: [],
          openCount: 0,
          inProgressCount: 0,
          resolvedCount: 0,
        });
      }

      const group = groupsMap.get(groupKey)!;
      group.feedbacks.push(f);
      if (f.status === 'open') group.openCount++;
      else if (f.status === 'in_progress') group.inProgressCount++;
      else if (f.status === 'resolved') group.resolvedCount++;
    });

    return Array.from(groupsMap.values());
  }, [filteredFeedbacks, students]);

  const stats = useMemo(() => {
    const total = feedbacks.length;
    const open = feedbacks.filter((f) => f.status === 'open').length;
    const inProgress = feedbacks.filter((f) => f.status === 'in_progress').length;
    const resolved = feedbacks.filter((f) => f.status === 'resolved').length;
    return { total, open, inProgress, resolved };
  }, [feedbacks]);

  return (
    <div className="space-y-6">
      {/* Action Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5 text-sm font-medium">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customer Specification: Instant Email & System Notification Banner */}
      {emailNotification && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-100 text-[#043264] rounded-xl mt-0.5">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#043264]">
                  {emailNotification.actionType === 'create'
                    ? 'Email & System Notification Dispatched'
                    : `Resolution Confirmed • Turnaround: ${emailNotification.turnaround}`}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  From: {EmailNotificationService.getSenderEmail()}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-1">{emailNotification.title}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px] text-slate-600">
                <span className="font-semibold text-slate-700">Dispatched To:</span>
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

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Total Inquiries'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.open}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'New Inquiries'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700">{stats.inProgress}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'In Progress'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{stats.resolved}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Resolved'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={'Search by parent, student, phone, content...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264]"
            >
              <option value="all">{'All Categories'}</option>
              {Object.entries(TYPE_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264]"
            >
              <option value="all">{'All Statuses'}</option>
              <option value="open">{'New Inquiry'}</option>
              <option value="in_progress">{'In Progress'}</option>
              <option value="resolved">{'Resolved'}</option>
            </select>
          </div>

          {/* Customer Specification: Group by Student vs Flat View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-[#043264] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{'Group by Student'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-[#043264] font-bold">
                {groupedFeedbacks.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'flat'
                  ? 'bg-white text-[#043264] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{'All Feedbacks'}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-bold">
                {filteredFeedbacks.length}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{'Record Parent Feedback'}</span>
        </button>
      </div>

      {/* Feedbacks List (Grouped or Flat) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            {'Loading parent feedback...'}
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquareHeart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-700 font-semibold">
              {'No Matching Feedback Found'}
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {'Logged phone calls, messages, and parent feedback will appear here.'}
            </div>
          </div>
        ) : viewMode === 'grouped' ? (
          /* ==================================================================== */
          /* GROUPED BY STUDENT VIEW (Solves duplicate cards in Image 3) */
          /* ==================================================================== */
          <div className="divide-y divide-slate-200">
            {groupedFeedbacks.map((group) => {
              const isExpanded = expandedGroups[group.key] !== false; // default open
              return (
                <div key={group.key} className="p-4 sm:p-5 hover:bg-slate-50/40 transition-colors">
                  {/* Group Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-start sm:items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors mt-0.5 sm:mt-0"
                        title={isExpanded ? 'Collapse Feedbacks' : 'Expand Feedbacks'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => group.student && setSelectedStudentForProfile(group.student)}
                            className="font-bold text-base text-slate-900 hover:text-[#026fd7] hover:underline flex items-center gap-1.5"
                          >
                            <User className="w-4 h-4 text-[#043264]" />
                            <span>{group.studentName}</span>
                          </button>
                          {group.studentCode && (
                            <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-semibold">
                              {group.studentCode}
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-medium">
                            • Parent: <strong className="text-slate-800">{group.parentName}</strong> ({group.parentPhone})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#043264] border border-blue-200">
                        <MessageSquareHeart className="w-3.5 h-3.5" />
                        <span>{group.feedbacks.length} Feedback{group.feedbacks.length > 1 ? 's' : ''}</span>
                      </span>

                      {group.openCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {group.openCount} New
                        </span>
                      )}
                      {group.inProgressCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {group.inProgressCount} In Progress
                        </span>
                      )}
                      {group.resolvedCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {group.resolvedCount} Resolved
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setNewFeedback((prev) => ({
                            ...prev,
                            student_id: group.studentId,
                            parent_name: group.parentName,
                            parent_phone: group.parentPhone,
                            assigned_staff_id: group.student?.assigned_hrt_id || '',
                          }));
                          setShowAddModal(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#043264] bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{'Add Feedback'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Feedbacks Thread */}
                  {isExpanded && (
                    <div className="mt-3 pl-3 sm:pl-7 space-y-3 border-l-2 border-blue-200">
                      {group.feedbacks.map((f) => {
                        const typeCfg = TYPE_CONFIG[f.feedback_type] || TYPE_CONFIG.academic_concern;
                        const TypeIcon = typeCfg.icon;
                        const channelCfg = CHANNEL_CONFIG[f.channel] || CHANNEL_CONFIG.phone;
                        const ChannelIcon = channelCfg.icon;
                        const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.open;
                        const dueTomorrow = isDueTomorrow(f.due_date);
                        const overdue = isOverdue(f.due_date) && f.status !== 'resolved';

                        return (
                          <div
                            key={f.id}
                            className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${typeCfg.color}`}>
                                  <TypeIcon className="w-3 h-3" />
                                  {typeCfg.label}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <ChannelIcon className="w-3 h-3 text-slate-400" />
                                  {channelCfg.label}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusCfg.badge}`}>
                                  {statusCfg.label}
                                </span>

                                {/* 1-Day Deadline Reminder Badge */}
                                {dueTomorrow && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                    <Timer className="w-3 h-3 text-amber-700" />
                                    <span>{'⏰ Due Tomorrow (1-Day Reminder)'}</span>
                                  </span>
                                )}

                                {overdue && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>{'Overdue'}</span>
                                  </span>
                                )}

                                {/* Resolution Turnaround Time */}
                                {f.status === 'resolved' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Turnaround: {f.turnaround_time || calculateTurnaround(f.created_at, f.resolved_at || f.updated_at) || 'Done'}</span>
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedFeedbackForResolve(f);
                                  setResolveStatus(f.status === 'open' ? 'in_progress' : 'resolved');
                                  setResolutionNotes(f.resolution_notes || '');
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>{'Update Progress'}</span>
                              </button>
                            </div>

                            <p className="text-xs text-slate-800 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                              {tDb(f.content)}
                            </p>

                            {f.resolution_notes && (
                              <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="block text-emerald-900">
                                    {'Resolution Notes:'}
                                  </strong>
                                  {tDb(f.resolution_notes)}
                                </div>
                              </div>
                            )}

                            {/* Attribution: Owner and Assignee */}
                            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap border-t border-slate-100">
                              <span className="flex items-center gap-1 font-medium">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>Owner / Logged by:</span>
                                <strong className="text-slate-800">{f.owner_name || 'Center Staff'}</strong>
                              </span>
                              <span className="flex items-center gap-1 font-medium">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>Assigned to:</span>
                                <strong className="text-slate-800">{f.assigned_staff_name || 'Unassigned'}</strong>
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>Due: {f.due_date}</span>
                              </span>
                              <span className="text-slate-400 font-mono">
                                Logged: {new Date(f.created_at || '').toLocaleDateString('en-US')}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* ==================================================================== */
          /* FLAT LIST VIEW */
          /* ==================================================================== */
          <div className="divide-y divide-slate-100">
            {filteredFeedbacks.map((f) => {
              const typeCfg = TYPE_CONFIG[f.feedback_type] || TYPE_CONFIG.academic_concern;
              const TypeIcon = typeCfg.icon;
              const channelCfg = CHANNEL_CONFIG[f.channel] || CHANNEL_CONFIG.phone;
              const ChannelIcon = channelCfg.icon;
              const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.open;
              const dueTomorrow = isDueTomorrow(f.due_date);
              const overdue = isOverdue(f.due_date) && f.status !== 'resolved';

              return (
                <div key={f.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${typeCfg.color}`}>
                          <TypeIcon className="w-3.5 h-3.5" />
                          {typeCfg.label}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          <ChannelIcon className="w-3 h-3 text-slate-400" />
                          {channelCfg.label}
                        </span>

                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>

                        {dueTomorrow && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                            <Timer className="w-3 h-3 text-amber-700" />
                            <span>⏰ Due Tomorrow (1-Day Reminder)</span>
                          </span>
                        )}

                        {overdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        )}

                        {f.status === 'resolved' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Turnaround: {f.turnaround_time || calculateTurnaround(f.created_at, f.resolved_at || f.updated_at) || 'Done'}</span>
                          </span>
                        )}
                      </div>

                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span>{tDb(f.parent_name)}</span>
                        <span className="text-slate-400 font-normal">({f.parent_phone})</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-normal">
                          {'Student: '}
                          <button
                            type="button"
                            onClick={() => {
                              const s = f.student || students.find((st) => st.id === f.student_id);
                              if (s) setSelectedStudentForProfile(s);
                            }}
                            className="font-bold text-slate-800 hover:text-[#026fd7] hover:underline cursor-pointer"
                          >
                            {f.student?.full_name || 'N/A'}
                          </button>
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {tDb(f.content)}
                      </p>

                      {f.resolution_notes && (
                        <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-emerald-900">
                              {'Resolution Notes:'}
                            </strong>
                            {tDb(f.resolution_notes)}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Owner:</span>
                          <strong className="text-slate-700 font-medium">{f.owner_name || 'Staff'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>Assigned to:</span>
                          <strong className="text-slate-700 font-medium">
                            {f.assigned_staff_name || ('Unassigned')}
                          </strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Due:</span>
                          <strong className="text-slate-700 font-medium">{f.due_date}</strong>
                        </span>
                        <span className="text-slate-400">
                          Logged: {new Date(f.created_at || '').toLocaleDateString('en-US')}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:flex-col gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFeedbackForResolve(f);
                          setResolveStatus(f.status === 'open' ? 'in_progress' : 'resolved');
                          setResolutionNotes(f.resolution_notes || '');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{'Update Progress'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Record New Feedback */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-[#043264]" />
                <h3 className="font-semibold text-slate-900 text-base">
                  {'Record Parent Feedback'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateFeedback} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Select Student *'}
                </label>
                <select
                  value={newFeedback.student_id}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                >
                  <option value="">{'-- Select student --'}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.student_code} - {s.full_name} ({s.current_class?.name || ('Unassigned')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Parent Full Name'}
                  </label>
                  <input
                    type="text"
                    value={newFeedback.parent_name}
                    onChange={(e) => setNewFeedback({ ...newFeedback, parent_name: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Phone Number'}
                  </label>
                  <input
                    type="text"
                    value={newFeedback.parent_phone}
                    onChange={(e) => setNewFeedback({ ...newFeedback, parent_phone: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Category'}
                  </label>
                  <select
                    value={newFeedback.feedback_type}
                    onChange={(e) => setNewFeedback({ ...newFeedback, feedback_type: e.target.value as FeedbackType })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                  >
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Channel'}
                  </label>
                  <select
                    value={newFeedback.channel}
                    onChange={(e) => setNewFeedback({ ...newFeedback, channel: e.target.value as FeedbackChannel })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                  >
                    {Object.entries(CHANNEL_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Feedback / Request Details *'}
                </label>
                <textarea
                  rows={3}
                  value={newFeedback.content}
                  onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                  required
                  placeholder={
                    'Describe parent concerns, feedback, or inquiries in detail...'
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Assigned Staff'}
                  </label>
                  <select
                    value={newFeedback.assigned_staff_id}
                    onChange={(e) => setNewFeedback({ ...newFeedback, assigned_staff_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                  >
                    <option value="">{'-- Select staff --'}</option>
                    {staffs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={newFeedback.due_date}
                    onChange={(e) => setNewFeedback({ ...newFeedback, due_date: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {submitting
                    ? ('Saving...')
                    : ('Save Feedback')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Update Resolution Progress */}
      {selectedFeedbackForResolve && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-base">
                {'Update Resolution Progress'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedFeedbackForResolve(null)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleResolveFeedback} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'New Status'}
                </label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as FeedbackStatus)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                >
                  <option value="in_progress">
                    {'In Progress (Awaiting info / Action plan)'}
                  </option>
                  <option value="resolved">
                    {'Resolved (Communicated with parent)'}
                  </option>
                  <option value="open">
                    {'Reopen (Pending review)'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Resolution Notes & Contact Log'}
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder={
                    'Describe phone call outcome, agreed action plan with parent...'
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFeedbackForResolve(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {submitting
                    ? ('Updating...')
                    : ('Update')}
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
        onOpenAddFeedback={(stu) => {
          handleStudentSelect(stu.id);
          setShowAddModal(true);
        }}
        onOpenAddAssessment={() => onNavigate?.('assessments')}
        onOpenIntervention={() => onNavigate?.('interventions')}
      />
    </div>
  );
};
