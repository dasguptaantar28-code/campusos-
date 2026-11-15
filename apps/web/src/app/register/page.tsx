'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CampusLogo } from '@/components/brand/campusos-logo';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  Building2,
  User,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  Users,
  Lock,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'student' | 'institution'>('student');

  // Student Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('Green Valley Smart Model School');
  const [program, setProgram] = useState('Class 10 - Secondary (SSC)');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [previousResult, setPreviousResult] = useState('');
  const [password, setPassword] = useState('');

  // Institution Form State
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [instType, setInstType] = useState('university');
  const [instEmail, setInstEmail] = useState('');
  const [instPhone, setInstPhone] = useState('');
  const [instAddress, setInstAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    studentIdCode?: string;
    fullName: string;
    email: string;
    institution: string;
  } | null>(null);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      setError('Please fill in student name, email, contact phone, and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const notes = `Admission: ${program}, Guardian: ${guardianName || 'N/A'} (Phone: ${guardianPhone || 'N/A'}), DOB: ${dob || 'N/A'}, Gender: ${gender}, Previous: ${previousResult || 'N/A'}`;

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          institution_name: institution,
          role: 'student',
          source: 'web_portal',
          notes,
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to submit admission application.');
        setLoading(false);
        return;
      }

      setSuccessData({
        studentIdCode: data.registration?.student_id_code || 'COS-2026-1088',
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        institution,
      });
      setLoading(false);
    } catch {
      setError('Error submitting application. Please try again.');
      setLoading(false);
    }
  };

  const handleInstitutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instName.trim() || !instEmail.trim() || !instPhone.trim()) {
      setError('Please fill in institution name, email, and contact phone.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const notes = `Institution Onboarding: Type: ${instType}, Code: ${instCode}, Address: ${instAddress}`;

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: instName.trim(),
          email: instEmail.trim().toLowerCase(),
          phone: instPhone.trim(),
          institution_name: instName.trim(),
          role: 'teacher',
          source: 'web_portal',
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to register institution.');
        setLoading(false);
        return;
      }

      setSuccessData({
        studentIdCode: instCode || 'INST-NEW',
        fullName: instName.trim(),
        email: instEmail.trim(),
        institution: instName.trim(),
      });
      setLoading(false);
    } catch {
      setError('Error submitting onboarding. Please try again.');
      setLoading(false);
    }
  };

  const directSignIn = () => {
    if (successData) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('campusos_logged_in_email', successData.email);
        localStorage.setItem('campusos_logged_in_role', activeTab === 'student' ? 'student' : 'super_admin');
        localStorage.setItem('mic_logged_in_email', successData.email);
        localStorage.setItem('mic_logged_in_role', activeTab === 'student' ? 'student' : 'super_admin');
      }
      router.push(activeTab === 'student' ? '/student' : '/super-admin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/95 px-6 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between">
          <CampusLogo href="/" size="sm" />
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400 transition"
          >
            ← Return to Homepage
          </Link>
        </div>
      </header>

      {/* Main Registration Area */}
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <CampusLogo href="/" size="lg" subtitle="Admission Portal" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Student Admission & Registration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Apply for academic admission and register your student profile directly into the campus system
            </p>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError(null);
                setSuccessData(null);
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              Student Admission
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('institution');
                setError(null);
                setSuccessData(null);
              }}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'institution'
                  ? 'bg-emerald-800 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Building2 className="h-4 w-4" />
              Institution Onboarding
            </button>
          </div>

          {/* Success Dialog Modal / Banner */}
          {successData ? (
            <div className="rounded-3xl border border-emerald-300 bg-emerald-50/90 p-8 text-center space-y-4 dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-emerald-950 dark:text-emerald-200">
                  Admission Application Submitted!
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
                  Your admission request has been saved and queued for Super Admin review. You can now sign in with your credentials on Web and the Android APK!
                </p>
              </div>

              <div className="mx-auto max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 text-left shadow-sm dark:border-emerald-900 dark:bg-slate-900">
                <div className="text-xs text-slate-500">Official Student ID:</div>
                <div className="text-lg font-mono font-black text-emerald-800 dark:text-emerald-400">
                  {successData.studentIdCode}
                </div>
                <div className="mt-2 text-xs text-slate-500">Applicant:</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {successData.fullName}
                </div>
                <div className="text-xs text-slate-500 mt-1">Institution:</div>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {successData.institution}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={directSignIn}
                  className="rounded-xl bg-emerald-800 px-6 py-3 text-xs font-bold text-white shadow hover:bg-emerald-900 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  Enter Student Portal Directly
                  <ArrowRight className="h-4 w-4" />
                </button>
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
                >
                  Return to Portal Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Student Admission Form */}
              {activeTab === 'student' && (
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Full Name (Student)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tanvir Ahmed Chowdhury"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Student Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="tanvir.student@gmail.com"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Contact Phone (BD)
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+8801712345678"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Target Educational Institution
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                      >
                        <option value="Green Valley Smart Model School">Green Valley Smart Model School (Class 1-10 • School)</option>
                        <option value="Crescent Model Higher Secondary College">Crescent Model Higher Secondary College (HSC 11 & 12 • College)</option>
                        <option value="Metropolitan University of Technology & Science">Metropolitan University of Technology & Science (4 Depts • University)</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Academic Program / Class / Department
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                      >
                        <option value="B.Sc in Computer Science & Engineering (CSE)">B.Sc in Computer Science & Engineering (CSE)</option>
                        <option value="BBA - Bachelor of Business Administration">BBA - Bachelor of Business Administration</option>
                        <option value="B.Sc in Electrical & Electronic Engineering (EEE)">B.Sc in Electrical & Electronic Engineering (EEE)</option>
                        <option value="HSC Science (1st Year)">HSC Science (1st Year)</option>
                        <option value="HSC Business Studies">HSC Business Studies</option>
                        <option value="HSC Humanities">HSC Humanities</option>
                        <option value="Class 10 - Secondary (SSC)">Class 10 - Secondary (SSC)</option>
                        <option value="Class 9 - Secondary">Class 9 - Secondary</option>
                        <option value="A-Levels / Cambridge International">A-Levels / Cambridge International</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                      <select
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Guardian / Father Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Kabir Ahmed Chowdhury"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+8801812345678"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Previous Academic Result / GPA (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. HSC GPA 5.00, Board: Dhaka, Passing Year: 2026"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={previousResult}
                        onChange={(e) => setPreviousResult(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Lock className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                        Create Student Account Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter a secure password for portal sign-in"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-900 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <GraduationCap className="h-4 w-4 text-amber-400" />
                    {loading ? 'Submitting Application...' : 'Submit Student Admission Application'}
                  </button>
                </form>
              )}

              {/* Institution Onboarding Form */}
              {activeTab === 'institution' && (
                <form onSubmit={handleInstitutionSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Institution Official Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dhaka Premier International School & College"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={instName}
                        onChange={(e) => setInstName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Institution Short Code
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. dpisc"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={instCode}
                        onChange={(e) => setInstCode(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Institution Type
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={instType}
                        onChange={(e) => setInstType(e.target.value)}
                      >
                        <option value="university">University</option>
                        <option value="college">College / Higher Secondary</option>
                        <option value="school">High School (K-10)</option>
                        <option value="polytechnic">Polytechnic / Technical Institute</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Official Administration Email
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="admin@dpisc.edu.bd"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={instEmail}
                        onChange={(e) => setInstEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+8801700000000"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={instPhone}
                        onChange={(e) => setInstPhone(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Campus Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. House 14, Road 5, Dhanmondi, Dhaka-1205"
                        className="w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                        value={instAddress}
                        onChange={(e) => setInstAddress(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-4 rounded-xl bg-emerald-800 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-900 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Building2 className="h-4 w-4 text-emerald-300" />
                    {loading ? 'Submitting Institution...' : 'Submit Institution Onboarding Request'}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
            Already registered?{' '}
            <Link className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline" href="/login">
              Sign In to Academic Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-500 space-y-1">
        <div className="font-bold text-slate-700 dark:text-slate-300">Created by Antar Dasgupta • Chief Architect &amp; System Creator</div>
        <div>All Rights Reserved to Antar Dasgupta © {new Date().getFullYear()} Antar Dasgupta. CampusOS Unified Platform.</div>
      </div>
    </div>
  );
}
