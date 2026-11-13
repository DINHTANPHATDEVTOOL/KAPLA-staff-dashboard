# KAPLA Staff Dashboard — Cổng Quản Lý Học Vụ & Chăm Sóc Học Viên

Hệ thống web nội bộ hoàn chỉnh dành cho nhân viên hệ thống Anh ngữ **KAPLA** theo dõi học viên, tiến độ học tập, lập phiếu can thiệp, phản hồi phụ huynh, lớp học bổ trợ và quản lý tái tục. Thiết kế sẵn sàng đa chi nhánh (**Multi-branch Architecture**), bảo vệ dữ liệu bằng Row Level Security (**RLS**) trên PostgreSQL / Supabase.

---

## 1. Kết Quả Bàn Giao Giai Đoạn T01 + T02

### T01 — Giao diện nhận diện thương hiệu & Xác thực
- **Bảng màu nhận diện chuẩn Oxford Quality từ `kapla.edu.vn`**:
  - `Primary Navy`: `#043264` (Xanh Oxford chủ đạo)
  - `Dark Navy`: `#012147` (Nền thanh điều hướng và khung thương hiệu)
  - `Accent Cobalt`: `#026fd7` (Màu điểm nhấn, nút hành động chính)
  - `Sky Blue`: `#c7e2f6` (Màu badge và phụ trợ)
  - `Cream Background`: `#fcf8f1`
  - `Kapla Red`: `#df2225` (Cảnh báo và nút nhấn mạnh)
- **Tài nguyên ảnh thật của cơ sở**: Sử dụng ảnh phòng học thực tế `kapla-english-room.jpg`, cơ sở `kapla-pham-hung.png`, logo chuẩn `kapla-logo-color.png`. Tuyệt đối không dùng ảnh chứng chỉ có tên học viên làm hình trang trí.
- **Trọn bộ màn hình xác thực (Auth Views)**:
  1. `Đăng nhập` (`/login`): Email cơ quan, mật khẩu, ghi nhớ đăng nhập, gợi ý tài khoản test 1-click.
  2. `Đăng ký` (`/register`): Họ tên, email, số điện thoại, chi nhánh công tác mong muốn (dành cho người duyệt), mật khẩu xác nhận.
  3. `Xác thực email` (`/verify-email`): Thông báo kiểm tra hòm thư, nút gửi lại mã, nút xác nhận tức thì trong môi trường kiểm thử.
  4. `Chờ phê duyệt` (`/pending-approval`): Chặn truy cập nghiệp vụ khi tài khoản chưa được CM / Admin duyệt cấp quyền.
  5. `Khôi phục mật khẩu` (`/forgot-password`) & `Đặt lại mật khẩu` (`/reset-password`).
  6. `Tài khoản bị vô hiệu hóa` (`/disabled`): Thông báo khi tài khoản bị khóa quyền truy cập.
- **Khung Dashboard chuẩn**:
  - Sidebar với menu tiếng Việt có dấu, badge thông báo số lượng tài khoản chờ duyệt theo thời gian thực.
  - Topbar với bộ chọn đa chi nhánh (`KAPLA Phạm Hùng`, `KAPLA Bình Tân`, `KAPLA Dĩ An`), badge vai trò và menu tài khoản.
  - Hỗ trợ đầy đủ trạng thái: **Đang tải (Skeleton Loading)**, **Lỗi kết nối (Error State)**, và **Chưa có dữ liệu (Empty State)** với nút kiểm thử trực tiếp trên giao diện.

