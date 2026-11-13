// ==============================================================================
// KAPLA Staff Dashboard — Branches & Classes Management View (Phase T02)
// ==============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Building2, BookOpen, Plus, MapPin, Phone, Users, ShieldAlert } from 'lucide-react';
import { Branch, ClassRoom } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { MockStorageService, realSupabase } from '../../lib/supabase';

export const BranchesClassesView: React.FC = () => {
  const { currentBranch, availableBranches, profile } = useAuth();
  const { t, language } = useLanguage();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const isSystemAdmin = profile?.system_role === 'system_admin';

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      if (realSupabase) {
        const { data } = await realSupabase
          .from('classes')
          .select('*')
          .eq('status', 'active');
        if (data) setClasses(data);
      } else {
        setClasses(MockStorageService.getClasses());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const filteredClasses = classes.filter((c) => {
    if (!currentBranch) return true;
    return c.branch_id === currentBranch.id;
  });

  return (
    <div className="space-y-8">
      {/* -------------------------------------------------------------------- */}
      {/* Section 1: Branches Overview */}
      {/* -------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#026fd7]" />
              {language === 'en'
                ? `System Campuses (${availableBranches.length})`
                : `Chi nhánh trong hệ thống (${availableBranches.length})`}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'en'
                ? 'Centralized multi-branch architecture with autonomous campus operations and isolated data scopes.'
                : 'Kiến trúc đa chi nhánh tập trung, vận hành phân quyền độc lập theo từng cơ sở.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableBranches.map((branch) => {
            const isCurrent = currentBranch?.id === branch.id;
            return (
              <div
                key={branch.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-blue-50/50 border-[#026fd7] shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#043264] text-white">
                      {branch.code}
                    </span>
                    <h4 className="font-display text-sm font-bold text-slate-900">
                      {branch.name}
                    </h4>
                  </div>
                  {isCurrent && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      {language === 'en' ? 'Active' : 'Đang chọn'}
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{branch.address || (language === 'en' ? 'Address pending update' : 'Đang cập nhật địa chỉ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">{branch.phone || '028.7300.xxxx'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Section 2: Classes in Active Branch */}
      {/* -------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#026fd7]" />
              {language === 'en'
                ? `Classroom Cohorts at ${currentBranch?.name || 'Active Campus'} (${filteredClasses.length})`
                : `Danh sách lớp học tại ${currentBranch?.name || 'Chi nhánh hiện tại'} (${filteredClasses.length})`}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'en'
                ? 'Cohort setup, default HRT designation, and schedule management for tutoring and intervention routing.'
                : 'Thiết lập lớp học và phân công HRT mặc định phục vụ luồng nhắc phí và can thiệp học thuật.'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {filteredClasses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              {language === 'en' ? 'No class records found for this campus.' : 'Chưa có dữ liệu lớp học tại chi nhánh này.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-5">{t('branches.colClassName', 'Tên lớp học')}</th>
                    <th className="py-3 px-4">{t('branches.colLevel', 'Cấp độ (Level)')}</th>
                    <th className="py-3 px-4">{t('branches.colDefaultHrt', 'Giáo viên chủ nhiệm (HRT mặc định)')}</th>
                    <th className="py-3 px-4">{t('branches.colMainTeacher', 'Giáo viên chính (Main Teacher)')}</th>
                    <th className="py-3 px-4">{t('branches.colSchedule', 'Lịch học')}</th>
                    <th className="py-3 px-4">{t('branches.colStatus', 'Trạng thái')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClasses.map((cls) => (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {cls.name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#043264]">
                        {cls.level}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">
                          {cls.default_hrt_name || 'Võ Thị Tuyết Mai'}
                        </span>
                        <span className="block text-[10px] text-slate-400">HRT mặc định của lớp</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {cls.main_teacher_name || 'Teacher Alex (Bản ngữ)'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                        {cls.schedule || 'Thứ 2 & 4 (17:30 - 19:00)'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang hoạt động
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
