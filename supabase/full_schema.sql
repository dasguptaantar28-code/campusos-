-- CampusOS Unified Schema Migration
-- Generated on 2026-11-14T06:28:00.773Z

-- >>> START FILE: 202611120001_extensions_and_helpers.sql <<<
-- ==============================================================================
-- CampusOS Migration 0001: Extensions, App Schema & Timestamp Helpers
-- ==============================================================================

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

CREATE SCHEMA IF NOT EXISTS app;

-- Keep updated_at consistent on every row modification
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Helper for safe slug normalization
CREATE OR REPLACE FUNCTION app.normalize_slug(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' FROM regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;


-- >>> START FILE: 202611120002_platform_and_saas.sql <<<
-- ==============================================================================
-- CampusOS Migration 0002: Platform & Multi-Tenant SaaS Tables
-- ==============================================================================

-- 1. Subscription Plans (FREE, STARTER, PROFESSIONAL, ENTERPRISE)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE CHECK (code IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_price_cents >= 0),
  annual_price_cents INTEGER NOT NULL DEFAULT 0 CHECK (annual_price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  max_students INTEGER NOT NULL DEFAULT 100,
  max_teachers INTEGER NOT NULL DEFAULT 15,
  max_staff INTEGER NOT NULL DEFAULT 10,
  max_storage_mb INTEGER NOT NULL DEFAULT 1024,
  max_admin_accounts INTEGER NOT NULL DEFAULT 2,
  allowed_modules TEXT[] NOT NULL DEFAULT ARRAY['overview','students','teachers','attendance','notices','settings']::TEXT[],
  reports_tier TEXT NOT NULL DEFAULT 'basic' CHECK (reports_tier IN ('basic', 'standard', 'advanced', 'enterprise')),
  support_level TEXT NOT NULL DEFAULT 'community' CHECK (support_level IN ('community', 'email', 'priority', 'dedicated')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Tenants (Institutions / Schools / Colleges)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  institution_type TEXT NOT NULL DEFAULT 'school' CHECK (institution_type IN ('school', 'college', 'academy', 'university', 'training_center')),
  logo_url TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Bangladesh',
  website TEXT,
  branding_json JSONB NOT NULL DEFAULT '{"primary":"#16A34A","emerald":"#22C55E","darkGreen":"#064E3B","accent":"#111827","mode":"system"}'::JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'deactivated')),
  subscription_plan_id UUID REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suspended_reason TEXT,
  settings_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

CREATE TRIGGER trg_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Tenant Domains
CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON public.tenant_domains(tenant_id);

CREATE TRIGGER trg_tenant_domains_updated_at
  BEFORE UPDATE ON public.tenant_domains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Platform Admins (Global Super Admin authorization)
CREATE TABLE IF NOT EXISTS public.platform_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role_level TEXT NOT NULL DEFAULT 'super_admin' CHECK (role_level IN ('super_admin', 'platform_support', 'security_auditor')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_platform_admins_updated_at
  BEFORE UPDATE ON public.platform_admins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Subscriptions (Tenant subscription lifecycle)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'past_due', 'grace_period', 'suspended', 'cancelled', 'expired')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  grace_period_ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON public.subscriptions(tenant_id, status);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. SaaS Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_at TIMESTAMPTZ,
  line_items_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id, status);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. SaaS Payments (Platform subscription billing payments)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'stripe',
  provider_payment_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  verified_webhook_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON public.payments(tenant_id, status);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Platform Settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9. Global Features
CREATE TABLE IF NOT EXISTS public.global_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rollout_rules JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_global_features_updated_at
  BEFORE UPDATE ON public.global_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Global Config (Singleton Platform Policy Row)
CREATE TABLE IF NOT EXISTS public.global_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE DEFAULT 'default',
  brand_name TEXT NOT NULL DEFAULT 'CampusOS',
  tagline TEXT NOT NULL DEFAULT 'One Platform. Every Campus.',
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message TEXT NOT NULL DEFAULT 'CampusOS is currently undergoing scheduled maintenance. Please check back shortly.',
  default_theme JSONB NOT NULL DEFAULT '{"primary":"#16A34A","emerald":"#22C55E","darkGreen":"#064E3B","black":"#111827","charcoal":"#1F2937","white":"#FFFFFF","lightBg":"#F8FAFC","mode":"system"}'::JSONB,
  min_supported_app_version TEXT NOT NULL DEFAULT '1.0.0',
  active_version_number INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_global_config_updated_at
  BEFORE UPDATE ON public.global_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- >>> START FILE: 202611120003_identity_and_rbac.sql <<<
-- ==============================================================================
-- CampusOS Migration 0003: Identity, Roles, Permissions & Tenant Memberships
-- ==============================================================================

-- 11. User Profiles (1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'CampusOS User',
  phone TEXT,
  avatar_url TEXT,
  default_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Automatically create profile on Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_tenant UUID;
  v_student_role UUID;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    coalesce(NEW.email, ''),
    coalesce(NEW.raw_user_meta_data ->> 'full_name', split_part(coalesce(NEW.email, 'user'), '@', 1)),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- Automatically assign student role to default active tenant so new students have instant access
  SELECT id INTO v_default_tenant FROM public.tenants WHERE status = 'active' ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO v_student_role FROM public.roles WHERE key = 'student' LIMIT 1;

  IF v_default_tenant IS NOT NULL AND v_student_role IS NOT NULL THEN
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
    VALUES (v_default_tenant, NEW.id, v_student_role, 'active')
    ON CONFLICT (tenant_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Roles (Canonical System Roles + Optional Tenant Custom Roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_roles_tenant_key UNIQUE NULLS NOT DISTINCT (tenant_id, key)
);

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 13. Granular Permissions
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  module_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 14. Role Permissions Mapping
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

-- 15. Tenant Memberships (Strict User <-> Tenant Authorization Link)
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'revoked')),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_active ON public.tenant_memberships(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_role ON public.tenant_memberships(tenant_id, role_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_tenant_memberships_updated_at
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 16. Supplemental User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_roles UNIQUE NULLS NOT DISTINCT (tenant_id, user_id, role_id)
);

-- Public website contact & demo inquiry submissions
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  institution_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_contact_inquiries_updated_at
  BEFORE UPDATE ON public.contact_inquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- >>> START FILE: 202611120004_academic_core.sql <<<
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


-- >>> START FILE: 202611120005_academic_operations.sql <<<
-- ==============================================================================
-- CampusOS Migration 0005: Academic Operations Tables
-- ==============================================================================

-- 26. Student Attendance (Duplicate prevented via UNIQUE(tenant_id, student_id, attendance_date))
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date_class ON public.attendance(tenant_id, attendance_date, class_id, section_id);

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 27. Teacher Attendance
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'on_leave')),
  check_in_at TIMESTAMPTZ,
  check_out_at TIMESTAMPTZ,
  marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, teacher_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_teacher_attendance_tenant_date ON public.teacher_attendance(tenant_id, attendance_date);

CREATE TRIGGER trg_teacher_attendance_updated_at
  BEFORE UPDATE ON public.teacher_attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 28. Exams
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'term' CHECK (category IN ('quiz', 'monthly', 'midterm', 'term', 'final', 'practical')),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'marks_entry', 'pending_approval', 'published')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exams_tenant ON public.exams(tenant_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 29. Exam Subjects (Max marks & pass marks per subject/class in an exam)
CREATE TABLE IF NOT EXISTS public.exam_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  exam_date DATE,
  max_marks NUMERIC(6,2) NOT NULL DEFAULT 100 CHECK (max_marks > 0),
  pass_marks NUMERIC(6,2) NOT NULL DEFAULT 33 CHECK (pass_marks >= 0 AND pass_marks <= max_marks),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, exam_id, class_id, subject_id)
);

CREATE TRIGGER trg_exam_subjects_updated_at
  BEFORE UPDATE ON public.exam_subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 30. Marks (Validated against exam_subjects.max_marks via trigger)
CREATE TABLE IF NOT EXISTS public.marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_subject_id UUID NOT NULL REFERENCES public.exam_subjects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  marks_obtained NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (marks_obtained >= 0),
  is_absent BOOLEAN NOT NULL DEFAULT FALSE,
  entered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, exam_subject_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_marks_tenant_exam_student ON public.marks(tenant_id, exam_id, student_id);

CREATE TRIGGER trg_marks_updated_at
  BEFORE UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION app.validate_marks_against_max()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max NUMERIC(6,2);
  v_exam_tenant UUID;
BEGIN
  SELECT max_marks, tenant_id INTO v_max, v_exam_tenant
  FROM public.exam_subjects
  WHERE id = NEW.exam_subject_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Exam subject % not found', NEW.exam_subject_id;
  END IF;

  IF v_exam_tenant <> NEW.tenant_id THEN
    RAISE EXCEPTION 'Tenant mismatch on marks entry';
  END IF;

  IF NEW.is_absent THEN
    NEW.marks_obtained := 0;
  ELSIF NEW.marks_obtained > v_max THEN
    RAISE EXCEPTION 'marks_obtained (%) exceeds exam subject max_marks (%)', NEW.marks_obtained, v_max;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_marks_before_write
  BEFORE INSERT OR UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION app.validate_marks_against_max();

-- 31. Institution Grading Rules
CREATE TABLE IF NOT EXISTS public.grading_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  grade_label TEXT NOT NULL,
  min_percentage NUMERIC(5,2) NOT NULL CHECK (min_percentage >= 0 AND min_percentage <= 100),
  max_percentage NUMERIC(5,2) NOT NULL CHECK (max_percentage >= min_percentage AND max_percentage <= 100),
  gpa_point NUMERIC(4,2) NOT NULL CHECK (gpa_point >= 0),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, grade_label)
);

CREATE TRIGGER trg_grading_rules_updated_at
  BEFORE UPDATE ON public.grading_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 32. Results (Requires authorized approval before is_published = true)
CREATE TABLE IF NOT EXISTS public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  total_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
  max_total_marks NUMERIC(8,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  gpa NUMERIC(4,2) NOT NULL DEFAULT 0,
  grade TEXT NOT NULL DEFAULT 'N/A',
  rank_position INTEGER,
  is_passed BOOLEAN NOT NULL DEFAULT FALSE,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, exam_id, student_id),
  CHECK (NOT is_published OR approved_by IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_results_tenant_exam ON public.results(tenant_id, exam_id, is_published);

CREATE TRIGGER trg_results_updated_at
  BEFORE UPDATE ON public.results
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 33. Report Cards
CREATE TABLE IF NOT EXISTS public.report_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  result_id UUID NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  snapshot_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, card_number),
  UNIQUE (tenant_id, result_id)
);

