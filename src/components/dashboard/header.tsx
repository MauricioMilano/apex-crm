'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { useAuth } from '@/contexts/auth-context';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Leads',
  '/clients': 'Clients',
  '/calendar': 'Calendar',
  '/appointments': 'Appointments',
  '/forms': 'Forms',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const [notificationCount] = useState(3);

  const pageTitle = ROUTE_TITLES[pathname] ?? 'Dashboard';

  const initials = currentUser
    ? `${currentUser.firstName?.[0] ?? ''}${currentUser.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center gap-4 px-4 shrink-0">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-muted-foreground hover:text-foreground hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-foreground hidden sm:block">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
        <Input
          placeholder="Search..."
          className="pl-9 w-64 bg-card border-border text-muted-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary h-9"
        />
      </div>

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-primary hover:bg-primary border-0">
            {notificationCount}
          </Badge>
        )}
      </Button>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-accent"
          >
            <Avatar className="h-8 w-8">
              {currentUser?.avatar && (
                <AvatarImage src={currentUser.avatar} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-card border-border text-muted-foreground"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground">
              {currentUser
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : 'User'}
            </p>
            <p className="text-xs text-muted-foreground/80 truncate">
              {currentUser?.email}
            </p>
          </div>
          <DropdownMenuSeparator className="bg-muted" />
          <DropdownMenuItem
            className="gap-2 cursor-pointer hover:bg-accent focus:bg-accent"
            onClick={() => router.push('/settings/profile')}
          >
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 cursor-pointer hover:bg-accent focus:bg-accent"
            onClick={() => router.push('/settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-muted" />
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
