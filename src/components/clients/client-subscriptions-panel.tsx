'use client';

import { useState, useEffect, useCallback } from 'react';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { CreditCard, XCircle, Plus, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrgFormat } from '@/hooks/use-org-format';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan, ClientSubscription, Payment } from '@/types';

interface SubWithPlan extends ClientSubscription {
  plan?: SubscriptionPlan;
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function ClientSubscriptionsPanel({ clientId }: { clientId: string }) {
  const [subscriptions, setSubscriptions] = useState<SubWithPlan[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatDate } = useOrgFormat();

  const fetchData = useCallback(async () => {
    try {
      const [subsRes, plansRes] = await Promise.all([
        fetch(`/api/v1/clients/${clientId}/subscriptions`),
        fetch('/api/v1/subscription-plans'),
      ]);
      const subsJson = await subsRes.json();
      const plansJson = await plansRes.json();
      if (subsJson.success) setSubscriptions(subsJson.data);
      if (plansJson.success) setPlans(plansJson.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleAssign() {
    if (!selectedPlanId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/v1/clients/${clientId}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Plan assigned');
      setSelectedPlanId('');
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign plan');
    }
    setAssigning(false);
  }

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
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel');
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400 py-4">Loading subscriptions...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Assign new plan */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Assign a Plan
              </label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue placeholder="Select a plan..." />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                  {plans
                    .filter((p) => p.isActive)
                    .map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} — ${Number(plan.price).toFixed(2)}/{plan.billingPeriod}
                      </SelectItem>
                    ))}
                  {plans.filter((p) => p.isActive).length === 0 && (
                    <div className="px-2 py-4 text-sm text-gray-500 text-center">
                      No active plans available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAssign}
              disabled={!selectedPlanId || assigning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions list */}
      {subscriptions.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No subscriptions yet. Assign a plan above.
        </p>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-blue-400 shrink-0" />
                      <span className="font-medium text-gray-100">
                        {sub.plan?.name ?? 'Unknown Plan'}
                      </span>
                      <Badge
                        variant="outline"
                        className={STATUS_STYLES[sub.status] ?? ''}
                      >
                        {sub.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-gray-400 mb-3">
                      <span>
                        Period: {formatDate(sub.currentPeriodStart)} –{' '}
                        {formatDate(sub.currentPeriodEnd)}
                      </span>
                      <span>
                        Price: ${sub.plan ? Number(sub.plan.price).toFixed(2) : '-'}
                      </span>
                      {sub.plan?.billingPeriod && (
                        <span className="capitalize">{sub.plan.billingPeriod}</span>
                      )}
                    </div>

                    {/* Usage bar */}
                    {sub.plan?.maxApptsPerPeriod && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Usage</span>
                          <span className="text-gray-300">
                            {sub.appointmentsUsed} / {sub.plan.maxApptsPerPeriod}
                          </span>
                        </div>
                        <Progress
                          value={
                            (sub.appointmentsUsed / sub.plan.maxApptsPerPeriod) * 100
                          }
                          className="h-1.5"
                        />
                      </div>
                    )}

                    {/* Payment history */}
                    <SubscriptionPaymentHistory subscriptionId={sub.id} />
                  </div>

                  {sub.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCancelId(sub.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will cancel the subscription immediately. The client will lose access
              to plan-covered services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              Keep Active
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel Subscription
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Small inline component showing payment history for a subscription */
function SubscriptionPaymentHistory({ subscriptionId }: { subscriptionId: string }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    async function fetchPayments() {
      try {
        const res = await fetch(
          `/api/v1/payments?referenceType=subscription&referenceId=${subscriptionId}`,
        );
        const json = await res.json();
        const data = (json?.data ?? json) as Payment[];
        setPayments(Array.isArray(data) ? data : []);
      } catch {
        // best-effort
      }
      setLoading(false);
    }
    void fetchPayments();
  }, [open, subscriptionId]);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
      >
        <DollarSign className="h-3 w-3" />
        Payment History
        {open ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          {loading ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : payments.length === 0 ? (
            <p className="text-xs text-gray-500">No payment records</p>
          ) : (
            payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between py-1 px-2 rounded bg-gray-800/50"
              >
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-[10px] px-1 py-0.5 rounded font-medium',
                    p.status === 'completed' && 'bg-green-500/20 text-green-400',
                    p.status === 'refunded' && 'bg-red-500/20 text-red-400',
                    p.status === 'adjusted' && 'bg-gray-500/20 text-gray-400',
                  )}>
                    {p.status}
                  </span>
                  {p.description && (
                    <span className="text-[11px] text-gray-500 truncate max-w-[140px]">
                      {p.description}
                    </span>
                  )}
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  p.amount < 0 ? 'text-red-400' : 'text-gray-200',
                )}>
                  {p.amount < 0 ? '-' : ''}$${Math.abs(p.amount).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
