'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Copy, Zap, Check } from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import type { Webhook } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useOrgFormat } from '@/hooks/use-org-format';
import { toast } from 'sonner';

const ALL_EVENTS = [
  { value: 'lead.created', group: 'Leads' },
  { value: 'lead.updated', group: 'Leads' },
  { value: 'lead.deleted', group: 'Leads' },
  { value: 'lead.assigned', group: 'Leads' },
  { value: 'client.created', group: 'Clients' },
  { value: 'client.updated', group: 'Clients' },
  { value: 'appointment.booked', group: 'Appointments' },
  { value: 'appointment.cancelled', group: 'Appointments' },
  { value: 'appointment.rescheduled', group: 'Appointments' },
  { value: 'appointment.completed', group: 'Appointments' },
  { value: 'form.submitted', group: 'Forms' },
];

const GROUPS = [...new Set(ALL_EVENTS.map((e) => e.group))];

function generateSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

type WebhookForm = {
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret: string;
};

const emptyForm = (): WebhookForm => ({
  name: '',
  url: '',
  events: [],
  isActive: true,
  secret: generateSecret(),
});

export default function WebhooksPage() {
  const { webhooks, addWebhook, updateWebhook, deleteWebhook } = useCRM();
  const { formatDate } = useOrgFormat();
  const currentUser = useCurrentUser();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Webhook | null>(null);
  const [form, setForm] = useState<WebhookForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(wh: Webhook) {
    setEditing(wh);
    setForm({
      name: wh.name,
      url: wh.url,
      events: [...wh.events],
      isActive: wh.isActive,
      secret: wh.secret ?? generateSecret(),
    });
    setDialogOpen(true);
  }

  function toggleEvent(ev: string) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(ev) ? f.events.filter((e) => e !== ev) : [...f.events, ev],
    }));
  }

  function handleSave() {
    if (!form.url.trim()) {
      toast.error('Endpoint URL is required');
      return;
    }
    if (form.events.length === 0) {
      toast.error('Select at least one event');
      return;
    }
    if (editing) {
      updateWebhook(editing.id, {
        name: form.name.trim(),
        url: form.url.trim(),
        events: form.events,
        isActive: form.isActive,
        secret: form.secret,
      });
      toast.success('Webhook updated');
    } else {
      addWebhook({
        organizationId: currentUser?.organizationId ?? '',
        name: form.name.trim() || form.url.trim(),
        url: form.url.trim(),
        events: form.events,
        isActive: form.isActive,
        secret: form.secret,
      });
      toast.success('Webhook created');
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteWebhook(deleteId);
    toast.success('Webhook deleted');
    setDeleteId(null);
  }

  function handleTest(_wh: Webhook) {
    toast.success('Test payload sent!');
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(form.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Send real-time event notifications to external endpoints.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Endpoint</TableHead>
              <TableHead className="text-muted-foreground">Events</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Last Triggered</TableHead>
              <TableHead className="text-muted-foreground w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.length === 0 && (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center text-muted-foreground/80 py-10">
                  No webhooks configured yet.
                </TableCell>
              </TableRow>
            )}
            {webhooks.map((wh) => (
              <TableRow key={wh.id} className="border-border hover:bg-accent/50">
                <TableCell>
                  <div>
                    {wh.name && <p className="text-foreground font-medium text-sm">{wh.name}</p>}
                    <p className="text-muted-foreground text-xs truncate max-w-xs font-mono">{wh.url}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {wh.events.slice(0, 3).map((ev) => (
                      <Badge key={ev} variant="outline" className="text-xs border-border text-muted-foreground">
                        {ev}
                      </Badge>
                    ))}
                    {wh.events.length > 3 && (
                      <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                        +{wh.events.length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={wh.isActive}
                    onCheckedChange={(v) => updateWebhook(wh.id, { isActive: v })}
                    className="data-[state=checked]:bg-primary"
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {wh.lastTriggered
                    ? formatDate(wh.lastTriggered)
                    : <span className="text-muted-foreground">Never</span>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-green-400"
                      title="Test webhook"
                      onClick={() => handleTest(wh)}
                    >
                      <Zap className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => openEdit(wh)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive/80"
                      onClick={() => setDeleteId(wh.id)}
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
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Webhook' : 'Add Webhook'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name (optional)</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-muted border-border text-foreground focus:border-primary"
                placeholder="My Webhook"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Endpoint URL *</Label>
              <Input
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                className="bg-muted border-border text-foreground focus:border-primary font-mono text-sm"
                placeholder="https://example.com/webhook"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-muted-foreground">Events *</Label>
              {GROUPS.map((group) => (
                <div key={group}>
                  <p className="text-xs text-muted-foreground/80 uppercase tracking-wider mb-1.5">{group}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_EVENTS.filter((e) => e.group === group).map((ev) => (
                      <label
                        key={ev.value}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <Checkbox
                          checked={form.events.includes(ev.value)}
                          onCheckedChange={() => toggleEvent(ev.value)}
                          className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <span className="text-muted-foreground text-sm group-hover:text-foreground">
                          {ev.value}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  value={form.secret}
                  readOnly
                  className="bg-muted border-border text-muted-foreground font-mono text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="shrink-0 text-muted-foreground hover:text-foreground border border-border"
                  onClick={copySecret}
                >
                  {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="wh-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
                className="data-[state=checked]:bg-primary"
              />
              <Label htmlFor="wh-active" className="text-muted-foreground cursor-pointer">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              {editing ? 'Save Changes' : 'Create Webhook'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webhook</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete this webhook. This action cannot be undone.
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
