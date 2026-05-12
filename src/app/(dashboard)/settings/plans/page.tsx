'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { SubscriptionPlan, BillingPeriod, Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type PlanForm = {
  name: string;
  description: string;
  price: number;
  billingPeriod: BillingPeriod;
  maxApptsPerPeriod: number | null;
  isActive: boolean;
  serviceIds: string[];
};

const emptyForm = (): PlanForm => ({
  name: '',
  description: '',
  price: 0,
  billingPeriod: 'monthly',
  maxApptsPerPeriod: null,
  isActive: true,
  serviceIds: [],
});

const BILLING_LABELS: Record<BillingPeriod, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semi-Annual',
  annual: 'Annual',
};

function formatPrice(price: number | string) {
  const value = Number(price);
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export default function PlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/subscription-plans?includeInactive=true');
      const json = await res.json();
      if (json.success) setPlans(json.data);
    } catch { /* ignore */ }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/services?includeInactive=true');
      const json = await res.json();
      if (json.success) setServices(json.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchPlans(), fetchServices()]).finally(() => setLoading(false));
  }, [fetchPlans, fetchServices]);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(plan: SubscriptionPlan & { services?: { serviceId: string }[] }) {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      price: Number(plan.price),
      billingPeriod: plan.billingPeriod,
      maxApptsPerPeriod: plan.maxApptsPerPeriod ?? null,
      isActive: plan.isActive,
      serviceIds: (plan as unknown as { services?: { serviceId: string }[] }).services?.map(s => s.serviceId) ?? [],
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Plan name is required');
      return;
    }

    try {
      if (editing) {
        const res = await fetch(`/api/v1/subscription-plans/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: form.price,
            billingPeriod: form.billingPeriod,
            maxApptsPerPeriod: form.maxApptsPerPeriod || undefined,
            isActive: form.isActive,
            serviceIds: form.serviceIds,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        toast.success('Plan updated');
      } else {
        const res = await fetch('/api/v1/subscription-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: form.price,
            billingPeriod: form.billingPeriod,
            maxApptsPerPeriod: form.maxApptsPerPeriod || undefined,
            isActive: form.isActive,
            serviceIds: form.serviceIds,
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        toast.success('Plan created');
      }
      setDialogOpen(false);
      await fetchPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save plan');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/v1/subscription-plans/${deleteId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error);
        return;
      }
      toast.success('Plan deleted');
      setDeleteId(null);
      await fetchPlans();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete plan');
    }
  }

  function toggleService(serviceId: string) {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(serviceId)
        ? f.serviceIds.filter((id) => id !== serviceId)
        : [...f.serviceIds, serviceId],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading plans...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Subscription Plans</h1>
          <p className="text-gray-400 text-sm mt-1">
            Create and manage subscription plans for your clients.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Plan
        </Button>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Price</TableHead>
              <TableHead className="text-gray-400">Billing</TableHead>
              <TableHead className="text-gray-400">Limit</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400 w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 && (
              <TableRow className="border-gray-800">
                <TableCell colSpan={6} className="text-center text-gray-500 py-10">
                  No plans yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
            {plans.map((plan) => (
              <TableRow key={plan.id} className="border-gray-800 hover:bg-gray-800/50">
                <TableCell>
                  <div>
                    <p className="text-gray-100 font-medium">{plan.name}</p>
                    {plan.description && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">
                        {plan.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">${formatPrice(plan.price)}</TableCell>
                <TableCell className="text-gray-300">
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                    {BILLING_LABELS[plan.billingPeriod]}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-300">
                  {plan.maxApptsPerPeriod ? `${plan.maxApptsPerPeriod}/period` : 'Unlimited'}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={async (v) => {
                      await fetch(`/api/v1/subscription-plans/${plan.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isActive: v }),
                      });
                      await fetchPlans();
                    }}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-gray-100"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-red-400"
                      onClick={() => setDeleteId(plan.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                placeholder="e.g. Premium"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500 resize-none"
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Math.max(0, Number(e.target.value)) }))
                  }
                  className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Billing Period</Label>
                <Select
                  value={form.billingPeriod}
                  onValueChange={(v: BillingPeriod) => setForm((f) => ({ ...f, billingPeriod: v }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-gray-100">
                    {Object.entries(BILLING_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Max Appointments Per Period{' '}
                <span className="text-gray-500 text-xs">(leave empty for unlimited)</span>
              </Label>
              <Input
                type="number"
                min={1}
                value={form.maxApptsPerPeriod ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxApptsPerPeriod: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                placeholder="Unlimited"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Label htmlFor="isActive" className="text-gray-300 cursor-pointer">
                  Active
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Included Services</Label>
              <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto border border-gray-800 rounded-lg p-2">
                {services.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No services available. Create services first.
                  </p>
                )}
                {services.map((svc) => (
                  <label
                    key={svc.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={form.serviceIds.includes(svc.id)}
                      onChange={() => toggleService(svc.id)}
                      className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200">{svc.name}</p>
                      <p className="text-xs text-gray-500">{svc.duration} min — ${formatPrice(svc.price)}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editing ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plan</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the plan. If clients have active subscriptions under this plan,
              deletion will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
