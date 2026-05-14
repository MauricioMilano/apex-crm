import { useMemo } from 'react'
import type { UserRole } from '@/types'
import { NAV_CONFIG, type NavContext, type NavSection, type NavItem } from '@/lib/navigation'

/**
 * Filters NAV_CONFIG by role permissions and context tag.
 * Prunes sections that become empty after filtering.
 */
export function useFilteredNav(role: UserRole | undefined, context?: NavContext): NavSection[] {
  return useMemo(() => {
    const hasAccess = (item: NavItem): boolean => {
      // If item has requiredRole, check if user's role is included
      if (item.requiredRole && item.requiredRole.length > 0) {
        if (!role) return false
        if (!item.requiredRole.includes(role)) return false
      }
      return true
    }

    const matchesContext = (item: NavItem): boolean => {
      if (!context) return true
      if (!item.context) return false
      return item.context.includes(context)
    }

    return NAV_CONFIG
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => hasAccess(item) && matchesContext(item)),
      }))
      .filter((section) => section.items.length > 0)
  }, [role, context])
}
