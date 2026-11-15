'use client';

import React from 'react';
import { Lock } from 'lucide-react';
import { useRemoteConfig } from '@/components/providers/remote-config-provider';
import { isModuleEnabled } from '@/lib/config/remote-config';
import { StateFeedback } from '@/components/ui/primitives';

export function ModuleGuard({
  moduleKey,
  moduleName,
  children,
}: {
  moduleKey: string;
  moduleName: string;
  children: React.ReactNode;
}) {
  const { config } = useRemoteConfig();
  if (!isModuleEnabled(config, moduleKey)) {
    return (
      <StateFeedback
        type="error"
        title={`${moduleName} Module Disabled`}
        message={`The "${moduleName}" module is currently disabled via Remote Configuration or your institution's subscription plan.`}
        action={<Lock className="h-5 w-5 text-slate-400" />}
      />
    );
  }
  return <>{children}</>;
}
