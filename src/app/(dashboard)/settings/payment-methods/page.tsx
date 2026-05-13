'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { PaymentMethod } from '@/types';
import { Button } from '@/components/ui/button';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PaymentMethodForm } from '@/components/settings/payment-method-form';
import { toast } from 'sonner';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function fetchMethods() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/payment-methods?includeInactive=true');
      const json = await res.json();
      const data = (json?.data ?? json) as PaymentMethod[];
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchMethods();
  }, []);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(method: PaymentMethod) {
    setEditing(method);
    setDialogOpen(true);
  }

  async function handleSave(data: { name: string; code: string; requiresDocs: boolean }) {
    try {
      if (editing) {
        const res = await fetch(`/api/v1/payment-methods/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        toast.success('Payment method updated');
      } else {
        const res = await fetch('/api/v1/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, isActive: true }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        toast.success('Payment method created');
      }
      setDialogOpen(false);
      void fetchMethods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/v1/payment-methods/${deleteId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success('Payment method deleted');
      setDeleteId(null);
      void fetchMethods();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Payment Methods</h1>
        <Button
          onClick={openAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Method
        </Button>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-500 text-xs">Name</TableHead>
              <TableHead className="text-gray-500 text-xs">Code</TableHead>
              <TableHead className="text-gray-500 text-xs">Requires Docs</TableHead>
              <TableHead className="text-gray-500 text-xs">Status</TableHead>
              <TableHead className="text-gray-500 text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                  Loading...
                </TableCell>
              </TableRow>
            ) : methods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                  No payment methods yet.
                </TableCell>
              </TableRow>
            ) : (
              methods.map((method) => (
                <TableRow key={method.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell className="text-gray-100 font-medium">{method.name}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">
                      {method.code}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className={method.requiresDocs ? 'text-blue-400' : 'text-gray-500'}>
                      {method.requiresDocs ? 'Yes' : 'No'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        method.isActive
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }
                    >
                      {method.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-gray-100"
                        onClick={() => openEdit(method)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-red-400"
                        onClick={() => setDeleteId(method.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <PaymentMethodForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Method</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete this payment method. Existing payments using
              this method will not be affected.
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
