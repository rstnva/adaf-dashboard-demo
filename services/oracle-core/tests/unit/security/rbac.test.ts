import { describe, expect, it } from 'vitest';

import { hasScope, ensureScope, type AccessToken } from '../../../acl/rbac';

describe('Oracle RBAC', () => {
  const readerToken: AccessToken = {
    subject: 'user-reader',
    scopes: ['oracle.reader'],
  };

  const publisherToken: AccessToken = {
    subject: 'user-publisher',
    scopes: ['oracle.publisher'],
  };

  const adminToken: AccessToken = {
    subject: 'user-admin',
    scopes: ['oracle.admin'],
  };

  describe('hasScope', () => {
    it('returns true for matching scope', () => {
      expect(hasScope(readerToken, 'oracle.reader')).toBe(true);
      expect(hasScope(publisherToken, 'oracle.publisher')).toBe(true);
    });

    it('returns false for missing scope', () => {
      expect(hasScope(readerToken, 'oracle.publisher')).toBe(false);
      expect(hasScope(publisherToken, 'oracle.admin')).toBe(false);
    });

    it('admin scope grants all permissions', () => {
      expect(hasScope(adminToken, 'oracle.reader')).toBe(true);
      expect(hasScope(adminToken, 'oracle.publisher')).toBe(true);
      expect(hasScope(adminToken, 'oracle.admin')).toBe(true);
    });

    it('returns false for null token', () => {
      expect(hasScope(null, 'oracle.reader')).toBe(false);
    });
  });

  describe('ensureScope', () => {
    it('passes for matching scope', () => {
      expect(() => ensureScope(readerToken, 'oracle.reader')).not.toThrow();
    });

    it('throws 403 for missing scope', () => {
      try {
        ensureScope(readerToken, 'oracle.publisher');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.message).toBe('Forbidden');
        expect(error.statusCode).toBe(403);
      }
    });

    it('passes for admin token', () => {
      expect(() => ensureScope(adminToken, 'oracle.reader')).not.toThrow();
      expect(() => ensureScope(adminToken, 'oracle.publisher')).not.toThrow();
    });

    it('throws for null token', () => {
      try {
        ensureScope(null, 'oracle.reader');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(403);
      }
    });
  });
});
