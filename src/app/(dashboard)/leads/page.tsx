'use client';

import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/crm-context';
import { useOrgFormat } from '@/hooks/use-org-format';
import { KanbanBoard } from '@/components/leads/kanban-board';
import { LeadForm } from '@/components/leads/lead-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Lead } from '@/types';
import { Plus, Users2, TrendingUp } from 'lucide-react';

const STATUS_DOT_COLORS: Record<string, string> = {
  blue: 'bg-primary',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
};

export default function LeadsPage() {
  const { leads, leadStatuses, users, addLead } = useCRM();
  const { formatCurrency } = useOrgFormat();

  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const sortedStatuses = useMemo(
    () => [...(leadStatuses ?? [])].sort((a, b) => a.order - b.order),
    [leadStatuses],
  );

  const totalValue = useMemo(
    () => (leads ?? []).reduce((sum, l) => Number(sum) + (Number(l.value) || 0), 0),
    [leads],
  );

  const handleAddLead = (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    void addLead(data);
    setNewLeadOpen(false);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track and manage your leads through the sales pipeline
          </p>
        </div>
        <Button
          onClick={() => setNewLeadOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Lead
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Total */}
        <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-4 py-2.5">
          <Users2 className="h-4 w-4 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-lg font-bold text-foreground leading-tight">
              {leads.length}
            </p>
          </div>
        </div>

        {/* Total value */}
        <div className="flex items-center gap-2.5 bg-card border border-border rounded-lg px-4 py-2.5">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <div>
            <p className="text-xs text-muted-foreground">Pipeline Value</p>
            <p className="text-lg font-bold text-emerald-400 leading-tight">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        {/* Per-status counts */}
        {sortedStatuses.map((status) => {
          const count = leads.filter((l) => l.statusId === status.id).length;
          const dot = STATUS_DOT_COLORS[status.color] ?? 'bg-gray-500';
          return (
            <div
              key={status.id}
              className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2.5"
            >
              <div className={`h-2 w-2 rounded-full ${dot}`} />
              <div>
                <p className="text-xs text-muted-foreground truncate max-w-24">
                  {status.name}
                </p>
                <p className="text-base font-semibold text-foreground/90 leading-tight">
                  {count}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      <div className="flex-1 min-h-0">
        <KanbanBoard onNewLead={() => setNewLeadOpen(true)} />
      </div>

      {/* New lead dialog */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">New Lead</DialogTitle>
          </DialogHeader>
          <LeadForm
            leadStatuses={sortedStatuses}
            users={users}
            defaultStatusId={sortedStatuses.find((s) => s.isDefault)?.id}
            onSubmit={handleAddLead}
            onCancel={() => setNewLeadOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
