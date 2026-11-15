-- ==============================================================================
-- CampusOS Migration 0008: Security Helper Functions, RLS Policies & Quotas
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SECURITY DEFINER Authorization & Isolation Helpers
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins pa
    WHERE pa.user_id = auth.uid()
      AND pa.is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION app.is_tenant_active(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenants t
    WHERE t.id = p_tenant_id
      AND t.status = 'active'
      AND t.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION app.has_tenant_membership(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app.is_platform_admin()
    OR (
      app.is_tenant_active(p_tenant_id)
      AND EXISTS (
        SELECT 1
        FROM public.tenant_memberships tm
        WHERE tm.tenant_id = p_tenant_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.deleted_at IS NULL
      )
    );
$$;

CREATE OR REPLACE FUNCTION app.has_tenant_role(p_tenant_id UUID, p_role_keys TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app.is_platform_admin()
    OR (
      app.is_tenant_active(p_tenant_id)
      AND (
        EXISTS (
          SELECT 1
          FROM public.tenant_memberships tm
          JOIN public.roles r ON r.id = tm.role_id
          WHERE tm.tenant_id = p_tenant_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
            AND r.key = ANY(p_role_keys)
        )
        OR EXISTS (
          SELECT 1
          FROM public.user_roles ur
          JOIN public.roles r ON r.id = ur.role_id
          JOIN public.tenant_memberships tm ON tm.tenant_id = ur.tenant_id AND tm.user_id = ur.user_id
          WHERE ur.tenant_id = p_tenant_id
            AND ur.user_id = auth.uid()
            AND tm.status = 'active'
            AND tm.deleted_at IS NULL
            AND r.key = ANY(p_role_keys)
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION app.has_tenant_permission(p_tenant_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app.is_platform_admin()
    OR (
      app.is_tenant_active(p_tenant_id)
      AND EXISTS (
        SELECT 1
        FROM public.tenant_memberships tm
        JOIN public.role_permissions rp ON rp.role_id = tm.role_id
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE tm.tenant_id = p_tenant_id
          AND tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.deleted_at IS NULL
          AND p.key = p_permission_key
      )
    );
$$;

CREATE OR REPLACE FUNCTION app.is_module_enabled_for_tenant(p_tenant_id UUID, p_module_key TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_global_enabled BOOLEAN;
  v_is_core BOOLEAN;
  v_tenant_override BOOLEAN;
  v_plan_allowed BOOLEAN;
  v_maint_mode BOOLEAN;
BEGIN
  IF app.is_platform_admin() THEN
    RETURN TRUE;
  END IF;

  IF NOT app.is_tenant_active(p_tenant_id) THEN
    RETURN FALSE;
  END IF;

  SELECT maintenance_mode INTO v_maint_mode FROM public.global_config WHERE config_key = 'default' LIMIT 1;
  IF COALESCE(v_maint_mode, FALSE) THEN
    RETURN FALSE;
  END IF;

  SELECT m.is_globally_enabled, m.is_core
  INTO v_global_enabled, v_is_core
  FROM public.modules m
  WHERE m.key = p_module_key;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF NOT v_global_enabled THEN
    RETURN FALSE;
  END IF;

  SELECT tf.is_enabled INTO v_tenant_override
  FROM public.tenant_features tf
  WHERE tf.tenant_id = p_tenant_id
    AND tf.module_key = p_module_key
    AND tf.feature_key IS NULL
  LIMIT 1;

  IF v_tenant_override IS NOT NULL THEN
    RETURN v_tenant_override;
  END IF;

  IF v_is_core THEN
    RETURN TRUE;
  END IF;

  SELECT COALESCE(p_module_key = ANY(sp.allowed_modules), FALSE)
  INTO v_plan_allowed
  FROM public.tenants t
  LEFT JOIN public.subscription_plans sp ON sp.id = t.subscription_plan_id
  WHERE t.id = p_tenant_id;

  RETURN COALESCE(v_plan_allowed, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION app.is_guardian_of_student(p_tenant_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app.has_tenant_membership(p_tenant_id)
    AND EXISTS (
      SELECT 1
      FROM public.student_guardians sg
      WHERE sg.tenant_id = p_tenant_id
        AND sg.student_id = p_student_id
        AND sg.guardian_user_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION app.is_student_owner(p_tenant_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app.has_tenant_membership(p_tenant_id)
    AND EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = p_student_id
        AND s.tenant_id = p_tenant_id
        AND s.user_id = auth.uid()
        AND s.deleted_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION app.is_teacher_assigned(p_tenant_id UUID, p_class_id UUID, p_subject_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app.has_tenant_membership(p_tenant_id)
    AND EXISTS (
      SELECT 1
      FROM public.teachers te
      WHERE te.tenant_id = p_tenant_id
        AND te.user_id = auth.uid()
        AND te.deleted_at IS NULL
        AND (
          EXISTS (
            SELECT 1 FROM public.class_subjects cs
            WHERE cs.tenant_id = p_tenant_id
              AND cs.teacher_id = te.id
              AND cs.class_id = p_class_id
              AND (p_subject_id IS NULL OR cs.subject_id = p_subject_id)
          )
          OR EXISTS (
            SELECT 1 FROM public.sections sec
            WHERE sec.tenant_id = p_tenant_id
              AND sec.class_id = p_class_id
              AND sec.class_teacher_id = te.id
              AND sec.deleted_at IS NULL
          )
        )
    );
$$;

-- ------------------------------------------------------------------------------
-- 2. Subscription Quota Enforcement Triggers (Server-Side)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION app.enforce_subscription_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan public.subscription_plans%ROWTYPE;
  v_count INTEGER;
  v_role_key TEXT;
BEGIN
  SELECT sp.* INTO v_plan
  FROM public.tenants t
  JOIN public.subscription_plans sp ON sp.id = t.subscription_plan_id
  WHERE t.id = NEW.tenant_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'students' THEN
    SELECT COUNT(*) INTO v_count FROM public.students WHERE tenant_id = NEW.tenant_id AND deleted_at IS NULL;
    IF v_count >= v_plan.max_students THEN
      RAISE EXCEPTION 'Subscription limit reached: plan % allows max % students', v_plan.code, v_plan.max_students;
    END IF;
  ELSIF TG_TABLE_NAME = 'teachers' THEN
    SELECT COUNT(*) INTO v_count FROM public.teachers WHERE tenant_id = NEW.tenant_id AND deleted_at IS NULL;
    IF v_count >= v_plan.max_teachers THEN
      RAISE EXCEPTION 'Subscription limit reached: plan % allows max % teachers', v_plan.code, v_plan.max_teachers;
    END IF;
  ELSIF TG_TABLE_NAME = 'staff' THEN
    SELECT COUNT(*) INTO v_count FROM public.staff WHERE tenant_id = NEW.tenant_id AND deleted_at IS NULL;
    IF v_count >= v_plan.max_staff THEN
      RAISE EXCEPTION 'Subscription limit reached: plan % allows max % staff members', v_plan.code, v_plan.max_staff;
    END IF;
  ELSIF TG_TABLE_NAME = 'tenant_memberships' THEN
    SELECT key INTO v_role_key FROM public.roles WHERE id = NEW.role_id;
    IF v_role_key = 'school_admin' THEN
      SELECT COUNT(*) INTO v_count
      FROM public.tenant_memberships tm
      JOIN public.roles r ON r.id = tm.role_id
      WHERE tm.tenant_id = NEW.tenant_id AND r.key = 'school_admin' AND tm.status = 'active' AND tm.deleted_at IS NULL;
      IF v_count >= v_plan.max_admin_accounts THEN
        RAISE EXCEPTION 'Subscription limit reached: plan % allows max % school admin accounts', v_plan.code, v_plan.max_admin_accounts;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quota_students ON public.students;
CREATE TRIGGER trg_quota_students BEFORE INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION app.enforce_subscription_quota();

DROP TRIGGER IF EXISTS trg_quota_teachers ON public.teachers;
CREATE TRIGGER trg_quota_teachers BEFORE INSERT ON public.teachers FOR EACH ROW EXECUTE FUNCTION app.enforce_subscription_quota();

DROP TRIGGER IF EXISTS trg_quota_staff ON public.staff;
CREATE TRIGGER trg_quota_staff BEFORE INSERT ON public.staff FOR EACH ROW EXECUTE FUNCTION app.enforce_subscription_quota();

DROP TRIGGER IF EXISTS trg_quota_admins ON public.tenant_memberships;
CREATE TRIGGER trg_quota_admins BEFORE INSERT ON public.tenant_memberships FOR EACH ROW EXECUTE FUNCTION app.enforce_subscription_quota();

-- ------------------------------------------------------------------------------
-- 3. Enable RLS on ALL 69 Tables
-- ------------------------------------------------------------------------------

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups_metadata ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 4. Platform & SaaS Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "subscription_plans_public_read" ON public.subscription_plans
  FOR SELECT USING (is_active = TRUE OR app.is_platform_admin());
CREATE POLICY "subscription_plans_admin_write" ON public.subscription_plans
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "tenants_member_or_admin_read" ON public.tenants
  FOR SELECT USING (
    app.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.tenant_id = tenants.id AND tm.user_id = auth.uid() AND tm.deleted_at IS NULL
    )
  );
CREATE POLICY "tenants_admin_write" ON public.tenants
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());
CREATE POLICY "tenants_school_admin_update_own" ON public.tenants
  FOR UPDATE USING (app.has_tenant_role(id, ARRAY['school_admin']))
  WITH CHECK (app.has_tenant_role(id, ARRAY['school_admin']));

CREATE POLICY "tenant_domains_read" ON public.tenant_domains
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "tenant_domains_manage" ON public.tenant_domains
  FOR ALL USING (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  WITH CHECK (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']));

CREATE POLICY "platform_admins_read_self_or_admin" ON public.platform_admins
  FOR SELECT USING (user_id = auth.uid() OR app.is_platform_admin());
CREATE POLICY "platform_admins_manage" ON public.platform_admins
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "subscriptions_read" ON public.subscriptions
  FOR SELECT USING (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']));
CREATE POLICY "subscriptions_admin_write" ON public.subscriptions
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "invoices_read" ON public.invoices
  FOR SELECT USING (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']));
CREATE POLICY "invoices_admin_write" ON public.invoices
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "payments_read" ON public.payments
  FOR SELECT USING (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']));
CREATE POLICY "payments_admin_write" ON public.payments
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "platform_settings_read" ON public.platform_settings
  FOR SELECT USING (is_public = TRUE OR app.is_platform_admin());
CREATE POLICY "platform_settings_write" ON public.platform_settings
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "global_features_read" ON public.global_features
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "global_features_write" ON public.global_features
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "global_config_read" ON public.global_config
  FOR SELECT USING (TRUE);
CREATE POLICY "global_config_write" ON public.global_config
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 5. Identity & RBAC Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "profiles_read" ON public.profiles
  FOR SELECT USING (
    id = auth.uid()
    OR app.is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM public.tenant_memberships tm_me
      JOIN public.tenant_memberships tm_other ON tm_other.tenant_id = tm_me.tenant_id
      WHERE tm_me.user_id = auth.uid() AND tm_me.status = 'active'
        AND tm_other.user_id = profiles.id AND tm_other.deleted_at IS NULL
        AND app.is_tenant_active(tm_me.tenant_id)
    )
  );
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE USING (id = auth.uid() OR app.is_platform_admin())
  WITH CHECK (id = auth.uid() OR app.is_platform_admin());

CREATE POLICY "roles_read" ON public.roles
  FOR SELECT USING (tenant_id IS NULL OR app.has_tenant_membership(tenant_id));
CREATE POLICY "roles_manage" ON public.roles
  FOR ALL USING (app.is_platform_admin() OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin'])))
  WITH CHECK (app.is_platform_admin() OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin'])));

CREATE POLICY "permissions_read" ON public.permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "permissions_manage" ON public.permissions FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "role_permissions_read" ON public.role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "role_permissions_manage" ON public.role_permissions FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "memberships_read" ON public.tenant_memberships
  FOR SELECT USING (
    user_id = auth.uid()
    OR app.is_platform_admin()
    OR app.has_tenant_role(tenant_id, ARRAY['school_admin'])
  );
CREATE POLICY "memberships_manage" ON public.tenant_memberships
  FOR ALL USING (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  WITH CHECK (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']));

CREATE POLICY "user_roles_read" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR app.is_platform_admin() OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin'])));
CREATE POLICY "user_roles_manage" ON public.user_roles
  FOR ALL USING (app.is_platform_admin() OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin'])))
  WITH CHECK (app.is_platform_admin() OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin'])));

CREATE POLICY "contact_inquiries_anon_insert" ON public.contact_inquiries
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "contact_inquiries_admin_read" ON public.contact_inquiries
  FOR SELECT USING (app.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 6. Academic Core Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "academic_sessions_read" ON public.academic_sessions
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "academic_sessions_write" ON public.academic_sessions
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'academics.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'academics.write'));

CREATE POLICY "classes_read" ON public.classes
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "classes_write" ON public.classes
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'academics.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'academics.write'));

CREATE POLICY "sections_read" ON public.sections
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "sections_write" ON public.sections
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'academics.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'academics.write'));

CREATE POLICY "subjects_read" ON public.subjects
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "subjects_write" ON public.subjects
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'academics.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'academics.write'));

CREATE POLICY "teachers_read" ON public.teachers
  FOR SELECT USING (
    app.has_tenant_membership(tenant_id)
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher','accountant','staff'])
      OR user_id = auth.uid()
    )
  );
CREATE POLICY "teachers_write" ON public.teachers
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'teachers.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'teachers.write'));

CREATE POLICY "staff_read" ON public.staff
  FOR SELECT USING (
    app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant','staff'])
    OR (app.has_tenant_membership(tenant_id) AND user_id = auth.uid())
  );
CREATE POLICY "staff_write" ON public.staff
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'staff.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'staff.write'));

-- Students: Admin/Accountant/Staff see tenant students; Teachers see assigned classes; Parents ONLY linked children; Students ONLY self
CREATE POLICY "students_read" ON public.students
  FOR SELECT USING (
    app.is_platform_admin()
    OR (
      app.has_tenant_membership(tenant_id)
      AND (
        app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant','staff'])
        OR (app.has_tenant_role(tenant_id, ARRAY['teacher']) AND app.is_teacher_assigned(tenant_id, class_id))
        OR user_id = auth.uid()
        OR app.is_guardian_of_student(tenant_id, id)
      )
    )
  );
CREATE POLICY "students_write" ON public.students
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'students.write') AND app.is_module_enabled_for_tenant(tenant_id, 'students'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'students.write') AND app.is_module_enabled_for_tenant(tenant_id, 'students'));

CREATE POLICY "student_guardians_read" ON public.student_guardians
  FOR SELECT USING (
    app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher','accountant'])
    OR guardian_user_id = auth.uid()
    OR app.is_student_owner(tenant_id, student_id)
  );
CREATE POLICY "student_guardians_write" ON public.student_guardians
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'students.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'students.write'));

CREATE POLICY "class_subjects_read" ON public.class_subjects
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "class_subjects_write" ON public.class_subjects
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'academics.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'academics.write'));

-- ------------------------------------------------------------------------------
-- 7. Academic Operations Policies (Module-Gated + Role/Ownership-Scoped)
-- ------------------------------------------------------------------------------

CREATE POLICY "attendance_read" ON public.attendance
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'attendance')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin'])
      OR (app.has_tenant_role(tenant_id, ARRAY['teacher']) AND app.is_teacher_assigned(tenant_id, class_id))
      OR app.is_student_owner(tenant_id, student_id)
      OR app.is_guardian_of_student(tenant_id, student_id)
    )
  );
CREATE POLICY "attendance_write" ON public.attendance
  FOR ALL USING (
    app.is_module_enabled_for_tenant(tenant_id, 'attendance')
    AND app.has_tenant_permission(tenant_id, 'attendance.mark')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin'])
      OR (app.has_tenant_role(tenant_id, ARRAY['teacher']) AND app.is_teacher_assigned(tenant_id, class_id))
    )
  )
  WITH CHECK (
    app.is_module_enabled_for_tenant(tenant_id, 'attendance')
    AND app.has_tenant_permission(tenant_id, 'attendance.mark')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin'])
      OR (app.has_tenant_role(tenant_id, ARRAY['teacher']) AND app.is_teacher_assigned(tenant_id, class_id))
    )
  );

CREATE POLICY "teacher_attendance_read" ON public.teacher_attendance
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'attendance')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin'])
      OR EXISTS (SELECT 1 FROM public.teachers te WHERE te.id = teacher_attendance.teacher_id AND te.user_id = auth.uid())
    )
  );
CREATE POLICY "teacher_attendance_write" ON public.teacher_attendance
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'attendance') AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'attendance') AND app.has_tenant_role(tenant_id, ARRAY['school_admin']));

CREATE POLICY "exams_read" ON public.exams
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'exams') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "exams_write" ON public.exams
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'exams') AND app.has_tenant_permission(tenant_id, 'exams.write'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'exams') AND app.has_tenant_permission(tenant_id, 'exams.write'));

CREATE POLICY "exam_subjects_read" ON public.exam_subjects
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'exams') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "exam_subjects_write" ON public.exam_subjects
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'exams') AND app.has_tenant_permission(tenant_id, 'exams.write'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'exams') AND app.has_tenant_permission(tenant_id, 'exams.write'));

CREATE POLICY "marks_read" ON public.marks
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'exams')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher'])
      OR app.is_student_owner(tenant_id, student_id)
      OR app.is_guardian_of_student(tenant_id, student_id)
    )
  );
