import { describe, expect, it } from 'vitest';
import { createMigratedTestDb } from './helpers/pglite-runner.js';

describe('CampusOS PostgreSQL Schema & Baseline Catalog', () => {
  it('runs all 10 migrations cleanly and seeds canonical plans, roles, permissions, and 25 modules', async () => {
    const { db } = await createMigratedTestDb();

    const plans = await db.query<{ code: string }>('SELECT code FROM public.subscription_plans ORDER BY sort_order');
    expect(plans.rows.map((r) => r.code)).toEqual(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']);

    const roles = await db.query<{ key: string }>('SELECT key FROM public.roles WHERE tenant_id IS NULL ORDER BY key');
    expect(roles.rows.map((r) => r.key)).toEqual([
      'accountant',
      'parent',
      'school_admin',
      'staff',
      'student',
      'super_admin',
      'teacher',
    ]);

    const modules = await db.query<{ key: string }>('SELECT key FROM public.modules');
    expect(modules.rows.length).toBeGreaterThanOrEqual(25);

    const rlsCheck = await db.query<{ count: string }>(
      `SELECT COUNT(*)::TEXT AS count FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = FALSE`
    );
    expect(Number(rlsCheck.rows[0].count)).toBe(0);

    await db.close();
  });
});
