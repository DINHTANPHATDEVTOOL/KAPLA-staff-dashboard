import fs from 'node:fs';
import path from 'node:path';

function updateFile(relPath: string, updater: (content: string) => string) {
  const fullPath = path.resolve(relPath);
  const original = fs.readFileSync(fullPath, 'utf-8');
  const updated = updater(original);
  fs.writeFileSync(fullPath, updated, 'utf-8');
}

// 1. StudentProfileModal.tsx
updateFile('src/components/dashboard/StudentProfileModal.tsx', (c) => {
  return c
    .replace(`\${tr.from_class_name || 'Lớp cũ'} → \${tr.to_class_name || 'Lớp mới'}`, `\${tr.from_class_name || 'Previous Class'} → \${tr.to_class_name || 'New Class'}`)
    .replace(/'Đang cập nhật'/g, `'Pending update'`)
    .replace(/'Chưa ghi nhận'/g, `'None recorded'`)
    .replace(/'Chưa phân công'/g, `'Unassigned'`);
});

// 2. CareTasksView.tsx
updateFile('src/components/dashboard/CareTasksView.tsx', (c) => {
  return c
    .replace(`console.error('Lỗi tải danh sách công việc:', err);`, `console.error('Error loading care tasks:', err);`)
    .replace(`console.error('Lỗi cập nhật trạng thái task:', err);`, `console.error('Error updating task status:', err);`)
    .replace(`t('common.loading', 'Đang tải danh sách công việc...')`, `t('common.loading', 'Loading care tasks...')`);
});

// 3. FeedbackView.tsx
updateFile('src/components/dashboard/FeedbackView.tsx', (c) => {
  return c
    .replace(`// KAPLA Staff Dashboard — T04: Quản lý Phản hồi & Khiếu nại Phụ huynh`, `// KAPLA Staff Dashboard — T04: Parent Feedback & Inquiries`)
    .replace(`console.error('Lỗi tải dữ liệu phản hồi:', err);`, `console.error('Error loading feedback data:', err);`)
    .replace(`const studentName = s?.full_name || f.student?.full_name || f.parent_name || 'Học viên';`, `const studentName = s?.full_name || f.student?.full_name || f.parent_name || 'Student';`)
    .replace(`{/* Modal: Ghi nhận phản hồi mới */}`, `{/* Modal: Record New Feedback */}`)
    .replace(`{/* Modal: Cập nhật tiến độ giải quyết */}`, `{/* Modal: Update Resolution Progress */}`);
});

// 4. BranchesClassesView.tsx
updateFile('src/components/dashboard/BranchesClassesView.tsx', (c) => {
  return c
    .replace(`t('branches.colClassName', 'Tên lớp học')`, `t('branches.colClassName', 'Class Name')`)
    .replace(`t('branches.colLevel', 'Cấp độ (Level)')`, `t('branches.colLevel', 'Level')`)
    .replace(`t('branches.colDefaultHrt', 'Giáo viên chủ nhiệm (HRT mặc định)')`, `t('branches.colDefaultHrt', 'Default Homeroom Teacher (HRT)')`)
    .replace(`t('branches.colMainTeacher', 'Giáo viên chính (Main Teacher)')`, `t('branches.colMainTeacher', 'Main Teacher')`)
    .replace(`t('branches.colSchedule', 'Lịch học')`, `t('branches.colSchedule', 'Schedule')`)
    .replace(`t('branches.colStatus', 'Trạng thái')`, `t('branches.colStatus', 'Status')`)
    .replace(`cls.default_hrt_name || 'Võ Thị Tuyết Mai'`, `cls.default_hrt_name || 'Tuyết Mai'`)
    .replace(`cls.default_hrt_name || 'Tuyết Mai'`, `cls.default_hrt_name || 'Tuyet Mai'`)
    .replace(`cls.main_teacher_name.replace('Bản ngữ', 'Native')`, `cls.main_teacher_name.replace(/Bản ngữ/g, 'Native')`)
    .replace(`: (language === 'en' ? 'Teacher Alex (Native)' : 'Teacher Alex (Bản ngữ)')}`, `: 'Teacher Alex (Native)'}`);
});