CREATE POLICY "marks_write" ON public.marks
  FOR ALL USING (
    app.is_module_enabled_for_tenant(tenant_id, 'exams')
    AND app.has_tenant_permission(tenant_id, 'exams.write')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin'])
      OR EXISTS (
        SELECT 1 FROM public.exam_subjects es
        WHERE es.id = marks.exam_subject_id AND app.is_teacher_assigned(tenant_id, es.class_id, es.subject_id)
      )
    )
  )
  WITH CHECK (
    app.is_module_enabled_for_tenant(tenant_id, 'exams')
    AND app.has_tenant_permission(tenant_id, 'exams.write')
  );

CREATE POLICY "grading_rules_read" ON public.grading_rules
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "grading_rules_write" ON public.grading_rules
  FOR ALL USING (app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  WITH CHECK (app.has_tenant_role(tenant_id, ARRAY['school_admin']));

CREATE POLICY "results_read" ON public.results
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'results')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher'])
      OR (is_published = TRUE AND (app.is_student_owner(tenant_id, student_id) OR app.is_guardian_of_student(tenant_id, student_id)))
    )
  );
CREATE POLICY "results_write" ON public.results
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'results') AND app.has_tenant_permission(tenant_id, 'results.approve'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'results') AND app.has_tenant_permission(tenant_id, 'results.approve'));

