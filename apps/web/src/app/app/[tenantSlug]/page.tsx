import Link from 'next/link';
import { CalendarCheck2, CreditCard, GraduationCap, Megaphone, School, Users } from 'lucide-react';
import { AreaTrendChart, Badge, Card, CardHeader, StatCard } from '@/components/ui/primitives';
import { resolveAuthorizedTenantContext } from '@/lib/security/tenant-guard';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatCurrencyCents, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function SchoolOverviewPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const { context } = await resolveAuthorizedTenantContext(tenantSlug);
  const supabase = await createServerSupabaseClient();
  if (!context || !supabase) return null;

  const [{ data: stats }, { data: notices }, { data: events }] = await Promise.all([
    supabase.rpc('get_school_overview_stats', { p_tenant_id: context.tenant.id }),
    supabase
      .from('notices')
      .select('id, title, body, published_at, is_pinned')
      .eq('tenant_id', context.tenant.id)
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(5),
    supabase
      .from('events')
      .select('id, title, event_type, start_at')
      .eq('tenant_id', context.tenant.id)
      .order('start_at', { ascending: true })
      .limit(5),
  ]);

  const s = (stats ?? {}) as {
    total_students?: number;
    total_teachers?: number;
    total_staff?: number;
    total_classes?: number;
    attendance_percentage?: number;
    today_attendance_marked?: number;
    fees_collected_cents?: number;
    outstanding_dues_cents?: number;
    total_expenses_cents?: number;
  };

  const chartPoints = [
    { label: 'Students', value: Number(s.total_students ?? 0) },
    { label: 'Teachers', value: Number(s.total_teachers ?? 0) },
    { label: 'Staff', value: Number(s.total_staff ?? 0) },
    { label: 'Classes', value: Number(s.total_classes ?? 0) },
    { label: 'Present %', value: Number(s.attendance_percentage ?? 0) },
  ];

  return (
    <div className="space-y-6">
      {/* Server-Driven KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={s.total_students ?? 0}
          hint={`${s.total_classes ?? 0} active classes`}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Teachers & Staff"
          value={`${s.total_teachers ?? 0} / ${s.total_staff ?? 0}`}
          hint="Faculty & campus staff"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Today Attendance"
          value={`${s.attendance_percentage ?? 0}%`}
          hint={`${s.today_attendance_marked ?? 0} records marked today`}
          icon={<CalendarCheck2 className="h-5 w-5" />}
        />
        <StatCard
          label="Fees Collected"
          value={formatCurrencyCents(Number(s.fees_collected_cents ?? 0))}
          hint={`Outstanding: ${formatCurrencyCents(Number(s.outstanding_dues_cents ?? 0))}`}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* Role Portal Quick Jump */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Dedicated Role Portals</h2>
            <p className="text-xs text-slate-500">
              Jump directly to specialized workspaces authorized for your account ({context.roleKey}).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Teacher Portal', href: `/app/${tenantSlug}/teacher` },
              { label: 'Student Portal', href: `/app/${tenantSlug}/student` },
              { label: 'Parent Portal', href: `/app/${tenantSlug}/parent` },
              { label: 'Accountant Portal', href: `/app/${tenantSlug}/accountant` },
              { label: 'Staff Portal', href: `/app/${tenantSlug}/staff-portal` },
            ].map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-[#16A34A] dark:border-slate-700 dark:text-slate-200"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <AreaTrendChart
            title="Campus Academic Overview"
            subtitle="Live PostgreSQL counts & attendance rate"
            points={chartPoints}
          />
        </div>

        <Card className="lg:col-span-5">
          <CardHeader title="Recent Campus Notices" action={<Megaphone className="h-4 w-4 text-[#16A34A]" />} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(notices ?? []).length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No notices published yet.</p>
            ) : (
              notices!.map((n) => (
                <div key={n.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.title}</p>
                    {n.is_pinned && <Badge variant="green">Pinned</Badge>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{formatDate(n.published_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Upcoming Campus Events" action={<School className="h-4 w-4 text-[#16A34A]" />} />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {(events ?? []).length === 0 ? (
            <p className="p-5 text-xs text-slate-500">No upcoming events scheduled.</p>
          ) : (
            events!.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="font-medium text-slate-900 dark:text-white">{ev.title}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="slate">{ev.event_type}</Badge>
                  <span className="text-xs text-slate-500">{formatDate(ev.start_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
