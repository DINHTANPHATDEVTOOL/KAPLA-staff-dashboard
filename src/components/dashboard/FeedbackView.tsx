// ==============================================================================
// KAPLA Staff Dashboard — T04: Quản lý Phản hồi & Khiếu nại Phụ huynh
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ParentFeedback, FeedbackType, FeedbackChannel, FeedbackStatus, Student, UserProfile } from '../../types';
import { FeedbackService, StudentService, realSupabase, MockStorageService } from '../../lib/supabase';

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: any; color: string }> = {
  academic_concern: { label: 'Băn khoăn học vụ', icon: HelpCircle, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  complaint: { label: 'Khiếu nại / Phàn nàn', icon: AlertTriangle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  inquiry: { label: 'Hỏi thông tin', icon: MessageCircle, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  compliment: { label: 'Khen ngợi / Hài lòng', icon: ThumbsUp, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  facility: { label: 'Cơ sở vật chất', icon: Building2, color: 'text-purple-700 bg-purple-50 border-purple-200' },
};

const CHANNEL_CONFIG: Record<FeedbackChannel, { label: string; icon: any }> = {
  phone: { label: 'Điện thoại', icon: Phone },
  zalo: { label: 'Zalo', icon: MessageCircle },
  in_person: { label: 'Gặp trực tiếp', icon: User },
  app: { label: 'Ứng dụng phụ huynh', icon: Sparkles },
  email: { label: 'Email', icon: Mail },
};

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; color: string; badge: string }> = {
  open: { label: 'Mới tiếp nhận', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress: { label: 'Đang xử lý', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Đã giải quyết', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export const FeedbackView: React.FC = () => {
  const { currentBranch, profile } = useAuth();
  const [feedbacks, setFeedbacks] = useState<ParentFeedback[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffs, setStaffs] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedFeedbackForResolve, setSelectedFeedbackForResolve] = useState<ParentFeedback | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolveStatus, setResolveStatus] = useState<FeedbackStatus>('resolved');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      console.error('Lỗi tải dữ liệu phản hồi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
      setMessage({ type: 'error', text: 'Vui lòng chọn học viên và nhập nội dung phản hồi.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const selectedStudent = students.find((s) => s.id === newFeedback.student_id);
      await FeedbackService.createFeedback({
        student_id: newFeedback.student_id,
        branch_id: selectedStudent?.branch_id || currentBranch?.id || '',
        parent_name: newFeedback.parent_name || 'Phụ huynh',
        parent_phone: newFeedback.parent_phone || 'Chưa cung cấp',
        feedback_type: newFeedback.feedback_type,
        channel: newFeedback.channel,
        content: newFeedback.content.trim(),
        assigned_staff_id: newFeedback.assigned_staff_id || undefined,
        due_date: newFeedback.due_date,
        status: 'open',
      });
      setMessage({ type: 'success', text: 'Đã tiếp nhận phản hồi từ phụ huynh thành công!' });
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
      setMessage({ type: 'error', text: err.message || 'Không thể tạo phản hồi.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeedbackForResolve) return;

    setSubmitting(true);
    try {
      await FeedbackService.updateStatus(selectedFeedbackForResolve.id, resolveStatus, resolutionNotes.trim());
      setMessage({ type: 'success', text: 'Đã cập nhật tiến độ giải quyết phản hồi!' });
      setSelectedFeedbackForResolve(null);
      setResolutionNotes('');
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Cập nhật thất bại.' });
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

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <MessageSquareHeart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng phản hồi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.open}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Mới tiếp nhận</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700">{stats.inProgress}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang xử lý</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{stats.resolved}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã giải quyết</div>
          </div>
        </div>
      </div>

      {/* Filters & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo phụ huynh, học viên, SĐT, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264]"
            >
              <option value="all">Tất cả phân loại</option>
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
              <option value="all">Tất cả trạng thái</option>
              <option value="open">Mới tiếp nhận</option>
              <option value="in_progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi nhận phản hồi mới</span>
        </button>
      </div>

      {/* Feedbacks List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Đang tải danh sách phản hồi...</div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquareHeart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-700 font-semibold">Chưa có phản hồi nào phù hợp</div>
            <div className="text-slate-400 text-sm mt-1">
              Các cuộc gọi, tin nhắn Zalo hoặc phản hồi từ phụ huynh sẽ được lưu vết tại đây.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFeedbacks.map((f) => {
              const typeCfg = TYPE_CONFIG[f.feedback_type] || TYPE_CONFIG.academic_concern;
              const TypeIcon = typeCfg.icon;
              const channelCfg = CHANNEL_CONFIG[f.channel] || CHANNEL_CONFIG.phone;
              const ChannelIcon = channelCfg.icon;
              const statusCfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.open;

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
                      </div>

                      <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span>{f.parent_name}</span>
                        <span className="text-slate-400 font-normal">({f.parent_phone})</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-normal">
                          Học viên: <strong className="text-slate-800">{f.student?.full_name || 'N/A'}</strong>
                        </span>
                      </div>

                      <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {f.content}
                      </p>

                      {f.resolution_notes && (
                        <div className="text-xs text-emerald-800 bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-emerald-900">Kết quả xử lý:</strong>
                            {f.resolution_notes}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Phụ trách: <strong className="text-slate-700 font-medium">{f.assigned_staff_name}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Hạn xử lý: <strong className="text-slate-700 font-medium">{f.due_date}</strong>
                        </span>
                        <span className="text-slate-400">
                          Tiếp nhận: {new Date(f.created_at || '').toLocaleDateString('vi-VN')}
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
                        <span>Cập nhật tiến độ</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Ghi nhận phản hồi mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <MessageSquareHeart className="w-5 h-5 text-[#043264]" />
                <h3 className="font-semibold text-slate-900 text-base">Ghi nhận phản hồi phụ huynh</h3>
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
                  Chọn học viên liên quan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newFeedback.student_id}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  required
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                >
                  <option value="">-- Chọn học viên --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.student_code} - {s.full_name} ({s.current_class?.name || 'Chưa vào lớp'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    value={newFeedback.parent_name}
                    onChange={(e) => setNewFeedback({ ...newFeedback, parent_name: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phân loại phản hồi</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kênh tiếp nhận</label>
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
                  Nội dung phản hồi / Ý kiến phụ huynh <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={newFeedback.content}
                  onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                  required
                  placeholder="Ghi rõ chi tiết nguyện vọng, thắc mắc hoặc phàn nàn của phụ huynh..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nhân sự phụ trách</label>
                  <select
                    value={newFeedback.assigned_staff_id}
                    onChange={(e) => setNewFeedback({ ...newFeedback, assigned_staff_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hạn phản hồi phụ huynh</label>
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
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu phản hồi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cập nhật tiến độ giải quyết */}
      {selectedFeedbackForResolve && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-semibold text-slate-900 text-base">Cập nhật tiến độ xử lý</h3>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái mới</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value as FeedbackStatus)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                >
                  <option value="in_progress">Đang xử lý (Chờ thông tin / Lên kế hoạch)</option>
                  <option value="resolved">Đã giải quyết (Đã trao đổi xong với phụ huynh)</option>
                  <option value="open">Mở lại (Chờ tiếp nhận)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kết quả xử lý & Ghi chú liên hệ
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ghi rõ nội dung đã gọi điện trao đổi, phương án thống nhất cùng phụ huynh..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFeedbackForResolve(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
