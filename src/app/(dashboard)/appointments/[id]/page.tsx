'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCRM } from '@/contexts/crm-context';
import type { Appointment, AppointmentStatus, Payment } from '@/types';
import { getAggregatedAvailability } from '@/actions/appointments';
import type { AggregatedSlot } from '@/actions/appointments';
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
  parseISO,
  differenceInMinutes,
  addMinutes,
  format,
} from 'date-fns';
import { cn } from '@/lib/utils';
import StatusSelect from '@/components/appointments/status-select';
import { useOrgFormat } from '@/hooks/use-org-format';
import { useCurrentUser } from '@/hooks/use-current-user';
import { allowedStatusesForRole } from '@/lib/permissions';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Trash2,
  Building2,
  FileText,
  DollarSign,
  Plus,
  Loader2,
} from 'lucide-react';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmed', className: 'bg-primary/20 text-primary border-primary/30' },
  completed: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/20 text-destructive/80 border-destructive/30' },
  no_show: { label: 'No Show', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

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

  const [fetchedAppt, setFetchedAppt] = useState<Appointment | null>(null);
  const [fetchingAppt, setFetchingAppt] = useState(false);

  useEffect(() => {
    const id = params.id;
    if (!id) return;
    if (appointments.some((a) => a.id === id)) return;
    if (fetchedAppt && fetchedAppt.id === id) return;

    let cancelled = false;
    setFetchingAppt(true);
    (async () => {
      try {
        const res = await fetch(`/api/v1/appointments/${id}`);
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data ?? json;
        if (!cancelled) setFetchedAppt(data as Appointment);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setFetchingAppt(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, appointments, fetchedAppt]);

  const appt = appointments.find((a) => a.id === params.id) ?? fetchedAppt;

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState<string | null>(null);

  // Reschedule availability state
  const [rescheduleSlots, setRescheduleSlots] = useState<AggregatedSlot[]>([]);
  const [rescheduleSlotsLoading, setRescheduleSlotsLoading] = useState(false);
  const [rescheduleDayCoverage, setRescheduleDayCoverage] = useState(true);

  // Fetch available slots for reschedule when date changes
  useEffect(() => {
    if (!newDate || !appt) {
      setRescheduleSlots([]);
      setRescheduleDayCoverage(true);
      return;
    }

    let cancelled = false;
    setRescheduleSlotsLoading(true);
    setNewTime(null);

    async function fetchSlots() {
      try {
        const dateStr = format(newDate!, 'yyyy-MM-dd');
        const result = await getAggregatedAvailability(
          appt!.serviceId,
          dateStr,
          appt!.employeeId,
        );
        if (cancelled) return;
        if (result.success) {
          setRescheduleSlots(result.data.slots);
          setRescheduleDayCoverage(result.data.dayCoverage);
        } else {
          setRescheduleSlots([]);
          setRescheduleDayCoverage(false);
        }
      } catch {
        if (!cancelled) {
          setRescheduleSlots([]);
          setRescheduleDayCoverage(false);
        }
      } finally {
        if (!cancelled) setRescheduleSlotsLoading(false);
      }
    }

    void fetchSlots();
    return () => { cancelled = true; };
  }, [newDate, appt?.serviceId, appt?.employeeId]);

  // Payment state
  const { triggerPaymentModal } = useCRM();
  const [appointmentPayments, setAppointmentPayments] = useState<Payment[]>([]);

  useEffect(() => {
    setNotes(appt?.notes ?? '');
  }, [appt?.notes]);

  // Fetch payments for this appointment
  useEffect(() => {
    const appointmentId = appt?.id;
    if (!appointmentId) return;
    async function fetchPayments() {
      try {
        const res = await fetch(`/api/v1/payments?referenceType=appointment&referenceId=${appointmentId}`);
        const json = await res.json();
        const data = (json?.data ?? json) as Payment[];
        setAppointmentPayments(Array.isArray(data) ? data : []);
      } catch {
        // best-effort
      }
    }
    void fetchPayments();
  }, [appt?.id]);

  // Fetch payments on mount + re-fetch when page becomes visible
  // (handles global payment modal confirmation from any page)
  useEffect(() => {
    const currentId = appt?.id;
    if (!currentId) return;
    let cancelled = false;
    async function refresh() {
      const res = await fetch(`/api/v1/payments?referenceType=appointment&referenceId=${currentId}`);
      const json = await res.json();
      if (!cancelled) {
        setAppointmentPayments(Array.isArray(json?.data ?? json) ? (json?.data ?? json) : []);
      }
    }
    void refresh();
    function onVisible() {
      if (document.visibilityState === 'visible') void refresh();
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [appt?.id]);

  const { formatDate, formatTime } = useOrgFormat();

  if (!appt) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-lg mb-4">{fetchingAppt ? 'Loading appointment...' : 'Appointment not found'}</p>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/appointments')}
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

  const currentUser = useCurrentUser();
  const allowedStatuses = allowedStatusesForRole(currentUser?.role ?? 'employee');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/appointments')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Appointment Details</h1>
            <p className="text-xs text-muted-foreground">{appt.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn('text-sm', statusCfg.className)}>
            {statusCfg.label}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive/50 text-destructive/80 hover:bg-destructive/20"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Page grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Info */}
          <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-base">Appointment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Date</p>
                <p className="text-foreground">{formatDate(start)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Time</p>
                <p className="text-foreground">
                  {formatTime(start)} – {formatTime(end)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Duration</p>
                <p className="text-foreground">{duration} minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Created</p>
                <p className="text-foreground">
                  {formatDate(appt.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {appt.cancelReason && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive/60">
              <span className="font-medium">Cancel reason:</span> {appt.cancelReason}
            </div>
          )}
        </CardContent>
          </Card>

          {/* Client */}
          {client && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-foreground font-medium text-sm shrink-0">
                    {client.firstName?.[0] ?? ''}
                    {client.lastName?.[0] ?? ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/clients/${client.id}`}
                      className="text-foreground font-medium hover:text-primary transition-colors"
                    >
                      {client.firstName} {client.lastName}
                    </Link>
                    {client.company && (
                      <p className="text-sm text-muted-foreground">{client.company}</p>
                    )}
                    {client.email && (
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    )}
                  </div>
                  <Link href={`/clients/${client.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-muted-foreground hover:text-foreground shrink-0"
                    >
                      View Client
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Service */}
          {service && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Service
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-foreground font-medium">{service.name}</p>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">{service.duration} min</p>
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
        </div>

        <div className="space-y-6">
          {/* Employee */}
          {employee && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" /> Employee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-foreground font-medium text-sm shrink-0">
                    {employee.firstName?.[0] ?? ''}
                    {employee.lastName?.[0] ?? ''}
                  </div>
                  <div>
                    <p className="text-foreground font-medium">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">{employee.role}</p>
                    {employee.email && (
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Management */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Status Management</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusSelect value={appt.status} onChange={handleStatusChange} allowed={allowedStatuses} disabled={!canManage} />
              {!canManage && (
                <p className="text-sm text-muted-foreground mt-3">
                  This appointment is {statusCfg.label.toLowerCase()}. No further
                  status changes available.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-400" />
                Payments
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!appt) return;
                  triggerPaymentModal(appt.id, service?.price ?? 0);
                }}
                className="border-border text-foreground/90 hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Record
              </Button>
            </CardHeader>
            <CardContent>
              {appointmentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No payments recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {appointmentPayments.map((p) => {
                    const methodName = (p as Payment & { paymentMethod?: { name: string } }).paymentMethod?.name;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs px-1.5 py-0.5 rounded font-medium',
                            p.status === 'completed' && 'bg-green-500/20 text-green-400',
                            p.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                            p.status === 'adjusted' && 'bg-gray-500/20 text-gray-400',
                            p.status === 'refunded' && 'bg-destructive/20 text-destructive/80',
                          )}>
                            {p.status}
                          </span>
                          {methodName && (
                            <span className="text-xs text-muted-foreground">{methodName}</span>
                          )}
                          {p.installments > 1 && (
                            <span className="text-xs text-muted-foreground">{p.installments}x</span>
                          )}
                          {p.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {p.description}
                            </span>
                          )}
                        </div>
                        <span className={cn(
                          'text-sm font-medium',
                          p.amount < 0 ? 'text-destructive/80' : 'text-foreground',
                        )}>
                          {p.amount < 0 ? '-' : ''}${Math.abs(p.amount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reschedule */}
          {canManage && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base flex items-center justify-between">
                  Reschedule
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80 text-sm"
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
                        className="rounded-lg border border-border bg-muted"
                      />
                    </div>
                    {newDate && (
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-3">
                          Time slots for{' '}
                          <span className="text-foreground">{formatDate(newDate)}</span>
                        </p>
                        {rescheduleSlotsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 text-primary animate-spin" />
                          </div>
                        ) : !rescheduleDayCoverage ? (
                          <div className="text-center py-12 text-muted-foreground text-sm">
                            No available slots on this day. Pick another date.
                          </div>
                        ) : rescheduleSlots.length === 0 ? (
                          <div className="text-center py-12 text-muted-foreground text-sm">
                            No available slots for this date.
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {rescheduleSlots.map(slot => (
                              <button
                                key={slot.time}
                                onClick={() => setNewTime(slot.time)}
                                className={cn(
                                  'py-2 px-2 rounded-lg text-sm font-medium transition-all',
                                  newTime === slot.time
                                    ? 'bg-primary text-foreground'
                                    : 'bg-muted text-foreground/90 hover:bg-accent border border-border',
                                )}
                              >
                                {formatSlotLabel(slot.time)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleReschedule}
                    disabled={!newDate || !newTime}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Calendar className="h-4 w-4 mr-1" /> Confirm Reschedule
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {/* Notes */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this appointment..."
                className="bg-muted border-border text-foreground resize-none"
                rows={4}
              />
              <Button
                onClick={handleSaveNotes}
                variant="outline"
                className="border-border text-foreground/90 hover:text-foreground"
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
          </div>
        </div>
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Appointment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. The appointment will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground/90 hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
