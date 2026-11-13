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
