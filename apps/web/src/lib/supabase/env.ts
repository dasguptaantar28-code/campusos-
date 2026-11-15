export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    '';
  const configured =
    url.startsWith('https://') &&
    !url.includes('YOUR_PROJECT_REF') &&
    anonKey.length > 20 &&
    !anonKey.includes('YOUR_SUPABASE_ANON_KEY');

  return { url, anonKey, configured };
}

export function isSupabaseConfigured(): boolean {
  return getSupabasePublicEnv().configured;
}
