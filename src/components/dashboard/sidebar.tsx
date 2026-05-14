'use client';

import { useEffect, useState } from 'react';
import { Building2, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useFilteredNav } from '@/hooks/use-filtered-nav';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_STORAGE_KEY = 'crm_sidebar_collapsed';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const navSections = useFilteredNav(currentUser?.role, 'dashboard');

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?';

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full bg-background border-r border-border transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-bold text-foreground text-lg tracking-tight whitespace-nowrap">
                ApexCRM
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="ml-auto shrink-0 flex items-center justify-center w-6 h-6 rounded text-muted-foreground/80 hover:text-muted-foreground hover:bg-accent transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav — data-driven from NAV_CONFIG */}
        <SidebarNav sections={navSections} collapsed={collapsed} />

        {/* User profile */}
        <div className="shrink-0 border-t border-border p-2">
          <div
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg',
              collapsed && 'justify-center',
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              {currentUser?.avatar && (
                <AvatarImage src={currentUser.avatar} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">
                  {currentUser
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : 'User'}
                </p>
                <p className="text-xs text-muted-foreground/80 truncate">
                  {currentUser?.email}
                </p>
              </div>
            )}
          </div>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="w-full justify-center text-muted-foreground/80 hover:text-red-400 hover:bg-red-400/10 mt-1"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Logout</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-start gap-2 text-muted-foreground/80 hover:text-red-400 hover:bg-red-400/10 mt-1"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setCollapsed(stored === 'true');
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return { collapsed, toggle };
}
