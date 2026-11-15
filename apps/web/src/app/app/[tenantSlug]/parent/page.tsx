'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, CalendarCheck2, CreditCard, NotebookPen, Users } from 'lucide-react';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Badge, Card, CardHeader, Select, StatCard, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatCurrencyCents, formatDate } from '@/lib/utils';

export default function ParentPortalPage() {
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [children, setChildren] = useState<Array<{ id: string; student_code: string; first_name: string; last_name: string; class_id: string | null }>>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [attendance, setAttendance] = useState<Array<Record<string, unknown>>>([]);
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);
  const [homework, setHomework] = useState<Array<Record<string, unknown>>>([]);
  const [fees, setFees] = useState<Array<Record<string, unknown>>>([]);
  const [notices, setNotices] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);

    const { data: stuRows } = await supabase
      .from('students')
      .select('id, student_code, first_name, last_name, class_id')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    setChildren(stuRows ?? []);
    if (stuRows?.[0]?.id && !selectedChildId) setSelectedChildId(stuRows[0].id);

    const { data: noticeRows } = await supabase
      .from('notices')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('published_at', { ascending: false })
      .limit(5);
    setNotices(noticeRows ?? []);
    setLoading(false);
  }, [selectedChildId, tenantId]);

  useEffect(() => {
    void loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    const loadChildDetails = async () => {
      if (!tenantId || !selectedChildId) return;
      const supabase = createBrowserSupabaseClient();
      if (!supabase) return;
      const child = children.find((c) => c.id === selectedChildId);

      const [{ data: att }, { data: res }, { data: fee }, { data: hw }] = await Promise.all([
        supabase.from('attendance').select('*').eq('tenant_id', tenantId).eq('student_id', selectedChildId).order('attendance_date', { ascending: false }).limit(15),
        supabase.from('results').select('*, exams(name)').eq('tenant_id', tenantId).eq('student_id', selectedChildId).eq('is_published', true),
        supabase.from('student_fees').select('*').eq('tenant_id', tenantId).eq('student_id', selectedChildId),
        child?.class_id
          ? supabase.from('homework').select('*, subjects(name)').eq('tenant_id', tenantId).eq('class_id', child.class_id).is('deleted_at', null).limit(10)
          : Promise.resolve({ data: [] }),
      ]);

      setAttendance(att ?? []);
      setResults(res ?? []);
      setFees(fee ?? []);
      setHomework(hw ?? []);
    };
    void loadChildDetails();
  }, [children, selectedChildId, tenantId]);

  if (loading) return <StateFeedback type="loading" title="Loading Parent Portal..." />;

  const dueCents = fees.reduce((acc, f) => acc + Math.max(0, Number(f.net_amount_cents ?? 0) - Number(f.paid_amount_cents ?? 0)), 0);
  const presentDays = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const attPct = attendance.length > 0 ? Math.round((presentDays / attendance.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Parent & Guardian Portal</h2>
            <p className="text-xs text-slate-500">Strictly scoped to children explicitly linked via student_guardians.</p>
          </div>
          {children.length > 0 && (
            <div className="w-72">
              <Select
                label="Linked Child"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                options={children.map((c) => ({ value: c.id, label: `${c.first_name} ${c.last_name} (${c.student_code})` }))}
              />
            </div>
          )}
        </div>
      </Card>

      {children.length === 0 ? (
        <StateFeedback
          type="empty"
          title="No Linked Children Found"
          message="Ask your School Admin to link your guardian account to your child's student profile."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Linked Children" value={children.length} icon={<Users className="h-5 w-5" />} />
            <StatCard label="Attendance Rate" value={`${attPct}%`} hint={`${attendance.length} recent days`} icon={<CalendarCheck2 className="h-5 w-5" />} />
            <StatCard label="Published Results" value={results.length} icon={<Award className="h-5 w-5" />} />
            <StatCard label="Outstanding Dues" value={formatCurrencyCents(dueCents)} icon={<CreditCard className="h-5 w-5" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Recent Attendance" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendance.length === 0 ? (
                  <p className="p-5 text-xs text-slate-500">No attendance logged yet.</p>
                ) : (
                  attendance.map((a) => (
                    <div key={String(a.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                      <span>{String(a.attendance_date)}</span>
                      <Badge variant={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'amber'}>
                        {String(a.status)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Published Exam Results" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.length === 0 ? (
                  <p className="p-5 text-xs text-slate-500">No approved results published yet.</p>
                ) : (
                  results.map((r) => (
                    <div key={String(r.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <p className="font-semibold">{(r.exams as { name?: string } | null)?.name ?? 'Examination'}</p>
                        <p className="text-xs text-slate-500">
                          {String(r.total_marks)} / {String(r.max_total_marks)} ({String(r.percentage)}%)
                        </p>
                      </div>
                      <Badge variant="green">
                        Grade {String(r.grade)} • GPA {String(r.gpa)}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Assigned Homework" action={<NotebookPen className="h-4 w-4 text-[#16A34A]" />} />
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {homework.length === 0 ? (
                  <p className="p-5 text-xs text-slate-500">No active homework.</p>
                ) : (
                  homework.map((h) => (
                    <div key={String(h.id)} className="px-5 py-3 text-sm">
                      <p className="font-semibold">{String(h.title)}</p>
                      <p className="text-xs text-slate-500">Due {formatDate(String(h.due_date))}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="School Notices" />
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notices.length === 0 ? (
                  <p className="p-5 text-xs text-slate-500">No school announcements.</p>
                ) : (
                  notices.map((n) => (
                    <div key={String(n.id)} className="px-5 py-3 text-sm">
                      <p className="font-semibold">{String(n.title)}</p>
                      <p className="text-xs text-slate-500">{String(n.body)}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
