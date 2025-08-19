import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'server/**/*.test.ts', 
      'server/**/*.test.tsx', 
      'server/**/__tests__/**/*.test.ts',
      'shared/**/*.test.ts'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**'
    ],
    setupFiles: ['dotenv/config', './test-setup.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgres://test:test@localhost:5432/test',
      NODE_ENV: 'test',
      SESSION_SECRET: 'test_session_secret'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/__tests__/**',
        '**/test-setup.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 90,
          statements: 90
        },
        // Higher standards for critical financial components
        'server/services/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'server/repositories/': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@': path.resolve(__dirname, 'client', 'src'),
    },
  },
});


