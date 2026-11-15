'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { Badge, Card, CardHeader, StateFeedback } from '@/components/ui/primitives';

export default function DynamicCustomNavPage() {
  const { slug } = useParams<{ slug?: string[] }>();
  const { config } = useRemoteConfig();

  const currentPath = '/' + (slug?.join('/') ?? '');
  const navItem = config.navigation.find(
    (n) => n.route_path === currentPath || n.route_path.replace(/^\//, '') === (slug?.join('/') ?? '')
  );

  if (!navItem) {
    return (
      <StateFeedback
        type="empty"
        title="Custom Route Not Active"
        message={`No active remote navigation item matches "${currentPath}" for your role or platform.`}
      />
    );
  }

  return (
    <Card>
      <CardHeader
        title={navItem.label}
        subtitle={`Server-Driven UI Screen • Module Key: ${navItem.module_key}`}
        action={
          <Badge variant="green">
            <Sparkles className="h-3.5 w-3.5" />
            Remote Config v{config.version}
          </Badge>
        }
      />
      <div className="p-6 space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This route was dynamically provisioned from the Super Admin Remote Configuration Console and synchronized in real time across Web and Android.
        </p>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Configured Metadata</p>
          <pre className="mt-2 overflow-auto text-xs text-slate-700 dark:text-emerald-300">
            {JSON.stringify(navItem, null, 2)}
          </pre>
        </div>
      </div>
    </Card>
  );
}
