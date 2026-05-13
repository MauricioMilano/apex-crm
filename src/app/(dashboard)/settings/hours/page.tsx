'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCRM } from '@/contexts/crm-context';
import {
  getOrgDefaultWorkingHours,
  updateOrgDefaultWorkingHours,
  getEmployeeWorkingHours,
  updateEmployeeWorkingHours,
} from '@/actions/working-hours';
import type { WorkingHours, DaySchedule } from '@/types';
import { createDefaultWorkingHours } from '@/lib/working-hours';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof DAYS[number];

const DAY_LABELS: Record<Day, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function defaultWorkingHours(): WorkingHours {
  return createDefaultWorkingHours();
}

function HoursEditor({
  hours,
  onChange,
  saving,
}: {
  hours: WorkingHours;
  onChange: (hours: WorkingHours) => void;
  saving?: boolean;
}) {
  function updateDay(day: Day, changes: Partial<DaySchedule>) {
    onChange({ ...hours, [day]: { ...hours[day], ...changes } });
  }

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const schedule = hours[day];
        return (
          <div key={day} className="flex items-center gap-4">
            <div className="flex items-center gap-2 w-36">
              <Checkbox
                id={`hours-${day}`}
                checked={schedule.isWorking}
                onCheckedChange={(v) =>
                  updateDay(day, { isWorking: !!v })
                }
                disabled={saving}
                className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label
                htmlFor={`hours-${day}`}
                className="text-gray-300 text-sm cursor-pointer"
              >
                {DAY_LABELS[day]}
              </Label>
            </div>
            {schedule.isWorking ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={schedule.startTime}
                  onChange={(e) =>
                    updateDay(day, { startTime: e.target.value })
                  }
                  disabled={saving}
                  className="bg-gray-800 border-gray-700 text-gray-100 h-7 w-28 text-sm"
                />
                <span className="text-gray-500 text-sm">to</span>
                <Input
                  type="time"
                  value={schedule.endTime}
                  onChange={(e) =>
                    updateDay(day, { endTime: e.target.value })
                  }
                  disabled={saving}
                  className="bg-gray-800 border-gray-700 text-gray-100 h-7 w-28 text-sm"
                />
              </div>
            ) : (
              <span className="text-gray-600 text-sm">Day off</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function BusinessHoursPage() {
  const { users } = useCRM();

  // ── Org default hours ──────────────────────────────────────────────────
  const [orgHours, setOrgHours] = useState<WorkingHours>(defaultWorkingHours());
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgSaving, setOrgSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await getOrgDefaultWorkingHours();
        if (!cancelled && result.success) {
          setOrgHours(result.data);
        }
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setOrgLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  async function handleSaveOrg() {
    setOrgSaving(true);
    try {
      const result = await updateOrgDefaultWorkingHours(orgHours);
      if (result.success) {
        toast.success('Default hours saved');
      } else {
        toast.error(result.error ?? 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setOrgSaving(false);
    }
  }

  // ── Per-employee hours ─────────────────────────────────────────────────
  const teamMembers = users.filter(
    (u) => (u.role === 'employee' || u.role === 'admin') && u.isActive,
  );

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [empHours, setEmpHours] = useState<WorkingHours>(defaultWorkingHours());
  const [empLoading, setEmpLoading] = useState(false);
  const [empSaving, setEmpSaving] = useState(false);

  async function openEmployee(userId: string) {
    if (expandedId === userId) {
      setExpandedId(null);
      return;
    }
    setEmpLoading(true);
    setExpandedId(userId);
    try {
      const result = await getEmployeeWorkingHours(userId);
      if (result.success) {
        setEmpHours(result.data);
      } else {
        setEmpHours(defaultWorkingHours());
      }
    } catch {
      setEmpHours(defaultWorkingHours());
    } finally {
      setEmpLoading(false);
    }
  }

  async function handleSaveEmployee(userId: string) {
    setEmpSaving(true);
    try {
      const result = await updateEmployeeWorkingHours(userId, empHours);
      if (result.success) {
        toast.success('Employee hours saved');
      } else {
        toast.error(result.error ?? 'Failed to save');
      }
    } catch {
      toast.error('Failed to save');
    } finally {
      setEmpSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Business Hours</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure your organization-wide default hours and manage per-employee schedules.
        </p>
      </div>

      {/* ── Organization default hours ── */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400" />
            Organization Default Hours
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                These hours apply to all employees who don&apos;t have custom schedules configured.
              </p>
              <HoursEditor
                hours={orgHours}
                onChange={setOrgHours}
                saving={orgSaving}
              />
              <Button
                onClick={handleSaveOrg}
                disabled={orgSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {orgSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Default Hours
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Per-employee hours ── */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            Employee Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              No team members found.
            </p>
          ) : (
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400 w-40">Schedule</TableHead>
                    <TableHead className="text-gray-400 w-40">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.map((user) => (
                    <>
                      <TableRow key={user.id} className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="text-gray-100 font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell className="text-gray-400">{user.email}</TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">
                            {expandedId === user.id ? 'Editing...' : 'Click to edit'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-gray-400 hover:text-gray-100 text-xs"
                            onClick={() => openEmployee(user.id)}
                          >
                            {expandedId === user.id ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" /> Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" /> Edit Hours
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedId === user.id && (
                        <TableRow key={`${user.id}-hours`} className="border-gray-800 bg-gray-900/50">
                          <TableCell colSpan={4} className="p-4">
                            {empLoading ? (
                              <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <p className="text-sm text-gray-400">
                                  Custom hours for <span className="text-white font-medium">{user.firstName} {user.lastName}</span>.
                                  Leave all days unchecked to inherit org defaults.
                                </p>
                                <HoursEditor
                                  hours={empHours}
                                  onChange={setEmpHours}
                                  saving={empSaving}
                                />
                                <Button
                                  onClick={() => handleSaveEmployee(user.id)}
                                  disabled={empSaving}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {empSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                  )}
                                  Save Employee Hours
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