CREATE TRIGGER trg_report_cards_updated_at
  BEFORE UPDATE ON public.report_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 34. Timetables / Class Routine
CREATE TABLE IF NOT EXISTS public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_timetables_tenant_class_day ON public.timetables(tenant_id, class_id, day_of_week);

CREATE TRIGGER trg_timetables_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 35. Homework
CREATE TABLE IF NOT EXISTS public.homework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  attachment_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_homework_tenant_class_due ON public.homework(tenant_id, class_id, due_date) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_homework_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 36. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  max_score NUMERIC(6,2) NOT NULL DEFAULT 100 CHECK (max_score > 0),
  due_at TIMESTAMPTZ NOT NULL,
  attachment_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_tenant_class ON public.assignments(tenant_id, class_id, due_at) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 37. Assignment Submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  submission_text TEXT,
  submission_url TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  score NUMERIC(6,2) CHECK (score >= 0),
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, assignment_id, student_id)
);

CREATE TRIGGER trg_assignment_submissions_updated_at
  BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 38. Learning Materials
CREATE TABLE IF NOT EXISTS public.learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  material_type TEXT NOT NULL DEFAULT 'document' CHECK (material_type IN ('document', 'slides', 'video_link', 'syllabus', 'worksheet')),
  file_url TEXT NOT NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_learning_materials_updated_at
  BEFORE UPDATE ON public.learning_materials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- >>> START FILE: 202611120006_financial_and_campus_ops.sql <<<
-- ==============================================================================
-- CampusOS Migration 0006: Financial, Campus Operations & Communication Tables
-- ==============================================================================

-- 39. Fee Categories
CREATE TABLE IF NOT EXISTS public.fee_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category_type TEXT NOT NULL DEFAULT 'tuition' CHECK (category_type IN ('admission', 'tuition', 'monthly', 'examination', 'transport', 'library', 'other')),
  default_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (default_amount_cents >= 0),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('one_time', 'monthly', 'term', 'annual')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);

CREATE TRIGGER trg_fee_categories_updated_at
  BEFORE UPDATE ON public.fee_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 40. Discounts
CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  value NUMERIC(10,2) NOT NULL CHECK (value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 41. Scholarships
CREATE TABLE IF NOT EXISTS public.scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  percentage NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  fixed_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (fixed_amount_cents >= 0),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 42. Student Fee Ledger
CREATE TABLE IF NOT EXISTS public.student_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE SET NULL,
  fee_category_id UUID REFERENCES public.fee_categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  gross_amount_cents INTEGER NOT NULL CHECK (gross_amount_cents >= 0),
  discount_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (discount_amount_cents >= 0),
  net_amount_cents INTEGER GENERATED ALWAYS AS (GREATEST(0, gross_amount_cents - discount_amount_cents)) STORED,
  paid_amount_cents INTEGER NOT NULL DEFAULT 0 CHECK (paid_amount_cents >= 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'waived', 'overdue')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_fees_tenant_student ON public.student_fees(tenant_id, student_id, status);

CREATE TRIGGER trg_student_fees_updated_at
  BEFORE UPDATE ON public.student_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 43. Server-Side Payment Intents (Gateway preparation without fake settlements)
CREATE TABLE IF NOT EXISTS public.payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  student_fee_id UUID REFERENCES public.student_fees(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'stripe',
  external_intent_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'requires_payment_method' CHECK (status IN ('requires_payment_method', 'processing', 'succeeded', 'failed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_payment_intents_updated_at
  BEFORE UPDATE ON public.payment_intents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 44. Fee Payments & Receipts
CREATE TABLE IF NOT EXISTS public.fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  student_fee_id UUID NOT NULL REFERENCES public.student_fees(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
  receipt_number TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'cheque', 'gateway_verified')),
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'voided', 'refunded')),
  gateway_reference TEXT,
  collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  remarks TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_tenant_student ON public.fee_payments(tenant_id, student_id, paid_at DESC);

CREATE TRIGGER trg_fee_payments_updated_at
  BEFORE UPDATE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Keep student_fees paid_amount_cents and status synchronized from completed fee_payments
CREATE OR REPLACE FUNCTION app.sync_student_fee_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fee_id UUID;
  v_total_paid INTEGER;
  v_net INTEGER;
BEGIN
  v_fee_id := COALESCE(NEW.student_fee_id, OLD.student_fee_id);
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_paid
  FROM public.fee_payments
  WHERE student_fee_id = v_fee_id AND payment_status = 'completed';

  SELECT net_amount_cents INTO v_net FROM public.student_fees WHERE id = v_fee_id;

  UPDATE public.student_fees
  SET
    paid_amount_cents = v_total_paid,
    status = CASE
      WHEN status = 'waived' THEN 'waived'
      WHEN v_total_paid >= v_net THEN 'paid'
      WHEN v_total_paid > 0 THEN 'partial'
      ELSE 'unpaid'
    END
  WHERE id = v_fee_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_fee_payments_sync_balance
  AFTER INSERT OR UPDATE OR DELETE ON public.fee_payments
  FOR EACH ROW EXECUTE FUNCTION app.sync_student_fee_balance();

-- 45. Institutional Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_name TEXT,
  receipt_url TEXT,
  recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON public.expenses(tenant_id, expense_date DESC);

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 46. Library Books
CREATE TABLE IF NOT EXISTS public.library_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  isbn TEXT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  shelf_location TEXT,
  total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
  available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0 AND available_copies <= total_copies),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_library_books_updated_at
  BEFORE UPDATE ON public.library_books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 47. Library Book Issues
CREATE TABLE IF NOT EXISTS public.book_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  book_id UUID NOT NULL REFERENCES public.library_books(id) ON DELETE RESTRICT,
  borrower_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at DATE NOT NULL DEFAULT CURRENT_DATE,
  due_at DATE NOT NULL,
  returned_at DATE,
  fine_cents INTEGER NOT NULL DEFAULT 0 CHECK (fine_cents >= 0),
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_book_issues_updated_at
  BEFORE UPDATE ON public.book_issues
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 48. Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  vehicle_number TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  capacity INTEGER NOT NULL DEFAULT 30 CHECK (capacity > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, vehicle_number)
);

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 49. Transport Routes
CREATE TABLE IF NOT EXISTS public.transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  route_name TEXT NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  stops_json JSONB NOT NULL DEFAULT '[]'::JSONB,
  monthly_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (monthly_fee_cents >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, route_name)
);

CREATE TRIGGER trg_transport_routes_updated_at
  BEFORE UPDATE ON public.transport_routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 50. HR & Payroll
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  employee_type TEXT NOT NULL CHECK (employee_type IN ('teacher', 'staff')),
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  month_year TEXT NOT NULL,
  basic_cents INTEGER NOT NULL CHECK (basic_cents >= 0),
  allowances_cents INTEGER NOT NULL DEFAULT 0 CHECK (allowances_cents >= 0),
  deductions_cents INTEGER NOT NULL DEFAULT 0 CHECK (deductions_cents >= 0),
  net_pay_cents INTEGER GENERATED ALWAYS AS (GREATEST(0, basic_cents + allowances_cents - deductions_cents)) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, employee_type, employee_id, month_year)
);

