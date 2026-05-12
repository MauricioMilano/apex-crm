'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { OrgSettings } from '@/types';
import { getOrganizationSettings } from '@/actions/settings';
import { useCurrentUser } from '@/hooks/use-current-user';

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: OrgSettings = {
  currency: 'USD',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  locale: 'en-US',
};

// ─── Context type ─────────────────────────────────────────────────────────────

interface OrgSettingsContextValue {
  settings: OrgSettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OrgSettingsContext = createContext<OrgSettingsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function OrgSettingsProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useCurrentUser();
  const [settings, setSettings] = useState<OrgSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const orgId = currentUser?.organizationId;
    if (!orgId) {
      setSettings(DEFAULT_SETTINGS);
      setIsLoading(false);
      return;
    }
    try {
      const res = await getOrganizationSettings(orgId);
      if (res.success) {
        setSettings({
          currency: res.data.currency ?? DEFAULT_SETTINGS.currency,
          timezone: res.data.timezone ?? DEFAULT_SETTINGS.timezone,
          dateFormat: res.data.dateFormat ?? DEFAULT_SETTINGS.dateFormat,
          timeFormat: (res.data.timeFormat as '12h' | '24h') ?? DEFAULT_SETTINGS.timeFormat,
          locale: res.data.locale ?? DEFAULT_SETTINGS.locale,
        });
      }
    } catch {
      // keep defaults
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.organizationId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <OrgSettingsContext.Provider value={{ settings, isLoading, refresh }}>
      {children}
    </OrgSettingsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrgSettingsContext(): OrgSettingsContextValue {
  const ctx = useContext(OrgSettingsContext);
  if (!ctx) {
    throw new Error('useOrgSettingsContext must be used within an OrgSettingsProvider');
  }
  return ctx;
}
