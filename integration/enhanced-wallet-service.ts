/**
 * Enhanced Wallet Service for RoSaBank using PayFlow
 * 
 * This service replaces the existing basic wallet service with a comprehensive
 * PayFlow integration that supports real payment processing and ROSCA operations.
 */

import { PayFlowClient, ROSCAPayFlowHelper, createPayFlowClient } from './payflow-client';
import type { 
  PayFlowWallet, 
  PayFlowTransaction, 
  PayFlowPayment,
  CreateWalletRequest,
  TransferRequest,
  PaymentRequest 
} from './payflow-client';

// RoSaBank-specific types
export interface ROSCAGroupWallet extends PayFlowWallet {
  groupId: string;
  groupName: string;
  memberCount: number;
  currentRound: number;
  totalContributions: number;
  pendingPayouts: number;
}

export interface ROSCATransaction extends PayFlowTransaction {
  groupId?: string;
  groupName?: string;
  round?: number;
  memberName?: string;
  transactionType: 'contribution' | 'payout' | 'deposit' | 'withdrawal' | 'transfer';
}

export interface ContributionRequest {
  groupId: string;
  memberId: string;
  memberWalletId: string;
  groupWalletId: string;
  amount: number;
  round: number;
  paymentMethodId?: string;
}

export interface PayoutRequest {
  groupId: string;
  groupWalletId: string;
  memberWalletId: string;
  memberId: string;
  memberName: string;
  amount: number;
  round: number;
}

export interface WalletServiceConfig {
  payflowBaseUrl: string;
  payflowApiKey: string;
  defaultCurrency: string;
  enableRealPayments: boolean;
}

/**
 * Enhanced Wallet Service with PayFlow Integration
 */
export class EnhancedWalletService {
  private payflowClient: PayFlowClient;
  private roscaHelper: ROSCAPayFlowHelper;
  private config: WalletServiceConfig;

  constructor(config: WalletServiceConfig) {
    this.config = config;
    this.payflowClient = createPayFlowClient({
      baseUrl: config.payflowBaseUrl,
      apiKey: config.payflowApiKey,
    });
    this.roscaHelper = new ROSCAPayFlowHelper(this.payflowClient);
  }

