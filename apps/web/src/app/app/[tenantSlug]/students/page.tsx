'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Award, IdCard, Plus, Printer, Upload } from 'lucide-react';
import { ModuleGuard } from '@/components/school/module-guard';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
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

interface StudentRow extends Record<string, unknown> {
  id: string;
  student_code: string;
  admission_number: string;
  first_name: string;
  last_name: string;
  gender: string | null;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  class_id: string | null;
  section_id: string | null;
  roll_number: string | null;
  status: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  transfer_certificate_no: string | null;
  admission_date: string;
}

export default function StudentsPage() {
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string; class_id: string }>>([]);
  const [classFilter, setClassFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [idCardStudent, setIdCardStudent] = useState<StudentRow | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: 'female',
    class_id: '',
    section_id: '',
    roll_number: '',
    guardian_name: '',
    guardian_phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: '',
  });

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    const [{ data: stuRows }, { data: clsRows }, { data: secRows }] = await Promise.all([
      supabase.from('students').select('*').eq('tenant_id', tenantId).is('deleted_at', null).order('created_at', { ascending: false }),
      supabase.from('classes').select('id, name').eq('tenant_id', tenantId).is('deleted_at', null).order('numeric_level'),
      supabase.from('sections').select('id, name, class_id').eq('tenant_id', tenantId).is('deleted_at', null),
    ]);
    setStudents((stuRows as StudentRow[]) ?? []);
    setClasses(clsRows ?? []);
    setSections(secRows ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setFeedback(null);

    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    const studentCode = `STU-${new Date().getFullYear()}-${rand}`;
    const admissionNumber = `ADM-${Date.now().toString().slice(-6)}`;

    let photoUrl: string | null = null;
    if (photoFile) {
      const path = `${tenantId}/students/${studentCode}-${photoFile.name}`;
      const { error: upErr } = await supabase.storage.from('student-photos').upload(path, photoFile, { upsert: true });
      if (!upErr) photoUrl = path;
    }

    const { data: created, error } = await supabase
      .from('students')
      .insert({
        tenant_id: tenantId,
        student_code: studentCode,
        admission_number: admissionNumber,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        gender: form.gender,
        class_id: form.class_id || null,
        section_id: form.section_id || null,
        roll_number: form.roll_number || null,
        photo_url: photoUrl,
        emergency_contact_name: form.emergency_contact_name || form.guardian_name || null,
        emergency_contact_phone: form.emergency_contact_phone || form.guardian_phone || null,
        address: form.address || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      setFeedback({ type: 'error', text: error.message });
      return;
    }

    if (created && form.guardian_name && form.guardian_phone) {
      await supabase.from('student_guardians').insert({
        tenant_id: tenantId,
        student_id: created.id,
        guardian_name: form.guardian_name,
        phone: form.guardian_phone,
        relationship: 'parent',
      });
    }

    setAddOpen(false);
    setPhotoFile(null);
    setFeedback({ type: 'success', text: `Admitted ${form.first_name} ${form.last_name} (${studentCode}).` });
    await loadData();
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenantId) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as Array<Record<string, string>>).map((r) => ({
          student_code: r.student_code || `STU-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          admission_number: r.admission_number || `ADM-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          first_name: r.first_name || '',
          last_name: r.last_name || '',
          email: r.email || '',
          phone: r.phone || '',
          roll_number: r.roll_number || '',
        }));

        const res = await fetch(`/api/tenants/${tenantId}/students/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows }),
        });
        const json = await res.json();
        if (!res.ok) {
          setFeedback({ type: 'error', text: json.error ?? 'CSV import failed' });
        } else {
          setFeedback({
            type: 'success',
            text: `Imported ${json.inserted_count} student(s). Rejected duplicates/invalid: ${json.rejected_count}.`,
          });
          await loadData();
        }
      },
    });
  };

  const handleIssueTC = async (student: StudentRow) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId) return;
    const tcNo = `TC-${new Date().getFullYear()}-${student.student_code}`;
    const { error } = await supabase
      .from('students')
      .update({
        status: 'transferred',
        transfer_certificate_no: tcNo,
        transfer_issued_at: new Date().toISOString(),
      })
      .eq('id', student.id)
      .eq('tenant_id', tenantId);
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setFeedback({ type: 'success', text: `Transfer Certificate ${tcNo} issued for ${student.first_name}.` });
      await loadData();
    }
  };

  const handlePromote = async (student: StudentRow) => {
    const supabase = createBrowserSupabaseClient();
    if (!supabase || !tenantId) return;
    const idx = classes.findIndex((c) => c.id === student.class_id);
    const nextClass = idx >= 0 && idx + 1 < classes.length ? classes[idx + 1] : null;
    if (!nextClass) {
      setFeedback({ type: 'error', text: 'No higher class available in sequence to promote into.' });
      return;
    }
    const { error } = await supabase
      .from('students')
      .update({ class_id: nextClass.id, status: 'promoted' })
      .eq('id', student.id)
      .eq('tenant_id', tenantId);
    if (error) setFeedback({ type: 'error', text: error.message });
    else {
      setFeedback({ type: 'success', text: `Promoted ${student.first_name} to ${nextClass.name}.` });
      await loadData();
    }
  };

  const classMap = Object.fromEntries(classes.map((c) => [c.id, c.name]));
  const filteredStudents = classFilter ? students.filter((s) => s.class_id === classFilter) : students;

  return (
    <ModuleGuard moduleKey="students" moduleName="Student Management">
      <div className="space-y-6">
        {feedback && (
          <StateFeedback
            type={feedback.type}
            title={feedback.type === 'success' ? 'Student Registry Updated' : 'Action Failed'}
            message={feedback.text}
          />
        )}

        {loading ? (
          <StateFeedback type="loading" title="Loading Student Directory..." />
        ) : (
          <DataTable
            title="Student Directory & Admissions"
            subtitle="Online admission, bulk CSV import/export, ID cards, promotions & transfer certificates"
            rows={filteredStudents}
            exportFilename="campusos-students.csv"
            headerAction={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
                  <Upload className="h-3.5 w-3.5" />
                  Import CSV
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                </label>

                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Admit Student
                </Button>
              </div>
            }
            columns={[
              {
                key: 'student_code',
                header: 'Student ID',
                render: (r) => (
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{r.student_code}</p>
                    <p className="text-[11px] text-slate-500">{r.admission_number}</p>
                  </div>
                ),
              },
              {
                key: 'first_name',
                header: 'Full Name',
                render: (r) => `${r.first_name} ${r.last_name}`,
                exportValue: (r) => `${r.first_name} ${r.last_name}`,
              },
              {
                key: 'class_id',
                header: 'Class',
                render: (r) => (r.class_id ? classMap[r.class_id] ?? 'Assigned' : 'Unassigned'),
              },
              { key: 'roll_number', header: 'Roll #' },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge variant={r.status === 'active' || r.status === 'promoted' ? 'green' : 'amber'}>
                    {r.status}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (r) => (
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => setIdCardStudent(r)}>
                      <IdCard className="h-3.5 w-3.5" />
                      ID Card
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void handlePromote(r)}>
                      <Award className="h-3.5 w-3.5" />
                      Promote
                    </Button>
                    {!r.transfer_certificate_no && (
                      <Button size="sm" variant="ghost" onClick={() => void handleIssueTC(r)}>
                        Issue TC
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}

        {/* Admission Modal */}
        <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Student Admission & Registration">
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="First Name *" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              <Input label="Last Name *" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                options={[
                  { value: 'female', label: 'Female' },
                  { value: 'male', label: 'Male' },
                  { value: 'other', label: 'Other' },
                ]}
              />
              <Select
                label="Class"
                value={form.class_id}
                onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                options={[{ value: '', label: 'Select Class' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
              />
              <Select
                label="Section"
                value={form.section_id}
                onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                options={[
                  { value: '', label: 'Select Section' },
                  ...sections.filter((s) => !form.class_id || s.class_id === form.class_id).map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Roll #" value={form.roll_number} onChange={(e) => setForm({ ...form, roll_number: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Guardian Name" value={form.guardian_name} onChange={(e) => setForm({ ...form, guardian_name: e.target.value })} />
              <Input label="Guardian Phone" value={form.guardian_phone} onChange={(e) => setForm({ ...form, guardian_phone: e.target.value })} />
            </div>
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <label className="block space-y-1 text-xs font-medium">
              <span>Student Photograph (Supabase Storage)</span>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} className="block text-xs" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Admit & Generate ID</Button>
            </div>
          </form>
        </Modal>

        {/* Printable Student ID Card Modal */}
        <Modal open={Boolean(idCardStudent)} onClose={() => setIdCardStudent(null)} title="Official Student ID Card">
          {idCardStudent && (
            <div className="space-y-4">
              <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-[#16A34A] bg-white shadow-lg">
                <div className="bg-[#064E3B] px-5 py-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Official Student ID</p>
                  <h4 className="text-lg font-bold">{config.branding?.institutionName ?? config.tenant?.name}</h4>
                </div>
                <div className="p-5 text-sm text-slate-800 space-y-2">
                  <p className="text-lg font-bold text-slate-900">
                    {idCardStudent.first_name} {idCardStudent.last_name}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Student ID:</span> <strong>{idCardStudent.student_code}</strong></div>
                    <div><span className="text-slate-400">Adm #:</span> <strong>{idCardStudent.admission_number}</strong></div>
                    <div><span className="text-slate-400">Class:</span> <strong>{idCardStudent.class_id ? classMap[idCardStudent.class_id] : '—'}</strong></div>
                    <div><span className="text-slate-400">Admitted:</span> <strong>{formatDate(idCardStudent.admission_date)}</strong></div>
                  </div>
                  {idCardStudent.emergency_contact_phone && (
                    <p className="border-t pt-2 text-xs text-slate-500">
                      Emergency: {idCardStudent.emergency_contact_name} ({idCardStudent.emergency_contact_phone})
                    </p>
                  )}
                </div>
              </div>
              <div className="no-print flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIdCardStudent(null)}>Close</Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4" />
                  Print ID Card
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ModuleGuard>
  );
}
