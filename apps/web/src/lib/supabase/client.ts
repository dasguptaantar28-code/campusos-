'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabasePublicEnv } from './env';

let cachedClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, configured } = getSupabasePublicEnv();
  if (!configured) return null;
  if (!cachedClient) {
    cachedClient = createBrowserClient(url, anonKey);
  }
  return cachedClient;
}
