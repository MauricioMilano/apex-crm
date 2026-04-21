'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin, Star } from 'lucide-react';
import { useCRM } from '@/contexts/crm-context';
import type { Location } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
];

type LocationForm = {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
};

const emptyForm = (): LocationForm => ({
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  timezone: 'America/New_York',
});

const DEFAULT_LOC_KEY = 'crm_default_location';

export default function LocationsPage() {
  const { locations, addLocation, updateLocation, deleteLocation } = useCRM();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form, setForm] = useState<LocationForm>(emptyForm());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [defaultId, setDefaultId] = useState<string>(() => {
    try {
      return localStorage.getItem(DEFAULT_LOC_KEY) ?? locations[0]?.id ?? '';
    } catch {
      return locations[0]?.id ?? '';
    }
  });

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing(loc);
    setForm({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      timezone: (loc as Location & { timezone?: string }).timezone ?? 'America/New_York',
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    if (editing) {
      updateLocation(editing.id, {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
      });
      toast.success('Location updated');
    } else {
      const loc = addLocation({
        organizationId: 'org_1',
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        zip: form.zip.trim(),
        isActive: true,
      });
      if (locations.length === 0) {
        setDefault(loc.id);
      }
      toast.success('Location added');
    }
    setDialogOpen(false);
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteLocation(deleteId);
    if (defaultId === deleteId) {
      const remaining = locations.filter((l) => l.id !== deleteId);
      if (remaining[0]) setDefault(remaining[0].id);
    }
    toast.success('Location deleted');
    setDeleteId(null);
  }

  function setDefault(id: string) {
    setDefaultId(id);
    try {
      localStorage.setItem(DEFAULT_LOC_KEY, id);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Locations</h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your business locations.
          </p>
        </div>
        <Button onClick={openAdd} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          No locations yet. Add one to get started.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {locations.map((loc) => (
          <Card key={loc.id} className="bg-gray-900 border-gray-800">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-blue-600/15 p-2">
                    <MapPin className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-100">{loc.name}</p>
                      {loc.id === defaultId && (
                        <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">{loc.address}</p>
                    <p className="text-sm text-gray-400">
                      {loc.city}, {loc.state} {loc.zip}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-gray-100"
                    onClick={() => openEdit(loc)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-red-400"
                    onClick={() => setDeleteId(loc.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {loc.id !== defaultId && (
                <button
                  onClick={() => setDefault(loc.id)}
                  className="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors"
                >
                  <Star className="h-3 w-3" />
                  Set as default
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                placeholder="Main Office"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1 space-y-2">
                <Label className="text-gray-300">City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                  placeholder="NY"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">ZIP</Label>
                <Input
                  value={form.zip}
                  onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))}
                  className="bg-gray-800 border-gray-700 text-gray-100 focus:border-blue-500"
                  placeholder="10001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Timezone</Label>
              <Select
                value={form.timezone}
                onValueChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz} className="text-gray-100 focus:bg-gray-700">
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {editing ? 'Save Changes' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete this location. This action cannot be undone.
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
