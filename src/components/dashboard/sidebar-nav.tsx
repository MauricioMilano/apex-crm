'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ICON_MAP, type NavSection } from '@/lib/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarNavProps {
  sections: NavSection[];
  collapsed: boolean;
}

export function SidebarNav({ sections, collapsed }: SidebarNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/settings') return pathname === '/settings';
    return pathname.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {sections.map((section, idx) => (
          <div key={section.title ?? `section-${idx}`}>
            {!collapsed && section.title && (
              <p className="px-2 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-600">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const IconComponent = item.icon ? ICON_MAP[item.icon] : null;

                const linkContent = (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-blue-600/20 text-blue-400'
                        : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800',
                      collapsed && 'justify-center',
                    )}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={cn(
                          'h-4 w-4 shrink-0',
                          active ? 'text-blue-400' : '',
                        )}
                      />
                    )}
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.title}</span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="ml-auto text-xs bg-blue-600/20 text-blue-400 px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );

                if (collapsed) {
                  return (
                    <li key={item.href}>
                      <Tooltip>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.title}
                          {item.badge ? ` (${item.badge})` : ''}
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
    </TooltipProvider>
  );
}