CREATE TRIGGER trg_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 51. Leave Requests
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  requester_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL DEFAULT 'casual' CHECK (leave_type IN ('sick', 'casual', 'annual', 'emergency', 'academic')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE TRIGGER trg_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 52. Notices
CREATE TABLE IF NOT EXISTS public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  target_roles TEXT[] NOT NULL DEFAULT ARRAY['school_admin','teacher','student','parent','staff']::TEXT[],
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notices_tenant_pub ON public.notices(tenant_id, published_at DESC) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_notices_updated_at
  BEFORE UPDATE ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 53. Events / Calendar
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'academic' CHECK (event_type IN ('academic', 'holiday', 'exam', 'sports', 'meeting', 'cultural')),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_at >= start_at)
);

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 54. Notifications (Tenant-aware in-app + FCM delivery log)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'attendance', 'fee', 'exam', 'result', 'homework', 'announcement', 'broadcast', 'security')),
  resource_type TEXT,
  resource_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  push_sent_at TIMESTAMPTZ,
  push_status TEXT NOT NULL DEFAULT 'pending' CHECK (push_status IN ('pending', 'sent', 'skipped_no_token', 'skipped_unconfigured', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, is_read, created_at DESC);

CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 55. Parent-Teacher Communication Threads & Messages
CREATE TABLE IF NOT EXISTS public.communication_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  teacher_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_communication_threads_updated_at
  BEFORE UPDATE ON public.communication_threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.communication_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  thread_id UUID NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_communication_messages_updated_at
  BEFORE UPDATE ON public.communication_messages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 56. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- >>> START FILE: 202611120007_remote_config_and_security.sql <<<
-- ==============================================================================
-- CampusOS Migration 0007: Dynamic Remote Configuration, Devices, Sessions & Catalog
-- ==============================================================================

-- 57. Configurable Modules
CREATE TABLE IF NOT EXISTS public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'LayoutGrid',
  default_route TEXT NOT NULL,
  nav_order INTEGER NOT NULL DEFAULT 100,
  is_globally_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_core BOOLEAN NOT NULL DEFAULT FALSE,
  required_permission TEXT,
  min_plan_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (min_plan_tier IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE')),
  allowed_roles TEXT[] NOT NULL DEFAULT ARRAY['school_admin']::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 58. Features (Sub-capabilities under modules)
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled_by_default BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 59. Tenant Features (Institution-level module & feature overrides)
CREATE TABLE IF NOT EXISTS public.tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  feature_key TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  config_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_module_feature UNIQUE NULLS NOT DISTINCT (tenant_id, module_key, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant ON public.tenant_features(tenant_id, module_key);

CREATE TRIGGER trg_tenant_features_updated_at
  BEFORE UPDATE ON public.tenant_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 60. Server-Driven Navigation Items (Synced across Web & Android)
CREATE TABLE IF NOT EXISTS public.navigation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'tenant')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_key TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'CircleDot',
  route_path TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT 'native' CHECK (target_type IN ('native', 'web', 'custom_screen', 'external_url')),
  payload_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  target_roles TEXT[] NOT NULL DEFAULT ARRAY['school_admin','teacher','student','parent','accountant','staff']::TEXT[],
  platforms TEXT[] NOT NULL DEFAULT ARRAY['web','mobile']::TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((scope = 'global' AND tenant_id IS NULL) OR (scope = 'tenant' AND tenant_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_navigation_items_scope ON public.navigation_items(scope, tenant_id, sort_order);

CREATE TRIGGER trg_navigation_items_updated_at
  BEFORE UPDATE ON public.navigation_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 61. Server-Driven Dashboard Widgets
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'tenant')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  widget_key TEXT NOT NULL,
  module_key TEXT NOT NULL DEFAULT 'overview',
  title TEXT NOT NULL,
  widget_type TEXT NOT NULL DEFAULT 'kpi' CHECK (widget_type IN ('kpi', 'chart', 'list', 'quick_actions', 'banner', 'custom')),
  target_roles TEXT[] NOT NULL DEFAULT ARRAY['school_admin']::TEXT[],
  platforms TEXT[] NOT NULL DEFAULT ARRAY['web','mobile']::TEXT[],
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  config_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((scope = 'global' AND tenant_id IS NULL) OR (scope = 'tenant' AND tenant_id IS NOT NULL))
);

CREATE TRIGGER trg_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 62. Remote App Configuration (Global / Tenant / Role hierarchy)
CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL CHECK (scope IN ('global', 'tenant', 'role')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_key TEXT,
  theme_tokens JSONB NOT NULL DEFAULT '{}'::JSONB,
  branding JSONB NOT NULL DEFAULT '{}'::JSONB,
  settings_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  notification_preferences JSONB NOT NULL DEFAULT '{"push":true,"in_app":true,"attendance_alerts":true,"fee_reminders":true,"result_alerts":true}'::JSONB,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  version_number INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_app_config_scope UNIQUE NULLS NOT DISTINCT (scope, tenant_id, role_key)
);

CREATE TRIGGER trg_app_config_updated_at
  BEFORE UPDATE ON public.app_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 63. Immutable Configuration Versions (For Snapshot History & 1-Click Rollback)
CREATE TABLE IF NOT EXISTS public.configuration_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_number INTEGER NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global' CHECK (scope IN ('global', 'tenant')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  snapshot_json JSONB NOT NULL,
  change_summary TEXT NOT NULL,
  restored_from_version_id UUID REFERENCES public.configuration_versions(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_config_version_num UNIQUE NULLS NOT DISTINCT (scope, tenant_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_config_versions_scope ON public.configuration_versions(scope, tenant_id, version_number DESC);

-- 64. User Settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_mode TEXT NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('light', 'dark', 'system')),
  locale TEXT NOT NULL DEFAULT 'en',
  notification_prefs JSONB NOT NULL DEFAULT '{"push":true,"in_app":true,"email":true}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 65. Device Registrations (Android & Web devices + FCM tokens)
CREATE TABLE IF NOT EXISTS public.device_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  device_name TEXT,
  os_version TEXT,
  app_version TEXT,
  fcm_token TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_device_reg_user_tenant ON public.device_registrations(user_id, tenant_id, is_active);

CREATE TRIGGER trg_device_registrations_updated_at
  BEFORE UPDATE ON public.device_registrations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 66. Active User Sessions (Supports remote revocation & forced sign-out)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  device_registration_id UUID REFERENCES public.device_registrations(id) ON DELETE SET NULL,
  session_token_hash TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'web' CHECK (platform IN ('web', 'android', 'ios')),
  ip_address TEXT,
  user_agent TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  revoke_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, revoked_at) WHERE revoked_at IS NULL;

CREATE TRIGGER trg_user_sessions_updated_at
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 67. Activity Logs (User & device actions)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  device_id TEXT,
  platform TEXT,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_tenant ON public.activity_logs(tenant_id, created_at DESC);

-- 68. Audit Logs (Immutable security, financial & remote config audit trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  before_json JSONB,
  after_json JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_time ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_time ON public.audit_logs(action, created_at DESC);

-- 69. Backup Metadata
CREATE TABLE IF NOT EXISTS public.backups_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL DEFAULT 'platform' CHECK (scope IN ('platform', 'tenant')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  backup_type TEXT NOT NULL DEFAULT 'manual' CHECK (backup_type IN ('scheduled', 'manual', 'pre_rollback')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  storage_path TEXT,
  size_bytes BIGINT,
  triggered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ==============================================================================
-- Baseline Production Catalog (Idempotent)
-- ==============================================================================

-- 4 Official Subscription Plans
INSERT INTO public.subscription_plans (code, name, description, monthly_price_cents, annual_price_cents, max_students, max_teachers, max_staff, max_storage_mb, max_admin_accounts, allowed_modules, reports_tier, support_level, sort_order)
VALUES
  ('FREE', 'Free Campus', 'For small pilot schools exploring CampusOS core operations.', 0, 0, 100, 15, 10, 1024, 2,
   ARRAY['overview','students','teachers','staff','admissions','classes','sections','subjects','sessions','attendance','homework','notices','settings']::TEXT[],
   'basic', 'community', 1),
  ('STARTER', 'Starter School', 'Complete academic, attendance, exam, and fee tools for growing schools.', 4900, 49000, 500, 50, 30, 10240, 5,
   ARRAY['overview','students','teachers','staff','admissions','classes','sections','subjects','sessions','attendance','exams','results','fees','timetable','homework','assignments','notices','events','communication','reports','settings']::TEXT[],
   'standard', 'email', 2),
  ('PROFESSIONAL', 'Professional Academy', 'Full multi-campus operations including library, transport, payroll, and branding.', 14900, 149000, 2500, 200, 100, 51200, 15,
   ARRAY['overview','students','teachers','staff','admissions','classes','sections','subjects','sessions','attendance','exams','results','fees','expenses','timetable','homework','assignments','library','transport','payroll','notices','events','communication','reports','settings']::TEXT[],
   'advanced', 'priority', 3),
  ('ENTERPRISE', 'Enterprise District', 'Unlimited scale, dedicated support, custom branding, and full remote configuration.', 39900, 399000, 50000, 5000, 2500, 512000, 100,
   ARRAY['overview','students','teachers','staff','admissions','classes','sections','subjects','sessions','attendance','exams','results','fees','expenses','timetable','homework','assignments','library','transport','payroll','notices','events','communication','reports','settings']::TEXT[],
   'enterprise', 'dedicated', 4)
ON CONFLICT (code) DO NOTHING;

-- Canonical System Roles
INSERT INTO public.roles (tenant_id, key, name, description, is_system)
VALUES
  (NULL, 'super_admin', 'Global Super Admin', 'Full centralized SaaS platform governance', TRUE),
  (NULL, 'school_admin', 'School Admin', 'Full administrative control within assigned institution', TRUE),
  (NULL, 'teacher', 'Teacher', 'Assigned classes, attendance, homework, assignments, and marks entry', TRUE),
  (NULL, 'student', 'Student', 'Student portal for routine, attendance, results, and assignments', TRUE),
  (NULL, 'parent', 'Parent / Guardian', 'Parent portal strictly scoped to linked children', TRUE),
  (NULL, 'accountant', 'Accountant', 'Fee ledger, collection, receipts, expenses, and financial reports', TRUE),
  (NULL, 'staff', 'Staff', 'Campus operations, library, transport, and support duties', TRUE)
ON CONFLICT DO NOTHING;

-- Granular Permissions
INSERT INTO public.permissions (key, module_key, name, description)
VALUES
  ('overview.read', 'overview', 'View Dashboard Overview', 'View institutional overview metrics'),
  ('students.read', 'students', 'View Students', 'Read student directory and profiles'),
  ('students.write', 'students', 'Manage Students', 'Create, update, promote, and import students'),
  ('teachers.read', 'teachers', 'View Teachers', 'Read teacher directory'),
  ('teachers.write', 'teachers', 'Manage Teachers', 'Register and manage teachers'),
  ('staff.read', 'staff', 'View Staff', 'Read staff directory'),
  ('staff.write', 'staff', 'Manage Staff', 'Register and manage non-teaching staff'),
  ('admissions.manage', 'admissions', 'Manage Admissions', 'Review and approve student admissions'),
  ('academics.read', 'classes', 'View Academic Structure', 'View sessions, classes, sections, subjects'),
  ('academics.write', 'classes', 'Manage Academic Structure', 'Configure sessions, classes, sections, subjects'),
  ('attendance.read', 'attendance', 'View Attendance', 'View student and teacher attendance logs'),
  ('attendance.mark', 'attendance', 'Mark Attendance', 'Record and update attendance records'),
  ('exams.read', 'exams', 'View Examinations', 'View exam schedules and subjects'),
  ('exams.write', 'exams', 'Manage Examinations', 'Create exams and enter marks'),
  ('results.read', 'results', 'View Results', 'View published exam results and report cards'),
  ('results.approve', 'results', 'Approve & Publish Results', 'Approve and publish exam results'),
  ('fees.read', 'fees', 'View Fees & Receipts', 'View fee ledgers and payment receipts'),
  ('fees.collect', 'fees', 'Collect Fees & Manage Ledger', 'Create fee entries and record verified payments'),
  ('expenses.manage', 'expenses', 'Manage Expenses', 'Record and review institutional expenses'),
  ('timetable.read', 'timetable', 'View Timetable', 'View class routines'),
  ('timetable.write', 'timetable', 'Manage Timetable', 'Configure class routines'),
  ('homework.read', 'homework', 'View Homework', 'View assigned homework'),
  ('homework.write', 'homework', 'Manage Homework', 'Create and update homework'),
  ('assignments.read', 'assignments', 'View Assignments', 'View assignments and submit work'),
  ('assignments.grade', 'assignments', 'Manage & Grade Assignments', 'Create assignments and evaluate submissions'),
  ('library.read', 'library', 'View Library', 'Browse library books'),
  ('library.manage', 'library', 'Manage Library', 'Manage catalog and issue/return books'),
  ('transport.read', 'transport', 'View Transport', 'View routes and vehicles'),
  ('transport.manage', 'transport', 'Manage Transport', 'Configure routes and fleet'),
  ('payroll.manage', 'payroll', 'Manage HR & Payroll', 'Run payroll and review leave requests'),
  ('notices.read', 'notices', 'View Notices & Events', 'View announcements and campus calendar'),
  ('notices.write', 'notices', 'Manage Notices & Events', 'Publish notices and campus events'),
  ('communication.access', 'communication', 'Parent-Teacher Communication', 'Message linked parents/teachers'),
  ('reports.read', 'reports', 'View Reports', 'Access institutional reports and exports'),
  ('settings.manage', 'settings', 'Manage School Settings', 'Manage tenant settings, branding, and remote overrides')
ON CONFLICT (key) DO NOTHING;

-- Map System Roles -> Permissions
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key IN ('super_admin', 'school_admin') AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key IN (
  'overview.read','students.read','academics.read','attendance.read','attendance.mark',
  'exams.read','exams.write','results.read','timetable.read','homework.read','homework.write',
  'assignments.read','assignments.grade','notices.read','communication.access','reports.read'
) WHERE r.key = 'teacher' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key IN (
  'overview.read','academics.read','attendance.read','exams.read','results.read',
  'timetable.read','homework.read','assignments.read','library.read','transport.read','notices.read'
) WHERE r.key = 'student' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key IN (
  'overview.read','students.read','attendance.read','exams.read','results.read',
  'fees.read','timetable.read','homework.read','notices.read','communication.access'
) WHERE r.key = 'parent' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key IN (
  'overview.read','students.read','fees.read','fees.collect','expenses.manage','payroll.manage','reports.read','notices.read'
) WHERE r.key = 'accountant' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r JOIN public.permissions p ON p.key IN (
  'overview.read','staff.read','library.read','library.manage','transport.read','transport.manage','notices.read'
) WHERE r.key = 'staff' AND r.tenant_id IS NULL
ON CONFLICT DO NOTHING;

-- Baseline Global Config & App Config
INSERT INTO public.global_config (config_key, brand_name, tagline)
VALUES ('default', 'CampusOS', 'One Platform. Every Campus.')
ON CONFLICT (config_key) DO NOTHING;

INSERT INTO public.app_config (scope, tenant_id, role_key, theme_tokens, branding, settings_json, maintenance_mode, version_number)
VALUES (
  'global',
  NULL,
  NULL,
  '{"primary":"#16A34A","emerald":"#22C55E","darkGreen":"#064E3B","black":"#111827","charcoal":"#1F2937","white":"#FFFFFF","lightBg":"#F8FAFC","mode":"system"}'::JSONB,
  '{"brandName":"CampusOS","tagline":"One Platform. Every Campus."}'::JSONB,
  '{"allowSchoolThemeOverride":true,"enableOfflineCache":true,"configPollSeconds":300}'::JSONB,
  FALSE,
  1
)
ON CONFLICT DO NOTHING;

-- Canonical 25 School Modules
INSERT INTO public.modules (key, name, description, icon, default_route, nav_order, is_globally_enabled, is_core, required_permission, min_plan_tier, allowed_roles)
VALUES
  ('overview', 'Overview', 'Campus KPIs and live analytics', 'LayoutDashboard', '', 10, TRUE, TRUE, 'overview.read', 'FREE', ARRAY['school_admin','teacher','student','parent','accountant','staff']),
  ('students', 'Students', 'Student directory, profiles, ID cards, promotions & bulk CSV', 'Users', '/students', 20, TRUE, FALSE, 'students.read', 'FREE', ARRAY['school_admin','teacher','accountant']),
  ('teachers', 'Teachers', 'Faculty profiles, departments & assignments', 'GraduationCap', '/teachers', 30, TRUE, FALSE, 'teachers.read', 'FREE', ARRAY['school_admin']),
  ('staff', 'Staff', 'Non-teaching staff management', 'Briefcase', '/staff', 40, TRUE, FALSE, 'staff.read', 'FREE', ARRAY['school_admin']),
  ('admissions', 'Admissions', 'Online admission pipeline and enrollment', 'UserPlus', '/admissions', 50, TRUE, FALSE, 'admissions.manage', 'FREE', ARRAY['school_admin']),
  ('classes', 'Classes', 'Class levels and capacities', 'School', '/classes', 60, TRUE, FALSE, 'academics.read', 'FREE', ARRAY['school_admin','teacher']),
  ('sections', 'Sections', 'Class divisions and room assignments', 'Layers', '/sections', 70, TRUE, FALSE, 'academics.read', 'FREE', ARRAY['school_admin','teacher']),
  ('subjects', 'Subjects', 'Academic subjects and mark blueprints', 'BookOpen', '/subjects', 80, TRUE, FALSE, 'academics.read', 'FREE', ARRAY['school_admin','teacher']),
  ('sessions', 'Academic Sessions', 'Academic years and active terms', 'CalendarRange', '/sessions', 90, TRUE, FALSE, 'academics.read', 'FREE', ARRAY['school_admin']),
  ('attendance', 'Attendance', 'Daily student & teacher attendance tracking', 'CalendarCheck2', '/attendance', 100, TRUE, FALSE, 'attendance.read', 'FREE', ARRAY['school_admin','teacher','student','parent']),
  ('exams', 'Examinations', 'Exam schedules, subjects & validated marks entry', 'ClipboardList', '/exams', 110, TRUE, FALSE, 'exams.read', 'STARTER', ARRAY['school_admin','teacher','student','parent']),
  ('results', 'Results', 'GPA calculation, merit lists, approvals & report cards', 'Award', '/results', 120, TRUE, FALSE, 'results.read', 'STARTER', ARRAY['school_admin','teacher','student','parent']),
  ('fees', 'Fees & Payments', 'Fee ledger, receipts, discounts & gateway intents', 'CreditCard', '/fees', 130, TRUE, FALSE, 'fees.read', 'STARTER', ARRAY['school_admin','accountant','parent']),
  ('expenses', 'Expenses', 'Operational campus expenses', 'Receipt', '/expenses', 140, TRUE, FALSE, 'expenses.manage', 'PROFESSIONAL', ARRAY['school_admin','accountant']),
  ('timetable', 'Timetable', 'Weekly class routines and room allocation', 'Clock', '/timetable', 150, TRUE, FALSE, 'timetable.read', 'STARTER', ARRAY['school_admin','teacher','student','parent']),
  ('homework', 'Homework', 'Daily class homework and parent visibility', 'NotebookPen', '/homework', 160, TRUE, FALSE, 'homework.read', 'FREE', ARRAY['school_admin','teacher','student','parent']),
  ('assignments', 'Assignments', 'Graded assignments and student submissions', 'FileCheck2', '/assignments', 170, TRUE, FALSE, 'assignments.read', 'STARTER', ARRAY['school_admin','teacher','student']),
  ('library', 'Library', 'Book catalog and circulation tracking', 'Library', '/library', 180, TRUE, FALSE, 'library.read', 'PROFESSIONAL', ARRAY['school_admin','staff','student']),
  ('transport', 'Transport', 'Routes, buses, and fleet tracking', 'Bus', '/transport', 190, TRUE, FALSE, 'transport.read', 'PROFESSIONAL', ARRAY['school_admin','staff','student','parent']),
  ('payroll', 'HR & Payroll', 'Monthly salaries and leave requests', 'Wallet', '/payroll', 200, TRUE, FALSE, 'payroll.manage', 'PROFESSIONAL', ARRAY['school_admin','accountant']),
  ('notices', 'Notices', 'Campus announcements and circulars', 'Megaphone', '/notices', 210, TRUE, FALSE, 'notices.read', 'FREE', ARRAY['school_admin','teacher','student','parent','accountant','staff']),
  ('events', 'Events', 'School calendar and upcoming events', 'CalendarDays', '/events', 220, TRUE, FALSE, 'notices.read', 'STARTER', ARRAY['school_admin','teacher','student','parent','staff']),
  ('communication', 'Parent Communication', 'Direct guardian-teacher messaging', 'MessageSquare', '/communication', 230, TRUE, FALSE, 'communication.access', 'STARTER', ARRAY['school_admin','teacher','parent']),
  ('reports', 'Reports', 'Institutional analytics and CSV exports', 'BarChart3', '/reports', 240, TRUE, FALSE, 'reports.read', 'STARTER', ARRAY['school_admin','accountant','teacher']),
  ('settings', 'School Settings', 'Branding, grading rules & remote preferences', 'Settings', '/settings', 250, TRUE, TRUE, 'settings.manage', 'FREE', ARRAY['school_admin'])
ON CONFLICT (key) DO NOTHING;

-- Baseline Global Navigation Items derived from modules (synced to Web & Mobile)
INSERT INTO public.navigation_items (scope, tenant_id, module_key, label, icon, route_path, target_type, target_roles, platforms, sort_order, is_visible, is_custom)
SELECT
  'global',
  NULL,
  m.key,
  m.name,
  m.icon,
  m.default_route,
  'native',
  m.allowed_roles,
  ARRAY['web','mobile']::TEXT[],
  m.nav_order,
  TRUE,
  FALSE
FROM public.modules m
WHERE NOT EXISTS (
  SELECT 1 FROM public.navigation_items n WHERE n.scope = 'global' AND n.module_key = m.key AND n.is_custom = FALSE
);

-- Baseline Dashboard Widgets
INSERT INTO public.dashboard_widgets (scope, tenant_id, widget_key, module_key, title, widget_type, target_roles, platforms, sort_order, is_visible, config_json)
VALUES
  ('global', NULL, 'kpi_students', 'students', 'Total Students', 'kpi', ARRAY['school_admin','teacher'], ARRAY['web','mobile'], 10, TRUE, '{"metric":"total_students","icon":"Users"}'::JSONB),
  ('global', NULL, 'kpi_teachers', 'teachers', 'Total Teachers', 'kpi', ARRAY['school_admin'], ARRAY['web','mobile'], 20, TRUE, '{"metric":"total_teachers","icon":"GraduationCap"}'::JSONB),
  ('global', NULL, 'kpi_attendance', 'attendance', 'Today Attendance %', 'kpi', ARRAY['school_admin','teacher','student','parent'], ARRAY['web','mobile'], 30, TRUE, '{"metric":"attendance_rate","icon":"CalendarCheck2"}'::JSONB),
  ('global', NULL, 'kpi_fees', 'fees', 'Fees Collected', 'kpi', ARRAY['school_admin','accountant','parent'], ARRAY['web','mobile'], 40, TRUE, '{"metric":"fees_collected","icon":"CreditCard"}'::JSONB),
  ('global', NULL, 'chart_academic_overview', 'overview', 'Academic & Attendance Overview', 'chart', ARRAY['school_admin','teacher'], ARRAY['web','mobile'], 50, TRUE, '{"chartType":"area"}'::JSONB),
  ('global', NULL, 'list_recent_notices', 'notices', 'Recent Campus Notices', 'list', ARRAY['school_admin','teacher','student','parent','accountant','staff'], ARRAY['web','mobile'], 60, TRUE, '{"limit":5}'::JSONB)
ON CONFLICT DO NOTHING;

-- Seed Initial Configuration Snapshot v1
INSERT INTO public.configuration_versions (version_number, scope, tenant_id, snapshot_json, change_summary)
SELECT
  1,
  'global',
  NULL,
  jsonb_build_object(
    'global_config', (SELECT to_jsonb(gc) FROM public.global_config gc WHERE config_key = 'default' LIMIT 1),
    'app_config', (SELECT to_jsonb(ac) FROM public.app_config ac WHERE scope = 'global' LIMIT 1),
    'modules', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.nav_order) FROM public.modules m), '[]'::JSONB),
    'navigation_items', COALESCE((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.sort_order) FROM public.navigation_items n WHERE n.scope = 'global'), '[]'::JSONB),
    'dashboard_widgets', COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.sort_order) FROM public.dashboard_widgets w WHERE w.scope = 'global'), '[]'::JSONB)
  ),
  'Initial CampusOS platform configuration baseline v1'
