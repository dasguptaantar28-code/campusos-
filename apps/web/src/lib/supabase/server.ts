import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabasePublicEnv } from './env';

export async function createServerSupabaseClient(): Promise<SupabaseClient | null> {
  const { url, anonKey, configured } = getSupabasePublicEnv();
  if (!configured) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          });
        } catch {
          // Safe no-op when called from a Server Component read context
        }
      },
    },
  });
}

/**
 * Strictly server-only service-role client for privileged platform operations
 * (webhooks, admin orchestration) after explicit server-side authorization checks.
 */
export function createServiceRoleSupabaseClient(): SupabaseClient | null {
  const { url, configured } = getSupabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!configured || !serviceKey || serviceKey.includes('YOUR_SUPABASE_SERVICE_ROLE_KEY')) {
    return null;
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
