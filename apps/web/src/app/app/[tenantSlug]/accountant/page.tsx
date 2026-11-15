import Link from 'next/link';
import { CreditCard, Receipt, Wallet } from 'lucide-react';
import { Card, StatCard } from '@/components/ui/primitives';
import { resolveAuthorizedTenantContext } from '@/lib/security/tenant-guard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrencyCents } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AccountantPortalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { context } = await resolveAuthorizedTenantContext(tenantSlug);
  const supabase = await createServerSupabaseClient();
  if (!context || !supabase) return null;

  const { data: stats } = await supabase.rpc('get_school_overview_stats', { p_tenant_id: context.tenant.id });
  const s = (stats ?? {}) as { fees_collected_cents?: number; outstanding_dues_cents?: number; total_expenses_cents?: number };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fees Collected" value={formatCurrencyCents(Number(s.fees_collected_cents ?? 0))} icon={<CreditCard className="h-5 w-5" />} />
        <StatCard label="Outstanding Dues" value={formatCurrencyCents(Number(s.outstanding_dues_cents ?? 0))} icon={<Receipt className="h-5 w-5" />} />
        <StatCard label="Expenses Logged" value={formatCurrencyCents(Number(s.total_expenses_cents ?? 0))} icon={<Wallet className="h-5 w-5" />} />
      </div>

      <Card className="p-6">
        <h2 className="text-base font-bold">Accountant & Financial Operations</h2>
        <p className="mt-1 text-xs text-slate-500">Manage student fee ledgers, receipts, expenses, and payroll.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/app/${tenantSlug}/fees`} className="rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white">
            Open Fees & Receipts
          </Link>
          <Link href={`/app/${tenantSlug}/expenses`} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700">
            Manage Expenses
          </Link>
          <Link href={`/app/${tenantSlug}/payroll`} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700">
            HR & Payroll
          </Link>
        </div>
      </Card>
    </div>
  );
}
