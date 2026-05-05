import type { AppointmentStatus } from '@/types'

export function allowedStatusesForRole(role: string): AppointmentStatus[] {
  const ALL: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']

  // Default mapping: admins get full access; others get a limited set.
  if (role === 'super_admin' || role === 'admin') return ALL

  // Employees/clients: limit to common changes that reduce risk
  return ['pending', 'confirmed', 'cancelled']
}
