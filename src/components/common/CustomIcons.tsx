// ==============================================================================
// KAPLA Staff Portal — Bespoke Custom Vector Icons & Duotone Badges
// Designed specifically for KAPLA Education Systems (No raw emojis or flat icons)
// ==============================================================================

import React from 'react';
import {
  Shield,
  Building2,
  GraduationCap,
  HeartHandshake,
  UserCheck,
  Award,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

/**
 * Vietnam National Flag (Crisp Vector SVG)
 */
export const VietnamFlag: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg
    viewBox="0 0 30 20"
    className={`inline-block shrink-0 rounded-xs overflow-hidden shadow-2xs ${className}`}
    aria-label="Cờ Việt Nam"
  >
    <rect width="30" height="20" fill="#DA251D" />
    {/* 5-Pointed Star centered */}
    <polygon
      fill="#FFFF00"
      points="15,4 16.54,8.75 21.54,8.75 17.5,11.69 19.04,16.44 15,13.5 10.96,16.44 12.5,11.69 8.46,8.75 13.46,8.75"
    />
  </svg>
);

/**
 * United States National Flag (Crisp Vector SVG)
 */
export const USFlag: React.FC<{ className?: string }> = ({ className = 'w-4 h-3' }) => (
  <svg
    viewBox="0 0 38 20"
    className={`inline-block shrink-0 rounded-xs overflow-hidden shadow-2xs ${className}`}
    aria-label="US Flag"
  >
    {/* 13 Stripes */}
    <rect width="38" height="20" fill="#B22234" />
    <rect y="1.54" width="38" height="1.54" fill="#FFFFFF" />
    <rect y="4.62" width="38" height="1.54" fill="#FFFFFF" />
    <rect y="7.69" width="38" height="1.54" fill="#FFFFFF" />
    <rect y="10.77" width="38" height="1.54" fill="#FFFFFF" />
    <rect y="13.85" width="38" height="1.54" fill="#FFFFFF" />
    <rect y="16.92" width="38" height="1.54" fill="#FFFFFF" />
    {/* Blue Canton */}
    <rect width="15.2" height="10.77" fill="#3C3B6E" />
    {/* Stylized White Stars grid */}
    <circle cx="2.5" cy="2" r="0.6" fill="#FFFFFF" />
    <circle cx="5.5" cy="2" r="0.6" fill="#FFFFFF" />
    <circle cx="8.5" cy="2" r="0.6" fill="#FFFFFF" />
    <circle cx="11.5" cy="2" r="0.6" fill="#FFFFFF" />
    <circle cx="4.0" cy="4" r="0.6" fill="#FFFFFF" />
    <circle cx="7.0" cy="4" r="0.6" fill="#FFFFFF" />
    <circle cx="10.0" cy="4" r="0.6" fill="#FFFFFF" />
    <circle cx="13.0" cy="4" r="0.6" fill="#FFFFFF" />
    <circle cx="2.5" cy="6" r="0.6" fill="#FFFFFF" />
    <circle cx="5.5" cy="6" r="0.6" fill="#FFFFFF" />
    <circle cx="8.5" cy="6" r="0.6" fill="#FFFFFF" />
    <circle cx="11.5" cy="6" r="0.6" fill="#FFFFFF" />
    <circle cx="4.0" cy="8" r="0.6" fill="#FFFFFF" />
    <circle cx="7.0" cy="8" r="0.6" fill="#FFFFFF" />
    <circle cx="10.0" cy="8" r="0.6" fill="#FFFFFF" />
    <circle cx="13.0" cy="8" r="0.6" fill="#FFFFFF" />
  </svg>
);

/**
 * Bespoke Role Icon Badges for Staff Hierarchy
 */
export type StaffRoleVariant =
  | 'system_admin'
  | 'center_manager'
  | 'academic_director'
  | 'lead_teacher'
  | 'hrt'
  | 'customer_service';

interface RoleBadgeProps {
  role: StaffRoleVariant | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RoleBadgeIcon: React.FC<RoleBadgeProps> = ({ role, size = 'sm', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-8 h-8 p-1.5',
    lg: 'w-10 h-10 p-2',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  switch (role) {
    case 'system_admin':
      return (
        <div
          className={`rounded-lg bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 text-white flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0 ${sizeClasses} ${className}`}
          title="System Admin / Quản trị hệ thống"
        >
          <Shield className={iconSizes} />
        </div>
      );
    case 'center_manager':
    case 'branch_manager':
      return (
        <div
          className={`rounded-lg bg-gradient-to-br from-[#026fd7] to-[#012147] text-white flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0 ${sizeClasses} ${className}`}
          title="Center Manager / Quản lý cơ sở"
        >
          <Building2 className={iconSizes} />
        </div>
      );
    case 'academic_director':
      return (
        <div
          className={`rounded-lg bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0 ${sizeClasses} ${className}`}
          title="Academic Director / Giám đốc học thuật"
        >
          <Award className={iconSizes} />
        </div>
      );
    case 'lead_teacher':
    case 'teacher':
      return (
        <div
          className={`rounded-lg bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0 ${sizeClasses} ${className}`}
          title="Lead Teacher / Giáo viên chính"
        >
          <GraduationCap className={iconSizes} />
        </div>
      );
    case 'hrt':
      return (
        <div
          className={`rounded-lg bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 text-white flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0 ${sizeClasses} ${className}`}
          title="HRT / Giáo viên chủ nhiệm"
        >
          <HeartHandshake className={iconSizes} />
        </div>
      );
    case 'customer_service':
    default:
      return (
        <div
          className={`rounded-lg bg-gradient-to-br from-sky-500 to-blue-700 text-white flex items-center justify-center shadow-xs ring-1 ring-white/20 shrink-0 ${sizeClasses} ${className}`}
          title="Chăm sóc học vụ"
        >
          <UserCheck className={iconSizes} />
        </div>
      );
  }
};

/**
 * Premium Duotone Container for General Lucide Icons
 */
interface DuotoneContainerProps {
  icon: LucideIcon;
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate' | 'navy';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DuotoneContainer: React.FC<DuotoneContainerProps> = ({
  icon: Icon,
  variant = 'blue',
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7 p-1.5',
    md: 'w-9 h-9 p-2',
    lg: 'w-11 h-11 p-2.5',
    xl: 'w-14 h-14 p-3.5',
  }[size];

  const iconSizeMap = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-7 h-7',
  }[size];

  const variantStyles = {
    blue: 'bg-gradient-to-br from-blue-500 to-[#026fd7] text-white shadow-blue-500/20 ring-1 ring-blue-400/30',
    emerald: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-emerald-500/20 ring-1 ring-emerald-400/30',
    amber: 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-amber-500/20 ring-1 ring-amber-300/40',
    rose: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-500/20 ring-1 ring-rose-400/30',
    purple: 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-500/20 ring-1 ring-purple-400/30',
    slate: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-slate-500/20 ring-1 ring-slate-400/30',
    navy: 'bg-gradient-to-br from-[#026fd7] to-[#012147] text-white shadow-[#012147]/30 ring-1 ring-white/20',
  }[variant];

  return (
    <div
      className={`rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-all duration-300 ${sizeMap} ${variantStyles} ${className}`}
    >
      <Icon className={iconSizeMap} />
    </div>
  );
};