CREATE POLICY "report_cards_read" ON public.report_cards
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'results')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher'])
      OR app.is_student_owner(tenant_id, student_id)
      OR app.is_guardian_of_student(tenant_id, student_id)
    )
  );
CREATE POLICY "report_cards_write" ON public.report_cards
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'results') AND app.has_tenant_permission(tenant_id, 'results.approve'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'results') AND app.has_tenant_permission(tenant_id, 'results.approve'));

CREATE POLICY "timetables_read" ON public.timetables
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'timetable') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "timetables_write" ON public.timetables
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'timetable') AND app.has_tenant_permission(tenant_id, 'timetable.write'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'timetable') AND app.has_tenant_permission(tenant_id, 'timetable.write'));

CREATE POLICY "homework_read" ON public.homework
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'homework') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "homework_write" ON public.homework
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'homework') AND app.has_tenant_permission(tenant_id, 'homework.write'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'homework') AND app.has_tenant_permission(tenant_id, 'homework.write'));

CREATE POLICY "assignments_read" ON public.assignments
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'assignments') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "assignments_write" ON public.assignments
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'assignments') AND app.has_tenant_permission(tenant_id, 'assignments.grade'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'assignments') AND app.has_tenant_permission(tenant_id, 'assignments.grade'));

CREATE POLICY "assignment_submissions_read" ON public.assignment_submissions
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'assignments')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher'])
      OR app.is_student_owner(tenant_id, student_id)
      OR app.is_guardian_of_student(tenant_id, student_id)
    )
  );
