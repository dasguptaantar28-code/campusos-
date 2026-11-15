import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

export interface TestDbContext {
  db: PGlite;
  asUser: <T>(userId: string | null, fn: (query: (sql: string, params?: unknown[]) => Promise<{ rows: any[] }>) => Promise<T>) => Promise<T>;
}

const MIGRATIONS_DIR = path.resolve(import.meta.dirname, '../../supabase/migrations');

export async function createMigratedTestDb(): Promise<TestDbContext> {
  const db = new PGlite();

  // Bootstrap minimal Supabase auth & role primitives so exact production SQL migrations run unmodified
  await db.exec(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
      END IF;
    END $$;

    CREATE SCHEMA IF NOT EXISTS auth;

    CREATE TABLE IF NOT EXISTS auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE,
      raw_user_meta_data JSONB DEFAULT '{}'::JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION auth.uid()
    RETURNS UUID
    LANGUAGE sql
    STABLE
    AS $$
      SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
    $$;

    CREATE OR REPLACE FUNCTION auth.jwt()
    RETURNS JSONB
    LANGUAGE sql
    STABLE
    AS $$
      SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), '')::JSONB, '{}'::JSONB);
    $$;

    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    await db.exec(sql);
  }

  // Mirror Supabase default table/function grants to authenticated & anon so RLS policies govern access
  await db.exec(`
    GRANT USAGE ON SCHEMA app TO anon, authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT SELECT ON public.subscription_plans, public.global_config, public.platform_settings TO anon;
    GRANT INSERT ON public.contact_inquiries TO anon;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO anon, authenticated;
  `);

  const asUser: TestDbContext['asUser'] = async (userId, fn) => {
    return db.transaction(async (tx) => {
      if (userId) {
        await tx.exec(`SET LOCAL ROLE authenticated;`);
        await tx.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
      } else {
        await tx.exec(`SET LOCAL ROLE anon;`);
        await tx.query(`SELECT set_config('request.jwt.claim.sub', '', true)`);
      }
      return fn((sql, params) => tx.query(sql, params));
    });
  };

  return { db, asUser };
}
