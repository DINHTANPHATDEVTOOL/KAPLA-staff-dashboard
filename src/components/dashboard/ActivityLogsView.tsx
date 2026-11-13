// ==============================================================================
// KAPLA Staff Dashboard — Activity & Operational Audit Logs
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  ShieldCheck,
  User,
  Calendar,
  Clock,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuditLog } from '../../types';
import { MockStorageService, realSupabase } from '../../lib/supabase';

export const ActivityLogsView: React.FC = () => {
  const { currentBranch, profile } = useAuth();
  const { language } = useLanguage();
  const isSystemAdmin = profile?.system_role === 'system_admin';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        if (realSupabase) {
          let query = realSupabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100);
          if (!isSystemAdmin && currentBranch?.id) {
            query = query.eq('branch_id', currentBranch.id);
          }
          const { data } = await query;
          if (data) setLogs(data);
        } else {
          let allLogs = MockStorageService.getAuditLogs();
          if (!isSystemAdmin && currentBranch?.id) {
            allLogs = allLogs.filter(
              (l) => !l.branch_id || l.branch_id === currentBranch.id || l.branch_name?.includes(currentBranch.name)
            );
          }
          setLogs(allLogs);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentBranch?.id, isSystemAdmin]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const matchSearch =
        l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.actor_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.target_user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(l.details).toLowerCase().includes(searchTerm.toLowerCase());

      const matchAction =
        actionFilter === 'all' ||
        (actionFilter === 'role' && (l.action.includes('ROLE') || l.action.includes('MEMBERSHIP') || l.action.includes('APPROVE'))) ||
        (actionFilter === 'tuition' && (l.action.includes('TUITION') || l.action.includes('RENEWAL'))) ||
        (actionFilter === 'academic' && (l.action.includes('INTERVENTION') || l.action.includes('ASSESSMENT') || l.action.includes('CARE')));

      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('ROLE') || action.includes('MEMBERSHIP')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (action.includes('TUITION') || action.includes('RENEWAL')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('INTERVENTION') || action.includes('RISK')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-[#043264] rounded-xl border border-blue-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {language === 'en' ? 'Activity & Operational Audit Trail' : 'Nhật ký tác nghiệp & Kiểm toán hệ thống'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'en'
                  ? `Real-time activity logs, academic follow-ups, and role audit events for ${currentBranch?.name || 'KAPLA'}`
                  : `Lịch sử theo dõi quá trình tương tác, thay đổi ngày hết hạn, phiếu can thiệp và kiểm toán quyền tại ${currentBranch?.name || 'KAPLA'}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-stretch sm:self-auto justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{language === 'en' ? 'Row-Level Security Active' : 'Bảo vệ RLS đang hoạt động'}</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              language === 'en'
                ? 'Search by actor email, action code, target user or details...'
                : 'Tìm theo email người thực hiện, mã thao tác, đối tượng hoặc chi tiết...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264] w-full md:w-auto"
          >
            <option value="all">{language === 'en' ? 'All Operations' : 'Tất cả thao tác'}</option>
            <option value="role">{language === 'en' ? 'Roles & Permissions' : 'Phân quyền & Phê duyệt'}</option>
            <option value="tuition">{language === 'en' ? 'Tuition & Renewals' : 'Học phí & Tái tục'}</option>
            <option value="academic">{language === 'en' ? 'Academic Interventions' : 'Học vụ & Can thiệp'}</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5">{language === 'en' ? 'Timestamp' : 'Thời gian'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Operator' : 'Người thực hiện'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Action' : 'Hành động'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Target Account' : 'Tài khoản đối tượng'}</th>
                <th className="py-3 px-4">{language === 'en' ? 'Campus / Branch' : 'Chi nhánh'}</th>
                <th className="py-3 px-5">{language === 'en' ? 'Recorded Details' : 'Chi tiết ghi nhận'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-sm">
                    {language === 'en' ? 'Loading activity logs...' : 'Đang tải nhật ký tác nghiệp...'}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 text-sm">
                    {language === 'en' ? 'No operational logs found.' : 'Không có nhật ký nào phù hợp.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString(language === 'en' ? 'en-US' : 'vi-VN')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {log.actor_email || (language === 'en' ? 'System Process' : 'Hệ thống')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {log.target_user_email || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-[#043264] font-medium">
                      {log.branch_name || (language === 'en' ? 'All Campuses' : 'Toàn hệ thống')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px] max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
