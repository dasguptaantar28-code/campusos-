import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedServerUser } from '@/lib/security/tenant-guard';
import { checkRateLimit } from '@/lib/security/rate-limit';

const remoteActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('toggle_module'),
    tenant_id: z.string().uuid().nullable().optional(),
    module_key: z.string().min(1),
    is_enabled: z.boolean(),
  }),
  z.object({
    action: z.literal('update_theme'),
    tenant_id: z.string().uuid().nullable().optional(),
    theme_tokens: z.record(z.unknown()),
    branding: z.record(z.unknown()).optional(),
  }),
  z.object({
    action: z.literal('upsert_nav_item'),
    tenant_id: z.string().uuid().nullable().optional(),
    item: z.object({
      id: z.string().uuid().optional(),
      module_key: z.string().min(1),
      label: z.string().min(1).max(80),
      icon: z.string().default('Sparkles'),
      route_path: z.string().min(1),
      target_type: z.enum(['native', 'web', 'custom_screen', 'external_url']).default('custom_screen'),
      payload_json: z.record(z.unknown()).optional(),
      target_roles: z.array(z.string()).default(['school_admin', 'teacher', 'student', 'parent']),
      platforms: z.array(z.enum(['web', 'mobile'])).default(['web', 'mobile']),
      sort_order: z.number().int().default(260),
      is_visible: z.boolean().default(true),
      is_custom: z.boolean().default(true),
    }),
  }),
  z.object({
    action: z.literal('delete_nav_item'),
    tenant_id: z.string().uuid().nullable().optional(),
    nav_item_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal('toggle_maintenance'),
    maintenance_mode: z.boolean(),
    maintenance_message: z.string().max(400).optional(),
  }),
  z.object({
    action: z.literal('set_tenant_status'),
    tenant_id: z.string().uuid(),
    status: z.enum(['pending', 'active', 'suspended', 'deactivated']),
    reason: z.string().max(300).optional(),
  }),
  z.object({
    action: z.literal('publish_version'),
    tenant_id: z.string().uuid().nullable().optional(),
    change_summary: z.string().min(3).max(200),
  }),
  z.object({
    action: z.literal('rollback_version'),
    version_id: z.string().uuid(),
  }),
  z.object({
    action: z.literal('revoke_session'),
    session_id: z.string().uuid(),
    reason: z.string().max(200).optional(),
  }),
]);

