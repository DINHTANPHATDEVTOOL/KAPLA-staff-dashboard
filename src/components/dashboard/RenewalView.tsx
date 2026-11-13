// ==============================================================================
// KAPLA Staff Dashboard — T04 & T05: Quản lý Tái tục & Cấu hình Cảnh báo Học phí
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarClock,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  User,
  Settings,
  Sparkles,
  X,
  Send,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  Calendar,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RenewalRecord, RenewalStatus, RenewalRisk, SystemConfig, Student } from '../../types';
import { RenewalService, SystemConfigService, StudentService } from '../../lib/supabase';

const STATUS_CONFIG: Record<RenewalStatus, { label: string; color: string; badge: string }> = {
  monitoring: { label: 'Đang theo dõi', color: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  contacted: { label: 'Đã liên hệ PH', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  committed: { label: 'Phụ huynh đã chốt', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  renewed: { label: 'Đã tái tục thành công', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  churned: { label: 'Dừng học / Không tái tục', color: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const RISK_CONFIG: Record<RenewalRisk, { label: string; badge: string }> = {
  high: { label: 'Rủi ro cao', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
  medium: { label: 'Trung bình', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  low: { label: 'Thấp', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
};

export const RenewalView: React.FC = () => {
  const { currentBranch, profile } = useAuth();
  const isSysAdmin = profile?.system_role === 'system_admin';

  const [records, setRecords] = useState<RenewalRecord[]>([]);
  const [config, setConfig] = useState<SystemConfig>({
    tuition_warning_days_threshold: 14,
    auto_email_alerts_enabled: true,
    cambridge_scale_max: 5.0,
    academic_risk_threshold: 3.0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Admin Config State
  const [adminDaysThreshold, setAdminDaysThreshold] = useState<number>(14);
  const [savingConfig, setSavingConfig] = useState<boolean>(false);

  // Email Alert Simulation Preview State
  const [simulatingEmail, setSimulatingEmail] = useState<boolean>(false);
  const [emailSimulationResults, setEmailSimulationResults] = useState<any[] | null>(null);

  // Modal Update Renewal
  const [selectedRecord, setSelectedRecord] = useState<RenewalRecord | null>(null);
  const [editStatus, setEditStatus] = useState<RenewalStatus>('contacted');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPackage, setEditPackage] = useState<string>('');
  const [editNewExpiry, setEditNewExpiry] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [rData, cfg] = await Promise.all([
        RenewalService.getRecords(branchId),
        SystemConfigService.getConfig(),
      ]);
      setRecords(rData);
      setConfig(cfg);
      setAdminDaysThreshold(cfg.tuition_warning_days_threshold);
    } catch (err: any) {
      console.error('Lỗi tải dữ liệu tái tục:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id]);

  // Handle Admin Update Threshold
  const handleSaveThreshold = async () => {
    if (!isSysAdmin) return;
    setSavingConfig(true);
    try {
      const updated = await SystemConfigService.updateThreshold(adminDaysThreshold, profile?.id);
      setConfig(updated);
      setMessage({
        type: 'success',
        text: `Đã cập nhật ngưỡng cảnh báo học phí thành công: ${adminDaysThreshold} ngày (Áp dụng đồng bộ cho Dashboard & Tác vụ Email)!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể cập nhật cấu hình.' });
    } finally {
      setSavingConfig(false);
    }
  };

  // Simulate T05 Automated HRT Email Alerts Dispatch
  const handleSimulateEmailAlerts = async () => {
    setSimulatingEmail(true);
    try {
      const results = await SystemConfigService.getStudentsDueForTuitionAlert(config.tuition_warning_days_threshold, false);
      setEmailSimulationResults(results);
      setMessage({
        type: 'success',
        text: `Đã tìm thấy người nhận dự kiến: Tìm thấy ${results.length} học viên trong cửa sổ nhắc trước hạn (từ hôm nay đến ${config.tuition_warning_days_threshold} ngày tới). Toàn bộ thông báo sẽ được chuyển đến đúng HRT phụ trách!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể kiểm tra tác vụ email.' });
    } finally {
      setSimulatingEmail(false);
    }
  };

  const handleUpdateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    setSubmitting(true);
    try {
      const updates: Partial<RenewalRecord> = {
        status: editStatus,
        notes: editNotes.trim(),
        contact_count: selectedRecord.contact_count + 1,
        last_contact_date: new Date().toISOString().split('T')[0],
      };
      if (editPackage) updates.tuition_package = editPackage.trim();
      if (editNewExpiry) updates.new_expiry_date = editNewExpiry;

      await RenewalService.updateRecord(selectedRecord.id, updates);
      setMessage({ type: 'success', text: 'Cập nhật tiến trình tái tục thành công!' });
      setSelectedRecord(null);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Cập nhật thất bại.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch =
        r.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student?.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.student?.parent_phone?.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      const matchesRisk = riskFilter === 'all' || r.risk_level === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [records, searchTerm, statusFilter, riskFilter]);

  const stats = useMemo(() => {
    const total = records.length;
    const urgent = records.filter((r) => r.days_remaining <= 7 && r.status !== 'renewed').length;
    const warning = records.filter(
      (r) => r.days_remaining <= config.tuition_warning_days_threshold && r.status !== 'renewed'
    ).length;
    const renewed = records.filter((r) => r.status === 'renewed').length;
    return { total, urgent, warning, renewed };
  }, [records, config.tuition_warning_days_threshold]);

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
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

      {/* T05 Configurable Tuition Warning Threshold Panel */}
      <div className="bg-gradient-to-r from-[#012147] to-[#043264] p-5 rounded-2xl text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-400/20 text-sky-200 border border-sky-300/30">
                Giai đoạn T05: Cấu hình Hệ thống
              </span>
              <span className="text-xs text-slate-300">• Dùng chung cho Dashboard & Tác vụ Email</span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-300" />
              <span>Ngưỡng cảnh báo học phí: {config.tuition_warning_days_threshold} ngày</span>
            </h3>
            <p className="text-xs text-sky-100 max-w-2xl">
              Học viên có ngày hết hạn học phí trong vòng <strong>{config.tuition_warning_days_threshold} ngày</strong> sẽ tự động được gắn cờ cảnh báo trên Dashboard và định tuyến thông báo email đến đúng HRT phụ trách.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/15 shrink-0 flex-wrap">
            {isSysAdmin ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-sky-200 font-medium">Admin cài đặt:</span>
                <select
                  value={adminDaysThreshold}
                  onChange={(e) => setAdminDaysThreshold(Number(e.target.value))}
                  className="bg-white text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value={7}>7 ngày (1 tuần)</option>
                  <option value={14}>14 ngày (2 tuần)</option>
                  <option value={21}>21 ngày (3 tuần)</option>
                  <option value={30}>30 ngày (1 tháng)</option>
                  <option value={45}>45 ngày (1.5 tháng)</option>
                </select>
                <button
                  type="button"
                  onClick={handleSaveThreshold}
                  disabled={savingConfig || adminDaysThreshold === config.tuition_warning_days_threshold}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {savingConfig ? 'Đang lưu...' : 'Lưu ngưỡng'}
                </button>
              </div>
            ) : (
              <div className="text-xs text-sky-200 italic">
                (Chỉ Quản trị hệ thống có quyền điều chỉnh ngưỡng ngày)
              </div>
            )}

            <button
              type="button"
              onClick={handleSimulateEmailAlerts}
              disabled={simulatingEmail}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Xem trước danh sách người nhận dự kiến"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{simulatingEmail ? 'Đang kiểm tra...' : 'Xem trước người nhận dự kiến'}</span>
            </button>
          </div>
        </div>

        {/* Email Simulation Result Display */}
        {emailSimulationResults && (
          <div className="mt-4 pt-4 border-t border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sky-200 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Danh sách người nhận thông báo Email định kỳ tại thời điểm hiện tại ({emailSimulationResults.length} học viên):
              </span>
              <button
                type="button"
                onClick={() => setEmailSimulationResults(null)}
                className="text-slate-400 hover:text-white"
              >
                Đóng
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {emailSimulationResults.map((item) => (
                <div key={item.student_id} className="bg-white/15 p-2 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{item.student_name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      item.days_remaining === 0
                        ? 'bg-rose-500 text-white'
                        : item.days_remaining <= 7
                        ? 'bg-amber-400 text-slate-900'
                        : 'bg-emerald-400 text-slate-900'
                    }`}>
                      {item.days_remaining === 0 ? 'Hết hạn hôm nay' : item.days_remaining > 0 ? `Còn ${item.days_remaining} ngày` : `Đã quá hạn`}
                    </span>
                  </div>
                  <div className="text-sky-200 text-[11px] mt-0.5">Hạn phí: {item.tuition_expiry_date} • Lớp: {item.class_name || 'Chưa xếp'}</div>
                  <div className="text-emerald-300 font-medium text-[11px] mt-1">
                    Email gửi đến: {item.effective_hrt_email || item.effective_hrt_name || 'HRT phụ trách'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tổng học viên theo dõi</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-700">{stats.urgent}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cần tái tục gấp (≤ 7 ngày)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.warning}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trong ngưỡng ({config.tuition_warning_days_threshold} ngày)</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{stats.renewed}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã tái tục thành công</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã học viên, tên, SĐT phụ huynh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="monitoring">Đang theo dõi</option>
              <option value="contacted">Đã liên hệ PH</option>
              <option value="committed">Phụ huynh đã chốt</option>
              <option value="renewed">Đã tái tục</option>
              <option value="churned">Không tái tục</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264]"
            >
              <option value="all">Tất cả mức rủi ro</option>
              <option value="high">Rủi ro cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Renewal Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Học viên & Lớp</th>
                <th className="px-4 py-3">Ngày hết hạn</th>
                <th className="px-4 py-3">Số ngày còn lại</th>
                <th className="px-4 py-3">Mức rủi ro</th>
                <th className="px-4 py-3">HRT phụ trách</th>
                <th className="px-4 py-3">Tiến trình liên hệ</th>
                <th className="px-4 py-3">Ghi chú & Gói dự kiến</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-sm">
                    Đang tải dữ liệu tái tục...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 text-sm">
                    Không tìm thấy học viên nào trong danh sách tái tục.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.monitoring;
                  const riskCfg = RISK_CONFIG[r.risk_level] || RISK_CONFIG.medium;
                  const isUrgent = r.days_remaining <= 7 && r.status !== 'renewed';
                  const isWarning =
                    r.days_remaining <= config.tuition_warning_days_threshold && r.status !== 'renewed';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{r.student?.full_name}</div>
                        <div className="text-xs text-slate-400">
                          {r.student?.student_code} • {r.student?.parent_phone}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs font-medium text-slate-800">
                        {r.current_expiry_date}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-xs ${
                            r.days_remaining === 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : r.days_remaining < 0
                              ? 'bg-slate-100 text-slate-700 border border-slate-300'
                              : isUrgent
                              ? 'bg-rose-100 text-rose-800'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {r.days_remaining === 0
                            ? 'Hết hạn hôm nay'
                            : r.days_remaining > 0
                            ? `Còn ${r.days_remaining} ngày`
                            : `Đã quá hạn ${Math.abs(r.days_remaining)} ngày`}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${riskCfg.badge}`}>
                          {riskCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-800">{r.assigned_hrt_name}</div>
                        <div className="text-[11px] text-slate-400">Ưu tiên HRT riêng</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Đã liên hệ: {r.contact_count} lần
                          {r.last_contact_date && ` (lần cuối: ${r.last_contact_date})`}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs max-w-[200px] truncate">
                        <div className="text-slate-800 font-medium truncate">{r.tuition_package || 'Chưa chọn gói'}</div>
                        <div className="text-slate-500 truncate">{r.notes || 'Chưa có ghi chú'}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(r);
                            setEditStatus(r.status);
                            setEditNotes(r.notes || '');
                            setEditPackage(r.tuition_package || '');
                            setEditNewExpiry(r.new_expiry_date || '');
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        >
                          Cập nhật
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Cập nhật tiến trình tái tục */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#043264]" />
                <h3 className="font-semibold text-slate-900 text-base">Cập nhật tiến trình tái tục</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateRecord} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                <div><strong>Học viên:</strong> {selectedRecord.student?.full_name} ({selectedRecord.student?.student_code})</div>
                <div><strong>Hạn hiện tại:</strong> {selectedRecord.current_expiry_date} (Còn {selectedRecord.days_remaining} ngày)</div>
                <div><strong>HRT chịu trách nhiệm:</strong> {selectedRecord.assigned_hrt_name}</div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái tái tục</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as RenewalStatus)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                >
                  <option value="monitoring">Đang theo dõi (Chưa liên hệ)</option>
                  <option value="contacted">Đã liên hệ PH (Đang trao đổi lộ trình)</option>
                  <option value="committed">Phụ huynh đã chốt (Hẹn thanh toán)</option>
                  <option value="renewed">Đã tái tục thành công</option>
                  <option value="churned">Dừng học / Không tái tục</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gói học phí dự kiến</label>
                <input
                  type="text"
                  value={editPackage}
                  onChange={(e) => setEditPackage(e.target.value)}
                  placeholder="Ví dụ: Gói Cambridge Starters Pro (6 tháng)"
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              {editStatus === 'renewed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ngày hết hạn học phí mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={editNewExpiry}
                    onChange={(e) => setEditNewExpiry(e.target.value)}
                    required={editStatus === 'renewed'}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú trao đổi cùng phụ huynh</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ghi rõ ý kiến phụ huynh, thỏa thuận giảm giá hoặc ngày hẹn đóng phí..."
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
