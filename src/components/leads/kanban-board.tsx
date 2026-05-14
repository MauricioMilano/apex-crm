'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lead } from '@/types';
import { useCRM } from '@/contexts/crm-context';
import { useOrgFormat } from '@/hooks/use-org-format';
import { StatusColumn } from './status-column';
import { LeadForm } from './lead-form';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewMode = 'kanban' | 'list';
type SortKey = 'name' | 'status' | 'source' | 'value' | 'createdAt';
type SortDir = 'asc' | 'desc';

const SOURCE_COLORS: Record<string, string> = {
  form: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  manual: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  import: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  referral: 'bg-green-500/20 text-green-400 border-green-500/30',
};

const STATUS_COLOR_MAP: Record<string, string> = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
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

interface KanbanBoardProps {
  onNewLead?: () => void;
}

export function KanbanBoard({ onNewLead: _onNewLead }: KanbanBoardProps) {
  const router = useRouter();
  const { leads, leadStatuses, users, addLead, updateLead, deleteLead } =
    useCRM();
  const { formatCurrency } = useOrgFormat();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Filter state
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterSource, setFilterSource] = useState('');

  // Sort (list view)
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>(
    undefined,
  );
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Sorted statuses
  const sortedStatuses = useMemo(
    () => [...(leadStatuses ?? [])].sort((a, b) => a.order - b.order),
    [leadStatuses],
  );

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const fullName =
        `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const emailMatch = lead.email?.toLowerCase() ?? '';
      const q = search.toLowerCase();
      if (q && !fullName.includes(q) && !emailMatch.includes(q)) return false;
      if (filterAssignee && filterAssignee !== 'all') {
        if (filterAssignee === 'unassigned' && lead.assignedTo) return false;
        if (filterAssignee !== 'unassigned' && lead.assignedTo !== filterAssignee) return false;
      }
      if (filterSource && filterSource !== 'all' && lead.source !== filterSource)
        return false;
      return true;
    });
  }, [leads, search, filterAssignee, filterSource]);

  // Leads grouped by status
  const leadsByStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const s of sortedStatuses) {
      map[s.id] = filteredLeads.filter((l) => l.statusId === s.id);
    }
    return map;
  }, [filteredLeads, sortedStatuses]);

  // Sorted leads for list view
  const sortedLeads = useMemo(() => {
    const statusMap = Object.fromEntries((leadStatuses ?? []).map((s) => [s.id, s]));
    return [...filteredLeads].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`,
          );
          break;
        case 'status':
          cmp = (statusMap[a.statusId]?.name ?? '').localeCompare(
            statusMap[b.statusId]?.name ?? '',
          );
          break;
        case 'source':
          cmp = (a.source ?? '').localeCompare(b.source ?? '');
          break;
        case 'value':
          cmp = (a.value ?? 0) - (b.value ?? 0);
          break;
        case 'createdAt':
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredLeads, sortKey, sortDir, leadStatuses]);

  // Drag handlers
  const handleDragStart = (_e: React.DragEvent, __leadId: string) => {
    // dataTransfer is set in LeadCard
  };

  const handleDrop = (leadId: string, statusId: string) => {
    const lead = leads.find((l) => l.id === leadId);
    if (lead && lead.statusId !== statusId) {
      void updateLead(leadId, { statusId });
    }
  };

  // CRUD handlers
  const handleAddLead = (statusId: string) => {
    setEditingLead(undefined);
    setDefaultStatusId(statusId);
    setFormOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setDefaultStatusId(undefined);
    setFormOpen(true);
  };

  const handleDeleteLead = (id: string) => {
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      void deleteLead(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const handleAssignLead = (lead: Lead) => {
    setEditingLead(lead);
    setDefaultStatusId(undefined);
    setFormOpen(true);
  };

  const handleClickLead = (lead: Lead) => {
    router.push(`/leads/${lead.id}`);
  };

  const handleFormSubmit = (
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (editingLead) {
      void updateLead(editingLead.id, data);
    } else {
      void addLead(data);
    }
    setFormOpen(false);
    setEditingLead(undefined);
  };

  // Sort toggle for list view
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return <ChevronUp className="h-3 w-3 text-muted-foreground ml-1" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-primary ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary ml-1" />
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-card border-border text-foreground placeholder:text-muted-foreground h-9"
          />
        </div>

        {/* Assignee filter */}
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-40 bg-card border-border text-muted-foreground h-9">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground/80" />
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {(users ?? [])
              .filter((u) => u.isActive)
              .map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Source filter */}
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-36 bg-card border-border text-muted-foreground h-9">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="bg-muted border-border">
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="form">Form</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="import">Import</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-md p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'kanban'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground/80 hover:text-muted-foreground',
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'p-1.5 rounded transition-colors',
              viewMode === 'list'
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground/80 hover:text-muted-foreground',
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Kanban view */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {sortedStatuses.map((status) => (
            <StatusColumn
              key={status.id}
              status={status}
              leads={leadsByStatus[status.id] ?? []}
              users={users}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onAddLead={handleAddLead}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              onAssignLead={handleAssignLead}
              onClickLead={handleClickLead}
            />
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead
                  className="text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center">
                    Name
                    <SortIcon col="name" />
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">Contact</TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon col="status" />
                  </div>
                </TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('source')}
                >
                  <div className="flex items-center">
                    Source
                    <SortIcon col="source" />
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">Assigned To</TableHead>
                <TableHead
                  className="text-muted-foreground cursor-pointer select-none"
                  onClick={() => toggleSort('value')}
                >
                  <div className="flex items-center">
                    Value
                    <SortIcon col="value" />
                  </div>
                </TableHead>
                <TableHead className="text-muted-foreground">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeads.length === 0 && (
                <TableRow className="border-border">
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground/80 py-12"
                  >
                    No leads found
                  </TableCell>
                </TableRow>
              )}
              {sortedLeads.map((lead) => {
                const status = leadStatuses.find(
                  (s) => s.id === lead.statusId,
                );
                const assignedUser = users.find(
                  (u) => u.id === lead.assignedTo,
                );
                return (
                  <TableRow
                    key={lead.id}
                    className="border-border hover:bg-card/50 cursor-pointer"
                    onClick={() => handleClickLead(lead)}
                  >
                    <TableCell className="font-medium text-foreground">
                      {lead.firstName} {lead.lastName}
                      {lead.company && (
                        <p className="text-xs text-muted-foreground/80 font-normal">
                          {lead.company}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {lead.email && (
                        <p className="truncate max-w-40">{lead.email}</p>
                      )}
                      {lead.phone && (
                        <p className="text-xs">{lead.phone}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            STATUS_COLOR_MAP[status.color] ??
                              'bg-gray-500/20 text-gray-400 border-gray-500/30',
                          )}
                        >
                          {status.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.source && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            SOURCE_COLORS[lead.source] ??
                              'bg-gray-500/20 text-gray-400 border-gray-500/30',
                          )}
                        >
                          {lead.source}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignedUser ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {assignedUser.firstName?.[0] ?? ''}
                              {assignedUser.lastName?.[0] ?? ''}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {assignedUser.firstName} {assignedUser.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-emerald-400 font-medium text-sm">
                      {lead.value != null
                        ? formatCurrency(lead.value)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Lead form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingLead ? 'Edit Lead' : 'New Lead'}
            </DialogTitle>
          </DialogHeader>
          <LeadForm
            lead={editingLead}
            leadStatuses={sortedStatuses}
            users={users}
            defaultStatusId={defaultStatusId}
            onSubmit={handleFormSubmit}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              Delete Lead
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this lead? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-muted-foreground hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
