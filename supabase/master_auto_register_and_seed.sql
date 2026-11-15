-- ==============================================================================
-- CampusOS — Universal Auto-Registration & Complete Academic Seed
-- One-time setup: Automates student signup forever and seeds rich academic data
-- ==============================================================================

-- 1. UNIVERSAL AUTO-CONFIRM & AUTO-LINK TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_tenant UUID;
  v_student_role UUID;
  v_default_class UUID;
  v_default_session UUID;
  v_default_section UUID;
  v_code TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Auto-confirm email immediately to avoid SMTP / rate-limit issues
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());

  -- 1. Create or update profile
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(COALESCE(NEW.email, 'Student'), '@', 1)),
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  -- 2. Find primary active tenant
  SELECT id INTO v_default_tenant FROM public.tenants WHERE status = 'active' ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO v_student_role FROM public.roles WHERE key = 'student' LIMIT 1;

  IF v_default_tenant IS NOT NULL AND v_student_role IS NOT NULL THEN
    -- 3. Automatically grant active student membership
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
    VALUES (v_default_tenant, NEW.id, v_student_role, 'active')
    ON CONFLICT (tenant_id, user_id) DO NOTHING;

    -- 4. Automatically create student academic record in Grade 10
    SELECT id INTO v_default_class FROM public.classes WHERE tenant_id = v_default_tenant LIMIT 1;
    SELECT id INTO v_default_session FROM public.academic_sessions WHERE tenant_id = v_default_tenant AND is_current = TRUE LIMIT 1;
    SELECT id INTO v_default_section FROM public.sections WHERE tenant_id = v_default_tenant LIMIT 1;

    v_code := 'STD-' || upper(substr(md5(random()::text), 1, 6));
    v_first_name := COALESCE(split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1), split_part(NEW.email, '@', 1));
    v_last_name := COALESCE(substr(NEW.raw_user_meta_data ->> 'full_name', length(v_first_name) + 2), 'Student');
    IF v_last_name = '' THEN v_last_name := 'Student'; END IF;

    INSERT INTO public.students (
      tenant_id, user_id, session_id, class_id, section_id, student_code, admission_number,
      first_name, last_name, gender, status, email
    )
    VALUES (
      v_default_tenant,
      NEW.id,
      v_default_session,
      v_default_class,
      v_default_section,
      v_code,
      'ADM-' || v_code,
      v_first_name,
      v_last_name,
      'male',
      'active',
      NEW.email
    )
    ON CONFLICT (tenant_id, student_code) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_confirm_new_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_new_user
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_new_user();

-- Auto-confirm any existing users
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;


-- 2. ACADEMIC SEED DATA & DEMO ACCOUNTS LINKAGE
DO $$
DECLARE
  v_tenant UUID := '11111111-1111-4111-8111-111111111111';
  v_role_teacher UUID;
  v_role_student UUID;
  v_role_parent UUID;

  v_teacher_uid UUID := '3a71bf9a-d4d3-4ff7-ad53-6721ef655ad6';
  v_student_uid UUID := '718b03ff-d5c6-4eac-955e-b683c0135f41';
  v_guardian_uid UUID := '017ec752-8593-4c0e-9a74-2db1d5dcc0d4';

  v_session UUID := '33333333-3333-4333-8333-333333333331';
  v_class_g10 UUID := '44444444-4444-4444-8444-444444444441';
  v_section_a UUID := '55555555-5555-4555-8555-555555555551';

  v_sub_math UUID := '66666666-6666-4666-8666-666666666661';
  v_sub_phy UUID := '66666666-6666-4666-8666-666666666662';
  v_sub_chem UUID := '66666666-6666-4666-8666-666666666663';
  v_sub_eng UUID := '66666666-6666-4666-8666-666666666664';
  v_sub_ict UUID := '66666666-6666-4666-8666-666666666665';
  v_sub_bio UUID := '66666666-6666-4666-8666-666666666666';

  v_teacher_id UUID;
  v_student_id UUID;
  v_guardian_id UUID;

  v_exam_mid UUID := '77777777-7777-4777-8777-777777777771';
  v_exam_fin UUID := '77777777-7777-4777-8777-777777777772';

  v_es_math UUID := '88888888-8888-4888-8888-888888888881';
  v_es_phy UUID := '88888888-8888-4888-8888-888888888882';
  v_es_chem UUID := '88888888-8888-4888-8888-888888888883';
  v_es_eng UUID := '88888888-8888-4888-8888-888888888884';
  v_es_ict UUID := '88888888-8888-4888-8888-888888888885';
  v_es_bio UUID := '88888888-8888-4888-8888-888888888886';

  v_result_id UUID := '99999999-9999-4999-8999-999999999991';
  v_fee_cat_tuition UUID;
  v_fee_cat_exam UUID;
