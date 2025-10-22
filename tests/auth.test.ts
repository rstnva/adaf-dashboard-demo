import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  MOCK_ROLES,
} from '@/lib/auth/config';
import type { SessionUser } from '@/lib/auth/config';

describe('Auth & RBAC', () => {
  const adminUser: SessionUser = {
    id: '1',
    name: 'Admin',
    email: 'admin@test.com',
    role: MOCK_ROLES.admin,
  };

  const analystUser: SessionUser = {
    id: '2',
    name: 'Analyst',
    email: 'analyst@test.com',
    role: MOCK_ROLES.analyst,
  };

  const viewerUser: SessionUser = {
    id: '3',
    name: 'Viewer',
    email: 'viewer@test.com',
    role: MOCK_ROLES.viewer,
  };

  describe('hasPermission', () => {
    it('returns true when user has permission', () => {
      expect(hasPermission(adminUser, 'research:write')).toBe(true);
      expect(hasPermission(analystUser, 'research:read')).toBe(true);
      expect(hasPermission(viewerUser, 'oracle:read')).toBe(true);
    });

    it('returns false when user lacks permission', () => {
      expect(hasPermission(viewerUser, 'research:write')).toBe(false);
      expect(hasPermission(analystUser, 'settings:write')).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(hasPermission(undefined, 'research:read')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('returns true when user has any of the permissions', () => {
      expect(
        hasAnyPermission(analystUser, ['research:write', 'settings:write'])
      ).toBe(true);
      expect(
        hasAnyPermission(viewerUser, ['research:read', 'research:write'])
      ).toBe(true);
    });

    it('returns false when user has none of the permissions', () => {
      expect(
        hasAnyPermission(viewerUser, ['research:write', 'settings:write'])
      ).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(hasAnyPermission(undefined, ['research:read'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('returns true when user has all permissions', () => {
      expect(
        hasAllPermissions(adminUser, ['research:read', 'research:write'])
      ).toBe(true);
      expect(
        hasAllPermissions(analystUser, ['research:read', 'opx:read'])
      ).toBe(true);
    });

    it('returns false when user lacks any permission', () => {
      expect(
        hasAllPermissions(analystUser, ['research:read', 'settings:write'])
      ).toBe(false);
      expect(
        hasAllPermissions(viewerUser, ['research:read', 'research:write'])
      ).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(hasAllPermissions(undefined, ['research:read'])).toBe(false);
    });
  });

  describe('Role definitions', () => {
    it('admin has all permissions', () => {
      expect(adminUser.role.permissions).toContain('research:read');
      expect(adminUser.role.permissions).toContain('research:write');
      expect(adminUser.role.permissions).toContain('research:approve');
      expect(adminUser.role.permissions).toContain('settings:write');
      expect(adminUser.role.permissions).toContain('users:manage');
    });

    it('analyst has read and write but not approve', () => {
      expect(analystUser.role.permissions).toContain('research:read');
      expect(analystUser.role.permissions).toContain('research:write');
      expect(analystUser.role.permissions).not.toContain('research:approve');
      expect(analystUser.role.permissions).not.toContain('settings:write');
    });

    it('viewer has only read permissions', () => {
      expect(viewerUser.role.permissions).toContain('research:read');
      expect(viewerUser.role.permissions).not.toContain('research:write');
      expect(viewerUser.role.permissions).not.toContain('settings:write');
    });
  });
});
