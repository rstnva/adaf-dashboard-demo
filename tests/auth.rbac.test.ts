import { afterEach, describe, expect, it } from 'vitest';

import {
  getCurrentPermissions,
  getCurrentRole,
  hasPermission,
  hasRole,
  requirePermission,
  requireRole,
  resetMockRbacContext,
  setMockRbacContext,
} from '@/lib/auth/rbac';

describe('RBAC helpers', () => {
  afterEach(() => {
    resetMockRbacContext();
  });

  it('grants admin role by default', async () => {
    expect(getCurrentRole()).toBe('admin');
    await expect(requireRole('viewer')).resolves.toBeUndefined();
    await expect(requireRole('admin')).resolves.toBeUndefined();
    expect(hasRole('system')).toBe(true);
    expect(hasPermission('admin:control')).toBe(true);
  });

  it('restricts access when mock role is downgraded', async () => {
    setMockRbacContext('viewer');

    expect(getCurrentRole()).toBe('viewer');
    expect(hasRole('viewer')).toBe(true);
    expect(hasRole('user')).toBe(false);
    await expect(requireRole('user')).rejects.toThrow(
      /Insufficient permissions/
    );
  });

  it('evaluates custom permissions when provided', () => {
    setMockRbacContext('user', ['feature:summer']);

    expect(getCurrentPermissions()).toEqual(['feature:summer']);
    expect(hasPermission('feature:summer')).toBe(true);
    expect(hasPermission('admin:control')).toBe(false);
    expect(() => requirePermission('admin:control')).toThrow(
      /Missing required permission/
    );
  });

  it('resets overrides correctly', () => {
    setMockRbacContext('viewer');
    resetMockRbacContext();

    expect(getCurrentRole()).toBe('admin');
    expect(getCurrentPermissions()).toContain('admin:control');
  });
});
