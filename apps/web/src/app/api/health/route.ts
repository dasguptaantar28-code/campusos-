import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export async function GET() {
  const configured = isSupabaseConfigured();
  if (!configured) {
    return NextResponse.json({
      status: 'unconfigured',
      database: 'not_connected',
      timestamp: new Date().toISOString(),
    });
  }

  const startedAt = Date.now();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase!.from('global_config').select('active_version_number').limit(1);

  return NextResponse.json(
    {
      status: error ? 'degraded' : 'operational',
      database: error ? error.message : 'connected',
      latency_ms: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: error ? 503 : 200 }
  );
}
