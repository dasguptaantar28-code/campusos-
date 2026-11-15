import {
  corsHeaders,
  createServiceClient,
  hasTenantRole,
  isPlatformAdmin,
  jsonResponse,
  requireAuthenticatedUser,
} from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user } = await requireAuthenticatedUser(req);
    const service = createServiceClient();
    const superAdmin = await isPlatformAdmin(service, user.id);

    const body = await req.json();
    const tenantId = String(body.tenant_id ?? '');
    const studentFeeId = (body.student_fee_id as string | undefined) ?? null;
    const invoiceId = (body.invoice_id as string | undefined) ?? null;

    if (!tenantId || (!studentFeeId && !invoiceId)) {
      return jsonResponse({ error: 'tenant_id and either student_fee_id or invoice_id required' }, 400);
    }

    let amountCents = 0;
    const currency = 'usd';

    if (studentFeeId) {
      const { data: fee, error } = await service
        .from('student_fees')
        .select('id, tenant_id, student_id, net_amount_cents, paid_amount_cents, status')
        .eq('id', studentFeeId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error || !fee) return jsonResponse({ error: 'Student fee ledger item not found' }, 404);

      const isAdminOrAcc = superAdmin || (await hasTenantRole(service, tenantId, user.id, ['school_admin', 'accountant']));
      if (!isAdminOrAcc) {
        const { data: guardian } = await service
          .from('student_guardians')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('student_id', fee.student_id)
          .eq('guardian_user_id', user.id)
          .maybeSingle();
        if (!guardian) return jsonResponse({ error: 'Forbidden: Not authorized for this student fee' }, 403);
      }

      amountCents = Math.max(0, Number(fee.net_amount_cents) - Number(fee.paid_amount_cents));
    } else if (invoiceId) {
      const isAllowed = superAdmin || (await hasTenantRole(service, tenantId, user.id, ['school_admin', 'accountant']));
      if (!isAllowed) return jsonResponse({ error: 'Forbidden' }, 403);

      const { data: inv, error } = await service
        .from('invoices')
        .select('id, amount_cents, status')
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId)
        .maybeSingle();
      if (error || !inv) return jsonResponse({ error: 'Invoice not found' }, 404);
      amountCents = Number(inv.amount_cents);
    }

    if (amountCents <= 0) {
      return jsonResponse({ error: 'No payable balance remaining' }, 400);
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
    let externalIntentId: string | null = null;
    let clientSecret: string | null = null;

    if (stripeKey) {
      const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          amount: String(amountCents),
          currency,
          'metadata[tenant_id]': tenantId,
          'metadata[student_fee_id]': studentFeeId ?? '',
          'metadata[invoice_id]': invoiceId ?? '',
        }),
      });
      const stripeData = await stripeRes.json();
      if (!stripeRes.ok) {
        return jsonResponse({ error: stripeData?.error?.message ?? 'Payment gateway error' }, 502);
      }
      externalIntentId = stripeData.id;
      clientSecret = stripeData.client_secret;
    }

    const { data: intent, error: dbErr } = await service
      .from('payment_intents')
      .insert({
        tenant_id: tenantId,
        student_fee_id: studentFeeId,
        invoice_id: invoiceId,
        provider: 'stripe',
        external_intent_id: externalIntentId,
        amount_cents: amountCents,
        currency: 'USD',
        status: 'requires_payment_method',
        created_by: user.id,
        metadata_json: { gateway_configured: Boolean(stripeKey) },
      })
      .select()
      .single();

    if (dbErr) return jsonResponse({ error: dbErr.message }, 400);

    return jsonResponse({
      ok: true,
      gateway_configured: Boolean(stripeKey),
      intent_id: intent.id,
      external_intent_id: externalIntentId,
      client_secret: clientSecret,
      amount_cents: amountCents,
      status: intent.status,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
