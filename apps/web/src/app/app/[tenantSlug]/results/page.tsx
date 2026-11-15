'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, CheckCircle2, Printer } from 'lucide-react';
import { ModuleGuard } from '@/components/school/module-guard';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { hasPermission } from '@/lib/config/remote-config';
import { Badge, Button, DataTable, Modal, Select, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface ResultRow extends Record<string, unknown> {
  id: string;
  exam_id: string;
  student_id: string;
  total_marks: number;
  max_total_marks: number;
  percentage: number;
  gpa: number;
  grade: string;
  rank_position: number | null;
  is_passed: boolean;
  is_published: boolean;
  students?: { student_code: string; first_name: string; last_name: string };
  exams?: { name: string };
}

export default function ResultsPage() {
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;
  const canApprove = hasPermission(config, 'results.approve');

  const [exams, setExams] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [reportCard, setReportCard] = useState<ResultRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    const { data: ex } = await supabase
      .from('exams')
      .select('id, name, status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    setExams(ex ?? []);
    const targetExam = selectedExamId || ex?.[0]?.id || '';
    if (!selectedExamId && targetExam) setSelectedExamId(targetExam);

    if (targetExam) {
      const { data: resRows } = await supabase
        .from('results')
        .select('*, students(student_code, first_name, last_name), exams(name)')
        .eq('tenant_id', tenantId)
        .eq('exam_id', targetExam)
        .order('rank_position', { ascending: true });
      setResults((resRows as ResultRow[]) ?? []);
    } else {
      setResults([]);
    }
    setLoading(false);
  }, [selectedExamId, tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleApproveAndPublish = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId || !selectedExamId) return;
    const { data, error } = await supabase.rpc('approve_and_publish_exam_results', {
      p_tenant_id: tenantId,
      p_exam_id: selectedExamId,
    });
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setFeedback({ type: 'success', text: `Approved & published ${data ?? 0} result(s) and generated official report cards.` });
      await loadData();
    }
  };

  return (
    <ModuleGuard moduleKey="results" moduleName="Results & Report Cards">
      <div className="space-y-6">
        {feedback && (
          <StateFeedback
            type={feedback.type}
            title={feedback.type === 'success' ? 'Results Published' : 'Approval Error'}
            message={feedback.text}
          />
        )}

        <div className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="w-72">
            <Select
              label="Examination"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              options={
                exams.length === 0
                  ? [{ value: '', label: 'No examinations' }]
                  : exams.map((e) => ({ value: e.id, label: `${e.name} (${e.status})` }))
              }
            />
          </div>
          {canApprove && selectedExamId && (
            <Button onClick={() => void handleApproveAndPublish()}>
              <CheckCircle2 className="h-4 w-4" />
              Approve & Publish Results
            </Button>
          )}
        </div>

        {loading ? (
          <StateFeedback type="loading" title="Loading Merit List & Results..." />
        ) : (
          <DataTable
            title="Merit List & Examination Results"
            subtitle="Results stay hidden from parents & students until approved by authorized School Admin"
            rows={results}
            exportFilename="campusos-merit-list.csv"
            columns={[
              {
                key: 'rank_position',
                header: 'Merit Rank',
                render: (r) => <Badge variant="green">#{r.rank_position ?? '—'}</Badge>,
              },
              {
                key: 'student_id',
                header: 'Student',
                render: (r) =>
                  r.students
                    ? `${r.students.first_name} ${r.students.last_name} (${r.students.student_code})`
                    : r.student_id,
              },
              {
                key: 'total_marks',
                header: 'Score',
                render: (r) => `${r.total_marks} / ${r.max_total_marks} (${r.percentage}%)`,
              },
              { key: 'gpa', header: 'GPA' },
              {
                key: 'grade',
                header: 'Grade',
                render: (r) => <Badge variant={r.is_passed ? 'green' : 'red'}>{r.grade}</Badge>,
              },
              {
                key: 'is_published',
                header: 'Status',
                render: (r) => <Badge variant={r.is_published ? 'green' : 'amber'}>{r.is_published ? 'Published' : 'Pending Approval'}</Badge>,
              },
              {
                key: 'actions',
                header: 'Transcript',
                render: (r) => (
                  <Button size="sm" variant="outline" onClick={() => setReportCard(r)}>
                    <Award className="h-3.5 w-3.5" />
                    Report Card
                  </Button>
                ),
              },
            ]}
          />
        )}

        <Modal open={Boolean(reportCard)} onClose={() => setReportCard(null)} title="Official Academic Report Card & Transcript">
          {reportCard && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-[#16A34A] bg-white p-6 text-slate-900">
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">Official Academic Transcript</p>
                  <h4 className="text-xl font-bold">{config.branding?.institutionName ?? config.tenant?.name}</h4>
                  <p className="text-xs text-slate-500">{reportCard.exams?.name ?? 'Examination'}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400">Student Name</span>
                    <p className="font-bold">
                      {reportCard.students?.first_name} {reportCard.students?.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Student ID</span>
                    <p className="font-bold">{reportCard.students?.student_code}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Total Score</span>
                    <p className="font-bold">
                      {reportCard.total_marks} / {reportCard.max_total_marks} ({reportCard.percentage}%)
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">GPA & Grade</span>
                    <p className="font-bold text-[#16A34A]">
                      {reportCard.gpa} GPA • Grade {reportCard.grade}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Merit Position</span>
                    <p className="font-bold">Rank #{reportCard.rank_position ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Outcome</span>
                    <p className="font-bold">{reportCard.is_passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}</p>
                  </div>
                </div>
              </div>
              <div className="no-print flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReportCard(null)}>Close</Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print Transcript
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ModuleGuard>
  );
}
