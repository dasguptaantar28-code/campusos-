import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

function walkFiles(dir: string, exts: string[]): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.next', 'build', '.dart_tool', '.git'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

describe('CampusOS Static Security & Secret Hygiene Audit', () => {
  it('never references private server keys in client web components or Flutter mobile app', () => {
    const mobileFiles = walkFiles(path.join(ROOT, 'apps/mobile/lib'), ['.dart']);
    expect(mobileFiles.length).toBeGreaterThan(5);
    for (const f of mobileFiles) {
      const content = fs.readFileSync(f, 'utf8');
      expect(content).not.toContain('SERVICE_ROLE');
      expect(content).not.toContain('STRIPE_SECRET');
      expect(content).not.toContain('FIREBASE_SERVICE_ACCOUNT');
    }

    const webClientFiles = walkFiles(path.join(ROOT, 'apps/web/src/components'), ['.ts', '.tsx']);
    for (const f of webClientFiles) {
      const content = fs.readFileSync(f, 'utf8');
      expect(content).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(content).not.toContain('STRIPE_SECRET_KEY');
    }
  });

  it('includes all required Edge Functions and environment template keys without real secrets', () => {
    const envExample = fs.readFileSync(path.join(ROOT, '.env.example'), 'utf8');
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_URL=');
    expect(envExample).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY=');
    expect(envExample).toContain('SUPABASE_SERVICE_ROLE_KEY=');
    expect(envExample).toContain('FIREBASE_SERVICE_ACCOUNT_JSON=');
    expect(envExample).toContain('STRIPE_WEBHOOK_SECRET=');
    expect(envExample).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);

    const fnDir = path.join(ROOT, 'supabase/functions');
    for (const fn of [
      'resolve-config',
      'remote-control',
      'send-notification',
      'create-payment-intent',
      'payment-webhook',
      'bulk-student-import',
      'revoke-session',
    ]) {
      expect(fs.existsSync(path.join(fnDir, fn, 'index.ts'))).toBe(true);
    }
  });
});
