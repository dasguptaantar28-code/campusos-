import type { EffectiveRemoteConfig, PlanCode } from '@/lib/types';

export const DEFAULT_FALLBACK_CONFIG: EffectiveRemoteConfig = {
  authorized: true,
  version: 1,
  platform: 'web',
  maintenance_mode: false,
  maintenance_message: 'CampusOS is undergoing scheduled maintenance.',
  tenant: null,
  role: 'guest',
  permissions: [],
  theme: {
    primary: '#16A34A',
    emerald: '#22C55E',
    darkGreen: '#064E3B',
    black: '#111827',
    charcoal: '#1F2937',
    white: '#FFFFFF',
    lightBg: '#F8FAFC',
    mode: 'system',
  },
  branding: {
    brandName: 'CampusOS',
    tagline: 'One Platform. Every Campus.',
  },
  settings: {
    allowSchoolThemeOverride: true,
    enableOfflineCache: true,
  },
  modules: [],
  navigation: [],
  widgets: [],
};

export const PUBLIC_DEFAULT_PLANS: Array<{
  code: PlanCode;
  name: string;
  description: string;
  monthly_price_cents: number;
  annual_price_cents: number;
  max_students: number;
  max_teachers: number;
  max_staff: number;
  max_storage_mb: number;
  max_admin_accounts: number;
  reports_tier: string;
  support_level: string;
  allowed_modules: string[];
}> = [
  {
    code: 'FREE',
    name: 'Free Campus',
    description: 'For small pilot schools exploring CampusOS core operations.',
    monthly_price_cents: 0,
    annual_price_cents: 0,
    max_students: 100,
    max_teachers: 15,
    max_staff: 10,
    max_storage_mb: 1024,
    max_admin_accounts: 2,
    reports_tier: 'basic',
    support_level: 'community',
    allowed_modules: ['overview', 'students', 'teachers', 'attendance', 'homework', 'notices', 'settings'],
  },
  {
    code: 'STARTER',
    name: 'Starter School',
    description: 'Complete academic, attendance, exam, and fee tools for growing schools.',
    monthly_price_cents: 4900,
    annual_price_cents: 49000,
    max_students: 500,
    max_teachers: 50,
    max_staff: 30,
    max_storage_mb: 10240,
    max_admin_accounts: 5,
    reports_tier: 'standard',
    support_level: 'email',
    allowed_modules: ['overview', 'students', 'teachers', 'attendance', 'exams', 'results', 'fees', 'timetable', 'homework', 'assignments', 'notices', 'communication', 'reports', 'settings'],
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional Academy',
    description: 'Full multi-campus operations including library, transport, payroll, and branding.',
    monthly_price_cents: 14900,
    annual_price_cents: 149000,
    max_students: 2500,
    max_teachers: 200,
    max_staff: 100,
    max_storage_mb: 51200,
    max_admin_accounts: 15,
    reports_tier: 'advanced',
    support_level: 'priority',
    allowed_modules: ['overview', 'students', 'teachers', 'staff', 'admissions', 'classes', 'sections', 'subjects', 'sessions', 'attendance', 'exams', 'results', 'fees', 'expenses', 'timetable', 'homework', 'assignments', 'library', 'transport', 'payroll', 'notices', 'events', 'communication', 'reports', 'settings'],
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise District',
    description: 'Unlimited scale, dedicated support, custom branding, and full remote configuration.',
    monthly_price_cents: 39900,
    annual_price_cents: 399000,
    max_students: 50000,
    max_teachers: 5000,
    max_staff: 2500,
    max_storage_mb: 512000,
    max_admin_accounts: 100,
    reports_tier: 'enterprise',
    support_level: 'dedicated',
    allowed_modules: ['overview', 'students', 'teachers', 'staff', 'admissions', 'classes', 'sections', 'subjects', 'sessions', 'attendance', 'exams', 'results', 'fees', 'expenses', 'timetable', 'homework', 'assignments', 'library', 'transport', 'payroll', 'notices', 'events', 'communication', 'reports', 'settings'],
  },
];

export function isModuleEnabled(config: EffectiveRemoteConfig | null, moduleKey: string): boolean {
  if (!config) return false;
  if (config.is_platform_admin) return true;
  if (!config.authorized) return false;
  if (config.maintenance_mode) return false;
  const mod = config.modules.find((m) => m.key === moduleKey);
  return mod ? mod.enabled : false;
}

export function hasPermission(config: EffectiveRemoteConfig | null, permissionKey: string): boolean {
  if (!config) return false;
  if (config.is_platform_admin) return true;
  return config.permissions.includes(permissionKey);
}
