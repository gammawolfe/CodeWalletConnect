/**
 * Global test setup for PayFlow test suite
 * This file is run before all tests
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { vi } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.SESSION_SECRET = 'test_session_secret_for_testing';

// Global test timeout
vi.setConfig({ testTimeout: 10000 });

// Mock console methods to reduce noise in tests
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
};

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  if (process.env.VERBOSE_TESTS !== 'true') {
    console.log = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    // Keep error for important test failures
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

// Mock external services that shouldn't be called during tests
vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn(),
      cancel: vi.fn(),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  })),
}));

// Mock nodemailer for email notifications
vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}));

// Global test utilities
declare global {
  var testUtils: {
    createMockPartner: () => any;
    createMockWallet: () => any;
    createMockTransaction: () => any;
  };
}

// Helper functions for creating test data
global.testUtils = {
  createMockPartner: () => ({
    id: 'partner-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Partner',
    companyName: 'Test Company',
    email: 'test@company.com',
    contactPerson: 'John Doe',
    businessType: 'fintech',
    status: 'approved',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),

  createMockWallet: (partnerId?: string) => ({
    id: 'wallet-' + Math.random().toString(36).substr(2, 9),
    partnerId: partnerId || 'partner-123',
    externalId: 'ext-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Wallet',
    currency: 'USD',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),

  createMockTransaction: (walletId?: string) => ({
    id: 'tx-' + Math.random().toString(36).substr(2, 9),
    walletId: walletId || 'wallet-123',
    type: 'credit',
    amount: '100.00',
    currency: 'USD',
    status: 'pending',
    idempotencyKey: 'idem-' + Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};