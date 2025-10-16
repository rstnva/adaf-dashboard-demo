export type OracleScope = 'oracle.reader' | 'oracle.publisher' | 'oracle.admin';

export interface AccessToken {
  subject: string;
  scopes: OracleScope[];
}

export function hasScope(token: AccessToken | null, scope: OracleScope): boolean {
  if (!token) return false;
  return token.scopes.includes(scope) || token.scopes.includes('oracle.admin');
}

export function ensureScope(token: AccessToken | null, scope: OracleScope) {
  if (!hasScope(token, scope)) {
    const error = new Error('Forbidden');
    (error as any).statusCode = 403;
    throw error;
  }
}
