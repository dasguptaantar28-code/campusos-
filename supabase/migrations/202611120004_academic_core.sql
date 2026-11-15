-- ==============================================================================
-- CampusOS Migration 0004: Academic Core Tables
-- ==============================================================================

-- 17. Academic Sessions / Years
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_academic_sessions_tenant ON public.academic_sessions(tenant_id, is_current) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_academic_sessions_updated_at
  BEFORE UPDATE ON public.academic_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 18. Classes / Grades
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  numeric_level INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 60 CHECK (capacity > 0),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_classes_tenant ON public.classes(tenant_id, numeric_level) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 19. Teachers (defined before sections for class_teacher_id FK)
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'General',
  designation TEXT NOT NULL DEFAULT 'Teacher',
  qualification TEXT,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  documents_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  base_salary_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_salary_cents >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'resigned', 'terminated')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, employee_code)
);

CREATE INDEX IF NOT EXISTS idx_teachers_tenant ON public.teachers(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_teachers_user ON public.teachers(tenant_id, user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 20. Sections
CREATE TABLE IF NOT EXISTS public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_number TEXT,
  class_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL DEFAULT 40 CHECK (capacity > 0),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sections_tenant_class ON public.sections(tenant_id, class_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 21. Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  subject_type TEXT NOT NULL DEFAULT 'core' CHECK (subject_type IN ('core', 'elective', 'lab', 'language', 'activity')),
  default_max_marks NUMERIC(6,2) NOT NULL DEFAULT 100 CHECK (default_max_marks > 0),
  default_pass_marks NUMERIC(6,2) NOT NULL DEFAULT 33 CHECK (default_pass_marks >= 0),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_subjects_tenant ON public.subjects(tenant_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 22. Non-Teaching Staff
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'Administration',
  designation TEXT NOT NULL DEFAULT 'Staff',
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  phone TEXT,
  email TEXT,
  photo_url TEXT,
  documents_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  base_salary_cents INTEGER NOT NULL DEFAULT 0 CHECK (base_salary_cents >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'resigned', 'terminated')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, employee_code)
);

CREATE INDEX IF NOT EXISTS idx_staff_tenant ON public.staff(tenant_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 23. Students
CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_code TEXT NOT NULL,
  admission_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  roll_number TEXT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('applicant', 'active', 'promoted', 'transferred', 'graduated', 'withdrawn')),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  address TEXT,
  transfer_certificate_no TEXT,
  transfer_issued_at TIMESTAMPTZ,
  academic_history_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, student_code),
  UNIQUE (tenant_id, admission_number)
);

CREATE INDEX IF NOT EXISTS idx_students_tenant_class ON public.students(tenant_id, class_id, section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_tenant_status ON public.students(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(tenant_id, user_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 24. Student Guardians (Explicit Parent-Child Linkage)
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  guardian_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  guardian_name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'parent' CHECK (relationship IN ('father', 'mother', 'guardian', 'parent', 'other')),
  phone TEXT NOT NULL,
  email TEXT,
  occupation TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  can_pickup BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardians_tenant_student ON public.student_guardians(tenant_id, student_id);
CREATE INDEX IF NOT EXISTS idx_guardians_user ON public.student_guardians(tenant_id, guardian_user_id);

CREATE TRIGGER trg_student_guardians_updated_at
  BEFORE UPDATE ON public.student_guardians
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 25. Class Subjects (Teacher <-> Class/Section/Subject Assignments)
CREATE TABLE IF NOT EXISTS public.class_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_class_subjects UNIQUE NULLS NOT DISTINCT (tenant_id, session_id, class_id, section_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher ON public.class_subjects(tenant_id, teacher_id);

CREATE TRIGGER trg_class_subjects_updated_at
  BEFORE UPDATE ON public.class_subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
