import fs from 'node:fs';
import path from 'node:path';

// Helper to replace in a file
function updateFile(relPath: string, updater: (content: string) => string) {
  const fullPath = path.resolve(relPath);
  const original = fs.readFileSync(fullPath, 'utf-8');
  const updated = updater(original);
  fs.writeFileSync(fullPath, updated, 'utf-8');
}

// 1. Sidebar.tsx
updateFile('src/components/dashboard/Sidebar.tsx', (c) => {
  return c
    .replace(`t('nav.overview', 'Tổng quan học vụ')`, `t('nav.overview', 'Academic Overview')`)
    .replace(`t('nav.students', 'Hồ sơ học viên')`, `t('nav.students', 'Student Records')`)
    .replace(`t('nav.care_tasks', 'Công việc HRT')`, `t('nav.care_tasks', 'HRT Care Tasks')`)
    .replace(`t('nav.assessments', 'Đánh giá năng lực')`, `t('nav.assessments', 'Skill Assessments')`)
    .replace(`t('nav.interventions', 'Phiếu can thiệp')`, `t('nav.interventions', 'Academic Interventions')`)
    .replace(`t('nav.feedback', 'Phản hồi phụ huynh')`, `t('nav.feedback', 'Parent Feedback')`)
    .replace(`t('nav.supplementary', 'Lớp bổ trợ')`, `t('nav.supplementary', 'Supplementary Sessions')`)
    .replace(`t('nav.renewals', 'Tái tục & Học phí')`, `t('nav.renewals', 'Renewals & Tuition')`)
    .replace(`t('nav.audit_logs', 'Nhật ký tác nghiệp')`, `t('nav.audit_logs', 'Activity Logs')`)
    .replace(`t('nav.branches', 'Cơ sở & Lớp học')`, `t('nav.branches', 'Campuses & Classes')`)
    .replace(`t('nav.staff_roles', 'Phân quyền & Nhân sự')`, `t('nav.staff_roles', 'Staff & Permissions')`)
    .replace(`t('nav.roleSystemAdmin', 'Quản trị hệ thống')`, `t('nav.roleSystemAdmin', 'System Administrator')`)
    .replace(`t('nav.roleCenterManager', 'Giám đốc cơ sở')`, `t('nav.roleCenterManager', 'Center Manager')`)
    .replace(`t('nav.roleHeadTeacher', 'Trưởng bộ môn')`, `t('nav.roleHeadTeacher', 'Head Teacher')`)
    .replace(`t('nav.roleLeadTeacher', 'Giáo viên chính')`, `t('nav.roleLeadTeacher', 'Lead Teacher')`)
    .replace(`t('nav.roleHrt', 'Giáo viên chủ nhiệm')`, `t('nav.roleHrt', 'Homeroom Teacher (HRT)')`)
    .replace(`t('nav.roleTa', 'Trợ giảng')`, `t('nav.roleTa', 'Teaching Assistant (TA)')`)
    .replace(`t('nav.roleSupplementary', 'Giáo viên bổ trợ')`, `t('nav.roleSupplementary', 'Supplementary Teacher')`)
    .replace(`t('nav.roleCskh', 'CSKH & Tái tục')`, `t('nav.roleCskh', 'Customer Care & Renewal')`)
    .replace(`t('nav.roleStaffPending', 'Chờ phê duyệt vai trò')`, `t('nav.roleStaffPending', 'Pending Role Approval')`)
    .replace(`t('sidebar.collapse', 'Thu gọn thanh điều hướng')`, `t('sidebar.collapse', 'Collapse sidebar')`)
    .replace(`t('sidebar.expand', 'Mở rộng')`, `t('sidebar.expand', 'Expand')`)
    .replace(`t('sidebar.logout', 'Đăng xuất tài khoản')`, `t('sidebar.logout', 'Sign Out')`);
});

