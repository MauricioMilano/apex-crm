import { useCurrentUser } from './use-current-user';

/**
 * Returns granular permission flags derived from the current user's role.
 */
export function usePermissions() {
  const user = useCurrentUser();
  const role = user?.role;

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isEmployee = role === 'employee';

  return {
    /** Leads can be managed by admins and employees. */
    canManageLeads: isAdmin || isEmployee,
    /** Clients can be managed by admins and employees. */
    canManageClients: isAdmin || isEmployee,
    /** Settings (org, locations, team, billing) are restricted to admins. */
    canManageSettings: isAdmin,
    /** Team management (invite, deactivate users) is restricted to admins. */
    canManageTeam: isAdmin,
    /** Admins can view all employee calendars; employees see only their own. */
    canViewAllCalendars: isAdmin,
    /** Convenience flag for any admin-tier role. */
    isAdmin,
  } as const;
}
