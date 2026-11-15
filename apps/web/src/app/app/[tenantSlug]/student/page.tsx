'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Award, BookOpen, CalendarCheck2, Clock, Megaphone, NotebookPen } from 'lucide-react';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Badge, Card, CardHeader, StatCard, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

export default function StudentPortalPage() {
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [attendance, setAttendance] = useState<Array<Record<string, unknown>>>([]);
  const [results, setResults] = useState<Array<Record<string, unknown>>>([]);
  const [homework, setHomework] = useState<Array<Record<string, unknown>>>([]);
  const [materials, setMaterials] = useState<Array<Record<string, unknown>>>([]);
  const [timetable, setTimetable] = useState<Array<Record<string, unknown>>>([]);
  const [notices, setNotices] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: stu } = await supabase
      .from('students')
      .select('*, classes(name)')
      .eq('tenant_id', tenantId)
      .eq('user_id', user?.id ?? '')
      .maybeSingle();

    setStudent(stu);

    const [{ data: att }, { data: res }, { data: hw }, { data: mat }, { data: tt }, { data: notifs }] = await Promise.all([
      supabase.from('attendance').select('*').eq('tenant_id', tenantId).order('attendance_date', { ascending: false }).limit(20),
      supabase.from('results').select('*, exams(name)').eq('tenant_id', tenantId).eq('is_published', true),
      supabase.from('homework').select('*, subjects(name)').eq('tenant_id', tenantId).is('deleted_at', null).limit(10),
      supabase.from('learning_materials').select('*, subjects(name)').eq('tenant_id', tenantId).is('deleted_at', null).limit(10),
      supabase.from('timetables').select('*, subjects(name)').eq('tenant_id', tenantId).order('day_of_week'),
      supabase.from('notices').select('*').eq('tenant_id', tenantId).is('deleted_at', null).order('published_at', { ascending: false }).limit(5),
    ]);

    setAttendance(att ?? []);
    setResults(res ?? []);
    setHomework(hw ?? []);
    setMaterials(mat ?? []);
    setTimetable(tt ?? []);
    setNotices(notifs ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) return <StateFeedback type="loading" title="Loading Student Portal..." />;

  const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const attPct = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {student && (
        <Card className="bg-gradient-to-r from-[#064E3B] to-[#111827] p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">Student Dashboard</p>
          <h2 className="mt-1 text-2xl font-bold">
            Welcome, {String(student.first_name)} {String(student.last_name)}
          </h2>
          <p className="mt-1 text-xs text-emerald-100/80">
            ID: {String(student.student_code)} • {(student.classes as { name?: string } | null)?.name ?? 'Enrolled Student'}
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Attendance Rate" value={`${attPct}%`} hint={`${attendance.length} logged days`} icon={<CalendarCheck2 className="h-5 w-5" />} />
        <StatCard label="Published Results" value={results.length} icon={<Award className="h-5 w-5" />} />
        <StatCard label="Homework Tasks" value={homework.length} icon={<NotebookPen className="h-5 w-5" />} />
        <StatCard label="Study Materials" value={materials.length} icon={<BookOpen className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Class Routine" action={<Clock className="h-4 w-4 text-[#16A34A]" />} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {timetable.length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No timetable scheduled yet.</p>
            ) : (
              timetable.map((t) => (
                <div key={String(t.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-semibold">{(t.subjects as { name?: string } | null)?.name ?? 'Subject'}</span>
                  <span className="text-xs text-slate-500">
                    Day {String(t.day_of_week)} • {String(t.start_time)}–{String(t.end_time)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Published Results" action={<Award className="h-4 w-4 text-[#16A34A]" />} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {results.length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No results published yet.</p>
            ) : (
              results.map((r) => (
                <div key={String(r.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>{(r.exams as { name?: string } | null)?.name ?? 'Exam'}</span>
                  <Badge variant="green">
                    {String(r.grade)} • {String(r.percentage)}%
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Homework & Learning Materials" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {homework.length === 0 && materials.length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No homework or materials posted.</p>
            ) : (
              homework.map((h) => (
                <div key={String(h.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{String(h.title)}</p>
                    <p className="text-xs text-slate-500">Due {formatDate(String(h.due_date))}</p>
                  </div>
                  <Badge variant="amber">Homework</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="School Notices" action={<Megaphone className="h-4 w-4 text-[#16A34A]" />} />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notices.length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No notices published.</p>
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
    </div>
  );
}
