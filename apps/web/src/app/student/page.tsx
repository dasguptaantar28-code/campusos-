'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CampusLogo } from '@/components/brand/campusos-logo';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Calendar,
  Award,
  CreditCard,
  BookOpen,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Check,
  Building,
  GraduationCap
} from 'lucide-react';
import {
  type StudentProfileData,
  type RoutineSlotData,
  type ExaminationRecordData,
  getStudentResults
} from '@/lib/school-types';

export default function StudentDashboardPage() {
  const router = useRouter();

  const [student, setStudent] = useState<StudentProfileData | null>(null);
  const [routines, setRoutines] = useState<RoutineSlotData[]>([]);
  const [exams, setExams] = useState<ExaminationRecordData[]>([]);
  const [activeTab, setActiveTab] = useState<'routine' | 'attendance' | 'results' | 'exams' | 'fees'>('routine');
  const [selectedDay, setSelectedDay] = useState('Sunday');
  const [loading, setLoading] = useState(true);

  // bKash / Payment mock state
  const [feePaid, setFeePaid] = useState(false);

  useEffect(() => {
    async function loadStudent() {
      setLoading(true);
      try {
        let email = 'student.demo@campusos.edu';
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('campusos_logged_in_email') || localStorage.getItem('mic_logged_in_email');
          if (stored && stored.includes('@')) {
            email = stored;
          }
        }

        const res = await fetch(`/api/school/students?email=${encodeURIComponent(email)}`);
        const json = await res.json();
        if (json.success && json.student) {
          const s: StudentProfileData = json.student;
          setStudent(s);

          // Fetch routine for their specific class and section
          const rRes = await fetch(`/api/school/routines?className=${encodeURIComponent(s.className)}&sectionName=${encodeURIComponent(s.sectionName)}`);
          const rJson = await rRes.json();
          if (rJson.success && rJson.slots) {
            setRoutines(rJson.slots);
          }

          // Fetch exams for their class
          const eRes = await fetch(`/api/school/exams?className=${encodeURIComponent(s.className)}`);
          const eJson = await eRes.json();
          if (eJson.success && eJson.exams) {
            setExams(eJson.exams);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStudent();
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campusos_logged_in_email');
      localStorage.removeItem('campusos_logged_in_role');
      localStorage.removeItem('mic_logged_in_email');
      localStorage.removeItem('mic_logged_in_role');
    }
    router.push('/login');
  };

  if (loading || !student) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Loading student portal record...</p>
        </div>
      </div>
    );
  }

  const results = getStudentResults(student);
  const dayRoutines = routines.filter(r => r.dayOfWeek.toLowerCase() === selectedDay.toLowerCase());

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <CampusLogo href="/" darkSurface size="sm" />
          <span className="hidden sm:inline-block h-6 w-px bg-slate-700" />
          <span className="text-xs font-semibold text-emerald-400 hidden sm:inline-block">
            Student Academic Portal • Read Only View
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
              <User className="h-3.5 w-3.5 text-blue-400" />
              {student.fullName}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {student.className} • {student.sectionName} (Roll: {student.rollDisplay})
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
        {/* Student Profile Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-blue-900/40 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="rounded-full bg-blue-500/20 border border-blue-400/40 px-3 py-0.5 text-xs font-semibold text-blue-300">
                Verified Student Account
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 text-xs font-semibold text-emerald-300">
                RLS Scoped • Strictly Own Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {student.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Student ID: <strong className="font-mono text-blue-300">{student.studentIdCode}</strong> • Class: <strong className="text-white">{student.className}</strong> • Section: <strong className="text-white">{student.sectionName}</strong> • Roll: <strong className="text-amber-400">{student.rollDisplay}</strong>
            </p>
          </div>

          <div className="flex flex-row sm:flex-col gap-3 text-right">
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700 text-center min-w-[120px]">
              <span className="text-[10px] text-slate-400 font-bold block">CURRENT GPA</span>
              <span className="text-2xl font-black text-amber-400">{student.currentGpa.toFixed(2)}</span>
              <span className="text-[10px] text-slate-400 block">Scale 5.00</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Class Attendance</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{student.attendancePercentage}%</div>
              <div className="text-[11px] text-slate-500 mt-0.5">88 of 92 Lectures Attended</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Tuition &amp; Fees</div>
              <div className="text-2xl font-black text-rose-500 mt-1">{feePaid ? '৳ 0' : '৳ 4,500'}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{feePaid ? 'All fees settled' : 'Midterm Exam Due: 25 Nov'}</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              ৳
            </div>
          </div>

          <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400">Guardian Contact</div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">{student.guardianName}</div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">{student.guardianPhone} ({student.guardianRelation})</div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              👨‍👩‍👦
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'routine'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Class Routine
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'attendance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Attendance History
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            Subject Marks &amp; GPA
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exams'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Exam Schedule &amp; Admit Card
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fees'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            Fees &amp; Payments
          </button>
        </div>

        {/* Tab Content 1: Class Routine */}
        {activeTab === 'routine' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Timetable: {student.className} • {student.sectionName}
                </h2>
                <p className="text-xs text-slate-400">Regular lecture periods (5 classes daily)</p>
              </div>
              <div className="flex gap-1.5">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'].map(day => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      selectedDay === day
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {dayRoutines.map((slot, idx) => (
                <div key={slot.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      P{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {slot.subjectName} ({slot.subjectCode})
                      </div>
                      <div className="text-xs text-slate-500">
                        Teacher: {slot.teacherName}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <span>⏰ {slot.startTime} - {slot.endTime}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-bold text-slate-800 dark:text-slate-200">{slot.roomNumber}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 2: Attendance */}
        {activeTab === 'attendance' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Official Term Attendance Breakdown
            </h2>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs space-y-1">
              <div className="font-bold">Overall Attendance: {student.attendancePercentage}% (Good Standing)</div>
              <div>School regulation requires 80.0% minimum attendance to sit for midterm examinations.</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 block">Total Working Days</span>
                <span className="text-xl font-bold">92</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 block">Present</span>
                <span className="text-xl font-bold text-emerald-500">88</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 block">Excused Leaves</span>
                <span className="text-xl font-bold text-blue-500">3</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-400 block">Unexcused Absent</span>
                <span className="text-xl font-bold text-rose-500">1</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Results */}
        {activeTab === 'results' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Grade Sheet &amp; Academic Transcript
              </h2>
              <span className="text-xs font-bold text-amber-500">Cumulative GPA: {student.currentGpa.toFixed(2)}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Credits</th>
                    <th className="py-2.5 px-3">Marks</th>
                    <th className="py-2.5 px-3">Grade Point</th>
                    <th className="py-2.5 px-3">Letter Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((r) => (
                    <tr key={r.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-semibold">{r.title}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{r.code}</td>
                      <td className="py-2.5 px-3">{r.credits}</td>
                      <td className="py-2.5 px-3 font-bold">{r.marks} / 100</td>
                      <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">{r.gradePoint.toFixed(2)}</td>
                      <td className="py-2.5 px-3 font-black text-emerald-600 dark:text-emerald-400">{r.letterGrade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content 4: Exams */}
        {activeTab === 'exams' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="font-bold text-blue-700 dark:text-blue-300">Digital Admit Card: ACTIVE 🟢</div>
                <div className="text-slate-500">Carry your student card to Exam Hall. Entry permitted from 09:30 AM.</div>
              </div>
              <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs">
                Roll: {student.rollDisplay}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((ex) => (
                <div key={ex.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{ex.title}</div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>📅 {ex.startDate}</span>
                    <span>⏰ {ex.time}</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{ex.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 5: Fees */}
        {activeTab === 'fees' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Fee Invoices &amp; Online Payment Gateway
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm">Fall Term Tuition Fee 2026</div>
                  <div className="text-xs text-slate-500">Paid on 15 Oct 2026 via bKash Online</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">৳ 15,000</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                    PAID
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm">Midterm Lab &amp; Exam Fee</div>
                  <div className="text-xs text-slate-500">Due date: 25 Nov 2026</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-rose-500">৳ 4,500</span>
                  {feePaid ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      PAID
                    </span>
                  ) : (
                    <button
                      onClick={() => setFeePaid(true)}
                      className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Pay via bKash
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 dark:text-slate-300">
          CampusOS Multi-Institution Unified Platform • Student Academic Portal
        </div>
        <div>
          All Rights Reserved to Antar Dasgupta © {new Date().getFullYear()} Antar Dasgupta. System Creator &amp; Chief Architect.
        </div>
      </footer>
    </div>
  );
}
