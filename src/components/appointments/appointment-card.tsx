'use client';

import { useCRM } from '@/contexts/crm-context';
import type { Appointment, AppointmentStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  no_show: { label: 'No Show', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export function AppointmentCard({
  appointment,
  onConfirm,
  onComplete,
  onCancel,
  onReschedule,
}: AppointmentCardProps) {
  const { clients, leads, users, services } = useCRM();

  const client = clients.find(c => c.id === appointment.clientId);
  const lead = leads.find(l => l.id === appointment.leadId);
  const employee = users.find(u => u.id === appointment.employeeId);
  const service = services.find(s => s.id === appointment.serviceId);

  const startDate = parseISO(appointment.startTime);
  const endDate = parseISO(appointment.endTime);
  const duration = differenceInMinutes(endDate, startDate);

  const status = statusConfig[appointment.status];

  const canConfirm = appointment.status === 'pending';
  const canComplete = appointment.status === 'confirmed';
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';

  return (
    <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white truncate">
                {client ? `${client.firstName} ${client.lastName}` : lead ? `${lead.firstName} ${lead.lastName}` : 'Unknown Entity'}
              </span>
              {lead && !client && (
                <Badge variant="outline" className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px] h-4">
                  Lead
                </Badge>
              )}
              <Badge variant="outline" className={cn('shrink-0 text-xs', status.className)}>
                {status.label}
              </Badge>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              {service?.name ?? 'Unknown Service'}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(startDate, 'MMM d, yyyy')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(startDate, 'h:mm a')} · {duration}m
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown'}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            {canConfirm && onConfirm && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                onClick={() => onConfirm(appointment.id)}
              >
                <CheckCircle className="h-3 w-3 mr-1" /> Confirm
              </Button>
            )}
            {canComplete && onComplete && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-green-500/50 text-green-400 hover:bg-green-500/20"
                onClick={() => onComplete(appointment.id)}
              >
                <CheckCircle className="h-3 w-3 mr-1" /> Complete
              </Button>
            )}
            {canCancel && onCancel && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-red-500/50 text-red-400 hover:bg-red-500/20"
                onClick={() => onCancel(appointment.id)}
              >
                <XCircle className="h-3 w-3 mr-1" /> Cancel
              </Button>
            )}
            {onReschedule && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-gray-400 hover:text-gray-300"
                onClick={() => onReschedule(appointment.id)}
              >
                <AlertCircle className="h-3 w-3 mr-1" /> Reschedule
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
