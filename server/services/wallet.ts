// storage removed in favor of repositories
import { transactionService } from "./transaction";
import type { InsertWallet } from "@shared/schema";
import { walletsRepository, partnersRepository } from "../repositories";

interface PartnerWalletRequest {
  partnerId: string;
  walletId?: string;
  externalWalletId?: string;
}

export class WalletService {
  async getOrCreateClearingWallet(partnerId: string) {
    const partner = await partnersRepository.getById(partnerId);
    const existingClearingWalletId = (partner as any)?.settings?.clearingWalletId as string | undefined;
    if (existingClearingWalletId) {
      const existing = await walletsRepository.getById(existingClearingWalletId);
      if (existing) return existing;
    }

    const clearingWallet = await walletsRepository.create({
      partnerId,
      name: "Clearing",
      currency: 'USD',
      metadata: { system: true, purpose: 'clearing' },
    } as unknown as Omit<InsertWallet, 'partnerId'> & { partnerId: string });

    const currentSettings = ((partner as any)?.settings || {}) as Record<string, any>;
    await partnersRepository.updateSettings(partnerId, {
      ...currentSettings,
      clearingWalletId: clearingWallet.id,
    });

    return clearingWallet;
  }
  async createWallet(partnerId: string, walletData: Omit<InsertWallet, 'partnerId'>) {
    return await walletsRepository.create({
      partnerId,
      ...walletData,
      currency: walletData.currency || 'USD'
    });
  }

  async getPartnerWallet(request: PartnerWalletRequest) {
    if (request.walletId) {
      const wallet = await walletsRepository.getById(request.walletId);
      if (!wallet || wallet.partnerId !== request.partnerId) {
        throw new Error('Wallet not found or access denied');
      }
      return wallet;
    }
    
    if (request.externalWalletId) {
      return await walletsRepository.getByExternalId(request.partnerId, request.externalWalletId);
    }
    
    throw new Error('Must provide either walletId or externalWalletId');
  }

  async getPartnerWallets(partnerId: string) {
    return await walletsRepository.listByPartnerId(partnerId);
  }

  async getWalletBalance(partnerId: string, walletId: string) {
    const wallet = await this.getPartnerWallet({ partnerId, walletId });
    if (!wallet) {
      throw new Error('Wallet not found or access denied');
    }

    const balance = await walletsRepository.getBalance(walletId);
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
    const balance = await walletsRepository.getBalance(data.walletId);
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
    const balance = await walletsRepository.getBalance(data.fromWalletId);
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