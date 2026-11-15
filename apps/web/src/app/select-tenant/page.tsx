import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Building2, Plus, ShieldCheck } from 'lucide-react';
import { CampusLogo } from '@/components/brand/campusos-logo';
import { Badge, Card, StateFeedback } from '@/components/ui/primitives';
import { requireAuthenticatedServerUser } from '@/lib/security/tenant-guard';

export const dynamic = 'force-dynamic';

export default async function SelectTenantPage() {
  const { supabase, user, isPlatformAdmin } = await requireAuthenticatedServerUser();

  if (!supabase) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <StateFeedback
          type="error"
          title="Supabase Credentials Not Configured"
          message="Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local to connect to your CampusOS database."
        />
      </div>
    );
  }

  if (!user) {
    redirect('/login');
  }

  const { data: memberships } = await supabase
    .from('tenant_memberships')
    .select('id, status, roles(key, name), tenants(id, name, slug, code, institution_type, status)')
    .eq('user_id', user.id)
    .is('deleted_at', null);

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-10 dark:bg-[#0B111A]">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CampusLogo href="/" size="md" />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Signed in as</span>
            <Badge variant="green">{user.email}</Badge>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Select Your Campus or Console</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Access is strictly verified by your active server-side tenant memberships and roles.
          </p>
        </div>

        {isPlatformAdmin && (
          <Card className="border-emerald-500/40 bg-gradient-to-r from-[#064E3B] to-[#111827] p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#22C55E]/20 text-[#22C55E]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Global Super Admin Console</h2>
                  <p className="text-xs text-emerald-100/80">
                    Manage all institutions, subscriptions, remote config, modules, themes, and active sessions.
                  </p>
                </div>
              </div>
              <Link
                href="/super-admin"
                className="inline-flex items-center gap-2 rounded-xl bg-[#22C55E] px-5 py-2.5 text-sm font-bold text-[#064E3B] transition hover:bg-emerald-400"
              >
                Open Super Admin
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {(memberships ?? []).map((m) => {
            const tenant = m.tenants as unknown as {
              id: string;
              name: string;
              slug: string;
              code: string;
              institution_type: string;
              status: string;
            } | null;
            const role = m.roles as unknown as { key: string; name: string } | null;
            if (!tenant) return null;

            const isActive = tenant.status === 'active' && m.status === 'active';
            const targetHref =
              role?.key === 'teacher'
                ? `/app/${tenant.slug}/teacher`
                : role?.key === 'student'
                ? `/app/${tenant.slug}/student`
                : role?.key === 'parent'
                ? `/app/${tenant.slug}/parent`
                : role?.key === 'accountant'
                ? `/app/${tenant.slug}/accountant`
                : `/app/${tenant.slug}`;

            return (
              <Card key={m.id} className="p-5 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{tenant.name}</h3>
                      <p className="text-xs text-slate-500">
                        {tenant.code} • {role?.name ?? 'Member'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={tenant.status === 'active' ? 'green' : tenant.status === 'pending' ? 'amber' : 'red'}>
                    {tenant.status}
                  </Badge>
                </div>

                {isActive ? (
                  <Link
                    href={targetHref}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16A34A] py-2.5 text-xs font-semibold text-white transition hover:bg-[#15803D]"
                  >
                    Enter Workspace
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <div className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs text-slate-500 dark:bg-slate-800">
                    {tenant.status === 'pending'
                      ? 'Pending Super Admin approval'
                      : `Access blocked (${tenant.status})`}
                  </div>
                )}
              </Card>
            );
          })}

          <Card className="flex flex-col items-center justify-center border-dashed p-6 text-center">
            <Plus className="h-6 w-6 text-[#16A34A]" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Register Another Institution</h3>
            <p className="mt-1 text-xs text-slate-500">Create a new isolated school or college workspace.</p>
            <Link
              href="/register"
              className="mt-4 rounded-xl border border-emerald-500/40 px-4 py-2 text-xs font-semibold text-[#16A34A] hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              Onboard New School
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
