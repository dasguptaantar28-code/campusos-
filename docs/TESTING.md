# CampusOS — Security & Automated Testing Guide

## 1. Test Suites Overview

| Suite | Location | Engine | What It Verifies |
| :--- | :--- | :--- | :--- |
| Schema & Baseline Catalog | `tests/database.test.ts` | PGlite (PostgreSQL WASM) + Vitest | Executes all 10 production SQL migrations, verifies 69 public tables all enforce `relrowsecurity = TRUE`, verifies 4 plans, 7 system roles, 25 modules |
| Cross-Tenant RLS & Acceptance Tests A–E | `tests/security-and-acceptance.test.ts` | PGlite + Vitest | Negative cross-tenant isolation, Parent child linkage, Teacher class scope, Duplicate attendance, Marks max_marks check, Approval gate, Fee balance sync, Session revocation, Quota enforcement, and **Acceptance Tests A–E** |
| Web Static & Production Build | `apps/web/package.json` | TypeScript + ESLint + Next.js | Full strict TypeScript check, ESLint, and Next.js production app router compilation |
| Flutter Widget & Navigation Tests | `apps/mobile/test/remote_config_and_navigation_test.dart` | `flutter test` | Fallback config, **Test A** (Attendance module disabled), **Test B & D** (Theme override + Tenant Suspension lockout), **Test C** (Custom navigation route rendering) |

---

## 2. Acceptance Tests Matrix (A–E)

- **TEST A — Disable Attendance Module:** Super Admin toggles `attendance` off -> `resolve_effective_config` removes Attendance from `navigation` and sets `enabled: false`; PostgreSQL RLS denies direct Attendance table access; Web & Flutter UI hide and lock Attendance.
- **TEST B — Change Application Theme:** Super Admin or permitted School Admin updates `theme_tokens` -> `resolve_effective_config` delivers updated hex colors; Web updates CSS variables live and Flutter updates Material 3 `ThemeData`.
- **TEST C — Create Configurable Navigation Item:** Super Admin inserts custom `navigation_items` row -> Web renders `/app/[tenantSlug]/custom/...` and Flutter Drawer/Grid renders `CustomRemoteScreen`.
- **TEST D — Suspend a Tenant:** Super Admin sets `tenants.status = 'suspended'` -> `app.has_tenant_membership` immediately returns `false`, `resolve_effective_config` returns `authorized: false`, and both Web & Flutter lock out authorized users.
- **TEST E — Restore Earlier Configuration Version:** Super Admin calls `rollback_remote_config_version(version_id)` -> `global_config`, `app_config`, `modules`, `navigation_items` restore atomically and increment version snapshot for Realtime client sync.

---

## 3. Running All Tests

```powershell
# 1. PostgreSQL Migrations, RLS Isolation & Acceptance Tests
cd campusos\tests
npm.cmd test

# 2. Next.js Typecheck, Lint & Build
cd ..\apps\web
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build

# 3. Flutter Static Analysis & Widget Tests
cd ..\mobile
flutter analyze
flutter test
```