// 2. TopBar.tsx
updateFile('src/components/dashboard/TopBar.tsx', (c) => {
  return c
    .replace(`t('topbar.overviewTitle', 'Tổng quan học vụ & Tiến độ')`, `t('topbar.overviewTitle', 'Academic Overview & Progress')`)
    .replace(`t('topbar.overviewSub', 'Theo dõi tổng thể học viên, mức độ rủi ro và các mốc can thiệp.')`, `t('topbar.overviewSub', 'Track students, risk levels, and intervention milestones.')`)
    .replace(`t('topbar.studentsTitle', 'Hồ sơ học viên (Student Records)')`, `t('topbar.studentsTitle', 'Student Records Directory')`)
    .replace(`t('topbar.studentsSub', 'Danh sách học viên, hạn học phí, tình trạng xếp lớp và giáo viên phụ trách.')`, `t('topbar.studentsSub', 'Student list, tuition status, enrollment, and assigned educators.')`)
    .replace(`t('topbar.careTasksTitle', 'Công việc chăm sóc học viên (HRT Tasks)')`, `t('topbar.careTasksTitle', 'HRT Care Tasks & Student Follow-up')`)
    .replace(`t('topbar.careTasksSub', 'Nhiệm vụ gọi điện, gửi báo cáo tiến độ và xử lý học phí theo đúng phân công.')`, `t('topbar.careTasksSub', 'Outbound care calls, progress reports, and tuition follow-up tasks.')`)
    .replace(`t('topbar.assessmentsTitle', 'Đánh giá năng lực Cambridge & Oxford Quality')`, `t('topbar.assessmentsTitle', 'Cambridge & Oxford Quality Skill Assessments')`)
    .replace(`t('topbar.assessmentsSub', 'Ghi nhận điểm 4 kỹ năng theo thang 5 khiên chuẩn khảo thí quốc tế.')`, `t('topbar.assessmentsSub', 'Record 4-skill evaluation on 5-shield Cambridge scale.')`)
    .replace(`t('topbar.interventionsTitle', 'Quy trình can thiệp học thuật 4 bước (Interventions)')`, `t('topbar.interventionsTitle', '4-Step Academic Intervention Workflow')`)
    .replace(`t('topbar.interventionsSub', 'Phát hiện nguy cơ, lập kế hoạch, can thiệp và Head Teacher xác minh.')`, `t('topbar.interventionsSub', 'Risk detection, action planning, supplementary intervention, and Head Teacher verification.')`)
    .replace(`t('topbar.feedbackTitle', 'Phản hồi & Khiếu nại từ Phụ huynh (Parent Feedback)')`, `t('topbar.feedbackTitle', 'Parent Feedback & Inquiry Management')`)
    .replace(`t('topbar.feedbackSub', 'Tiếp nhận, phân loại và giải quyết băn khoăn của phụ huynh theo SLA 48h.')`, `t('topbar.feedbackSub', 'Receive, categorize, and resolve parent inquiries under 48h SLA.')`)
    .replace(`t('topbar.supplementaryTitle', 'Lớp học bổ trợ học vụ (Supplementary Sessions)')`, `t('topbar.supplementaryTitle', 'Supplementary Tutoring Sessions')`)
    .replace(`t('topbar.supplementarySub', 'Tổ chức các buổi kèm 1-1 hoặc nhóm nhỏ để bù đắp kỹ năng còn yếu.')`, `t('topbar.supplementarySub', 'Organize 1-on-1 and small group tutoring to reinforce weak skills.')`)
    .replace(`t('topbar.renewalsTitle', 'Quản lý Tái tục & Cảnh báo Học phí (Renewals)')`, `t('topbar.renewalsTitle', 'Tuition Renewals & Expiry Tracker')`)
    .replace(`t('topbar.renewalsSub', 'Dự báo học phí sắp hết hạn, phân loại nguy cơ và phân công nhân sự liên hệ.')`, `t('topbar.renewalsSub', 'Forecast upcoming tuition expirations, risk classification, and outreach assignments.')`)
    .replace(`t('topbar.auditLogsTitle', 'Nhật ký tác nghiệp & Kiểm toán hệ thống (Audit Trail)')`, `t('topbar.auditLogsTitle', 'Activity & Operational Audit Trail')`)
    .replace(`t('topbar.auditLogsSub', 'Lịch sử tương tác phụ huynh, thay đổi ngày hết hạn và cấp vai trò nhân sự.')`, `t('topbar.auditLogsSub', 'Historical log of parent calls, expiry modifications, and staff permissions.')`)
    .replace(`t('topbar.branchesTitle', 'Cơ sở & Lớp học (Campuses & Classes)')`, `t('topbar.branchesTitle', 'Campuses & Classrooms')`)
    .replace(`t('topbar.branchesSub', 'Quản lý thông tin chi nhánh, cơ sở vật chất và phân bổ lớp học.')`, `t('topbar.branchesSub', 'Manage campus locations, classrooms, and schedules.')`)
    .replace(`t('topbar.staffRolesTitle', 'Phân quyền & Phê duyệt nhân sự (Staff Permissions)')`, `t('topbar.staffRolesTitle', 'Staff Roles & Permission Approvals')`)
    .replace(`t('topbar.staffRolesSub', 'Duyệt tài khoản mới đăng ký, phân bổ vai trò nghiệp vụ và phạm vi cơ sở.')`, `t('topbar.staffRolesSub', 'Review new staff registrations, assign operational roles, and campus access.')`)
    .replace(`t('topbar.selectCampus', 'Chọn chi nhánh')`, `t('topbar.selectCampus', 'Select Campus')`)
    .replace(`t('topbar.emailVerified', 'Email đã xác thực')`, `t('topbar.emailVerified', 'Email Verified')`)
    .replace(`t('topbar.emailUnverified', 'Chưa xác thực email')`, `t('topbar.emailUnverified', 'Email Unverified')`);
});