BEGIN
  -- A. Ensure Tenant
  INSERT INTO public.tenants (id, name, slug, code, institution_type, email, phone, city, status)
  VALUES (v_tenant, 'Green Valley School', 'green-valley-school', 'CMP-GVS01', 'school', 'admin@greenvalley.edu', '+8801700000001', 'Dhaka', 'active')
  ON CONFLICT (id) DO UPDATE SET status = 'active';

  -- B. Resolve Roles
  SELECT id INTO v_role_teacher FROM public.roles WHERE key = 'teacher' LIMIT 1;
  SELECT id INTO v_role_student FROM public.roles WHERE key = 'student' LIMIT 1;
  SELECT id INTO v_role_parent FROM public.roles WHERE key = 'parent' LIMIT 1;

  -- C. Sync Profiles for ALL Users
  INSERT INTO public.profiles (id, email, full_name)
  SELECT 
    u.id, 
    COALESCE(u.email, ''), 
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'User'), '@', 1))
  FROM auth.users u
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;

  UPDATE public.profiles SET full_name = 'Prof. Kabir Ahmed' WHERE id = v_teacher_uid;
  UPDATE public.profiles SET full_name = 'Rahim Chowdhury' WHERE id = v_student_uid;
  UPDATE public.profiles SET full_name = 'Karim Chowdhury' WHERE id = v_guardian_uid;

  -- D. Link Memberships for Demo Accounts & Any Self-Registered Users
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
  VALUES
    (v_tenant, v_teacher_uid, v_role_teacher, 'active'),
    (v_tenant, v_student_uid, v_role_student, 'active'),
    (v_tenant, v_guardian_uid, v_role_parent, 'active')
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET
    status = 'active',
    role_id = EXCLUDED.role_id;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status)
  SELECT v_tenant, p.id, v_role_student, 'active'
  FROM public.profiles p
  WHERE p.id NOT IN (v_teacher_uid, v_guardian_uid)
  ON CONFLICT (tenant_id, user_id) DO NOTHING;

  -- E. Academic Session, Class & Section
  INSERT INTO public.academic_sessions (id, tenant_id, name, start_date, end_date, is_current)
  VALUES (v_session, v_tenant, '2026-2027', '2026-01-01', '2026-12-31', TRUE)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.classes (id, tenant_id, name, code, numeric_level, capacity)
  VALUES (v_class_g10, v_tenant, 'Grade 10', 'G10', 10, 45)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.sections (id, tenant_id, class_id, name, room_number, capacity)
  VALUES (v_section_a, v_tenant, v_class_g10, 'Section A (Newton)', 'Room 301', 40)
  ON CONFLICT (tenant_id, class_id, name) DO NOTHING;

  -- F. Subjects
  INSERT INTO public.subjects (id, tenant_id, name, code, subject_type, default_max_marks, default_pass_marks)
  VALUES
    (v_sub_math, v_tenant, 'Mathematics', 'MATH-101', 'core', 100, 33),
    (v_sub_phy, v_tenant, 'Physics', 'PHY-102', 'core', 100, 33),
    (v_sub_chem, v_tenant, 'Chemistry', 'CHEM-103', 'core', 100, 33),
    (v_sub_eng, v_tenant, 'English Literature', 'ENG-104', 'core', 100, 33),
    (v_sub_ict, v_tenant, 'Information Technology', 'ICT-105', 'lab', 100, 33),
    (v_sub_bio, v_tenant, 'Biology', 'BIO-106', 'core', 100, 33)
  ON CONFLICT (tenant_id, code) DO NOTHING;

  -- G. Teacher Entity
  INSERT INTO public.teachers (tenant_id, user_id, employee_code, full_name, email, designation, department)
  VALUES (v_tenant, v_teacher_uid, 'TCH-001', 'Prof. Kabir Ahmed', 'teacher.demo@campusos.edu', 'Senior Science Faculty', 'Science & Mathematics')
  ON CONFLICT (tenant_id, employee_code) DO UPDATE SET full_name = EXCLUDED.full_name
  RETURNING id INTO v_teacher_id;
  IF v_teacher_id IS NULL THEN SELECT id INTO v_teacher_id FROM public.teachers WHERE tenant_id = v_tenant AND employee_code = 'TCH-001'; END IF;

  -- H. Class Subjects (Faculty assignments)
  INSERT INTO public.class_subjects (tenant_id, session_id, class_id, section_id, subject_id, teacher_id)
  VALUES
    (v_tenant, v_session, v_class_g10, v_section_a, v_sub_math, v_teacher_id),
    (v_tenant, v_session, v_class_g10, v_section_a, v_sub_phy, v_teacher_id),
    (v_tenant, v_session, v_class_g10, v_section_a, v_sub_chem, v_teacher_id),
    (v_tenant, v_session, v_class_g10, v_section_a, v_sub_eng, v_teacher_id),
    (v_tenant, v_session, v_class_g10, v_section_a, v_sub_ict, v_teacher_id),
    (v_tenant, v_session, v_class_g10, v_section_a, v_sub_bio, v_teacher_id)
  ON CONFLICT DO NOTHING;

  -- I. Student Entity
  INSERT INTO public.students (tenant_id, user_id, session_id, class_id, section_id, student_code, admission_number, first_name, last_name, gender, status, email)
  VALUES (v_tenant, v_student_uid, v_session, v_class_g10, v_section_a, 'STD-2026-001', 'ADM-2026-001', 'Rahim', 'Chowdhury', 'male', 'active', 'student.demo@campusos.edu')
  ON CONFLICT (tenant_id, student_code) DO UPDATE SET status = 'active'
  RETURNING id INTO v_student_id;
  IF v_student_id IS NULL THEN SELECT id INTO v_student_id FROM public.students WHERE tenant_id = v_tenant AND student_code = 'STD-2026-001'; END IF;

  -- Also ensure any user who signed up with dasguptaantar has student record
  INSERT INTO public.students (tenant_id, user_id, session_id, class_id, section_id, student_code, admission_number, first_name, last_name, gender, status, email)
  SELECT v_tenant, u.id, v_session, v_class_g10, v_section_a, 'STD-2026-002', 'ADM-2026-002', 'Antar', 'Dasgupta', 'male', 'active', u.email
  FROM auth.users u
  WHERE u.email LIKE '%dasgupta%'
  ON CONFLICT (tenant_id, student_code) DO NOTHING;

  -- J. Guardian Entity linked to Rahim
  INSERT INTO public.student_guardians (tenant_id, student_id, guardian_user_id, guardian_name, relationship, phone, email, is_primary)
  VALUES (v_tenant, v_student_id, v_guardian_uid, 'Karim Chowdhury', 'father', '+8801700000003', 'guardian.demo@campusos.edu', TRUE)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_guardian_id;
  IF v_guardian_id IS NULL THEN SELECT id INTO v_guardian_id FROM public.student_guardians WHERE tenant_id = v_tenant AND student_id = v_student_id; END IF;

  -- K. Timetables / Routine (Sunday to Thursday)
  FOR day_idx IN 0..4 LOOP
    INSERT INTO public.timetables (tenant_id, session_id, class_id, section_id, subject_id, teacher_id, day_of_week, start_time, end_time, room_number)
    VALUES
      (v_tenant, v_session, v_class_g10, v_section_a, v_sub_math, v_teacher_id, day_idx, '08:30:00', '09:20:00', 'Room 301'),
      (v_tenant, v_session, v_class_g10, v_section_a, v_sub_phy, v_teacher_id, day_idx, '09:25:00', '10:15:00', 'Science Lab 1'),
      (v_tenant, v_session, v_class_g10, v_section_a, v_sub_chem, v_teacher_id, day_idx, '10:20:00', '11:10:00', 'Chemistry Lab'),
      (v_tenant, v_session, v_class_g10, v_section_a, v_sub_eng, v_teacher_id, day_idx, '11:30:00', '12:20:00', 'Room 301'),
      (v_tenant, v_session, v_class_g10, v_section_a, v_sub_ict, v_teacher_id, day_idx, '12:25:00', '13:15:00', 'IT Lab A')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- L. Examinations
  INSERT INTO public.exams (id, tenant_id, session_id, name, category, start_date, end_date, status)
  VALUES
    (v_exam_mid, v_tenant, v_session, 'Term 1 Midterm Examination 2026', 'midterm', '2026-03-10', '2026-03-25', 'published'),
    (v_exam_fin, v_tenant, v_session, 'Annual Final Examination 2026', 'final', '2026-11-15', '2026-11-30', 'scheduled')
  ON CONFLICT (id) DO NOTHING;

  -- Exam Subjects
  INSERT INTO public.exam_subjects (id, tenant_id, exam_id, class_id, subject_id, exam_date, max_marks, pass_marks)
  VALUES
    (v_es_math, v_tenant, v_exam_mid, v_class_g10, v_sub_math, '2026-03-10', 100, 33),
    (v_es_phy, v_tenant, v_exam_mid, v_class_g10, v_sub_phy, '2026-03-12', 100, 33),
    (v_es_chem, v_tenant, v_exam_mid, v_class_g10, v_sub_chem, '2026-03-15', 100, 33),
    (v_es_eng, v_tenant, v_exam_mid, v_class_g10, v_sub_eng, '2026-03-18', 100, 33),
    (v_es_ict, v_tenant, v_exam_mid, v_class_g10, v_sub_ict, '2026-03-20', 100, 33),
    (v_es_bio, v_tenant, v_exam_mid, v_class_g10, v_sub_bio, '2026-03-22', 100, 33)
  ON CONFLICT (tenant_id, exam_id, class_id, subject_id) DO NOTHING;

  -- M. Student Marks
  INSERT INTO public.marks (tenant_id, exam_id, exam_subject_id, student_id, marks_obtained, remarks)
  VALUES
    (v_tenant, v_exam_mid, v_es_math, v_student_id, 94.00, 'Excellent performance in Algebra & Trigonometry'),
    (v_tenant, v_exam_mid, v_es_phy, v_student_id, 88.50, 'Strong understanding of Mechanics'),
    (v_tenant, v_exam_mid, v_es_chem, v_student_id, 85.00, 'Good laboratory practical results'),
    (v_tenant, v_exam_mid, v_es_eng, v_student_id, 91.00, 'Superb creative writing & grammar'),
    (v_tenant, v_exam_mid, v_es_ict, v_student_id, 98.00, 'Outstanding programming & algorithms score'),
    (v_tenant, v_exam_mid, v_es_bio, v_student_id, 89.00, 'Clear diagram work & theoretical concepts')
  ON CONFLICT (tenant_id, exam_subject_id, student_id) DO NOTHING;

  -- N. Overall Exam Results (approved_by matches CHECK constraint)
  INSERT INTO public.results (
    id, tenant_id, exam_id, student_id, class_id,
    total_marks, max_total_marks, percentage, gpa, grade, rank_position, is_passed, is_published,
    approved_by, published_by, published_at
  )
  VALUES (
    v_result_id, v_tenant, v_exam_mid, v_student_id, v_class_g10,
    545.50, 600.00, 90.92, 5.00, 'A+', 1, TRUE, TRUE,
    v_teacher_uid, v_teacher_uid, NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- O. Student Attendance (Recent school days)
  FOR i IN 1..10 LOOP
    INSERT INTO public.attendance (tenant_id, session_id, student_id, class_id, section_id, attendance_date, status, remarks)
    VALUES (v_tenant, v_session, v_student_id, v_class_g10, v_section_a, CURRENT_DATE - i, CASE WHEN i = 4 THEN 'late' ELSE 'present' END, 'On-time biometric check-in')
    ON CONFLICT (tenant_id, student_id, attendance_date) DO NOTHING;
  END LOOP;

  -- P. Teacher Attendance
  FOR i IN 1..10 LOOP
    INSERT INTO public.teacher_attendance (tenant_id, teacher_id, attendance_date, status, check_in_at, check_out_at, remarks)
    VALUES (v_tenant, v_teacher_id, CURRENT_DATE - i, 'present', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '1 hour', 'Regular school duty')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Q. Guardian Attendance
  IF v_guardian_id IS NOT NULL THEN
    INSERT INTO public.guardian_attendance (tenant_id, guardian_id, student_id, attendance_date, visit_purpose, status, remarks)
    VALUES
      (v_tenant, v_guardian_id, v_student_id, CURRENT_DATE - 2, 'ptm', 'present', 'Attended Grade 10 Parent-Teacher Meeting'),
      (v_tenant, v_guardian_id, v_student_id, CURRENT_DATE - 7, 'pickup', 'present', 'After-school pick up')
    ON CONFLICT DO NOTHING;
  END IF;

  -- R. Homework
  INSERT INTO public.homework (tenant_id, class_id, section_id, subject_id, teacher_id, title, description, due_date)
  VALUES
    (v_tenant, v_class_g10, v_section_a, v_sub_math, v_teacher_id, 'Calculus & Quadratic Equations Exercise 4.2', 'Complete problems 1 through 15 from textbook page 112.', CURRENT_DATE + 3),
    (v_tenant, v_class_g10, v_section_a, v_sub_phy, v_teacher_id, 'Electromagnetic Induction Lab Writeup', 'Document lab findings with diagrams and resistance formulas.', CURRENT_DATE + 5),
    (v_tenant, v_class_g10, v_section_a, v_sub_eng, v_teacher_id, 'Shakespeare Sonnet 18 Critical Analysis', 'Write a 500-word essay analyzing metaphorical imagery.', CURRENT_DATE + 7)
  ON CONFLICT DO NOTHING;

  -- S. Assignments
  INSERT INTO public.assignments (tenant_id, class_id, section_id, subject_id, teacher_id, title, description, max_score, due_at)
  VALUES
    (v_tenant, v_class_g10, v_section_a, v_sub_ict, v_teacher_id, 'Python Data Structures & Sorting Project', 'Submit a clean GitHub repository link with bubble and merge sort implementations.', 100.00, NOW() + INTERVAL '7 days'),
    (v_tenant, v_class_g10, v_section_a, v_sub_bio, v_teacher_id, 'Cellular Respiration Laboratory Report', 'Diagram the Krebs cycle and outline ATP synthesis balances.', 50.00, NOW() + INTERVAL '10 days')
  ON CONFLICT DO NOTHING;

  -- T. Student Fees & Dues
  INSERT INTO public.fee_categories (tenant_id, name, code, category_type, default_amount_cents, frequency, is_active)
  VALUES
    (v_tenant, 'Monthly Tuition Fee', 'TUITION_MONTHLY', 'tuition', 500000, 'monthly', TRUE),
    (v_tenant, 'Term Examination Fee', 'EXAM_TERM', 'examination', 300000, 'term', TRUE)
  ON CONFLICT (tenant_id, code) DO NOTHING;

  SELECT id INTO v_fee_cat_tuition FROM public.fee_categories WHERE tenant_id = v_tenant AND code = 'TUITION_MONTHLY' LIMIT 1;
  SELECT id INTO v_fee_cat_exam FROM public.fee_categories WHERE tenant_id = v_tenant AND code = 'EXAM_TERM' LIMIT 1;

  INSERT INTO public.student_fees (tenant_id, student_id, session_id, fee_category_id, title, gross_amount_cents, discount_amount_cents, paid_amount_cents, status, due_date)
  VALUES
    (v_tenant, v_student_id, v_session, v_fee_cat_tuition, 'Monthly Tuition Fee - November 2026', 5000, 0, 5000, 'paid', CURRENT_DATE + 10),
    (v_tenant, v_student_id, v_session, v_fee_cat_exam, 'Term 1 Examination Registration Fee', 3000, 0, 3000, 'paid', CURRENT_DATE - 5),
    (v_tenant, v_student_id, v_session, v_fee_cat_tuition, 'Science Lab & ICT Development Fee', 2500, 0, 0, 'unpaid', CURRENT_DATE + 15)
  ON CONFLICT DO NOTHING;

  -- U. Campus Notices & Announcements
  INSERT INTO public.notices (tenant_id, title, body, target_roles, is_pinned, published_at)
  VALUES
    (v_tenant, 'Annual Inter-Campus Science Fair 2026', 'Green Valley School invites all Grade 9 & 10 students to submit STEM project proposals by end of next week.', ARRAY['student','teacher','parent'], TRUE, NOW()),
    (v_tenant, 'Term 1 Parent-Teacher Conference (PTM)', 'Parents and guardians are cordially invited to review academic report cards and routine progression.', ARRAY['teacher','parent'], TRUE, NOW()),
    (v_tenant, 'Class Routine & Laboratory Guidelines', 'Students must bring formal laboratory aprons for Chemistry and Physics practical sessions starting Sunday.', ARRAY['student','teacher'], FALSE, NOW())
  ON CONFLICT DO NOTHING;

  -- V. Campus Events
  INSERT INTO public.events (tenant_id, title, description, event_type, start_at, end_at, location, created_by)
  VALUES
    (v_tenant, 'Annual Science Fair & Exhibition 2026', 'Inter-campus STEM fair with interactive science models and project demos.', 'academic', NOW() + INTERVAL '5 days', NOW() + INTERVAL '6 days', 'Main Auditorium', v_teacher_uid),
    (v_tenant, 'Parent-Teacher Conference (PTM)', 'Semester 1 academic progression and report card discussion.', 'meeting', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 4 hours', 'Campus Hall Room 102', v_teacher_uid)
  ON CONFLICT DO NOTHING;

  -- W. Learning Materials
  INSERT INTO public.learning_materials (tenant_id, class_id, subject_id, uploaded_by, title, description, material_type, file_url)
  VALUES
    (v_tenant, v_class_g10, v_sub_phy, v_teacher_uid, 'Physics Chapter 4: Waves & Optics Lecture Slides', 'Comprehensive lecture notes and solved board problems for 2026 examinations.', 'slides', 'https://example.edu/materials/physics-ch4.pdf'),
    (v_tenant, v_class_g10, v_sub_math, v_teacher_uid, 'Trigonometry Formula Sheet & Practice Bank', 'Official reference guide for all trigonometric identities and formulas.', 'document', 'https://example.edu/materials/math-trig.pdf')
  ON CONFLICT DO NOTHING;

END;
$$;
