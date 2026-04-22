'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/contexts/crm-context';
import type { AppointmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
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
  format,
  parseISO,
  differenceInMinutes,
  addMinutes,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  Trash2,
  Building2,
  FileText,
} from 'lucide-react';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  no_show: { label: 'No Show', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const total = 9 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export default function AppointmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { appointments, clients, services, users, updateAppointment, deleteAppointment } =
    useCRM();

  const appt = appointments.find(a => a.id === params.id);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notes, setNotes] = useState(appt?.notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string | null>(null);

  if (!appt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-gray-600 mb-3" />
        <p className="text-gray-400 text-lg mb-4">Appointment not found</p>
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Go Back
        </Button>
      </div>
    );
  }

  const client = clients.find(c => c.id === appt.clientId);
  const service = services.find(s => s.id === appt.serviceId);
  const employee = users.find(u => u.id === appt.employeeId);

  const start = parseISO(appt.startTime);
  const end = parseISO(appt.endTime);
  const duration = differenceInMinutes(end, start);
  const statusCfg = STATUS_CONFIG[appt.status];

  function handleStatusChange(status: AppointmentStatus) {
    updateAppointment(appt!.id, { status });
  }

  function handleSaveNotes() {
    updateAppointment(appt!.id, { notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  function handleReschedule() {
    if (!newDate || !newTime || !service) return;
    const [h, m] = newTime.split(':').map(Number);
    const newStart = new Date(newDate);
    newStart.setHours(h, m, 0, 0);
    const newEnd = addMinutes(newStart, service.duration);
    updateAppointment(appt!.id, {
      startTime: newStart.toISOString(),
      endTime: newEnd.toISOString(),
      status: 'confirmed',
    });
    setRescheduleOpen(false);
    setNewDate(undefined);
    setNewTime(null);
  }

  function handleDelete() {
    deleteAppointment(appt!.id);
    router.push('/appointments');
  }

  const canManage =
    appt.status === 'pending' || appt.status === 'confirmed';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">Appointment Details</h1>
            <p className="text-xs text-gray-500">{appt.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-sm', statusCfg.className)}>
            {statusCfg.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Appointment Info */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Appointment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Date</p>
                <p className="text-white">{format(start, 'MMMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Time</p>
                <p className="text-white">
                  {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Duration</p>
                <p className="text-white">{duration} minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-gray-400 text-xs">Created</p>
                <p className="text-white">
                  {format(parseISO(appt.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {appt.cancelReason && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-300">
              <span className="font-medium">Cancel reason:</span> {appt.cancelReason}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client */}
      {client && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                {client.firstName[0]}
                {client.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/dashboard/clients/${client.id}`}
                  className="text-white font-medium hover:text-blue-400 transition-colors"
                >
                  {client.firstName} {client.lastName}
                </Link>
                {client.company && (
                  <p className="text-sm text-gray-400">{client.company}</p>
                )}
                {client.email && (
                  <p className="text-sm text-gray-500">{client.email}</p>
                )}
              </div>
              <Link href={`/dashboard/clients/${client.id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-400 hover:text-white shrink-0"
                >
                  View Client
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee */}
      {employee && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" /> Employee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </div>
              <div>
                <p className="text-white font-medium">
                  {employee.firstName} {employee.lastName}
                </p>
                <p className="text-sm text-gray-400 capitalize">{employee.role}</p>
                {employee.email && (
                  <p className="text-sm text-gray-500">{employee.email}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service */}
      {service && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" /> Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-medium">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-gray-400 mt-1">{service.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">{service.duration} min</p>
              </div>
              <Badge
                variant="outline"
                className="text-green-400 border-green-500/30 shrink-0"
              >
                ${service.price}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Management */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Status Management</CardTitle>
        </CardHeader>
        <CardContent>
          {appt.status === 'pending' && (
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => handleStatusChange('confirmed')}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Confirm
              </Button>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                onClick={() => handleStatusChange('cancelled')}
              >
                <XCircle className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          )}
          {appt.status === 'confirmed' && (
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleStatusChange('completed')}
              >
                <CheckCircle className="h-4 w-4 mr-1" /> Mark Complete
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                onClick={() => handleStatusChange('no_show')}
              >
                <AlertCircle className="h-4 w-4 mr-1" /> No Show
              </Button>
              <Button
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                onClick={() => handleStatusChange('cancelled')}
              >
                <XCircle className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </div>
          )}
          {!canManage && (
            <p className="text-sm text-gray-500">
              This appointment is {statusCfg.label.toLowerCase()}. No further
              status changes available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reschedule */}
      {canManage && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center justify-between">
              Reschedule
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 text-sm"
                onClick={() => setRescheduleOpen(v => !v)}
              >
                {rescheduleOpen ? 'Hide' : 'Pick New Time'}
              </Button>
            </CardTitle>
          </CardHeader>
          {rescheduleOpen && (
            <CardContent className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex justify-center lg:justify-start">
                  <CalendarUI
                    mode="single"
                    selected={newDate}
                    onSelect={d => {
                      setNewDate(d);
                      setNewTime(null);
                    }}
                    disabled={{ before: new Date() }}
                    className="rounded-lg border border-gray-700 bg-gray-800"
                  />
                </div>
                {newDate && (
                  <div className="flex-1">
                    <p className="text-sm text-gray-400 mb-3">
                      Time slots for{' '}
                      <span className="text-white">{format(newDate, 'MMMM d')}</span>
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setNewTime(slot)}
                          className={cn(
                            'py-2 px-2 rounded-lg text-sm font-medium transition-all',
                            newTime === slot
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700',
                          )}
                        >
                          {formatSlotLabel(slot)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Button
                onClick={handleReschedule}
                disabled={!newDate || !newTime}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Calendar className="h-4 w-4 mr-1" /> Confirm Reschedule
              </Button>
            </CardContent>
          )}
        </Card>
      )}

      {/* Notes */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this appointment..."
            className="bg-gray-800 border-gray-700 text-white resize-none"
            rows={4}
          />
          <Button
            onClick={handleSaveNotes}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:text-white"
          >
            {notesSaved ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1 text-green-400" /> Saved!
              </>
            ) : (
              'Save Notes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Appointment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. The appointment will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
