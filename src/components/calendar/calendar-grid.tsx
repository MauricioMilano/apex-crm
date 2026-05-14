'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCRM } from '@/contexts/crm-context';
import type { Appointment, AppointmentStatus, WorkingHours } from '@/types';
import { getOrgDefaultWorkingHours } from '@/actions/working-hours';
import { getEmployeeWorkingHours } from '@/actions/working-hours';
import type { DaySchedule } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BookingFlow } from '@/components/appointments/booking-flow';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  differenceInMinutes,
  isToday,
} from 'date-fns';
import { useOrgFormat } from '@/hooks/use-org-format';
import { useOrgSettings } from '@/hooks/use-org-settings';
import { ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const HOUR_HEIGHT = 64; // px per hour
const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 20;

const STATUS_COLORS: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string }
> = {
  pending: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300' },
  confirmed: { bg: 'bg-primary/20', border: 'border-primary/50', text: 'text-primary/80' },
  completed: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300' },
  cancelled: { bg: 'bg-destructive/20', border: 'border-destructive/50', text: 'text-destructive/60' },
  no_show: { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-muted-foreground' },
};

interface CalendarGridProps {
  onAppointmentClick?: (id: string) => void;
}

export function CalendarGrid({ onAppointmentClick }: CalendarGridProps) {
  const { appointments, clients, leads, services, users, updateAppointment } = useCRM();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const { formatDate, formatTime } = useOrgFormat();
  const { settings: orgSettings } = useOrgSettings();
  const orgTimezone = orgSettings.timezone;
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);

  // Working hours for the selected employee (or org default)
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [hoursLoading, setHoursLoading] = useState(true);

  // Fetch working hours when selection changes
  useEffect(() => {
    setHoursLoading(true);
    async function fetchHours() {
      try {
        if (selectedEmployeeId !== 'all') {
          const result = await getEmployeeWorkingHours(selectedEmployeeId);
          if (result.success) setWorkingHours(result.data);
        } else {
          const result = await getOrgDefaultWorkingHours();
          if (result.success) setWorkingHours(result.data);
        }
      } catch {
        setWorkingHours(null);
      } finally {
        setHoursLoading(false);
      }
    }
    void fetchHours();
  }, [selectedEmployeeId]);

  // Compute hour range from working hours
  const hourRange = useMemo(() => {
    if (!workingHours) return { start: DEFAULT_START_HOUR, end: DEFAULT_END_HOUR };
    const allSchedules = Object.values(workingHours) as DaySchedule[];
    let minStart = 24;
    let maxEnd = 0;
    for (const s of allSchedules) {
      if (s.isWorking) {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        if (startMins < minStart * 60) minStart = sh;
        if (endMins > maxEnd * 60) maxEnd = eh + (em > 0 ? 1 : 0);
      }
    }
    // Round to sensible display range
    const start = Math.max(DEFAULT_START_HOUR, Math.floor(minStart));
    const end = Math.min(DEFAULT_END_HOUR, Math.ceil(maxEnd));
    return { start, end };
  }, [workingHours]);

  const totalHours = hourRange.end - hourRange.start;

  function getDaySchedule(day: Date): DaySchedule | null {
    if (!workingHours) return null;
    // Use Intl.DateTimeFormat with the org's timezone so the day-of-week
    // matches what formatDate() displays in the column headers.
    const dayName = new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      timeZone: orgTimezone,
    }).format(day).toLowerCase() as keyof WorkingHours;
    return workingHours[dayName] as DaySchedule;
  }

  const employees = users.filter(u => (u.role === 'employee' || u.role === 'admin') && u.isActive);

  const weekDays = eachDayOfInterval({
    start: currentWeekStart,
    end: endOfWeek(currentWeekStart, { weekStartsOn: 1 }),
  });

  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (selectedEmployeeId !== 'all' && a.employeeId !== selectedEmployeeId) return false;
      return weekDays.some(d => isSameDay(d, parseISO(a.startTime)));
    });
  }, [appointments, selectedEmployeeId, weekDays]);

  function getAppointmentsForDay(day: Date): Appointment[] {
    return filteredAppointments.filter(a => isSameDay(parseISO(a.startTime), day));
  }

  function getAppointmentStyle(appt: Appointment): React.CSSProperties {
    const start = parseISO(appt.startTime);
    const end = parseISO(appt.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const duration = differenceInMinutes(end, start);
    const topOffset = ((startMinutes - hourRange.start * 60) / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);
    const clampedTop = Math.max(0, topOffset);
    const maxHeight = totalHours * HOUR_HEIGHT - clampedTop;
    return { top: `${clampedTop}px`, height: `${Math.min(height, maxHeight)}px` };
  }

  function handleSlotClick(day: Date, hour: number) {
    const schedule = getDaySchedule(day);
    if (!schedule?.isWorking) return;
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    setBookingDate(d);
    setBookingTime(`${hour.toString().padStart(2, '0')}:00`);
    setBookingOpen(true);
  }

  const hours = Array.from({ length: totalHours }, (_, i) => hourRange.start + i);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}
            className="border-border text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="border-border text-muted-foreground hover:text-foreground"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}
            className="border-border text-muted-foreground hover:text-foreground h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-foreground font-medium ml-1 text-sm">
            {formatDate(currentWeekStart)} –{' '}
            {formatDate(endOfWeek(currentWeekStart, { weekStartsOn: 1 }))}
          </span>
        </div>

        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-48 bg-card border-border text-muted-foreground h-8 text-sm">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all" className="text-muted-foreground">
              All Employees
            </SelectItem>
            {employees.map(e => (
              <SelectItem key={e.id} value={e.id} className="text-muted-foreground">
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-background">
        {/* Day-header row */}
        <div className="flex sticky top-0 z-20 bg-background border-b border-border">
          <div className="w-14 shrink-0" />
          {weekDays.map(day => {
            const schedule = getDaySchedule(day);
            const isClosed = schedule && !schedule.isWorking;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 py-2 text-center border-l border-border',
                  isToday(day) && 'bg-primary/10',
                  isClosed && 'opacity-50',
                )}
              >
                <p className="text-xs text-muted-foreground/80">{formatDate(day)}</p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isToday(day) ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {isClosed ? 'Closed' : formatDate(day)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid body */}
        <div className="flex">
          {/* Time labels */}
          <div className="w-14 shrink-0 select-none">
            {hours.map(hour => {
              const d = new Date();
              d.setHours(hour, 0, 0, 0);
              return (
                <div
                  key={hour}
                  style={{ height: `${HOUR_HEIGHT}px` }}
                  className="text-right pr-2 text-xs text-muted-foreground flex items-start pt-1"
                >
                  {formatTime(d)}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayAppts = getAppointmentsForDay(day);
            const schedule = getDaySchedule(day);
            const isClosed = schedule && !schedule.isWorking;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 border-l border-border relative',
                  isToday(day) && 'bg-primary/5',
                )}
                style={{ height: `${totalHours * HOUR_HEIGHT}px` }}
              >
                {hoursLoading && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50">
                    <span className="text-xs text-muted-foreground/80">Loading...</span>
                  </div>
                )}

                {isClosed ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground font-medium">Closed</span>
                  </div>
                ) : (
                  <>
                    {/* Hour-slot click zones */}
                    {hours.map(hour => (
                      <div
                        key={hour}
                        className="absolute w-full border-t border-border/40 cursor-pointer hover:bg-accent/30 transition-colors"
                        style={{
                          top: `${(hour - hourRange.start) * HOUR_HEIGHT}px`,
                          height: `${HOUR_HEIGHT}px`,
                        }}
                        onClick={() => handleSlotClick(day, hour)}
                      />
                    ))}

                    {/* Appointment blocks */}
                    {dayAppts.map(appt => {
                      const style = getAppointmentStyle(appt);
                      const colors = STATUS_COLORS[appt.status];
                      const client = clients.find(c => c.id === appt.clientId);
                      const lead = leads.find(l => l.id === appt.leadId);
                      const service = services.find(s => s.id === appt.serviceId);
                      const startDt = parseISO(appt.startTime);

                      return (
                        <Popover key={appt.id}>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                'absolute left-1 right-1 rounded border text-left px-2 py-1 overflow-hidden z-10',
                                'hover:brightness-125 transition-all text-[11px] leading-tight',
                                colors.bg,
                                colors.border,
                                colors.text,
                              )}
                              style={style}
                              onClick={e => e.stopPropagation()}
                            >
                              <p className="font-semibold truncate">
                                {client 
                                  ? `${client.firstName} ${client.lastName}` 
                                  : lead 
                                  ? `${lead.firstName} ${lead.lastName} (Lead)` 
                                  : 'Appointment'}
                              </p>
                              {service && <p className="opacity-70 truncate">{service.name}</p>}
                              <p className="opacity-60">{formatTime(startDt)}</p>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-72 bg-card border-border p-4"
                            side="right"
                            align="start"
                          >
                            <AppointmentPopover
                              appointment={appt}
                              onViewDetail={() => onAppointmentClick?.(appt.id)}
                              onStatusChange={status =>
                                void updateAppointment(appt.id, { status })
                              }
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Flow Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-2xl bg-background border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Book Appointment</DialogTitle>
          </DialogHeader>
          <BookingFlow
            initialDate={bookingDate}
            initialTime={bookingTime}
            onComplete={() => setBookingOpen(false)}
            onCancel={() => setBookingOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Popover detail component ──────────────────────────────────────────────────

function AppointmentPopover({
  appointment,
  onViewDetail,
  onStatusChange,
}: {
  appointment: Appointment;
  onViewDetail: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
}) {
  const { clients, leads, services, users } = useCRM();
  const { formatTime } = useOrgFormat();

  const client = clients.find(c => c.id === appointment.clientId);
  const lead = leads.find(l => l.id === appointment.leadId);
  const service = services.find(s => s.id === appointment.serviceId);
  const employee = users.find(u => u.id === appointment.employeeId);

  const STATUS_LABEL: Record<AppointmentStatus, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-foreground">
          {client 
            ? `${client.firstName} ${client.lastName}` 
            : lead 
            ? `${lead.firstName} ${lead.lastName} (Lead)` 
            : 'Unknown'}
        </p>
        <p className="text-sm text-muted-foreground">{service?.name}</p>
        <p className="text-xs text-muted-foreground/80 mt-0.5">
          Status: {STATUS_LABEL[appointment.status]}
        </p>
      </div>

      <div className="text-sm text-muted-foreground space-y-1">
        <p className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
        </p>
        <p className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {appointment.status === 'pending' && (
          <Button
            size="sm"
            className="h-7 text-xs bg-primary hover:bg-primary/90"
            onClick={() => onStatusChange('confirmed')}
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Confirm
          </Button>
        )}
        {appointment.status === 'confirmed' && (
          <Button
            size="sm"
            className="h-7 text-xs bg-green-600 hover:bg-green-700"
            onClick={() => onStatusChange('completed')}
          >
            <CheckCircle className="h-3 w-3 mr-1" /> Complete
          </Button>
        )}
        {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-destructive/50 text-destructive/80 hover:bg-destructive/20"
            onClick={() => onStatusChange('cancelled')}
          >
            <XCircle className="h-3 w-3 mr-1" /> Cancel
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
        onClick={onViewDetail}
      >
        View Details →
      </Button>
    </div>
  );
}