CREATE POLICY "assignment_submissions_student_insert" ON public.assignment_submissions
  FOR INSERT WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'assignments') AND app.is_student_owner(tenant_id, student_id));
CREATE POLICY "assignment_submissions_grade" ON public.assignment_submissions
  FOR UPDATE USING (app.is_module_enabled_for_tenant(tenant_id, 'assignments') AND app.has_tenant_permission(tenant_id, 'assignments.grade'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'assignments') AND app.has_tenant_permission(tenant_id, 'assignments.grade'));

CREATE POLICY "learning_materials_read" ON public.learning_materials
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "learning_materials_write" ON public.learning_materials
  FOR ALL USING (app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher']))
  WITH CHECK (app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher']));

-- ------------------------------------------------------------------------------
-- 8. Financial & Campus Operations Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "fee_categories_read" ON public.fee_categories
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "fee_categories_write" ON public.fee_categories
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'));

CREATE POLICY "discounts_read" ON public.discounts
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']));
CREATE POLICY "discounts_write" ON public.discounts
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'));

CREATE POLICY "scholarships_read" ON public.scholarships
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'fees')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant'])
      OR app.is_student_owner(tenant_id, student_id)
      OR app.is_guardian_of_student(tenant_id, student_id)
    )
  );
CREATE POLICY "scholarships_write" ON public.scholarships
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']));

