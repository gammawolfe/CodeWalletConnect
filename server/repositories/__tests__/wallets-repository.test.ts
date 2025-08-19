import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WalletsRepository } from '../wallets-repository';
import { PartnersRepository } from '../partners-repository';
import type { Partner } from '@shared/schema';

describe('WalletsRepository', () => {
  let walletsRepo: WalletsRepository;
  let partnersRepo: PartnersRepository;
  let testPartner: Partner;

  beforeEach(async () => {
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
  });

  describe('create', () => {
    it('should create a wallet with valid data', async () => {
      const wallet = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'wallet-123',
        name: 'Test Wallet',
        currency: 'USD',
        status: 'active'
      });

      expect(wallet).toBeDefined();
      expect(wallet.partnerId).toBe(testPartner.id);
      expect(wallet.externalId).toBe('wallet-123');
      expect(wallet.name).toBe('Test Wallet');
      expect(wallet.currency).toBe('USD');
      expect(wallet.status).toBe('active');
      expect(wallet.id).toBeDefined();
      expect(wallet.createdAt).toBeDefined();
    });

    it('should throw error for duplicate external ID within same partner', async () => {
      await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'duplicate-wallet',
        name: 'First Wallet',
        currency: 'USD',
        status: 'active'
      });

      await expect(
        walletsRepo.create({
          partnerId: testPartner.id,
          externalId: 'duplicate-wallet',
          name: 'Second Wallet',
          currency: 'USD',
          status: 'active'
        })
      ).rejects.toThrow();
    });

    it('should allow same external ID for different partners', async () => {
      const secondPartner = await partnersRepo.create({
        name: 'Second Partner',
        companyName: 'Second Company',
        email: 'second@company.com',
        contactPerson: 'Jane Doe',
        businessType: 'fintech',
        status: 'approved'
      });

      const wallet1 = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'same-external-id',
        name: 'Wallet 1',
        currency: 'USD',
        status: 'active'
      });

      const wallet2 = await walletsRepo.create({
        partnerId: secondPartner.id,
        externalId: 'same-external-id',
        name: 'Wallet 2',
        currency: 'USD',
        status: 'active'
      });

      expect(wallet1.externalId).toBe(wallet2.externalId);
      expect(wallet1.partnerId).not.toBe(wallet2.partnerId);
    });
  });

  describe('findById', () => {
    it('should return wallet by ID', async () => {
      const created = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'findby-test',
        name: 'Find By Test',
        currency: 'EUR',
        status: 'active'
      });

      const found = await walletsRepo.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.currency).toBe('EUR');
    });

    it('should return null for non-existent ID', async () => {
      const found = await walletsRepo.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByExternalId', () => {
    it('should return wallet by partner ID and external ID', async () => {
      const created = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'external-test',
        name: 'External Test',
        currency: 'GBP',
        status: 'active'
      });

      const found = await walletsRepo.findByExternalId(testPartner.id, 'external-test');

      expect(found).toBeDefined();
      expect(found?.partnerId).toBe(testPartner.id);
      expect(found?.externalId).toBe('external-test');
      expect(found?.currency).toBe('GBP');
    });

    it('should return null for non-existent external ID', async () => {
      const found = await walletsRepo.findByExternalId(testPartner.id, 'non-existent');
      expect(found).toBeNull();
    });

    it('should return null for correct external ID but wrong partner', async () => {
      await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'partner-scoped',
        name: 'Partner Scoped',
        currency: 'USD',
        status: 'active'
      });

      const found = await walletsRepo.findByExternalId('wrong-partner-id', 'partner-scoped');
      expect(found).toBeNull();
    });
  });

  describe('listByPartner', () => {
    it('should return all wallets for a partner', async () => {
      await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'wallet-1',
        name: 'Wallet 1',
        currency: 'USD',
        status: 'active'
      });

      await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'wallet-2',
        name: 'Wallet 2',
        currency: 'EUR',
        status: 'suspended'
      });

      const wallets = await walletsRepo.listByPartner(testPartner.id);

      expect(wallets).toHaveLength(2);
      expect(wallets.every(w => w.partnerId === testPartner.id)).toBe(true);
    });

    it('should respect limit and offset parameters', async () => {
      // Create multiple wallets
      for (let i = 0; i < 5; i++) {
        await walletsRepo.create({
          partnerId: testPartner.id,
          externalId: `wallet-${i}`,
          name: `Wallet ${i}`,
          currency: 'USD',
          status: 'active'
        });
      }

      const firstPage = await walletsRepo.listByPartner(testPartner.id, 2, 0);
      const secondPage = await walletsRepo.listByPartner(testPartner.id, 2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(2);
      expect(firstPage[0].id).not.toBe(secondPage[0].id);
    });
  });

  describe('update', () => {
    it('should update wallet properties', async () => {
      const wallet = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'update-test',
        name: 'Original Name',
        currency: 'USD',
        status: 'active'
      });

      const updated = await walletsRepo.update(wallet.id, {
        name: 'Updated Name',
        status: 'suspended'
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.status).toBe('suspended');
      expect(updated?.currency).toBe('USD'); // Unchanged
      expect(updated?.partnerId).toBe(testPartner.id); // Unchanged
    });

    it('should return null when updating non-existent wallet', async () => {
      const updated = await walletsRepo.update('non-existent-id', {
        name: 'Updated Name'
      });

      expect(updated).toBeNull();
    });
  });

  describe('calculateBalance', () => {
    it('should return 0.00 for wallet with no transactions', async () => {
      const wallet = await walletsRepo.create({
        partnerId: testPartner.id,
        externalId: 'balance-test',
        name: 'Balance Test',
        currency: 'USD',
        status: 'active'
      });

      const balance = await walletsRepo.calculateBalance(wallet.id);
      expect(balance).toBe('0.00');
    });

    // Note: This test would require integration with ledger repository
    // For now, we'll test the method exists and handles empty case
  });

  describe('data validation', () => {
    it('should require all mandatory fields', async () => {
      await expect(
        walletsRepo.create({
          partnerId: testPartner.id,
          externalId: '',
          name: 'Test',
          currency: 'USD',
          status: 'active'
        })
      ).rejects.toThrow();
    });

    it('should validate currency format', async () => {
      await expect(
        walletsRepo.create({
          partnerId: testPartner.id,
          externalId: 'currency-test',
          name: 'Currency Test',
          currency: 'INVALID',
          status: 'active'
        })
      ).rejects.toThrow();
    });

    it('should validate status values', async () => {
      await expect(
        walletsRepo.create({
          partnerId: testPartner.id,
          externalId: 'status-test',
          name: 'Status Test',
          currency: 'USD',
          status: 'invalid_status' as any
        })
      ).rejects.toThrow();
    });
  });
});