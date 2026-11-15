'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LogIn,
  GraduationCap,
  Sun,
  Moon,
  Menu,
  X,
  MapPin,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('mic_theme');
      if (savedTheme === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      } else {
        setIsDark(true);
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = (dark: boolean) => {
    setIsDark(dark);
    try {
      if (dark) {
        localStorage.setItem('mic_theme', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        localStorage.setItem('mic_theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b transition-colors duration-200 border-slate-200 bg-white/95 text-slate-800 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100 dark:supports-[backdrop-filter]:bg-slate-950/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-11 w-32 rounded-lg p-1 transition-all">
              <Image
                src="/logo.png"
                alt="MIC Smart Campus"
                fill
                priority
                className="object-contain dark:brightness-110"
              />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Link href="/#features" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
              {lang === 'bn' ? 'ফিচারসমূহ' : 'Features'}
            </Link>
            <Link href="/#institutions" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
              {lang === 'bn' ? 'প্রতিষ্ঠানসমূহ' : 'Institutions'}
            </Link>
            <Link href="/about" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
              {lang === 'bn' ? 'প্ল্যাটফর্ম পরিচিতি' : 'About Platform'}
            </Link>
            <Link href="/contact" className="transition hover:text-emerald-700 dark:hover:text-emerald-400">
              {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme switcher */}
            <div role="group" aria-label="Theme Switcher" className="flex items-center rounded-xl border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => toggleTheme(false)}
                title="লাইট (ডে) মোড"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  !isDark ? 'bg-white text-emerald-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">ডে</span>
              </button>
              <button
                type="button"
                onClick={() => toggleTheme(true)}
                title="ডার্ক মোড"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  isDark ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Moon className="h-3.5 w-3.5 text-emerald-400" />
                <span className="hidden sm:inline">ডার্ক</span>
              </button>
            </div>

            {/* Language switcher */}
            <div role="group" aria-label="Language Switcher" className="flex items-center rounded-xl border border-slate-300 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setLang('bn')}
                title="বাংলা ভাষা"
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  lang === 'bn' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                title="English Language"
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  lang === 'en' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Portal Login */}
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 shadow-sm transition hover:bg-slate-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
            >
              <LogIn className="h-3.5 w-3.5" />
              {lang === 'bn' ? 'পোর্টাল লগইন' : 'Portal Login'}
            </Link>

            {/* Admission / Registration */}
            <Link
              href="/register"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow transition hover:bg-emerald-800 hover:scale-[1.02] dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              <GraduationCap className="h-3.5 w-3.5 text-amber-300" />
              {lang === 'bn' ? 'ভর্তি / নিবন্ধন' : 'Admission / Apply'}
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex lg:hidden items-center justify-center rounded-xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 space-y-3">
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {lang === 'bn' ? 'ফিচারসমূহ' : 'Features'}
            </Link>
            <Link
              href="/#institutions"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {lang === 'bn' ? 'প্রতিষ্ঠানসমূহ' : 'Institutions'}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {lang === 'bn' ? 'প্ল্যাটফর্ম পরিচিতি' : 'About'}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
            </Link>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-2 text-xs font-bold dark:border-slate-700"
              >
                <LogIn className="h-4 w-4" />
                পোর্টাল লগইন
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2 text-xs font-bold text-white dark:bg-emerald-600"
              >
                <GraduationCap className="h-4 w-4 text-amber-300" />
                ভর্তি / নিবন্ধন
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 transition-colors duration-200 dark:border-slate-800 dark:bg-black dark:text-slate-400">
        <div className="container mx-auto px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="relative h-12 w-36 brightness-0 invert opacity-95">
                <Image
                  src="/logo.png"
                  alt="MIC Smart Campus"
                  fill
                  className="object-contain"
                />
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                বাংলাদেশের স্কুল, কলেজ ও বিশ্ববিদ্যালয়সমূহের প্রাতিষ্ঠানিক ব্যবস্থাপনার জন্য সর্বাধুনিক ক্লাউড প্ল্যাটফর্ম।
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <span>শিখুন</span> • <span>যুক্ত হোন</span> • <span>এগিয়ে যান</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">প্ল্যাটফর্ম মডিউল</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li><Link className="hover:text-emerald-400" href="/#features">ক্লাস রুটিন ও শিডিউল</Link></li>
                <li><Link className="hover:text-emerald-400" href="/#features">সার্ভার-ড্রিভেন ফ্লাটার অ্যাপ</Link></li>
                <li><Link className="hover:text-emerald-400" href="/#features">পরীক্ষা ও স্বয়ংক্রিয় GPA</Link></li>
                <li><Link className="hover:text-emerald-400" href="/#features">ফি ম্যানেজমেন্ট ও ইনভয়েস</Link></li>
                <li><Link className="hover:text-emerald-400" href="/#features">কঠোর মাল্টি-টেন্যান্ট আইসোলেশন</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">প্রাতিষ্ঠানিক পোর্টাল</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li><Link className="hover:text-emerald-400" href="/login?role=super_admin">সুপার অ্যাডমিন</Link></li>
                <li><Link className="hover:text-emerald-400" href="/login?role=institution_admin">প্রতিষ্ঠান অ্যাডমিন</Link></li>
                <li><Link className="hover:text-emerald-400" href="/login?role=teacher">শিক্ষক / অনুষদ</Link></li>
                <li><Link className="hover:text-emerald-400" href="/login?role=student">শিক্ষার্থী</Link></li>
                <li><Link className="hover:text-emerald-400" href="/login?role=parent">অভিভাবক</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">যোগাযোগ ও নিরাপত্তা</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>ঢাকা, বাংলাদেশ</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>+880 1700-000000</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>support@mic-campus.edu.bd</span>
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>Row Level Security (RLS) সক্রিয়</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} এমআইসি স্মার্ট ক্যাম্পাস. সর্বস্বত্ব সংরক্ষিত।</p>
            <div className="flex gap-6 mt-4 sm:mt-0">
              <Link className="hover:text-slate-300" href="/privacy">গোপনীয়তা নীতি</Link>
              <Link className="hover:text-slate-300" href="/terms">ব্যবহারের শর্তাবলী</Link>
              <Link className="hover:text-slate-300" href="/#features">সিকিউরিটি আর্কিটেকচার</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
