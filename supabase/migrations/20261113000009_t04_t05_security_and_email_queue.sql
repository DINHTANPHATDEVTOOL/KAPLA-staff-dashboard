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
