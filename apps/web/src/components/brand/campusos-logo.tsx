import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { GraduationCap, Sparkles } from 'lucide-react';

export function CampusLogo({
  href = '/',
  size = 'md',
  darkSurface = false,
  subtitle,
  className,
}: {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  darkSurface?: boolean;
  subtitle?: string;
  className?: string;
}) {
  const iconSize = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const textClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const subClass = size === 'lg' ? 'text-[11px]' : size === 'sm' ? 'text-[8px]' : 'text-[9px]';

  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5 group select-none', className)}>
      <div className={cn(
        'relative flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200 border border-emerald-400/30 text-white shrink-0',
        iconSize
      )}>
        <GraduationCap className={size === 'lg' ? 'h-5 w-5' : size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-300"></span>
        </span>
      </div>
      <div className="flex flex-col leading-tight">
        <div className={cn('font-black tracking-tight flex items-center gap-0.5', textClass, darkSurface ? 'text-white' : 'text-slate-900 dark:text-white')}>
          <span>Campus</span>
          <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent font-extrabold">OS</span>
          <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
            3.0
          </span>
        </div>
        <span className={cn('font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400', subClass)}>
          {subtitle || 'Smart Academic Platform'}
        </span>
      </div>
    </Link>
  );
}
