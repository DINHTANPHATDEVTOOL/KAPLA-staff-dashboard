import fs from 'node:fs';
import path from 'node:path';

function updateFile(relPath: string, updater: (content: string) => string) {
  const fullPath = path.resolve(relPath);
  const original = fs.readFileSync(fullPath, 'utf-8');
  const updated = updater(original);
  fs.writeFileSync(fullPath, updated, 'utf-8');
}

// 1. BranchesClassesView.tsx
updateFile('src/components/dashboard/BranchesClassesView.tsx', (c) => {
  return c.replace(
    `? (language === 'en' ? cls.main_teacher_name.replace(/Bản ngữ/g, 'Native') : cls.main_teacher_name)`,
    `? cls.main_teacher_name`
  );
});

// 2. InterventionsView.tsx
updateFile('src/components/dashboard/InterventionsView.tsx', (c) => {
  return c
    .replace(`label: '2. Đang xử lý (In Progress)',`, `label: '2. In Progress',`)
    .replace(`desc: 'Đang triển khai các buổi kèm bổ trợ học thuật',`, `desc: 'Conducting supplementary tutoring sessions',`)
    .replace(`label: '3. Đã xử lý (Resolved)',`, `label: '3. Resolved',`)
    .replace(`desc: 'Đã hoàn tất bổ trợ và có kết quả đánh giá lại, chờ xác minh',`, `desc: 'Supplementary sessions completed with reassessment results, awaiting verification',`)
    .replace(`label: '4. Đã xác minh (Verified)',`, `label: '4. Verified',`)
    .replace(`desc: 'Đã được Head Teacher hoặc CM phê duyệt đạt chuẩn',`, `desc: 'Approved and verified to standard by Head Teacher or CM',`)
    .replace(`setActionAlert({ type: 'success', text: 'Tạo phiếu can thiệp học thuật thành công!' });`, `setActionAlert({ type: 'success', text: 'Academic intervention ticket created successfully!' });`)
    .replace(`setActionAlert({ type: 'error', text: err.message || 'Lỗi khi tạo phiếu' });`, `setActionAlert({ type: 'error', text: err.message || 'Error creating ticket' });`)
    .replace(`alert(err.message || 'Lỗi cập nhật');`, `alert(err.message || 'Update error');`)
    .replace(`setActionAlert({ type: 'success', text: 'Đã hoàn tất can thiệp và nộp kết quả đánh giá lại!' });`, `setActionAlert({ type: 'success', text: 'Intervention completed and reassessment submitted!' });`)
    .replace(`setActionAlert({ type: 'error', text: err.message || 'Lỗi cập nhật' });`, `setActionAlert({ type: 'error', text: err.message || 'Update error' });`)
    .replace(`setActionAlert({ type: 'success', text: 'Đã xác minh phiếu can thiệp học thuật thành công!' });`, `setActionAlert({ type: 'success', text: 'Academic intervention ticket verified successfully!' });`)
    .replace(`setActionAlert({ type: 'error', text: err.message || 'Lỗi xác minh' });`, `setActionAlert({ type: 'error', text: err.message || 'Verification error' });`)
    .replace(`{/* Modal Tạo Phiếu Can Thiệp */}`, `{/* Modal: Create Intervention Ticket */}`)
    .replace(`{/* Modal Nộp Kết Quả Đánh Giá Lại (Resolved) */}`, `{/* Modal: Submit Reassessment (Resolved) */}`)
    .replace(`{/* Modal Xác Minh (Verified) Dành Riêng Cho Head Teacher / CM */}`, `{/* Modal: Head Teacher / CM Verification Sign-off */}`);
});

