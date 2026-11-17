// ==============================================================================
// KAPLA Staff Dashboard — T04: Supplementary Tutoring Sessions
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  X,
  Target,
  Edit,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { SupplementarySession, SessionStatus, AttendanceStatus, ClassRoom, UserProfile, Student } from '../../types';
import { SupplementaryService, StudentService, realSupabase, MockStorageService } from '../../lib/supabase';

export const SupplementaryView: React.FC = () => {
  const { currentBranch, profile, activeRole } = useAuth();
  const { t, tDb, language } = useLanguage();

  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const isHT = activeRole === 'Head Teacher' || (activeRole as string) === 'HT';
  const isHRT = activeRole === 'HRT';
  const isTeacher = activeRole === 'Main Teacher' || activeRole === 'Supplementary Teacher';
  const canScheduleSupplementary = isSysAdmin || isCM || isHT || isHRT || isTeacher;

  const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; badge: string }> = useMemo(() => ({
    scheduled: { label: 'Upcoming', color: 'text-blue-700', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Cancelled', color: 'text-slate-500', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  }), [language]);
  const [sessions, setSessions] = useState<SupplementarySession[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<SupplementarySession | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [newSession, setNewSession] = useState({
    title: '',
    class_id: '',
    session_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    start_time: '17:30',
    end_time: '18:30',
    teacher_id: '',
    room: 'Oxford Room 201',
    topic: '',
    target_objective: '',
    notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [sData, stData] = await Promise.all([
        SupplementaryService.getSessions(branchId),
        StudentService.getStudents(branchId),
      ]);
      setSessions(sData);
      setStudents(stData);

      if (realSupabase) {
        let cq = realSupabase.from('classes').select('*').eq('status', 'active');
        if (branchId) cq = cq.eq('branch_id', branchId);
        const { data: cData } = await cq;
        if (cData) setClasses(cData);

        const { data: mData } = await realSupabase
          .from('branch_memberships')
          .select('user_id, role, profile:profiles(*)')
          .eq('status', 'active');
        if (mData) {
          const tList = mData.map((m: any) => m.profile).filter(Boolean);
          setTeachers(tList);
        }
      } else {
        setClasses(MockStorageService.getClasses());
        setTeachers(MockStorageService.getProfiles());
      }
    } catch (err: any) {
      console.error('Error loading supplementary data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('kapla-storage-change', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('kapla-storage-change', handleSync);
    };
  }, [currentBranch?.id]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSession.title.trim() || !newSession.topic.trim()) {
      setMessage({ type: 'error', text: 'Please enter session title and lesson topic.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await SupplementaryService.createSession({
        branch_id: currentBranch?.id || '',
        class_id: newSession.class_id || undefined,
        title: newSession.title.trim(),
        session_date: newSession.session_date,
        start_time: newSession.start_time,
        end_time: newSession.end_time,
        teacher_id: newSession.teacher_id || profile?.id,
        room: newSession.room,
        topic: newSession.topic.trim(),
        target_objective: newSession.target_objective.trim(),
        status: 'scheduled',
        notes: newSession.notes,
      });

      setMessage({ type: 'success', text: 'Created supplementary session successfully!' });
      setShowAddModal(false);
      setNewSession({
        title: '',
        class_id: '',
        session_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        start_time: '17:30',
        end_time: '18:30',
        teacher_id: '',
        room: 'Oxford Room 201',
        topic: '',
        target_objective: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Unable to create supplementary session.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteSession = async (session: SupplementarySession) => {
    try {
      await SupplementaryService.updateSessionStatus(session.id, 'completed', 'Completed supplementary session according to targets.');
      setMessage({ type: 'success', text: `Marked session as completed: ${session.title}` });
      loadData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Update failed.' });
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.room?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [sessions, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const scheduled = sessions.filter((s) => s.status === 'scheduled').length;
    const completed = sessions.filter((s) => s.status === 'completed').length;
    const totalAttendees = sessions.reduce((acc, curr) => acc + (curr.attendees_count || curr.attendees?.length || 0), 0);
    return { total, scheduled, completed, totalAttendees };
  }, [sessions]);

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

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpenCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Total Sessions'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-indigo-700">{stats.scheduled}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Upcoming'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-700">{stats.completed}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Completed'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-700">{stats.totalAttendees}</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {'Student Attendees'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Add Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={'Search by topic, teacher, room...'}
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
              <option value="scheduled">{'Upcoming'}</option>
              <option value="completed">{'Completed'}</option>
              <option value="cancelled">{'Cancelled'}</option>
            </select>
          </div>
        </div>

        {canScheduleSupplementary && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto px-4 py-2 bg-[#043264] hover:bg-[#032042] text-white text-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{'Schedule Tutoring Session'}</span>
          </button>
        )}
      </div>

      {/* Sessions Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-8 text-center text-slate-500 text-sm">
            {'Loading tutoring sessions...'}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200">
            <BookOpenCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <div className="text-slate-700 font-semibold">
              {'No Tutoring Sessions Scheduled'}
            </div>
            <div className="text-slate-400 text-sm mt-1">
              {'Schedule tutoring sessions to support students requiring academic intervention.'}
            </div>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.badge}`}>
                        {statusCfg.label}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{tDb(session.title)}</h4>
                      <p className="text-xs text-slate-500">
                        {session.class
                          ? `${'Class: '}${session.class.name}`
                          : ('Cross-Class / 1-on-1 Tutoring')}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-[#043264] flex items-center justify-end gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{session.session_date}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{session.start_time} - {session.end_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-100 text-xs">
                    <div>
                      <strong className="text-slate-800">{'Topic:'}</strong>{' '}
                      <span className="text-slate-700">{tDb(session.topic)}</span>
                    </div>
                    <div>
                      <strong className="text-slate-800 flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-blue-600" />
                        {'Lesson Objective:'}
                      </strong>
                      <span className="text-slate-700">{tDb(session.target_objective)}</span>
                    </div>
                  </div>

                  {session.attendees && session.attendees.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {`Participating Students (${session.attendees.length}):`}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {session.attendees.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between text-xs p-2 bg-white rounded border border-slate-200"
                          >
                            <span className="font-medium text-slate-800">
                              {a.student?.full_name || ('Student')}
                            </span>
                            <div className="flex items-center gap-2">
                              {a.assessment_score && (
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold">
                                  {a.assessment_score}/5.0 {'shields'}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium">
                                {'Present'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {'Educator: '}
                      <strong className="text-slate-700">{session.teacher_name}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {session.room ? tDb(session.room) : ('Main Classroom')}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {session.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => handleCompleteSession(session)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{'Confirm Completion'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create Supplementary Session */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="w-5 h-5 text-[#043264]" />
                <h3 className="font-semibold text-slate-900 text-base">
                  {'Schedule New Tutoring Session'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Session Title *'}
                </label>
                <input
                  type="text"
                  value={newSession.title}
                  onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                  placeholder={
                    'e.g. Starters Grammar & Sentence Writing Support'
                  }
                  required
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Cohort / Class'}
                  </label>
                  <select
                    value={newSession.class_id}
                    onChange={(e) => setNewSession({ ...newSession, class_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                  >
                    <option value="">
                      {'-- Open / 1-on-1 Tutoring --'}
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Assigned Educator'}
                  </label>
                  <select
                    value={newSession.teacher_id}
                    onChange={(e) => setNewSession({ ...newSession, teacher_id: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:border-[#043264]"
                  >
                    <option value="">{'-- Select Teacher --'}</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Date'}
                  </label>
                  <input
                    type="date"
                    value={newSession.session_date}
                    onChange={(e) => setNewSession({ ...newSession, session_date: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Start Time'}
                  </label>
                  <input
                    type="time"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({ ...newSession, start_time: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'End Time'}
                  </label>
                  <input
                    type="time"
                    value={newSession.end_time}
                    onChange={(e) => setNewSession({ ...newSession, end_time: e.target.value })}
                    required
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Classroom / Location'}
                  </label>
                  <input
                    type="text"
                    value={newSession.room}
                    onChange={(e) => setNewSession({ ...newSession, room: e.target.value })}
                    placeholder="Oxford Room 201"
                    className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Topic & Content *'}
                </label>
                <textarea
                  rows={2}
                  value={newSession.topic}
                  onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                  placeholder={
                    'e.g. Review 3rd-person singular verbs, practice writing 5 short picture-based sentences.'
                  }
                  required
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Target Learning Objective'}
                </label>
                <input
                  type="text"
                  value={newSession.target_objective}
                  onChange={(e) => setNewSession({ ...newSession, target_objective: e.target.value })}
                  placeholder={
                    'e.g. Score at least 80% on mini check-in quiz.'
                  }
                  className="w-full text-sm border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-[#043264]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
                    ? ('Scheduling...')
                    : ('Schedule Session')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
