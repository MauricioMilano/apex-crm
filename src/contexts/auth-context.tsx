'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { User, UserRole } from '@/types';
import { getCurrentUser, login as loginAction, logout as logoutAction, register as registerAction } from '@/actions/auth-client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'crm_session_user_id';

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const storedId = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedId) {
        ;(async () => {
          try {
            const res = await getCurrentUser(storedId)
            if (res.success) {
              setCurrentUser(res.data)
            } else {
              localStorage.removeItem(AUTH_STORAGE_KEY)
            }
          } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY)
          }
        })()
      }
    } catch {
      // localStorage unavailable (e.g. SSR guard)
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const res = await loginAction(email, password)
        if (!res.success) return false
        const user = res.data
        setCurrentUser(user)
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, user.id)
        } catch {
          // ignore storage errors
        }
        return true
      } catch {
        return false
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setCurrentUser(null)
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
    // best-effort server parity
    void logoutAction()
  }, []);

  /**
   * Registration is read-only against mock data.
   * Returns false if the e-mail already exists; otherwise creates an
   * in-memory user for the duration of the session.
   */
  const register = useCallback(
    async (data: RegisterData): Promise<boolean> => {
      try {
        const res = await registerAction({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          organizationName: 'Personal',
        })
        if (!res.success) return false
        const user = res.data
        setCurrentUser(user)
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, user.id)
        } catch {
          // ignore storage errors
        }
        return true
      } catch {
        return false
      }
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
