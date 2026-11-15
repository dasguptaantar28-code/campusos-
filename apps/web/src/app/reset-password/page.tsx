'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CampusLogo } from '@/components/brand/campusos-logo';
import { Button, Card, Input, StateFeedback } from '@/components/ui/primitives';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setStatus({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      setStatus({ type: 'error', text: 'Supabase not configured yet.' });
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus({ type: 'error', text: error.message });
      setLoading(false);
      return;
    }
    setStatus({ type: 'success', text: 'Password updated! Redirecting to sign in...' });
    setTimeout(() => router.push('/login'), 1200);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-4 dark:bg-[#0B111A]">
      <div className="mb-6">
        <CampusLogo href="/" size="lg" />
      </div>
      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Set New Password</h1>
        {status && (
          <div className="mt-4">
            <StateFeedback type={status.type} title={status.type === 'success' ? 'Success' : 'Error'} message={status.text} />
          </div>
        )}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Input label="New Password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirm Password" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <Button type="submit" loading={loading} className="w-full">
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
