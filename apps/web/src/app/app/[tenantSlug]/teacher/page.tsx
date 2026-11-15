'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpen, CalendarCheck2, ClipboardList, GraduationCap, NotebookPen } from 'lucide-react';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Badge, Card, CardHeader, StatCard, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatDate } from '@/lib/utils';

export default function TeacherPortalPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [assignments, setAssignments] = useState<Array<Record<string, unknown>>>([]);
  const [classes, setClasses] = useState<Array<Record<string, unknown>>>([]);
  const [timetable, setTimetable] = useState<Array<Record<string, unknown>>>([]);
  const [homework, setHomework] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);
    const [{ data: cs }, { data: tt }, { data: hw }, { data: asg }] = await Promise.all([
      supabase.from('class_subjects').select('*, classes(name), subjects(name)').eq('tenant_id', tenantId),
      supabase.from('timetables').select('*, classes(name), subjects(name)').eq('tenant_id', tenantId).order('day_of_week'),
      supabase.from('homework').select('*, classes(name), subjects(name)').eq('tenant_id', tenantId).is('deleted_at', null).order('due_date'),
      supabase.from('assignments').select('*, classes(name), subjects(name)').eq('tenant_id', tenantId).is('deleted_at', null).order('due_at'),
    ]);
    setClasses(cs ?? []);
    setTimetable(tt ?? []);
    setHomework(hw ?? []);
    setAssignments(asg ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) return <StateFeedback type="loading" title="Loading Teacher Portal..." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned Class Subjects" value={classes.length} icon={<GraduationCap className="h-5 w-5" />} />
        <StatCard label="Weekly Periods" value={timetable.length} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard label="Active Homework" value={homework.length} icon={<NotebookPen className="h-5 w-5" />} />
        <StatCard label="Assignments" value={assignments.length} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Teacher Academic Workspace</h2>
            <p className="text-xs text-slate-500">Scoped to assigned classes & subjects.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/${tenantSlug}/attendance`} className="inline-flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3.5 py-2 text-xs font-semibold text-white">
              <CalendarCheck2 className="h-3.5 w-3.5" /> Take Attendance
            </Link>
            <Link href={`/app/${tenantSlug}/exams`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold dark:border-slate-700">
              Enter Marks
            </Link>
            <Link href={`/app/${tenantSlug}/homework`} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold dark:border-slate-700">
              Manage Homework
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Assigned Classes & Subjects" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {classes.length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No class-subject allocations yet.</p>
            ) : (
              classes.map((c) => (
                <div key={String(c.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span className="font-semibold">{(c.classes as { name?: string } | null)?.name ?? 'Class'}</span>
                  <Badge variant="green">{(c.subjects as { name?: string } | null)?.name ?? 'Subject'}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming Homework & Assignments" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {homework.length === 0 ? (
              <p className="p-5 text-xs text-slate-500">No homework items scheduled.</p>
            ) : (
              homework.map((h) => (
                <div key={String(h.id)} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div>
                    <p className="font-semibold">{String(h.title)}</p>
                    <p className="text-xs text-slate-500">{(h.subjects as { name?: string } | null)?.name}</p>
                  </div>
                  <span className="text-xs text-slate-500">Due {formatDate(String(h.due_date))}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
