import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@clm/core': path.join(ROOT, 'packages/core/src/index.ts'),
      '@clm/landscape': path.join(ROOT, 'packages/landscape/src/index.ts'),
      '@clm/dynamics': path.join(ROOT, 'packages/dynamics/src/index.ts'),
      '@clm/structural': path.join(ROOT, 'packages/structural/src/index.ts'),
      '@clm/interpretation': path.join(ROOT, 'packages/interpretation/src/index.ts'),
      '@clm/trajectory-explanation': path.join(ROOT, 'packages/trajectory-explanation/src/index.ts'),
    },
  },
  test: {
    include: ['packages/**/src/**/__tests__/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
