'use client';

import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/crm-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Appointment } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO, isSameDay, addMinutes } from 'date-fns';
import { CheckCircle, Clock, User, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const totalMinutes = 9 * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}); // "09:00" … "17:00"

function formatSlotLabel(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

interface BookingFlowProps {
  initialClientId?: string;
  initialDate?: Date;
  initialTime?: string;
  onComplete: (appointment: Appointment) => void;
  onCancel: () => void;
}

export function BookingFlow({
  initialClientId,
  initialDate,
  initialTime,
  onComplete,
  onCancel,
}: BookingFlowProps) {
  const { services, users, clients, appointments, addAppointment } = useCRM();
  const currentUser = useCurrentUser();

  const [step, setStep] = useState<Step>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(initialTime ?? null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId ?? null);
  const [notes, setNotes] = useState('');

  const activeServices = services.filter(s => s.isActive);
  const employees = users.filter(u => (u.role === 'employee' || u.role === 'admin') && u.isActive);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedEmployee = users.find(u => u.id === selectedEmployeeId);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  const takenSlots = useMemo(() => {
    if (!selectedDate) return new Set<string>();
    const slots = new Set<string>();
    appointments
      .filter(a => {
        const sameDay = isSameDay(parseISO(a.startTime), selectedDate);
        const sameEmp = selectedEmployeeId ? a.employeeId === selectedEmployeeId : false;
        return sameDay && sameEmp && a.status !== 'cancelled';
      })
      .forEach(a => {
        const d = parseISO(a.startTime);
        slots.add(
          `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
        );
      });
    return slots;
  }, [appointments, selectedDate, selectedEmployeeId]);

  function goNext() {
    setStep(s => (s + 1) as Step);
  }

  function goBack() {
    if (step === 1) {
      onCancel();
    } else {
      setStep(s => (s - 1) as Step);
    }
  }

  function canAdvance(): boolean {
    if (step === 1) return !!selectedServiceId;
    if (step === 3) return !!selectedDate && !!selectedTime;
    return true;
  }

  async function handleConfirm() {
    if (!selectedServiceId || !selectedDate || !selectedTime || !selectedClientId) return;

    const effectiveEmployeeId =
      selectedEmployeeId ?? (employees[0]?.id ?? 'user_2');
    const svc = services.find(s => s.id === selectedServiceId)!;

    const [h, m] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(h, m, 0, 0);
    const endTime = addMinutes(startTime, svc.duration);

    const appt = await addAppointment({
      organizationId: currentUser?.organizationId ?? '',
      clientId: selectedClientId,
      employeeId: effectiveEmployeeId,
      serviceId: selectedServiceId,
      status: 'pending',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      notes,
    });

    onComplete(appt);
  }

  const stepLabels: string[] = ['Service', 'Employee', 'Date & Time', 'Confirm'];

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center gap-1 flex-1 last:flex-none">
            <div
              className={cn(
                'flex items-center gap-1.5 text-sm whitespace-nowrap',
                idx + 1 === step
                  ? 'text-blue-400'
                  : idx + 1 < step
                  ? 'text-green-400'
                  : 'text-gray-500',
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  idx + 1 === step
                    ? 'bg-blue-500 text-white'
                    : idx + 1 < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-700 text-gray-400',
                )}
              >
                {idx + 1 < step ? <CheckCircle className="h-3 w-3" /> : idx + 1}
              </div>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-px mx-2',
                  idx + 1 < step ? 'bg-green-500/50' : 'bg-gray-700',
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Select Service ── */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Select a Service</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeServices.map(svc => (
              <button
                key={svc.id}
                onClick={() => setSelectedServiceId(svc.id)}
                className={cn(
                  'text-left p-4 rounded-lg border transition-all',
                  selectedServiceId === svc.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-white">{svc.name}</span>
                  {selectedServiceId === svc.id && (
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                  )}
                </div>
                {svc.description && (
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{svc.description}</p>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {svc.duration} min
                  </span>
                  <span className="text-green-400 font-medium">${svc.price}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 2: Select Employee ── */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Select an Employee</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedEmployeeId(null)}
              className={cn(
                'text-left p-4 rounded-lg border transition-all',
                selectedEmployeeId === null
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600',
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">Any Available</p>
                  <p className="text-xs text-gray-400">Auto-assign to available staff</p>
                </div>
                {selectedEmployeeId === null && (
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                )}
              </div>
            </button>

            {employees.map(emp => (
              <button
                key={emp.id}
                onClick={() => setSelectedEmployeeId(emp.id)}
                className={cn(
                  'text-left p-4 rounded-lg border transition-all',
                  selectedEmployeeId === emp.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600',
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm shrink-0">
                    {emp.firstName?.[0] ?? ''}
                    {emp.lastName?.[0] ?? ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{emp.role}</p>
                  </div>
                  {selectedEmployeeId === emp.id && (
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3: Select Date & Time ── */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Select Date & Time</h3>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex justify-center lg:justify-start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={d => {
                  setSelectedDate(d);
                  setSelectedTime(null);
                }}
                disabled={{ before: new Date() }}
                className="rounded-lg border border-gray-700 bg-gray-900"
              />
            </div>

            {selectedDate && (
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-3">
                  Available slots for{' '}
                  <span className="text-white font-medium">
                    {format(selectedDate, 'EEEE, MMMM d')}
                  </span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const taken = takenSlots.has(slot);
                    return (
                      <button
                        key={slot}
                        disabled={taken}
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                          taken
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed line-through'
                            : selectedTime === slot
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700',
                        )}
                      >
                        {formatSlotLabel(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!selectedDate && (
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Pick a date to see available time slots
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Confirm Appointment</h3>

          {/* Client selection (only if not pre-set) */}
          {!initialClientId && (
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Select Client</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {clients
                  .filter(c => c.isActive)
                  .map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClientId(c.id)}
                      className={cn(
                        'text-left px-3 py-2 rounded-lg border text-sm transition-all',
                        selectedClientId === c.id
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600',
                      )}
                    >
                      <span className="font-medium">
                        {c.firstName} {c.lastName}
                      </span>
                      {c.company && (
                        <span className="text-gray-500 text-xs block">{c.company}</span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4 space-y-3">
              {selectedClient && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-400">Client:</span>
                  <span className="text-white font-medium">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </span>
                </div>
              )}
              {selectedService && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-400">Service:</span>
                    <span className="text-white">{selectedService.name}</span>
                    <Badge
                      variant="outline"
                      className="text-green-400 border-green-500/30 text-xs ml-auto"
                    >
                      ${selectedService.price}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">{selectedService.duration} min</span>
                  </div>
                </>
              )}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-400">When:</span>
                  <span className="text-white">
                    {format(selectedDate, 'MMM d, yyyy')} at {formatSlotLabel(selectedTime)}
                  </span>
                </div>
              )}
              {selectedEmployee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-400">With:</span>
                  <span className="text-white">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </span>
                </div>
              )}
              {!selectedEmployee && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-400">With:</span>
                  <span className="text-white">Any available employee</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes or special requests..."
              className="bg-gray-800 border-gray-700 text-white resize-none"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2 border-t border-gray-800">
        <Button
          variant="ghost"
          onClick={goBack}
          className="text-gray-400 hover:text-white"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>

        {step < 4 ? (
          <Button
            onClick={goNext}
            disabled={!canAdvance()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={
              !selectedClientId || !selectedServiceId || !selectedDate || !selectedTime
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm Booking
          </Button>
        )}
      </div>
    </div>
  );
}
