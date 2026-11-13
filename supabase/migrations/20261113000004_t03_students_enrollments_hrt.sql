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