// 3. RenewalView.tsx
updateFile('src/components/dashboard/RenewalView.tsx', (c) => {
  return c
    .replace(`committed: { label: 'Phụ huynh đã chốt', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },`, `committed: { label: 'Committed by Parent', color: 'text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200' },`)
    .replace(`renewed: { label: 'Đã tái tục thành công', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },`, `renewed: { label: 'Successfully Renewed', color: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },`)
    .replace(`medium: { label: 'Trung bình', badge: 'bg-amber-100 text-amber-800 border-amber-300' },`, `medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-800 border-amber-300' },`)
    .replace(`low: { label: 'Thấp', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },`, `low: { label: 'Low', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' },`)
    .replace(/Đã cập nhật ngưỡng cảnh báo học phí thành công: \${adminDaysThreshold} ngày \(Áp dụng đồng bộ cho Dashboard & Tác vụ Email\)!/g, `Updated tuition warning threshold successfully: \${adminDaysThreshold} days (Applied across Dashboard & Email alerts)!`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Không thể cập nhật cấu hình.' });`, `setMessage({ type: 'error', text: err.message || 'Could not update configuration.' });`)
    .replace(/Đã tìm thấy người nhận dự kiến: Tìm thấy \${results\.length} học viên trong cửa sổ nhắc trước hạn \(từ hôm nay đến \${config\.tuition_warning_days_threshold} ngày tới\)\. Toàn bộ thông báo sẽ được chuyển đến đúng HRT phụ trách!/g, `Found expected recipients: \${results.length} students in warning window. Alerts routed to assigned HRT!`)
    .replace(`setMessage({ type: 'error', text: err.message || 'Không thể kiểm tra tác vụ email.' });`, `setMessage({ type: 'error', text: err.message || 'Could not test email tasks.' });`)
    .replace(`setMessage({ type: 'success', text: 'Cập nhật tiến trình tái tục thành công!' });`, `setMessage({ type: 'success', text: 'Updated renewal progress successfully!' });`)
    .replace(`{/* Modal: Cập nhật tiến trình tái tục */}`, `{/* Modal: Update Renewal Progress */}`);
});

// 4. StaffApprovalView.tsx
updateFile('src/components/dashboard/StaffApprovalView.tsx', (c) => {
  return c
    .replace(`details: { reason: 'Vô hiệu hóa tài khoản' },`, `details: { reason: 'Account disabled' },`)
    .replace(/Đã vô hiệu hóa tài khoản \${target\.full_name}\./g, `Disabled account \${target.full_name}.`)
    .replace(`text: err?.message || 'Lỗi khi tạo nhân sự mới.',`, `text: err?.message || 'Error creating new staff member.',`)
    .replace(`text: err?.message || 'Lỗi khi cập nhật nhân sự.',`, `text: err?.message || 'Error updating staff member.',`)
    .replace(`text: err?.message || 'Lỗi khi xóa nhân sự.',`, `text: err?.message || 'Error deleting staff member.',`)
    .replace(`MODAL: THÊM NHÂN SỰ MỚI (ADD STAFF MEMBER)`, `MODAL: ADD NEW STAFF MEMBER`)
    .replace(`MODAL: CHỈNH SỬA THÔNG TIN NHÂN SỰ (EDIT STAFF MEMBER)`, `MODAL: EDIT STAFF MEMBER`)
    .replace(`MODAL: XÁC NHẬN XÓA TÀI KHOẢN (CONFIRM DELETE STAFF)`, `MODAL: CONFIRM DELETE STAFF`);
});

// 5. StudentListView.tsx
updateFile('src/components/dashboard/StudentListView.tsx', (c) => {
  return c
    .replace(`// Month & Date Filtering (Customer Request: "lọc toàn bộ học sinh từng tháng để xem bé nào chưa được đánh giá")`, `// Month & Date Filtering (Customer Request: filter all students by month to view pending evaluations)`)
    .replace(`// Monthly stats for the selected month (Image 2: "mục đích lọc là từng tháng để xem bé nào chưa được đánh giá")`, `// Monthly stats for the selected month (Customer Request: filter by month to view pending assessments)`)
    .replace(`// 7. Monthly Assessment Status Filter (Image 2: "xem bé nào chưa được đánh giá")`, `// 7. Monthly Assessment Status Filter (View students not assessed yet)`)
    .replace(`// Customer Requirement: "case nào mới update là sẽ cập nhật lên đầu tiên"`, `// Customer Requirement: Newly updated cases float to top`)
    .replace(`MODAL: CHỈNH SỬA THÔNG TIN HỌC VIÊN (EDIT STUDENT)`, `MODAL: EDIT STUDENT PROFILE`)
    .replace(`MODAL: XÁC NHẬN XÓA HỌC VIÊN (CONFIRM DELETE STUDENT)`, `MODAL: CONFIRM DELETE STUDENT`)
    .replace(`MODAL: XEM HỒ SƠ TOÀN DIỆN & LOGCALL (STUDENT PROFILE MODAL)`, `MODAL: VIEW COMPREHENSIVE STUDENT PROFILE`);
});

console.log('Cleaned last 42 lines!');
