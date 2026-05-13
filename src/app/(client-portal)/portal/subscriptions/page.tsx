'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCRM } from '@/contexts/crm-context';
import { useOrgFormat } from '@/hooks/use-org-format';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { CreditCard, XCircle, CalendarDays, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-gray-100 text-gray-600 border-gray-200',
};

interface SubscriptionWithPlan {
  id: string;
  clientId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  appointmentsUsed: number;
  plan?: {
    id: string;
    name: string;
    price: number;
    description?: string;
    billingPeriod: string;
    maxApptsPerPeriod?: number;
  };
}

export default function ClientPortalSubscriptionsPage() {
  const { currentUser } = useAuth();
  const { clients } = useCRM();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { formatDate } = useOrgFormat();

  const client = useMemo(
    () => clients.find((c) => c.email?.toLowerCase() === currentUser?.email?.toLowerCase()),
    [clients, currentUser],
  );

  const fetchSubscriptions = useCallback(async () => {
    if (!client?.id) return;
    try {
      const res = await fetch(`/api/v1/clients/${client.id}/subscriptions`);
      const json = await res.json();
      if (json.success) setSubscriptions(json.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [client?.id]);

  useEffect(() => { void fetchSubscriptions(); }, [fetchSubscriptions]);

  async function handleCancel() {
    if (!cancelId) return;
    try {
      const res = await fetch(`/api/v1/client-subscriptions/${cancelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Subscription cancelled');
      setCancelId(null);
      await fetchSubscriptions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel');
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Subscriptions</h1>
        <p className="text-gray-500 mt-1">Manage your active and past subscription plans.</p>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center py-12">Loading subscriptions...</p>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No subscriptions yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Ask your provider to assign a plan to get started.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/portal/plans')}
            >
              View Available Plans
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const isActive = sub.status === 'active';
            const maxPerPeriod = sub.plan?.maxApptsPerPeriod;
            const usagePercent = maxPerPeriod
              ? Math.round((sub.appointmentsUsed / maxPerPeriod) * 100)
              : 0;

            return (
              <Card key={sub.id} className="overflow-hidden">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-5 w-5 text-blue-600 shrink-0" />
                        <h3 className="font-semibold text-gray-900">
                          {sub.plan?.name ?? 'Unknown Plan'}
                        </h3>
                        <Badge className={cn('text-xs border', STATUS_STYLES[sub.status] ?? '')}>
                          {sub.status}
                        </Badge>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                          ${sub.plan ? Number(sub.plan.price).toFixed(2) : '-'} / {sub.plan?.billingPeriod ?? '-'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(sub.currentPeriodStart)} –{' '}
                          {formatDate(sub.currentPeriodEnd)}
                        </span>
                        {sub.endDate && (
                          <span className="flex items-center gap-1.5 text-red-500">
                            Ended {formatDate(sub.endDate)}
                          </span>
                        )}
                      </div>

                      {/* Usage bar */}
                      {isActive && maxPerPeriod && (
                        <div className="space-y-1 max-w-md">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Period usage</span>
                            <span className={cn(
                              'font-medium',
                              usagePercent >= 80 ? 'text-red-500' : 'text-gray-700',
                            )}>
                              {sub.appointmentsUsed} / {maxPerPeriod} appointments
                            </span>
                          </div>
                          <Progress
                            value={usagePercent}
                            className={cn(
                              'h-2',
                              usagePercent >= 80 ? '[&>div]:bg-red-500' : '',
                            )}
                          />
                        </div>
                      )}

                      {isActive && !maxPerPeriod && (
                        <p className="text-xs text-gray-400">
                          Unlimited appointments this period
                        </p>
                      )}

                      {/* Expandable services */}
                      <button
                        onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                      >
                        {expandedId === sub.id ? 'Hide details' : 'Show details'}
                      </button>

                      {expandedId === sub.id && sub.plan && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                          <p className="font-medium text-gray-700 mb-1">Plan Details</p>
                          {sub.plan.description && (
                            <p className="text-xs text-gray-500 mb-2">{sub.plan.description}</p>
                          )}
                          <p>Billing: <span className="text-gray-800 capitalize font-medium">{sub.plan.billingPeriod}</span></p>
                          <p>
                            Limit:{' '}
                            <span className="text-gray-800 font-medium">
                              {sub.plan.maxApptsPerPeriod
                                ? `${sub.appointmentsUsed} of ${sub.plan.maxApptsPerPeriod} used`
                                : 'Unlimited'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelId(sub.id)}
                        className="text-red-500 border-red-200 hover:bg-red-50 shrink-0"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this subscription? You will lose access to
              plan-covered services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700">
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
