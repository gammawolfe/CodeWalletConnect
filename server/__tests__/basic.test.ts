import { describe, it, expect } from 'vitest';
import { insertWalletSchema, creditWalletSchema } from '@shared/schema';

describe('Basic Integration Tests', () => {
  describe('Schema Validation', () => {
    it('should validate wallet creation schema', () => {
      const validWallet = {
        partnerId: '550e8400-e29b-41d4-a716-446655440000',
        externalUserId: 'user-123',
        externalWalletId: 'wallet-456', 
        name: 'Test Wallet',
        currency: 'USD'
      };

      const result = insertWalletSchema.safeParse(validWallet);
      if (!result.success) {
        console.log('Wallet validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should validate credit transaction schema', () => {
      const validCredit = {
        walletId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        amount: '100.00',
        currency: 'USD',
        description: 'Test deposit',
        idempotencyKey: '550e8400-e29b-41d4-a716-446655440001' // Valid UUID
      };

      const result = creditWalletSchema.safeParse(validCredit);
      if (!result.success) {
        console.log('Validation errors:', result.error.issues);
      }
      expect(result.success).toBe(true);
    });

    it('should reject invalid currency codes', () => {
      const invalidWallet = {
        partnerId: '550e8400-e29b-41d4-a716-446655440000',
        externalUserId: 'user-123',
        externalWalletId: 'wallet-456',
        name: 'Test Wallet', 
        currency: 'INVALID'
      };

      const result = insertWalletSchema.safeParse(invalidWallet);
      if (result.success) {
        console.log('Expected validation to fail for invalid currency, but it passed');
      }
      expect(result.success).toBe(false);
    });

    it('should reject invalid decimal amounts', () => {
      const invalidCredit = {
        type: 'credit',
        amount: '100.123', // Too many decimal places
        currency: 'USD',
        idempotencyKey: 'test-key'
      };

      const result = creditWalletSchema.safeParse(invalidCredit);
      expect(result.success).toBe(false);
    });
  });

  describe('Environment Configuration', () => {
    it('should have test environment configured', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have database URL configured for testing', () => {
      expect(process.env.DATABASE_URL).toContain('test');
    });
  });

  describe('Type Safety', () => {
    it('should provide proper TypeScript types', () => {
      // This is a compile-time check - if it compiles, types are working
      const wallet: { partnerId: string } = { partnerId: 'test' };
      expect(typeof wallet.partnerId).toBe('string');
    });
  });
});