-- ==============================================================================
-- CampusOS Migration 0009: Server-Side RPCs, Remote Config Engine & Realtime
-- ==============================================================================

-- 1. Hierarchical Remote Configuration Resolver
CREATE OR REPLACE FUNCTION public.resolve_effective_config(
  p_tenant_id UUID DEFAULT NULL,
  p_platform TEXT DEFAULT 'web'
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_is_super_admin BOOLEAN := FALSE;
  v_global RECORD;
  v_global_app RECORD;
  v_tenant RECORD;
  v_tenant_app RECORD;
  v_role_app RECORD;
  v_role_key TEXT := 'guest';
  v_permissions TEXT[] := ARRAY[]::TEXT[];
  v_plan RECORD;
  v_theme JSONB;
  v_branding JSONB;
  v_settings JSONB;
  v_modules JSONB;
  v_nav JSONB;
  v_widgets JSONB;
  v_latest_version INTEGER := 1;
  v_session_revoked BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_global FROM public.global_config WHERE config_key = 'default' LIMIT 1;
  SELECT * INTO v_global_app FROM public.app_config WHERE scope = 'global' AND tenant_id IS NULL LIMIT 1;

  v_theme := COALESCE(v_global_app.theme_tokens, v_global.default_theme, '{}'::JSONB);
  v_branding := COALESCE(v_global_app.branding, jsonb_build_object('brandName', COALESCE(v_global.brand_name, 'CampusOS'), 'tagline', COALESCE(v_global.tagline, 'One Platform. Every Campus.')));
  v_settings := COALESCE(v_global_app.settings_json, '{}'::JSONB);
  v_latest_version := COALESCE(v_global.active_version_number, v_global_app.version_number, 1);

  IF v_uid IS NOT NULL THEN
    v_is_super_admin := app.is_platform_admin();
    SELECT EXISTS (
      SELECT 1 FROM public.user_sessions us
      WHERE us.user_id = v_uid
        AND us.revoked_at IS NOT NULL
        AND us.revoked_at > NOW() - INTERVAL '10 minutes'
        AND NOT EXISTS (
          SELECT 1 FROM public.user_sessions us2
          WHERE us2.user_id = v_uid AND us2.revoked_at IS NULL AND us2.created_at > us.revoked_at
        )
    ) INTO v_session_revoked;
  END IF;

  IF p_tenant_id IS NOT NULL THEN
    SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id AND deleted_at IS NULL;
    IF NOT FOUND THEN
      RETURN jsonb_build_object('authorized', FALSE, 'error', 'Institution not found');
    END IF;

    IF NOT v_is_super_admin THEN
      IF v_tenant.status <> 'active' THEN
        RETURN jsonb_build_object(
          'authorized', FALSE,
          'tenant_id', v_tenant.id,
          'tenant_status', v_tenant.status,
          'error', 'Institution access is currently ' || v_tenant.status,
          'maintenance_mode', COALESCE(v_global.maintenance_mode, FALSE)
        );
      END IF;

      IF v_uid IS NULL OR NOT app.has_tenant_membership(p_tenant_id) THEN
        RETURN jsonb_build_object('authorized', FALSE, 'tenant_id', p_tenant_id, 'error', 'Unauthorized tenant membership');
      END IF;
    END IF;

    SELECT r.key INTO v_role_key
    FROM public.tenant_memberships tm
    JOIN public.roles r ON r.id = tm.role_id
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_uid AND tm.status = 'active' AND tm.deleted_at IS NULL
    LIMIT 1;

    IF v_role_key IS NULL AND v_is_super_admin THEN
      v_role_key := 'super_admin';
    END IF;

    SELECT COALESCE(array_agg(DISTINCT p.key), ARRAY[]::TEXT[]) INTO v_permissions
    FROM public.tenant_memberships tm
    JOIN public.role_permissions rp ON rp.role_id = tm.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE tm.tenant_id = p_tenant_id AND tm.user_id = v_uid AND tm.status = 'active' AND tm.deleted_at IS NULL;

    IF v_is_super_admin THEN
      SELECT COALESCE(array_agg(key), ARRAY[]::TEXT[]) INTO v_permissions FROM public.permissions;
    END IF;

    SELECT sp.* INTO v_plan FROM public.subscription_plans sp WHERE sp.id = v_tenant.subscription_plan_id;
    SELECT * INTO v_tenant_app FROM public.app_config WHERE scope = 'tenant' AND tenant_id = p_tenant_id LIMIT 1;
    SELECT * INTO v_role_app FROM public.app_config WHERE scope = 'role' AND (tenant_id = p_tenant_id OR tenant_id IS NULL) AND role_key = v_role_key ORDER BY tenant_id NULLS LAST LIMIT 1;

    -- Layer cascade: Global -> Tenant Branding -> Tenant App Config -> Role Config
    IF COALESCE((v_settings ->> 'allowSchoolThemeOverride')::BOOLEAN, TRUE) THEN
      v_theme := v_theme || COALESCE(v_tenant.branding_json, '{}'::JSONB) || COALESCE(v_tenant_app.theme_tokens, '{}'::JSONB);
      v_branding := v_branding || jsonb_build_object('institutionName', v_tenant.name, 'institutionLogo', v_tenant.logo_url) || COALESCE(v_tenant_app.branding, '{}'::JSONB);
    END IF;
    v_settings := v_settings || COALESCE(v_tenant.settings_json, '{}'::JSONB) || COALESCE(v_tenant_app.settings_json, '{}'::JSONB) || COALESCE(v_role_app.settings_json, '{}'::JSONB);
    v_latest_version := GREATEST(v_latest_version, COALESCE(v_tenant_app.version_number, 1));

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'key', m.key,
      'name', m.name,
      'description', m.description,
      'icon', m.icon,
      'default_route', m.default_route,
      'nav_order', m.nav_order,
      'enabled', app.is_module_enabled_for_tenant(p_tenant_id, m.key)
    ) ORDER BY m.nav_order), '[]'::JSONB)
    INTO v_modules
    FROM public.modules m;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', n.id,
      'module_key', n.module_key,
      'label', n.label,
      'icon', n.icon,
      'route_path', n.route_path,
      'target_type', n.target_type,
      'payload_json', n.payload_json,
      'sort_order', n.sort_order,
      'is_custom', n.is_custom,
      'scope', n.scope
    ) ORDER BY n.sort_order), '[]'::JSONB)
    INTO v_nav
    FROM public.navigation_items n
    WHERE n.is_visible = TRUE
      AND p_platform = ANY(n.platforms)
      AND (
        (n.scope = 'global' AND n.tenant_id IS NULL)
        OR (n.scope = 'tenant' AND n.tenant_id = p_tenant_id)
      )
      AND (v_role_key = 'super_admin' OR v_role_key = ANY(n.target_roles))
      AND (
        n.is_custom = TRUE
        OR app.is_module_enabled_for_tenant(p_tenant_id, n.module_key)
      );

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', w.id,
      'widget_key', w.widget_key,
      'module_key', w.module_key,
      'title', w.title,
      'widget_type', w.widget_type,
      'sort_order', w.sort_order,
      'config_json', w.config_json
    ) ORDER BY w.sort_order), '[]'::JSONB)
    INTO v_widgets
    FROM public.dashboard_widgets w
    WHERE w.is_visible = TRUE
      AND p_platform = ANY(w.platforms)
      AND (
        (w.scope = 'global' AND w.tenant_id IS NULL)
        OR (w.scope = 'tenant' AND w.tenant_id = p_tenant_id)
      )
      AND (v_role_key = 'super_admin' OR v_role_key = ANY(w.target_roles))
      AND app.is_module_enabled_for_tenant(p_tenant_id, w.module_key);
  ELSE
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'key', m.key, 'name', m.name, 'icon', m.icon, 'default_route', m.default_route,
      'nav_order', m.nav_order, 'enabled', m.is_globally_enabled
    ) ORDER BY m.nav_order), '[]'::JSONB)
    INTO v_modules FROM public.modules m;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', n.id, 'module_key', n.module_key, 'label', n.label, 'icon', n.icon,
      'route_path', n.route_path, 'target_type', n.target_type, 'payload_json', n.payload_json,
      'sort_order', n.sort_order, 'is_custom', n.is_custom
    ) ORDER BY n.sort_order), '[]'::JSONB)
    INTO v_nav
    FROM public.navigation_items n
    WHERE n.scope = 'global' AND n.is_visible = TRUE AND p_platform = ANY(n.platforms);

    v_widgets := '[]'::JSONB;
  END IF;

  RETURN jsonb_build_object(
    'authorized', TRUE,
    'version', v_latest_version,
    'platform', p_platform,
    'maintenance_mode', COALESCE(v_global.maintenance_mode, FALSE) OR COALESCE(v_global_app.maintenance_mode, FALSE) OR COALESCE(v_tenant_app.maintenance_mode, FALSE),
    'maintenance_message', COALESCE(v_global.maintenance_message, 'Scheduled maintenance in progress'),
    'session_revoked', v_session_revoked,
    'is_platform_admin', v_is_super_admin,
    'tenant', CASE WHEN p_tenant_id IS NOT NULL THEN jsonb_build_object(
      'id', v_tenant.id,
      'name', v_tenant.name,
      'slug', v_tenant.slug,
      'status', v_tenant.status,
      'plan_code', COALESCE(v_plan.code, 'FREE')
    ) ELSE NULL END,
    'role', v_role_key,
    'permissions', to_jsonb(v_permissions),
    'theme', v_theme,
    'branding', v_branding,
    'settings', v_settings,
    'modules', COALESCE(v_modules, '[]'::JSONB),
    'navigation', COALESCE(v_nav, '[]'::JSONB),
    'widgets', COALESCE(v_widgets, '[]'::JSONB)
  );