### T02 — Tài khoản, Chi nhánh & Phân quyền RLS
- **Khóa định danh UUID**: Phân quyền hoàn toàn dựa trên UUID của `auth.users`, không dùng tên hoặc email làm khóa phân quyền.
- **Tách biệt dữ liệu**: Tách riêng bảng hồ sơ nhân viên (`profiles`), phân bổ chi nhánh (`branch_memberships`), và lớp học (`classes`).
- **Phân quyền vai trò mặc định (Role-Based Access Control)**:
  - 👑 **Quản trị hệ thống (`system_admin`)**: Quản lý toàn bộ chi nhánh, bổ nhiệm CM, xem tổng hợp toàn hệ thống.
  - 🏢 **CM (Center Manager)**: Duyệt nhân viên vào chi nhánh của mình, quản lý lớp và hồ sơ học viên trong cơ sở.
  - 🎓 **Head Teacher**: Theo dõi chất lượng học thuật cơ sở, xác minh phiếu can thiệp.
  - 👨‍🏫 **Main Teacher**: Đánh giá 4 kỹ năng và lập kế hoạch can thiệp cho lớp phụ trách.
  - 👩‍🏫 **HRT (Giáo viên chủ nhiệm)**: Quản lý học viên phụ trách, ghi nhận phản hồi phụ huynh, theo dõi tái tục trước 15 ngày.
  - 🤝 **TA (Trợ giảng)**: Ghi nhận hỗ trợ và cập nhật quan sát học thuật.
  - 📖 **Giáo viên bổ trợ**: Điểm danh, nội dung và nhận xét buổi học bổ trợ.
  - 📞 **CSKH**: Chăm sóc tái tục và xử lý khiếu nại phụ huynh.
- **Màn hình Quản trị nhân sự & Phân quyền (`StaffApprovalView`)**:
  - Tab 1: **Tài khoản chờ duyệt**: Xem thông tin đăng ký, mở modal phê duyệt chọn chi nhánh và vai trò, hoặc từ chối khóa tài khoản.
  - Tab 2: **Danh sách nhân sự**: Lọc theo chi nhánh, vai trò, tìm kiếm tên/email, đổi vai trò hoặc tạm ngưng tài khoản.
  - Tab 3: **Nhật ký phân quyền (Audit Log)**: Ghi nhận lịch sử kiểm toán bảo mật: ai thực hiện, hành động gì, tài khoản nào, chi nhánh nào và chi tiết thay đổi.

---

## 2. Kiểm Kê Tài Nguyên Thương Hiệu & Cấu Hình Email

### 2.1. Tài nguyên đã tích hợp đầy đủ
- [x] Logo màu chuẩn: `/assets/kapla-logo-color.png`
- [x] Ảnh phòng học tiếng Anh thực tế: `/assets/kapla-english-room.jpg`
- [x] Ảnh cơ sở Phạm Hùng: `/assets/kapla-pham-hung.png`
- [x] Ảnh phòng Robotics: `/assets/kapla-robotics-room.jpg`
- [x] Chứng nhận Oxford Quality: `/assets/oxford-quality-certificate.png`
- [x] Bảng màu chuẩn CSS từ hệ thống `kapla.edu.vn`.

### 2.2. Tài nguyên & Cấu hình còn thiếu cần KAPLA cung cấp
> [!IMPORTANT]
> Để chuẩn bị triển khai lên môi trường Production, các tài nguyên và thông tin sau đây cần được bổ sung:
1. **Logo vector chuẩn SVG**:
   - `kapla-logo-white.svg` (Bản logo màu trắng đơn sắc để hiển thị trên nền tối sắc nét ở mọi độ phân giải màn hình).
   - `kapla-icon.svg` / `favicon.ico` chính thức.
2. **Cấu hình Custom SMTP / Resend API**:
   - Khóa API dịch vụ gửi email (Resend hoặc SMTP Host/Port/User/Password).
   - Domain xác thực gửi email nội bộ: ví dụ `noreply@kapla.edu.vn` (cần cấu hình bản ghi SPF, DKIM, DMARC tại DNS).
   *(Hiện tại môi trường phát triển và kiểm thử đang chạy chế độ Mock SMTP / Inbucket nội bộ).*
3. **Ảnh không gian cơ sở Bình Tân & Dĩ An**:
   - Ảnh mặt tiền hoặc phòng học thực tế của các cơ sở ngoài Phạm Hùng để hiển thị đa dạng khi chuyển đổi chi nhánh.

---

## 3. Cấu Trúc Thư Mục Dự Án

