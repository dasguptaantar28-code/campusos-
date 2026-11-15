import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Building2,
  SlidersVertical,
  ChevronRight,
  Layers,
  Smartphone,
  Calendar,
  Award,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Users,
  GraduationCap,
  School,
  BookOpen,
} from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { CampusLogo } from '@/components/brand/campusos-logo';

export default function HomePage() {
  return (
    <MarketingShell>
      <div className="flex flex-col min-h-screen transition-colors duration-200">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32 transition-colors duration-300 bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_55%)]" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                  এন্টারপ্রাইজ মাল্টি-টেন্যান্ট স্মার্ট ক্যাম্পাস অপারেটিং সিস্টেম
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight transition text-white">
                  শিখুন <span className="text-emerald-500">•</span> যুক্ত হোন <span className="text-emerald-500">•</span>{' '}
                  <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                    এগিয়ে যান
                  </span>
                </h1>

                <p className="text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed transition text-slate-300">
                  আপনার স্কুল, কলেজ বা বিশ্ববিদ্যালয়কে পরিচালনা করুন <strong className="text-white">CampusOS</strong> দিয়ে — সেন্ট্রালাইজড ক্লাউড ভিত্তিক একাডেমিক ম্যানেজমেন্ট, লাইভ উপস্থিতি, স্বয়ংক্রিয় জিপিএ ফলাফল, ফি কালেকশন এবং সরাসরি সিঙ্কড অ্যান্ড্রয়েড মোবাইল APK ও ওয়েব পোর্টাল।
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 hover:scale-[1.02]"
                  >
                    ক্যাম্পাস পোর্টালে প্রবেশ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition hover:scale-[1.02] border border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                  >
                    <Building2 className="h-4 w-4 text-emerald-400" />
                    নতুন ভর্তি / প্রতিষ্ঠান যুক্ত করুন
                  </Link>
                </div>

                <div className="pt-6 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0 border-t border-slate-800/80">
                  <div>
                    <div className="text-2xl font-bold text-white">১,২৮০</div>
                    <div className="text-xs text-slate-400">প্ল্যাটফর্ম শিক্ষার্থী (৩ প্রতিষ্ঠান)</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">APK + Web</div>
                    <div className="text-xs text-slate-400">১০০% রিয়েলটাইম সিঙ্ক</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-400">RLS সিকিউরড</div>
                    <div className="text-xs text-slate-400">রো-লেভেল নিরাপত্তা</div>
                  </div>
                </div>
              </div>

              {/* Right Mockup Glass Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl backdrop-blur-xl border transition border-slate-800 bg-gradient-to-b from-slate-900/95 to-slate-950/98 text-white">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <CampusLogo darkSurface size="sm" subtitle="Active Engine" />
                    <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      APK + Web লাইভ
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl p-4 border flex items-center justify-between bg-slate-950/80 border-slate-800">
                      <div>
                        <div className="text-[11px] font-medium text-slate-400">সক্রিয় প্রাথমিক ক্যাম্পাস</div>
                        <div className="text-sm font-bold text-white">Green Valley Smart Model School</div>
                        <div className="text-[10px] text-emerald-400">Class 1-10 • 4 Sections • 800 Students</div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-emerald-950/80 text-emerald-300 border-emerald-800">
                        School OS
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border p-3.5 bg-emerald-950/40 border-emerald-900/50 text-white">
                        <div className="text-xs text-emerald-400 font-bold">আজকের উপস্থিতি</div>
                        <div className="text-xl font-extrabold mt-1">৯৬.২%</div>
                        <div className="text-[10px] text-emerald-300">বায়োমেট্রিক ও মোবাইল সিঙ্ক</div>
                      </div>
                      <div className="rounded-2xl border p-3.5 bg-amber-950/30 border-amber-900/40 text-white">
                        <div className="text-xs text-amber-400 font-bold">মোট শিক্ষার্থী</div>
                        <div className="text-xl font-extrabold mt-1">১,২৮০ জন</div>
                        <div className="text-[10px] text-amber-300">৩টি প্রতিষ্ঠান সমন্বিত</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4 space-y-2 bg-slate-950/70 border-slate-800/80">
                      <div className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-slate-400">
                        <span>সিস্টেম স্রষ্টা ও আর্কিটেক্ট</span>
                        <SlidersVertical className="h-3.5 w-3.5 text-emerald-400" />
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        <strong className="text-white">Antar Dasgupta</strong> দ্বারা নির্মিত CampusOS প্ল্যাটফর্ম। রোল-ভিত্তিক এক্সেস (Super Admin, Admin, Teacher, Student, Parent) এবং অ্যান্ড্রয়েড APK সম্পূর্ণ ইন্টারকানেক্টেড।
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dedicated Portals Section */}
        <section className="py-20 transition-colors duration-200 bg-slate-900 text-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                প্রতিটি অ্যাকাডেমিক ভূমিকার জন্য ৫টি ডেডিকেটেড পোর্টাল
              </h2>
              <p className="text-slate-400">
                রোল-বেসড এক্সেস কন্ট্রোল (RBAC) নিশ্চিত করে যে প্রতিটি ব্যবহারকারী কেবল তার অনুমোদিত তথ্যই দেখতে পাবেন, সম্পূর্ণ ডাটা প্রাইভেসিসহ।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Super Admin */}
              <div className="flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] border-purple-900/60 bg-purple-950/20 text-purple-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-purple-900/60 text-purple-300">
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-bold">সুপার অ্যাডমিন</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    ৩টি ক্যাম্পাস প্রভিশনিং, সকল শিক্ষার্থী ও শিক্ষক পরিচালনা, অডিট লগ এবং সিস্টেম কনফিগারেশন।
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link
                    href="/login?role=super_admin"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold shadow-sm transition bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    পোর্টালে প্রবেশ করুন
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Institution Admin */}
              <div className="flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] border-emerald-900/60 bg-emerald-950/20 text-emerald-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-900/60 text-emerald-300">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-bold">প্রতিষ্ঠান অ্যাডমিন</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    একাডেমিক সেশন, সেকশন ও রুটিন ব্যবস্থাপনা, পরীক্ষার ফলাফল অনুমোদন এবং ফি ইনভয়েস ম্যানেজমেন্ট।
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link
                    href="/login?role=institution_admin"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold shadow-sm transition bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    পোর্টালে প্রবেশ করুন
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Teacher */}
              <div className="flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] border-blue-900/60 bg-blue-950/20 text-blue-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-900/60 text-blue-300">
                      <BookOpen className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-bold">শিক্ষক / অনুষদ</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    শ্রেণিকক্ষ উপস্থিতি গ্রহণ, বিষয়ভিত্তিক পরীক্ষার নম্বর এন্ট্রি ও লেকচার নোটস শেয়ারিং।
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link
                    href="/login?role=teacher"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold shadow-sm transition bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    পোর্টালে প্রবেশ করুন
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Student */}
              <div className="flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] border-amber-900/60 bg-amber-950/20 text-amber-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-900/60 text-amber-300">
                      <GraduationCap className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-bold">শিক্ষার্থী</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    ক্লাস ও সেকশন রুটিন, উপস্থিতি শতকরা হার %, পরীক্ষার গ্রেড ও মার্কস এবং পরীক্ষার সময়সূচী।
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link
                    href="/login?role=student"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold shadow-sm transition bg-amber-700 hover:bg-amber-800 text-white"
                  >
                    পোর্টালে প্রবেশ করুন
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Parent */}
              <div className="flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] border-rose-900/60 bg-rose-950/20 text-rose-200">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-rose-900/60 text-rose-300">
                      <Users className="h-5 w-5" />
                    </span>
                    <h3 className="text-lg font-bold">অভিভাবক</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-300">
                    শুধুমাত্র নিজের সন্তানের ফলাফল ও উপস্থিতি পর্যবেক্ষণ, অন্য কোনো শিক্ষার্থীর ডাটা দেখার সুযোগ নেই।
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <Link
                    href="/login?role=parent"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold shadow-sm transition bg-rose-700 hover:bg-rose-800 text-white"
                  >
                    পোর্টালে প্রবেশ করুন
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Institutions Section (Matching APK Exactly: 3 Campuses, 1,280 Students) */}
        <section id="institutions" className="py-20 border-t transition-colors duration-200 bg-slate-950 border-slate-800 text-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                ৩টি সমন্বিত ক্যাম্পাস • সর্বমোট ১,২৮০ শিক্ষার্থী
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                CampusOS সমন্বিত প্রতিষ্ঠানসমূহ (APK ও ওয়েব সিঙ্কড)
              </h2>
              <p className="text-slate-400">
                স্কুল, কলেজ ও বিশ্ববিদ্যালয়ের জন্য সুনির্দিষ্ট শিক্ষাক্রম কাঠামো যা অ্যান্ড্রয়েড অ্যাপ এবং ওয়েব পোর্টালে ১০০% একই ডাটাবেজে সংযুক্ত।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Institution 1: School */}
              <div className="rounded-3xl border p-6 shadow-sm transition hover:shadow-xl hover:border-emerald-500/50 border-slate-800 bg-slate-900/90 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg bg-emerald-950 text-emerald-300 border border-emerald-700">
                      <School className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Green Valley Smart Model School</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
                        স্কুল (শ্রেণি ১ - ১০)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mb-3 text-slate-300">
                    প্রতি শ্রেণিতে ৪টি সেকশন (Section A, B, C, D) এবং প্রতিটি সেকশনে ২০ জন করে মোট <strong className="text-emerald-400">৮০০ জন শিক্ষার্থী</strong> ও অভিভাবকের বিস্তারিত তথ্য।
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>ক্যাম্পাস কোড:</span>
                      <span className="font-mono font-bold text-white">GVS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>শ্রেণি বিস্তার:</span>
                      <span className="text-white">Class 1 to Class 10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>শিক্ষার্থী সংখ্যা:</span>
                      <span className="font-bold text-emerald-400">৮০০ জন</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-t pt-4 mt-4 border-slate-800 text-slate-400">
                  <span className="text-slate-400">আইডি: <strong>inst-school</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> সক্রিয় ক্যাম্পাস 🟢
                  </span>
                </div>
              </div>

              {/* Institution 2: College */}
              <div className="rounded-3xl border p-6 shadow-sm transition hover:shadow-xl hover:border-emerald-500/50 border-slate-800 bg-slate-900/90 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg bg-teal-950 text-teal-300 border border-teal-700">
                      <GraduationCap className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Crescent Model Higher Secondary College</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-teal-900/60 text-teal-300 border border-teal-700/60">
                        কলেজ (HSC ১১ ও ১২)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mb-3 text-slate-300">
                    একাদশ ও দ্বাদশ শ্রেণি • বিজ্ঞান, ব্যবসায় শিক্ষা, মানবিক ও ভোকেশনাল আইসিটি • মোট <strong className="text-teal-400">১৬০ জন শিক্ষার্থী</strong> ও অভিভাবকের তথ্য।
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>ক্যাম্পাস কোড:</span>
                      <span className="font-mono font-bold text-white">CMC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>বিভাগসমূহ:</span>
                      <span className="text-white">Science, Business, Arts, Voc</span>
                    </div>
                    <div className="flex justify-between">
                      <span>শিক্ষার্থী সংখ্যা:</span>
                      <span className="font-bold text-teal-400">১৬০ জন</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-t pt-4 mt-4 border-slate-800 text-slate-400">
                  <span className="text-slate-400">আইডি: <strong>inst-college</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> সক্রিয় ক্যাম্পাস 🟢
                  </span>
                </div>
              </div>

              {/* Institution 3: University */}
              <div className="rounded-3xl border p-6 shadow-sm transition hover:shadow-xl hover:border-emerald-500/50 border-slate-800 bg-slate-900/90 text-white flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg bg-blue-950 text-blue-300 border border-blue-700">
                      <Building2 className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Metropolitan University of Technology & Science</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-900/60 text-blue-300 border border-blue-700/60">
                        বিশ্ববিদ্যালয় (৪টি অনুষদ)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mb-3 text-slate-300">
                    সিএসই, ইইই, বিবিএ ও ইংলিশ বিভাগ • ৪টি সেমিস্টার ব্যাচে প্রতিটি সেকশনে ২০ জন করে মোট <strong className="text-blue-400">৩২০ জন শিক্ষার্থী</strong>।
                  </p>
                  <div className="space-y-1.5 text-xs text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between">
                      <span>ক্যাম্পাস কোড:</span>
                      <span className="font-mono font-bold text-white">MUTS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>বিভাগসমূহ:</span>
                      <span className="text-white">CSE, EEE, BBA, ENG</span>
                    </div>
                    <div className="flex justify-between">
                      <span>শিক্ষার্থী সংখ্যা:</span>
                      <span className="font-bold text-blue-400">৩২০ জন</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs border-t pt-4 mt-4 border-slate-800 text-slate-400">
                  <span className="text-slate-400">আইডি: <strong>inst-university</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> সক্রিয় ক্যাম্পাস 🟢
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 transition-colors duration-200 bg-slate-900/60 border-t border-slate-800 text-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                প্ল্যাটফর্মের সক্ষমতা
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                সম্পূর্ণ প্রাতিষ্ঠানিক সুশাসনের জন্য নির্মিত
              </h2>
              <p className="text-slate-400">
                অগোছালো স্প্রেডশিট ও পুরনো সফটওয়্যার বাদ দিয়ে CampusOS দিয়ে আপনার ক্যাম্পাসকে আধুনিক ক্লাউড ও মোবাইল ব্যবস্থায় রূপান্তর করুন।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="rounded-3xl border p-8 shadow-sm transition hover:shadow-md border-slate-800/80 bg-slate-900/80 text-white hover:border-emerald-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">কঠোর মাল্টি-টেন্যান্ট আইসোলেশন</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  প্রতিটি ডাটাবেজ কুয়েরি সরাসরি PostgreSQL Row Level Security (RLS) দিয়ে সুরক্ষিত। প্রতিটি প্রতিষ্ঠানের ডাটা স্বয়ংক্রিয়ভাবে আলাদা থাকে।
                </p>
              </div>

              <div className="rounded-3xl border p-8 shadow-sm transition hover:shadow-md border-slate-800/80 bg-slate-900/80 text-white hover:border-emerald-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Smartphone className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">সরাসরি সিঙ্কড অ্যান্ড্রয়েড APK</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  অ্যান্ড্রয়েড অ্যাপ ও ওয়েব প্ল্যাটফর্ম একই সুপাবেস ডাটাবেজের সাথে সংযুক্ত। মোবাইল অ্যাপে লগইন বা উপস্থিতি সাথে সাথে ওয়েবসাইটে দৃশ্যমান।
                </p>
              </div>

              <div className="rounded-3xl border p-8 shadow-sm transition hover:shadow-md border-slate-800/80 bg-slate-900/80 text-white hover:border-emerald-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">ক্লাস রুটিন ও শিডিউল</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  শিক্ষক, কক্ষ ও সেকশনের মধ্যে সময় সংঘাত (Clash Detection) মুক্ত আধুনিক ভিজ্যুয়াল রুটিন ও পরীক্ষার সূচি।
                </p>
              </div>

              <div className="rounded-3xl border p-8 shadow-sm transition hover:shadow-md border-slate-800/80 bg-slate-900/80 text-white hover:border-emerald-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">পরীক্ষা ও স্বয়ংক্রিয় GPA</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  বাংলাদেশের জাতীয় গ্রেডিং পদ্ধতি (A+, A, B, C, D, F) অনুযায়ী স্বয়ংক্রিয় জিপিএ এবং ডিজিটাল রিপোর্ট কার্ড তৈরি।
                </p>
              </div>

              <div className="rounded-3xl border p-8 shadow-sm transition hover:shadow-md border-slate-800/80 bg-slate-900/80 text-white hover:border-emerald-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <CreditCard className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">ফি ম্যানেজমেন্ট ও ইনভয়েস</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  টিউশন ফি, ভর্তি, পরীক্ষা ও পরিবহনের স্বয়ংক্রিয় চালান তৈরি এবং বিকাশ ও নগদ মোবাইল ব্যাংকিং ট্র্যাকিং।
                </p>
              </div>

              <div className="rounded-3xl border p-8 shadow-sm transition hover:shadow-md border-slate-800/80 bg-slate-900/80 text-white hover:border-emerald-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">নিরাপদ ডিজিটাল অডিট লগ</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  শিক্ষার্থীর তথ্য, পরীক্ষার নম্বর এবং আর্থিক লেনদেনের প্রতিটি পরিবর্তনের বিপরীতে তৈরি হয় অপরিবর্তনযোগ্য অডিট লগ।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-white transition-colors duration-200 bg-gradient-to-b from-emerald-950 to-slate-950 border-t border-emerald-900/60">
          <div className="container mx-auto px-4 sm:px-6 text-center space-y-6 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              আপনার ক্যাম্পাসের পরিচালন ব্যবস্থা আধুনিক করতে প্রস্তুত?
            </h2>
            <p className="text-emerald-100 text-base sm:text-lg">
              আজই CampusOS ব্যবহার শুরু করুন সম্পূর্ণ রেডি ক্লাউড ডাটাবেজ এবং অ্যান্ড্রয়েড APK সহ।
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-emerald-950 shadow-lg hover:bg-slate-100 transition hover:scale-[1.02]"
              >
                অ্যাকাউন্টে সাইন ইন করুন
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-emerald-600 bg-emerald-900/90 px-8 py-3.5 text-base font-semibold text-white hover:bg-emerald-800 transition hover:scale-[1.02]"
              >
                নতুন প্রতিষ্ঠান বা ভর্তি আবেদন
              </Link>
            </div>
            <div className="pt-8 border-t border-emerald-900/40 text-xs text-slate-400">
              <p>Platform Architect &amp; System Creator: <span className="text-white font-bold">Antar Dasgupta</span></p>
              <p className="mt-1 font-mono text-[11px] text-emerald-400/90">All Rights Reserved to Antar Dasgupta © 2026 Antar Dasgupta</p>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
