# Giao việc xây dựng KAPLA Staff Dashboard

## Mục tiêu

Xây web nội bộ hoàn chỉnh cho nhân viên KAPLA theo dõi học viên, tiến độ học tập, can thiệp, phản hồi phụ huynh, học bổ trợ và tái tục. Triển khai thử tại Phạm Hùng, thiết kế đa chi nhánh ngay từ đầu. Thực hiện bằng code chạy được, database và phân quyền thật. Dùng dữ liệu giả trong môi trường phát triển.

### Tài liệu đầu vào

- `kapla-ph---student-progress-&-care.zip` cung cấp luồng và chức năng của demo. Đọc `src/types.ts`, `src/components/`, `src/hooks/useKaplaData.ts` và `firestore.rules`. Xây lại backend trên Supabase. Quyền truy cập rộng trong demo không phải quyền mục tiêu.
- `KAPLA - Tiếng Anh Sáng Tạo Mỹ chuẩn Oxford Quality.html` cung cấp tham chiếu nhận diện của `kapla.edu.vn`. Đọc markup và kiểm kê asset trước khi dựng giao diện. File được lưu từ trình duyệt và hiện chỉ tham chiếu tới thư mục `_files` chưa đính kèm. Tên file đã thấy gồm `kapla-logo-color.png`, `kapla-english-room.jpg`, `kapla-pham-hung.png` và `kapla-oxford-banner.png`. CSS chính cũng là đường dẫn tương đối. Không suy ra bảng màu thương hiệu từ các mã màu rời rạc của widget.
- Ưu tiên bộ logo và ảnh thật do KAPLA cung cấp hoặc tài nguyên chính thức KAPLA cho phép sử dụng. Nếu chưa có file, ghi tên asset cần bổ sung, dùng chữ KAPLA và nền thay thế sạch để giao diện chạy được. Không gắn URL đoán, ảnh lỗi, tracker, script hoặc form marketing từ HTML. Không dùng ảnh chứng chỉ có tên học viên làm hình trang trí.

## Phạm vi đã chốt

- Nhân viên nhập tay hồ sơ và ngày hết hạn học phí. Không cần Excel, CRM hay Firebase sync cho bản đầu.
- Nhân viên đăng ký bằng email và mật khẩu, xác thực email, chờ duyệt và được cấp vai trò. Web chỉ dành cho nhân viên. Thông tin phụ huynh phục vụ tác nghiệp nội bộ và cần được giới hạn theo quyền.
- Admin cấu hình số ngày nhắc trước hết hạn. Email nhắc gửi đến email đã xác thực của HRT đang chịu trách nhiệm học viên.
- HRT phụ trách được nhiều lớp và nhiều học viên. Học viên cùng lớp có thể có HRT khác nhau.
- Một Supabase PostgreSQL dùng chung cho các cơ sở, với môi trường phát triển hoặc thử nghiệm riêng.

## T01 — Giao diện nhận diện và đăng nhập

- Dùng React + TypeScript. Nếu repo mới, đề xuất Next.js + Tailwind. Dùng tiếng Việt có dấu và giữ các tên vai trò nội bộ quen thuộc.
- Tạo các trang đăng nhập, đăng ký, xác thực email, chờ duyệt, quên mật khẩu, đặt lại mật khẩu và tài khoản bị vô hiệu hóa. Trang đăng ký có họ tên, email, mật khẩu và xác nhận mật khẩu. Nếu có trường cơ sở mong muốn, chỉ dùng làm thông tin cho người duyệt.
- Desktop dùng bố cục hai cột với ảnh phòng học hoặc cơ sở thật và form rõ ràng. Mobile ưu tiên form, logo và thao tác chính. Dùng chung logo, màu đã đối chiếu, kiểu chữ, nút và trạng thái giữa auth, dashboard và email. Dashboard có sidebar, bộ chọn chi nhánh, tài khoản, bộ lọc và trạng thái tải, lỗi, trống.
- Nghiệm thu trên mobile và desktop. Kiểm tra bàn phím, nhãn form, trạng thái focus, tương phản và lỗi xác thực. Logo giữ đúng tỷ lệ. Ảnh không vỡ và có mô tả phù hợp khi mang thông tin.

## T02 — Tài khoản, chi nhánh và phân quyền

- Dùng Supabase Auth. Tách profile, thành viên chi nhánh và phân công lớp. Liên kết bằng UUID của tài khoản, không dùng tên người hoặc email làm khóa quyền. Chặn truy cập nghiệp vụ khi chưa xác thực, đang chờ duyệt hoặc đã bị khóa.
- Tạo màn hình quản trị chi nhánh, lớp, nhân sự và tài khoản chờ duyệt. Ghi nhật ký cấp, đổi và thu hồi quyền. Khởi tạo quản trị hệ thống bằng quy trình triển khai có tài liệu. Không hard-code email cá nhân hoặc đưa khóa đặc quyền ra client.
- Quyền mặc định đề xuất

