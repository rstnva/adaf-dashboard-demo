'use client';

/*
  useAuth Hook - Client-side authentication and RBAC
  
  - Mock session management
  - Permission checks
  - Role-based access control
  - TODO_REPLACE_WITH_REAL_DATA: Replace with next-auth useSession when enabled
*/

import { useState, useEffect } from 'react';
import type { SessionUser } from '@/lib/auth/config';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  MOCK_ROLES,
} from '@/lib/auth/config';

export interface UseAuthReturn {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

// Mock session storage key
const SESSION_KEY = 'adaf_mock_session';

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load mock session from localStorage
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // TODO_REPLACE_WITH_REAL_DATA: Replace with next-auth signIn
    const MOCK_USERS = [
      {
        id: '1',
        email: 'admin@adaf.local',
        password: 'admin123',
        name: 'Admin User',
        role: MOCK_ROLES.admin,
      },
      {
        id: '2',
        email: 'analyst@adaf.local',
        password: 'analyst123',
        name: 'Analyst User',
        role: MOCK_ROLES.analyst,
      },
      {
        id: '3',
        email: 'viewer@adaf.local',
        password: 'viewer123',
        name: 'Viewer User',
        role: MOCK_ROLES.viewer,
      },
    ];

    const mockUser = MOCK_USERS.find(
      u => u.email === email && u.password === password
    );
    if (!mockUser) return false;

    const sessionUser: SessionUser = {
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return true;
  };

  const signOut = async (): Promise<void> => {
    // TODO_REPLACE_WITH_REAL_DATA: Replace with next-auth signOut
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    hasPermission: (permission: string) => hasPermission(user, permission),
    hasAnyPermission: (permissions: string[]) =>
      hasAnyPermission(user, permissions),
    hasAllPermissions: (permissions: string[]) =>
      hasAllPermissions(user, permissions),
    signIn,
    signOut,
  };
}