CREATE POLICY "student_fees_read" ON public.student_fees
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'fees')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant'])
      OR app.is_student_owner(tenant_id, student_id)
      OR app.is_guardian_of_student(tenant_id, student_id)
    )
  );
CREATE POLICY "student_fees_write" ON public.student_fees
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'));

CREATE POLICY "payment_intents_read" ON public.payment_intents
  FOR SELECT USING (
    app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant'])
    OR created_by = auth.uid()
  );
CREATE POLICY "payment_intents_write" ON public.payment_intents
  FOR ALL USING (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']))
  WITH CHECK (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']));

CREATE POLICY "fee_payments_read" ON public.fee_payments
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'fees')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant'])
      OR app.is_student_owner(tenant_id, student_id)
      OR app.is_guardian_of_student(tenant_id, student_id)
    )
  );
CREATE POLICY "fee_payments_write" ON public.fee_payments
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'fees') AND app.has_tenant_permission(tenant_id, 'fees.collect'));

CREATE POLICY "expenses_read" ON public.expenses
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'expenses') AND app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']));
CREATE POLICY "expenses_write" ON public.expenses
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'expenses') AND app.has_tenant_permission(tenant_id, 'expenses.manage'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'expenses') AND app.has_tenant_permission(tenant_id, 'expenses.manage'));

