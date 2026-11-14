-- ==============================================================================
-- KAPLA STAFF DASHBOARD — COMPLETE DATABASE SCHEMA & SEED FOR SUPABASE
-- Copy and Paste this ENTIRE file into Supabase SQL Editor and click RUN
-- ==============================================================================



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000001_initial_schema.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — Phase T01 + T02 Database Migration
-- Core Schema: Multi-branch, Staff Profiles, Role-Based Access Control, Auditing
-- ==============================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

    -- Allow authorized state transition within this transaction
    PERFORM set_config('kapla.allow_approval', 'true', true);

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
    v_is_admin BOOLEAN;
BEGIN
    v_is_admin := (auth.jwt()->>'role' = 'service_role') OR (v_caller_id IS NOT NULL AND public.is_system_admin(v_caller_id));

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Chỉ Quản trị hệ thống mới có thể vô hiệu hóa tài khoản.';
    END IF;

    IF v_caller_id IS NOT NULL AND v_caller_id = p_target_user_id THEN
        RAISE EXCEPTION 'Không thể tự vô hiệu hóa tài khoản của chính mình.';
    END IF;

    IF v_caller_id IS NOT NULL THEN
        SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;
    ELSE
        v_caller_email := 'service_role_admin';
    END IF;

    -- Allow authorized state transition within this transaction
    PERFORM set_config('kapla.allow_approval', 'true', true);

    UPDATE public.profiles
    SET status = 'inactive',
        rejection_reason = p_reason,
        updated_at = now()
    WHERE id = p_target_user_id;

    -- Vô hiệu hóa phân bổ chi nhánh của nhân sự
    UPDATE public.branch_memberships
    SET status = 'inactive',
        updated_at = now()
    WHERE user_id = p_target_user_id;

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



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000002_security_hardening_and_audit.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — Security Hardening, Tamper-Proof Audit & RBAC Controls
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Triggers to PREVENT PRIVILEGE ESCALATION
-- -----------------------------------------------------------------------------

-- Trigger 1: Ngăn chặn nhân viên tự đổi vai trò hệ thống hoặc kích hoạt trạng thái tài khoản
CREATE OR REPLACE FUNCTION public.enforce_profile_update_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cho phép nếu là direct postgres session (migration/seed/local CLI không có auth.uid())
    -- hoặc token service_role của backend
    -- hoặc người dùng hiện tại là system_admin trong public.profiles
    -- hoặc giao dịch RPC an toàn đã được xác thực (kapla.allow_approval)
    IF (current_setting('kapla.allow_approval', true) = 'true')
       OR (session_user = 'postgres' AND auth.uid() IS NULL)
       OR (auth.jwt()->>'role' = 'service_role') 
       OR (auth.uid() IS NOT NULL AND public.is_system_admin(auth.uid())) THEN
        NEW.updated_at = now();
        RETURN NEW;
    END IF;

    -- Nếu là nhân viên thông thường qua PostgREST (kể cả CM khi sửa profile mình):
    -- 1. Không cho phép tự đổi status
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Nhân viên không thể tự thay đổi trạng thái tài khoản (status).'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Không cho phép tự đổi system_role
    IF NEW.system_role IS DISTINCT FROM OLD.system_role THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Nhân viên không thể tự nâng quyền hệ thống (system_role).'
            USING ERRCODE = '42501';
    END IF;

    -- 3. Không cho phép sửa lý do từ chối/khóa
    IF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Nhân viên không thể tự sửa lý do từ chối.'
            USING ERRCODE = '42501';
    END IF;

    -- 4. Không cho phép sửa id hoặc email
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Không thể sửa đổi định danh ID hoặc Email tài khoản.'
            USING ERRCODE = '42501';
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_profile_security ON public.profiles;
CREATE TRIGGER tr_enforce_profile_security
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_profile_update_security();

-- Trigger 2: Ngăn chặn tự cấp vai trò và giới hạn quyền bổ nhiệm CM
CREATE OR REPLACE FUNCTION public.enforce_membership_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cho phép direct postgres session, service_role, Quản trị hệ thống hoặc RPC phê duyệt an toàn
    IF (current_setting('kapla.allow_approval', true) = 'true')
       OR (session_user = 'postgres' AND auth.uid() IS NULL)
       OR (auth.jwt()->>'role' = 'service_role') 
       OR (auth.uid() IS NOT NULL AND public.is_system_admin(auth.uid())) THEN
        NEW.updated_at = now();
        RETURN NEW;
    END IF;

    -- Không ai được tự phân bổ hoặc sửa đổi vai trò của chính mình
    IF auth.uid() = NEW.user_id THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Không thể tự cấp hoặc sửa đổi vai trò chi nhánh của chính mình.'
            USING ERRCODE = '42501';
    END IF;

    -- Chỉ Quản trị hệ thống mới có quyền bổ nhiệm vai trò 'CM'
    IF NEW.role = 'CM' THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống mới có thể bổ nhiệm Giám đốc cơ sở (CM).'
            USING ERRCODE = '42501';
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_membership_security ON public.branch_memberships;
CREATE TRIGGER tr_enforce_membership_security
    BEFORE INSERT OR UPDATE ON public.branch_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_membership_security();

-- -----------------------------------------------------------------------------
-- 2. Tự động ghi nhận Nhật ký kiểm toán (Tamper-Proof Audit Triggers)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.audit_profile_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT;
BEGIN
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM public.profiles WHERE id = v_actor_id;
    ELSE
        v_actor_email := COALESCE(auth.jwt()->>'email', 'system_admin_api');
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.audit_logs (
            actor_id,
            actor_email,
            action,
            target_user_id,
            branch_id,
            details
        ) VALUES (
            v_actor_id,
            v_actor_email,
            'PROFILE_STATUS_CHANGED',
            NEW.id,
            NEW.preferred_branch_id,
            jsonb_build_object(
                'target_email', NEW.email,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'reason', NEW.rejection_reason
            )
        );
    END IF;

    IF OLD.system_role IS DISTINCT FROM NEW.system_role THEN
        INSERT INTO public.audit_logs (
            actor_id,
            actor_email,
            action,
            target_user_id,
            details
        ) VALUES (
            v_actor_id,
            v_actor_email,
            'SYSTEM_ROLE_CHANGED',
            NEW.id,
            jsonb_build_object(
                'target_email', NEW.email,
                'old_role', OLD.system_role,
                'new_role', NEW.system_role
            )
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_profile ON public.profiles;
CREATE TRIGGER tr_audit_profile
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profile_modifications();

-- Trigger tự động ghi log khi phân bổ vai trò chi nhánh thay đổi
CREATE OR REPLACE FUNCTION public.audit_membership_modifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_actor_email TEXT;
    v_target_email TEXT;
    v_branch_name TEXT;
BEGIN
    IF v_actor_id IS NOT NULL THEN
        SELECT email INTO v_actor_email FROM public.profiles WHERE id = v_actor_id;
    ELSE
        v_actor_email := COALESCE(auth.jwt()->>'email', 'system_admin_api');
    END IF;

    IF TG_OP = 'DELETE' THEN
        SELECT email INTO v_target_email FROM public.profiles WHERE id = OLD.user_id;
        SELECT name INTO v_branch_name FROM public.branches WHERE id = OLD.branch_id;
        INSERT INTO public.audit_logs (
            actor_id, actor_email, action, target_user_id, branch_id, details
        ) VALUES (
            v_actor_id, v_actor_email, 'MEMBERSHIP_REVOKED', OLD.user_id, OLD.branch_id,
            jsonb_build_object('target_email', v_target_email, 'revoked_role', OLD.role, 'branch_name', v_branch_name)
        );
        RETURN OLD;
    ELSE
        SELECT email INTO v_target_email FROM public.profiles WHERE id = NEW.user_id;
        SELECT name INTO v_branch_name FROM public.branches WHERE id = NEW.branch_id;
        INSERT INTO public.audit_logs (
            actor_id, actor_email, action, target_user_id, branch_id, details
        ) VALUES (
            v_actor_id, v_actor_email,
            CASE WHEN TG_OP = 'INSERT' THEN 'MEMBERSHIP_ASSIGNED' ELSE 'MEMBERSHIP_UPDATED' END,
            NEW.user_id, NEW.branch_id,
            jsonb_build_object('target_email', v_target_email, 'role', NEW.role, 'status', NEW.status, 'branch_name', v_branch_name)
        );
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_membership ON public.branch_memberships;
CREATE TRIGGER tr_audit_membership
    AFTER INSERT OR UPDATE OR DELETE ON public.branch_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_membership_modifications();

-- -----------------------------------------------------------------------------
-- 3. Bảo vệ tính bất biến của bảng Nhật ký (Append-Only Audit Logs)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Bảo mật: Nhật ký kiểm toán là dữ liệu bất biến, không thể sửa đổi hoặc xóa bỏ.'
        USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS tr_prevent_audit_tampering ON public.audit_logs;
CREATE TRIGGER tr_prevent_audit_tampering
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_tampering();

-- -----------------------------------------------------------------------------
-- 4. Tinh chỉnh chính sách RLS trên profiles để bảo vệ thông tin đồng nghiệp
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Người dùng xem hồ sơ của mình" ON public.profiles;
DROP POLICY IF EXISTS "Quy định xem hồ sơ nhân viên" ON public.profiles;
CREATE POLICY "Quy định xem hồ sơ nhân viên"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        -- 1. Xem chính mình
        id = auth.uid()
        -- 2. Quản trị hệ thống xem tất cả
        OR public.is_system_admin(auth.uid())
        -- 3. CM xem thành viên cơ sở của mình và ứng viên chờ duyệt đăng ký cơ sở mình
        OR (
            public.is_active_staff(auth.uid())
            AND EXISTS (
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
                            AND bm2.status = 'active'
                      )
                  )
            )
        )
        -- 4. Nhân sự đang hoạt động xem đồng nghiệp cùng chi nhánh hoạt động
        OR (
            public.is_active_staff(auth.uid())
            AND EXISTS (
                SELECT 1
                FROM public.branch_memberships my_bm
                JOIN public.branch_memberships colleague_bm ON colleague_bm.branch_id = my_bm.branch_id
                WHERE my_bm.user_id = auth.uid()
                  AND my_bm.status = 'active'
                  AND colleague_bm.user_id = profiles.id
                  AND colleague_bm.status = 'active'
            )
        )
    );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000003_audit_log_lockdown.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — Audit Log Lockdown
-- Ngăn chặn tuyệt đối tài khoản nhân viên chèn hoặc can thiệp nhật ký kiểm toán trực tiếp
-- ==============================================================================

-- 1. Thu hồi quyền chèn, sửa, xóa nhật ký từ client roles (authenticated, anon, public)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM authenticated, anon, public;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO postgres, service_role;

-- 2. Trigger kiểm soát bảo mật chèn nhật ký
CREATE OR REPLACE FUNCTION public.enforce_audit_log_insert_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Chỉ cho phép hệ thống nội bộ (postgres, service_role) hoặc qua trigger SECURITY DEFINER
    -- Tuyệt đối chặn mọi hành vi tài khoản authenticated gọi trực tiếp API insert
    IF (auth.jwt()->>'role' = 'authenticated') AND (current_user != 'postgres') THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Tài khoản nhân viên không được phép chèn nhật ký kiểm toán trực tiếp.'
            USING ERRCODE = '42501';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_audit_insert_security ON public.audit_logs;
CREATE TRIGGER tr_enforce_audit_insert_security
    BEFORE INSERT ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_audit_log_insert_security();



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000004_t03_students_enrollments_hrt.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — T03: Student Profiles, Tuition, Enrollments & HRT Precedence
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: students (Hồ sơ học viên)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    student_code TEXT NOT NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    tuition_expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'expired', 'reserved', 'dropped')),
    current_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    assigned_hrt_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_student_code_per_branch UNIQUE (branch_id, student_code)
);

CREATE INDEX IF NOT EXISTS idx_students_branch ON public.students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(current_class_id);
CREATE INDEX IF NOT EXISTS idx_students_assigned_hrt ON public.students(assigned_hrt_id);
CREATE INDEX IF NOT EXISTS idx_students_tuition_expiry ON public.students(tuition_expiry_date);

-- -----------------------------------------------------------------------------
-- 2. Table: enrollments (Ghi danh học viên vào lớp)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'completed', 'dropped')),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.enrollments(status);

-- -----------------------------------------------------------------------------
-- 3. Table: class_transfers (Lịch sử chuyển lớp)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.class_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    from_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    to_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    from_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    to_branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    reason TEXT NOT NULL,
    transferred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_transfers_student ON public.class_transfers(student_id);
