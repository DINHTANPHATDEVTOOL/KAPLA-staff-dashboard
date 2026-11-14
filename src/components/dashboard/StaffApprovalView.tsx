// ==============================================================================
// KAPLA Staff Dashboard — Staff & Role Approval View (Phase T02)
// ==============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  Building2,
  AlertCircle,
  CheckCircle2,
  History,
  Lock,
  X,
  UserPlus,
  Loader2,
  ChevronRight,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  ALL_STAFF_ROLES,
  AuditLog,
  Branch,
  BranchMembership,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  StaffRole,
  STATUS_LABELS,
  SystemRole,
  UserProfile,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { isDevMockMode, MockStorageService, realSupabase, StaffService } from '../../lib/supabase';

export const StaffApprovalView: React.FC = () => {
  const { profile, activeRole, currentBranch, availableBranches } = useAuth();
  const { t, language } = useLanguage();
  const isSystemAdmin = profile?.system_role === 'system_admin';
  const isCM = activeRole === 'CM';
  const isHT = activeRole === 'Head Teacher' || (activeRole as string) === 'HT';
  const isSOO = (activeRole as string) === 'SOO';
  // SOO, HT, CM, and Admin are authorized to approve and assign teacher roles
  const canApprove = isSystemAdmin || isCM || isSOO || isHT;

  const [activeTab, setActiveTab] = useState<'pending' | 'staff' | 'audit'>(canApprove ? 'pending' : 'staff');

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [memberships, setMemberships] = useState<BranchMembership[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Approval Modal State
  const [approvingUser, setApprovingUser] = useState<UserProfile | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<StaffRole>('HRT');
  const [selectedSystemRole, setSelectedSystemRole] = useState<SystemRole>('staff');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Filters for Active Staff
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');

  // Staff CRUD Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<(UserProfile & { userMemberships: BranchMembership[] }) | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<UserProfile | null>(null);

  const [addForm, setAddForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    branch_id: '',
    role: 'HRT' as StaffRole,
    system_role: 'staff' as SystemRole,
    password: 'Kapla@2026',
  });

  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    branch_id: '',
    role: 'HRT' as StaffRole,
    system_role: 'staff' as SystemRole,
    status: 'active' as any,
  });

  // Fetch data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (realSupabase) {
        const { data: pData } = await realSupabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (pData) setProfiles(pData);

        const { data: mData } = await realSupabase.from('branch_memberships').select('*, branch:branches(*)');
        if (mData) setMemberships(mData);

        const { data: aData } = await realSupabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
        if (aData) setAuditLogs(aData);
      } else {
        setProfiles(MockStorageService.getProfiles());
        setMemberships(MockStorageService.getMemberships());
        setAuditLogs(MockStorageService.getAuditLogs());
      }
    } finally {
      setLoading(false);
    }
  }, []);

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
  }, [loadData]);

  // Pending users calculation
  const pendingUsers = useMemo(() => {
    return profiles.filter((p) => {
      if (p.status !== 'pending') return false;
      // System admin sees all pending users
      if (isSystemAdmin) return true;
      // CM, SOO, HT see pending users who selected branch or have no branch preference
      if ((isCM || isSOO || isHT) && currentBranch) {
        return p.preferred_branch_id === currentBranch.id || !p.preferred_branch_id;
      }
      return false;
    });
  }, [profiles, isSystemAdmin, isCM, isSOO, isHT, currentBranch]);

  // Open Approval Modal
  const handleOpenApproveModal = (target: UserProfile) => {
    setApprovingUser(target);
    setSelectedBranchId(target.preferred_branch_id || currentBranch?.id || availableBranches[0]?.id || '');
    setSelectedRole('HRT');
    setSelectedSystemRole(target.system_role || 'staff');
  };

  // Submit Approval
  const handleSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingUser || !selectedBranchId) return;

    setSubmittingAction(true);
    setActionNotice(null);

    try {
      if (realSupabase) {
        const { data, error } = await realSupabase.rpc('approve_user_membership', {
          p_target_user_id: approvingUser.id,
          p_branch_id: selectedBranchId,
          p_role: selectedRole,
          p_system_role: selectedSystemRole,
        });
        if (error) throw error;
        setActionNotice({ type: 'success', text: `Approved account ${approvingUser.full_name} with role ${selectedRole}.` });
      } else {
        // Mock Implementation
        const currentProfiles = MockStorageService.getProfiles();
        const pIdx = currentProfiles.findIndex((p) => p.id === approvingUser.id);
        if (pIdx !== -1) {
          currentProfiles[pIdx].status = 'active';
          if (isSystemAdmin) {
            currentProfiles[pIdx].system_role = selectedSystemRole;
          }
          MockStorageService.saveProfiles(currentProfiles);
        }

        const currentMemberships = MockStorageService.getMemberships();
        const memIdx = currentMemberships.findIndex((m) => m.user_id === approvingUser.id && m.branch_id === selectedBranchId);
        if (memIdx !== -1) {
          currentMemberships[memIdx].role = selectedRole;
          currentMemberships[memIdx].status = 'active';
        } else {
          currentMemberships.push({
            id: 'mem-' + Math.random().toString(36).substring(2, 9),
            user_id: approvingUser.id,
            branch_id: selectedBranchId,
            role: selectedRole,
            is_primary: true,
            status: 'active',
          });
        }
        MockStorageService.saveMemberships(currentMemberships);

        const branchName = availableBranches.find((b) => b.id === selectedBranchId)?.name || 'Campus';
        MockStorageService.appendAuditLog({
          actor_email: profile?.email || 'admin@kapla.edu.vn',
          action: 'APPROVE_USER_ROLE',
          target_user_email: approvingUser.email,
          branch_id: selectedBranchId,
          branch_name: branchName,
          details: { role: selectedRole, system_role: selectedSystemRole },
        });

        setActionNotice({ type: 'success', text: `Successfully approved account ${approvingUser.full_name} as ${selectedRole} at ${branchName}.` });
      }

      setApprovingUser(null);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error approving staff account.';
      setActionNotice({ type: 'error', text: msg });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Deactivate User
  const handleDeactivate = async (target: UserProfile) => {
    if (!confirm(`Are you sure you want to disable the account of "${target.full_name}"?`)) return;

    setLoading(true);
    setActionNotice(null);
    try {
      if (realSupabase) {
        const { error } = await realSupabase.rpc('deactivate_user', {
          p_target_user_id: target.id,
          p_reason: 'Access suspended from staff administration panel.',
        });
        if (error) throw error;
      } else {
        const currentProfiles = MockStorageService.getProfiles();
        const idx = currentProfiles.findIndex((p) => p.id === target.id);
        if (idx !== -1) {
          currentProfiles[idx].status = 'inactive';
          currentProfiles[idx].rejection_reason = 'Access suspended from staff administration panel.';
          MockStorageService.saveProfiles(currentProfiles);
        }

        MockStorageService.appendAuditLog({
          actor_email: profile?.email || 'admin@kapla.edu.vn',
          action: 'DEACTIVATE_USER',
          target_user_email: target.email,
          details: { reason: 'Account disabled' },
        });
      }

      setActionNotice({ type: 'success', text: `Disabled account ${target.full_name}.` });
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error disabling staff account.';
      setActionNotice({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  // Staff CRUD Handlers
  const handleOpenAddModal = () => {
    setAddForm({
      full_name: '',
      email: '',
      phone: '',
      branch_id: currentBranch?.id || availableBranches[0]?.id || '',
      role: 'HRT',
      system_role: 'staff',
      password: 'Kapla@2026',
    });
    setShowAddModal(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.full_name.trim() || !addForm.email.trim()) return;
    setSubmittingAction(true);
    setActionNotice(null);
    try {
      await StaffService.createStaff(addForm);
      setActionNotice({
        type: 'success',
        text: 'Staff account created successfully.',
      });
      setShowAddModal(false);
      await loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err?.message || 'Error creating new staff member.',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleOpenEditModal = (staff: UserProfile & { userMemberships: BranchMembership[] }) => {
    const primaryMem = staff.userMemberships[0];
    setEditingStaff(staff);
    setEditForm({
      full_name: staff.full_name,
      phone: staff.phone || '',
      branch_id: primaryMem?.branch_id || staff.preferred_branch_id || currentBranch?.id || availableBranches[0]?.id || '',
      role: primaryMem?.role || 'HRT',
      system_role: staff.system_role || 'staff',
      status: staff.status,
    });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setSubmittingAction(true);
    setActionNotice(null);
    try {
      await StaffService.updateStaff(editingStaff.id, editForm);
      setActionNotice({
        type: 'success',
        text: 'Staff profile updated successfully.',
      });
      setEditingStaff(null);
      await loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err?.message || 'Error updating staff member.',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    if (deletingStaff.id === profile?.id) {
      setActionNotice({
        type: 'error',
        text: 'Cannot delete your own active account.',
      });
      setDeletingStaff(null);
      return;
    }
    setSubmittingAction(true);
    setActionNotice(null);
    try {
      await StaffService.deleteStaff(deletingStaff.id);
      setActionNotice({
        type: 'success',
        text: 'Staff account deleted permanently.',
      });
      setDeletingStaff(null);
      await loadData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err?.message || 'Error deleting staff member.',
      });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Filtered Active Staff List
  const activeStaffList = useMemo(() => {
    return profiles
      .filter((p) => p.status === 'active' || p.status === 'inactive')
      .map((p) => {
        const userMems = memberships.filter((m) => m.user_id === p.id && m.status === 'active');
        return {
          ...p,
          userMemberships: userMems,
        };
      })
      .filter((staff) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = staff.full_name.toLowerCase().includes(q);
          const matchEmail = staff.email.toLowerCase().includes(q);
          if (!matchName && !matchEmail) return false;
        }

        // Branch filter
        if (filterBranch !== 'all') {
          const inBranch = staff.userMemberships.some((m) => m.branch_id === filterBranch);
          if (!inBranch && staff.preferred_branch_id !== filterBranch) return false;
        }

        // Role filter
        if (filterRole !== 'all') {
          if (filterRole === 'system_admin') {
            if (staff.system_role !== 'system_admin') return false;
          } else {
            const hasRole = staff.userMemberships.some((m) => m.role === filterRole);
            if (!hasRole) return false;
          }
        }

        return true;
      });
  }, [profiles, memberships, searchQuery, filterBranch, filterRole]);

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* Action Notification Banner */}
      {/* -------------------------------------------------------------------- */}
      {actionNotice && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* Navigation Tabs (Strictly hide unauthorized tabs) */}
      {/* -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          {canApprove && (
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'pending'
                  ? 'bg-[#043264] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{'Pending Approvals'}</span>
              {pendingUsers.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    activeTab === 'pending'
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {pendingUsers.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'staff'
                ? 'bg-[#043264] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {`Staff Directory (${activeStaffList.length})`}
            </span>
          </button>

          {canApprove && (
            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'audit'
                  ? 'bg-[#043264] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{'Permission Audit Trail'}</span>
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span>
            {'Enforced with PostgreSQL RLS & UUID RBAC at database level'}
          </span>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* TAB 1: PENDING USERS APPROVAL */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                {'Pending Staff Account Approvals'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {'Staff members who verified email and require Center Manager (CM) or System Admin approval before accessing systems.'}
              </p>
            </div>
            {!canApprove && (
              <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg font-medium self-start">
                {'Approval restricted to CM / Admin'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#026fd7]" />
              {'Loading pending staff...'}
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-display text-sm font-bold text-slate-800">
                {'No Pending Approval Requests'}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {'All newly registered staff members have been assigned to their respective branches.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-5">{'Full Name'}</th>
                    <th className="py-3 px-4">{'Work Email'}</th>
                    <th className="py-3 px-4">{'Phone Number'}</th>
                    <th className="py-3 px-4">{'Target Campus'}</th>
                    <th className="py-3 px-4">{'Registered Date'}</th>
                    <th className="py-3 px-5 text-right">{'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingUsers.map((u) => {
                    const prefBranch = availableBranches.find((b) => b.id === u.preferred_branch_id);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-slate-900">
                          {u.full_name}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {u.phone || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          {prefBranch ? (
                            <span className="font-medium text-[#043264]">
                              {prefBranch.name} ({prefBranch.code})
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {'No Campus Selected'}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString('en-US')
                            : ('New')}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          {canApprove ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenApproveModal(u)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-2xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                {'Approve & Assign Role'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeactivate(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                {'Deactivate'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              {'CM/Admin only'}
                            </span>
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
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 2: ACTIVE STAFF DIRECTORY */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder={'Search staff by name or email...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#026fd7]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700"
              >
                <option value="all">{'All Campuses'}</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-700"
              >
                <option value="all">{'All Roles'}</option>
                <option value="system_admin">
                  {'System Administrator'}
                </option>
                {ALL_STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>

              {isSystemAdmin && (
                <button
                  type="button"
                  onClick={handleOpenAddModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] transition-colors shadow-2xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{'Add Staff'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-5">{'Staff Member'}</th>
                    <th className="py-3 px-4">{'Email & Contact'}</th>
                    <th className="py-3 px-4">{'Campus & Role'}</th>
                    <th className="py-3 px-4">{'System Access'}</th>
                    <th className="py-3 px-4">{'Status'}</th>
                    {canApprove && (
                      <th className="py-3 px-5 text-right">{'Actions'}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeStaffList.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {staff.full_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800">{staff.email}</div>
                        <div className="text-[11px] text-slate-500">
                          {staff.phone || ('No phone updated')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {staff.userMemberships && staff.userMemberships.length > 0 ? (
                          <div className="space-y-1">
                            {staff.userMemberships.map((m) => {
                              const br = availableBranches.find((b) => b.id === m.branch_id);
                              return (
                                <div key={m.id} className="flex items-center gap-1.5">
                                  <span className="font-medium text-[#043264]">
                                    {br ? br.name : ('Campus')}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                                    {m.role}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            {'No Campus Assigned'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {staff.system_role === 'system_admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            {'System Administrator'}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            {'Branch Staff'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            STATUS_LABELS[staff.status]?.badge || 'bg-slate-100'
                          }`}
                        >
                          {STATUS_LABELS[staff.status]?.label || staff.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenApproveModal(staff)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                              title={'Update Role'}
                            >
                              {'Role'}
                            </button>
                            {isSystemAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(staff)}
                                  className="p-1 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  title={'Edit Profile'}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={staff.id === profile?.id}
                                  onClick={() => setDeletingStaff(staff)}
                                  className="p-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                  title={
                                    staff.id === profile?.id
                                      ? 'Cannot delete yourself'
                                      : 'Delete Account'
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* TAB 3: AUDIT LOGS */}
      {/* -------------------------------------------------------------------- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h3 className="font-display text-sm font-bold text-slate-900">
                {'Role Grants, Updates & Revocations (Audit Log)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {'Transparent security audit trail enforced by database Row-Level Security policies.'}
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {'Real-time automatic capture'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="py-3 px-5">{'Timestamp'}</th>
                  <th className="py-3 px-4">{'Actor'}</th>
                  <th className="py-3 px-4">{'Action'}</th>
                  <th className="py-3 px-4">{'Target Account'}</th>
                  <th className="py-3 px-4">{'Campus / Branch'}</th>
                  <th className="py-3 px-5">{'Recorded Details'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-US')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {log.actor_email || ('System')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {log.target_user_email || '—'}
                    </td>
                    <td className="py-3 px-4 text-[#043264] font-medium">
                      {log.branch_name || ('System')}
                    </td>
                    <td className="py-3 px-5 text-slate-600 font-mono text-[11px]">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* APPROVAL / ROLE ASSIGNMENT MODAL */}
      {/* -------------------------------------------------------------------- */}
      {approvingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-[#026fd7] rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {'Approve & Assign Staff Role'}
                  </h3>
                  <p className="text-xs text-slate-500">{approvingUser.full_name} ({approvingUser.email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitApproval} className="space-y-4 pt-4">
              {/* Branch Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Assigned Campus *'}
                </label>
                <select
                  required
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                >
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Branch Operational Role *'}
                </label>
                <select
                  required
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as StaffRole)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                >
                  {ALL_STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">
                    {'Role Scope:'}
                  </span>{' '}
                  {ROLE_DESCRIPTIONS[selectedRole]}
                </p>
              </div>

              {/* System Admin Role Assignment (Only visible/editable by existing System Admin) */}
              {isSystemAdmin && (
                <div className="pt-2 border-t border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Elevated System Privileges'}
                  </label>
                  <select
                    value={selectedSystemRole}
                    onChange={(e) => setSelectedSystemRole(e.target.value as SystemRole)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="staff">
                      {'Standard Staff (Branch-scoped)'}
                    </option>
                    <option value="system_admin">
                      {'System Administrator (Full multi-branch access)'}
                    </option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setApprovingUser(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-70"
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {'Confirm Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW STAFF MEMBER
      ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#043264] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {'Add Staff Account'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {'Create new employee with designated role'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={'e.g. Nguyen Van An'}
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Work Email *'}
                </label>
                <input
                  type="email"
                  required
                  placeholder="an.nguyen@kapla.edu.vn"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Initial Password'}
                  </label>
                  <input
                    type="text"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Branch / Campus *'}
                  </label>
                  <select
                    required
                    value={addForm.branch_id}
                    onChange={(e) => setAddForm({ ...addForm, branch_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Operational Role *'}
                  </label>
                  <select
                    required
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as StaffRole })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    {ALL_STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isSystemAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'System Access'}
                  </label>
                  <select
                    value={addForm.system_role}
                    onChange={(e) => setAddForm({ ...addForm, system_role: e.target.value as SystemRole })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="staff">{'Branch Staff'}</option>
                    <option value="system_admin">{'System Administrator'}</option>
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT STAFF MEMBER
      ========================================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#043264] flex items-center justify-center font-bold">
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    {'Edit Staff Profile'}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-500">{editingStaff.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#026fd7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Campus'}
                  </label>
                  <select
                    value={editForm.branch_id}
                    onChange={(e) => setEditForm({ ...editForm, branch_id: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Role'}
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as StaffRole })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    {ALL_STAFF_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {isSystemAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {'System Role'}
                    </label>
                    <select
                      value={editForm.system_role}
                      onChange={(e) => setEditForm({ ...editForm, system_role: e.target.value as SystemRole })}
                      className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                    >
                      <option value="staff">{'Staff'}</option>
                      <option value="system_admin">{'System Admin'}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {'Status'}
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:bg-white"
                  >
                    <option value="active">{'Active'}</option>
                    <option value="inactive">{'Inactive'}</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  {'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147] rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-70"
                >
                  {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE STAFF
      ========================================================================= */}
      {deletingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {'Delete Staff Account?'}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {`Are you sure you want to delete ${deletingStaff.full_name} (${deletingStaff.email})? All branch assignments will be removed.`}
            </p>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingStaff(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                {'Cancel'}
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleDeleteStaff}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-70"
              >
                {submittingAction && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
