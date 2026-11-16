# HƯỚNG DẪN KIỂM THỬ HỆ THỐNG EMAIL TỰ ĐỘNG KAPLA
### Dành cho người dùng & Nhân viên vận hành — Thao tác 100% trên giao diện Web (Không chạm API Key hay Code)

---

## 🎯 Giới Thiệu Chung
Hệ thống **KAPLA Operations Dashboard** đã được tích hợp sẵn cổng gửi Transactional Email tự động chuẩn doanh nghiệp:
- **Người gửi định danh chính thức**: `KAPLA Operations <no-reply@kapla.io.vn>` (kèm cổng dự phòng Google SMTP `kapladashboard@gmail.com`).
- **Bộ nhận diện thương hiệu cao cấp**: 100% thiết kế chuẩn KAPLA, Logo màu sắc nét, bảng màu Deep Navy (`#012147`) & Electric Blue (`#026fd7`), font chữ tương phản cao đạt chuẩn WCAG AAA.
- **Biểu tượng Vector SVG độc quyền**: Toàn bộ icon trong email được vẽ bằng mã vector SVG sắc nét (huy hiệu bảo mật, đồng hồ SLA, khiên chứng nhận, thẻ thanh toán...), hoàn toàn không dùng emoji mặc định của hệ điều hành.
- **100% tiếng Anh học thuật**: Phù hợp tiêu chuẩn trường học quốc tế.
- **Thông tin liên hệ chuẩn**: Hotline chính thức **`028 7108 8899`**, Hỗ trợ `contact@kapla.edu.vn`, Website `kapla.edu.vn`, Cơ sở Tầng trệt & Lửng, Tòa nhà Topaz Elite, Quận 8, TP.HCM.

> [!NOTE]
> **Người dùng không cần cấu hình bất kỳ API Key, mật khẩu ứng dụng hay mã nguồn nào.** Toàn bộ các bước kiểm thử bên dưới chỉ cần nhấp chuột trực tiếp trên giao diện website.

---

## 📋 Danh Sách Tài Khoản Dùng Thử Nhanh

Bạn có thể đăng nhập bằng một trong các tài khoản quản lý sau để kiểm thử (tất cả đều chung mật khẩu: `Kapla@2026`):

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích kiểm thử tốt nhất |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@kapla.edu.vn` | `Kapla@2026` | Toàn quyền kiểm thử Trung tâm Email, gửi test tự do |
| **Giám đốc cơ sở (CM)** | `cm.nhi@kapla.edu.vn` | `Kapla@2026` | Nhận & duyệt email can thiệp học thuật, thông báo chung |
| **Trưởng bộ môn (HT)** | `ht.jamie@kapla.edu.vn` | `Kapla@2026` | Kiểm tra email bổ trợ học tập, nhắc lịch học viên |
| **Quản nhiệm (HRT Trâm)** | `hrt.tram@kapla.edu.vn` | `Kapla@2026` | Gửi email tái tục học phí, giải quyết phản hồi phụ huynh |

---

## 🚀 CÁCH 1: Gửi Một Email Thử Nghiệm Ngay Lập Tức (Nhanh nhất — 30 Giây)

Đây là cách trực quan và nhanh nhất để gửi một bức email mẫu thực tế về hòm thư riêng của bạn (Gmail, Outlook, v.v.).

### Các bước thực hiện:
1. **Truy cập hệ thống**: Mở trình duyệt vào trang **`https://kapla.io.vn/`** (hoặc `http://localhost:3000/` nếu đang mở máy local).
2. **Đăng nhập**: Dùng tài khoản `admin@kapla.edu.vn` / mật khẩu `Kapla@2026`.
3. **Mở Trung tâm Email**: Trên thanh Menu bên trái màn hình, nhấp vào mục **"Email Tự Động"** (hoặc **"Automated Emails"**).
4. **Nhập thông tin tại khung "Live Test Dispatcher"**:
   - **Hộp thư người nhận (Recipient Email)**: Nhập địa chỉ email cá nhân bạn muốn nhận thư (Ví dụ: `ten_cua_ban@gmail.com`).
   - **Mẫu email thử nghiệm (Template Selection)**: Chọn 1 trong 3 mẫu nghiệp vụ:
     - 🔔 *Urgent Action Required* (Nhắc việc khẩn cấp)
     - 💳 *Tuition Renewal Deadline Alert* (Cảnh báo hạn học phí học viên)
     - 💬 *Parent Feedback Resolution Confirmation* (Xác nhận giải quyết phản hồi phụ huynh)
   - **Ghi chú bổ sung (Optional Note)**: Có thể gõ thêm lời nhắn tùy ý hoặc để trống.
