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
