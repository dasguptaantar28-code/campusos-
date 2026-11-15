import Link from 'next/link';
import { SchoolWorkspaceShell } from '@/components/layout/school-workspace-shell';
import { RemoteConfigProvider } from '@/components/providers/remote-config-provider';
import { StateFeedback } from '@/components/ui/primitives';
import { resolveAuthorizedTenantContext } from '@/lib/security/tenant-guard';

export const dynamic = 'force-dynamic';

export default async function TenantWorkspaceLayout({
  params,
  children,
}: {
  params: Promise<{ tenantSlug: string }>;
  children: React.ReactNode;
}) {
  const { tenantSlug } = await params;
  const { context, error, tenantStatus } = await resolveAuthorizedTenantContext(tenantSlug);

  if (!context) {
    return (
      <div className="mx-auto max-w-xl p-10">
        <StateFeedback
          type="error"
          title={tenantStatus === 'suspended' ? 'Institution Suspended' : 'Tenant Access Denied'}
          message={error ?? 'You do not have an active authorized membership for this campus.'}
          action={
            <Link href="/select-tenant" className="text-xs font-semibold text-[#16A34A] hover:underline">
              Return to Institution Selector
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <RemoteConfigProvider initialConfig={context.config} tenantId={context.tenant.id}>
      <SchoolWorkspaceShell
        tenantSlug={context.tenant.slug}
        tenantName={context.tenant.name}
        userEmail={context.userEmail}
        roleKey={context.roleKey}
      >
        {children}
      </SchoolWorkspaceShell>
    </RemoteConfigProvider>
  );
}
