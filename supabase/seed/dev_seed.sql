-- ==============================================================================
-- CampusOS Development-Only Seed Data
-- WARNING: Do NOT run against production databases.
-- Production migrations only seed canonical plans, roles, permissions, and modules.
-- ==============================================================================

DO $$
DECLARE
  v_plan_pro UUID;
  v_plan_starter UUID;
  v_tenant_a UUID := '11111111-1111-4111-8111-111111111111';
  v_tenant_b UUID := '22222222-2222-4222-8222-222222222222';
  v_session_a UUID := '33333333-3333-4333-8333-333333333331';
  v_session_b UUID := '33333333-3333-4333-8333-333333333332';
  v_class_a1 UUID := '44444444-4444-4444-8444-444444444441';
  v_class_b1 UUID := '44444444-4444-4444-8444-444444444442';
BEGIN
  SELECT id INTO v_plan_pro FROM public.subscription_plans WHERE code = 'PROFESSIONAL' LIMIT 1;
  SELECT id INTO v_plan_starter FROM public.subscription_plans WHERE code = 'STARTER' LIMIT 1;

  -- Demo Tenant A: Green Valley School
  INSERT INTO public.tenants (id, name, slug, code, institution_type, email, phone, address, city, status, subscription_plan_id, approved_at)
  VALUES (
    v_tenant_a,
    'Green Valley School',
    'green-valley-school',
    'CMP-GVS01',
    'school',
    'admin@greenvalley.example.edu',
    '+8801700000001',
    '42 Emerald Avenue, Sector 7',
    'Dhaka',
    'active',
    v_plan_pro,
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Demo Tenant B: Crescent Science College (for cross-tenant isolation verification)
  INSERT INTO public.tenants (id, name, slug, code, institution_type, email, phone, address, city, status, subscription_plan_id, approved_at)
  VALUES (
    v_tenant_b,
    'Crescent Science College',
    'crescent-science-college',
    'CMP-CSC02',
    'college',
    'admin@crescent.example.edu',
    '+8801700000002',
    '88 Knowledge Park Road',
    'Chattogram',
    'active',
    v_plan_starter,
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (tenant_id, plan_id, status, billing_cycle)
  VALUES
    (v_tenant_a, v_plan_pro, 'active', 'annual'),
    (v_tenant_b, v_plan_starter, 'active', 'monthly')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.app_config (scope, tenant_id, theme_tokens, branding, version_number)
  VALUES
    ('tenant', v_tenant_a, '{"primary":"#16A34A","emerald":"#22C55E"}'::JSONB, '{"institutionName":"Green Valley School"}'::JSONB, 1),
    ('tenant', v_tenant_b, '{"primary":"#0EA5E9","emerald":"#38BDF8"}'::JSONB, '{"institutionName":"Crescent Science College"}'::JSONB, 1)
  ON CONFLICT DO NOTHING;

  -- Academic Sessions
  INSERT INTO public.academic_sessions (id, tenant_id, name, start_date, end_date, is_current)
  VALUES
    (v_session_a, v_tenant_a, '2026-2027', '2026-01-01', '2026-12-31', TRUE),
    (v_session_b, v_tenant_b, '2026-2027', '2026-01-01', '2026-12-31', TRUE)
  ON CONFLICT DO NOTHING;

  -- Classes
  INSERT INTO public.classes (id, tenant_id, name, code, numeric_level, capacity)
  VALUES
    (v_class_a1, v_tenant_a, 'Grade 10', 'G10', 10, 45),
    (v_class_b1, v_tenant_b, 'HSC Year 1', 'HSC1', 11, 60)
  ON CONFLICT DO NOTHING;

  -- Default Grading Rules for Tenant A
  INSERT INTO public.grading_rules (tenant_id, grade_label, min_percentage, max_percentage, gpa_point, remarks)
  VALUES
    (v_tenant_a, 'A+', 80, 100, 5.00, 'Outstanding'),
    (v_tenant_a, 'A', 70, 79.99, 4.00, 'Excellent'),
    (v_tenant_a, 'A-', 60, 69.99, 3.50, 'Very Good'),
    (v_tenant_a, 'B', 50, 59.99, 3.00, 'Good'),
    (v_tenant_a, 'C', 40, 49.99, 2.00, 'Satisfactory'),
    (v_tenant_a, 'D', 33, 39.99, 1.00, 'Pass'),
    (v_tenant_a, 'F', 0, 32.99, 0.00, 'Fail')
  ON CONFLICT DO NOTHING;

  -- Default Fee Categories for Tenant A
  INSERT INTO public.fee_categories (tenant_id, name, code, category_type, default_amount_cents, frequency)
  VALUES
    (v_tenant_a, 'Monthly Tuition Fee', 'TUITION_MONTHLY', 'tuition', 5000, 'monthly'),
    (v_tenant_a, 'Admission Fee', 'ADMISSION_ONE', 'admission', 25000, 'one_time'),
    (v_tenant_a, 'Term Examination Fee', 'EXAM_TERM', 'examination', 3000, 'term')
  ON CONFLICT DO NOTHING;
END;
$$;
