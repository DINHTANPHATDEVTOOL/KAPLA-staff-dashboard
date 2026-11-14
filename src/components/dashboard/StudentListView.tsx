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
  const canManage = isSysAdmin || isCM;

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
      console.error('Lỗi tải dữ liệu học viên:', err);
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
        label: language === 'en' ? `Expired ${Math.abs(diffDays)}d ago` : `Đã hết hạn ${Math.abs(diffDays)} ngày`,
        status: 'expired' as const,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        badge: 'bg-rose-500',
      };
    }
    if (diffDays <= 14) {
      return {
        days: diffDays,
        label: language === 'en' ? `Due in ${diffDays}d` : `Sắp hết hạn (${diffDays} ngày)`,
        status: 'warning' as const,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'bg-amber-500',
      };
    }
    return {
      days: diffDays,
      label: language === 'en' ? `${diffDays}d remaining` : `Còn ${diffDays} ngày`,
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

  // Filtered students with all 6 controls from Image 3/4
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

      return matchSearch && matchClass && matchLevel && matchTeacher && matchAcademic && matchRenewal;
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

      setActionMessage({ type: 'success', text: 'Thêm học viên mới thành công!' });
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
      setActionMessage({ type: 'error', text: err.message || 'Thêm học viên thất bại' });
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
      setActionMessage({ type: 'success', text: `Chuyển lớp cho học viên ${selectedStudentForTransfer.full_name} thành công!` });
      setSelectedStudentForTransfer(null);
      setTransferClassId('');
      setTransferReason('');
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Chuyển lớp thất bại' });
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
        text: targetHrtId ? 'Phân công HRT riêng thành công!' : 'Đã hủy HRT riêng, học viên quay về HRT mặc định của lớp.',
      });
      setSelectedStudentForHrt(null);
      setNewHrtId('');
      setHrtReason('');
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Phân công HRT thất bại' });
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
        text: language === 'en' ? 'Student profile updated successfully.' : 'Cập nhật thông tin học viên thành công.',
      });
      setEditingStudent(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Lỗi khi cập nhật học viên.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudentSubmit = async () => {
    if (!deletingStudent) return;
    setSubmitting(true);
    setActionMessage(null);
    try {
      await StudentService.deleteStudent(deletingStudent.id);
      setActionMessage({
        type: 'success',
        text: language === 'en' ? 'Student removed successfully.' : 'Đã xóa học viên thành công.',
      });
      setDeletingStudent(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.message || 'Lỗi khi xóa học viên.',
      });
    } finally {
      setSubmitting(false);
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
              {language === 'en' ? 'Student Records' : 'Hồ sơ học viên (Student Directory)'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? `Manage student records, tuition expiry, class enrollment, and HRT assignments at ${currentBranch?.name || 'KAPLA'}`
              : `Quản lý thông tin học viên, hạn học phí, lớp học và phân công HRT tại ${currentBranch?.name || 'KAPLA'}`}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {language === 'en' ? 'Add New Student' : 'Thêm học viên mới'}
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

      {/* Filters Bar — Exactly matching 6 filters from Customer Specification (Image 3 & 4) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'en'
                ? 'Search by student name, Student ID, parent...'
                : 'Tìm theo tên học sinh, mã HS, phụ huynh...'
            }
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
          />
        </div>

        {/* 5 Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2">
          {/* 1. All Classes */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">{t('students.allClasses', 'All Classes')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>

          {/* 2. All Levels */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">{t('students.filterAllLevels', 'All Levels')}</option>
            {availableLevels.map((lvl) => (
              <option key={lvl} value={lvl}>
                {lvl}
              </option>
            ))}
          </select>

          {/* 3. All Teachers */}
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">{t('students.filterAllTeachers', 'All Teachers')}</option>
            {availableTeachers.map((tch) => (
              <option key={tch.name} value={tch.name}>
                {tch.label}
              </option>
            ))}
          </select>

          {/* 4. Academic Status */}
          <select
            value={academicStatusFilter}
            onChange={(e) => setAcademicStatusFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 font-medium"
          >
            <option value="all">{t('students.filterAcademicStatus', 'Academic Status')}</option>
            <option value="on_track">{t('students.filterAcademicOnTrack', 'On Track')}</option>
            <option value="risk">{t('students.filterAcademicRisk', 'High Academic Risk')}</option>
          </select>

          {/* 5. Renewal Risk */}
          <select
            value={renewalRiskFilter}
            onChange={(e) => setRenewalRiskFilter(e.target.value)}
            className="px-2.5 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 font-medium col-span-2 sm:col-span-1"
          >
            <option value="all">{t('students.filterRenewalRisk', 'Renewal Risk')}</option>
            <option value="safe">{t('students.filterRenewalSafe', 'Safe (> 30 days)')}</option>
            <option value="expiring">{t('students.filterRenewalExpiring', 'Expiring (≤ 30 days)')}</option>
            <option value="due_soon">{t('students.filterRenewalDueSoon', 'Due Soon (≤ 14 days)')}</option>
            <option value="overdue">{t('students.filterRenewalOverdue', 'Overdue')}</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">{t('common.loading', 'Đang tải danh sách học viên...')}</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{t('common.noData', 'Không có học viên nào phù hợp')}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {language === 'en'
                ? 'No students found within your authorized scope or current filters.'
                : 'Không tìm thấy học viên trong phạm vi phân quyền hoặc theo bộ lọc hiện tại.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">{t('students.colStudent', 'Học viên')}</th>
                  <th className="py-3 px-4">{t('students.colParent', 'Phụ huynh')}</th>
                  <th className="py-3 px-4">{t('students.colClass', 'Lớp học')}</th>
                  <th className="py-3 px-4">{t('students.colExpiry', 'Hạn học phí')}</th>
                  <th className="py-3 px-4">{t('students.colHrt', 'HRT Phụ trách')}</th>
                  {canManage && <th className="py-3 px-4 text-right">{t('students.colActions', 'Thao tác')}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const tuition = getTuitionStatus(student.tuition_expiry_date);
                  const isSpecificHrt = Boolean(student.assigned_hrt_id);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student Info — Clickable to open Student Profile & Logcall */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedStudentForProfile(student)}
                            title={language === 'en' ? 'Open student profile & logcall' : 'Xem toàn bộ hồ sơ & logcall'}
                            className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-[#043264] font-bold text-xs flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-2xs"
                          >
                            {student.full_name.charAt(0)}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForProfile(student)}
                              className="font-semibold text-slate-900 hover:text-[#026fd7] hover:underline text-left transition-colors cursor-pointer block"
                            >
                              {student.full_name}
                            </button>
                            <div className="text-[11px] text-slate-500">
                              {language === 'en' ? 'ID: ' : 'Mã: '}
                              <span className="font-mono text-slate-700 font-semibold">{student.student_code}</span>
                              {student.date_of_birth && ` • ${student.date_of_birth}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent Info */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{tDb(student.parent_name)}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1 font-mono text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {student.parent_phone}
                          </span>
                          {student.parent_email && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {student.parent_email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        {student.current_class ? (
                          <div>
                            <span className="font-medium text-slate-800">{student.current_class.name}</span>
                            <div className="text-[11px] text-slate-500">{student.current_class.level}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            {language === 'en' ? 'Unassigned' : 'Chưa xếp lớp'}
                          </span>
                        )}
                      </td>

                      {/* Tuition Expiry Date */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800">{student.tuition_expiry_date}</div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-0.5 ${tuition.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tuition.badge}`} />
                          {tuition.label}
                        </span>
                      </td>

                      {/* Assigned HRT */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">
                          {student.assigned_hrt?.full_name ||
                            student.effective_hrt_name ||
                            (language === 'en' ? 'Unassigned' : 'Chưa phân công')}
                        </div>
                        {isSpecificHrt ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 mt-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {language === 'en' ? 'Designated HRT' : 'HRT riêng'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                            {language === 'en' ? 'Class Default' : 'Mặc định theo lớp'}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                title="Chuyển lớp cho học viên"
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
                                title="Phân công hoặc đổi HRT riêng"
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
                                title={language === 'en' ? 'Edit student' : 'Sửa thông tin học viên'}
                                onClick={() => handleOpenEditStudent(student)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                title={language === 'en' ? 'Delete student' : 'Xóa học viên'}
                                onClick={() => setDeletingStudent(student)}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            title={language === 'en' ? 'View Profile & Logcall' : 'Xem toàn bộ hồ sơ (Logcall)'}
                            onClick={() => setSelectedStudentForProfile(student)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-[#043264] hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            title="Xem lịch sử chuyển lớp"
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
          MODAL: THÊM HỌC VIÊN MỚI (NHẬP TAY)
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
                  {language === 'en' ? 'Add New Student Record' : 'Nhập tay hồ sơ học viên mới'}
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
                    {language === 'en' ? 'Student Code *' : 'Mã học viên *'}
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
                    {language === 'en' ? 'Full Name *' : 'Họ và tên học viên *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.full_name}
                    onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                    placeholder="VD: Nguyễn Văn Anh"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Date of Birth' : 'Ngày sinh'}
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
                    {language === 'en' ? 'Gender' : 'Giới tính'}
                  </label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="male">{language === 'en' ? 'Male' : 'Nam'}</option>
                    <option value="female">{language === 'en' ? 'Female' : 'Nữ'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Parent Name *' : 'Họ tên phụ huynh *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newStudent.parent_name}
                    onChange={(e) => setNewStudent({ ...newStudent, parent_name: e.target.value })}
                    placeholder={language === 'en' ? 'Parent Name' : 'VD: Nguyễn Thị Lan (Mẹ)'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Parent Phone *' : 'Số điện thoại phụ huynh *'}
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
                  {language === 'en' ? 'Tuition Expiry Date *' : 'Ngày hết hạn học phí *'}
                </label>
                <input
                  type="date"
                  required
                  value={newStudent.tuition_expiry_date}
                  onChange={(e) => setNewStudent({ ...newStudent, tuition_expiry_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
                <span className="text-[10px] text-slate-500">
                  {language === 'en' ? 'Used for automatic retention alerts and tuition tracking.' : 'Dùng để tự động tính cảnh báo tái tục và hạn bảo lưu.'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Class Cohort' : 'Lớp học ghi danh'}
                  </label>
                  <select
                    value={newStudent.current_class_id}
                    onChange={(e) => setNewStudent({ ...newStudent, current_class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">{language === 'en' ? '-- Unassigned --' : '-- Chưa xếp lớp --'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Designated HRT' : 'Phân công HRT riêng'}
                  </label>
                  <select
                    value={newStudent.assigned_hrt_id}
                    onChange={(e) => setNewStudent({ ...newStudent, assigned_hrt_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">{language === 'en' ? 'Class Default' : 'Mặc định theo lớp'}</option>
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
                  {language === 'en' ? 'Academic Notes' : 'Ghi chú học vụ'}
                </label>
                <textarea
                  rows={2}
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                  placeholder={language === 'en' ? 'Student characteristics, parent expectations...' : 'Đặc điểm học viên, kỳ vọng phụ huynh...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting
                    ? (language === 'en' ? 'Saving...' : 'Đang lưu...')
                    : (language === 'en' ? 'Save Student Record' : 'Lưu hồ sơ học viên')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CHUYỂN LỚP HỌC VIÊN
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
                  {language === 'en' ? 'Transfer Student Class Cohort' : 'Chuyển lớp học viên'}
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
                  {language === 'en' ? 'Current Class: ' : 'Lớp hiện tại: '}
                  <span className="font-medium text-slate-800">
                    {selectedStudentForTransfer.current_class?.name || (language === 'en' ? 'Unassigned' : 'Chưa xếp lớp')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Target Class Cohort *' : 'Chọn lớp học đích *'}
                </label>
                <select
                  required
                  value={transferClassId}
                  onChange={(e) => setTransferClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">{language === 'en' ? '-- Select Target Class --' : '-- Chọn lớp học --'}</option>
                  {classes
                    .filter((c) => c.id !== selectedStudentForTransfer.current_class_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level}) - HRT: {c.default_hrt_name || (language === 'en' ? 'Default' : 'Theo lớp')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Reason for Transfer *' : 'Lý do chuyển lớp *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Student promoted to Movers, schedule adjustment...' : 'VD: Học viên tiến bộ chuyển lên lớp Movers, đổi lịch học theo nguyện vọng phụ huynh...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForTransfer(null)}
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
                    ? (language === 'en' ? 'Transferring...' : 'Đang chuyển...')
                    : (language === 'en' ? 'Confirm Transfer' : 'Xác nhận chuyển lớp')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PHÂN CÔNG HRT RIÊNG
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
                  {language === 'en' ? 'Assign Designated HRT' : 'Phân công Giáo viên chủ nhiệm (HRT)'}
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
                  {language === 'en' ? 'Class: ' : 'Lớp: '}
                  {selectedStudentForHrt.current_class?.name || (language === 'en' ? 'Unassigned' : 'Chưa xếp lớp')} •{' '}
                  {language === 'en' ? 'Current HRT: ' : 'Phụ trách hiện tại: '}
                  <span className="font-semibold text-slate-800">{selectedStudentForHrt.effective_hrt_name}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Designated HRT *' : 'Chỉ định HRT *'}
                </label>
                <select
                  value={newHrtId}
                  onChange={(e) => setNewHrtId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">
                    {language === 'en' ? '-- Class Default (Reset individual assignment) --' : '-- Mặc định theo lớp (Hủy phân công riêng) --'}
                  </option>
                  {hrtStaffs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.full_name} ({h.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {language === 'en'
                    ? '* Precedence rule: If designated HRT is set, this HRT has sole care responsibility and task routing.'
                    : '* Theo quy tắc ưu tiên: Nếu chọn HRT riêng, chỉ HRT này mới có quyền xem học viên và nhận danh sách công việc liên quan.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Reason for Assignment' : 'Lý do phân công'}
                </label>
                <textarea
                  rows={2}
                  value={hrtReason}
                  onChange={(e) => setHrtReason(e.target.value)}
                  placeholder={language === 'en' ? 'e.g. Special student needs dedicated experienced educator...' : 'VD: Cần giáo viên giàu kinh nghiệm đồng hành học viên đặc biệt...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForHrt(null)}
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
                    ? (language === 'en' ? 'Saving...' : 'Đang lưu...')
                    : (language === 'en' ? 'Confirm Assignment' : 'Xác nhận phân công')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LỊCH SỬ CHUYỂN LỚP
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
                  {language === 'en' ? 'Class Transfer History' : 'Lịch sử chuyển lớp học viên'}
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
                  {language === 'en' ? 'No transfer records for this student.' : 'Chưa có lịch sử chuyển lớp nào cho học viên này.'}
                </div>
              ) : (
                transferHistory.map((th) => (
                  <div key={th.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>{th.transfer_date}</span>
                      <span>{language === 'en' ? 'By: ' : 'Người thực hiện: '}{th.transferred_by_name || 'Admin'}</span>
                    </div>
                    <div className="font-semibold text-slate-800">
                      {th.from_class_name || (language === 'en' ? 'Unassigned' : 'Chưa xếp lớp')} → {th.to_class_name}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      {language === 'en' ? 'Reason: ' : 'Lý do: '}{th.reason}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CHỈNH SỬA THÔNG TIN HỌC VIÊN (EDIT STUDENT)
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
                    {language === 'en' ? 'Edit Student Profile' : 'Chỉnh sửa hồ sơ học viên'}
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
                    {language === 'en' ? 'Student Full Name *' : 'Họ và tên học viên *'}
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
                    {language === 'en' ? 'Student Code *' : 'Mã học viên *'}
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
                    {language === 'en' ? 'Date of Birth' : 'Ngày sinh'}
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
                    {language === 'en' ? 'Gender' : 'Giới tính'}
                  </label>
                  <select
                    value={editStudentForm.gender}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, gender: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="male">{language === 'en' ? 'Male' : 'Nam'}</option>
                    <option value="female">{language === 'en' ? 'Female' : 'Nữ'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Parent Name *' : 'Họ tên phụ huynh *'}
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
                    {language === 'en' ? 'Parent Phone *' : 'Số điện thoại phụ huynh *'}
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
                  {language === 'en' ? 'Parent Email' : 'Email phụ huynh'}
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
                    {language === 'en' ? 'Class' : 'Lớp học'}
                  </label>
                  <select
                    value={editStudentForm.current_class_id}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, current_class_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="">{language === 'en' ? '— No Class Assigned —' : '— Chưa xếp lớp —'}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Assigned HRT' : 'HRT Phụ trách'}
                  </label>
                  <select
                    value={editStudentForm.assigned_hrt_id}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, assigned_hrt_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="">{language === 'en' ? '— Class Default HRT —' : '— Mặc định theo lớp —'}</option>
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
                    {language === 'en' ? 'Tuition Expiry Date *' : 'Hạn đóng học phí *'}
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
                    {language === 'en' ? 'Student Status' : 'Trạng thái học vụ'}
                  </label>
                  <select
                    value={editStudentForm.status}
                    onChange={(e) => setEditStudentForm({ ...editStudentForm, status: e.target.value as StudentStatus })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="active">{language === 'en' ? 'Active' : 'Đang học'}</option>
                    <option value="warning">{language === 'en' ? 'Tuition Due Soon' : 'Cần chú ý phí'}</option>
                    <option value="expired">{language === 'en' ? 'Expired' : 'Đã hết hạn'}</option>
                    <option value="reserved">{language === 'en' ? 'Reserved' : 'Bảo lưu'}</option>
                    <option value="dropped">{language === 'en' ? 'Dropped' : 'Thôi học'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Academic & Care Notes' : 'Ghi chú học vụ / Chăm sóc'}
                </label>
                <textarea
                  rows={2}
                  value={editStudentForm.notes}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, notes: e.target.value })}
                  placeholder={language === 'en' ? 'Learning strengths, weaknesses, special care instructions...' : 'Điểm mạnh, điểm yếu, lưu ý chăm sóc đặc biệt...'}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {language === 'en' ? 'Cancel' : 'Hủy'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                >
                  <span>{language === 'en' ? 'Save Changes' : 'Lưu thay đổi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: XÁC NHẬN XÓA HỌC VIÊN (CONFIRM DELETE STUDENT)
      ========================================================================= */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {language === 'en' ? 'Delete Student Record?' : 'Xác nhận xóa học viên?'}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {language === 'en'
                ? `Are you sure you want to delete ${deletingStudent.full_name} (${deletingStudent.student_code})? All associated tasks, assessments, and attendance records will be permanently removed.`
                : `Bạn có chắc chắn muốn xóa học viên ${deletingStudent.full_name} (${deletingStudent.student_code}) không? Toàn bộ nhật ký chăm sóc, đánh giá và phụ đạo liên quan sẽ bị xóa vĩnh viễn.`}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {language === 'en' ? 'Cancel' : 'Hủy'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteStudentSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-70"
              >
                <span>{language === 'en' ? 'Delete Permanently' : 'Xóa vĩnh viễn'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =========================================================================
          MODAL: XEM HỒ SƠ TOÀN DIỆN & LOGCALL (STUDENT PROFILE MODAL)
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
