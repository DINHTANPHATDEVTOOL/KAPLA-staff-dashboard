// ==============================================================================
// KAPLA Staff Dashboard — Student Profile & Comprehensive Logcall Modal
// High-fidelity Oxford Quality student record with unified chronological CRM activity feed
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  ShieldCheck,
  ClipboardCheck,
  MessageSquare,
  Award,
  BookOpen,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Search,
  ExternalLink,
  PhoneCall,
  History,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  Student,
  StudentAssessment,
  ParentFeedback,
  InterventionTicket,
  StudentTask,
  SupplementarySession,
  ClassTransfer,
  SkillCompetencyLevel,
} from '../../types';
import {
  AssessmentService,
  FeedbackService,
  InterventionService,
  StudentService,
  SupplementaryService,
  subscribeToTableChanges,
} from '../../lib/supabase';

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddAssessment?: (student: Student) => void;
  onOpenAddFeedback?: (student: Student) => void;
  onOpenIntervention?: (student: Student) => void;
}

type TabType = 'all' | 'assessments' | 'feedback' | 'interventions' | 'history';

interface UnifiedTimelineEvent {
  id: string;
  type: 'assessment' | 'feedback' | 'intervention' | 'care_task' | 'tutor' | 'transfer';
  date: string;
  title: string;
  subtitle?: string;
  content?: string;
  secondaryContent?: string;
  statusBadge?: { label: string; color: string };
  metaBadge?: { label: string; color: string };
  rawItem: any;
  actorName?: string;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  onOpenAddAssessment,
  onOpenAddFeedback,
  onOpenIntervention,
}) => {
  const { language, tDb } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>([]);
  const [interventions, setInterventions] = useState<InterventionTicket[]>([]);
  const [careTasks, setCareTasks] = useState<StudentTask[]>([]);
  const [transfers, setTransfers] = useState<ClassTransfer[]>([]);
  const [tutorSessions, setTutorSessions] = useState<SupplementarySession[]>([]);

  useEffect(() => {
    if (!student || !isOpen) return;

    let mounted = true;
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const [assessList, feedList, intervList, tasksList, transList, sessList] = await Promise.all([
          AssessmentService.getAssessments(student.branch_id),
          FeedbackService.getFeedbacks(student.branch_id),
          InterventionService.getInterventions(student.branch_id),
          StudentService.getCareTasks(student.branch_id),
          StudentService.getTransfers(student.id),
          SupplementaryService.getSessions(student.branch_id),
        ]);

        if (!mounted) return;

        // Filter for this student
        setAssessments(assessList.filter((a: StudentAssessment) => a.student_id === student.id));
        setFeedbacks(feedList.filter((f: ParentFeedback) => f.student_id === student.id));
        setInterventions(intervList.filter((i: InterventionTicket) => i.student_id === student.id));
        setCareTasks(tasksList.filter((t: StudentTask) => t.student_id === student.id));
        setTransfers(transList);

        // Find tutor sessions where this student is an attendee
        const studentSessions = sessList.filter((s: SupplementarySession) =>
          s.attendees?.some((att) => att.student_id === student.id)
        );
        setTutorSessions(studentSessions);
      } catch (err) {
        console.error('Error fetching student profile data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStudentData();
    const unsub = subscribeToTableChanges('students', fetchStudentData);

    return () => {
      mounted = false;
      unsub();
    };
  }, [student, isOpen]);

  // Tuition calculation
  const tuitionInfo = useMemo(() => {
    if (!student || !student.tuition_expiry_date) {
      return { days: 0, status: 'safe', label: 'Not Set', color: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(student.tuition_expiry_date);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: diffDays,
        status: 'expired',
        label: `Expired ${Math.abs(diffDays)}d ago`,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    }
    if (diffDays <= 14) {
      return {
        days: diffDays,
        status: 'warning',
        label: `Due in ${diffDays}d`,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      days: diffDays,
      status: 'safe',
      label: `${diffDays}d remaining`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }, [student, language]);

  // Helper for skill level badge
  const renderSkillLevelBadge = (label: string, level?: SkillCompetencyLevel, score?: number) => {
    let resolvedLevel = level;
    if (!resolvedLevel && score !== undefined) {
      if (score < 3.0) resolvedLevel = 'Below Level';
      else if (score >= 4.0) resolvedLevel = 'Above Level';
      else resolvedLevel = 'On Track';
    }
    resolvedLevel = resolvedLevel || 'On Track';

    const colorMap: Record<SkillCompetencyLevel, string> = {
      'Below Level': 'bg-rose-50 text-rose-700 border-rose-200',
      'On Track': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Above Level': 'bg-blue-50 text-blue-700 border-blue-200',
      'N/A': 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colorMap[resolvedLevel]}`}
      >
        <span className="font-medium text-slate-500">{label}:</span>
        <span>{resolvedLevel}</span>
      </span>
    );
  };

  // Compile Unified Chronological Timeline (DotB Logcall format)
  const unifiedTimeline: UnifiedTimelineEvent[] = useMemo(() => {
    const events: UnifiedTimelineEvent[] = [];

    // 1. 4-Skill Assessments
    assessments.forEach((a) => {
      events.push({
        id: `as-${a.id}`,
        type: 'assessment',
        date: a.assessment_date,
        title: `${'4-Skill Assessment'} — ${tDb(a.period)}`,
        subtitle: a.assessed_by_name ? `${'Assessed by'}: ${a.assessed_by_name}` : undefined,
        content: a.strengths ? `${'Strengths'}: ${tDb(a.strengths)}` : undefined,
        secondaryContent: a.weaknesses ? `${'Areas for Growth'}: ${tDb(a.weaknesses)}` : undefined,
        statusBadge: a.has_academic_risk
          ? {
              label: 'Academic Risk',
              color: 'bg-rose-100 text-rose-800 border-rose-200',
            }
          : {
              label: a.progress_status || ('On Track'),
              color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            },
        metaBadge: a.progress_status
          ? {
              label: a.progress_status,
              color: a.progress_status === 'Needs Attention' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200',
            }
          : undefined,
        rawItem: a,
        actorName: a.assessed_by_name,
      });
    });

    // 2. Parent Feedbacks & Call Logs
    feedbacks.forEach((f) => {
      const channelLabel = f.channel.toUpperCase();
      events.push({
        id: `fb-${f.id}`,
        type: 'feedback',
        date: f.created_at ? f.created_at.split('T')[0] : f.due_date,
        title: `${'Parent Log Call / Feedback'} (${channelLabel})`,
        subtitle: `${f.parent_name} • ${f.parent_phone} • ${'Staff'}: ${f.assigned_staff_name || 'HRT'}`,
        content: tDb(f.content),
        secondaryContent: f.resolution_notes ? `${'Resolution'}: ${tDb(f.resolution_notes)}` : undefined,
        statusBadge:
          f.status === 'resolved'
            ? { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
            : f.status === 'in_progress'
            ? { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200' }
            : { label: 'Open / Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
        metaBadge: {
          label: f.feedback_type.replace('_', ' ').toUpperCase(),
          color: f.feedback_type === 'complaint' ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-purple-100 text-purple-800 border-purple-200',
        },
        rawItem: f,
        actorName: f.assigned_staff_name,
      });
    });

    // 3. Academic Interventions & Tutor Tickets
    interventions.forEach((i) => {
      events.push({
        id: `it-${i.id}`,
        type: 'intervention',
        date: i.created_at ? i.created_at.split('T')[0] : i.due_date,
        title: `${'Academic Intervention Plan'}`,
        subtitle: `${'Assigned to'}: ${i.assigned_staff_name || 'HRT'} • ${'Due'}: ${i.due_date}`,
        content: `${'Issue'}: ${tDb(i.issue_description)}`,
        secondaryContent: `${'Action Plan'}: ${tDb(i.action_plan)}${
          i.verification_notes ? ` | ${'Verification'}: ${tDb(i.verification_notes)}` : ''
        }`,
        statusBadge:
          i.status === 'verified'
            ? { label: 'Verified by CM/HT', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
            : i.status === 'resolved'
            ? { label: 'Resolved (Awaiting Verification)', color: 'bg-blue-100 text-blue-800 border-blue-200' }
            : { label: 'Open Ticket', color: 'bg-rose-100 text-rose-800 border-rose-200' },
        rawItem: i,
        actorName: i.assigned_staff_name,
      });
    });

    // 4. Care Tasks / Reminders
    careTasks.forEach((t) => {
      events.push({
        id: `ct-${t.id}`,
        type: 'care_task',
        date: t.due_date,
        title: `${'Care Task'}: ${tDb(t.title)}`,
        subtitle: `${'Due Date'}: ${t.due_date}`,
        content: t.notes ? tDb(t.notes) : undefined,
        statusBadge:
          t.status === 'completed'
            ? { label: 'Completed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
            : { label: 'Pending', color: 'bg-amber-100 text-amber-800 border-amber-200' },
        rawItem: t,
      });
    });

    // 5. Tutor / Supplementary Sessions
    tutorSessions.forEach((s) => {
      const attendeeRecord = s.attendees?.find((att) => att.student_id === student?.id);
      events.push({
        id: `ts-${s.id}`,
        type: 'tutor',
        date: s.session_date,
        title: `${'Supplementary Tutor Session'}: ${tDb(s.title)}`,
        subtitle: `${s.start_time} - ${s.end_time} • ${'Teacher'}: ${s.teacher_name || 'Lead Teacher'}`,
        content: `${'Topic'}: ${tDb(s.topic)} • ${'Objective'}: ${tDb(s.target_objective)}`,
        secondaryContent: attendeeRecord?.teacher_feedback
          ? `${'Tutor Feedback'}: ${tDb(attendeeRecord.teacher_feedback)}`
          : undefined,
        statusBadge: {
          label:
            attendeeRecord?.attendance_status === 'attended' || attendeeRecord?.attendance_status === 'present'
              ? ('Attended')
              : attendeeRecord?.attendance_status === 'absent'
              ? ('Absent')
              : attendeeRecord?.attendance_status === 'excused'
              ? ('Excused')
              : ('Scheduled'),
          color:
            attendeeRecord?.attendance_status === 'attended' || attendeeRecord?.attendance_status === 'present'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : attendeeRecord?.attendance_status === 'absent'
              ? 'bg-rose-100 text-rose-800 border-rose-200'
              : 'bg-blue-100 text-blue-800 border-blue-200',
        },
        rawItem: s,
        actorName: s.teacher_name,
      });
    });

    // 6. Class Transfers
    transfers.forEach((tr) => {
      events.push({
        id: `tr-${tr.id}`,
        type: 'transfer',
        date: tr.transfer_date,
        title: `${'Class Transfer'}: ${tr.from_class_name || 'Previous Class'} → ${tr.to_class_name || 'New Class'}`,
        subtitle: tr.transferred_by_name ? `${'Transferred by'}: ${tr.transferred_by_name}` : undefined,
        content: `${'Reason'}: ${tDb(tr.reason)}`,
        statusBadge: {
          label: 'Transferred',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        },
        rawItem: tr,
        actorName: tr.transferred_by_name,
      });
    });

    // Sort descending by date
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assessments, feedbacks, interventions, careTasks, tutorSessions, transfers, language, tDb, student?.id]);

  // Filtered timeline based on tab and search
  const filteredTimeline = useMemo(() => {
    return unifiedTimeline.filter((item) => {
      // Tab filter
      if (activeTab === 'assessments' && item.type !== 'assessment') return false;
      if (activeTab === 'feedback' && item.type !== 'feedback') return false;
      if (activeTab === 'interventions' && item.type !== 'intervention' && item.type !== 'tutor') return false;
      if (activeTab === 'history' && item.type !== 'transfer' && item.type !== 'care_task') return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchContent = item.content?.toLowerCase().includes(query);
        const matchSub = item.subtitle?.toLowerCase().includes(query);
        return matchTitle || matchContent || matchSub;
      }
      return true;
    });
  }, [unifiedTimeline, activeTab, searchTerm]);

  // Latest assessment stats
  const latestAssessment = assessments[0];
  const hasAcademicRisk = assessments.some((a) => a.has_academic_risk) || interventions.some((i) => i.status !== 'verified');
  const openInterventionCount = interventions.filter((i) => i.status === 'open' || i.status === 'in_progress').length;
  const pendingFeedbackCount = feedbacks.filter((f) => f.status === 'open' || f.status === 'in_progress').length;

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ================================================================== */}
        {/* MODAL HEADER: Rich Student Profile Identity Bar */}
        {/* ================================================================== */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#012147] via-[#043264] to-[#026fd7] text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-xl font-bold shadow-inner">
                {student.full_name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-white">{student.full_name}</h2>
                  {student.nickname && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-xs shadow-xs">
                      {student.nickname}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-white font-mono text-xs font-semibold border border-white/20">
                    {student.student_code}
                  </span>
                  {hasAcademicRisk ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/25 border border-rose-400 text-rose-200 text-xs font-semibold">
                      <AlertTriangle className="w-3 h-3 text-rose-300" />
                      {'Academic Attention'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400 text-emerald-200 text-xs font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                      {'Good Standing'}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sky-100 mt-1.5 font-light">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-300" />
                    <strong>{student.current_class?.name || ('Unassigned Class')}</strong>
                    {student.current_class?.level && ` (${student.current_class.level})`}
                  </span>
                  <span>•</span>
                  <span>{'Main Teacher'}: {student.current_class?.main_teacher_name || 'Jamie William'}</span>
                  <span>•</span>
                  <span>
                    HRT: {student.assigned_hrt?.full_name || student.effective_hrt_name || 'Minh'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto pt-2 sm:pt-0 border-t border-white/10 sm:border-none">
              {onOpenAddAssessment && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddAssessment(student);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-[#043264] hover:bg-sky-50 font-semibold text-xs transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {'+ Assessment'}
                </button>
              )}

              {onOpenAddFeedback && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddFeedback(student);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-sky-300" />
                  {'+ Log Call'}
                </button>
              )}

              {onOpenIntervention && hasAcademicRisk && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenIntervention(student);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-rose-100 font-semibold text-xs border border-rose-400/40 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {'Intervention'}
                </button>
              )}
            </div>
          </div>

          {/* Quick info badges row */}
          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-xs">
              <span className="text-[10px] text-sky-200 block uppercase font-medium">
                {'Parent & Phone'}
              </span>
              <span className="font-semibold text-white truncate block">
                {student.parent_name} • {student.parent_phone}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-xs">
              <span className="text-[10px] text-sky-200 block uppercase font-medium">
                {'Tuition Expiry'}
              </span>
              <span className="font-semibold text-white font-mono block">
                {student.tuition_expiry_date ? `${student.tuition_expiry_date} (${tuitionInfo.label})` : 'Not Set (Pending)'}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-xs">
              <span className="text-[10px] text-sky-200 block uppercase font-medium">
                {'Open Interventions'}
              </span>
              <span className={`font-semibold ${openInterventionCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {openInterventionCount} {'active'}
              </span>
            </div>
            <div className="bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-xs">
              <span className="text-[10px] text-sky-200 block uppercase font-medium">
                {'Pending Feedback'}
              </span>
              <span className={`font-semibold ${pendingFeedbackCount > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {pendingFeedbackCount} {'pending'}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* LATEST 4-SKILL COMPETENCY SNAPSHOT (Cambridge & Oxford Quality) */}
        {/* ================================================================== */}
        {latestAssessment && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#043264]" />
              <span className="font-bold text-slate-800">
                {'Latest 4-Skill Competency'} ({tDb(latestAssessment.period)} - {latestAssessment.assessment_date}):
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {renderSkillLevelBadge('Listening', latestAssessment.listening_level, latestAssessment.listening_score)}
              {renderSkillLevelBadge('Speaking', latestAssessment.speaking_level, latestAssessment.speaking_score)}
              {renderSkillLevelBadge('Reading', latestAssessment.reading_level, latestAssessment.reading_score)}
              {renderSkillLevelBadge('Writing', latestAssessment.writing_level, latestAssessment.writing_score)}
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* NAVIGATION TABS & SEARCH BAR */}
        {/* ================================================================== */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-[#043264] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {'All Activities (Log Call)'} ({unifiedTimeline.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('assessments')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'assessments'
                  ? 'bg-[#043264] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {'4-Skill Assessments'} ({assessments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'bg-[#043264] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {'Parent Feedback & Calls'} ({feedbacks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('interventions')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'interventions'
                  ? 'bg-[#043264] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {'Interventions & Tutor'} ({interventions.length + tutorSessions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-[#043264] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {'Enrollment & Tasks'} ({transfers.length + careTasks.length})
            </button>
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={'Filter log notes...'}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
            />
          </div>
        </div>

        {/* ================================================================== */}
        {/* UNIFIED LOGCALL TIMELINE FEED */}
        {/* ================================================================== */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              {'Loading student complete log history...'}
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <History className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">
                {'No Log Activity Found'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {'Record assessments, parent care calls, or tutor interventions to track student growth.'}
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {filteredTimeline.map((item) => {
                // Determine icon & color based on event type
                let iconEl = <ClipboardCheck className="w-4 h-4 text-blue-600" />;
                let dotBorder = 'border-blue-500 bg-blue-50';

                if (item.type === 'feedback') {
                  iconEl = <PhoneCall className="w-4 h-4 text-purple-600" />;
                  dotBorder = 'border-purple-500 bg-purple-50';
                } else if (item.type === 'intervention') {
                  iconEl = <ShieldAlert className="w-4 h-4 text-rose-600" />;
                  dotBorder = 'border-rose-500 bg-rose-50';
                } else if (item.type === 'tutor') {
                  iconEl = <GraduationCap className="w-4 h-4 text-emerald-600" />;
                  dotBorder = 'border-emerald-500 bg-emerald-50';
                } else if (item.type === 'transfer') {
                  iconEl = <ArrowRightLeft className="w-4 h-4 text-indigo-600" />;
                  dotBorder = 'border-indigo-500 bg-indigo-50';
                } else if (item.type === 'care_task') {
                  iconEl = <CheckCircle2 className="w-4 h-4 text-amber-600" />;
                  dotBorder = 'border-amber-500 bg-amber-50';
                }

                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node Dot */}
                    <div
                      className={`absolute -left-6 top-3 w-5 h-5 rounded-full border-2 ${dotBorder} flex items-center justify-center -translate-x-1/2 z-10 transition-transform group-hover:scale-110 shadow-2xs`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                    </div>

                    {/* Timeline Event Card */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-slate-100">{iconEl}</span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm">{item.title}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {item.metaBadge && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.metaBadge.color}`}
                            >
                              {item.metaBadge.label}
                            </span>
                          )}
                          {item.statusBadge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.statusBadge.color}`}
                            >
                              {item.statusBadge.label}
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                            {item.date}
                          </span>
                        </div>
                      </div>

                      {item.subtitle && (
                        <p className="text-[11px] text-slate-500 mt-2 font-medium">{item.subtitle}</p>
                      )}

                      {/* 4-Skill breakdown if assessment */}
                      {item.type === 'assessment' && item.rawItem && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-2.5">
                          {renderSkillLevelBadge('Listening', item.rawItem.listening_level, item.rawItem.listening_score)}
                          {renderSkillLevelBadge('Speaking', item.rawItem.speaking_level, item.rawItem.speaking_score)}
                          {renderSkillLevelBadge('Reading', item.rawItem.reading_level, item.rawItem.reading_score)}
                          {renderSkillLevelBadge('Writing', item.rawItem.writing_level, item.rawItem.writing_score)}
                        </div>
                      )}

                      {item.content && (
                        <div className="text-xs text-slate-700 mt-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                          {item.content}
                        </div>
                      )}

                      {item.secondaryContent && (
                        <div className="text-xs text-slate-600 mt-1.5 pl-2 border-l-2 border-[#043264]/40 font-light italic">
                          {item.secondaryContent}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {`Showing comprehensive log record for student ID ${student.student_code}`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
          >
            {'Close Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};
