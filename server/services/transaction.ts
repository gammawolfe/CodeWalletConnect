import { ledgerService } from "./ledger";
import { walletService } from "./wallet";
import type { InsertTransaction } from "@shared/schema";
import { walletsRepository, transactionsRepository } from "../repositories";

export class TransactionService {
  async createTransaction(partnerId: string, transactionData: Omit<InsertTransaction, 'id'>) {
    // Validate wallet ownership if specified
    if (transactionData.fromWalletId) {
      const fromWallet = await walletsRepository.getById(transactionData.fromWalletId);
      if (!fromWallet || fromWallet.partnerId !== partnerId) {
        throw new Error('From wallet not found or access denied');
      }
    }

    if (transactionData.toWalletId) {
      const toWallet = await walletsRepository.getById(transactionData.toWalletId);
      if (!toWallet || toWallet.partnerId !== partnerId) {
        throw new Error('To wallet not found or access denied');
      }
    }

    // Check for idempotency
    if (transactionData.idempotencyKey) {
      const existingTx = await transactionsRepository.getByIdempotencyKey(transactionData.idempotencyKey);
      if (existingTx) {
        return existingTx;
      }
    }

    // Create transaction
    const transaction = await transactionsRepository.create(transactionData);

    // Create appropriate ledger entries based on transaction type
    const ledgerEntries = [] as Array<{ walletId: string; type: 'debit' | 'credit'; amount: string; currency: string; description?: string }>;
    
    if (transactionData.type === 'transfer' && transactionData.fromWalletId && transactionData.toWalletId) {
      // Transfer between wallets (double-entry)
      ledgerEntries.push(
        {
          walletId: transactionData.fromWalletId,
          type: 'debit' as const,
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          description: transactionData.description || 'Transfer out'
        },
        {
          walletId: transactionData.toWalletId,
          type: 'credit' as const,
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          description: transactionData.description || 'Transfer in'
        }
      );
    } else if (transactionData.type === 'credit' && transactionData.toWalletId) {
      // Treat credit as transfer from partner clearing wallet to target wallet
      const clearingWallet = await walletService.getOrCreateClearingWallet(partnerId);
      ledgerEntries.push(
        {
          walletId: clearingWallet.id,
          type: 'debit',
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          description: transactionData.description || 'Clearing to wallet'
        },
        {
          walletId: transactionData.toWalletId,
          type: 'credit',
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          description: transactionData.description || 'Wallet credit'
        }
      );
    } else if (transactionData.type === 'debit' && transactionData.fromWalletId) {
      // Treat debit as transfer from wallet to partner clearing wallet
      const clearingWallet = await walletService.getOrCreateClearingWallet(partnerId);
      ledgerEntries.push(
        {
          walletId: transactionData.fromWalletId,
          type: 'debit',
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          description: transactionData.description || 'Wallet debit'
        },
        {
          walletId: clearingWallet.id,
          type: 'credit',
          amount: transactionData.amount,
          currency: transactionData.currency || 'USD',
          description: transactionData.description || 'Wallet to clearing'
        }
      );
    }

    // Create ledger entries
    if (ledgerEntries.length > 0) {
      await ledgerService.createDoubleEntry(transaction.id, ledgerEntries);
    }

    return transaction;
  }

  async getPartnerTransactions(partnerId: string, walletId?: string, limit = 50, offset = 0) {
    if (walletId) {
      // Verify wallet ownership
      const wallet = await walletsRepository.getById(walletId);
      if (!wallet || wallet.partnerId !== partnerId) {
        throw new Error('Wallet not found or access denied');
      }
      return await transactionsRepository.listByWallet(walletId, limit, offset);
    }

    // Get all partner wallets
    const wallets = await walletsRepository.listByPartnerId(partnerId);
    const allTransactions = [];
    
    // Get transactions from all partner wallets
    for (const wallet of wallets) {
      const transactions = await transactionsRepository.listByWallet(wallet.id, limit, offset);
      allTransactions.push(...transactions);
    }
    
    // Sort by creation date and limit results
    return allTransactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async updateTransactionStatus(partnerId: string, transactionId: string, status: string, gatewayTransactionId?: string) {
    const transaction = await transactionsRepository.getById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify transaction belongs to partner's wallets
    if (transaction.fromWalletId) {
      const wallet = await walletsRepository.getById(transaction.fromWalletId);
      if (!wallet || wallet.partnerId !== partnerId) {
        throw new Error('Transaction access denied');
      }
    }
    
    if (transaction.toWalletId) {
      const wallet = await walletsRepository.getById(transaction.toWalletId);
      if (!wallet || wallet.partnerId !== partnerId) {
        throw new Error('Transaction access denied');
      }
    }

    return await transactionsRepository.updateStatus(transactionId, status, gatewayTransactionId);
  }
}

export const transactionService = new TransactionService();