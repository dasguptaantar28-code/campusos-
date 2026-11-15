import { NextResponse } from 'next/server';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

export async function GET() {
  const { url, configured } = getSupabasePublicEnv();

  return NextResponse.json({
    configured: configured,
    url: url || 'https://nlmzdgubcztxpcrfqkfs.supabase.co',
  });
}
