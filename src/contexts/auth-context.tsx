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
  organizationName?: string;
  role?: UserRole;
}

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, orgSlug?: string) => Promise<boolean>;
  logout: () => void;
  register: (data: RegisterData) => Promise<boolean>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractUser(payload: unknown): User | null {
  if (!payload || typeof payload !== 'object') return null;
  const candidate = payload as Partial<User> & { data?: unknown };
  if (typeof candidate.id === 'string') return candidate as User;
  const nested = candidate.data;
  if (nested && typeof nested === 'object' && typeof (nested as Partial<User>).id === 'string') {
    return nested as User;
  }
  return null;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount via HTTP-only session cookie
  useEffect(() => {
    ;(async () => {
      try {
        const res = await getCurrentUser();
        if (res.success) {
          const user = extractUser(res.data);
          if (user) setCurrentUser(user);
        }
      } catch {
        // no active session
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(
    async (email: string, password: string, orgSlug?: string): Promise<boolean> => {
      try {
        const res = await loginAction(email, password, orgSlug);
        if (!res.success) return false;
        const user = extractUser(res.data);
        if (user) setCurrentUser(user);
        return true;
      } catch {
        return false;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    void logoutAction();
  }, []);

  const register = useCallback(
    async (data: RegisterData): Promise<boolean> => {
      try {
        const res = await registerAction({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          organizationName: data.organizationName ?? 'Personal',
        });
        if (!res.success) return false;
        const user = extractUser(res.data);
        if (user) setCurrentUser(user);
        return true;
      } catch {
        return false;
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
