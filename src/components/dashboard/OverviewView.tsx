// ==============================================================================
// KAPLA Staff Dashboard — Overview & State Showcase (T01 & T02)
// ==============================================================================

import React, { useState } from 'react';
import {
  Users,
  AlertTriangle,
  MessageSquareHeart,
  CalendarClock,
  ShieldCheck,
  Building2,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  FileQuestion,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DashboardNavSection } from '../../types';

interface OverviewViewProps {
  onNavigate: (section: DashboardNavSection) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { currentBranch, profile, activeRole } = useAuth();

  // Test state toggles to demonstrate UI loading/error/empty states
  const [demoState, setDemoState] = useState<'normal' | 'loading' | 'error' | 'empty'>('normal');

  if (demoState === 'loading') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl p-4"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setDemoState('normal')}
            className="text-xs text-[#026fd7] underline font-medium"
          >
            Đang hiển thị Skeleton Loading — Nhấn để quay lại trạng thái chuẩn
          </button>
        </div>
      </div>
    );
  }

  if (demoState === 'error') {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="font-display text-base font-bold text-slate-900">
          Không thể tải dữ liệu chi nhánh
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Đã xảy ra lỗi kết nối với máy chủ dữ liệu hoặc phiên làm việc của bạn đã hết hạn. Vui lòng kiểm tra lại đường truyền mạng.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setDemoState('normal')}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#043264] hover:bg-[#012147]"
          >
            Thử lại kết nối
          </button>
        </div>
      </div>
    );
  }

  if (demoState === 'empty') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <FileQuestion className="w-7 h-7" />
        </div>
        <h3 className="font-display text-base font-bold text-slate-900">
          Chưa có hồ sơ học viên tại chi nhánh
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Chi nhánh này mới được khởi tạo và chưa có học viên nào được ghi danh. Vui lòng thêm học viên đầu tiên để kích hoạt dashboard.
        </p>
        <button
          type="button"
          onClick={() => setDemoState('normal')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#026fd7] bg-blue-50 hover:bg-blue-100"
        >
          Khôi phục dữ liệu mẫu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* -------------------------------------------------------------------- */}
      {/* Welcome & Role Context Header */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-[#012147] to-[#043264] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-200 mb-1">
            <Building2 className="w-4 h-4" />
            <span>Đang làm việc tại: <strong>{currentBranch?.name || 'Tất cả chi nhánh'}</strong></span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold">
            Xin chào, {profile?.full_name}!
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
            Hệ thống phân quyền RLS đang áp dụng theo vai trò <strong>{activeRole || 'Nhân viên'}</strong>. Mọi tác vụ đọc ghi được bảo vệ độc lập theo cơ sở được cấp phép.
          </p>
        </div>

        {/* State Toggle Tester */}
        <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 text-xs self-start md:self-auto space-y-1.5">
          <span className="text-[10px] text-sky-200 font-semibold block uppercase tracking-wider">
            Kiểm thử trạng thái giao diện:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDemoState('loading')}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-medium"
            >
              Loading
            </button>
            <button
              type="button"
              onClick={() => setDemoState('error')}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-medium"
            >
              Error
            </button>
            <button
              type="button"
              onClick={() => setDemoState('empty')}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[11px] font-medium"
            >
              Empty
            </button>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* KPI Highlight Metrics */}
      {/* -------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-600">Tổng học viên theo dõi</span>
            <div className="p-2 bg-blue-50 text-[#026fd7] rounded-xl group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-slate-900">48</span>
            <span className="text-[11px] text-emerald-600 font-medium">+4 tháng này</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ghi danh chính thức tại cơ sở</p>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => onNavigate('interventions')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-600">Rủi ro học thuật cần can thiệp</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-amber-600">3</span>
            <span className="text-[11px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
              Cần xác minh
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">2 Đang xử lý, 1 Chờ CM duyệt</p>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => onNavigate('feedback')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-600">Phản hồi phụ huynh đang mở</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <MessageSquareHeart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-slate-900">2</span>
            <span className="text-[11px] text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded font-semibold">
              Kỳ vọng phát âm
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">1 CSKH nhận, 1 HRT hỗ trợ</p>
        </div>

        {/* Metric 4 */}
        <div
          onClick={() => onNavigate('renewal')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-600">Học phí sắp hết hạn (15 ngày)</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
              <CalendarClock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-rose-600">5</span>
            <span className="text-[11px] text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded font-semibold">
              Tái tục cần gọi
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Đã lên lịch email nhắc HRT</p>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Roadmap & Phase T01/T02 Completion Card */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-display text-sm font-bold text-slate-900">
              Tiến độ hoàn thành giai đoạn T01 & T02 (Nền tảng Auth & Phân quyền)
            </h3>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
            Đã bàn giao code chạy được
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-800 block text-xs">
              ✓ Hoàn tất T01 — Nhận diện & Xác thực:
            </span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Đăng nhập, Đăng ký, Xác thực email, Chờ duyệt, Quên mật khẩu, Đặt lại mật khẩu.</li>
              <li>Bố cục 2 cột desktop với ảnh cơ sở thật và nhận diện màu chuẩn Oxford Quality.</li>
              <li>Khung Dashboard với Sidebar, Topbar, Bộ chọn chi nhánh, Trạng thái Loading / Error / Empty.</li>
            </ul>
          </div>

          <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <span className="font-bold text-slate-800 block text-xs">
              ✓ Hoàn tất T02 — Tài khoản & Phân quyền:
            </span>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Mô hình RLS PostgreSQL Supabase: Profiles, Branch Memberships, Classes, Audit Logs.</li>
              <li>Màn hình duyệt tài khoản chờ cấp quyền, phân công vai trò (CM, Head Teacher, Main Teacher, HRT, TA...).</li>
              <li>Nhật ký kiểm toán bảo mật (Audit log) tự động ghi nhận mọi sự kiện cấp/thu hồi quyền.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
