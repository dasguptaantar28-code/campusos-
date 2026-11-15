'use client';

import React, { useState } from 'react';
import { MarketingShell } from '@/components/layout/marketing-shell';
import { Button, Card, Input, StateFeedback, Textarea } from '@/components/ui/primitives';

export default function ContactPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    institution_name: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', text: json.error ?? 'Failed to submit inquiry.' });
      } else {
        setStatus({ type: 'success', text: 'Your inquiry has been saved. Our enterprise team will reach out shortly.' });
        setForm({ full_name: '', email: '', phone: '', institution_name: '', message: '' });
      }
    } catch {
      setStatus({ type: 'error', text: 'Network error while submitting contact form.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MarketingShell>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">Contact CampusOS</span>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white">
            Talk With Our SaaS Architecture Team
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Questions about district multi-tenancy, mobile white-labeling, or enterprise onboarding? Send us a message.
          </p>
        </div>

        <Card className="mt-10 p-6 sm:p-8">
          {status && (
            <div className="mb-6">
              <StateFeedback
                type={status.type}
                title={status.type === 'success' ? 'Message Sent' : 'Unable to Send'}
                message={status.text}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Full Name *"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Dr. Sarah Rahman"
              />
              <Input
                label="Work Email *"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="principal@school.edu"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+8801700000000"
              />
              <Input
                label="Institution Name"
                value={form.institution_name}
                onChange={(e) => setForm({ ...form, institution_name: e.target.value })}
                placeholder="Green Valley International School"
              />
            </div>
            <Textarea
              label="Message *"
              rows={5}
              required
              minLength={10}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us about your campuses, student count, and rollout timeline..."
            />
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Send Inquiry
            </Button>
          </form>
        </Card>
      </section>
    </MarketingShell>
  );
}
