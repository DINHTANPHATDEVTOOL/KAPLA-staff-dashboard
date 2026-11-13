// ==============================================================================
// KAPLA Staff Dashboard — Language Context & Localization (VI / EN-US)
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

export type Language = 'vi' | 'en';

const STORAGE_KEY = 'kapla_language';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  vi: {
    // Brand & General
    'brand.portalTitle': 'KAPLA Staff Portal',
    'brand.portalSubtitle': 'Hệ Thống Quản Lý Tiến Độ & Chăm Sóc Học Viên',
    'brand.oxfordBadge': 'Độc quyền chuẩn Oxford Quality',
    'brand.heroHeadline': 'Đồng hành cùng học viên bứt phá tiềm năng Anh ngữ.',
    'brand.heroDesc': 'Nền tảng tác nghiệp nội bộ dành riêng cho đội ngũ Quản lý cơ sở (CM), Giám đốc học thuật, Giáo viên chính, HRT và Chăm sóc khách hàng trong việc theo dõi học tập, can thiệp kịp thời và gắn kết phụ huynh.',
    'brand.securityPillar': 'Phân quyền chặt chẽ',
    'brand.securityPillarDesc': 'Bảo mật thông tin phụ huynh và học phí theo từng vai trò',
    'brand.multiBranchPillar': 'Đa chi nhánh từ gốc',
    'brand.multiBranchPillarDesc': 'Triển khai tập trung, vận hành độc lập từng trung tâm',
    'brand.footerVersion': 'Phiên bản 2.1 (RLS Secured)',
    'brand.internalTag': 'Nội bộ',
    'brand.campusBadge': 'Cơ sở Phạm Hùng • Flagship Campus TP.HCM',
    'brand.campusHighlight': 'Không gian đào tạo tiếng Anh sáng tạo & STEM chuẩn Mỹ',
    'brand.campusSub': 'Hệ thống phòng học tương tác, thư viện Oxford và xưởng sáng chế Robotics.',
    'brand.classroomThumb': 'Phòng học Oxford Quality',
    'brand.roboticsThumb': 'STEAM & Robotics Lab',

    // Auth Screens
    'auth.loginTitle': 'Đăng nhập tài khoản',
    'auth.loginSubtitle': 'Nhập email và mật khẩu được cấp để truy cập vào hệ thống KAPLA.',
    'auth.emailLabel': 'Email cơ quan',
    'auth.emailPlaceholder': 'ten.nhanvien@kapla.edu.vn',
    'auth.passwordLabel': 'Mật khẩu',
    'auth.forgotPassword': 'Quên mật khẩu?',
    'auth.rememberMe': 'Ghi nhớ trạng thái đăng nhập trên thiết bị này',
    'auth.signInBtn': 'Đăng nhập hệ thống',
    'auth.signingIn': 'Đang xác thực...',
    'auth.newStaffPrompt': 'Bạn là nhân sự mới của KAPLA?',
    'auth.registerNow': 'Đăng ký tài khoản ngay',
    'auth.demoAccountsHeader': 'Chọn nhanh tài khoản thử nghiệm:',

    'auth.registerTitle': 'Đăng ký tài khoản nhân viên',
    'auth.registerSubtitle': 'Tạo tài khoản công tác để được xét duyệt phân quyền theo cơ sở.',
    'auth.fullNameLabel': 'Họ và tên nhân sự',
    'auth.fullNamePlaceholder': 'Nguyễn Văn A',
    'auth.phoneLabel': 'Số điện thoại liên hệ',
    'auth.preferredBranchLabel': 'Chi nhánh mong muốn công tác',
    'auth.selectBranchOption': '-- Chọn cơ sở đào tạo --',
    'auth.passwordRule': 'Tối thiểu 6 ký tự',
    'auth.registerBtn': 'Đăng ký tài khoản',
    'auth.registering': 'Đang đăng ký...',
    'auth.alreadyHaveAccount': 'Đã có tài khoản nhân sự?',
    'auth.backToLogin': 'Đăng nhập ngay',

    'auth.pendingTitle': 'Tài khoản đang chờ duyệt quyền',
    'auth.pendingSubtitle': 'Hồ sơ của bạn đã được ghi nhận vào cơ sở dữ liệu. Quản trị viên hoặc Giám đốc cơ sở (CM) sẽ xem xét và cấp vai trò nghiệp vụ.',
    'auth.checkStatusBtn': 'Kiểm tra lại trạng thái duyệt',
    'auth.checking': 'Đang kiểm tra...',

    'auth.verifyEmailTitle': 'Xác thực địa chỉ email',
    'auth.verifyEmailSubtitle': 'Chúng tôi đã gửi link kích hoạt đến email cơ quan của bạn. Vui lòng mở hộp thư và nhấn vào đường dẫn xác nhận.',
    'auth.resendEmail': 'Gửi lại email xác thực',

    'auth.disabledTitle': 'Tài khoản bị tạm ngưng',
    'auth.disabledSubtitle': 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng quyền truy cập. Vui lòng liên hệ Giám đốc cơ sở để được hỗ trợ.',
    'auth.logout': 'Đăng xuất',
    'auth.contactSupport': 'Liên hệ bộ phận Học vụ / IT',

    // Sidebar & Navigation
    'nav.overview': 'Tổng quan học vụ',
    'nav.students': 'Hồ sơ học viên',
    'nav.care_tasks': 'Công việc HRT',
    'nav.assessments': 'Đánh giá năng lực',
    'nav.interventions': 'Phiếu can thiệp',
    'nav.feedback': 'Phản hồi phụ huynh',
    'nav.supplementary': 'Lớp học bổ trợ',
    'nav.renewal': 'Quản lý tái tục',
    'nav.logs': 'Nhật ký tác nghiệp',
    'nav.staff_roles': 'Nhân sự & Phân quyền',
    'nav.branches_classes': 'Chi nhánh & Lớp học',

    // TopBar Section Meta
    'topbar.selectBranch': 'Chọn chi nhánh',
    'topbar.systemBranches': 'Chi nhánh toàn hệ thống',
    'topbar.assignedBranches': 'Chi nhánh phân bổ',
    'topbar.refreshData': 'Làm mới dữ liệu',
    'topbar.emailVerified': '● Email đã xác thực',

    'topbar.overviewTitle': 'Tổng quan học vụ & Tiến độ',
    'topbar.overviewSub': 'Theo dõi tổng thể học viên, mức độ rủi ro và các mốc can thiệp.',
    'topbar.studentsTitle': 'Hồ sơ học viên (Student Records)',
    'topbar.studentsSub': 'Quản lý thông tin học tập, phân công HRT và hạn phí học viên.',
    'topbar.careTasksTitle': 'Công việc HRT (Care Worklist)',
    'topbar.careTasksSub': 'Nhiệm vụ chăm sóc học viên theo quy tắc ưu tiên HRT riêng.',
    'topbar.assessmentsTitle': 'Đánh giá năng lực 4 kỹ năng',
    'topbar.assessmentsSub': 'Ghi nhận Nghe - Nói - Đọc - Viết theo chuẩn Cambridge & Oxford Quality.',
    'topbar.interventionsTitle': 'Phiếu can thiệp học thuật (Academic Interventions)',
    'topbar.interventionsSub': 'Theo dõi kế hoạch khắc phục, hạn xử lý và xác minh kết quả.',
    'topbar.feedbackTitle': 'Phản hồi & Kỳ vọng phụ huynh (Parent Feedback)',
    'topbar.feedbackSub': 'Ghi nhận và điều phối giải quyết khiếu nại, góp ý từ phụ huynh.',
    'topbar.supplementaryTitle': 'Lớp học bổ trợ (Supplementary Tutoring)',
    'topbar.supplementarySub': 'Theo dõi điểm danh, nội dung bổ trợ và nhận xét sự tiến bộ.',
    'topbar.renewalTitle': 'Quản lý tái tục & Rủi ro học phí',
    'topbar.renewalSub': 'Cảnh báo hạn tái tục, hỗ trợ chăm sóc phụ huynh trước hạn.',
    'topbar.staffRolesTitle': 'Quản trị nhân sự & Phân quyền',
    'topbar.staffRolesSub': 'Phê duyệt tài khoản mới, phân bổ vai trò và chi nhánh công tác.',
    'topbar.branchesClassesTitle': 'Chi nhánh & Danh sách lớp học',
    'topbar.branchesClassesSub': 'Cấu hình chi nhánh hoạt động và thiết lập phân công lớp.',
    'topbar.logsTitle': 'Nhật ký tác nghiệp (Activity Logs)',
    'topbar.logsSub': 'Lịch sử tương tác giữa các bộ phận chuyên môn và học viên.',

    // Common Academic Terms
    'academic.studentRecords': 'Hồ sơ học viên',
    'academic.parentFeedback': 'Phản hồi phụ huynh',
    'academic.academicInterventions': 'Phiếu can thiệp',
    'academic.supplementaryTutoring': 'Lớp học bổ trợ',
    'academic.renewalManagement': 'Quản lý tái tục',
  },
  en: {
    // Brand & General
    'brand.portalTitle': 'KAPLA Staff Portal',
    'brand.portalSubtitle': 'Student Progress & Academic Care Management System',
    'brand.oxfordBadge': 'Exclusive Oxford Quality Standards',
    'brand.heroHeadline': 'Partnering with students to unlock their English potential.',
    'brand.heroDesc': 'Internal operations platform for Center Directors (CM), Academic Directors, Main Teachers, HRTs, and Student Care teams to monitor learning, trigger early interventions, and engage parents.',
    'brand.securityPillar': 'Strict Role-Based Access',
    'brand.securityPillarDesc': 'Row-level security protecting parent data and tuition records',
    'brand.multiBranchPillar': 'Native Multi-Branch',
    'brand.multiBranchPillarDesc': 'Centralized deployment with autonomous campus operations',
    'brand.footerVersion': 'Version 2.1 (RLS Secured)',
    'brand.internalTag': 'Internal',
    'brand.campusBadge': 'Pham Hung Campus • Flagship Center HCMC',
    'brand.campusHighlight': 'Creative American English & STEM Learning Environment',
    'brand.campusSub': 'Smart interactive classrooms, Oxford library, and Robotics makerspace.',
    'brand.classroomThumb': 'Oxford Quality Classroom',
    'brand.roboticsThumb': 'STEAM & Robotics Lab',

    // Auth Screens
    'auth.loginTitle': 'Sign in to your account',
    'auth.loginSubtitle': 'Enter your work email and password to access the KAPLA system.',
    'auth.emailLabel': 'Work Email',
    'auth.emailPlaceholder': 'staff.name@kapla.edu.vn',
    'auth.passwordLabel': 'Password',
    'auth.forgotPassword': 'Forgot password?',
    'auth.rememberMe': 'Remember login state on this device',
    'auth.signInBtn': 'Sign In to Portal',
    'auth.signingIn': 'Authenticating...',
    'auth.newStaffPrompt': 'New to KAPLA staff?',
    'auth.registerNow': 'Register account now',
    'auth.demoAccountsHeader': 'Quick select demo account:',

    'auth.registerTitle': 'Create Staff Account',
    'auth.registerSubtitle': 'Create an internal account for branch assignment and role approval.',
    'auth.fullNameLabel': 'Full Name',
    'auth.fullNamePlaceholder': 'Jane Doe',
    'auth.phoneLabel': 'Phone Number',
    'auth.preferredBranchLabel': 'Preferred Branch',
    'auth.selectBranchOption': '-- Select Campus / Branch --',
    'auth.passwordRule': 'At least 6 characters',
    'auth.registerBtn': 'Register Account',
    'auth.registering': 'Registering...',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.backToLogin': 'Sign in here',

    'auth.pendingTitle': 'Account Pending Approval',
    'auth.pendingSubtitle': 'Your profile has been saved. Your Center Director (CM) or System Admin will review and grant your role.',
    'auth.checkStatusBtn': 'Check Approval Status',
    'auth.checking': 'Checking...',

    'auth.verifyEmailTitle': 'Email Verification Required',
    'auth.verifyEmailSubtitle': 'We sent an activation link to your work email. Please open your inbox and click the confirmation link.',
    'auth.resendEmail': 'Resend Verification Email',

    'auth.disabledTitle': 'Account Suspended',
    'auth.disabledSubtitle': 'Your account has been deactivated or suspended. Please contact your Center Director or System Admin for support.',
    'auth.logout': 'Sign Out',
    'auth.contactSupport': 'Contact Academic Office / IT',

    // Sidebar & Navigation
    'nav.overview': 'Academic Overview',
    'nav.students': 'Student Records',
    'nav.care_tasks': 'HRT Tasks',
    'nav.assessments': 'Competency Assessments',
    'nav.interventions': 'Academic Interventions',
    'nav.feedback': 'Parent Feedback',
    'nav.supplementary': 'Supplementary Tutoring',
    'nav.renewal': 'Renewal & Retention',
    'nav.logs': 'Activity Logs',
    'nav.staff_roles': 'Staff & Permissions',
    'nav.branches_classes': 'Branches & Classes',

    // TopBar Section Meta
    'topbar.selectBranch': 'Select Branch',
    'topbar.systemBranches': 'System-wide Branches',
    'topbar.assignedBranches': 'Assigned Branches',
    'topbar.refreshData': 'Refresh Data',
    'topbar.emailVerified': '● Email Verified',

    'topbar.overviewTitle': 'Academic Overview & Progress',
    'topbar.overviewSub': 'Monitor student progress, academic risks, and intervention milestones.',
    'topbar.studentsTitle': 'Student Records (Student Master)',
    'topbar.studentsSub': 'Manage academic records, HRT assignments, and tuition expiry.',
    'topbar.careTasksTitle': 'HRT Tasks (Care Worklist)',
    'topbar.careTasksSub': 'Student care tasks prioritized by designated individual HRT.',
    'topbar.assessmentsTitle': '4-Skill Competency Assessments',
    'topbar.assessmentsSub': 'Track Listening, Speaking, Reading, Writing via Oxford & Cambridge standards.',
    'topbar.interventionsTitle': 'Academic Interventions',
    'topbar.interventionsSub': 'Track action plans, target resolution dates, and supervisory verification.',
    'topbar.feedbackTitle': 'Parent Feedback & Expectations',
    'topbar.feedbackSub': 'Log and coordinate resolution for parent inquiries and feedback.',
    'topbar.supplementaryTitle': 'Supplementary Tutoring',
    'topbar.supplementarySub': 'Track attendance, tailored tutoring curriculum, and progress notes.',
    'topbar.renewalTitle': 'Renewal & Tuition Risk Management',
    'topbar.renewalSub': 'Tuition renewal alerts and proactive parent outreach before expiration.',
    'topbar.staffRolesTitle': 'Staff & Permissions',
    'topbar.staffRolesSub': 'Review pending registrations, assign roles, and allocate campuses.',
    'topbar.branchesClassesTitle': 'Branches & Class Directory',
    'topbar.branchesClassesSub': 'Configure branch operations and classroom cohort assignments.',
    'topbar.logsTitle': 'Activity Logs (Follow-up Logs)',
    'topbar.logsSub': 'Audit trail of staff communication and academic care actions.',

    // Common Academic Terms
    'academic.studentRecords': 'Student Records',
    'academic.parentFeedback': 'Parent Feedback',
    'academic.academicInterventions': 'Academic Interventions',
    'academic.supplementaryTutoring': 'Supplementary Tutoring',
    'academic.renewalManagement': 'Renewal & Retention',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallbackVi?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'vi' || saved === 'en') return saved;
    } catch {
      // ignore
    }
    return 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const t = useMemo(() => {
    return (key: string, fallbackVi?: string): string => {
      const translated = TRANSLATIONS[language]?.[key];
      if (translated) return translated;
      if (language === 'vi' && fallbackVi) return fallbackVi;
      return TRANSLATIONS.vi?.[key] || fallbackVi || key;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// ==============================================================================
// Language Toggle Button Component (🇻🇳 Tiếng Việt / 🇺🇸 English (US))
// ==============================================================================

export const LanguageToggle: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false,
}) => {
  const { language, setLanguage } = useLanguage();

  if (compact) {
    return (
      <button
        type="button"
        id="language-toggle-btn"
        onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
        title={language === 'vi' ? 'Chuyển sang English (US)' : 'Switch to Tiếng Việt'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
          language === 'vi'
            ? 'bg-red-50/80 border-red-200 text-red-900 hover:bg-red-100'
            : 'bg-blue-50/80 border-blue-200 text-blue-900 hover:bg-blue-100'
        } ${className}`}
      >
        <span>{language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      id="language-toggle-group"
      aria-label="Language selection"
      className={`inline-flex items-center rounded-xl p-1 bg-slate-100 border border-slate-200 text-xs font-semibold select-none shadow-2xs ${className}`}
    >
      <button
        type="button"
        id="language-btn-vi"
        onClick={() => setLanguage('vi')}
        aria-pressed={language === 'vi'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          language === 'vi'
            ? 'bg-white text-slate-900 shadow-xs font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>🇻🇳</span>
        <span>Tiếng Việt</span>
      </button>
      <span className="text-slate-300 font-light mx-0.5">/</span>
      <button
        type="button"
        id="language-btn-en"
        onClick={() => setLanguage('en')}
        aria-pressed={language === 'en'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
          language === 'en'
            ? 'bg-white text-slate-900 shadow-xs font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <span>🇺🇸</span>
        <span>English (US)</span>
      </button>
    </div>
  );
};
