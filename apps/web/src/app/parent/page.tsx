'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  CreditCard,
  User,
  CheckCircle2,
  Calendar,
  Award,
  BookOpen,
  Clock,
  ShieldCheck,
  Phone,
  AlertCircle
} from 'lucide-react';
import {
  type StudentProfileData,
  type RoutineSlotData,
  type ExaminationRecordData,
  getStudentResults
} from '@/lib/school-types';

export default function ParentDashboardPage() {
  const router = useRouter();

  const [children, setChildren] = useState<StudentProfileData[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [routines, setRoutines] = useState<RoutineSlotData[]>([]);
  const [exams, setExams] = useState<ExaminationRecordData[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'routine' | 'results' | 'exams' | 'fees'>('overview');
  const [loading, setLoading] = useState(true);
  const [feePaid, setFeePaid] = useState(false);

  useEffect(() => {
    async function loadGuardianChildren() {
      setLoading(true);
      try {
        let guardianEmail = 'guardian.demo@campusos.edu';
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('mic_logged_in_email');
          if (stored && stored.includes('@')) {
            guardianEmail = stored;
          }
        }

        const res = await fetch(`/api/school/students?guardianEmail=${encodeURIComponent(guardianEmail)}`);
        const json = await res.json();
        if (json.success && json.children && json.children.length > 0) {
          setChildren(json.children);
          const currentChild = json.children[0];

          // Fetch routine for child's section
          const rRes = await fetch(`/api/school/routines?className=${encodeURIComponent(currentChild.className)}&sectionName=${encodeURIComponent(currentChild.sectionName)}`);
          const rJson = await rRes.json();
          if (rJson.success && rJson.slots) {
            setRoutines(rJson.slots);
          }

          // Fetch exams for child's class
          const eRes = await fetch(`/api/school/exams?className=${encodeURIComponent(currentChild.className)}`);
          const eJson = await eRes.json();
          if (eJson.success && eJson.exams) {
            setExams(eJson.exams);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGuardianChildren();
  }, []);

  const handleSelectChild = async (idx: number) => {
    setSelectedChildIndex(idx);
    const child = children[idx];
    if (!child) return;

    try {
      const rRes = await fetch(`/api/school/routines?className=${encodeURIComponent(child.className)}&sectionName=${encodeURIComponent(child.sectionName)}`);
      const rJson = await rRes.json();
      if (rJson.success && rJson.slots) setRoutines(rJson.slots);

      const eRes = await fetch(`/api/school/exams?className=${encodeURIComponent(child.className)}`);
      const eJson = await eRes.json();
      if (eJson.success && eJson.exams) setExams(eJson.exams);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mic_logged_in_email');
      localStorage.removeItem('mic_logged_in_role');
    }
    router.push('/login');
  };

  const currentChild = children[selectedChildIndex];

  if (loading || !currentChild) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading guardian portal...</p>
        </div>
      </div>
    );
  }

  const results = getStudentResults(currentChild);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/" className="relative h-10 w-28 brightness-0 invert">
            <Image
              src="/logo.png"
              alt="MIC Smart Campus"
              fill
              priority
              className="object-contain"
            />
          </Link>
          <span className="hidden sm:inline-block h-6 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-rose-400 hidden sm:inline-block">
            Guardian &amp; Parent Portal • Scoped Security
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
              <User className="h-3.5 w-3.5 text-rose-400" />
              {currentChild.guardianName}
            </div>
            <div className="text-[11px] text-slate-400">
              Verified Guardian ({currentChild.guardianRelation})
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-bold transition border border-slate-700 text-white cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-6 max-w-7xl">
        {/* Strict Isolation Notice */}
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-rose-500 shrink-0" />
            <span>
              <strong>Guardian Privacy Shield Active:</strong> Access is strictly restricted to your registered ward(s). No access to other students or institutional records.
            </span>
          </div>
          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold">Switch Child:</span>
              <div className="flex gap-1">
                {children.map((child, idx) => (
                  <button
                    key={child.id}
                    onClick={() => handleSelectChild(idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedChildIndex === idx
                        ? 'bg-rose-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {child.firstName} ({child.className})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Child Profile Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-rose-900/40 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="rounded-full bg-rose-500/20 border border-rose-400/40 px-3 py-0.5 text-xs font-semibold text-rose-300">
              Linked Child Academic Portfolio
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {currentChild.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              ID: <strong className="font-mono text-rose-300">{currentChild.studentIdCode}</strong> • {currentChild.className} • {currentChild.sectionName} • Roll: <strong className="text-white">{currentChild.rollDisplay}</strong> • Blood: <strong>{currentChild.bloodGroup}</strong>
            </p>
          </div>

          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-center min-w-[140px]">
            <span className="text-[10px] text-slate-400 font-bold block">ACADEMIC CGPA</span>
            <span className="text-3xl font-black text-amber-400">{currentChild.currentGpa.toFixed(2)}</span>
            <span className="text-[10px] text-slate-400 block">Out of 5.00</span>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Term Attendance</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{currentChild.attendancePercentage}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Eligible for Term Final Exams</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Total Outstanding Due</div>
              <div className="text-2xl font-black text-rose-500 mt-1">{feePaid ? '৳ 0' : '৳ 4,500'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{feePaid ? 'Paid via bKash' : 'Lab & Exam Fee Due'}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              ৳
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Institution</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{currentChild.institutionName}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Smart RFID Campus System Active</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              🏫
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Ward Overview
          </button>
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'routine'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Class Routine
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Report Card &amp; GPA
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exams'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Exam Timetable
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fees'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Pay Fees (bKash / Nagad)
          </button>
        </div>

        {/* Tab 1: Ward Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Registered Guardian Information</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Guardian Name</span>
                  <span className="font-bold">{currentChild.guardianName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Relation</span>
                  <span className="font-bold">{currentChild.guardianRelation}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Contact Number</span>
                  <span className="font-mono font-bold text-rose-500">{currentChild.guardianPhone}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Registered Email</span>
                  <span className="font-mono">{currentChild.guardianEmail}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Campus Notice</h3>
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold">Fall Midterm Examinations Approach</div>
                <div>Please make sure all outstanding fee dues are settled before November 25 to receive the physical and digital Admit Card.</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Routine */}
        {activeTab === 'routine' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Weekly Routine for {currentChild.fullName} ({currentChild.className} - {currentChild.sectionName})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3">Period Time</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {routines.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-bold text-rose-500">{r.dayOfWeek}</td>
                      <td className="py-2.5 px-3 font-mono">{r.startTime} - {r.endTime}</td>
                      <td className="py-2.5 px-3 font-semibold">{r.subjectName}</td>
                      <td className="py-2.5 px-3 text-slate-500">{r.teacherName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{r.roomNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Results */}
        {activeTab === 'results' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Academic Performance Card
              </h2>
              <span className="text-xs font-bold text-amber-500">GPA: {currentChild.currentGpa.toFixed(2)} / 5.00</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Marks</th>
                    <th className="py-2.5 px-3">Grade Point</th>
                    <th className="py-2.5 px-3">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((r) => (
                    <tr key={r.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-semibold">{r.title}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{r.code}</td>
                      <td className="py-2.5 px-3 font-bold">{r.marks} / 100</td>
                      <td className="py-2.5 px-3 font-bold text-rose-500">{r.gradePoint.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-500">{r.letterGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Exams */}
        {activeTab === 'exams' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming Exams for {currentChild.className}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((ex) => (
                <div key={ex.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{ex.title}</div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>📅 {ex.startDate}</span>
                    <span>⏰ {ex.time}</span>
                    <span className="font-bold text-rose-500">{ex.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Fees */}
        {activeTab === 'fees' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Ward Fee Settlement &amp; Mobile Banking
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold">Midterm Examination &amp; Lab Fee</div>
                <div className="text-xs text-slate-500">Invoice: INV-2026-F11 • Due: 25 Nov 2026</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-rose-500">৳ 4,500</span>
                {feePaid ? (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Paid with bKash
                  </span>
                ) : (
                  <button
                    onClick={() => setFeePaid(true)}
                    className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    Pay with bKash
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 dark:text-slate-300">
          CampusOS Multi-Institution Unified Platform • Guardian Academic Portal (Strict Scope)
        </div>
        <div>
          All Rights Reserved to Antar Dasgupta © {new Date().getFullYear()} Antar Dasgupta. System Creator &amp; Chief Architect.
        </div>
      </footer>
    </div>
  );
}
