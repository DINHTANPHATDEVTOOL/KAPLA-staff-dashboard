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
  Edit,
  X,
  Save,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AuditLog } from '../../types';
import { MockStorageService, realSupabase, subscribeToTableChanges } from '../../lib/supabase';

export const ActivityLogsView: React.FC = () => {
  const { currentBranch, profile } = useAuth();
  const { language, tDb } = useLanguage();
  const isSystemAdmin = profile?.system_role === 'system_admin';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Edit Activity Log Note Modal (Customer: All activity can be edited, but NO deletion)
  const [editingLog, setEditingLog] = useState<AuditLog | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    return subscribeToTableChanges('audit_logs', fetchLogs);
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

  const handleOpenEdit = (log: AuditLog) => {
    setEditingLog(log);
    const existingNote = (log.details as any)?.notes || (log.details as any)?.comment || '';
    setEditNoteText(existingNote);
  };

  const handleSaveEditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    setSavingNote(true);
    setNotice(null);
    try {
      const updatedDetails = {
        ...editingLog.details,
        notes: editNoteText.trim(),
        last_edited_by: profile?.email || 'Authorized Staff',
        last_edited_at: new Date().toISOString(),
      };

      if (realSupabase) {
        const { error } = await realSupabase
          .from('audit_logs')
          .update({ details: updatedDetails })
          .eq('id', editingLog.id);
        if (error) throw error;
      }

      setLogs((prev) =>
        prev.map((l) => (l.id === editingLog.id ? { ...l, details: updatedDetails } : l))
      );
      setNotice({ type: 'success', text: 'Activity log notes updated successfully.' });
      setEditingLog(null);
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Failed to update activity log note.' });
    } finally {
      setSavingNote(false);
    }
  };

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
                'Activity & Operational Audit Trail'
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {`Real-time activity logs, academic follow-ups, and role audit events for ${currentBranch?.name || 'KAPLA'}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit Protection: Deletion Prohibited</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 self-stretch sm:self-auto justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{'Row-Level Security Active'}</span>
          </div>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notice.text}</span>
          </div>
          <button type="button" onClick={() => setNotice(null)} className="p-1 hover:bg-black/5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              'Search by actor email, action code, target user or details...'
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
            <option value="all">{'All Operations'}</option>
            <option value="role">{'Roles & Permissions'}</option>
            <option value="tuition">{'Tuition & Renewals'}</option>
            <option value="academic">{'Academic Interventions'}</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-5">'Timestamp'</th>
                <th className="py-3 px-4">{'Operator'}</th>
                <th className="py-3 px-4">{'Action'}</th>
                <th className="py-3 px-4">{'Target Account'}</th>
                <th className="py-3 px-4">{'Campus / Branch'}</th>
                <th className="py-3 px-5">{'Recorded Details'}</th>
                <th className="py-3 px-4 text-right">{'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-sm">
                    {'Loading activity logs...'}
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500 text-sm">
                    {'No operational logs found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {log.actor_email || ('System Process')}
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
                      {log.branch_name ? tDb(log.branch_name) : ('All Campuses')}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 font-mono text-[11px] max-w-md truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-blue-50 hover:text-[#043264] rounded-lg transition-colors border border-slate-200"
                        title={'Edit Activity Notes (Deletion Prohibited)'}
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{'Edit Note'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Activity Note Modal */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#043264] to-[#026fd7] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {'Edit Activity Details / Notes'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLog(null)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditNote} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>{'Audit Protection Policy:'}</strong>{' '}
                  {'Activity notes and follow-up annotations may be edited for accuracy. Deletion of activity entries is strictly prohibited by center compliance.'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Action / Event Code'}
                </label>
                <input
                  type="text"
                  disabled
                  value={editingLog.action}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Operational Notes & Follow-up Details'}
                </label>
                <textarea
                  rows={4}
                  value={editNoteText}
                  onChange={(e) => setEditNoteText(e.target.value)}
                  placeholder={'Enter updated activity notes or verification annotations...'}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingNote}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#043264] hover:bg-[#032042] rounded-xl shadow-xs disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingNote ? ('Saving...') : ('Save Notes')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