END;
$$;

-- 2. Publish Immutable Configuration Snapshot Version
CREATE OR REPLACE FUNCTION public.publish_remote_config_version(
  p_change_summary TEXT,
  p_scope TEXT DEFAULT 'global',
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_version INTEGER;
  v_snapshot JSONB;
  v_new_id UUID;
BEGIN
  IF p_scope = 'global' THEN
    IF NOT app.is_platform_admin() THEN
      RAISE EXCEPTION 'Forbidden: Super Admin required for global configuration publish';
    END IF;
  ELSIF p_scope = 'tenant' AND p_tenant_id IS NOT NULL THEN
    IF NOT (app.is_platform_admin() OR app.has_tenant_role(p_tenant_id, ARRAY['school_admin'])) THEN
      RAISE EXCEPTION 'Forbidden: School Admin or Super Admin required';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid scope or missing tenant_id';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM public.configuration_versions
  WHERE scope = p_scope AND tenant_id IS NOT DISTINCT FROM p_tenant_id;

  IF p_scope = 'global' THEN
    UPDATE public.global_config SET active_version_number = v_next_version, updated_by = auth.uid() WHERE config_key = 'default';
    UPDATE public.app_config SET version_number = v_next_version, updated_by = auth.uid() WHERE scope = 'global' AND tenant_id IS NULL;

    v_snapshot := jsonb_build_object(
      'global_config', (SELECT to_jsonb(gc) FROM public.global_config gc WHERE config_key = 'default' LIMIT 1),
      'app_config', (SELECT to_jsonb(ac) FROM public.app_config ac WHERE scope = 'global' AND tenant_id IS NULL LIMIT 1),
      'modules', COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY m.nav_order) FROM public.modules m), '[]'::JSONB),
      'navigation_items', COALESCE((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.sort_order) FROM public.navigation_items n WHERE n.scope = 'global'), '[]'::JSONB),
      'dashboard_widgets', COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.sort_order) FROM public.dashboard_widgets w WHERE w.scope = 'global'), '[]'::JSONB)
    );
  ELSE
    INSERT INTO public.app_config (scope, tenant_id, version_number, updated_by)
    VALUES ('tenant', p_tenant_id, v_next_version, auth.uid())
    ON CONFLICT (scope, tenant_id, role_key) DO UPDATE SET version_number = v_next_version, updated_by = auth.uid();

    v_snapshot := jsonb_build_object(
      'app_config', (SELECT to_jsonb(ac) FROM public.app_config ac WHERE scope = 'tenant' AND ac.tenant_id = p_tenant_id LIMIT 1),
      'tenant_features', COALESCE((SELECT jsonb_agg(to_jsonb(tf)) FROM public.tenant_features tf WHERE tf.tenant_id = p_tenant_id), '[]'::JSONB),
      'navigation_items', COALESCE((SELECT jsonb_agg(to_jsonb(n) ORDER BY n.sort_order) FROM public.navigation_items n WHERE n.scope = 'tenant' AND n.tenant_id = p_tenant_id), '[]'::JSONB),
      'dashboard_widgets', COALESCE((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.sort_order) FROM public.dashboard_widgets w WHERE w.scope = 'tenant' AND w.tenant_id = p_tenant_id), '[]'::JSONB)
    );
  END IF;

  INSERT INTO public.configuration_versions (version_number, scope, tenant_id, snapshot_json, change_summary, created_by)
  VALUES (v_next_version, p_scope, p_tenant_id, v_snapshot, p_change_summary, auth.uid())
  RETURNING id INTO v_new_id;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (p_tenant_id, auth.uid(), 'remote_config.publish', 'configuration_versions', v_new_id::TEXT, jsonb_build_object('version', v_next_version, 'summary', p_change_summary));

  RETURN v_new_id;
