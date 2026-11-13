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
