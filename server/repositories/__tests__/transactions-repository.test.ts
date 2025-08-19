import { describe, it, expect, beforeEach } from 'vitest';
import { TransactionsRepository } from '../transactions-repository';
import { WalletsRepository } from '../wallets-repository';
import { PartnersRepository } from '../partners-repository';
import type { Partner, Wallet } from '@shared/schema';

describe('TransactionsRepository', () => {
  let transactionsRepo: TransactionsRepository;
  let walletsRepo: WalletsRepository;
  let partnersRepo: PartnersRepository;
  let testPartner: Partner;
  let testWallet: Wallet;

  beforeEach(async () => {
    transactionsRepo = new TransactionsRepository();
    walletsRepo = new WalletsRepository();
    partnersRepo = new PartnersRepository();

    // Create test partner and wallet
    testPartner = await partnersRepo.create({
      name: 'Test Partner',
      companyName: 'Test Company',
      email: 'test@company.com',
      contactPerson: 'John Doe',
      businessType: 'fintech',
      status: 'approved'
    });

    testWallet = await walletsRepo.create({
      partnerId: testPartner.id,
      externalId: 'test-wallet',
      name: 'Test Wallet',
      currency: 'USD',
      status: 'active'
    });
  });

  describe('create', () => {
    it('should create a credit transaction', async () => {
      const transaction = await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        description: 'Test credit',
        idempotencyKey: 'test-credit-1'
      });

      expect(transaction).toBeDefined();
      expect(transaction.walletId).toBe(testWallet.id);
      expect(transaction.type).toBe('credit');
      expect(transaction.amount).toBe('100.00');
      expect(transaction.currency).toBe('USD');
      expect(transaction.status).toBe('pending');
      expect(transaction.description).toBe('Test credit');
      expect(transaction.idempotencyKey).toBe('test-credit-1');
    });

    it('should create a debit transaction', async () => {
      const transaction = await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'debit',
        amount: '50.00',
        currency: 'USD',
        description: 'Test debit',
        idempotencyKey: 'test-debit-1'
      });

      expect(transaction.type).toBe('debit');
      expect(transaction.amount).toBe('50.00');
      expect(transaction.status).toBe('pending');
    });

    it('should handle transfer transactions', async () => {
      // Create second wallet for transfer
      const secondWallet = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'second-wallet',
        name: 'Second Wallet',
        currency: 'USD',
        status: 'active'
      });

      const transaction = await transactionsRepo.create({
        walletId: testWallet.id,
        toWalletId: secondWallet.id,
        type: 'transfer',
        amount: '75.00',
        currency: 'USD',
        description: 'Test transfer',
        idempotencyKey: 'test-transfer-1'
      });

      expect(transaction.type).toBe('transfer');
      expect(transaction.walletId).toBe(testWallet.id);
      expect(transaction.toWalletId).toBe(secondWallet.id);
      expect(transaction.amount).toBe('75.00');
    });

    it('should prevent duplicate idempotency keys', async () => {
      await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey: 'duplicate-key'
      });

      await expect(
        transactionsRepo.create({
          walletId: testWallet.id,
          type: 'credit',
          amount: '200.00',
          currency: 'USD',
          idempotencyKey: 'duplicate-key'
        })
      ).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      await expect(
        transactionsRepo.create({
          walletId: testWallet.id,
          type: 'credit',
          amount: '',
          currency: 'USD',
          idempotencyKey: 'empty-amount'
        })
      ).rejects.toThrow();
    });

    it('should validate currency format', async () => {
      await expect(
        transactionsRepo.create({
          walletId: testWallet.id,
          type: 'credit',
          amount: '100.00',
          currency: 'INVALID',
          idempotencyKey: 'invalid-currency'
        })
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return transaction by ID', async () => {
      const created = await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        description: 'Find test',
        idempotencyKey: 'find-test'
      });

      const found = await transactionsRepo.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.description).toBe('Find test');
    });

    it('should return null for non-existent ID', async () => {
      const found = await transactionsRepo.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByIdempotencyKey', () => {
    it('should return transaction by idempotency key', async () => {
      const created = await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey: 'idempotency-test'
      });

      const found = await transactionsRepo.findByIdempotencyKey('idempotency-test');

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.idempotencyKey).toBe('idempotency-test');
    });

    it('should return null for non-existent idempotency key', async () => {
      const found = await transactionsRepo.findByIdempotencyKey('non-existent-key');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update transaction status', async () => {
      const transaction = await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey: 'update-test'
      });

      const updated = await transactionsRepo.update(transaction.id, {
        status: 'completed',
        gatewayTransactionId: 'stripe-tx-123'
      });

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('completed');
      expect(updated?.gatewayTransactionId).toBe('stripe-tx-123');
      expect(updated?.amount).toBe('100.00'); // Unchanged
    });

    it('should return null when updating non-existent transaction', async () => {
      const updated = await transactionsRepo.update('non-existent-id', {
        status: 'completed'
      });

      expect(updated).toBeNull();
    });

    it('should not allow updating immutable fields', async () => {
      const transaction = await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey: 'immutable-test'
      });

      const updated = await transactionsRepo.update(transaction.id, {
        status: 'completed',
        // These fields should be ignored or throw error
        amount: '200.00' as any,
        currency: 'EUR' as any,
        type: 'debit' as any
      });

      expect(updated?.amount).toBe('100.00'); // Unchanged
      expect(updated?.currency).toBe('USD'); // Unchanged
      expect(updated?.type).toBe('credit'); // Unchanged
    });
  });

  describe('listByWallet', () => {
    it('should return transactions for specific wallet', async () => {
      await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey: 'list-test-1'
      });

      await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'debit',
        amount: '50.00',
        currency: 'USD',
        idempotencyKey: 'list-test-2'
      });

      const transactions = await transactionsRepo.listByWallet(testWallet.id);

      expect(transactions).toHaveLength(2);
      expect(transactions.every(t => t.walletId === testWallet.id)).toBe(true);
      // Should be ordered by creation time (most recent first)
      expect(transactions[0].idempotencyKey).toBe('list-test-2');
      expect(transactions[1].idempotencyKey).toBe('list-test-1');
    });

    it('should respect limit and offset parameters', async () => {
      // Create multiple transactions
      for (let i = 0; i < 5; i++) {
        await transactionsRepo.create({
          walletId: testWallet.id,
          type: 'credit',
          amount: '10.00',
          currency: 'USD',
          idempotencyKey: `pagination-test-${i}`
        });
      }

      const firstPage = await transactionsRepo.listByWallet(testWallet.id, 2, 0);
      const secondPage = await transactionsRepo.listByWallet(testWallet.id, 2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('listByPartner', () => {
    it('should return all transactions for partner wallets', async () => {
      // Create second wallet for same partner
      const secondWallet = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'second-wallet',
        name: 'Second Wallet',
        currency: 'USD',
        status: 'active'
      });

      await transactionsRepo.create({
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey: 'partner-list-1'
      });

      await transactionsRepo.create({
        walletId: secondWallet.id,
        type: 'credit',
        amount: '200.00',
        currency: 'USD',
        idempotencyKey: 'partner-list-2'
      });

      const transactions = await transactionsRepo.listByPartner(testPartner.id);

      expect(transactions).toHaveLength(2);
      expect(transactions.some(t => t.walletId === testWallet.id)).toBe(true);
      expect(transactions.some(t => t.walletId === secondWallet.id)).toBe(true);
    });
  });

  describe('amount validation', () => {
    it('should validate positive amounts', async () => {
      await expect(
        transactionsRepo.create({
          walletId: testWallet.id,
          type: 'credit',
          amount: '-100.00',
          currency: 'USD',
          idempotencyKey: 'negative-amount'
        })
      ).rejects.toThrow();
    });

    it('should validate decimal precision', async () => {
      await expect(
        transactionsRepo.create({
          walletId: testWallet.id,
          type: 'credit',
          amount: '100.123', // 3 decimal places
          currency: 'USD',
          idempotencyKey: 'precision-test'
        })
      ).rejects.toThrow();
    });

    it('should handle zero amounts appropriately', async () => {
      await expect(
        transactionsRepo.create({
          walletId: testWallet.id,
          type: 'credit',
          amount: '0.00',
          currency: 'USD',
          idempotencyKey: 'zero-amount'
        })
      ).rejects.toThrow();
    });
  });
});