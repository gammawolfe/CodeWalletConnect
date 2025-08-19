import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletService } from '../wallet';
import { WalletsRepository } from '../../repositories/wallets-repository';
import { LedgerRepository } from '../../repositories/ledger-repository';
import { TransactionsRepository } from '../../repositories/transactions-repository';

// Mock the repositories
vi.mock('../../repositories/wallets-repository');
vi.mock('../../repositories/ledger-repository');
vi.mock('../../repositories/transactions-repository');

describe('WalletService', () => {
  let walletService: WalletService;
  let mockWalletsRepo: vi.Mocked<WalletsRepository>;
  let mockLedgerRepo: vi.Mocked<LedgerRepository>;
  let mockTransactionsRepo: vi.Mocked<TransactionsRepository>;

  beforeEach(() => {
    mockWalletsRepo = vi.mocked(new WalletsRepository());
    mockLedgerRepo = vi.mocked(new LedgerRepository());
    mockTransactionsRepo = vi.mocked(new TransactionsRepository());
    
    // Inject mocked repositories
    walletService = new WalletService();
    (walletService as any).walletsRepo = mockWalletsRepo;
    (walletService as any).ledgerRepo = mockLedgerRepo;
    (walletService as any).transactionsRepo = mockTransactionsRepo;
  });

  describe('createWallet', () => {
    it('should create wallet with valid data', async () => {
      const walletData = {
        partnerId: 'partner-123',
        externalId: 'ext-wallet-1',
        name: 'Test Wallet',
        currency: 'USD',
        status: 'active' as const
      };

      const mockWallet = {
        id: 'wallet-123',
        ...walletData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWalletsRepo.create.mockResolvedValue(mockWallet);

      const result = await walletService.createWallet(walletData);

      expect(result).toEqual(mockWallet);
      expect(mockWalletsRepo.create).toHaveBeenCalledWith(walletData);
    });

    it('should validate partner exists', async () => {
      mockWalletsRepo.create.mockRejectedValue(new Error('Partner not found'));

      await expect(
        walletService.createWallet({
          partnerId: 'non-existent',
          externalId: 'test',
          name: 'Test',
          currency: 'USD',
          status: 'active'
        })
      ).rejects.toThrow('Partner not found');
    });

    it('should prevent duplicate external IDs', async () => {
      mockWalletsRepo.create.mockRejectedValue(new Error('Duplicate external ID'));

      await expect(
        walletService.createWallet({
          partnerId: 'partner-123',
          externalId: 'duplicate-id',
          name: 'Test',
          currency: 'USD',
          status: 'active'
        })
      ).rejects.toThrow('Duplicate external ID');
    });
  });

  describe('getWalletBalance', () => {
    it('should return current wallet balance', async () => {
      const walletId = 'wallet-123';
      mockWalletsRepo.calculateBalance.mockResolvedValue('1234.56');

      const balance = await walletService.getWalletBalance(walletId);

      expect(balance).toBe('1234.56');
      expect(mockWalletsRepo.calculateBalance).toHaveBeenCalledWith(walletId);
    });

    it('should return 0.00 for wallet with no transactions', async () => {
      mockWalletsRepo.calculateBalance.mockResolvedValue('0.00');

      const balance = await walletService.getWalletBalance('empty-wallet');
      expect(balance).toBe('0.00');
    });
  });

  describe('getWalletHistory', () => {
    it('should return paginated transaction history', async () => {
      const walletId = 'wallet-123';
      const mockTransactions = [
        {
          id: 'tx-1',
          walletId,
          type: 'credit' as const,
          amount: '100.00',
          currency: 'USD',
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'tx-2',
          walletId,
          type: 'debit' as const,
          amount: '50.00',
          currency: 'USD',
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockTransactionsRepo.listByWallet.mockResolvedValue(mockTransactions);

      const result = await walletService.getWalletHistory(walletId, 10, 0);

      expect(result).toEqual(mockTransactions);
      expect(mockTransactionsRepo.listByWallet).toHaveBeenCalledWith(walletId, 10, 0);
    });

    it('should handle pagination correctly', async () => {
      await walletService.getWalletHistory('wallet-123', 5, 10);

      expect(mockTransactionsRepo.listByWallet).toHaveBeenCalledWith('wallet-123', 5, 10);
    });
  });

  describe('updateWallet', () => {
    it('should update wallet properties', async () => {
      const walletId = 'wallet-123';
      const updates = {
        name: 'Updated Name',
        status: 'suspended' as const
      };

      const updatedWallet = {
        id: walletId,
        partnerId: 'partner-123',
        externalId: 'ext-1',
        name: 'Updated Name',
        currency: 'USD',
        status: 'suspended' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWalletsRepo.update.mockResolvedValue(updatedWallet);

      const result = await walletService.updateWallet(walletId, updates);

      expect(result).toEqual(updatedWallet);
      expect(mockWalletsRepo.update).toHaveBeenCalledWith(walletId, updates);
    });

    it('should return null for non-existent wallet', async () => {
      mockWalletsRepo.update.mockResolvedValue(null);

      const result = await walletService.updateWallet('non-existent', { name: 'New Name' });

      expect(result).toBeNull();
    });
  });

  describe('getWalletsByPartner', () => {
    it('should return all wallets for a partner', async () => {
      const partnerId = 'partner-123';
      const mockWallets = [
        {
          id: 'wallet-1',
          partnerId,
          externalId: 'ext-1',
          name: 'Wallet 1',
          currency: 'USD',
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'wallet-2',
          partnerId,
          externalId: 'ext-2',
          name: 'Wallet 2',
          currency: 'EUR',
          status: 'active' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockWalletsRepo.listByPartner.mockResolvedValue(mockWallets);

      const result = await walletService.getWalletsByPartner(partnerId);

      expect(result).toEqual(mockWallets);
      expect(mockWalletsRepo.listByPartner).toHaveBeenCalledWith(partnerId, undefined, undefined);
    });

    it('should handle pagination for partner wallets', async () => {
      await walletService.getWalletsByPartner('partner-123', 10, 20);

      expect(mockWalletsRepo.listByPartner).toHaveBeenCalledWith('partner-123', 10, 20);
    });
  });

  describe('validateWalletOwnership', () => {
    it('should return true for valid wallet ownership', async () => {
      const mockWallet = {
        id: 'wallet-123',
        partnerId: 'partner-123',
        externalId: 'ext-1',
        name: 'Test Wallet',
        currency: 'USD',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWalletsRepo.findById.mockResolvedValue(mockWallet);

      const isValid = await walletService.validateWalletOwnership('wallet-123', 'partner-123');

      expect(isValid).toBe(true);
      expect(mockWalletsRepo.findById).toHaveBeenCalledWith('wallet-123');
    });

    it('should return false for invalid wallet ownership', async () => {
      const mockWallet = {
        id: 'wallet-123',
        partnerId: 'different-partner',
        externalId: 'ext-1',
        name: 'Test Wallet',
        currency: 'USD',
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockWalletsRepo.findById.mockResolvedValue(mockWallet);

      const isValid = await walletService.validateWalletOwnership('wallet-123', 'partner-123');

      expect(isValid).toBe(false);
    });

    it('should return false for non-existent wallet', async () => {
      mockWalletsRepo.findById.mockResolvedValue(null);

      const isValid = await walletService.validateWalletOwnership('non-existent', 'partner-123');

      expect(isValid).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockWalletsRepo.findById.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        walletService.validateWalletOwnership('wallet-123', 'partner-123')
      ).rejects.toThrow('Database connection failed');
    });
  });
});