-- ==============================================================================
-- KAPLA — LIÊN KẾT HỒ SƠ, PHÂN QUYỀN VÀ PHÂN BỔ LỚP/HỌC VIÊN
-- ==============================================================================

DO $$
DECLARE
  v_branch_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_admin_id uuid;
  v_cm_id uuid;
  v_ht_id uuid;
  v_minh_id uuid;
  v_tram_id uuid;
  v_vy_id uuid;
BEGIN
  -- 1. Tạm tắt trigger bảo mật để cấu hình ban đầu
  ALTER TABLE IF EXISTS public.audit_logs DISABLE TRIGGER tr_prevent_audit_tampering;
  ALTER TABLE IF EXISTS public.audit_logs DISABLE TRIGGER tr_enforce_audit_insert_security;
  ALTER TABLE IF EXISTS public.profiles DISABLE TRIGGER tr_enforce_profile_security;
  ALTER TABLE IF EXISTS public.profiles DISABLE TRIGGER tr_audit_profile;
  ALTER TABLE IF EXISTS public.branch_memberships DISABLE TRIGGER tr_enforce_membership_security;
  ALTER TABLE IF EXISTS public.branch_memberships DISABLE TRIGGER tr_audit_membership;

  -- 2. Lấy UUID chính thức của 6 tài khoản vừa đăng ký
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@kapla.edu.vn';
  SELECT id INTO v_cm_id    FROM auth.users WHERE email = 'cm.nhi@kapla.edu.vn';
  SELECT id INTO v_ht_id    FROM auth.users WHERE email = 'ht.jamie@kapla.edu.vn';
  SELECT id INTO v_minh_id  FROM auth.users WHERE email = 'hrt.minh@kapla.edu.vn';
  SELECT id INTO v_tram_id  FROM auth.users WHERE email = 'hrt.tram@kapla.edu.vn';
  SELECT id INTO v_vy_id    FROM auth.users WHERE email = 'hrt.vy@kapla.edu.vn';

  -- 3. Tạo/Cập nhật profiles
  INSERT INTO public.profiles (id, email, full_name, preferred_branch_id, system_role, status)
  VALUES 
    (v_admin_id, 'admin@kapla.edu.vn', 'Admin Hệ Thống', v_branch_id, 'system_admin', 'active'),
    (v_cm_id,    'cm.nhi@kapla.edu.vn',    'Phương Nhi',       v_branch_id, 'staff',        'active'),
    (v_ht_id,    'ht.jamie@kapla.edu.vn',   'Jamie',            v_branch_id, 'staff',        'active'),
    (v_minh_id,  'hrt.minh@kapla.edu.vn',  'Minh',             v_branch_id, 'staff',        'active'),
    (v_tram_id,  'hrt.tram@kapla.edu.vn',  'Trâm',             v_branch_id, 'staff',        'active'),
    (v_vy_id,    'hrt.vy@kapla.edu.vn',    'Vy',               v_branch_id, 'staff',        'active')
  ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name,
        system_role = EXCLUDED.system_role,
        status = 'active',
        preferred_branch_id = EXCLUDED.preferred_branch_id;

  -- 4. Phân bổ vai trò chi nhánh (branch_memberships: Head Teacher thay vì HT)
  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES
    (v_admin_id, v_branch_id, 'CM',           true, 'active'),
    (v_cm_id,    v_branch_id, 'CM',           true, 'active'),
    (v_ht_id,    v_branch_id, 'Head Teacher', true, 'active'),
    (v_minh_id,  v_branch_id, 'HRT',          true, 'active'),
    (v_tram_id,  v_branch_id, 'HRT',          true, 'active'),
    (v_vy_id,    v_branch_id, 'HRT',          true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE 
    SET role = EXCLUDED.role, status = 'active';

  -- 5. Cập nhật phân công lớp học
  UPDATE public.classes SET default_hrt_id = v_minh_id, main_teacher_id = v_ht_id WHERE id IN ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
  UPDATE public.classes SET default_hrt_id = v_tram_id, main_teacher_id = v_ht_id WHERE id = 'c0000000-0000-0000-0000-000000000003';
  UPDATE public.classes SET default_hrt_id = v_vy_id,   main_teacher_id = v_ht_id WHERE id = 'c0000000-0000-0000-0000-000000000004';

  -- 6. Phân công HRT quản lý học viên
  UPDATE public.students SET assigned_hrt_id = v_minh_id WHERE id IN ('b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006');
  UPDATE public.students SET assigned_hrt_id = v_tram_id WHERE id IN ('b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000007');
  UPDATE public.students SET assigned_hrt_id = v_vy_id   WHERE id IN ('b0000000-0000-0000-0000-000000000008');

  -- 7. Kích hoạt lại toàn bộ trigger bảo mật
  ALTER TABLE IF EXISTS public.audit_logs ENABLE TRIGGER tr_prevent_audit_tampering;
  ALTER TABLE IF EXISTS public.audit_logs ENABLE TRIGGER tr_enforce_audit_insert_security;
  ALTER TABLE IF EXISTS public.profiles ENABLE TRIGGER tr_enforce_profile_security;
  ALTER TABLE IF EXISTS public.profiles ENABLE TRIGGER tr_audit_profile;
  ALTER TABLE IF EXISTS public.branch_memberships ENABLE TRIGGER tr_enforce_membership_security;
  ALTER TABLE IF EXISTS public.branch_memberships ENABLE TRIGGER tr_audit_membership;
END $$;
