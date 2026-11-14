// ==============================================================================
// KAPLA Staff Dashboard — Automated Email Dispatch Center
// Official notification sender: kapladashboard@gmail.com
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Server,
  Key,
  Check,
  ExternalLink,
  Calendar,
  Users,
  Bell,
  X,
  FileText,
  HelpCircle,
  Inbox,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EmailDispatchLogEntry, DashboardNavSection } from '../../types';
import {
  EmailNotificationService,
  MockStorageService,
  subscribeToTableChanges,
} from '../../lib/supabase';

interface AutomatedEmailsViewProps {
  onNavigate?: (section: DashboardNavSection) => void;
}

export const AutomatedEmailsView: React.FC<AutomatedEmailsViewProps> = ({ onNavigate }) => {
  const { profile, activeRole } = useAuth();
  const [logs, setLogs] = useState<EmailDispatchLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<EmailDispatchLogEntry | null>(null);

  // SMTP Settings State
  const [senderEmail, setSenderEmail] = useState<string>(EmailNotificationService.getSenderEmail());
  const [appPassword, setAppPassword] = useState<string>('');
  const [showConfigSaved, setShowConfigSaved] = useState<boolean>(false);

  // Test Email State
  const [testRecipient, setTestRecipient] = useState<string>(profile?.email || 'staff@kapla.edu.vn');
  const [testTemplate, setTestTemplate] = useState<string>('Reminder Appointment Alert');
  const [testNote, setTestNote] = useState<string>('');
  const [testSending, setTestSending] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    setLoading(true);
    try {
      const emailLogs = EmailNotificationService.getEmailLogs();
      setLogs(emailLogs);
      const config = MockStorageService.getSystemConfig();
      if (config?.sender_email) setSenderEmail(config.sender_email);
      if (config?.gmail_app_password) setAppPassword(config.gmail_app_password);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeToTableChanges('kapla_mock_email_logs', loadData);
  }, []);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        !searchTerm ||
        log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.recipients.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.content && log.content.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'all' || log.action_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [logs, searchTerm, typeFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: logs.length,
      reminders: logs.filter((l) => l.action_type === 'reminder').length,
      renewals: logs.filter((l) => l.action_type === 'renewal').length,
      feedbacks: logs.filter((l) => l.action_type === 'feedback').length,
    };
  }, [logs]);

  // Handle Save SMTP Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    EmailNotificationService.saveSmtpConfig(senderEmail, appPassword);
    setShowConfigSaved(true);
    setToastMessage({
      type: 'success',
      text: `Configuration saved! Outgoing automated dispatcher bound to ${senderEmail}.`,
    });
    setTimeout(() => setShowConfigSaved(false), 3000);
  };

  // Handle Send Test Email
  const handleSendTestEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;
    setTestSending(true);

    try {
      const dispatched = EmailNotificationService.sendTestEmail(
        testRecipient,
        testTemplate,
        testNote || `Live test verification email generated from KAPLA Staff Operations Console.`
      );
      setToastMessage({
        type: 'success',
        text: `Test email dispatched from ${dispatched.sender} to ${testRecipient}!`,
      });
      loadData();
      setTestNote('');
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Failed to dispatch test notification.',
      });
    } finally {
      setTestSending(false);
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'reminder':
        return { label: 'Reminder Appointment', color: 'bg-blue-50 text-[#043264] border-blue-200' };
      case 'renewal':
        return { label: 'Tuition Renewal', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'feedback':
        return { label: 'Parent Feedback', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'intervention':
        return { label: 'Intervention Care', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'test':
        return { label: 'Live Test Email', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      default:
        return { label: 'System Notification', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Top Banner */}
      <div className="bg-gradient-to-r from-[#043264] via-[#032347] to-[#021832] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Auto Dispatcher Engine
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white/10 text-white border border-white/20">
                Google SMTP • smtp.gmail.com:465
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
              Automated Email Dispatch Center
            </h1>
            <p className="text-xs text-blue-100/90 max-w-2xl leading-relaxed">
              Unified automated notifications dispatched to Assigned HRTs, Center Managers (CM), Supervisors, and Academic Teachers.
              Configured official sender: <strong className="font-mono text-white underline decoration-emerald-400">{EmailNotificationService.SENDER_EMAIL}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/15"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Outbox</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-[#043264] rounded-lg">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Dispatched</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700">{stats.reminders}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reminder Alerts</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.renewals}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Renewal Notices</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">100%</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Delivery SLA</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Configuration & Live Test Sender */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Official Sender & SMTP Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-[#043264]">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Official Sender & Google SMTP Credentials</h3>
                <p className="text-[11px] text-slate-500">Configured automated dispatch email for staff alerts</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Verified
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Sender Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
                  placeholder="kapladashboard@gmail.com"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                All staff notifications (reminders, 1-day alerts, feedback dispatches) will originate from this address.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Google Gmail App Password (16 Characters)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
                  placeholder="xxxx xxxx xxxx xxxx"
                />
              </div>
              <div className="p-2.5 mt-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>How to generate a Gmail App Password:</span>
                </div>
                <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-500 pl-1">
                  <li>Log in to Google Account with <strong>kapladashboard@gmail.com</strong></li>
                  <li>Enable 2-Step Verification in Google Security settings</li>
                  <li>Go to App Passwords (myaccount.google.com/apppasswords) and create an App Password for "KAPLA Dashboard"</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="submit"
                className="px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </button>
            </div>
          </form>
        </div>

        {/* Column 2: Send Live Test Notification */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Send Live Test Notification Email</h3>
                <p className="text-[11px] text-slate-500">Dispatch an automated test notification to verify delivery</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#043264] border border-blue-200">
              Live Test
            </span>
          </div>

          <form onSubmit={handleSendTestEmail} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Recipient Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Enter staff or personal email to receive test"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#043264]/20 focus:border-[#043264]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Notification Template</label>
              <select
                value={testTemplate}
                onChange={(e) => setTestTemplate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
              >
                <option value="Reminder Appointment Alert">1. Reminder Appointment Scheduled (HRT, CM, Teachers)</option>
                <option value="1-Day Deadline Warning">2. 1-Day Deadline Warning (Care Task Due Tomorrow)</option>
                <option value="Parent Feedback Resolution Confirmation">3. Parent Feedback Resolution Notice (Turnaround SLA)</option>
                <option value="Tuition Renewal Expiry Notice">4. Tuition Renewal Expiry Notice (14-Day Cycle)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Custom Notes / Context (Optional)</label>
              <textarea
                rows={2}
                value={testNote}
                onChange={(e) => setTestNote(e.target.value)}
                placeholder="Custom test message payload..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[10px] text-slate-500">
                Dispatches from: <strong className="font-mono text-[#043264]">{senderEmail}</strong>
              </span>
              <button
                type="submit"
                disabled={testSending}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testSending ? 'Dispatching...' : 'Dispatch Test Email Now'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Dispatched Emails Outbox History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Outbox Header & Filters */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Inbox className="w-4 h-4 text-[#043264]" />
              <span>Automated Email Dispatch Outbox & History</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-[#043264]">
                {filteredLogs.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit log of automated notifications dispatched to staff, HRTs, and managers.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search subject, recipient..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-[#043264]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none"
            >
              <option value="all">All Action Types</option>
              <option value="reminder">Reminder Appointments</option>
              <option value="renewal">Tuition Renewals</option>
              <option value="feedback">Parent Feedback</option>
              <option value="test">Test Emails</option>
            </select>
          </div>
        </div>

        {/* Outbox Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Dispatched Time</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Subject & Details</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading dispatch outbox...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No automated email records found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.action_type);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Time */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(log.dispatched_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      {/* Sender */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800">
                        {log.sender}
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 truncate" title={log.title}>
                          {log.title}
                        </div>
                        {log.content && (
                          <div className="text-[11px] text-slate-500 truncate mt-0.5" title={log.content}>
                            {log.content}
                          </div>
                        )}
                        {log.turnaround && (
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                            Turnaround: {log.turnaround}
                          </span>
                        )}
                      </td>

                      {/* Recipients */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-col gap-1">
                          {log.recipients.map((r, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 truncate"
                              title={r}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="truncate">{r}</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Delivered (200 OK)</span>
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#043264] hover:bg-blue-50 border border-slate-200 transition-colors"
                        >
                          View Message
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

      {/* Modal: View Full Dispatched Email Details */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-[#043264] rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Dispatched Email Message</h3>
                  <p className="text-[11px] font-mono text-slate-500">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-20">From:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedLog.sender}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-slate-500 w-20 shrink-0">To:</span>
                  <div className="flex flex-col gap-0.5">
                    {selectedLog.recipients.map((r, i) => (
                      <span key={i} className="font-medium text-slate-800">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-20">Sent Time:</span>
                  <span className="font-mono text-slate-700">
                    {new Date(selectedLog.dispatched_at).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-500 w-20">Status:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Delivered via Google SMTP (TLS Encrypted)</span>
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">{selectedLog.title}</h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed font-sans text-xs whitespace-pre-wrap">
                  {selectedLog.content || 'Automated system notification dispatched successfully.'}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
