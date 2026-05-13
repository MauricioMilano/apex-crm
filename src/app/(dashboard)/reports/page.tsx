'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Download,
  PieChart,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useOrgFormat } from '@/hooks/use-org-format';
import type { Payment, PaymentMethod } from '@/types';

const ITEMS_PER_PAGE = 20;

const PIE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
];

export default function ReportsPage() {
  const { formatCurrency } = useOrgFormat();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState(() =>
    format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  );
  const [dateTo, setDateTo] = useState(() =>
    format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  );
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [page, setPage] = useState(0);

  // Fetch payments and methods
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (methodFilter !== 'all') params.set('paymentMethodId', methodFilter);

      const [payRes, methodsRes] = await Promise.all([
        fetch(`/api/v1/payments?${params}`),
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
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, methodFilter]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Filter by type
  const filteredPayments = useMemo(() => {
    let result = payments;
    if (typeFilter !== 'all') {
      result = result.filter((p) => p.referenceType === typeFilter);
    }
    return result;
  }, [payments, typeFilter]);

  const revenuePayments = useMemo(
    () => filteredPayments.filter((p) => p.status === 'completed'),
    [filteredPayments],
  );

  const totalRevenue = useMemo(
    () => revenuePayments.reduce((sum, p) => sum + p.amount, 0),
    [revenuePayments],
  );

  const totalPaymentsCount = revenuePayments.length;
  const averagePayment = totalPaymentsCount > 0 ? totalRevenue / totalPaymentsCount : 0;

  // Pagination
  const pageCount = Math.ceil(filteredPayments.length / ITEMS_PER_PAGE);
  const pagePayments = filteredPayments.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  // Monthly chart data
  const chartData = useMemo(() => {
    if (payments.length === 0) return [];
    const monthMap = new Map<string, { appointment: number; subscription: number }>();
    for (const p of payments) {
      if (p.status !== 'completed') continue;
      const monthKey = format(parseISO(p.paidAt), 'yyyy-MM');
      const entry = monthMap.get(monthKey) ?? { appointment: 0, subscription: 0 };
      if (p.referenceType === 'appointment') {
        entry.appointment += p.amount;
      } else if (p.referenceType === 'subscription') {
        entry.subscription += p.amount;
      }
      monthMap.set(monthKey, entry);
    }
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, values]) => ({
        month: format(parseISO(`${month}-01`), 'MMM yy'),
        Appointments: values.appointment,
        Subscriptions: values.subscription,
      }));
  }, [payments]);

  // Distribution by payment method (pie chart)
  const methodDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of revenuePayments) {
      const methodId = p.paymentMethodId ?? '__unknown__';
      map.set(methodId, (map.get(methodId) ?? 0) + p.amount);
    }
    return Array.from(map.entries()).map(([methodId, amount]) => {
      const method = paymentMethods.find((m) => m.id === methodId);
      return {
        name: method?.name ?? (methodId === '__unknown__' ? 'Unknown' : methodId),
        value: Math.round(amount * 100) / 100,
      };
    });
  }, [revenuePayments, paymentMethods]);

  // Installments receivable
  const receivables = useMemo(() => {
    return payments
      .filter((p) => p.status === 'completed' && p.installments > 1)
      .map((p) => {
        const remaining = p.installments - 1; // First was "paid" at completion
        const perInstallment = p.amount / p.installments;
        const projectedRemaining = perInstallment * remaining;
        const method = paymentMethods.find((m) => m.id === p.paymentMethodId);
        return {
          ...p,
          methodName: method?.name ?? 'Unknown',
          perInstallment: Math.round(perInstallment * 100) / 100,
          remaining,
          projectedRemaining: Math.round(projectedRemaining * 100) / 100,
        };
      });
  }, [payments, paymentMethods]);

  // CSV export
  const handleExportCSV = useCallback(() => {
    const headers = ['paidAt', 'referenceType', 'referenceId', 'amount', 'currency', 'status', 'paymentMethod', 'installments', 'cardLastFour', 'description'];
    const rows = filteredPayments.map((p) => {
      const pWithMethod = p as Payment & { paymentMethod?: { name: string } };
      return headers.map((h) => {
        if (h === 'paymentMethod') return JSON.stringify(pWithMethod.paymentMethod?.name ?? '');
        return JSON.stringify((p as unknown as Record<string, unknown>)[h] ?? '');
      }).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredPayments, dateFrom, dateTo]);

  // Previous period comparison
  const prevPeriodRevenue = useMemo(() => {
    const rangeDays =
      dateFrom && dateTo
        ? (new Date(dateTo).getTime() - new Date(dateFrom).getTime())
        : 30 * 24 * 60 * 60 * 1000;
    const prevFrom = new Date(new Date(dateFrom).getTime() - rangeDays);
    const prevTo = new Date(new Date(dateTo).getTime() - rangeDays);
    return payments
      .filter(
        (p) =>
          p.status === 'completed' &&
          new Date(p.paidAt) >= prevFrom &&
          new Date(p.paidAt) <= prevTo,
      )
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, dateFrom, dateTo]);

  const revenueTrend =
    prevPeriodRevenue > 0
      ? ((totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100
      : totalRevenue > 0
        ? 100
        : 0;

  // Method name helper
  function getMethodName(p: Payment): string {
    const pm = paymentMethods.find((m) => m.id === p.paymentMethodId);
    return pm?.name ?? '';
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Financial Reports</h1>
        <Button
          onClick={handleExportCSV}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">Type</Label>
              <Select
                value={typeFilter}
                onValueChange={(v) => {
                  setTypeFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="appointment">Appointments</SelectItem>
                  <SelectItem value="subscription">Subscriptions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-gray-400 text-xs">Payment Method</Label>
              <Select
                value={methodFilter}
                onValueChange={(v) => {
                  setMethodFilter(v);
                  setPage(0);
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-40">
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">All methods</SelectItem>
                  {paymentMethods.filter((m) => m.isActive).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Payments
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : totalPaymentsCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              Average Payment
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : formatCurrency(averagePayment)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">
              vs Previous Period
            </CardTitle>
            <div className={cn(
              'p-2 rounded-lg',
              revenueTrend >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400',
            )}>
              {revenueTrend >= 0
                ? <TrendingUp className="h-4 w-4" />
                : <TrendingDown className="h-4 w-4" />
              }
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : `${revenueTrend >= 0 ? '+' : ''}${revenueTrend.toFixed(1)}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No payment data available.</p>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{
                        background: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="Appointments"
                      stackId="a"
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="Subscriptions"
                      stackId="a"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribution by method (pie chart) */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-gray-400" />
              Revenue by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {methodDistribution.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No payment data available.</p>
            ) : (
              <div className="h-72 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={methodDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {methodDistribution.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Installments Receivable */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Installments Receivable</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {receivables.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No installment receivables.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-500 text-xs">Date</TableHead>
                  <TableHead className="text-gray-500 text-xs">Method</TableHead>
                  <TableHead className="text-gray-500 text-xs">Total</TableHead>
                  <TableHead className="text-gray-500 text-xs">Per Installment</TableHead>
                  <TableHead className="text-gray-500 text-xs">Remaining</TableHead>
                  <TableHead className="text-gray-500 text-xs">Projected Receivable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivables.map((r) => (
                  <TableRow key={r.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="py-3 text-sm text-gray-300">
                      {format(parseISO(r.paidAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-300">
                      {r.methodName}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-white font-medium">
                      {formatCurrency(r.amount)}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-300">
                      {formatCurrency(r.perInstallment)}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-300">
                      {r.remaining}/{r.installments}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-yellow-400 font-medium">
                      {formatCurrency(r.projectedRemaining)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-500 text-xs">Date</TableHead>
                <TableHead className="text-gray-500 text-xs">Description</TableHead>
                <TableHead className="text-gray-500 text-xs">Method</TableHead>
                <TableHead className="text-gray-500 text-xs">Type</TableHead>
                <TableHead className="text-gray-500 text-xs">Amount</TableHead>
                <TableHead className="text-gray-500 text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-600 py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : pagePayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-600 py-6">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                pagePayments.map((p) => (
                  <TableRow key={p.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="py-3 text-sm text-gray-300">
                      {format(parseISO(p.paidAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-white">
                      {p.description || `${p.referenceType} payment`}
                    </TableCell>
                    <TableCell className="py-3 text-sm text-gray-400">
                      {getMethodName(p) || '—'}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        p.referenceType === 'appointment'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-emerald-500/20 text-emerald-400',
                      )}>
                        {p.referenceType}
                      </span>
                    </TableCell>
                    <TableCell className={cn(
                      'py-3 text-sm font-medium',
                      p.amount < 0 ? 'text-red-400' : 'text-gray-100',
                    )}>
                      {p.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(p.amount))}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        p.status === 'completed' && 'bg-green-500/20 text-green-400',
                        p.status === 'refunded' && 'bg-red-500/20 text-red-400',
                        p.status === 'adjusted' && 'bg-gray-500/20 text-gray-400',
                        p.status === 'pending' && 'bg-yellow-500/20 text-yellow-400',
                        p.status === 'failed' && 'bg-red-500/20 text-red-400',
                      )}>
                        {p.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
              <span className="text-sm text-gray-500">
                Page {page + 1} of {pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="border-gray-700 text-gray-300"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pageCount - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="border-gray-700 text-gray-300"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
