'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import {
  Building2,
  CalendarDays,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/book', label: 'Book Appointment', icon: Plus },
  { href: '/portal/appointments', label: 'My Appointments', icon: CalendarDays },
  { href: '/portal/profile', label: 'Profile', icon: User },
];

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === '/portal/login';

  useEffect(() => {
    if (isLoading) return;
    if (isLoginPage) return;

    if (!isAuthenticated) {
      router.replace('/portal/login');
      return;
    }

    if (currentUser?.role !== 'client') {
      router.replace('/portal/login');
    }
  }, [isAuthenticated, isLoading, currentUser, router, isLoginPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isLoginPage && (!isAuthenticated || currentUser?.role !== 'client')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isLoginPage && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link href="/portal/dashboard" className="flex items-center gap-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-gray-900 text-lg">ApexCRM</span>
                <span className="hidden sm:inline text-xs text-gray-400 font-medium border border-gray-200 rounded px-1.5 py-0.5 ml-1">
                  Client Portal
                </span>
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Right side */}
              <div className="flex items-center gap-3">
                <span className="hidden lg:block text-sm text-gray-600 max-w-[140px] truncate">
                  {currentUser?.firstName} {currentUser?.lastName}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout();
                    router.push('/portal/login');
                  }}
                  className="hidden sm:flex items-center gap-1.5"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
                <button
                  className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      pathname === link.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100',
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400 px-3 pb-1">
                    Signed in as {currentUser?.email}
                  </p>
                  <button
                    onClick={() => {
                      logout();
                      router.push('/portal/login');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      <main className="flex-1">{children}</main>

      {!isLoginPage && (
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} ApexCRM. All rights reserved.
          </div>
        </footer>
      )}
    </div>
  );
}
