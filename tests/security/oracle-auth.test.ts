import { describe, expect, it } from 'vitest';

import { validateToken, hasScope, requireScope, type AccessToken } from '../../services/oracle-core/acl/tokens/validate';

describe('Oracle RBAC & Auth', () => {
  describe('validateToken', () => {
    it('rejects missing Authorization header', () => {
      const result = validateToken(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing');
    });

    it('rejects invalid format (not Bearer)', () => {
      const result = validateToken('Basic abc123');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('decodes valid mock token', () => {
      const payload = {
        sub: 'user-123',
        scopes: ['oracle.reader'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const mockToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      
      const result = validateToken(`Bearer ${mockToken}`);
      expect(result.valid).toBe(true);
      expect(result.token?.sub).toBe('user-123');
      expect(result.token?.scopes).toContain('oracle.reader');
    });

    it('rejects expired token', () => {
      const payload = {
        sub: 'user-456',
        scopes: ['oracle.reader'],
        exp: Math.floor(Date.now() / 1000) - 10, // expired 10s ago
        iat: Math.floor(Date.now() / 1000) - 3610,
      };
      const mockToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      
      const result = validateToken(`Bearer ${mockToken}`);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('hasScope', () => {
    it('grants access when token has required scope', () => {
      const token: AccessToken = {
        sub: 'service-A',
        scopes: ['oracle.reader', 'oracle.publisher'],
        exp: 0,
        iat: 0,
      };
      
      expect(hasScope(token, 'oracle.reader')).toBe(true);
      expect(hasScope(token, 'oracle.publisher')).toBe(true);
    });

    it('denies access when token lacks required scope', () => {
      const token: AccessToken = {
        sub: 'service-B',
        scopes: ['oracle.reader'],
        exp: 0,
        iat: 0,
      };
      
      expect(hasScope(token, 'oracle.publisher')).toBe(false);
      expect(hasScope(token, 'oracle.admin')).toBe(false);
    });

    it('admin scope grants all permissions', () => {
      const token: AccessToken = {
        sub: 'admin-user',
        scopes: ['oracle.admin'],
        exp: 0,
        iat: 0,
      };
      
      expect(hasScope(token, 'oracle.reader')).toBe(true);
      expect(hasScope(token, 'oracle.publisher')).toBe(true);
      expect(hasScope(token, 'oracle.admin')).toBe(true);
    });

    it('returns false for null token', () => {
      expect(hasScope(null, 'oracle.reader')).toBe(false);
    });
  });

  describe('requireScope middleware', () => {
    it('returns 401 for missing token', () => {
      const result = requireScope(null, 'oracle.reader');
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(401);
    });

    it('returns 403 when scope is missing', () => {
      const payload = {
        sub: 'user-789',
        scopes: ['oracle.reader'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const mockToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      
      const result = requireScope(`Bearer ${mockToken}`, 'oracle.publisher');
      
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).status).toBe(403);
    });

    it('returns token object when authorized', () => {
      const payload = {
        sub: 'user-999',
        scopes: ['oracle.publisher'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };
      const mockToken = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      
      const result = requireScope(`Bearer ${mockToken}`, 'oracle.publisher');
      
      expect(result).toHaveProperty('token');
      expect((result as { token: AccessToken }).token.sub).toBe('user-999');
    });
  });
});
