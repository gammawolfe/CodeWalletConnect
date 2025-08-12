import { storage } from "../storage";
import { ledgerService } from "./ledger";
import type { CreditWallet, DebitWallet, Transfer } from "@shared/schema";

interface PartnerWalletRequest {
  partnerId: string;
  walletId?: string;
  externalWalletId?: string;
}

export class WalletService {
  async createWallet(partnerId: string, walletData: {
    externalUserId?: string;
    externalWalletId?: string;
    name?: string;
    currency?: string;
    metadata?: any;
  }) {
    const wallet = await storage.createWallet({
      partnerId,
      externalUserId: walletData.externalUserId,
      externalWalletId: walletData.externalWalletId,
      name: walletData.name,
      currency: walletData.currency || 'USD',
      metadata: walletData.metadata
    });

    // Create initial ledger entry with zero balance
    await storage.createLedgerEntry({
      transactionId: 'initial',
      walletId: wallet.id,
      type: 'credit',
      amount: '0.00',
      currency: wallet.currency,
      description: 'Wallet created'
    });

    return wallet;
  }

  async getWalletBalance(walletId: string) {
    const wallet = await storage.getWallet(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const balance = await storage.getWalletBalance(walletId);
    return {
      walletId,
      balance,
      currency: wallet.currency
    };
  }

  async getPartnerWallet(request: PartnerWalletRequest) {
    if (request.walletId) {
      const wallet = await storage.getWallet(request.walletId);
      if (!wallet || wallet.partnerId !== request.partnerId) {
        throw new Error('Wallet not found or access denied');
      }
      return wallet;
    }
    
    if (request.externalWalletId) {
      return await storage.getWalletByExternalId(request.partnerId, request.externalWalletId);
    }
    
    throw new Error('Must provide either walletId or externalWalletId');
  }

  async getPartnerWallets(partnerId: string) {
    return await storage.getWalletsByPartnerId(partnerId);
  }

  async creditWallet(data: CreditWallet & { partnerId: string }) {
    // Check for idempotency
    const existingTx = await storage.getTransactionByIdempotencyKey(data.idempotencyKey);
    if (existingTx) {
      return existingTx;
    }

    const wallet = await this.getPartnerWallet({
      partnerId: data.partnerId,
      walletId: data.walletId
    });
    if (!wallet) {
      throw new Error('Wallet not found or access denied');
    }

    // Create transaction
    const transaction = await storage.createTransaction({
      type: 'credit',
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      toWalletId: data.walletId,
      idempotencyKey: data.idempotencyKey
    });

    // Create ledger entry
    await ledgerService.createDoubleEntry(transaction.id, [
      {
        walletId: data.walletId,
        type: 'credit',
        amount: data.amount,
        currency: data.currency,
        description: data.description || 'Wallet credit'
      }
    ]);

    // Update transaction status
    await storage.updateTransactionStatus(transaction.id, 'completed');

    return transaction;
  }

  async debitWallet(data: DebitWallet) {
    // Check for idempotency
    const existingTx = await storage.getTransactionByIdempotencyKey(data.idempotencyKey);
    if (existingTx) {
      return existingTx;
    }

    const wallet = await storage.getWallet(data.walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    // Check balance
    const balance = await storage.getWalletBalance(data.walletId);
    if (parseFloat(balance) < parseFloat(data.amount)) {
      throw new Error('Insufficient balance');
    }

    // Create transaction
    const transaction = await storage.createTransaction({
      type: 'debit',
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      fromWalletId: data.walletId,
      idempotencyKey: data.idempotencyKey
    });

    // Create ledger entry
    await ledgerService.createDoubleEntry(transaction.id, [
      {
        walletId: data.walletId,
        type: 'debit',
        amount: data.amount,
        currency: data.currency,
        description: data.description || 'Wallet debit'
      }
    ]);

    // Update transaction status
    await storage.updateTransactionStatus(transaction.id, 'completed');

    return transaction;
  }

  async transferBetweenWallets(data: Transfer) {
    // Check for idempotency
    const existingTx = await storage.getTransactionByIdempotencyKey(data.idempotencyKey);
    if (existingTx) {
      return existingTx;
    }

    const fromWallet = await storage.getWallet(data.fromWalletId);
    const toWallet = await storage.getWallet(data.toWalletId);

    if (!fromWallet || !toWallet) {
      throw new Error('Wallet not found');
    }

    // Check balance
    const balance = await storage.getWalletBalance(data.fromWalletId);
    if (parseFloat(balance) < parseFloat(data.amount)) {
      throw new Error('Insufficient balance');
    }

    // Create transaction
    const transaction = await storage.createTransaction({
      type: 'transfer',
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      idempotencyKey: data.idempotencyKey
    });

    // Create double-entry ledger entries
    await ledgerService.createDoubleEntry(transaction.id, [
      {
        walletId: data.fromWalletId,
        type: 'debit',
        amount: data.amount,
        currency: data.currency,
        description: `Transfer to ${data.toWalletId}`
      },
      {
        walletId: data.toWalletId,
        type: 'credit',
        amount: data.amount,
        currency: data.currency,
        description: `Transfer from ${data.fromWalletId}`
      }
    ]);

    // Update transaction status
    await storage.updateTransactionStatus(transaction.id, 'completed');

    return transaction;
  }

  async getTransactionHistory(walletId: string, limit: number = 50, offset: number = 0) {
    const wallet = await storage.getWallet(walletId);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    return await storage.getTransactionsByWallet(walletId, limit, offset);
  }
}

export const walletService = new WalletService();
