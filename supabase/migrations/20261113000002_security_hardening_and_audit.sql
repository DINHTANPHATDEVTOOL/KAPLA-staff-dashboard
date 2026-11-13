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
