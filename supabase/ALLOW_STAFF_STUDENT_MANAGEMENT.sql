-- ==============================================================================
-- KAPLA — CẤP QUYỀN RLS CHO NHÂN SỰ CƠ SỞ (HRT/CM/HT) QUẢN LÝ HỌC VIÊN
-- ==============================================================================

-- 1. Cho phép mọi nhân sự thuộc chi nhánh xem học viên chi nhánh đó
DROP POLICY IF EXISTS "Quyền xem hồ sơ học viên theo quy tắc ưu tiên HRT và cơ sở" ON public.students;
CREATE POLICY "Nhân sự chi nhánh xem học viên"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );

-- 2. Cho phép nhân sự chi nhánh (HRT, CM, HT) thêm và chỉnh sửa học viên
DROP POLICY IF EXISTS "Admin và CM quản lý học viên cơ sở" ON public.students;
DROP POLICY IF EXISTS "Nhân sự chi nhánh quản lý học viên" ON public.students;
CREATE POLICY "Nhân sự chi nhánh quản lý học viên"
    ON public.students FOR ALL
    TO authenticated
    USING (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    )
    WITH CHECK (
        public.is_system_admin(auth.uid())
        OR public.is_active_member_of_branch(auth.uid(), branch_id)
    );
