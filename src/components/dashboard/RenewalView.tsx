// ==============================================================================
// KAPLA Staff Dashboard — T04 & T05: Tuition Renewals & Warning Thresholds
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
import { useLanguage } from '../../context/LanguageContext';
import { RenewalRecord, RenewalStatus, RenewalRisk, SystemConfig, Student } from '../../types';
import { RenewalService, SystemConfigService, StudentService, subscribeToTableChanges, EmailNotificationService } from '../../lib/supabase';

const getStatusConfig = (lang: 'vi' | 'en'): Record<RenewalStatus, { label: string; color: string; badge: string }> => {
  if (lang === 'en') {
    return {
      monitoring: { label: 'Monitoring', color: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
      contacted: { label: 'Contacted Parent', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
      committed: { label: 'Payment Committed', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
      renewed: { label: 'Successfully Renewed', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      churned: { label: 'Discontinued / Churned', color: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
    };
  }
  return {
    monitoring: { label: 'Monitoring', color: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
    contacted: { label: 'Contacted Parent', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    committed: { label: 'Committed by Parent', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    renewed: { label: 'Successfully Renewed', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    churned: { label: 'Dropped / Not Renewed', color: 'text-rose-700', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  };
};

const getRiskConfig = (lang: 'vi' | 'en'): Record<RenewalRisk, { label: string; badge: string }> => {
  if (lang === 'en') {
    return {
      high: { label: 'High Risk', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
      medium: { label: 'Medium Risk', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
      low: { label: 'Low Risk', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    };
  }
  return {
    high: { label: 'High Risk', badge: 'bg-rose-100 text-rose-800 border-rose-300' },
    medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
    low: { label: 'Low', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  };
};

export const RenewalView: React.FC = () => {
  const { currentBranch, profile, activeRole } = useAuth();
  const { t, tDb, language } = useLanguage();
  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const isSOO = (activeRole as string) === 'SOO';
  const isHRT = activeRole === 'HRT';
  const isEC = (activeRole as string) === 'EC' || activeRole === 'CSKH';
  const canUpdateRenewal = isSysAdmin || isCM || isSOO || isHRT || isEC;

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
  const [monthFilter, setMonthFilter] = useState<string>('all');

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
      console.error('Error loading renewal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToTableChanges('renewal_tracking', loadData);
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
        text: `Updated tuition warning threshold successfully: ${adminDaysThreshold} days (Applied across Dashboard & Email alerts)!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not update configuration.' });
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

      // Dispatch automated renewal alert emails to HRTs and Outbox
      if (results && results.length > 0) {
        for (const item of results) {
          EmailNotificationService.dispatchAutomatedEmail({
            title: `Tuition Expiry Alert: ${item.full_name} (${item.tuition_expiry_date})`,
            actionType: 'renewal',
            recipients: [
              item.effective_hrt_email || `Assigned HRT: ${item.effective_hrt_name || 'Staff'}`,
              'cm.nhi@kapla.edu.vn',
              'ec.huong@kapla.edu.vn',
            ],
            content: `Tuition expiry warning for student ${item.full_name}. Tuition ends on ${item.tuition_expiry_date}. Please contact parent ${item.parent_name || 'Parent'} (${item.parent_phone || 'N/A'}) to confirm retention.`,
          });
        }
      }

      setMessage({
        type: 'success',
        text: `Found expected recipients: ${results.length} students in warning window. Alerts dispatched to assigned HRT & Outbox!`,
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Could not test email tasks.' });
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

      // Synchronize with student record if renewal completed with new date
      if (editStatus === 'renewed' && editNewExpiry && selectedRecord.student_id) {
        try {
          await StudentService.updateStudent(selectedRecord.student_id, {
            tuition_expiry_date: editNewExpiry,
            status: 'active',
          });
        } catch {
          // ignore
        }
      }

      setMessage({ type: 'success', text: 'Updated renewal progress successfully!' });
      setSelectedRecord(null);
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Update failed.' });
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
      const matchesMonth = monthFilter === 'all' || (r.current_expiry_date && r.current_expiry_date.startsWith(monthFilter));

      return matchesSearch && matchesStatus && matchesRisk && matchesMonth;
    });
  }, [records, searchTerm, statusFilter, riskFilter, monthFilter]);

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
                {'System Policy Configuration'}
              </span>
              <span className="text-xs text-slate-300">
                • {'Unified for Dashboard & Automated Email Reminders'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-sky-300" />
              <span>
                {`Tuition Reminder Threshold: ${config.tuition_warning_days_threshold} days`}
              </span>
            </h3>
            <p className="text-xs text-sky-100 max-w-2xl">
              {`Students whose tuition expires within ${config.tuition_warning_days_threshold} days are automatically flagged on the Dashboard and routed via email alert to their designated individual HRT.`}
            </p>
          </div>

          {isSysAdmin && (
            <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/15 shrink-0 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-sky-200 font-medium">
                  {'Admin Threshold:'}
                </span>
                <select
                  value={adminDaysThreshold}
                  onChange={(e) => setAdminDaysThreshold(Number(e.target.value))}
                  className="bg-white text-slate-900 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value={7}>{'7 days (1 week)'}</option>
                  <option value={14}>{'14 days (2 weeks)'}</option>
                  <option value={21}>{'21 days (3 weeks)'}</option>
                  <option value={30}>{'30 days (1 month)'}</option>
                  <option value={45}>{'45 days (1.5 months)'}</option>
                </select>
                <button
                  type="button"
                  onClick={handleSaveThreshold}
                  disabled={savingConfig || adminDaysThreshold === config.tuition_warning_days_threshold}
                  className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  {savingConfig
                    ? ('Saving...')
                    : ('Save Threshold')}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSimulateEmailAlerts}
                disabled={simulatingEmail}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title={'Preview expected email recipients'}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {simulatingEmail
                    ? ('Checking...')
                    : ('Preview Recipients')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Email Simulation Result Display */}
        {emailSimulationResults && (
          <div className="mt-4 pt-4 border-t border-white/10 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sky-200 flex items-center gap-1.5 flex-wrap">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{`Scheduled Tuition Reminder Recipients (${emailSimulationResults.length} students)`}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/20">
                  Mailer: {EmailNotificationService.getSenderEmail()}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setEmailSimulationResults(null)}
                className="text-slate-400 hover:text-white"
              >
                {'Close'}
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {emailSimulationResults.map((item) => (
                <div key={item.student_id} className="bg-white/15 p-2 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{item.student_name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        item.days_remaining === 0
                          ? 'bg-rose-500 text-white'
                          : item.days_remaining <= 7
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-emerald-400 text-slate-900'
                      }`}
                    >
                      {item.days_remaining === 0
                        ? ('Expires today')
                        : item.days_remaining > 0
                        ? (`${item.days_remaining}d remaining`)
                        : (`Overdue by ${Math.abs(item.days_remaining)}d`)}
                    </span>
                  </div>
                  <div className="text-sky-200 text-[11px] mt-0.5">
                    {'Expiry: '}{item.tuition_expiry_date} • {'Cohort: '}
                    {item.class_name || ('Unassigned')}
                  </div>
                  <div className="text-emerald-300 font-medium text-[11px] mt-1">
                    {'Recipient: '}
                    {item.effective_hrt_email || item.effective_hrt_name || ('Designated HRT')}
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
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Total Tracked Students'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-700">{stats.urgent}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Urgent Renewal (≤ 7 days)'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.warning}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {`Within Threshold (${config.tuition_warning_days_threshold} days)`}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{stats.renewed}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Successfully Renewed'}
            </div>
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
              placeholder={
                'Search by student code, name, parent phone...'
              }
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
              <option value="all">{'All Statuses'}</option>
              <option value="monitoring">{'Monitoring'}</option>
              <option value="contacted">{'Contacted Parent'}</option>
              <option value="committed">{'Payment Committed'}</option>
              <option value="renewed">{'Renewed'}</option>
              <option value="churned">{'Discontinued'}</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264]"
            >
              <option value="all">{'All Risk Levels'}</option>
              <option value="high">{'High Risk'}</option>
              <option value="medium">{'Medium Risk'}</option>
              <option value="low">{'Low Risk'}</option>
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:border-[#043264]"
            >
              <option value="all">{'All Expiry Months'}</option>
              <option value="2026-10">{'October 2026 (10/2026)'}</option>
              <option value="2026-11">{'November 2026 (11/2026)'}</option>
              <option value="2026-12">{'December 2026 (12/2026)'}</option>
              <option value="2027-01">{'January 2027 (01/2027)'}</option>
              <option value="2027-02">{'February 2027 (02/2027)'}</option>
              <option value="2027-03">{'March 2027 (03/2027)'}</option>
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
                <th className="px-4 py-3">{'Student & Cohort'}</th>
                <th className="px-4 py-3">{'Tuition Expiry'}</th>
                <th className="px-4 py-3">{'Days Remaining'}</th>
                <th className="px-4 py-3">{'Risk Level'}</th>
                <th className="px-4 py-3">{'Designated HRT'}</th>
                <th className="px-4 py-3">{'Outreach Progress'}</th>
                <th className="px-4 py-3">{'Notes & Target Package'}</th>
                <th className="px-4 py-3 text-right">{'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-sm">
                    {'Loading renewal records...'}
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 text-sm">
                    {'No students found due for tuition renewal.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const statusCfg = getStatusConfig(language)[r.status] || getStatusConfig(language).monitoring;
                  const riskCfg = getRiskConfig(language)[r.risk_level] || getRiskConfig(language).medium;
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
                        <div className="flex items-center gap-1.5 flex-wrap">
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
                              ? ('Expires today')
                              : r.days_remaining > 0
                              ? (`${r.days_remaining}d remaining`)
                              : (`Overdue by ${Math.abs(r.days_remaining)}d`)}
                          </span>

                          {r.days_remaining === 1 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                              {'⏰ Due Tomorrow (1-Day Reminder)'}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${riskCfg.badge}`}>
                          {riskCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-slate-800">{r.assigned_hrt_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {'Individual HRT Priority'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
                          {statusCfg.label}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {`Contacted: ${r.contact_count} times`}
                          {r.last_contact_date &&
                            (` (last: ${r.last_contact_date})`)}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs max-w-[200px] truncate">
                        <div className="text-slate-800 font-medium truncate">
                          {r.tuition_package ? tDb(r.tuition_package) : ('No package selected')}
                        </div>
                        <div className="text-slate-500 truncate">
                          {r.notes ? tDb(r.notes) : ('No notes')}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        {canUpdateRenewal && (
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
                            {'Update'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Update Renewal Progress */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#043264]" />
                <h3 className="font-semibold text-slate-900 text-base">
                  {'Update Renewal & Retention Progress'}
                </h3>
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
                <div>
                  <strong>{'Student: '}</strong>
                  {selectedRecord.student?.full_name} ({selectedRecord.student?.student_code})
                </div>
                <div>
                  <strong>{'Current Expiry: '}</strong>
                  {selectedRecord.current_expiry_date} (
                  {`${selectedRecord.days_remaining}d remaining`}
                  )
                </div>
                <div>
                  <strong>{'Designated HRT: '}</strong>
                  {selectedRecord.assigned_hrt_name}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Renewal Status'}
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as RenewalStatus)}
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                >
                  <option value="monitoring">
                    {'Monitoring (Not yet contacted)'}
                  </option>
                  <option value="contacted">
                    {'Contacted Parent (Discussing learning path)'}
                  </option>
                  <option value="committed">
                    {'Payment Committed (Scheduled payment)'}
                  </option>
                  <option value="renewed">
                    {'Successfully Renewed'}
                  </option>
                  <option value="churned">
                    {'Discontinued / Not Renewing'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Target Tuition Package'}
                </label>
                <input
                  type="text"
                  value={editPackage}
                  onChange={(e) => setEditPackage(e.target.value)}
                  placeholder={
                    'e.g. Cambridge Starters Pro Package (6 months)'
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              {editStatus === 'renewed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'New Tuition Expiry Date *'}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Parent Communication Notes'}
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder={
                    'Details on parent feedback, promotion agreements, or scheduled payment date...'
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {submitting
                    ? ('Saving...')
                    : ('Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
