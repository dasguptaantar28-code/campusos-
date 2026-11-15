import {
  corsHeaders,
  createServiceClient,
  createUserClient,
  isPlatformAdmin,
  jsonResponse,
  requireAuthenticatedUser,
} from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user } = await requireAuthenticatedUser(req);
    const userClient = createUserClient(req);
    const service = createServiceClient();
    const superAdmin = await isPlatformAdmin(service, user.id);

    const body = await req.json();
    const sessionId = (body.session_id as string | undefined) ?? null;
    const targetUserId = (body.user_id as string | undefined) ?? null;
    const reason = String(body.reason ?? 'Revoked by administrator');

    if (sessionId) {
      const { error } = await userClient.rpc('revoke_user_session', {
        p_session_id: sessionId,
        p_reason: reason,
      });
      if (error) return jsonResponse({ error: error.message }, 403);
      return jsonResponse({ ok: true, revoked_session_id: sessionId });
    }

    if (targetUserId) {
      if (!superAdmin && targetUserId !== user.id) {
        return jsonResponse({ error: 'Forbidden: Super Admin required' }, 403);
      }
      const { data: count, error } = await userClient.rpc('sign_out_user_everywhere', {
        p_user_id: targetUserId,
        p_reason: reason,
      });
      if (error) return jsonResponse({ error: error.message }, 403);
      return jsonResponse({ ok: true, revoked_count: count });
    }

    return jsonResponse({ error: 'session_id or user_id required' }, 400);
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