| Vai trò | Phạm vi và công việc |
|---|---|
| Quản trị hệ thống | Quản lý chi nhánh, bổ nhiệm CM, đặt ngưỡng nhắc và xem tổng hợp. |
| CM | Quản lý nhân sự, lớp và hồ sơ trong chi nhánh. Duyệt nhân viên trong chi nhánh được giao. |
| Head Teacher | Theo dõi học thuật chi nhánh và xác minh can thiệp. |
| Main Teacher | Đánh giá và lập can thiệp cho lớp được phân công. |
| HRT | Xem danh sách học viên thực sự phụ trách, ghi phản hồi phụ huynh và theo dõi tái tục. |
| TA | Ghi nhận hỗ trợ và cập nhật học thuật trong phạm vi được giao. |
| Giáo viên bổ trợ | Ghi buổi bổ trợ, điểm danh, kết quả và nhận xét cho học viên được giao. |
| CSKH | Xử lý phản hồi và chăm sóc tái tục trong phạm vi được giao. |

- Áp RLS cho mọi bảng nghiệp vụ có thể truy cập qua API. Kiểm tra quyền theo tài khoản, chi nhánh và phân công đang hiệu lực khi đọc và ghi. Với thông tin liên hệ phụ huynh và trường học phí, dùng lớp truy cập hoặc bảng riêng khi cần quyền tới cấp trường dữ liệu. Không dùng thao tác ẩn nút làm cơ chế phân quyền.
- Nghiệm thu bằng hai chi nhánh và tài khoản mỗi vai trò. Kiểm tra truy cập trực tiếp qua API, thay ID chi nhánh, sửa quyền của chính mình và thu hồi quyền trong khi phiên đăng nhập còn hoạt động.

## T03 — Hồ sơ, lớp và phân công HRT

- Thiết kế tối thiểu các nhóm bảng `branches`, `profiles`, `branch_memberships`, `classes`, `class_staff_assignments`, `students`, `enrollments`, `student_hrt_assignments`, cùng các bảng nghiệp vụ, cấu hình, hàng đợi email và audit. Dùng khóa ngoại và ràng buộc để ngăn gán nhầm lớp, học viên hoặc người phụ trách khác chi nhánh.
- Hồ sơ gồm mã, tên, thông tin phụ huynh theo quyền, ngày bắt đầu, lớp, trình độ, ngày hết hạn và trạng thái. Khi chuyển lớp hoặc cơ sở, đóng ghi danh cũ và tạo ghi danh mới. Giữ lịch sử và dùng lưu trữ hồ sơ thay cho xóa trong luồng thông thường.
- Mỗi lớp có thể có một HRT mặc định. Mỗi ghi danh đang hoạt động có thể có một HRT riêng. Lấy phân công riêng trước, nếu không có mới lấy HRT mặc định của lớp. Dùng cùng quy tắc cho dashboard, phân quyền HRT và gửi email. Màn phân công phải cho thấy HRT thực tế, nguồn phân công và trường hợp chưa có HRT.
- Nghiệm thu với lớp A1 mặc định HRT Mai, học viên An gán riêng HRT Linh. Linh thấy An và nhận nhắc hạn của An. Mai thấy và nhận nhắc cho học viên thuộc trách nhiệm của Mai. Đổi lớp, bỏ phân công riêng hoặc đổi HRT trước khi gửi phải tính lại người phụ trách.

## T04 — Các phân hệ nghiệp vụ và dashboard

| Màn hình | Chức năng cần hoàn thành |
|---|---|
| Tổng quan | Lọc theo cơ sở, lớp, trạng thái và rủi ro. Hiển thị số học viên, rủi ro học tập, phản hồi đang mở, can thiệp đến hạn và học phí sắp hết hạn. Bấm số đếm mở danh sách cùng điều kiện. |
| Học viên | Tìm theo mã hoặc tên, xem hồ sơ, lịch sử ghi danh, đánh giá, hỗ trợ và chăm sóc. |
| Đánh giá | Ghi Nghe, Nói, Đọc, Viết theo kỳ, điểm mạnh/yếu và tiến bộ. Cho tạo phiếu can thiệp từ đánh giá. |
| Can thiệp | Vấn đề, nguyên nhân, kế hoạch, người phụ trách, hạn và kết quả đánh giá lại. Trạng thái Mở → Đang xử lý → Đã xử lý → Đã xác minh. CM hoặc Head Teacher trong phạm vi có quyền xác minh. |
| Phản hồi phụ huynh | Ghi kỳ vọng, góp ý, khiếu nại, người phụ trách, hạn xử lý và kết quả. |
| Học bổ trợ | Ngày, chủ đề, mục tiêu, điểm danh, kết quả và nhận xét theo học viên. |
| Tái tục | Danh sách sắp hết hạn và đã hết hạn, trạng thái Theo dõi / Đã liên hệ / Đã tái tục / Không tái tục, lịch sử chăm sóc và ngày hết hạn mới. |
| Nhật ký | Ai làm gì, lúc nào và trên bản ghi nào. Ghi thay đổi vai trò, phân công HRT, ngày hết hạn và kết quả xử lý. |

