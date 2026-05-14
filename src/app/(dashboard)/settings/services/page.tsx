'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Service } from '@/types';
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
import { toast } from 'sonner';

type ServiceForm = {
  name: string;
  description: string;
  duration: number;
  price: number;
  requiresPrepayment: boolean;
  interestRate: string;
  isActive: boolean;
};

function formatServicePrice(price: number | string) {
  const value = Number(price);
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

const emptyForm = (): ServiceForm => ({
  name: '',
  description: '',
  duration: 60,
  price: 0,
  requiresPrepayment: false,
  interestRate: '',
  isActive: true,
});

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useCRM();
  const currentUser = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(svc: Service) {
    setEditing(svc);
    setForm({
      name: svc.name,
      description: svc.description ?? '',
      duration: svc.duration,
      price: Number(svc.price),
      requiresPrepayment: svc.requiresPrepayment,
      interestRate: svc.interestRate != null ? String(svc.interestRate) : '',
      isActive: svc.isActive,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    const interestValue = form.interestRate.trim() ? Number(form.interestRate.trim()) : undefined;
    if (editing) {
      updateService(editing.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        duration: form.duration,
        price: form.price,
        requiresPrepayment: form.requiresPrepayment,
        interestRate: interestValue,
        isActive: form.isActive,
      });
      toast.success('Service updated');
    } else {
      addService({
        organizationId: currentUser?.organizationId ?? '',
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        duration: form.duration,
        price: form.price,
        requiresPrepayment: form.requiresPrepayment,
        interestRate: interestValue,
        isActive: form.isActive,
      });
      toast.success('Service created');
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteService(deleteId);
      toast.success('Service deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete service');
    }
  }

  function toggleActive(svc: Service) {
    updateService(svc.id, { isActive: !svc.isActive });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Services</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the services you offer to clients.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 && (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center text-muted-foreground/80 py-10">
                  No services yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {services.map((svc) => (
              <TableRow key={svc.id} className="border-border hover:bg-accent/50">
                <TableCell>
                  <div>
                    <p className="text-foreground font-medium">{svc.name}</p>
                    {svc.description && (
                      <p className="text-muted-foreground/80 text-xs mt-0.5 truncate max-w-xs">
                        {svc.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{svc.duration} min</TableCell>
                <TableCell className="text-muted-foreground">${formatServicePrice(svc.price)}</TableCell>
                <TableCell>
                  <Switch
                    checked={svc.isActive}
                    onCheckedChange={() => toggleActive(svc)}
                     className="data-[state=checked]:bg-primary"
                   />
                 </TableCell>
                 <TableCell>
                   <div className="flex items-center gap-1">
                     <Button
                       size="icon"
                       variant="ghost"
                       className="h-8 w-8 text-muted-foreground hover:text-foreground"
                       onClick={() => openEdit(svc)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive/80"
                      onClick={() => setDeleteId(svc.id)}
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
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-muted border-border text-foreground focus:border-primary"
                placeholder="e.g. Hair Cut"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-muted border-border text-foreground focus:border-primary resize-none"
                placeholder="Optional description"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))
                  }
                  className="bg-muted border-border text-foreground focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Math.max(0, Number(e.target.value)) }))
                  }
                  className="bg-muted border-border text-foreground focus:border-primary"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Interest Rate (% per month)</Label>
              <Input
                type="number"
                min={0}
                step={0.1}
                value={form.interestRate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interestRate: e.target.value }))
                }
                placeholder="Leave empty to use org default"
                className="bg-muted border-border text-foreground focus:border-primary"
              />
              <p className="text-xs text-muted-foreground/80">Used for installment calculations. Overrides organization default.</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="requiresPrepayment"
                checked={form.requiresPrepayment}
                onCheckedChange={(v) => setForm((f) => ({ ...f, requiresPrepayment: v }))}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="requiresPrepayment" className="text-muted-foreground cursor-pointer">
                Requires Prepayment
              </Label>
            </div>
            <div className="text-xs text-muted-foreground/80 -mt-2">
              When enabled, the booking flow will ask for payment method and installments.
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="isActive" className="text-muted-foreground cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {editing ? 'Save Changes' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete the service. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
