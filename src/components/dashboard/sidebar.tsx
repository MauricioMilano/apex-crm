'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Users2,
  UserCheck,
  CalendarDays,
  Clock,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIDEBAR_STORAGE_KEY = 'crm_sidebar_collapsed';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Leads', href: '/leads', icon: Users2 },
      { label: 'Clients', href: '/clients', icon: UserCheck },
    ],
  },
  {
    title: 'Scheduling',
    items: [
      { label: 'Calendar', href: '/calendar', icon: CalendarDays },
      { label: 'Appointments', href: '/appointments', icon: Clock },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Forms', href: '/forms', icon: FileText },
    ],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, logout } = useAuth();

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?';

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full bg-gray-950 border-r border-gray-800 transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">
                ApexCRM
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="ml-auto shrink-0 flex items-center justify-center w-6 h-6 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);
                  const IconComponent = item.icon;

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-600/20 text-blue-400'
                          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800',
                        collapsed && 'justify-center',
                      )}
                    >
                      <IconComponent
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-blue-400' : '',
                        )}
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <li key={item.href}>
                        <Tooltip>
                          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                          <TooltipContent side="right">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  }

                  return <li key={item.href}>{linkContent}</li>;
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="shrink-0 border-t border-gray-800 p-2">
          <div
            className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg',
              collapsed && 'justify-center',
            )}
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {currentUser
                    ? `${currentUser.firstName} ${currentUser.lastName}`
                    : 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
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
                  className="w-full justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 mt-1"
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
              className="w-full justify-start gap-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 mt-1"
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
