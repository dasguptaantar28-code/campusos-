'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { DEFAULT_FALLBACK_CONFIG } from '@/lib/config/remote-config';
import type { EffectiveRemoteConfig } from '@/lib/types';

interface RemoteConfigContextValue {
  config: EffectiveRemoteConfig;
  loading: boolean;
  syncing: boolean;
  lastSyncedAt: string | null;
  refreshConfig: () => Promise<void>;
}

const RemoteConfigContext = createContext<RemoteConfigContextValue>({
  config: DEFAULT_FALLBACK_CONFIG,
  loading: false,
  syncing: false,
  lastSyncedAt: null,
  refreshConfig: async () => {},
});

export function useRemoteConfig() {
  return useContext(RemoteConfigContext);
}

export function RemoteConfigProvider({
  initialConfig,
  tenantId,
  children,
}: {
  initialConfig: EffectiveRemoteConfig;
  tenantId?: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [config, setConfig] = useState<EffectiveRemoteConfig>(initialConfig);
  const [loading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => new Date().toISOString());

  const cacheKey = `campusos_remote_cfg_${tenantId ?? 'global'}`;

  const applyThemeTokens = useCallback((cfg: EffectiveRemoteConfig) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (cfg.theme?.primary) root.style.setProperty('--campus-primary', cfg.theme.primary);
    if (cfg.theme?.emerald) root.style.setProperty('--campus-emerald', cfg.theme.emerald);
    if (cfg.theme?.darkGreen) root.style.setProperty('--campus-dark-green', cfg.theme.darkGreen);
  }, []);

  const refreshConfig = useCallback(async () => {
    setSyncing(true);
    try {
      const qs = new URLSearchParams({ platform: 'web' });
      if (tenantId) qs.set('tenant_id', tenantId);
      const res = await fetch(`/api/config/resolve?${qs.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const nextCfg = (await res.json()) as EffectiveRemoteConfig;
        setConfig(nextCfg);
        applyThemeTokens(nextCfg);
        setLastSyncedAt(new Date().toISOString());
        try {
          localStorage.setItem(cacheKey, JSON.stringify(nextCfg));
        } catch {
          // Ignore storage quota errors
        }

        if (nextCfg.session_revoked) {
          const sb = createBrowserSupabaseClient();
          await sb?.auth.signOut();
          router.push('/login?reason=session_revoked');
        }
      }
    } catch {
      // Offline fallback from cache
      try {
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const cached = JSON.parse(raw) as EffectiveRemoteConfig;
          setConfig(cached);
          applyThemeTokens(cached);
        }
      } catch {
        // Ignore parse failure
      }
    } finally {
      setSyncing(false);
    }
  }, [applyThemeTokens, cacheKey, router, tenantId]);

  useEffect(() => {
    setConfig(initialConfig);
    applyThemeTokens(initialConfig);
    try {
      localStorage.setItem(cacheKey, JSON.stringify(initialConfig));
    } catch {
      // Ignore
    }
  }, [applyThemeTokens, cacheKey, initialConfig]);

  useEffect(() => {
    const onOnline = () => {
      void refreshConfig();
    };
    window.addEventListener('online', onOnline);

    const supabase = createBrowserSupabaseClient();
    if (!supabase) {
      return () => window.removeEventListener('online', onOnline);
    }

    const { data: authSub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        void refreshConfig();
      }
    });

    const channel = supabase
      .channel(`campusos-remote-${tenantId ?? 'global'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_config' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'configuration_versions' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenant_features' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'navigation_items' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard_widgets' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => void refreshConfig())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => void refreshConfig())
      .subscribe();

    return () => {
      window.removeEventListener('online', onOnline);
      authSub.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [refreshConfig, tenantId]);

  return (
    <RemoteConfigContext.Provider value={{ config, loading, syncing, lastSyncedAt, refreshConfig }}>
      {children}
    </RemoteConfigContext.Provider>
  );
}
