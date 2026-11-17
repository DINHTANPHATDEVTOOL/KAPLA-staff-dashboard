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
  FileSpreadsheet,
  Upload,
  Table,
  FileText,
  ChevronUp,
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
  CareTaskType,
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
  EmailNotificationService,
} from '../../lib/supabase';
import { StudentProfileModal } from './StudentProfileModal';
import {
  parseDotbExport,
  inferClassLevel,
  ParsedDotbStudent,
  DotbParseResult,
  findDuplicateStudent,
  isSameStudent,
} from '../../utils/dotbParser';

interface ParsedBulkStudent {
  id: string;
  student_code: string;
  full_name: string;
  nickname?: string;
  gender?: 'male' | 'female';
  parent_name?: string;
  parent_phone?: string;
}

const getNextStudentCodes = (branchCode = 'PH', existingStudents: Student[], count = 1): string[] => {
  let maxNum = 0;
  const prefix = `KAP-${branchCode}-`;
  existingStudents.forEach((s) => {
    if (s.student_code) {
      if (s.student_code.startsWith(prefix)) {
        const numPart = parseInt(s.student_code.replace(prefix, ''), 10);
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      } else {
        const match = s.student_code.match(/\d+$/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    }
  });

  const codes: string[] = [];
  for (let i = 1; i <= count; i++) {
    codes.push(`${prefix}${String(maxNum + i).padStart(3, '0')}`);
  }
  return codes;
};

const parseBulkStudentText = (
  rawText: string,
  existingStudents: Student[],
  branchCode = 'PH'
): ParsedBulkStudent[] => {
  if (!rawText.trim()) return [];

  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const headerKeywords = [
    'họ và tên',
    'họ tên',
    'full name',
    'tên học viên',
    'tên bé',
    'stt',
    'mã học viên',
    'student code',
    'nickname',
    'biệt danh',
    'tên tiếng anh',
  ];

  const validLines: string[] = [];
  for (const line of lines) {
    const lower = line.toLowerCase();
    const isHeader =
      headerKeywords.some((k) => lower.includes(k)) &&
      (lower.includes('họ') || lower.includes('tên') || lower.includes('stt') || lower.includes('name'));
    if (!isHeader) {
      validLines.push(line);
    }
  }

  if (validLines.length === 0) return [];

  const autoCodes = getNextStudentCodes(branchCode, existingStudents, validLines.length);

  return validLines
    .map((line, index) => {
      let parts = line.split('\t').map((p) => p.trim()).filter((p) => p.length > 0);

      if (parts.length === 1) {
        if (line.includes(',')) {
          parts = line.split(',').map((p) => p.trim()).filter(Boolean);
        } else if (line.includes(';')) {
          parts = line.split(';').map((p) => p.trim()).filter(Boolean);
        }
      }

      let fullName = '';
      let nickname = '';
      let studentCode = autoCodes[index] || `KAP-${branchCode}-${String(index + 1).padStart(3, '0')}`;

      if (parts.length >= 2) {
        if (/^(KAP-|HV-|[0-9]{3,})/i.test(parts[0])) {
          studentCode = parts[0];
          fullName = parts[1];
          nickname = parts[2] || '';
        } else {
          fullName = parts[0];
          nickname = parts[1];
        }
      } else if (parts.length === 1) {
        const parenMatch = parts[0].match(/^(.*?)\s*[\(\[\{](.*?)[\)\]\}]\s*$/);
        if (parenMatch) {
          fullName = parenMatch[1].trim();
          nickname = parenMatch[2].trim();
        } else {
          fullName = parts[0];
        }
      }

      fullName = fullName.replace(/^["']|["']$/g, '').trim();
      nickname = nickname.replace(/^["']|["']$/g, '').trim();

      return {
        id: `bulk-${Date.now()}-${index}`,
        student_code: studentCode,
        full_name: fullName,
        nickname: nickname || undefined,
        gender: 'male' as 'male' | 'female',
      };
    })
    .filter((s) => Boolean(s.full_name));
};

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
  // CM and Admin have full permissions: Add, Edit, Delete
  // Add (Create): EC, HRT, SOO (plus CM, Admin; excluding teachers)
  const canCreateStudent = isSysAdmin || isCM || isEC || isHRT || isSOO;
  const canEditStudent = isSysAdmin || isCM || isHT || isHRT || isEC || isSOO;
  // CM and System Admin can delete students
  const canDeleteStudent = isSysAdmin || isCM;
  // Customer Specification: SOO, HT, CM, Admin can schedule reminder appointments
  const canCreateReminder = isSysAdmin || isCM || isHT || isSOO;

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

  // Reminder appointment state (SOO, HT, CM, Admin)
  const [selectedStudentForReminder, setSelectedStudentForReminder] = useState<Student | null>(null);
  const [reminderForm, setReminderForm] = useState<{
    task_type: CareTaskType;
    title: string;
    due_date: string;
    notes: string;
  }>({
    task_type: 'call_care',
    title: '',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    notes: '',
  });
  const [reminderSubmitting, setReminderSubmitting] = useState<boolean>(false);

  // Student CRUD Modals state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    student_code: '',
    full_name: '',
    nickname: '',
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

  // Add Student Modal & Bulk Import states (Optimized per CM Phương Nhi feedback)
  const [addModalTab, setAddModalTab] = useState<'single' | 'bulk'>('single');
  const [showParentInfoSection, setShowParentInfoSection] = useState<boolean>(false);
  const [showRawPasteSection, setShowRawPasteSection] = useState<boolean>(false);
  const [bulkRawText, setBulkRawText] = useState<string>('');
  const [dotbResult, setDotbResult] = useState<DotbParseResult>({
    students: [],
    classes: [],
    totalWithNicknames: 0,
    totalWithBirthdate: 0,
    totalDuplicates: 0,
    totalNew: 0,
  });
  const [bulkPreviewFilterClass, setBulkPreviewFilterClass] = useState<string>('all');
  const [bulkDuplicateFilter, setBulkDuplicateFilter] = useState<'all' | 'new_only' | 'duplicates_only'>('new_only');
  const [autoSkipDuplicates, setAutoSkipDuplicates] = useState<boolean>(true);
  const [bulkTuitionMonths, setBulkTuitionMonths] = useState<number>(6);
  const [bulkImporting, setBulkImporting] = useState<boolean>(false);
  const [autoCreateMissingClasses, setAutoCreateMissingClasses] = useState<boolean>(true);

  // Form states
  const [newStudent, setNewStudent] = useState({
    student_code: '',
    full_name: '',
    nickname: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    tuition_expiry_date: '',
    current_class_id: '',
    assigned_hrt_id: '',
    notes: '',
  });

  const previewStudents = useMemo(() => {
    let list = dotbResult.students;
    if (bulkPreviewFilterClass !== 'all') {
      list = list.filter((s) => s.class_name === bulkPreviewFilterClass);
    }
    if (bulkDuplicateFilter === 'new_only') {
      list = list.filter((s) => !s.is_duplicate);
    } else if (bulkDuplicateFilter === 'duplicates_only') {
      list = list.filter((s) => s.is_duplicate);
    }
    return list;
  }, [dotbResult.students, bulkPreviewFilterClass, bulkDuplicateFilter]);

  // Real-time duplicate detection for single student add (User requirement: khi nhập tay cũng vậy, có rồi là báo đã có học sinh trong danh sách)
  const singleStudentDuplicate = useMemo(() => {
    if (!newStudent.full_name?.trim()) return null;
    return findDuplicateStudent(
      {
        student_code: newStudent.student_code,
        full_name: newStudent.full_name,
        date_of_birth: newStudent.date_of_birth,
        nickname: newStudent.nickname,
      },
      students
    );
  }, [newStudent.full_name, newStudent.date_of_birth, newStudent.nickname, newStudent.student_code, students]);

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
  const getTuitionStatus = (expiryDateStr?: string) => {
    if (!expiryDateStr || expiryDateStr.trim() === '') {
      return {
        days: 0,
        label: 'Not set (Pending)',
        status: 'active' as const,
        color: 'bg-slate-50 text-slate-500 border-slate-200',
        badge: 'bg-slate-300',
      };
    }
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
    { id: 'birthdate', label: 'Birthdate', desc: 'Student birthdate' },
    { id: 'birthdate_anniversary', label: 'Birthdate Anniversary', desc: 'Upcoming student birthday this month' },
    { id: 'date_performed', label: 'Date Performed', desc: 'Date of care task or assessment performed' },
    { id: 'created_at', label: 'Date Created', desc: 'Student enrollment & registration date' },
    { id: 'updated_at', label: 'Date Modified', desc: 'Profile last modified timestamp' },
    { id: 'last_activity', label: 'Last Activity - Call Date', desc: 'Recent outbound CRM call or parent log' },
    { id: 'stopped_date', label: 'Stopped Date', desc: 'Student suspension or drop date' },
    { id: 'assessment_date', label: 'Assessment Date', desc: 'Date of 4-skill Cambridge/Oxford evaluation' },
    { id: 'tuition_expiry', label: 'Tuition Expiry Date', desc: 'Tuition fee deadline & renewal cycle' },
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
      // 1. Search name, nickname, student code, parent name, phone
      const query = searchTerm.toLowerCase().trim();
      const matchSearch =
        !query ||
        s.full_name.toLowerCase().includes(query) ||
        (s.nickname && s.nickname.toLowerCase().includes(query)) ||
        s.student_code.toLowerCase().includes(query) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(query)) ||
        (s.parent_phone && s.parent_phone.includes(query));

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
        if (dateFieldType === 'assessment_date' || dateFieldType === 'date_performed') {
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
        } else if (dateFieldType === 'stopped_date') {
          targetDate = ((s.status as string) === 'stopped' || s.status === 'dropped') ? (s.updated_at ? s.updated_at.slice(0, 10) : '') : '';
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
  const handleOpenAddModal = (initialTab: 'single' | 'bulk' = 'single') => {
    const nextCodes = getNextStudentCodes('PH', students, 1);
    const defaultClassId = classFilter !== 'all' ? classFilter : classes[0]?.id || '';
    setNewStudent({
      student_code: nextCodes[0] || 'KAP-PH-010',
      full_name: '',
      nickname: '',
      date_of_birth: '',
      gender: 'male',
      parent_name: '',
      parent_phone: '',
      parent_email: '',
      tuition_expiry_date: '',
      current_class_id: defaultClassId,
      assigned_hrt_id: '',
      notes: '',
    });
    setBulkRawText('');
    setDotbResult({
      students: [],
      classes: [],
      totalWithNicknames: 0,
      totalWithBirthdate: 0,
      totalDuplicates: 0,
      totalNew: 0,
    });
    setBulkPreviewFilterClass('all');
    setBulkTuitionMonths(6);
    setAddModalTab(initialTab);
    setShowParentInfoSection(false);
    setShowRawPasteSection(false);
    setShowAddModal(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    // Strict Anti-Duplicate Validation per customer requirement
    if (singleStudentDuplicate) {
      setActionMessage({
        type: 'error',
        text: `Duplicate Student Alert: "${singleStudentDuplicate.full_name}" is already in the student directory (Code: ${singleStudentDuplicate.student_code}${singleStudentDuplicate.current_class?.name ? ` - ${singleStudentDuplicate.current_class.name}` : ''}). Duplicate enrollment is prohibited.`,
      });
      return;
    }

    setSubmitting(true);
    setActionMessage(null);

    try {
      const studentCode = newStudent.student_code.trim() || getNextStudentCodes('PH', students, 1)[0];
      await StudentService.createStudent({
        branch_id: currentBranch.id,
        student_code: studentCode,
        full_name: newStudent.full_name.trim(),
        nickname: newStudent.nickname.trim() || undefined,
        date_of_birth: newStudent.date_of_birth || undefined,
        gender: newStudent.gender,
        parent_name: undefined,
        parent_phone: undefined,
        parent_email: undefined,
        tuition_expiry_date: newStudent.tuition_expiry_date.trim() || undefined,
        status: 'active',
        current_class_id: newStudent.current_class_id || undefined,
        assigned_hrt_id: newStudent.assigned_hrt_id || undefined,
        notes: newStudent.notes.trim() || undefined,
      });

      setActionMessage({
        type: 'success',
        text: `Student "${newStudent.full_name.trim()}"${newStudent.nickname.trim() ? ` (${newStudent.nickname.trim()})` : ''} added successfully!`,
      });
      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to add student record.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkTextChange = (text: string) => {
    setBulkRawText(text);
    const parsed = parseDotbExport(text, 'PH', students);
    setDotbResult(parsed);
    setBulkPreviewFilterClass('all');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBulkImporting(true);
      const text = await file.text();
      const res = parseDotbExport(text, 'PH', students);
      setDotbResult(res);
      setBulkPreviewFilterClass('all');
      setActionMessage({
        type: 'success',
        text: `Extracted ${res.students.length} students (${res.totalNew} new, ${res.totalDuplicates} duplicates identified) across ${res.classes.length} cohorts from "${file.name}"!`,
      });
    } catch (err: any) {
      console.error('File parsing error:', err);
      setActionMessage({
        type: 'error',
        text: `Failed to parse file: ${err.message || 'Invalid format'}`,
      });
    } finally {
      setBulkImporting(false);
      e.target.value = '';
    }
  };

  const handleLoadSampleDotbExport = async () => {
    try {
      setBulkImporting(true);
      const resp = await fetch('/sample-dotb-export.xls');
      if (!resp.ok) throw new Error('Could not fetch sample DotB export file');
      const text = await resp.text();
      const res = parseDotbExport(text, 'PH', students);
      setDotbResult(res);
      setBulkPreviewFilterClass('all');
      setActionMessage({
        type: 'success',
        text: `Loaded official DotB export: ${res.students.length} records parsed (${res.totalNew} new unique students, ${res.totalDuplicates} duplicates identified) across ${res.classes.length} cohorts!`,
      });
    } catch (err: any) {
      console.error('Load sample error:', err);
      setActionMessage({
        type: 'error',
        text: `Failed to load sample export: ${err.message || 'Unknown error'}`,
      });
    } finally {
      setBulkImporting(false);
    }
  };

  const handleRemoveParsedRow = (id: string) => {
    setDotbResult((prev) => {
      const remaining = prev.students.filter((s) => s.id !== id);
      const remainingClasses = prev.classes
        .map((c) => ({
          ...c,
          studentCount: remaining.filter((s) => s.class_name === c.name).length,
          newStudentCount: remaining.filter((s) => s.class_name === c.name && !s.is_duplicate).length,
        }))
        .filter((c) => c.studentCount > 0);

      return {
        ...prev,
        students: remaining,
        classes: remainingClasses,
        totalWithNicknames: remaining.filter((s) => s.nickname).length,
        totalWithBirthdate: remaining.filter((s) => s.date_of_birth).length,
        totalDuplicates: remaining.filter((s) => s.is_duplicate).length,
        totalNew: remaining.filter((s) => !s.is_duplicate).length,
      };
    });
  };

  const handleBulkImportSubmit = async () => {
    if (!currentBranch || previewStudents.length === 0) return;
    setBulkImporting(true);
    setActionMessage(null);

    try {
      // Deduplication check: Filter out duplicate students if autoSkipDuplicates is enabled
      const studentsToImport = autoSkipDuplicates
        ? previewStudents.filter((s) => !s.is_duplicate)
        : previewStudents;

      if (studentsToImport.length === 0) {
        setActionMessage({
          type: 'error',
          text: 'All selected students already exist in the database directory. No duplicate records were added.',
        });
        setBulkImporting(false);
        return;
      }

      let currentClasses = [...classes];
      const uniqueClassNames = Array.from(new Set(studentsToImport.map((s) => s.class_name)));

      if (autoCreateMissingClasses) {
        const missingClasses = uniqueClassNames.filter(
          (name) => !currentClasses.some((c) => c.name.toLowerCase() === name.toLowerCase())
        );

        if (missingClasses.length > 0) {
          const newClassesPayload = missingClasses.map((name) => ({
            branch_id: currentBranch.id,
            name,
            level: inferClassLevel(name),
          }));
          const createdClasses = await StudentService.createClassesBatch(newClassesPayload);
          currentClasses = [...currentClasses, ...createdClasses];
          setClasses(currentClasses);
        }
      }

      const payloads = studentsToImport.map((item) => {
        const matchedClass = currentClasses.find(
          (c) => c.name.toLowerCase() === item.class_name.toLowerCase()
        );

        return {
          branch_id: currentBranch.id,
          student_code: item.student_code.trim(),
          full_name: item.full_name.trim(),
          nickname: item.nickname?.trim() || undefined,
          date_of_birth: item.date_of_birth,
          gender: item.gender || 'male',
          parent_name: undefined,
          parent_phone: undefined,
          parent_email: undefined,
          tuition_expiry_date: '',
          status: 'active' as StudentStatus,
          current_class_id: matchedClass?.id || '',
          assigned_hrt_id: matchedClass?.default_hrt_id || undefined,
          notes: `Imported from DotB class export [Cohort: ${item.class_name}] on ${new Date().toLocaleDateString('en-US')}`,
        };
      });

      await StudentService.createStudentsBulk(payloads);

      const skippedCount = previewStudents.length - studentsToImport.length;
      setActionMessage({
        type: 'success',
        text: `Successfully imported ${payloads.length} new student(s) across ${uniqueClassNames.length} cohort(s)!${
          skippedCount > 0 ? ` (${skippedCount} duplicate student(s) automatically skipped)` : ''
        }`,
      });

      setShowAddModal(false);
      if (bulkPreviewFilterClass !== 'all') {
        const matchedClass = currentClasses.find(
          (c) => c.name.toLowerCase() === bulkPreviewFilterClass.toLowerCase()
        );
        if (matchedClass) {
          setClassFilter(matchedClass.id);
        }
      }
      await loadData();
    } catch (err: any) {
      console.error('Bulk import error:', err);
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to import students.',
      });
    } finally {
      setBulkImporting(false);
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
      nickname: student.nickname || '',
      date_of_birth: student.date_of_birth || '',
      gender: (student.gender as any) || 'male',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      parent_email: student.parent_email || '',
      tuition_expiry_date: student.tuition_expiry_date || '',
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
        nickname: editStudentForm.nickname.trim() || undefined,
        date_of_birth: editStudentForm.date_of_birth,
        gender: editStudentForm.gender,
        parent_name: editStudentForm.parent_name.trim() || undefined,
        parent_phone: editStudentForm.parent_phone.trim() || undefined,
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
        text: 'Permission denied: Only System Admin and Center Manager (CM) can delete student records.',
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

  const handleScheduleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !selectedStudentForReminder) return;
    setReminderSubmitting(true);
    setActionMessage(null);
    try {
      const created = await StudentService.createCareTask({
        student_id: selectedStudentForReminder.id,
        branch_id: currentBranch.id,
        title: reminderForm.title.trim(),
        task_type: reminderForm.task_type,
        due_date: reminderForm.due_date,
        status: 'pending',
        notes: reminderForm.notes.trim() || undefined,
      });

      EmailNotificationService.dispatchAutomatedEmail({
        title: `Reminder Scheduled: ${created.title}`,
        actionType: 'reminder',
        recipients: [
          `Assigned HRT: ${selectedStudentForReminder.effective_hrt_name || 'HRT Staff'}`,
          `Center Manager (CM): Campus Reminders`,
          `Supervisor: ${profile?.full_name || 'Management'} (${activeRole})`,
          `All Teachers: Main Teacher & Academic Staff`,
        ],
      });

      setActionMessage({
        type: 'success',
        text: `Reminder appointment scheduled for ${selectedStudentForReminder.full_name}! Notification dispatched from ${EmailNotificationService.getSenderEmail()}.`,
      });
      setSelectedStudentForReminder(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Failed to schedule reminder appointment.',
      });
    } finally {
      setReminderSubmitting(false);
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal('bulk')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#043264] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#043264]" />
              <span>{'Import from DotB Sheet'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenAddModal('single')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{'Add New Student'}</span>
            </button>
          </div>
        )}
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${actionMessage.type === 'success'
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
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${dateRangeFrom || dateRangeTo || dateFieldType !== 'assessment_date'
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
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex flex-col transition-colors ${dateFieldType === opt.id ? 'bg-blue-50 text-[#043264] font-semibold' : 'hover:bg-slate-50 text-slate-700'
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
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${assessmentStatusFilter === 'all'
              ? 'bg-[#043264] text-white shadow-2xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            All Students ({students.length})
          </button>

          <button
            type="button"
            onClick={() => setAssessmentStatusFilter('pending')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${assessmentStatusFilter === 'pending'
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
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${assessmentStatusFilter === 'evaluated'
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
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${assessmentStatusFilter === 'risk'
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
                  <th className="py-3 px-3 text-right">Actions</th>
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setSelectedStudentForProfile(student)}
                                className="font-semibold text-slate-900 hover:text-[#026fd7] hover:underline text-left transition-colors cursor-pointer block leading-tight"
                              >
                                {student.full_name}
                              </button>
                              {student.nickname && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  {student.nickname}
                                </span>
                              )}
                            </div>
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
                        {student.tuition_expiry_date ? (
                          <>
                            <div className="font-mono text-slate-800 font-medium">{student.tuition_expiry_date}</div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-0.5 ${tuition.color}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${tuition.badge}`} />
                              {tuition.label}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            {'Not set (Pending)'}
                          </span>
                        )}
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
                              title={'Delete student (Admin & CM Only)'}
                              onClick={() => setDeletingStudent(student)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Schedule Reminder Appointment (SOO, HT, CM, Admin) */}
                          {canCreateReminder && (
                            <button
                              type="button"
                              title="Schedule Reminder / Task (SOO, HT, CM, Admin)"
                              onClick={() => {
                                setSelectedStudentForReminder(student);
                                setReminderForm({
                                  task_type: 'call_care',
                                  title: `Follow-up reminder for ${student.full_name}`,
                                  due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                                  notes: '',
                                });
                              }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <Clock className="w-4 h-4" />
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
                              className={`py-1 px-1.5 text-[10px] font-semibold rounded-md border text-center transition-all cursor-pointer ${isSel
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
                      className={`p-2 rounded-lg text-xs font-semibold border text-center transition-all cursor-pointer ${quickAssessForm.progress_status === status
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
          MODAL: ADD NEW STUDENT & BULK IMPORT FROM DOTB SHEET
      ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div
            className={`bg-white rounded-2xl w-full p-5 sm:p-6 shadow-xl border border-slate-200 max-h-[92vh] overflow-y-auto transition-all ${
              addModalTab === 'bulk' ? 'max-w-4xl' : 'max-w-lg'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-50 text-[#043264] border border-blue-100">
                  <GraduationCap className="w-5 h-5 text-[#043264]" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                    {addModalTab === 'bulk'
                      ? 'Import Students from DotB Sheet / File'
                      : 'Add New Student Record'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {addModalTab === 'bulk'
                      ? 'Parse DotB class report exports (.xls/.csv) with automatic nickname & cohort mapping'
                      : 'Streamlined profile enrollment prioritized by Student Name & Nickname'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pt-3 pb-1">
              <button
                type="button"
                onClick={() => setAddModalTab('single')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  addModalTab === 'single'
                    ? 'border-[#043264] text-[#043264]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{'Single Student Profile'}</span>
              </button>
              <button
                type="button"
                onClick={() => setAddModalTab('bulk')}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                  addModalTab === 'bulk'
                    ? 'border-[#043264] text-[#043264]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{'Import from DotB Sheet'}</span>
                {dotbResult.students.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-[#043264] font-semibold">
                    {dotbResult.students.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: SINGLE STUDENT FORM */}
            {addModalTab === 'single' && (
              <form onSubmit={handleCreateStudent} className="space-y-3.5 pt-4 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px] text-blue-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#043264] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{'Quick Student Profile Enrollment:'}</span>
                    <p className="text-blue-800 mt-0.5">
                      {'Prioritized by Student Full Name and Nickname per CM requirement. Tuition Expiry can be left blank and updated later.'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {'Student Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudent.full_name}
                      onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                      placeholder="E.g., Alexander William"
                      className={`w-full px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 bg-white ${
                        singleStudentDuplicate
                          ? 'border-amber-400 focus:ring-amber-300 ring-1 ring-amber-200'
                          : 'border-slate-300 focus:ring-[#043264]/20'
                      }`}
                    />
                    {singleStudentDuplicate && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-bold text-[11px] text-amber-900">
                            {'⚠️ Duplicate Student Detected in Directory!'}
                          </span>
                          <p className="text-[10px] text-amber-800 leading-tight">
                            {`A student named "${singleStudentDuplicate.full_name}" is already registered in the system.`}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 pt-1 text-[9px] font-mono">
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 font-bold border border-amber-200">
                              {`Code: ${singleStudentDuplicate.student_code}`}
                            </span>
                            {singleStudentDuplicate.nickname && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#043264] font-bold border border-blue-200">
                                {`Alias: ${singleStudentDuplicate.nickname}`}
                              </span>
                            )}
                            {singleStudentDuplicate.current_class?.name && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {`Class: ${singleStudentDuplicate.current_class.name}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {'Nickname (English Name / Class Alias)'}
                    </label>
                    <input
                      type="text"
                      value={newStudent.nickname}
                      onChange={(e) => setNewStudent({ ...newStudent, nickname: e.target.value })}
                      placeholder="E.g., Leo, Jenny, Alex, Tom..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {'Class Cohort'}
                    </label>
                    <select
                      value={newStudent.current_class_id}
                      onChange={(e) => setNewStudent({ ...newStudent, current_class_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
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
                      {'Student Code *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudent.student_code}
                      onChange={(e) => setNewStudent({ ...newStudent, student_code: e.target.value })}
                      placeholder="E.g., KAP-PH-010"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {'Date of Birth'}
                    </label>
                    <input
                      type="date"
                      value={newStudent.date_of_birth}
                      onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {'Gender'}
                    </label>
                    <select
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="male">{'Male'}</option>
                      <option value="female">{'Female'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {'Tuition Expiry Date'}
                    </label>
                    <input
                      type="date"
                      value={newStudent.tuition_expiry_date}
                      onChange={(e) => setNewStudent({ ...newStudent, tuition_expiry_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 bg-white"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      {'Leave blank to set or update later in directory.'}
                    </span>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {'Designated HRT'}
                    </label>
                    <select
                      value={newStudent.assigned_hrt_id}
                      onChange={(e) => setNewStudent({ ...newStudent, assigned_hrt_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
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
                    placeholder={'Student characteristics, learning goals, parent expectations...'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                  >
                    {'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || Boolean(singleStudentDuplicate)}
                    className={`px-4 py-2 rounded-xl text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5 ${
                      singleStudentDuplicate
                        ? 'bg-amber-600 hover:bg-amber-700 cursor-not-allowed'
                        : 'bg-[#043264] hover:bg-[#012147]'
                    }`}
                  >
                    {singleStudentDuplicate ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-white" />
                        <span>{'Duplicate Exists in Directory'}</span>
                      </>
                    ) : submitting ? (
                      'Saving...'
                    ) : (
                      'Save Student Record'
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: BULK IMPORT FROM DOTB SHEET / FILE */}
            {addModalTab === 'bulk' && (
              <div className="space-y-4 pt-4 text-xs">
                {/* Upload & Preset Options */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2 p-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 flex flex-col items-center justify-center text-center hover:bg-blue-50/60 transition-colors">
                    <FileSpreadsheet className="w-8 h-8 text-[#043264] mb-2" />
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">
                      {'Upload DotB Student List Export (.xls / .xlsx / .csv)'}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md">
                      {'Select the exported Excel/HTML file from DotB. Cohorts, student names, English nicknames, and birthdates are automatically recognized.'}
                    </p>
                    <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[#043264] hover:bg-[#012147] text-white font-semibold rounded-xl text-xs cursor-pointer shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>{'Choose Exported File'}</span>
                      <input
                        type="file"
                        accept=".xls,.xlsx,.csv,.txt,.html"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {'Current Branch Export'}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {'Load the official DotB master sheet (1,358 students across 131 cohorts) with 1 click.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLoadSampleDotbExport}
                      disabled={bulkImporting}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-300 text-xs shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <Table className="w-4 h-4 text-[#043264]" />
                      <span>{bulkImporting ? 'Loading Sheet...' : 'Load DotB Sheet (1,358)'}</span>
                    </button>
                  </div>
                </div>

                {/* Expandable Manual Text Paste */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
                  <button
                    type="button"
                    onClick={() => setShowRawPasteSection(!showRawPasteSection)}
                    className="w-full px-3.5 py-2 text-left font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer text-xs"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>{'Or Paste Rows from Google Sheets / Excel Directly'}</span>
                    </span>
                    {showRawPasteSection ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  {showRawPasteSection && (
                    <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                      <textarea
                        rows={4}
                        value={bulkRawText}
                        onChange={(e) => handleBulkTextChange(e.target.value)}
                        placeholder={`Paste tabular rows here, for example:\nTrần Hạ An\tDoris\t22/03/2020\nĐỗ Phú Nhật Anh\tTaro\t18/09/2022`}
                        className="w-full p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                      />
                    </div>
                  )}
                </div>

                {/* Parsed Results Overview & Configuration */}
                {dotbResult.students.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    {/* Summary KPI Badges (Deduplication Enabled) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-[#043264]">Total Extracted</span>
                        <div className="text-xl font-bold text-slate-900 mt-0.5">
                          {dotbResult.students.length}
                        </div>
                        <span className="text-[10px] text-slate-500">Records in file</span>
                      </div>
                      <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-emerald-700">New Students</span>
                        <div className="text-xl font-bold text-emerald-900 mt-0.5">
                          {dotbResult.totalNew}
                        </div>
                        <span className="text-[10px] text-emerald-600 font-medium">Ready to enroll</span>
                      </div>
                      <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-amber-700">⚠️ Duplicates</span>
                        <div className="text-xl font-bold text-amber-900 mt-0.5">
                          {dotbResult.totalDuplicates}
                        </div>
                        <span className="text-[10px] text-amber-600 font-medium">Skipped automatically</span>
                      </div>
                      <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                        <span className="text-[10px] uppercase font-bold text-indigo-700">Cohorts Identified</span>
                        <div className="text-xl font-bold text-slate-900 mt-0.5">
                          {dotbResult.classes.length}
                        </div>
                        <span className="text-[10px] text-slate-500">Classes found</span>
                      </div>
                    </div>

                    {/* Class Filter & Enrollment Options */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          {'Select Cohort (CM Filter by Class)'}
                        </label>
                        <select
                          value={bulkPreviewFilterClass}
                          onChange={(e) => setBulkPreviewFilterClass(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-xs text-slate-800"
                        >
                          <option value="all">
                            {`All Cohorts (${dotbResult.students.length} students across ${dotbResult.classes.length} classes)`}
                          </option>
                          {dotbResult.classes.map((c) => (
                            <option key={c.name} value={c.name}>
                              {`${c.name} (${c.studentCount} students - ${c.inferredLevel})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          {'Deduplication View Filter'}
                        </label>
                        <select
                          value={bulkDuplicateFilter}
                          onChange={(e) => setBulkDuplicateFilter(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
                        >
                          <option value="new_only">
                            {`✨ New Students Only (${dotbResult.totalNew}) [Recommended]`}
                          </option>
                          <option value="all">
                            {`All Records (${dotbResult.students.length})`}
                          </option>
                          <option value="duplicates_only">
                            {`⚠️ Duplicates Only (${dotbResult.totalDuplicates})`}
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          {'Tuition Expiry Date'}
                        </label>
                        <div className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-100/70 text-slate-600 text-xs flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{'Blank / Not Set (Can be added & edited later)'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                        <div className="flex flex-wrap items-center gap-4">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoSkipDuplicates}
                              onChange={(e) => setAutoSkipDuplicates(e.target.checked)}
                              className="rounded border-slate-300 text-[#043264] focus:ring-[#043264]"
                            />
                            <span className="text-[11px] font-semibold text-emerald-800">
                              {'🛡️ Automatically skip duplicate students (Prevents duplicate profiles)'}
                            </span>
                          </label>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={autoCreateMissingClasses}
                              onChange={(e) => setAutoCreateMissingClasses(e.target.checked)}
                              className="rounded border-slate-300 text-[#043264] focus:ring-[#043264]"
                            />
                            <span className="text-[11px] font-medium text-slate-700">
                              {'Automatically register missing classes in database'}
                            </span>
                          </label>
                        </div>
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {`Filtered: ${previewStudents.length} records`}
                        </span>
                      </div>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="max-h-64 overflow-y-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 font-bold text-slate-700 text-[11px]">
                            <tr>
                              <th className="py-2 px-2.5 w-12 text-center">#</th>
                              <th className="py-2 px-2.5">Cohort / Class</th>
                              <th className="py-2 px-2.5">Student Full Name</th>
                              <th className="py-2 px-2.5">Nickname</th>
                              <th className="py-2 px-2.5">Birthdate</th>
                              <th className="py-2 px-2.5">Profile Status</th>
                              <th className="py-2 px-2.5">Student Code</th>
                              <th className="py-2 px-2 text-center w-12">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {previewStudents.slice(0, 50).map((item, idx) => (
                              <tr
                                key={item.id}
                                className={`transition-colors ${
                                  item.is_duplicate
                                    ? 'bg-amber-50/40 hover:bg-amber-50/70 text-slate-600'
                                    : 'hover:bg-slate-50/60'
                                }`}
                              >
                                <td className="py-2 px-2.5 text-center text-slate-400 font-mono">
                                  {idx + 1}
                                </td>
                                <td className="py-2 px-2.5 font-medium text-slate-700 truncate max-w-[160px]">
                                  {item.class_name}
                                </td>
                                <td className="py-2 px-2.5 font-bold text-slate-900">
                                  {item.full_name}
                                </td>
                                <td className="py-2 px-2.5">
                                  {item.nickname ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#043264] border border-blue-200">
                                      {item.nickname}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 font-mono text-slate-600">
                                  {item.date_of_birth || '—'}
                                </td>
                                <td className="py-2 px-2.5">
                                  {item.is_duplicate ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 w-fit">
                                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                        <span>{'Duplicate - Skipped'}</span>
                                      </span>
                                      <span
                                        className="text-[9px] text-amber-700 font-normal truncate max-w-[150px]"
                                        title={item.duplicate_reason}
                                      >
                                        {item.duplicate_reason || 'Already enrolled'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{'New Student'}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2.5 font-mono">
                                  {item.is_duplicate ? (
                                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/60 px-1 py-0.5 rounded border border-amber-200">
                                      {item.matched_student_code ? `Exists: ${item.matched_student_code}` : item.student_code}
                                    </span>
                                  ) : (
                                    <span className="text-[#043264] font-semibold">
                                      {item.student_code}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveParsedRow(item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Remove from import"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {previewStudents.length > 50 && (
                        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
                          {`Showing first 50 rows of ${previewStudents.length} records. All ${previewStudents.length} records will be processed.`}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions with Deduplication Summary */}
                    {(() => {
                      const importableCount = autoSkipDuplicates
                        ? previewStudents.filter((s) => !s.is_duplicate).length
                        : previewStudents.length;
                      const skippedCount = previewStudents.length - importableCount;

                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <div className="flex flex-col text-xs text-slate-500 font-semibold">
                            <span className="text-slate-800">
                              {`Target: ${importableCount} new student profile(s) ready to enroll`}
                            </span>
                            {skippedCount > 0 && (
                              <span className="text-[11px] text-amber-700 font-normal">
                                {`🛡️ ${skippedCount} duplicate student(s) will be automatically skipped`}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setShowAddModal(false)}
                              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                            >
                              {'Cancel'}
                            </button>
                            <button
                              type="button"
                              onClick={handleBulkImportSubmit}
                              disabled={bulkImporting || importableCount === 0}
                              className="px-5 py-2.5 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-2"
                            >
                              <FileSpreadsheet className="w-4 h-4" />
                              <span>
                                {bulkImporting
                                  ? 'Importing...'
                                  : importableCount === 0
                                  ? '0 New Students (All Duplicates Skipped)'
                                  : `Import ${importableCount} New Students into KAPLA`}
                              </span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-slate-200 rounded-xl bg-slate-50/50">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-xs text-slate-600">
                      {'No student file loaded yet'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {'Upload an exported file from DotB or click "Load DotB Sheet" above to preview data.'}
                    </p>
                  </div>
                )}
              </div>
            )}
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
                    {'Nickname (English Name / Class Alias)'}
                  </label>
                  <input
                    type="text"
                    value={editStudentForm.nickname}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, nickname: e.target.value })}
                    placeholder="E.g., Leo, Alex, Jenny, Tom..."
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    {'Parent Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={editStudentForm.parent_name}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, parent_name: e.target.value })}
                    placeholder="E.g., Mr. Nam (Father)"
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Parent Phone (Optional)'}
                  </label>
                  <input
                    type="tel"
                    value={editStudentForm.parent_phone}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, parent_phone: e.target.value })}
                    placeholder="E.g., 0901234567"
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
                    {'Tuition Expiry Date'}
                  </label>
                  <input
                    type="date"
                    value={editStudentForm.tuition_expiry_date}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, tuition_expiry_date: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {'Leave empty or pick a date to configure tuition renewal.'}
                  </span>
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
          MODAL: SCHEDULE REMINDER APPOINTMENT / TASK (SOO, HT, CM, Admin)
      ========================================================================= */}
      {selectedStudentForReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-[#043264] rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Schedule Reminder Appointment / Task</h3>
                  <p className="text-[11px] text-slate-500">
                    Authorized roles (SOO, HT, CM, Admin) • Auto-dispatch via <strong className="font-mono text-blue-700">{EmailNotificationService.getSenderEmail()}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForReminder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleScheduleReminderSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Target Student Info */}
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{selectedStudentForReminder.full_name}</div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">{selectedStudentForReminder.student_code}</span>
                    <span>• Class: {selectedStudentForReminder.current_class?.name || 'Unassigned'}</span>
                    <span>• HRT: {selectedStudentForReminder.effective_hrt_name || 'Class Default'}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Target Student
                </span>
              </div>

              {/* 5 HRT Task Classifications */}
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
                      className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition-all ${reminderForm.task_type === cat.id
                        ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="reminder_task_type"
                          checked={reminderForm.task_type === cat.id}
                          onChange={() => setReminderForm({ ...reminderForm, task_type: cat.id as CareTaskType })}
                          className="text-[#043264]"
                        />
                        <span className="font-bold text-slate-800">{cat.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-5">{cat.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reminder / Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reminderForm.title}
                  onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                  placeholder="e.g. Follow-up consultation regarding grammar tutoring"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Due Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={reminderForm.due_date}
                  onChange={(e) => setReminderForm({ ...reminderForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043264]/20 bg-white"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={reminderForm.notes}
                  onChange={(e) => setReminderForm({ ...reminderForm, notes: e.target.value })}
                  placeholder="Additional context or specific instructions for the assigned teacher / HRT..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              {/* Dispatch Info */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Mail className="w-3.5 h-3.5 text-amber-700" />
                  <span>Automated Dispatch via {EmailNotificationService.getSenderEmail()}</span>
                </div>
                <p>
                  Upon submission, an automated notification email will be dispatched to: Assigned HRT (
                  {selectedStudentForReminder.effective_hrt_name || 'Designated HRT'}), Center Manager (CM), and Academic Teachers.
                </p>
              </div>

              {/* Footer */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForReminder(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reminderSubmitting}
                  className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{reminderSubmitting ? 'Scheduling...' : 'Schedule Reminder Appointment'}</span>
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