CREATE INDEX IF NOT EXISTS idx_class_transfers_created_at ON public.class_transfers(created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Table: student_hrt_assignments (Lịch sử phân công HRT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_hrt_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    hrt_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assignment_type TEXT NOT NULL DEFAULT 'specific' CHECK (assignment_type IN ('specific', 'unassigned')),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_hrt_assignments_student ON public.student_hrt_assignments(student_id);

-- -----------------------------------------------------------------------------
-- 5. Table: student_tasks (Danh sách công việc chăm sóc học viên)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('care_call', 'progress_report', 'tuition_reminder', 'attendance_check', 'academic_support')),
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_tasks_student ON public.student_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_branch ON public.student_tasks(branch_id);
CREATE INDEX IF NOT EXISTS idx_student_tasks_status ON public.student_tasks(status);

-- -----------------------------------------------------------------------------
-- 6. Helper Function: get_effective_hrt_id (Quy tắc ưu tiên HRT riêng)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_effective_hrt_id(p_student_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE(
        s.assigned_hrt_id,
        c.default_hrt_id
    )
    FROM public.students s
    LEFT JOIN public.classes c ON c.id = s.current_class_id
    WHERE s.id = p_student_id;
$$;

-- Kiểm tra xem user có phải là HRT chịu trách nhiệm của học viên không
CREATE OR REPLACE FUNCTION public.is_responsible_hrt_for_student(p_user_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.students s
        LEFT JOIN public.classes c ON c.id = s.current_class_id
        WHERE s.id = p_student_id
          AND public.is_active_member_of_branch(p_user_id, s.branch_id)
          AND (
              -- Ưu tiên 1: Học viên có HRT riêng -> Phải đúng HRT riêng
              (s.assigned_hrt_id IS NOT NULL AND s.assigned_hrt_id = p_user_id)
              -- Ưu tiên 2: Học viên không có HRT riêng -> Thuộc HRT mặc định của lớp
              OR (s.assigned_hrt_id IS NULL AND c.default_hrt_id = p_user_id)
          )
    );
$$;

-- -----------------------------------------------------------------------------
-- 7. Stored Procedures: Chuyển lớp & Phân công HRT
-- -----------------------------------------------------------------------------

-- Chuyển lớp có lưu lịch sử
CREATE OR REPLACE FUNCTION public.transfer_student_class(
    p_student_id UUID,
    p_to_class_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_student RECORD;
    v_target_class RECORD;
    v_is_sys_admin BOOLEAN;
    v_is_source_cm BOOLEAN;
    v_is_target_cm BOOLEAN;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy học viên với ID đã cung cấp.';
    END IF;

    SELECT * INTO v_target_class FROM public.classes WHERE id = p_to_class_id;
    IF v_target_class.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy lớp học đích.';
    END IF;

    v_is_sys_admin := public.is_system_admin(v_caller_id);
    v_is_source_cm := public.is_cm_of_branch(v_caller_id, v_student.branch_id);
    v_is_target_cm := public.is_cm_of_branch(v_caller_id, v_target_class.branch_id);

    -- Chỉ System Admin hoặc CM của cơ sở mới có quyền chuyển lớp
    IF NOT (v_is_sys_admin OR v_is_source_cm OR v_is_target_cm) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ CM hoặc Quản trị hệ thống mới có quyền chuyển lớp học viên.'
            USING ERRCODE = '42501';
    END IF;

    -- Đóng enrollment hiện tại
    UPDATE public.enrollments
    SET status = 'transferred',
        end_date = CURRENT_DATE
    WHERE student_id = p_student_id
      AND status = 'active';

    -- Tạo enrollment mới
    INSERT INTO public.enrollments (
        student_id,
        class_id,
        branch_id,
        start_date,
        status
    ) VALUES (
        p_student_id,
        p_to_class_id,
        v_target_class.branch_id,
        CURRENT_DATE,
        'active'
    );

    -- Lưu lịch sử chuyển lớp
    INSERT INTO public.class_transfers (
        student_id,
        from_class_id,
        to_class_id,
        from_branch_id,
        to_branch_id,
        transfer_date,
        reason,
        transferred_by
    ) VALUES (
        p_student_id,
        v_student.current_class_id,
        p_to_class_id,
        v_student.branch_id,
        v_target_class.branch_id,
        now(),
        p_reason,
        v_caller_id
    );

    -- Cập nhật thông tin học viên
    UPDATE public.students
    SET current_class_id = p_to_class_id,
        branch_id = v_target_class.branch_id,
        updated_at = now()
    WHERE id = p_student_id;

    -- Tự động ghi nhật ký kiểm toán bất biến
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
        'STUDENT_CLASS_TRANSFERRED',
        NULL,
        v_target_class.branch_id,
        jsonb_build_object(
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'from_class_id', v_student.current_class_id,
            'to_class_id', p_to_class_id,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Chuyển lớp học viên thành công.',
        'student_id', p_student_id,
        'new_class_id', p_to_class_id
    );
END;
$$;

-- Phân công hoặc hủy phân công HRT riêng
CREATE OR REPLACE FUNCTION public.assign_student_hrt(
    p_student_id UUID,
    p_hrt_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_student RECORD;
    v_is_sys_admin BOOLEAN;
    v_is_cm BOOLEAN;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy học viên.';
    END IF;

    v_is_sys_admin := public.is_system_admin(v_caller_id);
    v_is_cm := public.is_cm_of_branch(v_caller_id, v_student.branch_id);

    IF NOT (v_is_sys_admin OR v_is_cm) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ CM chi nhánh hoặc Quản trị hệ thống mới có quyền phân công HRT.'
            USING ERRCODE = '42501';
    END IF;

    -- Nếu gán HRT mới, kiểm tra HRT có thuộc cùng chi nhánh không
    IF p_hrt_id IS NOT NULL THEN
        IF NOT public.is_active_member_of_branch(p_hrt_id, v_student.branch_id) THEN
            RAISE EXCEPTION 'Lỗi: Nhân sự được chỉ định không thuộc chi nhánh của học viên này.';
        END IF;
    END IF;

    -- Cập nhật học viên
    UPDATE public.students
    SET assigned_hrt_id = p_hrt_id,
        updated_at = now()
    WHERE id = p_student_id;

    -- Ghi nhận lịch sử phân công
    INSERT INTO public.student_hrt_assignments (
        student_id,
        hrt_id,
        assigned_by,
        assignment_type,
        reason
    ) VALUES (
        p_student_id,
        p_hrt_id,
        v_caller_id,
        CASE WHEN p_hrt_id IS NOT NULL THEN 'specific' ELSE 'unassigned' END,
        p_reason
    );

    -- Ghi audit log
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
        CASE WHEN p_hrt_id IS NOT NULL THEN 'STUDENT_HRT_ASSIGNED' ELSE 'STUDENT_HRT_UNASSIGNED' END,
        p_hrt_id,
        v_student.branch_id,
        jsonb_build_object(
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'assigned_hrt_id', p_hrt_id,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN p_hrt_id IS NOT NULL THEN 'Phân công HRT riêng thành công.' ELSE 'Đã hủy phân công HRT riêng, quay về HRT mặc định của lớp.' END,
        'student_id', p_student_id,
        'assigned_hrt_id', p_hrt_id
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 8. Row-Level Security (RLS) Policies với Quy tắc ưu tiên HRT riêng
-- -----------------------------------------------------------------------------

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_hrt_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;

-- 8.1 Students RLS
CREATE POLICY "Quyền xem hồ sơ học viên theo quy tắc ưu tiên HRT và cơ sở"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        -- Quản trị hệ thống xem tất cả
        public.is_system_admin(auth.uid())
        -- CM xem tất cả học viên trong cơ sở của mình
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        -- HRT: Áp dụng quy tắc ưu tiên HRT riêng
        OR public.is_responsible_hrt_for_student(auth.uid(), id)
    );

CREATE POLICY "Admin và CM quản lý học viên cơ sở"
    ON public.students FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    );

-- 8.2 Enrollments RLS
CREATE POLICY "Xem ghi danh theo quyền học viên"
    ON public.enrollments FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    );

CREATE POLICY "Admin và CM quản lý ghi danh"
    ON public.enrollments FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
    );

-- 8.3 Class Transfers RLS
CREATE POLICY "Xem lịch sử chuyển lớp"
    ON public.class_transfers FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), from_branch_id)
        OR public.is_cm_of_branch(auth.uid(), to_branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    );

-- 8.4 Student HRT Assignments History RLS
CREATE POLICY "Xem lịch sử phân công HRT"
    ON public.student_hrt_assignments FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_hrt_assignments.student_id
              AND (
                  public.is_cm_of_branch(auth.uid(), s.branch_id)
                  OR public.is_responsible_hrt_for_student(auth.uid(), s.id)
              )
        )
    );

-- 8.5 Student Tasks RLS (Dùng cùng quy tắc ưu tiên HRT riêng)
CREATE POLICY "Xem công việc chăm sóc theo quy tắc HRT ưu tiên"
    ON public.student_tasks FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    );

CREATE POLICY "Cập nhật công việc chăm sóc"
    ON public.student_tasks FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000005_t03_p0_hardening.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — T03 P0 Hardening
-- 1. Giới hạn CM chuyển lớp trong cơ sở mình, chuyển khác cơ sở dành riêng cho Quản trị hệ thống
-- 2. Đảm bảo mỗi học viên có tối đa 1 ghi danh active qua partial unique index và khóa FOR UPDATE
-- 3. Mọi chuyển lớp đều lưu lịch sử và audit log trong cùng giao dịch
-- ==============================================================================

-- 1. Unique index: Đảm bảo tối đa 1 enrollment active cho mỗi học viên
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_enrollment_per_student
    ON public.enrollments(student_id)
    WHERE status = 'active';

-- 2. Cập nhật Stored Procedure transfer_student_class
CREATE OR REPLACE FUNCTION public.transfer_student_class(
    p_student_id UUID,
    p_to_class_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_student RECORD;
    v_target_class RECORD;
    v_is_sys_admin BOOLEAN;
    v_is_source_cm BOOLEAN;
    v_is_cross_branch BOOLEAN;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;

    -- Khóa dòng học viên bằng FOR UPDATE để chống race condition khi có 2 yêu cầu đồng thời
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id FOR UPDATE;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy học viên với ID đã cung cấp.';
    END IF;

    SELECT * INTO v_target_class FROM public.classes WHERE id = p_to_class_id;
    IF v_target_class.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy lớp học đích.';
    END IF;

    -- Chặn chuyển vào chính lớp hiện tại
    IF v_student.current_class_id = p_to_class_id THEN
        RAISE EXCEPTION 'Lỗi: Học viên đã đang theo học tại lớp này.'
            USING ERRCODE = 'P0001';
    END IF;

    v_is_sys_admin := public.is_system_admin(v_caller_id);
    v_is_source_cm := public.is_cm_of_branch(v_caller_id, v_student.branch_id);
    v_is_cross_branch := (v_student.branch_id IS DISTINCT FROM v_target_class.branch_id);

    -- QUY TẮC P0.1: Chuyển khác cơ sở TẠM THỜI DÀNH RIÊNG CHO QUẢN TRỊ HỆ THỐNG
    IF v_is_cross_branch THEN
        IF NOT v_is_sys_admin THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chuyển lớp khác cơ sở chỉ dành cho Quản trị hệ thống.'
                USING ERRCODE = '42501';
        END IF;
    ELSE
        -- Chuyển nội bộ trong cơ sở: CM của cơ sở nguồn hoặc Quản trị hệ thống
        IF NOT (v_is_sys_admin OR v_is_source_cm) THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chỉ CM cơ sở sở tại hoặc Quản trị hệ thống mới có quyền chuyển lớp nội bộ.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    -- QUY TẮC P0.2: Đóng ghi danh cũ và mở ghi danh mới trong cùng transaction
    UPDATE public.enrollments
    SET status = 'transferred',
        end_date = CURRENT_DATE
    WHERE student_id = p_student_id
      AND status = 'active';

    -- Tạo ghi danh mới active (được bảo vệ bởi uq_active_enrollment_per_student)
    INSERT INTO public.enrollments (
        student_id,
        class_id,
        branch_id,
        start_date,
        status
    ) VALUES (
        p_student_id,
        p_to_class_id,
        v_target_class.branch_id,
        CURRENT_DATE,
        'active'
    );

    -- Lưu vết lịch sử chuyển lớp bất biến
    INSERT INTO public.class_transfers (
        student_id,
        from_class_id,
        to_class_id,
        from_branch_id,
        to_branch_id,
        transfer_date,
        reason,
        transferred_by
    ) VALUES (
        p_student_id,
        v_student.current_class_id,
        p_to_class_id,
        v_student.branch_id,
        v_target_class.branch_id,
        now(),
        p_reason,
        v_caller_id
    );

    -- Cập nhật thông tin lớp hiện tại và cơ sở của học viên
    UPDATE public.students
    SET current_class_id = p_to_class_id,
        branch_id = v_target_class.branch_id,
        updated_at = now()
    WHERE id = p_student_id;

    -- Ghi nhật ký kiểm toán bất biến
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
        'STUDENT_CLASS_TRANSFERRED',
        NULL,
        v_target_class.branch_id,
        jsonb_build_object(
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'from_class_id', v_student.current_class_id,
            'to_class_id', p_to_class_id,
            'from_branch_id', v_student.branch_id,
            'to_branch_id', v_target_class.branch_id,
            'is_cross_branch', v_is_cross_branch,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Chuyển lớp học viên thành công.',
        'student_id', p_student_id,
        'new_class_id', p_to_class_id,
        'is_cross_branch', v_is_cross_branch
    );
END;
$$;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000006_t04_assessments_and_interventions.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — T04: 4-Skill Assessments & Intervention Tickets
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Helper function: Kiểm tra xem user có phải Head Teacher hoặc CM của cơ sở không
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_ht_or_cm_of_branch(p_user_id UUID, p_branch_id UUID)
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
          AND bm.role IN ('CM', 'Head Teacher')
          AND bm.status = 'active'
          AND p.status = 'active'
    );
$$;

