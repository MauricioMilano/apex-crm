'use client';

import { useState } from 'react';
import { Plus, Pencil, Star, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { LeadStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { reorderLeadStatus } from '@/actions/lead-statuses';

type LeadStatusForm = { name: string; color: string; isDefault: boolean };

const COLORS = [
  'blue',
  'yellow',
  'green',
  'purple',
  'emerald',
  'red',
  'orange',
  'gray',
  'pink',
  'indigo',
] as const;

const emptyForm = (): LeadStatusForm => ({
  name: '',
  color: 'blue',
  isDefault: false,
});

export default function LeadStatusesPage() {
  const { leadStatuses, leads, addLeadStatus, updateLeadStatus, deleteLeadStatus, resetToMockData } = useCRM();
  const currentUser = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<LeadStatus | null>(null);
  const [form, setForm] = useState<LeadStatusForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(status: LeadStatus) {
    setEditing(status);
    setForm({
      name: status.name,
      color: status.color,
      isDefault: status.isDefault,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Status name is required');
      return;
    }
    const orgId = currentUser?.organizationId ?? '';
    if (editing) {
      // Task 4.4: If isDefault toggled on, unset all other statuses first
      if (form.isDefault && !editing.isDefault) {
        await Promise.all(
          leadStatuses
            .filter((s) => s.id !== editing.id)
            .map((s) =>
              fetch(`/api/v1/lead-statuses/${s.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isDefault: false }),
              }),
            ),
        );
      }
      await updateLeadStatus(editing.id, {
        name: form.name.trim(),
        color: form.color,
        isDefault: form.isDefault,
      });
      toast.success('Status updated');
    } else {
      const maxOrder = leadStatuses.length > 0
        ? Math.max(...leadStatuses.map((s) => s.order))
        : 0;
      addLeadStatus({
        organizationId: orgId,
        name: form.name.trim(),
        color: form.color,
        order: form.isDefault ? 1 : maxOrder + 1,
        isDefault: form.isDefault,
      });
      toast.success('Status created');
    }
    setDialogOpen(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteLeadStatus(deleteId);
      toast.success('Status deleted');
      setDeleteId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete status');
    }
  }

  const sortedStatuses = [...leadStatuses].sort((a, b) => a.order - b.order);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lead Statuses</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage the stages of your sales pipeline.
            </p>
          </div>
          <Button
            onClick={openAdd}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Status
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Color</TableHead>
                <TableHead className="text-muted-foreground">Default</TableHead>
                <TableHead className="text-muted-foreground">Lead Count</TableHead>
                <TableHead className="text-muted-foreground">Order</TableHead>
                <TableHead className="text-muted-foreground w-16">Reorder</TableHead>
                <TableHead className="text-muted-foreground w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStatuses.length === 0 && (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground/80 py-10"
                  >
                    No lead statuses yet. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
              {sortedStatuses.map((status, index) => {
                const leadCount = leads.filter(
                  (lead) => lead.statusId === status.id
                ).length;
                const hasLeads = leadCount > 0;
                const isOnlyStatus = sortedStatuses.length === 1;
                const isDisabled = hasLeads || isOnlyStatus;
                const tooltipText = hasLeads
                  ? `Cannot delete — ${leadCount} leads reference this status`
                  : 'At least one status is required';

                return (
                  <TableRow
                    key={status.id}
                    className="border-border hover:bg-accent/50"
                  >
                    <TableCell>
                      <p className="text-foreground font-medium">{status.name}</p>
                    </TableCell>
                    <TableCell>
                      <span
                        className="inline-flex h-4 w-4 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                    </TableCell>
                    <TableCell>
                      {status.isDefault && (
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{leadCount}</TableCell>
                    <TableCell className="text-muted-foreground">{status.order}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          disabled={index === 0}
                          onClick={async () => {
                            const result = await reorderLeadStatus({ statusId: status.id, direction: 'up' });
                            if (result.success) {
                              await resetToMockData();
                            }
                          }}
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          disabled={index === sortedStatuses.length - 1}
                          onClick={async () => {
                            const result = await reorderLeadStatus({ statusId: status.id, direction: 'down' });
                            if (result.success) {
                              await resetToMockData();
                            }
                          }}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(status)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive/80"
                              disabled={isDisabled}
                              onClick={() => setDeleteId(status.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{tooltipText}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-card border-border text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Edit Status' : 'Add Status'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="bg-muted border-border text-foreground focus:border-primary"
                  placeholder="e.g. New Lead"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className={`h-7 w-7 rounded-full border-2 transition-colors ${
                        form.color === color
                          ? 'border-white'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color} color`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="isDefault"
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
                  className="data-[state=checked]:bg-primary"
                />
                <Label htmlFor="isDefault" className="text-muted-foreground cursor-pointer">
                  Set as default
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                {editing ? 'Save Changes' : 'Create Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent className="bg-card border-border text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Status</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This will permanently delete the lead status. This action cannot be undone.
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
    </TooltipProvider>
  );
}
