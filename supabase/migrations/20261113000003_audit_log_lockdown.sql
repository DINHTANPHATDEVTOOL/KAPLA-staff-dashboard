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