export async function POST(request: NextRequest) {
  const { supabase, user, isPlatformAdmin } = await requireAuthenticatedServerUser();
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const rl = checkRateLimit(`rc:${user.id}`, 60);
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const parsed = remoteActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid remote control payload', details: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const tenantId = 'tenant_id' in payload ? payload.tenant_id ?? null : null;

  // Enforce authorization server-side before mutating any state
  if (!isPlatformAdmin) {
    if (!tenantId || payload.action === 'toggle_maintenance' || payload.action === 'set_tenant_status') {
      return NextResponse.json({ error: 'Forbidden: Super Admin privileges required' }, { status: 403 });
    }
    const { data: membership } = await supabase
      .from('tenant_memberships')
      .select('id, roles!inner(key)')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .maybeSingle();

    const roleKey = (membership as { roles?: { key?: string } } | null)?.roles?.key;
    if (roleKey !== 'school_admin') {
      return NextResponse.json({ error: 'Forbidden: School Admin membership required' }, { status: 403 });
    }
  }

  switch (payload.action) {
    case 'toggle_module': {
      if (isPlatformAdmin && !tenantId) {
        const { error } = await supabase
          .from('modules')
          .update({ is_globally_enabled: payload.is_enabled })
          .eq('key', payload.module_key);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      } else if (tenantId) {
        const { error } = await supabase.from('tenant_features').upsert(
          {
            tenant_id: tenantId,
            module_key: payload.module_key,
            feature_key: null,
            is_enabled: payload.is_enabled,
            updated_by: user.id,
          },
          { onConflict: 'tenant_id,module_key,feature_key' }
        );
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }
      const { data: vid, error: pubErr } = await supabase.rpc('publish_remote_config_version', {
        p_change_summary: `${payload.is_enabled ? 'Enabled' : 'Disabled'} module ${payload.module_key}`,
        p_scope: tenantId ? 'tenant' : 'global',
        p_tenant_id: tenantId,
      });
      if (pubErr) return NextResponse.json({ error: pubErr.message }, { status: 400 });
      return NextResponse.json({ ok: true, version_id: vid });
    }

    case 'update_theme': {
      if (isPlatformAdmin && !tenantId) {
        const { error: gcErr } = await supabase
          .from('global_config')
          .update({ default_theme: payload.theme_tokens, updated_by: user.id })
          .eq('config_key', 'default');
        if (gcErr) return NextResponse.json({ error: gcErr.message }, { status: 400 });

        await supabase
          .from('app_config')
          .update({ theme_tokens: payload.theme_tokens, branding: payload.branding ?? {}, updated_by: user.id })
          .eq('scope', 'global')
          .is('tenant_id', null);
      } else if (tenantId) {
        await supabase.from('tenants').update({ branding_json: payload.theme_tokens }).eq('id', tenantId);
        await supabase.from('app_config').upsert(
          {
            scope: 'tenant',
            tenant_id: tenantId,
            theme_tokens: payload.theme_tokens,
            branding: payload.branding ?? {},
            updated_by: user.id,
          },
          { onConflict: 'scope,tenant_id,role_key' }
        );
      }

      const { data: vid, error: pubErr } = await supabase.rpc('publish_remote_config_version', {
        p_change_summary: 'Updated theme & branding configuration',
        p_scope: tenantId ? 'tenant' : 'global',
        p_tenant_id: tenantId,
      });
      if (pubErr) return NextResponse.json({ error: pubErr.message }, { status: 400 });
      return NextResponse.json({ ok: true, version_id: vid });
    }

    case 'upsert_nav_item': {
      const scope = tenantId ? 'tenant' : 'global';
      const { data: navRow, error } = await supabase
        .from('navigation_items')
        .upsert({
          ...payload.item,
          scope,
          tenant_id: tenantId,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const { data: vid } = await supabase.rpc('publish_remote_config_version', {
        p_change_summary: `Saved navigation item: ${payload.item.label}`,
        p_scope: scope,
        p_tenant_id: tenantId,
      });
      return NextResponse.json({ ok: true, item: navRow, version_id: vid });
    }

    case 'delete_nav_item': {
      const { error } = await supabase.from('navigation_items').delete().eq('id', payload.nav_item_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      const { data: vid } = await supabase.rpc('publish_remote_config_version', {
        p_change_summary: 'Removed custom navigation item',
        p_scope: tenantId ? 'tenant' : 'global',
        p_tenant_id: tenantId,
      });
      return NextResponse.json({ ok: true, version_id: vid });
    }

    case 'toggle_maintenance': {
      const msg = payload.maintenance_message ?? 'CampusOS is undergoing scheduled maintenance.';
      await supabase
        .from('global_config')
        .update({ maintenance_mode: payload.maintenance_mode, maintenance_message: msg, updated_by: user.id })
        .eq('config_key', 'default');
      await supabase
        .from('app_config')
        .update({ maintenance_mode: payload.maintenance_mode, updated_by: user.id })
        .eq('scope', 'global')
        .is('tenant_id', null);

      const { data: vid } = await supabase.rpc('publish_remote_config_version', {
        p_change_summary: `Maintenance mode ${payload.maintenance_mode ? 'enabled' : 'disabled'}`,
        p_scope: 'global',
        p_tenant_id: null,
      });
      return NextResponse.json({ ok: true, version_id: vid });
    }

    case 'set_tenant_status': {
      const updateData: Record<string, unknown> = {
        status: payload.status,
        suspended_reason: payload.status === 'suspended' ? payload.reason ?? 'Suspended by Super Admin' : null,
      };
      if (payload.status === 'active') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user.id;
      }
      const { error } = await supabase.from('tenants').update(updateData).eq('id', payload.tenant_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });

      await supabase.from('audit_logs').insert({
        tenant_id: payload.tenant_id,
        actor_user_id: user.id,
        action: `tenant.status.${payload.status}`,
        entity_type: 'tenants',
        entity_id: payload.tenant_id,
        after_json: updateData,
      });
      return NextResponse.json({ ok: true, status: payload.status });
    }

    case 'publish_version': {
      const { data: vid, error } = await supabase.rpc('publish_remote_config_version', {
        p_change_summary: payload.change_summary,
        p_scope: tenantId ? 'tenant' : 'global',
        p_tenant_id: tenantId,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, version_id: vid });
    }

    case 'rollback_version': {
      const { data: vid, error } = await supabase.rpc('rollback_remote_config_version', {
        p_version_id: payload.version_id,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, new_version_id: vid });
    }

    case 'revoke_session': {
      const { error } = await supabase.rpc('revoke_user_session', {
        p_session_id: payload.session_id,
        p_reason: payload.reason ?? 'Revoked via Security Center',
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
  }
}
