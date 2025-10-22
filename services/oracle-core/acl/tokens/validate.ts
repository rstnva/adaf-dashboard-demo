export type OracleScope = 'oracle.reader' | 'oracle.publisher' | 'oracle.admin';

export interface AccessToken {
  sub: string; // subject (user/service ID)
  scopes: OracleScope[];
  exp: number; // expiration timestamp (seconds since epoch)
  iat: number; // issued at
}

export interface TokenValidationResult {
  valid: boolean;
  token?: AccessToken;
  error?: string;
}

/**
 * Validates JWT bearer token and extracts scopes.
 * In production, verifies signature against JWKS endpoint.
 * For demo/shadow mode, accepts mock tokens from test fixtures.
 */
export function validateToken(bearerHeader: string | null): TokenValidationResult {
  if (!bearerHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  const parts = bearerHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return { valid: false, error: 'Invalid Authorization format, expected Bearer <token>' };
  }

  const token = parts[1];

  // TODO: Replace with proper JWT verification (jsonwebtoken library + JWKS)
  // For now, decode base64 payload (DEMO ONLY)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64').toString());
    
    const accessToken: AccessToken = {
      sub: payload.sub ?? 'unknown',
      scopes: Array.isArray(payload.scopes) ? payload.scopes : [],
      exp: payload.exp ?? 0,
      iat: payload.iat ?? 0,
    };

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (accessToken.exp && accessToken.exp < now) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, token: accessToken };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

/**
 * Checks if token has required scope.
 */
export function hasScope(token: AccessToken | null, requiredScope: OracleScope): boolean {
  if (!token) {
    return false;
  }
  
  // Admin scope grants all permissions
  if (token.scopes.includes('oracle.admin')) {
    return true;
  }

  return token.scopes.includes(requiredScope);
}

/**
 * Middleware: Enforce scope on API endpoint.
 * Returns null if authorized, otherwise returns error Response.
 */
export function requireScope(
  bearerHeader: string | null,
  requiredScope: OracleScope
): { token: AccessToken } | Response {
  const result = validateToken(bearerHeader);
  
  if (!result.valid || !result.token) {
    return new Response(JSON.stringify({ error: result.error ?? 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!hasScope(result.token, requiredScope)) {
    return new Response(
      JSON.stringify({ error: `Missing required scope: ${requiredScope}` }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return { token: result.token };
}
