'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CampusLogo } from '@/components/brand/campusos-logo';
import { Button, Card, Input, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setStatus({ type: 'error', text: 'Supabase not configured yet.' });
      setLoading(false);
      return;
    }

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setStatus(
      error
        ? { type: 'error', text: error.message }
        : { type: 'success', text: 'Password reset link dispatched if an account exists for that email.' }
    );
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 dark:bg-[#0B111A]">
      <div className="mb-6">
        <CampusLogo href="/" size="lg" />
      </div>
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reset Your Password</h1>
        <p className="mt-1 text-xs text-slate-500">Enter your email address to receive a secure password reset link.</p>
        {status && (
          <div className="mt-4">
            <StateFeedback type={status.type} title={status.type === 'success' ? 'Check Your Email' : 'Error'} message={status.text} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Input label="Email Address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" loading={loading} className="w-full">
            Send Reset Link
          </Button>
        </form>
        <p className="mt-4 text-center text-xs">
          <Link href="/login" className="font-semibold text-[#16A34A] hover:underline">
            Back to Sign In
          </Link>
        </p>
      </Card>
    </div>
  );
}
