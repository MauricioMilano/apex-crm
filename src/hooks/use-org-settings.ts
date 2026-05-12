'use client';

import { useOrgSettingsContext } from '@/contexts/org-settings-context';
import type { OrgSettings } from '@/types';

interface UseOrgSettingsReturn {
  settings: OrgSettings;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Returns the current organization's regional settings.
 * Must be used within an OrgSettingsProvider.
 */
export function useOrgSettings(): UseOrgSettingsReturn {
  const { settings, isLoading, refresh } = useOrgSettingsContext();
  return { settings, isLoading, refresh };
}
