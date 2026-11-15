'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Plus, Printer, Receipt } from 'lucide-react';
import { ModuleGuard } from '@/components/school/module-guard';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { hasPermission } from '@/lib/config/remote-config';
import { Badge, Button, DataTable, Input, Modal, Select, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatCurrencyCents, formatDate } from '@/lib/utils';

interface StudentFeeRow extends Record<string, unknown> {
  id: string;
  student_id: string;
  title: string;
  gross_amount_cents: number;
  discount_amount_cents: number;
  net_amount_cents: number;
  paid_amount_cents: number;
  due_date: string;
  status: string;
  students?: { student_code: string; first_name: string; last_name: string };
}

export default function FeesPage() {
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;
  const canCollect = hasPermission(config, 'fees.collect');

  const [fees, setFees] = useState<StudentFeeRow[]>([]);
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([]);
  const [students, setStudents] = useState<Array<{ id: string; student_code: string; first_name: string; last_name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; default_amount_cents: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [ledgerModal, setLedgerModal] = useState(false);
  const [collectFee, setCollectFee] = useState<StudentFeeRow | null>(null);
  const [receiptRow, setReceiptRow] = useState<Record<string, unknown> | null>(null);

  const [feeForm, setFeeForm] = useState({
    student_id: '',
    fee_category_id: '',
    title: 'Monthly Tuition Fee',
    gross_amount: '50',
    discount_amount: '0',
    due_date: new Date().toISOString().slice(0, 10),
  });
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash');

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    const [{ data: feeRows }, { data: payRows }, { data: stuRows }, { data: catRows }] = await Promise.all([
      supabase.from('student_fees').select('*, students(student_code, first_name, last_name)').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('fee_payments').select('*, students(student_code, first_name, last_name)').eq('tenant_id', tenantId).order('paid_at', { ascending: false }).limit(50),
      supabase.from('students').select('id, student_code, first_name, last_name').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('fee_categories').select('id, name, default_amount_cents').eq('tenant_id', tenantId),
    ]);
    setFees((feeRows as StudentFeeRow[]) ?? []);
    setPayments(payRows ?? []);
    setStudents(stuRows ?? []);
    setCategories(catRows ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateFeeLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId) return;

    const { error } = await supabase.from('student_fees').insert({
      tenant_id: tenantId,
      student_id: feeForm.student_id,
      fee_category_id: feeForm.fee_category_id || null,
      title: feeForm.title,
      gross_amount_cents: Math.round(Number(feeForm.gross_amount) * 100),
      discount_amount_cents: Math.round(Number(feeForm.discount_amount) * 100),
      due_date: feeForm.due_date,
    });
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setLedgerModal(false);
      setFeedback({ type: 'success', text: 'Student fee invoice added to ledger.' });
      await loadData();
    }
  };

  const handleRecordOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId || !collectFee) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const cents = Math.round(Number(payAmount) * 100);
    const receiptNo = `RCP-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase
      .from('fee_payments')
      .insert({
        tenant_id: tenantId,
        student_fee_id: collectFee.id,
        student_id: collectFee.student_id,
        receipt_number: receiptNo,
        amount_cents: cents,
        payment_method: payMethod,
        payment_status: 'completed',
        collected_by: user?.id ?? null,
      })
      .select('*, students(student_code, first_name, last_name)')
      .single();

    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setCollectFee(null);
      setReceiptRow(data);
      setFeedback({ type: 'success', text: `Payment recorded (${receiptNo}) and student ledger updated.` });
      await loadData();
    }
  };

  const handlePrepareGatewayIntent = async (feeId: string) => {
    if (!tenantId) return;
    const res = await fetch(`/api/tenants/${tenantId}/payments/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_fee_id: feeId }),
    });
    const json = await res.json();
    if (!res.ok) setFeedback({ type: 'error', text: json.error ?? 'Failed to initialize gateway intent' });
    else setFeedback({ type: 'success', text: json.message });
  };

  return (
    <ModuleGuard moduleKey="fees" moduleName="Fees & Financial Management">
      <div className="space-y-6">
        {feedback && (
          <StateFeedback
            type={feedback.type}
            title={feedback.type === 'success' ? 'Financial Ledger Updated' : 'Ledger Error'}
            message={feedback.text}
          />
        )}

        {loading ? (
          <StateFeedback type="loading" title="Loading Student Fee Ledger..." />
        ) : (
          <>
            <DataTable
              title="Student Fee Ledger & Dues"
              subtitle="Tuition, admission, exam, and transport fees with server-side balance calculation"
              rows={fees}
              exportFilename="campusos-student-fees.csv"
              headerAction={
                canCollect && (
                  <Button size="sm" onClick={() => setLedgerModal(true)}>
                    <Plus className="h-4 w-4" />
                    Assign Fee
                  </Button>
                )
              }
              columns={[
                {
                  key: 'student_id',
                  header: 'Student',
                  render: (r) =>
                    r.students ? `${r.students.first_name} ${r.students.last_name} (${r.students.student_code})` : r.student_id,
                },
                { key: 'title', header: 'Fee Title' },
                { key: 'net_amount_cents', header: 'Net', render: (r) => formatCurrencyCents(r.net_amount_cents) },
                { key: 'paid_amount_cents', header: 'Paid', render: (r) => formatCurrencyCents(r.paid_amount_cents) },
                {
                  key: 'due_date',
                  header: 'Due Date',
                  render: (r) => formatDate(r.due_date),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (r) => <Badge variant={r.status === 'paid' ? 'green' : r.status === 'partial' ? 'amber' : 'red'}>{r.status}</Badge>,
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (r) =>
                    r.status !== 'paid' ? (
                      <div className="flex flex-wrap gap-1.5">
                        {canCollect && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setCollectFee(r);
                              setPayAmount(String(((r.net_amount_cents - r.paid_amount_cents) / 100).toFixed(2)));
                            }}
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            Collect
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => void handlePrepareGatewayIntent(r.id)}>
                          <CreditCard className="h-3.5 w-3.5" />
                          Gateway Intent
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold">Settled</span>
                    ),
                },
              ]}
            />

            <DataTable
              title="Payment Receipts & Audit Trail"
              rows={payments}
              exportFilename="campusos-fee-receipts.csv"
              columns={[
                { key: 'receipt_number', header: 'Receipt #' },
                { key: 'amount_cents', header: 'Amount', render: (r) => formatCurrencyCents(Number(r.amount_cents)) },
                { key: 'payment_method', header: 'Method' },
                { key: 'paid_at', header: 'Paid At', render: (r) => formatDate(String(r.paid_at)) },
                {
                  key: 'print',
                  header: 'Receipt',
                  render: (r) => (
                    <Button size="sm" variant="outline" onClick={() => setReceiptRow(r)}>
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                  ),
                },
              ]}
            />
          </>
        )}

        <Modal open={ledgerModal} onClose={() => setLedgerModal(false)} title="Assign Fee Ledger Entry">
          <form onSubmit={handleCreateFeeLedger} className="space-y-4">
            <Select
              label="Student *"
              required
              value={feeForm.student_id}
              onChange={(e) => setFeeForm({ ...feeForm, student_id: e.target.value })}
              options={[{ value: '', label: 'Select Student' }, ...students.map((s) => ({ value: s.id, label: `${s.first_name} ${s.last_name} (${s.student_code})` }))]}
            />
            <Select
              label="Fee Category"
              value={feeForm.fee_category_id}
              onChange={(e) => {
                const cat = categories.find((c) => c.id === e.target.value);
                setFeeForm({
                  ...feeForm,
                  fee_category_id: e.target.value,
                  title: cat ? cat.name : feeForm.title,
                  gross_amount: cat ? String(cat.default_amount_cents / 100) : feeForm.gross_amount,
                });
              }}
              options={[{ value: '', label: 'Custom Fee' }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Input label="Fee Title *" required value={feeForm.title} onChange={(e) => setFeeForm({ ...feeForm, title: e.target.value })} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Gross ($)*" type="number" step="0.01" required value={feeForm.gross_amount} onChange={(e) => setFeeForm({ ...feeForm, gross_amount: e.target.value })} />
              <Input label="Discount ($)" type="number" step="0.01" value={feeForm.discount_amount} onChange={(e) => setFeeForm({ ...feeForm, discount_amount: e.target.value })} />
              <Input label="Due Date *" type="date" required value={feeForm.due_date} onChange={(e) => setFeeForm({ ...feeForm, due_date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLedgerModal(false)}>Cancel</Button>
              <Button type="submit">Create Ledger Entry</Button>
            </div>
          </form>
        </Modal>

        <Modal open={Boolean(collectFee)} onClose={() => setCollectFee(null)} title="Collect In-Person Payment">
          {collectFee && (
            <form onSubmit={handleRecordOfflinePayment} className="space-y-4">
              <p className="text-sm font-medium">{collectFee.title}</p>
              <Input label="Amount ($)*" type="number" step="0.01" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              <Select
                label="Payment Method"
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'cheque', label: 'Cheque' },
                ]}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCollectFee(null)}>Cancel</Button>
                <Button type="submit">Record & Issue Receipt</Button>
              </div>
            </form>
          )}
        </Modal>

        <Modal open={Boolean(receiptRow)} onClose={() => setReceiptRow(null)} title="Official Payment Receipt">
          {receiptRow && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-[#16A34A] bg-white p-6 text-slate-900">
                <p className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">Official Fee Receipt</p>
                <h4 className="text-lg font-bold">{config.branding?.institutionName ?? config.tenant?.name}</h4>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-slate-400">Receipt #</span><p className="font-bold">{String(receiptRow.receipt_number)}</p></div>
                  <div><span className="text-xs text-slate-400">Amount Paid</span><p className="font-bold text-[#16A34A]">{formatCurrencyCents(Number(receiptRow.amount_cents))}</p></div>
                  <div><span className="text-xs text-slate-400">Method</span><p className="font-semibold capitalize">{String(receiptRow.payment_method)}</p></div>
                  <div><span className="text-xs text-slate-400">Date</span><p className="font-semibold">{formatDate(String(receiptRow.paid_at))}</p></div>
                </div>
              </div>
              <div className="no-print flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReceiptRow(null)}>Close</Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ModuleGuard>
  );
}
