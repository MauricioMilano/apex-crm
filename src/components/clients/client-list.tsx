'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@/types';
import { ClientCard } from './client-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Grid3x3,
  List,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';

type SortKey = 'name' | 'email' | 'phone' | 'createdAt';
type SortDir = 'asc' | 'desc';

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

interface ClientListProps {
  clients: Client[];
  onNew: () => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientList({
  clients,
  onNew,
  onEdit,
  onDelete,
}: ClientListProps) {
  const router = useRouter();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = view === 'grid' ? 12 : 20;

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    clients.forEach((c) => c.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [clients]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = clients;
    if (q) {
      result = result.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q),
      );
    }
    if (tagFilter) {
      result = result.filter((c) => c.tags.includes(tagFilter));
    }
    return result.slice().sort((a, b) => {
      let va = '';
      let vb = '';
      if (sortKey === 'name') {
        va = `${a.firstName} ${a.lastName}`;
        vb = `${b.firstName} ${b.lastName}`;
      } else if (sortKey === 'email') {
        va = a.email ?? '';
        vb = b.email ?? '';
      } else if (sortKey === 'phone') {
        va = a.phone ?? '';
        vb = b.phone ?? '';
      } else {
        va = a.createdAt;
        vb = b.createdAt;
      }
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [clients, search, tagFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ChevronsUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            value={tagFilter}
            onChange={(e) => {
              setTagFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setView('grid');
              setPage(1);
            }}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => {
              setView('table');
              setPage(1);
            }}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button onClick={onNew} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Client
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-12">
              No clients found.
            </p>
          ) : (
            paginated.map((c) => (
              <ClientCard
                key={c.id}
                client={c}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center">
                    Name <SortIcon col="name" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('email')}
                >
                  <span className="flex items-center">
                    Email <SortIcon col="email" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('phone')}
                >
                  <span className="flex items-center">
                    Phone <SortIcon col="phone" />
                  </span>
                </TableHead>
                <TableHead>Tags</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <span className="flex items-center">
                    Created <SortIcon col="createdAt" />
                  </span>
                </TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-12"
                  >
                    No clients found.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((c) => {
                  const fullName = `${c.firstName} ${c.lastName}`;
                  const initials =
                    `${c.firstName[0]}${c.lastName[0]}`.toUpperCase();
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback
                              className={`${getAvatarColor(fullName)} text-white text-xs`}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{fullName}</p>
                            {c.company && (
                              <p className="text-xs text-muted-foreground">
                                {c.company}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.email ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {c.phone ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.tags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {c.tags.length > 2 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              +{c.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(c.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => router.push(`/clients/${c.id}`)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onEdit(c)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => onDelete(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
