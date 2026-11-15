'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CalendarCheck2, Save } from 'lucide-react';
import { ModuleGuard } from '@/components/school/module-guard';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Badge, Button, Card, CardHeader, Input, Select, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

interface StudentOption {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  class_id: string | null;
}

interface GuardianOption {
  id: string;
  student_id: string;
  guardian_name: string;
  relationship: string;
  phone: string;
  students?: { first_name: string; last_name: string; student_code: string } | null;
}

export default function AttendancePage() {
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [tab, setTab] = useState<'teacher' | 'student' | 'guardian'>('teacher');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('ptm');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: string; employee_code: string; full_name: string }>>([]);
  const [guardians, setGuardians] = useState<GuardianOption[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);

    const [
      { data: clsRows },
      { data: stuRows },
      { data: tchRows },
      { data: grdRows },
      { data: attRows },
      { data: tattRows },
      { data: gattRows },
    ] = await Promise.all([
      supabase.from('classes').select('id, name').eq('tenant_id', tenantId).is('deleted_at', null).order('numeric_level'),
      supabase.from('students').select('id, student_code, first_name, last_name, class_id').eq('tenant_id', tenantId).is('deleted_at', null).order('first_name'),
      supabase.from('teachers').select('id, employee_code, full_name').eq('tenant_id', tenantId).is('deleted_at', null).order('full_name'),
      supabase.from('student_guardians').select('id, student_id, guardian_name, relationship, phone, students(first_name, last_name, student_code)').eq('tenant_id', tenantId).order('guardian_name'),
      supabase.from('attendance').select('student_id, status').eq('tenant_id', tenantId).eq('attendance_date', date),
      supabase.from('teacher_attendance').select('teacher_id, status').eq('tenant_id', tenantId).eq('attendance_date', date),
      supabase.from('guardian_attendance').select('guardian_id, status').eq('tenant_id', tenantId).eq('attendance_date', date).eq('visit_purpose', visitPurpose),
    ]);

    setClasses(clsRows ?? []);
    setStudents(stuRows ?? []);
    setTeachers(tchRows ?? []);
    setGuardians((grdRows as unknown as GuardianOption[]) ?? []);

    const initial: Record<string, string> = {};
    for (const a of attRows ?? []) initial[`stu:${a.student_id}`] = a.status;
    for (const ta of tattRows ?? []) initial[`tch:${ta.teacher_id}`] = ta.status;
    for (const ga of gattRows ?? []) initial[`grd:${ga.guardian_id}`] = ga.status;
    setMarksMap(initial);
    setLoading(false);
  }, [date, tenantId, visitPurpose]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleStudents = selectedClass ? students.filter((s) => s.class_id === selectedClass) : students;

  const handleSaveTeacherAttendance = async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = teachers.map((t) => ({
      tenant_id: tenantId,
      teacher_id: t.id,
      attendance_date: date,
      status: marksMap[`tch:${t.id}`] ?? 'present',
      marked_by: user?.id ?? null,
    }));

    const { error } = await supabase.from('teacher_attendance').upsert(payload, {
      onConflict: 'tenant_id,teacher_id,attendance_date',
    });

    setFeedback(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: `Saved ${payload.length} teacher attendance record(s) for ${date}.` }
    );
    setSaving(false);
  };

  const handleSaveStudentAttendance = async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = visibleStudents
      .filter((s) => s.class_id)
      .map((s) => ({
        tenant_id: tenantId,
        student_id: s.id,
        class_id: s.class_id!,
        attendance_date: date,
        status: marksMap[`stu:${s.id}`] ?? 'present',
        marked_by: user?.id ?? null,
      }));

    if (payload.length === 0) {
      setFeedback({ type: 'error', text: 'Assign students to a class before marking attendance.' });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('attendance').upsert(payload, {
      onConflict: 'tenant_id,student_id,attendance_date',
    });

    if (error) {
      setFeedback({ type: 'error', text: error.message });
      setSaving(false);
      return;
    }

    const absentIds = payload.filter((p) => p.status === 'absent' || p.status === 'late').map((p) => p.student_id);
    if (absentIds.length > 0) {
      const { data: guardiansLinked } = await supabase
        .from('student_guardians')
        .select('guardian_user_id, student_id')
        .eq('tenant_id', tenantId)
        .in('student_id', absentIds)
        .not('guardian_user_id', 'is', null);

      if (guardiansLinked && guardiansLinked.length > 0) {
        await supabase.from('notifications').insert(
          guardiansLinked.map((g) => ({
            tenant_id: tenantId,
            recipient_user_id: g.guardian_user_id,
            title: 'Attendance Alert',
            body: `Your child was marked absent/late on ${date}.`,
            category: 'attendance',
            resource_type: 'student',
            resource_id: g.student_id,
          }))
        );
      }
    }

    setFeedback({ type: 'success', text: `Saved ${payload.length} duplicate-safe student attendance record(s) for ${date}.` });
    setSaving(false);
  };

  const handleSaveGuardianAttendance = async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setSaving(true);
    setFeedback(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = guardians.map((g) => ({
      tenant_id: tenantId,
      guardian_id: g.id,
      student_id: g.student_id,
      attendance_date: date,
      visit_purpose: visitPurpose,
      status: marksMap[`grd:${g.id}`] ?? 'present',
      marked_by: user?.id ?? null,
    }));

    if (payload.length === 0) {
      setFeedback({ type: 'error', text: 'No guardian records found to mark.' });
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('guardian_attendance').upsert(payload, {
      onConflict: 'tenant_id,guardian_id,attendance_date,visit_purpose',
    });

    setFeedback(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: `Saved ${payload.length} guardian attendance record(s) (${visitPurpose.toUpperCase()}) for ${date}.` }
    );
    setSaving(false);
  };

  return (
    <ModuleGuard moduleKey="attendance" moduleName="Attendance">
      <div className="space-y-6">
        {feedback && (
          <StateFeedback
            type={feedback.type}
            title={feedback.type === 'success' ? 'Attendance Recorded' : 'Attendance Error'}
            message={feedback.text}
          />
        )}

        <Card className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3">
              {/* 3 Dedicated Sections: Teacher | Student | Guardian */}
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {(
                  [
                    { key: 'teacher', label: 'Teacher Attendance' },
                    { key: 'student', label: 'Student Attendance' },
                    { key: 'guardian', label: 'Guardian Attendance' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                      tab === item.key ? 'bg-[#16A34A] text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />

              {tab === 'student' && (
                <Select
                  label="Class Filter"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  options={[{ value: '', label: 'All Classes' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
                />
              )}

              {tab === 'guardian' && (
                <Select
                  label="Visit Purpose"
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value)}
                  options={[
                    { value: 'ptm', label: 'Parent-Teacher Meeting (PTM)' },
                    { value: 'pickup', label: 'Campus Pickup' },
                    { value: 'dropoff', label: 'Campus Dropoff' },
                    { value: 'meeting', label: 'Admin / Principal Meeting' },
                    { value: 'event', label: 'School Event' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
              )}
            </div>

            <Button
              loading={saving}
              onClick={() =>
                void (tab === 'teacher'
                  ? handleSaveTeacherAttendance()
                  : tab === 'student'
                  ? handleSaveStudentAttendance()
                  : handleSaveGuardianAttendance())
              }
            >
              <Save className="h-4 w-4" />
              Save {tab === 'teacher' ? 'Teacher' : tab === 'student' ? 'Student' : 'Guardian'} Attendance
            </Button>
          </div>
        </Card>

        {loading ? (
          <StateFeedback type="loading" title="Loading attendance register..." />
        ) : tab === 'teacher' ? (
          <Card>
            <CardHeader title="Section 1 — Teacher Attendance Register" subtitle="Daily faculty attendance tracking" />
            {teachers.length === 0 ? (
              <div className="p-6">
                <StateFeedback type="empty" title="No teachers registered yet" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {teachers.map((t) => {
                  const current = marksMap[`tch:${t.id}`] ?? 'present';
                  return (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.full_name}</p>
                        <Badge variant="slate">{t.employee_code}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['present', 'absent', 'late', 'on_leave'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setMarksMap({ ...marksMap, [`tch:${t.id}`]: st })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize cursor-pointer ${
                              current === st
                                ? 'bg-[#16A34A] text-white'
                                : 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ) : tab === 'student' ? (
          <Card>
            <CardHeader
              title="Section 2 — Student Attendance Register"
              subtitle="Duplicate records prevented automatically by UNIQUE(tenant_id, student_id, attendance_date)"
              action={<CalendarCheck2 className="h-4 w-4 text-[#16A34A]" />}
            />
            {visibleStudents.length === 0 ? (
              <div className="p-6">
                <StateFeedback type="empty" title="No students found" message="Admit students first to take daily attendance." />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleStudents.map((stu) => {
                  const current = marksMap[`stu:${stu.id}`] ?? 'present';
                  return (
                    <div key={stu.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {stu.first_name} {stu.last_name}
                        </p>
                        <p className="text-xs text-slate-500">{stu.student_code}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['present', 'absent', 'late', 'excused'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setMarksMap({ ...marksMap, [`stu:${stu.id}`]: st })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                              current === st
                                ? st === 'present'
                                  ? 'bg-[#16A34A] text-white'
                                  : st === 'absent'
                                  ? 'bg-red-600 text-white'
                                  : st === 'late'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-sky-600 text-white'
                                : 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        ) : (
          <Card>
            <CardHeader
              title="Section 3 — Guardian Attendance Register"
              subtitle="Track guardian PTM, pickup, dropoff & campus visit check-ins"
            />
            {guardians.length === 0 ? (
              <div className="p-6">
                <StateFeedback
                  type="empty"
                  title="No guardian links found"
                  message="Link guardians when admitting or editing students to track guardian attendance."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {guardians.map((g) => {
                  const current = marksMap[`grd:${g.id}`] ?? 'present';
                  return (
                    <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{g.guardian_name}</p>
                        <p className="text-xs text-slate-500">
                          {g.relationship} • {g.phone}
                          {g.students ? ` • Child: ${g.students.first_name} ${g.students.last_name}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(['present', 'absent', 'late', 'excused'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setMarksMap({ ...marksMap, [`grd:${g.id}`]: st })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                              current === st
                                ? st === 'present'
                                  ? 'bg-[#16A34A] text-white'
                                  : st === 'absent'
                                  ? 'bg-red-600 text-white'
                                  : st === 'late'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-sky-600 text-white'
                                : 'border border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        )}
      </div>
    </ModuleGuard>
  );
}
