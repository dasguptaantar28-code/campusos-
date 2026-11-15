import { createClient, SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-campusos-tenant',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function createUserClient(req: Request): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';

  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Server misconfiguration: SUPABASE_SERVICE_ROLE_KEY missing');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAuthenticatedUser(req: Request): Promise<{ client: SupabaseClient; user: User }> {
  const client = createUserClient(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: 'Unauthorized: valid session token required' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return { client, user: data.user };
}

export async function isPlatformAdmin(service: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await service
    .from('platform_admins')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();
  return Boolean(data);
}

export async function hasTenantRole(
  service: SupabaseClient,
  tenantId: string,
  userId: string,
  allowedRoles: string[]
): Promise<boolean> {
  const { data: tenant } = await service
    .from('tenants')
    .select('status, deleted_at')
    .eq('id', tenantId)
    .maybeSingle();

  if (!tenant || tenant.status !== 'active' || tenant.deleted_at) {
    return false;
  }

  const { data: membership } = await service
    .from('tenant_memberships')
    .select('id, roles!inner(key)')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .maybeSingle();

  const roleKey = (membership as { roles?: { key?: string } } | null)?.roles?.key;
  return Boolean(roleKey && allowedRoles.includes(roleKey));
}
