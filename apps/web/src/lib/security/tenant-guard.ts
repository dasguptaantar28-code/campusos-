import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { EffectiveRemoteConfig } from '@/lib/types';

export interface AuthorizedTenantContext {
  userId: string;
  userEmail: string;
  isPlatformAdmin: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    code: string;
    status: string;
    logo_url: string | null;
    branding_json: Record<string, unknown>;
  };
  roleKey: string;
  config: EffectiveRemoteConfig;
}

export async function requireAuthenticatedServerUser() {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return { supabase: null, user: null, isPlatformAdmin: false };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isPlatformAdmin: false };

  const { data: pa } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  return { supabase, user, isPlatformAdmin: Boolean(pa) };
}

export async function resolveAuthorizedTenantContext(
  tenantSlugOrId: string
): Promise<{ context: AuthorizedTenantContext | null; error?: string; tenantStatus?: string }> {
  const { supabase, user, isPlatformAdmin } = await requireAuthenticatedServerUser();
  if (!supabase) {
    return { context: null, error: 'Supabase environment variables are not configured yet.' };
  }
  if (!user) {
    return { context: null, error: 'Authentication required' };
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantSlugOrId);
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .select('id, name, slug, code, status, logo_url, branding_json')
    .eq(isUuid ? 'id' : 'slug', tenantSlugOrId)
    .is('deleted_at', null)
    .maybeSingle();

  if (tenantErr || !tenant) {
    return { context: null, error: 'Institution not found or unauthorized' };
  }

  const { data: cfg, error: cfgErr } = await supabase.rpc('resolve_effective_config', {
    p_tenant_id: tenant.id,
    p_platform: 'web',
  });

  if (cfgErr || !cfg) {
    return { context: null, error: cfgErr?.message ?? 'Failed to resolve configuration' };
  }

  const effective = cfg as EffectiveRemoteConfig;
  if (!effective.authorized) {
    return {
      context: null,
      error: effective.error ?? 'Unauthorized tenant access',
      tenantStatus: effective.tenant_status ?? tenant.status,
    };
  }

  return {
    context: {
      userId: user.id,
      userEmail: user.email ?? '',
      isPlatformAdmin,
      tenant: tenant as AuthorizedTenantContext['tenant'],
      roleKey: effective.role,
      config: effective,
    },
  };
}
