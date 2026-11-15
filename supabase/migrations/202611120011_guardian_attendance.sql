-- ==============================================================================
-- CampusOS Migration 0011: Guardian Attendance Table & RLS Policies
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.guardian_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  guardian_id UUID NOT NULL REFERENCES public.student_guardians(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  visit_purpose TEXT NOT NULL DEFAULT 'ptm' CHECK (visit_purpose IN ('ptm', 'pickup', 'dropoff', 'meeting', 'event', 'other')),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, guardian_id, attendance_date, visit_purpose)
);

CREATE INDEX IF NOT EXISTS idx_guardian_attendance_tenant_date
  ON public.guardian_attendance(tenant_id, attendance_date);

CREATE TRIGGER trg_guardian_attendance_updated_at
  BEFORE UPDATE ON public.guardian_attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.guardian_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guardian_attendance_read" ON public.guardian_attendance
  FOR SELECT USING (
    app.is_module_enabled_for_tenant(tenant_id, 'attendance')
    AND (
      app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher','staff'])
      OR EXISTS (
        SELECT 1 FROM public.student_guardians sg
        WHERE sg.id = guardian_attendance.guardian_id
          AND sg.tenant_id = guardian_attendance.tenant_id
          AND sg.guardian_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "guardian_attendance_write" ON public.guardian_attendance
  FOR ALL USING (
    app.is_module_enabled_for_tenant(tenant_id, 'attendance')
    AND app.has_tenant_permission(tenant_id, 'attendance.mark')
    AND app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher'])
  )
  WITH CHECK (
    app.is_module_enabled_for_tenant(tenant_id, 'attendance')
    AND app.has_tenant_permission(tenant_id, 'attendance.mark')
    AND app.has_tenant_role(tenant_id, ARRAY['school_admin','teacher'])
  );
