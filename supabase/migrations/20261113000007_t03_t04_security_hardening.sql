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
