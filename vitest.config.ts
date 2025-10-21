import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, 'lav-adaf/apps/dashboard/src/lib'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // 30s for integration tests
    hookTimeout: 15000, // 15s for setup/teardown hooks
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.e2e.test.{ts,tsx}',
      '**/playwright/**',
      '**/*.spec.ts',
      '**/ADAF-DASHBOARD-v1.1/**',
      // Exclude HTTP integration tests by default; they run in a separate job
      'tests/api/**',
      'services/oracle-core/tests/api.oracle.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage/wsp',
      reporter: ['text', 'lcov'],
      all: true,
      include: [
        'src/lib/wsp/adapters/**',
        'src/lib/wsp/cache/**',
        'src/lib/wsp/norm/**',
        'src/lib/wsp/schemas/**',
        'src/components/dashboard/wsp/utils/**',
        'src/metrics/wsp.metrics.ts',
      ],
      thresholds: { lines: 75, functions: 75, branches: 70, statements: 75 },
    },
  },
});
