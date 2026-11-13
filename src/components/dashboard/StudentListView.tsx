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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Student, ClassRoom, UserProfile, ClassTransfer } from '../../types';
import { StudentService, realSupabase, MockStorageService } from '../../lib/supabase';

export const StudentListView: React.FC = () => {
  const { profile, activeRole, currentBranch } = useAuth();
  const { language, t } = useLanguage();
  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const canManage = isSysAdmin || isCM;

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [hrtStaffs, setHrtStaffs] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<Student | null>(null);
  const [selectedStudentForHrt, setSelectedStudentForHrt] = useState<Student | null>(null);
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [transferHistory, setTransferHistory] = useState<ClassTransfer[]>([]);

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
      const data = await StudentService.getStudents(branchId, profile?.id, isSysAdmin, isCM);
      setStudents(data);

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
        label: `Đã hết hạn ${Math.abs(diffDays)} ngày`,
        status: 'expired' as const,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        badge: 'bg-rose-500',
      };
    }
    if (diffDays <= 14) {
      return {
        label: `Sắp hết hạn (${diffDays} ngày)`,
        status: 'warning' as const,
        color: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'bg-amber-500',
      };
    }
    return {
      label: `Còn ${diffDays} ngày`,
      status: 'active' as const,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badge: 'bg-emerald-500',
    };
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.parent_phone.includes(searchTerm);

      const matchClass = classFilter === 'all' || s.current_class_id === classFilter;

      const tStatus = getTuitionStatus(s.tuition_expiry_date).status;
      const matchStatus = statusFilter === 'all' || tStatus === statusFilter;

      return matchSearch && matchClass && matchStatus;
    });
  }, [students, searchTerm, classFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    let warning = 0;
    let expired = 0;
    let active = 0;
    students.forEach((s) => {
      const st = getTuitionStatus(s.tuition_expiry_date).status;
      if (st === 'expired') expired++;
      else if (st === 'warning') warning++;
      else active++;
    });
    return { total: students.length, active, warning, expired };
  }, [students]);

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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tổng học viên phụ trách</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <span className="text-[10px] text-slate-400">Thuộc phạm vi phân quyền</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Học phí an toàn</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.active}</div>
          <span className="text-[10px] text-emerald-600">Hạn &gt; 14 ngày</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Sắp hết hạn (&le; 14 ngày)</span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.warning}</div>
          <span className="text-[10px] text-amber-700">Cần liên hệ nhắc tái tục</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Đã quá hạn học phí</span>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.expired}</div>
          <span className="text-[10px] text-rose-700">Cần xử lý khẩn cấp</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học viên, mã học sinh, tên phụ huynh, SĐT..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">Tất cả lớp học</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">Tất cả hạn học phí</option>
            <option value="active">Còn hạn an toàn</option>
            <option value="warning">Sắp hết hạn (&le; 14 ngày)</option>
            <option value="expired">Đã hết hạn</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Đang tải danh sách học viên...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Không có học viên nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Không tìm thấy học viên trong phạm vi phân quyền hoặc theo bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Học viên</th>
                  <th className="py-3 px-4">Phụ huynh</th>
                  <th className="py-3 px-4">Lớp học</th>
                  <th className="py-3 px-4">Hạn học phí</th>
                  <th className="py-3 px-4">HRT Phụ trách</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => {
                  const tuition = getTuitionStatus(student.tuition_expiry_date);
                  const isSpecificHrt = Boolean(student.assigned_hrt_id);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Student Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#043264] font-bold text-xs flex items-center justify-center">
                            {student.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{student.full_name}</div>
                            <div className="text-[11px] text-slate-500">
                              Mã: <span className="font-mono text-slate-700">{student.student_code}</span>
                              {student.date_of_birth && ` • ${student.date_of_birth}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent Info */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{student.parent_name}</div>
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
                          <span className="text-slate-400 italic">Chưa xếp lớp</span>
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
                          {student.assigned_hrt?.full_name || student.effective_hrt_name || 'Chưa phân công'}
                        </div>
                        {isSpecificHrt ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 mt-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            HRT riêng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-0.5">
                            Mặc định theo lớp
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
                            </>
                          )}

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
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Nhập tay hồ sơ học viên mới</h3>
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
                  <label className="block font-semibold text-slate-700 mb-1">Mã học viên *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên học viên *</label>
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
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={newStudent.date_of_birth}
                    onChange={(e) => setNewStudent({ ...newStudent, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={newStudent.gender}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên phụ huynh *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.parent_name}
                    onChange={(e) => setNewStudent({ ...newStudent, parent_name: e.target.value })}
                    placeholder="VD: Nguyễn Thị Lan (Mẹ)"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại phụ huynh *</label>
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
                <label className="block font-semibold text-slate-700 mb-1">Ngày hết hạn học phí *</label>
                <input
                  type="date"
                  required
                  value={newStudent.tuition_expiry_date}
                  onChange={(e) => setNewStudent({ ...newStudent, tuition_expiry_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
                <span className="text-[10px] text-slate-500">Dùng để tự động tính cảnh báo tái tục và hạn bảo lưu.</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lớp học ghi danh</label>
                  <select
                    value={newStudent.current_class_id}
                    onChange={(e) => setNewStudent({ ...newStudent, current_class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">-- Chưa xếp lớp --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân công HRT riêng</label>
                  <select
                    value={newStudent.assigned_hrt_id}
                    onChange={(e) => setNewStudent({ ...newStudent, assigned_hrt_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">Mặc định theo lớp</option>
                    {hrtStaffs.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.full_name} (HRT)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú học vụ</label>
                <textarea
                  rows={2}
                  value={newStudent.notes}
                  onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                  placeholder="Đặc điểm học viên, kỳ vọng phụ huynh..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu hồ sơ học viên'}
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
                <h3 className="font-bold text-slate-900 text-sm">Chuyển lớp học viên</h3>
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
                  Lớp hiện tại: <span className="font-medium text-slate-800">{selectedStudentForTransfer.current_class?.name || 'Chưa xếp lớp'}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn lớp học đích *</label>
                <select
                  required
                  value={transferClassId}
                  onChange={(e) => setTransferClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {classes
                    .filter((c) => c.id !== selectedStudentForTransfer.current_class_id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level}) - HRT: {c.default_hrt_name || 'Theo lớp'}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do chuyển lớp *</label>
                <textarea
                  required
                  rows={3}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="VD: Học viên tiến bộ chuyển lên lớp Movers, đổi lịch học theo nguyện vọng phụ huynh..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForTransfer(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-[#043264] hover:bg-[#012147] font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Đang chuyển...' : 'Xác nhận chuyển lớp'}
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
                <h3 className="font-bold text-slate-900 text-sm">Phân công Giáo viên chủ nhiệm (HRT)</h3>
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
                  Lớp: {selectedStudentForHrt.current_class?.name || 'Chưa xếp lớp'} • Phụ trách hiện tại:{' '}
                  <span className="font-semibold text-slate-800">{selectedStudentForHrt.effective_hrt_name}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chỉ định HRT *</label>
                <select
                  value={newHrtId}
                  onChange={(e) => setNewHrtId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">-- Mặc định theo lớp (Hủy phân công riêng) --</option>
                  {hrtStaffs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.full_name} ({h.email})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  * Theo quy tắc ưu tiên: Nếu chọn HRT riêng, chỉ HRT này mới có quyền xem học viên và nhận danh sách công việc liên quan.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lý do phân công</label>
                <textarea
                  rows={2}
                  value={hrtReason}
                  onChange={(e) => setHrtReason(e.target.value)}
                  placeholder="VD: Cần giáo viên giàu kinh nghiệm đồng hành học viên đặc biệt..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForHrt(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-white bg-purple-700 hover:bg-purple-800 font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Xác nhận phân công'}
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
                <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                  <History className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Lịch sử chuyển lớp</h3>
                  <span className="text-[11px] text-slate-500">{selectedStudentForHistory.full_name}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForHistory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="pt-4 max-h-72 overflow-y-auto space-y-3">
              {transferHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 italic">
                  Chưa có lần chuyển lớp nào được ghi nhận cho học viên này.
                </div>
              ) : (
                transferHistory.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{t.from_class_name || 'Lớp cũ'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#043264]">{t.to_class_name || 'Lớp mới'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(t.transfer_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p className="text-slate-600 italic">"{t.reason}"</p>
                    {t.transferred_by_name && (
                      <span className="text-[10px] text-slate-400 block">Thực hiện bởi: {t.transferred_by_name}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedStudentForHistory(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
