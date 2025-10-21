import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 15000,
    include: [
      'tests/api/**/*.test.ts',
      'services/oracle-core/tests/api.oracle.test.ts',
    ],
  },
});
