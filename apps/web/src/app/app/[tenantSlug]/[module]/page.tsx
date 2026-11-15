'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
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
  Textarea,
  type TableColumn,
} from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { formatCurrencyCents, formatDate } from '@/lib/utils';

type AnyRow = Record<string, unknown>;

interface FieldSpec {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select' | 'time';
  required?: boolean;
  defaultValue?: string;
  options?: Array<{ value: string; label: string }>;
  lookup?: 'classes' | 'subjects' | 'teachers' | 'vehicles';
}

interface ModuleSpec {
  moduleKey: string;
  title: string;
  subtitle: string;
  table: string;
  fields: FieldSpec[];
  columns: TableColumn<AnyRow>[];
  transformInsert?: (form: Record<string, string>, tenantId: string, userId: string | null) => Record<string, unknown>;
}

const MODULE_SPECS: Record<string, ModuleSpec> = {
  teachers: {
    moduleKey: 'teachers',
    title: 'Teacher Management',
    subtitle: 'Register faculty, manage departments, designations & salary records',
    table: 'teachers',
    fields: [
      { name: 'employee_code', label: 'Employee Code', type: 'text', required: true },
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', defaultValue: 'Science' },
      { name: 'designation', label: 'Designation', type: 'text', defaultValue: 'Senior Teacher' },
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'base_salary_dollars', label: 'Monthly Base Salary ($)', type: 'number', defaultValue: '1200' },
    ],
    columns: [
      { key: 'employee_code', header: 'Code' },
      { key: 'full_name', header: 'Teacher Name' },
      { key: 'department', header: 'Department' },
      { key: 'designation', header: 'Designation' },
      { key: 'base_salary_cents', header: 'Base Salary', render: (r) => formatCurrencyCents(Number(r.base_salary_cents ?? 0)) },
      { key: 'status', header: 'Status', render: (r) => <Badge variant="green">{String(r.status)}</Badge> },
    ],
    transformInsert: (f, tenantId) => ({
      tenant_id: tenantId,
      employee_code: f.employee_code,
      full_name: f.full_name,
      department: f.department || 'General',
      designation: f.designation || 'Teacher',
      email: f.email || null,
      phone: f.phone || null,
      base_salary_cents: Math.round(Number(f.base_salary_dollars || 0) * 100),
      status: 'active',
    }),
  },
  staff: {
    moduleKey: 'staff',
    title: 'Staff Directory',
    subtitle: 'Non-teaching staff, administration & support roles',
    table: 'staff',
    fields: [
      { name: 'employee_code', label: 'Staff Code', type: 'text', required: true },
      { name: 'full_name', label: 'Full Name', type: 'text', required: true },
      { name: 'department', label: 'Department', type: 'text', defaultValue: 'Administration' },
      { name: 'designation', label: 'Designation', type: 'text', defaultValue: 'Coordinator' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'base_salary_dollars', label: 'Monthly Base Salary ($)', type: 'number', defaultValue: '800' },
    ],
    columns: [
      { key: 'employee_code', header: 'Code' },
      { key: 'full_name', header: 'Full Name' },
      { key: 'department', header: 'Department' },
      { key: 'designation', header: 'Designation' },
      { key: 'status', header: 'Status', render: (r) => <Badge variant="green">{String(r.status)}</Badge> },
    ],
    transformInsert: (f, tenantId) => ({
      tenant_id: tenantId,
      employee_code: f.employee_code,
      full_name: f.full_name,
      department: f.department || 'Administration',
      designation: f.designation || 'Staff',
      phone: f.phone || null,
      base_salary_cents: Math.round(Number(f.base_salary_dollars || 0) * 100),
      status: 'active',
    }),
  },
  admissions: {
    moduleKey: 'admissions',
    title: 'Admissions Pipeline',
    subtitle: 'Review incoming student applications and enrollment status',
    table: 'students',
    fields: [
      { name: 'first_name', label: 'Applicant First Name', type: 'text', required: true },
      { name: 'last_name', label: 'Applicant Last Name', type: 'text', required: true },
      { name: 'class_id', label: 'Target Class', type: 'select', lookup: 'classes' },
      { name: 'phone', label: 'Contact Phone', type: 'text' },
      { name: 'email', label: 'Applicant Email', type: 'text' },
    ],
    columns: [
      { key: 'admission_number', header: 'Adm #' },
      { key: 'first_name', header: 'Applicant', render: (r) => `${r.first_name} ${r.last_name}` },
      { key: 'admission_date', header: 'Applied On', render: (r) => formatDate(String(r.admission_date)) },
      { key: 'status', header: 'Stage', render: (r) => <Badge variant={r.status === 'active' ? 'green' : 'amber'}>{String(r.status)}</Badge> },
    ],
    transformInsert: (f, tenantId) => ({
      tenant_id: tenantId,
      student_code: `APP-${Date.now().toString().slice(-6)}`,
      admission_number: `ADM-${Date.now().toString().slice(-6)}`,
      first_name: f.first_name,
      last_name: f.last_name,
      class_id: f.class_id || null,
      phone: f.phone || null,
      email: f.email || null,
      status: 'applicant',
    }),
  },
  classes: {
    moduleKey: 'classes',
    title: 'Classes & Grades',
    subtitle: 'Manage academic grade levels and capacities',
    table: 'classes',
    fields: [
      { name: 'name', label: 'Class Name (e.g., Grade 10)', type: 'text', required: true },
      { name: 'code', label: 'Class Code (e.g., G10)', type: 'text', required: true },
      { name: 'numeric_level', label: 'Numeric Level', type: 'number', defaultValue: '10', required: true },
      { name: 'capacity', label: 'Capacity', type: 'number', defaultValue: '45', required: true },
    ],
    columns: [
      { key: 'code', header: 'Code' },
      { key: 'name', header: 'Class Name' },
      { key: 'numeric_level', header: 'Level' },
      { key: 'capacity', header: 'Capacity' },
    ],
  },
  sections: {
    moduleKey: 'sections',
    title: 'Class Sections',
    subtitle: 'Manage divisions, rooms & class teachers',
    table: 'sections',
    fields: [
      { name: 'class_id', label: 'Class *', type: 'select', lookup: 'classes', required: true },
      { name: 'name', label: 'Section Name (e.g., Section A)', type: 'text', required: true },
      { name: 'room_number', label: 'Room Number', type: 'text' },
      { name: 'class_teacher_id', label: 'Class Teacher', type: 'select', lookup: 'teachers' },
      { name: 'capacity', label: 'Capacity', type: 'number', defaultValue: '40' },
    ],
    columns: [
      { key: 'name', header: 'Section' },
      { key: 'room_number', header: 'Room' },
      { key: 'capacity', header: 'Capacity' },
    ],
  },
  subjects: {
    moduleKey: 'subjects',
    title: 'Subject Catalog',
    subtitle: 'Configure courses and default mark thresholds',
    table: 'subjects',
    fields: [
      { name: 'name', label: 'Subject Name', type: 'text', required: true },
      { name: 'code', label: 'Subject Code', type: 'text', required: true },
      {
        name: 'subject_type',
        label: 'Type',
        type: 'select',
        defaultValue: 'core',
        options: [
          { value: 'core', label: 'Core' },
          { value: 'elective', label: 'Elective' },
          { value: 'lab', label: 'Lab' },
          { value: 'language', label: 'Language' },
        ],
      },
      { name: 'default_max_marks', label: 'Max Marks', type: 'number', defaultValue: '100' },
      { name: 'default_pass_marks', label: 'Pass Marks', type: 'number', defaultValue: '33' },
    ],
    columns: [
      { key: 'code', header: 'Code' },
      { key: 'name', header: 'Subject' },
      { key: 'subject_type', header: 'Type' },
      { key: 'default_max_marks', header: 'Max Marks' },
      { key: 'default_pass_marks', header: 'Pass Marks' },
    ],
  },
  sessions: {
    moduleKey: 'sessions',
    title: 'Academic Sessions',
    subtitle: 'Configure academic years and active terms',
    table: 'academic_sessions',
    fields: [
      { name: 'name', label: 'Session Name (e.g., 2026-2027)', type: 'text', required: true },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date', required: true },
    ],
    columns: [
      { key: 'name', header: 'Session' },
      { key: 'start_date', header: 'Start Date' },
      { key: 'end_date', header: 'End Date' },
      { key: 'is_current', header: 'Current', render: (r) => <Badge variant={r.is_current ? 'green' : 'slate'}>{r.is_current ? 'Active' : 'Archived'}</Badge> },
    ],
  },
  expenses: {
    moduleKey: 'expenses',
    title: 'Expenses Ledger',
    subtitle: 'Track operational bills, utilities, maintenance & vendor payments',
    table: 'expenses',
    fields: [
      { name: 'category', label: 'Category', type: 'text', defaultValue: 'Utilities', required: true },
      { name: 'title', label: 'Expense Title', type: 'text', required: true },
      { name: 'amount_dollars', label: 'Amount ($)', type: 'number', required: true },
      { name: 'expense_date', label: 'Date', type: 'date', required: true },
      { name: 'vendor_name', label: 'Vendor Name', type: 'text' },
    ],
    columns: [
      { key: 'expense_date', header: 'Date' },
      { key: 'category', header: 'Category' },
      { key: 'title', header: 'Description' },
      { key: 'vendor_name', header: 'Vendor' },
      { key: 'amount_cents', header: 'Amount', render: (r) => formatCurrencyCents(Number(r.amount_cents ?? 0)) },
    ],
    transformInsert: (f, tenantId, uid) => ({
      tenant_id: tenantId,
      category: f.category,
      title: f.title,
      amount_cents: Math.round(Number(f.amount_dollars || 0) * 100),
      expense_date: f.expense_date,
      vendor_name: f.vendor_name || null,
      recorded_by: uid,
    }),
  },
  timetable: {
    moduleKey: 'timetable',
    title: 'Class Timetable',
    subtitle: 'Weekly routine schedules across classes, subjects & rooms',
    table: 'timetables',
    fields: [
      { name: 'class_id', label: 'Class *', type: 'select', lookup: 'classes', required: true },
      { name: 'subject_id', label: 'Subject *', type: 'select', lookup: 'subjects', required: true },
      { name: 'teacher_id', label: 'Teacher', type: 'select', lookup: 'teachers' },
      {
        name: 'day_of_week',
        label: 'Day of Week',
        type: 'select',
        defaultValue: '1',
        options: [
          { value: '0', label: 'Sunday' },
          { value: '1', label: 'Monday' },
          { value: '2', label: 'Tuesday' },
          { value: '3', label: 'Wednesday' },
          { value: '4', label: 'Thursday' },
          { value: '5', label: 'Friday' },
          { value: '6', label: 'Saturday' },
        ],
      },
      { name: 'start_time', label: 'Start Time', type: 'time', defaultValue: '09:00', required: true },
      { name: 'end_time', label: 'End Time', type: 'time', defaultValue: '09:45', required: true },
      { name: 'room_number', label: 'Room', type: 'text' },
    ],
    columns: [
      { key: 'day_of_week', header: 'Day' },
      { key: 'start_time', header: 'Start' },
      { key: 'end_time', header: 'End' },
      { key: 'room_number', header: 'Room' },
    ],
  },
  homework: {
    moduleKey: 'homework',
    title: 'Homework Management',
    subtitle: 'Assign daily class homework visible to students and parents',
    table: 'homework',
    fields: [
      { name: 'class_id', label: 'Class *', type: 'select', lookup: 'classes', required: true },
      { name: 'subject_id', label: 'Subject *', type: 'select', lookup: 'subjects', required: true },
      { name: 'title', label: 'Homework Title *', type: 'text', required: true },
      { name: 'due_date', label: 'Due Date *', type: 'date', required: true },
      { name: 'description', label: 'Instructions', type: 'textarea' },
    ],
    columns: [
      { key: 'title', header: 'Title' },
      { key: 'due_date', header: 'Due Date' },
      { key: 'description', header: 'Instructions' },
    ],
  },
  assignments: {
    moduleKey: 'assignments',
    title: 'Graded Assignments',
    subtitle: 'Publish assignments and track student submissions',
    table: 'assignments',
    fields: [
      { name: 'class_id', label: 'Class *', type: 'select', lookup: 'classes', required: true },
      { name: 'subject_id', label: 'Subject *', type: 'select', lookup: 'subjects', required: true },
      { name: 'title', label: 'Assignment Title *', type: 'text', required: true },
      { name: 'max_score', label: 'Max Score', type: 'number', defaultValue: '100', required: true },
      { name: 'due_at', label: 'Due Date *', type: 'date', required: true },
      { name: 'description', label: 'Brief', type: 'textarea' },
    ],
    columns: [
      { key: 'title', header: 'Assignment' },
      { key: 'max_score', header: 'Max Score' },
      { key: 'due_at', header: 'Due Date', render: (r) => formatDate(String(r.due_at)) },
    ],
  },
  library: {
    moduleKey: 'library',
    title: 'Library Catalog',
    subtitle: 'Manage books, ISBNs, shelf locations & available copies',
    table: 'library_books',
    fields: [
      { name: 'title', label: 'Book Title *', type: 'text', required: true },
      { name: 'author', label: 'Author *', type: 'text', required: true },
      { name: 'isbn', label: 'ISBN', type: 'text' },
      { name: 'category', label: 'Category', type: 'text', defaultValue: 'Academic' },
      { name: 'total_copies', label: 'Total Copies', type: 'number', defaultValue: '5', required: true },
    ],
    columns: [
      { key: 'title', header: 'Title' },
      { key: 'author', header: 'Author' },
      { key: 'isbn', header: 'ISBN' },
      { key: 'category', header: 'Category' },
      { key: 'available_copies', header: 'Available' },
      { key: 'total_copies', header: 'Total' },
    ],
    transformInsert: (f, tenantId) => ({
      tenant_id: tenantId,
      title: f.title,
      author: f.author,
      isbn: f.isbn || null,
      category: f.category || 'General',
      total_copies: Number(f.total_copies || 1),
      available_copies: Number(f.total_copies || 1),
    }),
  },
  transport: {
    moduleKey: 'transport',
    title: 'Transport & Fleet Routes',
    subtitle: 'Manage school bus routes, vehicles & monthly transport fees',
    table: 'transport_routes',
    fields: [
      { name: 'route_name', label: 'Route Name *', type: 'text', required: true },
      { name: 'vehicle_id', label: 'Assigned Vehicle', type: 'select', lookup: 'vehicles' },
      { name: 'monthly_fee_dollars', label: 'Monthly Fee ($)', type: 'number', defaultValue: '35' },
    ],
    columns: [
      { key: 'route_name', header: 'Route' },
      { key: 'monthly_fee_cents', header: 'Monthly Fee', render: (r) => formatCurrencyCents(Number(r.monthly_fee_cents ?? 0)) },
      { key: 'is_active', header: 'Active', render: (r) => <Badge variant={r.is_active ? 'green' : 'slate'}>{r.is_active ? 'Active' : 'Paused'}</Badge> },
    ],
    transformInsert: (f, tenantId) => ({
      tenant_id: tenantId,
      route_name: f.route_name,
      vehicle_id: f.vehicle_id || null,
      monthly_fee_cents: Math.round(Number(f.monthly_fee_dollars || 0) * 100),
      is_active: true,
    }),
  },
  payroll: {
    moduleKey: 'payroll',
    title: 'HR & Payroll Runs',
    subtitle: 'Manage monthly employee salaries, allowances & deductions',
    table: 'payroll',
    fields: [
      {
        name: 'employee_type',
        label: 'Employee Type',
        type: 'select',
        defaultValue: 'teacher',
        options: [
          { value: 'teacher', label: 'Teacher' },
          { value: 'staff', label: 'Staff' },
        ],
      },
      { name: 'employee_name', label: 'Employee Name *', type: 'text', required: true },
      { name: 'month_year', label: 'Pay Period (YYYY-MM) *', type: 'text', defaultValue: new Date().toISOString().slice(0, 7), required: true },
      { name: 'basic_dollars', label: 'Basic Pay ($)*', type: 'number', required: true },
      { name: 'allowances_dollars', label: 'Allowances ($)', type: 'number', defaultValue: '0' },
      { name: 'deductions_dollars', label: 'Deductions ($)', type: 'number', defaultValue: '0' },
    ],
    columns: [
      { key: 'month_year', header: 'Period' },
      { key: 'employee_name', header: 'Employee' },
      { key: 'employee_type', header: 'Type' },
      { key: 'net_pay_cents', header: 'Net Pay', render: (r) => formatCurrencyCents(Number(r.net_pay_cents ?? 0)) },
      { key: 'status', header: 'Status', render: (r) => <Badge variant={r.status === 'paid' ? 'green' : 'amber'}>{String(r.status)}</Badge> },
    ],
    transformInsert: (f, tenantId) => ({
      tenant_id: tenantId,
      employee_type: f.employee_type || 'teacher',
      employee_id: crypto.randomUUID(),
      employee_name: f.employee_name,
      month_year: f.month_year,
      basic_cents: Math.round(Number(f.basic_dollars || 0) * 100),
      allowances_cents: Math.round(Number(f.allowances_dollars || 0) * 100),
      deductions_cents: Math.round(Number(f.deductions_dollars || 0) * 100),
      status: 'draft',
    }),
  },
  notices: {
    moduleKey: 'notices',
    title: 'Notices & Announcements',
    subtitle: 'Publish institution-wide circulars to Web & Android portals',
    table: 'notices',
    fields: [
      { name: 'title', label: 'Notice Title *', type: 'text', required: true },
      { name: 'body', label: 'Notice Body *', type: 'textarea', required: true },
    ],
    columns: [
      { key: 'title', header: 'Title' },
      { key: 'body', header: 'Message' },
      { key: 'published_at', header: 'Published', render: (r) => formatDate(String(r.published_at)) },
    ],
    transformInsert: (f, tenantId, uid) => ({
      tenant_id: tenantId,
      title: f.title,
      body: f.body,
      created_by: uid,
    }),
  },
  events: {
    moduleKey: 'events',
    title: 'Academic Calendar & Events',
    subtitle: 'Manage holidays, exams, sports days & parent meetings',
    table: 'events',
    fields: [
      { name: 'title', label: 'Event Title *', type: 'text', required: true },
      {
        name: 'event_type',
        label: 'Event Type',
        type: 'select',
        defaultValue: 'academic',
        options: [
          { value: 'academic', label: 'Academic' },
          { value: 'holiday', label: 'Holiday' },
          { value: 'exam', label: 'Examination' },
          { value: 'meeting', label: 'Parent Meeting' },
          { value: 'sports', label: 'Sports' },
        ],
      },
      { name: 'start_at', label: 'Start Date *', type: 'date', required: true },
      { name: 'end_at', label: 'End Date *', type: 'date', required: true },
      { name: 'location', label: 'Venue / Location', type: 'text' },
    ],
    columns: [
      { key: 'title', header: 'Event' },
      { key: 'event_type', header: 'Type' },
      { key: 'location', header: 'Location' },
      { key: 'start_at', header: 'Starts', render: (r) => formatDate(String(r.start_at)) },
    ],
  },
  communication: {
    moduleKey: 'communication',
    title: 'Parent-Teacher Communication',
    subtitle: 'Scoped messaging threads between linked guardians and faculty',
    table: 'communication_threads',
    fields: [],
    columns: [
      { key: 'subject', header: 'Subject' },
      { key: 'last_message_at', header: 'Last Activity', render: (r) => formatDate(String(r.last_message_at)) },
    ],
  },
  reports: {
    moduleKey: 'reports',
    title: 'Institutional Reports & Exports',
    subtitle: 'Download live CSV reports across students, attendance & fee collections',
    table: 'audit_logs',
    fields: [],
    columns: [
      { key: 'action', header: 'Activity' },
      { key: 'entity_type', header: 'Entity' },
      { key: 'created_at', header: 'Recorded At', render: (r) => formatDate(String(r.created_at)) },
    ],
  },
};

