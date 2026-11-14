-- ==============================================================================
-- KAPLA — CHUẨN HÓA AUTH TOÀN DIỆN CHO 6 TÀI KHOẢN NHÂN SỰ
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  col RECORD;
  r RECORD;
  v_pw TEXT := crypt('Kapla@2026', gen_salt('bf'));
BEGIN
  -- 1. Quét và chuyển toàn bộ các cột kiểu text/varchar bị NULL trong auth.users thành chuỗi rỗng ''
  FOR col IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND data_type IN ('character varying', 'text')
      AND column_name NOT IN ('email', 'encrypted_password')
  LOOP
    BEGIN
      EXECUTE format('UPDATE auth.users SET %I = '''' WHERE %I IS NULL;', col.column_name, col.column_name);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  -- 2. Cập nhật mật khẩu chuẩn Kapla@2026 và xác nhận email
  UPDATE auth.users
  SET 
    encrypted_password = v_pw,
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
    is_super_admin = false,
    aud = 'authenticated',
    role = 'authenticated'
  WHERE email LIKE '%@kapla.edu.vn';

  -- 3. Xây dựng lại bảng auth.identities (id có kiểu UUID)
  DELETE FROM auth.identities 
  WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@kapla.edu.vn');

  FOR r IN SELECT id, email FROM auth.users WHERE email LIKE '%@kapla.edu.vn' LOOP
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
      r.id,               -- kiểu UUID
      r.id::text,         -- kiểu text
      r.id,               -- kiểu UUID
      json_build_object('sub', r.id::text, 'email', r.email)::jsonb,
      'email',
      now(),
      now(),
      now()
    );
  END LOOP;
END $$;
