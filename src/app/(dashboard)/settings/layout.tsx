'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  Clock,
  Wrench,
  Users,
  MapPin,
  Mail,
  Webhook,
  KeyRound,
  ListChecks,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'General', href: '/settings', icon: Settings },
  { label: 'Business Hours', href: '/settings/hours', icon: Clock },
  { label: 'Services', href: '/settings/services', icon: Wrench },
  { label: 'Plans', href: '/settings/plans', icon: CreditCard },
  { label: 'Lead Statuses', href: '/settings/lead-statuses', icon: ListChecks },
  { label: 'Team', href: '/settings/team', icon: Users },
  { label: 'Locations', href: '/settings/locations', icon: MapPin },
  { label: 'Email', href: '/settings/email', icon: Mail },
  { label: 'Payment Methods', href: '/settings/payment-methods', icon: Wallet },
  { label: 'Webhooks', href: '/settings/webhooks', icon: Webhook },
  { label: 'API Keys', href: '/settings/api', icon: KeyRound },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 min-h-full">
      {/* Settings sidebar */}
      <aside className="w-56 shrink-0">
        <div className="sticky top-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
            Settings
          </p>
          <nav className="flex flex-col gap-0.5">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                href === '/settings'
                  ? pathname === '/settings'
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
