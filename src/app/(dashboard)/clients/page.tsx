'use client';

import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/crm-context';
import { ClientList } from '@/components/clients/client-list';
import { ClientForm } from '@/components/clients/client-form';
import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Users, UserCheck, UserPlus } from 'lucide-react';
import { isThisMonth } from 'date-fns';

export default function ClientsPage() {
  const { clients, addClient, updateClient, deleteClient } = useCRM();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  const stats = useMemo(() => {
    const total = clients.length;
    const active = clients.filter((c) => c.isActive).length;
    const newThisMonth = clients.filter((c) =>
      isThisMonth(new Date(c.createdAt)),
    ).length;
    return { total, active, newThisMonth };
  }, [clients]);

  function handleNew() {
    setEditingClient(null);
    setDialogOpen(true);
  }

  function handleEdit(client: Client) {
    setEditingClient(client);
    setDialogOpen(true);
  }

  function handleSubmit(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    if (editingClient) {
      updateClient(editingClient.id, data);
    } else {
      addClient(data);
    }
    setDialogOpen(false);
    setEditingClient(null);
  }

  function handleConfirmDelete() {
    if (deletingClient) {
      deleteClient(deletingClient.id);
      setDeletingClient(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Clients</h1>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <UserCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active Clients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <UserPlus className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
              <p className="text-xs text-muted-foreground">New This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientList
        clients={clients}
        onNew={handleNew}
        onEdit={handleEdit}
        onDelete={(c) => setDeletingClient(c)}
      />

      {/* New/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Client' : 'New Client'}
            </DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editingClient ?? undefined}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deletingClient}
        onOpenChange={(o) => !o && setDeletingClient(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>
                {deletingClient?.firstName} {deletingClient?.lastName}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
