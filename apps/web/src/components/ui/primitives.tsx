'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Loader2,
  Search,
  X,
} from 'lucide-react';
import { cn, downloadCsv } from '@/lib/utils';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}) {
  const variants = {
    primary:
      'bg-[var(--campus-primary,#16A34A)] text-white hover:bg-[#15803D] shadow-sm focus-visible:ring-emerald-500',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700',
    outline:
      'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-10 px-4 text-sm rounded-xl',
    lg: 'h-12 px-6 text-base rounded-xl',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900/90',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
      <div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({
  variant = 'slate',
  children,
  className,
}: {
  variant?: 'green' | 'amber' | 'red' | 'slate' | 'blue';
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
    blue: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    slate: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Input({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <input
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  options,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <select
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Textarea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">{label}</span>}
      <textarea
        className={cn(
          'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white',
          className
        )}
        {...props}
      />
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function StateFeedback({
  type,
  title,
  message,
  action,
}: {
  type: 'loading' | 'empty' | 'error' | 'success';
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const icons = {
    loading: <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />,
    empty: <Inbox className="h-6 w-6 text-slate-400" />,
    error: <AlertCircle className="h-6 w-6 text-red-600" />,
    success: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
  };
  const borders = {
    loading: 'border-slate-200 dark:border-slate-800',
    empty: 'border-dashed border-slate-300 dark:border-slate-700',
    error: 'border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20',
    success: 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border p-8 text-center', borders[type])}>
      <div className="mb-3 rounded-full bg-white p-3 shadow-xs dark:bg-slate-800">{icons[type]}</div>
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>
      {message && <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-5 transition hover:border-emerald-500/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
          {hint && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400">
          {icon}
        </div>
      </div>
    </Card>
  );
}

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  exportValue?: (row: T) => string | number;
}

export function DataTable<T extends Record<string, unknown>>({
  title,
  subtitle,
  rows,
  columns,
  searchPlaceholder = 'Search records...',
  exportFilename,
  emptyTitle = 'No records yet',
  emptyMessage = 'Create your first record using the action button above.',
  headerAction,
  pageSize = 10,
}: {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: TableColumn<T>[];
  searchPlaceholder?: string;
  exportFilename?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  headerAction?: React.ReactNode;
  pageSize?: number;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q))
    );
  }, [query, rows]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExport = () => {
    const data = filtered.map((row) => {
      const out: Record<string, unknown> = {};
      columns.forEach((col) => {
        out[col.header] = col.exportValue ? col.exportValue(row) : row[col.key] ?? '';
      });
      return out;
    });
    downloadCsv(exportFilename ?? 'campusos-export.csv', data);
  };

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="h-9 w-48 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-56"
              />
            </div>
            {exportFilename && rows.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            )}
            {headerAction}
          </div>
        }
      />

      {paged.length === 0 ? (
        <div className="p-6">
          <StateFeedback type="empty" title={emptyTitle} message={emptyMessage} />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <tr>
                  {columns.map((col) => (
                    <th key={col.key} className="px-5 py-3.5">
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((row, idx) => (
                  <tr
                    key={String(row.id ?? idx)}
                    className="transition hover:bg-emerald-50/30 dark:hover:bg-slate-800/40"
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-5 py-3.5 text-slate-700 dark:text-slate-200">
                        {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of{' '}
              {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

export function AreaTrendChart({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle?: string;
  points: Array<{ label: string; value: number }>;
}) {
  const maxVal = Math.max(1, ...points.map((p) => p.value));
  const width = 560;
  const height = 170;
  const padX = 24;
  const padY = 20;

  const coords = points.map((p, idx) => {
    const x = points.length === 1 ? width / 2 : padX + (idx / (points.length - 1)) * (width - padX * 2);
    const y = height - padY - (p.value / maxVal) * (height - padY * 2);
    return { ...p, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath =
    coords.length > 0
      ? `${linePath} L ${coords[coords.length - 1].x} ${height - padY} L ${coords[0].x} ${height - padY} Z`
      : '';

  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="p-5">
        {points.length === 0 ? (
          <StateFeedback type="empty" title="No trend metrics recorded yet" />
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full overflow-visible">
            <defs>
              <linearGradient id="campusArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#16A34A" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill="url(#campusArea)" />}
            {linePath && <path d={linePath} fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />}
            {coords.map((c) => (
              <g key={c.label}>
                <circle cx={c.x} cy={c.y} r="4.5" fill="#22C55E" stroke="#FFFFFF" strokeWidth="2" />
                <text
                  x={c.x}
                  y={height - 2}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px]"
                >
                  {c.label}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </Card>
  );
}
