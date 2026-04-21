'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, isPast, isFuture, differenceInHours } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCRM } from '@/contexts/crm-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarDays,
  Clock,
  User,
  Calendar,
  RotateCcw,
  XCircle,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
  no_show:   { label: 'No Show',   className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export default function ClientPortalAppointmentsPage() {
  const { currentUser } = useAuth();
  const { clients, appointments, services, users, updateAppointment } = useCRM();
  const router = useRouter();

  const client = useMemo(
    () =>
      clients.find(
        (c) => c.email?.toLowerCase() === currentUser?.email?.toLowerCase(),
      ),
    [clients, currentUser],
  );

  const clientAppointments = useMemo(
    () => (client ? appointments.filter((a) => a.clientId === client.id) : []),
    [appointments, client],
  );

  const upcoming = useMemo(
    () =>
      clientAppointments
        .filter((a) => isFuture(parseISO(a.startTime)) && a.status !== 'cancelled')
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [clientAppointments],
  );

  const past = useMemo(
    () =>
      clientAppointments
        .filter((a) => isPast(parseISO(a.endTime)) || a.status === 'cancelled')
        .sort((a, b) => b.startTime.localeCompare(a.startTime)),
    [clientAppointments],
  );

  const canCancel = (appt: Appointment) => {
    const hoursUntil = differenceInHours(parseISO(appt.startTime), new Date());
    return (
      hoursUntil > 24 &&
      (appt.status === 'pending' || appt.status === 'confirmed')
    );
  };

  const handleCancel = (apptId: string) => {
    updateAppointment(apptId, {
      status: 'cancelled',
      cancelReason: 'Cancelled by client',
    });
    toast.success('Appointment cancelled');
  };

  function AppointmentCard({
    appt,
    showActions,
  }: {
    appt: Appointment;
    showActions?: boolean;
  }) {
    const svc = services.find((s) => s.id === appt.serviceId);
    const emp = users.find((u) => u.id === appt.employeeId);
    const start = parseISO(appt.startTime);
    const end = parseISO(appt.endTime);
    const cfg = STATUS_CONFIG[appt.status];

    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-semibold text-gray-900">{svc?.name}</h3>
                <Badge className={cn('text-xs border', cfg.className)}>
                  {cfg.label}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-4 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {format(start, 'EEE, MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                </span>
                {emp && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    {emp.firstName} {emp.lastName}
                  </span>
                )}
              </div>
              {appt.notes && (
                <p className="text-xs text-gray-400 mt-2 italic">
                  &ldquo;{appt.notes}&rdquo;
                </p>
              )}
              {appt.cancelReason && (
                <p className="text-xs text-red-400 mt-1">
                  Reason: {appt.cancelReason}
                </p>
              )}
            </div>

            {showActions && (
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/portal/book')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Reschedule
                </Button>
                {canCancel(appt) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancel(appt.id)}
                    className="text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 mt-1">
            Manage your upcoming and past sessions.
          </p>
        </div>
        <Button onClick={() => router.push('/portal/book')}>
          <Plus className="h-4 w-4 mr-2" />
          Book New
        </Button>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming" className="gap-2">
            Upcoming
            {upcoming.length > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs rounded-full px-1.5 py-0.5 font-medium">
                {upcoming.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {upcoming.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No upcoming appointments</p>
              <p className="text-sm mt-1">Book your next session to get started.</p>
              <Button className="mt-5" onClick={() => router.push('/portal/book')}>
                Book Appointment
              </Button>
            </div>
          ) : (
            upcoming.map((appt) => (
              <AppointmentCard key={appt.id} appt={appt} showActions />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {past.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-gray-500">No past appointments yet</p>
              <p className="text-sm mt-1">
                Your appointment history will appear here.
              </p>
            </div>
          ) : (
            past.map((appt) => <AppointmentCard key={appt.id} appt={appt} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