WHERE NOT EXISTS (
  SELECT 1 FROM public.configuration_versions WHERE scope = 'global' AND tenant_id IS NULL AND version_number = 1
);


-- >>> START FILE: 202611120008_rls_and_security_functions.sql <<<
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


-- >>> START FILE: 202611120009_rpc_remote_config_and_realtime.sql <<<
-- ==============================================================================
-- CampusOS Migration 0009: Server-Side RPCs, Remote Config Engine & Realtime
-- ==============================================================================

-- 1. Hierarchical Remote Configuration Resolver
CREATE OR REPLACE FUNCTION public.resolve_effective_config(
  p_tenant_id UUID DEFAULT NULL,
  p_platform TEXT DEFAULT 'web'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_super_admin BOOLEAN := FALSE;
  v_global RECORD;
  v_global_app RECORD;
  v_tenant RECORD;
  v_tenant_app RECORD;
  v_role_app RECORD;
  v_role_key TEXT := 'guest';
  v_permissions TEXT[] := ARRAY[]::TEXT[];
  v_plan RECORD;
  v_theme JSONB;
  v_branding JSONB;
  v_settings JSONB;
  v_modules JSONB;
  v_nav JSONB;
  v_widgets JSONB;
  v_latest_version INTEGER := 1;
  v_session_revoked BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_global FROM public.global_config WHERE config_key = 'default' LIMIT 1;
  SELECT * INTO v_global_app FROM public.app_config WHERE scope = 'global' AND tenant_id IS NULL LIMIT 1;

  v_theme := COALESCE(v_global_app.theme_tokens, v_global.default_theme, '{}'::JSONB);
  v_branding := COALESCE(v_global_app.branding, jsonb_build_object('brandName', COALESCE(v_global.brand_name, 'CampusOS'), 'tagline', COALESCE(v_global.tagline, 'One Platform. Every Campus.')));
  v_settings := COALESCE(v_global_app.settings_json, '{}'::JSONB);
  v_latest_version := COALESCE(v_global.active_version_number, v_global_app.version_number, 1);

  IF v_uid IS NOT NULL THEN
    v_is_super_admin := app.is_platform_admin();
    SELECT EXISTS (
      SELECT 1 FROM public.user_sessions us
      WHERE us.user_id = v_uid
        AND us.revoked_at IS NOT NULL
        AND us.revoked_at > NOW() - INTERVAL '10 minutes'
        AND NOT EXISTS (
          SELECT 1 FROM public.user_sessions us2
          WHERE us2.user_id = v_uid AND us2.revoked_at IS NULL AND us2.created_at > us.revoked_at
        )
    ) INTO v_session_revoked;
  END IF;

  IF p_tenant_id IS NOT NULL THEN
    SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('authorized', FALSE, 'error', 'Institution not found');
    END IF;

    IF NOT v_is_super_admin THEN
      IF v_tenant.status <> 'active' THEN
        RETURN jsonb_build_object(
          'authorized', FALSE,
          'tenant_id', v_tenant.id,
          'tenant_status', v_tenant.status,
          'error', 'Institution access is currently ' || v_tenant.status,
          'maintenance_mode', COALESCE(v_global.maintenance_mode, FALSE)
        );
      END IF;

      IF v_uid IS NULL OR NOT app.has_tenant_membership(p_tenant_id) THEN
        RETURN jsonb_build_object('authorized', FALSE, 'tenant_id', p_tenant_id, 'error', 'Unauthorized tenant membership');
      END IF;
    END IF;

    SELECT r.key INTO v_role_key
    FROM public.tenant_memberships tm
    JOIN public.roles r ON r.id = tm.role_id
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_uid AND tm.status = 'active' AND tm.deleted_at IS NULL
    LIMIT 1;

    IF v_role_key IS NULL AND v_is_super_admin THEN
      v_role_key := 'super_admin';
    END IF;

    SELECT COALESCE(array_agg(DISTINCT p.key), ARRAY[]::TEXT[]) INTO v_permissions
    FROM public.tenant_memberships tm
    JOIN public.role_permissions rp ON rp.role_id = tm.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_uid AND tm.status = 'active' AND tm.deleted_at IS NULL;

    IF v_is_super_admin THEN
      SELECT COALESCE(array_agg(key), ARRAY[]::TEXT[]) INTO v_permissions FROM public.permissions;
    END IF;

    SELECT sp.* INTO v_plan FROM public.subscription_plans sp WHERE sp.id = v_tenant.subscription_plan_id;
    SELECT * INTO v_tenant_app FROM public.app_config WHERE scope = 'tenant' AND tenant_id = p_tenant_id LIMIT 1;
    SELECT * INTO v_role_app FROM public.app_config WHERE scope = 'role' AND (tenant_id = p_tenant_id OR tenant_id IS NULL) AND role_key = v_role_key ORDER BY tenant_id NULLS LAST LIMIT 1;

    -- Layer cascade: Global -> Tenant Branding -> Tenant App Config -> Role Config
    IF COALESCE((v_settings ->> 'allowSchoolThemeOverride')::BOOLEAN, TRUE) THEN
      v_theme := v_theme || COALESCE(v_tenant.branding_json, '{}'::JSONB) || COALESCE(v_tenant_app.theme_tokens, '{}'::JSONB);
      v_branding := v_branding || jsonb_build_object('institutionName', v_tenant.name, 'institutionLogo', v_tenant.logo_url) || COALESCE(v_tenant_app.branding, '{}'::JSONB);
    END IF;
    v_settings := v_settings || COALESCE(v_tenant.settings_json, '{}'::JSONB) || COALESCE(v_tenant_app.settings_json, '{}'::JSONB) || COALESCE(v_role_app.settings_json, '{}'::JSONB);
    v_latest_version := GREATEST(v_latest_version, COALESCE(v_tenant_app.version_number, 1));

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'key', m.key,
      'name', m.name,
      'description', m.description,
      'icon', m.icon,
      'default_route', m.default_route,
      'nav_order', m.nav_order,
      'enabled', app.is_module_enabled_for_tenant(p_tenant_id, m.key)
    ) ORDER BY m.nav_order), '[]'::JSONB)
    INTO v_modules
    FROM public.modules m;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', n.id,
      'module_key', n.module_key,
      'label', n.label,
      'icon', n.icon,
      'route_path', n.route_path,
      'target_type', n.target_type,
      'payload_json', n.payload_json,
      'sort_order', n.sort_order,
      'is_custom', n.is_custom,
      'scope', n.scope
    ) ORDER BY n.sort_order), '[]'::JSONB)
    INTO v_nav
    FROM public.navigation_items n
    WHERE n.is_visible = TRUE
      AND p_platform = ANY(n.platforms)
      AND (
        (n.scope = 'global' AND n.tenant_id IS NULL)
        OR (n.scope = 'tenant' AND n.tenant_id = p_tenant_id)
      )
      AND (v_role_key = 'super_admin' OR v_role_key = ANY(n.target_roles))
      AND (
        n.is_custom = TRUE
        OR app.is_module_enabled_for_tenant(p_tenant_id, n.module_key)
      );

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', w.id,
      'widget_key', w.widget_key,
      'module_key', w.module_key,
      'title', w.title,
      'widget_type', w.widget_type,
      'sort_order', w.sort_order,
      'config_json', w.config_json
    ) ORDER BY w.sort_order), '[]'::JSONB)
    INTO v_widgets
    FROM public.dashboard_widgets w
    WHERE w.is_visible = TRUE
      AND p_platform = ANY(w.platforms)
      AND (
        (w.scope = 'global' AND w.tenant_id IS NULL)
        OR (w.scope = 'tenant' AND w.tenant_id = p_tenant_id)
      )
      AND (v_role_key = 'super_admin' OR v_role_key = ANY(w.target_roles))
      AND app.is_module_enabled_for_tenant(p_tenant_id, w.module_key);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'key', m.key, 'name', m.name, 'icon', m.icon, 'default_route', m.default_route,
      'nav_order', m.nav_order, 'enabled', m.is_globally_enabled
    ) ORDER BY m.nav_order), '[]'::JSONB)
    INTO v_modules FROM public.modules m;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', n.id, 'module_key', n.module_key, 'label', n.label, 'icon', n.icon,
      'route_path', n.route_path, 'target_type', n.target_type, 'payload_json', n.payload_json,
      'sort_order', n.sort_order, 'is_custom', n.is_custom
    ) ORDER BY n.sort_order), '[]'::JSONB)
    INTO v_nav
    FROM public.navigation_items n
    WHERE n.scope = 'global' AND n.is_visible = TRUE AND p_platform = ANY(n.platforms);

    v_widgets := '[]'::JSONB;
  END IF;

  RETURN jsonb_build_object(
    'authorized', TRUE,
    'version', v_latest_version,
    'platform', p_platform,
    'maintenance_mode', COALESCE(v_global.maintenance_mode, FALSE) OR COALESCE(v_global_app.maintenance_mode, FALSE) OR COALESCE(v_tenant_app.maintenance_mode, FALSE),
    'maintenance_message', COALESCE(v_global.maintenance_message, 'Scheduled maintenance in progress'),
    'session_revoked', v_session_revoked,
    'is_platform_admin', v_is_super_admin,
    'tenant', CASE WHEN p_tenant_id IS NOT NULL THEN jsonb_build_object(
      'id', v_tenant.id,
      'name', v_tenant.name,
      'slug', v_tenant.slug,
      'status', v_tenant.status,
      'plan_code', COALESCE(v_plan.code, 'FREE')
    ) ELSE NULL END,
    'role', v_role_key,
    'permissions', to_jsonb(v_permissions),
    'theme', v_theme,
    'branding', v_branding,
    'settings', v_settings,
    'modules', COALESCE(v_modules, '[]'::JSONB),
    'navigation', COALESCE(v_nav, '[]'::JSONB),
    'widgets', COALESCE(v_widgets, '[]'::JSONB)
  );