export default function SchoolDynamicModulePage() {
  const { module: modParam } = useParams<{ module: string }>();
  const spec = MODULE_SPECS[modParam];
  const { config } = useRemoteConfig();
  const tenantId = config.tenant?.id;

  const [rows, setRows] = useState<AnyRow[]>([]);
  const [lookups, setLookups] = useState<Record<string, Array<{ value: string; label: string }>>>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadModule = useCallback(async () => {
    if (!tenantId || !spec) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setLoading(true);

    const [{ data }, { data: cls }, { data: sub }, { data: tch }, { data: veh }] = await Promise.all([
      supabase.from(spec.table).select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }).limit(200),
      supabase.from('classes').select('id, name').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('subjects').select('id, name').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('teachers').select('id, full_name').eq('tenant_id', tenantId).is('deleted_at', null),
      supabase.from('vehicles').select('id, vehicle_number').eq('tenant_id', tenantId),
    ]);

    setRows(data ?? []);
    setLookups({
      classes: (cls ?? []).map((c) => ({ value: c.id, label: c.name })),
      subjects: (sub ?? []).map((s) => ({ value: s.id, label: s.name })),
      teachers: (tch ?? []).map((t) => ({ value: t.id, label: t.full_name })),
      vehicles: (veh ?? []).map((v) => ({ value: v.id, label: v.vehicle_number })),
    });
    setLoading(false);
  }, [spec, tenantId]);

  useEffect(() => {
    if (spec) {
      const defaults: Record<string, string> = {};
      spec.fields.forEach((f) => {
        defaults[f.name] = f.defaultValue ?? '';
      });
      setForm(defaults);
      void loadModule();
    } else {
      setLoading(false);
    }
  }, [loadModule, spec]);

  if (!spec) {
    return (
      <StateFeedback
        type="empty"
        title="Module Not Found"
        message={`No built-in school module matched "${modParam}".`}
      />
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    const supabase = createBrowserSupabaseClient();
    if (!supabase) return;
    setFeedback(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const payload = spec.transformInsert
      ? spec.transformInsert(form, tenantId, user?.id ?? null)
      : {
          tenant_id: tenantId,
          ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v === '' ? null : v])),
        };

    const { error } = await supabase.from(spec.table).insert(payload);
    if (error) {
      setFeedback({ type: 'error', text: error.message });
    } else {
      setModalOpen(false);
      setFeedback({ type: 'success', text: `Created new ${spec.title} record.` });
      await loadModule();
    }
  };

  return (
    <ModuleGuard moduleKey={spec.moduleKey} moduleName={spec.title}>
      <div className="space-y-6">
        {feedback && (
          <StateFeedback
            type={feedback.type}
            title={feedback.type === 'success' ? 'Saved' : 'Error'}
            message={feedback.text}
          />
        )}

        {loading ? (
          <StateFeedback type="loading" title={`Loading ${spec.title}...`} />
        ) : (
          <DataTable
            title={spec.title}
            subtitle={spec.subtitle}
            rows={rows}
            columns={spec.columns}
            exportFilename={`campusos-${spec.moduleKey}.csv`}
            headerAction={
              spec.fields.length > 0 && (
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Record
                </Button>
              )
            }
          />
        )}

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Add ${spec.title} Record`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {spec.fields.map((field) => {
              const opts = field.lookup ? [{ value: '', label: 'Select...' }, ...(lookups[field.lookup] ?? [])] : field.options ?? [];
              if (field.type === 'select') {
                return (
                  <Select
                    key={field.name}
                    label={field.label}
                    required={field.required}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                    options={opts}
                  />
                );
              }
              if (field.type === 'textarea') {
                return (
                  <Textarea
                    key={field.name}
                    label={field.label}
                    required={field.required}
                    rows={3}
                    value={form[field.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  />
                );
              }
              return (
                <Input
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  required={field.required}
                  value={form[field.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                />
              );
            })}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Record</Button>
            </div>
          </form>
        </Modal>
      </div>
    </ModuleGuard>
  );
}
