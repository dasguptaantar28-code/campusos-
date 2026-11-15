import {
  corsHeaders,
  createServiceClient,
  hasTenantRole,
  isPlatformAdmin,
  jsonResponse,
  requireAuthenticatedUser,
} from '../_shared/supabase.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { client, user } = await requireAuthenticatedUser(req);
    const service = createServiceClient();
    const superAdmin = await isPlatformAdmin(service, user.id);

    const payload = await req.json();
    const action = String(payload.action ?? '');
    const tenantId = (payload.tenant_id as string | undefined) ?? null;

    if (!superAdmin) {
      if (!tenantId) {
        return jsonResponse({ error: 'Forbidden: Super Admin required for global remote actions' }, 403);
      }
      const isSchoolAdmin = await hasTenantRole(service, tenantId, user.id, ['school_admin']);
      if (!isSchoolAdmin) {
        return jsonResponse({ error: 'Forbidden: School Admin membership required' }, 403);
      }
    }

    switch (action) {
      case 'toggle_module': {
        const moduleKey = String(payload.module_key ?? '');
        const isEnabled = Boolean(payload.is_enabled);
        if (!moduleKey) return jsonResponse({ error: 'module_key required' }, 400);

        if (superAdmin && !tenantId) {
          const { error } = await service.from('modules').update({ is_globally_enabled: isEnabled }).eq('key', moduleKey);
          if (error) return jsonResponse({ error: error.message }, 400);
        } else if (tenantId) {
          const { error } = await service.from('tenant_features').upsert(
            {
              tenant_id: tenantId,
              module_key: moduleKey,
              feature_key: null,
              is_enabled: isEnabled,
              updated_by: user.id,
            },
            { onConflict: 'tenant_id,module_key,feature_key' }
          );
          if (error) return jsonResponse({ error: error.message }, 400);
        }

        const { data: versionId, error: pubErr } = await client.rpc('publish_remote_config_version', {
          p_change_summary: `${isEnabled ? 'Enabled' : 'Disabled'} module ${moduleKey}`,
          p_scope: tenantId ? 'tenant' : 'global',
          p_tenant_id: tenantId,
        });
        if (pubErr) return jsonResponse({ error: pubErr.message }, 400);
        return jsonResponse({ ok: true, version_id: versionId });
      }

      case 'update_theme': {
        const themeTokens = payload.theme_tokens ?? {};
        const branding = payload.branding ?? {};

        if (superAdmin && !tenantId) {
          await service.from('global_config').update({ default_theme: themeTokens, updated_by: user.id }).eq('config_key', 'default');
          await service
            .from('app_config')
            .update({ theme_tokens: themeTokens, branding, updated_by: user.id })
            .eq('scope', 'global')
            .is('tenant_id', null);
        } else if (tenantId) {
          await service.from('tenants').update({ branding_json: themeTokens }).eq('id', tenantId);
          await service.from('app_config').upsert(
            {
              scope: 'tenant',
              tenant_id: tenantId,
              theme_tokens: themeTokens,
              branding,
              updated_by: user.id,
            },
            { onConflict: 'scope,tenant_id,role_key' }
          );
        }

        const { data: versionId, error: pubErr } = await client.rpc('publish_remote_config_version', {
          p_change_summary: 'Updated theme and branding configuration',
          p_scope: tenantId ? 'tenant' : 'global',
          p_tenant_id: tenantId,
        });
        if (pubErr) return jsonResponse({ error: pubErr.message }, 400);
        return jsonResponse({ ok: true, version_id: versionId });
      }

      case 'upsert_nav_item': {
        const item = payload.item ?? {};
        const scope = tenantId ? 'tenant' : 'global';
        const { data, error } = await service
          .from('navigation_items')
          .upsert({
            id: item.id ?? undefined,
            scope,
            tenant_id: tenantId,
            module_key: String(item.module_key ?? 'custom'),
            label: String(item.label ?? 'Custom Link'),
            icon: String(item.icon ?? 'Sparkles'),
            route_path: String(item.route_path ?? '/custom'),
            target_type: String(item.target_type ?? 'custom_screen'),
            payload_json: item.payload_json ?? {},
            target_roles: item.target_roles ?? ['school_admin', 'teacher', 'student', 'parent'],
            platforms: item.platforms ?? ['web', 'mobile'],
            sort_order: Number(item.sort_order ?? 300),
            is_visible: item.is_visible ?? true,
            is_custom: item.is_custom ?? true,
            created_by: user.id,
          })
          .select()
          .single();
        if (error) return jsonResponse({ error: error.message }, 400);

        const { data: versionId } = await client.rpc('publish_remote_config_version', {
          p_change_summary: `Updated navigation item: ${item.label ?? 'Custom'}`,
          p_scope: scope,
          p_tenant_id: tenantId,
        });
        return jsonResponse({ ok: true, item: data, version_id: versionId });
      }

      case 'toggle_maintenance': {
        if (!superAdmin) return jsonResponse({ error: 'Forbidden: Super Admin only' }, 403);
        const enabled = Boolean(payload.maintenance_mode);
        const message = String(payload.maintenance_message ?? 'Scheduled maintenance in progress.');
        await service.from('global_config').update({ maintenance_mode: enabled, maintenance_message: message, updated_by: user.id }).eq('config_key', 'default');
        await service.from('app_config').update({ maintenance_mode: enabled, updated_by: user.id }).eq('scope', 'global').is('tenant_id', null);

        const { data: versionId } = await client.rpc('publish_remote_config_version', {
          p_change_summary: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
          p_scope: 'global',
          p_tenant_id: null,
        });
        return jsonResponse({ ok: true, version_id: versionId });
      }

      case 'set_tenant_status': {
        if (!superAdmin) return jsonResponse({ error: 'Forbidden: Super Admin only' }, 403);
        if (!tenantId) return jsonResponse({ error: 'tenant_id required' }, 400);
        const status = String(payload.status ?? '');
        if (!['pending', 'active', 'suspended', 'deactivated'].includes(status)) {
          return jsonResponse({ error: 'Invalid status' }, 400);
        }
        const updatePayload: Record<string, unknown> = {
          status,
          suspended_reason: status === 'suspended' ? (payload.reason ?? 'Suspended by Super Admin') : null,
        };
        if (status === 'active') {
          updatePayload.approved_at = new Date().toISOString();
          updatePayload.approved_by = user.id;
        }
        const { error } = await service.from('tenants').update(updatePayload).eq('id', tenantId);
        if (error) return jsonResponse({ error: error.message }, 400);

        await service.from('audit_logs').insert({
          tenant_id: tenantId,
          actor_user_id: user.id,
          action: `tenant.status.${status}`,
          entity_type: 'tenants',
          entity_id: tenantId,
          after_json: updatePayload,
        });

        return jsonResponse({ ok: true, tenant_id: tenantId, status });
      }

      case 'rollback_version': {
        const versionId = String(payload.version_id ?? '');
        if (!versionId) return jsonResponse({ error: 'version_id required' }, 400);
        const { data: newVersionId, error } = await client.rpc('rollback_remote_config_version', {
          p_version_id: versionId,
        });
        if (error) return jsonResponse({ error: error.message }, 400);
        return jsonResponse({ ok: true, new_version_id: newVersionId });
      }

      default:
        return jsonResponse({ error: `Unsupported action: ${action}` }, 400);
    }
  } catch (err) {
    if (err instanceof Response) return err;
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