- Mặc định nhập tay mức rủi ro cho đến khi có công thức được duyệt. Hiển thị hạn theo ngày Việt Nam và dùng cùng nguồn dữ liệu cho danh sách và số đếm.

## T05 — Email tài khoản và nhắc hết hạn

- Cấu hình custom SMTP cho xác thực email và quên mật khẩu. Khi duyệt tài khoản thành công, tạo email thông báo kích hoạt. Đề xuất dùng Resend cho SMTP và email nghiệp vụ.
- Admin đặt số ngày nhắc trên web. Giả định MVP dùng một ngưỡng toàn hệ thống, một email cho mỗi kỳ hết hạn và mỗi học viên. Chạy tác vụ hằng ngày theo Asia/Ho_Chi_Minh. Ví dụ ngày hết hạn 30/11 và nhắc trước 15 ngày thì mốc là 15/11. Xử lý học viên còn hiệu lực trong cửa sổ nhắc để bù trường hợp tác vụ bị lỡ hoặc hồ sơ được nhập trễ. Hồ sơ đã quá hạn hiển thị riêng trên dashboard.
- Trước khi gửi, đọc lại ngày hết hạn, tình trạng ghi danh, HRT có hiệu lực và email xác thực. Nếu thiếu HRT, tài khoản bị khóa hoặc email lỗi, hiện lý do trong màn theo dõi. Không chuyển email sang người khác mặc định. Khi đổi ngày hết hạn, bỏ yêu cầu cũ chưa gửi và tính lại kỳ nhắc.
- Lưu hàng đợi và khóa duy nhất theo học viên + kỳ hết hạn + loại thông báo. Xử lý chạy đồng thời và gửi lại có giới hạn. Theo dõi đang chờ, đã gửi và lỗi. Nội dung email gồm chi nhánh, hạn và link vào hệ thống. Không đưa thông tin liên hệ phụ huynh vào email.
- Nghiệm thu với đúng ngày, sát ngày, đã hết hạn, thiếu HRT, đổi HRT, gia hạn học phí, lỗi nhà cung cấp, và hai lượt chạy cùng lúc. Dùng hộp thư test trước khi bật gửi thật.

## T06 — Bàn giao

- Bàn giao repo, migration có thứ tự, dữ liệu seed giả cho ít nhất hai cơ sở, `.env.example`, README chạy local, thiết lập SMTP và tác vụ nhắc, triển khai, sao lưu và khôi phục. Ghi riêng tài nguyên KAPLA còn thiếu và quyết định nghiệp vụ còn mở.
- Báo cáo lint, typecheck, build và kết quả kiểm thử luồng chính. Kiểm tra quyền chéo cơ sở và lớp, email chống trùng, thay đổi phân công và lịch sử học viên khi chuyển lớp.
- Production dùng project đứng tên KAPLA. Tách bí mật và dữ liệu giữa môi trường. Bàn giao quy trình sao lưu database và tệp nếu bổ sung lưu tệp.

## Thứ tự thực hiện và đầu ra đầu tiên

Bắt đầu với **T01 + T02**, dựng trước **Đăng nhập, Đăng ký, Xác thực email, Chờ duyệt, Quên/Đặt lại mật khẩu và khung Dashboard**. Cùng đợt này, tạo migration và RLS nền tảng để chạy thử từ đăng ký đến duyệt quyền với hai chi nhánh. Sau đó làm T03 → T04 → T05 → T06.

Mỗi đợt giao code, hướng dẫn chạy, migration liên quan, kết quả test và các mục cần KAPLA cung cấp. Khi thiếu thông tin, áp dụng các giả định MVP trong tài liệu và ghi lại để xác nhận, gồm một HRT chính mỗi học viên, ưu tiên phân công riêng, ngưỡng do quản trị hệ thống đặt và quyền ghi theo bảng đề xuất. Đầu ra đầu tiên phải đăng nhập và phân quyền được với Supabase local hoặc test. Nếu chưa có SMTP hay asset chính thức, ghi rõ phần nào mới kiểm thử local và phần nào chờ cấu hình.
