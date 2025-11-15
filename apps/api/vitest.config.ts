import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  resolve: {
    alias: {
      '@repo/config': path.resolve(__dirname, '../../packages/config/src'),
      '@repo/indexer': path.resolve(__dirname, '../indexer/src')
    }
  }
});

