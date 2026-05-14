'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useCRM } from '@/contexts/crm-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanWithServices {
  id: string;
  name: string;
  description?: string;
  price: number;
  billingPeriod: string;
  maxApptsPerPeriod?: number;
  isActive: boolean;
  services?: { serviceId: string; serviceName: string; maxPerPeriod?: number }[];
}

export default function ClientPortalPlansPage() {
  const { currentUser } = useAuth();
  const { clients } = useCRM();
  const [plans, setPlans] = useState<PlanWithServices[]>([]);
  const [clientSubIds, setClientSubIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  const client = useMemo(
    () => clients.find((c) => c.email?.toLowerCase() === currentUser?.email?.toLowerCase()),
    [clients, currentUser],
  );

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, subsRes] = await Promise.all([
        fetch('/api/v1/subscription-plans'),
        client?.id ? fetch(`/api/v1/clients/${client.id}/subscriptions`) : Promise.resolve(null),
      ]);
      const plansJson = await plansRes.json();
      if (plansJson.success) setPlans(plansJson.data);

      if (subsRes) {
        const subsJson = await subsRes.json();
        if (subsJson.success) {
          setClientSubIds(
            subsJson.data
              .filter((s: { status: string }) => s.status === 'active')
              .map((s: { planId: string }) => s.planId),
          );
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [client?.id]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  async function handleSubscribe(planId: string) {
    if (!client?.id) {
      toast.error('Please complete your profile first');
      return;
    }
    setSubscribing(planId);
    try {
      const res = await fetch(`/api/v1/clients/${client.id}/subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Subscribed successfully!');
      await fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to subscribe');
    }
    setSubscribing(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-muted-foreground text-center py-12">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Available Plans</h1>
        <p className="text-muted-foreground mt-1">
          Choose a subscription plan that works for you.
        </p>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">No plans available yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for available subscription plans.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isSubscribed = clientSubIds.includes(plan.id);
            return (
              <Card
                key={plan.id}
                className={cn(
                  'flex flex-col transition-shadow hover:shadow-md',
                  isSubscribed && 'border-primary/30 bg-primary/5',
                )}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription>{plan.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-foreground">
                      ${Number(plan.price).toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1 capitalize">
                      /{plan.billingPeriod}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground mb-6 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {plan.maxApptsPerPeriod
                        ? `${plan.maxApptsPerPeriod} appointments per period`
                        : 'Unlimited appointments'}
                    </div>
                    {plan.services && plan.services.length > 0 && (
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground/80">Included services:</span>
                          <ul className="mt-1 space-y-0.5">
                            {plan.services.map((s) => (
                              <li key={s.serviceId} className="text-muted-foreground">
                                {s.serviceName}
                                {s.maxPerPeriod && ` (max ${s.maxPerPeriod}/period)`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  {isSubscribed ? (
                    <Badge className="self-center bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing === plan.id}
                      className="w-full"
                    >
                      {subscribing === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Subscribe
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