// 3. BranchesClassesView.tsx
updateFile('src/components/dashboard/BranchesClassesView.tsx', (c) => {
  return c
    .replace(`{language === 'en' ? 'Campuses' : 'Cơ sở'}`, `'Campuses'`)
    .replace(`{language === 'en' ? 'Classes' : 'Lớp học'}`, `'Classes'`)
    .replace(`{language === 'en' ? 'Active' : 'Đang chọn'}`, `'Active'`)
    .replace(`: \`Chi nhánh trong hệ thống (\${availableBranches.length})\`}`, `: \`System Campuses (\${availableBranches.length})\`}`)
    .replace(`: 'Kiến trúc đa chi nhánh tập trung, vận hành phân quyền độc lập theo từng cơ sở.'}`, `: 'Centralized multi-campus architecture with isolated campus-level role authorization.'}`)
    .replace(`{language === 'en' ? 'Classes in' : 'Lớp học tại'}`, `'Classes at'`)
    .replace(`{language === 'en' ? 'Add New Class' : 'Thêm lớp học'}`, `'Add New Class'`)
    .replace(`{language === 'en' ? 'No classes found' : 'Chưa có lớp học nào'}`, `'No classes found'`)
    .replace(`{language === 'en' ? 'Active' : 'Hoạt động'}`, `'Active'`)
    .replace(`{language === 'en' ? 'Inactive' : 'Tạm dừng'}`, `'Inactive'`);
});