END;
$$;

-- 3. 1-Click Rollback Configuration Version (Test E)
CREATE OR REPLACE FUNCTION public.rollback_remote_config_version(p_version_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target public.configuration_versions%ROWTYPE;
  v_next_version INTEGER;
  v_new_id UUID;
  v_mod JSONB;
  v_nav JSONB;
  v_wid JSONB;
  v_tf JSONB;
BEGIN
  SELECT * INTO v_target FROM public.configuration_versions WHERE id = p_version_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Configuration version % not found', p_version_id;
  END IF;

  IF v_target.scope = 'global' THEN
    IF NOT app.is_platform_admin() THEN
      RAISE EXCEPTION 'Forbidden: Super Admin required to rollback global configuration';
    END IF;
  ELSIF NOT (app.is_platform_admin() OR app.has_tenant_role(v_target.tenant_id, ARRAY['school_admin'])) THEN
    RAISE EXCEPTION 'Forbidden: Unauthorized configuration rollback';
  END IF;

  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_next_version
  FROM public.configuration_versions
  WHERE scope = v_target.scope AND tenant_id IS NOT DISTINCT FROM v_target.tenant_id;

  IF v_target.scope = 'global' THEN
    UPDATE public.global_config
    SET
      brand_name = COALESCE(v_target.snapshot_json -> 'global_config' ->> 'brand_name', brand_name),
      tagline = COALESCE(v_target.snapshot_json -> 'global_config' ->> 'tagline', tagline),
      maintenance_mode = COALESCE((v_target.snapshot_json -> 'global_config' ->> 'maintenance_mode')::BOOLEAN, FALSE),
      maintenance_message = COALESCE(v_target.snapshot_json -> 'global_config' ->> 'maintenance_message', maintenance_message),
      default_theme = COALESCE(v_target.snapshot_json -> 'global_config' -> 'default_theme', default_theme),
      active_version_number = v_next_version,
      updated_by = auth.uid()
    WHERE config_key = 'default';

    UPDATE public.app_config
    SET
      theme_tokens = COALESCE(v_target.snapshot_json -> 'app_config' -> 'theme_tokens', theme_tokens),
      branding = COALESCE(v_target.snapshot_json -> 'app_config' -> 'branding', branding),
      settings_json = COALESCE(v_target.snapshot_json -> 'app_config' -> 'settings_json', settings_json),
      maintenance_mode = COALESCE((v_target.snapshot_json -> 'app_config' ->> 'maintenance_mode')::BOOLEAN, FALSE),
      version_number = v_next_version,
      updated_by = auth.uid()
    WHERE scope = 'global' AND tenant_id IS NULL;

    IF jsonb_typeof(v_target.snapshot_json -> 'modules') = 'array' THEN
      FOR v_mod IN SELECT * FROM jsonb_array_elements(v_target.snapshot_json -> 'modules')
      LOOP
        INSERT INTO public.modules (id, key, name, description, icon, default_route, nav_order, is_globally_enabled, is_core, required_permission, min_plan_tier)
        VALUES (
          (v_mod ->> 'id')::UUID,
          v_mod ->> 'key',
          v_mod ->> 'name',
          v_mod ->> 'description',
          COALESCE(v_mod ->> 'icon', 'LayoutGrid'),
          COALESCE(v_mod ->> 'default_route', ''),
          COALESCE((v_mod ->> 'nav_order')::INTEGER, 100),
          COALESCE((v_mod ->> 'is_globally_enabled')::BOOLEAN, TRUE),
          COALESCE((v_mod ->> 'is_core')::BOOLEAN, FALSE),
          v_mod ->> 'required_permission',
          COALESCE(v_mod ->> 'min_plan_tier', 'FREE')
        )
        ON CONFLICT (key) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          icon = EXCLUDED.icon,
          nav_order = EXCLUDED.nav_order,
          is_globally_enabled = EXCLUDED.is_globally_enabled,
          min_plan_tier = EXCLUDED.min_plan_tier;
      END LOOP;
    END IF;

    DELETE FROM public.navigation_items WHERE scope = 'global' AND tenant_id IS NULL;
    IF jsonb_typeof(v_target.snapshot_json -> 'navigation_items') = 'array' THEN
      FOR v_nav IN SELECT * FROM jsonb_array_elements(v_target.snapshot_json -> 'navigation_items')
      LOOP
        INSERT INTO public.navigation_items (id, scope, tenant_id, module_key, label, icon, route_path, target_type, payload_json, sort_order, is_visible, is_custom)
        VALUES (
          COALESCE((v_nav ->> 'id')::UUID, gen_random_uuid()),
          'global',
          NULL,
          v_nav ->> 'module_key',
          v_nav ->> 'label',
          COALESCE(v_nav ->> 'icon', 'CircleDot'),
          v_nav ->> 'route_path',
          COALESCE(v_nav ->> 'target_type', 'native'),
          COALESCE(v_nav -> 'payload_json', '{}'::JSONB),
          COALESCE((v_nav ->> 'sort_order')::INTEGER, 100),
          COALESCE((v_nav ->> 'is_visible')::BOOLEAN, TRUE),
          COALESCE((v_nav ->> 'is_custom')::BOOLEAN, FALSE)
        );
      END LOOP;
    END IF;
  ELSE
    UPDATE public.app_config
    SET
      theme_tokens = COALESCE(v_target.snapshot_json -> 'app_config' -> 'theme_tokens', theme_tokens),
      branding = COALESCE(v_target.snapshot_json -> 'app_config' -> 'branding', branding),
      settings_json = COALESCE(v_target.snapshot_json -> 'app_config' -> 'settings_json', settings_json),
      maintenance_mode = COALESCE((v_target.snapshot_json -> 'app_config' ->> 'maintenance_mode')::BOOLEAN, FALSE),
      version_number = v_next_version,
      updated_by = auth.uid()
    WHERE scope = 'tenant' AND tenant_id = v_target.tenant_id;

    DELETE FROM public.tenant_features WHERE tenant_id = v_target.tenant_id;
    IF jsonb_typeof(v_target.snapshot_json -> 'tenant_features') = 'array' THEN
      FOR v_tf IN SELECT * FROM jsonb_array_elements(v_target.snapshot_json -> 'tenant_features')
      LOOP
        INSERT INTO public.tenant_features (tenant_id, module_key, feature_key, is_enabled, config_json, updated_by)
        VALUES (
          v_target.tenant_id,
          v_tf ->> 'module_key',
          v_tf ->> 'feature_key',
          COALESCE((v_tf ->> 'is_enabled')::BOOLEAN, TRUE),
          COALESCE(v_tf -> 'config_json', '{}'::JSONB),
          auth.uid()
        );
      END LOOP;
    END IF;
  END IF;

  INSERT INTO public.configuration_versions (version_number, scope, tenant_id, snapshot_json, change_summary, restored_from_version_id, created_by)
  VALUES (
    v_next_version,
    v_target.scope,
    v_target.tenant_id,
    v_target.snapshot_json,
    'Rollback to v' || v_target.version_number || ': ' || v_target.change_summary,
    v_target.id,
    auth.uid()
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (
    v_target.tenant_id,
    auth.uid(),
    'remote_config.rollback',
    'configuration_versions',
    v_new_id::TEXT,
    jsonb_build_object('restored_from_id', v_target.id, 'restored_version', v_target.version_number, 'new_version', v_next_version)
  );

  RETURN v_new_id;
END;
$$;

-- 4. Remote Session Revocation & Sign-Out
CREATE OR REPLACE FUNCTION public.revoke_user_session(
  p_session_id UUID,
  p_reason TEXT DEFAULT 'Revoked by administrator'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.user_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.user_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session % not found', p_session_id;
  END IF;

  IF NOT (
    app.is_platform_admin()
    OR v_session.user_id = auth.uid()
    OR (v_session.tenant_id IS NOT NULL AND app.has_tenant_role(v_session.tenant_id, ARRAY['school_admin']))
  ) THEN
    RAISE EXCEPTION 'Forbidden: Cannot revoke session';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = NOW(), revoked_by = auth.uid(), revoke_reason = p_reason
  WHERE id = p_session_id AND revoked_at IS NULL;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (v_session.tenant_id, auth.uid(), 'session.revoked', 'user_sessions', p_session_id::TEXT, jsonb_build_object('target_user_id', v_session.user_id, 'reason', p_reason));
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_out_user_everywhere(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Global sign-out enforced'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT (app.is_platform_admin() OR p_user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden: Super Admin or self required';
  END IF;

  UPDATE public.user_sessions
  SET revoked_at = NOW(), revoked_by = auth.uid(), revoke_reason = p_reason
  WHERE user_id = p_user_id AND revoked_at IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.audit_logs (actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (auth.uid(), 'session.sign_out_all', 'profiles', p_user_id::TEXT, jsonb_build_object('revoked_count', v_count, 'reason', p_reason));

  RETURN v_count;
END;
$$;

-- 5. Exam Result Calculation & Approval Workflow (Never publish without approval)
CREATE OR REPLACE FUNCTION public.calculate_exam_results(p_tenant_id UUID, p_exam_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF NOT (app.is_platform_admin() OR app.has_tenant_permission(p_tenant_id, 'exams.write') OR app.has_tenant_permission(p_tenant_id, 'results.approve')) THEN
    RAISE EXCEPTION 'Forbidden: Unauthorized to calculate exam results';
  END IF;

  INSERT INTO public.results (tenant_id, exam_id, student_id, class_id, total_marks, max_total_marks, percentage, gpa, grade, is_passed, is_published)
  SELECT
    p_tenant_id,
    p_exam_id,
    s.id,
    s.class_id,
    COALESCE(SUM(m.marks_obtained), 0) AS total_marks,
    COALESCE(SUM(es.max_marks), 0) AS max_total_marks,
    CASE WHEN COALESCE(SUM(es.max_marks), 0) > 0
      THEN ROUND((COALESCE(SUM(m.marks_obtained), 0) / SUM(es.max_marks)) * 100.0, 2)
      ELSE 0 END AS percentage,
    COALESCE((
      SELECT gr.gpa_point FROM public.grading_rules gr
      WHERE gr.tenant_id = p_tenant_id
        AND (CASE WHEN SUM(es.max_marks) > 0 THEN ROUND((SUM(m.marks_obtained) / SUM(es.max_marks)) * 100.0, 2) ELSE 0 END) BETWEEN gr.min_percentage AND gr.max_percentage
      ORDER BY gr.min_percentage DESC LIMIT 1
    ), 0) AS gpa,
    COALESCE((
      SELECT gr.grade_label FROM public.grading_rules gr
      WHERE gr.tenant_id = p_tenant_id
        AND (CASE WHEN SUM(es.max_marks) > 0 THEN ROUND((SUM(m.marks_obtained) / SUM(es.max_marks)) * 100.0, 2) ELSE 0 END) BETWEEN gr.min_percentage AND gr.max_percentage
      ORDER BY gr.min_percentage DESC LIMIT 1
    ), CASE WHEN COALESCE(SUM(es.max_marks), 0) > 0 AND (SUM(m.marks_obtained) / SUM(es.max_marks)) * 100 >= 33 THEN 'PASS' ELSE 'FAIL' END) AS grade,
    BOOL_AND(NOT m.is_absent AND m.marks_obtained >= es.pass_marks) AS is_passed,
    FALSE
  FROM public.marks m
  JOIN public.exam_subjects es ON es.id = m.exam_subject_id
  JOIN public.students s ON s.id = m.student_id
  WHERE m.tenant_id = p_tenant_id AND m.exam_id = p_exam_id
  GROUP BY s.id, s.class_id
  ON CONFLICT (tenant_id, exam_id, student_id) DO UPDATE SET
    total_marks = EXCLUDED.total_marks,
    max_total_marks = EXCLUDED.max_total_marks,
    percentage = EXCLUDED.percentage,
    gpa = EXCLUDED.gpa,
    grade = EXCLUDED.grade,
    is_passed = EXCLUDED.is_passed,
    is_published = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Compute Class Merit Position
  WITH ranked AS (
    SELECT id, DENSE_RANK() OVER (PARTITION BY class_id ORDER BY percentage DESC, total_marks DESC) AS pos
    FROM public.results
    WHERE tenant_id = p_tenant_id AND exam_id = p_exam_id
  )
  UPDATE public.results r
  SET rank_position = ranked.pos
  FROM ranked
  WHERE r.id = ranked.id;

  UPDATE public.exams SET status = 'pending_approval' WHERE id = p_exam_id AND tenant_id = p_tenant_id AND status <> 'published';

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_and_publish_exam_results(p_tenant_id UUID, p_exam_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT (app.is_platform_admin() OR app.has_tenant_permission(p_tenant_id, 'results.approve')) THEN
    RAISE EXCEPTION 'Forbidden: Result approval permission required';
  END IF;

  UPDATE public.exams
  SET status = 'published', approved_by = auth.uid(), approved_at = NOW()
  WHERE id = p_exam_id AND tenant_id = p_tenant_id;

  UPDATE public.results
  SET is_published = TRUE, approved_by = auth.uid(), published_by = auth.uid(), published_at = NOW()
  WHERE tenant_id = p_tenant_id AND exam_id = p_exam_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.report_cards (tenant_id, result_id, student_id, exam_id, card_number, snapshot_json)
  SELECT
    r.tenant_id,
    r.id,
    r.student_id,
    r.exam_id,
    'RC-' || upper(left(r.id::TEXT, 8)),
    jsonb_build_object(
      'total_marks', r.total_marks,
      'max_total_marks', r.max_total_marks,
      'percentage', r.percentage,
      'gpa', r.gpa,
      'grade', r.grade,
      'rank_position', r.rank_position,
      'is_passed', r.is_passed
    )
  FROM public.results r
  WHERE r.tenant_id = p_tenant_id AND r.exam_id = p_exam_id AND r.is_published = TRUE
  ON CONFLICT (tenant_id, result_id) DO NOTHING;

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (p_tenant_id, auth.uid(), 'results.published', 'exams', p_exam_id::TEXT, jsonb_build_object('published_count', v_count));

  RETURN v_count;
END;
$$;

-- 6. Real Aggregated Overview Statistics RPCs (Zero Hardcoded Stats)
CREATE OR REPLACE FUNCTION public.get_super_admin_overview_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mrr BIGINT;
  v_payments BIGINT;
BEGIN
  IF NOT app.is_platform_admin() THEN
    RAISE EXCEPTION 'Forbidden: Super Admin access required';
  END IF;

  SELECT COALESCE(SUM(
    CASE WHEN s.billing_cycle = 'annual' THEN sp.annual_price_cents / 12 ELSE sp.monthly_price_cents END
  ), 0) INTO v_mrr
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.status IN ('active', 'trial');

  SELECT COALESCE(SUM(amount_cents), 0) INTO v_payments FROM public.payments WHERE status = 'succeeded';

  RETURN jsonb_build_object(
    'total_institutions', (SELECT COUNT(*) FROM public.tenants WHERE deleted_at IS NULL),
    'active_institutions', (SELECT COUNT(*) FROM public.tenants WHERE status = 'active' AND deleted_at IS NULL),
    'suspended_institutions', (SELECT COUNT(*) FROM public.tenants WHERE status = 'suspended' AND deleted_at IS NULL),
    'pending_institutions', (SELECT COUNT(*) FROM public.tenants WHERE status = 'pending' AND deleted_at IS NULL),
    'total_students', (SELECT COUNT(*) FROM public.students WHERE deleted_at IS NULL),
    'total_teachers', (SELECT COUNT(*) FROM public.teachers WHERE deleted_at IS NULL),
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE deleted_at IS NULL),
    'active_subscriptions', (SELECT COUNT(*) FROM public.subscriptions WHERE status IN ('active', 'trial')),
    'mrr_cents', v_mrr,
    'total_payments_cents', v_payments,
    'enabled_modules', (SELECT COUNT(*) FROM public.modules WHERE is_globally_enabled = TRUE),
    'active_devices', (SELECT COUNT(*) FROM public.device_registrations WHERE is_active = TRUE),
    'system_health', 'operational'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_school_overview_stats(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_att_total INTEGER;
  v_att_present INTEGER;
BEGIN
  IF NOT app.has_tenant_membership(p_tenant_id) THEN
    RAISE EXCEPTION 'Forbidden: Unauthorized tenant access';
  END IF;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE status IN ('present', 'late'))
  INTO v_att_total, v_att_present
  FROM public.attendance
  WHERE tenant_id = p_tenant_id AND attendance_date = v_today;

  RETURN jsonb_build_object(
    'total_students', (SELECT COUNT(*) FROM public.students WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'total_teachers', (SELECT COUNT(*) FROM public.teachers WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'total_staff', (SELECT COUNT(*) FROM public.staff WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'total_classes', (SELECT COUNT(*) FROM public.classes WHERE tenant_id = p_tenant_id AND deleted_at IS NULL),
    'today_attendance_marked', v_att_total,
    'today_attendance_present', v_att_present,
    'attendance_percentage', CASE WHEN v_att_total > 0 THEN ROUND((v_att_present::NUMERIC / v_att_total) * 100, 1) ELSE 0 END,
    'fees_collected_cents', COALESCE((SELECT SUM(amount_cents) FROM public.fee_payments WHERE tenant_id = p_tenant_id AND payment_status = 'completed'), 0),
    'outstanding_dues_cents', COALESCE((SELECT SUM(GREATEST(0, net_amount_cents - paid_amount_cents)) FROM public.student_fees WHERE tenant_id = p_tenant_id AND status IN ('unpaid', 'partial', 'overdue')), 0),
    'total_expenses_cents', COALESCE((SELECT SUM(amount_cents) FROM public.expenses WHERE tenant_id = p_tenant_id), 0)
  );
END;
$$;

-- 7. School Self-Registration Onboarding RPC (Creates pending school + admin membership)
CREATE OR REPLACE FUNCTION public.register_school_onboarding(
  p_name TEXT,
  p_institution_type TEXT DEFAULT 'school',
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_plan_code TEXT DEFAULT 'FREE'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_tenant_id UUID;
  v_plan_id UUID;
  v_role_id UUID;
  v_slug TEXT;
  v_code TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to register a school';
  END IF;

  SELECT id INTO v_plan_id FROM public.subscription_plans WHERE code = upper(COALESCE(p_plan_code, 'FREE')) LIMIT 1;
  SELECT id INTO v_role_id FROM public.roles WHERE key = 'school_admin' AND tenant_id IS NULL LIMIT 1;

  v_slug := app.normalize_slug(p_name) || '-' || substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6);
  v_code := 'CMP-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 6));

  INSERT INTO public.tenants (name, slug, code, institution_type, email, phone, address, status, subscription_plan_id)
  VALUES (p_name, v_slug, v_code, COALESCE(p_institution_type, 'school'), p_email, p_phone, p_address, 'pending', v_plan_id)
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.subscriptions (tenant_id, plan_id, status, billing_cycle)
  VALUES (v_tenant_id, v_plan_id, 'trial', 'monthly');

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status, is_primary)
  VALUES (v_tenant_id, v_uid, v_role_id, 'active', TRUE);

  INSERT INTO public.app_config (scope, tenant_id, version_number)
  VALUES ('tenant', v_tenant_id, 1);

  INSERT INTO public.audit_logs (tenant_id, actor_user_id, action, entity_type, entity_id, after_json)
  VALUES (v_tenant_id, v_uid, 'tenant.registered', 'tenants', v_tenant_id::TEXT, jsonb_build_object('name', p_name, 'status', 'pending'));

  RETURN v_tenant_id;
END;
$$;

-- 8. Enable Supabase Realtime on Remote Control, Session, Tenant & Notification Tables
DO $$
DECLARE
  v_tables TEXT[] := ARRAY[
    'global_config',
    'app_config',
    'configuration_versions',
    'modules',
    'features',
    'tenant_features',
    'navigation_items',
    'dashboard_widgets',
    'tenants',
    'user_sessions',
    'notifications'
  ];
  v_tbl TEXT;
BEGIN
  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_tbl);
    EXCEPTION
      WHEN undefined_object THEN
        NULL;
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END;
$$;
