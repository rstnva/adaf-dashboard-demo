import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 60000,
    hookTimeout: 30000,
    include: ['**/*.{test,spec}.ts', '**/*.{test,spec}.tsx'],
    testNamePattern: /@integration/i,
    reporters: ['default'],
  },
});
