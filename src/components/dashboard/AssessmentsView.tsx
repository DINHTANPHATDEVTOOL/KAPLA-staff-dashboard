// ==============================================================================
// KAPLA Staff Dashboard — T04: 4-Skill Cambridge & Oxford Assessments
// Upgraded according to Customer Feedback:
// 1. Level-based rubrics (Below Level / On Track / Above Level / N/A)
// 2. Student Selection with Class Code filter & preview card (Image 2)
// 3. DotB-style date range, month, class, risky, progress filters (Image 7 & 8)
// 4. DotB CRM logcall table view for handling hundreds of students monthly
// 5. One-click open full Student Profile & Logcall Modal (Image 5 & 6)
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Shield,
  Sparkles,
  ChevronRight,
  User,
  GraduationCap,
  Calendar,
  X,
  ArrowRight,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  StudentAssessment,
  Student,
  ClassRoom,
  SkillCompetencyLevel,
  ProgressEvaluation,
} from '../../types';
import { AssessmentService, StudentService, realSupabase, MockStorageService, subscribeToTableChanges } from '../../lib/supabase';
import { StudentProfileModal } from './StudentProfileModal';

interface AssessmentsViewProps {
  onNavigateToIntervention?: (studentId: string, assessmentId: string, issue: string) => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({ onNavigateToIntervention }) => {
  const { currentBranch, profile, activeRole } = useAuth();
  const { t, tDb, language } = useLanguage();

  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const isHT = activeRole === 'Head Teacher' || (activeRole as string) === 'HT';
  const isHRT = activeRole === 'HRT';
  const isTeacher = activeRole === 'Main Teacher' || activeRole === 'Supplementary Teacher';
  const canCreateAssessment = isSysAdmin || isCM || isHT || isHRT || isTeacher;

  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter classes according to teacher assignment if logged in as Teacher
  const displayedClasses = useMemo(() => {
    if (!isTeacher) return classes;
    const teacherName = profile?.full_name?.toLowerCase();
    const teacherId = profile?.id;
    return classes.filter(
      (c) =>
        c.main_teacher_id === teacherId ||
        (teacherName && c.main_teacher_name?.toLowerCase() === teacherName) ||
        c.ta_id === teacherId ||
        (teacherName && c.ta_name?.toLowerCase() === teacherName)
    );
  }, [classes, isTeacher, profile]);

  // View Mode: 'table' (Log View) or 'cards'
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Student Profile Modal state
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // Filter States matching Customer Feedback (Image 7, 8, 9)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');

  // Customer Request: Month-by-month filtering & pending students detection
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [assessmentViewTab, setAssessmentViewTab] = useState<'completed' | 'pending'>('completed');
  const [targetMonth, setTargetMonth] = useState<string>(currentMonthKey);

  // Modal Create 4-Skill Assessment state (Image 2)
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [filterClassForSelect, setFilterClassForSelect] = useState<string>('');
  const [isChangingStudent, setIsChangingStudent] = useState<boolean>(false);

  const [form, setForm] = useState<{
    student_id: string;
    class_id: string;
    period: string;
    assessment_date: string;
    progress_status: ProgressEvaluation;
    listening_level: SkillCompetencyLevel;
    speaking_level: SkillCompetencyLevel;
    reading_level: SkillCompetencyLevel;
    writing_level: SkillCompetencyLevel;
    strengths: string;
    weaknesses: string;
    progress_notes: string;
  }>({
    student_id: '',
    class_id: '',
    period: 'Mid-Term',
    assessment_date: new Date().toISOString().split('T')[0],
    progress_status: 'Improved',
    listening_level: 'On Track',
    speaking_level: 'On Track',
    reading_level: 'On Track',
    writing_level: 'On Track',
    strengths: '',
    weaknesses: '',
    progress_notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [assessList, stuList] = await Promise.all([
        AssessmentService.getAssessments(branchId),
        StudentService.getStudents(branchId, profile?.id, isSysAdmin, isCM),
      ]);
      setAssessments(assessList);
      setStudents(stuList);

      if (realSupabase) {
        let cq = realSupabase.from('classes').select('*').eq('status', 'active');
        if (branchId) cq = cq.eq('branch_id', branchId);
        const { data: cData } = await cq;
        if (cData) setClasses(cData);
      } else {
        const cls = MockStorageService.getClasses();
        setClasses(branchId ? cls.filter((c) => c.branch_id === branchId) : cls);
      }
    } catch (err) {
      console.error('Error loading assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToTableChanges('student_assessments', loadData);
  }, [currentBranch?.id]);

  // Selected student in modal
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === form.student_id) || null;
  }, [students, form.student_id]);

  // Students filtered for modal selection
  const modalFilteredStudents = useMemo(() => {
    if (!filterClassForSelect) return students;
    return students.filter((s) => s.current_class_id === filterClassForSelect);
  }, [students, filterClassForSelect]);

  const handleStudentSelect = (studentId: string) => {
    const stu = students.find((s) => s.id === studentId);
    setForm((prev) => ({
      ...prev,
      student_id: studentId,
      class_id: stu?.current_class_id || '',
    }));
    setIsChangingStudent(false);
  };

  // Convert level to numeric score for backwards compatibility
  const levelToScore = (level: SkillCompetencyLevel): number => {
    switch (level) {
      case 'Above Level':
        return 4.5;
      case 'On Track':
        return 3.5;
      case 'Below Level':
        return 2.5;
      case 'N/A':
      default:
        return 3.0;
    }
  };

  // Resolve skill level from record
  const resolveSkillLevel = (level?: SkillCompetencyLevel, score?: number): SkillCompetencyLevel => {
    if (level) return level;
    if (score === undefined || score === null) return 'On Track';
    if (score < 3.0) return 'Below Level';
    if (score >= 4.0) return 'Above Level';
    return 'On Track';
  };

  // Skill badge renderer
  const renderSkillBadge = (label: string, level?: SkillCompetencyLevel, score?: number) => {
    const resolved = resolveSkillLevel(level, score);
    const colorMap: Record<SkillCompetencyLevel, string> = {
      'Below Level': 'bg-rose-50 text-rose-700 border-rose-200',
      'On Track': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Above Level': 'bg-blue-50 text-blue-700 border-blue-200',
      'N/A': 'bg-slate-100 text-slate-600 border-slate-200',
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colorMap[resolved]}`}
      >
        <span className="text-slate-500 font-medium">{label}:</span>
        <span>{resolved}</span>
      </span>
    );
  };

  // Submit assessment (Image 2 & 9)
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !form.student_id) return;
    setSubmitting(true);
    try {
      const hasRisk =
        form.listening_level === 'Below Level' ||
        form.speaking_level === 'Below Level' ||
        form.reading_level === 'Below Level' ||
        form.writing_level === 'Below Level' ||
        form.progress_status === 'Needs Attention';

      await AssessmentService.createAssessment({
        student_id: form.student_id,
        class_id: form.class_id || undefined,
        branch_id: currentBranch.id,
        period: form.period,
        assessment_date: form.assessment_date,
        listening_score: levelToScore(form.listening_level),
        speaking_score: levelToScore(form.speaking_level),
        reading_score: levelToScore(form.reading_level),
        writing_score: levelToScore(form.writing_level),
        listening_level: form.listening_level,
        speaking_level: form.speaking_level,
        reading_level: form.reading_level,
        writing_level: form.writing_level,
        progress_status: form.progress_status,
        strengths: form.strengths.trim() || undefined,
        weaknesses: form.weaknesses.trim() || undefined,
        progress_notes: form.progress_notes.trim() || undefined,
        assessed_by: profile?.id,
      });

      setShowModal(false);
      setForm({
        student_id: '',
        class_id: '',
        period: 'Mid-Term',
        assessment_date: new Date().toISOString().split('T')[0],
        progress_status: 'Improved',
        listening_level: 'On Track',
        speaking_level: 'On Track',
        reading_level: 'On Track',
        writing_level: 'On Track',
        strengths: '',
        weaknesses: '',
        progress_notes: '',
      });
      setIsChangingStudent(false);
      await loadData();
    } catch (err: any) {
      console.error('Error creating assessment:', err);
      alert(err.message || 'Error saving assessment');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered assessments (with DotB style Date, Class, Risky, Progress filters)
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const stuName = a.student?.full_name || '';
      const stuCode = a.student?.student_code || '';
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        stuName.toLowerCase().includes(query) ||
        stuCode.toLowerCase().includes(query) ||
        a.period.toLowerCase().includes(query) ||
        (a.assessed_by_name && a.assessed_by_name.toLowerCase().includes(query));

      const matchClass = classFilter === 'all' || a.class_id === classFilter;

      // Risk filter
      const matchRisk =
        riskFilter === 'all' ||
        (riskFilter === 'risk' && a.has_academic_risk) ||
        (riskFilter === 'safe' && !a.has_academic_risk);

      // Progress filter (Image 9)
      const prog = a.progress_status || (a.has_academic_risk ? 'Needs Attention' : 'Improved');
      const matchProgress = progressFilter === 'all' || prog === progressFilter;

      // Date Range & Month filter (Image 8)
      let matchDate = true;
      if (dateFrom && a.assessment_date < dateFrom) matchDate = false;
      if (dateTo && a.assessment_date > dateTo) matchDate = false;

      if (monthFilter !== 'all') {
        const assessMonth = a.assessment_date.substring(0, 7); // YYYY-MM
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        if (monthFilter === 'this_month' && assessMonth !== currentMonthStr) matchDate = false;
        if (monthFilter === 'last_month' && assessMonth !== lastMonthStr) matchDate = false;
      }

      return matchSearch && matchClass && matchRisk && matchProgress && matchDate;
    });
  }, [assessments, searchTerm, classFilter, riskFilter, progressFilter, dateFrom, dateTo, monthFilter]);

  // Pending students for targetMonth (Customer Request: filter all students by month to view pending evaluations)
  const pendingStudents = useMemo(() => {
    return students.filter((s) => {
      const hasAssessment = assessments.some((a) => {
        if (targetMonth === 'all') return a.student_id === s.id;
        return a.student_id === s.id && a.assessment_date && a.assessment_date.startsWith(targetMonth);
      });
      if (hasAssessment) return false;
      if (classFilter !== 'all' && s.current_class_id !== classFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return s.full_name.toLowerCase().includes(q) || s.student_code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [students, assessments, targetMonth, classFilter, searchTerm]);

  // Overall stats
  const stats = useMemo(() => {
    const total = assessments.length;
    const riskCount = assessments.filter((a) => a.has_academic_risk).length;
    const safeCount = total - riskCount;
    const improvedCount = assessments.filter((a) => a.progress_status === 'Improved').length;
    const improvedRate = total > 0 ? Math.round((improvedCount / total) * 100) : 0;
    return { total, riskCount, safeCount, improvedCount, improvedRate };
  }, [assessments]);

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* HEADER WITH VIEW MODE TOGGLE & ACTION */}
      {/* ==================================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#043264]">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('assessments.title', '4-Skill Competency Assessments')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {`Track Listening, Speaking, Reading, Writing via Cambridge & Oxford standards at ${currentBranch?.name || 'KAPLA'}`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* View Mode Toggle: Log Table vs Cards */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title={t('assessments.viewModeLog', 'Log / Table View')}
            >
              <List className="w-4 h-4" />
              <span className="hidden md:inline">{t('assessments.viewModeLog', 'Log View')}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title={t('assessments.viewModeCards', 'Card View')}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">{t('assessments.viewModeCards', 'Cards')}</span>
            </button>
          </div>

          {canCreateAssessment && (
            <button
              type="button"
              onClick={() => {
                // Pre-select first student if available
                if (!form.student_id && students.length > 0) {
                  const s = students[0];
                  setForm((prev) => ({
                    ...prev,
                    student_id: s.id,
                    class_id: s.current_class_id || '',
                  }));
                }
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t('assessments.addBtn', 'Add 4-Skill Assessment')}
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* STATS CARDS */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {'Total Assessments'}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-400">
            {'Evaluated cohort records'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            {'On Track & Above'}
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.safeCount}</div>
          <span className="text-[10px] text-emerald-600">
            {'Competency standards met'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            {'Academic Risk (< Level)'}
          </span>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.riskCount}</div>
          <span className="text-[10px] text-rose-600 font-medium">
            {'Requires Intervention'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
            {'Progress Rate'}
          </span>
          <div className="text-2xl font-bold text-blue-800 mt-1">{stats.improvedRate}%</div>
          <span className="text-[10px] text-blue-600">
            {'Marked as Improved'}
          </span>
        </div>
      </div>

      {/* Primary Tab Selector (Completed Assessments vs Pending Students for Target Month) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setAssessmentViewTab('completed')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              assessmentViewTab === 'completed'
                ? 'bg-white text-[#043264] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-[#043264]" />
            <span>Completed Assessments ({filteredAssessments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAssessmentViewTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              assessmentViewTab === 'pending'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>⚠️ Pending Students to Assess ({pendingStudents.length})</span>
          </button>
        </div>

        {/* Month Selector for Pending Students */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-600">Target Month:</span>
          <select
            value={targetMonth}
            onChange={(e) => setTargetMonth(e.target.value)}
            className="bg-transparent text-xs font-bold text-[#043264] focus:outline-none cursor-pointer"
          >
            <option value={currentMonthKey}>This Month ({currentMonthKey})</option>
            <option value="2026-10">October 2026 (2026-10)</option>
            <option value="2026-09">September 2026 (2026-09)</option>
            <option value="2026-08">August 2026 (2026-08)</option>
            <option value="all">All Months</option>
          </select>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FILTER CONTROLS (DotB style: Date Range, Class, Risky, Progress) */}
      {/* ==================================================================== */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                'Search by student name, code, period, assessor...'
              }
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
            />
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap items-center gap-2">
            {/* Class filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
            >
              <option value="all">{isTeacher ? 'All Assigned Classes' : t('students.allClasses', 'All Classes')}</option>
              {displayedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.level})
                </option>
              ))}
            </select>

            {/* Academic Risk filter (Image 7) */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 font-medium"
            >
              <option value="all">{'All Risk Levels'}</option>
              <option value="risk">{'Academic Risk (Below Level)'}</option>
              <option value="safe">{'On Track & Above'}</option>
            </select>

            {/* Progress vs Previous filter (Image 9) */}
            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 font-medium"
            >
              <option value="all">{'All Progress'}</option>
              <option value="Improved">{'Improved'}</option>
              <option value="Maintained">{'Maintained'}</option>
              <option value="Needs Attention">{'Needs Attention'}</option>
              <option value="First Assessment">{'First Assessment'}</option>
            </select>

            {/* Month shortcut filter (Image 8) */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
            >
              <option value="all">{'All Months'}</option>
              <option value="this_month">{'This Month'}</option>
              <option value="last_month">{'Last Month'}</option>
            </select>
          </div>
        </div>

        {/* Date Range Row (DotB style date filter) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-500">{'Date (From):'}</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 rounded-md border border-slate-200 text-xs bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-500">{'Date (To):'}</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 rounded-md border border-slate-200 text-xs bg-white"
            />
          </div>

          {(dateFrom || dateTo || monthFilter !== 'all' || riskFilter !== 'all' || progressFilter !== 'all' || classFilter !== 'all' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setMonthFilter('all');
                setRiskFilter('all');
                setProgressFilter('all');
                setClassFilter('all');
                setSearchTerm('');
              }}
              className="text-[#026fd7] hover:underline font-medium text-xs ml-auto"
            >
              {'Reset All Filters'}
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW: PENDING STUDENTS FOR TARGET MONTH (Image 2) */}
      {/* ==================================================================== */}
      {assessmentViewTab === 'pending' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-amber-50/70 border-b border-amber-200/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-900">
                Pending Monthly Evaluation • {targetMonth === 'all' ? 'All Months' : targetMonth} ({pendingStudents.length} Students)
              </span>
            </div>
            <span className="text-[11px] text-amber-700">
              Click &quot;Assess Student&quot; to submit Cambridge &amp; Oxford competency report
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading student list...</div>
          ) : pendingStudents.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">
                All Students Evaluated for {targetMonth}!
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Zero pending assessments remaining. All enrolled students have their Cambridge evaluations recorded.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Student ID &amp; Name</th>
                    <th className="py-3 px-4">Class &amp; Level</th>
                    <th className="py-3 px-4">Parent Contact</th>
                    <th className="py-3 px-4">Assigned HRT</th>
                    <th className="py-3 px-4">Tuition Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForProfile(s)}
                            className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform"
                          >
                            {s.full_name.charAt(0)}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForProfile(s)}
                              className="font-semibold text-slate-900 hover:text-[#026fd7] hover:underline text-left block"
                            >
                              {s.full_name}
                            </button>
                            <span className="font-mono text-[11px] text-slate-500">{s.student_code}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {s.current_class ? (
                          <div>
                            <span className="font-semibold text-slate-800">{s.current_class.name}</span>
                            <div className="text-[11px] text-slate-500">{s.current_class.level}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{tDb(s.parent_name)}</div>
                        <span className="font-mono text-[11px] text-slate-500">{s.parent_phone}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        {s.assigned_hrt?.full_name || s.effective_hrt_name || 'Class Default'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] text-slate-700">{s.tuition_expiry_date}</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              student_id: s.id,
                              class_id: s.current_class_id || '',
                              assessment_date: targetMonth !== 'all' ? `${targetMonth}-15` : new Date().toISOString().split('T')[0],
                              period: targetMonth !== 'all' ? `Monthly Eval ${targetMonth}` : 'Monthly Evaluation',
                            }));
                            setShowModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#043264] hover:bg-[#012147] text-white transition-all shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assess Student</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              {'Loading assessment records...'}
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">
                {'No Assessments Found'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {'Adjust your filter criteria or record a new 4-skill assessment.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">{'Date'}</th>
                    <th className="py-3 px-4">{'Student'}</th>
                    <th className="py-3 px-4">{'Class & Level'}</th>
                    <th className="py-3 px-4">{'Term'}</th>
                    <th className="py-3 px-4">{'4-Skill Competencies'}</th>
                    <th className="py-3 px-4">{'Progress'}</th>
                    <th className="py-3 px-4">{'Risk Status'}</th>
                    <th className="py-3 px-4">{'Assessed By'}</th>
                    <th className="py-3 px-4 text-right">{'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAssessments.map((a) => {
                    const prog = a.progress_status || (a.has_academic_risk ? 'Needs Attention' : 'Improved');
                    const studentObj = a.student || students.find((s) => s.id === a.student_id);

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Date */}
                        <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                          {a.assessment_date}
                        </td>

                        {/* Student Name (Clickable to open profile logcall) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => studentObj && setSelectedStudentForProfile(studentObj)}
                              className="w-7 h-7 rounded-full bg-blue-100 text-[#043264] font-bold text-xs flex items-center justify-center hover:scale-105 transition-transform"
                            >
                              {(a.student?.full_name || 'H').charAt(0)}
                            </button>
                            <div>
                              <button
                                type="button"
                                onClick={() => studentObj && setSelectedStudentForProfile(studentObj)}
                                className="font-semibold text-slate-900 hover:text-[#026fd7] hover:underline text-left block"
                              >
                                {a.student?.full_name || 'Student'}
                              </button>
                              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                                {a.student?.student_code || '---'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-800">{a.class?.name || 'PH-Starters-01'}</div>
                          <div className="text-[11px] text-slate-500">{a.class?.level || 'Starters'}</div>
                        </td>

                        {/* Term */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {tDb(a.period)}
                          </span>
                        </td>

                        {/* 4 Skills Competencies Badges */}
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {renderSkillBadge('L', a.listening_level, a.listening_score)}
                            {renderSkillBadge('S', a.speaking_level, a.speaking_score)}
                            {renderSkillBadge('R', a.reading_level, a.reading_score)}
                            {renderSkillBadge('W', a.writing_level, a.writing_score)}
                          </div>
                        </td>

                        {/* Progress vs Previous */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              prog === 'Improved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : prog === 'Maintained'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {prog}
                          </span>
                        </td>

                        {/* Risk status */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {a.has_academic_risk ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {'Risk'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {'On Track'}
                            </span>
                          )}
                        </td>

                        {/* Assessed By */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {a.assessed_by_name || 'Minh'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {studentObj && (
                              <button
                                type="button"
                                title={'Open Student Profile & Logcall'}
                                onClick={() => setSelectedStudentForProfile(studentObj)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-[#043264] hover:bg-blue-50 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            {a.has_academic_risk && onNavigateToIntervention && (
                              <button
                                type="button"
                                title={'Create Intervention Ticket'}
                                onClick={() =>
                                  onNavigateToIntervention(
                                    a.student_id,
                                    a.id,
                                    `Weak skills: ${a.weaknesses || 'Academic intervention required'}`
                                  )
                                }
                                className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* ==================================================================== */
        /* VIEW MODE 2: CARDS VIEW */
        /* ==================================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 p-12 text-center text-xs text-slate-500">
              {'Loading assessments...'}
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200">
              <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">
                {'No Assessments Found'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {'Add the first 4-skill assessment for this class cohort.'}
              </p>
            </div>
          ) : (
            filteredAssessments.map((a) => {
              const studentObj = a.student || students.find((s) => s.id === a.student_id);

              return (
                <div
                  key={a.id}
                  className={`p-5 rounded-2xl border transition-shadow bg-white flex flex-col justify-between ${
                    a.has_academic_risk
                      ? 'border-rose-300 shadow-xs ring-1 ring-rose-200'
                      : 'border-slate-200 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => studentObj && setSelectedStudentForProfile(studentObj)}
                            className="font-bold text-slate-900 text-sm hover:text-[#026fd7] hover:underline text-left cursor-pointer"
                          >
                            {a.student?.full_name || ('Student')}
                          </button>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({a.class?.name || ('Class')})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {tDb(a.period)} • {'Date: '}
                          {a.assessment_date}
                          {a.progress_status && ` • ${a.progress_status}`}
                        </div>
                      </div>

                      {a.has_academic_risk ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {'Academic Risk'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          {'Standard Progress'}
                        </span>
                      )}
                    </div>

                    {/* 4 Skills Competency Badges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                          {'Listening'}
                        </span>
                        {renderSkillBadge('', a.listening_level, a.listening_score)}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                          {'Speaking'}
                        </span>
                        {renderSkillBadge('', a.speaking_level, a.speaking_score)}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                          {'Reading'}
                        </span>
                        {renderSkillBadge('', a.reading_level, a.reading_score)}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                        <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                          {'Writing'}
                        </span>
                        {renderSkillBadge('', a.writing_level, a.writing_score)}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5 text-xs text-slate-600">
                      {a.strengths && (
                        <p>
                          <strong className="text-emerald-700">
                            {'Strengths: '}
                          </strong>
                          {tDb(a.strengths)}
                        </p>
                      )}
                      {a.weaknesses && (
                        <p>
                          <strong className="text-rose-700">
                            {'Areas for Growth: '}
                          </strong>
                          {tDb(a.weaknesses)}
                        </p>
                      )}
                      {a.progress_notes && (
                        <p className="text-[11px] text-slate-500 italic">"{tDb(a.progress_notes)}"</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      {'Assessed by: '}
                      {a.assessed_by_name}
                    </span>

                    <div className="inline-flex items-center gap-2">
                      {studentObj && (
                        <button
                          type="button"
                          onClick={() => setSelectedStudentForProfile(studentObj)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {'Profile'}
                        </button>
                      )}

                      {a.has_academic_risk && onNavigateToIntervention && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateToIntervention(
                              a.student_id,
                              a.id,
                              `Weak skills: ${a.weaknesses || 'Academic intervention required'}`
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {'Open Ticket'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ADD 4-SKILL ASSESSMENT (EXACTLY MATCHING CUSTOMER IMAGE 2 & 9) */}
      {/* ==================================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {t('assessments.modalTitle', 'Add 4-Skill Assessment')}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 text-xs">
              {/* SECTION 1: Student Selection (Filter by Class Code first) * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-semibold text-slate-800">
                    {t('assessments.studentSelection', 'Student Selection (Filter by Class Code first)')}
                    <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  {selectedStudent && !isChangingStudent && (
                    <button
                      type="button"
                      onClick={() => setIsChangingStudent(true)}
                      className="text-xs font-semibold text-[#026fd7] hover:underline"
                    >
                      {t('assessments.switchStudent', 'Switch student')}
                    </button>
                  )}
                </div>

                {/* Selected Student Preview Card (Exact look of Image 2) */}
                {selectedStudent && !isChangingStudent ? (
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#043264] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {selectedStudent.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{selectedStudent.full_name}</span>
                          <span className="px-2 py-0.5 rounded-md bg-white text-[#043264] font-mono font-bold text-[11px] border border-blue-200">
                            {selectedStudent.student_code}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Class: {selectedStudent.current_class?.name || 'PH-L6-0030'} • Level:{' '}
                          {selectedStudent.current_class?.level || 'Level 6'} • Main Teacher:{' '}
                          {selectedStudent.current_class?.main_teacher_name || 'Jamie William'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsChangingStudent(true)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700 text-xs shadow-2xs"
                    >
                      {t('assessments.changeStudent', 'Change')}
                    </button>
                  </div>
                ) : (
                  /* Class filter + Student selector dropdown */
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {'Step 1: Filter by Class Cohort'}
                      </span>
                      <select
                        value={filterClassForSelect}
                        onChange={(e) => setFilterClassForSelect(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="">{isTeacher ? '-- All Assigned Classes --' : '-- All Classes --'}</option>
                        {displayedClasses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.level})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">
                        {'Step 2: Select Student *'}
                      </span>
                      <select
                        required
                        value={form.student_id}
                        onChange={(e) => handleStudentSelect(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                      >
                        <option value="">
                          {'-- Choose student --'}
                        </option>
                        {modalFilteredStudents.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.full_name} ({s.student_code}) - {s.current_class?.name || 'PH-L6-0030'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Term *, Date *, Progress vs Previous (Exact look of Image 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('assessments.term', 'Term *')}
                  </label>
                  <select
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="Final-Term">Final-Term</option>
                    <option value="Monthly Assessment">Monthly Assessment</option>
                    <option value="Semester 1 - Midterm">Semester 1 - Midterm</option>
                    <option value="Semester 1 - Final">Semester 1 - Final</option>
                    <option value="Semester 2 - Midterm">Semester 2 - Midterm</option>
                    <option value="Semester 2 - Final">Semester 2 - Final</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('assessments.date', 'Date *')}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.assessment_date}
                    onChange={(e) => setForm({ ...form, assessment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                  </input>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('assessments.progressVsPrevious', 'Progress vs Previous')}
                  </label>
                  <select
                    value={form.progress_status}
                    onChange={(e) => setForm({ ...form, progress_status: e.target.value as ProgressEvaluation })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="Improved">Improved</option>
                    <option value="Maintained">Maintained</option>
                    <option value="Needs Attention">Needs Attention</option>
                    <option value="First Assessment">First Assessment</option>
                  </select>
                </div>
              </div>

              {/* SECTION 3: Skill Competency Levels (3 Levels & N/A) * (Exact look of Image 2) */}
              <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  {t('assessments.competencyLevels', 'Skill Competency Levels (3 Levels & N/A) *')}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Listening */}
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {t('assessments.listening', 'Listening')}
                    </label>
                    <select
                      value={form.listening_level}
                      onChange={(e) => setForm({ ...form, listening_level: e.target.value as SkillCompetencyLevel })}
                      className={`w-full px-2.5 py-2 rounded-lg border text-xs font-semibold bg-white ${
                        form.listening_level === 'Below Level'
                          ? 'border-rose-300 text-rose-700'
                          : form.listening_level === 'On Track'
                          ? 'border-emerald-300 text-emerald-800'
                          : 'border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Below Level">Below Level</option>
                      <option value="On Track">On Track</option>
                      <option value="Above Level">Above Level</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>

                  {/* Speaking */}
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {t('assessments.speaking', 'Speaking')}
                    </label>
                    <select
                      value={form.speaking_level}
                      onChange={(e) => setForm({ ...form, speaking_level: e.target.value as SkillCompetencyLevel })}
                      className={`w-full px-2.5 py-2 rounded-lg border text-xs font-semibold bg-white ${
                        form.speaking_level === 'Below Level'
                          ? 'border-rose-300 text-rose-700'
                          : form.speaking_level === 'On Track'
                          ? 'border-emerald-300 text-emerald-800'
                          : 'border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Below Level">Below Level</option>
                      <option value="On Track">On Track</option>
                      <option value="Above Level">Above Level</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>

                  {/* Reading */}
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {t('assessments.reading', 'Reading')}
                    </label>
                    <select
                      value={form.reading_level}
                      onChange={(e) => setForm({ ...form, reading_level: e.target.value as SkillCompetencyLevel })}
                      className={`w-full px-2.5 py-2 rounded-lg border text-xs font-semibold bg-white ${
                        form.reading_level === 'Below Level'
                          ? 'border-rose-300 text-rose-700'
                          : form.reading_level === 'On Track'
                          ? 'border-emerald-300 text-emerald-800'
                          : 'border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Below Level">Below Level</option>
                      <option value="On Track">On Track</option>
                      <option value="Above Level">Above Level</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>

                  {/* Writing */}
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {t('assessments.writing', 'Writing')}
                    </label>
                    <select
                      value={form.writing_level}
                      onChange={(e) => setForm({ ...form, writing_level: e.target.value as SkillCompetencyLevel })}
                      className={`w-full px-2.5 py-2 rounded-lg border text-xs font-semibold bg-white ${
                        form.writing_level === 'Below Level'
                          ? 'border-rose-300 text-rose-700'
                          : form.writing_level === 'On Track'
                          ? 'border-emerald-300 text-emerald-800'
                          : 'border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Below Level">Below Level</option>
                      <option value="On Track">On Track</option>
                      <option value="Above Level">Above Level</option>
                      <option value="N/A">N/A</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Strengths & Weaknesses (Exact look of Image 2) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('assessments.strengths', 'Strengths to Celebrate')}
                </label>
                <input
                  type="text"
                  value={form.strengths}
                  onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                  placeholder={
                    'e.g. Confident natural pronunciation, active group engagement...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('assessments.weaknesses', 'Weaknesses to Address')}
                </label>
                <textarea
                  rows={2}
                  value={form.weaknesses}
                  onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                  placeholder={
                    'e.g. Needs grammar support for simple present tense third person -s...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {t('assessments.progressNotes', 'Progress Notes / Next Steps')}
                </label>
                <textarea
                  rows={2}
                  value={form.progress_notes}
                  onChange={(e) => setForm({ ...form, progress_notes: e.target.value })}
                  placeholder={
                    'Teacher guidance, tutor recommendations, or parent notes...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.student_id}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold transition-colors disabled:opacity-50 shadow-xs"
                >
                  {submitting
                    ? ('Saving...')
                    : ('Save Assessment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* STUDENT PROFILE & LOGCALL MODAL (IMAGE 5 & 6) */}
      {/* ==================================================================== */}
      <StudentProfileModal
        student={selectedStudentForProfile}
        isOpen={Boolean(selectedStudentForProfile)}
        onClose={() => setSelectedStudentForProfile(null)}
        onOpenAddAssessment={
          canCreateAssessment
            ? (stu) => {
                setForm((prev) => ({
                  ...prev,
                  student_id: stu.id,
                  class_id: stu.current_class_id || '',
                }));
                setShowModal(true);
              }
            : undefined
        }
      />
    </div>
  );
};
