import type { UserRole } from '@/types'
import {
  LayoutDashboard,
  BarChart3,
  Users2,
  UserCheck,
  CalendarDays,
  Clock,
  FileText,
  Settings,
  Plus,
  CreditCard,
  ListChecks,
  User,
  Wrench,
  MapPin,
  Mail,
  Webhook,
  KeyRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavContext = 'dashboard' | 'portal' | 'settings'

export interface NavItem {
  title: string
  href: string
  icon?: string
  badge?: string
  requiredRole?: UserRole[]
  context?: NavContext[]
  children?: NavItem[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/**
 * Map of icon string names to lucide-react components.
 */
export const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  BarChart3,
  Users2,
  UserCheck,
  CalendarDays,
  Clock,
  FileText,
  Settings,
  Plus,
  CreditCard,
  ListChecks,
  User,
  Wrench,
  MapPin,
  Mail,
  Webhook,
  KeyRound,
  Wallet,
}

/**
 * Single source of truth for all navigation items.
 * Each item can specify which context(s) it belongs to and which role(s) can see it.
 */
export const NAV_CONFIG: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        context: ['dashboard'],
      },
      {
        title: 'Reports',
        href: '/reports',
        icon: 'BarChart3',
        requiredRole: ['super_admin', 'admin'],
        context: ['dashboard'],
      },
    ],
  },
  {
    title: 'Sales',
    items: [
      {
        title: 'Leads',
        href: '/leads',
        icon: 'Users2',
        badge: 'leads:unread',
        context: ['dashboard'],
      },
      {
        title: 'Clients',
        href: '/clients',
        icon: 'UserCheck',
        context: ['dashboard'],
      },
    ],
  },
  {
    title: 'Scheduling',
    items: [
      {
        title: 'Calendar',
        href: '/calendar',
        icon: 'CalendarDays',
        context: ['dashboard'],
      },
      {
        title: 'Appointments',
        href: '/appointments',
        icon: 'Clock',
        context: ['dashboard'],
      },
    ],
  },
  {
    title: 'Marketing',
    items: [
      {
        title: 'Forms',
        href: '/forms',
        icon: 'FileText',
        context: ['dashboard'],
      },
    ],
  },
  {
    title: 'Admin',
    items: [
      {
        title: 'Settings',
        href: '/settings',
        icon: 'Settings',
        context: ['dashboard'],
      },
    ],
  },
  // ─── Portal navigation ────────────────────────────────────────────
  {
    items: [
      {
        title: 'Dashboard',
        href: '/portal/dashboard',
        icon: 'LayoutDashboard',
        context: ['portal'],
      },
      {
        title: 'Book Appointment',
        href: '/portal/book',
        icon: 'Plus',
        context: ['portal'],
      },
      {
        title: 'My Appointments',
        href: '/portal/appointments',
        icon: 'CalendarDays',
        context: ['portal'],
      },
      {
        title: 'Plans',
        href: '/portal/plans',
        icon: 'CreditCard',
        context: ['portal'],
      },
      {
        title: 'My Subscriptions',
        href: '/portal/subscriptions',
        icon: 'ListChecks',
        context: ['portal'],
      },
      {
        title: 'Profile',
        href: '/portal/profile',
        icon: 'User',
        context: ['portal'],
      },
    ],
  },
  // ─── Settings navigation ───────────────────────────────────────────
  {
    items: [
      {
        title: 'Profile',
        href: '/settings/profile',
        icon: 'User',
        context: ['settings'],
      },
      {
        title: 'General',
        href: '/settings',
        icon: 'Settings',
        context: ['settings'],
      },
      {
        title: 'Business Hours',
        href: '/settings/hours',
        icon: 'Clock',
        context: ['settings'],
      },
      {
        title: 'Services',
        href: '/settings/services',
        icon: 'Wrench',
        context: ['settings'],
      },
      {
        title: 'Plans',
        href: '/settings/plans',
        icon: 'CreditCard',
        context: ['settings'],
      },
      {
        title: 'Lead Statuses',
        href: '/settings/lead-statuses',
        icon: 'ListChecks',
        context: ['settings'],
      },
      {
        title: 'Team',
        href: '/settings/team',
        icon: 'Users',
        context: ['settings'],
      },
      {
        title: 'Locations',
        href: '/settings/locations',
        icon: 'MapPin',
        context: ['settings'],
      },
      {
        title: 'Email',
        href: '/settings/email',
        icon: 'Mail',
        context: ['settings'],
      },
      {
        title: 'Payment Methods',
        href: '/settings/payment-methods',
        icon: 'Wallet',
        context: ['settings'],
      },
      {
        title: 'Webhooks',
        href: '/settings/webhooks',
        icon: 'Webhook',
        context: ['settings'],
      },
      {
        title: 'API Keys',
        href: '/settings/api',
        icon: 'KeyRound',
        context: ['settings'],
      },
    ],
  },
]