// 5. AssessmentsView.tsx
updateFile('src/components/dashboard/AssessmentsView.tsx', (c) => {
  return c
    .replace(`console.error('Lỗi tải đánh giá năng lực:', err);`, `console.error('Error loading assessments:', err);`)
    .replace(`console.error('Lỗi tạo bài đánh giá:', err);`, `console.error('Error creating assessment:', err);`)
    .replace(`alert(err.message || 'Lỗi khi lưu bài đánh giá');`, `alert(err.message || 'Error saving assessment');`)
    .replace(`a.student?.full_name || 'Học viên'`, `a.student?.full_name || 'Student'`)
    .replace(`// Pending students for targetMonth (Customer Request: "lọc toàn bộ học sinh từng tháng để xem bé nào chưa được đánh giá cập nhật")`, `// Pending students for targetMonth (Customer Request: filter all students by month to view pending evaluations)`)
    .replace(/<option value="Kỳ 1 - Giữa kỳ">Kỳ 1 - Giữa kỳ<\/option>/g, `<option value="Semester 1 - Midterm">Semester 1 - Midterm</option>`)
    .replace(/<option value="Kỳ 1 - Cuối kỳ">Kỳ 1 - Cuối kỳ<\/option>/g, `<option value="Semester 1 - Final">Semester 1 - Final</option>`)
    .replace(/<option value="Kỳ 2 - Giữa kỳ">Kỳ 2 - Giữa kỳ<\/option>/g, `<option value="Semester 2 - Midterm">Semester 2 - Midterm</option>`)
    .replace(/<option value="Kỳ 2 - Cuối kỳ">Kỳ 2 - Cuối kỳ<\/option>/g, `<option value="Semester 2 - Final">Semester 2 - Final</option>`);
});

// 6. Sidebar.tsx
updateFile('src/components/dashboard/Sidebar.tsx', (c) => {
  return c
    .replace(`{ id: 'supplementary', label: t('nav.supplementary', 'Lớp học bổ trợ'), icon: BookOpenCheck },`, `{ id: 'supplementary', label: t('nav.supplementary', 'Supplementary Sessions'), icon: BookOpenCheck },`)
    .replace(`{ id: 'renewal', label: t('nav.renewal', 'Quản lý tái tục'), icon: CalendarClock },`, `{ id: 'renewal', label: t('nav.renewal', 'Renewals & Tuition'), icon: CalendarClock },`)
    .replace(`{ id: 'logs', label: t('nav.logs', 'Nhật ký tác nghiệp'), icon: History },`, `{ id: 'logs', label: t('nav.logs', 'Activity Logs'), icon: History },`)
    .replace(`label: t('nav.staff_roles', 'Nhân sự & Phân quyền'),`, `label: t('nav.staff_roles', 'Staff & Permissions'),`)
    .replace(`label: t('nav.branches_classes', 'Chi nhánh & Lớp học'),`, `label: t('nav.branches_classes', 'Campuses & Classes'),`)
    .replace(`tDb('Hệ Thống KAPLA')`, `tDb('KAPLA System')`)
    .replace(`aria-label="Đóng thanh điều hướng"`, `aria-label="Close navigation sidebar"`)
    .replace(`{profile?.full_name || 'Nhân viên KAPLA'}`, `{profile?.full_name || 'KAPLA Staff'}`)
    .replace(`? t('auth.adminRole', 'Quản trị hệ thống')`, `? t('auth.adminRole', 'System Administrator')`)
    .replace(`: activeRole || t('auth.staffRole', 'Nhân viên')}`, `: activeRole || t('auth.staffRole', 'Staff')}`)
    .replace(`title={t('auth.logout', 'Đăng xuất')}`, `title={t('auth.logout', 'Sign Out')}`);
});

