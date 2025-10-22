/*
  Auth & RBAC Configuration (Fortune 500 mock-first)
  
  - Role-based access control
  - Mock credentials for development
  - Ready for NextAuth.js integration
  - TODO_REPLACE_WITH_REAL_DATA: Replace with actual OAuth providers (Google, GitHub, etc.)
*/

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Mock roles with permissions (Fortune 500 RBAC pattern)
export const MOCK_ROLES: Record<string, UserRole> = {
  admin: {
    id: 'admin',
    name: 'Administrator',
    permissions: [
      'research:read',
      'research:write',
      'research:approve',
      'opx:read',
      'opx:write',
      'opx:approve',
      'oracle:read',
      'oracle:write',
      'settings:write',
      'users:manage',
    ],
  },
  analyst: {
    id: 'analyst',
    name: 'Analyst',
    permissions: ['research:read', 'research:write', 'opx:read', 'oracle:read'],
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    permissions: ['research:read', 'opx:read', 'oracle:read'],
  },
};

// Helper to check if user has permission
export function hasPermission(
  user: SessionUser | undefined,
  permission: string
): boolean {
  if (!user?.role?.permissions) return false;
  return user.role.permissions.includes(permission);
}

// Helper to check if user has any of the permissions
export function hasAnyPermission(
  user: SessionUser | undefined,
  permissions: string[]
): boolean {
  if (!user?.role?.permissions) return false;
  return permissions.some(p => user.role.permissions.includes(p));
}

// Helper to check if user has all of the permissions
export function hasAllPermissions(
  user: SessionUser | undefined,
  permissions: string[]
): boolean {
  if (!user?.role?.permissions) return false;
  return permissions.every(p => user.role.permissions.includes(p));
}
