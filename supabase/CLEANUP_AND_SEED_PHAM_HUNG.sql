-- ==============================================================================
-- KAPLA — SQL CLEANUP & PRODUCTION SEED FOR PHAM HUNG ROSTER
-- Chạy script này trực tiếp trong Supabase SQL Editor (cả Cloud lẫn Local)
-- để xóa sạch toàn bộ tài khoản demo cũ và chỉ giữ lại 6 nhân sự chi nhánh Phạm Hùng
-- ==============================================================================

DO $$
DECLARE
  v_branch_ph_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_admin_id uuid;
  v_cm_id uuid;
  v_ht_id uuid;
  v_minh_id uuid;
  v_tram_id uuid;
  v_vy_id uuid;
  v_encrypted_pw text := crypt('Kapla@2026', gen_salt('bf'));
BEGIN
  -- 1. Tạm thời tắt các trigger nghiệp vụ kiểm soát để cập nhật an toàn
  ALTER TABLE IF EXISTS public.audit_logs DISABLE TRIGGER tr_prevent_audit_tampering;
  ALTER TABLE IF EXISTS public.audit_logs DISABLE TRIGGER tr_enforce_audit_insert_security;
  ALTER TABLE IF EXISTS public.profiles DISABLE TRIGGER tr_enforce_profile_security;
  ALTER TABLE IF EXISTS public.profiles DISABLE TRIGGER tr_audit_profile;
  ALTER TABLE IF EXISTS public.branch_memberships DISABLE TRIGGER tr_enforce_membership_security;
  ALTER TABLE IF EXISTS public.branch_memberships DISABLE TRIGGER tr_audit_membership;

  -- 2. Xóa toàn bộ liên kết và dữ liệu phụ thuộc không thuộc 6 nhân sự
  DELETE FROM public.email_dispatch_logs WHERE TRUE;
  DELETE FROM public.email_dispatch_queue WHERE TRUE;
  DELETE FROM public.supplementary_attendees WHERE TRUE;
  DELETE FROM public.supplementary_sessions WHERE TRUE;
  DELETE FROM public.parent_feedbacks WHERE TRUE;
  DELETE FROM public.interventions WHERE TRUE;
  DELETE FROM public.student_assessments WHERE TRUE;
  DELETE FROM public.student_tasks WHERE TRUE;
  DELETE FROM public.renewal_tracking WHERE TRUE;
  DELETE FROM public.class_transfers WHERE TRUE;
  DELETE FROM public.enrollments WHERE TRUE;
  DELETE FROM public.students WHERE branch_id != v_branch_ph_id;

  -- 3. Xóa các chi nhánh demo khác, chỉ giữ lại DUY NHẤT KAPLA Phạm Hùng
  DELETE FROM public.branches WHERE id != v_branch_ph_id;
  INSERT INTO public.branches (id, code, name, address, phone, status)
  VALUES (
    v_branch_ph_id,
    'PH',
    'KAPLA Phạm Hùng',
    'Tầng trệt & lửng, Topaz Elite, Phường 4, Quận 8, TP.HCM',
    '028 7300 9088',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    status = 'active';

  -- 4. Xóa toàn bộ tài khoản demo cũ khỏi auth.users, profiles và memberships
  DELETE FROM public.branch_memberships WHERE user_id NOT IN (
    SELECT id FROM auth.users WHERE email IN (
      'admin@kapla.edu.vn', 'cm.nhi@kapla.edu.vn', 'ht.jamie@kapla.edu.vn',
      'hrt.minh@kapla.edu.vn', 'hrt.tram@kapla.edu.vn', 'hrt.vy@kapla.edu.vn'
    )
  );

  DELETE FROM public.profiles WHERE email NOT IN (
    'admin@kapla.edu.vn', 'cm.nhi@kapla.edu.vn', 'ht.jamie@kapla.edu.vn',
    'hrt.minh@kapla.edu.vn', 'hrt.tram@kapla.edu.vn', 'hrt.vy@kapla.edu.vn'
  );

  DELETE FROM auth.users WHERE email NOT IN (
    'admin@kapla.edu.vn', 'cm.nhi@kapla.edu.vn', 'ht.jamie@kapla.edu.vn',
    'hrt.minh@kapla.edu.vn', 'hrt.tram@kapla.edu.vn', 'hrt.vy@kapla.edu.vn'
  );

  -- 5. Đảm bảo và cập nhật đúng 6 tài khoản chính thức (Mật khẩu Kapla@2026)
  -- 5.1 Admin
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@kapla.edu.vn';
  IF v_admin_id IS NULL THEN
    v_admin_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
    VALUES (v_admin_id, '00000000-0000-0000-0000-000000000000', 'admin@kapla.edu.vn', v_encrypted_pw, now(), '{"full_name": "Admin"}'::jsonb, 'authenticated', 'authenticated');
  ELSE
    UPDATE auth.users SET encrypted_password = v_encrypted_pw, email_confirmed_at = COALESCE(email_confirmed_at, now()), raw_user_meta_data = '{"full_name": "Admin"}'::jsonb WHERE id = v_admin_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, preferred_branch_id, system_role, status)
  VALUES (v_admin_id, 'admin@kapla.edu.vn', 'Admin', '028 7300 9088', v_branch_ph_id, 'system_admin', 'active')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Admin', system_role = 'system_admin', status = 'active', preferred_branch_id = v_branch_ph_id;

  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES (v_admin_id, v_branch_ph_id, 'CM', true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE SET role = 'CM', status = 'active';

  -- 5.2 CM Phương Nhi
  SELECT id INTO v_cm_id FROM auth.users WHERE email = 'cm.nhi@kapla.edu.vn';
  IF v_cm_id IS NULL THEN
    v_cm_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
    VALUES (v_cm_id, '00000000-0000-0000-0000-000000000000', 'cm.nhi@kapla.edu.vn', v_encrypted_pw, now(), '{"full_name": "Phương Nhi"}'::jsonb, 'authenticated', 'authenticated');
  ELSE
    UPDATE auth.users SET encrypted_password = v_encrypted_pw, email_confirmed_at = COALESCE(email_confirmed_at, now()), raw_user_meta_data = '{"full_name": "Phương Nhi"}'::jsonb WHERE id = v_cm_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, preferred_branch_id, system_role, status)
  VALUES (v_cm_id, 'cm.nhi@kapla.edu.vn', 'Phương Nhi', '0912 345 678', v_branch_ph_id, 'staff', 'active')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Phương Nhi', system_role = 'staff', status = 'active', preferred_branch_id = v_branch_ph_id;

  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES (v_cm_id, v_branch_ph_id, 'CM', true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE SET role = 'CM', status = 'active';

  -- 5.3 Head Teacher Jamie
  SELECT id INTO v_ht_id FROM auth.users WHERE email = 'ht.jamie@kapla.edu.vn';
  IF v_ht_id IS NULL THEN
    v_ht_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
    VALUES (v_ht_id, '00000000-0000-0000-0000-000000000000', 'ht.jamie@kapla.edu.vn', v_encrypted_pw, now(), '{"full_name": "Jamie"}'::jsonb, 'authenticated', 'authenticated');
  ELSE
    UPDATE auth.users SET encrypted_password = v_encrypted_pw, email_confirmed_at = COALESCE(email_confirmed_at, now()), raw_user_meta_data = '{"full_name": "Jamie"}'::jsonb WHERE id = v_ht_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, preferred_branch_id, system_role, status)
  VALUES (v_ht_id, 'ht.jamie@kapla.edu.vn', 'Jamie', '0913 456 789', v_branch_ph_id, 'staff', 'active')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Jamie', system_role = 'staff', status = 'active', preferred_branch_id = v_branch_ph_id;

  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES (v_ht_id, v_branch_ph_id, 'Head Teacher', true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE SET role = 'Head Teacher', status = 'active';

  -- 5.4 HRT Minh
  SELECT id INTO v_minh_id FROM auth.users WHERE email = 'hrt.minh@kapla.edu.vn';
  IF v_minh_id IS NULL THEN
    v_minh_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
    VALUES (v_minh_id, '00000000-0000-0000-0000-000000000000', 'hrt.minh@kapla.edu.vn', v_encrypted_pw, now(), '{"full_name": "Minh"}'::jsonb, 'authenticated', 'authenticated');
  ELSE
    UPDATE auth.users SET encrypted_password = v_encrypted_pw, email_confirmed_at = COALESCE(email_confirmed_at, now()), raw_user_meta_data = '{"full_name": "Minh"}'::jsonb WHERE id = v_minh_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, preferred_branch_id, system_role, status)
  VALUES (v_minh_id, 'hrt.minh@kapla.edu.vn', 'Minh', '0914 567 890', v_branch_ph_id, 'staff', 'active')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Minh', system_role = 'staff', status = 'active', preferred_branch_id = v_branch_ph_id;

  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES (v_minh_id, v_branch_ph_id, 'HRT', true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE SET role = 'HRT', status = 'active';

  -- 5.5 HRT Trâm
  SELECT id INTO v_tram_id FROM auth.users WHERE email = 'hrt.tram@kapla.edu.vn';
  IF v_tram_id IS NULL THEN
    v_tram_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
    VALUES (v_tram_id, '00000000-0000-0000-0000-000000000000', 'hrt.tram@kapla.edu.vn', v_encrypted_pw, now(), '{"full_name": "Trâm"}'::jsonb, 'authenticated', 'authenticated');
  ELSE
    UPDATE auth.users SET encrypted_password = v_encrypted_pw, email_confirmed_at = COALESCE(email_confirmed_at, now()), raw_user_meta_data = '{"full_name": "Trâm"}'::jsonb WHERE id = v_tram_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, preferred_branch_id, system_role, status)
  VALUES (v_tram_id, 'hrt.tram@kapla.edu.vn', 'Trâm', '0915 678 901', v_branch_ph_id, 'staff', 'active')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Trâm', system_role = 'staff', status = 'active', preferred_branch_id = v_branch_ph_id;

  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES (v_tram_id, v_branch_ph_id, 'HRT', true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE SET role = 'HRT', status = 'active';

  -- 5.6 HRT Vy
  SELECT id INTO v_vy_id FROM auth.users WHERE email = 'hrt.vy@kapla.edu.vn';
  IF v_vy_id IS NULL THEN
    v_vy_id := gen_random_uuid();
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
    VALUES (v_vy_id, '00000000-0000-0000-0000-000000000000', 'hrt.vy@kapla.edu.vn', v_encrypted_pw, now(), '{"full_name": "Vy"}'::jsonb, 'authenticated', 'authenticated');
  ELSE
    UPDATE auth.users SET encrypted_password = v_encrypted_pw, email_confirmed_at = COALESCE(email_confirmed_at, now()), raw_user_meta_data = '{"full_name": "Vy"}'::jsonb WHERE id = v_vy_id;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, preferred_branch_id, system_role, status)
  VALUES (v_vy_id, 'hrt.vy@kapla.edu.vn', 'Vy', '0916 789 012', v_branch_ph_id, 'staff', 'active')
  ON CONFLICT (id) DO UPDATE SET full_name = 'Vy', system_role = 'staff', status = 'active', preferred_branch_id = v_branch_ph_id;

  INSERT INTO public.branch_memberships (user_id, branch_id, role, is_primary, status)
  VALUES (v_vy_id, v_branch_ph_id, 'HRT', true, 'active')
  ON CONFLICT (user_id, branch_id) DO UPDATE SET role = 'HRT', status = 'active';

  -- 6. Khởi tạo lại các lớp học tại cơ sở Phạm Hùng
  DELETE FROM public.classes WHERE branch_id != v_branch_ph_id;
  INSERT INTO public.classes (id, branch_id, name, level, default_hrt_id, main_teacher_id, schedule, status)
  VALUES
    ('c0000000-0000-0000-0000-000000000001', v_branch_ph_id, 'PH-Starters-01', 'Starters', v_minh_id, v_ht_id, 'Thứ 2 & 4 (17:30 - 19:00)', 'active'),
    ('c0000000-0000-0000-0000-000000000002', v_branch_ph_id, 'PH-Movers-02', 'Movers', v_minh_id, v_ht_id, 'Thứ 3 & 5 (17:30 - 19:00)', 'active'),
    ('c0000000-0000-0000-0000-000000000003', v_branch_ph_id, 'PH-Flyers-01', 'Flyers', v_tram_id, v_ht_id, 'Thứ 7 & CN (09:00 - 10:30)', 'active'),
    ('c0000000-0000-0000-0000-000000000004', v_branch_ph_id, 'PH-Robotics-01', 'Movers', v_vy_id, v_ht_id, 'Thứ 7 & CN (14:30 - 16:00)', 'active')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    default_hrt_id = EXCLUDED.default_hrt_id,
    main_teacher_id = EXCLUDED.main_teacher_id,
    schedule = EXCLUDED.schedule,
    status = 'active';

  -- 7. Khởi tạo 8 học viên thực tế tại cơ sở Phạm Hùng
  DELETE FROM public.students WHERE branch_id != v_branch_ph_id;
  INSERT INTO public.students (id, student_code, full_name, date_of_birth, gender, parent_name, parent_phone, parent_email, branch_id, current_class_id, assigned_hrt_id, tuition_expiry_date, status, notes)
  VALUES
    ('b0000000-0000-0000-0000-000000000001', 'KAP-PH-001', 'Nguyễn Bình An', '2018-05-14', 'male', 'Nguyễn Văn Minh', '0901 112 223', 'minh.nguyen@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000001', v_minh_id, '2026-12-31', 'active', 'Phát âm tốt, cần rèn luyện thêm viết câu đơn giản.'),
    ('b0000000-0000-0000-0000-000000000002', 'KAP-PH-002', 'Trần Thái Bình', '2018-09-20', 'male', 'Trần Thị Hà', '0902 223 334', 'ha.tran@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000001', v_minh_id, '2026-11-20', 'warning', 'Hạn phí còn 7 ngày, phụ huynh hẹn đóng vào thứ 6.'),
    ('b0000000-0000-0000-0000-000000000003', 'KAP-PH-003', 'Lê Quốc Cường', '2017-03-11', 'male', 'Lê Văn Sang', '0903 334 445', 'sang.le@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000002', v_minh_id, '2027-02-28', 'active', 'Năng nổ tham gia thảo luận nhóm, học lực loại Giỏi.'),
    ('b0000000-0000-0000-0000-000000000004', 'KAP-PH-004', 'Đặng Bảo Nam', '2018-11-05', 'male', 'Đặng Quốc Tuấn', '0904 556 677', 'tuan.dang@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000001', v_minh_id, '2026-11-10', 'expired', 'Học phí quá hạn 3 ngày, HRT Minh đã gọi nhắc phụ huynh.'),
    ('b0000000-0000-0000-0000-000000000005', 'KAP-PH-005', 'Phạm Minh Khôi', '2016-07-22', 'male', 'Phạm Hải Đăng', '0905 667 788', 'dang.pham@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000003', v_tram_id, '2026-11-25', 'warning', 'Sắp thi Movers, cần phụ đạo thêm kỹ năng Đọc hiểu.'),
    ('b0000000-0000-0000-0000-000000000006', 'KAP-PH-006', 'Hoàng Mai Chi', '2017-12-08', 'female', 'Hoàng Kim Loan', '0906 778 899', 'loan.hoang@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000002', v_minh_id, '2027-01-15', 'active', 'Tiếp thu từ vựng nhanh, tương tác tự tin với giáo viên bản ngữ.'),
    ('b0000000-0000-0000-0000-000000000007', 'KAP-PH-007', 'Vũ Gia Huy', '2016-04-18', 'male', 'Vũ Văn Bảo', '0908 990 011', 'bao.vu@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000003', v_tram_id, '2026-11-18', 'warning', 'Tham gia CLB Robotics, thích các bài học tương tác.'),
    ('b0000000-0000-0000-0000-000000000008', 'KAP-PH-008', 'Hoàng Tiến Dũng', '2017-08-30', 'male', 'Hoàng Anh Tuấn', '0907 889 900', 'tuan.hoang@gmail.com', v_branch_ph_id, 'c0000000-0000-0000-0000-000000000004', v_vy_id, '2026-12-20', 'active', 'Học viên chuyển cơ sở về Phạm Hùng, tiến độ học tập ổn định.')
  ON CONFLICT (id) DO UPDATE SET
    student_code = EXCLUDED.student_code,
    full_name = EXCLUDED.full_name,
    parent_name = EXCLUDED.parent_name,
    parent_phone = EXCLUDED.parent_phone,
    tuition_expiry_date = EXCLUDED.tuition_expiry_date,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes;

  -- 8. Bật lại các trigger kiểm soát
  ALTER TABLE IF EXISTS public.audit_logs ENABLE TRIGGER tr_prevent_audit_tampering;
  ALTER TABLE IF EXISTS public.audit_logs ENABLE TRIGGER tr_enforce_audit_insert_security;
  ALTER TABLE IF EXISTS public.profiles ENABLE TRIGGER tr_enforce_profile_security;
  ALTER TABLE IF EXISTS public.profiles ENABLE TRIGGER tr_audit_profile;
  ALTER TABLE IF EXISTS public.branch_memberships ENABLE TRIGGER tr_enforce_membership_security;
  ALTER TABLE IF EXISTS public.branch_memberships ENABLE TRIGGER tr_audit_membership;
END $$;
