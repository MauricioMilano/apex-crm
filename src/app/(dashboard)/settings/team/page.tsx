'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import type { User, UserRole, WorkingHours, DaySchedule } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';

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

const defaultWorkingHours = (): WorkingHours => ({
  monday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
  tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
  wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
  thursday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
  friday: { isWorking: true, startTime: '09:00', endTime: '17:00' },
  saturday: { isWorking: false, startTime: '09:00', endTime: '13:00' },
  sunday: { isWorking: false, startTime: '09:00', endTime: '13:00' },
});

const HOURS_KEY = (userId: string) => `crm_working_hours_${userId}`;

function loadHours(userId: string): WorkingHours {
  try {
    const raw = localStorage.getItem(HOURS_KEY(userId));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return defaultWorkingHours();
}

function saveHours(userId: string, hours: WorkingHours) {
  try {
    localStorage.setItem(HOURS_KEY(userId), JSON.stringify(hours));
  } catch {
    // ignore
  }
}

type InviteForm = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

function emptyInvite(): InviteForm {
  return { email: '', firstName: '', lastName: '', role: 'employee' };
}

export default function TeamPage() {
  const { users, addUser, updateUser, deleteUser } = useCRM();
  const teamMembers = users.filter((u) => u.role === 'admin' || u.role === 'employee');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<InviteForm>(emptyInvite());

  const [editingRole, setEditingRole] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Working hours expansion
  const [expandedHours, setExpandedHours] = useState<string | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours());

  function openHours(userId: string) {
    if (expandedHours === userId) {
      setExpandedHours(null);
    } else {
      setWorkingHours(loadHours(userId));
      setExpandedHours(userId);
    }
  }

  function updateDaySchedule(userId: string, day: Day, changes: Partial<DaySchedule>) {
    const next = { ...workingHours, [day]: { ...workingHours[day], ...changes } };
    setWorkingHours(next);
    saveHours(userId, next);
    toast.success('Hours updated');
  }

  function handleInvite() {
    if (!invite.email.trim()) {
      toast.error('Email is required');
      return;
    }
    addUser({
      organizationId: 'org_1',
      email: invite.email.trim(),
      firstName: invite.firstName.trim() || 'New',
      lastName: invite.lastName.trim() || 'Member',
      role: invite.role,
      passwordHash: 'changeme',
      isActive: true,
    });
    toast.success('Team member added');
    setInvite(emptyInvite());
    setInviteOpen(false);
  }

  function handleRoleChange(userId: string, role: UserRole) {
    updateUser(userId, { role });
    setEditingRole(null);
    toast.success('Role updated');
  }

  function handleToggleActive(user: User) {
    updateUser(user.id, { isActive: !user.isActive });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteUser(deleteId);
    toast.success('Member removed');
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Team</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your team members and their working hours.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Email</TableHead>
              <TableHead className="text-gray-400">Role</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400 w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 && (
              <TableRow className="border-gray-800">
                <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                  No team members yet.
                </TableCell>
              </TableRow>
            )}
            {teamMembers.map((user) => (
              <>
                <TableRow key={user.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell className="text-gray-100 font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-gray-400">{user.email}</TableCell>
                  <TableCell>
                    {editingRole === user.id ? (
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100 h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="admin" className="text-gray-100 focus:bg-gray-700">Admin</SelectItem>
                          <SelectItem value="employee" className="text-gray-100 focus:bg-gray-700">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => setEditingRole(user.id)}
                        className="group flex items-center gap-1"
                      >
                        <Badge
                          variant="outline"
                          className={
                            user.role === 'admin'
                              ? 'border-purple-500/50 text-purple-400'
                              : 'border-blue-500/50 text-blue-400'
                          }
                        >
                          {user.role}
                        </Badge>
                        <Pencil className="h-3 w-3 text-gray-600 group-hover:text-gray-400" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={() => handleToggleActive(user)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.role === 'employee' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-gray-400 hover:text-gray-100 text-xs"
                          onClick={() => openHours(user.id)}
                        >
                          Hours
                          {expandedHours === user.id ? (
                            <ChevronUp className="h-3 w-3 ml-1" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => setDeleteId(user.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Working hours expansion */}
                {expandedHours === user.id && (
                  <TableRow key={`${user.id}-hours`} className="border-gray-800 bg-gray-900/50">
                    <TableCell colSpan={5} className="p-4">
                      <p className="text-sm font-medium text-gray-300 mb-3">
                        Working Hours for {user.firstName}
                      </p>
                      <div className="space-y-2">
                        {DAYS.map((day) => {
                          const schedule = workingHours[day];
                          return (
                            <div key={day} className="flex items-center gap-4">
                              <div className="flex items-center gap-2 w-36">
                                <Checkbox
                                  id={`${user.id}-${day}`}
                                  checked={schedule.isWorking}
                                  onCheckedChange={(v) =>
                                    updateDaySchedule(user.id, day, { isWorking: !!v })
                                  }
                                  className="border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <Label
                                  htmlFor={`${user.id}-${day}`}
                                  className="text-gray-300 text-sm cursor-pointer"
                                >
                                  {DAY_LABELS[day]}
                                </Label>
                              </div>
                              {schedule.isWorking && (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="time"
                                    value={schedule.startTime}
                                    onChange={(e) =>
                                      updateDaySchedule(user.id, day, { startTime: e.target.value })
                                    }
                                    className="bg-gray-800 border-gray-700 text-gray-100 h-7 w-28 text-sm"
                                  />
                                  <span className="text-gray-500 text-sm">to</span>
                                  <Input
                                    type="time"
                                    value={schedule.endTime}
                                    onChange={(e) =>
                                      updateDaySchedule(user.id, day, { endTime: e.target.value })
                                    }
                                    className="bg-gray-800 border-gray-700 text-gray-100 h-7 w-28 text-sm"
                                  />
                                </div>
                              )}
                              {!schedule.isWorking && (
                                <span className="text-gray-600 text-sm">Day off</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">First Name</Label>
                <Input
                  value={invite.firstName}
                  onChange={(e) => setInvite((f) => ({ ...f, firstName: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                  placeholder="Jane"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Last Name</Label>
                <Input
                  value={invite.lastName}
                  onChange={(e) => setInvite((f) => ({ ...f, lastName: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Email *</Label>
              <Input
                type="email"
                value={invite.email}
                onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                placeholder="jane@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Role</Label>
              <Select
                value={invite.role}
                onValueChange={(v) => setInvite((f) => ({ ...f, role: v as UserRole }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="admin" className="text-gray-100 focus:bg-gray-700">Admin</SelectItem>
                  <SelectItem value="employee" className="text-gray-100 focus:bg-gray-700">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button onClick={handleInvite} className="bg-blue-600 hover:bg-blue-700">
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently remove this team member. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