CREATE POLICY "library_books_read" ON public.library_books
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'library') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "library_books_write" ON public.library_books
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'library') AND app.has_tenant_permission(tenant_id, 'library.manage'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'library') AND app.has_tenant_permission(tenant_id, 'library.manage'));

CREATE POLICY "book_issues_read" ON public.book_issues
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'library')
    AND (borrower_user_id = auth.uid() OR app.has_tenant_permission(tenant_id, 'library.manage'))
  );
CREATE POLICY "book_issues_write" ON public.book_issues
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'library') AND app.has_tenant_permission(tenant_id, 'library.manage'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'library') AND app.has_tenant_permission(tenant_id, 'library.manage'));

CREATE POLICY "vehicles_read" ON public.vehicles
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'transport') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "vehicles_write" ON public.vehicles
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'transport') AND app.has_tenant_permission(tenant_id, 'transport.manage'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'transport') AND app.has_tenant_permission(tenant_id, 'transport.manage'));

CREATE POLICY "transport_routes_read" ON public.transport_routes
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'transport') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "transport_routes_write" ON public.transport_routes
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'transport') AND app.has_tenant_permission(tenant_id, 'transport.manage'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'transport') AND app.has_tenant_permission(tenant_id, 'transport.manage'));

CREATE POLICY "payroll_read" ON public.payroll
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'payroll') AND app.has_tenant_role(tenant_id, ARRAY['school_admin','accountant']));
CREATE POLICY "payroll_write" ON public.payroll
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'payroll') AND app.has_tenant_permission(tenant_id, 'payroll.manage'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'payroll') AND app.has_tenant_permission(tenant_id, 'payroll.manage'));

