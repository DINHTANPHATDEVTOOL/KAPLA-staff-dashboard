// ==============================================================================
// KAPLA Staff Dashboard — Language Context & Localization (VI / EN-US)
// ==============================================================================

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { VietnamFlag, USFlag } from '../components/common/CustomIcons';

export type Language = 'vi' | 'en';

const STORAGE_KEY = 'kapla_language';

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  vi: {
    // Brand & General (Official from kapla.edu.vn)
    'brand.portalTitle': 'KAPLA Staff Portal',
    'brand.portalSubtitle': 'Cổng Thông Tin Học Vụ & Quản Trị Trung Tâm',
    'brand.oxfordBadge': 'Chứng nhận Oxford Quality 2025–2028 • Oxford University Press',
    'brand.heroHeadline': 'KAPLA — Tiếng Anh Sáng Tạo Mỹ chuẩn Oxford Quality',
    'brand.heroDesc': 'Hệ thống tiếng Anh duy nhất tại Việt Nam đạt 03 chứng nhận uy tín toàn cầu: Oxford Quality, Emerging Excellence và Cambridge English Qualifications. Chương trình phát triển toàn diện chuẩn CCSS & NGSS của Mỹ kết hợp Lập trình Robotics.',
    'brand.statAccreditationNum': '03',
    'brand.statAccreditationLabel': 'Chứng nhận Toàn cầu',
    'brand.statAccreditationSub': 'Oxford • Cambridge • NatGeo',
    'brand.statCambridgeNum': '15/15',
    'brand.statCambridgeLabel': 'Khiên Cambridge',
    'brand.statCambridgeSub': 'Starters • Movers • Flyers',
    'brand.statCentresNum': '11',
    'brand.statCentresLabel': 'Trung tâm Hoạt động',
    'brand.statCentresSub': 'TP.HCM & Bình Dương',
    'brand.statSteamNum': '100%',
    'brand.statSteamLabel': 'Chuẩn CCSS & NGSS Mỹ',
    'brand.statSteamSub': 'Tích hợp Lập trình Robotics',
    'brand.featureOxfordTitle': 'Lớp học không bàn ghế chuẩn Oxford Quality',
    'brand.featureOxfordDesc': 'Phương pháp Big Question Learning — kích hoạt tư duy chủ động, sáng tạo và rèn luyện kỹ năng 4C.',
    'brand.featureSteamTitle': 'Hệ sinh thái STEAM & Robotics chuẩn Mỹ',
    'brand.featureSteamDesc': 'Phòng Lab lập trình hiện đại, tích hợp Khoa học máy tính, Toán Kangaroo (IKMC) & Cờ vua FIDE.',
    'brand.campusTicker': 'Mạng lưới 11 trung tâm: KAPLA Phạm Hùng • Bình Tân • Tân Kỳ Tân Quý • Bàu Cát • Nguyễn Văn Lượng • Dĩ An • Quang Trung...',
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

    // Missing Auth & Registration Keys (VI)
    'auth.emailError': 'Vui lòng nhập địa chỉ email cơ quan.',
    'auth.passwordError': 'Vui lòng nhập mật khẩu.',
    'auth.nameError': 'Vui lòng nhập họ và tên nhân sự.',
    'auth.emailInvalidError': 'Email công vụ phải có định dạng @kapla.edu.vn hoặc email hợp lệ.',
    'auth.passwordLengthError': 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.',
    'auth.passwordMismatchError': 'Mật khẩu xác nhận không khớp.',
    'auth.confirmPasswordLabel': 'Xác nhận lại mật khẩu',
    'auth.confirmPasswordPlaceholder': 'Nhập lại mật khẩu',
    'auth.workflowLabel': 'Quy trình phê duyệt nội bộ:',
    'auth.workflowDesc': 'Tài khoản đăng ký mới sẽ ở trạng thái chờ duyệt. Quản trị viên hệ thống hoặc Giám đốc cơ sở (CM) sẽ kiểm tra hồ sơ và cấp quyền trong 24 giờ làm việc.',
    'auth.branchHint': 'Chọn chi nhánh bạn trực tiếp công tác để CM tiếp nhận hồ sơ',
    'auth.pendingStatusLabel': 'Chờ xét duyệt phân quyền',
    'auth.pendingSecurityNotice': 'Tài khoản đã được đăng ký thành công trên cổng nội bộ KAPLA. Để đảm bảo an ninh dữ liệu học viên theo chuẩn Enterprise RLS, Quản trị viên (Admin) hoặc Giám đốc cơ sở (CM) cần kiểm tra danh tính và gán vai trò nghiệp vụ phù hợp trước khi bạn có thể truy cập dashboard.',
    'auth.accountSummaryTitle': 'Thông tin tài khoản đăng ký',
    'auth.pendingBadge': 'Chờ phân quyền',
    'auth.registeredBranch': 'Cơ sở đăng ký',
    'auth.adminRole': 'Quản trị hệ thống',
    'auth.staffRole': 'Nhân viên cơ sở',

    // Staff & Student CRUD Keys (VI)
    'staff.addNew': 'Thêm nhân sự mới',
    'staff.editStaff': 'Chỉnh sửa thông tin nhân sự',
    'staff.deleteStaff': 'Xóa tài khoản nhân sự',
    'staff.deleteConfirm': 'Bạn có chắc chắn muốn xóa nhân sự này khỏi hệ thống? Thao tác này sẽ gỡ bỏ tài khoản và phân quyền chi nhánh.',
    'staff.addSuccess': 'Đã tạo tài khoản nhân sự thành công.',
    'staff.updateSuccess': 'Đã cập nhật thông tin nhân sự thành công.',
    'staff.deleteSuccess': 'Đã xóa tài khoản nhân sự thành công.',
    'staff.nameLabel': 'Họ và tên nhân sự',
    'staff.emailLabel': 'Email công vụ',
    'staff.phoneLabel': 'Số điện thoại',
    'staff.branchLabel': 'Chi nhánh phân bổ',
    'staff.roleLabel': 'Vai trò nghiệp vụ',
    'staff.systemRoleLabel': 'Phân quyền hệ thống',
    'staff.statusLabel': 'Trạng thái hoạt động',

    'student.addNew': 'Thêm học viên mới',
    'student.editStudent': 'Chỉnh sửa hồ sơ học viên',
    'student.deleteStudent': 'Xóa hồ sơ học viên',
    'student.deleteConfirm': 'Bạn có chắc chắn muốn xóa học viên này? Toàn bộ dữ liệu học tập, điểm danh và chăm sóc liên quan sẽ bị xóa.',
    'student.addSuccess': 'Đã thêm học viên mới thành công.',
    'student.updateSuccess': 'Đã cập nhật thông tin học viên thành công.',
    'student.deleteSuccess': 'Đã xóa học viên thành công.',

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

    // Common UI Terms
    'common.search': 'Tìm kiếm...',
    'common.filter': 'Bộ lọc',
    'common.all': 'Tất cả',
    'common.actions': 'Thao tác',
    'common.status': 'Trạng thái',
    'common.save': 'Lưu lại',
    'common.saving': 'Đang lưu...',
    'common.cancel': 'Hủy bỏ',
    'common.confirm': 'Xác nhận',
    'common.close': 'Đóng',
    'common.delete': 'Xóa',
    'common.edit': 'Chỉnh sửa',
    'common.create': 'Tạo mới',
    'common.loading': 'Đang tải dữ liệu...',
    'common.noData': 'Không có dữ liệu phù hợp',
    'common.refresh': 'Làm mới',
    'common.details': 'Chi tiết',
    'common.back': 'Quay lại',
    'common.view': 'Xem',
    'common.notes': 'Ghi chú',
    'common.date': 'Ngày',
    'common.student': 'Học viên',
    'common.class': 'Lớp học',
    'common.branch': 'Chi nhánh',
    'common.phone': 'Số điện thoại',
    'common.email': 'Email',
    'common.role': 'Vai trò',
    'common.priority': 'Mức ưu tiên',
    'common.active': 'Hoạt động',
    'common.inactive': 'Vô hiệu',
    'common.pending': 'Chờ duyệt',
    'common.overdue': 'Đã quá hạn',
    'common.warning': 'Cảnh báo',
    'common.days': 'ngày',
    'common.none': 'Chưa cập nhật',

    // Overview View
    'overview.greeting': 'Xin chào, {name}!',
    'overview.subtitle': 'Hệ thống phân quyền RLS đang áp dụng theo vai trò {role}. Mọi tác vụ đọc ghi được bảo vệ độc lập theo cơ sở được cấp phép.',
    'overview.stateTesting': 'Kiểm thử trạng thái giao diện:',
    'overview.kpiStudents': 'Tổng học viên theo dõi',
    'overview.kpiStudentsSub': '+4 tháng này • Ghi danh chính thức tại cơ sở',
    'overview.kpiInterventions': 'Rủi ro học thuật cần can thiệp',
    'overview.kpiInterventionsBadge': 'Cần xác minh',
    'overview.kpiInterventionsSub': '2 Đang xử lý, 1 Chờ CM duyệt',
    'overview.kpiFeedback': 'Phản hồi phụ huynh đang mở',
    'overview.kpiFeedbackBadge': 'Rèn luyện phát âm Oxford',
    'overview.kpiFeedbackSub': '1 CSKH tiếp nhận, 1 HRT hỗ trợ',
    'overview.kpiRenewal': 'Học phí sắp hết hạn',
    'overview.kpiRenewalBadge': 'Chăm sóc gia hạn khóa',
    'overview.kpiRenewalSub': 'Đã lên lịch email nhắc HRT',
    'overview.campusHeroTag': 'Cơ sở chuẩn Oxford Quality',
    'overview.campusHeroStatus': 'Đang vận hành',
    'overview.campusHeroAttendance': 'Chuyên cần: 96.8%',
    'overview.campusHeroSatisfaction': 'Hài lòng: 4.9/5.0',
    'overview.quickActionsTitle': 'Tác vụ tác nghiệp học vụ nhanh',
    'overview.quickActionsSub': 'Truy cập tức thì các quy trình chăm sóc và can thiệp chuyên môn',
    'overview.quickActionIntervention': 'Lập kế hoạch can thiệp học thuật',
    'overview.quickActionInterventionDesc': 'Mở phiếu hỗ trợ học sinh có nguy cơ học vụ',
    'overview.quickActionTutoring': 'Lên lịch phụ đạo 1:1 chuyên sâu',
    'overview.quickActionTutoringDesc': 'Bổ trợ phát âm, ngữ điệu và phản xạ',
    'overview.quickActionFeedback': 'Ghi nhận phản hồi phụ huynh',
    'overview.quickActionFeedbackDesc': 'Tiếp nhận nguyện vọng và đồng hành cùng gia đình',
    'overview.activityFeedTitle': 'Nhật ký tác nghiệp học thuật thời gian thực',
    'overview.activityFeedSub': 'Cập nhật trực tiếp tiến độ can thiệp, phụ đạo và chăm sóc phụ huynh tại cơ sở',
    'overview.activityFeedBadge': 'Hôm nay',

    // Student List View
    'students.title': 'Hồ sơ học viên',
    'students.subtitle': 'Quản lý thông tin học viên, hạn học phí, lớp học và phân công HRT tại {branch}',
    'students.addBtn': 'Thêm học viên mới',
    'students.searchPlaceholder': 'Tìm kiếm theo tên, mã HS, phụ huynh...',
    'students.allClasses': 'Tất cả lớp học',
    'students.allStatuses': 'Tất cả trạng thái',
    'students.allHrts': 'Tất cả HRT',
    'students.colStudent': 'Học viên & Mã HS',
    'students.colClass': 'Lớp & Trình độ',
    'students.colParent': 'Phụ huynh & Liên hệ',
    'students.colExpiry': 'Hạn học phí',
    'students.colStatus': 'Trạng thái',
    'students.colHrt': 'HRT phụ trách',
    'students.colActions': 'Thao tác',
    'students.statusActive': 'Đang học (Active)',
    'students.statusWarning': 'Sắp hết hạn (Warning)',
    'students.statusOverdue': 'Đã quá hạn (Overdue)',
    'students.statusWithdrawn': 'Đã nghỉ (Withdrawn)',
    'students.hrtDefault': 'HRT mặc định lớp',
    'students.hrtIndividual': 'HRT riêng',
    'students.transferBtn': 'Chuyển lớp',
    'students.assignHrtBtn': 'Gán HRT riêng',
    'students.addModalTitle': 'Tiếp nhận hồ sơ học viên mới',
    'students.fullNameLabel': 'Họ và tên học viên *',
    'students.studentCodeLabel': 'Mã học viên (HS-xxxx) *',
    'students.dobLabel': 'Ngày sinh',
    'students.parentNameLabel': 'Họ tên phụ huynh *',
    'students.parentPhoneLabel': 'Số điện thoại phụ huynh *',
    'students.parentEmailLabel': 'Email phụ huynh',
    'students.initialClassLabel': 'Lớp ghi danh ban đầu *',
    'students.expiryDateLabel': 'Ngày hết hạn học phí *',
    'students.optionalHrtLabel': 'Gán HRT phụ trách riêng (tùy chọn)',
    'students.submitAdd': 'Lưu hồ sơ học viên',
    'students.transferModalTitle': 'Chuyển lớp cho học viên',
    'students.currentClass': 'Lớp hiện tại:',
    'students.selectNewClass': 'Chọn lớp chuyển đến *',
    'students.transferReason': 'Lý do chuyển lớp *',
    'students.confirmTransfer': 'Xác nhận chuyển lớp',
    'students.transferHistory': 'Lịch sử chuyển lớp:',
    'students.assignModalTitle': 'Phân công HRT riêng cho học viên',
    'students.selectIndividualHrt': 'Chọn HRT phụ trách riêng *',
    'students.removeIndividualHrt': 'Bỏ HRT riêng (dùng mặc định lớp)',
    'students.confirmAssign': 'Lưu phân công HRT',

    // Care Tasks View
    'care.title': 'Công việc HRT phụ trách',
    'care.subtitle': 'Nhiệm vụ chăm sóc học viên theo quy tắc ưu tiên HRT riêng tại {branch}',
    'care.priorityUrgent': 'Khẩn cấp',
    'care.priorityHigh': 'Cao',
    'care.priorityNormal': 'Bình thường',
    'care.statusPending': 'Chưa xử lý',
    'care.statusInProgress': 'Đang xử lý',
    'care.statusCompleted': 'Hoàn thành',
    'care.callBtn': 'Gọi điện',
    'care.zaloBtn': 'Nhắn Zalo',
    'care.meetBtn': 'Gặp trực tiếp',
    'care.logAction': 'Ghi nhật ký tác nghiệp',
    'care.due': 'Hạn xử lý:',

    // Assessments View
    'assessments.title': 'Đánh giá năng lực 4 kỹ năng',
    'assessments.subtitle': 'Theo dõi Nghe - Nói - Đọc - Viết theo chuẩn Cambridge & Oxford Quality tại {branch}',
    'assessments.addBtn': 'Tạo bài đánh giá mới',
    'assessments.colStudent': 'Học viên',
    'assessments.colClass': 'Lớp',
    'assessments.colListening': 'Nghe (Listening)',
    'assessments.colSpeaking': 'Nói (Speaking)',
    'assessments.colReading': 'Đọc (Reading)',
    'assessments.colWriting': 'Viết (Writing)',
    'assessments.colAverage': 'Điểm TB',
    'assessments.colPeriod': 'Kỳ đánh giá',
    'assessments.createIntervention': 'Lập phiếu can thiệp',
    'assessments.modalTitle': 'Ghi nhận bài đánh giá năng lực 4 kỹ năng',
    'assessments.selectStudent': '-- Chọn học viên --',
    'assessments.selectClass': '-- Chọn lớp học --',
    'assessments.evaluationPeriod': 'Kỳ đánh giá *',
    'assessments.assessmentDate': 'Ngày đánh giá *',
    'assessments.strengths': 'Điểm mạnh nổi bật',
    'assessments.weaknesses': 'Kỹ năng cần cải thiện',
    'assessments.progressNotes': 'Nhận xét chi tiết',
    'assessments.submitBtn': 'Lưu bài đánh giá',

    // Interventions View
    'interventions.title': 'Phiếu can thiệp học thuật',
    'interventions.subtitle': 'Quy trình 4 bước: Mở → Đang xử lý → Đã xử lý → Head Teacher / CM xác minh tại {branch}',
    'interventions.createBtn': 'Tạo phiếu can thiệp',
    'interventions.stageOpen': 'Mở (Open)',
    'interventions.stageInProgress': 'Đang xử lý (In Progress)',
    'interventions.stageResolved': 'Đã xử lý (Resolved)',
    'interventions.stageVerified': 'Đã xác minh (Verified)',
    'interventions.startHandling': 'Bắt đầu xử lý',
    'interventions.submitResolved': 'Nộp kết quả đánh giá lại',
    'interventions.verifyBtn': 'Xác minh đạt chuẩn (Head Teacher / CM)',
    'interventions.modalTitle': 'Lập phiếu can thiệp học thuật mới',
    'interventions.targetStudent': 'Học sinh cần can thiệp *',
    'interventions.assignedStaff': 'Nhân sự phụ trách can thiệp *',
    'interventions.targetSkill': 'Kỹ năng / Môn cần can thiệp *',
    'interventions.reason': 'Nguyên nhân & Vấn đề học tập *',
    'interventions.actionPlan': 'Kế hoạch can thiệp chi tiết *',
    'interventions.targetDate': 'Hạn hoàn thành can thiệp *',
    'interventions.resolveModalTitle': 'Nộp kết quả đánh giá lại sau can thiệp',
    'interventions.reevalScore': 'Điểm đánh giá lại (0 - 5.0) *',
    'interventions.reevalNotes': 'Nhận xét kết quả sau can thiệp *',
    'interventions.verifyModalTitle': 'Xác minh kết quả can thiệp học thuật',
    'interventions.verifyNotes': 'Nhận xét kiểm định của Head Teacher / CM *',
    'interventions.academicRisk': 'Nguy cơ học thuật',

    // Feedback View
    'feedback.title': 'Phản hồi & Kỳ vọng phụ huynh',
    'feedback.subtitle': 'Ghi nhận và giải quyết khiếu nại, góp ý từ phụ huynh tại {branch}',
    'feedback.addBtn': 'Tiếp nhận phản hồi mới',
    'feedback.categoryAcademics': 'Học vụ & Tiến độ',
    'feedback.categoryTeachers': 'Giáo viên & Trợ giảng',
    'feedback.categoryFacilities': 'Cơ sở vật chất',
    'feedback.categoryTuition': 'Học phí & Tái tục',
    'feedback.categoryOther': 'Nội dung khác',
    'feedback.sentimentPositive': 'Hài lòng',
    'feedback.sentimentNeutral': 'Bình thường',
    'feedback.sentimentNegative': 'Không hài lòng',
    'feedback.sentimentUrgent': 'Bức xúc / Khiếu nại',
    'feedback.statusNew': 'Mới tiếp nhận',
    'feedback.statusInProgress': 'Đang xử lý',
    'feedback.statusResponded': 'Đã phản hồi',
    'feedback.statusClosed': 'Đã đóng',
    'feedback.modalTitle': 'Ghi nhận phản hồi phụ huynh',
    'feedback.parentFeedbackContent': 'Nội dung phản hồi / Góp ý *',
    'feedback.submitFeedback': 'Lưu phản hồi',

    // Supplementary View
    'supplementary.title': 'Lớp học bổ trợ & Kèm 1:1',
    'supplementary.subtitle': 'Quản lý các buổi dạy kèm, điểm danh và đánh giá sự tiến bộ tại {branch}',
    'supplementary.addBtn': 'Lên lịch học bổ trợ',
    'supplementary.colSession': 'Buổi học & Thời gian',
    'supplementary.colStudent': 'Học viên kèm',
    'supplementary.colTeacher': 'Giáo viên phụ trách',
    'supplementary.colSubject': 'Chủ đề / Kỹ năng',
    'supplementary.colAttendance': 'Điểm danh',
    'supplementary.colNotes': 'Nhận xét tiến bộ',
    'supplementary.present': 'Có mặt',
    'supplementary.excused': 'Vắng có phép',
    'supplementary.unexcused': 'Vắng không phép',
    'supplementary.modalTitle': 'Lên lịch buổi học bổ trợ mới',

    // Renewal View
    'renewal.title': 'Quản lý tái tục & Rủi ro học phí',
    'renewal.subtitle': 'Cảnh báo hạn tái tục, hỗ trợ chăm sóc phụ huynh trước hạn tại {branch}',
    'renewal.warningThreshold': 'Ngưỡng cảnh báo học phí: {days} ngày',
    'renewal.adminConfig': 'Admin cài đặt ngưỡng:',
    'renewal.saveThreshold': 'Lưu ngưỡng',
    'renewal.previewRecipients': 'Xem trước người nhận dự kiến',
    'renewal.checking': 'Đang kiểm tra...',
    'renewal.statusOverdue': 'Đã quá hạn',
    'renewal.statusDueToday': 'Hết hạn hôm nay',
    'renewal.statusDueSoon': 'Sắp hết hạn',
    'renewal.statusSafe': 'Còn an toàn',
    'renewal.daysRemaining': 'Còn lại {days} ngày',
    'renewal.daysOverdue': 'Quá hạn {days} ngày',
    'renewal.dueToday': 'Hôm nay',
    'renewal.actionCall': 'Cần gọi ngay',
    'renewal.emailScheduled': 'Đã lên lịch email nhắc HRT',

    // Staff & Roles View
    'staff.title': 'Quản trị nhân sự & Phân quyền',
    'staff.subtitle': 'Phê duyệt tài khoản, phân bổ cơ sở và phân quyền vai trò',
    'staff.tabPending': 'Tài khoản chờ duyệt',
    'staff.tabStaff': 'Danh sách nhân sự',
    'staff.tabAudit': 'Nhật ký phân quyền',
    'staff.approveBtn': 'Phê duyệt & Cấp vai trò',
    'staff.deactivateBtn': 'Khóa tài khoản',
    'staff.assignBranch': 'Cơ sở phân bổ',
    'staff.assignRole': 'Vai trò chuyên môn',
    'staff.assignSystemRole': 'Quyền hệ thống',
    'staff.colName': 'Họ và tên',
    'staff.colEmail': 'Email & Liên hệ',
    'staff.colBranchRole': 'Chi nhánh & Vai trò',
    'staff.colSystemRole': 'Quyền hệ thống',
    'staff.colStatus': 'Trạng thái',
    'staff.colAction': 'Thao tác',

    // Branches & Classes View
    'branches.title': 'Chi nhánh & Lớp học',
    'branches.subtitle': 'Kiến trúc đa chi nhánh tập trung, vận hành phân quyền độc lập từng trung tâm',
    'branches.systemBranches': 'Chi nhánh trong hệ thống ({count})',
    'branches.selected': 'Đang chọn',
    'branches.classesInBranch': 'Danh sách lớp học tại {branch} ({count})',
    'branches.colClassName': 'Tên lớp học',
    'branches.colLevel': 'Cấp độ (Level)',
    'branches.colDefaultHrt': 'HRT mặc định lớp',
    'branches.colMainTeacher': 'Giáo viên chính',
    'branches.colSchedule': 'Lịch học',
    'branches.colStatus': 'Trạng thái',
  },

  en: {
    // Brand & General (Official from kapla.edu.vn)
    'brand.portalTitle': 'KAPLA Staff Portal',
    'brand.portalSubtitle': 'Centralized Academic & Campus Operations Portal',
    'brand.oxfordBadge': 'Oxford Quality Certified 2025–2028 • Oxford University Press',
    'brand.heroHeadline': 'KAPLA — American Creative English with Oxford Quality Standards',
    'brand.heroDesc': 'The only English education system in Vietnam certified by 03 prestigious global bodies: Oxford Quality, Emerging Excellence, and Cambridge English Qualifications. Comprehensive curriculum aligned with US CCSS & NGSS standards with integrated Robotics.',
    'brand.statAccreditationNum': '03',
    'brand.statAccreditationLabel': 'Global Accreditations',
    'brand.statAccreditationSub': 'Oxford • Cambridge • NatGeo',
    'brand.statCambridgeNum': '15/15',
    'brand.statCambridgeLabel': 'Max Cambridge Shields',
    'brand.statCambridgeSub': 'Starters • Movers • Flyers',
    'brand.statCentresNum': '11',
    'brand.statCentresLabel': 'Active Campuses',
    'brand.statCentresSub': 'HCMC & Binh Duong',
    'brand.statSteamNum': '100%',
    'brand.statSteamLabel': 'US CCSS & NGSS Aligned',
    'brand.statSteamSub': 'Integrated Robotics STEAM',
    'brand.featureOxfordTitle': 'Oxford Quality Active Classrooms',
    'brand.featureOxfordDesc': 'Big Question Learning methodology — inspiring critical thinking, creativity, and 4C skills.',
    'brand.featureSteamTitle': 'American STEAM & Robotics Ecosystem',
    'brand.featureSteamDesc': 'State-of-the-art Robotics Labs integrating Computer Science, Kangaroo Math (IKMC) & FIDE Chess.',
    'brand.campusTicker': '11-Campus Network: KAPLA Pham Hung • Binh Tan • Tan Ky Tan Quy • Bau Cat • Nguyen Van Luong • Di An...',
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

    'auth.registerTitle': 'Staff Account Registration',
    'auth.registerSubtitle': 'Create your staff account to be reviewed and assigned to your campus.',
    'auth.fullNameLabel': 'Full Name',
    'auth.fullNamePlaceholder': 'John Doe',
    'auth.phoneLabel': 'Phone Number',
    'auth.preferredBranchLabel': 'Preferred Campus',
    'auth.selectBranchOption': '-- Select Learning Campus --',
    'auth.passwordRule': 'At least 6 characters',
    'auth.registerBtn': 'Register Account',
    'auth.registering': 'Registering...',
    'auth.alreadyHaveAccount': 'Already have a staff account?',
    'auth.backToLogin': 'Sign in now',

    'auth.pendingTitle': 'Account Pending Approval',
    'auth.pendingSubtitle': 'Your registration is logged. An administrator or Center Manager (CM) will review your profile and assign appropriate roles.',
    'auth.checkStatusBtn': 'Check Approval Status',
    'auth.checking': 'Checking...',

    'auth.verifyEmailTitle': 'Email Verification Required',
    'auth.verifyEmailSubtitle': 'We sent an activation link to your work email. Please open your inbox and click the confirmation link.',
    'auth.resendEmail': 'Resend Verification Email',

    'auth.disabledTitle': 'Account Suspended',
    'auth.disabledSubtitle': 'Your account has been deactivated or suspended. Please contact your Center Director or System Admin for support.',
    'auth.logout': 'Sign Out',
    'auth.contactSupport': 'Contact Academic Office / IT',

    // Missing Auth & Registration Keys (EN)
    'auth.emailError': 'Please enter your work email address.',
    'auth.passwordError': 'Please enter your password.',
    'auth.nameError': 'Please enter your full name.',
    'auth.emailInvalidError': 'Work email must have @kapla.edu.vn domain or be a valid email.',
    'auth.passwordLengthError': 'Password must be at least 6 characters long.',
    'auth.passwordMismatchError': 'Passwords do not match.',
    'auth.confirmPasswordLabel': 'Confirm Password',
    'auth.confirmPasswordPlaceholder': 'Re-enter your password',
    'auth.workflowLabel': 'Internal Approval Workflow:',
    'auth.workflowDesc': 'Newly registered accounts will remain pending. A System Admin or Center Manager (CM) will review and assign role permissions within 24 working hours.',
    'auth.branchHint': 'Select the primary campus you report to so the CM can review your profile',
    'auth.pendingStatusLabel': 'Awaiting Role Approval',
    'auth.pendingSecurityNotice': 'Your account has been registered on the KAPLA Staff Portal. To protect student privacy under Enterprise RLS standards, a System Admin or Center Manager (CM) must verify your identity and assign your academic role before dashboard access is granted.',
    'auth.accountSummaryTitle': 'Registered Account Summary',
    'auth.pendingBadge': 'Pending Assignment',
    'auth.registeredBranch': 'Target Campus',
    'auth.adminRole': 'System Administrator',
    'auth.staffRole': 'Campus Staff',

    // Staff & Student CRUD Keys (EN)
    'staff.addNew': 'Add New Staff',
    'staff.editStaff': 'Edit Staff Profile',
    'staff.deleteStaff': 'Delete Staff Account',
    'staff.deleteConfirm': 'Are you sure you want to delete this staff member? This will remove their account and campus permissions.',
    'staff.addSuccess': 'Staff account created successfully.',
    'staff.updateSuccess': 'Staff profile updated successfully.',
    'staff.deleteSuccess': 'Staff account deleted successfully.',
    'staff.nameLabel': 'Staff Full Name',
    'staff.emailLabel': 'Work Email',
    'staff.phoneLabel': 'Phone Number',
    'staff.branchLabel': 'Assigned Campus',
    'staff.roleLabel': 'Staff Academic Role',
    'staff.systemRoleLabel': 'System Access Level',
    'staff.statusLabel': 'Account Status',

    'student.addNew': 'Add New Student',
    'student.editStudent': 'Edit Student Profile',
    'student.deleteStudent': 'Delete Student',
    'student.deleteConfirm': 'Are you sure you want to delete this student? All related assessments, attendance, and care tasks will be removed.',
    'student.addSuccess': 'Student added successfully.',
    'student.updateSuccess': 'Student profile updated successfully.',
    'student.deleteSuccess': 'Student deleted successfully.',

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

    // Common UI Terms
    'common.search': 'Search...',
    'common.filter': 'Filter',
    'common.all': 'All',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.save': 'Save Changes',
    'common.saving': 'Saving...',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.loading': 'Loading data...',
    'common.noData': 'No matching records found',
    'common.refresh': 'Refresh',
    'common.details': 'Details',
    'common.back': 'Back',
    'common.view': 'View',
    'common.notes': 'Notes',
    'common.date': 'Date',
    'common.student': 'Student',
    'common.class': 'Class',
    'common.branch': 'Campus',
    'common.phone': 'Phone Number',
    'common.email': 'Email',
    'common.role': 'Role',
    'common.priority': 'Priority',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.pending': 'Pending',
    'common.overdue': 'Overdue',
    'common.warning': 'Warning',
    'common.days': 'days',
    'common.none': 'None',

    // Overview View
    'overview.greeting': 'Welcome back, {name}!',
    'overview.subtitle': 'Row-level security (RLS) active for role {role}. Data access strictly isolated by authorized campus.',
    'overview.stateTesting': 'UI State Testing:',
    'overview.kpiStudents': 'Total Enrolled Students',
    'overview.kpiStudentsSub': '+4 this month • Officially enrolled at campus',
    'overview.kpiInterventions': 'Academic Risks Needing Action',
    'overview.kpiInterventionsBadge': 'Requires Verification',
    'overview.kpiInterventionsSub': '2 In Progress, 1 Pending CM Approval',
    'overview.kpiFeedback': 'Open Parent Inquiries',
    'overview.kpiFeedbackBadge': 'Oxford Pronunciation Goals',
    'overview.kpiFeedbackSub': '1 Support Received, 1 HRT Assigned',
    'overview.kpiRenewal': 'Expiring Tuitions',
    'overview.kpiRenewalBadge': 'Retention Follow-up',
    'overview.kpiRenewalSub': 'HRT reminder email scheduled',
    'overview.campusHeroTag': 'Oxford Quality Campus',
    'overview.campusHeroStatus': 'Fully Operational',
    'overview.campusHeroAttendance': 'Attendance: 96.8%',
    'overview.campusHeroSatisfaction': 'Satisfaction: 4.9/5.0',
    'overview.quickActionsTitle': 'Academic Operations Quick Actions',
    'overview.quickActionsSub': 'Immediate access to student intervention and care workflows',
    'overview.quickActionIntervention': 'Create Academic Intervention',
    'overview.quickActionInterventionDesc': 'Open action plan for students with academic risks',
    'overview.quickActionTutoring': 'Schedule 1-on-1 Tutoring',
    'overview.quickActionTutoringDesc': 'Oxford phonics, intonation and fluency support',
    'overview.quickActionFeedback': 'Record Parent Feedback',
    'overview.quickActionFeedbackDesc': 'Document family requests and coordinate response',
    'overview.activityFeedTitle': 'Real-Time Academic Operations & Care Stream',
    'overview.activityFeedSub': 'Live operational updates across interventions, tutoring, and HRT parent care',
    'overview.activityFeedBadge': 'Live Today',

    // Student List View
    'students.title': 'Student Records',
    'students.subtitle': 'Manage student records, tuition expiry, class enrollment, and HRT assignments at {branch}',
    'students.addBtn': 'Add New Student',
    'students.searchPlaceholder': 'Search by student name, code, parent info...',
    'students.allClasses': 'All Classes',
    'students.allStatuses': 'All Statuses',
    'students.allHrts': 'All HRTs',
    'students.colStudent': 'Student ID & Name',
    'students.colClass': 'Class & Level',
    'students.colParent': 'Parent & Contact',
    'students.colExpiry': 'Tuition Expiration',
    'students.colStatus': 'Status',
    'students.colHrt': 'Assigned HRT',
    'students.colActions': 'Actions',
    'students.statusActive': 'Active',
    'students.statusWarning': 'Tuition Warning',
    'students.statusOverdue': 'Overdue',
    'students.statusWithdrawn': 'Withdrawn',
    'students.hrtDefault': 'Class Default HRT',
    'students.hrtIndividual': 'Individual HRT',
    'students.transferBtn': 'Transfer Class',
    'students.assignHrtBtn': 'Assign Individual HRT',
    'students.addModalTitle': 'Enroll New Student Record',
    'students.fullNameLabel': 'Student Full Name *',
    'students.studentCodeLabel': 'Student Code (HS-xxxx) *',
    'students.dobLabel': 'Date of Birth',
    'students.parentNameLabel': 'Parent Full Name *',
    'students.parentPhoneLabel': 'Parent Phone Number *',
    'students.parentEmailLabel': 'Parent Email',
    'students.initialClassLabel': 'Initial Class Cohort *',
    'students.expiryDateLabel': 'Tuition Expiry Date *',
    'students.optionalHrtLabel': 'Designate Individual HRT (Optional)',
    'students.submitAdd': 'Save Student Record',
    'students.transferModalTitle': 'Transfer Student to Another Class',
    'students.currentClass': 'Current Class:',
    'students.selectNewClass': 'Select Target Class *',
    'students.transferReason': 'Transfer Reason *',
    'students.confirmTransfer': 'Confirm Class Transfer',
    'students.transferHistory': 'Transfer Audit History:',
    'students.assignModalTitle': 'Designate Individual HRT',
    'students.selectIndividualHrt': 'Select Individual HRT *',
    'students.removeIndividualHrt': 'Remove Individual HRT (Use Class Default)',
    'students.confirmAssign': 'Save HRT Assignment',

    // Care Tasks View
    'care.title': 'Designated HRT Tasks',
    'care.subtitle': 'Student care tasks prioritized by individual HRT designation at {branch}',
    'care.priorityUrgent': 'Urgent',
    'care.priorityHigh': 'High',
    'care.priorityNormal': 'Normal',
    'care.statusPending': 'Pending',
    'care.statusInProgress': 'In Progress',
    'care.statusCompleted': 'Completed',
    'care.callBtn': 'Call Parent',
    'care.zaloBtn': 'Send Zalo',
    'care.meetBtn': 'In-Person Meeting',
    'care.logAction': 'Log Care Action',
    'care.due': 'Target Date:',

    // Assessments View
    'assessments.title': '4-Skill Competency Assessments',
    'assessments.subtitle': 'Track Listening, Speaking, Reading, Writing via Oxford & Cambridge standards at {branch}',
    'assessments.addBtn': 'New Assessment',
    'assessments.colStudent': 'Student',
    'assessments.colClass': 'Class',
    'assessments.colListening': 'Listening',
    'assessments.colSpeaking': 'Speaking',
    'assessments.colReading': 'Reading',
    'assessments.colWriting': 'Writing',
    'assessments.colAverage': 'Average',
    'assessments.colPeriod': 'Evaluation Period',
    'assessments.createIntervention': 'Create Intervention Ticket',
    'assessments.modalTitle': 'Record 4-Skill Competency Assessment',
    'assessments.selectStudent': '-- Select Student --',
    'assessments.selectClass': '-- Select Class --',
    'assessments.evaluationPeriod': 'Evaluation Period *',
    'assessments.assessmentDate': 'Assessment Date *',
    'assessments.strengths': 'Key Strengths',
    'assessments.weaknesses': 'Areas for Improvement',
    'assessments.progressNotes': 'Detailed Academic Notes',
    'assessments.submitBtn': 'Save Assessment',

    // Interventions View
    'interventions.title': 'Academic Interventions',
    'interventions.subtitle': '4-Stage Workflow: Open → In Progress → Resolved → Verified at {branch}',
    'interventions.createBtn': 'Create Intervention Ticket',
    'interventions.stageOpen': 'Open',
    'interventions.stageInProgress': 'In Progress',
    'interventions.stageResolved': 'Resolved',
    'interventions.stageVerified': 'Verified',
    'interventions.startHandling': 'Start Handling',
    'interventions.submitResolved': 'Submit Re-assessment (Resolved)',
    'interventions.verifyBtn': 'Verify Academic Standards (Head Teacher / CM)',
    'interventions.modalTitle': 'Create New Academic Intervention Ticket',
    'interventions.targetStudent': 'Target Student *',
    'interventions.assignedStaff': 'Assigned Lead Staff *',
    'interventions.targetSkill': 'Target Skill / Subject *',
    'interventions.reason': 'Root Cause & Academic Deficit *',
    'interventions.actionPlan': 'Detailed Intervention Plan *',
    'interventions.targetDate': 'Target Resolution Date *',
    'interventions.resolveModalTitle': 'Submit Post-Intervention Re-evaluation',
    'interventions.reevalScore': 'Re-evaluation Score (0 - 5.0) *',
    'interventions.reevalNotes': 'Outcome & Progress Notes *',
    'interventions.verifyModalTitle': 'Verify Academic Intervention Quality',
    'interventions.verifyNotes': 'Supervisory Feedback (Head Teacher / CM) *',
    'interventions.academicRisk': 'Academic Risk',

    // Feedback View
    'feedback.title': 'Parent Feedback & Expectations',
    'feedback.subtitle': 'Log and coordinate parent inquiries, complaints, and feedback at {branch}',
    'feedback.addBtn': 'Log Parent Feedback',
    'feedback.categoryAcademics': 'Academics & Progress',
    'feedback.categoryTeachers': 'Teaching Staff & TAs',
    'feedback.categoryFacilities': 'Facilities & Cleanliness',
    'feedback.categoryTuition': 'Tuition & Renewal',
    'feedback.categoryOther': 'Other Topics',
    'feedback.sentimentPositive': 'Positive',
    'feedback.sentimentNeutral': 'Neutral',
    'feedback.sentimentNegative': 'Dissatisfied',
    'feedback.sentimentUrgent': 'Urgent Escalation',
    'feedback.statusNew': 'New Inquiry',
    'feedback.statusInProgress': 'In Progress',
    'feedback.statusResponded': 'Responded',
    'feedback.statusClosed': 'Closed',
    'feedback.modalTitle': 'Record New Parent Feedback',
    'feedback.parentFeedbackContent': 'Feedback / Inquiry Details *',
    'feedback.submitFeedback': 'Save Feedback Record',

    // Supplementary View
    'supplementary.title': 'Supplementary & 1-on-1 Tutoring',
    'supplementary.subtitle': 'Manage tutoring sessions, attendance, and progress reviews at {branch}',
    'supplementary.addBtn': 'Schedule Tutoring Session',
    'supplementary.colSession': 'Session & Schedule',
    'supplementary.colStudent': 'Enrolled Student',
    'supplementary.colTeacher': 'Assigned Teacher',
    'supplementary.colSubject': 'Topic & Focus Skill',
    'supplementary.colAttendance': 'Attendance',
    'supplementary.colNotes': 'Progress Review',
    'supplementary.present': 'Present',
    'supplementary.excused': 'Excused Absence',
    'supplementary.unexcused': 'Unexcused Absence',
    'supplementary.modalTitle': 'Schedule New Tutoring Session',

    // Renewal View
    'renewal.title': 'Renewal & Tuition Risk Management',
    'renewal.subtitle': 'Tuition renewal alerts and proactive parent outreach at {branch}',
    'renewal.warningThreshold': 'Tuition warning threshold: {days} days',
    'renewal.adminConfig': 'Admin threshold setting:',
    'renewal.saveThreshold': 'Save Threshold',
    'renewal.previewRecipients': 'Preview Scheduled Recipients',
    'renewal.checking': 'Checking...',
    'renewal.statusOverdue': 'Overdue',
    'renewal.statusDueToday': 'Expires Today',
    'renewal.statusDueSoon': 'Expiring Soon',
    'renewal.statusSafe': 'In Good Standing',
    'renewal.daysRemaining': '{days} days remaining',
    'renewal.daysOverdue': '{days} days overdue',
    'renewal.dueToday': 'Today',
    'renewal.actionCall': 'Immediate Call Required',
    'renewal.emailScheduled': 'HRT email reminder scheduled',

    // Staff & Roles View
    'staff.title': 'Staff Management & Permissions',
    'staff.subtitle': 'Approve accounts, assign branches, and allocate academic roles',
    'staff.tabPending': 'Pending Approvals',
    'staff.tabStaff': 'Staff Directory',
    'staff.tabAudit': 'Permission Audit Trail',
    'staff.approveBtn': 'Approve & Assign Role',
    'staff.deactivateBtn': 'Deactivate Account',
    'staff.assignBranch': 'Assigned Campus',
    'staff.assignRole': 'Academic Role',
    'staff.assignSystemRole': 'System Role',
    'staff.colName': 'Full Name',
    'staff.colEmail': 'Email & Contact',
    'staff.colBranchRole': 'Campus & Role',
    'staff.colSystemRole': 'System Access',
    'staff.colStatus': 'Status',
    'staff.colAction': 'Actions',

    // Branches & Classes View
    'branches.title': 'Branches & Classroom Cohorts',
    'branches.subtitle': 'Centralized multi-branch architecture with autonomous campus operations',
    'branches.systemBranches': 'Campuses in System ({count})',
    'branches.selected': 'Selected',
    'branches.classesInBranch': 'Classroom Cohorts at {branch} ({count})',
    'branches.colClassName': 'Class Name',
    'branches.colLevel': 'Level',
    'branches.colDefaultHrt': 'Class Default HRT',
    'branches.colMainTeacher': 'Main Teacher',
    'branches.colSchedule': 'Schedule',
    'branches.colStatus': 'Status',
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

  useEffect(() => {
    document.title =
      language === 'vi'
        ? 'KAPLA - Tiếng Anh Sáng Tạo | Staff Portal'
        : 'KAPLA - Oxford Quality English | Staff Portal';
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  const t = useMemo(() => {
    return (key: string, fallbackVi?: string): string => {
      const translated = TRANSLATIONS[language]?.[key];
      if (translated) return translated;
      if (language === 'vi' && fallbackVi) return fallbackVi;
      if (language === 'en') {
        return TRANSLATIONS.en?.[key] || key;
      }
      return fallbackVi || key;
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
        {language === 'vi' ? (
          <>
            <VietnamFlag className="w-4 h-3 shadow-2xs" />
            <span>VI</span>
          </>
        ) : (
          <>
            <USFlag className="w-4 h-3 shadow-2xs" />
            <span>EN</span>
          </>
        )}
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
        <VietnamFlag className="w-4 h-3 shadow-2xs" />
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
        <USFlag className="w-4 h-3 shadow-2xs" />
        <span>English (US)</span>
      </button>
    </div>
  );
};
