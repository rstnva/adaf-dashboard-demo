// RBAC (Role-Based Access Control) helper functions
// Simplified mock implementation for ADAF Dashboard

export type Role = 'viewer' | 'user' | 'admin' | 'system';

export type Permission =
  | 'feature:summer'
  | 'feature:echarts'
  | 'feature:semaforo'
  | 'feature:blockspace'
  | 'feature:vaults-lav'
  | 'feature:alpha-factory'
  | 'feature:vol-pro'
  | 'feature:event-alpha'
  | 'feature:mm-selective'
  | 'feature:tca'
  | 'feature:cosmos-executor'
  | 'feature:liquidity-backstop'
  | 'feature:equities-ai'
  | 'feature:news_oracle'
  | 'admin:control'
  | 'admin:reports';

// Mock user roles and permissions for development - in production this would come from JWT/session
const envRole = process.env.ADAF_RBAC_DEFAULT_ROLE;
const defaultRole: Role =
  envRole === 'viewer' ||
  envRole === 'user' ||
  envRole === 'admin' ||
  envRole === 'system'
    ? envRole
    : 'admin';
const simFeaturePermissions: Permission[] = [
  'feature:blockspace',
  'feature:vaults-lav',
  'feature:alpha-factory',
  'feature:vol-pro',
  'feature:event-alpha',
  'feature:mm-selective',
  'feature:tca',
  'feature:cosmos-executor',
  'feature:liquidity-backstop',
  'feature:equities-ai',
  'feature:news_oracle',
];

const defaultPermissions: Permission[] = [
  'feature:summer',
  'feature:echarts',
  'feature:semaforo',
  ...simFeaturePermissions,
  'admin:control',
  'admin:reports',
];

const basePermissionsByRole: Record<Role, Permission[]> = {
  viewer: [],
  user: [
    'feature:summer',
    'feature:echarts',
    'feature:blockspace',
    'feature:vaults-lav',
    'feature:alpha-factory',
    'feature:equities-ai',
    'feature:news_oracle',
  ],
  admin: defaultPermissions,
  system: defaultPermissions,
};

let overrideRole: Role | null = null;
let overridePermissions: Permission[] | null = null;

function currentRole(): Role {
  return overrideRole ?? defaultRole;
}

function currentPermissions(): Permission[] {
  if (overridePermissions) {
    return [...overridePermissions];
  }

  const role = currentRole();
  return [...(basePermissionsByRole[role] ?? [])];
}

/**
 * Require a specific role or higher to access an endpoint
 * @param requiredRole - Minimum role required
 * @throws {Error} If user doesn't have sufficient permissions
 */
const roleHierarchy: Record<Role, number> = {
  viewer: 1,
  user: 2,
  admin: 3,
  system: 4,
};

export async function requireRole(requiredRole: Role): Promise<void> {
  // In development, we allow everything for admin
  const role = currentRole();

  if (role === 'admin') {
    return;
  }

  const userLevel = roleHierarchy[role];
  const requiredLevel = roleHierarchy[requiredRole];

  if (userLevel < requiredLevel) {
    throw new Error(
      `Insufficient permissions. Required: ${requiredRole}, Current: ${role}`
    );
  }
}

/**
 * Check if user has a specific role without throwing
 * @param role - Role to check
 * @returns True if user has role or higher
 */
export function hasRole(role: Role): boolean {
  const current = currentRole();
  if (current === 'admin') {
    return true;
  }

  return roleHierarchy[current] >= roleHierarchy[role];
}

/**
 * Check if user has a specific permission
 * @param permission - Permission to check
 * @returns True if user has permission
 */
export function hasPermission(permission: Permission): boolean {
  // In development, admin has all permissions
  const role = currentRole();

  if (role === 'admin') {
    return true;
  }

  return currentPermissions().includes(permission);
}

/**
 * Require a specific permission to access a feature
 * @param permission - Required permission
 * @throws {Error} If user doesn't have permission
 */
export function requirePermission(permission: Permission): void {
  if (!hasPermission(permission)) {
    throw new Error(`Missing required permission: ${permission}`);
  }
}

/**
 * Get current user's role (mock implementation)
 * @returns Current user role
 */
export function getCurrentRole(): Role {
  return currentRole();
}

/**
 * Get current user's permissions (mock implementation)
 * @returns Array of user permissions
 */
export function getCurrentPermissions(): Permission[] {
  const role = currentRole();
  if (role === 'admin') {
    return [
      'feature:summer',
      'feature:echarts',
      'feature:semaforo',
      ...simFeaturePermissions,
      'admin:control',
      'admin:reports',
    ];
  }

  return currentPermissions();
}

export function setMockRbacContext(
  role: Role,
  permissions?: Permission[]
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  overrideRole = role;
  overridePermissions = permissions ?? null;
}

export function resetMockRbacContext(): void {
  overrideRole = null;
  overridePermissions = null;
}
