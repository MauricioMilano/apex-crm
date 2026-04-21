import { useAuth } from '@/contexts/auth-context';

/**
 * Returns the currently authenticated user, or null if not logged in.
 */
export function useCurrentUser() {
  const { currentUser } = useAuth();
  return currentUser;
}
