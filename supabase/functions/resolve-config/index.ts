import { corsHeaders, createUserClient, jsonResponse } from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const tenantId = (body.tenant_id as string | undefined) ?? url.searchParams.get('tenant_id') ?? null;
    const platform = (body.platform as string | undefined) ?? url.searchParams.get('platform') ?? 'web';

    const client = createUserClient(req);
    const { data, error } = await client.rpc('resolve_effective_config', {
      p_tenant_id: tenantId,
      p_platform: platform === 'mobile' ? 'mobile' : 'web',
    });

    if (error) {
      return jsonResponse({ error: error.message }, 400);
    }

    const version = (data as { version?: number } | null)?.version ?? 1;
    return jsonResponse(data, 200, { ETag: `"campusos-cfg-v${version}"` });
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