END;
$$;

-- 2. Publish Immutable Configuration Snapshot Version
CREATE OR REPLACE FUNCTION public.publish_remote_config_version(
  p_change_summary TEXT,
  p_scope TEXT DEFAULT 'global',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_version INTEGER;
  v_snapshot JSONB;
  v_new_id UUID;
BEGIN
  IF p_scope = 'global' THEN
    IF NOT app.is_platform_admin() THEN
      RAISE EXCEPTION 'Forbidden: Super Admin required for global configuration publish';
    END IF;
  ELSIF p_scope = 'tenant' AND p_tenant_id IS NOT NULL THEN
    IF NOT (app.is_platform_admin() OR app.has_tenant_role(p_tenant_id, ARRAY['school_admin'])) THEN
      RAISE EXCEPTION 'Forbidden: School Admin or Super Admin required';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid scope or missing tenant_id';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM public.configuration_versions
  WHERE scope = p_scope AND tenant_id IS NOT DISTINCT FROM p_tenant_id;

  IF p_scope = 'global' THEN
    UPDATE public.global_config SET active_version_number = v_next_version, updated_by = auth.uid() WHERE config_key = 'default';
    UPDATE public.app_config SET version_number = v_next_version, updated_by = auth.uid() WHERE scope = 'global' AND tenant_id IS NULL;

    v_snapshot := jsonb_build_object(
      'global_config', (SELECT to_jsonb(gc) FROM public.global_config gc WHERE config_key = 'default' LIMIT 1),
      'app_config', (SELECT to_jsonb(ac) FROM public.app_config ac WHERE scope = 'global' AND tenant_id IS NULL LIMIT 1),
      'modules', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.nav_order) FROM public.modules m), '[]'::JSONB),
      'navigation_items', COALESCE((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.sort_order) FROM public.navigation_items n WHERE n.scope = 'global'), '[]'::JSONB),
      'dashboard_widgets', COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.sort_order) FROM public.dashboard_widgets w WHERE w.scope = 'global'), '[]'::JSONB)
    );
  ELSE
    INSERT INTO public.app_config (scope, tenant_id, version_number, updated_by)
    VALUES ('tenant', p_tenant_id, v_next_version, auth.uid())
    ON CONFLICT (scope, tenant_id, role_key) DO UPDATE SET version_number = v_next_version, updated_by = auth.uid();

    v_snapshot := jsonb_build_object(
      'app_config', (SELECT to_jsonb(ac) FROM public.app_config ac WHERE scope = 'tenant' AND ac.tenant_id = p_tenant_id LIMIT 1),
      'tenant_features', COALESCE((SELECT jsonb_agg(to_jsonb(tf)) FROM public.tenant_features tf WHERE tf.tenant_id = p_tenant_id), '[]'::JSONB),
      'navigation_items', COALESCE((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.sort_order) FROM public.navigation_items n WHERE n.scope = 'tenant' AND n.tenant_id = p_tenant_id), '[]'::JSONB),
      'dashboard_widgets', COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.sort_order) FROM public.dashboard_widgets w WHERE w.scope = 'tenant' AND w.tenant_id = p_tenant_id), '[]'::JSONB)
    );
  END IF;

  INSERT INTO public.configuration_versions (version_number, scope, tenant_id, snapshot_json, change_summary, created_by)
  VALUES (v_next_version, p_scope, p_tenant_id, v_snapshot, p_change_summary, auth.uid())
  RETURNING id INTO v_new_id;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (p_tenant_id, auth.uid(), 'remote_config.publish', 'configuration_versions', v_new_id::TEXT, jsonb_build_object('version', v_next_version, 'summary', p_change_summary));

  RETURN v_new_id;
