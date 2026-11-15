export type TenantStatus = 'pending' | 'active' | 'suspended' | 'deactivated';
export type PlanCode = 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
export type RoleKey = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent' | 'accountant' | 'staff';

export interface ThemeTokens {
  primary: string;
  emerald: string;
  darkGreen: string;
  black?: string;
  charcoal?: string;
  white?: string;
  lightBg?: string;
  mode?: 'light' | 'dark' | 'system';
}

export interface RemoteModuleConfig {
  key: string;
  name: string;
  description?: string;
  icon: string;
  default_route: string;
  nav_order: number;
  enabled: boolean;
}

export interface RemoteNavItem {
  id: string;
  module_key: string;
  label: string;
  icon: string;
  route_path: string;
  target_type: 'native' | 'web' | 'custom_screen' | 'external_url';
  payload_json?: Record<string, unknown>;
  sort_order: number;
  is_custom?: boolean;
  scope?: 'global' | 'tenant';
}

export interface RemoteWidgetConfig {
  id: string;
  widget_key: string;
  module_key: string;
  title: string;
  widget_type: 'kpi' | 'chart' | 'list' | 'quick_actions' | 'banner' | 'custom';
  sort_order: number;
  config_json?: Record<string, unknown>;
}

export interface EffectiveRemoteConfig {
  authorized: boolean;
  version: number;
  platform: 'web' | 'mobile';
  maintenance_mode: boolean;
  maintenance_message: string;
  session_revoked?: boolean;
  is_platform_admin?: boolean;
  tenant_status?: TenantStatus;
  error?: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    plan_code: PlanCode;
  } | null;
  role: string;
  permissions: string[];
  theme: ThemeTokens;
  branding: {
    brandName?: string;
    tagline?: string;
    institutionName?: string;
    institutionLogo?: string | null;
  };
  settings: Record<string, unknown>;
  modules: RemoteModuleConfig[];
  navigation: RemoteNavItem[];
  widgets: RemoteWidgetConfig[];
}

export interface SubscriptionPlan {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  monthly_price_cents: number;
  annual_price_cents: number;
  currency: string;
  max_students: number;
  max_teachers: number;
  max_staff: number;
  max_storage_mb: number;
  max_admin_accounts: number;
  allowed_modules: string[];
  reports_tier: string;
  support_level: string;
  is_active: boolean;
  sort_order: number;
}
