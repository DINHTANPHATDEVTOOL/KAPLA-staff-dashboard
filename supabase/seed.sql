-- ==============================================================================
-- KAPLA Staff Dashboard — Seed Data for Multi-Branch Environment
-- ==============================================================================

-- 1. Insert Core Branches
INSERT INTO public.branches (id, code, name, address, phone, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'PH', 'KAPLA Phạm Hùng', 'Tầng trệt, TTTM Topaz Elite, Phường 4, Quận 8, TP.HCM', '028 7300 9088', 'active'),
    ('a0000000-0000-0000-0000-000000000002', 'BT', 'KAPLA Bình Tân', '35 Vành Đai Trong, P. Bình Trị Đông B, Q. Bình Tân, TP.HCM', '028 7300 9089', 'active'),
    ('a0000000-0000-0000-0000-000000000003', 'DA', 'KAPLA Dĩ An', '108 Võ Thị Sáu, P. Đông Hòa, TP. Dĩ An, Bình Dương', '028 7300 9090', 'active')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    status = EXCLUDED.status;

-- 2. Insert Core Test Classes across branches
INSERT INTO public.classes (id, branch_id, name, level, schedule, status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PH-Starters-01', 'Starters', 'Thứ 2 & 4 (17:30 - 19:00)', 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'PH-Movers-02', 'Movers', 'Thứ 3 & 5 (18:00 - 19:30)', 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'PH-Flyers-01', 'Flyers', 'Thứ 7 & CN (09:00 - 10:30)', 'active'),
    ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'BT-Starters-01', 'Starters', 'Thứ 3 & 5 (17:30 - 19:00)', 'active'),
    ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'BT-Flyers-01', 'Flyers', 'Thứ 7 & CN (14:30 - 16:00)', 'active')
ON CONFLICT (branch_id, name) DO NOTHING;

-- 3. Documented Bootstrap Helper: Thăng cấp Quản trị viên đầu tiên
-- Để cấp quyền Quản trị hệ thống (system_admin) cho tài khoản admin đầu tiên,
-- Quản trị viên chạy lệnh SQL sau trong Supabase SQL Editor:
--
-- UPDATE public.profiles
-- SET system_role = 'system_admin',
--     status = 'active'
-- WHERE email = 'YOUR_ADMIN_EMAIL@kapla.edu.vn';