-- -----------------------------------------------------------------------------
-- 2. Table: student_assessments (Đánh giá năng lực 4 kỹ năng Cambridge)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    period TEXT NOT NULL,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    -- Thang điểm 0 - 5 khiên (Shields) theo chuẩn Cambridge Starters/Movers/Flyers
    listening_score NUMERIC(3,1) NOT NULL CHECK (listening_score >= 0 AND listening_score <= 5),
    speaking_score NUMERIC(3,1) NOT NULL CHECK (speaking_score >= 0 AND speaking_score <= 5),
    reading_score NUMERIC(3,1) NOT NULL CHECK (reading_score >= 0 AND reading_score <= 5),
    writing_score NUMERIC(3,1) NOT NULL CHECK (writing_score >= 0 AND writing_score <= 5),
    strengths TEXT,
    weaknesses TEXT,
    progress_notes TEXT,
    has_academic_risk BOOLEAN DEFAULT false,
    assessed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessments_student ON public.student_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_branch ON public.student_assessments(branch_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class ON public.student_assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_risk ON public.student_assessments(has_academic_risk);

-- Trigger tự động phát hiện rủi ro học thuật nếu có kỹ năng < 3 khiên
CREATE OR REPLACE FUNCTION public.check_assessment_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (NEW.listening_score < 3.0 OR NEW.speaking_score < 3.0 OR NEW.reading_score < 3.0 OR NEW.writing_score < 3.0) THEN
        NEW.has_academic_risk = true;
    ELSE
        NEW.has_academic_risk = false;
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_check_assessment_risk ON public.student_assessments;
CREATE TRIGGER tr_check_assessment_risk
    BEFORE INSERT OR UPDATE ON public.student_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_assessment_risk();

-- -----------------------------------------------------------------------------
-- 3. Table: interventions (Phiếu can thiệp học thuật 4 bước)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.student_assessments(id) ON DELETE SET NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    issue_description TEXT NOT NULL,
    root_cause TEXT,
    action_plan TEXT NOT NULL,
    assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    reassessment_result TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'verified')),
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interventions_student ON public.interventions(student_id);
CREATE INDEX IF NOT EXISTS idx_interventions_branch ON public.interventions(branch_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON public.interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_due_date ON public.interventions(due_date);

-- Trigger bảo mật: Chỉ Head Teacher, CM của cơ sở hoặc System Admin mới có thể xác minh phiếu
CREATE OR REPLACE FUNCTION public.enforce_intervention_verification_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_sys_admin BOOLEAN;
    v_is_ht_or_cm BOOLEAN;
BEGIN
    -- Nếu không đổi status sang 'verified', cho phép
    IF (NEW.status IS NOT DISTINCT FROM OLD.status) OR (NEW.status != 'verified') THEN
        NEW.updated_at = now();
        RETURN NEW;
    END IF;

    -- Cho phép direct postgres session, service_role
    IF (session_user = 'postgres' AND auth.uid() IS NULL)
       OR (auth.jwt()->>'role' = 'service_role') THEN
        NEW.updated_at = now();
        RETURN NEW;
    END IF;

    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    v_is_sys_admin := public.is_system_admin(v_caller_id);
    v_is_ht_or_cm := public.is_ht_or_cm_of_branch(v_caller_id, NEW.branch_id);

    IF NOT (v_is_sys_admin OR v_is_ht_or_cm) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Head Teacher hoặc CM chi nhánh này mới có quyền xác minh phiếu can thiệp.'
            USING ERRCODE = '42501';
    END IF;

    NEW.verified_by = v_caller_id;
    NEW.verified_at = now();
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_intervention_verification ON public.interventions;
CREATE TRIGGER tr_enforce_intervention_verification
    BEFORE UPDATE ON public.interventions
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_intervention_verification_security();

-- -----------------------------------------------------------------------------
-- 4. Stored Procedure: Xác minh phiếu can thiệp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_intervention(
    p_intervention_id UUID,
    p_verification_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_intervention RECORD;
    v_is_sys_admin BOOLEAN;
    v_is_ht_or_cm BOOLEAN;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;
    SELECT * INTO v_intervention FROM public.interventions WHERE id = p_intervention_id;
    IF v_intervention.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy phiếu can thiệp.';
    END IF;

    v_is_sys_admin := public.is_system_admin(v_caller_id);
    v_is_ht_or_cm := public.is_ht_or_cm_of_branch(v_caller_id, v_intervention.branch_id);

    IF NOT (v_is_sys_admin OR v_is_ht_or_cm) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Head Teacher hoặc CM chi nhánh mới có quyền xác minh phiếu can thiệp.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.interventions
    SET status = 'verified',
        verified_by = v_caller_id,
        verified_at = now(),
        verification_notes = p_verification_notes,
        updated_at = now()
    WHERE id = p_intervention_id;

    -- Tự động ghi nhật ký kiểm toán bất biến
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
        'INTERVENTION_VERIFIED',
        v_intervention.assigned_staff_id,
        v_intervention.branch_id,
        jsonb_build_object(
            'intervention_id', p_intervention_id,
            'student_id', v_intervention.student_id,
            'verification_notes', p_verification_notes
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Đã xác minh phiếu can thiệp học thuật.',
        'intervention_id', p_intervention_id,
        'status', 'verified'
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Row-Level Security (RLS) Policies
-- -----------------------------------------------------------------------------

ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- 5.1 Assessments RLS
CREATE POLICY "Xem bài đánh giá năng lực theo chi nhánh"
    ON public.student_assessments FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Tạo bài đánh giá năng lực trong chi nhánh"
    ON public.student_assessments FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Cập nhật bài đánh giá năng lực"
    ON public.student_assessments FOR UPDATE
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR assessed_by = auth.uid()
    );

-- 5.2 Interventions RLS
CREATE POLICY "Xem phiếu can thiệp theo chi nhánh"
    ON public.interventions FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Tạo phiếu can thiệp trong chi nhánh"
    ON public.interventions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Cập nhật phiếu can thiệp"
    ON public.interventions FOR UPDATE
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR assigned_staff_id = auth.uid()
        OR created_by = auth.uid()
    );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000007_t03_t04_security_hardening.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — T03 & T04 Security & Workflow Hardening
-- 1. Bảo đảm đổi lớp và ghi danh bắt buộc đi qua luồng transfer_student_class có lưu lịch sử
-- 2. Áp quyền đánh giá và can thiệp theo vai trò, lớp được phân công và chi nhánh
-- 3. Ràng buộc toàn vẹn: student_id, class_id, branch_id và đánh giá liên quan
-- 4. Quy trình can thiệp: Bắt buộc tạo ở 'open', chỉ xác minh từ 'resolved'
-- 5. Database tự động ghi nhận người xác minh, thời điểm và nhật ký kiểm toán
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Workflow Hardening: Chặn đổi lớp học viên trực tiếp ngoài luồng thủ tục
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_student_class_transfer_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Cho phép khi direct postgres session / migration
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        RETURN NEW;
    END IF;

    -- Nếu thay đổi current_class_id từ một lớp đã có sang lớp khác
    IF (OLD.current_class_id IS NOT NULL AND NEW.current_class_id IS DISTINCT FROM OLD.current_class_id) THEN
        IF current_setting('kapla.in_transfer_workflow', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Thay đổi lớp học phải thực hiện qua thủ tục chuyển lớp (transfer_student_class) để lưu lịch sử chuyển lớp và nhật ký kiểm toán.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    -- Nếu đổi branch_id từ một cơ sở đã có sang cơ sở khác
    IF (OLD.branch_id IS NOT NULL AND NEW.branch_id IS DISTINCT FROM OLD.branch_id) THEN
        IF current_setting('kapla.in_transfer_workflow', true) IS DISTINCT FROM 'true' THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chuyển cơ sở phải thực hiện qua thủ tục chuyển lớp (transfer_student_class) để lưu lịch sử.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_student_class_transfer_workflow ON public.students;
CREATE TRIGGER tr_enforce_student_class_transfer_workflow
    BEFORE UPDATE OF current_class_id, branch_id ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_student_class_transfer_workflow();

-- Cập nhật procedure transfer_student_class để bật flag kapla.in_transfer_workflow
CREATE OR REPLACE FUNCTION public.transfer_student_class(
    p_student_id UUID,
    p_to_class_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_student RECORD;
    v_target_class RECORD;
    v_is_sys_admin BOOLEAN;
    v_is_source_cm BOOLEAN;
    v_is_cross_branch BOOLEAN;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    -- Bật cờ workflow chuyển lớp trong phạm vi transaction hiện tại
    PERFORM set_config('kapla.in_transfer_workflow', 'true', true);

    SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;

    -- Khóa dòng học viên bằng FOR UPDATE để chống race condition khi có 2 yêu cầu đồng thời
    SELECT * INTO v_student FROM public.students WHERE id = p_student_id FOR UPDATE;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy học viên với ID đã cung cấp.';
    END IF;

    SELECT * INTO v_target_class FROM public.classes WHERE id = p_to_class_id;
    IF v_target_class.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy lớp học đích.';
    END IF;

    -- Chặn chuyển vào chính lớp hiện tại
    IF v_student.current_class_id = p_to_class_id THEN
        RAISE EXCEPTION 'Lỗi: Học viên đã đang theo học tại lớp này.'
            USING ERRCODE = 'P0001';
    END IF;

    v_is_sys_admin := public.is_system_admin(v_caller_id);
    v_is_source_cm := public.is_cm_of_branch(v_caller_id, v_student.branch_id);
    v_is_cross_branch := (v_student.branch_id IS DISTINCT FROM v_target_class.branch_id);

    -- QUY TẮC P0.1: Chuyển khác cơ sở TẠM THỜI DÀNH RIÊNG CHO QUẢN TRỊ HỆ THỐNG
    IF v_is_cross_branch THEN
        IF NOT v_is_sys_admin THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chuyển lớp khác cơ sở chỉ dành cho Quản trị hệ thống.'
                USING ERRCODE = '42501';
        END IF;
    ELSE
        -- Chuyển nội bộ trong cơ sở: CM của cơ sở nguồn hoặc Quản trị hệ thống
        IF NOT (v_is_sys_admin OR v_is_source_cm) THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chỉ CM cơ sở sở tại hoặc Quản trị hệ thống mới có quyền chuyển lớp nội bộ.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    -- QUY TẮC P0.2: Đóng ghi danh cũ và mở ghi danh mới trong cùng transaction
    UPDATE public.enrollments
    SET status = 'transferred',
        end_date = CURRENT_DATE
    WHERE student_id = p_student_id
      AND status = 'active';

    -- Tạo ghi danh mới active (được bảo vệ bởi uq_active_enrollment_per_student)
    INSERT INTO public.enrollments (
        student_id,
        class_id,
        branch_id,
        start_date,
        status
    ) VALUES (
        p_student_id,
        p_to_class_id,
        v_target_class.branch_id,
        CURRENT_DATE,
        'active'
    );

    -- Lưu vết lịch sử chuyển lớp bất biến
    INSERT INTO public.class_transfers (
        student_id,
        from_class_id,
        to_class_id,
        from_branch_id,
        to_branch_id,
        transfer_date,
        reason,
        transferred_by
    ) VALUES (
        p_student_id,
        v_student.current_class_id,
        p_to_class_id,
        v_student.branch_id,
        v_target_class.branch_id,
        now(),
        p_reason,
        v_caller_id
    );

    -- Cập nhật thông tin lớp hiện tại và cơ sở của học viên
    UPDATE public.students
    SET current_class_id = p_to_class_id,
        branch_id = v_target_class.branch_id,
        updated_at = now()
    WHERE id = p_student_id;

    -- Ghi nhật ký kiểm toán bất biến
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
        'STUDENT_CLASS_TRANSFERRED',
        NULL,
        v_target_class.branch_id,
        jsonb_build_object(
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'from_class_id', v_student.current_class_id,
            'to_class_id', p_to_class_id,
            'from_branch_id', v_student.branch_id,
            'to_branch_id', v_target_class.branch_id,
            'is_cross_branch', v_is_cross_branch,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Chuyển lớp học viên thành công.',
        'student_id', p_student_id,
        'new_class_id', p_to_class_id,
        'is_cross_branch', v_is_cross_branch
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Helper: Kiểm tra quyền phân công theo lớp, học viên và vai trò
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff_assigned_to_class_or_student(
    p_user_id UUID,
    p_class_id UUID,
    p_student_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_branch_id UUID;
    v_is_active BOOLEAN;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Quản trị hệ thống có toàn quyền
    IF public.is_system_admin(p_user_id) THEN
        RETURN TRUE;
    END IF;

    -- Xác định cơ sở của đối tượng
    IF p_class_id IS NOT NULL THEN
        SELECT branch_id INTO v_branch_id FROM public.classes WHERE id = p_class_id;
    ELSIF p_student_id IS NOT NULL THEN
        SELECT branch_id INTO v_branch_id FROM public.students WHERE id = p_student_id;
    END IF;

    IF v_branch_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Kiểm tra tài khoản và quyền thành viên tại cơ sở phải active
    SELECT EXISTS (
        SELECT 1
        FROM public.branch_memberships bm
        JOIN public.profiles p ON p.id = bm.user_id
        WHERE bm.user_id = p_user_id
          AND bm.branch_id = v_branch_id
          AND bm.status = 'active'
          AND p.status = 'active'
    ) INTO v_is_active;

    IF NOT v_is_active THEN
        RETURN FALSE;
    END IF;

    -- CM hoặc Head Teacher của cơ sở có quyền đối với mọi lớp trong cơ sở đó
    IF public.is_ht_or_cm_of_branch(p_user_id, v_branch_id) THEN
        RETURN TRUE;
    END IF;

    -- Giáo viên hoặc nhân viên: phải trực tiếp phụ trách lớp hoặc học viên
    RETURN EXISTS (
        SELECT 1
        FROM public.classes c
        LEFT JOIN public.students s ON s.id = p_student_id
        WHERE (c.id = p_class_id OR (s.current_class_id IS NOT NULL AND c.id = s.current_class_id))
          AND (
              c.main_teacher_id = p_user_id
              OR c.ta_id = p_user_id
              OR c.default_hrt_id = p_user_id
              OR (s.assigned_hrt_id IS NOT NULL AND s.assigned_hrt_id = p_user_id)
          )
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Data Integrity Triggers: student_assessments
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_assessment_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student RECORD;
    v_class RECORD;
    v_caller_id UUID := auth.uid();
BEGIN
    -- Bỏ qua khi chạy migration direct postgres
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Không tìm thấy học viên với ID đã cung cấp.'
            USING ERRCODE = 'P0002';
    END IF;

    -- Cơ sở của bài đánh giá phải trùng khớp với cơ sở của học viên
    IF NEW.branch_id IS DISTINCT FROM v_student.branch_id THEN
        RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Cơ sở của bài đánh giá (%) không khớp với cơ sở của học viên (%).', NEW.branch_id, v_student.branch_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Lớp học nếu được chỉ định phải là lớp hiện tại của học viên
    IF NEW.class_id IS NOT NULL THEN
        IF NEW.class_id IS DISTINCT FROM v_student.current_class_id THEN
            RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Lớp học (%) không khớp với lớp đang theo học của học viên (%).', NEW.class_id, v_student.current_class_id
                USING ERRCODE = 'P0002';
        END IF;

        SELECT * INTO v_class FROM public.classes WHERE id = NEW.class_id;
        IF v_class.branch_id IS DISTINCT FROM v_student.branch_id THEN
            RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Lớp học không thuộc cùng cơ sở với học viên.'
                USING ERRCODE = 'P0002';
        END IF;
    ELSE
        NEW.class_id := v_student.current_class_id;
    END IF;

    -- Kiểm tra phân quyền: Caller phải là nhân sự phụ trách lớp/học viên, hoặc HT/CM/Admin
    IF v_caller_id IS NOT NULL THEN
        IF NOT public.is_staff_assigned_to_class_or_student(v_caller_id, NEW.class_id, NEW.student_id) THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Giáo viên chỉ được đánh giá học viên trong lớp hoặc cơ sở được phân công.'
                USING ERRCODE = '42501';
        END IF;
        NEW.assessed_by := COALESCE(NEW.assessed_by, v_caller_id);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_assessment_integrity ON public.student_assessments;
CREATE TRIGGER tr_validate_assessment_integrity
    BEFORE INSERT OR UPDATE ON public.student_assessments
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_assessment_integrity();

-- -----------------------------------------------------------------------------
-- 4. Data Integrity & Lifecycle Triggers: interventions
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_intervention_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student RECORD;
    v_assessment RECORD;
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_is_ht_or_cm BOOLEAN;
    v_is_sys_admin BOOLEAN;
BEGIN
    -- Bỏ qua khi chạy migration direct postgres
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Không tìm thấy học viên với ID đã cung cấp.'
            USING ERRCODE = 'P0002';
    END IF;

    -- Cơ sở của phiếu can thiệp phải trùng khớp với học viên
    IF NEW.branch_id IS DISTINCT FROM v_student.branch_id THEN
        RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Cơ sở của phiếu can thiệp (%) không khớp với cơ sở của học viên (%).', NEW.branch_id, v_student.branch_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Lớp học nếu có phải khớp với lớp đang học
    IF NEW.class_id IS NOT NULL THEN
        IF NEW.class_id IS DISTINCT FROM v_student.current_class_id THEN
            RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Lớp học của phiếu can thiệp (%) không khớp với lớp học của học viên (%).', NEW.class_id, v_student.current_class_id
                USING ERRCODE = 'P0002';
        END IF;
    ELSE
        NEW.class_id := v_student.current_class_id;
    END IF;

    -- Ràng buộc bài đánh giá: Nếu có, phải thuộc đúng học viên và đúng cơ sở
    IF NEW.assessment_id IS NOT NULL THEN
        SELECT * INTO v_assessment FROM public.student_assessments WHERE id = NEW.assessment_id;
        IF v_assessment.id IS NULL THEN
            RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Không tìm thấy bài đánh giá tương ứng.'
                USING ERRCODE = 'P0002';
        END IF;

        IF v_assessment.student_id IS DISTINCT FROM NEW.student_id THEN
            RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Bài đánh giá liên quan không thuộc về học viên này.'
                USING ERRCODE = 'P0002';
        END IF;

        IF v_assessment.branch_id IS DISTINCT FROM NEW.branch_id THEN
            RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Bài đánh giá liên quan không thuộc về cơ sở này.'
                USING ERRCODE = 'P0002';
        END IF;
    END IF;

    -- QUY TẮC 1: Phiếu can thiệp mới tạo BẮT BUỘC ở trạng thái 'open'
    IF TG_OP = 'INSERT' THEN
        IF NEW.status != 'open' THEN
            RAISE EXCEPTION 'Lỗi quy trình: Phiếu can thiệp mới tạo bắt buộc phải ở trạng thái "open".'
                USING ERRCODE = 'P0001';
        END IF;

        -- Khởi tạo không thể tự điền người xác minh
        NEW.verified_by := NULL;
        NEW.verified_at := NULL;
        NEW.created_by := COALESCE(NEW.created_by, v_caller_id);

        -- Quyền tạo phiếu: Nhân sự phân công lớp/học viên hoặc HT/CM/Admin
        IF v_caller_id IS NOT NULL THEN
            IF NOT public.is_staff_assigned_to_class_or_student(v_caller_id, NEW.class_id, NEW.student_id) THEN
                RAISE EXCEPTION 'Quyền bị từ chối: Giáo viên chỉ được tạo phiếu can thiệp cho học viên trong lớp hoặc cơ sở được phân công.'
                    USING ERRCODE = '42501';
            END IF;
        END IF;
    END IF;

    -- QUY TẮC 2: Chỉ được xác minh (status = 'verified') khi trạng thái trước đó là 'resolved'
    IF TG_OP = 'UPDATE' AND NEW.status = 'verified' AND OLD.status IS DISTINCT FROM 'verified' THEN
        IF OLD.status IS DISTINCT FROM 'resolved' THEN
            RAISE EXCEPTION 'Lỗi quy trình: Phiếu can thiệp chỉ có thể được xác minh khi đã ở trạng thái "resolved". Trạng thái hiện tại: "%".', OLD.status
                USING ERRCODE = 'P0001';
        END IF;

        IF v_caller_id IS NULL THEN
            RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
        END IF;

        v_is_sys_admin := public.is_system_admin(v_caller_id);
        v_is_ht_or_cm := public.is_ht_or_cm_of_branch(v_caller_id, NEW.branch_id);

        IF NOT (v_is_sys_admin OR v_is_ht_or_cm) THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Head Teacher hoặc CM chi nhánh này mới có quyền xác minh phiếu can thiệp.'
                USING ERRCODE = '42501';
        END IF;

        -- Database tự động ghi nhận người xác minh và thời điểm
        NEW.verified_by := v_caller_id;
        NEW.verified_at := now();

        SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;

        -- Database tự động ghi nhật ký kiểm toán bất biến
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
            'INTERVENTION_VERIFIED',
            NEW.assigned_staff_id,
            NEW.branch_id,
            jsonb_build_object(
                'intervention_id', NEW.id,
                'student_id', NEW.student_id,
                'assessment_id', NEW.assessment_id,
                'verification_notes', NEW.verification_notes,
                'previous_status', OLD.status
            )
        );
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_intervention_integrity ON public.interventions;
CREATE TRIGGER tr_validate_intervention_integrity
    BEFORE INSERT OR UPDATE ON public.interventions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_intervention_integrity();

-- -----------------------------------------------------------------------------
-- 5. Cập nhật RLS Policies cho Assessments & Interventions
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Xem bài đánh giá năng lực theo chi nhánh" ON public.student_assessments;
DROP POLICY IF EXISTS "Tạo bài đánh giá năng lực trong chi nhánh" ON public.student_assessments;
DROP POLICY IF EXISTS "Cập nhật bài đánh giá năng lực" ON public.student_assessments;

CREATE POLICY "Xem bài đánh giá theo phân công và chi nhánh"
    ON public.student_assessments FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR public.is_staff_assigned_to_class_or_student(auth.uid(), class_id, student_id)
    );

CREATE POLICY "Tạo bài đánh giá theo phân công"
    ON public.student_assessments FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR public.is_staff_assigned_to_class_or_student(auth.uid(), class_id, student_id)
    );

CREATE POLICY "Cập nhật bài đánh giá"
    ON public.student_assessments FOR UPDATE
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR (assessed_by = auth.uid() AND public.is_staff_assigned_to_class_or_student(auth.uid(), class_id, student_id))
    );

DROP POLICY IF EXISTS "Xem phiếu can thiệp theo chi nhánh" ON public.interventions;
DROP POLICY IF EXISTS "Tạo phiếu can thiệp trong chi nhánh" ON public.interventions;
DROP POLICY IF EXISTS "Cập nhật phiếu can thiệp" ON public.interventions;

CREATE POLICY "Xem phiếu can thiệp theo phân công và chi nhánh"
    ON public.interventions FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR public.is_staff_assigned_to_class_or_student(auth.uid(), class_id, student_id)
    );

CREATE POLICY "Tạo phiếu can thiệp theo phân công"
    ON public.interventions FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR public.is_staff_assigned_to_class_or_student(auth.uid(), class_id, student_id)
    );

