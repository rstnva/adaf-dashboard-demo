import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, 'lav-adaf/apps/dashboard/src/lib'),
      '@services': path.resolve(__dirname, './services'),
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
      reportsDirectory: 'coverage/feature-store',
      reporter: ['text', 'lcov'],
      all: true,
      include: [
        'services/feature-store/**/*.ts',
        'src/app/api/feature-store/**/*.ts',
        'src/lib/featureStore/**/*.ts',
        'src/components/feature-store/**/*.tsx',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/tests/**',
        '**/*.d.ts',
        '**/node_modules/**',
      ],
      thresholds: { lines: 60, functions: 60, branches: 50, statements: 60 },
    },
  },
});
