'use client';

import { useState } from 'react';
import { Lead, LeadStatus, User } from '@/types';
import { LeadCard } from './lead-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLUMN_DOT_COLORS: Record<string, string> = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  emerald: 'bg-emerald-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  gray: 'bg-gray-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
  teal: 'bg-teal-500',
};

interface StatusColumnProps {
  status: LeadStatus;
  leads: Lead[];
  users: User[];
  onDrop: (leadId: string, statusId: string) => void;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onAddLead: (statusId: string) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onAssignLead: (lead: Lead) => void;
  onClickLead: (lead: Lead) => void;
}

export function StatusColumn({
  status,
  leads,
  users,
  onDrop,
  onDragStart,
  onAddLead,
  onEditLead,
  onDeleteLead,
  onAssignLead,
  onClickLead,
}: StatusColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dotColor = COLUMN_DOT_COLORS[status.color] ?? 'bg-gray-500';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) onDrop(leadId, status.id);
  };

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center gap-2 px-3 py-2.5 mb-2">
        <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', dotColor)} />
        <span className="font-semibold text-sm text-gray-200 flex-1 truncate">
          {status.name}
        </span>
        <Badge
          variant="secondary"
          className="bg-gray-700 text-gray-300 border-0 text-xs px-2 h-5"
        >
          {leads.length}
        </Badge>
      </div>

      {/* Drop zone / card list */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col gap-2 rounded-lg p-2 min-h-32 transition-all duration-150 overflow-y-auto max-h-[calc(100vh-280px)]',
          isDragOver
            ? 'bg-gray-800/80 border-2 border-dashed border-blue-500/60'
            : 'bg-gray-900/40 border-2 border-transparent',
        )}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            users={users}
            onEdit={onEditLead}
            onDelete={onDeleteLead}
            onAssign={onAssignLead}
            onClick={onClickLead}
            onDragStart={onDragStart}
          />
        ))}
        {leads.length === 0 && !isDragOver && (
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-xs text-gray-600">Drop leads here</p>
          </div>
        )}
        {isDragOver && leads.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-xs text-blue-400">Release to drop</p>
          </div>
        )}
      </div>

      {/* Add lead button */}
      <Button
        variant="ghost"
        size="sm"
        className="mt-2 w-full justify-start text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 text-xs"
        onClick={() => onAddLead(status.id)}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Lead
      </Button>
    </div>
  );
}
