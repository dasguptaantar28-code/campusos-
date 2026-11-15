'use client';

import React from 'react';
import { DashboardShell, type NavItemSpec } from '@/components/layout/dashboard-shell';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';

export function SchoolWorkspaceShell({
  tenantSlug,
  tenantName,
  userEmail,
  roleKey,
  children,
}: {
  tenantSlug: string;
  tenantName: string;
  userEmail: string;
  roleKey: string;
  children: React.ReactNode;
}) {
  const { config } = useRemoteConfig();

  const portalLink: NavItemSpec | null =
    roleKey === 'teacher'
      ? { id: 'portal-teacher', label: 'Teacher Portal', href: `/app/${tenantSlug}/teacher`, icon: 'GraduationCap', badge: 'PORTAL' }
      : roleKey === 'student'
      ? { id: 'portal-student', label: 'Student Portal', href: `/app/${tenantSlug}/student`, icon: 'Users', badge: 'PORTAL' }
      : roleKey === 'parent'
      ? { id: 'portal-parent', label: 'Parent Portal', href: `/app/${tenantSlug}/parent`, icon: 'ShieldCheck', badge: 'PORTAL' }
      : roleKey === 'accountant'
      ? { id: 'portal-accountant', label: 'Accountant Portal', href: `/app/${tenantSlug}/accountant`, icon: 'CreditCard', badge: 'PORTAL' }
      : roleKey === 'staff'
      ? { id: 'portal-staff', label: 'Staff Portal', href: `/app/${tenantSlug}/staff-portal`, icon: 'Briefcase', badge: 'PORTAL' }
      : null;

  // Build navigation dynamically from Server-Driven Remote Config Engine
  const dynamicNav: NavItemSpec[] = config.navigation.map((item) => {
    const cleanPath = item.route_path.startsWith('/') ? item.route_path : `/${item.route_path}`;
    const href =
      item.is_custom || item.target_type === 'custom_screen'
        ? `/app/${tenantSlug}/custom${cleanPath}`
        : `/app/${tenantSlug}${item.route_path}`;

    return {
      id: item.id,
      label: item.label,
      href,
      icon: item.icon,
      badge: item.is_custom ? 'NEW' : undefined,
    };
  });

  const navItems = portalLink ? [portalLink, ...dynamicNav] : dynamicNav;

  return (
    <DashboardShell
      title={config.branding?.institutionName ?? tenantName}
      subtitle={`${config.tenant?.plan_code ?? 'FREE'} Plan • Role: ${roleKey.replace('_', ' ').toUpperCase()}`}
      userEmail={userEmail}
      roleLabel={`${roleKey.replace('_', ' ').toUpperCase()} MENU`}
      navItems={navItems}
    >
      {children}
    </DashboardShell>
  );
}
