-- ==============================================================================
-- KAPLA Staff Dashboard — Phase T01 + T02 Database Migration
-- Core Schema: Multi-branch, Staff Profiles, Role-Based Access Control, Auditing
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Table: branches (Quản lý đa chi nhánh)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(16) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    address TEXT,
    phone VARCHAR(32),
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Table: profiles (Hồ sơ nhân viên liên kết auth.users qua UUID)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(32),
    preferred_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    system_role VARCHAR(32) NOT NULL DEFAULT 'staff' CHECK (system_role IN ('system_admin', 'staff')),
    status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Table: branch_memberships (Phân bổ nhân sự vào chi nhánh và vai trò)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branch_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    role VARCHAR(64) NOT NULL CHECK (
        role IN (
            'CM',
            'Head Teacher',
            'Main Teacher',
            'HRT',
            'TA',
            'Supplementary Teacher',
            'CSKH'
        )
    ),
    is_primary BOOLEAN NOT NULL DEFAULT true,
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_branch UNIQUE (user_id, branch_id)
);

-- -----------------------------------------------------------------------------
-- 4. Table: classes (Quản lý lớp học theo chi nhánh — nền tảng cho T02 & T03)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    default_hrt_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    main_teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ta_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    schedule VARCHAR(200),
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_branch_class_name UNIQUE (branch_id, name)
);

