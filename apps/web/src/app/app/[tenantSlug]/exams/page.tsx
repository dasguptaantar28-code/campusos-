'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Calculator, ClipboardList, Plus } from 'lucide-react';
import { ModuleGuard } from '@/components/school/module-guard';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Badge, Button, Card, CardHeader, Input, Modal, Select, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ExamsPage() {
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [exams, setExams] = useState<Array<{ id: string; name: string; category: string; status: string }>>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [examSubjects, setExamSubjects] = useState<
    Array<{ id: string; class_id: string; subject_id: string; max_marks: number; pass_marks: number; subjects?: { name: string }; classes?: { name: string } }>
  >([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; student_code: string; first_name: string; last_name: string; class_id: string | null }>>([]);
  const [marksDraft, setMarksDraft] = useState<Record<string, string>>({});

  const [examModal, setExamModal] = useState(false);
  const [subjModal, setSubjModal] = useState(false);
  const [examForm, setExamForm] = useState({ name: '', category: 'midterm', start_date: '', end_date: '' });
  const [subjForm, setSubjForm] = useState({ class_id: '', subject_id: '', max_marks: '100', pass_marks: '33' });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadBase = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    const [{ data: ex }, { data: cls }, { data: sub }, { data: stu }] = await Promise.all([
      supabase.from('exams').select('*').eq('tenant_id', tenantId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('classes').select('id, name').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('subjects').select('id, name').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('students').select('id, student_code, first_name, last_name, class_id').eq('tenant_id', tenantId).is('deleted_at', null),
    ]);
    setExams(ex ?? []);
    if (!selectedExamId && ex?.[0]?.id) setSelectedExamId(ex[0].id);
    setClasses(cls ?? []);
    setSubjects(sub ?? []);
    setStudents(stu ?? []);
    setLoading(false);
  }, [selectedExamId, tenantId]);

  const loadExamSubjects = useCallback(async () => {
    if (!tenantId || !selectedExamId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    const { data } = await supabase
      .from('exam_subjects')
      .select('*, subjects(name), classes(name)')
      .eq('tenant_id', tenantId)
      .eq('exam_id', selectedExamId);
    setExamSubjects((data as typeof examSubjects) ?? []);
    if (data?.[0]?.id) setSelectedSubjectId(data[0].id);
  }, [selectedExamId, tenantId]);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    void loadExamSubjects();
  }, [loadExamSubjects]);

  useEffect(() => {
    const loadExistingMarks = async () => {
      if (!tenantId || !selectedSubjectId) return;
      const supabase = createBrowserSupabaseClient();
      if (!supabase) return;
      const { data } = await supabase
        .from('marks')
        .select('student_id, marks_obtained')
        .eq('tenant_id', tenantId)
        .eq('exam_subject_id', selectedSubjectId);
      const map: Record<string, string> = {};
      for (const m of data ?? []) map[m.student_id] = String(m.marks_obtained);
      setMarksDraft(map);
    };
    void loadExistingMarks();
  }, [selectedSubjectId, tenantId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId) return;
    const { data, error } = await supabase
      .from('exams')
      .insert({
        tenant_id: tenantId,
        name: examForm.name,
        category: examForm.category,
        start_date: examForm.start_date || null,
        end_date: examForm.end_date || null,
        status: 'marks_entry',
      })
      .select()
      .single();
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setExamModal(false);
      setSelectedExamId(data.id);
      setFeedback({ type: 'success', text: `Examination "${examForm.name}" created.` });
      await loadBase();
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId || !selectedExamId) return;
    const { error } = await supabase.from('exam_subjects').insert({
      tenant_id: tenantId,
      exam_id: selectedExamId,
      class_id: subjForm.class_id,
      subject_id: subjForm.subject_id,
      max_marks: Number(subjForm.max_marks),
      pass_marks: Number(subjForm.pass_marks),
    });
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setSubjModal(false);
      setFeedback({ type: 'success', text: 'Subject paper added to examination.' });
      await loadExamSubjects();
    }
  };

  const activeSubjectPaper = examSubjects.find((es) => es.id === selectedSubjectId);
  const eligibleStudents = activeSubjectPaper
    ? students.filter((s) => s.class_id === activeSubjectPaper.class_id)
    : [];

  const handleSaveMarks = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId || !selectedExamId || !activeSubjectPaper) return;
    setFeedback(null);

    const rows = [];
    for (const s of eligibleStudents) {
      const val = Number(marksDraft[s.id] ?? 0);
      if (Number.isNaN(val) || val < 0 || val > activeSubjectPaper.max_marks) {
        setFeedback({
          type: 'error',
          text: `Invalid marks for ${s.first_name} ${s.last_name}: must be between 0 and ${activeSubjectPaper.max_marks}.`,
        });
        return;
      }
      rows.push({
        tenant_id: tenantId,
        exam_id: selectedExamId,
        exam_subject_id: activeSubjectPaper.id,
        student_id: s.id,
        marks_obtained: val,
      });
    }

    const { error } = await supabase.from('marks').upsert(rows, {
      onConflict: 'tenant_id,exam_subject_id,student_id',
    });

    if (error) setFeedback({ type: 'error', text: error.message });
    else setFeedback({ type: 'success', text: `Validated and saved marks for ${rows.length} student(s).` });
  };

  const handleCalculateResults = async () => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId || !selectedExamId) return;
    const { data, error } = await supabase.rpc('calculate_exam_results', {
      p_tenant_id: tenantId,
      p_exam_id: selectedExamId,
    });
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setFeedback({
        type: 'success',
        text: `Calculated GPA, grades, and merit ranks for ${data ?? 0} student(s). Awaiting School Admin approval on Results tab.`,
      });
      await loadBase();
    }
  };

  if (loading) return <StateFeedback type="loading" title="Loading Examinations..." />;

  return (
    <ModuleGuard moduleKey="exams" moduleName="Examinations">
      <div className="space-y-6">
        {feedback && (
          <StateFeedback
            type={feedback.type}
            title={feedback.type === 'success' ? 'Exam Engine Updated' : 'Validation Error'}
            message={feedback.text}
          />
        )}

        <Card className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Active Examination"
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                options={
                  exams.length === 0
                    ? [{ value: '', label: 'No exams created' }]
                    : exams.map((ex) => ({ value: ex.id, label: `${ex.name} (${ex.status})` }))
                }
              />
              {examSubjects.length > 0 && (
                <Select
                  label="Subject Paper"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  options={examSubjects.map((es) => ({
                    value: es.id,
                    label: `${es.classes?.name ?? 'Class'} — ${es.subjects?.name ?? 'Subject'} (Max ${es.max_marks})`,
                  }))}
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setExamModal(true)}>
                <Plus className="h-4 w-4" />
                Create Exam
              </Button>
              {selectedExamId && (
                <Button size="sm" variant="outline" onClick={() => setSubjModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add Subject Paper
                </Button>
              )}
              {selectedExamId && (
                <Button size="sm" onClick={() => void handleCalculateResults()}>
                  <Calculator className="h-4 w-4" />
                  Calculate GPA & Merit List
                </Button>
              )}
            </div>
          </div>
        </Card>

        {activeSubjectPaper ? (
          <Card>
            <CardHeader
              title={`Marks Entry — ${activeSubjectPaper.subjects?.name ?? 'Subject'}`}
              subtitle={`Max Marks: ${activeSubjectPaper.max_marks} • Pass Marks: ${activeSubjectPaper.pass_marks}`}
              action={<Badge variant="green">Validated Server & Client Side</Badge>}
            />
            {eligibleStudents.length === 0 ? (
              <div className="p-6">
                <StateFeedback type="empty" title="No students enrolled in this class" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {eligibleStudents.map((stu) => (
                  <div key={stu.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold">{stu.first_name} {stu.last_name}</p>
                      <p className="text-xs text-slate-500">{stu.student_code}</p>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={activeSubjectPaper.max_marks}
                      step="0.5"
                      value={marksDraft[stu.id] ?? ''}
                      onChange={(e) => setMarksDraft({ ...marksDraft, [stu.id]: e.target.value })}
                      placeholder={`0 - ${activeSubjectPaper.max_marks}`}
                      className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                    />
                  </div>
                ))}
                <div className="flex justify-end p-5">
                  <Button onClick={() => void handleSaveMarks()}>
                    <ClipboardList className="h-4 w-4" />
                    Save & Validate Marks
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ) : (
          <StateFeedback
            type="empty"
            title="Select or Create an Examination"
            message="Create an exam and add class subject papers to enter validated student marks."
          />
        )}

        <Modal open={examModal} onClose={() => setExamModal(false)} title="Create Examination">
          <form onSubmit={handleCreateExam} className="space-y-4">
            <Input label="Exam Title *" required value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="Final Term Examination 2026" />
            <Select
              label="Category"
              value={examForm.category}
              onChange={(e) => setExamForm({ ...examForm, category: e.target.value })}
              options={[
                { value: 'quiz', label: 'Quiz' },
                { value: 'monthly', label: 'Monthly Test' },
                { value: 'midterm', label: 'Midterm' },
                { value: 'term', label: 'Term Exam' },
                { value: 'final', label: 'Final Exam' },
              ]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Start Date" type="date" value={examForm.start_date} onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })} />
              <Input label="End Date" type="date" value={examForm.end_date} onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setExamModal(false)}>Cancel</Button>
              <Button type="submit">Create Exam</Button>
            </div>
          </form>
        </Modal>

        <Modal open={subjModal} onClose={() => setSubjModal(false)} title="Add Subject Paper">
          <form onSubmit={handleAddSubject} className="space-y-4">
            <Select
              label="Class *"
              required
              value={subjForm.class_id}
              onChange={(e) => setSubjForm({ ...subjForm, class_id: e.target.value })}
              options={[{ value: '', label: 'Select Class' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <Select
              label="Subject *"
              required
              value={subjForm.subject_id}
              onChange={(e) => setSubjForm({ ...subjForm, subject_id: e.target.value })}
              options={[{ value: '', label: 'Select Subject' }, ...subjects.map((s) => ({ value: s.id, label: s.name }))]}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Max Marks *" type="number" required value={subjForm.max_marks} onChange={(e) => setSubjForm({ ...subjForm, max_marks: e.target.value })} />
              <Input label="Pass Marks *" type="number" required value={subjForm.pass_marks} onChange={(e) => setSubjForm({ ...subjForm, pass_marks: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSubjModal(false)}>Cancel</Button>
              <Button type="submit">Add Subject Paper</Button>
            </div>
          </form>
        </Modal>
      </div>
    </ModuleGuard>
  );
}
