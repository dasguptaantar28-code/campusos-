import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveAuthorizedTenantContext } from '@/lib/security/tenant-guard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isModuleEnabled } from '@/lib/config/remote-config';

const intentSchema = z.object({
  student_fee_id: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await context.params;
  const { context: authCtx, error } = await resolveAuthorizedTenantContext(tenantId);
  if (!authCtx) return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 403 });

  if (!isModuleEnabled(authCtx.config, 'fees')) {
    return NextResponse.json({ error: 'Fees module is disabled for this institution' }, { status: 403 });
  }

  const parsed = intentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid student_fee_id required' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { data: fee, error: feeErr } = await supabase
    .from('student_fees')
    .select('id, net_amount_cents, paid_amount_cents, title')
    .eq('id', parsed.data.student_fee_id)
    .eq('tenant_id', authCtx.tenant.id)
    .maybeSingle();

  if (feeErr || !fee) {
    return NextResponse.json({ error: 'Fee ledger item not found or unauthorized' }, { status: 404 });
  }

  const remainingCents = Math.max(0, Number(fee.net_amount_cents) - Number(fee.paid_amount_cents));
  if (remainingCents <= 0) {
    return NextResponse.json({ error: 'Fee item is already settled' }, { status: 400 });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY ?? '';
  let externalIntentId: string | null = null;
  let clientSecret: string | null = null;

  if (stripeSecret) {
    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(remainingCents),
        currency: 'usd',
        'metadata[tenant_id]': authCtx.tenant.id,
        'metadata[student_fee_id]': fee.id,
      }),
    });
    const stripeJson = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: stripeJson?.error?.message ?? 'Payment gateway error' }, { status: 502 });
    }
    externalIntentId = stripeJson.id;
    clientSecret = stripeJson.client_secret;
  }

  const { data: intent, error: intentErr } = await supabase
    .from('payment_intents')
    .insert({
      tenant_id: authCtx.tenant.id,
      student_fee_id: fee.id,
      provider: 'stripe',
      external_intent_id: externalIntentId,
      amount_cents: remainingCents,
      currency: 'USD',
      status: 'requires_payment_method',
      created_by: authCtx.userId,
      metadata_json: { gateway_configured: Boolean(stripeSecret), fee_title: fee.title },
    })
    .select()
    .single();

  if (intentErr) return NextResponse.json({ error: intentErr.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    gateway_configured: Boolean(stripeSecret),
    intent_id: intent.id,
    amount_cents: remainingCents,
    client_secret: clientSecret,
    message: stripeSecret
      ? 'Payment intent initialized. Complete payment using Stripe client secret; settlement records via verified webhook.'
      : 'Payment intent prepared in database (STRIPE_SECRET_KEY not configured; online payment settlement disabled until gateway keys are supplied).',
  });
}
