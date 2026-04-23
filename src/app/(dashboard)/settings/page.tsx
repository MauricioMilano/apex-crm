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
import { getOrganization, updateOrganization } from '@/actions/settings';

const STORAGE_KEY = 'crm_org_settings';

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

interface OrgSettings {
  orgName: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

const defaultSettings: OrgSettings = {
  orgName: 'My Organization',
  timezone: 'America/New_York',
  dateFormat: 'MM/DD/YYYY',
  currency: 'USD',
};

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState<OrgSettings>(defaultSettings);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings(JSON.parse(raw) as OrgSettings);
    } catch {
      // ignore
    }
    getOrganization('org_apex_business_solutions')
      .then((res) => { if (res.success) setSettings((s) => ({ ...s, orgName: res.data.name })); })
      .catch(() => {});
  }, []);

  async function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      await updateOrganization('org_apex_business_solutions', { name: settings.orgName });
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">General Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure your organization preferences.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Organization</CardTitle>
          <CardDescription className="text-gray-400">
            Basic information about your organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Organization Name</Label>
            <Input
              value={settings.orgName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, orgName: e.target.value }))
              }
              className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
              placeholder="Your Organization"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Locale &amp; Format</CardTitle>
          <CardDescription className="text-gray-400">
            Regional preferences for dates, times and currency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, timezone: v }))
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-gray-100 focus:bg-gray-700">
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Date Format</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, dateFormat: v }))
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {DATE_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-gray-100 focus:bg-gray-700">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Currency</Label>
            <Select
              value={settings.currency}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, currency: v }))
              }
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-gray-100 focus:bg-gray-700">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