-- -----------------------------------------------------------------------------
-- 5. Table: audit_logs (Nhật ký phân quyền, phê duyệt và thay đổi bảo mật)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email VARCHAR(255),
    action VARCHAR(64) NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices for rapid querying and filtering
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_branch ON public.profiles(preferred_branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_memberships_user ON public.branch_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_branch_memberships_branch ON public.branch_memberships(branch_id);
CREATE INDEX IF NOT EXISTS idx_classes_branch ON public.classes(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- -----------------------------------------------------------------------------
-- Helper Functions (SECURITY DEFINER to prevent recursion in RLS policies)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_system_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = p_user_id
          AND system_role = 'system_admin'
          AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_cm_of_branch(p_user_id UUID, p_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.branch_memberships bm
        JOIN public.profiles p ON p.id = bm.user_id
        WHERE bm.user_id = p_user_id
          AND bm.branch_id = p_branch_id
          AND bm.role = 'CM'
          AND bm.status = 'active'
          AND p.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_member_of_branch(p_user_id UUID, p_branch_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.branch_memberships bm
        JOIN public.profiles p ON p.id = bm.user_id
        WHERE bm.user_id = p_user_id
          AND bm.branch_id = p_branch_id
          AND bm.status = 'active'
          AND p.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_staff(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_user_id
          AND p.status = 'active'
          AND (
              p.system_role = 'system_admin'
              OR EXISTS (
                  SELECT 1
                  FROM public.branch_memberships bm
                  WHERE bm.user_id = p_user_id
                    AND bm.status = 'active'
              )
          )
    );
$$;

-- -----------------------------------------------------------------------------
-- Stored Procedures / RPCs for safe, atomic admin workflows
-- -----------------------------------------------------------------------------

-- Trigger function: Tạo hồ sơ profile khi người dùng đăng ký qua auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_branch_id UUID;
BEGIN
    v_full_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'displayName',
        split_part(new.email, '@', 1)
    );
    v_phone := new.raw_user_meta_data->>'phone';
    
    IF new.raw_user_meta_data->>'preferred_branch_id' IS NOT NULL THEN
        BEGIN
            v_branch_id := (new.raw_user_meta_data->>'preferred_branch_id')::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_branch_id := NULL;
        END;
    END IF;

    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        preferred_branch_id,
        system_role,
        status
    ) VALUES (
        new.id,
        new.email,
        v_full_name,
        v_phone,
        v_branch_id,
        'staff',
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        action,
        target_user_id,
        branch_id,
        details
    ) VALUES (
        new.id,
        new.email,
        'REGISTER_PENDING',
        new.id,
        v_branch_id,
        jsonb_build_object(
            'email', new.email,
            'full_name', v_full_name,
            'source', 'auth_signup'
        )
    );

    RETURN new;
END;
$$;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC: Phê duyệt tài khoản và gán chi nhánh, vai trò
CREATE OR REPLACE FUNCTION public.approve_user_membership(
    p_target_user_id UUID,
    p_branch_id UUID,
    p_role TEXT,
    p_system_role TEXT DEFAULT 'staff'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_is_sys_admin BOOLEAN;
    v_is_branch_cm BOOLEAN;
    v_target_email TEXT;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;
    v_is_sys_admin := public.is_system_admin(v_caller_id);
    v_is_branch_cm := public.is_cm_of_branch(v_caller_id, p_branch_id);

    IF NOT (v_is_sys_admin OR v_is_branch_cm) THEN
        RAISE EXCEPTION 'Không có quyền. Chỉ Quản trị hệ thống hoặc CM chi nhánh này mới có quyền duyệt nhân sự.';
    END IF;

    -- Validate target profile
    SELECT email INTO v_target_email FROM public.profiles WHERE id = p_target_user_id;
    IF v_target_email IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy hồ sơ người dùng mục tiêu.';
    END IF;

    -- Update profile status
    UPDATE public.profiles
    SET status = 'active',
        rejection_reason = NULL,
        system_role = CASE
            WHEN v_is_sys_admin AND p_system_role IS NOT NULL THEN p_system_role
            ELSE system_role
        END,
        updated_at = now()
    WHERE id = p_target_user_id;

    -- Insert or update membership
    INSERT INTO public.branch_memberships (
        user_id,
        branch_id,
        role,
        is_primary,
        status,
        updated_at
    ) VALUES (
        p_target_user_id,
        p_branch_id,
        p_role,
        true,
        'active',
        now()
    )
    ON CONFLICT (user_id, branch_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active',
        updated_at = now();

    -- Audit log
    INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        action,
        target_user_id,
        branch_id,
        details
    ) VALUES (
        v_caller_id,
        v_caller_email,
        'APPROVE_USER_ROLE',
        p_target_user_id,
        p_branch_id,
        jsonb_build_object(
            'role', p_role,
            'system_role', p_system_role,
            'target_email', v_target_email
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Phê duyệt và cấp vai trò thành công.',
        'user_id', p_target_user_id,
        'branch_id', p_branch_id,
        'role', p_role
    );
END;
$$;

-- RPC: Vô hiệu hóa tài khoản
CREATE OR REPLACE FUNCTION public.deactivate_user(
    p_target_user_id UUID,
    p_reason TEXT DEFAULT 'Tài khoản bị tạm ngưng theo yêu cầu quản trị'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập.';
    END IF;

    IF NOT public.is_system_admin(v_caller_id) THEN
        RAISE EXCEPTION 'Chỉ Quản trị hệ thống mới có thể vô hiệu hóa tài khoản.';
    END IF;

    IF v_caller_id = p_target_user_id THEN
        RAISE EXCEPTION 'Không thể tự vô hiệu hóa tài khoản của chính mình.';
    END IF;

    SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;

    UPDATE public.profiles
    SET status = 'inactive',
        rejection_reason = p_reason,
        updated_at = now()
    WHERE id = p_target_user_id;

    INSERT INTO public.audit_logs (
        actor_id,
        actor_email,
        action,
        target_user_id,
        details
    ) VALUES (
        v_caller_id,
        v_caller_email,
        'DEACTIVATE_USER',
        p_target_user_id,
        jsonb_build_object('reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'message', 'Đã vô hiệu hóa tài khoản.');
END;
$$;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branch_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Branches Policies
CREATE POLICY "Mọi người dùng đã đăng nhập có thể xem danh sách chi nhánh"
    ON public.branches FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ Quản trị hệ thống có quyền sửa đổi chi nhánh"
    ON public.branches FOR ALL
    TO authenticated
    USING (public.is_system_admin(auth.uid()))
    WITH CHECK (public.is_system_admin(auth.uid()));

-- 2. Profiles Policies
CREATE POLICY "Người dùng xem hồ sơ của mình"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR public.is_system_admin(auth.uid())
        OR EXISTS (
            SELECT 1
            FROM public.branch_memberships bm
            WHERE bm.user_id = auth.uid()
              AND bm.role = 'CM'
              AND bm.status = 'active'
              AND (
                  bm.branch_id = profiles.preferred_branch_id
                  OR EXISTS (
                      SELECT 1
                      FROM public.branch_memberships bm2
                      WHERE bm2.user_id = profiles.id
                        AND bm2.branch_id = bm.branch_id
                  )
              )
        )
    );

CREATE POLICY "Người dùng cập nhật thông tin cá nhân cơ bản"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_system_admin(auth.uid()))
    WITH CHECK (
        id = auth.uid() OR public.is_system_admin(auth.uid())
    );

-- 3. Branch Memberships Policies
CREATE POLICY "Nhân viên xem phân bổ vai trò trong chi nhánh của mình"
    ON public.branch_memberships FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Chỉ Admin và CM có quyền phân bổ vai trò"
    ON public.branch_memberships FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    );

-- 4. Classes Policies
CREATE POLICY "Nhân viên xem lớp học trong chi nhánh của mình"
    ON public.classes FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Admin và CM/Head Teacher quản lý lớp học"
    ON public.classes FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    );

-- 5. Audit Logs Policies
CREATE POLICY "Xem nhật ký hệ thống"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR (branch_id IS NOT NULL AND public.is_cm_of_branch(auth.uid(), branch_id))
    );

CREATE POLICY "Ghi nhật ký bảo mật"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (actor_id = auth.uid() OR public.is_system_admin(auth.uid()));
