-- ==============================================================================
-- CampusOS — Super Admin & School Admin Activation Script
-- Grants Global Super Admin & Green Valley School Admin to admin@greenvalley.edu
-- ==============================================================================

DO $$
DECLARE
  v_tenant UUID := '11111111-1111-4111-8111-111111111111'; -- Green Valley School
  v_role_super_admin UUID;
  v_role_school_admin UUID;
  v_admin_uid UUID;
BEGIN
  -- 1. Find or resolve admin@greenvalley.edu
  SELECT id INTO v_admin_uid FROM auth.users WHERE email = 'admin@greenvalley.edu' LIMIT 1;
  
  -- If not found by email, try the registered UID
  IF v_admin_uid IS NULL THEN
    v_admin_uid := 'af6849d8-946c-4f6b-8d5f-fc05b0df129f';
  END IF;

  -- 2. Ensure profile exists
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_admin_uid, 'admin@greenvalley.edu', 'System Super Admin')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- 3. Resolve role IDs
  SELECT id INTO v_role_super_admin FROM public.roles WHERE key = 'super_admin' LIMIT 1;
  SELECT id INTO v_role_school_admin FROM public.roles WHERE key = 'school_admin' LIMIT 1;

  -- 4. Grant Global Platform Admin (Super Admin)
  INSERT INTO public.platform_admins (user_id, role_level, is_active)
  VALUES (v_admin_uid, 'super_admin', TRUE)
  ON CONFLICT (user_id) DO UPDATE SET
    role_level = 'super_admin',
    is_active = TRUE;

  -- 5. Grant School Admin membership in Green Valley School
  IF v_role_school_admin IS NOT NULL THEN
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
    VALUES (v_tenant, v_admin_uid, v_role_school_admin, 'active')
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET
      role_id = v_role_school_admin,
      status = 'active';
  END IF;

  -- 6. Also grant Super Admin privileges to any user with 'dasgupta'
  INSERT INTO public.platform_admins (user_id, role_level, is_active)
  SELECT u.id, 'super_admin', TRUE
  FROM auth.users u
  WHERE u.email LIKE '%dasgupta%'
  ON CONFLICT (user_id) DO UPDATE SET
    role_level = 'super_admin',
    is_active = TRUE;

  IF v_role_school_admin IS NOT NULL THEN
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
    SELECT v_tenant, u.id, v_role_school_admin, 'active'
    FROM auth.users u
    WHERE u.email LIKE '%dasgupta%'
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET
      role_id = v_role_school_admin,
      status = 'active';
  END IF;

  RAISE NOTICE 'Super Admin activated successfully for admin@greenvalley.edu (UID: %)', v_admin_uid;
END;
$$;
