'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/crm-context';
import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { Button } from '@/components/ui/button';
import {
  format,
  parseISO,
  isSameDay,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { useOrgFormat } from '@/hooks/use-org-format';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types';

type View = 'week' | 'month' | 'day';

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
  no_show: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export default function CalendarPage() {
  const router = useRouter();
  const { appointments, clients, services } = useCRM();

  const [view, setView] = useState<View>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { formatDate, formatTime } = useOrgFormat();

  function shiftDate(delta: number) {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (view === 'month') {
        d.setMonth(d.getMonth() + delta);
      } else {
        d.setDate(d.getDate() + delta);
      }
      return d;
    });
  }

  // Month grid days (Mon-start, fills surrounding weeks)
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthGridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  function dayAppointments(day: Date) {
    return appointments.filter(a => isSameDay(parseISO(a.startTime), day));
  }

  const todayAppointments = dayAppointments(currentDate).sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Calendar</h1>

        {/* View switcher */}
        <div className="flex rounded-lg border border-gray-700 overflow-hidden">
          {(['week', 'month', 'day'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-2 text-sm capitalize transition-colors',
                view === v
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Week view ── */}
      {view === 'week' && (
        <div className="flex-1 min-h-0">
          <CalendarGrid
            onAppointmentClick={id => router.push(`/appointments/${id}`)}
          />
        </div>
      )}

      {/* ── Month view ── */}
      {view === 'month' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-gray-700 text-gray-400 hover:text-white h-8 w-8"
                onClick={() => shiftDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-400 hover:text-white"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-gray-700 text-gray-400 hover:text-white h-8 w-8"
                onClick={() => shiftDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-800 overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 bg-gray-900 border-b border-gray-800">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div
                  key={d}
                  className="py-2 text-center text-xs text-gray-500 font-medium uppercase tracking-wide"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
              {monthGridDays.map(day => {
                const appts = dayAppointments(day);
                const inMonth = isSameMonth(day, currentDate);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'border-b border-r border-gray-800 min-h-[96px] p-1.5',
                      !inMonth && 'opacity-40',
                      isToday(day) && 'bg-blue-500/5',
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1',
                        isToday(day)
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-400',
                      )}
                    >
                      {formatDate(day)}
                    </div>
                    <div className="space-y-0.5">
                      {appts.slice(0, 3).map(a => {
                        const client = clients.find(c => c.id === a.clientId);
                        return (
                          <button
                            key={a.id}
                            className={cn(
                              'w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate border',
                              STATUS_BADGE[a.status],
                            )}
                            onClick={() =>
                              router.push(`/appointments/${a.id}`)
                            }
                          >
                                                        {formatTime(a.startTime)} {' '}
                            {client ? client.firstName : ''}
                          </button>
                        );
                      })}
                      {appts.length > 3 && (
                        <p className="text-[10px] text-gray-500 pl-1">
                          +{appts.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Day view ── */}
      {view === 'day' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {formatDate(currentDate)}
              {isToday(currentDate) && (
                <span className="ml-2 text-sm text-blue-400 font-normal">Today</span>
              )}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="border-gray-700 text-gray-400 hover:text-white h-8 w-8"
                onClick={() => shiftDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-700 text-gray-400 hover:text-white"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="border-gray-700 text-gray-400 hover:text-white h-8 w-8"
                onClick={() => shiftDate(1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No appointments scheduled for this day.
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map(a => {
                const client = clients.find(c => c.id === a.clientId);
                const service = services.find(s => s.id === a.serviceId);
                return (
                    <button
                    key={a.id}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border cursor-pointer hover:brightness-110 transition-all',
                      STATUS_BADGE[a.status],
                    )}
                    onClick={() => router.push(`/appointments/${a.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white">
                        {client
                          ? `${client.firstName} ${client.lastName}`
                          : 'Unknown Client'}
                      </p>
                      <span className="text-sm opacity-80">
                        {formatTime(a.startTime)} –{' '}
                        {formatTime(a.endTime)}
                      </span>
                    </div>
                    {service && (
                      <p className="text-sm opacity-70 mt-0.5">{service.name}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
