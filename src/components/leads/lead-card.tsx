'use client';

import { Lead, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  MoreHorizontal,
  Trash2,
  Edit,
  UserPlus,
  Mail,
  Phone,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrgFormat } from '@/hooks/use-org-format';

const SOURCE_COLORS: Record<string, string> = {
  form: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  manual: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  import: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  referral: 'bg-green-500/20 text-green-400 border-green-500/30',
};

interface LeadCardProps {
  lead: Lead;
  users: User[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onAssign: (lead: Lead) => void;
  onClick: (lead: Lead) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
}

export function LeadCard({
  lead,
  users,
  onEdit,
  onDelete,
  onAssign,
  onClick,
  onDragStart,
}: LeadCardProps) {
  const { formatCurrency } = useOrgFormat();
  const assignedUser = users.find((u) => u.id === lead.assignedTo);
  const initials = assignedUser
    ? `${assignedUser.firstName?.[0] ?? ''}${assignedUser.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('leadId', lead.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(e, lead.id);
      }}
      onClick={() => onClick(lead)}
      className="bg-muted border border-border rounded-lg p-3 cursor-pointer hover:border-border transition-colors group select-none"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing" />
          <span className="font-medium text-sm text-foreground truncate">
            {lead.firstName} {lead.lastName}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-muted border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              className="text-muted-foreground hover:text-foreground cursor-pointer focus:bg-accent focus:text-foreground"
              onSelect={() => onEdit(lead)}
            >
              <Edit className="h-3.5 w-3.5 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-muted-foreground hover:text-foreground cursor-pointer focus:bg-accent focus:text-foreground"
              onSelect={() => onAssign(lead)}
            >
              <UserPlus className="h-3.5 w-3.5 mr-2" />
              Assign
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive/80 hover:text-destructive/60 cursor-pointer focus:bg-accent focus:text-destructive/60"
              onSelect={() => onDelete(lead.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact info */}
      {(lead.email || lead.phone || lead.company) && (
        <div className="mt-2 space-y-1">
          {lead.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {lead.company && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.company}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {lead.source && (
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-1.5 py-0 h-5',
                SOURCE_COLORS[lead.source] ??
                  'bg-gray-500/20 text-gray-400 border-gray-500/30',
              )}
            >
              {lead.source}
            </Badge>
          )}
          {(lead.tags ?? []).slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="text-xs px-1.5 py-0 h-5 bg-muted/50 text-muted-foreground border-border"
            >
              {tag}
            </Badge>
          ))}
          {(lead.tags ?? []).length > 2 && (
            <span className="text-xs text-muted-foreground/80">
              +{(lead.tags ?? []).length - 2}
            </span>
          )}
        </div>
        {assignedUser && (
          <Avatar className="h-5 w-5 shrink-0">
            <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Value */}
      {lead.value != null && (
        <p className="mt-1.5 text-xs font-medium text-emerald-400">
          {formatCurrency(lead.value)}
        </p>
      )}
    </div>
  );
}
