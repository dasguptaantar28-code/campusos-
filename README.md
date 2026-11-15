# CampusOS — One Platform. Every Campus.

Enterprise Multi-Tenant School Management SaaS Platform combining a **Next.js Web Application**, **Flutter Android Mobile Application**, **Centralized Supabase Backend (PostgreSQL + RLS + Auth + Realtime + Storage + Edge Functions)**, and a **Server-Driven Dynamic Remote Configuration Engine**.

---

## Core Architecture

1. **Global Super Admin Dashboard (`/super-admin`)**: 21 centralized governance modules covering Tenant Lifecycle, School Directory, Subscriptions, Billing, Global Modules, Feature Management, Live Remote Configuration & Version Rollback, Roles/Permissions, Broadcast Notifications, Analytics, Monitoring, Devices, Security Center (Session Revocation), Audit Logs, Integrations, Support, Backups, and Platform Settings.
2. **School Admin Dashboard (`/app/[tenantSlug]`)**: 25 dynamically-gated school modules covering Students (Admissions, ID cards, CSV Bulk Import/Export, Promotions, TCs), Teachers, Staff, Classes, Sections, Subjects, Sessions, Attendance, Exams & Marks Validation, GPA & Approval-Gated Results/Report Cards, Fees & Receipts, Expenses, Timetable, Homework, Assignments, Library, Transport, HR & Payroll, Notices, Events, Parent-Teacher Communication, Reports, and School Settings.
3. **Role-Specific Portals**: Dedicated views for **School Admin**, **Teacher**, **Student**, **Parent** (strictly linked-children scoped), **Accountant**, and **Staff**.
4. **Flutter Android Mobile App (`apps/mobile`)**: Material 3 app with 18+ screens, secure token storage, offline-friendly cached config + fallback, FCM push structure, Light/Dark themes, and Realtime remote synchronization.
5. **Dynamic Remote Control Engine**: Hierarchical 5-layer cascade (`Global Policy -> Subscription Plan -> Tenant Config -> Role Permissions -> Web & Mobile UI`) with immutable snapshot versioning and 1-click rollback.

---

## Repository Layout

```text
campusos/
├── apps/
│   ├── web/                  # Next.js 15 App Router + TypeScript + Tailwind CSS
│   ├── mobile/               # Flutter Android Application (Dart + Riverpod + Material 3)
│   └── mobile-android/       # Native Android Kotlin/Jetpack Compose APK build (MuMu/ADB ready)
├── supabase/
│   ├── migrations/           # 10 normalized PostgreSQL + RLS + RPC + Storage SQL migrations
│   ├── functions/            # 7 Deno Edge Functions (remote-control, notifications, payments, etc.)
│   ├── seed/                 # Development-only seed data (dev_seed.sql)
│   └── config.toml           # Supabase project configuration
├── tests/                    # Automated PostgreSQL RLS, Quota & Acceptance Tests A-E (PGlite + Vitest)
├── docs/                     # Architecture, Database Plan, Roadmap, Testing & Production Setup
├── scripts/                  # Android APK build & verification scripts
├── .env.example              # Credential template (zero real secrets)
├── vercel.json               # Vercel deployment configuration
└── package.json              # Monorepo workspace scripts
```

---

## Quick Start

### 1. Environment Variables
Copy `.env.example` to `apps/web/.env.local` and supply your Supabase project credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

### 2. Database Setup (Supabase Cloud)
Apply migrations in chronological order (`supabase/migrations/202611120001` through `202611120010`) via Supabase CLI or SQL Editor. For local development demo institutions only, run `supabase/seed/dev_seed.sql`.

### 3. Run Next.js Web Application
```bash
cd apps/web
npm install
npm run dev
```

### 4. Run Automated Tests
```bash
# PostgreSQL Migrations, Cross-Tenant RLS Isolation & Remote Config Acceptance Tests A-E
cd tests
npm install
npm test

# Next.js Typecheck, Lint & Build
cd ../apps/web
npm run typecheck && npm run lint && npm run build
```

### 5. Build Flutter Android APK
See `docs/PRODUCTION_SETUP.md` or run `scripts/build_android_apk.bat` for debug and release APK instructions.