END;
$$;

-- 3. 1-Click Rollback Configuration Version (Test E)
CREATE OR REPLACE FUNCTION public.rollback_remote_config_version(p_version_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.configuration_versions%ROWTYPE;
  v_next_version INTEGER;
  v_new_id UUID;
  v_mod JSONB;
  v_nav JSONB;
  v_wid JSONB;
  v_tf JSONB;
BEGIN
  SELECT * INTO v_target FROM public.configuration_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuration version % not found', p_version_id;
  END IF;

  IF v_target.scope = 'global' THEN
    IF NOT app.is_platform_admin() THEN
      RAISE EXCEPTION 'Forbidden: Super Admin required to rollback global configuration';
    END IF;
  ELSIF NOT (app.is_platform_admin() OR app.has_tenant_role(v_target.tenant_id, ARRAY['school_admin'])) THEN
    RAISE EXCEPTION 'Forbidden: Unauthorized configuration rollback';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM public.configuration_versions
  WHERE scope = v_target.scope AND tenant_id IS NOT DISTINCT FROM v_target.tenant_id;

  IF v_target.scope = 'global' THEN
    UPDATE public.global_config
    SET
      brand_name = COALESCE(v_target.snapshot_json -> 'global_config' ->> 'brand_name', brand_name),
      tagline = COALESCE(v_target.snapshot_json -> 'global_config' ->> 'tagline', tagline),
      maintenance_mode = COALESCE((v_target.snapshot_json -> 'global_config' ->> 'maintenance_mode')::BOOLEAN, FALSE),
      maintenance_message = COALESCE(v_target.snapshot_json -> 'global_config' ->> 'maintenance_message', maintenance_message),
      default_theme = COALESCE(v_target.snapshot_json -> 'global_config' -> 'default_theme', default_theme),
      active_version_number = v_next_version,
      updated_by = auth.uid()
    WHERE config_key = 'default';

    UPDATE public.app_config
    SET
      theme_tokens = COALESCE(v_target.snapshot_json -> 'app_config' -> 'theme_tokens', theme_tokens),
      branding = COALESCE(v_target.snapshot_json -> 'app_config' -> 'branding', branding),
      settings_json = COALESCE(v_target.snapshot_json -> 'app_config' -> 'settings_json', settings_json),
      maintenance_mode = COALESCE((v_target.snapshot_json -> 'app_config' ->> 'maintenance_mode')::BOOLEAN, FALSE),
      version_number = v_next_version,
      updated_by = auth.uid()
    WHERE scope = 'global' AND tenant_id IS NULL;

    IF jsonb_typeof(v_target.snapshot_json -> 'modules') = 'array' THEN
      FOR v_mod IN SELECT * FROM jsonb_array_elements(v_target.snapshot_json -> 'modules')
      LOOP
        INSERT INTO public.modules (id, key, name, description, icon, default_route, nav_order, is_globally_enabled, is_core, required_permission, min_plan_tier)
        VALUES (
          (v_mod ->> 'id')::UUID,
          v_mod ->> 'key',
          v_mod ->> 'name',
          v_mod ->> 'description',
          COALESCE(v_mod ->> 'icon', 'LayoutGrid'),
          COALESCE(v_mod ->> 'default_route', ''),
          COALESCE((v_mod ->> 'nav_order')::INTEGER, 100),
          COALESCE((v_mod ->> 'is_globally_enabled')::BOOLEAN, TRUE),
          COALESCE((v_mod ->> 'is_core')::BOOLEAN, FALSE),
          v_mod ->> 'required_permission',
          COALESCE(v_mod ->> 'min_plan_tier', 'FREE')
        )
        ON CONFLICT (key) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          nav_order = EXCLUDED.nav_order,
          is_globally_enabled = EXCLUDED.is_globally_enabled,
          min_plan_tier = EXCLUDED.min_plan_tier;
      END LOOP;
    END IF;

    DELETE FROM public.navigation_items WHERE scope = 'global' AND tenant_id IS NULL;
    IF jsonb_typeof(v_target.snapshot_json -> 'navigation_items') = 'array' THEN
      FOR v_nav IN SELECT * FROM jsonb_array_elements(v_target.snapshot_json -> 'navigation_items')
      LOOP
        INSERT INTO public.navigation_items (id, scope, tenant_id, module_key, label, icon, route_path, target_type, payload_json, sort_order, is_visible, is_custom)
        VALUES (
          COALESCE((v_nav ->> 'id')::UUID, gen_random_uuid()),
          'global',
          NULL,
          v_nav ->> 'module_key',
          v_nav ->> 'label',
          COALESCE(v_nav ->> 'icon', 'CircleDot'),
          v_nav ->> 'route_path',
          COALESCE(v_nav ->> 'target_type', 'native'),
          COALESCE(v_nav -> 'payload_json', '{}'::JSONB),
          COALESCE((v_nav ->> 'sort_order')::INTEGER, 100),
          COALESCE((v_nav ->> 'is_visible')::BOOLEAN, TRUE),
          COALESCE((v_nav ->> 'is_custom')::BOOLEAN, FALSE)
        );
      END LOOP;
    END IF;
  ELSE
    UPDATE public.app_config
    SET
      theme_tokens = COALESCE(v_target.snapshot_json -> 'app_config' -> 'theme_tokens', theme_tokens),
      branding = COALESCE(v_target.snapshot_json -> 'app_config' -> 'branding', branding),
      settings_json = COALESCE(v_target.snapshot_json -> 'app_config' -> 'settings_json', settings_json),
      maintenance_mode = COALESCE((v_target.snapshot_json -> 'app_config' ->> 'maintenance_mode')::BOOLEAN, FALSE),
      version_number = v_next_version,
      updated_by = auth.uid()
    WHERE scope = 'tenant' AND tenant_id = v_target.tenant_id;

    DELETE FROM public.tenant_features WHERE tenant_id = v_target.tenant_id;
    IF jsonb_typeof(v_target.snapshot_json -> 'tenant_features') = 'array' THEN
      FOR v_tf IN SELECT * FROM jsonb_array_elements(v_target.snapshot_json -> 'tenant_features')
      LOOP
        INSERT INTO public.tenant_features (tenant_id, module_key, feature_key, is_enabled, config_json, updated_by)
        VALUES (
          v_target.tenant_id,
          v_tf ->> 'module_key',
          v_tf ->> 'feature_key',
          COALESCE((v_tf ->> 'is_enabled')::BOOLEAN, TRUE),
          COALESCE(v_tf -> 'config_json', '{}'::JSONB),
          auth.uid()
        );
      END LOOP;
    END IF;
  END IF;

  INSERT INTO public.configuration_versions (version_number, scope, tenant_id, snapshot_json, change_summary, restored_from_version_id, created_by)
  VALUES (
    v_next_version,
    v_target.scope,
    v_target.tenant_id,
    v_target.snapshot_json,
    'Rollback to v' || v_target.version_number || ': ' || v_target.change_summary,
    v_target.id,
    auth.uid()
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (
    v_target.tenant_id,
    auth.uid(),
    'remote_config.rollback',
    'configuration_versions',
    v_new_id::TEXT,
    jsonb_build_object('restored_from_id', v_target.id, 'restored_version', v_target.version_number, 'new_version', v_next_version)
  );

  RETURN v_new_id;
END;
$$;

-- 4. Remote Session Revocation & Sign-Out
CREATE OR REPLACE FUNCTION public.revoke_user_session(
  p_session_id UUID,
  p_reason TEXT DEFAULT 'Revoked by administrator'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.user_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.user_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session % not found', p_session_id;
  END IF;

  IF NOT (
    app.is_platform_admin()
    OR v_session.user_id = auth.uid()
    OR (v_session.tenant_id IS NOT NULL AND app.has_tenant_role(v_session.tenant_id, ARRAY['school_admin']))
  ) THEN
    RAISE EXCEPTION 'Forbidden: Cannot revoke session';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = NOW(), revoked_by = auth.uid(), revoke_reason = p_reason
  WHERE id = p_session_id AND revoked_at IS NULL;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (v_session.tenant_id, auth.uid(), 'session.revoked', 'user_sessions', p_session_id::TEXT, jsonb_build_object('target_user_id', v_session.user_id, 'reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_out_user_everywhere(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Global sign-out enforced'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT (app.is_platform_admin() OR p_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Super Admin or self required';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = NOW(), revoked_by = auth.uid(), revoke_reason = p_reason
  WHERE user_id = p_user_id AND revoked_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (auth.uid(), 'session.sign_out_all', 'profiles', p_user_id::TEXT, jsonb_build_object('revoked_count', v_count, 'reason', p_reason));

  RETURN v_count;
END;
$$;

-- 5. Exam Result Calculation & Approval Workflow (Never publish without approval)
CREATE OR REPLACE FUNCTION public.calculate_exam_results(p_tenant_id UUID, p_exam_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF NOT (app.is_platform_admin() OR app.has_tenant_permission(p_tenant_id, 'exams.write') OR app.has_tenant_permission(p_tenant_id, 'results.approve')) THEN
    RAISE EXCEPTION 'Forbidden: Unauthorized to calculate exam results';
  END IF;

  INSERT INTO public.results (tenant_id, exam_id, student_id, class_id, total_marks, max_total_marks, percentage, gpa, grade, is_passed, is_published)
  SELECT
    p_tenant_id,
    p_exam_id,
    s.id,
    s.class_id,
    COALESCE(SUM(m.marks_obtained), 0) AS total_marks,
    COALESCE(SUM(es.max_marks), 0) AS max_total_marks,
    CASE WHEN COALESCE(SUM(es.max_marks), 0) > 0
      THEN ROUND((COALESCE(SUM(m.marks_obtained), 0) / SUM(es.max_marks)) * 100.0, 2)
      ELSE 0 END AS percentage,
    COALESCE((
      SELECT gr.gpa_point FROM public.grading_rules gr
      WHERE gr.tenant_id = p_tenant_id
        AND (CASE WHEN SUM(es.max_marks) > 0 THEN ROUND((SUM(m.marks_obtained) / SUM(es.max_marks)) * 100.0, 2) ELSE 0 END) BETWEEN gr.min_percentage AND gr.max_percentage
      ORDER BY gr.min_percentage DESC LIMIT 1
    ), 0) AS gpa,
    COALESCE((
      SELECT gr.grade_label FROM public.grading_rules gr
      WHERE gr.tenant_id = p_tenant_id
        AND (CASE WHEN SUM(es.max_marks) > 0 THEN ROUND((SUM(m.marks_obtained) / SUM(es.max_marks)) * 100.0, 2) ELSE 0 END) BETWEEN gr.min_percentage AND gr.max_percentage
      ORDER BY gr.min_percentage DESC LIMIT 1
    ), CASE WHEN COALESCE(SUM(es.max_marks), 0) > 0 AND (SUM(m.marks_obtained) / SUM(es.max_marks)) * 100 >= 33 THEN 'PASS' ELSE 'FAIL' END) AS grade,
    BOOL_AND(NOT m.is_absent AND m.marks_obtained >= es.pass_marks) AS is_passed,
    FALSE
  FROM public.marks m
  JOIN public.exam_subjects es ON es.id = m.exam_subject_id
  JOIN public.students s ON s.id = m.student_id
  WHERE m.tenant_id = p_tenant_id AND m.exam_id = p_exam_id
  GROUP BY s.id, s.class_id
  ON CONFLICT (tenant_id, exam_id, student_id) DO UPDATE SET
    total_marks = EXCLUDED.total_marks,
    max_total_marks = EXCLUDED.max_total_marks,
    percentage = EXCLUDED.percentage,
    gpa = EXCLUDED.gpa,
    grade = EXCLUDED.grade,
    is_passed = EXCLUDED.is_passed,
    is_published = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Compute Class Merit Position
  WITH ranked AS (
    SELECT id, DENSE_RANK() OVER (PARTITION BY class_id ORDER BY percentage DESC, total_marks DESC) AS pos
    FROM public.results
    WHERE tenant_id = p_tenant_id AND exam_id = p_exam_id
  )
  UPDATE public.results r
  SET rank_position = ranked.pos
  FROM ranked
  WHERE r.id = ranked.id;

  UPDATE public.exams SET status = 'pending_approval' WHERE id = p_exam_id AND tenant_id = p_tenant_id AND status <> 'published';

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_and_publish_exam_results(p_tenant_id UUID, p_exam_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT (app.is_platform_admin() OR app.has_tenant_permission(p_tenant_id, 'results.approve')) THEN
    RAISE EXCEPTION 'Forbidden: Result approval permission required';
  END IF;

  UPDATE public.exams
  SET status = 'published', approved_by = auth.uid(), approved_at = NOW()
  WHERE id = p_exam_id AND tenant_id = p_tenant_id;

  UPDATE public.results
  SET is_published = TRUE, approved_by = auth.uid(), published_by = auth.uid(), published_at = NOW()
  WHERE tenant_id = p_tenant_id AND exam_id = p_exam_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.report_cards (tenant_id, result_id, student_id, exam_id, card_number, snapshot_json)
  SELECT
    r.tenant_id,
    r.id,
    r.student_id,
    r.exam_id,
    'RC-' || upper(left(r.id::TEXT, 8)),
    jsonb_build_object(
      'total_marks', r.total_marks,
      'max_total_marks', r.max_total_marks,
      'percentage', r.percentage,
      'gpa', r.gpa,
      'grade', r.grade,
      'rank_position', r.rank_position,
      'is_passed', r.is_passed
    )
  FROM public.results r
  WHERE r.tenant_id = p_tenant_id AND r.exam_id = p_exam_id AND r.is_published = TRUE
  ON CONFLICT (tenant_id, result_id) DO NOTHING;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (p_tenant_id, auth.uid(), 'results.published', 'exams', p_exam_id::TEXT, jsonb_build_object('published_count', v_count));

  RETURN v_count;
END;
$$;

-- 6. Real Aggregated Overview Statistics RPCs (Zero Hardcoded Stats)
CREATE OR REPLACE FUNCTION public.get_super_admin_overview_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr BIGINT;
  v_payments BIGINT;
BEGIN
  IF NOT app.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden: Super Admin access required';
  END IF;

  SELECT COALESCE(SUM(
    CASE WHEN s.billing_cycle = 'annual' THEN sp.annual_price_cents / 12 ELSE sp.monthly_price_cents END
  ), 0) INTO v_mrr
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.status IN ('active', 'trial');

  SELECT COALESCE(SUM(amount_cents), 0) INTO v_payments FROM public.payments WHERE status = 'succeeded';

  RETURN jsonb_build_object(
    'total_institutions', (SELECT COUNT(*) FROM public.tenants WHERE deleted_at IS NULL),
    'active_institutions', (SELECT COUNT(*) FROM public.tenants WHERE status = 'active' AND deleted_at IS NULL),
    'suspended_institutions', (SELECT COUNT(*) FROM public.tenants WHERE status = 'suspended' AND deleted_at IS NULL),
    'pending_institutions', (SELECT COUNT(*) FROM public.tenants WHERE status = 'pending' AND deleted_at IS NULL),
    'total_students', (SELECT COUNT(*) FROM public.students WHERE deleted_at IS NULL),
    'total_teachers', (SELECT COUNT(*) FROM public.teachers WHERE deleted_at IS NULL),
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL),
    'active_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status IN ('active', 'trial')),
    'mrr_cents', v_mrr,
    'total_payments_cents', v_payments,
    'enabled_modules', (SELECT COUNT(*) FROM public.modules WHERE is_globally_enabled = TRUE),
    'active_devices', (SELECT COUNT(*) FROM public.device_registrations WHERE is_active = TRUE),
    'system_health', 'operational'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_school_overview_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_att_total INTEGER;
  v_att_present INTEGER;
BEGIN
  IF NOT app.has_tenant_membership(p_tenant_id) THEN
    RAISE EXCEPTION 'Forbidden: Unauthorized tenant access';
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('present', 'late'))
  INTO v_att_total, v_att_present
  FROM public.attendance
  WHERE tenant_id = p_tenant_id AND attendance_date = v_today;

  RETURN jsonb_build_object(
    'total_students', (SELECT COUNT(*) FROM public.students WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'total_teachers', (SELECT COUNT(*) FROM public.teachers WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'total_staff', (SELECT COUNT(*) FROM public.staff WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'total_classes', (SELECT COUNT(*) FROM public.classes WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'today_attendance_marked', v_att_total,
    'today_attendance_present', v_att_present,
    'attendance_percentage', CASE WHEN v_att_total > 0 THEN ROUND((v_att_present::NUMERIC / v_att_total) * 100, 1) ELSE 0 END,
    'fees_collected_cents', COALESCE((SELECT SUM(amount_cents) FROM public.fee_payments WHERE tenant_id = p_tenant_id AND payment_status = 'completed'), 0),
    'outstanding_dues_cents', COALESCE((SELECT SUM(GREATEST(0, net_amount_cents - paid_amount_cents)) FROM public.student_fees WHERE tenant_id = p_tenant_id AND status IN ('unpaid', 'partial', 'overdue')), 0),
    'total_expenses_cents', COALESCE((SELECT SUM(amount_cents) FROM public.expenses WHERE tenant_id = p_tenant_id), 0)
  );
END;
$$;

-- 7. School Self-Registration Onboarding RPC (Creates pending school + admin membership)
CREATE OR REPLACE FUNCTION public.register_school_onboarding(
  p_name TEXT,
  p_institution_type TEXT DEFAULT 'school',
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_plan_code TEXT DEFAULT 'FREE'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tenant_id UUID;
  v_plan_id UUID;
  v_role_id UUID;
  v_slug TEXT;
  v_code TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to register a school';
  END IF;

  SELECT id INTO v_plan_id FROM public.subscription_plans WHERE code = upper(COALESCE(p_plan_code, 'FREE')) LIMIT 1;
  SELECT id INTO v_role_id FROM public.roles WHERE key = 'school_admin' AND tenant_id IS NULL LIMIT 1;

  v_slug := app.normalize_slug(p_name) || '-' || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6);
  v_code := 'CMP-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6));

  INSERT INTO public.tenants (name, slug, code, institution_type, email, phone, address, status, subscription_plan_id)
  VALUES (p_name, v_slug, v_code, COALESCE(p_institution_type, 'school'), p_email, p_phone, p_address, 'pending', v_plan_id)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.subscriptions (tenant_id, plan_id, status, billing_cycle)
  VALUES (v_tenant_id, v_plan_id, 'trial', 'monthly');

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status, is_primary)
  VALUES (v_tenant_id, v_uid, v_role_id, 'active', TRUE);

  INSERT INTO public.app_config (scope, tenant_id, version_number)
  VALUES ('tenant', v_tenant_id, 1);

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (v_tenant_id, v_uid, 'tenant.registered', 'tenants', v_tenant_id::TEXT, jsonb_build_object('name', p_name, 'status', 'pending'));

  RETURN v_tenant_id;
END;
$$;

-- 8. Enable Supabase Realtime on Remote Control, Session, Tenant & Notification Tables
DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'global_config',
    'app_config',
    'configuration_versions',
    'modules',
    'features',
    'tenant_features',
    'navigation_items',
    'dashboard_widgets',
    'tenants',
    'user_sessions',
    'notifications'
  ];
  v_tbl TEXT;
BEGIN
  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_tbl);
    EXCEPTION
      WHEN undefined_object THEN
        NULL;
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END;
$$;


-- >>> START FILE: 202611120010_storage_buckets_and_policies.sql <<<
-- ==============================================================================
-- CampusOS Migration 0010: Protected Supabase Storage Buckets & Tenant Policies
-- Folder convention: <tenant_id>/<entity>/<filename>
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'buckets'
  ) THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      ('institution-logos', 'institution-logos', FALSE, 5242880, ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']),
      ('student-photos', 'student-photos', FALSE, 5242880, ARRAY['image/png','image/jpeg','image/webp']),
      ('employee-documents', 'employee-documents', FALSE, 15728640, ARRAY['application/pdf','image/png','image/jpeg']),
      ('learning-materials', 'learning-materials', FALSE, 31457280, ARRAY['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
      ('assignment-submissions', 'assignment-submissions', FALSE, 20971520, ARRAY['application/pdf','image/png','image/jpeg','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
    ON CONFLICT (id) DO NOTHING;

    -- Read access strictly scoped by first folder segment = tenant_id
    DROP POLICY IF EXISTS "campusos_storage_tenant_read" ON storage.objects;
    CREATE POLICY "campusos_storage_tenant_read" ON storage.objects
      FOR SELECT USING (
        bucket_id IN ('institution-logos','student-photos','employee-documents','learning-materials','assignment-submissions')
        AND (
          app.is_platform_admin()
          OR app.has_tenant_membership(((storage.foldername(name))[1])::UUID)
        )
      );

    -- Write access strictly scoped by tenant membership & role
    DROP POLICY IF EXISTS "campusos_storage_tenant_write" ON storage.objects;
    CREATE POLICY "campusos_storage_tenant_write" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id IN ('institution-logos','student-photos','employee-documents','learning-materials','assignment-submissions')
        AND (
          app.is_platform_admin()
          OR (
            bucket_id = 'assignment-submissions'
            AND app.has_tenant_membership(((storage.foldername(name))[1])::UUID)
          )
          OR app.has_tenant_role(((storage.foldername(name))[1])::UUID, ARRAY['school_admin','teacher','staff'])
        )
      );

    DROP POLICY IF EXISTS "campusos_storage_tenant_delete" ON storage.objects;
    CREATE POLICY "campusos_storage_tenant_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id IN ('institution-logos','student-photos','employee-documents','learning-materials','assignment-submissions')
        AND (
          app.is_platform_admin()
          OR app.has_tenant_role(((storage.foldername(name))[1])::UUID, ARRAY['school_admin'])
        )
      );
  END IF;
END;
$$;


-- >>> START FILE: 202611120011_guardian_attendance.sql <<<
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


-- >>> START DEV SEED <<<
-- ==============================================================================
-- CampusOS Development-Only Seed Data
-- WARNING: Do NOT run against production databases.
-- Production migrations only seed canonical plans, roles, permissions, and modules.
-- ==============================================================================

DO $$
DECLARE
  v_plan_pro UUID;
  v_plan_starter UUID;
  v_tenant_a UUID := '11111111-1111-4111-8111-111111111111';
  v_tenant_b UUID := '22222222-2222-4222-8222-222222222222';
  v_session_a UUID := '33333333-3333-4333-8333-333333333331';
  v_session_b UUID := '33333333-3333-4333-8333-333333333332';
  v_class_a1 UUID := '44444444-4444-4444-8444-444444444441';
  v_class_b1 UUID := '44444444-4444-4444-8444-444444444442';
BEGIN
  SELECT id INTO v_plan_pro FROM public.subscription_plans WHERE code = 'PROFESSIONAL' LIMIT 1;
  SELECT id INTO v_plan_starter FROM public.subscription_plans WHERE code = 'STARTER' LIMIT 1;

  -- Demo Tenant A: Green Valley School
  INSERT INTO public.tenants (id, name, slug, code, institution_type, email, phone, address, city, status, subscription_plan_id, approved_at)
  VALUES (
    v_tenant_a,
    'Green Valley School',
    'green-valley-school',
    'CMP-GVS01',
    'school',
    'admin@greenvalley.example.edu',
    '+8801700000001',
    '42 Emerald Avenue, Sector 7',
    'Dhaka',
    'active',
    v_plan_pro,
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Demo Tenant B: Crescent Science College (for cross-tenant isolation verification)
  INSERT INTO public.tenants (id, name, slug, code, institution_type, email, phone, address, city, status, subscription_plan_id, approved_at)
  VALUES (
    v_tenant_b,
    'Crescent Science College',
    'crescent-science-college',
    'CMP-CSC02',
    'college',
    'admin@crescent.example.edu',
    '+8801700000002',
    '88 Knowledge Park Road',
    'Chattogram',
    'active',
    v_plan_starter,
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (tenant_id, plan_id, status, billing_cycle)
  VALUES
    (v_tenant_a, v_plan_pro, 'active', 'annual'),
    (v_tenant_b, v_plan_starter, 'active', 'monthly')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.app_config (scope, tenant_id, theme_tokens, branding, version_number)
  VALUES
    ('tenant', v_tenant_a, '{"primary":"#16A34A","emerald":"#22C55E"}'::JSONB, '{"institutionName":"Green Valley School"}'::JSONB, 1),
    ('tenant', v_tenant_b, '{"primary":"#0EA5E9","emerald":"#38BDF8"}'::JSONB, '{"institutionName":"Crescent Science College"}'::JSONB, 1)
  ON CONFLICT DO NOTHING;

  -- Academic Sessions
  INSERT INTO public.academic_sessions (id, tenant_id, name, start_date, end_date, is_current)
  VALUES
    (v_session_a, v_tenant_a, '2026-2027', '2026-01-01', '2026-12-31', TRUE),
    (v_session_b, v_tenant_b, '2026-2027', '2026-01-01', '2026-12-31', TRUE)
  ON CONFLICT DO NOTHING;

  -- Classes
  INSERT INTO public.classes (id, tenant_id, name, code, numeric_level, capacity)
  VALUES
    (v_class_a1, v_tenant_a, 'Grade 10', 'G10', 10, 45),
    (v_class_b1, v_tenant_b, 'HSC Year 1', 'HSC1', 11, 60)
  ON CONFLICT DO NOTHING;

  -- Default Grading Rules for Tenant A
  INSERT INTO public.grading_rules (tenant_id, grade_label, min_percentage, max_percentage, gpa_point, remarks)
  VALUES
    (v_tenant_a, 'A+', 80, 100, 5.00, 'Outstanding'),
    (v_tenant_a, 'A', 70, 79.99, 4.00, 'Excellent'),
    (v_tenant_a, 'A-', 60, 69.99, 3.50, 'Very Good'),
    (v_tenant_a, 'B', 50, 59.99, 3.00, 'Good'),
    (v_tenant_a, 'C', 40, 49.99, 2.00, 'Satisfactory'),
    (v_tenant_a, 'D', 33, 39.99, 1.00, 'Pass'),
    (v_tenant_a, 'F', 0, 32.99, 0.00, 'Fail')
  ON CONFLICT DO NOTHING;

  -- Default Fee Categories for Tenant A
  INSERT INTO public.fee_categories (tenant_id, name, code, category_type, default_amount_cents, frequency)
  VALUES
    (v_tenant_a, 'Monthly Tuition Fee', 'TUITION_MONTHLY', 'tuition', 5000, 'monthly'),
    (v_tenant_a, 'Admission Fee', 'ADMISSION_ONE', 'admission', 25000, 'one_time'),
    (v_tenant_a, 'Term Examination Fee', 'EXAM_TERM', 'examination', 3000, 'term')
  ON CONFLICT DO NOTHING;
END;
$$;

