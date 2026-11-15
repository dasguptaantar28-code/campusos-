import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createMigratedTestDb, TestDbContext } from './helpers/pglite-runner.js';

describe('CampusOS Multi-Tenant RLS Isolation, Quotas & Remote Config Acceptance Tests (A-E)', () => {
  let ctx: TestDbContext;

  const SUPER_ADMIN_ID = 'aaaaaaaa-0000-4000-8000-000000000001';
  const TENANT_A_ADMIN_ID = 'aaaaaaaa-0000-4000-8000-000000000002';
  const TENANT_B_ADMIN_ID = 'aaaaaaaa-0000-4000-8000-000000000003';
  const TEACHER_A_ID = 'aaaaaaaa-0000-4000-8000-000000000004';
  const PARENT_A_ID = 'aaaaaaaa-0000-4000-8000-000000000005';
  const STUDENT_A1_USER_ID = 'aaaaaaaa-0000-4000-8000-000000000006';

  const TENANT_A_ID = '11111111-1111-4111-8111-111111111111';
  const TENANT_B_ID = '22222222-2222-4222-8222-222222222222';
  const CLASS_A_ASSIGNED_ID = '44444444-4444-4444-8444-444444444441';
  const CLASS_A_OTHER_ID = '44444444-4444-4444-8444-444444444449';
  const SUBJECT_MATH_ID = '55555555-5555-4555-8555-555555555551';
  const STUDENT_A1_ID = '66666666-6666-4666-8666-666666666661';
  const STUDENT_A2_ID = '66666666-6666-4666-8666-666666666662';
  const STUDENT_B1_ID = '66666666-6666-4666-8666-666666666663';
  const TEACHER_A_REC_ID = '77777777-7777-4777-8777-777777777771';
  const EXAM_A_ID = '88888888-8888-4888-8888-888888888881';
  const EXAM_SUBJ_A_ID = '99999999-9999-4999-8999-999999999991';

  beforeAll(async () => {
    ctx = await createMigratedTestDb();
    const { db } = ctx;

    // Create auth users (trigger auto-creates profiles)
    const users = [
      [SUPER_ADMIN_ID, 'super@campusos.test', 'Platform Super Admin'],
      [TENANT_A_ADMIN_ID, 'admin.a@greenvalley.test', 'Tenant A Admin'],
      [TENANT_B_ADMIN_ID, 'admin.b@crescent.test', 'Tenant B Admin'],
      [TEACHER_A_ID, 'teacher.a@greenvalley.test', 'Teacher Alpha'],
      [PARENT_A_ID, 'parent.a@greenvalley.test', 'Parent Alpha'],
      [STUDENT_A1_USER_ID, 'student.a1@greenvalley.test', 'Student A1'],
    ];
    for (const [id, email, name] of users) {
      await db.query(
        `INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, jsonb_build_object('full_name', $3::text))`,
        [id, email, name]
      );
    }

    await db.query(`INSERT INTO public.platform_admins (user_id) VALUES ($1)`, [SUPER_ADMIN_ID]);

    const { rows: proPlan } = await db.query(`SELECT id FROM public.subscription_plans WHERE code = 'PROFESSIONAL'`);
    const { rows: freePlan } = await db.query(`SELECT id FROM public.subscription_plans WHERE code = 'FREE'`);

    await db.query(
      `INSERT INTO public.tenants (id, name, slug, code, status, subscription_plan_id) VALUES
       ($1, 'Green Valley School', 'green-valley', 'CMP-GVS', 'active', $3),
       ($2, 'Crescent College', 'crescent', 'CMP-CSC', 'active', $4)`,
      [TENANT_A_ID, TENANT_B_ID, proPlan[0].id, freePlan[0].id]
    );

    const { rows: roles } = await db.query(`SELECT id, key FROM public.roles WHERE tenant_id IS NULL`);
    const roleMap = Object.fromEntries(roles.map((r: any) => [r.key, r.id]));

    await db.query(
      `INSERT INTO public.tenant_memberships (tenant_id, user_id, role_id, status) VALUES
       ($1, $2, $5, 'active'),
       ($3, $4, $5, 'active'),
       ($1, $6, $7, 'active'),
       ($1, $8, $9, 'active'),
       ($1, $10, $11, 'active')`,
      [
        TENANT_A_ID,
        TENANT_A_ADMIN_ID,
        TENANT_B_ID,
        TENANT_B_ADMIN_ID,
        roleMap.school_admin,
        TEACHER_A_ID,
        roleMap.teacher,
        PARENT_A_ID,
        roleMap.parent,
        STUDENT_A1_USER_ID,
        roleMap.student,
      ]
    );

    await db.query(
      `INSERT INTO public.classes (id, tenant_id, name, code, numeric_level) VALUES
       ($1, $3, 'Grade 10', 'G10', 10),
       ($2, $3, 'Grade 9', 'G9', 9)`,
      [CLASS_A_ASSIGNED_ID, CLASS_A_OTHER_ID, TENANT_A_ID]
    );

    await db.query(
      `INSERT INTO public.subjects (id, tenant_id, name, code) VALUES ($1, $2, 'Mathematics', 'MATH101')`,
      [SUBJECT_MATH_ID, TENANT_A_ID]
    );

    await db.query(
      `INSERT INTO public.teachers (id, tenant_id, user_id, employee_code, full_name) VALUES
       ($1, $2, $3, 'TCH-A1', 'Teacher Alpha')`,
      [TEACHER_A_REC_ID, TENANT_A_ID, TEACHER_A_ID]
    );

    await db.query(
      `INSERT INTO public.class_subjects (tenant_id, class_id, subject_id, teacher_id) VALUES ($1, $2, $3, $4)`,
      [TENANT_A_ID, CLASS_A_ASSIGNED_ID, SUBJECT_MATH_ID, TEACHER_A_REC_ID]
    );

    await db.query(
      `INSERT INTO public.students (id, tenant_id, user_id, student_code, admission_number, first_name, last_name, class_id) VALUES
       ($1, $4, $7, 'STU-A1', 'ADM-A1', 'Amina', 'Rahman', $5),
       ($2, $4, NULL, 'STU-A2', 'ADM-A2', 'Tariq', 'Hasan', $6),
       ($3, $8, NULL, 'STU-B1', 'ADM-B1', 'Zain', 'Karim', NULL)`,
      [STUDENT_A1_ID, STUDENT_A2_ID, STUDENT_B1_ID, TENANT_A_ID, CLASS_A_ASSIGNED_ID, CLASS_A_OTHER_ID, STUDENT_A1_USER_ID, TENANT_B_ID]
    );

    await db.query(
      `INSERT INTO public.student_guardians (tenant_id, student_id, guardian_user_id, guardian_name, relationship, phone) VALUES
       ($1, $2, $3, 'Parent Alpha', 'mother', '+8801711111111')`,
      [TENANT_A_ID, STUDENT_A1_ID, PARENT_A_ID]
    );

    await db.query(
      `INSERT INTO public.grading_rules (tenant_id, grade_label, min_percentage, max_percentage, gpa_point) VALUES
       ($1, 'A+', 80, 100, 5.00), ($1, 'A', 70, 79.99, 4.00), ($1, 'F', 0, 32.99, 0.00)`,
      [TENANT_A_ID]
    );

    await db.query(
      `INSERT INTO public.exams (id, tenant_id, name, category, status) VALUES ($1, $2, 'Midterm 2026', 'midterm', 'marks_entry')`,
      [EXAM_A_ID, TENANT_A_ID]
    );

    await db.query(
      `INSERT INTO public.exam_subjects (id, tenant_id, exam_id, class_id, subject_id, max_marks, pass_marks) VALUES
       ($1, $2, $3, $4, $5, 100, 33)`,
      [EXAM_SUBJ_A_ID, TENANT_A_ID, EXAM_A_ID, CLASS_A_ASSIGNED_ID, SUBJECT_MATH_ID]
    );
  });

  afterAll(async () => {
    if (ctx?.db) {
      await ctx.db.close();
    }
  });

  it('blocks cross-tenant student reads and writes (Negative Security Test)', async () => {
    const tenantBReadsTenantA = await ctx.asUser(TENANT_B_ADMIN_ID, (q) =>
      q(`SELECT id FROM public.students WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(tenantBReadsTenantA.rows).toHaveLength(0);

    await expect(
      ctx.asUser(TENANT_B_ADMIN_ID, (q) =>
        q(
          `INSERT INTO public.students (tenant_id, student_code, admission_number, first_name, last_name)
           VALUES ($1, 'HACK-1', 'HACK-ADM', 'Rogue', 'Student')`,
          [TENANT_A_ID]
        )
      )
    ).rejects.toThrow();

    const tenantBReadsOwn = await ctx.asUser(TENANT_B_ADMIN_ID, (q) =>
      q(`SELECT student_code FROM public.students WHERE tenant_id = $1`, [TENANT_B_ID])
    );
    expect(tenantBReadsOwn.rows.map((r) => r.student_code)).toEqual(['STU-B1']);
  });

  it('restricts parent portal exclusively to linked children and teachers to assigned classes', async () => {
    const parentVisibleStudents = await ctx.asUser(PARENT_A_ID, (q) =>
      q(`SELECT id, student_code FROM public.students WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(parentVisibleStudents.rows.map((r) => r.student_code)).toEqual(['STU-A1']);

    const teacherVisibleStudents = await ctx.asUser(TEACHER_A_ID, (q) =>
      q(`SELECT student_code FROM public.students WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(teacherVisibleStudents.rows.map((r) => r.student_code)).toEqual(['STU-A1']);
  });

  it('prevents duplicate attendance and validates exam marks & result approval workflow', async () => {
    await ctx.asUser(TEACHER_A_ID, (q) =>
      q(
        `INSERT INTO public.attendance (tenant_id, student_id, class_id, attendance_date, status, marked_by)
         VALUES ($1, $2, $3, '2026-11-12', 'present', $4)`,
        [TENANT_A_ID, STUDENT_A1_ID, CLASS_A_ASSIGNED_ID, TEACHER_A_ID]
      )
    );

    await expect(
      ctx.asUser(TEACHER_A_ID, (q) =>
        q(
          `INSERT INTO public.attendance (tenant_id, student_id, class_id, attendance_date, status, marked_by)
           VALUES ($1, $2, $3, '2026-11-12', 'absent', $4)`,
          [TENANT_A_ID, STUDENT_A1_ID, CLASS_A_ASSIGNED_ID, TEACHER_A_ID]
        )
      )
    ).rejects.toThrow();

    // Exceeding max_marks (100) must fail
    await expect(
      ctx.asUser(TEACHER_A_ID, (q) =>
        q(
          `INSERT INTO public.marks (tenant_id, exam_id, exam_subject_id, student_id, marks_obtained, entered_by)
           VALUES ($1, $2, $3, $4, 105, $5)`,
          [TENANT_A_ID, EXAM_A_ID, EXAM_SUBJ_A_ID, STUDENT_A1_ID, TEACHER_A_ID]
        )
      )
    ).rejects.toThrow(/exceeds exam subject max_marks/);

    // Valid marks entry -> calculate -> parent cannot view unpublished -> approve -> parent can view
    await ctx.asUser(TEACHER_A_ID, (q) =>
      q(
        `INSERT INTO public.marks (tenant_id, exam_id, exam_subject_id, student_id, marks_obtained, entered_by)
         VALUES ($1, $2, $3, $4, 88, $5)`,
        [TENANT_A_ID, EXAM_A_ID, EXAM_SUBJ_A_ID, STUDENT_A1_ID, TEACHER_A_ID]
      )
    );

    await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.calculate_exam_results($1, $2)`, [TENANT_A_ID, EXAM_A_ID])
    );

    const parentUnpublished = await ctx.asUser(PARENT_A_ID, (q) =>
      q(`SELECT * FROM public.results WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(parentUnpublished.rows).toHaveLength(0);

    await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.approve_and_publish_exam_results($1, $2)`, [TENANT_A_ID, EXAM_A_ID])
    );

    const parentPublished = await ctx.asUser(PARENT_A_ID, (q) =>
      q(`SELECT grade, gpa, is_published FROM public.results WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(parentPublished.rows[0]).toMatchObject({ grade: 'A+', is_published: true });
  });

  it('ACCEPTANCE TEST A: Disabling Attendance module removes it from resolved config and blocks backend access', async () => {
    const beforeCfg = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'mobile') AS cfg`, [TENANT_A_ID])
    );
    const beforeModules = beforeCfg.rows[0].cfg.modules as Array<{ key: string; enabled: boolean }>;
    expect(beforeModules.find((m) => m.key === 'attendance')?.enabled).toBe(true);

    // Super Admin disables attendance globally
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`UPDATE public.modules SET is_globally_enabled = FALSE WHERE key = 'attendance'`)
    );

    const afterCfg = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'mobile') AS cfg`, [TENANT_A_ID])
    );
    const afterModules = afterCfg.rows[0].cfg.modules as Array<{ key: string; enabled: boolean }>;
    const afterNav = afterCfg.rows[0].cfg.navigation as Array<{ module_key: string }>;
    expect(afterModules.find((m) => m.key === 'attendance')?.enabled).toBe(false);
    expect(afterNav.some((n) => n.module_key === 'attendance')).toBe(false);

    // Direct backend RLS query on attendance must now return 0 rows and reject writes
    const directRead = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT id FROM public.attendance WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(directRead.rows).toHaveLength(0);

    // Restore for subsequent tests
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`UPDATE public.modules SET is_globally_enabled = TRUE WHERE key = 'attendance'`)
    );
  });

  it('ACCEPTANCE TEST B: Changing application theme propagates via resolve_effective_config', async () => {
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(
        `UPDATE public.app_config SET theme_tokens = jsonb_set(theme_tokens, '{primary}', '"#059669"')
         WHERE scope = 'global' AND tenant_id IS NULL`
      )
    );
    await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`UPDATE public.tenants SET branding_json = '{"primary":"#059669","emerald":"#10B981"}'::jsonb WHERE id = $1`, [TENANT_A_ID])
    );

    const webCfg = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'web') AS cfg`, [TENANT_A_ID])
    );
    const mobileCfg = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'mobile') AS cfg`, [TENANT_A_ID])
    );

    expect(webCfg.rows[0].cfg.theme.primary).toBe('#059669');
    expect(mobileCfg.rows[0].cfg.theme.primary).toBe('#059669');
  });

  it('ACCEPTANCE TEST C: Creating a configurable navigation item displays it in authorized web & mobile payloads', async () => {
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(
        `INSERT INTO public.navigation_items (scope, module_key, label, icon, route_path, target_type, target_roles, platforms, sort_order, is_visible, is_custom)
         VALUES ('global', 'custom_scholarship', 'Scholarship Portal', 'Award', '/custom/scholarships', 'custom_screen', ARRAY['school_admin','student','parent'], ARRAY['web','mobile'], 260, TRUE, TRUE)`
      )
    );

    const studentMobile = await ctx.asUser(STUDENT_A1_USER_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'mobile') AS cfg`, [TENANT_A_ID])
    );
    const navLabels = (studentMobile.rows[0].cfg.navigation as Array<{ label: string }>).map((n) => n.label);
    expect(navLabels).toContain('Scholarship Portal');
  });

  it('ACCEPTANCE TEST D: Suspending a tenant immediately locks out authorized tenant users', async () => {
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`UPDATE public.tenants SET status = 'suspended', suspended_reason = 'Billing overdue' WHERE id = $1`, [TENANT_A_ID])
    );

    const suspendedCfg = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'web') AS cfg`, [TENANT_A_ID])
    );
    expect(suspendedCfg.rows[0].cfg.authorized).toBe(false);
    expect(suspendedCfg.rows[0].cfg.tenant_status).toBe('suspended');

    const blockedRead = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT id FROM public.students WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(blockedRead.rows).toHaveLength(0);

    // Reactivate tenant
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`UPDATE public.tenants SET status = 'active', suspended_reason = NULL WHERE id = $1`, [TENANT_A_ID])
    );
  });

  it('ACCEPTANCE TEST E: Restoring an earlier configuration version restores exact previous state', async () => {
    // Save clean baseline snapshot v2
    const v2Res = await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`SELECT public.publish_remote_config_version('Clean snapshot before experiment', 'global', NULL) AS vid`)
    );
    const v2Id = v2Res.rows[0].vid;

    // Mutate maintenance_mode and custom nav item in v3
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`UPDATE public.global_config SET maintenance_mode = TRUE WHERE config_key = 'default'`)
    );
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`UPDATE public.modules SET is_globally_enabled = FALSE WHERE key = 'homework'`)
    );
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`SELECT public.publish_remote_config_version('Experimental v3 with maintenance ON', 'global', NULL) AS vid`)
    );

    const duringExperiment = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'web') AS cfg`, [TENANT_A_ID])
    );
    expect(duringExperiment.rows[0].cfg.maintenance_mode).toBe(true);

    // Rollback to v2
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`SELECT public.rollback_remote_config_version($1)`, [v2Id])
    );

    const afterRollback = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'web') AS cfg`, [TENANT_A_ID])
    );
    expect(afterRollback.rows[0].cfg.maintenance_mode).toBe(false);
    const hwMod = (afterRollback.rows[0].cfg.modules as Array<{ key: string; enabled: boolean }>).find((m) => m.key === 'homework');
    expect(hwMod?.enabled).toBe(true);
  });

  it('automatically updates student fee ledger balance & status on payment and enforces remote session revocation', async () => {
    const feeRes = await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(
        `INSERT INTO public.student_fees (tenant_id, student_id, title, gross_amount_cents, discount_amount_cents, due_date)
         VALUES ($1, $2, 'Tuition Fall 2026', 10000, 2000, '2026-12-01') RETURNING id, net_amount_cents`,
        [TENANT_A_ID, STUDENT_A1_ID]
      )
    );
    const feeId = feeRes.rows[0].id;
    expect(feeRes.rows[0].net_amount_cents).toBe(8000);

    await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(
        `INSERT INTO public.fee_payments (tenant_id, student_fee_id, student_id, receipt_number, amount_cents, payment_method, payment_status)
         VALUES ($1, $2, $3, 'RCP-TEST-1', 3000, 'cash', 'completed')`,
        [TENANT_A_ID, feeId, STUDENT_A1_ID]
      )
    );
    const partialFee = await ctx.asUser(PARENT_A_ID, (q) =>
      q(`SELECT paid_amount_cents, status FROM public.student_fees WHERE id = $1`, [feeId])
    );
    expect(partialFee.rows[0]).toMatchObject({ paid_amount_cents: 3000, status: 'partial' });

    await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(
        `INSERT INTO public.fee_payments (tenant_id, student_fee_id, student_id, receipt_number, amount_cents, payment_method, payment_status)
         VALUES ($1, $2, $3, 'RCP-TEST-2', 5000, 'bank_transfer', 'completed')`,
        [TENANT_A_ID, feeId, STUDENT_A1_ID]
      )
    );
    const paidFee = await ctx.asUser(PARENT_A_ID, (q) =>
      q(`SELECT paid_amount_cents, status FROM public.student_fees WHERE id = $1`, [feeId])
    );
    expect(paidFee.rows[0]).toMatchObject({ paid_amount_cents: 8000, status: 'paid' });

    // Remote session revocation test
    const sessRes = await ctx.db.query<{ id: string }>(
      `INSERT INTO public.user_sessions (user_id, tenant_id, session_token_hash, platform)
       VALUES ($1, $2, 'hash-test-123', 'android') RETURNING id`,
      [TEACHER_A_ID, TENANT_A_ID]
    );
    await ctx.asUser(SUPER_ADMIN_ID, (q) =>
      q(`SELECT public.revoke_user_session($1, 'Lost Android device')`, [sessRes.rows[0].id])
    );
    const teacherCfg = await ctx.asUser(TEACHER_A_ID, (q) =>
      q(`SELECT public.resolve_effective_config($1, 'mobile') AS cfg`, [TENANT_A_ID])
    );
    expect(teacherCfg.rows[0].cfg.session_revoked).toBe(true);
  });

  it('enforces subscription student quota limits inside PostgreSQL triggers', async () => {
    // Temporarily lower FREE plan max_students to 1 so Tenant B (which already has 1 student) rejects inserting a 2nd
    await ctx.db.query(`UPDATE public.subscription_plans SET max_students = 1 WHERE code = 'FREE'`);
    await expect(
      ctx.asUser(TENANT_B_ADMIN_ID, (q) =>
        q(
          `INSERT INTO public.students (tenant_id, student_code, admission_number, first_name, last_name)
           VALUES ($1, 'STU-B2', 'ADM-B2', 'Limit', 'Exceeded')`,
          [TENANT_B_ID]
        )
      )
    ).rejects.toThrow(/Subscription limit reached/);
    await ctx.db.query(`UPDATE public.subscription_plans SET max_students = 100 WHERE code = 'FREE'`);
  });

  it('supports Teacher, Student, and Guardian attendance sections with RLS & duplicate prevention', async () => {
    const { rows: grdRows } = await ctx.db.query<{ id: string }>(
      `SELECT id FROM public.student_guardians WHERE tenant_id = $1 AND guardian_user_id = $2`,
      [TENANT_A_ID, PARENT_A_ID]
    );
    const guardianId = grdRows[0].id;

    // Teacher attendance
    await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(
        `INSERT INTO public.teacher_attendance (tenant_id, teacher_id, attendance_date, status, marked_by)
         VALUES ($1, $2, '2026-11-12', 'present', $3)`,
        [TENANT_A_ID, TEACHER_A_REC_ID, TENANT_A_ADMIN_ID]
      )
    );

    // Guardian attendance (PTM)
    await ctx.asUser(TENANT_A_ADMIN_ID, (q) =>
      q(
        `INSERT INTO public.guardian_attendance (tenant_id, guardian_id, student_id, attendance_date, visit_purpose, status, marked_by)
         VALUES ($1, $2, $3, '2026-11-12', 'ptm', 'present', $4)`,
        [TENANT_A_ID, guardianId, STUDENT_A1_ID, TENANT_A_ADMIN_ID]
      )
    );

    // Linked guardian can read own attendance; Tenant B admin cannot
    const ownRead = await ctx.asUser(PARENT_A_ID, (q) =>
      q(`SELECT visit_purpose, status FROM public.guardian_attendance WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(ownRead.rows).toHaveLength(1);
    expect(ownRead.rows[0]).toMatchObject({ visit_purpose: 'ptm', status: 'present' });

    const crossTenantRead = await ctx.asUser(TENANT_B_ADMIN_ID, (q) =>
      q(`SELECT id FROM public.guardian_attendance WHERE tenant_id = $1`, [TENANT_A_ID])
    );
    expect(crossTenantRead.rows).toHaveLength(0);
  });
});
