import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lav-adaf/agents-core': path.resolve(__dirname, '../../packages/agents-core/index.ts'),
      '@lav-adaf/ai-router': path.resolve(__dirname, '../../packages/ai-router/index.ts'),
      '@lav-adaf/integrations': path.resolve(__dirname, '../../packages/integrations/index.ts'),
      '@lav-adaf/wallet': path.resolve(__dirname, '../../packages/wallet/index.ts'),
      '@lav-adaf/observability': path.resolve(__dirname, '../../packages/observability/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/playwright/**',
      '**/*.spec.ts',
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
