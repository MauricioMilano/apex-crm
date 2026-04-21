'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import type { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';

type ServiceForm = {
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
};

const emptyForm = (): ServiceForm => ({
  name: '',
  description: '',
  duration: 60,
  price: 0,
  isActive: true,
});

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useCRM();
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
      price: svc.price,
      isActive: svc.isActive,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (editing) {
      updateService(editing.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        duration: form.duration,
        price: form.price,
        isActive: form.isActive,
      });
      toast.success('Service updated');
    } else {
      addService({
        organizationId: 'org_1',
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        duration: form.duration,
        price: form.price,
        isActive: form.isActive,
      });
      toast.success('Service created');
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteService(deleteId);
    toast.success('Service deleted');
    setDeleteId(null);
  }

  function toggleActive(svc: Service) {
    updateService(svc.id, { isActive: !svc.isActive });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Services</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage the services you offer to clients.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <div className="rounded-lg border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-400">Name</TableHead>
              <TableHead className="text-gray-400">Duration</TableHead>
              <TableHead className="text-gray-400">Price</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
              <TableHead className="text-gray-400 w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 && (
              <TableRow className="border-gray-800">
                <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                  No services yet. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {services.map((svc) => (
              <TableRow key={svc.id} className="border-gray-800 hover:bg-gray-800/50">
                <TableCell>
                  <div>
                    <p className="text-gray-100 font-medium">{svc.name}</p>
                    {svc.description && (
                      <p className="text-gray-500 text-xs mt-0.5 truncate max-w-xs">
                        {svc.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-300">{svc.duration} min</TableCell>
                <TableCell className="text-gray-300">${svc.price.toFixed(2)}</TableCell>
                <TableCell>
                  <Switch
                    checked={svc.isActive}
                    onCheckedChange={() => toggleActive(svc)}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-gray-100"
                      onClick={() => openEdit(svc)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-gray-400 hover:text-red-400"
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
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Service' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                placeholder="e.g. Hair Cut"
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
                <Label className="text-gray-300">Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration: Math.max(1, Number(e.target.value)) }))
                  }
                  className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                />
              </div>
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
            </div>
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
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editing ? 'Save Changes' : 'Create Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete the service. This action cannot be undone.
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
