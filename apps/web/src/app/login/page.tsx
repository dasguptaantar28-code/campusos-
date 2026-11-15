'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CampusLogo } from '@/components/brand/campusos-logo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRole === 'super_admin') {
      setEmail('antardasgupta@gmail.com');
      setPassword('password123');
    } else if (initialRole === 'student') {
      setEmail('student.demo@campusos.edu');
      setPassword('password123');
    } else if (initialRole === 'teacher') {
      setEmail('teacher@campusos.edu');
      setPassword('password123');
    } else if (initialRole === 'parent') {
      setEmail('parent@campusos.edu');
      setPassword('password123');
    }
  }, [initialRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('ইমেইল এবং পাসওয়ার্ড আবশ্যক');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password. Please verify your credentials.');
        setLoading(false);
        return;
      }

      // Store active session in localStorage
      if (typeof window !== 'undefined') {
        const cleanEmail = email.trim().toLowerCase();
        localStorage.setItem('campusos_logged_in_email', cleanEmail);
        localStorage.setItem('campusos_logged_in_role', data.role || 'student');
        localStorage.setItem('mic_logged_in_email', cleanEmail);
        localStorage.setItem('mic_logged_in_role', data.role || 'student');
      }

      // Redirect by role
      if (data.role === 'super_admin') {
        router.push('/super-admin');
      } else if (data.role === 'teacher') {
        router.push('/teacher');
      } else if (data.role === 'parent') {
        router.push('/parent');
      } else {
        router.push('/student');
      }
    } catch {
      setError('সার্ভারে যোগাযোগ করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-white">
      {/* Top Bar with brand */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <CampusLogo href="/" size="sm" />
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
          >
            ← মূল ওয়েবসাইটে ফিরে যান
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 p-8 rounded-3xl border shadow-2xl transition-colors duration-200 bg-slate-900 border-slate-800 text-white">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <CampusLogo href="/" size="lg" subtitle="Portal Gateway" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">পোর্টাল সাইন ইন</h2>
            <p className="text-xs text-slate-400">
              আপনার পোর্টালে প্রবেশ করতে নিবন্ধিত ইমেইল ও পাসওয়ার্ড দিয়ে সাইন ইন করুন
            </p>
          </div>

          {/* Quick 1-Click Demo Login Badges */}
          <div className="rounded-2xl border border-emerald-900/50 bg-emerald-950/30 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                ১-ক্লিক ডেমো লগইন:
              </span>
              <span className="text-[10px] text-slate-400">পাসওয়ার্ড: password123</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEmail('antardasgupta@gmail.com');
                  setPassword('password123');
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition bg-purple-950/80 text-purple-300 border border-purple-800 hover:bg-purple-900"
              >
                👑 সুপার অ্যাডমিন
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('student.demo@campusos.edu');
                  setPassword('password123');
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition bg-emerald-950/80 text-emerald-300 border border-emerald-800 hover:bg-emerald-900"
              >
                🏫 শিক্ষার্থী (স্কুল)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('tanvir.student@gmail.com');
                  setPassword('password123');
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition bg-blue-950/80 text-blue-300 border border-blue-800 hover:bg-blue-900"
              >
                🏛️ শিক্ষার্থী (ভার্সিটি)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('teacher@campusos.edu');
                  setPassword('password123');
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition bg-teal-950/80 text-teal-300 border border-teal-800 hover:bg-teal-900"
              >
                👨‍🏫 শিক্ষক
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('parent@campusos.edu');
                  setPassword('password123');
                }}
                className="cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900"
              >
                👨‍👧 অভিভাবক
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-3 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} autoComplete="off" className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">
                অফিসিয়াল ক্যাম্পাস অথবা নিবন্ধিত ইমেইল
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="আপনার ইমেইল অ্যাড্রেস লিখুন (যেমন: student.demo@campusos.edu)"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">অ্যাকাউন্ট পাসওয়ার্ড</label>
                <span className="text-xs text-slate-400">আবশ্যক</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full rounded-xl border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition border-slate-700 bg-slate-950 text-white placeholder-slate-500 focus:border-emerald-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-emerald-700 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-600 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'যাচাই করা হচ্ছে...' : 'ক্যাম্পাস পোর্টালে সাইন ইন করুন'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="pt-4 border-t flex items-center justify-between text-xs border-slate-800 text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>সুরক্ষিত ক্রেডেনশিয়াল আবশ্যক</span>
            </div>
            <Link className="font-semibold text-emerald-400 hover:underline" href="/register">
              আবেদন বা নিবন্ধন করুন →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-400 space-y-1">
        <div className="font-bold text-slate-300">Created by Antar Dasgupta • Chief Architect &amp; System Creator</div>
        <div>All Rights Reserved to Antar Dasgupta © {new Date().getFullYear()} Antar Dasgupta. CampusOS Unified Platform.</div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
