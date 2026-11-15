'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeftRight, Bell, LogOut, Menu, RefreshCw, ShieldAlert, Wrench, X } from 'lucide-react';
import { CampusLogo } from '@/components/brand/campusos-logo';
import { ThemeToggle } from '@/components/providers/theme-provider';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { DynamicIcon } from '@/components/ui/icon-map';
import { Badge, Button } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export interface NavItemSpec {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
}

export function DashboardShell({
  title,
  subtitle,
  userEmail,
  roleLabel,
  navItems,
  tenantSwitcherHref = '/select-tenant',
  children,
}: {
  title: string;
  subtitle?: string;
  userEmail?: string;
  roleLabel: string;
  navItems: NavItemSpec[];
  tenantSwitcherHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { config, syncing, refreshConfig } = useRemoteConfig();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    const sb = createBrowserSupabaseClient();
    await sb?.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Maintenance / Suspension Lockout Guards driven live by Remote Config Engine
  if (!config.authorized && !config.is_platform_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Institution Access Restricted</h1>
          <p className="mt-2 text-sm text-slate-300">
            {config.error ?? `Tenant status is currently ${config.tenant_status ?? 'suspended'}.`}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => router.push('/select-tenant')}>
              Switch Institution
            </Button>
            <Button variant="danger" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (config.maintenance_mode && !config.is_platform_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
        <div className="max-w-md rounded-3xl border border-amber-500/30 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <Wrench className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold">Scheduled Maintenance</h1>
          <p className="mt-2 text-sm text-slate-300">{config.maintenance_message}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => void refreshConfig()} loading={syncing}>
              Check Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const SidebarContent = (
    <div className="flex h-full flex-col bg-[#111827] text-slate-100">
      <div className="border-b border-white/10 px-5 py-4">
        <CampusLogo
          href="/"
          size="sm"
          darkSurface
          subtitle={config.branding?.institutionName ?? config.branding?.tagline ?? 'One Platform. Every Campus.'}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-emerald-400/80">
          {roleLabel}
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/super-admin' && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setDrawerOpen(false)}
                style={active ? { backgroundColor: config.theme?.primary ?? '#16A34A' } : undefined}
                className={cn(
                  'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active ? 'text-white shadow-sm' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <span className="flex items-center gap-3 truncate">
                  <DynamicIcon name={item.icon} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-4 space-y-2.5">
        <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          <span className="text-slate-400">Config v{config.version}</span>
          <button
            type="button"
            onClick={() => void refreshConfig()}
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', syncing && 'animate-spin')} />
            Sync
          </button>
        </div>

        <Link
          href={tenantSwitcherHref}
          className="flex w-full items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 text-emerald-400" />
          Switch Institution / Portal
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 border-r border-slate-200/20 lg:block">{SidebarContent}</aside>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-72 shrink-0 shadow-2xl">{SidebarContent}</div>
          <div className="flex-1 bg-black/50 backdrop-blur-xs" onClick={() => setDrawerOpen(false)}>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="m-4 rounded-lg bg-white/10 p-2 text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/85 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden dark:border-slate-700 dark:text-slate-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900 dark:text-white">{title}</h1>
              {subtitle && <p className="truncate text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant="green" className="hidden sm:inline-flex">
              v{config.version} • Live
            </Badge>
            <ThemeToggle />
            <Link
              href={config.tenant ? `/app/${config.tenant.slug}/notices` : '/super-admin/notifications'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>
            {userEmail && (
              <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 md:flex dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="max-w-36 truncate">{userEmail}</span>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
