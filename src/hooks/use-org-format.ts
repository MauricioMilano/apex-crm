'use client';

import { useCallback } from 'react';
import { useOrgSettings } from './use-org-settings';
import {
  formatCurrency as fmtCurrency,
  formatDate as fmtDate,
  formatDateTime as fmtDateTime,
  formatTime as fmtTime,
  type FormatDateOptions,
} from '@/lib/format';

type DateInput = string | number | Date;

interface UseOrgFormatReturn {
  /** Format a monetary value using the organization's currency and locale */
  formatCurrency: (amount: number) => string;
  /** Format a date using the organization's timezone, dateFormat, and locale */
  formatDate: (date: DateInput, options?: Omit<FormatDateOptions, 'timezone' | 'dateFormat' | 'timeFormat' | 'locale'>) => string;
  /** Format a date+time using the organization's full settings */
  formatDateTime: (date: DateInput, options?: Omit<FormatDateOptions, 'timezone' | 'dateFormat' | 'timeFormat' | 'locale' | 'includeTime'>) => string;
  /** Format only the time portion using the organization's timezone and timeFormat */
  formatTime: (date: DateInput, options?: Omit<FormatDateOptions, 'dateFormat' | 'includeTime' | 'locale'>) => string;
}

/**
 * Returns currency and date formatting functions pre-bound to the
 * current organization's regional settings.
 */
export function useOrgFormat(): UseOrgFormatReturn {
  const { settings } = useOrgSettings();

  const formatCurrency = useCallback(
    (amount: number) =>
      fmtCurrency(amount, settings.currency, settings.locale ?? 'en-US'),
    [settings.currency, settings.locale],
  );

  const formatDate = useCallback(
    (date: DateInput, opts?: Omit<FormatDateOptions, 'timezone' | 'dateFormat' | 'timeFormat' | 'locale'>) =>
      fmtDate(date, {
        ...opts,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        locale: settings.locale ?? 'en-US',
      }),
    [settings.timezone, settings.dateFormat, settings.timeFormat, settings.locale],
  );

  const formatDateTimeWithOptions = useCallback(
    (date: DateInput, opts?: Omit<FormatDateOptions, 'timezone' | 'dateFormat' | 'timeFormat' | 'locale' | 'includeTime'>) =>
      fmtDateTime(date, {
        ...opts,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        timeFormat: settings.timeFormat,
        locale: settings.locale ?? 'en-US',
      }),
    [settings.timezone, settings.dateFormat, settings.timeFormat, settings.locale],
  );

  const formatTimeWithSettings = useCallback(
    (date: DateInput, opts?: Omit<FormatDateOptions, 'dateFormat' | 'includeTime' | 'locale'>) =>
      fmtTime(date, {
        ...opts,
        timezone: settings.timezone,
        timeFormat: settings.timeFormat,
      }),
    [settings.timezone, settings.timeFormat],
  );

  return {
    formatCurrency,
    formatDate,
    formatDateTime: formatDateTimeWithOptions,
    formatTime: formatTimeWithSettings,
  };
}