// 4. CareTasksView.tsx
updateFile('src/components/dashboard/CareTasksView.tsx', (c) => {
  return c
    .replace(`// KAPLA Staff Dashboard — T03: HRT Care Tasks (Áp dụng quy tắc ưu tiên HRT riêng)`, `// KAPLA Staff Dashboard — T03: HRT Care Tasks (Enforcing Designated HRT Priority)`)
    .replace(`care_call: { label: language === 'en' ? 'Care Call' : 'Cuộc gọi chăm sóc',`, `care_call: { label: 'Care Call',`)
    .replace(`tuition_reminder: { label: language === 'en' ? 'Tuition Reminder' : 'Nhắc học phí',`, `tuition_reminder: { label: 'Tuition Reminder',`)
    .replace(`progress_report: { label: language === 'en' ? 'Progress Report' : 'Báo cáo tiến độ',`, `progress_report: { label: 'Progress Report',`)
    .replace(`presentation: { label: language === 'en' ? 'Presentation Clip' : 'Clip thuyết trình',`, `presentation: { label: 'Presentation Clip',`)
    .replace(`general_care: { label: language === 'en' ? 'General Care' : 'Chăm sóc chung',`, `general_care: { label: 'General Care',`)
    .replace(`pending: { label: language === 'en' ? 'Pending' : 'Chưa thực hiện',`, `pending: { label: 'Pending',`)
    .replace(`completed: { label: language === 'en' ? 'Completed' : 'Đã hoàn thành',`, `completed: { label: 'Completed',`)
    .replace(`cancelled: { label: language === 'en' ? 'Cancelled' : 'Đã hủy',`, `cancelled: { label: 'Cancelled',`)
    .replace(`language === 'en' ? 'Care Tasks & Student Follow-up' : 'Nhiệm vụ chăm sóc & Tương tác học viên'`, `'Care Tasks & Student Follow-up'`)
    .replace(`language === 'en' ? 'Total Tasks' : 'Tổng công việc'`, `'Total Tasks'`)
    .replace(`language === 'en' ? 'Pending' : 'Chưa xử lý'`, `'Pending'`)
    .replace(`language === 'en' ? 'Completed' : 'Hoàn thành'`, `'Completed'`)
    .replace(`language === 'en' ? 'Add New Task' : 'Thêm công việc mới'`, `'Add New Task'`)
    .replace(`language === 'en' ? 'All Task Types' : 'Tất cả loại việc'`, `'All Task Types'`)
    .replace(`language === 'en' ? 'All Statuses' : 'Tất cả trạng thái'`, `'All Statuses'`)
    .replace(`language === 'en' ? 'Loading care tasks...' : 'Đang tải danh sách công việc...'`, `'Loading care tasks...'`)
    .replace(`language === 'en' ? 'No Care Tasks Found' : 'Không có công việc nào'`, `'No Care Tasks Found'`)
    .replace(`language === 'en' ? 'Mark Completed' : 'Đánh dấu hoàn thành'`, `'Mark Completed'`)
    .replace(`language === 'en' ? 'Completed' : 'Đã xong'`, `'Completed'`);
});

// 5. ActivityLogsView.tsx
updateFile('src/components/dashboard/ActivityLogsView.tsx', (c) => {
  return c
    .replace(`{language === 'en' ? 'Activity & Operational Audit Trail' : 'Nhật ký tác nghiệp & Kiểm toán hệ thống'}`, `'Activity & Operational Audit Trail'`)
    .replace(`: \`Lịch sử theo dõi quá trình tương tác, thay đổi ngày hết hạn, phiếu can thiệp và kiểm toán quyền tại \${currentBranch?.name || 'KAPLA'}\`}`, `: \`Historical trace of parent interactions, tuition renewals, interventions, and permission audits at \${currentBranch?.name || 'KAPLA'}\`}`)
    .replace(`<span>{language === 'en' ? 'Audit Protection: Deletion Prohibited' : 'Bảo vệ nhật ký: Nghiêm cấm xóa'}</span>`, `<span>Audit Protection: Deletion Prohibited</span>`)
    .replace(`<span>{language === 'en' ? 'Export Audit' : 'Xuất dữ liệu'}</span>`, `<span>Export Audit</span>`)
    .replace(`{language === 'en' ? 'All Actions' : 'Tất cả hành động'}`, `'All Actions'`)
    .replace(`{language === 'en' ? 'All Time' : 'Toàn bộ thời gian'}`, `'All Time'`)
    .replace(`{language === 'en' ? 'Loading activity audit logs...' : 'Đang tải nhật ký tác nghiệp...'`, `'Loading activity audit logs...'`)
    .replace(`{language === 'en' ? 'No audit records found' : 'Không tìm thấy nhật ký nào phù hợp'}`, `'No audit records found'`)
    .replace(`{language === 'en' ? 'Activity Description & Metadata' : 'Nội dung chi tiết tác nghiệp'}`, `'Activity Description & Metadata'`)
    .replace(`{language === 'en' ? 'Actor' : 'Người thực hiện'}`, `'Actor'`)
    .replace(`{language === 'en' ? 'Timestamp' : 'Thời gian'}`, `'Timestamp'`)
    .replace(`{language === 'en' ? 'Campus' : 'Cơ sở'}`, `'Campus'`)
    .replace(`{language === 'en' ? 'Edit Note' : 'Chỉnh sửa ghi chú'}`, `'Edit Note'`);
});

console.log('Cleaned Sidebar, TopBar, Branches, CareTasks, ActivityLogs!');
