import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';

const GROUPS = [
  {
    title: 'Academic & Student Lifecycle',
    items: [
      'Online Admissions & Registration with Student ID Generation',
      'Guardian Linkage, Emergency Contacts & Printable Student ID Cards',
      'CSV / Excel Bulk Import with Duplicate Detection & Server Validation',
      'Student Promotion, Academic History & Transfer Certificate Issuance',
      'Class, Section, Subject, Academic Session & Timetable Scheduling',
    ],
  },
  {
    title: 'Attendance, Exams & Results',
    items: [
      'Duplicate-Safe Daily Student & Teacher Attendance + Leave Requests',
      'Examination Categories, Subject Blueprints & Max-Marks Validation',
      'Institution-Configurable Grading Rules, GPA & Merit Rank Calculation',
      'Strict Result Approval Workflow before Parent/Student Publishing',
      'Printable Report Cards & Academic Transcripts',
    ],
  },
  {
    title: 'Finance, Campus Ops & Portals',
    items: [
      'Fee Categories, Ledgers, Discounts, Scholarships & Printable Receipts',
      'Expense Tracking, HR & Payroll Runs with Audit Trail',
      'Server-Side Payment Gateway Intents & HMAC Webhook Verification',
      'Library Circulation, Transport Fleet Routes, Notices & Events',
      'Dedicated School Admin, Teacher, Student, Parent, Accountant & Staff Portals',
    ],
  },
  {
    title: 'Multi-Tenant SaaS & Remote Control Engine',
    items: [
      'Strict PostgreSQL Row Level Security Isolation per Institution',
      'Global Super Admin Dashboard across 21 Governance Modules',
      'Realtime Server-Driven UI Modules, Nav Items & Theme Sync (Web & Android)',
      'Immutable Configuration Versioning with 1-Click Rollback',
      'Device Registrations, Session Revocation & Forced Remote Sign-Out',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">Platform Capabilities</span>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">
            Every Module Built for Enterprise Campus Scale
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            CampusOS pairs complete academic and financial operations with genuine multi-tenant database isolation and real-time remote configuration.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{group.title}</h2>
              <ul className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between rounded-2xl bg-[#064E3B] p-8 text-white">
          <div>
            <h3 className="text-xl font-bold">Ready to onboard your institution?</h3>
            <p className="mt-1 text-sm text-emerald-100">Create your isolated tenant workspace in under two minutes.</p>
          </div>
          <Link
            href="/register"
            className="rounded-xl bg-[#22C55E] px-5 py-3 text-sm font-bold text-[#064E3B] transition hover:bg-emerald-400"
          >
            Register Institution
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
