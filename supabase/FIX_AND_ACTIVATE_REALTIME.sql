-- ==============================================================================
-- KAPLA — CHUẨN HÓA AUTH.USERS & AUTH.IDENTITIES (CHỈ CHẠY KHỐI NÀY)
-- Realtime đã được bật thành công trên database của bạn!
-- ==============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- 1. Chuẩn hóa các trường token bắt buộc của auth.users
  UPDATE auth.users
  SET 
    confirmation_token = COALESCE(confirmation_token, ''),
    recovery_token = COALESCE(recovery_token, ''),
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change = COALESCE(email_change, ''),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    is_super_admin = false,
    email_confirmed_at = COALESCE(email_confirmed_at, now());

  -- 2. Tạo liên kết danh tính trong auth.identities cho từng tài khoản nhân sự
  FOR r IN SELECT id, email FROM auth.users LOOP
    DELETE FROM auth.identities WHERE user_id = r.id;
    INSERT INTO auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      r.id::text,
      r.id,
      json_build_object('sub', r.id, 'email', r.email)::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  END LOOP;
END $$;