CREATE POLICY "Cập nhật phiếu can thiệp"
    ON public.interventions FOR UPDATE
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR (
            public.is_staff_assigned_to_class_or_student(auth.uid(), class_id, student_id)
            AND (assigned_staff_id = auth.uid() OR created_by = auth.uid())
        )
    );

-- Cập nhật verify_intervention Stored Procedure
CREATE OR REPLACE FUNCTION public.verify_intervention(
    p_intervention_id UUID,
    p_verification_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_intervention RECORD;
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    SELECT * INTO v_intervention FROM public.interventions WHERE id = p_intervention_id;
    IF v_intervention.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy phiếu can thiệp.';
    END IF;

    -- Cập nhật trạng thái (Trigger tr_validate_intervention_integrity sẽ tự động kiểm tra OLD.status = 'resolved',
    -- kiểm tra quyền HT/CM, gán verified_by, verified_at và ghi audit_logs)
    UPDATE public.interventions
    SET status = 'verified',
        verification_notes = p_verification_notes,
        updated_at = now()
    WHERE id = p_intervention_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Đã xác minh phiếu can thiệp học thuật.',
        'intervention_id', p_intervention_id,
        'status', 'verified'
    );
END;
$$;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000008_t04_extended_and_t05_config.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — T04 Extended & T05 Settings
-- 1. Table: parent_feedbacks (Phản hồi & Khiếu nại phụ huynh)
-- 2. Table: supplementary_sessions & supplementary_attendees (Lớp học bổ trợ)
-- 3. Table: renewal_tracking (Quản lý tái tục học phí)
-- 4. Table: system_settings (Cấu hình hệ thống dùng chung cho Dashboard & Email Alert)
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: parent_feedbacks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parent_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('academic_concern', 'complaint', 'inquiry', 'compliment', 'facility')),
    channel TEXT NOT NULL DEFAULT 'phone' CHECK (channel IN ('phone', 'zalo', 'in_person', 'app', 'email')),
    content TEXT NOT NULL,
    assigned_staff_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,
    resolution_notes TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parent_feedbacks_student ON public.parent_feedbacks(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_feedbacks_branch ON public.parent_feedbacks(branch_id);
CREATE INDEX IF NOT EXISTS idx_parent_feedbacks_status ON public.parent_feedbacks(status);

-- -----------------------------------------------------------------------------
-- 2. Table: supplementary_sessions & attendees
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.supplementary_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    session_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    room TEXT,
    topic TEXT NOT NULL,
    target_objective TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplementary_sessions_branch ON public.supplementary_sessions(branch_id);
CREATE INDEX IF NOT EXISTS idx_supplementary_sessions_date ON public.supplementary_sessions(session_date);

CREATE TABLE IF NOT EXISTS public.supplementary_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.supplementary_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    attendance_status TEXT NOT NULL DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'excused')),
    assessment_score NUMERIC(3,1) CHECK (assessment_score >= 0 AND assessment_score <= 5),
    teacher_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_session_student_attendee UNIQUE (session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_supplementary_attendees_session ON public.supplementary_attendees(session_id);
CREATE INDEX IF NOT EXISTS idx_supplementary_attendees_student ON public.supplementary_attendees(student_id);

-- -----------------------------------------------------------------------------
-- 3. Table: renewal_tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.renewal_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    current_expiry_date DATE NOT NULL,
    risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('high', 'medium', 'low')),
    assigned_hrt_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'monitoring' CHECK (status IN ('monitoring', 'contacted', 'committed', 'renewed', 'churned')),
    last_contact_date DATE,
    contact_count INT NOT NULL DEFAULT 0,
    notes TEXT,
    new_expiry_date DATE,
    tuition_package TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_renewal_student UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_renewal_tracking_branch ON public.renewal_tracking(branch_id);
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_status ON public.renewal_tracking(status);
CREATE INDEX IF NOT EXISTS idx_renewal_tracking_expiry ON public.renewal_tracking(current_expiry_date);

-- -----------------------------------------------------------------------------
-- 4. Table: system_settings (Cấu hình hệ thống dùng chung cho Dashboard & Email Alert)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed mốc cảnh báo học phí mặc định (14 ngày)
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'tuition_warning_threshold',
    '{"days": 14, "auto_email_enabled": true}'::jsonb,
    'Ngưỡng số ngày trước khi hết hạn học phí để kích hoạt cảnh báo Dashboard và Email gửi HRT.'
) ON CONFLICT (key) DO NOTHING;

-- Seed quy tắc thang điểm Cambridge & ngưỡng rủi ro
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'academic_evaluation_rules',
    '{"scale_max": 5.0, "risk_threshold": 3.0, "framework": "Cambridge & Oxford Quality"}'::jsonb,
    'Quy tắc thang điểm đánh giá năng lực 4 kỹ năng (0 - 5 khiên) và ngưỡng cảnh báo rủi ro (< 3.0).'
) ON CONFLICT (key) DO NOTHING;

-- Helper function: Lấy ngưỡng cảnh báo học phí hiện hành
CREATE OR REPLACE FUNCTION public.get_tuition_warning_days()
RETURNS INT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT COALESCE((value->>'days')::INT, 14)
    FROM public.system_settings
    WHERE key = 'tuition_warning_threshold';
$$;

