import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');

describe('CampusOS Web & Mobile Contract Parity', () => {
  it('exposes all 18+ required Flutter routes in main.dart', () => {
    const mainDart = fs.readFileSync(path.join(ROOT, 'apps/mobile/lib/main.dart'), 'utf8');
    const requiredRoutes = [
      "'/'",
      "'/onboarding'",
      "'/login'",
      "'/register'",
      "'/tenants'",
      "'/dashboard'",
      "'/student-profile'",
      "'/teacher-profile'",
      "'/attendance'",
      "'/exams'",
      "'/results'",
      "'/fees'",
      "'/homework'",
      "'/timetable'",
      "'/notifications'",
      "'/documents'",
      "'/settings'",
      "'/support'",
      "'/custom/:slug'",
    ];
    for (const r of requiredRoutes) {
      expect(mainDart).toContain(r);
    }
  });

  it('includes all 21 Super Admin menu routes in super-admin-nav.ts', () => {
    const navTs = fs.readFileSync(path.join(ROOT, 'apps/web/src/lib/navigation/super-admin-nav.ts'), 'utf8');
    const expectedIds = [
      'overview',
      'tenants',
      'schools',
      'users',
      'plans',
      'billing',
      'modules',
      'features',
      'remote-config',
      'roles',
      'permissions',
      'notifications',
      'analytics',
      'monitoring',
      'devices',
      'security',
      'audit-logs',
      'integrations',
      'support',
      'backups',
      'settings',
    ];
    for (const id of expectedIds) {
      expect(navTs).toContain(`id: '${id}'`);
    }
  });

  it('exposes all required routes in native Android Kotlin MainActivity.kt', () => {
    const kt = fs.readFileSync(
      path.join(ROOT, 'apps/mobile-android/app/src/main/kotlin/com/campusos/app/MainActivity.kt'),
      'utf8'
    );
    for (const route of [
      '"splash"',
      '"onboarding"',
      '"login"',
      '"register"',
      '"tenants"',
      '"/dashboard"',
      '"/attendance"',
      '"/exams"',
      '"/results"',
      '"/fees"',
      '"/homework"',
      '"/timetable"',
      '"/student-profile"',
      '"/teacher-profile"',
      '"/documents"',
      '"/notifications"',
      '"/settings"',
      '"/support"',
      '"/custom/{slug}"',
    ]) {
      expect(kt).toContain(route);
    }
  });
});
