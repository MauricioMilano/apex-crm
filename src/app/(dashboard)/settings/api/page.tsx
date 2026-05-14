'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const ALL_PERMISSIONS = [
  { value: 'read:leads', label: 'Read Leads' },
  { value: 'write:leads', label: 'Write Leads' },
  { value: 'read:clients', label: 'Read Clients' },
  { value: 'write:clients', label: 'Write Clients' },
  { value: 'read:appointments', label: 'Read Appointments' },
  { value: 'write:appointments', label: 'Write Appointments' },
];

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return 'crm_' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 8) + '••••••••••••' + key.slice(-4);
}

type CreateForm = {
  name: string;
  permissions: string[];
};

const emptyForm = (): CreateForm => ({
  name: '',
  permissions: [],
});

export default function ApiKeysPage() {
  const { apiKeys, addApiKey, deleteApiKey } = useCRM();
  const { formatDate } = useOrgFormat();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(emptyForm());

  // After key creation, show the full key once
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [newKeyCopied, setNewKeyCopied] = useState(false);

  const [revokeId, setRevokeId] = useState<string | null>(null);

  function togglePermission(p: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  }

  function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Key name is required');
      return;
    }
    if (form.permissions.length === 0) {
      toast.error('Select at least one permission');
      return;
    }
    const fullKey = generateApiKey();
    addApiKey({
      organizationId: 'org_1',
      name: form.name.trim(),
      key: maskKey(fullKey),
      permissions: form.permissions,
      isActive: true,
    });
    setNewKeyValue(fullKey);
    setNewKeyCopied(false);
    setCreateOpen(false);
    setForm(emptyForm());
  }

  async function copyNewKey() {
    if (!newKeyValue) return;
    try {
      await navigator.clipboard.writeText(newKeyValue);
      setNewKeyCopied(true);
      setTimeout(() => setNewKeyCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  function handleRevoke() {
    if (!revokeId) return;
    deleteApiKey(revokeId);
    toast.success('API key revoked');
    setRevokeId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage API keys for programmatic access.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* New key reveal banner */}
      {newKeyValue && (
        <div className="rounded-lg border border-green-600/40 bg-green-600/10 p-4">
          <p className="text-green-400 text-sm font-semibold mb-1">
            API key created — copy it now, it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 text-xs text-green-300 font-mono bg-card rounded px-3 py-2 break-all">
              {newKeyValue}
            </code>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 border border-green-600/40 text-green-400 hover:text-green-300"
              onClick={copyNewKey}
            >
              {newKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <button
            onClick={() => setNewKeyValue(null)}
            className="text-xs text-muted-foreground/80 hover:text-muted-foreground mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Key</TableHead>
              <TableHead className="text-muted-foreground">Permissions</TableHead>
              <TableHead className="text-muted-foreground">Created</TableHead>
              <TableHead className="text-muted-foreground">Last Used</TableHead>
              <TableHead className="text-muted-foreground w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.length === 0 && (
              <TableRow className="border-border">
                <TableCell colSpan={6} className="text-center text-muted-foreground/80 py-10">
                  No API keys yet.
                </TableCell>
              </TableRow>
            )}
            {apiKeys.map((k) => (
              <TableRow key={k.id} className="border-border hover:bg-accent/50">
                <TableCell className="text-foreground font-medium">{k.name}</TableCell>
                <TableCell>
                  <code className="text-muted-foreground text-xs font-mono">{k.key}</code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {k.permissions.map((p) => (
                      <Badge
                        key={p}
                        variant="outline"
                        className="text-xs border-border text-muted-foreground"
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(k.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {k.lastUsed
                    ? formatDate(k.lastUsed)
                    : <span className="text-muted-foreground">Never</span>}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-muted-foreground hover:text-destructive/80 text-xs"
                    onClick={() => setRevokeId(k.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Key Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-muted border-border text-foreground focus:border-primary"
                placeholder="My Integration"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-muted-foreground">Permissions *</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_PERMISSIONS.map((p) => (
                  <label key={p.value} className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox
                      checked={form.permissions.includes(p.value)}
                      onCheckedChange={() => togglePermission(p.value)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="text-muted-foreground text-sm group-hover:text-foreground">
                      {p.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90">
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeId} onOpenChange={(o) => !o && setRevokeId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently revoke this API key. Any integrations using it will stop
              working. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-muted-foreground hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
