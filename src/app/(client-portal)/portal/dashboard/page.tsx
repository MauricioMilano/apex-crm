'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, parseISO, isPast, isFuture } from 'date-fns';
import { useAuth } from '@/contexts/auth-context';
import { useCRM } from '@/contexts/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CalendarDays,
  Clock,
  User,
  Plus,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppointmentStatus } from '@/types';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  completed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  no_show:   'bg-gray-100 text-gray-600 border-gray-200',
};

export default function ClientPortalDashboardPage() {
  const { currentUser } = useAuth();
  const { clients, appointments, services, users } = useCRM();
  const router = useRouter();

  const client = useMemo(
    () => clients.find((c) => c.email?.toLowerCase() === currentUser?.email?.toLowerCase()),
    [clients, currentUser],
  );

  const clientAppointments = useMemo(
    () => (client ? appointments.filter((a) => a.clientId === client.id) : []),
    [appointments, client],
  );

  const upcoming = useMemo(
    () =>
      clientAppointments
        .filter((a) => isFuture(parseISO(a.startTime)) && a.status !== 'cancelled')
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .slice(0, 3),
    [clientAppointments],
  );

  const past = useMemo(
    () => clientAppointments.filter((a) => isPast(parseISO(a.endTime))),
    [clientAppointments],
  );

  const profileCompletion = useMemo(() => {
    if (!client) return 0;
    const fields = [
      client.firstName,
      client.lastName,
      client.email,
      client.phone,
      client.address,
      client.city,
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  }, [client]);

  const recentActivity = useMemo(
    () =>
      [...clientAppointments]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4),
    [clientAppointments],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {currentUser?.firstName}!
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { value: upcoming.length, label: 'Upcoming' },
          { value: past.length, label: 'Past Sessions' },
          {
            value: clientAppointments.filter((a) => a.status === 'completed').length,
            label: 'Completed',
          },
          { value: `${profileCompletion}%`, label: 'Profile' },
        ].map(({ value, label }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Upcoming Appointments</CardTitle>
                <CardDescription>Your next scheduled sessions</CardDescription>
              </div>
              <Button size="sm" onClick={() => router.push('/portal/book')}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Book
              </Button>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No upcoming appointments</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push('/portal/book')}
                  >
                    Book your first appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((appt) => {
                    const svc = services.find((s) => s.id === appt.serviceId);
                    const emp = users.find((u) => u.id === appt.employeeId);
                    const start = parseISO(appt.startTime);
                    return (
                      <div
                        key={appt.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CalendarDays className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 text-sm">
                              {svc?.name}
                            </span>
                            <Badge
                              className={cn(
                                'text-xs border',
                                STATUS_COLORS[appt.status],
                              )}
                            >
                              {appt.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {format(start, 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(start, 'h:mm a')}
                            </span>
                            {emp && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {emp.firstName} {emp.lastName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Link
                    href="/portal/appointments"
                    className="block text-sm text-blue-600 hover:text-blue-700 text-center pt-1"
                  >
                    View all appointments →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((appt) => {
                    const svc = services.find((s) => s.id === appt.serviceId);
                    const isCompleted = appt.status === 'completed';
                    const isCancelled = appt.status === 'cancelled';
                    return (
                      <div key={appt.id} className="flex items-center gap-3">
                        <div
                          className={cn(
                            'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0',
                            isCompleted
                              ? 'bg-green-100'
                              : isCancelled
                              ? 'bg-red-100'
                              : 'bg-blue-100',
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : isCancelled ? (
                            <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          ) : (
                            <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 text-sm">
                          <span className="text-gray-700">
                            {svc?.name} —{' '}
                            <span
                              className={cn(
                                'font-medium',
                                isCompleted
                                  ? 'text-green-600'
                                  : isCancelled
                                  ? 'text-red-500'
                                  : 'text-blue-600',
                              )}
                            >
                              {appt.status}
                            </span>
                          </span>
                          <div className="text-xs text-gray-400">
                            {format(parseISO(appt.startTime), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile completion */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">{profileCompletion}%</span>
              </div>
              <Progress value={profileCompletion} className="h-2" />
              {profileCompletion < 100 && (
                <p className="text-xs text-gray-500">
                  Complete your profile for a better experience.
                </p>
              )}
              <Link href="/portal/profile">
                <Button variant="outline" size="sm" className="w-full mt-1">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Update Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={() => router.push('/portal/book')}>
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/portal/appointments')}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                My Appointments
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/portal/profile')}
              >
                <User className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Past summary */}
          {past.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Past Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Total sessions</span>
                    <span className="font-medium text-gray-900">{past.length}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Completed</span>
                    <span className="font-medium text-green-600">
                      {past.filter((a) => a.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cancelled</span>
                    <span className="font-medium text-red-500">
                      {past.filter((a) => a.status === 'cancelled').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
