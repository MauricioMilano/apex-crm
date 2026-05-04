'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users2,
  UserCheck,
  CalendarDays,
  DollarSign,
  Plus,
  Clock,
} from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { useCRM } from '@/contexts/crm-context';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const APPT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
  no_show: 'bg-gray-500/20 text-gray-400',
};

export default function DashboardPage() {
  const router = useRouter();
  const {
    leads,
    clients,
    appointments,
    services,
    leadStatuses,
  } = useCRM();

  // ── Stats ────────────────────────────────────────────────────────────────

  const totalLeads = leads.length;
  const activeClients = clients.filter((c) => c.isActive).length;

  const todayAppointments = appointments.filter((a) =>
    isToday(new Date(a.startTime)),
  ).length;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const monthlyRevenue = appointments
    .filter(
      (a) =>
        a.status === 'completed' &&
        new Date(a.startTime) >= currentMonthStart,
    )
    .reduce((sum, a) => {
      const svc = services.find((s) => s.id === a.serviceId);
      return sum + (svc?.price ?? 0);
    }, 0);

  const prevMonthRevenue = appointments
    .filter(
      (a) =>
        a.status === 'completed' &&
        new Date(a.startTime) >= prevMonthStart &&
        new Date(a.startTime) <= prevMonthEnd,
    )
    .reduce((sum, a) => {
      const svc = services.find((s) => s.id === a.serviceId);
      return sum + (svc?.price ?? 0);
    }, 0);

  const currMonthLeads = leads.filter((l) => new Date(l.createdAt) >= currentMonthStart).length;
  const prevMonthLeads = leads.filter(
    (l) => new Date(l.createdAt) >= prevMonthStart && new Date(l.createdAt) <= prevMonthEnd,
  ).length;

  const currMonthClients = clients.filter(
    (c) => c.isActive && new Date(c.createdAt) >= currentMonthStart,
  ).length;
  const prevMonthClients = clients.filter(
    (c) => c.isActive && new Date(c.createdAt) >= prevMonthStart && new Date(c.createdAt) <= prevMonthEnd,
  ).length;

  function pctChange(curr: number, prev: number): number {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  const leadTrend = pctChange(currMonthLeads, prevMonthLeads);
  const clientTrend = pctChange(currMonthClients, prevMonthClients);
  const revenueTrend = pctChange(monthlyRevenue, prevMonthRevenue);

  // ── Recent leads (last 5 by createdAt) ──────────────────────────────────

  const recentLeads = useMemo(
    () =>
      [...leads]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [leads],
  );

  // ── Upcoming appointments (next 5) ───────────────────────────────────────

  const upcomingAppointments = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            (isFuture(new Date(a.startTime)) ||
              isToday(new Date(a.startTime))) &&
            a.status !== 'cancelled',
        )
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        )
        .slice(0, 5),
    [appointments],
  );

  // ── Lead status distribution ──────────────────────────────────────────────

  const statusDistribution = useMemo(() => {
    return leadStatuses
      .sort((a, b) => a.order - b.order)
      .map((status) => {
        const count = leads.filter((l) => l.statusId === status.id).length;
        const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
        return { ...status, count, pct };
      });
  }, [leads, leadStatuses, totalLeads]);

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={() => router.push('/leads')}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
        <Button
          onClick={() => router.push('/appointments')}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
        <Button
          onClick={() => router.push('/clients')}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Leads"
          value={totalLeads}
          icon={Users2}
          trend={leadTrend}
          description="vs last month"
          iconColor="bg-blue-500/20 text-blue-400"
        />
        <StatsCard
          title="Active Clients"
          value={activeClients}
          icon={UserCheck}
          trend={clientTrend}
          description="vs last month"
          iconColor="bg-emerald-500/20 text-emerald-400"
        />
        <StatsCard
          title="Today's Appointments"
          value={todayAppointments}
          icon={CalendarDays}
          description="scheduled today"
          iconColor="bg-purple-500/20 text-purple-400"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={revenueTrend}
          description="completed appointments"
          iconColor="bg-yellow-500/20 text-yellow-400"
        />
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base">Recent Leads</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/leads')}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 text-xs"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-500 text-xs">Name</TableHead>
                  <TableHead className="text-gray-500 text-xs">Status</TableHead>
                  <TableHead className="text-gray-500 text-xs text-right">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-gray-600 py-6"
                    >
                      No leads yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentLeads.map((lead) => {
                    const status = leadStatuses.find(
                      (s) => s.id === lead.statusId,
                    );
                    return (
                      <TableRow
                        key={lead.id}
                        className="border-gray-800 hover:bg-gray-800/50"
                      >
                        <TableCell className="py-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {lead.firstName} {lead.lastName}
                            </p>
                            {lead.company && (
                              <p className="text-xs text-gray-500">
                                {lead.company}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {status && (
                            <Badge
                              variant="outline"
                              className={`text-xs border ${STATUS_COLOR_MAP[status.color] ?? 'bg-gray-500/20 text-gray-400'}`}
                            >
                              {status.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right text-sm text-gray-300">
                          {lead.value != null
                            ? `$${lead.value.toLocaleString()}`
                            : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base">
              Upcoming Appointments
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/appointments')}
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 text-xs"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">
                No upcoming appointments
              </p>
            ) : (
              <ul className="space-y-3">
                {upcomingAppointments.map((appt) => {
                  const client = clients.find((c) => c.id === appt.clientId) ??
                    null;
                  const svc = services.find((s) => s.id === appt.serviceId);
                  const start = new Date(appt.startTime);
                  return (
                    <li
                      key={appt.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-800"
                    >
                      <div className="shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20">
                        <Clock className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {client
                            ? `${client.firstName} ${client.lastName}`
                            : 'Unknown client'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {svc?.name ?? 'Service'} &middot;{' '}
                          {isToday(start)
                            ? `Today at ${format(start, 'h:mm a')}`
                            : format(start, 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <Badge
                        className={`text-xs shrink-0 ${APPT_STATUS_COLORS[appt.status] ?? 'bg-gray-500/20 text-gray-400'}`}
                      >
                        {appt.status}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead status distribution */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">
            Lead Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalLeads === 0 ? (
            <p className="text-gray-600 text-sm">No leads to display.</p>
          ) : (
            <div className="space-y-3">
              {statusDistribution.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{s.name}</span>
                    <span className="text-gray-500">
                      {s.count} lead{s.count !== 1 ? 's' : ''} &middot; {s.pct}%
                    </span>
                  </div>
                  <Progress
                    value={s.pct}
                    className="h-2 bg-gray-800"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
