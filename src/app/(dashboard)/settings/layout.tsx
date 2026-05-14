'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useFilteredNav } from '@/hooks/use-filtered-nav';
import { ICON_MAP } from '@/lib/navigation';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const settingsNav = useFilteredNav(currentUser?.role, 'settings');
  const items = settingsNav.flatMap((s) => s.items);

  return (
    <div className="flex gap-6 min-h-full">
      {/* Settings sidebar */}
      <aside className="w-56 shrink-0">
        <div className="sticky top-0">
          <p className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider mb-3 px-3">
            Settings
          </p>
          <nav className="flex flex-col gap-0.5">
            {items.map(({ title, href, icon }) => {
              const IconComponent = icon ? ICON_MAP[icon] : null;
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
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  )}
                >
                  {IconComponent && <IconComponent className="h-4 w-4 shrink-0" />}
                  {title}
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
