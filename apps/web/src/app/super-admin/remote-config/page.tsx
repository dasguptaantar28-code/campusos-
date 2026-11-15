'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { History, Palette, Plus, RotateCcw, Save, Sliders, Trash2, Wrench } from 'lucide-react';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Badge, Button, Card, CardHeader, Input, Select, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface ModuleRow {
  id: string;
  key: string;
  name: string;
  description: string | null;
  min_plan_tier: string;
  nav_order: number;
  is_globally_enabled: boolean;
}

interface NavRow {
  id: string;
  scope: string;
  tenant_id: string | null;
  module_key: string;
  label: string;
  icon: string;
  route_path: string;
  target_type: string;
  platforms: string[];
  target_roles: string[];
  sort_order: number;
  is_visible: boolean;
  is_custom: boolean;
}

interface VersionRow {
  id: string;
  version_number: number;
  scope: string;
  tenant_id: string | null;
  change_summary: string;
  restored_from_version_id: string | null;
  created_at: string;
}

export default function RemoteConfigCenterPage() {
  const { config, refreshConfig } = useRemoteConfig();
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [tenantOverrides, setTenantOverrides] = useState<Record<string, boolean>>({});
  const [navItems, setNavItems] = useState<NavRow[]>([]);
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  const [themePrimary, setThemePrimary] = useState('#16A34A');
  const [themeEmerald, setThemeEmerald] = useState('#22C55E');
  const [themeDarkGreen, setThemeDarkGreen] = useState('#064E3B');
  const [brandName, setBrandName] = useState('CampusOS');
  const [tagline, setTagline] = useState('One Platform. Every Campus.');

  const [newNav, setNewNav] = useState({
    label: '',
    module_key: 'custom_portal',
    icon: 'Sparkles',
    route_path: '/custom/announcement',
    target_type: 'custom_screen',
    sort_order: '280',
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAll = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);

    const [{ data: tRows }, { data: mRows }, { data: nRows }, { data: vRows }, { data: gc }] = await Promise.all([
      supabase.from('tenants').select('id, name').is('deleted_at', null).order('name'),
      supabase.from('modules').select('*').order('nav_order'),
      supabase.from('navigation_items').select('*').order('sort_order'),
      supabase.from('configuration_versions').select('*').order('version_number', { ascending: false }).limit(20),
      supabase.from('global_config').select('*').eq('config_key', 'default').maybeSingle(),
    ]);

    setTenants(tRows ?? []);
    setModules((mRows as ModuleRow[]) ?? []);
    setNavItems((nRows as NavRow[]) ?? []);
    setVersions((vRows as VersionRow[]) ?? []);

    if (gc) {
      setMaintenanceMode(Boolean(gc.maintenance_mode));
      setMaintenanceMsg(String(gc.maintenance_message ?? ''));
      const dt = (gc.default_theme ?? {}) as Record<string, string>;
      if (dt.primary) setThemePrimary(dt.primary);
      if (dt.emerald) setThemeEmerald(dt.emerald);
      if (dt.darkGreen) setThemeDarkGreen(dt.darkGreen);
      setBrandName(String(gc.brand_name ?? 'CampusOS'));
      setTagline(String(gc.tagline ?? 'One Platform. Every Campus.'));
    }

    if (selectedTenantId) {
      const { data: tfRows } = await supabase
        .from('tenant_features')
        .select('module_key, is_enabled')
        .eq('tenant_id', selectedTenantId)
        .is('feature_key', null);
      const map: Record<string, boolean> = {};
      for (const r of tfRows ?? []) map[r.module_key] = r.is_enabled;
      setTenantOverrides(map);
    } else {
      setTenantOverrides({});
    }

    setLoading(false);
  }, [selectedTenantId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const sendRemoteAction = async (body: Record<string, unknown>, successText: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/super-admin/remote-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'error', text: json.error ?? 'Remote command rejected' });
      } else {
        setFeedback({ type: 'success', text: successText });
        await refreshConfig();
        await loadAll();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error executing remote command' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateNav = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendRemoteAction(
      {
        action: 'upsert_nav_item',
        tenant_id: selectedTenantId || null,
        item: {
          module_key: newNav.module_key,
          label: newNav.label,
          icon: newNav.icon,
          route_path: newNav.route_path,
          target_type: newNav.target_type,
          sort_order: Number(newNav.sort_order) || 280,
          target_roles: ['school_admin', 'teacher', 'student', 'parent', 'accountant', 'staff'],
          platforms: ['web', 'mobile'],
          is_visible: true,
          is_custom: true,
        },
      },
      `Custom navigation item "${newNav.label}" published to Web & Android.`
    );
    setNewNav({ ...newNav, label: '' });
  };

  if (loading) return <StateFeedback type="loading" title="Loading Remote Configuration Engine..." />;

  const scopedNavs = navItems.filter((n) =>
    selectedTenantId ? n.tenant_id === selectedTenantId || n.scope === 'global' : n.scope === 'global'
  );

  return (
    <div className="space-y-6">
      {feedback && (
        <StateFeedback
          type={feedback.type}
          title={feedback.type === 'success' ? 'Synchronized Across Platform' : 'Remote Command Error'}
          message={feedback.text}
        />
      )}

      {/* Scope Bar & Maintenance Kill-Switch */}
      <Card className="p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full sm:w-80">
            <Select
              label="Configuration Scope Target"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              options={[
                { value: '', label: 'Global Platform Policy (All Institutions)' },
                ...tenants.map((t) => ({ value: t.id, label: `Tenant Override: ${t.name}` })),
              ]}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="green">Active Config v{config.version}</Badge>
            <Button
              variant={maintenanceMode ? 'danger' : 'outline'}
              loading={busy}
              onClick={() =>
                void sendRemoteAction(
                  {
                    action: 'toggle_maintenance',
                    maintenance_mode: !maintenanceMode,
                    maintenance_message: maintenanceMsg || 'Scheduled maintenance in progress.',
                  },
                  `Maintenance mode ${!maintenanceMode ? 'ENABLED' : 'DISABLED'}.`
                )
              }
            >
              <Wrench className="h-4 w-4" />
              {maintenanceMode ? 'Maintenance ON (Click to Disable)' : 'Enable Maintenance Mode'}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Dynamic Modules Control (Test A) */}
        <Card className="lg:col-span-7">
          <CardHeader
            title="Dynamic Module Matrix (Test A)"
            subtitle="Disable or enable modules remotely — immediately enforced in Web, Android & PostgreSQL RLS"
          />
          <div className="max-h-[480px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {modules.map((mod) => {
              const effectiveEnabled = selectedTenantId
                ? mod.is_globally_enabled && (tenantOverrides[mod.key] ?? true)
                : mod.is_globally_enabled;

              return (
                <div key={mod.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{mod.name}</span>
                      <Badge variant="slate">{mod.min_plan_tier}</Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Key: <code>{mod.key}</code> • {mod.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void sendRemoteAction(
                        {
                          action: 'toggle_module',
                          tenant_id: selectedTenantId || null,
                          module_key: mod.key,
                          is_enabled: !effectiveEnabled,
                        },
                        `Module "${mod.name}" ${!effectiveEnabled ? 'enabled' : 'disabled'} and synced.`
                      )
                    }
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      effectiveEnabled
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {effectiveEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Live Theme & Branding Engine (Test B) */}
        <Card className="lg:col-span-5">
          <CardHeader
            title="Remote Theme & Branding (Test B)"
            subtitle="Synchronize colors and identity across Web & Flutter Android without rebuilding APK"
          />
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-3 gap-3">
              <label className="space-y-1 text-xs font-medium">
                <span>Primary Green</span>
                <input
                  type="color"
                  value={themePrimary}
                  onChange={(e) => setThemePrimary(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
              </label>
              <label className="space-y-1 text-xs font-medium">
                <span>Emerald</span>
                <input
                  type="color"
                  value={themeEmerald}
                  onChange={(e) => setThemeEmerald(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
              </label>
              <label className="space-y-1 text-xs font-medium">
                <span>Dark Green</span>
                <input
                  type="color"
                  value={themeDarkGreen}
                  onChange={(e) => setThemeDarkGreen(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                />
              </label>
            </div>

            <Input label="Platform Brand Name" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
            <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setThemePrimary('#16A34A');
                  setThemeEmerald('#22C55E');
                  setThemeDarkGreen('#064E3B');
                }}
              >
                Reset CampusOS Green
              </Button>
              <Button
                size="sm"
                loading={busy}
                onClick={() =>
                  void sendRemoteAction(
                    {
                      action: 'update_theme',
                      tenant_id: selectedTenantId || null,
                      theme_tokens: {
                        primary: themePrimary,
                        emerald: themeEmerald,
                        darkGreen: themeDarkGreen,
                      },
                      branding: { brandName, tagline },
                    },
                    'Theme tokens published and broadcast to connected clients.'
                  )
                }
              >
                <Palette className="h-4 w-4" />
                Publish Theme
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Custom Configurable Navigation Builder (Test C) & Version Rollback (Test E) */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-6">
          <CardHeader
            title="Server-Driven Navigation Items (Test C)"
            subtitle="Add custom menu items rendered automatically on authorized Web & Android screens"
          />
          <div className="p-5 space-y-4">
            <form onSubmit={handleCreateNav} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/50 sm:grid-cols-2">
              <Input
                label="Menu Label *"
                required
                value={newNav.label}
                onChange={(e) => setNewNav({ ...newNav, label: e.target.value })}
                placeholder="Scholarship Portal"
              />
              <Input
                label="Route Path *"
                required
                value={newNav.route_path}
                onChange={(e) => setNewNav({ ...newNav, route_path: e.target.value })}
                placeholder="/custom/scholarships"
              />
              <Input
                label="Icon Name"
                value={newNav.icon}
                onChange={(e) => setNewNav({ ...newNav, icon: e.target.value })}
                placeholder="Award"
              />
              <Select
                label="Target Type"
                value={newNav.target_type}
                onChange={(e) => setNewNav({ ...newNav, target_type: e.target.value })}
                options={[
                  { value: 'custom_screen', label: 'Dynamic Custom Screen' },
                  { value: 'native', label: 'Built-In Module Route' },
                  { value: 'web', label: 'Embedded Web View' },
                ]}
              />
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" size="sm" loading={busy}>
                  <Plus className="h-4 w-4" />
                  Add Navigation Item
                </Button>
              </div>
            </form>

            <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {scopedNavs.map((nav) => (
                <div key={nav.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{nav.label}</span>
                    {nav.is_custom && <Badge variant="blue" className="ml-2">Custom</Badge>}
                    <p className="text-slate-500">
                      {nav.route_path} • {nav.platforms.join(', ')}
                    </p>
                  </div>
                  {nav.is_custom && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        void sendRemoteAction(
                          { action: 'delete_nav_item', tenant_id: nav.tenant_id, nav_item_id: nav.id },
                          `Removed custom navigation item "${nav.label}".`
                        )
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-6">
          <CardHeader
            title="Configuration Version History & Rollback (Test E)"
            subtitle="Every remote change creates an immutable snapshot you can restore in one click"
            action={
              <Button
                size="sm"
                variant="outline"
                loading={busy}
                onClick={() =>
                  void sendRemoteAction(
                    {
                      action: 'publish_version',
                      tenant_id: selectedTenantId || null,
                      change_summary: 'Manual checkpoint snapshot',
                    },
                    'Saved new configuration snapshot checkpoint.'
                  )
                }
              >
                <Save className="h-3.5 w-3.5" />
                Save Snapshot
              </Button>
            }
          />
          <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {versions.map((ver) => (
              <div key={ver.id} className="flex items-center justify-between gap-3 px-5 py-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <History className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      v{ver.version_number} ({ver.scope})
                    </span>
                    {ver.restored_from_version_id && <Badge variant="amber">Rollback</Badge>}
                  </div>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-300">{ver.change_summary}</p>
                  <p className="text-[11px] text-slate-400">{formatDate(ver.created_at)}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  loading={busy}
                  onClick={() =>
                    void sendRemoteAction(
                      { action: 'rollback_version', version_id: ver.id },
                      `Rolled back configuration to snapshot v${ver.version_number}. All connected apps synced.`
                    )
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Resolved Payload Inspector */}
      <Card>
        <CardHeader
          title="Resolved Effective Config Payload Preview"
          subtitle="Live output of public.resolve_effective_config() synced to Next.js & Flutter"
          action={<Sliders className="h-4 w-4 text-emerald-600" />}
        />
        <pre className="max-h-64 overflow-auto bg-slate-950 p-4 text-[11px] text-emerald-300">
          {JSON.stringify(config, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
