'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { User, UserRole } from '@/types';
import { mockUsers } from '@/lib/mock-data';

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
        const found = mockUsers.find((u) => u.id === storedId && u.isActive);
        if (found) {
          setCurrentUser(found);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch {
      // localStorage unavailable (e.g. SSR guard)
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      // Simulate network latency
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      const user = mockUsers.find(
        (u) =>
          u.email.toLowerCase() === email.toLowerCase() &&
          u.passwordHash === password &&
          u.isActive,
      );

      if (user) {
        setCurrentUser(user);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, user.id);
        } catch {
          // ignore storage errors
        }
        return true;
      }

      return false;
    },
    [],
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }, []);

  /**
   * Registration is read-only against mock data.
   * Returns false if the e-mail already exists; otherwise creates an
   * in-memory user for the duration of the session.
   */
  const register = useCallback(
    async (data: RegisterData): Promise<boolean> => {
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      const exists = mockUsers.some(
        (u) => u.email.toLowerCase() === data.email.toLowerCase(),
      );
      if (exists) return false;

      const newUser: User = {
        id: `user_${Date.now()}`,
        organizationId: 'org_1',
        email: data.email,
        passwordHash: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role ?? 'employee',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Push into the shared mock array so subsequent logins work
      mockUsers.push(newUser);

      setCurrentUser(newUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, newUser.id);
      } catch {
        // ignore storage errors
      }

      return true;
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
