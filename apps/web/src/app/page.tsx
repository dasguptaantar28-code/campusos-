import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';

export default function HomePage() {
  return (
    <MarketingShell>
      <div className="flex flex-col min-h-screen transition-colors duration-200">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32 transition-colors duration-300 bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)]" />
          <div className="container mx-auto px-4 sm:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  এন্টারপ্রাইজ মাল্টি-টেন্যান্ট স্মার্ট ক্যাম্পাস প্ল্যাটফর্ম
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight transition text-white">
                  শিখুন <span className="text-emerald-500">•</span> যুক্ত হোন <span className="text-emerald-500">•</span>{' '}
                  <span className="bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 bg-clip-text text-transparent">
                    এগিয়ে যান
                  </span>
                </h1>

                <p className="text-lg sm:text-xl max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed transition text-slate-300">
                  আপনার স্কুল, কলেজ বা বিশ্ববিদ্যালয়কে পরিচালনা করুন MIC Smart Campus দিয়ে — সেন্ট্রালাইজড ক্লাউড ভিত্তিক একাডেমিক ম্যানেজমেন্ট, লাইভ বায়োমেট্রিক ও ওয়েব উপস্থিতি, স্বয়ংক্রিয় জিপিএ ফলাফল, ফি কালেকশন এবং সার্ভার-ড্রিভেন অ্যান্ড্রয়েড মোবাইল অ্যাপ।
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-600 hover:scale-[1.02] dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    ক্যাম্পাস পোর্টালে প্রবেশ
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold transition hover:scale-[1.02] border border-slate-700 bg-slate-900/80 text-slate-200 hover:bg-slate-800 hover:text-white"
                  >
                    <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    আপনার প্রতিষ্ঠান যুক্ত করুন
                  </Link>
                </div>

                <div className="pt-6 grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0 border-t border-slate-800/80">
                  <div>
                    <div className="text-2xl font-bold text-white">১০০%</div>
                    <div className="text-xs text-slate-400">পোস্টগ্রেস RLS সুরক্ষিত</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">রিয়েলটাইম</div>
                    <div className="text-xs text-slate-400">সার্ভার-ড্রিভেন UI</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">টাকা (৳) / ঢাকা</div>
                    <div className="text-xs text-slate-400">লোকালাইজড সিস্টেম</div>
                  </div>
                </div>
              </div>

              {/* Right Mockup Glass Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl backdrop-blur-xl border transition border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/95 text-white">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="relative h-12 w-32">
                      <Image
                        src="/logo.png"
                        alt="MIC Smart Campus"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      লাইভ সিস্টেম
                    </span>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl p-4 border flex items-center justify-between bg-slate-950/80 border-slate-800">
                      <div>
                        <div className="text-xs font-medium text-slate-400">সক্রিয় প্রতিষ্ঠান</div>
                        <div className="text-sm font-bold text-white">এমআইসি স্মার্ট ইউনিভার্সিটি</div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-emerald-950/80 text-emerald-300 border-emerald-800">
                        এন্টারপ্রাইজ টিয়ার
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border p-3.5 bg-emerald-950/40 border-emerald-900/50 text-white">
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">আজকের উপস্থিতি</div>
                        <div className="text-xl font-extrabold mt-1">৯৪.৮%</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-300">বায়োমেট্রিক ও ওয়েব সিঙ্ক</div>
                      </div>
                      <div className="rounded-2xl border p-3.5 bg-amber-950/30 border-amber-900/40 text-white">
                        <div className="text-xs text-amber-700 dark:text-amber-400 font-bold">বকেয়া ইনভয়েস</div>
                        <div className="text-xl font-extrabold mt-1">৳ ১২,৪৫০</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-300">বিকাশ ও ব্যাংক ভেরিফাইড</div>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4 space-y-2 bg-slate-950/70 border-slate-800/80">
                      <div className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between text-slate-400">
                        <span>সার্ভার-ড্রিভেন UI রিমোট সিঙ্ক</span>
                        <SlidersVertical className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      <p className="text-xs leading-relaxed text-slate-300">
                        সুপার অ্যাডমিন রিমোটলি মোবাইল অ্যাপের ড্যাশবোর্ড, ফিচার ব্লক ও ব্যানার থিম পরিবর্তন করতে পারেন—নতুন APK রি-বিল্ড ছাড়াই।
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
                প্রতিটি অ্যাকাডেমিক ভূমিকার জন্য ডেডিকেটেড পোর্টাল
              </h2>
              <p className="text-slate-400">
                রোল-বেসড এক্সেস কন্ট্রোল (RBAC) নিশ্চিত করে যে প্রতিটি স্টেকহোল্ডার কেবল তাদের প্রয়োজনীয় তথ্যই দেখতে পাবেন, শূন্য ডাটা লিক সহ।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Super Admin */}
              <div className="flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition hover:shadow-md hover:scale-[1.01] border-purple-900/60 bg-purple-950/20 text-purple-200">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold">সুপার অ্যাডমিন</h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    মাল্টি-টেন্যান্ট প্রভিশনিং, সাবস্ক্রিপশন প্ল্যান, অডিট লগ এবং গ্লোবাল SDUI কনফিগারেশন।
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
                  <h3 className="text-lg font-bold">প্রতিষ্ঠান অ্যাডমিন</h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    একাডেমিক সেশন, ক্লাস রুটিন, শিক্ষক বণ্টন, ফি ইনভয়েস এবং প্রতিষ্ঠান সেটিংস।
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
                  <h3 className="text-lg font-bold">শিক্ষক / অনুষদ</h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    নির্ধারিত ক্লাসরুম রোস্টার, লাইভ উপস্থিতি গ্রহণ এবং পরীক্ষার নম্বর ও গ্রেডিং এন্ট্রি।
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
                  <h3 className="text-lg font-bold">শিক্ষার্থী</h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    দৈনিক ক্লাস রুটিন, উপস্থিতি হার %, গ্রেড কার্ড ও ফলাফল এবং বকেয়া ফি পরিশোধ।
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
                  <h3 className="text-lg font-bold">অভিভাবক</h3>
                  <p className="text-xs leading-relaxed text-slate-300">
                    সন্তানের একাডেমিক অগ্রগতি পর্যবেক্ষণ, অনুপস্থিতির নোটিফিকেশন এবং অনলাইন ফি পেমেন্ট।
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

        {/* Features Section */}
        <section id="features" className="py-20 transition-colors duration-200 bg-slate-950 text-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                প্ল্যাটফর্মের সক্ষমতা
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                সম্পূর্ণ প্রাতিষ্ঠানিক সুশাসনের জন্য নির্মিত
              </h2>
              <p className="text-slate-400">
                অগোছালো স্প্রেডশিট ও পুরনো সফটওয়্যার বাদ দিয়ে একটি সর্বাধুনিক ও নিরাপদ ক্যাম্পাসে রূপান্তর করুন।
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
                <h3 className="text-xl font-bold mb-2 text-white">সার্ভার-ড্রিভেন ফ্লাটার অ্যাপ</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  ডায়নামিক অ্যান্ড্রয়েড ক্লায়েন্ট লাইভ সুপাবেস থেকে রিয়েলটাইমে উইজেট লেআউট, ব্র্যান্ডিং, থিম ও ব্যানার গ্রহণ করে।
                </p>
              </div>

              <div className="rounded-3xl border p-8 shadow-sm transition hover:shadow-md border-slate-800/80 bg-slate-900/80 text-white hover:border-emerald-500">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">ক্লাস রুটিন ও শিডিউল</h3>
                <p className="text-sm leading-relaxed text-slate-400">
                  শিক্ষক, কক্ষ ও সেকশনের মধ্যে সময় সংঘাত (Clash Detection) মুক্ত আধুনিক ভিজ্যুয়াল রুটিন জেনারেটর।
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
                  টিউশন ফি, ভর্তি, পরীক্ষা ও পরিবহনের স্বয়ংক্রিয় চালান তৈরি এবং ক্যাশ ও মোবাইল ব্যাংকিং ট্র্যাকিং।
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

        {/* Institutions Section */}
        <section id="institutions" className="py-20 border-t transition-colors duration-200 bg-slate-900/60 border-slate-800 text-white">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
                MIC Smart Campus দ্বারা পরিচালিত প্রতিষ্ঠানসমূহ
              </h2>
              <p className="text-slate-400">
                একই নির্ভরযোগ্য ক্লাউড অবকাঠামোর অধীনে বিশ্ববিদ্যালয়, কলেজ এবং হাই স্কুল পরিচালনা।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-3xl border p-6 shadow-sm transition hover:shadow-md border-slate-800 bg-slate-900 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                    M
                  </div>
                  <div>
                    <h3 className="font-bold text-white">MIC Smart University</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-400">
                      university
                    </span>
                  </div>
                </div>
                <p className="text-xs mb-4 text-slate-400">Campus 1, Academic Avenue, Dhaka-1205, Bangladesh</p>
                <div className="flex items-center justify-between text-xs border-t pt-3 border-slate-800 text-slate-400">
                  <span>মুদ্রা: <strong>BDT</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> সক্রিয় প্রতিষ্ঠান
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border p-6 shadow-sm transition hover:shadow-md border-slate-800 bg-slate-900 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                    M
                  </div>
                  <div>
                    <h3 className="font-bold text-white">MIC Model College</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-400">
                      college
                    </span>
                  </div>
                </div>
                <p className="text-xs mb-4 text-slate-400">Dhanmondi, Dhaka-1209, Bangladesh</p>
                <div className="flex items-center justify-between text-xs border-t pt-3 border-slate-800 text-slate-400">
                  <span>মুদ্রা: <strong>BDT</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> সক্রিয় প্রতিষ্ঠান
                  </span>
                </div>
              </div>

              <div className="rounded-3xl border p-6 shadow-sm transition hover:shadow-md border-slate-800 bg-slate-900 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-bold text-lg bg-emerald-950 text-emerald-300 border border-emerald-800">
                    M
                  </div>
                  <div>
                    <h3 className="font-bold text-white">MIC International School</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-slate-400">
                      school
                    </span>
                  </div>
                </div>
                <p className="text-xs mb-4 text-slate-400">Gulshan-2, Dhaka-1212, Bangladesh</p>
                <div className="flex items-center justify-between text-xs border-t pt-3 border-slate-800 text-slate-400">
                  <span>মুদ্রা: <strong>BDT</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> সক্রিয় প্রতিষ্ঠান
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-white transition-colors duration-200 bg-emerald-950 border-t border-emerald-900/60">
          <div className="container mx-auto px-4 sm:px-6 text-center space-y-6 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              আপনার ক্যাম্পাসের পরিচালন ব্যবস্থা আধুনিক করতে প্রস্তুত?
            </h2>
            <p className="text-emerald-100 text-base sm:text-lg">
              আজই MIC Smart Campus ব্যবহার শুরু করুন সম্পূর্ণ রেডি সুপাবেস ডাটাবেজ এবং অ্যান্ড্রয়েড APK সহ।
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link
                href="/login"
                className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-emerald-950 shadow-lg hover:bg-slate-100 transition"
              >
                অ্যাকাউন্টে সাইন ইন করুন
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-emerald-600 bg-emerald-900/90 px-8 py-3.5 text-base font-semibold text-white hover:bg-emerald-900 transition"
              >
                নতুন ক্যাম্পাস নিবন্ধন করুন
              </Link>
            </div>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