// 7. SupplementaryView.tsx
updateFile('src/components/dashboard/SupplementaryView.tsx', (c) => {
  return c
    .replace(`// KAPLA Staff Dashboard — T04: Lớp Học Bổ Trợ Học Vụ (Supplementary Sessions)`, `// KAPLA Staff Dashboard — T04: Supplementary Tutoring Sessions`)
    .replace(`room: 'Phòng Oxford 201',`, `room: 'Oxford Room 201',`)
    .replace(`console.error('Lỗi tải dữ liệu lớp bổ trợ:', err);`, `console.error('Error loading supplementary data:', err);`)
    .replace(`setMessage({ type: 'error', text: 'Vui lòng nhập tên buổi học và chủ đề bài học.' });`, `setMessage({ type: 'error', text: 'Please enter session title and lesson topic.' });`)
    .replace(`setMessage({ type: 'success', text: 'Tạo buổi học bổ trợ thành công!' });`, `setMessage({ type: 'success', text: 'Created supplementary session successfully!' });`)
    .replace(`room: 'Phòng Oxford 201',`, `room: 'Oxford Room 201',`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Không thể tạo buổi bổ trợ.' });`, `setMessage({ type: 'error', text: err.message || 'Unable to create supplementary session.' });`)
    .replace(`await SupplementaryService.updateSessionStatus(session.id, 'completed', 'Hoàn tất buổi bổ trợ đúng mục tiêu.');`, `await SupplementaryService.updateSessionStatus(session.id, 'completed', 'Completed supplementary session according to targets.');`)
    .replace(`setMessage({ type: 'success', text: \`Đã đánh dấu hoàn thành buổi học: \${session.title}\` });`, `setMessage({ type: 'success', text: \`Marked session as completed: \${session.title}\` });`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Cập nhật thất bại.' });`, `setMessage({ type: 'error', text: err.message || 'Update failed.' });`)
    .replace(`{/* Modal: Tạo buổi học bổ trợ */}`, `{/* Modal: Create Supplementary Session */}`)
    .replace(`placeholder="Phòng Oxford 201"`, `placeholder="Oxford Room 201"`);
});

// 8. StaffApprovalView.tsx
updateFile('src/components/dashboard/StaffApprovalView.tsx', (c) => {
  return c
    .replace(/Đã phê duyệt tài khoản \${approvingUser\.full_name} với vai trò \${selectedRole}\./g, `Approved account \${approvingUser.full_name} with role \${selectedRole}.`)
    .replace(/availableBranches\.find\(\(b\) => b\.id === selectedBranchId\)\?\.name \|\| 'Chi nhánh'/g, `availableBranches.find((b) => b.id === selectedBranchId)?.name || 'Campus'`)
    .replace(/Đã duyệt thành công tài khoản \${approvingUser\.full_name} làm \${selectedRole} tại \${branchName}\./g, `Successfully approved account \${approvingUser.full_name} as \${selectedRole} at \${branchName}.`)
    .replace(/'Lỗi khi phê duyệt tài khoản\.'/g, `'Error approving staff account.'`)
    .replace(/Bạn có chắc chắn muốn vô hiệu hóa tài khoản của "\${target\.full_name}"\?/g, `Are you sure you want to disable the account of "\${target.full_name}"?`)
    .replace(/'Tạm ngưng quyền truy cập từ trang quản trị nhân sự\.'/g, `'Access suspended from staff administration panel.'`)
    .replace(/'Tạm ngưng quyền truy cập'/g, `'Access suspended'`)
    .replace(/'Lỗi khi vô hiệu hóa tài khoản\.'/g, `'Error disabling staff account.'`)
    .replace(/Bạn có chắc chắn muốn kích hoạt lại tài khoản của "\${target\.full_name}"\?/g, `Are you sure you want to reactivate the account of "\${target.full_name}"?`)
    .replace(/'Lỗi khi kích hoạt lại tài khoản\.'/g, `'Error reactivating staff account.'`)
    .replace(/Bạn có chắc chắn muốn XÓA VĨNH VIỄN tài khoản của "\${target\.full_name}"\? Hành động này không thể hoàn tác!/g, `Are you sure you want to PERMANENTLY DELETE the account of "\${target.full_name}"? This action cannot be undone!`)
    .replace(/'Xóa tài khoản nhân sự thành công\.'/g, `'Staff account deleted successfully.'`)
    .replace(/'Lỗi khi xóa tài khoản nhân sự\.'/g, `'Error deleting staff account.'`)
    .replace(/'Không thể phân quyền cho CM hoặc Head Teacher khác\.'/g, `'Cannot assign roles to other CM or Head Teacher.'`)
    .replace(/'SOO và Head Teacher chỉ có quyền phân công vai trò Teacher \(Lead Teacher, Teacher, Supplementary Teacher, TA\)\.'/g, `'SOO and Head Teacher can only assign Teacher roles (Lead Teacher, Teacher, Supplementary Teacher, TA).'`)
    .replace(/'Phân công vai trò giáo viên thành công\.'/g, `'Teacher role assigned successfully.'`)
    .replace(/'Phân công vai trò thất bại\.'/g, `'Role assignment failed.'`);
});

// 9. RenewalView.tsx
updateFile('src/components/dashboard/RenewalView.tsx', (c) => {
  return c
    .replace(`// KAPLA Staff Dashboard — T04 & T05: Quản lý Tái tục & Cấu hình Cảnh báo Học phí`, `// KAPLA Staff Dashboard — T04 & T05: Tuition Renewals & Warning Thresholds`)
    .replace(`label: 'Đang theo dõi',`, `label: 'Monitoring',`)
    .replace(`label: 'Đã liên hệ PH',`, `label: 'Contacted Parent',`)
    .replace(`label: 'Đã tái tục',`, `label: 'Renewed',`)
    .replace(`label: 'Dừng học / Không tái tục',`, `label: 'Dropped / Not Renewed',`)
    .replace(`high: { label: 'Rủi ro cao',`, `high: { label: 'High Risk',`)
    .replace(`medium: { label: 'Rủi ro trung bình',`, `medium: { label: 'Medium Risk',`)
    .replace(`low: { label: 'An toàn / Thấp',`, `low: { label: 'Safe / Low Risk',`)
    .replace(`console.error('Lỗi tải dữ liệu tái tục:', err);`, `console.error('Error loading renewal data:', err);`)
    .replace(`setMessage({ type: 'success', text: 'Cập nhật trạng thái chăm sóc tái tục thành công!' });`, `setMessage({ type: 'success', text: 'Updated renewal follow-up status successfully!' });`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Cập nhật thất bại.' });`, `setMessage({ type: 'error', text: err.message || 'Update failed.' });`)
    .replace(`setMessage({ type: 'success', text: 'Lưu cấu hình mốc cảnh báo học phí thành công!' });`, `setMessage({ type: 'success', text: 'Saved tuition warning configuration successfully!' });`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Không thể lưu cấu hình.' });`, `setMessage({ type: 'error', text: err.message || 'Could not save configuration.' });`)
    .replace(`{/* Modal: Ghi nhận liên hệ chăm sóc tái tục */}`, `{/* Modal: Log Renewal Outreach */}`)
    .replace(`{/* Modal: Cấu hình mốc cảnh báo (Dành cho Admin) */}`, `{/* Modal: Tuition Warning Threshold Settings (Admin Only) */}`);
});

// 10. InterventionsView.tsx
updateFile('src/components/dashboard/InterventionsView.tsx', (c) => {
  return c
    .replace(`// KAPLA Staff Dashboard — T04: Academic Interventions (Phiếu can thiệp 4 bước)`, `// KAPLA Staff Dashboard — T04: 4-Step Academic Interventions Workflow`)
    .replace(`label: '1. Mở (Open)',`, `label: '1. Open',`)
    .replace(`desc: 'Mới phát hiện nguy cơ học thuật, cần lập kế hoạch xử lý',`, `desc: 'Academic risk detected, requiring action plan',`)
    .replace(`label: '2. Đang can thiệp',`, `label: '2. In Progress',`)
    .replace(`desc: 'Đang triển khai kèm 1-1, phiếu bài tập hoặc phụ đạo chuyên sâu',`, `desc: 'Implementing 1-on-1 tutoring, worksheets, or intensive support',`)
    .replace(`label: '3. Đã tái đánh giá',`, `label: '3. Reassessed',`)
    .replace(`desc: 'Đã hoàn thành kế hoạch can thiệp, chờ Head Teacher hoặc CM duyệt',`, `desc: 'Intervention completed, awaiting Head Teacher or CM verification',`)
    .replace(`label: '4. Đã duyệt hoàn tất',`, `label: '4. Verified / Closed',`)
    .replace(`desc: 'Head Teacher hoặc CM đã ký duyệt kết quả, học viên cải thiện đạt chuẩn',`, `desc: 'Head Teacher or CM verified progress; student met required standard',`)
    .replace(`label: 'Đã hủy',`, `label: 'Cancelled',`)
    .replace(`desc: 'Học viên chuyển lớp hoặc phiếu can thiệp không còn phù hợp',`, `desc: 'Student transferred or ticket no longer applicable',`)
    .replace(`console.error('Lỗi tải phiếu can thiệp:', err);`, `console.error('Error loading intervention tickets:', err);`)
    .replace(`setMessage({ type: 'error', text: 'Vui lòng mô tả vấn đề và kế hoạch hành động.' });`, `setMessage({ type: 'error', text: 'Please describe the academic issue and action plan.' });`)
    .replace(`setMessage({ type: 'success', text: 'Tạo phiếu can thiệp học thuật thành công!' });`, `setMessage({ type: 'success', text: 'Created academic intervention ticket successfully!' });`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Không thể tạo phiếu can thiệp.' });`, `setMessage({ type: 'error', text: err.message || 'Could not create intervention ticket.' });`)
    .replace(`setMessage({ type: 'success', text: 'Cập nhật tiến độ can thiệp thành công!' });`, `setMessage({ type: 'success', text: 'Updated intervention progress successfully!' });`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Cập nhật thất bại.' });`, `setMessage({ type: 'error', text: err.message || 'Update failed.' });`)
    .replace(`setMessage({ type: 'success', text: 'Head Teacher / CM đã duyệt xác minh thành công phiếu can thiệp!' });`, `setMessage({ type: 'success', text: 'Head Teacher / CM verified intervention ticket successfully!' });`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Xác minh thất bại.' });`, `setMessage({ type: 'error', text: err.message || 'Verification failed.' });`)
    .replace(`{/* Modal: Tạo phiếu can thiệp mới */}`, `{/* Modal: Create Academic Intervention Ticket */}`)
    .replace(`{/* Modal: Cập nhật tiến độ can thiệp */}`, `{/* Modal: Update Intervention Progress */}`)
    .replace(`{/* Modal: Head Teacher / CM Ký duyệt xác minh */}`, `{/* Modal: Head Teacher / CM Verification Sign-off */}`);
});

// 11. TopBar.tsx
updateFile('src/components/dashboard/TopBar.tsx', (c) => {
  return c
    .replace(`subtitle: t('topbar.studentsSub', 'Quản lý thông tin học tập, phân công HRT và hạn phí học viên.'),`, `subtitle: t('topbar.studentsSub', 'Manage student records, HRT assignments, and tuition expiry.'),`)
    .replace(`title: t('topbar.careTasksTitle', 'Công việc HRT (Care Worklist)'),`, `title: t('topbar.careTasksTitle', 'HRT Care Tasks & Worklist'),`)
    .replace(`subtitle: t('topbar.careTasksSub', 'Nhiệm vụ chăm sóc học viên theo quy tắc ưu tiên HRT riêng.'),`, `subtitle: t('topbar.careTasksSub', 'Student care follow-up enforcing designated HRT priority.'),`)
    .replace(`title: t('topbar.assessmentsTitle', 'Đánh giá năng lực 4 kỹ năng'),`, `title: t('topbar.assessmentsTitle', '4-Skill Competency Assessments'),`)
    .replace(`subtitle: t('topbar.assessmentsSub', 'Ghi nhận Nghe - Nói - Đọc - Viết theo chuẩn Cambridge & Oxford Quality.'),`, `subtitle: t('topbar.assessmentsSub', 'Evaluate Listening, Speaking, Reading, Writing on Cambridge & Oxford scales.'),`)
    .replace(`title: t('topbar.interventionsTitle', 'Phiếu can thiệp học thuật (Academic Interventions)'),`, `title: t('topbar.interventionsTitle', 'Academic Interventions & Care Plans'),`)
    .replace(`subtitle: t('topbar.interventionsSub', 'Theo dõi kế hoạch khắc phục, hạn xử lý và xác minh kết quả.'),`, `subtitle: t('topbar.interventionsSub', 'Track remediation plans, deadlines, and Head Teacher verification sign-offs.'),`)
    .replace(`title: t('topbar.feedbackTitle', 'Phản hồi & Kỳ vọng phụ huynh (Parent Feedback)'),`, `title: t('topbar.feedbackTitle', 'Parent Inquiries & Feedback'),`)
    .replace(`subtitle: t('topbar.feedbackSub', 'Ghi nhận và điều phối giải quyết khiếu nại, góp ý từ phụ huynh.'),`, `subtitle: t('topbar.feedbackSub', 'Receive, categorize, and resolve parent inquiries under 48h SLA.'),`)
    .replace(`title: t('topbar.supplementaryTitle', 'Lớp học bổ trợ (Supplementary Tutoring)'),`, `title: t('topbar.supplementaryTitle', 'Supplementary Tutoring Sessions'),`)
    .replace(`subtitle: t('topbar.supplementarySub', 'Theo dõi điểm danh, nội dung bổ trợ và nhận xét sự tiến bộ.'),`, `subtitle: t('topbar.supplementarySub', 'Track tutoring attendance, session topics, and progress evaluations.'),`)
    .replace(`title: t('topbar.renewalTitle', 'Quản lý tái tục & Rủi ro học phí'),`, `title: t('topbar.renewalTitle', 'Tuition Renewals & Risk Management'),`)
    .replace(`subtitle: t('topbar.renewalSub', 'Cảnh báo hạn tái tục, hỗ trợ chăm sóc phụ huynh trước hạn.'),`, `subtitle: t('topbar.renewalSub', 'Forecast upcoming expirations and manage proactive parent outreach.'),`)
    .replace(`title: t('topbar.staffRolesTitle', 'Quản trị nhân sự & Phân quyền'),`, `title: t('topbar.staffRolesTitle', 'Staff Roles & Permission Approvals'),`)
    .replace(`subtitle: t('topbar.staffRolesSub', 'Phê duyệt tài khoản mới, phân bổ vai trò và chi nhánh công tác.'),`, `subtitle: t('topbar.staffRolesSub', 'Review staff registrations, assign roles, and configure campus access.'),`)
    .replace(`title: t('topbar.branchesClassesTitle', 'Chi nhánh & Danh sách lớp học'),`, `title: t('topbar.branchesClassesTitle', 'Campuses & Classrooms'),`)
    .replace(`subtitle: t('topbar.branchesClassesSub', 'Cấu hình chi nhánh hoạt động và thiết lập phân công lớp.'),`, `subtitle: t('topbar.branchesClassesSub', 'Manage campus locations, classrooms, and schedules.'),`)
    .replace(`title: t('topbar.logsTitle', 'Nhật ký tác nghiệp (Activity Logs)'),`, `title: t('topbar.logsTitle', 'Activity & Audit Trail'),`)
    .replace(`subtitle: t('topbar.logsSub', 'Lịch sử tương tác giữa các bộ phận chuyên môn và học viên.'),`, `subtitle: t('topbar.logsSub', 'Historical trace of operational actions and student interactions.'),`)
    .replace(`subtitle: t('brand.portalSubtitle', 'Hệ thống quản lý đào tạo & chăm sóc học viên'),`, `subtitle: t('brand.portalSubtitle', 'Academic Administration & Staff Operations Portal'),`)
    .replace(`aria-label="Mở menu"`, `aria-label="Open menu"`)
    .replace(`{currentBranch ? tDb(currentBranch.name) : t('topbar.selectBranch', 'Chọn chi nhánh')}`, `{currentBranch ? tDb(currentBranch.name) : t('topbar.selectBranch', 'Select Campus')}`)
    .replace(`{isSystemAdmin ? t('topbar.systemBranches', 'Chi nhánh toàn hệ thống') : t('topbar.assignedBranches', 'Chi nhánh phân bổ')}`, `{isSystemAdmin ? t('topbar.systemBranches', 'All System Campuses') : t('topbar.assignedBranches', 'Assigned Campus')}`)
    .replace(`title={language === 'en' ? 'Assigned Operating Campus' : 'Cơ sở công tác được phân bổ'}`, `title="Assigned Operating Campus"`)
    .replace(`{currentBranch ? tDb(currentBranch.name) : (language === 'en' ? 'Campus' : 'Chi nhánh')}`, `{currentBranch ? tDb(currentBranch.name) : 'Campus'}`)
    .replace(`title={t('topbar.refreshData', 'Làm mới dữ liệu')}`, `title={t('topbar.refreshData', 'Refresh Data')}`)
    .replace(`{t('topbar.emailVerified', '● Email đã xác thực')}`, `{t('topbar.emailVerified', '● Email Verified')}`)
    .replace(`<span>{t('topbar.refreshData', 'Làm mới phiên làm việc')}</span>`, `<span>{t('topbar.refreshData', 'Refresh Session')}</span>`)
    .replace(`<span>{t('auth.logout', 'Đăng xuất')}</span>`, `<span>{t('auth.logout', 'Sign Out')}</span>`);
});

// 12. StudentListView.tsx
updateFile('src/components/dashboard/StudentListView.tsx', (c) => {
  return c
    .replace(`console.error('Lỗi tải dữ liệu học viên:', err);`, `console.error('Error loading student records:', err);`)
    .replace(`setActionMessage({ type: 'success', text: 'Thêm học viên mới thành công!' });`, `setActionMessage({ type: 'success', text: 'New student added successfully!' });`)
    .replace(`setActionMessage({ type: 'error', text: err.message || 'Thêm học viên thất bại' });`, `setActionMessage({ type: 'error', text: err.message || 'Failed to add student' });`)
    .replace(/Chuyển lớp cho học viên \${selectedStudentForTransfer\.full_name} thành công!/g, `Transferred class for student \${selectedStudentForTransfer.full_name} successfully!`)
    .replace(/'Chuyển lớp thất bại'/g, `'Failed to transfer class'`)
    .replace(`text: targetHrtId ? 'Phân công HRT riêng thành công!' : 'Đã hủy HRT riêng, học viên quay về HRT mặc định của lớp.',`, `text: targetHrtId ? 'Designated HRT assigned successfully!' : 'Designated HRT cancelled, reverted to class default HRT.',`)
    .replace(`setActionMessage({ type: 'error', text: err.message || 'Phân công HRT thất bại' });`, `setActionMessage({ type: 'error', text: err.message || 'Failed to assign HRT' });`)
    .replace(`text: err?.message || 'Lỗi khi cập nhật học viên.',`, `text: err?.message || 'Error updating student record.',`)
    .replace(`"cái lọc thời gian đâu anh", "lọc toàn bộ học sinh từng tháng để xem bé nào chưa được đánh giá"`, `CRM date dropdown & monthly assessment tracker`)
    .replace(`{/* Month Selector (Từng tháng - Image 2) */}`, `{/* Month Selector (Monthly Filter) */}`)
    .replace(`{/* Row 3: Assessment Status Quick Filter Chips (Customer image 2: "xem bé nào chưa được đánh giá") */}`, `{/* Row 3: Assessment Status Quick Filter Chips */}`)
    .replace(`t('common.loading', 'Đang tải danh sách học viên...')`, `t('common.loading', 'Loading student records...')`)
    .replace(`t('common.noData', 'Không có học viên nào phù hợp')`, `t('common.noData', 'No matching student records found')`)
    .replace(`title="Chuyển lớp cho học viên"`, `title="Transfer student class"`)
    .replace(`title="Phân công hoặc đổi HRT riêng"`, `title="Assign or change designated HRT"`)
    .replace(`title="Xem lịch sử chuyển lớp"`, `title="View transfer history"`)
    .replace(`MODAL: THÊM HỌC VIÊN MỚI (NHẬP TAY)`, `MODAL: ADD NEW STUDENT`)
    .replace(`placeholder="VD: Nguyễn Văn Anh"`, `placeholder="E.g., Alexander William"`)
    .replace(`MODAL: CHUYỂN LỚP HỌC VIÊN`, `MODAL: TRANSFER STUDENT CLASS`)
    .replace(`MODAL: PHÂN CÔNG HRT RIÊNG`, `MODAL: ASSIGN DESIGNATED HRT`)
    .replace(`MODAL: LỊCH SỬ CHUYỂN LỚP`, `MODAL: TRANSFER HISTORY`)
    .replace(`{/* Monthly Assessment Status (Image 2 style: "xem bé nào chưa được đánh giá") */}`, `{/* Monthly Assessment Status */}`);
});

// 13. OverviewView.tsx
updateFile('src/components/dashboard/OverviewView.tsx', (c) => {
  return c
    .replace(`student: 'Nguyễn Minh Khang',`, `student: 'Nguyen Minh Khang',`)
    .replace(`actionVi: 'Đã hoàn thành buổi can thiệp phát âm cùng Lead Teacher Sarah',`, `actionVi: 'Completed pronunciation intervention with Lead Teacher Sarah',`)
    .replace(`timeVi: '15 phút trước',`, `timeVi: '15m ago',`)
    .replace(`badgeVi: 'Học vụ hoàn tất',`, `badgeVi: 'Academic Done',`)
    .replace(`student: 'Lê Bảo Nam',`, `student: 'Le Bao Nam',`)
    .replace(`actionVi: 'HRT Mai đã ghi nhận cuộc gọi PH: Phụ huynh đồng thuận kế hoạch bồi dưỡng ngữ điệu 1:1',`, `actionVi: 'HRT Mai recorded parent call: Parent agreed on 1:1 intonation tutoring',`)
    .replace(`timeVi: '42 phút trước',`, `timeVi: '42m ago',`)
    .replace(`badgeVi: 'Chăm sóc PH',`, `badgeVi: 'Parent Care',`)
    .replace(`student: 'Đỗ Hải Đăng',`, `student: 'Do Hai Dang',`)
    .replace(`actionVi: 'CM Trần Hoàng đã ký duyệt phiếu can thiệp HT-2026-004 (Đã tái đánh giá đạt)',`, `actionVi: 'CM Tran Hoang signed off on intervention ticket HT-2026-004 (Reassessment Passed)',`)
    .replace(`timeVi: '2 giờ trước',`, `timeVi: '2h ago',`)
    .replace(`badgeVi: 'CM Duyệt',`, `badgeVi: 'CM Approved',`)
    .replace(`student: 'Hoàng Anh Thư',`, `student: 'Hoang Anh Thu',`)
    .replace(`actionVi: 'Gia hạn thành công gói học phí 6 tháng — Trạng thái: Đã tái tục niên khóa mới',`, `actionVi: 'Successfully renewed 6-month tuition package — Status: Renewed for new term',`)
    .replace(`timeVi: 'Hôm nay, 09:30',`, `timeVi: 'Today, 09:30',`)
    .replace(`badgeVi: 'Tái tục thành công',`, `badgeVi: 'Renewal Success',`)
    .replace(`{t('overview.campusHeroStatus', 'Cơ sở chuẩn Oxford Quality • Đang vận hành')}`, `{t('overview.campusHeroStatus', 'Oxford Quality Campus • Operational')}`)
    .replace(`<span>{t('overview.campusHeroAttendance', 'Chuyên cần: 96.8%')}</span>`, `<span>{t('overview.campusHeroAttendance', 'Attendance: 96.8%')}</span>`)
    .replace(`<span>{t('overview.campusHeroSatisfaction', 'Hài lòng: 4.9/5.0')}</span>`, `<span>{t('overview.campusHeroSatisfaction', 'Satisfaction: 4.9/5.0')}</span>`)
    .replace(`{t('overview.kpiStudents', 'Tổng học viên theo dõi')}`, `{t('overview.kpiStudents', 'Total Tracked Students')}`)
    .replace(`{t('overview.kpiInterventions', 'Rủi ro học thuật cần can thiệp')}`, `{t('overview.kpiInterventions', 'Academic Risk Requiring Intervention')}`)
    .replace(`{t('overview.kpiInterventionsBadge', 'Cần xác minh')}`, `{t('overview.kpiInterventionsBadge', 'Needs Verification')}`)
    .replace(`{t('overview.kpiFeedback', 'Phản hồi phụ huynh đang mở')}`, `{t('overview.kpiFeedback', 'Open Parent Feedback')}`)
    .replace(`{t('overview.kpiFeedbackBadge', 'Rèn luyện phát âm Oxford')}`, `{t('overview.kpiFeedbackBadge', 'Oxford Pronunciation')}`)
    .replace(`{t('overview.kpiRenewal', 'Học phí sắp hết hạn')}`, `{t('overview.kpiRenewal', 'Expiring Tuition')}`)
    .replace(`{t('overview.kpiRenewalBadge', 'Chăm sóc gia hạn khóa')}`, `{t('overview.kpiRenewalBadge', 'Renewal Outreach')}`)
    .replace(`{t('overview.quickActionsTitle', 'Tác vụ tác nghiệp học vụ nhanh')}`, `{t('overview.quickActionsTitle', 'Quick Academic Actions')}`)
    .replace(`{t('overview.quickActionsSub', 'Truy cập tức thì các quy trình chăm sóc và can thiệp chuyên môn')}`, `{t('overview.quickActionsSub', 'Instant access to care workflows and specialized academic interventions')}`)
    .replace(`{t('overview.quickActionIntervention', 'Lập kế hoạch can thiệp học thuật')}`, `{t('overview.quickActionIntervention', 'Plan Academic Intervention')}`)
    .replace(`{t('overview.quickActionInterventionDesc', 'Mở phiếu hỗ trợ học sinh có nguy cơ học vụ và giao giáo viên phụ đạo.')}`, `{t('overview.quickActionInterventionDesc', 'Open support tickets for academic risk students and assign tutoring teachers.')}`)
    .replace(`{t('overview.quickActionTutoring', 'Lên lịch phụ đạo 1:1 chuyên sâu')}`, `{t('overview.quickActionTutoring', 'Schedule 1-on-1 Tutoring')}`)
    .replace(`{t('overview.quickActionTutoringDesc', 'Bổ trợ phát âm Oxford, ngữ điệu và phản xạ giao tiếp cho học viên.')}`, `{t('overview.quickActionTutoringDesc', 'Reinforce Oxford pronunciation, intonation, and conversational reflexes.')}`)
    .replace(`{t('overview.quickActionFeedback', 'Ghi nhận phản hồi phụ huynh')}`, `{t('overview.quickActionFeedback', 'Record Parent Feedback')}`)
    .replace(`{t('overview.quickActionFeedbackDesc', 'Tiếp nhận nguyện vọng, đồng hành cùng gia đình và xử lý phản hồi kịp thời.')}`, `{t('overview.quickActionFeedbackDesc', 'Receive parent aspirations, partner with families, and resolve issues promptly.')}`)
    .replace(`{t('overview.activityFeedTitle', 'Nhật ký tác nghiệp học thuật thời gian thực')}`, `{t('overview.activityFeedTitle', 'Real-Time Academic Activity Feed')}`)
    .replace(`{t('overview.activityFeedSub', 'Cập nhật trực tiếp tiến độ can thiệp, phụ đạo và chăm sóc phụ huynh tại cơ sở')}`, `{t('overview.activityFeedSub', 'Live campus updates on interventions, supplementary tutoring, and parent care')}`)
    .replace(`{t('overview.activityFeedBadge', 'Hôm nay')}`, `{t('overview.activityFeedBadge', 'Today')}`);
});

console.log('Successfully cleaned all remaining dashboard views!');
