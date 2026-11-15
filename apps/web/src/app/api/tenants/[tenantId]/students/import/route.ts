import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveAuthorizedTenantContext } from '@/lib/security/tenant-guard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { hasPermission, isModuleEnabled } from '@/lib/config/remote-config';

const rowSchema = z.object({
  student_code: z.string().min(1),
  admission_number: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  roll_number: z.string().optional().or(z.literal('')),
  class_id: z.string().uuid().optional().nullable(),
  section_id: z.string().uuid().optional().nullable(),
});

const importBodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await context.params;
  const { context: authCtx, error } = await resolveAuthorizedTenantContext(tenantId);
  if (!authCtx) {
    return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 403 });
  }

  if (!isModuleEnabled(authCtx.config, 'students') || !hasPermission(authCtx.config, 'students.write')) {
    return NextResponse.json({ error: 'Forbidden: students.write permission and active students module required' }, { status: 403 });
  }

  const parsed = importBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid CSV import payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });

  const { data: existing } = await supabase
    .from('students')
    .select('student_code, admission_number')
    .eq('tenant_id', authCtx.tenant.id)
    .is('deleted_at', null);

  const existingCodes = new Set((existing ?? []).map((e) => e.student_code.toLowerCase()));
  const existingAdm = new Set((existing ?? []).map((e) => e.admission_number.toLowerCase()));

  const accepted: Array<Record<string, unknown>> = [];
  const rejected: Array<{ index: number; student_code: string; reason: string }> = [];

  parsed.data.rows.forEach((row, index) => {
    const code = row.student_code.trim();
    const adm = row.admission_number.trim();
    if (existingCodes.has(code.toLowerCase()) || existingAdm.has(adm.toLowerCase())) {
      rejected.push({ index, student_code: code, reason: 'Duplicate student_code or admission_number' });
      return;
    }
    existingCodes.add(code.toLowerCase());
    existingAdm.add(adm.toLowerCase());
    accepted.push({
      tenant_id: authCtx.tenant.id,
      student_code: code,
      admission_number: adm,
      first_name: row.first_name.trim(),
      last_name: row.last_name.trim(),
      email: row.email || null,
      phone: row.phone || null,
      gender: row.gender ?? null,
      roll_number: row.roll_number || null,
      class_id: row.class_id ?? null,
      section_id: row.section_id ?? null,
      status: 'active',
    });
  });

  if (accepted.length === 0) {
    return NextResponse.json({ ok: true, inserted_count: 0, rejected_count: rejected.length, rejected });
  }

  const { data: inserted, error: insertErr } = await supabase.from('students').insert(accepted).select('id');
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message, rejected }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    inserted_count: inserted?.length ?? 0,
    rejected_count: rejected.length,
    rejected,
  });
}
