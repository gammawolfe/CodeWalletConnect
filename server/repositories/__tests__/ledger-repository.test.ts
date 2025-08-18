import { describe, it, expect, beforeEach } from 'vitest';
import { ledgerRepository } from '../ledger-repository';
import { walletsRepository } from '../wallets-repository';
import { partnersRepository } from '../partners-repository';
import { db } from '../../db';
import { partners, wallets, ledgerEntries } from '@shared/schema';

describe('LedgerRepository', () => {
  let testPartnerId: string;
  let testWalletId: string;

  beforeEach(async () => {
    // Clean up existing test data
    await db.delete(ledgerEntries);
    await db.delete(wallets);
    await db.delete(partners);

    // Create a test partner
    const partner = await partnersRepository.create({
      name: 'Test Partner',
      companyName: 'Test Company',
      email: 'test@example.com',
      contactPerson: 'Test Person',
      businessType: 'test'
    });
    testPartnerId = partner.id;

    // Create a test wallet
    const wallet = await walletsRepository.create({
      partnerId: testPartnerId,
      name: 'Test Wallet',
      currency: 'USD'
    });
    testWalletId = wallet.id;
  });

  it('should calculate balance correctly for credit entries', async () => {
    // Create first credit entry
    const entry1 = await ledgerRepository.create({
      transactionId: 'tx-1',
      walletId: testWalletId,
      type: 'credit',
      amount: '100.00',
      currency: 'USD',
      description: 'First credit'
    });

    expect(entry1.balance).toBe('100.00');

    // Create second credit entry
    const entry2 = await ledgerRepository.create({
      transactionId: 'tx-2',
      walletId: testWalletId,
      type: 'credit',
      amount: '50.00',
      currency: 'USD',
      description: 'Second credit'
    });

    expect(entry2.balance).toBe('150.00');
  });

  it('should calculate balance correctly for debit entries', async () => {
    // Create initial credit
    await ledgerRepository.create({
      transactionId: 'tx-1',
      walletId: testWalletId,
      type: 'credit',
      amount: '200.00',
      currency: 'USD',
      description: 'Initial credit'
    });

    // Create debit entry
    const debitEntry = await ledgerRepository.create({
      transactionId: 'tx-2',
      walletId: testWalletId,
      type: 'debit',
      amount: '75.00',
      currency: 'USD',
      description: 'Debit entry'
    });

    expect(debitEntry.balance).toBe('125.00');
  });

  it('should handle starting from zero balance', async () => {
    const entry = await ledgerRepository.create({
      transactionId: 'tx-1',
      walletId: testWalletId,
      type: 'credit',
      amount: '25.50',
      currency: 'USD',
      description: 'First entry'
    });

    expect(entry.balance).toBe('25.50');
  });

  it('should handle decimal precision correctly', async () => {
    // Create entry with precise decimal
    const entry1 = await ledgerRepository.create({
      transactionId: 'tx-1',
      walletId: testWalletId,
      type: 'credit',
      amount: '99.99',
      currency: 'USD',
      description: 'Precise decimal'
    });

    expect(entry1.balance).toBe('99.99');

    // Add small amount
    const entry2 = await ledgerRepository.create({
      transactionId: 'tx-2',
      walletId: testWalletId,
      type: 'credit',
      amount: '0.01',
      currency: 'USD',
      description: 'One cent'
    });

    expect(entry2.balance).toBe('100.00');
  });
});