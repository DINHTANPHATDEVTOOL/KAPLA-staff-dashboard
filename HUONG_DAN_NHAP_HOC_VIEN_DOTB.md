# HƯỚNG DẪN TÍNH NĂNG THÊM HỌC VIÊN & NHẬP TỪ SHEET THEO LỚP
*(Dành cho Giám đốc cơ sở CM Phương Nhi, Quản nhiệm HRT & Nhân viên Học vụ KAPLA)*

---

## 🎯 1. TỔNG QUAN NÂNG CẤP THEO PHẢN HỒI CỦA CM PHƯƠNG NHI

Dựa trên trao đổi thực tế với **CM Phương Nhi** về việc dữ liệu học sinh được xuất từ phần mềm **CRM DotB** ra file Google Sheets/Excel theo từng lớp:
1. **Form thêm 1 học viên (Single Add)**:
   - ✅ Rút gọn tối đa: Chỉ yêu cầu **Tên bé** (Họ và tên) và **Nickname** (Tên gọi tiếng Anh ở lớp: *Leo, Jenny, Alex, Tom, Chloe...*).
   - ✅ **Bỏ bắt buộc** Tên phụ huynh và Số điện thoại phụ huynh (thu gọn vào mục tùy chọn mở rộng nếu cần).
   - ✅ **Tự động sinh mã học viên**: Tự động đánh số theo cơ sở (VD: `KAP-PH-008`, `KAP-PH-009`, `KAP-PH-010`...) không cần gõ tay.
   - ✅ Hạn học phí tự động mặc định +6 tháng.

2. **Tính năng mới: Nhập hàng loạt từ Sheet theo lớp (Bulk Import from Sheet)**:
   - ✅ Hỗ trợ copy & dán trực tiếp danh sách học viên từ **Google Sheets / Excel** tải từ DotB CRM.
   - ✅ Chọn lớp học đích cần nhập (VD: `PH-Starters-01`, `PH-Movers-02`...).
   - ✅ Bộ phân tích thông minh: Tự động tách cột theo phím **Tab** (chuẩn copy từ Excel) hoặc dấu phẩy, tự động bỏ qua dòng tiêu đề (*Họ và tên, Nickname, STT...*).
   - ✅ **Bảng xem trước trực quan (Live Preview)**: Kiểm tra danh sách, mã số tự sinh, tên bé, nickname và nút xóa dòng thừa trước khi nhập.
   - ✅ Nút **"Thử dữ liệu mẫu (5 bé)"** giúp CM kiểm tra nhanh chỉ với 1 click.
   - ✅ **1-Click Hoàn tất**: Tự động tạo hồ sơ học viên, tạo danh sách lớp (Class Enrollment), tự sinh cảnh báo học phí và chuyển hướng ngay tới lớp vừa nhập.

3. **Hiển thị & Tìm kiếm theo Nickname trên toàn hệ thống**:
   - ✅ Danh sách học viên hiển thị rõ: **`Nguyễn Minh Khôi`** `[Leo]`.
   - ✅ Ô tìm kiếm hỗ trợ gõ cả Tên tiếng Việt lẫn **Nickname tiếng Anh** (Gõ "Leo" là ra ngay).
   - ✅ Hồ sơ chi tiết học viên (Student Profile) hiển thị nổi bật Nickname.

---

## 📋 2. HƯỚNG DẪN THAO TÁC TRÊN GIAO DIỆN WEB

### Cách 1: Thêm 1 học viên nhanh (Single Student)
1. Truy cập mục **Học viên (Student Directory)**: [https://kapla.io.vn/](https://kapla.io.vn/) (hoặc chạy local [http://localhost:3000/](http://localhost:3000/)).
2. Nhấn nút xanh **`+ Add New Student`** ở góc phải trên.
3. Nhập 2 thông tin cơ bản:
   - **Tên bé (Họ và tên) \***: VD `Nguyễn Gia Hân`
   - **Nickname**: VD `Jenny`
4. Chọn Lớp học (hệ thống tự sinh mã học viên, VD `KAP-PH-010`).
5. Nhấn **`Lưu hồ sơ học viên`** ➔ Hoàn tất!

---

### Cách 2: Nhập danh sách cả lớp từ Google Sheets / Excel (Bulk Import)
1. Tại màn hình danh sách học viên, nhấn nút **`Nhập từ Sheet theo lớp`** (icon bảng tính màu xanh lá).
2. **Bước 1: Chọn lớp học đích**: Chọn lớp mà CM muốn đưa học viên vào (VD: `PH-Starters-01 (Starters)`).
3. **Bước 2: Copy & Dán dữ liệu từ Sheet**:
   - Mở file Sheet đã tải từ DotB CRM.
   - Bôi đen 2 cột: **Tên bé** và **Nickname**.
   - Nhấn `Ctrl + C` (Copy) và nhấn `Ctrl + V` (Dán) vào ô nhập liệu.
   - *(Hoặc nhấn nút **"Thử dữ liệu mẫu (5 bé)"** để trải nghiệm ngay).*
4. **Bước 3: Kiểm tra bảng xem trước (Live Preview)**:
   - Hệ thống hiển thị ngay danh sách các bé được bóc tách kèm mã học viên tự sinh.
   - Nếu có dòng tiêu đề hoặc dòng trống thừa, có thể nhấn nút thùng rác đỏ để bỏ.
5. **Bước 4: Xác nhận**:
   - Chọn thời hạn học phí mặc định (3 tháng / 6 tháng / 12 tháng).
   - Nhấn nút xanh lá **`Nhập [N] học viên vào lớp`**.
   - Hệ thống lưu toàn bộ vào hệ thống và tự động lọc danh sách về lớp vừa nhập để CM kiểm tra ngay lập tức!

---

## 📂 3. CÁC TẬP TIN ĐÃ ĐƯỢC ĐÓNG GÓI & CẬP NHẬT

- Mã nguồn đã được commit & push trực tiếp lên nhánh chính: **`origin/main`** (commit `09b3969`).
- File nén cài đặt hoàn chỉnh trên Desktop: **`/home/rd/Desktop/kapla_dist.zip`**.
- File hướng dẫn lưu tại: **`/home/rd/Desktop/HUONG_DAN_NHAP_HOC_VIEN_DOTB.md`**.
