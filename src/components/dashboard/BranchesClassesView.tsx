// ==============================================================================
// KAPLA Staff Dashboard — Staff & Classes · Roles & Assignments View
// Customer Reference: Images 1, 2, 3, 4
// 1. KAPLA PH Staff Directory with Assigned Classes & Add/Edit Staff Modals
// 2. Classes & Teaching Teams with Add/Edit Class Modals
// 3. Whole-Class Cascading Level & Class Code Advancement ("Thay đổi nguyên lớp")
// 4. Complete Teacher Authorization & Permission Scoping
// ==============================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  BookOpen,
  Plus,
  Pencil,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Search,
} from 'lucide-react';
import { Branch, ClassRoom, StaffDirectoryItem, StaffRole, ALL_STAFF_ROLES, ROLE_LABELS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { StudentService, subscribeToTableChanges } from '../../lib/supabase';

export const BranchesClassesView: React.FC = () => {
  const { currentBranch, profile, activeRole } = useAuth();

  const isSysAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const isHT = activeRole === 'Head Teacher' || (activeRole as string) === 'HT';
  const isSOO = (activeRole as string) === 'SOO';
  // Admin, CM, HT, SOO can manage staff and classes; teachers view in read-only
  const canManage = isSysAdmin || isCM || isHT || isSOO;

  const [staffList, setStaffList] = useState<StaffDirectoryItem[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchStaff, setSearchStaff] = useState('');
  const [searchClass, setSearchClass] = useState('');

  // Toast feedback
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals state
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffDirectoryItem | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  // Class Form State
  const [classCode, setClassCode] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [mainTeacherName, setMainTeacherName] = useState('');
  const [hrtName, setHrtName] = useState('');
  const [taName, setTaName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [savingClass, setSavingClass] = useState(false);

  // Staff Form State
  const [staffFullName, setStaffFullName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('Main Teacher');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffAssignedClasses, setStaffAssignedClasses] = useState<string[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const branchId = currentBranch?.id;
      const [staffData, classData] = await Promise.all([
        StudentService.getStaffList(branchId),
        StudentService.getClasses(branchId),
      ]);
      setStaffList(staffData);
      setClasses(classData);
    } catch (err) {
      console.error('Failed to load staff & classes:', err);
    } finally {
      setLoading(false);
    }
  }, [currentBranch?.id]);

  useEffect(() => {
    loadData();
    const unsubClasses = subscribeToTableChanges('classes', loadData);
    const unsubProfiles = subscribeToTableChanges('profiles', loadData);
    return () => {
      unsubClasses();
      unsubProfiles();
    };
  }, [loadData]);

  // Open Edit Class Modal
  const handleOpenEditClass = (cls: ClassRoom) => {
    setEditingClass(cls);
    setClassCode(cls.name || '');
    setClassLevel(cls.level || '');
    setMainTeacherName(cls.main_teacher_name || '');
    setHrtName(cls.default_hrt_name || '');
    setTaName(cls.ta_name || '');
    setSchedule(cls.schedule || '');
  };

  // Open Add Class Modal
  const handleOpenAddClass = () => {
    setIsAddingClass(true);
    setClassCode('');
    setClassLevel('Level 7');
    setMainTeacherName('');
    setHrtName('');
    setTaName('');
    setSchedule('Tue - Thu 19:00 - 20:50');
  };

  // Save Class (Handles Add & Edit with Whole-Class Cascade)
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      showToast('Class Code / Name is required.', 'error');
      return;
    }
    if (!classLevel.trim()) {
      showToast('Level is required.', 'error');
      return;
    }

    setSavingClass(true);
    try {
      // Find teacher and HRT IDs from staffList
      const teacherObj = staffList.find(
        (s) => s.full_name.toLowerCase() === mainTeacherName.trim().toLowerCase()
      );
      const hrtObj = staffList.find(
        (s) => s.full_name.toLowerCase() === hrtName.trim().toLowerCase()
      );
      const taObj = staffList.find(
        (s) => s.full_name.toLowerCase() === taName.trim().toLowerCase()
      );

      if (editingClass) {
        // CASCADING UPDATE: Modifying class code or level cascades across the whole class
        const result = await StudentService.updateClass(editingClass.id, {
          name: classCode.trim(),
          level: classLevel.trim(),
          main_teacher_id: teacherObj?.id,
          main_teacher_name: mainTeacherName.trim() || undefined,
          default_hrt_id: hrtObj?.id,
          default_hrt_name: hrtName.trim() || undefined,
          ta_id: taObj?.id,
          ta_name: taName.trim() || undefined,
          schedule: schedule.trim() || undefined,
        });

        const cascadeMsg =
          result.cascadedStudentsCount > 0
            ? ` Changes automatically cascaded to all ${result.cascadedStudentsCount} enrolled student(s).`
            : '';
        showToast(`Class "${classCode.trim()}" updated successfully.${cascadeMsg}`, 'success');
        setEditingClass(null);
      } else {
        // Create new class
        await StudentService.createClass({
          branch_id: currentBranch?.id || 'a0000000-0000-0000-0000-000000000001',
          name: classCode.trim(),
          level: classLevel.trim(),
          default_hrt_id: hrtObj?.id,
          default_hrt_name: hrtName.trim() || undefined,
          main_teacher_id: teacherObj?.id,
          main_teacher_name: mainTeacherName.trim() || undefined,
          ta_id: taObj?.id,
          ta_name: taName.trim() || undefined,
          schedule: schedule.trim() || 'Standard Class Schedule',
        });
        showToast(`Class cohort "${classCode.trim()}" created successfully.`, 'success');
        setIsAddingClass(false);
      }
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save class cohort.', 'error');
    } finally {
      setSavingClass(false);
    }
  };

  // Open Edit Staff Modal
  const handleOpenEditStaff = (staff: StaffDirectoryItem) => {
    setEditingStaff(staff);
    setStaffFullName(staff.full_name || '');
    setStaffEmail(staff.email || '');
    setStaffRole(staff.role || 'Main Teacher');
    setStaffPhone(staff.phone || '');
    setStaffAssignedClasses(staff.assigned_classes || []);
  };

  // Open Add Staff Modal
  const handleOpenAddStaff = () => {
    setIsAddingStaff(true);
    setStaffFullName('');
    setStaffEmail('');
    setStaffRole('Main Teacher');
    setStaffPhone('');
    setStaffAssignedClasses([]);
  };

  // Save Staff (Add & Edit)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFullName.trim()) {
      showToast('Full Name is required.', 'error');
      return;
    }
    if (!staffEmail.trim()) {
      showToast('Email address is required.', 'error');
      return;
    }

    setSavingStaff(true);
    try {
      if (editingStaff) {
        await StudentService.updateStaffDirectory(editingStaff.id, {
          full_name: staffFullName.trim(),
          email: staffEmail.trim(),
          role: staffRole,
          phone: staffPhone.trim(),
          assigned_classes: staffAssignedClasses,
        });
        showToast(`Staff member "${staffFullName.trim()}" updated successfully.`, 'success');
        setEditingStaff(null);
      } else {
        await StudentService.createStaff({
          full_name: staffFullName.trim(),
          email: staffEmail.trim(),
          role: staffRole,
          phone: staffPhone.trim(),
          branch_id: currentBranch?.id || 'a0000000-0000-0000-0000-000000000001',
          assigned_classes: staffAssignedClasses,
        });
        showToast(`Staff member "${staffFullName.trim()}" registered successfully.`, 'success');
        setIsAddingStaff(false);
      }
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save staff member.', 'error');
    } finally {
      setSavingStaff(false);
    }
  };

  // Filter staff by search query
  const filteredStaff = useMemo(() => {
    if (!searchStaff.trim()) return staffList;
    const q = searchStaff.toLowerCase();
    return staffList.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.role.toLowerCase().includes(q) ||
        s.assigned_classes.some((c) => c.toLowerCase().includes(q))
    );
  }, [staffList, searchStaff]);

  // Filter classes by search query
  const filteredClasses = useMemo(() => {
    if (!searchClass.trim()) return classes;
    const q = searchClass.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.level.toLowerCase().includes(q) ||
        (c.main_teacher_name && c.main_teacher_name.toLowerCase().includes(q)) ||
        (c.default_hrt_name && c.default_hrt_name.toLowerCase().includes(q)) ||
        (c.schedule && c.schedule.toLowerCase().includes(q))
    );
  }, [classes, searchClass]);

  // Available teachers & HRTs for modal dropdowns
  const availableTeachers = useMemo(() => {
    return staffList.filter(
      (s) =>
        s.role === 'Main Teacher' ||
        s.role === 'Head Teacher' ||
        s.role === 'HT' ||
        s.role === 'Supplementary Teacher'
    );
  }, [staffList]);

  const availableHrts = useMemo(() => {
    return staffList.filter((s) => s.role === 'HRT');
  }, [staffList]);

  const availableTas = useMemo(() => {
    return staffList.filter((s) => s.role === 'TA');
  }, [staffList]);

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Section 1: KAPLA PH Staff Directory */}
      {/* -------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#026fd7]" />
              KAPLA PH Staff Directory
            </h3>
            <p className="text-xs text-slate-500">
              Teaching faculty, homeroom educators, and class assignments at KAPLA Pham Hung Campus.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff or class..."
                value={searchStaff}
                onChange={(e) => setSearchStaff(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] w-48 transition-all"
              />
            </div>

            {/* Add Staff / Teacher Button: Only for authorized roles */}
            {canManage && (
              <button
                type="button"
                onClick={handleOpenAddStaff}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-[#026fd7] hover:bg-[#025cb3] shadow-sm hover:shadow transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Staff / Teacher
              </button>
            )}
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading staff directory...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No staff members found matching criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-5">Full Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Assigned Classes</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {staff.full_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-medium ${
                            staff.role === 'Main Teacher'
                              ? 'text-[#026fd7]'
                              : staff.role === 'Head Teacher' || staff.role === 'HT'
                              ? 'text-indigo-600 font-semibold'
                              : staff.role === 'CM'
                              ? 'text-sky-700 font-bold'
                              : staff.role === 'HRT'
                              ? 'text-emerald-700'
                              : 'text-slate-700'
                          }`}
                        >
                          {staff.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {staff.email}
                      </td>
                      <td className="py-3.5 px-4">
                        {staff.assigned_classes && staff.assigned_classes.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {staff.assigned_classes.map((clsName) => (
                              <span
                                key={clsName}
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 text-slate-800 border border-slate-200"
                              >
                                {clsName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => handleOpenEditStaff(staff)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white hover:text-[#026fd7] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all"
                          >
                            <Pencil className="w-3 h-3" />
                            Edit
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Section 2: Classes & Teaching Teams */}
      {/* -------------------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#026fd7]" />
              Classes & Teaching Teams
            </h3>
            <p className="text-xs text-slate-500">
              Classroom cohorts, level assignments, and designated teaching faculty teams.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search class cohort..."
                value={searchClass}
                onChange={(e) => setSearchClass(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] w-48 transition-all"
              />
            </div>

            {/* Add Class Button: Only for authorized roles */}
            {canManage && (
              <button
                type="button"
                onClick={handleOpenAddClass}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-[#026fd7] hover:bg-[#025cb3] shadow-sm hover:shadow transition-all shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                + Add Class
              </button>
            )}
          </div>
        </div>

        {/* Classes Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading classes...</div>
          ) : filteredClasses.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No classroom cohorts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-5">Class Code / Name</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Main Teacher</th>
                    <th className="py-3 px-4">HRT / TA</th>
                    <th className="py-3 px-4">Schedule</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClasses.map((cls) => {
                    const hrtOrTa = [cls.default_hrt_name, cls.ta_name]
                      .filter(Boolean)
                      .join(' / ');

                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-slate-900 font-mono">
                          {cls.name}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#043264]">
                          {cls.level}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">
                          {cls.main_teacher_name || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {hrtOrTa || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {cls.schedule || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditClass(cls)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-600 bg-white hover:text-[#026fd7] hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit
                            </button>
                          ) : (
                            <span className="text-slate-300 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Modal 1: Edit Class & Class Code (Customer Reference Image 4) */}
      {/* -------------------------------------------------------------------- */}
      {(editingClass || isAddingClass) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingClass ? 'Edit Class & Class Code' : 'Add Class Cohort'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingClass(null);
                  setIsAddingClass(false);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveClass} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Code / Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PH-L9-0003"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] focus:ring-1 focus:ring-[#026fd7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Level <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Level 9"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] focus:ring-1 focus:ring-[#026fd7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Main Teacher <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="teacher-suggestions"
                  placeholder="e.g. Leonid Formin"
                  value={mainTeacherName}
                  onChange={(e) => setMainTeacherName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] focus:ring-1 focus:ring-[#026fd7]"
                />
                <datalist id="teacher-suggestions">
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.full_name} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">HRT</label>
                  <input
                    type="text"
                    list="hrt-suggestions"
                    placeholder="e.g. Lê Ngọc Khánh Vy"
                    value={hrtName}
                    onChange={(e) => setHrtName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] focus:ring-1 focus:ring-[#026fd7]"
                  />
                  <datalist id="hrt-suggestions">
                    {availableHrts.map((h) => (
                      <option key={h.id} value={h.full_name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">TA</label>
                  <input
                    type="text"
                    list="ta-suggestions"
                    placeholder="Optional TA"
                    value={taName}
                    onChange={(e) => setTaName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] focus:ring-1 focus:ring-[#026fd7]"
                  />
                  <datalist id="ta-suggestions">
                    {availableTas.map((ta) => (
                      <option key={ta.id} value={ta.full_name} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. Tue - Thu 19:00 - 20:50"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] focus:ring-1 focus:ring-[#026fd7]"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingClass(null);
                    setIsAddingClass(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClass}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#026fd7] hover:bg-[#025cb3] rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {savingClass ? 'Saving...' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Modal 2: Add / Edit Staff & Teacher */}
      {/* -------------------------------------------------------------------- */}
      {(editingStaff || isAddingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-display text-base font-bold text-slate-900">
                {editingStaff ? 'Edit Staff / Teacher' : 'Add Staff / Teacher'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setIsAddingStaff(false);
                }}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStaff} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zandile Tanaka Hlomayi"
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7] focus:ring-1 focus:ring-[#026fd7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as StaffRole)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7]"
                  >
                    {ALL_STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r] || r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. 0912 345 678"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zandile.hlomayi@kapla.edu.vn"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#026fd7]"
                />
              </div>

              {/* Assigned Classes Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Classes ({staffAssignedClasses.length} selected)
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto space-y-1.5">
                  {classes.length === 0 ? (
                    <div className="text-xs text-slate-400">No classes registered yet.</div>
                  ) : (
                    classes.map((cls) => {
                      const isChecked = staffAssignedClasses.includes(cls.name);
                      return (
                        <label
                          key={cls.id}
                          className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer hover:bg-white p-1 rounded transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStaffAssignedClasses([...staffAssignedClasses, cls.name]);
                              } else {
                                setStaffAssignedClasses(
                                  staffAssignedClasses.filter((c) => c !== cls.name)
                                );
                              }
                            }}
                            className="rounded border-slate-300 text-[#026fd7] focus:ring-[#026fd7]"
                          />
                          <span className="font-mono font-medium">{cls.name}</span>
                          <span className="text-slate-400 text-[10px]">({cls.level})</span>
                        </label>
                      );
                    })
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Select cohorts where this staff member serves as the designated educator.
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(null);
                    setIsAddingStaff(false);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#026fd7] hover:bg-[#025cb3] rounded-xl transition-all shadow-sm disabled:opacity-50"
                >
                  {savingStaff ? 'Saving...' : editingStaff ? 'Save Changes' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