-- Stored procedure cập nhật cấu hình hệ thống (Chỉ System Admin có quyền)
CREATE OR REPLACE FUNCTION public.update_system_setting(
    p_key TEXT,
    p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
BEGIN
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    IF NOT public.is_system_admin(v_caller_id) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống (System Admin) mới có quyền thay đổi cấu hình hệ thống.'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.system_settings
    SET value = p_value,
        updated_by = v_caller_id,
        updated_at = now()
    WHERE key = p_key;

    IF NOT FOUND THEN
        INSERT INTO public.system_settings (key, value, updated_by)
        VALUES (p_key, p_value, v_caller_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'key', p_key, 'value', p_value);
END;
$$;

-- View / Function hỗ trợ tác vụ email định kỳ:
-- Lấy danh sách học viên đến hạn cảnh báo và TRẢ VỀ ĐÚNG HRT PHỤ TRÁCH TẠI THỜI ĐIỂM GỬI
CREATE OR REPLACE FUNCTION public.get_students_due_for_tuition_alert(p_days_threshold INT DEFAULT NULL)
RETURNS TABLE (
    student_id UUID,
    student_code TEXT,
    student_name TEXT,
    branch_id UUID,
    branch_name VARCHAR,
    current_class_id UUID,
    class_name VARCHAR,
    tuition_expiry_date DATE,
    days_remaining INT,
    effective_hrt_id UUID,
    effective_hrt_email VARCHAR,
    effective_hrt_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_threshold INT;
BEGIN
    v_threshold := COALESCE(p_days_threshold, public.get_tuition_warning_days());

    RETURN QUERY
    SELECT
        s.id AS student_id,
        s.student_code,
        s.full_name AS student_name,
        s.branch_id,
        b.name AS branch_name,
        s.current_class_id,
        c.name AS class_name,
        s.tuition_expiry_date,
        (s.tuition_expiry_date - CURRENT_DATE)::INT AS days_remaining,
        eff.effective_hrt_id,
        p.email::VARCHAR AS effective_hrt_email,
        p.full_name::VARCHAR AS effective_hrt_name
    FROM public.students s
    JOIN public.branches b ON b.id = s.branch_id
    LEFT JOIN public.classes c ON c.id = s.current_class_id
    -- Sử dụng đúng hàm get_effective_hrt_id để bảo đảm quy tắc ưu tiên HRT riêng
    CROSS JOIN LATERAL (
        SELECT public.get_effective_hrt_id(s.id) AS effective_hrt_id
    ) eff
    LEFT JOIN public.profiles p ON p.id = eff.effective_hrt_id
    WHERE s.status IN ('active', 'warning')
      AND s.tuition_expiry_date <= (CURRENT_DATE + v_threshold)
    ORDER BY s.tuition_expiry_date ASC;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Row-Level Security Policies
-- -----------------------------------------------------------------------------
ALTER TABLE public.parent_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplementary_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplementary_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 5.1 System Settings
CREATE POLICY "Mọi nhân viên active đều được xem cấu hình hệ thống"
    ON public.system_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Chỉ System Admin có quyền chỉnh sửa cấu hình hệ thống"
    ON public.system_settings FOR ALL
    TO authenticated
    USING (public.is_system_admin(auth.uid()))
    WITH CHECK (public.is_system_admin(auth.uid()));

-- 5.2 Parent Feedbacks
CREATE POLICY "Xem phản hồi phụ huynh theo chi nhánh"
    ON public.parent_feedbacks FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Tạo phản hồi phụ huynh trong chi nhánh"
    ON public.parent_feedbacks FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Cập nhật phản hồi phụ huynh"
    ON public.parent_feedbacks FOR UPDATE
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_ht_or_cm_of_branch(auth.uid(), branch_id)
        OR assigned_staff_id = auth.uid()
    );

-- 5.3 Supplementary Sessions & Attendees
CREATE POLICY "Xem lớp bổ trợ theo chi nhánh"
    ON public.supplementary_sessions FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Quản lý lớp bổ trợ trong chi nhánh"
    ON public.supplementary_sessions FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

CREATE POLICY "Xem danh sách học viên bổ trợ"
    ON public.supplementary_attendees FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.supplementary_sessions ss
            WHERE ss.id = supplementary_attendees.session_id
              AND public.is_active_member_of_branch(auth.uid(), ss.branch_id)
        )
    );

CREATE POLICY "Quản lý điểm danh học viên bổ trợ"
    ON public.supplementary_attendees FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.supplementary_sessions ss
            WHERE ss.id = supplementary_attendees.session_id
              AND public.is_active_member_of_branch(auth.uid(), ss.branch_id)
        )
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.supplementary_sessions ss
            WHERE ss.id = supplementary_attendees.session_id
              AND public.is_active_member_of_branch(auth.uid(), ss.branch_id)
        )
    );

-- 5.4 Renewal Tracking
CREATE POLICY "Xem dữ liệu tái tục theo chi nhánh"
    ON public.renewal_tracking FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    );

