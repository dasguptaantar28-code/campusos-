import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedServerUser } from '@/lib/security/tenant-guard';
import { createServiceRoleSupabaseClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rate-limit';

const createUserSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().max(40).optional().or(z.literal('')),
  tenant_id: z.string().uuid(),
  role_key: z.enum(['teacher', 'parent', 'school_admin', 'accountant', 'staff']),
  department: z.string().max(100).optional().or(z.literal('')),
  student_id: z.string().uuid().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  const { user, isPlatformAdmin } = await requireAuthenticatedServerUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (!isPlatformAdmin) return NextResponse.json({ error: 'Forbidden: Super Admin required' }, { status: 403 });

  const rl = checkRateLimit(`sa-create-user:${user.id}`, 30);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
  }

  const service = createServiceRoleSupabaseClient();
  if (!service) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY is required on the server to provision Teacher/Guardian accounts.' },
      { status: 503 }
    );
  }

  const { full_name, email, password, phone, tenant_id, role_key, department, student_id } = parsed.data;

  const { data: createdAuth, error: authErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone: phone || null },
  });

  if (authErr || !createdAuth.user) {
    return NextResponse.json({ error: authErr?.message ?? 'Failed to create user' }, { status: 400 });
  }

  const newUserId = createdAuth.user.id;

  const { data: roleRow } = await service
    .from('roles')
    .select('id')
    .eq('key', role_key)
    .is('tenant_id', null)
    .single();

  if (roleRow) {
    await service.from('tenant_memberships').upsert(
      {
        tenant_id,
        user_id: newUserId,
        role_id: roleRow.id,
        status: 'active',
        invited_by: user.id,
      },
      { onConflict: 'tenant_id,user_id' }
    );
  }

  if (role_key === 'teacher') {
    await service.from('teachers').insert({
      tenant_id,
      user_id: newUserId,
      employee_code: `TCH-${Date.now().toString().slice(-6)}`,
      full_name,
      department: department || 'General',
      email,
      phone: phone || null,
      status: 'active',
    });
  } else if (role_key === 'parent' && student_id) {
    await service.from('student_guardians').insert({
      tenant_id,
      student_id,
      guardian_user_id: newUserId,
      guardian_name: full_name,
      relationship: 'guardian',
      phone: phone || 'N/A',
      email,
    });
  }

  await service.from('audit_logs').insert({
    tenant_id,
    actor_user_id: user.id,
    action: `super_admin.user_created.${role_key}`,
    entity_type: 'profiles',
    entity_id: newUserId,
    after_json: { email, role_key, full_name },
  });

  return NextResponse.json({ ok: true, user_id: newUserId, role_key }, { status: 201 });
}
