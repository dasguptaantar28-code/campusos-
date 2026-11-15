import Link from 'next/link';
import { Building2, GraduationCap, Landmark, School } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';

const SOLUTIONS = [
  {
    icon: School,
    title: 'K-12 Schools',
    desc: 'Streamline daily attendance, parent push alerts, homework, report cards, transport routes, and monthly fee collection across Web and Android.',
    highlights: ['Guardian-linked Parent Portal', 'Printable Student ID Cards', 'Automated Attendance Alerts'],
  },
  {
    icon: GraduationCap,
    title: 'Colleges & Sixth Forms',
    desc: 'Manage department faculty, subject allocations, GPA grading rules, academic transcripts, library circulation, and semester timetables.',
    highlights: ['Configurable GPA & Merit Ranking', 'Department & Faculty Directory', 'Learning Materials & Assignments'],
  },
  {
    icon: Building2,
    title: 'Multi-Campus School Groups',
    desc: 'Give every branch an isolated tenant workspace while central directors oversee subscriptions, themes, modules, and compliance from Super Admin.',
    highlights: ['Zero-Trust PostgreSQL RLS Isolation', 'Multi-Tenant Membership Switcher', 'Central Remote Config & Rollback'],
  },
  {
    icon: Landmark,
    title: 'Training Institutes & Academies',
    desc: 'Run lean cohorts with rapid CSV student onboarding, digital fee receipts, custom navigation items, and mobile-first student portals.',
    highlights: ['Bulk CSV Import with Deduplication', 'Custom Remote Navigation Builder', 'Offline-Cached Mobile Access'],
  },
];

export default function SolutionsPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">Solutions</span>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">
            Tailored for Every Educational Institution
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
            Whether operating one academy or an entire district of schools, CampusOS adapts dynamically to your roles, modules, and subscription tier.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {SOLUTIONS.map((sol) => (
            <div
              key={sol.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400">
                <sol.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{sol.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{sol.desc}</p>
              <ul className="mt-4 space-y-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {sol.highlights.map((h) => (
                  <li key={h}>• {h}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/contact"
            className="inline-flex items-center rounded-xl bg-[#16A34A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#15803D]"
          >
            Request Custom Architecture Walkthrough
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
