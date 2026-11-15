import {
  corsHeaders,
  createServiceClient,
  hasTenantRole,
  isPlatformAdmin,
  jsonResponse,
  requireAuthenticatedUser,
} from '../_shared/supabase.ts';

async function getFcmAccessToken(saJson: string): Promise<{ token: string; projectId: string } | null> {
  try {
    const sa = JSON.parse(saJson);
    const now = Math.floor(Date.now() / 1000);
    const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const claim = btoa(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })
    )
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    const pemBody = String(sa.private_key)
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s+/g, '');
    const keyDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
    const cryptoKey = await crypto.subtle.importKey('pkcs8', keyDer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(`${header}.${claim}`));
    const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${header}.${claim}.${sig}`,
      }),
    });
    if (!tokenRes.ok) return null;
    const tokenJson = await tokenRes.json();
    return { token: tokenJson.access_token, projectId: sa.project_id };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user } = await requireAuthenticatedUser(req);
    const service = createServiceClient();
    const superAdmin = await isPlatformAdmin(service, user.id);

    const body = await req.json();
    const tenantId = (body.tenant_id as string | undefined) ?? null;
    const title = String(body.title ?? '').trim();
    const message = String(body.body ?? '').trim();
    const category = String(body.category ?? 'general');
    const recipientIds: string[] = Array.isArray(body.recipient_user_ids) ? body.recipient_user_ids : [];

    if (!title || !message) {
      return jsonResponse({ error: 'title and body are required' }, 400);
    }

    if (!superAdmin) {
      if (!tenantId) return jsonResponse({ error: 'Forbidden: Super Admin required for global notifications' }, 403);
      const allowed = await hasTenantRole(service, tenantId, user.id, ['school_admin', 'teacher']);
      if (!allowed) return jsonResponse({ error: 'Forbidden: Insufficient tenant permissions' }, 403);
    }

    // Verify all recipients belong to the tenant when tenant-scoped
    let authorizedRecipients = recipientIds;
    if (tenantId) {
      if (authorizedRecipients.length === 0) {
        const { data: members } = await service
          .from('tenant_memberships')
          .select('user_id')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .is('deleted_at', null);
        authorizedRecipients = (members ?? []).map((m) => m.user_id);
      } else {
        const { data: members } = await service
          .from('tenant_memberships')
          .select('user_id')
          .eq('tenant_id', tenantId)
          .eq('status', 'active')
          .is('deleted_at', null)
          .in('user_id', authorizedRecipients);
        authorizedRecipients = (members ?? []).map((m) => m.user_id);
      }
    }

    if (authorizedRecipients.length === 0) {
      return jsonResponse({ ok: true, delivered_in_app: 0, push_status: 'no_authorized_recipients' });
    }

    const saJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '';
    const fcmAuth = saJson ? await getFcmAccessToken(saJson) : null;

    const { data: devices } = await service
      .from('device_registrations')
      .select('user_id, fcm_token')
      .in('user_id', authorizedRecipients)
      .eq('is_active', true)
      .not('fcm_token', 'is', null);

    const tokenMap = new Map<string, string[]>();
    for (const d of devices ?? []) {
      if (!d.fcm_token) continue;
      const existing = tokenMap.get(d.user_id) ?? [];
      existing.push(d.fcm_token);
      tokenMap.set(d.user_id, existing);
    }

    const rowsToInsert = [];
    for (const rid of authorizedRecipients) {
      const tokens = tokenMap.get(rid) ?? [];
      let pushStatus = fcmAuth ? (tokens.length > 0 ? 'sent' : 'skipped_no_token') : 'skipped_unconfigured';

      if (fcmAuth && tokens.length > 0) {
        for (const fcmToken of tokens) {
          const res = await fetch(`https://fcm.googleapis.com/v1/projects/${fcmAuth.projectId}/messages:send`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${fcmAuth.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: {
                token: fcmToken,
                notification: { title, body: message },
                data: { category, tenant_id: tenantId ?? '' },
              },
            }),
          });
          if (!res.ok) pushStatus = 'failed';
        }
      }

      rowsToInsert.push({
        tenant_id: tenantId,
        recipient_user_id: rid,
        title,
        body: message,
        category,
        push_status: pushStatus,
        push_sent_at: pushStatus === 'sent' ? new Date().toISOString() : null,
      });
    }

    const { error: insertErr } = await service.from('notifications').insert(rowsToInsert);
    if (insertErr) return jsonResponse({ error: insertErr.message }, 400);

    return jsonResponse({
      ok: true,
      delivered_in_app: rowsToInsert.length,
      fcm_configured: Boolean(fcmAuth),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