CREATE POLICY "leave_requests_read" ON public.leave_requests
  FOR SELECT USING (
    app.has_tenant_membership(tenant_id)
    AND (requester_user_id = auth.uid() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );
CREATE POLICY "leave_requests_insert_self" ON public.leave_requests
  FOR INSERT WITH CHECK (app.has_tenant_membership(tenant_id) AND requester_user_id = auth.uid());
CREATE POLICY "leave_requests_admin_update" ON public.leave_requests
  FOR UPDATE USING (app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  WITH CHECK (app.has_tenant_role(tenant_id, ARRAY['school_admin']));

CREATE POLICY "notices_read" ON public.notices
  FOR SELECT USING (app.is_module_enabled_for_tenant(tenant_id, 'notices') AND app.has_tenant_membership(tenant_id));
CREATE POLICY "notices_write" ON public.notices
  FOR ALL USING (app.is_module_enabled_for_tenant(tenant_id, 'notices') AND app.has_tenant_permission(tenant_id, 'notices.write'))
  WITH CHECK (app.is_module_enabled_for_tenant(tenant_id, 'notices') AND app.has_tenant_permission(tenant_id, 'notices.write'));

CREATE POLICY "events_read" ON public.events
  FOR SELECT USING (app.has_tenant_membership(tenant_id));
CREATE POLICY "events_write" ON public.events
  FOR ALL USING (app.has_tenant_permission(tenant_id, 'notices.write'))
  WITH CHECK (app.has_tenant_permission(tenant_id, 'notices.write'));

CREATE POLICY "notifications_read_own" ON public.notifications
  FOR SELECT USING (
    app.is_platform_admin()
    OR (recipient_user_id = auth.uid() AND (tenant_id IS NULL OR app.has_tenant_membership(tenant_id)))
  );
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (recipient_user_id = auth.uid()) WITH CHECK (recipient_user_id = auth.uid());
CREATE POLICY "notifications_admin_insert" ON public.notifications
  FOR INSERT WITH CHECK (
    app.is_platform_admin()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher']))
  );

CREATE POLICY "comm_threads_access" ON public.communication_threads
  FOR ALL USING (
    app.is_module_enabled_for_tenant(tenant_id, 'communication')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin'])
      OR parent_user_id = auth.uid()
      OR teacher_user_id = auth.uid()
    )
  )
  WITH CHECK (
    app.is_module_enabled_for_tenant(tenant_id, 'communication')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin'])
      OR parent_user_id = auth.uid()
      OR teacher_user_id = auth.uid()
    )
  );

CREATE POLICY "comm_messages_access" ON public.communication_messages
  FOR ALL USING (
    app.is_module_enabled_for_tenant(tenant_id, 'communication')
    AND EXISTS (
      SELECT 1 FROM public.communication_threads ct
      WHERE ct.id = communication_messages.thread_id
        AND (ct.parent_user_id = auth.uid() OR ct.teacher_user_id = auth.uid() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']))
    )
  )
  WITH CHECK (
    app.is_module_enabled_for_tenant(tenant_id, 'communication')
    AND sender_user_id = auth.uid()
  );

CREATE POLICY "support_tickets_read" ON public.support_tickets
  FOR SELECT USING (
    app.is_platform_admin()
    OR created_by = auth.uid()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );
CREATE POLICY "support_tickets_insert" ON public.support_tickets
  FOR INSERT WITH CHECK (created_by = auth.uid() AND (tenant_id IS NULL OR app.has_tenant_membership(tenant_id)));
CREATE POLICY "support_tickets_update" ON public.support_tickets
  FOR UPDATE USING (app.is_platform_admin() OR created_by = auth.uid())
  WITH CHECK (app.is_platform_admin() OR created_by = auth.uid());

-- ------------------------------------------------------------------------------
-- 9. Remote Config, Devices, Sessions & Audit Policies
-- ------------------------------------------------------------------------------

CREATE POLICY "modules_read" ON public.modules FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "modules_manage" ON public.modules FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "features_read" ON public.features FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "features_manage" ON public.features FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());

