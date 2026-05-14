'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/contexts/crm-context';
import { useOrgFormat } from '@/hooks/use-org-format';
import { LeadForm } from '@/components/leads/lead-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Separator } from '@/components/ui/separator';
import { Lead } from '@/types';
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserCheck,
  Mail,
  Phone,
  Building2,
  Tag,
  DollarSign,
  Calendar,
  User,
  StickyNote,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLOR_MAP: Record<string, string> = {
  blue: 'bg-primary/20 text-primary border-primary/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  gray: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

const SOURCE_COLORS: Record<string, string> = {
  form: 'bg-primary/20 text-primary border-primary/30',
  manual: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  import: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  referral: 'bg-green-500/20 text-green-400 border-green-500/30',
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="text-sm text-foreground/90 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    leads,
    leadStatuses,
    users,
    updateLead,
    deleteLead,
    addClient,
  } = useCRM();
  const { formatCurrency, formatDate } = useOrgFormat();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const lead = leads.find((l) => l.id === id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);

  const sortedStatuses = useMemo(
    () => [...leadStatuses].sort((a, b) => a.order - b.order),
    [leadStatuses],
  );

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground text-lg">Lead not found</p>
        <Button
          variant="outline"
          onClick={() => router.push('/leads')}
          className="border-border text-foreground/90 hover:bg-accent"
        >
          Back to Leads
        </Button>
      </div>
    );
  }

  const status = leadStatuses.find((s) => s.id === lead.statusId);
  const assignedUser = users.find((u) => u.id === lead.assignedTo);
  const assignedInitials = assignedUser
    ? `${assignedUser.firstName?.[0] ?? ''}${assignedUser.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : null;
  const isConverted = !!lead.convertedToClientId;

  const handleEditSubmit = (
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    void updateLead(lead.id, data);
    setEditOpen(false);
  };

  const handleDelete = () => {
    void deleteLead(lead.id);
    router.push('/leads');
  };

  const handleStatusChange = (statusId: string) => {
    void updateLead(lead.id, { statusId });
  };

  const handleConvertToClient = async () => {
    const newClient = await addClient({
      organizationId: lead.organizationId,
      locationId: lead.locationId,
      assignedTo: lead.assignedTo,
      leadId: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      notes: lead.notes,
      tags: lead.tags,
      isActive: true,
    });
    await updateLead(lead.id, { convertedToClientId: newClient.id });
    setConvertOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + actions row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/leads')}
          className="text-muted-foreground hover:text-foreground hover:bg-accent -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Leads
        </Button>
        <div className="flex items-center gap-2">
          {!isConverted && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConvertOpen(true)}
              className="border-emerald-700 text-emerald-400 hover:bg-emerald-900/30"
            >
              <UserCheck className="h-4 w-4 mr-1.5" />
              Convert to Client
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="border-border text-foreground/90 hover:bg-accent"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="border-red-900 text-destructive/80 hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Lead header card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lead.firstName} {lead.lastName}
            </h1>
            {lead.company && (
              <p className="text-muted-foreground mt-1">{lead.company}</p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {status && (
                <Badge
                  variant="outline"
                  className={cn(
                    STATUS_COLOR_MAP[status.color] ??
                      'bg-gray-500/20 text-gray-400 border-gray-500/30',
                  )}
                >
                  {status.name}
                </Badge>
              )}
              {lead.source && (
                <Badge
                  variant="outline"
                  className={cn(
                    SOURCE_COLORS[lead.source] ??
                      'bg-gray-500/20 text-gray-400 border-gray-500/30',
                  )}
                >
                  {lead.source}
                </Badge>
              )}
              {isConverted && (
                <Badge
                  variant="outline"
                  className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                >
                  <UserCheck className="h-3 w-3 mr-1" />
                  Converted
                </Badge>
              )}
            </div>
          </div>

          {/* Quick status change */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">Change Status</p>
            <Select value={lead.statusId} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-44 bg-muted border-border text-foreground/90 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {sortedStatuses.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact info */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider">
            Contact Information
          </h2>
          <Separator className="bg-muted" />
          <div className="space-y-3.5">
            {lead.email && (
              <DetailRow icon={Mail} label="Email" value={lead.email} />
            )}
            {lead.phone && (
              <DetailRow icon={Phone} label="Phone" value={lead.phone} />
            )}
            {lead.company && (
              <DetailRow
                icon={Building2}
                label="Company"
                value={lead.company}
              />
            )}
            {lead.value != null && (
              <DetailRow
                icon={DollarSign}
                label="Deal Value"
                value={
                  <span className="text-emerald-400 font-medium">
                    {formatCurrency(lead.value)}
                  </span>
                }
              />
            )}
          </div>
        </div>

        {/* Lead details */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider">
            Lead Details
          </h2>
          <Separator className="bg-muted" />
          <div className="space-y-3.5">
            <DetailRow
              icon={User}
              label="Assigned To"
              value={
                assignedUser ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[9px] bg-primary text-foreground">
                        {assignedInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span>
                      {assignedUser.firstName} {assignedUser.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )
              }
            />
            <DetailRow
              icon={Calendar}
              label="Created"
              value={formatDate(lead.createdAt)}
            />
            <DetailRow
              icon={Calendar}
              label="Last Updated"
              value={formatDate(lead.updatedAt)}
            />
            {lead.tags.length > 0 && (
              <DetailRow
                icon={Tag}
                label="Tags"
                value={
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {lead.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-5 bg-muted/50 text-muted-foreground border-border"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                }
              />
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground/90 uppercase tracking-wider flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Notes
        </h2>
        <Separator className="bg-muted" />
        {lead.notes ? (
          <p className="text-foreground/90 text-sm whitespace-pre-wrap leading-relaxed">
            {lead.notes}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">No notes added yet.</p>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Lead</DialogTitle>
          </DialogHeader>
          <LeadForm
            lead={lead}
            leadStatuses={sortedStatuses}
            users={users}
            onSubmit={handleEditSubmit}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Lead
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete{' '}
              <span className="text-foreground/90 font-medium">
                {lead.firstName} {lead.lastName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground/90 hover:bg-accent">
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

      {/* Convert to client confirmation */}
      <AlertDialog open={convertOpen} onOpenChange={setConvertOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Convert to Client
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will create a new client record for{' '}
              <span className="text-foreground/90 font-medium">
                {lead.firstName} {lead.lastName}
              </span>{' '}
              using their current contact information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground/90 hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConvertToClient}
              className="bg-emerald-600 hover:bg-emerald-500 text-foreground"
            >
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
