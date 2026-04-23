'use client';

import { Client } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Edit, Trash2, Mail, Phone, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

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

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
  const router = useRouter();
  const fullName = `${client.firstName} ${client.lastName}`;
  const initials = `${client.firstName?.[0] ?? ''}${client.lastName?.[0] ?? ''}`.toUpperCase() || '?';
  const avatarColor = getAvatarColor(fullName);

  return (
    <Card className="bg-card border-border hover:border-primary/40 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback
                className={`${avatarColor} text-white font-semibold text-sm`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{fullName}</p>
              {client.company && (
                <p className="text-xs text-muted-foreground">{client.company}</p>
              )}
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(client)}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(client)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-1.5 mb-3">
          {client.email && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
        </div>

        {client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {client.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {tag}
              </Badge>
            ))}
            {client.tags.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                +{client.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Since {format(new Date(client.createdAt), 'MMM d, yyyy')}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs px-2"
            onClick={() => router.push(`/clients/${client.id}`)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
