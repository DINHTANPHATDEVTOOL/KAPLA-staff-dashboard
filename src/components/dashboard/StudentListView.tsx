// ==============================================================================
// KAPLA Staff Dashboard — T03: Student Profiles, Tuition & Enrollments
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  ArrowRightLeft,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  AlertCircle,
  Clock,
  History,
  CheckCircle2,
  AlertTriangle,
  X,
  ChevronRight,
  Shield,
  Sparkles,
  Edit,
  Trash2,
  User,
  Eye,
  PhoneCall,
  MessageSquare,
  ChevronDown,
  Check,
  Star,
  BookOpen,
  Layers,
  Award,
  CalendarRange,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Student,
  StudentStatus,
  ClassRoom,
  UserProfile,
  ClassTransfer,
  StudentAssessment,
  InterventionTicket,
  ParentFeedback,
  RenewalRecord,
  DashboardNavSection,
  SkillCompetencyLevel,
  ProgressEvaluation,
} from '../../types';
import {
  StudentService,
  AssessmentService,
  InterventionService,
  FeedbackService,
  RenewalService,
  realSupabase,
  MockStorageService,
  subscribeToTableChanges,
} from '../../lib/supabase';
import { StudentProfileModal } from './StudentProfileModal';

interface StudentListViewProps {
  onNavigate?: (section: DashboardNavSection) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({ onNavigate }) => {
  const { profile, activeRole, currentBranch } = useAuth();
  const { language, t, tDb } = useLanguage();
  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const isHT = activeRole === 'Head Teacher' || (activeRole as string) === 'HT';
  const isHRT = activeRole === 'HRT';
  const isEC = (activeRole as string) === 'EC' || activeRole === 'CSKH';
  const isSOO = (activeRole as string) === 'SOO';

  // Role permissions per customer specification:
  // HRT, EC, SOO, HT, CM, Admin can create and edit students
  const canCreateStudent = isSysAdmin || isCM || isHT || isHRT || isEC || isSOO;
  const canEditStudent = isSysAdmin || isCM || isHT || isHRT || isEC || isSOO;
  // ONLY Admin account can delete students
  const canDeleteStudent = isSysAdmin;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [hrtStaffs, setHrtStaffs] = useState<UserProfile[]>([]);
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [interventions, setInterventions] = useState<InterventionTicket[]>([]);
  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>([]);
  const [renewals, setRenewals] = useState<RenewalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters matching customer specification
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [academicStatusFilter, setAcademicStatusFilter] = useState<string>('all');
  const [renewalRiskFilter, setRenewalRiskFilter] = useState<string>('all');

  // Month & Date Filtering (Customer Request: filter all students by month to view pending evaluations)
  const currentMonthKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<'all' | 'pending' | 'evaluated' | 'risk'>('all');
  const [dateFieldType, setDateFieldType] = useState<string>('assessment_date');
  const [dateRangeFrom, setDateRangeFrom] = useState<string>('');
  const [dateRangeTo, setDateRangeTo] = useState<string>('');
  const [showDateDropdown, setShowDateDropdown] = useState<boolean>(false);
  const [dateSearchTerm, setDateSearchTerm] = useState<string>('');

  // Quick Assessment Modal state
  const [assessingStudent, setAssessingStudent] = useState<Student | null>(null);
  const [quickAssessForm, setQuickAssessForm] = useState<{
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
    period: 'Monthly Evaluation',
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
  const [quickAssessSubmitting, setQuickAssessSubmitting] = useState<boolean>(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<Student | null>(null);
  const [selectedStudentForHrt, setSelectedStudentForHrt] = useState<Student | null>(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [transferHistory, setTransferHistory] = useState<ClassTransfer[]>([]);

  // Student CRUD Modals state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    student_code: '',
    full_name: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    tuition_expiry_date: '',
    current_class_id: '',
    assigned_hrt_id: '',
    status: 'active' as StudentStatus,
    notes: '',
  });

  // Form states
  const [newStudent, setNewStudent] = useState({
    student_code: '',
    full_name: '',
    date_of_birth: '2017-06-15',
    gender: 'male' as 'male' | 'female',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    tuition_expiry_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
    current_class_id: '',
    assigned_hrt_id: '',
    notes: '',
  });

  const [transferClassId, setTransferClassId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  const [newHrtId, setNewHrtId] = useState<string>('');
  const [hrtReason, setHrtReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [stuData, assessData, intervData, feedData, renewData] = await Promise.all([
        StudentService.getStudents(branchId, profile?.id, isSysAdmin, isCM),
        AssessmentService.getAssessments(branchId),
        InterventionService.getInterventions(branchId),
        FeedbackService.getFeedbacks(branchId),
        RenewalService.getRecords(branchId),
      ]);

      setStudents(stuData);
      setAssessments(assessData);
      setInterventions(intervData);
      setFeedbacks(feedData);
      setRenewals(renewData);

      // Load classes for branch
      if (realSupabase) {
        let cq = realSupabase.from('classes').select('*').eq('status', 'active');
        if (branchId) cq = cq.eq('branch_id', branchId);
        const { data: cData } = await cq;
        if (cData) setClasses(cData);

        // Load HRTs in branch
        const { data: mData } = await realSupabase
          .from('branch_memberships')
          .select('user_id, role, profile:profiles(*)')
          .eq('status', 'active');
        if (mData) {
          const hrts = mData
            .filter((m: any) => m.role === 'HRT' && m.profile)
            .map((m: any) => m.profile);
          setHrtStaffs(hrts);
        }
      } else {
        const cls = MockStorageService.getClasses();
        setClasses(branchId ? cls.filter((c) => c.branch_id === branchId) : cls);

        const profs = MockStorageService.getProfiles();
        const mems = MockStorageService.getMemberships();
        const hrts = mems
          .filter((m) => m.role === 'HRT' && (!branchId || m.branch_id === branchId))
          .map((m) => profs.find((p) => p.id === m.user_id))
          .filter(Boolean) as UserProfile[];
        setHrtStaffs(hrts);
      }
    } catch (err: any) {
      console.error('Error loading student records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToTableChanges('students', loadData);
  }, [currentBranch?.id, profile?.id, isSysAdmin, isCM]);

  // Calculate tuition days remaining and badge
  const getTuitionStatus = (expiryDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        days: diffDays,
        label: `Expired ${Math.abs(diffDays)}d ago`,
        status: 'expired' as const,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        badge: 'bg-rose-500',
      };
    }
    if (diffDays <= 14) {
      return {
        days: diffDays,
        label: `Due in ${diffDays}d`,
        status: 'warning' as const,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'bg-amber-500',
      };
    }
    return {
      days: diffDays,
      label: `${diffDays}d remaining`,
      status: 'active' as const,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-500',
    };
  };

  // Derive unique levels and teachers for filters
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      if (c.level) set.add(c.level);
    });
    students.forEach((s) => {
      if (s.current_class?.level) set.add(s.current_class.level);
    });
    return Array.from(set).sort();
  }, [classes, students]);

  const availableTeachers = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => {
      if (c.default_hrt_name) map.set(c.default_hrt_name, `${c.default_hrt_name} (HRT)`);
      if (c.main_teacher_name) map.set(c.main_teacher_name, `${c.main_teacher_name} (Teacher)`);
    });
    hrtStaffs.forEach((h) => {
      map.set(h.full_name, `${h.full_name} (HRT)`);
    });
    students.forEach((s) => {
      if (s.effective_hrt_name) map.set(s.effective_hrt_name, `${s.effective_hrt_name} (HRT)`);
    });
    return Array.from(map.entries()).map(([name, label]) => ({ name, label }));
  }, [classes, hrtStaffs, students]);

  // Sets of student IDs with specific conditions
  const academicRiskStudentIds = useMemo(() => {
    const ids = new Set<string>();
    // Check latest assessment per student to accurately reflect current academic status
    const latestAssessMap = new Map<string, StudentAssessment>();
    assessments.forEach((a) => {
      const existing = latestAssessMap.get(a.student_id);
      if (!existing || new Date(a.assessment_date).getTime() > new Date(existing.assessment_date).getTime()) {
        latestAssessMap.set(a.student_id, a);
      }
    });

    latestAssessMap.forEach((a, stuId) => {
      if (a.has_academic_risk) ids.add(stuId);
    });

    // Include students with active interventions underway
    interventions.forEach((i) => {
      if (i.status === 'open' || i.status === 'in_progress') ids.add(i.student_id);
    });
    return ids;
  }, [assessments, interventions]);

  const parentPerceptionRiskStudentIds = useMemo(() => {
    const ids = new Set<string>();
    feedbacks.forEach((f) => {
      if (f.status === 'open' || f.status === 'in_progress') {
        ids.add(f.student_id);
      }
    });
    return ids;
  }, [feedbacks]);

  const renewalRiskStudentIds = useMemo(() => {
    const ids = new Set<string>();
    students.forEach((s) => {
      const tuition = getTuitionStatus(s.tuition_expiry_date);
      if (tuition.days <= 30) {
        ids.add(s.id);
      }
    });
    renewals.forEach((r) => {
      if (r.risk_level === 'high' || r.days_remaining <= 30) {
        ids.add(r.student_id);
      }
    });
    return ids;
  }, [students, renewals]);

  // Options matching CRM filter dropdown (Image 1)
  const DATE_FIELD_OPTIONS = useMemo(() => [
    { id: 'assessment_date', label: 'Assessment Date', desc: 'Date of 4-skill Cambridge/Oxford evaluation' },
    { id: 'created_at', label: 'Date Created / Enrolled', desc: 'Student enrollment & registration date' },
    { id: 'birthdate', label: 'Birthdate', desc: 'Student birthdate' },
    { id: 'birthdate_anniversary', label: 'Birthdate Anniversary', desc: 'Upcoming student birthday this month' },
    { id: 'tuition_expiry', label: 'Tuition Expiry Date', desc: 'Tuition fee deadline & renewal cycle' },
    { id: 'last_activity', label: 'Last Activity - Call Date', desc: 'Recent outbound CRM call or parent log' },
    { id: 'updated_at', label: 'Date Modified', desc: 'Profile last modified timestamp' },
  ], []);

  // Map of studentId -> latest assessment in selectedMonth (Image 2)
  const monthlyAssessmentsMap = useMemo(() => {
    const map = new Map<string, StudentAssessment>();
    assessments.forEach((a) => {
      if (selectedMonth === 'all') {
        const existing = map.get(a.student_id);
        if (!existing || new Date(a.assessment_date).getTime() > new Date(existing.assessment_date).getTime()) {
          map.set(a.student_id, a);
        }
      } else {
        if (a.assessment_date && a.assessment_date.startsWith(selectedMonth)) {
          const existing = map.get(a.student_id);
          if (!existing || new Date(a.assessment_date).getTime() > new Date(existing.assessment_date).getTime()) {
            map.set(a.student_id, a);
          }
        }
      }
    });
    return map;
  }, [assessments, selectedMonth]);

  // Activity map (Phone calls, feedbacks, interventions)
  const studentActivitiesMap = useMemo(() => {
    const map = new Map<string, { type: string; date: string; summary: string; phone?: string }>();
    feedbacks.forEach((f) => {
      const existing = map.get(f.student_id);
      if (!existing || new Date(f.created_at || '').getTime() > new Date(existing.date).getTime()) {
        map.set(f.student_id, {
          type: 'Outbound Call',
          date: f.created_at?.slice(0, 10) || '',
          summary: f.content ? f.content.slice(0, 50) : 'Parent progress check-in call completed',
          phone: f.parent_phone,
        });
      }
    });
    interventions.forEach((i) => {
      const existing = map.get(i.student_id);
      if (!existing || new Date(i.created_at || '').getTime() > new Date(existing.date).getTime()) {
        map.set(i.student_id, {
          type: 'Academic Care',
          date: i.created_at?.slice(0, 10) || '',
          summary: i.issue_description ? i.issue_description.slice(0, 50) : 'Academic tutoring & 1-on-1 support scheduled',
        });
      }
    });
    return map;
  }, [feedbacks, interventions]);

  // Monthly stats for the selected month (Customer Request: filter by month to view pending assessments)
  const monthlyStats = useMemo(() => {
    const total = students.length;
    let evaluatedCount = 0;
    students.forEach((s) => {
      if (monthlyAssessmentsMap.has(s.id)) evaluatedCount++;
    });
    const pendingCount = Math.max(0, total - evaluatedCount);
    const rate = total > 0 ? Math.round((evaluatedCount / total) * 100) : 0;
    return { total, evaluatedCount, pendingCount, rate };
  }, [students, monthlyAssessmentsMap]);

  // Filtered students with all controls from Image 1, 2, 3, 4
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Search name, student code, parent name, phone
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        s.full_name.toLowerCase().includes(query) ||
        s.student_code.toLowerCase().includes(query) ||
        s.parent_name.toLowerCase().includes(query) ||
        s.parent_phone.includes(query);

      // 2. Class filter
      const matchClass = classFilter === 'all' || s.current_class_id === classFilter;

      // 3. Level filter
      const studentLevel = s.current_class?.level || '';
      const matchLevel = levelFilter === 'all' || studentLevel === levelFilter;

      // 4. Teacher filter
      const hrtName = s.assigned_hrt?.full_name || s.effective_hrt_name || s.current_class?.default_hrt_name || '';
      const teacherName = s.current_class?.main_teacher_name || '';
      const matchTeacher =
        teacherFilter === 'all' ||
        hrtName.toLowerCase().includes(teacherFilter.toLowerCase()) ||
        teacherName.toLowerCase().includes(teacherFilter.toLowerCase());

      // 5. Academic status filter
      const isAcademicRisk = academicRiskStudentIds.has(s.id);
      const matchAcademic =
        academicStatusFilter === 'all' ||
        (academicStatusFilter === 'risk' && isAcademicRisk) ||
        (academicStatusFilter === 'on_track' && !isAcademicRisk);

      // 6. Renewal risk filter
      const tuition = getTuitionStatus(s.tuition_expiry_date);
      let matchRenewal = true;
      if (renewalRiskFilter === 'safe') {
        matchRenewal = tuition.days > 30;
      } else if (renewalRiskFilter === 'expiring') {
        matchRenewal = tuition.days <= 30 && tuition.days > 0;
      } else if (renewalRiskFilter === 'due_soon') {
        matchRenewal = tuition.days <= 14 && tuition.days >= 0;
      } else if (renewalRiskFilter === 'overdue') {
        matchRenewal = tuition.days < 0;
      }

      // 7. Monthly Assessment Status Filter (View students not assessed yet)
      const hasMonthlyAssessment = monthlyAssessmentsMap.has(s.id);
      if (assessmentStatusFilter === 'pending' && hasMonthlyAssessment) return false;
      if (assessmentStatusFilter === 'evaluated' && !hasMonthlyAssessment) return false;
      if (assessmentStatusFilter === 'risk' && !academicRiskStudentIds.has(s.id)) return false;

      // 8. Date Field Type filtering (Image 1: Filter v -> Date Field dropdown)
      if (dateRangeFrom || dateRangeTo) {
        let targetDate = '';
        if (dateFieldType === 'assessment_date') {
          const a = monthlyAssessmentsMap.get(s.id);
          targetDate = a ? a.assessment_date : '';
        } else if (dateFieldType === 'created_at') {
          targetDate = s.created_at ? s.created_at.slice(0, 10) : '';
        } else if (dateFieldType === 'birthdate') {
          targetDate = s.date_of_birth || '';
        } else if (dateFieldType === 'birthdate_anniversary') {
          if (!s.date_of_birth) return false;
          const birthMonth = s.date_of_birth.slice(5, 7);
          const targetMonth = selectedMonth !== 'all' ? selectedMonth.slice(5, 7) : currentMonthKey.slice(5, 7);
          return birthMonth === targetMonth;
        } else if (dateFieldType === 'tuition_expiry') {
          targetDate = s.tuition_expiry_date || '';
        } else if (dateFieldType === 'last_activity') {
          const act = studentActivitiesMap.get(s.id);
          targetDate = act ? act.date : '';
        } else if (dateFieldType === 'updated_at') {
          targetDate = s.updated_at ? s.updated_at.slice(0, 10) : '';
        }

        if (!targetDate) return false;
        if (dateRangeFrom && targetDate < dateRangeFrom) return false;
        if (dateRangeTo && targetDate > dateRangeTo) return false;
      }

      return matchSearch && matchClass && matchLevel && matchTeacher && matchAcademic && matchRenewal;
    }).sort((a, b) => {
      // Customer Requirement: Newly updated cases float to top
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [
    students,
    searchTerm,
    classFilter,
    levelFilter,
    teacherFilter,
    academicStatusFilter,
    renewalRiskFilter,
    academicRiskStudentIds,
    assessmentStatusFilter,
    monthlyAssessmentsMap,
    dateRangeFrom,
    dateRangeTo,
    dateFieldType,
    selectedMonth,
    currentMonthKey,
    studentActivitiesMap,
  ]);

  // Stats calculation matching customer screenshot (Image 3 & 4)
  const stats = useMemo(() => {
    const totalTracked = students.length;
    const highAcademicRiskCount = academicRiskStudentIds.size;
    const openInterventionsCount = interventions.filter(
      (i) => i.status === 'open' || i.status === 'in_progress'
    ).length;

    const highParentPerceptionRiskCount = parentPerceptionRiskStudentIds.size;
    const pendingFeedbackCount = feedbacks.filter((f) => f.status === 'open').length;

    const expiringFeesCount = renewalRiskStudentIds.size;
    const onTrackCount = Math.max(0, totalTracked - highAcademicRiskCount);

    return {
      totalTracked,
      onTrackCount,
      highAcademicRiskCount,
      openInterventionsCount,
      highParentPerceptionRiskCount,
      pendingFeedbackCount,
      expiringFeesCount,
    };
  }, [students, academicRiskStudentIds, interventions, parentPerceptionRiskStudentIds, feedbacks, renewalRiskStudentIds]);

  // Handlers
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;
    setSubmitting(true);
    setActionMessage(null);

    try {
      await StudentService.createStudent({
        branch_id: currentBranch.id,
        student_code: newStudent.student_code.trim() || `KAP-${Date.now().toString().slice(-4)}`,
        full_name: newStudent.full_name.trim(),
        date_of_birth: newStudent.date_of_birth,
        gender: newStudent.gender,
        parent_name: newStudent.parent_name.trim(),
        parent_phone: newStudent.parent_phone.trim(),
        parent_email: newStudent.parent_email.trim() || undefined,
        tuition_expiry_date: newStudent.tuition_expiry_date,
        status: 'active',
        current_class_id: newStudent.current_class_id || undefined,
        assigned_hrt_id: newStudent.assigned_hrt_id || undefined,
        notes: newStudent.notes.trim() || undefined,
      });

      setActionMessage({ type: 'success', text: 'New student added successfully!' });
      setShowAddModal(false);
      setNewStudent({
        student_code: '',
        full_name: '',
        date_of_birth: '2017-06-15',
        gender: 'male',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        tuition_expiry_date: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
        current_class_id: '',
        assigned_hrt_id: '',
        notes: '',
      });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to add student' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransferClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForTransfer || !transferClassId) return;
    setSubmitting(true);
    setActionMessage(null);

    try {
      await StudentService.transferClass(selectedStudentForTransfer.id, transferClassId, transferReason);
      setActionMessage({ type: 'success', text: `Transferred class for student ${selectedStudentForTransfer.full_name} successfully!` });
      setSelectedStudentForTransfer(null);
      setTransferClassId('');
      setTransferReason('');
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to transfer class' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignHrt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForHrt) return;
    setSubmitting(true);
    setActionMessage(null);

    try {
      const targetHrtId = newHrtId ? newHrtId : null;
      await StudentService.assignHrt(selectedStudentForHrt.id, targetHrtId, hrtReason);
      setActionMessage({
        type: 'success',
        text: targetHrtId ? 'Designated HRT assigned successfully!' : 'Designated HRT cancelled, reverted to class default HRT.',
      });
      setSelectedStudentForHrt(null);
      setNewHrtId('');
      setHrtReason('');
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to assign HRT' });
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = async (student: Student) => {
    setSelectedStudentForHistory(student);
    const hist = await StudentService.getTransfers(student.id);
    setTransferHistory(hist);
  };

  const handleOpenEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditStudentForm({
      student_code: student.student_code,
      full_name: student.full_name,
      date_of_birth: student.date_of_birth || '',
      gender: (student.gender as any) || 'male',
      parent_name: student.parent_name,
      parent_phone: student.parent_phone,
      parent_email: student.parent_email || '',
      tuition_expiry_date: student.tuition_expiry_date,
      current_class_id: student.current_class_id || '',
      assigned_hrt_id: student.assigned_hrt_id || '',
      status: student.status,
      notes: student.notes || '',
    });
  };

  const handleUpdateStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSubmitting(true);
    setActionMessage(null);
    try {
      await StudentService.updateStudent(editingStudent.id, {
        student_code: editStudentForm.student_code.trim(),
        full_name: editStudentForm.full_name.trim(),
        date_of_birth: editStudentForm.date_of_birth,
        gender: editStudentForm.gender,
        parent_name: editStudentForm.parent_name.trim(),
        parent_phone: editStudentForm.parent_phone.trim(),
        parent_email: editStudentForm.parent_email.trim() || undefined,
        tuition_expiry_date: editStudentForm.tuition_expiry_date,
        current_class_id: editStudentForm.current_class_id || undefined,
        assigned_hrt_id: editStudentForm.assigned_hrt_id || undefined,
        status: editStudentForm.status,
        notes: editStudentForm.notes.trim() || undefined,
      });
      setActionMessage({
        type: 'success',
        text: 'Student profile updated successfully.',
      });
      setEditingStudent(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Error updating student record.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudentSubmit = async () => {
    if (!deletingStudent) return;
    if (!canDeleteStudent) {
      setActionMessage({
        type: 'error',
        text: 'Permission denied: Only System Administrator can delete student records.',
      });
      return;
    }
    setSubmitting(true);
    setActionMessage(null);
    try {
      await StudentService.deleteStudent(deletingStudent.id);
      setActionMessage({
        type: 'success',
        text: 'Student removed successfully.',
      });
      setDeletingStudent(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to remove student record.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQuickAssess = (student: Student) => {
    setAssessingStudent(student);
    const today = new Date().toISOString().split('T')[0];
    const initialDate = selectedMonth !== 'all' ? `${selectedMonth}-15` : today;
    setQuickAssessForm({
      period: selectedMonth !== 'all' ? `Monthly Eval ${selectedMonth}` : 'Monthly Evaluation',
      assessment_date: initialDate > today ? today : initialDate,
      progress_status: 'Improved',
      listening_level: 'On Track',
      speaking_level: 'On Track',
      reading_level: 'On Track',
      writing_level: 'On Track',
      strengths: '',
      weaknesses: '',
      progress_notes: '',
    });
  };

  const handleQuickAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessingStudent || !currentBranch) return;
    setQuickAssessSubmitting(true);
    try {
      const levelScore = (lvl: SkillCompetencyLevel) => {
        if (lvl === 'Above Level') return 4.5;
        if (lvl === 'Below Level') return 2.5;
        if (lvl === 'N/A') return 3.0;
        return 3.5;
      };

      const hasRisk =
        quickAssessForm.listening_level === 'Below Level' ||
        quickAssessForm.speaking_level === 'Below Level' ||
        quickAssessForm.reading_level === 'Below Level' ||
        quickAssessForm.writing_level === 'Below Level' ||
        quickAssessForm.progress_status === 'Needs Attention';

      await AssessmentService.createAssessment({
        student_id: assessingStudent.id,
        class_id: assessingStudent.current_class_id || undefined,
        branch_id: currentBranch.id,
        period: quickAssessForm.period,
        assessment_date: quickAssessForm.assessment_date,
        listening_score: levelScore(quickAssessForm.listening_level),
        speaking_score: levelScore(quickAssessForm.speaking_level),
        reading_score: levelScore(quickAssessForm.reading_level),
        writing_score: levelScore(quickAssessForm.writing_level),
        listening_level: quickAssessForm.listening_level,
        speaking_level: quickAssessForm.speaking_level,
        reading_level: quickAssessForm.reading_level,
        writing_level: quickAssessForm.writing_level,
        progress_status: quickAssessForm.progress_status,
        strengths: quickAssessForm.strengths.trim() || undefined,
        weaknesses: quickAssessForm.weaknesses.trim() || undefined,
        progress_notes: quickAssessForm.progress_notes.trim() || undefined,
        assessed_by: profile?.id,
      });

      setActionMessage({
        type: 'success',
        text: `Successfully recorded monthly evaluation for ${assessingStudent.full_name}.`,
      });
      setAssessingStudent(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to record assessment.',
      });
    } finally {
      setQuickAssessSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#043264]">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {'Student Records'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {`Manage student records, tuition expiry, class enrollment, and HRT assignments at ${currentBranch?.name || 'KAPLA'}`}
          </p>
        </div>

        {canCreateStudent && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {'Add New Student'}
          </button>
        )}
      </div>

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

      {/* Stats Cards — Exactly matching Customer Specification (Image 3 & 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Tracked Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {t('students.kpiTotalTracked', 'Total Tracked Students')}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalTracked}</div>
          <span className="text-[10px] text-slate-500 font-medium">
            {t('students.kpiTotalTrackedSub', 'On Track')}: {stats.onTrackCount}
          </span>
        </div>

        {/* Card 2: High Academic Risk */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            {t('students.kpiAcademicRisk', 'High Academic Risk')}
          </span>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.highAcademicRiskCount}</div>
          <span className="text-[10px] text-rose-600 font-medium">
            {t('students.kpiAcademicRiskSub', 'Open Interventions')}: {stats.openInterventionsCount}
          </span>
        </div>

        {/* Card 3: High Parent Perception Risk */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            {t('students.kpiParentPerception', 'High Parent Perception Risk')}
          </span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.highParentPerceptionRiskCount}</div>
          <span className="text-[10px] text-amber-700 font-medium">
            {t('students.kpiParentPerceptionSub', 'Pending Feedback')}: {stats.pendingFeedbackCount}
          </span>
        </div>

        {/* Card 4: Expiring Fees / Renewal Risk */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            {t('students.kpiRenewalRisk', 'Expiring Fees / Renewal Risk')}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.expiringFeesCount}</div>
          <span className="text-[10px] text-slate-500 font-medium">
            {t('students.kpiRenewalRiskSub', 'Fee expiry ≤ 30 days or High/Critical risk')}
          </span>
        </div>
      </div>

      {/* =====================================================================
          CRM TIME & DATE FILTERING TOOLBAR (Matching Customer Image 1 & Image 2)
          CRM date dropdown & monthly assessment tracker
      ===================================================================== */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Search & Date Type Dropdown (Image 1) & Month Selector (Image 2) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by student ID, full name, phone, parent name..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
            />
          </div>

          {/* Filter Dropdown (Image 1 style) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                dateRangeFrom || dateRangeTo || dateFieldType !== 'assessment_date'
                  ? 'bg-blue-50 text-[#043264] border-blue-300 ring-2 ring-blue-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#043264]" />
              <span>
                Filter: {DATE_FIELD_OPTIONS.find((o) => o.id === dateFieldType)?.label || 'Date Field'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showDateDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Dropdown Menu (Image 1) */}
            {showDateDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95">
                <div className="p-1 mb-1.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={dateSearchTerm}
                      onChange={(e) => setDateSearchTerm(e.target.value)}
                      placeholder="Type to filter date fields..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#043264]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {DATE_FIELD_OPTIONS.filter((opt) =>
                    !dateSearchTerm || opt.label.toLowerCase().includes(dateSearchTerm.toLowerCase())
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setDateFieldType(opt.id);
                        setShowDateDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex flex-col transition-colors ${
                        dateFieldType === opt.id ? 'bg-blue-50 text-[#043264] font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Month Selector (Monthly Filter) */}
          <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500 ml-1.5 shrink-0" />
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#043264] focus:outline-none pr-2 py-1 cursor-pointer"
            >
              <option value={currentMonthKey}>This Month ({currentMonthKey})</option>
              <option value="2026-10">October 2026 (2026-10)</option>
              <option value="2026-09">September 2026 (2026-09)</option>
              <option value="2026-08">August 2026 (2026-08)</option>
              <option value="2026-07">July 2026 (2026-07)</option>
              <option value="all">All Months (Entire History)</option>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-1.5 text-xs">
            <input
              type="date"
              value={dateRangeFrom}
              onChange={(e) => setDateRangeFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateRangeTo}
              onChange={(e) => setDateRangeTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
              title="End Date"
            />
            {(dateRangeFrom || dateRangeTo) && (
              <button
                type="button"
                onClick={() => {
                  setDateRangeFrom('');
                  setDateRangeTo('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
                title="Clear date range"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters (Class, Level, Teacher) */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Levels</option>
            {availableLevels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>

          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Teachers & HRTs</option>
            {availableTeachers.map((tch) => (
              <option key={tch.name} value={tch.name}>{tch.label}</option>
            ))}
          </select>

          <select
            value={renewalRiskFilter}
            onChange={(e) => setRenewalRiskFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">Tuition Status: All</option>
            <option value="safe">Safe (&gt; 30d)</option>
            <option value="expiring">Expiring (≤ 30d)</option>
            <option value="due_soon">Due Soon (≤ 14d)</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Row 3: Assessment Status Quick Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
            Evaluation Status ({selectedMonth}):
          </span>

          <button
            type="button"
            onClick={() => setAssessmentStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              assessmentStatusFilter === 'all'
                ? 'bg-[#043264] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Students ({students.length})
          </button>

          <button
            type="button"
            onClick={() => setAssessmentStatusFilter('pending')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              assessmentStatusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs ring-2 ring-amber-300'
                : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>⚠️ Not Evaluated Yet ({monthlyStats.pendingCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setAssessmentStatusFilter('evaluated')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              assessmentStatusFilter === 'evaluated'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>✅ Evaluated ({monthlyStats.evaluatedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setAssessmentStatusFilter('risk')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              assessmentStatusFilter === 'risk'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Academic Risk ({stats.highAcademicRiskCount})</span>
          </button>

          {(assessmentStatusFilter !== 'all' || classFilter !== 'all' || levelFilter !== 'all' || teacherFilter !== 'all' || renewalRiskFilter !== 'all' || dateRangeFrom || dateRangeTo) && (
            <button
              type="button"
              onClick={() => {
                setAssessmentStatusFilter('all');
                setClassFilter('all');
                setLevelFilter('all');
                teacherFilter !== 'all' && setTeacherFilter('all');
                setRenewalRiskFilter('all');
                setDateRangeFrom('');
                setDateRangeTo('');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline ml-auto font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Progress Callout Banner for Target Month */}
      <div className="bg-gradient-to-r from-[#012147] to-[#043264] rounded-2xl p-4 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-sky-200 font-medium">
              Academic Evaluation Status • {selectedMonth === 'all' ? 'All Records' : `Month ${selectedMonth}`}
            </div>
            <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
              <span>{monthlyStats.evaluatedCount} of {monthlyStats.total} Students Evaluated</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {monthlyStats.rate}% Completed
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {monthlyStats.pendingCount > 0 ? (
            <button
              type="button"
              onClick={() => setAssessmentStatusFilter('pending')}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Show {monthlyStats.pendingCount} Pending Students</span>
            </button>
          ) : (
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>All students evaluated for {selectedMonth}!</span>
            </span>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">{t('common.loading', 'Loading student records...')}</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{t('common.noData', 'No matching student records found')}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {'No students found within your authorized scope or current filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-8">
                    <input type="checkbox" className="rounded border-slate-300 text-[#043264]" />
                  </th>
                  <th className="py-3 px-3">Student ID & Name</th>
                  <th className="py-3 px-3">Class & Level</th>
                  <th className="py-3 px-3">Mobile & Activity (CRM)</th>
                  <th className="py-3 px-3 bg-blue-50/50 text-[#043264]">
                    <div className="flex items-center gap-1.5 font-bold">
                      <ClipboardCheck className="w-3.5 h-3.5 text-[#043264]" />
                      <span>Monthly Eval ({selectedMonth})</span>
                    </div>
                  </th>
                  <th className="py-3 px-3">Tuition Expiry</th>
                  <th className="py-3 px-3">Assigned HRT</th>
                  {(canEditStudent || canDeleteStudent) && <th className="py-3 px-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const tuition = getTuitionStatus(student.tuition_expiry_date);
                  const isSpecificHrt = Boolean(student.assigned_hrt_id);
                  const monthlyAssessment = monthlyAssessmentsMap.get(student.id);
                  const isEvaluated = Boolean(monthlyAssessment);
                  const activity = studentActivitiesMap.get(student.id);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input type="checkbox" className="rounded border-slate-300 text-[#043264]" />
                      </td>

                      {/* Student Info — Clickable to open Student Profile & Logcall */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForProfile(student)}
                            title="Open student profile & logcall"
                            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-[#043264] font-bold text-xs flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs shrink-0"
                          >
                            {student.full_name.charAt(0)}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForProfile(student)}
                              className="font-semibold text-slate-900 hover:text-[#026fd7] hover:underline text-left transition-colors cursor-pointer block leading-tight"
                            >
                              {student.full_name}
                            </button>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono text-slate-700 font-semibold">{student.student_code}</span>
                              {student.date_of_birth && ` • ${student.date_of_birth}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class & Level */}
                      <td className="py-3 px-3">
                        {student.current_class ? (
                          <div>
                            <span className="font-semibold text-slate-800">{student.current_class.name}</span>
                            <div className="text-[11px] text-slate-500">{student.current_class.level}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Mobile & CRM Activity (Image 1 style) */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 text-[11px]">
                            <span className="p-1 rounded-md bg-blue-50 text-[#026fd7] hover:bg-blue-100 transition-colors cursor-pointer" title="Call parent">
                              <PhoneCall className="w-3 h-3" />
                            </span>
                            <span className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors cursor-pointer" title="Send SMS">
                              <MessageSquare className="w-3 h-3" />
                            </span>
                            <span className="font-semibold">{student.parent_phone}</span>
                            <span className="text-[10px] text-slate-400 font-sans font-normal truncate max-w-[100px]">
                              ({tDb(student.parent_name)})
                            </span>
                          </div>

                          {activity ? (
                            <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200/70 rounded-md px-2 py-1 flex items-start gap-1.5 max-w-xs">
                              <span className="font-semibold text-sky-700 shrink-0">[{activity.type}]:</span>
                              <span className="truncate" title={activity.summary}>{activity.summary}</span>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 italic">No recent CRM logs</div>
                          )}
                        </div>
                      </td>

                      {/* Monthly Assessment Status */}
                      <td className="py-3 px-3 bg-blue-50/20">
                        {isEvaluated ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Evaluated</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {monthlyAssessment?.assessment_date}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <span className="font-semibold text-slate-700">
                                {monthlyAssessment?.progress_status || 'On Track'}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600 font-medium">
                                L:{monthlyAssessment?.listening_score} S:{monthlyAssessment?.speaking_score} R:{monthlyAssessment?.reading_score} W:{monthlyAssessment?.writing_score}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending Eval</span>
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpenQuickAssess(student)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#043264] hover:bg-[#012147] text-white transition-all shadow-2xs cursor-pointer"
                                title="Add 4-Skill Cambridge Assessment for this student"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Assess Now</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Tuition Expiry Date */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-800 font-medium">{student.tuition_expiry_date}</div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-0.5 ${tuition.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tuition.badge}`} />
                          {tuition.label}
                        </span>
                      </td>

                      {/* Assigned HRT */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">
                          {student.assigned_hrt?.full_name ||
                            student.effective_hrt_name ||
                            'Unassigned'}
                        </div>
                        {isSpecificHrt ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 mt-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Designated HRT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                            <span>Class Default</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {canEditStudent && (
                            <>
                              <button
                                type="button"
                                title="Transfer student class"
                                onClick={() => {
                                  setSelectedStudentForTransfer(student);
                                  setTransferClassId('');
                                  setTransferReason('');
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-[#043264] hover:bg-blue-50 transition-colors"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                title="Assign or change designated HRT"
                                onClick={() => {
                                  setSelectedStudentForHrt(student);
                                  setNewHrtId(student.assigned_hrt_id || '');
                                  setHrtReason('');
                                }}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                title={'Edit student'}
                                onClick={() => handleOpenEditStudent(student)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {canDeleteStudent && (
                            <button
                              type="button"
                              title={'Delete student (Admin Only)'}
                              onClick={() => setDeletingStudent(student)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            type="button"
                            title={'View Profile & Logcall'}
                            onClick={() => setSelectedStudentForProfile(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#043264] hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title="View transfer history"
                            onClick={() => openHistoryModal(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
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

      {/* =========================================================================
          MODAL: QUICK 4-SKILL CAMBRIDGE ASSESSMENT (Directly from Student List)
      ========================================================================= */}
      {assessingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-50 text-[#043264]">
                  <Award className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Monthly Cambridge & Oxford Assessment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Student: <span className="font-semibold text-slate-800">{assessingStudent.full_name}</span> ({assessingStudent.student_code}) • Class: {assessingStudent.current_class?.name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssessingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAssessSubmit} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Evaluation Month / Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickAssessForm.assessment_date}
                    onChange={(e) => setQuickAssessForm({ ...quickAssessForm, assessment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Evaluation Period Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={quickAssessForm.period}
                    onChange={(e) => setQuickAssessForm({ ...quickAssessForm, period: e.target.value })}
                    placeholder="e.g. November 2026 Monthly Eval"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
              </div>

              {/* 4 Cambridge Skills Rubrics */}
              <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Cambridge 4-Skill Competency Levels</span>
                  <span className="text-[10px] text-slate-500 font-normal">Oxford Quality Standards</span>
                </div>

                {(['listening', 'speaking', 'reading', 'writing'] as const).map((skill) => {
                  const currentVal = quickAssessForm[`${skill}_level` as keyof typeof quickAssessForm] as SkillCompetencyLevel;
                  const label = skill.charAt(0).toUpperCase() + skill.slice(1);
                  return (
                    <div key={skill} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-1 border-b border-slate-200/60 last:border-0">
                      <span className="font-semibold text-slate-700 capitalize w-20">{label}</span>
                      <div className="grid grid-cols-4 gap-1 flex-1 max-w-sm">
                        {(['Below Level', 'On Track', 'Above Level', 'N/A'] as const).map((lvl) => {
                          const isSel = currentVal === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setQuickAssessForm({ ...quickAssessForm, [`${skill}_level`]: lvl })}
                              className={`py-1 px-1.5 text-[10px] font-semibold rounded-md border text-center transition-all cursor-pointer ${
                                isSel
                                  ? lvl === 'Below Level'
                                    ? 'bg-rose-500 text-white border-rose-600 shadow-2xs'
                                    : lvl === 'Above Level'
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                                    : 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Evaluation */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Overall Progress vs. Previous Month *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Improved', 'Maintained', 'Needs Attention', 'First Assessment'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setQuickAssessForm({ ...quickAssessForm, progress_status: status })}
                      className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${
                        quickAssessForm.progress_status === status
                          ? status === 'Needs Attention'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200'
                            : 'bg-blue-50 text-[#043264] border-blue-300 ring-2 ring-blue-200'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Key Strengths & Observations
                </label>
                <textarea
                  rows={2}
                  value={quickAssessForm.strengths}
                  onChange={(e) => setQuickAssessForm({ ...quickAssessForm, strengths: e.target.value })}
                  placeholder="e.g. Excellent active vocabulary retention, confident speaking in full sentences"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Focus Areas & Teacher Guidance Notes
                </label>
                <textarea
                  rows={2}
                  value={quickAssessForm.progress_notes}
                  onChange={(e) => setQuickAssessForm({ ...quickAssessForm, progress_notes: e.target.value })}
                  placeholder="e.g. Recommend supplementary phonics practice for ending sounds /s/ and /ed/"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssessingStudent(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickAssessSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#043264] hover:bg-[#012147] text-white font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {quickAssessSubmitting && <Clock className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Assessment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW STUDENT
      ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#043264]">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  {'Add New Student Record'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Student Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.student_code}
                    onChange={(e) => setNewStudent({ ...newStudent, student_code: e.target.value })}
                    placeholder="VD: KAP-PH-008"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.full_name}
                    onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                    placeholder="E.g., Alexander William"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={newStudent.date_of_birth}
                    onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Gender'}
                  </label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="male">{'Male'}</option>
                    <option value="female">{'Female'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Parent Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.parent_name}
                    onChange={(e) => setNewStudent({ ...newStudent, parent_name: e.target.value })}
                    placeholder={'Parent Name'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Parent Phone *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={newStudent.parent_phone}
                    onChange={(e) => setNewStudent({ ...newStudent, parent_phone: e.target.value })}
                    placeholder="VD: 0901234567"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Tuition Expiry Date *'}
                </label>
                <input
                  type="date"
                  required
                  value={newStudent.tuition_expiry_date}
                  onChange={(e) => setNewStudent({ ...newStudent, tuition_expiry_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
                <span className="text-[10px] text-slate-500">
                  {'Used for automatic retention alerts and tuition tracking.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Class Cohort'}
                  </label>
                  <select
                    value={newStudent.current_class_id}
                    onChange={(e) => setNewStudent({ ...newStudent, current_class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">{'-- Unassigned --'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {'Designated HRT'}
                  </label>
                  <select
                    value={newStudent.assigned_hrt_id}
                    onChange={(e) => setNewStudent({ ...newStudent, assigned_hrt_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">{'Class Default'}</option>
                    {hrtStaffs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.full_name} (HRT)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Academic Notes'}
                </label>
                <textarea
                  rows={2}
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                  placeholder={'Student characteristics, parent expectations...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? ('Saving...')
                    : ('Save Student Record')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TRANSFER STUDENT CLASS
      ========================================================================= */}
      {selectedStudentForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#043264]">
                  <ArrowRightLeft className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {'Transfer Student Class Cohort'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForTransfer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferClass} className="space-y-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900">{selectedStudentForTransfer.full_name}</div>
                <div className="text-[11px] text-slate-500">
                  {'Current Class: '}
                  <span className="font-medium text-slate-800">
                    {selectedStudentForTransfer.current_class?.name || ('Unassigned')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Target Class Cohort *'}
                </label>
                <select
                  required
                  value={transferClassId}
                  onChange={(e) => setTransferClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">{'-- Select Target Class --'}</option>
                  {classes
                    .filter((c) => c.id !== selectedStudentForTransfer.current_class_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level}) - HRT: {c.default_hrt_name || ('Default')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Reason for Transfer *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder={'e.g. Student promoted to Movers, schedule adjustment...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForTransfer(null)}
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
                    ? ('Transferring...')
                    : ('Confirm Transfer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ASSIGN DESIGNATED HRT
      ========================================================================= */}
      {selectedStudentForHrt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
                  <UserCheck className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {'Assign Designated HRT'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForHrt(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignHrt} className="space-y-3 pt-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-semibold text-slate-900">{selectedStudentForHrt.full_name}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {'Class: '}
                  {selectedStudentForHrt.current_class?.name || ('Unassigned')} •{' '}
                  {'Current HRT: '}
                  <span className="font-semibold text-slate-800">{selectedStudentForHrt.effective_hrt_name}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Designated HRT *'}
                </label>
                <select
                  value={newHrtId}
                  onChange={(e) => setNewHrtId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">
                    {'-- Class Default (Reset individual assignment) --'}
                  </option>
                  {hrtStaffs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.full_name} ({h.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {'* Precedence rule: If designated HRT is set, this HRT has sole care responsibility and task routing.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {'Reason for Assignment'}
                </label>
                <textarea
                  rows={2}
                  value={hrtReason}
                  onChange={(e) => setHrtReason(e.target.value)}
                  placeholder={'e.g. Special student needs dedicated experienced educator...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForHrt(null)}
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
                    ? ('Saving...')
                    : ('Confirm Assignment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TRANSFER HISTORY
      ========================================================================= */}
      {selectedStudentForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#043264]">
                  <History className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {'Class Transfer History'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 text-xs space-y-3 max-h-[60vh] overflow-y-auto">
              {transferHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  {'No transfer records for this student.'}
                </div>
              ) : (
                transferHistory.map((th) => (
                  <div key={th.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{th.transfer_date}</span>
                      <span>{'By: '}{th.transferred_by_name || 'Admin'}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {th.from_class_name || ('Unassigned')} → {th.to_class_name}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      {'Reason: '}{th.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT STUDENT PROFILE
      ========================================================================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#043264] flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {'Edit Student Profile'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">{editingStudent.student_code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStudentSubmit} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Student Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.full_name}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, full_name: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Student Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.student_code}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, student_code: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Date of Birth'}
                  </label>
                  <input
                    type="date"
                    value={editStudentForm.date_of_birth}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, date_of_birth: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Gender'}
                  </label>
                  <select
                    value={editStudentForm.gender}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="male">{'Male'}</option>
                    <option value="female">{'Female'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Parent Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editStudentForm.parent_name}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, parent_name: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Parent Phone *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={editStudentForm.parent_phone}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, parent_phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Parent Email'}
                </label>
                <input
                  type="email"
                  value={editStudentForm.parent_email}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, parent_email: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Class'}
                  </label>
                  <select
                    value={editStudentForm.current_class_id}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, current_class_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="">{'— No Class Assigned —'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Assigned HRT'}
                  </label>
                  <select
                    value={editStudentForm.assigned_hrt_id}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, assigned_hrt_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="">{'— Class Default HRT —'}</option>
                    {hrtStaffs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.full_name} ({h.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Tuition Expiry Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editStudentForm.tuition_expiry_date}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, tuition_expiry_date: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Student Status'}
                  </label>
                  <select
                    value={editStudentForm.status}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, status: e.target.value as StudentStatus })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="active">{'Active'}</option>
                    <option value="warning">{'Tuition Due Soon'}</option>
                    <option value="expired">{'Expired'}</option>
                    <option value="reserved">{'Reserved'}</option>
                    <option value="dropped">{'Dropped'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Academic & Care Notes'}
                </label>
                <textarea
                  rows={2}
                  value={editStudentForm.notes}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, notes: e.target.value })}
                  placeholder={'Learning strengths, weaknesses, special care instructions...'}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                >
                  <span>{'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE STUDENT
      ========================================================================= */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {'Delete Student Record?'}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {`Are you sure you want to delete ${deletingStudent.full_name} (${deletingStudent.student_code})? All associated tasks, assessments, and attendance records will be permanently removed.`}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {'Cancel'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteStudentSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-70"
              >
                <span>{'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =========================================================================
          MODAL: VIEW COMPREHENSIVE STUDENT PROFILE
      ========================================================================= */}
      <StudentProfileModal
        student={selectedStudentForProfile}
        isOpen={Boolean(selectedStudentForProfile)}
        onClose={() => setSelectedStudentForProfile(null)}
        onOpenAddAssessment={() => onNavigate?.('assessments')}
        onOpenAddFeedback={() => onNavigate?.('feedback')}
        onOpenIntervention={() => onNavigate?.('interventions')}
      />
    </div>
  );
};
