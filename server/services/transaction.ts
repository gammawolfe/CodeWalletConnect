import { storage } from "../storage";
import { ledgerService } from "./ledger";
import type { InsertTransaction } from "@shared/schema";

export class TransactionService {
  async createTransaction(partnerId: string, transactionData: Omit<InsertTransaction, 'id'>) {
    // Validate wallet ownership if specified
    if (transactionData.fromWalletId) {
      const fromWallet = await storage.getWallet(transactionData.fromWalletId);
      if (!fromWallet || fromWallet.partnerId !== partnerId) {
        throw new Error('From wallet not found or access denied');
      }
    }

    if (transactionData.toWalletId) {
      const toWallet = await storage.getWallet(transactionData.toWalletId);
      if (!toWallet || toWallet.partnerId !== partnerId) {
        throw new Error('To wallet not found or access denied');
      }
    }

    // Check for idempotency
    if (transactionData.idempotencyKey) {
      const existingTx = await storage.getTransactionByIdempotencyKey(transactionData.idempotencyKey);
      if (existingTx) {
        return existingTx;
      }
    }

    // Create transaction
    const transaction = await storage.createTransaction(transactionData);

    // Create appropriate ledger entries based on transaction type
    const ledgerEntries = [];
    
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
      // Credit to wallet
      ledgerEntries.push({
        walletId: transactionData.toWalletId,
        type: 'credit' as const,
        amount: transactionData.amount,
        currency: transactionData.currency || 'USD',
        description: transactionData.description || 'Wallet credit'
      });
    } else if (transactionData.type === 'debit' && transactionData.fromWalletId) {
      // Debit from wallet
      ledgerEntries.push({
        walletId: transactionData.fromWalletId,
        type: 'debit' as const,
        amount: transactionData.amount,
        currency: transactionData.currency || 'USD',
        description: transactionData.description || 'Wallet debit'
      });
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
      const wallet = await storage.getWallet(walletId);
      if (!wallet || wallet.partnerId !== partnerId) {
        throw new Error('Wallet not found or access denied');
      }
      return await storage.getTransactionsByWallet(walletId, limit, offset);
    }

    // Get all partner wallets
    const wallets = await storage.getWalletsByPartnerId(partnerId);
    const allTransactions = [];
    
    // Get transactions from all partner wallets
    for (const wallet of wallets) {
      const transactions = await storage.getTransactionsByWallet(wallet.id, limit, offset);
      allTransactions.push(...transactions);
    }
    
    // Sort by creation date and limit results
    return allTransactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async updateTransactionStatus(partnerId: string, transactionId: string, status: string, gatewayTransactionId?: string) {
    const transaction = await storage.getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify transaction belongs to partner's wallets
    if (transaction.fromWalletId) {
      const wallet = await storage.getWallet(transaction.fromWalletId);
      if (!wallet || wallet.partnerId !== partnerId) {
        throw new Error('Transaction access denied');
      }
    }
    
    if (transaction.toWalletId) {
      const wallet = await storage.getWallet(transaction.toWalletId);
      if (!wallet || wallet.partnerId !== partnerId) {
        throw new Error('Transaction access denied');
      }
    }

    return await storage.updateTransactionStatus(transactionId, status, gatewayTransactionId);
  }
}

export const transactionService = new TransactionService();