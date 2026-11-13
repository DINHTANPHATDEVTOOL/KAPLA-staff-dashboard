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
