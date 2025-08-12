import { storage } from "../storage";
import { transactionService } from "./transaction";
import type { InsertWallet } from "@shared/schema";

interface PartnerWalletRequest {
  partnerId: string;
  walletId?: string;
  externalWalletId?: string;
}

export class WalletService {
  async createWallet(partnerId: string, walletData: Omit<InsertWallet, 'partnerId'>) {
    const wallet = await storage.createWallet({
      partnerId,
      ...walletData,
      currency: walletData.currency || 'USD'
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

  async getWalletBalance(partnerId: string, walletId: string) {
    const wallet = await this.getPartnerWallet({ partnerId, walletId });
    if (!wallet) {
      throw new Error('Wallet not found or access denied');
    }

    const balance = await storage.getWalletBalance(walletId);
    return {
      walletId,
      balance,
      currency: wallet.currency
    };
  }

  async creditWallet(partnerId: string, data: {
    walletId: string;
    amount: string;
    currency?: string;
    description?: string;
    idempotencyKey: string;
  }) {
    return await transactionService.createTransaction(partnerId, {
      type: 'credit',
      amount: data.amount,
      currency: data.currency || 'USD',
      description: data.description,
      toWalletId: data.walletId,
      idempotencyKey: data.idempotencyKey
    });
  }

  async debitWallet(partnerId: string, data: {
    walletId: string;
    amount: string;
    currency?: string;
    description?: string;
    idempotencyKey: string;
  }) {
    // Check balance first
    const balance = await storage.getWalletBalance(data.walletId);
    if (parseFloat(balance) < parseFloat(data.amount)) {
      throw new Error('Insufficient balance');
    }

    return await transactionService.createTransaction(partnerId, {
      type: 'debit',
      amount: data.amount,
      currency: data.currency || 'USD',
      description: data.description,
      fromWalletId: data.walletId,
      idempotencyKey: data.idempotencyKey
    });
  }

  async transferBetweenWallets(partnerId: string, data: {
    fromWalletId: string;
    toWalletId: string;
    amount: string;
    currency?: string;
    description?: string;
    idempotencyKey: string;
  }) {
    // Check balance first
    const balance = await storage.getWalletBalance(data.fromWalletId);
    if (parseFloat(balance) < parseFloat(data.amount)) {
      throw new Error('Insufficient balance');
    }

    return await transactionService.createTransaction(partnerId, {
      type: 'transfer',
      amount: data.amount,
      currency: data.currency || 'USD',
      description: data.description,
      fromWalletId: data.fromWalletId,
      toWalletId: data.toWalletId,
      idempotencyKey: data.idempotencyKey
    });
  }
}

export const walletService = new WalletService();