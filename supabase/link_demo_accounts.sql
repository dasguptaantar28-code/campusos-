-- Link Demo Accounts to Green Valley School with full RBAC roles
DO $$
DECLARE
  v_tenant UUID := '11111111-1111-4111-8111-111111111111';
  v_role_teacher UUID;
  v_role_student UUID;
  v_role_parent UUID;

  v_teacher_uid UUID := '3a71bf9a-d4d3-4ff7-ad53-6721ef655ad6';
  v_student_uid UUID := '718b03ff-d5c6-4eac-955e-b683c0135f41';
  v_guardian_uid UUID := '017ec752-8593-4c0e-9a74-2db1d5dcc0d4';

  v_student_db_id UUID;
  v_class_g10 UUID;
BEGIN
  -- 1. Ensure Green Valley School tenant exists
  SELECT id INTO v_tenant FROM public.tenants WHERE id = '11111111-1111-4111-8111-111111111111' LIMIT 1;
  IF v_tenant IS NULL THEN
    INSERT INTO public.tenants (id, name, slug, code, institution_type, email, status)
    VALUES ('11111111-1111-4111-8111-111111111111', 'Green Valley School', 'green-valley-school', 'CMP-GVS01', 'school', 'admin@greenvalley.edu', 'active')
    RETURNING id INTO v_tenant;
  END IF;

  SELECT id INTO v_role_teacher FROM public.roles WHERE key = 'teacher' LIMIT 1;
  SELECT id INTO v_role_student FROM public.roles WHERE key = 'student' LIMIT 1;
  SELECT id INTO v_role_parent FROM public.roles WHERE key = 'parent' LIMIT 1;

  -- 2. Synchronize ALL auth.users into public.profiles to satisfy Foreign Keys
  INSERT INTO public.profiles (id, email, full_name)
  SELECT 
    u.id, 
    COALESCE(u.email, ''), 
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'User'), '@', 1))
  FROM auth.users u
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- 3. Set explicit profiles for demo accounts
  UPDATE public.profiles SET full_name = 'Prof. Kabir Ahmed' WHERE id = v_teacher_uid;
  UPDATE public.profiles SET full_name = 'Rahim Chowdhury' WHERE id = v_student_uid;
  UPDATE public.profiles SET full_name = 'Karim Chowdhury' WHERE id = v_guardian_uid;

  -- 4. Link Memberships for demo accounts
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
  VALUES
    (v_tenant, v_teacher_uid, v_role_teacher, 'active'),
    (v_tenant, v_student_uid, v_role_student, 'active'),
    (v_tenant, v_guardian_uid, v_role_parent, 'active')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    status = 'active',
    role_id = EXCLUDED.role_id;

  -- Also link any other registered users as student
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
  SELECT v_tenant, p.id, v_role_student, 'active'
  FROM public.profiles p
  WHERE p.id NOT IN (v_teacher_uid, v_guardian_uid)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  -- 5. Academic Records for Teacher (employee_code)
  INSERT INTO public.teachers (tenant_id, user_id, employee_code, full_name, email, designation, department)
  VALUES (v_tenant, v_teacher_uid, 'TCH-001', 'Prof. Kabir Ahmed', 'teacher.demo@campusos.edu', 'Senior Teacher', 'Science')
  ON CONFLICT (tenant_id, employee_code) DO NOTHING;

  -- Academic Records for Student (student_code, admission_number)
  SELECT id INTO v_class_g10 FROM public.classes WHERE tenant_id = v_tenant LIMIT 1;

  INSERT INTO public.students (tenant_id, user_id, class_id, student_code, admission_number, first_name, last_name, gender, status)
  VALUES (v_tenant, v_student_uid, v_class_g10, 'STD-2026-001', 'ADM-2026-001', 'Rahim', 'Chowdhury', 'male', 'active')
  ON CONFLICT (tenant_id, student_code) DO NOTHING
  RETURNING id INTO v_student_db_id;

  IF v_student_db_id IS NULL THEN
    SELECT id INTO v_student_db_id FROM public.students WHERE user_id = v_student_uid LIMIT 1;
  END IF;

  -- Academic Records for Guardian (guardian_user_id, guardian_name)
  IF v_student_db_id IS NOT NULL THEN
    INSERT INTO public.student_guardians (tenant_id, student_id, guardian_user_id, guardian_name, relationship, phone, email, is_primary)
    VALUES (v_tenant, v_student_db_id, v_guardian_uid, 'Karim Chowdhury', 'father', '+8801700000003', 'guardian.demo@campusos.edu', TRUE)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6. Auto-confirm all users in auth.users
  UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;
END;
$$;