5. **Bấm gửi**: Nhấp vào nút xanh **"Dispatch Test Email Now"** (Gửi Email Thử Nghiệm Ngay).
6. **Kết quả hiển thị**:
   - Một thông báo toast màu xanh xuất hiện xác nhận: *"Test email dispatched to [email của bạn]!"*.
   - Email lập tức xuất hiện ở dòng đầu tiên trong bảng danh sách **"Live Email Dispatch Outbox"** ở phía dưới.
7. **Kiểm tra hòm thư của bạn**: Mở ứng dụng Gmail hoặc Outlook trên điện thoại/máy tính của bạn, mở thư mới nhận để thưởng thức giao diện email thương hiệu KAPLA!

---

## 👁️ CÁCH 2: Xem Trước Trực Tiếp Giao Diện Email HTML Ngay Trên Web (Không cần mở hòm thư)

Nếu bạn muốn xem nhanh giao diện bức thư được vẽ như thế nào mà không cần đăng nhập vào hòm thư cá nhân:

### Các bước thực hiện:
1. Tại màn hình **"Email Tự Động"** (**"Automated Emails"**), nhìn xuống bảng danh sách **"Live Email Dispatch Outbox"** (Danh sách thư đã gửi).
2. Tại bất kỳ dòng email nào, bấm nút **"Xem tin nhắn"** (**"View Message"** hoặc icon hình con mắt).
3. Hộp thoại chi tiết sẽ mở ra gồm 2 tab:
   - **Tab 1: Log Metadata**: Hiển thị thông tin kỹ thuật (Thời gian gửi, Người gửi, Người nhận, SLA phản hồi, Tiêu đề).
   - **Tab 2: KAPLA Email Preview (Xem trước giao diện thư)**: Nhấp vào tab này!
4. **Trải nghiệm**:
   - Bạn sẽ thấy toàn bộ giao diện bức thư HTML xuất hiện sống động ngay trong khung xem trước: Logo KAPLA sắc nét, banner Deep Navy, khung thông báo với các icon vector chuẩn, nút bấm hành động và chân trang đầy đủ thông tin pháp lý của trường.

---

## 🔐 CÁCH 3: Thử Nghiệm Luồng Gửi Mã Xác Thực OTP Khi Đăng Ký Tài Khoản

Tính năng này giúp bạn kiểm thử trải nghiệm của một nhân viên mới khi vừa được tuyển dụng và tự đăng ký tài khoản vào hệ thống.

### Các bước thực hiện:
1. **Mở trang đăng nhập**: Truy cập `https://kapla.io.vn/login` (Nếu đang đăng nhập, bấm vào biểu tượng đại diện ở góc trên bên phải -> Chọn **"Đăng xuất"**).
2. **Chọn Đăng ký**: Phía dưới nút đăng nhập, nhấp vào dòng chữ **"Đăng ký tài khoản ngay"** (**"Register Account Now"**).
3. **Điền thông tin đăng ký**:
   - **Họ và tên**: Điền tên của bạn.
   - **Email làm việc**: Nhập địa chỉ email thực tế của bạn (để nhận mã OTP).
   - **Số điện thoại**: Nhập số điện thoại bất kỳ (VD: `0901234567`).
   - **Mật khẩu**: Tạo mật khẩu mong muốn (VD: `Kapla@2026`).
   - **Cơ sở trực thuộc**: Chọn `KAPLA Phạm Hùng`.
4. **Bấm gửi mã**: Nhấp nút **"Tiếp Tục Xác Thực Email"** (**"Continue to Email Verification"**).
5. **Nhận và nhập mã OTP**:
   - Hệ thống tự động tạo mã OTP bảo mật gồm 6 chữ số và gửi đến email của bạn.
   - Mở email, xem mã số OTP trong ô nổi bật màu xanh thương hiệu.
   - Quay lại màn hình web, nhập 6 số OTP vào ô nhập liệu để hoàn tất đăng ký!
   *(Ghi chú: Nếu hệ thống đang chạy ở bản thử nghiệm tĩnh chưa liên kết backend Netlify, giao diện sẽ hiển thị trực tiếp mã OTP mẫu ngay trên thông báo để bạn luôn có thể tiếp tục thao tác mà không bị chặn).*

---

