import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionService } from '../transaction';
import { TransactionsRepository } from '../../repositories/transactions-repository';
import { LedgerRepository } from '../../repositories/ledger-repository';
import { WalletsRepository } from '../../repositories/wallets-repository';
import { PaymentGatewayService } from '../payment-gateway';

// Mock the repositories and services
vi.mock('../../repositories/transactions-repository');
vi.mock('../../repositories/ledger-repository');
vi.mock('../../repositories/wallets-repository');
vi.mock('../payment-gateway');

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockTransactionsRepo: vi.Mocked<TransactionsRepository>;
  let mockLedgerRepo: vi.Mocked<LedgerRepository>;
  let mockWalletsRepo: vi.Mocked<WalletsRepository>;
  let mockPaymentGateway: vi.Mocked<PaymentGatewayService>;

  const mockWallet = {
    id: 'wallet-123',
    partnerId: 'partner-123',
    externalId: 'ext-wallet',
    name: 'Test Wallet',
    currency: 'USD',
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockTransactionsRepo = vi.mocked(new TransactionsRepository());
    mockLedgerRepo = vi.mocked(new LedgerRepository());
    mockWalletsRepo = vi.mocked(new WalletsRepository());
    mockPaymentGateway = vi.mocked(new PaymentGatewayService());

    transactionService = new TransactionService();
    (transactionService as any).transactionsRepo = mockTransactionsRepo;
    (transactionService as any).ledgerRepo = mockLedgerRepo;
    (transactionService as any).walletsRepo = mockWalletsRepo;
    (transactionService as any).paymentGateway = mockPaymentGateway;

    // Default wallet lookup
    mockWalletsRepo.findById.mockResolvedValue(mockWallet);
  });

  describe('createTransaction', () => {
    it('should create a credit transaction with idempotency', async () => {
      const transactionData = {
        walletId: 'wallet-123',
        type: 'credit' as const,
        amount: '100.00',
        currency: 'USD',
        description: 'Test deposit',
        idempotencyKey: 'test-credit-1'
      };

      const mockTransaction = {
        id: 'tx-123',
        ...transactionData,
        status: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Check for existing transaction with same idempotency key
      mockTransactionsRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockTransactionsRepo.create.mockResolvedValue(mockTransaction);

      const result = await transactionService.createTransaction(transactionData);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionsRepo.findByIdempotencyKey).toHaveBeenCalledWith('test-credit-1');
      expect(mockTransactionsRepo.create).toHaveBeenCalledWith(transactionData);
    });

    it('should return existing transaction for duplicate idempotency key', async () => {
      const existingTransaction = {
        id: 'tx-existing',
        walletId: 'wallet-123',
        type: 'credit' as const,
        amount: '100.00',
        currency: 'USD',
        status: 'completed' as const,
        idempotencyKey: 'duplicate-key',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTransactionsRepo.findByIdempotencyKey.mockResolvedValue(existingTransaction);

      const result = await transactionService.createTransaction({
        walletId: 'wallet-123',
        type: 'credit',
        amount: '200.00', // Different amount
        currency: 'USD',
        idempotencyKey: 'duplicate-key'
      });

      expect(result).toEqual(existingTransaction);
      expect(mockTransactionsRepo.create).not.toHaveBeenCalled();
    });

    it('should validate wallet exists', async () => {
      mockWalletsRepo.findById.mockResolvedValue(null);

      await expect(
        transactionService.createTransaction({
          walletId: 'non-existent-wallet',
          type: 'credit',
          amount: '100.00',
          currency: 'USD',
          idempotencyKey: 'test-key'
        })
      ).rejects.toThrow('Wallet not found');
    });

    it('should validate wallet is active', async () => {
      mockWalletsRepo.findById.mockResolvedValue({
        ...mockWallet,
        status: 'suspended'
      });

      await expect(
        transactionService.createTransaction({
          walletId: 'wallet-123',
          type: 'credit',
          amount: '100.00',
          currency: 'USD',
          idempotencyKey: 'test-key'
        })
      ).rejects.toThrow('Wallet is not active');
    });

    it('should validate currency matches wallet', async () => {
      await expect(
        transactionService.createTransaction({
          walletId: 'wallet-123',
          type: 'credit',
          amount: '100.00',
          currency: 'EUR', // Different from wallet currency (USD)
          idempotencyKey: 'test-key'
        })
      ).rejects.toThrow('Currency mismatch');
    });
  });

  describe('processTransaction', () => {
    it('should process credit transaction successfully', async () => {
      const mockTransaction = {
        id: 'tx-123',
        walletId: 'wallet-123',
        type: 'credit' as const,
        amount: '100.00',
        currency: 'USD',
        status: 'pending' as const,
        idempotencyKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockLedgerEntry = {
        id: 'ledger-123',
        transactionId: 'tx-123',
        walletId: 'wallet-123',
        type: 'credit' as const,
        amount: '100.00',
        currency: 'USD',
        balance: '100.00',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTransactionsRepo.findById.mockResolvedValue(mockTransaction);
      mockLedgerRepo.create.mockResolvedValue(mockLedgerEntry);
      mockTransactionsRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: 'completed'
      });

      const result = await transactionService.processTransaction('tx-123');

      expect(result.status).toBe('completed');
      expect(mockLedgerRepo.create).toHaveBeenCalledWith({
        transactionId: 'tx-123',
        walletId: 'wallet-123',
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        description: undefined
      });
    });

    it('should process debit transaction with sufficient balance', async () => {
      const mockTransaction = {
        id: 'tx-debit',
        walletId: 'wallet-123',
        type: 'debit' as const,
        amount: '50.00',
        currency: 'USD',
        status: 'pending' as const,
        idempotencyKey: 'debit-key',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTransactionsRepo.findById.mockResolvedValue(mockTransaction);
      mockWalletsRepo.calculateBalance.mockResolvedValue('100.00');
      mockLedgerRepo.create.mockResolvedValue({
        id: 'ledger-debit',
        transactionId: 'tx-debit',
        walletId: 'wallet-123',
        type: 'debit',
        amount: '50.00',
        currency: 'USD',
        balance: '50.00',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockTransactionsRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: 'completed'
      });

      const result = await transactionService.processTransaction('tx-debit');

      expect(result.status).toBe('completed');
      expect(mockWalletsRepo.calculateBalance).toHaveBeenCalledWith('wallet-123');
    });

    it('should fail debit transaction with insufficient balance', async () => {
      const mockTransaction = {
        id: 'tx-debit-fail',
        walletId: 'wallet-123',
        type: 'debit' as const,
        amount: '150.00',
        currency: 'USD',
        status: 'pending' as const,
        idempotencyKey: 'insufficient-balance',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTransactionsRepo.findById.mockResolvedValue(mockTransaction);
      mockWalletsRepo.calculateBalance.mockResolvedValue('100.00');
      mockTransactionsRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: 'failed'
      });

      const result = await transactionService.processTransaction('tx-debit-fail');

      expect(result.status).toBe('failed');
      expect(mockLedgerRepo.create).not.toHaveBeenCalled();
    });

    it('should handle transfer transactions', async () => {
      const sourceWallet = mockWallet;
      const targetWallet = {
        ...mockWallet,
        id: 'wallet-target',
        externalId: 'target-wallet'
      };

      const mockTransaction = {
        id: 'tx-transfer',
        walletId: 'wallet-123',
        toWalletId: 'wallet-target',
        type: 'transfer' as const,
        amount: '75.00',
        currency: 'USD',
        status: 'pending' as const,
        idempotencyKey: 'transfer-key',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTransactionsRepo.findById.mockResolvedValue(mockTransaction);
      mockWalletsRepo.calculateBalance.mockResolvedValue('100.00');
      mockWalletsRepo.findById
        .mockResolvedValueOnce(sourceWallet)
        .mockResolvedValueOnce(targetWallet);
      
      // Mock ledger entries for both debit and credit
      mockLedgerRepo.create
        .mockResolvedValueOnce({
          id: 'ledger-debit',
          transactionId: 'tx-transfer',
          walletId: 'wallet-123',
          type: 'debit',
          amount: '75.00',
          currency: 'USD',
          balance: '25.00',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .mockResolvedValueOnce({
          id: 'ledger-credit',
          transactionId: 'tx-transfer',
          walletId: 'wallet-target',
          type: 'credit',
          amount: '75.00',
          currency: 'USD',
          balance: '75.00',
          createdAt: new Date(),
          updatedAt: new Date()
        });

      mockTransactionsRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: 'completed'
      });

      const result = await transactionService.processTransaction('tx-transfer');

      expect(result.status).toBe('completed');
      expect(mockLedgerRepo.create).toHaveBeenCalledTimes(2);
    });

    it('should return null for non-existent transaction', async () => {
      mockTransactionsRepo.findById.mockResolvedValue(null);

      const result = await transactionService.processTransaction('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getTransactionStatus', () => {
    it('should return transaction status', async () => {
      const mockTransaction = {
        id: 'tx-123',
        walletId: 'wallet-123',
        type: 'credit' as const,
        amount: '100.00',
        currency: 'USD',
        status: 'completed' as const,
        idempotencyKey: 'test-key',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTransactionsRepo.findById.mockResolvedValue(mockTransaction);

      const result = await transactionService.getTransactionStatus('tx-123');

      expect(result?.status).toBe('completed');
    });
  });

  describe('error handling', () => {
    it('should handle processing errors gracefully', async () => {
      const mockTransaction = {
        id: 'tx-error',
        walletId: 'wallet-123',
        type: 'credit' as const,
        amount: '100.00',
        currency: 'USD',
        status: 'pending' as const,
        idempotencyKey: 'error-key',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockTransactionsRepo.findById.mockResolvedValue(mockTransaction);
      mockLedgerRepo.create.mockRejectedValue(new Error('Database error'));
      mockTransactionsRepo.update.mockResolvedValue({
        ...mockTransaction,
        status: 'failed'
      });

      const result = await transactionService.processTransaction('tx-error');

      expect(result.status).toBe('failed');
      expect(mockTransactionsRepo.update).toHaveBeenCalledWith('tx-error', {
        status: 'failed',
        error: 'Database error'
      });
    });
  });
});