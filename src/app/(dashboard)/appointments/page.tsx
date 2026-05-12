'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/crm-context';
import type { AppointmentStatus } from '@/types';
import { BookingFlow } from '@/components/appointments/booking-flow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  isSameDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  differenceInMinutes,
} from 'date-fns';
import { useOrgFormat } from '@/hooks/use-org-format';
import { cn } from '@/lib/utils';
import {
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
} from 'lucide-react';

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmed', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Completed', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  no_show: { label: 'No Show', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

type SortKey = 'startTime' | 'clientName' | 'serviceName' | 'employeeName' | 'status';
type SortDir = 'asc' | 'desc';

export default function AppointmentsPage() {
  const router = useRouter();
  const { appointments, clients, leads, services, users, updateAppointment, deleteAppointment } =
    useCRM();

  const [newApptOpen, setNewApptOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('startTime');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { formatDate, formatTime } = useOrgFormat();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const todayCount = appointments.filter(a =>
    isSameDay(parseISO(a.startTime), today),
  ).length;

  const weekCount = appointments.filter(a =>
    isWithinInterval(parseISO(a.startTime), { start: weekStart, end: weekEnd }),
  ).length;

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  const employees = users.filter(
    u => (u.role === 'employee' || u.role === 'admin') && u.isActive,
  );

  const filtered = useMemo(() => {
    let result = [...appointments];

    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }
    if (employeeFilter !== 'all') {
      result = result.filter(a => a.employeeId === employeeFilter);
    }

    result.sort((a, b) => {
      let av = '';
      let bv = '';
      if (sortKey === 'startTime') {
        av = a.startTime;
        bv = b.startTime;
      } else if (sortKey === 'status') {
        av = a.status;
        bv = b.status;
      } else if (sortKey === 'clientName') {
        const ca = clients.find(c => c.id === a.clientId);
        const cb = clients.find(c => c.id === b.clientId);
        const la = leads.find(l => l.id === a.leadId);
        const lb = leads.find(l => l.id === b.leadId);
        
        av = ca ? `${ca.firstName} ${ca.lastName}` : (la ? `${la.firstName} ${la.lastName}` : '');
        bv = cb ? `${cb.firstName} ${cb.lastName}` : (lb ? `${lb.firstName} ${lb.lastName}` : '');
      } else if (sortKey === 'serviceName') {
        av = services.find(s => s.id === a.serviceId)?.name ?? '';
        bv = services.find(s => s.id === b.serviceId)?.name ?? '';
      } else if (sortKey === 'employeeName') {
        const ea = users.find(u => u.id === a.employeeId);
        const eb = users.find(u => u.id === b.employeeId);
        av = ea ? `${ea.firstName} ${ea.lastName}` : '';
        bv = eb ? `${eb.firstName} ${eb.lastName}` : '';
      }
      const cmp = av.localeCompare(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [appointments, statusFilter, employeeFilter, sortKey, sortDir, clients, services, users]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function sortIcon(key: SortKey) {
    if (sortKey !== key) return <span className="ml-1 text-gray-700">↕</span>;
    return (
      <span className="ml-1 text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Appointments</h1>
        <Button
          onClick={() => setNewApptOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Appointment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todayCount}</p>
              <p className="text-sm text-gray-400">Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{weekCount}</p>
              <p className="text-sm text-gray-400">This Week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{pendingCount}</p>
              <p className="text-sm text-gray-400">Pending Confirmation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-gray-300">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-gray-900 border-gray-700">
            <SelectItem value="all" className="text-gray-300">
              All Statuses
            </SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-gray-300">
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
          <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-gray-300">
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

      {/* Table */}
      <Card className="bg-gray-900 border-gray-700">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-transparent">
                <TableHead
                  className="text-gray-400 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('startTime')}
                >
                  Date {sortIcon('startTime')}
                </TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('clientName')}
                >
                  Client {sortIcon('clientName')}
                </TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('serviceName')}
                >
                  Service {sortIcon('serviceName')}
                </TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('employeeName')}
                >
                  Employee {sortIcon('employeeName')}
                </TableHead>
                <TableHead className="text-gray-400">Duration</TableHead>
                <TableHead
                  className="text-gray-400 cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort('status')}
                >
                  Status {sortIcon('status')}
                </TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-12"
                  >
                    No appointments found
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(appt => {
                const client = clients.find(c => c.id === appt.clientId);
                const lead = leads.find(l => l.id === appt.leadId);
                const service = services.find(s => s.id === appt.serviceId);
                const employee = users.find(u => u.id === appt.employeeId);
                const start = parseISO(appt.startTime);
                const end = parseISO(appt.endTime);
                const duration = differenceInMinutes(end, start);
                const statusCfg = STATUS_CONFIG[appt.status];

                return (
                  <TableRow
                    key={appt.id}
                    className="border-gray-700 hover:bg-gray-800/50"
                  >
                    <TableCell className="text-gray-300">
                      <p>{formatDate(start)}</p>
                      <p className="text-xs text-gray-500">{formatTime(start)}</p>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {client
                        ? `${client.firstName} ${client.lastName}`
                        : lead
                        ? `${lead.firstName} ${lead.lastName} (Lead)`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {service?.name ?? '—'}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {employee
                        ? `${employee.firstName} ${employee.lastName}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-gray-300">{duration}m</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', statusCfg.className)}
                      >
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {appt.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                            title="Confirm"
                            onClick={() =>
                              void updateAppointment(appt.id, { status: 'confirmed' })
                            }
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {appt.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-400 hover:text-green-300 hover:bg-green-500/20"
                            title="Mark Complete"
                            onClick={() =>
                              void updateAppointment(appt.id, { status: 'completed' })
                            }
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(appt.status === 'pending' ||
                          appt.status === 'confirmed') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                            title="Cancel"
                            onClick={() =>
                              void updateAppointment(appt.id, { status: 'cancelled' })
                            }
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                          title="View Details"
                          onClick={() =>
                            router.push(`/appointments/${appt.id}`)
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                          title="Delete"
                          onClick={() => setDeleteId(appt.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* New Appointment Dialog */}
      <Dialog open={newApptOpen} onOpenChange={setNewApptOpen}>
        <DialogContent className="max-w-2xl bg-gray-950 border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">New Appointment</DialogTitle>
          </DialogHeader>
          <BookingFlow
            onComplete={() => setNewApptOpen(false)}
            onCancel={() => setNewApptOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
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
              onClick={() => {
                if (deleteId) {
                  void deleteAppointment(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
