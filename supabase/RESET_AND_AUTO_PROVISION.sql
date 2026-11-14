-- ==============================================================================
-- KAPLA — RESET & AUTO PROVISIONING (CHUẨN 100% SUPABASE GOTRUE)
-- Tạm tắt trigger bảo mật audit_logs để giải phóng liên kết dữ liệu cũ
-- ==============================================================================

-- 1. Tắt tạm thời các trigger bảo mật kiểm toán
ALTER TABLE IF EXISTS public.audit_logs DISABLE TRIGGER tr_prevent_audit_tampering;
ALTER TABLE IF EXISTS public.audit_logs DISABLE TRIGGER tr_enforce_audit_insert_security;
ALTER TABLE IF EXISTS public.profiles DISABLE TRIGGER tr_enforce_profile_security;
ALTER TABLE IF EXISTS public.profiles DISABLE TRIGGER tr_audit_profile;
ALTER TABLE IF EXISTS public.branch_memberships DISABLE TRIGGER tr_enforce_membership_security;
ALTER TABLE IF EXISTS public.branch_memberships DISABLE TRIGGER tr_audit_membership;

-- 2. Ngắt liên kết actor_id trên audit_logs
UPDATE public.audit_logs 
SET actor_id = NULL 
WHERE actor_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@kapla.edu.vn', 'cm.nhi@kapla.edu.vn', 'ht.jamie@kapla.edu.vn',
    'hrt.minh@kapla.edu.vn', 'hrt.tram@kapla.edu.vn', 'hrt.vy@kapla.edu.vn'
  )
);

UPDATE public.audit_logs 
SET target_user_id = NULL 
WHERE target_user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@kapla.edu.vn', 'cm.nhi@kapla.edu.vn', 'ht.jamie@kapla.edu.vn',
    'hrt.minh@kapla.edu.vn', 'hrt.tram@kapla.edu.vn', 'hrt.vy@kapla.edu.vn'
  )
);

-- 3. Xóa sạch 6 tài khoản cũ bị lỗi cấu trúc token trong auth
DELETE FROM auth.identities 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN (
    'admin@kapla.edu.vn', 'cm.nhi@kapla.edu.vn', 'ht.jamie@kapla.edu.vn',
    'hrt.minh@kapla.edu.vn', 'hrt.tram@kapla.edu.vn', 'hrt.vy@kapla.edu.vn'
  )
);

DELETE FROM auth.users 
WHERE email IN (
  'admin@kapla.edu.vn', 'cm.nhi@kapla.edu.vn', 'ht.jamie@kapla.edu.vn',
  'hrt.minh@kapla.edu.vn', 'hrt.tram@kapla.edu.vn', 'hrt.vy@kapla.edu.vn'
);

-- 4. Bật lại toàn bộ trigger bảo mật
ALTER TABLE IF EXISTS public.audit_logs ENABLE TRIGGER tr_prevent_audit_tampering;
ALTER TABLE IF EXISTS public.audit_logs ENABLE TRIGGER tr_enforce_audit_insert_security;
ALTER TABLE IF EXISTS public.profiles ENABLE TRIGGER tr_enforce_profile_security;
ALTER TABLE IF EXISTS public.profiles ENABLE TRIGGER tr_audit_profile;
ALTER TABLE IF EXISTS public.branch_memberships ENABLE TRIGGER tr_enforce_membership_security;
ALTER TABLE IF EXISTS public.branch_memberships ENABLE TRIGGER tr_audit_membership;

-- 5. Trigger tự động xác nhận email ngay lập tức khi tài khoản đăng ký
CREATE OR REPLACE FUNCTION public.auto_setup_kapla_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email LIKE '%@kapla.edu.vn' THEN
    NEW.email_confirmed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_setup_kapla_staff ON auth.users;
CREATE TRIGGER tr_auto_setup_kapla_staff
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_setup_kapla_staff();

-- 6. Trigger tự động cấp quyền profiles & branch_memberships chuẩn xác
CREATE OR REPLACE FUNCTION public.auto_assign_staff_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_name text;
  v_sys_role text := 'staff';
  v_branch_role text := 'HRT';
BEGIN
  IF NEW.email = 'admin@kapla.edu.vn' THEN
    v_name := 'Admin'; v_sys_role := 'system_admin'; v_branch_role := 'CM';
  ELSIF NEW.email = 'cm.nhi@kapla.edu.vn' THEN
    v_name := 'Phương Nhi'; v_branch_role := 'CM';
  ELSIF NEW.email = 'ht.jamie@kapla.edu.vn' THEN
    v_name := 'Jamie'; v_branch_role := 'HT';
  ELSIF NEW.email = 'hrt.minh@kapla.edu.vn' THEN
    v_name := 'Minh'; v_branch_role := 'HRT';
  ELSIF NEW.email = 'hrt.tram@kapla.edu.vn' THEN
    v_name := 'Trâm'; v_branch_role := 'HRT';
  ELSIF NEW.email = 'hrt.vy@kapla.edu.vn' THEN
    v_name := 'Vy'; v_branch_role := 'HRT';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, preferred_branch_id, system_role, status)
  VALUES (NEW.id, NEW.email, v_name, v_branch_id, v_sys_role, 'active')
  ON CONFLICT (id) DO UPDATE 
    SET full_name = EXCLUDED.full_name, 
        system_role = EXCLUDED.system_role, 
        status = 'active';

  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES (NEW.id, v_branch_id, v_branch_role, true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE 
    SET role = EXCLUDED.role, 
        status = 'active';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_assign_staff_role ON auth.users;
CREATE TRIGGER tr_auto_assign_staff_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_staff_role();
