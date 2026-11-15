import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Layers, Smartphone, Globe, ArrowRight } from 'lucide-react';
import { MarketingShell } from '@/components/layout/marketing-shell';

export default function AboutPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              প্ল্যাটফর্ম পরিচিতি • MIC Smart Campus
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              শিখুন • যুক্ত হোন • এগিয়ে যান
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              MIC Smart Campus হলো বাংলাদেশের বিশ্ববিদ্যালয়, কলেজ ও হাই স্কুলগুলোর প্রাতিষ্ঠানিক ব্যবস্থাপনার জন্য একটি সর্বাধুনিক মাল্টি-টেন্যান্ট ক্লাউড প্ল্যাটফর্ম। এটি সম্পূর্ণ সেন্ট্রালাইজড Supabase PostgreSQL ডাটাবেজ দ্বারা চালিত এবং ওয়েব পোর্টাল ও অ্যান্ড্রয়েড মোবাইল অ্যাপ্লিকেশনের সাথে রিয়েলটাইমে ইন্টিগ্রেটেড।
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Shield, title: 'Row Level Security', desc: 'পোস্টগ্রেস RLS দিয়ে প্রতিটি প্রতিষ্ঠানের ডাটা ১০০% সুরক্ষিত ও আলাদা থাকে।' },
                { icon: Layers, title: 'Server-Driven UI', desc: 'নতুন APK রি-বিল্ড ছাড়াই ড্যাশবোর্ড থিম, ফিচার ও ব্যানার রিমোটলি পরিবর্তনযোগ্য।' },
                { icon: Smartphone, title: 'অ্যান্ড্রয়েড মোবাইল অ্যাপ', desc: 'বায়োমেট্রিক উপস্থিতি, ক্লাস রুটিন ও পরীক্ষার ফলাফল মোবাইলে লাইভ সিঙ্ক।' },
                { icon: Globe, title: 'বাংলাদেশি সিস্টেম ইন্টিগ্রেশন', desc: 'টাকা (৳) মুদ্রা, বিকাশ ও নগদ অনলাইন ফি পেমেন্ট এবং ঢাকা সময় শিডিউলিং।' },
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
                ভর্তি / নতুন ক্যাম্পাস নিবন্ধন
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 flex items-center justify-center">
            <div className="relative h-64 w-full">
              <Image
                src="/logo.png"
                alt="MIC Smart Campus"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
