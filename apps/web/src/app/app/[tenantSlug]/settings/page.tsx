'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Palette, Plus, Save } from 'lucide-react';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Button, Card, CardHeader, DataTable, Input, Modal, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function SchoolSettingsPage() {
  const { config, refreshConfig } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [primary, setPrimary] = useState(config.theme?.primary ?? '#16A34A');
  const [emerald, setEmerald] = useState(config.theme?.emerald ?? '#22C55E');
  const [institutionName, setInstitutionName] = useState(config.branding?.institutionName ?? '');
  const [gradingRules, setGradingRules] = useState<Array<Record<string, unknown>>>([]);
  const [ruleModal, setRuleModal] = useState(false);
  const [ruleForm, setRuleForm] = useState({ grade_label: 'A+', min_percentage: '80', max_percentage: '100', gpa_point: '5.0' });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadRules = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('grading_rules')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('min_percentage', { ascending: false });
    setGradingRules(data ?? []);
  }, [tenantId]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    const res = await fetch('/api/super-admin/remote-control', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_theme',
        tenant_id: tenantId,
        theme_tokens: { primary, emerald, darkGreen: '#064E3B' },
        branding: { institutionName },
      }),
    });
    const json = await res.json();
    if (!res.ok) setFeedback({ type: 'error', text: json.error ?? 'Failed to save theme' });
    else {
      await refreshConfig();
      setFeedback({ type: 'success', text: 'Institution theme & branding published across Web and Mobile.' });
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId) return;
    const { error } = await supabase.from('grading_rules').upsert(
      {
        tenant_id: tenantId,
        grade_label: ruleForm.grade_label,
        min_percentage: Number(ruleForm.min_percentage),
        max_percentage: Number(ruleForm.max_percentage),
        gpa_point: Number(ruleForm.gpa_point),
      },
      { onConflict: 'tenant_id,grade_label' }
    );
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setRuleModal(false);
      setFeedback({ type: 'success', text: `Saved grading rule "${ruleForm.grade_label}".` });
      await loadRules();
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <StateFeedback
          type={feedback.type}
          title={feedback.type === 'success' ? 'Settings Saved' : 'Error'}
          message={feedback.text}
        />
      )}

      <Card>
        <CardHeader title="School Branding & Theme Overrides" subtitle="Permitted institution-level theme synced via Remote Config" action={<Palette className="h-4 w-4 text-[#16A34A]" />} />
        <form onSubmit={handleSaveBranding} className="grid gap-4 p-5 sm:grid-cols-3">
          <Input label="Display Institution Name" value={institutionName} onChange={(e) => setInstitutionName(e.target.value)} />
          <label className="space-y-1.5 text-xs font-medium">
            <span>Primary Brand Color</span>
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-full rounded-xl border p-1" />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            <span>Accent Emerald Color</span>
            <input type="color" value={emerald} onChange={(e) => setEmerald(e.target.value)} className="h-10 w-full rounded-xl border p-1" />
          </label>
          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit">
              <Save className="h-4 w-4" />
              Save & Sync Branding
            </Button>
          </div>
        </form>
      </Card>

      <DataTable
        title="Institution Grading Rules"
        subtitle="Used by calculate_exam_results() to compute GPA & letter grades"
        rows={gradingRules}
        headerAction={
          <Button size="sm" onClick={() => setRuleModal(true)}>
            <Plus className="h-4 w-4" />
            Add Grading Rule
          </Button>
        }
        columns={[
          { key: 'grade_label', header: 'Grade' },
          { key: 'min_percentage', header: 'Min %' },
          { key: 'max_percentage', header: 'Max %' },
          { key: 'gpa_point', header: 'GPA Point' },
        ]}
      />

      <Modal open={ruleModal} onClose={() => setRuleModal(false)} title="Configure Grading Rule">
        <form onSubmit={handleAddRule} className="space-y-4">
          <Input label="Grade Label *" required value={ruleForm.grade_label} onChange={(e) => setRuleForm({ ...ruleForm, grade_label: e.target.value })} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Min %" type="number" step="0.01" required value={ruleForm.min_percentage} onChange={(e) => setRuleForm({ ...ruleForm, min_percentage: e.target.value })} />
            <Input label="Max %" type="number" step="0.01" required value={ruleForm.max_percentage} onChange={(e) => setRuleForm({ ...ruleForm, max_percentage: e.target.value })} />
            <Input label="GPA Point" type="number" step="0.01" required value={ruleForm.gpa_point} onChange={(e) => setRuleForm({ ...ruleForm, gpa_point: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setRuleModal(false)}>Cancel</Button>
            <Button type="submit">Save Rule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
