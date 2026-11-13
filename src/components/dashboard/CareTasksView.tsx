// ==============================================================================
// KAPLA Staff Dashboard — T03: HRT Care Tasks (Áp dụng quy tắc ưu tiên HRT riêng)
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  PhoneCall,
  Calendar,
  Sparkles,
  UserCheck,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StudentTask, CareTaskStatus, CareTaskType } from '../../types';
import { StudentService } from '../../lib/supabase';

export const CareTasksView: React.FC = () => {
  const { profile, activeRole, currentBranch } = useAuth();
  const { t, language } = useLanguage();
  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';

  const TASK_TYPE_META: Record<
    CareTaskType,
    { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
  > = useMemo(() => ({
    care_call: { label: language === 'en' ? 'Care Call' : 'Cuộc gọi chăm sóc', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: PhoneCall },
    progress_report: { label: language === 'en' ? 'Progress Report' : 'Báo cáo tiến độ', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: ClipboardList },
    tuition_reminder: { label: language === 'en' ? 'Tuition Reminder' : 'Nhắc tái tục học phí', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle },
    attendance_check: { label: language === 'en' ? 'Attendance Check' : 'Kiểm tra điểm danh', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    academic_support: { label: language === 'en' ? 'Academic Support' : 'Hỗ trợ học vụ', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Calendar },
  }), [language]);

  const [tasks, setTasks] = useState<StudentTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const loadTasks = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const data = await StudentService.getCareTasks(branchId, profile?.id, isSysAdmin, isCM);
      setTasks(data);
    } catch (err) {
      console.error('Lỗi tải danh sách công việc:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [currentBranch?.id, profile?.id, isSysAdmin, isCM]);

  const handleToggleStatus = async (task: StudentTask) => {
    const nextStatus: CareTaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      await StudentService.updateTaskStatus(task.id, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
    } catch (err: any) {
      console.error('Lỗi cập nhật trạng thái task:', err);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const studentName = t.student?.full_name || '';
      const matchSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        studentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tasks, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    return { total, completed, pending };
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {language === 'en' ? 'Designated HRT Care Worklist' : 'Danh sách công việc HRT phụ trách'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? `Student care and progress tracking tasks within authorized scope (${currentBranch?.name || 'KAPLA'})`
              : `Nhiệm vụ chăm sóc và theo dõi tiến độ của các học viên thuộc phạm vi trách nhiệm (${currentBranch?.name || 'KAPLA'})`}
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-800">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{language === 'en' ? 'Designated Individual HRT Priority' : 'Áp dụng quy tắc ưu tiên HRT riêng'}</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {language === 'en' ? 'Total Tasks' : 'Tổng công việc'}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
            {language === 'en' ? 'Action Needed' : 'Cần xử lý'}
          </span>
          <div className="text-2xl font-bold text-amber-800 mt-1">{stats.pending}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            {language === 'en' ? 'Completed' : 'Đã hoàn thành'}
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.completed}</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'en' ? 'Search by task title or student name...' : 'Tìm theo tiêu đề công việc hoặc tên học sinh...'}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">{language === 'en' ? 'All Statuses' : 'Tất cả trạng thái'}</option>
            <option value="pending">{language === 'en' ? 'Pending' : 'Chưa hoàn thành'}</option>
            <option value="completed">{language === 'en' ? 'Completed' : 'Đã hoàn thành'}</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">{t('common.loading', 'Đang tải danh sách công việc...')}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {language === 'en' ? 'No Care Tasks Found' : 'Không có công việc nào'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {language === 'en'
                ? 'All student care duties within your responsibility have been completed or none pending.'
                : 'Tất cả các nhiệm vụ chăm sóc thuộc trách nhiệm của bạn đã hoàn tất hoặc không có phát sinh.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const meta = TASK_TYPE_META[task.task_type] || TASK_TYPE_META.care_call;
              const IconComp = meta.icon;
              const isDone = task.status === 'completed';

              return (
                <div
                  key={task.id}
                  className={`p-4 flex items-start sm:items-center justify-between gap-4 transition-colors ${
                    isDone ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(task)}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 mt-0.5 sm:mt-0 ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.color}`}
                        >
                          <IconComp className="w-3 h-3" />
                          {meta.label}
                        </span>

                        <span className="text-[11px] text-slate-500 font-medium">
                          {language === 'en' ? 'Student: ' : 'Học viên: '}
                          <span className="text-slate-900 font-semibold">
                            {task.student?.full_name || (language === 'en' ? 'Student' : 'Học viên')}
                          </span>
                          {task.student?.current_class && ` (${task.student.current_class.name})`}
                        </span>
                      </div>

                      <h4
                        className={`text-xs font-semibold mt-1 text-slate-800 ${
                          isDone ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {task.title}
                      </h4>

                      {task.notes && <p className="text-[11px] text-slate-500 mt-0.5">{task.notes}</p>}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {language === 'en' ? 'Due: ' : 'Hạn: '}{task.due_date}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
