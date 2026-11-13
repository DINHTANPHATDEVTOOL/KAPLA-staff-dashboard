// ==============================================================================
// KAPLA Staff Dashboard — T04: 4-Skill Cambridge Assessments
// ==============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Shield,
  Sparkles,
  ChevronRight,
  User,
  GraduationCap,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StudentAssessment, Student, ClassRoom } from '../../types';
import { AssessmentService, StudentService, realSupabase, MockStorageService } from '../../lib/supabase';

interface AssessmentsViewProps {
  onNavigateToIntervention?: (studentId: string, assessmentId: string, issue: string) => void;
}

export const AssessmentsView: React.FC<AssessmentsViewProps> = ({ onNavigateToIntervention }) => {
  const { currentBranch, profile } = useAuth();
  const { t, language } = useLanguage();
  const [assessments, setAssessments] = useState<StudentAssessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Modal create assessment
  const [showModal, setShowModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [form, setForm] = useState({
    student_id: '',
    class_id: '',
    period: 'Kỳ 1 - Giữa kỳ',
    assessment_date: new Date().toISOString().split('T')[0],
    listening_score: 4.0,
    speaking_score: 4.0,
    reading_score: 3.5,
    writing_score: 3.5,
    strengths: '',
    weaknesses: '',
    progress_notes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [assessList, stuList] = await Promise.all([
        AssessmentService.getAssessments(branchId),
        StudentService.getStudents(branchId, profile?.id, true, true),
      ]);
      setAssessments(assessList);
      setStudents(stuList);

      if (realSupabase) {
        let cq = realSupabase.from('classes').select('*').eq('status', 'active');
        if (branchId) cq = cq.eq('branch_id', branchId);
        const { data: cData } = await cq;
        if (cData) setClasses(cData);
      } else {
        const cls = MockStorageService.getClasses();
        setClasses(branchId ? cls.filter((c) => c.branch_id === branchId) : cls);
      }
    } catch (err) {
      console.error('Lỗi tải đánh giá năng lực:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBranch?.id]);

  const handleStudentSelect = (studentId: string) => {
    const stu = students.find((s) => s.id === studentId);
    setForm({
      ...form,
      student_id: studentId,
      class_id: stu?.current_class_id || '',
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !form.student_id) return;
    setSubmitting(true);
    try {
      await AssessmentService.createAssessment({
        student_id: form.student_id,
        class_id: form.class_id || undefined,
        branch_id: currentBranch.id,
        period: form.period,
        assessment_date: form.assessment_date,
        listening_score: Number(form.listening_score),
        speaking_score: Number(form.speaking_score),
        reading_score: Number(form.reading_score),
        writing_score: Number(form.writing_score),
        strengths: form.strengths.trim() || undefined,
        weaknesses: form.weaknesses.trim() || undefined,
        progress_notes: form.progress_notes.trim() || undefined,
        assessed_by: profile?.id,
      });
      setShowModal(false);
      setForm({
        student_id: '',
        class_id: '',
        period: 'Kỳ 1 - Giữa kỳ',
        assessment_date: new Date().toISOString().split('T')[0],
        listening_score: 4.0,
        speaking_score: 4.0,
        reading_score: 3.5,
        writing_score: 3.5,
        strengths: '',
        weaknesses: '',
        progress_notes: '',
      });
      await loadData();
    } catch (err: any) {
      console.error('Lỗi tạo bài đánh giá:', err);
      alert(err.message || 'Lỗi khi lưu bài đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      const stuName = a.student?.full_name || '';
      const matchSearch =
        stuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.period.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = classFilter === 'all' || a.class_id === classFilter;
      const matchRisk =
        riskFilter === 'all' ||
        (riskFilter === 'risk' && a.has_academic_risk) ||
        (riskFilter === 'safe' && !a.has_academic_risk);
      return matchSearch && matchClass && matchRisk;
    });
  }, [assessments, searchTerm, classFilter, riskFilter]);

  const stats = useMemo(() => {
    const total = assessments.length;
    const riskCount = assessments.filter((a) => a.has_academic_risk).length;
    const safeCount = total - riskCount;
    return { total, riskCount, safeCount };
  }, [assessments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-[#043264]">
              <ClipboardCheck className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {t('assessments.title', 'Đánh giá năng lực 4 kỹ năng')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'en'
              ? `Track Listening, Speaking, Reading, Writing via Cambridge & Oxford standards at ${currentBranch?.name || 'KAPLA'}`
              : `Ghi nhận Nghe - Nói - Đọc - Viết theo thang chuẩn Cambridge & Oxford Quality tại ${currentBranch?.name || 'KAPLA'}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          {t('assessments.addBtn', 'Nhập phiếu đánh giá')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            {language === 'en' ? 'Total Assessments' : 'Tổng lượt đánh giá'}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            {language === 'en' ? 'Good Progress (≥ 3.0 shields)' : 'Tiến độ tốt (≥ 3.0 khiên)'}
          </span>
          <div className="text-2xl font-bold text-emerald-800 mt-1">{stats.safeCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
            {language === 'en' ? 'Academic Risk Detected' : 'Phát hiện nguy cơ học thuật'}
          </span>
          <div className="text-2xl font-bold text-rose-800 mt-1">{stats.riskCount}</div>
          <span className="text-[10px] text-rose-600">
            {language === 'en' ? 'Requires Intervention' : 'Cần tạo phiếu can thiệp'}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={language === 'en' ? 'Search by student name, period...' : 'Tìm theo tên học sinh, kỳ đánh giá...'}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">{t('students.allClasses', 'Tất cả lớp học')}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#043264]/20"
          >
            <option value="all">{language === 'en' ? 'All Risk Levels' : 'Tất cả mức độ'}</option>
            <option value="risk">{language === 'en' ? 'Academic Risk (< 3.0 shields)' : 'Có nguy cơ học tập (< 3.0 khiên)'}</option>
            <option value="safe">{language === 'en' ? 'On Track' : 'An toàn'}</option>
          </select>
        </div>
      </div>

      {/* Assessment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-xs text-slate-500">
            {language === 'en' ? 'Loading assessments...' : 'Đang tải danh sách đánh giá...'}
          </div>
        ) : filteredAssessments.length === 0 ? (
          <div className="col-span-2 p-12 text-center bg-white rounded-xl border border-slate-200">
            <ClipboardCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">
              {language === 'en' ? 'No Assessments Found' : 'Chưa có bài đánh giá nào'}
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'en' ? 'Add the first 4-skill assessment for this class cohort.' : 'Hãy thêm bài đánh giá 4 kỹ năng đầu tiên cho lớp học.'}
            </p>
          </div>
        ) : (
          filteredAssessments.map((a) => {
            const avg = ((Number(a.listening_score) + Number(a.speaking_score) + Number(a.reading_score) + Number(a.writing_score)) / 4).toFixed(1);

            return (
              <div
                key={a.id}
                className={`p-5 rounded-2xl border transition-shadow bg-white flex flex-col justify-between ${
                  a.has_academic_risk ? 'border-rose-300 shadow-xs ring-1 ring-rose-200' : 'border-slate-200 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{a.student?.full_name || (language === 'en' ? 'Student' : 'Học viên')}</span>
                        <span className="text-[11px] text-slate-500 font-mono">({a.class?.name || (language === 'en' ? 'Class' : 'Lớp')})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {a.period} • {language === 'en' ? 'Date: ' : 'Ngày: '}{a.assessment_date}
                      </div>
                    </div>

                    {a.has_academic_risk ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        {language === 'en' ? 'Academic Risk' : 'Nguy cơ học thuật'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        {language === 'en' ? 'Standard Progress' : 'Tiến độ đạt chuẩn'}
                      </span>
                    )}
                  </div>

                  {/* 4 Skills Grid */}
                  <div className="grid grid-cols-4 gap-2 my-4">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {language === 'en' ? 'Listening' : 'Nghe'}
                      </span>
                      <span className={`text-sm font-bold ${a.listening_score < 3 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {a.listening_score}/5
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {language === 'en' ? 'Speaking' : 'Nói'}
                      </span>
                      <span className={`text-sm font-bold ${a.speaking_score < 3 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {a.speaking_score}/5
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {language === 'en' ? 'Reading' : 'Đọc'}
                      </span>
                      <span className={`text-sm font-bold ${a.reading_score < 3 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {a.reading_score}/5
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 block">
                        {language === 'en' ? 'Writing' : 'Viết'}
                      </span>
                      <span className={`text-sm font-bold ${a.writing_score < 3 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {a.writing_score}/5
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5 text-xs text-slate-600">
                    {a.strengths && (
                      <p>
                        <strong className="text-emerald-700">{language === 'en' ? 'Strengths: ' : 'Điểm mạnh: '}</strong>{a.strengths}
                      </p>
                    )}
                    {a.weaknesses && (
                      <p>
                        <strong className="text-rose-700">{language === 'en' ? 'Areas for Growth: ' : 'Cần cải thiện: '}</strong>{a.weaknesses}
                      </p>
                    )}
                    {a.progress_notes && (
                      <p className="text-[11px] text-slate-500 italic">"{a.progress_notes}"</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{language === 'en' ? 'Assessed by: ' : 'Đánh giá bởi: '}{a.assessed_by_name}</span>

                  {a.has_academic_risk && onNavigateToIntervention && (
                    <button
                      type="button"
                      onClick={() =>
                        onNavigateToIntervention(
                          a.student_id,
                          a.id,
                          language === 'en'
                            ? `Weak skills: ${a.weaknesses || 'Academic intervention required'}`
                            : `Kỹ năng yếu: ${a.weaknesses || 'Cần can thiệp bổ trợ học vụ'}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {language === 'en' ? 'Open Intervention Ticket' : 'Lập phiếu can thiệp'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Thêm Đánh giá mới */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-50 text-[#043264]">
                  <ClipboardCheck className="w-5 h-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {language === 'en' ? 'Record 4-Skill Competency Assessment' : 'Ghi nhận đánh giá năng lực 4 kỹ năng'}
                </h3>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Select Student *' : 'Chọn học sinh *'}
                </label>
                <select
                  required
                  value={form.student_id}
                  onChange={(e) => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">{language === 'en' ? '-- Select student from cohort --' : '-- Chọn học sinh trong danh sách --'}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.student_code}) - {s.current_class?.name || (language === 'en' ? 'Unassigned' : 'Chưa xếp lớp')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Assessment Period *' : 'Kỳ đánh giá *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.period}
                    onChange={(e) => setForm({ ...form, period: e.target.value })}
                    placeholder={language === 'en' ? 'e.g. Term 1 - Midterm' : 'VD: Kỳ 1 - Giữa kỳ'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {language === 'en' ? 'Assessment Date *' : 'Ngày đánh giá *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.assessment_date}
                    onChange={(e) => setForm({ ...form, assessment_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              {/* 4 Skills Input (0 - 5 shields) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">
                  {language === 'en' ? 'Cambridge 4-Skill Standard Rubrics (0 - 5 Shields)' : 'Thang điểm 4 kỹ năng chuẩn Cambridge (0 - 5 khiên)'}
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {language === 'en' ? 'Listening [0 - 5]' : 'Nghe (Listening) [0 - 5]'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="5"
                      required
                      value={form.listening_score}
                      onChange={(e) => setForm({ ...form, listening_score: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {language === 'en' ? 'Speaking [0 - 5]' : 'Nói (Speaking) [0 - 5]'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="5"
                      required
                      value={form.speaking_score}
                      onChange={(e) => setForm({ ...form, speaking_score: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {language === 'en' ? 'Reading [0 - 5]' : 'Đọc (Reading) [0 - 5]'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="5"
                      required
                      value={form.reading_score}
                      onChange={(e) => setForm({ ...form, reading_score: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-600 mb-1">
                      {language === 'en' ? 'Writing [0 - 5]' : 'Viết (Writing) [0 - 5]'}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="5"
                      required
                      value={form.writing_score}
                      onChange={(e) => setForm({ ...form, writing_score: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Student Strengths' : 'Điểm mạnh của học sinh'}
                </label>
                <input
                  type="text"
                  value={form.strengths}
                  onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                  placeholder={language === 'en' ? 'e.g. Confident communication, rich vocabulary...' : 'VD: Tự tin giao tiếp, phản xạ nhanh...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Areas Needing Growth' : 'Kỹ năng cần cải thiện'}
                </label>
                <input
                  type="text"
                  value={form.weaknesses}
                  onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                  placeholder={language === 'en' ? 'e.g. Oxford phonics intonation, sentence structure...' : 'VD: Phát âm âm đuôi, ngữ điệu câu hỏi...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {language === 'en' ? 'Progress Notes & Feedback' : 'Nhận xét tổng quan'}
                </label>
                <textarea
                  rows={2}
                  value={form.progress_notes}
                  onChange={(e) => setForm({ ...form, progress_notes: e.target.value })}
                  placeholder={language === 'en' ? 'Detailed observations for parents and HRT...' : 'Ghi chú cho giáo viên chủ nhiệm và phụ huynh...'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    : (language === 'en' ? 'Save Assessment' : 'Lưu đánh giá')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
