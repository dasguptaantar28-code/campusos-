import {
  corsHeaders,
  createServiceClient,
  hasTenantRole,
  isPlatformAdmin,
  jsonResponse,
  requireAuthenticatedUser,
} from '../_shared/supabase.ts';

interface ImportRow {
  student_code?: string;
  admission_number?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  roll_number?: string;
  class_id?: string;
  section_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { user } = await requireAuthenticatedUser(req);
    const service = createServiceClient();
    const superAdmin = await isPlatformAdmin(service, user.id);

    const body = await req.json();
    const tenantId = String(body.tenant_id ?? '');
    const rows: ImportRow[] = Array.isArray(body.rows) ? body.rows : [];

    if (!tenantId || rows.length === 0) {
      return jsonResponse({ error: 'tenant_id and non-empty rows array required' }, 400);
    }
    if (rows.length > 500) {
      return jsonResponse({ error: 'Batch limit exceeded: max 500 rows per import request' }, 400);
    }

    const allowed = superAdmin || (await hasTenantRole(service, tenantId, user.id, ['school_admin']));
    if (!allowed) return jsonResponse({ error: 'Forbidden: School Admin membership required' }, 403);

    const { data: existingStudents } = await service
      .from('students')
      .select('student_code, admission_number')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    const existingCodes = new Set((existingStudents ?? []).map((s) => s.student_code.toLowerCase()));
    const existingAdm = new Set((existingStudents ?? []).map((s) => s.admission_number.toLowerCase()));

    const validRows: Array<Record<string, unknown>> = [];
    const errors: Array<{ index: number; reason: string }> = [];

    rows.forEach((row, index) => {
      const code = String(row.student_code ?? '').trim();
      const adm = String(row.admission_number ?? '').trim();
      const firstName = String(row.first_name ?? '').trim();
      const lastName = String(row.last_name ?? '').trim();

      if (!code || !adm || !firstName || !lastName) {
        errors.push({ index, reason: 'Missing required fields (student_code, admission_number, first_name, last_name)' });
        return;
      }
      if (existingCodes.has(code.toLowerCase()) || existingAdm.has(adm.toLowerCase())) {
        errors.push({ index, reason: `Duplicate student_code (${code}) or admission_number (${adm})` });
        return;
      }
      existingCodes.add(code.toLowerCase());
      existingAdm.add(adm.toLowerCase());

      validRows.push({
        tenant_id: tenantId,
        student_code: code,
        admission_number: adm,
        first_name: firstName,
        last_name: lastName,
        email: row.email ? String(row.email).trim() : null,
        phone: row.phone ? String(row.phone).trim() : null,
        gender: ['male', 'female', 'other'].includes(String(row.gender ?? '').toLowerCase())
          ? String(row.gender).toLowerCase()
          : null,
        roll_number: row.roll_number ? String(row.roll_number).trim() : null,
        class_id: row.class_id || null,
        section_id: row.section_id || null,
        status: 'active',
      });
    });

    let insertedCount = 0;
    if (validRows.length > 0) {
      const { data: inserted, error: insertErr } = await service.from('students').insert(validRows).select('id');
      if (insertErr) {
        return jsonResponse({ error: insertErr.message, validation_errors: errors }, 400);
      }
      insertedCount = inserted?.length ?? 0;

      await service.from('audit_logs').insert({
        tenant_id: tenantId,
        actor_user_id: user.id,
        action: 'students.bulk_import',
        entity_type: 'students',
        after_json: { inserted_count: insertedCount, rejected_count: errors.length },
      });
    }

    return jsonResponse({
      ok: true,
      inserted_count: insertedCount,
      rejected_count: errors.length,
      errors,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
