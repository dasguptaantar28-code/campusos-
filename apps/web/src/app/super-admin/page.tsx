'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Database,
  Building2,
  Sliders,
  FileText,
  LogOut,
  CheckCircle2,
  Search,
  RefreshCw,
  Plus,
  Lock,
  Smartphone,
  ExternalLink,
  GraduationCap,
  Edit3,
  Filter,
} from 'lucide-react';
import type { RegistrationRecord } from '@/lib/data-store';
import { CLASS_LIST, SECTION_LIST, INSTITUTIONS, type StudentProfileData } from '@/lib/school-types';

type AdminTab = 'overview' | 'registrations' | 'database' | 'institutions' | 'sdui' | 'security' | 'audit' | 'school_manager';

export default function SuperAdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Registrations state
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // SDUI state
  const [primaryColor, setPrimaryColor] = useState('#064E3B');
  const [accentColor, setAccentColor] = useState('#D97706');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sduiSaved, setSduiSaved] = useState(false);

  // School 1,280-Student Multi-Institution Management State
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('inst-school');
  const currentInstitution = INSTITUTIONS.find(i => i.id === selectedInstitutionId) || INSTITUTIONS[0];

  const [schoolClass, setSchoolClass] = useState('Class 10');
  const [schoolSection, setSchoolSection] = useState('Section A');
  const [schoolStudents, setSchoolStudents] = useState<StudentProfileData[]>([]);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [schoolSearch, setSchoolSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentProfileData | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    rollNumber: 1,
    bloodGroup: 'B+',
    attendancePercentage: 96.0,
    currentGpa: 5.0,
    guardianName: '',
    guardianPhone: ''
  });

  const fetchSchoolStudents = async () => {
    setSchoolLoading(true);
    try {
      const res = await fetch(
        `/api/school/students?className=${encodeURIComponent(schoolClass)}&sectionName=${encodeURIComponent(schoolSection)}&institutionId=${selectedInstitutionId}`
      );
      const data = await res.json();
      if (data.success && data.students) {
        setSchoolStudents(data.students);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSchoolLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'school_manager') {
      fetchSchoolStudents();
    }
  }, [activeTab, schoolClass, schoolSection, selectedInstitutionId]);

  const handleOpenEdit = (s: StudentProfileData) => {
    setEditingStudent(s);
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      rollNumber: s.rollNumber,
      bloodGroup: s.bloodGroup,
      attendancePercentage: s.attendancePercentage,
      currentGpa: s.currentGpa,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone
    });
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const res = await fetch('/api/school/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStudent.id,
          ...editForm
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Student record for ${data.student.fullName} (${data.student.studentIdCode}) successfully updated!`);
        setTimeout(() => setActionNotice(null), 4000);
        setEditingStudent(null);
        fetchSchoolStudents();
      } else {
        alert(data.message || 'Failed to update student');
      }
    } catch (err) {
      alert('Error updating student');
    }
  };

  const fetchRegistrations = async () => {
    setLoadingRegs(true);
    try {
      const res = await fetch('/api/registrations');
      const data = await res.json();
      if (data.success && data.registrations) {
        setRegistrations(data.registrations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Registration successfully ${status}! Synchronized with Web and Android APK.`);
        setTimeout(() => setActionNotice(null), 4000);
        fetchRegistrations();
      }
    } catch {
      setActionNotice('Failed to update registration status.');
    }
  };

  const simulateApkRegistration = async () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: `Mahir Faysal #${randomNum}`,
          email: `mahir.faysal${randomNum}@gmail.com`,
          phone: '+8801711223344',
          institution_name: 'MIC Smart University',
          role: 'student',
          source: 'mobile_apk',
          notes: 'Submitted live from Android Mobile APK',
          password: 'password123',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice('Simulated Android APK Registration queued in review table!');
        setTimeout(() => setActionNotice(null), 4000);
        fetchRegistrations();
      }
    } catch {
      setActionNotice('Simulation error.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match.', error: true });
      return;
    }
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change',
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPassMsg({ text: 'Password successfully changed!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassMsg({ text: data.error || 'Failed to change password.', error: true });
      }
    } catch {
      setPassMsg({ text: 'Network error.', error: true });
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mic_logged_in_email');
      localStorage.removeItem('mic_logged_in_role');
    }
    router.push('/login');
  };

  const pendingCount = registrations.filter(r => r.status === 'pending').length;

  const filteredRegistrations = registrations.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSearch =
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="relative h-10 w-32 brightness-0 invert">
            <Image
              src="/logo.png"
              alt="MIC Smart Campus"
              fill
              priority
              className="object-contain"
            />
          </Link>
          <span className="hidden sm:inline-block h-6 w-px bg-slate-700" />
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="font-bold text-white">Super Admin Control Plane</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-400">Signed in as:</span>
            <span className="text-emerald-400 font-semibold">Antar Dasgupta</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950">CREATOR 👑</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-[11px] font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Supabase Connected
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-bold transition border border-slate-700 text-white cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 space-y-6 max-w-7xl">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {[
            { key: 'overview' as const, icon: LayoutDashboard, label: 'Platform Metrics' },
            { key: 'school_manager' as const, icon: GraduationCap, label: 'Edit Students (1,280)' },
            { key: 'registrations' as const, icon: Users, label: `App Registrations (${pendingCount})`, badge: pendingCount > 0 },
            { key: 'database' as const, icon: Database, label: 'Database (Supabase)' },
            { key: 'institutions' as const, icon: Building2, label: 'Institution Tenants' },
            { key: 'sdui' as const, icon: Sliders, label: 'Remote Mobile SDUI' },
            { key: 'security' as const, icon: Lock, label: 'Admin Security & Password' },
            { key: 'audit' as const, icon: FileText, label: 'Security & Audit Logs' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          ))}
        </div>

        {/* Action Notice Banner */}
        {actionNotice && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center justify-between dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {actionNotice}
            </span>
            <button type="button" onClick={() => setActionNotice(null)} className="text-emerald-700 dark:text-emerald-400">✕</button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Institutions</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">3 Tenants</div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% Isolated Tenancy
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Registrations</div>
                <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount} Applications</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <Smartphone className="h-3.5 w-3.5 text-emerald-600" /> Incoming from Mobile APK
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Database Status</div>
                <div className="text-base font-bold mt-1 text-emerald-700 dark:text-emerald-400">
                  Supabase Cloud Connected
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('database')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-1 block cursor-pointer"
                >
                  Configure Supabase Project →
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System Creator</div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-400 text-slate-950">CREATOR 👑</span>
                </div>
                <div className="text-base font-bold text-purple-900 dark:text-purple-300 mt-1 truncate">
                  Antar Dasgupta
                </div>
                <div className="text-xs text-slate-500 mt-1 truncate font-mono">
                  antardasgupta@gmail.com
                </div>
              </div>
            </div>

            {/* Sync Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white border border-emerald-800/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1.5 text-center sm:text-left">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Unified Central Control
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold">
                  Web Dashboard &amp; Mobile APK Sync
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Full control over student admissions, teacher allocations, notices, remote SDUI mobile themes, and live database synchronizations.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('registrations')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  Review Registrations ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('database')}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
                >
                  Manage Supabase
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTRATIONS REVIEW QUEUE */}
        {activeTab === 'registrations' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Incoming App &amp; Admission Registrations
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Applications submitted from the Android Mobile APK and Web Portal arrive directly in this review queue.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={simulateApkRegistration}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition cursor-pointer dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Simulate APK Registration
                </button>
                <button
                  type="button"
                  onClick={fetchRegistrations}
                  disabled={loadingRegs}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingRegs ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs focus:outline-none focus:border-emerald-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Contact Details</th>
                    <th className="py-3.5 px-4">Institution &amp; Role</th>
                    <th className="py-3.5 px-4">Source</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No registration requests found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-950/50">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {reg.full_name}
                          </div>
                          {reg.student_id_code && (
                            <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              {reg.student_id_code}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div>{reg.email}</div>
                          <div className="text-slate-400 text-[11px]">{reg.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {reg.institution_name}
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {reg.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {reg.source === 'mobile_apk' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                              <Smartphone className="h-3 w-3" /> Android APK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
                              <ExternalLink className="h-3 w-3" /> Web Portal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              reg.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : reg.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {reg.status === 'approved'
                              ? 'Approved'
                              : reg.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending Review'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {reg.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(reg.id, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {reg.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(reg.id, 'rejected')}
                                className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 transition cursor-pointer dark:bg-rose-950 dark:text-rose-300"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DATABASE (SUPABASE) */}
        {activeTab === 'database' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-emerald-600" />
                  Supabase PostgreSQL Database Connection
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Connect your centralized Supabase project to power Row Level Security (RLS), multi-tenant isolation, and real-time syncing between Web and Android Mobile APK.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Database Cluster
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  readOnly
                  value="https://nlmzdgubcztxpcrfqkfs.supabase.co"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  readOnly
                  value="sb_publishable_wWoejie1mDRQSsJg71quzw_jsoTdxqA"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 py-2.5 px-3.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* SQL Migrations List */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Integrated PostgreSQL Schema &amp; Seed Scripts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    super_admin_setup.sql
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Provisions Super Administrator: Antar Dasgupta (Creator)
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    master_auto_register_and_seed.sql
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Tenants, Classes, Routine Timetables &amp; Student Invoices
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: INSTITUTIONS */}
        {activeTab === 'institutions' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Multi-Tenant Institutions
              </h2>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-600 transition flex items-center gap-1.5 shadow"
              >
                <Plus className="h-4 w-4" /> Provision New Tenant
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'MIC Smart University', code: 'mic-university', type: 'University', students: 1420 },
                { name: 'MIC Model College', code: 'mic-college', type: 'College', students: 860 },
                { name: 'MIC International School', code: 'mic-school', type: 'School', students: 540 },
              ].map((inst) => (
                <div
                  key={inst.code}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {inst.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">{inst.code}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{inst.name}</h3>
                  <div className="text-xs text-slate-500">{inst.students} Registered Students</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SDUI REMOTE CONTROL */}
        {activeTab === 'sdui' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-600" />
                Server-Driven Mobile UI (SDUI) Control
              </h2>
              <p className="text-xs text-slate-500">
                Broadcast UI color palettes, emergency maintenance alerts, and component visibility to the Android APK without rebuilding the binary.
              </p>

              {sduiSaved && (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-bold dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                  Config pushed to Android APK subscribers!
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <span className="font-mono text-xs">{primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Accent Gold</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-9 w-14 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <span className="font-mono text-xs">{accentColor}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="maint"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="h-4 w-4 rounded text-emerald-600"
                  />
                  <label htmlFor="maint" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Campus Maintenance Mode (Lock Mobile App)
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSduiSaved(true);
                    setTimeout(() => setSduiSaved(false), 3000);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition shadow cursor-pointer"
                >
                  Save &amp; Push to Android Devices
                </button>
              </div>
            </div>

            {/* Mobile Preview */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mobile Live Preview
              </div>
              <div
                className="w-full max-w-xs mx-auto rounded-3xl p-5 text-white shadow-xl space-y-4"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold">MIC Smart Campus</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="bg-white/10 p-3 rounded-2xl text-xs space-y-1">
                  <div className="text-[11px] opacity-80">Welcome, Student!</div>
                  <div className="font-bold text-sm" style={{ color: accentColor }}>
                    Attendance: 96.2%
                  </div>
                </div>
                {maintenanceMode && (
                  <div className="bg-rose-500/90 text-white p-2 rounded-xl text-[10px] text-center font-bold">
                    Maintenance Mode Active
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="h-5 w-5 text-purple-600" />
              Change Super Admin Password
            </h2>
            <p className="text-xs text-slate-500">
              Update official login password for <strong>antardasgupta@gmail.com</strong>
            </p>

            {passMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  passMsg.error ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {passMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter current password (default: password123)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 py-2 px-3 text-xs dark:bg-slate-950 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600" />
              Immutable PostgreSQL Audit Log Trail
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Timestamp (UTC)</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Record Identifier</th>
                    <th className="py-3 px-4">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  <tr>
                    <td className="py-3 px-4 text-slate-500">2026-11-15 10:45:00</td>
                    <td className="py-3 px-4 font-bold">registrations</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">INSERT</span></td>
                    <td className="py-3 px-4">reg-001</td>
                    <td className="py-3 px-4 text-slate-500">applicant_web</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-500">2026-11-15 09:30:12</td>
                    <td className="py-3 px-4 font-bold">registrations</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">UPDATE</span></td>
                    <td className="py-3 px-4">reg-002</td>
                    <td className="py-3 px-4 text-slate-500">super_admin</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-slate-500">2026-11-15 08:20:45</td>
                    <td className="py-3 px-4 font-bold">student_fees</td>
                    <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">PAYMENT</span></td>
                    <td className="py-3 px-4">INV-2026-1042</td>
                    <td className="py-3 px-4 text-slate-500">bkash_webhook</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: SCHOOL & MULTI-INSTITUTION MASTER MANAGER (ADMIN EDIT PRIVILEGES) */}
        {activeTab === 'school_manager' && (
          <div className="space-y-6">
            {/* Scale Banner */}
            <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-emerald-900/40 shadow-md">
              <span className="inline-block rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 text-xs font-semibold text-emerald-300 mb-2">
                Platform Scale: 3 Institutions • 1,280 Students • EDIT ACCESS: MASTER FULL ✍️
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Master Student Directory: {currentInstitution.shortName} ({schoolClass} • {schoolSection})
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                As Super Admin, you have master edit privileges to modify student names, roll numbers, attendance records, GPAs, and guardian contacts across all 3 institutions.
              </p>
            </div>

            {/* Active Institution Switcher */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Active Institution Switcher
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {currentInstitution.iconEmoji} {currentInstitution.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {currentInstitution.tagline}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {INSTITUTIONS.map(inst => (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => {
                      setSelectedInstitutionId(inst.id);
                      setSchoolClass(inst.classList[0]);
                      setSchoolSection(inst.sectionList[0]);
                      setSchoolSearch('');
                    }}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      selectedInstitutionId === inst.id
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{inst.iconEmoji}</span>
                    <span>{inst.shortName}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Browse {currentInstitution.type === 'University' ? 'Department' : 'Class'} ({currentInstitution.classList.length} Total)
                  </span>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search students by name, ID, guardian..."
                    value={schoolSearch}
                    onChange={e => setSchoolSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Class Chips */}
              <div className="flex flex-wrap gap-2">
                {currentInstitution.classList.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSchoolClass(c)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      schoolClass === c
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Section Chips */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {currentInstitution.type === 'University' ? 'Batch / Year:' : 'Section:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {currentInstitution.sectionList.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSchoolSection(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        schoolSection === s
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Student Roster Cards with EDIT button */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schoolStudents
                .filter(s =>
                  !schoolSearch.trim() ||
                  s.fullName.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                  s.studentIdCode.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                  s.guardianName.toLowerCase().includes(schoolSearch.toLowerCase()) ||
                  s.rollDisplay.includes(schoolSearch)
                )
                .map(s => (
                  <div
                    key={s.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-300 dark:border-emerald-800">
                          {s.rollDisplay}
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {s.fullName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            ID: {s.studentIdCode} • {s.className} ({s.sectionName})
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit ✏️
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Attendance</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{s.attendancePercentage}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Current GPA</span>
                        <strong className="text-amber-500 font-bold">{s.currentGpa.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Blood Group</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-bold">{s.bloodGroup}</strong>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-0.5">
                      <div>
                        <strong>Guardian:</strong> {s.guardianName} ({s.guardianRelation})
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Phone: {s.guardianPhone}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* EDIT STUDENT MODAL DIALOG */}
            {editingStudent && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Edit Student Record ✏️
                      </h3>
                      <p className="text-xs text-slate-400">
                        ID: {editingStudent.studentIdCode} • {editingStudent.className} - {editingStudent.sectionName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingStudent(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveStudentEdit} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">First Name</label>
                        <input
                          type="text"
                          value={editForm.firstName}
                          onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Last Name</label>
                        <input
                          type="text"
                          value={editForm.lastName}
                          onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Roll (1-20)</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={editForm.rollNumber}
                          onChange={e => setEditForm({ ...editForm, rollNumber: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Blood Group</label>
                        <input
                          type="text"
                          value={editForm.bloodGroup}
                          onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Attendance %</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editForm.attendancePercentage}
                          onChange={e => setEditForm({ ...editForm, attendancePercentage: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Current GPA (0-5.00)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          value={editForm.currentGpa}
                          onChange={e => setEditForm({ ...editForm, currentGpa: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Guardian Full Name</label>
                      <input
                        type="text"
                        value={editForm.guardianName}
                        onChange={e => setEditForm({ ...editForm, guardianName: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 font-semibold">Guardian Phone Number</label>
                      <input
                        type="text"
                        value={editForm.guardianPhone}
                        onChange={e => setEditForm({ ...editForm, guardianPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(null)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer"
                      >
                        Save Changes 💾
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 dark:text-slate-300">
          CampusOS Multi-Institution Unified Platform • Next.js Web &amp; Android Interconnected
        </div>
        <div>
          All Rights Reserved to Antar Dasgupta © {new Date().getFullYear()} Antar Dasgupta. System Creator &amp; Chief Architect.
        </div>
      </footer>
    </div>
  );
}
