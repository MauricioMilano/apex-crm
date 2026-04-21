'use client';

import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/crm-context';
import type { Appointment, AppointmentStatus } from '@/types';
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
  format,
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
import { ChevronLeft, ChevronRight, Clock, User, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 8;   // 8 am
const END_HOUR = 20;    // 8 pm
const TOTAL_HOURS = END_HOUR - START_HOUR;

const STATUS_COLORS: Record<
  AppointmentStatus,
  { bg: string; border: string; text: string }
> = {
  pending: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300' },
  confirmed: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300' },
  completed: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300' },
  cancelled: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300' },
  no_show: { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-300' },
};

interface CalendarGridProps {
  onAppointmentClick?: (id: string) => void;
}

export function CalendarGrid({ onAppointmentClick }: CalendarGridProps) {
  const { appointments, clients, services, users, updateAppointment } = useCRM();

  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined);
  const [bookingTime, setBookingTime] = useState<string | undefined>(undefined);

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
    const topOffset = ((startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
    const height = Math.max((duration / 60) * HOUR_HEIGHT, 20);
    // Clamp within visible range
    const clampedTop = Math.max(0, topOffset);
    const maxHeight = TOTAL_HOURS * HOUR_HEIGHT - clampedTop;
    return { top: `${clampedTop}px`, height: `${Math.min(height, maxHeight)}px` };
  }

  function handleSlotClick(day: Date, hour: number) {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    setBookingDate(d);
    setBookingTime(`${hour.toString().padStart(2, '0')}:00`);
    setBookingOpen(true);
  }

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}
            className="border-gray-700 text-gray-400 hover:text-white h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="border-gray-700 text-gray-400 hover:text-white"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}
            className="border-gray-700 text-gray-400 hover:text-white h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-white font-medium ml-1 text-sm">
            {format(currentWeekStart, 'MMM d')} –{' '}
            {format(endOfWeek(currentWeekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
          </span>
        </div>

        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-gray-300 h-8 text-sm">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all" className="text-gray-300">
              All Employees
            </SelectItem>
            {employees.map(e => (
              <SelectItem key={e.id} value={e.id} className="text-gray-300">
                {e.firstName} {e.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto rounded-lg border border-gray-800 bg-gray-950">
        {/* Day-header row */}
        <div className="flex sticky top-0 z-20 bg-gray-950 border-b border-gray-800">
          <div className="w-14 shrink-0" />
          {weekDays.map(day => (
            <div
              key={day.toISOString()}
              className={cn(
                'flex-1 py-2 text-center border-l border-gray-800',
                isToday(day) && 'bg-blue-500/10',
              )}
            >
              <p className="text-xs text-gray-500">{format(day, 'EEE')}</p>
              <p
                className={cn(
                  'text-sm font-semibold',
                  isToday(day) ? 'text-blue-400' : 'text-gray-300',
                )}
              >
                {format(day, 'd')}
              </p>
            </div>
          ))}
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
                  className="text-right pr-2 text-xs text-gray-600 flex items-start pt-1"
                >
                  {format(d, 'h a')}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const dayAppts = getAppointmentsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 border-l border-gray-800 relative',
                  isToday(day) && 'bg-blue-500/5',
                )}
                style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
              >
                {/* Hour-slot click zones */}
                {hours.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-gray-800/40 cursor-pointer hover:bg-gray-800/30 transition-colors"
                    style={{
                      top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
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
                            {client ? `${client.firstName} ${client.lastName}` : 'Client'}
                          </p>
                          {service && <p className="opacity-70 truncate">{service.name}</p>}
                          <p className="opacity-60">{format(startDt, 'h:mm a')}</p>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-72 bg-gray-900 border-gray-700 p-4"
                        side="right"
                        align="start"
                      >
                        <AppointmentPopover
                          appointment={appt}
                          onViewDetail={() => onAppointmentClick?.(appt.id)}
                          onStatusChange={status =>
                            updateAppointment(appt.id, { status })
                          }
                        />
                      </PopoverContent>
                    </Popover>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Flow Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-2xl bg-gray-950 border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Book Appointment</DialogTitle>
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
  const { clients, services, users } = useCRM();

  const client = clients.find(c => c.id === appointment.clientId);
  const service = services.find(s => s.id === appointment.serviceId);
  const employee = users.find(u => u.id === appointment.employeeId);
  const start = parseISO(appointment.startTime);
  const end = parseISO(appointment.endTime);

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
        <p className="font-semibold text-white">
          {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
        </p>
        <p className="text-sm text-gray-400">{service?.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Status: {STATUS_LABEL[appointment.status]}
        </p>
      </div>

      <div className="text-sm text-gray-400 space-y-1">
        <p className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
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
            className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
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
            className="h-7 text-xs border-red-500/50 text-red-400 hover:bg-red-500/20"
            onClick={() => onStatusChange('cancelled')}
          >
            <XCircle className="h-3 w-3 mr-1" /> Cancel
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-xs text-gray-400 hover:text-white"
        onClick={onViewDetail}
      >
        View Details →
      </Button>
    </div>
  );
}