  /**
   * Create a wallet for a new ROSCA group
   */
  async createGroupWallet(
    groupId: string,
    groupName: string,
    currency: string,
    creatorUserId: string
  ): Promise<ROSCAGroupWallet> {
    try {
      const wallet = await this.roscaHelper.createGroupWallet(
        groupId,
        groupName,
        currency,
        creatorUserId
      );

      return this.mapToROSCAGroupWallet(wallet, groupId, groupName);
    } catch (error) {
      console.error('Error creating group wallet:', error);
      throw new Error(`Failed to create group wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a personal wallet for a ROSCA member
   */
  async createMemberWallet(
    userId: string,
    userName: string,
    currency: string = 'USD'
  ): Promise<PayFlowWallet> {
    try {
      return await this.roscaHelper.createMemberWallet(userId, userName, currency);
    } catch (error) {
      console.error('Error creating member wallet:', error);
      throw new Error(`Failed to create member wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get group wallet details with ROSCA-specific information
   */
  async getGroupWallet(groupWalletId: string, groupId: string): Promise<ROSCAGroupWallet | null> {
    try {
      const wallet = await this.payflowClient.getWallet(groupWalletId);
      const groupName = wallet.metadata?.groupName || 'Unknown Group';
      
      return this.mapToROSCAGroupWallet(wallet, groupId, groupName);
    } catch (error) {
      console.error('Error fetching group wallet:', error);
      return null;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(walletId: string): Promise<{ balance: number; currency: string }> {
    try {
      const wallet = await this.payflowClient.getWallet(walletId);
      return {
        balance: wallet.balance,
        currency: wallet.currency,
      };
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw new Error(`Failed to fetch wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a member contribution with optional payment processing
   */
  async processContribution(request: ContributionRequest): Promise<ROSCATransaction> {
    try {
      let transaction: PayFlowTransaction;

      if (this.config.enableRealPayments && request.paymentMethodId) {
        // Process payment first, then transfer to group wallet
        const payment = await this.payflowClient.createPayment({
          walletId: request.memberWalletId,
          amount: request.amount,
          currency: this.config.defaultCurrency,
          description: `ROSCA contribution - Round ${request.round}`,
          paymentMethodId: request.paymentMethodId,
          metadata: {
            type: 'rosca_contribution',
            groupId: request.groupId,
            round: request.round,
            memberId: request.memberId,
          },
        });

        // After payment is processed, transfer to group wallet
        transaction = await this.roscaHelper.processContribution(
          request.memberWalletId,
          request.groupWalletId,
          request.amount,
          request.groupId,
          request.round
        );
      } else {
        // Direct wallet-to-wallet transfer (for testing or when member has sufficient balance)
        transaction = await this.roscaHelper.processContribution(
          request.memberWalletId,
          request.groupWalletId,
          request.amount,
          request.groupId,
          request.round
        );
      }

      return this.mapToROSCATransaction(transaction, 'contribution');
    } catch (error) {
      console.error('Error processing contribution:', error);
      throw new Error(`Failed to process contribution: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Distribute payout to current turn member
   */
  async distributePayout(request: PayoutRequest): Promise<ROSCATransaction> {
    try {
      const transaction = await this.roscaHelper.distributePayout(
        request.groupWalletId,
        request.memberWalletId,
        request.amount,
        request.groupId,
        request.round,
        request.memberName
      );

      return this.mapToROSCATransaction(transaction, 'payout');
    } catch (error) {
      console.error('Error distributing payout:', error);
      throw new Error(`Failed to distribute payout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get comprehensive transaction history for a group
   */
  async getGroupTransactionHistory(
    groupWalletId: string,
    groupId: string,
    limit: number = 50
  ): Promise<ROSCATransaction[]> {
    try {
      const transactions = await this.roscaHelper.getGroupTransactionHistory(groupWalletId, limit);
      return transactions.map(tx => this.mapToROSCATransaction(tx));
    } catch (error) {
      console.error('Error fetching group transaction history:', error);
      return [];
    }
  }

  /**
   * Get member transaction history for a specific group
   */
  async getMemberTransactionHistory(
    memberWalletId: string,
    groupId: string,
    limit: number = 50
  ): Promise<ROSCATransaction[]> {
    try {
      const transactions = await this.roscaHelper.getMemberGroupTransactions(
        memberWalletId,
        groupId,
        limit
      );
      return transactions.map(tx => this.mapToROSCATransaction(tx));
    } catch (error) {
      console.error('Error fetching member transaction history:', error);
      return [];
    }
  }

  /**
   * Calculate member statistics for a group
   */
  async getMemberGroupStatistics(
    memberWalletId: string,
    groupId: string
  ): Promise<{
    totalContributions: number;
    contributionCount: number;
    totalPayouts: number;
    payoutCount: number;
    netBalance: number;
  }> {
    try {
      const contributions = await this.roscaHelper.calculateMemberContributions(
        memberWalletId,
        groupId
      );

      const transactions = await this.roscaHelper.getMemberGroupTransactions(
        memberWalletId,
        groupId
      );

      const payouts = transactions.filter(tx => tx.metadata?.type === 'rosca_payout');
      const totalPayouts = payouts.reduce((sum, tx) => sum + tx.amount, 0);

      return {
        totalContributions: contributions.total,
        contributionCount: contributions.count,
        totalPayouts,
        payoutCount: payouts.length,
        netBalance: totalPayouts - contributions.total,
      };
    } catch (error) {
      console.error('Error calculating member statistics:', error);
      return {
        totalContributions: 0,
        contributionCount: 0,
        totalPayouts: 0,
        payoutCount: 0,
        netBalance: 0,
      };
    }
  }

  /**
   * Transfer funds between wallets
   */
  async transferFunds(request: TransferRequest): Promise<PayFlowTransaction> {
    try {
      return await this.payflowClient.transfer(request);
    } catch (error) {
      console.error('Error transferring funds:', error);
      throw new Error(`Failed to transfer funds: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add funds to a wallet (for testing or manual deposits)
   */
  async depositToWallet(
    walletId: string,
    amount: number,
    description: string
  ): Promise<PayFlowTransaction> {
    try {
      return await this.payflowClient.creditWallet(walletId, amount, description, {
        type: 'manual_deposit',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error depositing to wallet:', error);
      throw new Error(`Failed to deposit to wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if PayFlow service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      await this.payflowClient.healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate wallet exists and is accessible
   */
  async validateWallet(walletId: string): Promise<boolean> {
    return await this.payflowClient.validateWallet(walletId);
  }

  // Private helper methods
  private mapToROSCAGroupWallet(
    wallet: PayFlowWallet,
    groupId: string,
    groupName: string
  ): ROSCAGroupWallet {
    return {
      ...wallet,
      groupId,
      groupName,
      memberCount: wallet.metadata?.memberCount || 0,
      currentRound: wallet.metadata?.currentRound || 1,
      totalContributions: wallet.metadata?.totalContributions || 0,
      pendingPayouts: wallet.metadata?.pendingPayouts || 0,
    };
  }

  private mapToROSCATransaction(
    transaction: PayFlowTransaction,
    transactionType?: 'contribution' | 'payout' | 'deposit' | 'withdrawal' | 'transfer'
  ): ROSCATransaction {
    return {
      ...transaction,
      groupId: transaction.metadata?.groupId,
      groupName: transaction.metadata?.groupName,
      round: transaction.metadata?.round,
      memberName: transaction.metadata?.memberName,
      transactionType: transactionType || this.inferTransactionType(transaction),
    };
  }

  private inferTransactionType(
    transaction: PayFlowTransaction
  ): 'contribution' | 'payout' | 'deposit' | 'withdrawal' | 'transfer' {
    const metadataType = transaction.metadata?.type;
    
    if (metadataType === 'rosca_contribution') return 'contribution';
    if (metadataType === 'rosca_payout') return 'payout';
    if (metadataType === 'manual_deposit') return 'deposit';
    if (transaction.type === 'credit') return 'deposit';
    if (transaction.type === 'debit') return 'withdrawal';
    
    return 'transfer';
  }
}

/**
 * Factory function to create enhanced wallet service
 */
export function createEnhancedWalletService(config: Partial<WalletServiceConfig>): EnhancedWalletService {
  const defaultConfig: WalletServiceConfig = {
    payflowBaseUrl: process.env.PAYFLOW_BASE_URL || 'http://localhost:7000',
    payflowApiKey: process.env.PAYFLOW_API_KEY || '',
    defaultCurrency: 'USD',
    enableRealPayments: process.env.NODE_ENV === 'production',
  };

  return new EnhancedWalletService({ ...defaultConfig, ...config });
}