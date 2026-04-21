'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/crm-context';
import { ClientForm } from '@/components/clients/client-form';
import { Client, AppointmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Tag,
  Calendar,
  FileText,
  User,
  StickyNote,
  Plus,
  Download,
  File,
  Image,
  FileSpreadsheet,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
  no_show: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

// ─── Mock files ────────────────────────────────────────────────────────────────

const MOCK_FILES = [
  { id: '1', name: 'Contract_2026.pdf', size: '248 KB', type: 'pdf', date: '2026-01-15' },
  { id: '2', name: 'Invoice_Q1.xlsx', size: '82 KB', type: 'xlsx', date: '2026-03-31' },
  { id: '3', name: 'Proposal_v2.pdf', size: '1.2 MB', type: 'pdf', date: '2026-02-10' },
  { id: '4', name: 'Logo_Assets.png', size: '430 KB', type: 'image', date: '2025-12-05' },
];

function FileIcon({ type }: { type: string }) {
  if (type === 'image') return <Image className="h-5 w-5 text-blue-400" />;
  if (type === 'xlsx') return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
  return <FileText className="h-5 w-5 text-orange-400" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { clients, appointments, services, updateClient, deleteClient } =
    useCRM();

  const client = useMemo(
    () => clients.find((c) => c.id === params.id),
    [clients, params.id],
  );

  const clientAppointments = useMemo(
    () => appointments.filter((a) => a.clientId === params.id),
    [appointments, params.id],
  );

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Notes state — initialise from client.notes if present
  const [noteInput, setNoteInput] = useState('');
  const [notesHistory, setNotesHistory] = useState<
    { text: string; date: string }[]
  >(() => {
    if (client && client.notes) {
      return [{ text: client.notes, date: client.createdAt }];
    }
    return [];
  });

  if (!client) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <p className="mt-8 text-center text-muted-foreground">
          Client not found.
        </p>
      </div>
    );
  }

  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName[0]}${client.lastName[0]}`.toUpperCase();
  const avatarColor = getAvatarColor(fullName);

  function handleEditSubmit(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    updateClient(client!.id, data);
    setEditOpen(false);
  }

  function handleDelete() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    deleteClient(client!.id);
    router.push('/clients');
  }

  function handleAddNote() {
    const text = noteInput.trim();
    if (!text) return;
    setNotesHistory((prev) => [
      { text, date: new Date().toISOString() },
      ...prev,
    ]);
    setNoteInput('');
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback
                className={`${avatarColor} text-white font-bold text-base`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold">{fullName}</h1>
              {client.company && (
                <p className="text-sm text-muted-foreground">{client.company}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/appointments/new?clientId=${client.id}`)
            }
          >
            <Calendar className="h-4 w-4 mr-1" />
            Book Appointment
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <Calendar className="h-4 w-4 mr-1.5" />
            Appointments
            {clientAppointments.length > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary text-[10px] rounded-full px-1.5 py-0.5">
                {clientAppointments.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="files">
            <FileText className="h-4 w-4 mr-1.5" />
            Files
          </TabsTrigger>
          <TabsTrigger value="notes">
            <StickyNote className="h-4 w-4 mr-1.5" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Info */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground text-xs">Client Since</p>
                    <p>{format(new Date(client.createdAt), 'MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        client.isActive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-gray-500/20 text-gray-400',
                      )}
                    >
                      {client.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tags.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {client.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Info */}
            {(client.address || client.city || client.zip) && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Billing Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  {client.address && <p>{client.address}</p>}
                  <p>
                    {[client.city, client.state, client.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Notes preview */}
            {client.notes && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <StickyNote className="h-4 w-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {client.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Appointments ── */}
        <TabsContent value="appointments" className="mt-4">
          {clientAppointments.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No appointments yet.</p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() =>
                  router.push(`/appointments/new?clientId=${client.id}`)
                }
              >
                <Plus className="h-4 w-4 mr-1" />
                Book Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {clientAppointments
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.startTime).getTime() -
                    new Date(a.startTime).getTime(),
                )
                .map((appt) => {
                  const service = services.find((s) => s.id === appt.serviceId);
                  return (
                    <Card key={appt.id} className="bg-card border-border">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {service?.name ?? 'Service'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(appt.startTime),
                                'MMM d, yyyy · h:mm a',
                              )}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={APPOINTMENT_STATUS_STYLES[appt.status]}
                        >
                          {appt.status.replace('_', ' ')}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        {/* ── Files ── */}
        <TabsContent value="files" className="mt-4">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Upload File
              </Button>
            </div>
            {MOCK_FILES.map((file) => (
              <Card key={file.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <FileIcon type={file.type} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.size} · Uploaded{' '}
                        {format(new Date(file.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Notes ── */}
        <TabsContent value="notes" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-3">
              <Textarea
                placeholder="Add a note..."
                rows={3}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddNote} disabled={!noteInput.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          {notesHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No notes yet.
            </p>
          ) : (
            <div className="space-y-3">
              {notesHistory.map((note, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.date), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{fullName}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
