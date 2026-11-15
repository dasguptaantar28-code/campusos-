'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, ShieldCheck, ShieldOff } from 'lucide-react';
import {
  Badge,
  Button,
  DataTable,
  Input,
  Modal,
  Select,
  StateFeedback,
} from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

interface TenantRow extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string;
  code: string;
  institution_type: string;
  email: string | null;
  phone: string | null;
  status: string;
  subscription_plan_id: string | null;
  created_at: string;
}

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [plans, setPlans] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    institution_type: 'school',
    email: '',
    phone: '',
    address: '',
    plan_code: 'STARTER',
  });

  const loadData = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    const [{ data: tenantRows }, { data: planRows }] = await Promise.all([
      supabase.from('tenants').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('subscription_plans').select('id, code, name').order('sort_order'),
    ]);
    setTenants((tenantRows as TenantRow[]) ?? []);
    setPlans(planRows ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleStatusChange = async (tenantId: string, status: 'active' | 'suspended' | 'deactivated') => {
    setFeedback(null);
    const res = await fetch('/api/super-admin/remote-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set_tenant_status',
        tenant_id: tenantId,
        status,
        reason: status === 'suspended' ? 'Suspended from Super Admin console' : undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: 'error', text: json.error ?? 'Failed to update tenant status' });
      return;
    }
    setFeedback({ type: 'success', text: `Tenant status updated to ${status.toUpperCase()} across backend & Realtime clients.` });
    await loadData();
  };

  const handlePlanChange = async (tenantId: string, planId: string) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('tenants').update({ subscription_plan_id: planId }).eq('id', tenantId);
    if (error) {
      setFeedback({ type: 'error', text: error.message });
    } else {
      setFeedback({ type: 'success', text: 'Subscription plan entitlement updated.' });
      await loadData();
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;

    const selectedPlan = plans.find((p) => p.code === form.plan_code);
    const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4);
    const code = 'CMP-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const { data: created, error } = await supabase
      .from('tenants')
      .insert({
        name: form.name,
        slug,
        code,
        institution_type: form.institution_type,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        status: 'active',
        subscription_plan_id: selectedPlan?.id ?? null,
        approved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      setFeedback({ type: 'error', text: error.message });
      return;
    }

    if (created && selectedPlan) {
      await supabase.from('subscriptions').insert({
        tenant_id: created.id,
        plan_id: selectedPlan.id,
        status: 'active',
        billing_cycle: 'monthly',
      });
      await supabase.from('app_config').insert({ scope: 'tenant', tenant_id: created.id, version_number: 1 });
    }

    setModalOpen(false);
    setForm({ name: '', institution_type: 'school', email: '', phone: '', address: '', plan_code: 'STARTER' });
    setFeedback({ type: 'success', text: `Institution "${created?.name}" provisioned and activated.` });
    await loadData();
  };

  if (loading) return <StateFeedback type="loading" title="Loading Institutions..." />;

  return (
    <div className="space-y-6">
      {feedback && (
        <StateFeedback
          type={feedback.type}
          title={feedback.type === 'success' ? 'Tenant Updated' : 'Operation Error'}
          message={feedback.text}
        />
      )}

      <DataTable
        title="Tenant & Institution Management"
        subtitle="Approve, activate, suspend, deactivate, and manage SaaS plan entitlements"
        rows={tenants}
        exportFilename="campusos-tenants.csv"
        headerAction={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Tenant
          </Button>
        }
        columns={[
          {
            key: 'name',
            header: 'Institution',
            render: (r) => (
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/60">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                  <p className="text-xs text-slate-500">{r.code} • /{r.slug}</p>
                </div>
              </div>
            ),
          },
          { key: 'institution_type', header: 'Type' },
          {
            key: 'subscription_plan_id',
            header: 'Plan',
            render: (r) => (
              <select
                value={r.subscription_plan_id ?? ''}
                onChange={(e) => void handlePlanChange(r.id, e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code}
                  </option>
                ))}
              </select>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => (
              <Badge variant={r.status === 'active' ? 'green' : r.status === 'pending' ? 'amber' : 'red'}>
                {r.status}
              </Badge>
            ),
          },
          {
            key: 'created_at',
            header: 'Created',
            render: (r) => <span className="text-xs text-slate-500">{formatDate(r.created_at)}</span>,
          },
          {
            key: 'actions',
            header: 'Lifecycle Actions',
            render: (r) => (
              <div className="flex flex-wrap gap-1.5">
                {r.status !== 'active' && (
                  <Button size="sm" onClick={() => void handleStatusChange(r.id, 'active')}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Approve / Activate
                  </Button>
                )}
                {r.status === 'active' && (
                  <Button variant="danger" size="sm" onClick={() => void handleStatusChange(r.id, 'suspended')}>
                    <ShieldOff className="h-3.5 w-3.5" />
                    Suspend
                  </Button>
                )}
                {r.status !== 'deactivated' && (
                  <Button variant="outline" size="sm" onClick={() => void handleStatusChange(r.id, 'deactivated')}>
                    Deactivate
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create New Institution Tenant">
        <form onSubmit={handleCreateTenant} className="space-y-4">
          <Input
            label="Institution Name *"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Maple Leaf Academy"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              value={form.institution_type}
              onChange={(e) => setForm({ ...form, institution_type: e.target.value })}
              options={[
                { value: 'school', label: 'School' },
                { value: 'college', label: 'College' },
                { value: 'academy', label: 'Academy' },
                { value: 'university', label: 'University' },
              ]}
            />
            <Select
              label="Subscription Plan"
              value={form.plan_code}
              onChange={(e) => setForm({ ...form, plan_code: e.target.value })}
              options={[
                { value: 'FREE', label: 'FREE' },
                { value: 'STARTER', label: 'STARTER' },
                { value: 'PROFESSIONAL', label: 'PROFESSIONAL' },
                { value: 'ENTERPRISE', label: 'ENTERPRISE' },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Official Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Input
            label="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create & Activate Tenant</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
