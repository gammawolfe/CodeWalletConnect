import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LedgerRepository } from '../ledger-repository';
import { WalletsRepository } from '../wallets-repository';
import { PartnersRepository } from '../partners-repository';
import type { Partner, Wallet } from '@shared/schema';

describe('LedgerRepository', () => {
  let ledgerRepo: LedgerRepository;
  let walletsRepo: WalletsRepository;
  let partnersRepo: PartnersRepository;
  let testPartner: Partner;
  let testWallet: Wallet;

  beforeEach(async () => {
    ledgerRepo = new LedgerRepository();
    walletsRepo = new WalletsRepository();
    partnersRepo = new PartnersRepository();

    // Create test partner
    testPartner = await partnersRepo.create({
      name: 'Test Partner',
      companyName: 'Test Company',
      email: 'test@company.com',
      contactPerson: 'John Doe',
      businessType: 'fintech',
      status: 'approved'
    });

    // Create test wallet
    testWallet = await walletsRepo.create({
      partnerId: testPartner.id,
      externalId: 'test-wallet-123',
      name: 'Test Wallet',
      currency: 'USD',
      status: 'active'
    });
  });

  afterEach(async () => {
    // Clean up test data
    // Note: In a real test environment, you'd use a test database or transactions
  });

  describe('create', () => {
    it('should create a credit entry with correct balance calculation', async () => {
      const entry = await ledgerRepo.create({
        transactionId: 'tx-123',
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        description: 'Initial deposit'
      });

      expect(entry).toBeDefined();
      expect(entry.type).toBe('credit');
      expect(entry.amount).toBe('100.00');
      expect(entry.balance).toBe('100.00');
      expect(entry.walletId).toBe(testWallet.id);
      expect(entry.transactionId).toBe('tx-123');
    });

    it('should create a debit entry with correct balance calculation', async () => {
      // First credit to establish balance
      await ledgerRepo.create({
        transactionId: 'tx-credit',
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD'
      });

      // Then debit
      const debitEntry = await ledgerRepo.create({
        transactionId: 'tx-debit',
        walletId: testWallet.id,
        type: 'debit',
        amount: '25.00',
        currency: 'USD',
        description: 'Payment'
      });

      expect(debitEntry.type).toBe('debit');
      expect(debitEntry.amount).toBe('25.00');
      expect(debitEntry.balance).toBe('75.00');
    });

    it('should handle sequential transactions correctly', async () => {
      // Create multiple entries and verify balance progression
      const entries = [];
      
      entries.push(await ledgerRepo.create({
        transactionId: 'tx-1',
        walletId: testWallet.id,
        type: 'credit',
        amount: '1000.00',
        currency: 'USD'
      }));

      entries.push(await ledgerRepo.create({
        transactionId: 'tx-2',
        walletId: testWallet.id,
        type: 'debit',
        amount: '250.00',
        currency: 'USD'
      }));

      entries.push(await ledgerRepo.create({
        transactionId: 'tx-3',
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD'
      }));

      expect(entries[0].balance).toBe('1000.00');
      expect(entries[1].balance).toBe('750.00');
      expect(entries[2].balance).toBe('850.00');
    });

    it('should handle decimal precision correctly', async () => {
      await ledgerRepo.create({
        transactionId: 'tx-1',
        walletId: testWallet.id,
        type: 'credit',
        amount: '999.99',
        currency: 'USD'
      });

      const entry = await ledgerRepo.create({
        transactionId: 'tx-2',
        walletId: testWallet.id,
        type: 'debit',
        amount: '0.01',
        currency: 'USD'
      });

      expect(entry.balance).toBe('999.98');
    });
  });

  describe('listByWallet', () => {
    it('should return entries for specific wallet ordered by creation time', async () => {
      // Create entries
      await ledgerRepo.create({
        transactionId: 'tx-1',
        walletId: testWallet.id,
        type: 'credit',
        amount: '100.00',
        currency: 'USD'
      });

      await ledgerRepo.create({
        transactionId: 'tx-2',
        walletId: testWallet.id,
        type: 'debit',
        amount: '50.00',
        currency: 'USD'
      });

      const entries = await ledgerRepo.listByWallet(testWallet.id);

      expect(entries).toHaveLength(2);
      expect(entries[0].transactionId).toBe('tx-2'); // Most recent first
      expect(entries[1].transactionId).toBe('tx-1');
    });

    it('should respect limit and offset parameters', async () => {
      // Create multiple entries
      for (let i = 0; i < 5; i++) {
        await ledgerRepo.create({
          transactionId: `tx-${i}`,
          walletId: testWallet.id,
          type: 'credit',
          amount: '10.00',
          currency: 'USD'
        });
      }

      const firstPage = await ledgerRepo.listByWallet(testWallet.id, 2, 0);
      const secondPage = await ledgerRepo.listByWallet(testWallet.id, 2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].transactionId).not.toBe(secondPage[0].transactionId);
    });
  });

  describe('listByTransaction', () => {
    it('should return all entries for a specific transaction', async () => {
      const transactionId = 'tx-transfer';
      
      // Create entries for same transaction (like a transfer)
      await ledgerRepo.create({
        transactionId,
        walletId: testWallet.id,
        type: 'debit',
        amount: '50.00',
        currency: 'USD',
        description: 'Transfer out'
      });

      const entries = await ledgerRepo.listByTransaction(transactionId);

      expect(entries).toHaveLength(1);
      expect(entries[0].transactionId).toBe(transactionId);
      expect(entries[0].type).toBe('debit');
    });
  });

  describe('double-entry integrity', () => {
    it('should maintain balance consistency across concurrent operations', async () => {
      // This test would benefit from actual concurrency testing
      // For now, test sequential operations that simulate race conditions
      
      const initialCredit = await ledgerRepo.create({
        transactionId: 'initial',
        walletId: testWallet.id,
        type: 'credit',
        amount: '1000.00',
        currency: 'USD'
      });

      // Simulate multiple rapid transactions
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          ledgerRepo.create({
            transactionId: `concurrent-${i}`,
            walletId: testWallet.id,
            type: 'debit',
            amount: '10.00',
            currency: 'USD'
          })
        );
      }

      const results = await Promise.all(promises);
      
      // Verify final balance is correct
      const finalEntries = await ledgerRepo.listByWallet(testWallet.id);
      const finalEntry = finalEntries[0]; // Most recent
      
      expect(finalEntry.balance).toBe('900.00'); // 1000 - (10 * 10)
    });
  });
});