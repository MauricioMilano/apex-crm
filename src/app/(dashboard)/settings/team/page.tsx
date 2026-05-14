'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import { useCurrentUser } from '@/hooks/use-current-user';
import { inviteTeamMember, regenerateInviteToken } from '@/actions/settings';
import type { User, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';

type InviteForm = {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

type InviteResult = {
  email: string;
  inviteUrl: string;
};

function emptyInvite(): InviteForm {
  return { email: '', firstName: '', lastName: '', role: 'employee' };
}

export default function TeamPage() {
  const { users, updateUser, deleteUser, resetToMockData } = useCRM();
  const currentUser = useCurrentUser();
  const teamMembers = users.filter((u) => u.role === 'admin' || u.role === 'employee');

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<InviteForm>(emptyInvite());
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [editingRole, setEditingRole] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleInvite() {
    if (!invite.email.trim()) {
      toast.error('Email is required');
      return;
    }
    const orgId = currentUser?.organizationId;
    if (!orgId) {
      toast.error('Could not determine organization');
      return;
    }
    const result = await inviteTeamMember({
      organizationId: orgId,
      email: invite.email.trim(),
      firstName: invite.firstName.trim() || 'New',
      lastName: invite.lastName.trim() || 'Member',
      role: invite.role,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setInviteResult({ email: result.data.email, inviteUrl: result.data.inviteUrl });
    setInvite(emptyInvite());
    resetToMockData();
  }

  async function handleCopyInvite(userId: string) {
    setCopiedId(userId);
    const result = await regenerateInviteToken(userId);
    if (!result.success) {
      toast.error(result.error);
      setCopiedId(null);
      return;
    }
    await navigator.clipboard.writeText(result.data.inviteUrl);
    toast.success('Invite link copied!');
    setCopiedId(null);
    resetToMockData();
  }

  function handleRoleChange(userId: string, role: UserRole) {
    updateUser(userId, { role });
    setEditingRole(null);
    toast.success('Role updated');
  }

  function handleToggleActive(user: User) {
    updateUser(user.id, { isActive: !user.isActive });
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteUser(deleteId);
    toast.success('Member removed');
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your team members and their working hours.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Email</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.length === 0 && (
              <TableRow className="border-border">
                <TableCell colSpan={5} className="text-center text-muted-foreground/80 py-10">
                  No team members yet.
                </TableCell>
              </TableRow>
            )}
            {teamMembers.map((user) => (
              <>
                <TableRow key={user.id} className="border-border hover:bg-accent/50">
                  <TableCell className="text-foreground font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {editingRole === user.id ? (
                      <Select
                        value={user.role}
                        onValueChange={(v) => handleRoleChange(user.id, v as UserRole)}
                      >
                        <SelectTrigger className="bg-muted border-border text-foreground h-8 w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-muted border-border">
                          <SelectItem value="admin" className="text-foreground focus:bg-accent">Admin</SelectItem>
                          <SelectItem value="employee" className="text-foreground focus:bg-accent">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <button
                        onClick={() => setEditingRole(user.id)}
                        className="group flex items-center gap-1"
                      >
                        <Badge
                          variant="outline"
                          className={
                            user.role === 'admin'
                              ? 'border-purple-500/50 text-purple-400'
                              : 'border-primary/50 text-primary'
                          }
                        >
                          {user.role}
                        </Badge>
                        <Pencil className="h-3 w-3 text-muted-foreground group-hover:text-muted-foreground" />
                      </button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={() => handleToggleActive(user)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {!user.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-muted-foreground hover:text-primary"
                          onClick={() => handleCopyInvite(user.id)}
                          disabled={copiedId === user.id}
                        >
                          {copiedId === user.id ? '...' : 'Copy Invite'}
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive/80"
                        onClick={() => setDeleteId(user.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteResult(null); }}>
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          {inviteResult ? (
            <>
              <DialogHeader>
                <DialogTitle>Invite Sent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-sm text-muted-foreground">
                  Share this link with <strong>{inviteResult.email}</strong> to let them join your organization:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="bg-muted border-border text-foreground text-xs"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    size="sm"
                    className="shrink-0"
                    onClick={async () => {
                      await navigator.clipboard.writeText(inviteResult.inviteUrl);
                      toast.success('Invite link copied!');
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This link expires in 7 days. The new member will set their own password.
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => { setInviteOpen(false); setInviteResult(null); }}>
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">First Name</Label>
                    <Input
                      value={invite.firstName}
                      onChange={(e) => setInvite((f) => ({ ...f, firstName: e.target.value }))}
                      className="bg-muted border-border text-foreground focus:border-primary"
                      placeholder="Jane"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Last Name</Label>
                    <Input
                      value={invite.lastName}
                      onChange={(e) => setInvite((f) => ({ ...f, lastName: e.target.value }))}
                      className="bg-muted border-border text-foreground focus:border-primary"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email *</Label>
                  <Input
                    type="email"
                    value={invite.email}
                    onChange={(e) => setInvite((f) => ({ ...f, email: e.target.value }))}
                    className="bg-muted border-border text-foreground focus:border-primary"
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Role</Label>
                  <Select
                    value={invite.role}
                    onValueChange={(v) => setInvite((f) => ({ ...f, role: v as UserRole }))}
                  >
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      <SelectItem value="admin" className="text-foreground focus:bg-accent">Admin</SelectItem>
                      <SelectItem value="employee" className="text-foreground focus:bg-accent">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setInviteOpen(false)} className="text-muted-foreground">
                  Cancel
                </Button>
                <Button onClick={handleInvite} className="bg-primary hover:bg-primary/90">
                  Add Member
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently remove this team member. This action cannot be undone.
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
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
