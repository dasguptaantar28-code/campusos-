'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Bell, DatabaseBackup, Plus, ShieldOff, Wrench } from 'lucide-react';
import {
  AreaTrendChart,
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  Select,
  StateFeedback,
  Textarea,
} from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatCurrencyCents, formatDate } from '@/lib/utils';

type AnyRow = Record<string, unknown>;

export default function SuperAdminDynamicSectionPage() {
  const { section } = useParams<{ section: string }>();
  const [rows, setRows] = useState<AnyRow[]>([]);
  const [extraRows, setExtraRows] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Interactive form state for notifications, support, settings, roles
  const [notifForm, setNotifForm] = useState({ title: '', body: '', tenant_id: '', category: 'broadcast' });
  const [settingForm, setSettingForm] = useState({ key: '', value: '{}', description: '' });
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    tenant_id: '',
    role_key: 'teacher',
    department: 'General',
  });
  const [healthData, setHealthData] = useState<AnyRow | null>(null);

  const loadSection = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);

    switch (section) {
      case 'schools': {
        const { data } = await supabase
          .from('tenants')
          .select('id, name, code, institution_type, email, phone, address, city, status, created_at')
          .is('deleted_at', null)
          .order('name');
        setRows(data ?? []);
        break;
      }
      case 'users': {
        const [{ data: profiles }, { data: tenants }] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, email, phone, is_active, created_at')
            .is('deleted_at', null)
            .order('created_at', { ascending: false }),
          supabase.from('tenants').select('id, name').is('deleted_at', null).order('name'),
        ]);
        setRows(profiles ?? []);
        setExtraRows(tenants ?? []);
        if ((tenants?.length ?? 0) > 0) {
          setUserForm((prev) => (prev.tenant_id ? prev : { ...prev, tenant_id: String(tenants![0].id) }));
        }
        break;
      }
      case 'plans': {
        const { data } = await supabase.from('subscription_plans').select('*').order('sort_order');
        setRows(data ?? []);
        break;
      }
      case 'billing': {
        const [{ data: inv }, { data: pay }] = await Promise.all([
          supabase.from('invoices').select('*, tenants(name)').order('created_at', { ascending: false }),
          supabase.from('payments').select('*, tenants(name)').order('created_at', { ascending: false }),
        ]);
        setRows(inv ?? []);
        setExtraRows(pay ?? []);
        break;
      }
      case 'modules': {
        const { data } = await supabase.from('modules').select('*').order('nav_order');
        setRows(data ?? []);
        break;
      }
      case 'features': {
        const [{ data: gf }, { data: tf }] = await Promise.all([
          supabase.from('global_features').select('*').order('feature_key'),
          supabase.from('tenant_features').select('*, tenants(name)').order('updated_at', { ascending: false }),
        ]);
        setRows(gf ?? []);
        setExtraRows(tf ?? []);
        break;
      }
      case 'roles': {
        const { data } = await supabase.from('roles').select('*').order('key');
        setRows(data ?? []);
        break;
      }
      case 'permissions': {
        const { data } = await supabase.from('permissions').select('*').order('module_key');
        setRows(data ?? []);
        break;
      }
      case 'notifications': {
        const [{ data: notifs }, { data: tenants }] = await Promise.all([
          supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('tenants').select('id, name').is('deleted_at', null).order('name'),
        ]);
        setRows(notifs ?? []);
        setExtraRows(tenants ?? []);
        break;
      }
      case 'analytics': {
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id, name, status, institution_type, created_at')
          .is('deleted_at', null);
        setRows(tenants ?? []);
        break;
      }
      case 'monitoring': {
        const res = await fetch('/api/health', { cache: 'no-store' });
        setHealthData(await res.json());
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        setRows(logs ?? []);
        break;
      }
      case 'devices': {
        const { data } = await supabase
          .from('device_registrations')
          .select('*, profiles(email, full_name)')
          .order('last_seen_at', { ascending: false });
        setRows(data ?? []);
        break;
      }
      case 'security': {
        const { data } = await supabase
          .from('user_sessions')
          .select('*, profiles(email, full_name)')
          .order('created_at', { ascending: false })
          .limit(100);
        setRows(data ?? []);
        break;
      }
      case 'audit-logs': {
        const { data } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);
        setRows(data ?? []);
        break;
      }
      case 'integrations': {
        const res = await fetch('/api/health', { cache: 'no-store' });
        setHealthData(await res.json());
        break;
      }
      case 'support': {
        const { data } = await supabase
          .from('support_tickets')
          .select('*, tenants(name)')
          .order('created_at', { ascending: false });
        setRows(data ?? []);
        break;
      }
      case 'backups': {
        const { data } = await supabase
          .from('backups_metadata')
          .select('*')
          .order('created_at', { ascending: false });
        setRows(data ?? []);
        break;
      }
      case 'settings': {
        const { data } = await supabase.from('platform_settings').select('*').order('key');
        setRows(data ?? []);
        break;
      }
      default:
        setRows([]);
    }
    setLoading(false);
  }, [section]);

  useEffect(() => {
    void loadSection();
  }, [loadSection]);

  const handleRevokeSession = async (sessionId: string) => {
    const res = await fetch('/api/super-admin/remote-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke_session', session_id: sessionId, reason: 'Revoked from Security Center' }),
    });
    const json = await res.json();
    if (!res.ok) setFeedback({ type: 'error', text: json.error ?? 'Failed to revoke session' });
    else {
      setFeedback({ type: 'success', text: 'Session revoked and user flagged for immediate sign-out.' });
      await loadSection();
    }
  };

  const handleToggleModule = async (moduleKey: string, nextVal: boolean) => {
    const res = await fetch('/api/super-admin/remote-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_module', tenant_id: null, module_key: moduleKey, is_enabled: nextVal }),
    });
    const json = await res.json();
    if (!res.ok) setFeedback({ type: 'error', text: json.error ?? 'Failed' });
    else {
      setFeedback({ type: 'success', text: `Module ${moduleKey} ${nextVal ? 'enabled' : 'disabled'} globally.` });
      await loadSection();
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const { data: profiles } = await supabase.from('profiles').select('id').limit(200);
    const recipients = (profiles ?? []).map((p) => p.id);
    if (recipients.length === 0) {
      setFeedback({ type: 'error', text: 'No recipient profiles available.' });
      return;
    }

    const { error } = await supabase.from('notifications').insert(
      recipients.map((uid) => ({
        tenant_id: notifForm.tenant_id || null,
        recipient_user_id: uid,
        title: notifForm.title,
        body: notifForm.body,
        category: notifForm.category,
        push_status: 'skipped_unconfigured',
      }))
    );

    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setFeedback({ type: 'success', text: `Dispatched notification to ${recipients.length} platform user(s).` });
      setModalOpen(false);
      setNotifForm({ title: '', body: '', tenant_id: '', category: 'broadcast' });
      await loadSection();
    }
  };

  const handleTriggerBackup = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('backups_metadata').insert({
      scope: 'platform',
      backup_type: 'manual',
      status: 'completed',
      storage_path: `backups/platform-${new Date().toISOString().slice(0, 10)}.json`,
      triggered_by: user?.id ?? null,
      completed_at: new Date().toISOString(),
    });
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setFeedback({ type: 'success', text: 'Backup metadata snapshot recorded.' });
      await loadSection();
    }
  };

  const handleTicketStatus = async (ticketId: string, status: string) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setFeedback({ type: 'success', text: `Support ticket updated to ${status}.` });
      await loadSection();
    }
  };

  const handleSaveSetting = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    try {
      const parsed = JSON.parse(settingForm.value);
      const { error } = await supabase.from('platform_settings').upsert(
        {
          key: settingForm.key,
          value_json: parsed,
          description: settingForm.description,
        },
        { onConflict: 'key' }
      );
      if (error) setFeedback({ type: 'error', text: error.message });
      else {
        setFeedback({ type: 'success', text: `Saved platform setting "${settingForm.key}".` });
        setModalOpen(false);
        await loadSection();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Value must be valid JSON.' });
    }
  };

  const handleCreateProvisionedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch('/api/super-admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userForm),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'error', text: json.error ?? 'Failed to provision user account' });
      return;
    }
    setModalOpen(false);
    setUserForm((prev) => ({ ...prev, full_name: '', email: '', password: '', phone: '' }));
    setFeedback({
      type: 'success',
      text: `Provisioned ${userForm.role_key === 'parent' ? 'Guardian' : userForm.role_key} account for ${userForm.email}.`,
    });
    await loadSection();
  };

  if (loading) return <StateFeedback type="loading" title={`Loading ${section}...`} />;

  return (
    <div className="space-y-6">
      {feedback && (
        <StateFeedback
          type={feedback.type}
          title={feedback.type === 'success' ? 'Saved' : 'Error'}
          message={feedback.text}
        />
      )}

      {section === 'schools' && (
        <DataTable
          title="School Directory"
          subtitle="Institution contact profiles, addresses, and status"
          rows={rows}
          exportFilename="campusos-schools.csv"
          columns={[
            { key: 'name', header: 'School Name' },
            { key: 'code', header: 'Code' },
            { key: 'institution_type', header: 'Type' },
            { key: 'email', header: 'Email' },
            { key: 'city', header: 'City' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'active' ? 'green' : 'amber'}>{String(r.status)}</Badge> },
          ]}
        />
      )}

      {section === 'users' && (
        <>
          <DataTable
            title="Platform User Directory"
            subtitle="Provision Teacher, Guardian, School Admin & Staff accounts from Super Admin"
            rows={rows}
            exportFilename="campusos-users.csv"
            headerAction={
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Teacher / Guardian
              </Button>
            }
            columns={[
              { key: 'full_name', header: 'Name' },
              { key: 'email', header: 'Email' },
              { key: 'phone', header: 'Phone' },
              { key: 'is_active', header: 'Active', render: (r) => <Badge variant={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Active' : 'Disabled'}</Badge> },
              { key: 'created_at', header: 'Joined', render: (r) => formatDate(String(r.created_at)) },
            ]}
          />
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Provision Teacher / Guardian Account">
            <form onSubmit={handleCreateProvisionedUser} className="space-y-4">
              <Select
                label="Institution *"
                required
                value={userForm.tenant_id}
                onChange={(e) => setUserForm({ ...userForm, tenant_id: e.target.value })}
                options={extraRows.map((t) => ({ value: String(t.id), label: String(t.name) }))}
              />
              <Select
                label="Account Role *"
                value={userForm.role_key}
                onChange={(e) => setUserForm({ ...userForm, role_key: e.target.value })}
                options={[
                  { value: 'teacher', label: 'Teacher' },
                  { value: 'parent', label: 'Guardian / Parent' },
                  { value: 'school_admin', label: 'School Admin' },
                  { value: 'accountant', label: 'Accountant' },
                  { value: 'staff', label: 'Staff' },
                ]}
              />
              <Input label="Full Name *" required value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Email *" type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                <Input label="Phone" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} />
              </div>
              <Input label="Initial Password (8+ chars) *" type="password" required minLength={8} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
              {userForm.role_key === 'teacher' && (
                <Input label="Department" value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} />
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Account</Button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {section === 'plans' && (
        <DataTable
          title="Subscription Plans"
          subtitle="Configurable tier limits enforced inside PostgreSQL"
          rows={rows}
          columns={[
            { key: 'code', header: 'Code', render: (r) => <Badge variant="green">{String(r.code)}</Badge> },
            { key: 'name', header: 'Plan Name' },
            { key: 'monthly_price_cents', header: 'Monthly', render: (r) => formatCurrencyCents(Number(r.monthly_price_cents)) },
            { key: 'max_students', header: 'Max Students' },
            { key: 'max_teachers', header: 'Max Teachers' },
            { key: 'max_admin_accounts', header: 'Max Admins' },
            { key: 'support_level', header: 'Support' },
          ]}
        />
      )}

      {section === 'billing' && (
        <div className="space-y-6">
          <DataTable
            title="SaaS Subscription Invoices"
            rows={rows}
            exportFilename="campusos-invoices.csv"
            columns={[
              { key: 'invoice_number', header: 'Invoice #' },
              { key: 'amount_cents', header: 'Amount', render: (r) => formatCurrencyCents(Number(r.amount_cents)) },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'paid' ? 'green' : 'amber'}>{String(r.status)}</Badge> },
              { key: 'due_date', header: 'Due Date' },
            ]}
          />
          <DataTable
            title="Verified Gateway Payments"
            rows={extraRows}
            columns={[
              { key: 'provider', header: 'Gateway' },
              { key: 'provider_payment_id', header: 'Reference' },
              { key: 'amount_cents', header: 'Amount', render: (r) => formatCurrencyCents(Number(r.amount_cents)) },
              { key: 'status', header: 'Status' },
            ]}
          />
        </div>
      )}

      {section === 'modules' && (
        <DataTable
          title="Global Modules Governance"
          subtitle="Enable or disable modules across all Web & Android clients instantaneously"
          rows={rows}
          columns={[
            { key: 'key', header: 'Key' },
            { key: 'name', header: 'Module Name' },
            { key: 'min_plan_tier', header: 'Min Plan', render: (r) => <Badge variant="slate">{String(r.min_plan_tier)}</Badge> },
            { key: 'nav_order', header: 'Order' },
            {
              key: 'is_globally_enabled',
              header: 'Global Status',
              render: (r) => (
                <Button
                  size="sm"
                  variant={r.is_globally_enabled ? 'primary' : 'danger'}
                  onClick={() => void handleToggleModule(String(r.key), !r.is_globally_enabled)}
                >
                  {r.is_globally_enabled ? 'Enabled' : 'Disabled'}
                </Button>
              ),
            },
          ]}
        />
      )}

      {section === 'features' && (
        <DataTable
          title="Tenant Feature Overrides"
          subtitle="Institution-specific module and feature overrides"
          rows={extraRows}
          columns={[
            { key: 'tenant_id', header: 'Tenant ID' },
            { key: 'module_key', header: 'Module' },
            { key: 'feature_key', header: 'Feature' },
            { key: 'is_enabled', header: 'State', render: (r) => <Badge variant={r.is_enabled ? 'green' : 'red'}>{r.is_enabled ? 'Enabled' : 'Disabled'}</Badge> },
          ]}
        />
      )}

      {section === 'roles' && (
        <DataTable
          title="Role Definitions"
          rows={rows}
          columns={[
            { key: 'key', header: 'Role Key' },
            { key: 'name', header: 'Role Name' },
            { key: 'description', header: 'Description' },
            { key: 'is_system', header: 'System Role', render: (r) => <Badge variant={r.is_system ? 'green' : 'blue'}>{r.is_system ? 'Canonical' : 'Custom'}</Badge> },
          ]}
        />
      )}

      {section === 'permissions' && (
        <DataTable
          title="Granular Capability Permissions"
          rows={rows}
          columns={[
            { key: 'key', header: 'Permission Key' },
            { key: 'module_key', header: 'Module' },
            { key: 'name', header: 'Name' },
            { key: 'description', header: 'Description' },
          ]}
        />
      )}

      {section === 'notifications' && (
        <>
          <DataTable
            title="Platform Broadcasts & Notification Log"
            rows={rows}
            headerAction={
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Bell className="h-4 w-4" />
                Send Broadcast
              </Button>
            }
            columns={[
              { key: 'title', header: 'Title' },
              { key: 'category', header: 'Category' },
              { key: 'push_status', header: 'Push Status', render: (r) => <Badge variant={r.push_status === 'sent' ? 'green' : 'amber'}>{String(r.push_status)}</Badge> },
              { key: 'created_at', header: 'Sent At', render: (r) => formatDate(String(r.created_at)) },
            ]}
          />
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Send Platform Notification">
            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <Input label="Title *" required value={notifForm.title} onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })} />
              <Textarea label="Message *" required rows={4} value={notifForm.body} onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })} />
              <Select
                label="Category"
                value={notifForm.category}
                onChange={(e) => setNotifForm({ ...notifForm, category: e.target.value })}
                options={[
                  { value: 'broadcast', label: 'Platform Broadcast' },
                  { value: 'announcement', label: 'Announcement' },
                  { value: 'security', label: 'Security Alert' },
                ]}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Dispatch Notification</Button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {section === 'analytics' && (
        <div className="space-y-6">
          <AreaTrendChart
            title="Institutions by Status"
            subtitle="Live breakdown across all tenant organizations"
            points={[
              { label: 'Active', value: rows.filter((r) => r.status === 'active').length },
              { label: 'Pending', value: rows.filter((r) => r.status === 'pending').length },
              { label: 'Suspended', value: rows.filter((r) => r.status === 'suspended').length },
              { label: 'Deactivated', value: rows.filter((r) => r.status === 'deactivated').length },
            ]}
          />
          <DataTable
            title="Institution Breakdown"
            rows={rows}
            columns={[
              { key: 'name', header: 'Institution' },
              { key: 'institution_type', header: 'Type' },
              { key: 'status', header: 'Status' },
            ]}
          />
        </div>
      )}

      {section === 'monitoring' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold">Live Backend Telemetry</h3>
            <pre className="mt-3 rounded-xl bg-slate-950 p-4 text-xs text-emerald-300">
              {JSON.stringify(healthData, null, 2)}
            </pre>
          </Card>
          <DataTable
            title="Recent Activity Stream"
            rows={rows}
            columns={[
              { key: 'activity_type', header: 'Activity' },
              { key: 'platform', header: 'Platform' },
              { key: 'description', header: 'Details' },
              { key: 'created_at', header: 'Timestamp', render: (r) => formatDate(String(r.created_at)) },
            ]}
          />
        </div>
      )}

      {section === 'devices' && (
        <DataTable
          title="Registered Android & Web Devices"
          subtitle="Devices enrolled for Remote Configuration & FCM Push"
          rows={rows}
          columns={[
            { key: 'platform', header: 'Platform', render: (r) => <Badge variant="blue">{String(r.platform)}</Badge> },
            { key: 'device_name', header: 'Device Name' },
            { key: 'device_id', header: 'Device ID' },
            { key: 'app_version', header: 'App Version' },
            { key: 'is_active', header: 'Active', render: (r) => <Badge variant={r.is_active ? 'green' : 'red'}>{r.is_active ? 'Active' : 'Inactive'}</Badge> },
            { key: 'last_seen_at', header: 'Last Seen', render: (r) => formatDate(String(r.last_seen_at)) },
          ]}
        />
      )}

      {section === 'security' && (
        <DataTable
          title="Security Center — Active & Revoked Sessions"
          subtitle="Remotely revoke sessions to immediately sign out compromised accounts"
          rows={rows}
          columns={[
            { key: 'platform', header: 'Platform' },
            { key: 'user_id', header: 'User ID' },
            { key: 'session_token_hash', header: 'Session Hash' },
            {
              key: 'revoked_at',
              header: 'Status',
              render: (r) => <Badge variant={r.revoked_at ? 'red' : 'green'}>{r.revoked_at ? 'Revoked' : 'Active'}</Badge>,
            },
            {
              key: 'actions',
              header: 'Action',
              render: (r) =>
                !r.revoked_at ? (
                  <Button variant="danger" size="sm" onClick={() => void handleRevokeSession(String(r.id))}>
                    <ShieldOff className="h-3.5 w-3.5" />
                    Revoke Session
                  </Button>
                ) : (
                  <span className="text-xs text-slate-400">Revoked</span>
                ),
            },
          ]}
        />
      )}

      {section === 'audit-logs' && (
        <DataTable
          title="Immutable Security & Configuration Audit Logs"
          rows={rows}
          exportFilename="campusos-audit-logs.csv"
          columns={[
            { key: 'action', header: 'Action', render: (r) => <Badge variant="slate">{String(r.action)}</Badge> },
            { key: 'entity_type', header: 'Entity' },
            { key: 'entity_id', header: 'Record ID' },
            { key: 'actor_user_id', header: 'Actor' },
            { key: 'created_at', header: 'Timestamp', render: (r) => formatDate(String(r.created_at)) },
          ]}
        />
      )}

      {section === 'integrations' && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: 'Supabase Cloud (Postgres, Auth, Realtime, Storage)',
              status: healthData?.status === 'operational' ? 'Connected' : 'Configure Env Vars',
              envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
            },
            {
              name: 'Firebase Cloud Messaging (Android Push)',
              status: 'Server Secret Ready Structure',
              envVars: ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_JSON', 'google-services.json'],
            },
            {
              name: 'Stripe Payment Gateway (Fees & SaaS Billing)',
              status: 'Webhook Signature Verified Structure',
              envVars: ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
            },
          ].map((item) => (
            <Card key={item.name} className="p-5">
              <div className="flex items-center justify-between">
                <Wrench className="h-5 w-5 text-[#16A34A]" />
                <Badge variant={item.status === 'Connected' ? 'green' : 'amber'}>{item.status}</Badge>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">{item.name}</h3>
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {item.envVars.map((v) => (
                  <li key={v}>• <code>{v}</code></li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {section === 'support' && (
        <DataTable
          title="Tenant Support Tickets"
          rows={rows}
          columns={[
            { key: 'subject', header: 'Subject' },
            { key: 'priority', header: 'Priority', render: (r) => <Badge variant={r.priority === 'critical' ? 'red' : 'amber'}>{String(r.priority)}</Badge> },
            { key: 'status', header: 'Status' },
            {
              key: 'actions',
              header: 'Workflow',
              render: (r) => (
                <select
                  value={String(r.status)}
                  onChange={(e) => void handleTicketStatus(String(r.id), e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="open">open</option>
                  <option value="in_progress">in_progress</option>
                  <option value="resolved">resolved</option>
                  <option value="closed">closed</option>
                </select>
              ),
            },
          ]}
        />
      )}

      {section === 'backups' && (
        <DataTable
          title="Backup Management"
          subtitle="Platform & configuration snapshot records"
          rows={rows}
          headerAction={
            <Button size="sm" onClick={() => void handleTriggerBackup()}>
              <DatabaseBackup className="h-4 w-4" />
              Create Backup Record
            </Button>
          }
          columns={[
            { key: 'scope', header: 'Scope' },
            { key: 'backup_type', header: 'Type' },
            { key: 'storage_path', header: 'Snapshot Path' },
            { key: 'status', header: 'Status', render: (r) => <Badge variant="green">{String(r.status)}</Badge> },
            { key: 'created_at', header: 'Created', render: (r) => formatDate(String(r.created_at)) },
          ]}
        />
      )}

      {section === 'settings' && (
        <>
          <DataTable
            title="Global Platform Settings"
            rows={rows}
            headerAction={
              <Button size="sm" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Upsert Setting
              </Button>
            }
            columns={[
              { key: 'key', header: 'Setting Key' },
              { key: 'description', header: 'Description' },
              { key: 'value_json', header: 'JSON Value', render: (r) => <code className="text-xs">{JSON.stringify(r.value_json)}</code> },
            ]}
          />
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Save Global Platform Setting">
            <form onSubmit={handleSaveSetting} className="space-y-4">
              <Input label="Key *" required value={settingForm.key} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} placeholder="support_email" />
              <Input label="Description" value={settingForm.description} onChange={(e) => setSettingForm({ ...settingForm, description: e.target.value })} />
              <Textarea label="Value (JSON) *" rows={4} value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Setting</Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
