'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users2,
  UserCheck,
  CalendarDays,
  DollarSign,
  Plus,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format, isFuture, isToday } from 'date-fns';
import { useCRM } from '@/contexts/crm-context';
import { useOrgFormat } from '@/hooks/use-org-format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import type { Payment, PaymentMethod } from '@/types';

const STATUS_COLOR_MAP: Record<string, string> = {
  blue: 'bg-primary/20 text-primary border-primary/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const APPT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-primary/20 text-primary',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-destructive/20 text-destructive/80',
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
  const { formatCurrency } = useOrgFormat();

  // ── Payments fetch ───────────────────────────────────────────────────────

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const [payRes, methodsRes] = await Promise.all([
          fetch('/api/v1/payments'),
          fetch('/api/v1/payment-methods'),
        ]);
        const payJson = await payRes.json();
        if (payJson.success && Array.isArray(payJson.data)) {
          setPayments(payJson.data);
        } else if (Array.isArray(payJson)) {
          setPayments(payJson);
        }
        const methodsJson = await methodsRes.json();
        const methodsData = (methodsJson?.data ?? methodsJson) as PaymentMethod[];
        if (Array.isArray(methodsData)) {
          setPaymentMethods(methodsData);
        }
      } catch {
        // best-effort
      }
    }
    void fetchPayments();
  }, []);

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

  const monthlyRevenue = payments
    .filter(
      (p) =>
        p.status === 'completed' &&
        new Date(p.paidAt) >= currentMonthStart,
    )
    .reduce((sum, p) => sum + p.amount, 0);

  const prevMonthRevenue = payments
    .filter(
      (p) =>
        p.status === 'completed' &&
        new Date(p.paidAt) >= prevMonthStart &&
        new Date(p.paidAt) <= prevMonthEnd,
    )
    .reduce((sum, p) => sum + p.amount, 0);

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
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Lead
        </Button>
        <Button
          onClick={() => router.push('/appointments')}
          variant="outline"
          className="border-border text-foreground/90 hover:bg-accent gap-2"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Button>
        <Button
          onClick={() => router.push('/clients')}
          variant="outline"
          className="border-border text-foreground/90 hover:bg-accent gap-2"
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
          iconColor="bg-primary/20 text-primary"
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
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(monthlyRevenue)}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  revenueTrend >= 0 ? 'text-emerald-400' : 'text-destructive/80',
                )}
              >
                {revenueTrend >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                )}
                {revenueTrend >= 0 ? '+' : ''}
                {revenueTrend.toFixed(1)}%
              </span>
              <p className="text-xs text-muted-foreground">recorded payments</p>
            </div>
            {/* Revenue breakdown by method */}
            {(() => {
              const completedPayments = payments.filter(
                (p) => p.status === 'completed' && new Date(p.paidAt) >= currentMonthStart,
              );
              const methodTotals = new Map<string, number>();
              for (const p of completedPayments) {
                const methodId = p.paymentMethodId ?? '__unknown__';
                methodTotals.set(methodId, (methodTotals.get(methodId) ?? 0) + p.amount);
              }
              if (methodTotals.size === 0) return null;
              const maxAmount = Math.max(...methodTotals.values(), 1);
              return (
                <div className="mt-3 space-y-1.5">
                  {Array.from(methodTotals.entries()).map(([methodId, amt]) => {
                    const method = paymentMethods.find((m) => m.id === methodId);
                    const pct = (amt / maxAmount) * 100;
                    return (
                      <div key={methodId} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-16 truncate" title={method?.name ?? methodId}>
                          {method?.name ?? (methodId === '__unknown__' ? 'Other' : methodId)}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-foreground/90 w-16 text-right font-medium">
                          {formatCurrency(amt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-foreground text-base">Recent Leads</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/leads')}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 text-xs"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs">Name</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">
                    Value
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-6"
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
                        className="border-border hover:bg-accent/50"
                      >
                        <TableCell className="py-3">
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {lead.firstName} {lead.lastName}
                            </p>
                            {lead.company && (
                              <p className="text-xs text-muted-foreground">
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
                        <TableCell className="py-3 text-right text-sm text-foreground/90">
                          {lead.value != null
                            ? formatCurrency(lead.value)
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
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-foreground text-base">
              Upcoming Appointments
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/appointments')}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 text-xs"
            >
              View all
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">
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
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {client
                            ? `${client.firstName} ${client.lastName}`
                            : 'Unknown client'}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-base">
            Lead Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalLeads === 0 ? (
            <p className="text-muted-foreground text-sm">No leads to display.</p>
          ) : (
            <div className="space-y-3">
              {statusDistribution.map((s) => (
                <div key={s.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/90">{s.name}</span>
                    <span className="text-muted-foreground">
                      {s.count} lead{s.count !== 1 ? 's' : ''} &middot; {s.pct}%
                    </span>
                  </div>
                  <Progress
                    value={s.pct}
                    className="h-2 bg-muted"
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
