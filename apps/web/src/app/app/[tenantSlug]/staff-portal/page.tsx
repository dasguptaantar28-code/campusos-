import Link from 'next/link';
import { Briefcase, Bus, Library } from 'lucide-react';
import { Card, StatCard } from '@/components/ui/primitives';
import { resolveAuthorizedTenantContext } from '@/lib/security/tenant-guard';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function StaffPortalPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { context } = await resolveAuthorizedTenantContext(tenantSlug);
  const supabase = await createServerSupabaseClient();
  if (!context || !supabase) return null;

  const [{ count: books }, { count: routes }, { count: leaves }] = await Promise.all([
    supabase.from('library_books').select('*', { count: 'exact', head: true }).eq('tenant_id', context.tenant.id),
    supabase.from('transport_routes').select('*', { count: 'exact', head: true }).eq('tenant_id', context.tenant.id),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('tenant_id', context.tenant.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Library Catalog Books" value={books ?? 0} icon={<Library className="h-5 w-5" />} />
        <StatCard label="Transport Routes" value={routes ?? 0} icon={<Bus className="h-5 w-5" />} />
        <StatCard label="Leave Requests" value={leaves ?? 0} icon={<Briefcase className="h-5 w-5" />} />
      </div>

      <Card className="p-6">
        <h2 className="text-base font-bold">Campus Staff Operations</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`/app/${tenantSlug}/library`} className="rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-semibold text-white">
            Manage Library
          </Link>
          <Link href={`/app/${tenantSlug}/transport`} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700">
            Manage Transport
          </Link>
          <Link href={`/app/${tenantSlug}/notices`} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold dark:border-slate-700">
            View Notices
          </Link>
        </div>
      </Card>
    </div>
  );
}
