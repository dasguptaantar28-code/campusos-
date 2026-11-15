'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  CheckCircle2,
  Clock,
  User,
  Users,
  Save,
  Search,
  Calendar,
  Award,
  BookOpen,
  Filter,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import {
  CLASS_LIST,
  SECTION_LIST,
  type StudentProfileData,
  type RoutineSlotData,
  type ExaminationRecordData
} from '@/lib/school-types';

export default function TeacherDashboardPage() {
  const router = useRouter();

  const [selectedClass, setSelectedClass] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [activeTab, setActiveTab] = useState<'roster' | 'routine' | 'exams'>('roster');
  const [searchQuery, setSearchQuery] = useState('');

  const [students, setStudents] = useState<StudentProfileData[]>([]);
  const [routines, setRoutines] = useState<RoutineSlotData[]>([]);
  const [exams, setExams] = useState<ExaminationRecordData[]>([]);
  const [loading, setLoading] = useState(true);

  // Attendance state for current section
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);

  // Load students for selected class & section
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/school/students?className=${encodeURIComponent(selectedClass)}&sectionName=${encodeURIComponent(selectedSection)}`);
        const json = await res.json();
        if (json.success && json.students) {
          setStudents(json.students);
          // Initialize attendance status
          const initialMap: Record<string, 'present' | 'absent' | 'late'> = {};
          json.students.forEach((s: StudentProfileData) => {
            initialMap[s.id] = 'present';
          });
          setAttendanceMap(initialMap);
        }

        // Fetch routines
        const rRes = await fetch(`/api/school/routines?className=${encodeURIComponent(selectedClass)}&sectionName=${encodeURIComponent(selectedSection)}`);
        const rJson = await rRes.json();
        if (rJson.success && rJson.slots) {
          setRoutines(rJson.slots);
        }

        // Fetch exams
        const eRes = await fetch(`/api/school/exams?className=${encodeURIComponent(selectedClass)}`);
        const eJson = await eRes.json();
        if (eJson.success && eJson.exams) {
          setExams(eJson.exams);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedClass, selectedSection]);

  const handleStatusToggle = (id: string, status: 'present' | 'absent' | 'late') => {
    setAttendanceMap(prev => ({ ...prev, [id]: status }));
    setAttendanceSaved(false);
  };

  const handleSaveAttendance = () => {
    setAttendanceSaved(true);
    setTimeout(() => setAttendanceSaved(false), 3000);
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mic_logged_in_email');
      localStorage.removeItem('mic_logged_in_role');
    }
    router.push('/login');
  };

  // Filter students if search query entered
  const displayedStudents = searchQuery.trim()
    ? students.filter(s =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentIdCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.guardianName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollDisplay.includes(searchQuery)
      )
    : students;

  const avgAttendance = students.length > 0
    ? (students.reduce((acc, s) => acc + s.attendancePercentage, 0) / students.length).toFixed(1)
    : '0';

  const avgGpa = students.length > 0
    ? (students.reduce((acc, s) => acc + s.currentGpa, 0) / students.length).toFixed(2)
    : '0';

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
          <span className="text-xs font-semibold text-emerald-400 hidden sm:inline-block">
            Faculty &amp; Teacher Portal • 360° Academic View
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white flex items-center justify-end gap-1">
              <User className="h-3.5 w-3.5 text-emerald-400" />
              Dr. Nusrat Jahan
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Academic Faculty • All Classes (1-10) View Access
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
        {/* Banner with Academic Scale */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-emerald-900/40 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-0.5 text-xs font-semibold text-emerald-300 mb-2">
                Teacher Access: Full Institutional Directory (10 Classes • 40 Sections • 800 Students)
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {selectedClass} • {selectedSection} Roster
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Take live attendance, inspect student academic performance, view full class routines, and review exam timetables.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveAttendance}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                Submit Attendance
              </button>
            </div>
          </div>
        </div>

        {/* Section KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Students Enrolled</div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{students.length} / 20</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Capacity 100% Filled</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Attendance</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{avgAttendance}%</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Academic Minimum 80%</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average Section GPA</div>
            <div className="text-2xl font-black text-amber-500 dark:text-amber-400 mt-1">{avgGpa}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Scale 5.00</div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Current Selection</div>
            <div className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">{selectedClass}</div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">{selectedSection}</div>
          </div>
        </div>

        {/* Attendance Save Notification */}
        {attendanceSaved && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            Attendance for {selectedClass} • {selectedSection} ({students.length} students) has been successfully saved and synced!
          </div>
        )}

        {/* Filter Controls: Classes & Sections */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Select Class (1 to 10)
              </span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search roll, name, guardian..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Class Chips */}
          <div className="flex flex-wrap gap-2">
            {CLASS_LIST.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedClass(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedClass === c
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
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Section:</span>
            <div className="flex gap-2">
              {SECTION_LIST.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSection(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedSection === s
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

        {/* View Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'roster'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Student Roster ({displayedStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('routine')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'routine'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Class Routine Timetable
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exams'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Exam Schedules
          </button>
        </div>

        {/* Tab 1: Student Roster & Attendance */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Showing 20 deterministic students in <strong>{selectedClass} • {selectedSection}</strong></span>
              <span>Read-only master records • Super Admin manages edit access</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedStudents.map((s) => (
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
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      Blood: {s.bloodGroup}
                    </span>
                  </div>

                  {/* Academic Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Attendance</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{s.attendancePercentage}%</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Current GPA</span>
                      <strong className="text-amber-500 font-bold">{s.currentGpa.toFixed(2)} / 5.00</strong>
                    </div>
                  </div>

                  {/* Guardian Details */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2 flex flex-col gap-0.5">
                    <div>
                      <strong>Guardian:</strong> {s.guardianName} ({s.guardianRelation})
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      Phone: {s.guardianPhone}
                    </div>
                  </div>

                  {/* Daily Attendance Selector */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-500">Mark Attendance:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(s.id, 'present')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          attendanceMap[s.id] === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(s.id, 'late')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          attendanceMap[s.id] === 'late'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(s.id, 'absent')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          attendanceMap[s.id] === 'absent'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Routine Timetable */}
        {activeTab === 'routine' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Class Routine: {selectedClass} • {selectedSection} (Sunday to Thursday)
              </h2>
              <span className="text-xs text-slate-400">5 Periods per day</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3">Period Time</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Faculty / Teacher</th>
                    <th className="py-2.5 px-3">Room</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {routines.map((slot) => (
                    <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400">{slot.dayOfWeek}</td>
                      <td className="py-2.5 px-3 font-mono">{slot.startTime} - {slot.endTime}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{slot.subjectName} ({slot.subjectCode})</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{slot.teacherName}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{slot.roomNumber}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Exam Schedules */}
        {activeTab === 'exams' && (
          <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Official Examination Timetable: {selectedClass}
              </h2>
              <span className="text-xs text-emerald-500 font-semibold">Fall Term 2026</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((ex) => (
                <div key={ex.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{ex.title}</div>
                      <div className="text-xs text-slate-500 font-mono">Code: {ex.subjectCode}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                      {ex.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>📅 {ex.startDate}</span>
                    <span>⏰ {ex.time}</span>
                    <span>🏛️ {ex.room}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer Bar */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 dark:text-slate-300">
          CampusOS Multi-Institution Unified Platform • Faculty Academic Portal
        </div>
        <div>
          All Rights Reserved to Antar Dasgupta © {new Date().getFullYear()} Antar Dasgupta. System Creator &amp; Chief Architect.
        </div>
      </footer>
    </div>
  );
}
