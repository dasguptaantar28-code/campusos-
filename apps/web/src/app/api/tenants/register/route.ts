import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedServerUser } from '@/lib/security/tenant-guard';
import { checkRateLimit } from '@/lib/security/rate-limit';

const registerTenantSchema = z.object({
  name: z.string().min(3).max(160),
  institution_type: z.enum(['school', 'college', 'academy', 'university', 'training_center']).default('school'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  plan_code: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']).default('FREE'),
});

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireAuthenticatedServerUser();
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const rl = checkRateLimit(`reg-tenant:${user.id}`, 10);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const parsed = registerTenantSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const { data: tenantId, error } = await supabase.rpc('register_school_onboarding', {
    p_name: parsed.data.name,
    p_institution_type: parsed.data.institution_type,
    p_email: parsed.data.email || null,
    p_phone: parsed.data.phone || null,
    p_address: parsed.data.address || null,
    p_plan_code: parsed.data.plan_code,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tenant_id: tenantId, status: 'pending' }, { status: 201 });
}
