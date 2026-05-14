'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { getOrganization, updateOrganization, getOrganizationSettings, updateOrganizationSettings } from '@/actions/settings';
import { useCurrentUser } from '@/hooks/use-current-user';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
  { value: 'MMM D, YYYY', label: 'Jan 1, 2025' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD – US Dollar' },
  { value: 'EUR', label: 'EUR – Euro' },
  { value: 'GBP', label: 'GBP – British Pound' },
  { value: 'CAD', label: 'CAD – Canadian Dollar' },
  { value: 'AUD', label: 'AUD – Australian Dollar' },
  { value: 'JPY', label: 'JPY – Japanese Yen' },
  { value: 'CHF', label: 'CHF – Swiss Franc' },
  { value: 'BRL', label: 'BRL – Brazilian Real' },
  { value: 'MXN', label: 'MXN – Mexican Peso' },
];

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'zh-CN', label: '中文' },
];

interface PageSettings {
  orgName: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  locale: string;
}

const defaults: PageSettings = {
  orgName: 'My Organization',
  currency: 'USD',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  locale: 'en-US',
};

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<PageSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const currentUser = useCurrentUser();

  useEffect(() => {
    const orgId = currentUser?.organizationId;
    if (!orgId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getOrganization(orgId),
      getOrganizationSettings(orgId),
    ])
      .then(([orgRes, settingsRes]) => {
        setSettings((s) => ({
          ...s,
          orgName: orgRes.success ? orgRes.data.name : s.orgName,
          currency: settingsRes.success ? (settingsRes.data.currency ?? s.currency) : s.currency,
          timezone: settingsRes.success ? (settingsRes.data.timezone ?? s.timezone) : s.timezone,
          dateFormat: settingsRes.success ? (settingsRes.data.dateFormat ?? s.dateFormat) : s.dateFormat,
          timeFormat: (settingsRes.success ? settingsRes.data.timeFormat : undefined) as '12h' | '24h' ?? s.timeFormat,
          locale: settingsRes.success ? (settingsRes.data.locale ?? s.locale) : s.locale,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUser?.organizationId]);

  async function handleSave() {
    const orgId = currentUser?.organizationId;
    if (!orgId) {
      toast.error('Not authenticated');
      return;
    }
    try {
      await Promise.all([
        updateOrganization(orgId, { name: settings.orgName }),
        updateOrganizationSettings(orgId, {
          currency: settings.currency,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
          timeFormat: settings.timeFormat,
          locale: settings.locale,
        } as Record<string, unknown>),
      ]);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">General Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your organization preferences.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Organization</CardTitle>
          <CardDescription className="text-muted-foreground">
            Basic information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Organization Name</Label>
            <Input
              value={settings.orgName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, orgName: e.target.value }))
              }
              className="bg-muted border-border text-foreground focus:border-primary"
              placeholder="Your Organization"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Locale &amp; Format</CardTitle>
          <CardDescription className="text-muted-foreground">
            Regional preferences for dates, times, currency and language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, timezone: v }))
              }
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-foreground focus:bg-accent">
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Date Format</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, dateFormat: v }))
              }
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-foreground focus:bg-accent">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Time Format</Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, timeFormat: v as '12h' | '24h' }))
              }
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="12h" className="text-foreground focus:bg-accent">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h" className="text-foreground focus:bg-accent">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, currency: v }))
              }
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-foreground focus:bg-accent">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Language / Locale</Label>
            <Select
              value={settings.locale}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, locale: v }))
              }
            >
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {LOCALES.map((l) => (
                  <SelectItem key={l.value} value={l.value} className="text-foreground focus:bg-accent">
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
