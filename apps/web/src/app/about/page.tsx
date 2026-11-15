import React from 'react';
import Link from 'next/link';
import { Shield, Layers, Smartphone, Globe, ArrowRight, UserCheck, School, GraduationCap, Building2 } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { CampusLogo } from '@/components/brand/campusos-logo';

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              প্ল্যাটফর্ম পরিচিতি • CampusOS
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              শিখুন • যুক্ত হোন • এগিয়ে যান
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">CampusOS</strong> হলো বাংলাদেশের বিশ্ববিদ্যালয়, কলেজ ও হাই স্কুলগুলোর প্রাতিষ্ঠানিক ব্যবস্থাপনার জন্য একটি সর্বাধুনিক মাল্টি-টেন্যান্ট ক্লাউড অপারেটিং সিস্টেম। এটি সম্পূর্ণ সেন্ট্রালাইজড Supabase PostgreSQL ডাটাবেজ দ্বারা চালিত এবং অ্যান্ড্রয়েড মোবাইল APK ও ওয়েব পোর্টালে রিয়েলটাইমে শতভাগ ইন্টারকানেক্টেড।
            </p>

            {/* Creator Badge */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
                  AD
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Antar Dasgupta</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">System Creator &amp; Chief Architect</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                &copy; 2026 Antar Dasgupta. All Rights Reserved to Antar Dasgupta. এই সিস্টেমের আর্কিটেকচার ও কপিরাইট সংরক্ষিত।
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Shield, title: 'Row Level Security', desc: 'পোস্টগ্রেস RLS দিয়ে ৩টি ক্যাম্পাসের ডাটা ১০০% সুরক্ষিত ও আলাদা থাকে।' },
                { icon: Layers, title: 'রিমোট ডাইনামিক আর্কিটেকচার', desc: 'নতুন APK রি-বিল্ড ছাড়াই ড্যাশবোর্ড ও কনফিগারেশন রিমোটলি পরিবর্তনযোগ্য।' },
                { icon: Smartphone, title: 'অ্যান্ড্রয়েড মোবাইল APK', desc: 'সকল ছাত্রছাত্রী, শিক্ষক ও অভিভাবকের তথ্য মোবাইলে লাইভ সিঙ্ক।' },
                { icon: Globe, title: 'সমন্বিত ৩টি ক্যাম্পাস', desc: 'স্কুল (৮০০), কলেজ (১৬০) ও বিশ্ববিদ্যালয় (৩২০) — মোট ১,২৮০ শিক্ষার্থী।' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
                  <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-600 transition"
              >
                ক্যাম্পাস পোর্টালে প্রবেশ করুন
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition"
              >
                নতুন প্রতিষ্ঠান বা ভর্তি আবেদন
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900 flex flex-col items-center justify-center space-y-6">
            <CampusLogo size="lg" subtitle="Enterprise Edition" />
            <div className="w-full space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <School className="h-5 w-5 text-emerald-500 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Green Valley Smart Model School</div>
                  <div className="text-slate-500 dark:text-slate-400">Class 1-10 • 4 Sections • 800 Students</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <GraduationCap className="h-5 w-5 text-teal-500 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Crescent Model Higher Secondary College</div>
                  <div className="text-slate-500 dark:text-slate-400">Class 11 &amp; 12 • 4 Streams • 160 Students</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <Building2 className="h-5 w-5 text-blue-500 shrink-0" />
                <div className="text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Metropolitan University of Technology &amp; Science</div>
                  <div className="text-slate-500 dark:text-slate-400">4 Depts (CSE, EEE, BBA, ENG) • 320 Students</div>
                </div>
              </div>
            </div>
            <div className="text-center text-xs text-slate-400 font-mono">
              Interconnected Mobile APK &amp; Web Platform
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