CREATE POLICY "Cập nhật dữ liệu tái tục"
    ON public.renewal_tracking FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_cm_of_branch(auth.uid(), branch_id)
        OR public.is_responsible_hrt_for_student(auth.uid(), student_id)
    );



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000009_t04_t05_security_and_email_queue.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — Migration 09:
-- 1. Siết quyền get_students_due_for_tuition_alert (Chỉ Admin & Server Role)
-- 2. Siết quyền ghi phản hồi phụ huynh & lớp bổ trợ theo vai trò, học viên & cơ sở
-- 3. Hàng đợi & Lịch sử gửi Email định kỳ (email_dispatch_queue, email_dispatch_logs)
-- 4. Chống gửi trùng lặp & Gom nhóm học viên vào một email theo HRT mỗi ngày
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Siết quyền hàm get_students_due_for_tuition_alert
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_students_due_for_tuition_alert(p_days_threshold INT DEFAULT NULL)
RETURNS TABLE (
    student_id UUID,
    student_code TEXT,
    student_name TEXT,
    branch_id UUID,
    branch_name VARCHAR,
    current_class_id UUID,
    class_name VARCHAR,
    tuition_expiry_date DATE,
    days_remaining INT,
    effective_hrt_id UUID,
    effective_hrt_email VARCHAR,
    effective_hrt_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_server BOOLEAN;
    v_is_admin BOOLEAN;
    v_threshold INT;
    v_user_status TEXT;
BEGIN
    -- Kiểm tra nếu là direct session postgres hoặc service_role của máy chủ
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF v_caller_id IS NOT NULL THEN
        SELECT status INTO v_user_status FROM public.profiles WHERE id = v_caller_id;
        IF v_user_status IS DISTINCT FROM 'active' THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Tài khoản của bạn chưa kích hoạt hoặc đã bị vô hiệu hóa.'
                USING ERRCODE = '42501';
        END IF;

        v_is_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_is_admin := false;
    END IF;

    -- SIẾT QUYỀN: Chỉ Quản trị hệ thống (System Admin) hoặc Server Service Role mới được xem
    IF NOT (v_is_server OR v_is_admin) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống (System Admin) hoặc tiến trình máy chủ mới có quyền truy cập danh sách nhắc học phí.'
            USING ERRCODE = '42501';
    END IF;

    v_threshold := COALESCE(p_days_threshold, public.get_tuition_warning_days());

    RETURN QUERY
    SELECT
        s.id AS student_id,
        s.student_code,
        s.full_name AS student_name,
        s.branch_id,
        b.name AS branch_name,
        s.current_class_id,
        c.name AS class_name,
        s.tuition_expiry_date,
        (s.tuition_expiry_date - CURRENT_DATE)::INT AS days_remaining,
        eff.effective_hrt_id,
        p.email::VARCHAR AS effective_hrt_email,
        p.full_name::VARCHAR AS effective_hrt_name
    FROM public.students s
    JOIN public.branches b ON b.id = s.branch_id
    LEFT JOIN public.classes c ON c.id = s.current_class_id
    -- Sử dụng đúng quy tắc ưu tiên HRT riêng > HRT lớp tại thời điểm truy vấn
    CROSS JOIN LATERAL (
        SELECT public.get_effective_hrt_id(s.id) AS effective_hrt_id
    ) eff
    LEFT JOIN public.profiles p ON p.id = eff.effective_hrt_id
    WHERE s.status IN ('active', 'warning')
      AND s.tuition_expiry_date <= (CURRENT_DATE + v_threshold)
    ORDER BY s.tuition_expiry_date ASC;
END;
$$;

-- -----------------------------------------------------------------------------
-- 2. Siết quyền & Tính toàn vẹn: Phản hồi phụ huynh & Lớp học bổ trợ
-- -----------------------------------------------------------------------------

-- Trigger toàn vẹn phản hồi phụ huynh: Học viên phải thuộc cơ sở, người ghi nhận phải có vai trò hợp lệ
CREATE OR REPLACE FUNCTION public.validate_parent_feedback_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_student RECORD;
    v_caller_id UUID := auth.uid();
    v_is_admin BOOLEAN;
    v_is_cm_or_ht BOOLEAN;
    v_is_hrt_or_cskh BOOLEAN;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        RETURN NEW;
    END IF;

    SELECT * INTO v_student FROM public.students WHERE id = NEW.student_id;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Không tìm thấy học viên với ID đã cung cấp.'
            USING ERRCODE = 'P0002';
    END IF;

    -- Kiểm tra cơ sở của phản hồi phải khớp với học viên
    IF NEW.branch_id IS DISTINCT FROM v_student.branch_id THEN
        RAISE EXCEPTION 'Lỗi toàn vẹn dữ liệu: Cơ sở của phản hồi (%) không khớp với cơ sở của học viên (%).', NEW.branch_id, v_student.branch_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Kiểm tra quyền người ghi nhận
    IF v_caller_id IS NOT NULL THEN
        v_is_admin := public.is_system_admin(v_caller_id);
        v_is_cm_or_ht := public.is_ht_or_cm_of_branch(v_caller_id, NEW.branch_id);
        
        SELECT EXISTS (
            SELECT 1 FROM public.branch_memberships bm
            JOIN public.profiles p ON p.id = bm.user_id
            WHERE bm.user_id = v_caller_id
              AND bm.branch_id = NEW.branch_id
              AND bm.role IN ('HRT', 'CSKH')
              AND bm.status = 'active'
              AND p.status = 'active'
        ) INTO v_is_hrt_or_cskh;

        IF NOT (v_is_admin OR v_is_cm_or_ht OR v_is_hrt_or_cskh) THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chỉ HRT, CSKH, CM hoặc Head Teacher của cơ sở mới được quyền ghi nhận phản hồi phụ huynh.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_parent_feedback_integrity ON public.parent_feedbacks;
CREATE TRIGGER tr_validate_parent_feedback_integrity
    BEFORE INSERT OR UPDATE ON public.parent_feedbacks
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_parent_feedback_integrity();

-- Trigger toàn vẹn lớp bổ trợ: Học viên và giáo viên phải thuộc cơ sở
CREATE OR REPLACE FUNCTION public.validate_supplementary_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_admin BOOLEAN;
    v_is_cm_or_ht BOOLEAN;
    v_is_teacher BOOLEAN;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        RETURN NEW;
    END IF;

    IF v_caller_id IS NOT NULL THEN
        v_is_admin := public.is_system_admin(v_caller_id);
        v_is_cm_or_ht := public.is_ht_or_cm_of_branch(v_caller_id, NEW.branch_id);

        SELECT EXISTS (
            SELECT 1 FROM public.branch_memberships bm
            JOIN public.profiles p ON p.id = bm.user_id
            WHERE bm.user_id = v_caller_id
              AND bm.branch_id = NEW.branch_id
              AND bm.role IN ('Main Teacher', 'Head Teacher', 'Supplementary Teacher')
              AND bm.status = 'active'
              AND p.status = 'active'
        ) INTO v_is_teacher;

        IF NOT (v_is_admin OR v_is_cm_or_ht OR v_is_teacher) THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Giáo viên, Head Teacher hoặc CM của cơ sở mới có quyền tạo buổi học bổ trợ.'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_validate_supplementary_integrity ON public.supplementary_sessions;
CREATE TRIGGER tr_validate_supplementary_integrity
    BEFORE INSERT OR UPDATE ON public.supplementary_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_supplementary_integrity();

-- -----------------------------------------------------------------------------
-- 3. Hàng đợi & Lịch sử gửi Email định kỳ (T05)
-- -----------------------------------------------------------------------------

-- 3.1 Bảng hàng đợi gửi email tổng hợp cho HRT mỗi ngày
CREATE TABLE IF NOT EXISTS public.email_dispatch_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_date DATE NOT NULL,
    recipient_hrt_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT NOT NULL,
    student_count INT NOT NULL DEFAULT 1,
    student_ids UUID[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_reason TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    -- CHỐNG GỬI TRÙNG: Mỗi ngày mỗi HRT chỉ có tối đa 1 email tổng hợp trong hàng đợi
    CONSTRAINT uq_daily_hrt_alert_queue UNIQUE (dispatch_date, recipient_hrt_id)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_queue_date ON public.email_dispatch_queue(dispatch_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_queue_status ON public.email_dispatch_queue(status);

-- 3.2 Bảng lịch sử kiểm tra và nhắc học phí từng học viên
CREATE TABLE IF NOT EXISTS public.email_dispatch_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_date DATE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE RESTRICT,
    tuition_expiry_date DATE NOT NULL,
    days_remaining INT NOT NULL,
    effective_hrt_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    effective_hrt_email TEXT,
    delivery_status TEXT NOT NULL CHECK (delivery_status IN ('batched', 'sent', 'skipped', 'failed')),
    skip_reason TEXT,
    queue_id UUID REFERENCES public.email_dispatch_queue(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    -- CHỐNG GỬI TRÙNG HỌC VIÊN: Một học viên chỉ được xếp lịch cảnh báo tối đa 1 lần/ngày
    CONSTRAINT uq_daily_student_alert UNIQUE (dispatch_date, student_id)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_logs_date ON public.email_dispatch_logs(dispatch_date);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_student ON public.email_dispatch_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_status ON public.email_dispatch_logs(delivery_status);

-- -----------------------------------------------------------------------------
-- 4. Stored Procedure: Chuẩn bị Hàng đợi Email Định kỳ (Gom nhóm & Chống trùng)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepare_daily_tuition_alert_queue(p_target_date DATE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_server BOOLEAN;
    v_is_admin BOOLEAN;
    v_today_vn DATE;
    v_threshold INT;
    v_rec RECORD;
    v_queue_id UUID;
    v_queued_emails INT := 0;
    v_skipped_students INT := 0;
    v_total_students INT := 0;
    
    -- Biến gom nhóm theo HRT
    v_hrt_group RECORD;
    v_student_rows RECORD;
    v_html_table TEXT;
    v_text_list TEXT;
    v_student_ids UUID[];
    v_student_count INT;
BEGIN
    -- Xác thực quyền
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF v_caller_id IS NOT NULL THEN
        v_is_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_is_admin := false;
    END IF;

    IF NOT (v_is_server OR v_is_admin) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống hoặc tiến trình máy chủ mới có quyền chạy tác vụ email.'
            USING ERRCODE = '42501';
    END IF;

    -- Lấy ngày hôm nay theo múi giờ Việt Nam (Asia/Ho_Chi_Minh = UTC+7)
    v_today_vn := COALESCE(p_target_date, (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date);
    v_threshold := public.get_tuition_warning_days();

    -- Tạo bảng tạm lưu các học viên cần nhắc tại thời điểm này
    CREATE TEMPORARY TABLE IF NOT EXISTS tmp_due_students (
        student_id UUID,
        student_code TEXT,
        student_name TEXT,
        branch_id UUID,
        branch_name VARCHAR,
        class_name VARCHAR,
        tuition_expiry_date DATE,
        days_remaining INT,
        effective_hrt_id UUID,
        effective_hrt_email VARCHAR,
        effective_hrt_name VARCHAR
    ) ON COMMIT DROP;

    TRUNCATE tmp_due_students;

    -- Truy vấn học viên đến hạn cảnh báo VÀ TÍNH TOÁN HRT TẠI THỜI ĐIỂM NÀY
    INSERT INTO tmp_due_students
    SELECT
        s.id AS student_id,
        s.student_code,
        s.full_name AS student_name,
        s.branch_id,
        b.name AS branch_name,
        c.name AS class_name,
        s.tuition_expiry_date,
        (s.tuition_expiry_date - v_today_vn)::INT AS days_remaining,
        eff.effective_hrt_id,
        p.email::VARCHAR AS effective_hrt_email,
        p.full_name::VARCHAR AS effective_hrt_name
    FROM public.students s
    JOIN public.branches b ON b.id = s.branch_id
    LEFT JOIN public.classes c ON c.id = s.current_class_id
    CROSS JOIN LATERAL (
        SELECT public.get_effective_hrt_id(s.id) AS effective_hrt_id
    ) eff
    LEFT JOIN public.profiles p ON p.id = eff.effective_hrt_id
    WHERE s.status IN ('active', 'warning')
      AND s.tuition_expiry_date <= (v_today_vn + v_threshold)
      -- Bỏ qua các học viên đã được ghi log trong ngày hôm nay (chống xử lý lại)
      AND NOT EXISTS (
          SELECT 1 FROM public.email_dispatch_logs l
          WHERE l.dispatch_date = v_today_vn AND l.student_id = s.id
      );

    -- 1. Xử lý các học viên thiếu HRT phụ trách (Ghi log skipped)
    FOR v_rec IN 
        SELECT * FROM tmp_due_students WHERE effective_hrt_id IS NULL OR effective_hrt_email IS NULL
    LOOP
        INSERT INTO public.email_dispatch_logs (
            dispatch_date,
            student_id,
            student_name,
            branch_id,
            tuition_expiry_date,
            days_remaining,
            effective_hrt_id,
            effective_hrt_email,
            delivery_status,
            skip_reason
        ) VALUES (
            v_today_vn,
            v_rec.student_id,
            v_rec.student_name,
            v_rec.branch_id,
            v_rec.tuition_expiry_date,
            v_rec.days_remaining,
            NULL,
            NULL,
            'skipped',
            'Thiếu HRT phụ trách: Học viên chưa được phân công HRT riêng và lớp không có HRT mặc định'
        ) ON CONFLICT (dispatch_date, student_id) DO NOTHING;

        v_skipped_students := v_skipped_students + 1;
    END LOOP;

    -- 2. Gom nhóm các học viên có HRT vào MỘT EMAIL DUY NHẤT cho mỗi HRT
    FOR v_hrt_group IN
        SELECT DISTINCT effective_hrt_id, effective_hrt_email, effective_hrt_name
        FROM tmp_due_students
        WHERE effective_hrt_id IS NOT NULL AND effective_hrt_email IS NOT NULL
    LOOP
        v_student_ids := ARRAY[]::UUID[];
        v_student_count := 0;
        v_html_table := '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">'
            || '<tr style="background-color: #043264; color: white;">'
            || '<th>Mã HV</th><th>Họ tên học viên</th><th>Lớp</th><th>Cơ sở</th><th>Hạn học phí</th><th>Số ngày còn lại</th>'
            || '</tr>';
        v_text_list := '';

        FOR v_student_rows IN
            SELECT * FROM tmp_due_students WHERE effective_hrt_id = v_hrt_group.effective_hrt_id ORDER BY days_remaining ASC
        LOOP
            v_student_ids := array_append(v_student_ids, v_student_rows.student_id);
            v_student_count := v_student_count + 1;

            v_html_table := v_html_table || '<tr>'
                || '<td><strong>' || v_student_rows.student_code || '</strong></td>'
                || '<td>' || v_student_rows.student_name || '</td>'
                || '<td>' || COALESCE(v_student_rows.class_name, 'Chưa xếp lớp') || '</td>'
                || '<td>' || v_student_rows.branch_name || '</td>'
                || '<td>' || to_char(v_student_rows.tuition_expiry_date, 'DD/MM/YYYY') || '</td>'
                || '<td style="color: ' || CASE WHEN v_student_rows.days_remaining <= 7 THEN '#dc2626; font-weight: bold;' ELSE '#d97706;' END || '">'
                || CASE WHEN v_student_rows.days_remaining > 0 THEN 'Còn ' || v_student_rows.days_remaining || ' ngày' ELSE 'Đã quá hạn' END
                || '</td></tr>';

            v_text_list := v_text_list || '- ' || v_student_rows.student_name || ' (' || v_student_rows.student_code || '): Hạn ' || to_char(v_student_rows.tuition_expiry_date, 'DD/MM/YYYY') || E'\n';
        END LOOP;

        v_html_table := v_html_table || '</table>';

        -- Tạo bản ghi hàng đợi cho HRT (Nếu chưa có trong ngày)
        INSERT INTO public.email_dispatch_queue (
            dispatch_date,
            recipient_hrt_id,
            recipient_email,
            recipient_name,
            subject,
            html_body,
            text_body,
            student_count,
            student_ids,
            status
        ) VALUES (
            v_today_vn,
            v_hrt_group.effective_hrt_id,
            v_hrt_group.effective_hrt_email,
            v_hrt_group.effective_hrt_name,
            '[KAPLA] Cảnh báo hạn học phí: ' || v_student_count || ' học viên cần chăm sóc ngày ' || to_char(v_today_vn, 'DD/MM/YYYY'),
            '<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 680px;">'
                || '<h2 style="color: #043264;">KAPLA Staff Dashboard — Thông báo học phí</h2>'
                || '<p>Kính gửi Thầy/Cô <strong>' || v_hrt_group.effective_hrt_name || '</strong>,</p>'
                || '<p>Hệ thống ghi nhận có <strong>' || v_student_count || ' học viên</strong> do Thầy/Cô trực tiếp phụ trách sắp đến hạn tái tục học phí trong vòng ' || v_threshold || ' ngày tới:</p>'
                || v_html_table
                || '<p style="margin-top: 20px;">Vui lòng liên hệ phụ huynh để thăm hỏi tình hình học tập và hỗ trợ tái tục đúng hạn.</p>'
                || '<p style="color: #64748b; font-size: 12px; margin-top: 30px;">Email tự động từ Hệ thống Quản trị Học vụ KAPLA (Asia/Ho_Chi_Minh).</p>'
                || '</div>',
            'Kính gửi Thầy/Cô ' || v_hrt_group.effective_hrt_name || E',\n\n'
                || 'Danh sách học viên sắp hết hạn học phí cần chăm sóc:\n'
                || v_text_list || E'\n'
                || 'Vui lòng kiểm tra Staff Dashboard để cập nhật tiến trình liên hệ phụ huynh.',
            v_student_count,
            v_student_ids,
            'pending'
        )
        ON CONFLICT (dispatch_date, recipient_hrt_id) DO NOTHING
        RETURNING id INTO v_queue_id;

        IF v_queue_id IS NOT NULL THEN
            v_queued_emails := v_queued_emails + 1;
            v_total_students := v_total_students + v_student_count;

            -- Ghi log cho từng học viên
            INSERT INTO public.email_dispatch_logs (
                dispatch_date,
                student_id,
                student_name,
                branch_id,
                tuition_expiry_date,
                days_remaining,
                effective_hrt_id,
                effective_hrt_email,
                delivery_status,
                queue_id
            )
            SELECT
                v_today_vn,
                t.student_id,
                t.student_name,
                t.branch_id,
                t.tuition_expiry_date,
                t.days_remaining,
                t.effective_hrt_id,
                t.effective_hrt_email,
                'batched',
                v_queue_id
            FROM tmp_due_students t
            WHERE t.effective_hrt_id = v_hrt_group.effective_hrt_id
            ON CONFLICT (dispatch_date, student_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'dispatch_date', v_today_vn,
        'threshold_days', v_threshold,
        'queued_emails', v_queued_emails,
        'batched_students', v_total_students,
        'skipped_students', v_skipped_students
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. RLS Policies cho Queue & Logs
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_dispatch_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_dispatch_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin xem toàn bộ hàng đợi email"
    ON public.email_dispatch_queue FOR SELECT
    TO authenticated
    USING (public.is_system_admin(auth.uid()));

CREATE POLICY "Admin xem toàn bộ log gửi email"
    ON public.email_dispatch_logs FOR SELECT
    TO authenticated
    USING (public.is_system_admin(auth.uid()));

CREATE POLICY "HRT xem hàng đợi email của chính mình"
    ON public.email_dispatch_queue FOR SELECT
    TO authenticated
    USING (recipient_hrt_id = auth.uid());

CREATE POLICY "HRT xem log gửi email của học viên mình"
    ON public.email_dispatch_logs FOR SELECT
    TO authenticated
    USING (effective_hrt_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 6. Hỗ trợ Service Role cho assign_student_hrt
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_student_hrt(
    p_student_id UUID,
    p_hrt_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_caller_email TEXT;
    v_student RECORD;
    v_is_server BOOLEAN;
    v_is_sys_admin BOOLEAN;
    v_is_cm BOOLEAN;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF NOT v_is_server AND v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Chưa đăng nhập. Vui lòng xác thực tài khoản.';
    END IF;

    IF v_caller_id IS NOT NULL THEN
        SELECT email INTO v_caller_email FROM public.profiles WHERE id = v_caller_id;
        v_is_sys_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_caller_email := 'server@kapla.edu.vn';
        v_is_sys_admin := false;
    END IF;

    SELECT * INTO v_student FROM public.students WHERE id = p_student_id;
    IF v_student.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy học viên.';
    END IF;

    IF v_caller_id IS NOT NULL THEN
        v_is_cm := public.is_cm_of_branch(v_caller_id, v_student.branch_id);
    ELSE
        v_is_cm := false;
    END IF;

    IF NOT (v_is_server OR v_is_sys_admin OR v_is_cm) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ CM chi nhánh hoặc Quản trị hệ thống mới có quyền phân công HRT.'
            USING ERRCODE = '42501';
    END IF;

    -- Nếu gán HRT mới, kiểm tra HRT có thuộc cùng chi nhánh không
    IF p_hrt_id IS NOT NULL THEN
        IF NOT public.is_active_member_of_branch(p_hrt_id, v_student.branch_id) THEN
            RAISE EXCEPTION 'Lỗi: Nhân sự được chỉ định không thuộc chi nhánh của học viên này.';
        END IF;
    END IF;

    -- Cập nhật học viên
    UPDATE public.students
    SET assigned_hrt_id = p_hrt_id,
        updated_at = now()
    WHERE id = p_student_id;

    -- Ghi nhận lịch sử phân công
    INSERT INTO public.student_hrt_assignments (
        student_id,
        hrt_id,
        assigned_by,
        assignment_type,
        reason
    ) VALUES (
        p_student_id,
        p_hrt_id,
        v_caller_id,
        CASE WHEN p_hrt_id IS NOT NULL THEN 'specific' ELSE 'unassigned' END,
        p_reason
    );

    -- Ghi audit log
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
        CASE WHEN p_hrt_id IS NOT NULL THEN 'STUDENT_HRT_ASSIGNED' ELSE 'STUDENT_HRT_UNASSIGNED' END,
        p_hrt_id,
        v_student.branch_id,
        jsonb_build_object(
            'student_id', p_student_id,
            'student_name', v_student.full_name,
            'assigned_hrt_id', p_hrt_id,
            'reason', p_reason
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'student_id', p_student_id,
        'assigned_hrt_id', p_hrt_id
    );
END;
$$;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- MIGRATION: 20261113000010_t05_email_reliability_and_concurrency.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

-- ==============================================================================
-- KAPLA Staff Dashboard — Migration 10:
-- 1. Chống gửi trùng email khi hai tiến trình chạy đồng thời (FOR UPDATE SKIP LOCKED)
-- 2. Khóa chống gửi trùng & Lưu mã nhà cung cấp (idempotency_key, provider_message_id)
-- 3. Xác thực lại HRT phụ trách, tài khoản HRT và hạn phí ngay trước khi gửi
-- 4. Bổ sung cơ chế thử lại có giới hạn (retry_count, max_retries, next_retry_at)
-- 5. Áp đúng cửa sổ nhắc trước hạn và hiển thị riêng "Hết hạn hôm nay"
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Nâng cấp cấu trúc bảng email_dispatch_queue & email_dispatch_logs
-- -----------------------------------------------------------------------------

-- Mở rộng ràng buộc status cho hàng đợi email
ALTER TABLE public.email_dispatch_queue DROP CONSTRAINT IF EXISTS email_dispatch_queue_status_check;
ALTER TABLE public.email_dispatch_queue ADD CONSTRAINT email_dispatch_queue_status_check
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped', 'cancelled'));

-- Thêm các cột phục vụ khóa tiến trình, chống trùng và thử lại
ALTER TABLE public.email_dispatch_queue
    ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_retries INT NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS claimed_by TEXT,
    ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
    ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_dispatch_queue_claim
    ON public.email_dispatch_queue(dispatch_date, status, next_retry_at);

-- Mở rộng ràng buộc delivery_status cho nhật ký
ALTER TABLE public.email_dispatch_logs DROP CONSTRAINT IF EXISTS email_dispatch_logs_delivery_status_check;
ALTER TABLE public.email_dispatch_logs ADD CONSTRAINT email_dispatch_logs_delivery_status_check
    CHECK (delivery_status IN ('batched', 'processing', 'sent', 'skipped', 'failed', 'cancelled'));

-- -----------------------------------------------------------------------------
-- 2. Hàm nhận hàng đợi nguyên tử (Atomic Queue Claim with FOR UPDATE SKIP LOCKED)
--    Chống gửi trùng tuyệt đối khi có hai hoặc nhiều worker chạy song song
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_tuition_email_queue_batch(
    p_dispatch_date DATE,
    p_worker_id TEXT,
    p_batch_size INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    dispatch_date DATE,
    recipient_hrt_id UUID,
    recipient_email TEXT,
    recipient_name TEXT,
    subject TEXT,
    html_body TEXT,
    text_body TEXT,
    student_count INT,
    student_ids UUID[],
    retry_count INT,
    idempotency_key TEXT,
    provider_message_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_server BOOLEAN;
    v_is_admin BOOLEAN;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF v_caller_id IS NOT NULL THEN
        v_is_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_is_admin := false;
    END IF;

    IF NOT (v_is_server OR v_is_admin) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống hoặc máy chủ mới có quyền nhận hàng đợi email.'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    WITH claimable AS (
        SELECT q.id AS q_id
        FROM public.email_dispatch_queue q
        WHERE q.dispatch_date = p_dispatch_date
          AND (
              q.status = 'pending'
              OR (q.status = 'failed' AND q.retry_count < q.max_retries AND (q.next_retry_at IS NULL OR q.next_retry_at <= now()))
              -- Tự giải phóng khóa nếu worker trước bị crash quá 5 phút
              OR (q.status = 'processing' AND q.claimed_at < (now() - INTERVAL '5 minutes'))
          )
        ORDER BY q.created_at ASC
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    ),
    updated AS (
        UPDATE public.email_dispatch_queue q
        SET status = 'processing',
            claimed_by = p_worker_id,
            claimed_at = now(),
            idempotency_key = COALESCE(q.idempotency_key, 'kapla-' || q.dispatch_date || '-' || COALESCE(q.recipient_hrt_id::text, 'no-hrt') || '-' || substr(md5(random()::text), 1, 8)),
            updated_at = now()
        FROM claimable
        WHERE q.id = claimable.q_id
        RETURNING q.id, q.dispatch_date, q.recipient_hrt_id, q.recipient_email, q.recipient_name,
                  q.subject, q.html_body, q.text_body, q.student_count, q.student_ids,
                  q.retry_count, q.idempotency_key, q.provider_message_id
    )
    SELECT * FROM updated;

    -- Đánh dấu trạng thái processing cho các log liên quan
    UPDATE public.email_dispatch_logs l
    SET delivery_status = 'processing'
    WHERE l.queue_id IN (
        SELECT q.id FROM public.email_dispatch_queue q
        WHERE q.claimed_by = p_worker_id AND q.status = 'processing'
    ) AND l.delivery_status = 'batched';
END;
$$;

-- -----------------------------------------------------------------------------
-- 3. Hàm kiểm tra lại HRT, tài khoản và tái tạo nội dung ngay trước khi gửi
--    (Pre-dispatch Revalidation & Realtime Rebuild)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revalidate_and_rebuild_queue_item(
    p_queue_id UUID,
    p_target_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_server BOOLEAN;
    v_is_admin BOOLEAN;
    v_queue RECORD;
    v_hrt RECORD;
    v_threshold INT;
    v_student RECORD;
    v_valid_students RECORD;
    v_valid_ids UUID[] := ARRAY[]::UUID[];
    v_valid_count INT := 0;
    v_html_table TEXT;
    v_text_list TEXT;
    v_subject TEXT;
    v_html_body TEXT;
    v_text_body TEXT;
    v_effective_hrt_id UUID;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF v_caller_id IS NOT NULL THEN
        v_is_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_is_admin := false;
    END IF;

    IF NOT (v_is_server OR v_is_admin) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống hoặc máy chủ mới có quyền xác thực hàng đợi email.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_queue FROM public.email_dispatch_queue WHERE id = p_queue_id;
    IF v_queue.id IS NULL THEN
        RETURN jsonb_build_object('can_send', false, 'reason', 'not_found');
    END IF;

    -- 1. Kiểm tra tài khoản HRT người nhận
    IF v_queue.recipient_hrt_id IS NULL THEN
        UPDATE public.email_dispatch_queue
        SET status = 'skipped', error_reason = 'Thiếu HRT phụ trách', updated_at = now()
        WHERE id = p_queue_id;
        RETURN jsonb_build_object('can_send', false, 'reason', 'no_hrt');
    END IF;

    SELECT * INTO v_hrt FROM public.profiles WHERE id = v_queue.recipient_hrt_id;
    IF v_hrt.id IS NULL OR v_hrt.status IS DISTINCT FROM 'active' THEN
        UPDATE public.email_dispatch_queue
        SET status = 'skipped',
            error_reason = 'Tài khoản HRT đã bị khóa hoặc chưa kích hoạt',
            updated_at = now()
        WHERE id = p_queue_id;

        UPDATE public.email_dispatch_logs
        SET delivery_status = 'skipped',
            skip_reason = 'Tài khoản HRT phụ trách đã bị khóa hoặc chưa kích hoạt'
        WHERE queue_id = p_queue_id;

        RETURN jsonb_build_object('can_send', false, 'reason', 'hrt_inactive');
    END IF;

    -- 2. Lấy danh sách học viên THỰC TẾ phụ trách tại THỜI ĐIỂM GỬI NÀY
    v_threshold := public.get_tuition_warning_days();

    CREATE TEMPORARY TABLE IF NOT EXISTS tmp_fresh_students (
        student_id UUID,
        student_code TEXT,
        student_name TEXT,
        branch_id UUID,
        branch_name VARCHAR,
        class_name VARCHAR,
        tuition_expiry_date DATE,
        days_remaining INT
    ) ON COMMIT DROP;
    TRUNCATE tmp_fresh_students;

    -- Truy vấn tươi mới toàn bộ học viên thực tế thuộc HRT này và trong cửa sổ hạn phí
    INSERT INTO tmp_fresh_students
    SELECT s.id, s.student_code, s.full_name, s.branch_id,
           b.name AS branch_name, c.name AS class_name,
           s.tuition_expiry_date,
           (s.tuition_expiry_date - p_target_date)::INT AS days_remaining
    FROM public.students s
    JOIN public.branches b ON b.id = s.branch_id
    LEFT JOIN public.classes c ON c.id = s.current_class_id
    CROSS JOIN LATERAL (
        SELECT public.get_effective_hrt_id(s.id) AS current_hrt_id
    ) eff
    WHERE s.status IN ('active', 'warning')
      AND s.tuition_expiry_date >= p_target_date
      AND s.tuition_expiry_date <= (p_target_date + v_threshold)
      AND eff.current_hrt_id = v_queue.recipient_hrt_id;

    SELECT array_agg(student_id), count(*)
    INTO v_valid_ids, v_valid_count
    FROM tmp_fresh_students;

    v_valid_ids := COALESCE(v_valid_ids, ARRAY[]::UUID[]);
    v_valid_count := COALESCE(v_valid_count, 0);

    -- Đánh dấu skipped cho các học viên cũ của hàng đợi này đã bị loại bỏ
    UPDATE public.email_dispatch_logs
    SET delivery_status = 'skipped',
        skip_reason = 'Học viên đã gia hạn hoặc đổi HRT phụ trách trước lúc gửi'
    WHERE queue_id = p_queue_id
      AND student_id != ALL(v_valid_ids);

    -- 3. Nếu không còn học viên nào hợp lệ
    IF v_valid_count = 0 THEN
        UPDATE public.email_dispatch_queue
        SET status = 'skipped',
            student_count = 0,
            student_ids = '{}',
            error_reason = 'Không còn học viên nào đến hạn thuộc trách nhiệm của HRT này',
            updated_at = now()
        WHERE id = p_queue_id;

        RETURN jsonb_build_object('can_send', false, 'reason', 'no_eligible_students');
    END IF;

    -- Đồng bộ log của các học viên hợp lệ vào queue_id này
    INSERT INTO public.email_dispatch_logs (
        dispatch_date,
        student_id,
        student_name,
        branch_id,
        tuition_expiry_date,
        days_remaining,
        effective_hrt_id,
        effective_hrt_email,
        delivery_status,
        queue_id
    )
    SELECT
        p_target_date,
        t.student_id,
        t.student_name,
        t.branch_id,
        t.tuition_expiry_date,
        t.days_remaining,
        v_queue.recipient_hrt_id,
        v_hrt.email,
        'processing',
        p_queue_id
    FROM tmp_fresh_students t
    ON CONFLICT (dispatch_date, student_id)
    DO UPDATE SET
        effective_hrt_id = EXCLUDED.effective_hrt_id,
        effective_hrt_email = EXCLUDED.effective_hrt_email,
        delivery_status = 'processing',
        queue_id = EXCLUDED.queue_id;

    -- 4. Tái tạo bảng HTML với định dạng hiển thị riêng cho "Hết hạn hôm nay"
    v_html_table := '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">'
        || '<tr style="background-color: #043264; color: white;">'
        || '<th>Mã HV</th><th>Họ tên học viên</th><th>Lớp</th><th>Cơ sở</th><th>Hạn học phí</th><th>Tình trạng hạn</th>'
        || '</tr>';
    v_text_list := '';

    FOR v_valid_students IN
        SELECT * FROM tmp_fresh_students ORDER BY days_remaining ASC
    LOOP
        v_html_table := v_html_table || '<tr>'
            || '<td><strong>' || v_valid_students.student_code || '</strong></td>'
            || '<td>' || v_valid_students.student_name || '</td>'
            || '<td>' || COALESCE(v_valid_students.class_name, 'Chưa xếp lớp') || '</td>'
            || '<td>' || v_valid_students.branch_name || '</td>'
            || '<td>' || to_char(v_valid_students.tuition_expiry_date, 'DD/MM/YYYY') || '</td>'
            || '<td style="' || CASE
                WHEN v_valid_students.days_remaining = 0 THEN 'background-color: #fef2f2; color: #dc2626; font-weight: bold;'
                WHEN v_valid_students.days_remaining <= 7 THEN 'color: #dc2626; font-weight: bold;'
                ELSE 'color: #d97706; font-weight: 500;'
            END || '">'
            || CASE
                WHEN v_valid_students.days_remaining = 0 THEN 'Hết hạn hôm nay'
                WHEN v_valid_students.days_remaining > 0 THEN 'Còn ' || v_valid_students.days_remaining || ' ngày'
                ELSE 'Đã quá hạn ' || ABS(v_valid_students.days_remaining) || ' ngày'
            END
            || '</td></tr>';

        v_text_list := v_text_list || '- ' || v_valid_students.student_name || ' (' || v_valid_students.student_code || '): Hạn ' || to_char(v_valid_students.tuition_expiry_date, 'DD/MM/YYYY')
            || ' (' || CASE WHEN v_valid_students.days_remaining = 0 THEN 'Hết hạn hôm nay' ELSE 'Còn ' || v_valid_students.days_remaining || ' ngày' END || ')' || E'\n';
    END LOOP;

    v_html_table := v_html_table || '</table>';

    v_subject := '[KAPLA] Cảnh báo hạn học phí: ' || v_valid_count || ' học viên cần chăm sóc ngày ' || to_char(p_target_date, 'DD/MM/YYYY');
    v_html_body := '<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 680px;">'
        || '<h2 style="color: #043264;">KAPLA Staff Dashboard — Thông báo học phí</h2>'
        || '<p>Kính gửi Thầy/Cô <strong>' || v_hrt.full_name || '</strong>,</p>'
        || '<p>Hệ thống ghi nhận có <strong>' || v_valid_count || ' học viên</strong> do Thầy/Cô trực tiếp phụ trách sắp đến hạn tái tục học phí trong vòng ' || v_threshold || ' ngày tới:</p>'
        || v_html_table
        || '<p style="margin-top: 20px;">Vui lòng liên hệ phụ huynh để thăm hỏi tình hình học tập và hỗ trợ tái tục đúng hạn.</p>'
        || '<p style="color: #64748b; font-size: 12px; margin-top: 30px;">Email tự động từ Hệ thống Quản trị Học vụ KAPLA (Asia/Ho_Chi_Minh).</p>'
        || '</div>';
    v_text_body := 'Kính gửi Thầy/Cô ' || v_hrt.full_name || E',\n\n'
        || 'Danh sách học viên sắp đến hạn học phí cần chăm sóc:\n'
        || v_text_list || E'\n'
        || 'Vui lòng kiểm tra Staff Dashboard để cập nhật tiến trình liên hệ phụ huynh.';

    UPDATE public.email_dispatch_queue
    SET student_count = v_valid_count,
        student_ids = v_valid_ids,
        subject = v_subject,
        html_body = v_html_body,
        text_body = v_text_body,
        recipient_email = v_hrt.email,
        recipient_name = v_hrt.full_name,
        updated_at = now()
    WHERE id = p_queue_id;

    RETURN jsonb_build_object(
        'can_send', true,
        'queue_id', p_queue_id,
        'recipient_email', v_hrt.email,
        'recipient_name', v_hrt.full_name,
        'subject', v_subject,
        'html_body', v_html_body,
        'text_body', v_text_body,
        'student_count', v_valid_count,
        'student_ids', v_valid_ids,
        'idempotency_key', v_queue.idempotency_key,
        'provider_message_id', v_queue.provider_message_id
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 4. Hàm chốt kết quả gửi email nguyên tử kèm cơ chế thử lại (Atomic Finalize & Retry)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_tuition_email_dispatch(
    p_queue_id UUID,
    p_success BOOLEAN,
    p_provider_message_id TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_server BOOLEAN;
    v_is_admin BOOLEAN;
    v_queue RECORD;
    v_new_retry_count INT;
    v_next_retry TIMESTAMPTZ;
    v_final_status TEXT;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF v_caller_id IS NOT NULL THEN
        v_is_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_is_admin := false;
    END IF;

    IF NOT (v_is_server OR v_is_admin) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống hoặc máy chủ mới có quyền cập nhật trạng thái gửi.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_queue FROM public.email_dispatch_queue WHERE id = p_queue_id;
    IF v_queue.id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy bản ghi hàng đợi với ID: %', p_queue_id;
    END IF;

    IF p_success THEN
        UPDATE public.email_dispatch_queue
        SET status = 'sent',
            sent_at = now(),
            provider_message_id = COALESCE(p_provider_message_id, v_queue.provider_message_id),
            error_reason = NULL,
            updated_at = now()
        WHERE id = p_queue_id;

        UPDATE public.email_dispatch_logs
        SET delivery_status = 'sent'
        WHERE queue_id = p_queue_id AND delivery_status IN ('batched', 'processing');

        RETURN jsonb_build_object(
            'success', true,
            'status', 'sent',
            'provider_message_id', COALESCE(p_provider_message_id, v_queue.provider_message_id)
        );
    ELSE
        v_new_retry_count := v_queue.retry_count + 1;

        IF v_new_retry_count >= v_queue.max_retries THEN
            v_final_status := 'failed';
            v_next_retry := NULL;

            UPDATE public.email_dispatch_logs
            SET delivery_status = 'failed',
                skip_reason = 'Quá số lần thử lại tối đa: ' || COALESCE(p_error_message, 'Lỗi không xác định')
            WHERE queue_id = p_queue_id AND delivery_status = 'processing';
        ELSE
            v_final_status := 'failed';
            -- Lịch thử lại lùi dần (backoff: 1 phút, 2 phút, ...)
            v_next_retry := now() + (v_new_retry_count * INTERVAL '1 minute');
        END IF;

        UPDATE public.email_dispatch_queue
        SET status = v_final_status,
            retry_count = v_new_retry_count,
            next_retry_at = v_next_retry,
            error_reason = p_error_message,
            provider_message_id = COALESCE(p_provider_message_id, v_queue.provider_message_id),
            updated_at = now()
        WHERE id = p_queue_id;

        RETURN jsonb_build_object(
            'success', false,
            'status', v_final_status,
            'retry_count', v_new_retry_count,
            'max_retries', v_queue.max_retries,
            'next_retry_at', v_next_retry
        );
    END IF;
END;
$$;

-- -----------------------------------------------------------------------------
-- 5. Cập nhật prepare_daily_tuition_alert_queue:
--    Áp đúng cửa sổ nhắc trước hạn (không nhắc lặp học viên đã quá hạn trong quá khứ)
--    và hiển thị riêng "Hết hạn hôm nay"
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepare_daily_tuition_alert_queue(p_target_date DATE DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_server BOOLEAN;
    v_is_admin BOOLEAN;
    v_today_vn DATE;
    v_threshold INT;
    v_rec RECORD;
    v_queue_id UUID;
    v_queued_emails INT := 0;
    v_skipped_students INT := 0;
    v_total_students INT := 0;
    
    v_hrt_group RECORD;
    v_student_rows RECORD;
    v_html_table TEXT;
    v_text_list TEXT;
    v_student_ids UUID[];
    v_student_count INT;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF v_caller_id IS NOT NULL THEN
        v_is_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_is_admin := false;
    END IF;

    IF NOT (v_is_server OR v_is_admin) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống hoặc tiến trình máy chủ mới có quyền chạy tác vụ email.'
            USING ERRCODE = '42501';
    END IF;

    v_today_vn := COALESCE(p_target_date, (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date);
    v_threshold := public.get_tuition_warning_days();

    CREATE TEMPORARY TABLE IF NOT EXISTS tmp_due_students (
        student_id UUID,
        student_code TEXT,
        student_name TEXT,
        branch_id UUID,
        branch_name VARCHAR,
        class_name VARCHAR,
        tuition_expiry_date DATE,
        days_remaining INT,
        effective_hrt_id UUID,
        effective_hrt_email VARCHAR,
        effective_hrt_name VARCHAR
    ) ON COMMIT DROP;

    TRUNCATE tmp_due_students;

    -- CHẶN NHẮC LẶP: Áp đúng cửa sổ nhắc trước hạn:
    -- tuition_expiry_date >= v_today_vn VÀ tuition_expiry_date <= (v_today_vn + v_threshold)
    INSERT INTO tmp_due_students
    SELECT
        s.id AS student_id,
        s.student_code,
        s.full_name AS student_name,
        s.branch_id,
        b.name AS branch_name,
        c.name AS class_name,
        s.tuition_expiry_date,
        (s.tuition_expiry_date - v_today_vn)::INT AS days_remaining,
        eff.effective_hrt_id,
        p.email::VARCHAR AS effective_hrt_email,
        p.full_name::VARCHAR AS effective_hrt_name
    FROM public.students s
    JOIN public.branches b ON b.id = s.branch_id
    LEFT JOIN public.classes c ON c.id = s.current_class_id
    CROSS JOIN LATERAL (
        SELECT public.get_effective_hrt_id(s.id) AS effective_hrt_id
    ) eff
    LEFT JOIN public.profiles p ON p.id = eff.effective_hrt_id
    WHERE s.status IN ('active', 'warning')
      AND s.tuition_expiry_date >= v_today_vn
      AND s.tuition_expiry_date <= (v_today_vn + v_threshold)
      AND NOT EXISTS (
          SELECT 1 FROM public.email_dispatch_logs l
          WHERE l.dispatch_date = v_today_vn AND l.student_id = s.id
      );

    -- 1. Xử lý các học viên thiếu HRT phụ trách (Ghi log skipped)
    FOR v_rec IN 
        SELECT * FROM tmp_due_students WHERE effective_hrt_id IS NULL OR effective_hrt_email IS NULL
    LOOP
        INSERT INTO public.email_dispatch_logs (
            dispatch_date,
            student_id,
            student_name,
            branch_id,
            tuition_expiry_date,
            days_remaining,
            effective_hrt_id,
            effective_hrt_email,
            delivery_status,
            skip_reason
        ) VALUES (
            v_today_vn,
            v_rec.student_id,
            v_rec.student_name,
            v_rec.branch_id,
            v_rec.tuition_expiry_date,
            v_rec.days_remaining,
            NULL,
            NULL,
            'skipped',
            'Thiếu HRT phụ trách: Học viên chưa được phân công HRT riêng và lớp không có HRT mặc định'
        ) ON CONFLICT (dispatch_date, student_id) DO NOTHING;

        v_skipped_students := v_skipped_students + 1;
    END LOOP;

    -- 2. Gom nhóm các học viên có HRT vào MỘT EMAIL DUY NHẤT cho mỗi HRT
    FOR v_hrt_group IN
        SELECT DISTINCT effective_hrt_id, effective_hrt_email, effective_hrt_name
        FROM tmp_due_students
        WHERE effective_hrt_id IS NOT NULL AND effective_hrt_email IS NOT NULL
    LOOP
        v_student_ids := ARRAY[]::UUID[];
        v_student_count := 0;
        v_html_table := '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">'
            || '<tr style="background-color: #043264; color: white;">'
            || '<th>Mã HV</th><th>Họ tên học viên</th><th>Lớp</th><th>Cơ sở</th><th>Hạn học phí</th><th>Tình trạng hạn</th>'
            || '</tr>';
        v_text_list := '';

        FOR v_student_rows IN
            SELECT * FROM tmp_due_students WHERE effective_hrt_id = v_hrt_group.effective_hrt_id ORDER BY days_remaining ASC
        LOOP
            v_student_ids := array_append(v_student_ids, v_student_rows.student_id);
            v_student_count := v_student_count + 1;

            v_html_table := v_html_table || '<tr>'
                || '<td><strong>' || v_student_rows.student_code || '</strong></td>'
                || '<td>' || v_student_rows.student_name || '</td>'
                || '<td>' || COALESCE(v_student_rows.class_name, 'Chưa xếp lớp') || '</td>'
                || '<td>' || v_student_rows.branch_name || '</td>'
                || '<td>' || to_char(v_student_rows.tuition_expiry_date, 'DD/MM/YYYY') || '</td>'
                || '<td style="' || CASE
                    WHEN v_student_rows.days_remaining = 0 THEN 'background-color: #fef2f2; color: #dc2626; font-weight: bold;'
                    WHEN v_student_rows.days_remaining <= 7 THEN 'color: #dc2626; font-weight: bold;'
                    ELSE 'color: #d97706; font-weight: 500;'
                END || '">'
                || CASE
                    WHEN v_student_rows.days_remaining = 0 THEN 'Hết hạn hôm nay'
                    WHEN v_student_rows.days_remaining > 0 THEN 'Còn ' || v_student_rows.days_remaining || ' ngày'
                    ELSE 'Đã quá hạn ' || ABS(v_student_rows.days_remaining) || ' ngày'
                END
                || '</td></tr>';

            v_text_list := v_text_list || '- ' || v_student_rows.student_name || ' (' || v_student_rows.student_code || '): Hạn ' || to_char(v_student_rows.tuition_expiry_date, 'DD/MM/YYYY')
                || ' (' || CASE WHEN v_student_rows.days_remaining = 0 THEN 'Hết hạn hôm nay' ELSE 'Còn ' || v_student_rows.days_remaining || ' ngày' END || ')' || E'\n';
        END LOOP;

        v_html_table := v_html_table || '</table>';

        -- Tạo bản ghi hàng đợi
        INSERT INTO public.email_dispatch_queue (
            dispatch_date,
            recipient_hrt_id,
            recipient_email,
            recipient_name,
            subject,
            html_body,
            text_body,
            student_count,
            student_ids,
            status,
            idempotency_key
        ) VALUES (
            v_today_vn,
            v_hrt_group.effective_hrt_id,
            v_hrt_group.effective_hrt_email,
            v_hrt_group.effective_hrt_name,
            '[KAPLA] Cảnh báo hạn học phí: ' || v_student_count || ' học viên cần chăm sóc ngày ' || to_char(v_today_vn, 'DD/MM/YYYY'),
            '<div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 680px;">'
                || '<h2 style="color: #043264;">KAPLA Staff Dashboard — Thông báo học phí</h2>'
                || '<p>Kính gửi Thầy/Cô <strong>' || v_hrt_group.effective_hrt_name || '</strong>,</p>'
                || '<p>Hệ thống ghi nhận có <strong>' || v_student_count || ' học viên</strong> do Thầy/Cô trực tiếp phụ trách sắp đến hạn tái tục học phí trong vòng ' || v_threshold || ' ngày tới:</p>'
                || v_html_table
                || '<p style="margin-top: 20px;">Vui lòng liên hệ phụ huynh để thăm hỏi tình hình học tập và hỗ trợ tái tục đúng hạn.</p>'
                || '<p style="color: #64748b; font-size: 12px; margin-top: 30px;">Email tự động từ Hệ thống Quản trị Học vụ KAPLA (Asia/Ho_Chi_Minh).</p>'
                || '</div>',
            'Kính gửi Thầy/Cô ' || v_hrt_group.effective_hrt_name || E',\n\n'
                || 'Danh sách học viên sắp đến hạn học phí cần chăm sóc:\n'
                || v_text_list || E'\n'
                || 'Vui lòng kiểm tra Staff Dashboard để cập nhật tiến trình liên hệ phụ huynh.',
            v_student_count,
            v_student_ids,
            'pending',
            'kapla-' || v_today_vn || '-' || v_hrt_group.effective_hrt_id || '-' || substr(md5(random()::text), 1, 8)
        )
        ON CONFLICT (dispatch_date, recipient_hrt_id) DO NOTHING
        RETURNING id INTO v_queue_id;

        IF v_queue_id IS NOT NULL THEN
            v_queued_emails := v_queued_emails + 1;
            v_total_students := v_total_students + v_student_count;

            INSERT INTO public.email_dispatch_logs (
                dispatch_date,
                student_id,
                student_name,
                branch_id,
                tuition_expiry_date,
                days_remaining,
                effective_hrt_id,
                effective_hrt_email,
                delivery_status,
                queue_id
            )
            SELECT
                v_today_vn,
                t.student_id,
                t.student_name,
                t.branch_id,
                t.tuition_expiry_date,
                t.days_remaining,
                t.effective_hrt_id,
                t.effective_hrt_email,
                'batched',
                v_queue_id
            FROM tmp_due_students t
            WHERE t.effective_hrt_id = v_hrt_group.effective_hrt_id
            ON CONFLICT (dispatch_date, student_id) DO NOTHING;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'dispatch_date', v_today_vn,
        'threshold_days', v_threshold,
        'queued_emails', v_queued_emails,
        'batched_students', v_total_students,
        'skipped_students', v_skipped_students
    );
END;
$$;

-- -----------------------------------------------------------------------------
-- 6. Cập nhật hàm get_students_due_for_tuition_alert hỗ trợ tham số p_include_overdue
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_students_due_for_tuition_alert(INT);

CREATE OR REPLACE FUNCTION public.get_students_due_for_tuition_alert(
    p_days_threshold INT DEFAULT NULL,
    p_include_overdue BOOLEAN DEFAULT false
)
RETURNS TABLE (
    student_id UUID,
    student_code TEXT,
    student_name TEXT,
    branch_id UUID,
    branch_name VARCHAR,
    current_class_id UUID,
    class_name VARCHAR,
    tuition_expiry_date DATE,
    days_remaining INT,
    effective_hrt_id UUID,
    effective_hrt_email VARCHAR,
    effective_hrt_name VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_is_server BOOLEAN;
    v_is_admin BOOLEAN;
    v_threshold INT;
    v_user_status TEXT;
BEGIN
    IF (session_user = 'postgres' AND auth.uid() IS NULL) THEN
        v_is_server := true;
    ELSE
        v_is_server := (auth.jwt()->>'role' = 'service_role');
    END IF;

    IF v_caller_id IS NOT NULL THEN
        SELECT status INTO v_user_status FROM public.profiles WHERE id = v_caller_id;
        IF v_user_status IS DISTINCT FROM 'active' THEN
            RAISE EXCEPTION 'Quyền bị từ chối: Tài khoản của bạn chưa kích hoạt hoặc đã bị vô hiệu hóa.'
                USING ERRCODE = '42501';
        END IF;

        v_is_admin := public.is_system_admin(v_caller_id);
    ELSE
        v_is_admin := false;
    END IF;

    IF NOT (v_is_server OR v_is_admin) THEN
        RAISE EXCEPTION 'Quyền bị từ chối: Chỉ Quản trị hệ thống (System Admin) hoặc tiến trình máy chủ mới có quyền truy cập danh sách nhắc học phí.'
            USING ERRCODE = '42501';
    END IF;

    v_threshold := COALESCE(p_days_threshold, public.get_tuition_warning_days());

    RETURN QUERY
    SELECT
        s.id AS student_id,
        s.student_code,
        s.full_name AS student_name,
        s.branch_id,
        b.name AS branch_name,
        s.current_class_id,
        c.name AS class_name,
        s.tuition_expiry_date,
        (s.tuition_expiry_date - CURRENT_DATE)::INT AS days_remaining,
        eff.effective_hrt_id,
        p.email::VARCHAR AS effective_hrt_email,
        p.full_name::VARCHAR AS effective_hrt_name
    FROM public.students s
    JOIN public.branches b ON b.id = s.branch_id
    LEFT JOIN public.classes c ON c.id = s.current_class_id
    CROSS JOIN LATERAL (
        SELECT public.get_effective_hrt_id(s.id) AS effective_hrt_id
    ) eff
    LEFT JOIN public.profiles p ON p.id = eff.effective_hrt_id
    WHERE s.status IN ('active', 'warning')
      AND s.tuition_expiry_date <= (CURRENT_DATE + v_threshold)
      AND (p_include_overdue = true OR s.tuition_expiry_date >= CURRENT_DATE)
    ORDER BY s.tuition_expiry_date ASC;
END;
$$;



-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
-- SEED DATA: CLEANUP_AND_SEED_PHAM_HUNG.sql
-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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