CREATE POLICY "tenant_features_read" ON public.tenant_features
  FOR SELECT USING (app.is_platform_admin() OR app.has_tenant_membership(tenant_id));
CREATE POLICY "tenant_features_manage" ON public.tenant_features
  FOR ALL USING (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  WITH CHECK (app.is_platform_admin() OR app.has_tenant_role(tenant_id, ARRAY['school_admin']));

CREATE POLICY "navigation_items_read" ON public.navigation_items
  FOR SELECT USING (
    app.is_platform_admin()
    OR (scope = 'global' AND auth.uid() IS NOT NULL)
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_membership(tenant_id))
  );
CREATE POLICY "navigation_items_manage" ON public.navigation_items
  FOR ALL USING (
    app.is_platform_admin()
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  )
  WITH CHECK (
    app.is_platform_admin()
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );

CREATE POLICY "dashboard_widgets_read" ON public.dashboard_widgets
  FOR SELECT USING (
    app.is_platform_admin()
    OR (scope = 'global' AND auth.uid() IS NOT NULL)
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_membership(tenant_id))
  );
CREATE POLICY "dashboard_widgets_manage" ON public.dashboard_widgets
  FOR ALL USING (
    app.is_platform_admin()
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  )
  WITH CHECK (
    app.is_platform_admin()
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );

CREATE POLICY "app_config_read" ON public.app_config
  FOR SELECT USING (
    app.is_platform_admin()
    OR (scope IN ('global', 'role') AND auth.uid() IS NOT NULL)
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_membership(tenant_id))
  );
CREATE POLICY "app_config_manage" ON public.app_config
  FOR ALL USING (
    app.is_platform_admin()
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  )
  WITH CHECK (
    app.is_platform_admin()
    OR (scope = 'tenant' AND tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );

CREATE POLICY "config_versions_read" ON public.configuration_versions
  FOR SELECT USING (
    app.is_platform_admin()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );
CREATE POLICY "config_versions_manage" ON public.configuration_versions
  FOR ALL USING (
    app.is_platform_admin()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  )
  WITH CHECK (
    app.is_platform_admin()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );

CREATE POLICY "user_settings_self" ON public.user_settings
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "device_registrations_read" ON public.device_registrations
  FOR SELECT USING (user_id = auth.uid() OR app.is_platform_admin());
CREATE POLICY "device_registrations_write" ON public.device_registrations
  FOR ALL USING (user_id = auth.uid() OR app.is_platform_admin())
  WITH CHECK (user_id = auth.uid() OR app.is_platform_admin());

CREATE POLICY "user_sessions_read" ON public.user_sessions
  FOR SELECT USING (
    user_id = auth.uid()
    OR app.is_platform_admin()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );
CREATE POLICY "user_sessions_manage" ON public.user_sessions
  FOR ALL USING (user_id = auth.uid() OR app.is_platform_admin())
  WITH CHECK (user_id = auth.uid() OR app.is_platform_admin());

CREATE POLICY "activity_logs_read" ON public.activity_logs
  FOR SELECT USING (
    app.is_platform_admin()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "audit_logs_read" ON public.audit_logs
  FOR SELECT USING (
    app.is_platform_admin()
    OR (tenant_id IS NOT NULL AND app.has_tenant_role(tenant_id, ARRAY['school_admin']))
  );
CREATE POLICY "audit_logs_insert_auth" ON public.audit_logs
  FOR INSERT WITH CHECK (app.is_platform_admin() OR (tenant_id IS NOT NULL AND app.has_tenant_membership(tenant_id)));

CREATE POLICY "backups_metadata_admin" ON public.backups_metadata
  FOR ALL USING (app.is_platform_admin()) WITH CHECK (app.is_platform_admin());
