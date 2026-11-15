import { corsHeaders, createServiceClient, jsonResponse } from '../_shared/supabase.ts';

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(sigHeader.split(',').map((kv) => kv.split('=')));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signedBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const computedHex = Array.from(new Uint8Array(signedBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return computedHex === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  if (!secret) {
    return jsonResponse({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, 503);
  }

  const rawBody = await req.text();
  const sigHeader = req.headers.get('Stripe-Signature') ?? '';
  const valid = await verifyStripeSignature(rawBody, sigHeader, secret);
  if (!valid) {
    return jsonResponse({ error: 'Invalid webhook signature' }, 401);
  }

  try {
    const event = JSON.parse(rawBody);
    const service = createServiceClient();

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data?.object;
      const externalId = String(pi?.id ?? '');
      const { data: intent } = await service
        .from('payment_intents')
        .select('*')
        .eq('external_intent_id', externalId)
        .maybeSingle();

      if (intent && intent.status !== 'succeeded') {
        await service.from('payment_intents').update({ status: 'succeeded' }).eq('id', intent.id);

        if (intent.student_fee_id) {
          const { data: fee } = await service
            .from('student_fees')
            .select('student_id')
            .eq('id', intent.student_fee_id)
            .single();

          if (fee) {
            await service.from('fee_payments').insert({
              tenant_id: intent.tenant_id,
              student_fee_id: intent.student_fee_id,
              student_id: fee.student_id,
              receipt_number: `RCP-${Date.now().toString(36).toUpperCase()}`,
              amount_cents: intent.amount_cents,
              payment_method: 'gateway_verified',
              payment_status: 'completed',
              gateway_reference: externalId,
            });
          }
        } else if (intent.invoice_id) {
          await service.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', intent.invoice_id);
          await service.from('payments').insert({
            tenant_id: intent.tenant_id,
            invoice_id: intent.invoice_id,
            provider: 'stripe',
            provider_payment_id: externalId,
            amount_cents: intent.amount_cents,
            currency: intent.currency,
            status: 'succeeded',
            verified_webhook_payload: event,
            paid_at: new Date().toISOString(),
          });
        }
      }
    }

    return jsonResponse({ received: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 400);
  }
});
