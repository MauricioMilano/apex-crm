'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search, Bell, User, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/leads': 'Leads',
  '/dashboard/clients': 'Clients',
  '/dashboard/calendar': 'Calendar',
  '/dashboard/appointments': 'Appointments',
  '/dashboard/forms': 'Forms',
  '/dashboard/settings': 'Settings',
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
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center gap-4 px-4 shrink-0">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-gray-400 hover:text-gray-100 hover:bg-gray-800 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="text-lg font-semibold text-white hidden sm:block">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search..."
          className="pl-9 w-64 bg-gray-900 border-gray-700 text-gray-300 placeholder:text-gray-600 focus-visible:ring-blue-600 h-9"
        />
      </div>

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-400 hover:text-gray-100 hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-blue-600 hover:bg-blue-600 border-0">
            {notificationCount}
          </Badge>
        )}
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-800"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-48 bg-gray-900 border-gray-800 text-gray-300"
        >
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white">
              {currentUser
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {currentUser?.email}
            </p>
          </div>
          <DropdownMenuSeparator className="bg-gray-800" />
          <DropdownMenuItem
            className="gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            onClick={() => router.push('/dashboard/settings')}
          >
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-2 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
            onClick={() => router.push('/dashboard/settings')}
          >
            <Settings className="h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-800" />
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-red-400 hover:bg-red-400/10 focus:bg-red-400/10 focus:text-red-400"
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
