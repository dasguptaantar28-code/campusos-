import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/providers/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusOS — Enterprise Smart Campus Operating System | Creator: Antar Dasgupta',
  description:
    'CampusOS — Enterprise-grade multi-tenant academic management platform for schools, colleges, and universities with synchronized Android APK and PostgreSQL Supabase integration. Architected by Antar Dasgupta. All Rights Reserved.',
  icons: {
    icon: '/brand/campusos-logo.jpg',
    apple: '/brand/campusos-logo.jpg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" suppressHydrationWarning className="scroll-smooth dark">
      <body className="min-h-screen antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
