import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.ts', 'server/**/*.test.tsx', 'server/**/__tests__/**/*.test.ts'],
    setupFiles: ['dotenv/config'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test'
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@': path.resolve(__dirname, 'client', 'src'),
    },
  },
});


