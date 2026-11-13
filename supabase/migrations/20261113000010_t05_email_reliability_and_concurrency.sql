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
