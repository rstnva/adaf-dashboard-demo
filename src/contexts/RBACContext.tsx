"use client";
import React, { createContext, useContext } from 'react';

type RBACContextValue = {
  hasPermission: (perm: string) => boolean;
  userId?: string;
  permissions: string[];
};

const RBACContext = createContext<RBACContextValue>({
  hasPermission: () => true,
  permissions: [],
});

export function RBACProvider({ children, permissions = [], userId }: { children: React.ReactNode; permissions?: string[]; userId?: string }) {
  const value: RBACContextValue = {
    permissions,
    userId,
    hasPermission: (perm: string) => permissions.includes(perm),
  };
  return <RBACContext.Provider value={value}>{children}</RBACContext.Provider>;
}

export function useRBAC() {
  return useContext(RBACContext);
}

export function rbacTelemetry(route: string, allowed: boolean, userId?: string) {
  // Client-safe telemetry: avoid importing server-only modules in client bundle.
  // Defer server metrics to a dynamic import only on the server.
  try {
    // Fire-and-forget dynamic import for server environments only
    if (typeof window === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      (async () => {
        try {
          const mod = await import('@/metrics/wsp.metrics');
          mod.recordEvent();
        } catch {}
      })();
    }
  } catch {}
  try { console.info('RBAC', { route, allowed, userId }); } catch {}
}
