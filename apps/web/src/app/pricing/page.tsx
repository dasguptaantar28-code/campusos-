import Link from 'next/link';
import { Check } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { PUBLIC_DEFAULT_PLANS } from '@/lib/config/remote-config';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrencyCents } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const supabase = await createServerSupabaseClient();
  let plans = PUBLIC_DEFAULT_PLANS;

  if (supabase) {
    const { data } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (data && data.length > 0) {
      plans = data as typeof PUBLIC_DEFAULT_PLANS;
    }
  }

  return (
    <MarketingShell>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">SaaS Plans & Quotas</span>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">
            Transparent Multi-Tenant Licensing
          </h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Plans enforce student, teacher, staff, storage, and module entitlements directly inside PostgreSQL.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.code}
              className={`flex flex-col justify-between rounded-2xl border p-6 ${
                plan.code === 'PROFESSIONAL'
                  ? 'border-[#16A34A] bg-emerald-50/40 shadow-xl dark:bg-emerald-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{plan.description}</p>

                <div className="mt-5">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrencyCents(plan.monthly_price_cents)}
                  </span>
                  <span className="text-xs text-slate-500">/month</span>
                  <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                    Or {formatCurrencyCents(plan.annual_price_cents)}/year
                  </p>
                </div>

                <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16A34A]" /> {plan.max_students.toLocaleString()} Students
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16A34A]" /> {plan.max_teachers.toLocaleString()} Teachers
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16A34A]" /> {plan.max_staff.toLocaleString()} Staff
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16A34A]" /> {Math.round(plan.max_storage_mb / 1024)} GB Storage
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16A34A]" /> {plan.max_admin_accounts} Admin Accounts
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-[#16A34A]" /> {plan.allowed_modules.length} Enabled Modules
                  </li>
                </ul>
              </div>

              <Link
                href={`/register?plan=${plan.code}`}
                className="mt-6 block rounded-xl bg-[#16A34A] py-3 text-center text-xs font-bold text-white transition hover:bg-[#15803D]"
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
