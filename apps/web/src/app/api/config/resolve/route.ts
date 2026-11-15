import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { DEFAULT_FALLBACK_CONFIG } from '@/lib/config/remote-config';
import { checkRateLimit } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  const rl = checkRateLimit(`cfg:${ip}`, 180);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const tenantId = request.nextUrl.searchParams.get('tenant_id');
  const platform = request.nextUrl.searchParams.get('platform') === 'mobile' ? 'mobile' : 'web';

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return NextResponse.json(DEFAULT_FALLBACK_CONFIG, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const { data, error } = await supabase.rpc('resolve_effective_config', {
    p_tenant_id: tenantId || null,
    p_platform: platform,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const version = (data as { version?: number } | null)?.version ?? 1;
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store',
      ETag: `"campusos-v${version}"`,
    },
  });
}