## 📊 CÁCH 4: Thử Nghiệm Các Luồng Gửi Email Nghiệp Vụ Tự Động Khác

Ngoài gửi thử trực tiếp, hệ thống KAPLA tự động kích hoạt gửi email trong các nghiệp vụ vận hành hàng ngày:

### A. Gửi Thông Báo Tái Tục Học Phí (Tuition Renewal Alert):
1. Đăng nhập với quyền `admin@kapla.edu.vn` hoặc `hrt.tram@kapla.edu.vn`.
2. Chọn menu **"Tái Tục & Giữ Chân"** (**"Renewal & Retention"**).
3. Nhìn vào danh sách học viên sắp đến hạn đóng phí (thẻ học viên có hạn còn $\le$ 14 ngày hoặc $\le$ 30 ngày).
4. Nhấp vào học viên -> Bấm **"Gửi cảnh báo hạn phí"**: Hệ thống sẽ tự động gửi email thông báo học phí chi tiết có đính kèm mã học viên, hạn chót và hướng dẫn thanh toán tới phụ huynh và nhân viên tư vấn.

### B. Gửi Xác Nhận Giải Quyết Phản Hồi Phụ Huynh (Parent Feedback Resolution):
1. Chọn menu **"Phản Hồi Phụ Huynh"** (**"Parent Feedback"**).
2. Bấm vào một phiếu phản ánh đang trong trạng thái xử lý (`open` hoặc `investigating`).
3. Cập nhật giải pháp xử lý và chuyển trạng thái sang **"Đã giải quyết"** (**"Resolved"**).
4. Bấm **"Lưu cập nhật"**: Hệ thống tự động kích hoạt bức email cảm ơn và xác nhận kết quả xử lý gửi tới phụ huynh học viên và Giám đốc cơ sở.

### C. Đặt Lịch Hẹn Chăm Sóc & Nhắc Nhở Học Viên (Reminder Appointment):
1. Chọn menu **"Hồ Sơ Học Viên"** (**"Students Master Directory"**).
2. Chọn một học viên (Ví dụ: *Nguyễn Minh Trí* hoặc *Trần Bảo Nam*).
3. Nhấp nút **"Đặt Lịch Hẹn"** (**"Schedule Reminder"**).
4. Điền nội dung lịch hẹn (Tham vấn học thuật Cambridge / Kế hoạch kèm cặp), chọn ngày giờ hẹn -> Bấm **"Xác Nhận Đặt Lịch"**.
5. Email nhắc nhở trang trọng sẽ tự động gửi tới Quản nhiệm (HRT) phụ trách và Trưởng cơ sở để theo sát lịch hẹn.

---

## 💡 Mẹo & Lưu Ý Quan Trọng Khi Nhận Email

> [!TIP]
> **Kiểm tra Hộp thư Rác (Spam / Junk / Promotions)**:
> Khi một hệ thống gửi email mới phát hành (domain `kapla.io.vn`), các bộ lọc thông minh của Gmail/Outlook đôi khi có thể xếp các bức thư thử nghiệm đầu tiên vào tab **Spam** hoặc **Thư rác**. 
> - Nếu sau 5 giây chưa thấy thư ở Hộp thư chính (Inbox), bạn hãy mở mục **Spam** kiểm tra.
> - Bấm vào nút **"Không phải Spam"** (**"Report not spam"**) hoặc chuyển thư vào Hộp thư chính để các lần sau thư luôn hiển thị ưu tiên hàng đầu.

> [!IMPORTANT]
> **Tốc độ gửi thư**:
> Email được truyền tải qua cổng Transactional API tốc độ cao, thời gian người nhận nhận được thư thông thường chỉ từ **1 đến 3 giây** sau khi bấm nút trên giao diện.

---

## 📞 Thông Tin Hỗ Trợ Kỹ Thuật KAPLA

Nếu bạn có bất kỳ câu hỏi nào trong quá trình kiểm thử giao diện:
- **Hotline điều hành**: `028 7108 8899` (Nhánh cơ sở Phạm Hùng: `028 7300 9088`)
- **Email hỗ trợ kỹ thuật**: `contact@kapla.edu.vn`
- **Cổng vận hành**: `https://kapla.io.vn` | **Cổng thông tin chính thức**: `https://www.kapla.edu.vn`
- **Địa chỉ**: Tầng trệt & Tầng lửng, Khu thương mại Tòa nhà Topaz Elite, Phường 4, Quận 8, TP. Hồ Chí Minh.