```
KAPLA/
├── public/
│   └── assets/                     # Tài nguyên ảnh, logo thật của KAPLA
├── src/
│   ├── components/
│   │   ├── auth/                   # Toàn bộ màn hình xác thực T01
│   │   │   ├── AuthLayout.tsx      # Layout 2 cột desktop + mobile responsive
│   │   │   ├── LoginForm.tsx       # Đăng nhập
│   │   │   ├── RegisterForm.tsx    # Đăng ký với cơ sở mong muốn
│   │   │   ├── VerifyEmailScreen.tsx  # Xác thực hòm thư email
│   │   │   ├── PendingApprovalScreen.tsx # Chờ CM/Admin duyệt cấp quyền
│   │   │   ├── ForgotPasswordForm.tsx # Quên mật khẩu
│   │   │   ├── ResetPasswordForm.tsx  # Đặt lại mật khẩu
│   │   │   └── DisabledAccountScreen.tsx # Tài khoản bị vô hiệu hóa
│   │   └── dashboard/              # Khung Dashboard & Quản trị T02
│   │       ├── AppLayout.tsx       # Container chính
│   │       ├── Sidebar.tsx         # Thanh điều hướng tiếng Việt + badge số lượng
│   │       ├── TopBar.tsx          # Bộ chọn chi nhánh & thông tin tài khoản
│   │       ├── OverviewView.tsx    # Tổng quan học vụ + demo Loading/Error/Empty
│   │       ├── StaffApprovalView.tsx # Quản trị nhân sự, duyệt tài khoản & Audit log
│   │       └── BranchesClassesView.tsx # Chi nhánh & Lớp học
│   ├── context/
│   │   └── AuthContext.tsx         # Quản lý phiên, quyền hạn & chuyển chi nhánh
│   ├── lib/
│   │   └── supabase.ts             # Supabase client + Mock storage dự phòng
│   ├── types/
│   │   └── index.ts                # Định nghĩa kiểu dữ liệu TypeScript & vai trò
│   ├── App.tsx                     # Máy trạng thái định tuyến đăng nhập & dashboard
│   ├── main.tsx                    # Điểm khởi chạy ứng dụng
│   └── index.css                   # Định nghĩa theme Tailwind & biến thương hiệu
├── supabase/
│   ├── migrations/
│   │   └── 20261113000001_initial_schema.sql  # Migration toàn diện DDL, RLS, RPC
│   └── seed.sql                    # Dữ liệu hạt giống 3 chi nhánh & lớp học
├── scripts/
│   └── test_auth_flow.ts           # Bộ kịch bản kiểm thử tự động 15 tiêu chí
├── package.json
└── tsconfig.json
```

---

## 4. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 4.1. Khởi chạy nhanh (Chế độ phát triển & Thử nghiệm ngay)

Dự án đã tích hợp sẵn cơ chế **Tự động nhận diện Mock/Dev Mode** giúp chạy thử nghiệm toàn bộ luồng Auth và duyệt quyền ngay lập tức mà không cần cài đặt Docker hoặc cơ sở dữ liệu Supabase bên ngoài:

```bash
# 1. Di chuyển vào thư mục dự án
cd /home/rd/Desktop/KAPLA

# 2. Cài đặt các thư viện (nếu chưa cài)
pnpm install

# 3. Khởi chạy máy chủ phát triển
pnpm run dev
```

Mở trình duyệt tại: `http://localhost:3000`

Trên màn hình đăng nhập, bạn có thể bấm vào các nút **"1-Click Login"** có sẵn ở khung màu vàng để chuyển đổi nhanh các vai trò:
- `👑 Quản trị hệ thống` (`admin@kapla.edu.vn`)
- `🏢 CM Phạm Hùng` (`cm.phamhung@kapla.edu.vn`)
- `🏢 CM Bình Tân` (`cm.binhtan@kapla.edu.vn`)
- `👩‍🏫 HRT Mai` (`teacher.mai@kapla.edu.vn`)
- `⏳ Staff Đang Chờ Duyệt` (`new.staff@kapla.edu.vn`)

---

### 4.2. Kết nối với Supabase Thật (Local hoặc Cloud)

Khi bạn muốn kết nối với cơ sở dữ liệu PostgreSQL / Supabase thật:

1. **Áp dụng Migration**:
   - Nếu dùng **Supabase CLI Local**:
     ```bash
     supabase start
     supabase db reset
     ```
   - Nếu dùng **Supabase Cloud Dashboard**:
     Vào mục **SQL Editor**, dán toàn bộ nội dung file `supabase/migrations/20261113000001_initial_schema.sql` và nhấn **Run**, sau đó chạy file `supabase/seed.sql`.

2. **Cấu hình biến môi trường**:
   Tạo file `.env.local` từ `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
   Cập nhật các giá trị từ Supabase:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_anon_public_key
   VITE_ENABLE_DEV_MOCK=false
   ```

3. **Khởi tạo Quản trị viên đầu tiên (Bootstrap Admin)**:
   Sau khi một tài khoản quản trị đăng ký qua giao diện, chạy câu lệnh SQL sau trong Supabase SQL Editor để thăng cấp quyền Quản trị hệ thống:
   ```sql
   UPDATE public.profiles
   SET system_role = 'system_admin',
       status = 'active'
   WHERE email = 'admin@kapla.edu.vn';
   ```

---

## 5. Kết Quả Kiểm Thử Luồng Nghiệp Vụ (Automated Test Suite)

Chạy lệnh kiểm thử tự động tích hợp:
```bash
pnpm test
```

### Kết quả chạy kiểm thử thực tế:
```
======================================================================
  KAPLA Staff Dashboard — Kiểm thử tích hợp luồng T01 & T02
======================================================================

--- BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN (REGISTER) ---
  [PASS] Tài khoản được tạo với mã định danh UUID
  [PASS] Trạng thái xác thực email ban đầu là false
  [PASS] Hồ sơ nhân viên ở trạng thái "pending" (Chờ phê duyệt)
  [PASS] Cơ sở mong muốn được lưu đúng (KAPLA Phạm Hùng)

--- BƯỚC 2: CHẶN TRUY CẬP KHI CHƯA XÁC THỰC EMAIL ---
  [PASS] Người dùng chưa xác thực email bị điều hướng sang VERIFY_EMAIL_SCREEN

--- BƯỚC 3: XÁC THỰC EMAIL ---
  [PASS] Xác thực email thành công (emailConfirmed = true)

--- BƯỚC 4: CHẶN TRUY CẬP KHI CHƯA CÓ VAI TRÒ DUYỆT ---
  [PASS] Email đã xác thực nhưng tài khoản pending bị chuyển sang PENDING_APPROVAL_SCREEN

--- BƯỚC 5: KIỂM TRA BẢO MẬT & PHÂN QUYỀN RLS ---
  [PASS] Chặn ứng viên tự thăng cấp vai trò cho chính mình
  [PASS] Chặn CM duyệt nhân sự cho chi nhánh ngoài phạm vi quản lý

--- BƯỚC 6: CM PHẠM HÙNG DUYỆT CẤP VAI TRÒ HRT ---
  [PASS] CM Phạm Hùng duyệt cấp vai trò HRT thành công
  [PASS] Trạng thái hồ sơ chuyển sang "active"
  [PASS] Phân bổ vai trò HRT trong chi nhánh Phạm Hùng hợp lệ
  [PASS] Nhật ký kiểm toán (Audit Log) ghi nhận đầy đủ người duyệt, người nhận và vai trò

--- BƯỚC 7: TRUY CẬP DASHBOARD HỢP LỆ ---
  [PASS] Sau khi được duyệt, nhân viên được cấp quyền vào DASHBOARD_ALLOWED

--- BƯỚC 8: VÔ HIỆU HÓA TÀI KHOẢN KHI CẦN THIẾT ---
  [PASS] Khi bị vô hiệu hóa, tài khoản bị chặn ngay lập tức và chuyển sang DISABLED_ACCOUNT_SCREEN

======================================================================
  KẾT QUẢ: ĐÃ VƯỢT QUA 15/15 BÀI KIỂM THỬ (100% PASS)
======================================================================
```

---

## 6. Kiểm tra Build & Chất lượng mã nguồn

- **Kiểm tra TypeScript (`pnpm run lint`)**: `0 errors, 0 warnings` (Exit code 0).
- **Kiểm tra đóng gói (`pnpm run build`)**: Đóng gói thành công bundle production bằng Vite chỉ trong `1.88s`.
