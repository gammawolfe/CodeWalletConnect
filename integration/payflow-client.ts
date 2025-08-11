/**
 * PayFlow Client SDK for RoSaBank Integration
 * 
 * This SDK provides a clean interface for RoSaBank to interact with the PayFlow
 * payment gateway aggregator and wallet management system.
 */

import { z } from 'zod';

// PayFlow API Types
export interface PayFlowWallet {
  id: string;
  name: string;
  type: 'personal' | 'business' | 'group';
  currency: string;
  balance: number;
  isActive: boolean;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PayFlowTransaction {
  id: string;
  fromWalletId: string;
  toWalletId: string | null;
  amount: number;
  currency: string;
  type: 'credit' | 'debit' | 'transfer';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt: string | null;
}

export interface PayFlowPayment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethodId: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: string;
  completedAt: string | null;
}

export interface CreateWalletRequest {
  name: string;
  type: 'personal' | 'business' | 'group';
  currency: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface TransferRequest {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  description: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface PaymentRequest {
  walletId: string;
  amount: number;
  currency: string;
  description: string;
  paymentMethodId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PayoutRequest {
  fromWalletId: string;
  amount: number;
  currency: string;
  description: string;
  recipientInfo: {
    type: 'bank_account' | 'stripe_account';
    accountId: string;
  };
  metadata?: Record<string, any>;
}

/**
 * PayFlow Client SDK
 */
export class PayFlowClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PayFlow API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // Wallet Management
  async createWallet(request: CreateWalletRequest): Promise<PayFlowWallet> {
    return this.makeRequest<PayFlowWallet>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getWallet(walletId: string): Promise<PayFlowWallet> {
    return this.makeRequest<PayFlowWallet>(`/api/wallets/${walletId}`);
  }

  async getWalletsByUser(userId: string): Promise<PayFlowWallet[]> {
    return this.makeRequest<PayFlowWallet[]>(`/api/wallets?userId=${userId}`);
  }

  async updateWallet(
    walletId: string,
    updates: Partial<Pick<PayFlowWallet, 'name' | 'isActive'>>
  ): Promise<PayFlowWallet> {
    return this.makeRequest<PayFlowWallet>(`/api/wallets/${walletId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteWallet(walletId: string): Promise<void> {
    await this.makeRequest<void>(`/api/wallets/${walletId}`, {
      method: 'DELETE',
    });
  }

  // Transaction Management
  async getWalletTransactions(
    walletId: string,
    options: { limit?: number; offset?: number; status?: string } = {}
  ): Promise<PayFlowTransaction[]> {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.offset) params.append('offset', options.offset.toString());
    if (options.status) params.append('status', options.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.makeRequest<PayFlowTransaction[]>(
      `/api/wallets/${walletId}/transactions${query}`
    );
  }

  async getTransaction(transactionId: string): Promise<PayFlowTransaction> {
    return this.makeRequest<PayFlowTransaction>(`/api/transactions/${transactionId}`);
  }

  // Transfer Operations
  async transfer(request: TransferRequest): Promise<PayFlowTransaction> {
    return this.makeRequest<PayFlowTransaction>('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async creditWallet(
    walletId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<PayFlowTransaction> {
    return this.makeRequest<PayFlowTransaction>(`/api/wallets/${walletId}/credit`, {
      method: 'POST',
      body: JSON.stringify({ amount, description, metadata }),
    });
  }

  async debitWallet(
    walletId: string,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<PayFlowTransaction> {
    return this.makeRequest<PayFlowTransaction>(`/api/wallets/${walletId}/debit`, {
      method: 'POST',
      body: JSON.stringify({ amount, description, metadata }),
    });
  }

  // Payment Processing
  async createPayment(request: PaymentRequest): Promise<PayFlowPayment> {
    return this.makeRequest<PayFlowPayment>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPayment(paymentId: string): Promise<PayFlowPayment> {
    return this.makeRequest<PayFlowPayment>(`/api/payments/${paymentId}`);
  }

  async cancelPayment(paymentId: string): Promise<PayFlowPayment> {
    return this.makeRequest<PayFlowPayment>(`/api/payments/${paymentId}/cancel`, {
      method: 'POST',
    });
  }

  // Payout Operations
  async createPayout(request: PayoutRequest): Promise<PayFlowTransaction> {
    return this.makeRequest<PayFlowTransaction>('/api/payouts', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getPayout(payoutId: string): Promise<PayFlowTransaction> {
    return this.makeRequest<PayFlowTransaction>(`/api/payouts/${payoutId}`);
  }

  // Utility Methods
  async getWalletBalance(walletId: string): Promise<number> {
    const wallet = await this.getWallet(walletId);
    return wallet.balance;
  }

  async validateWallet(walletId: string): Promise<boolean> {
    try {
      await this.getWallet(walletId);
      return true;
    } catch {
      return false;
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/api/health');
  }
}

/**
 * Factory function to create PayFlow client instance
 */
export function createPayFlowClient(config: {
  baseUrl?: string;
  apiKey: string;
}): PayFlowClient {
  const baseUrl = config.baseUrl || 'http://localhost:5000';
  return new PayFlowClient({ baseUrl, apiKey: config.apiKey });
}

/**
 * ROSCA-specific helper methods
 */
export class ROSCAPayFlowHelper {
  constructor(private client: PayFlowClient) {}

  /**
   * Create a wallet for a ROSCA group
   */
  async createGroupWallet(
    groupId: string,
    groupName: string,
    currency: string,
    creatorUserId: string
  ): Promise<PayFlowWallet> {
    return this.client.createWallet({
      name: `ROSCA Group: ${groupName}`,
      type: 'group',
      currency,
      userId: creatorUserId,
      metadata: {
        rosaGroupId: groupId,
        groupName,
        type: 'rosca_group',
      },
    });
  }

  /**
   * Create a personal wallet for a ROSCA member
   */
  async createMemberWallet(
    userId: string,
    userName: string,
    currency: string = 'USD'
  ): Promise<PayFlowWallet> {
    return this.client.createWallet({
      name: `${userName}'s ROSCA Wallet`,
      type: 'personal',
      currency,
      userId,
      metadata: {
        type: 'rosca_member',
        userName,
      },
    });
  }

  /**
   * Process a member contribution to the group wallet
   */
  async processContribution(
    memberWalletId: string,
    groupWalletId: string,
    amount: number,
    groupId: string,
    round: number
  ): Promise<PayFlowTransaction> {
    return this.client.transfer({
      fromWalletId: memberWalletId,
      toWalletId: groupWalletId,
      amount,
      description: `ROSCA contribution - Round ${round}`,
      reference: `rosca_${groupId}_r${round}`,
      metadata: {
        type: 'rosca_contribution',
        groupId,
        round,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Distribute payout to the current turn member
   */
  async distributePayout(
    groupWalletId: string,
    memberWalletId: string,
    amount: number,
    groupId: string,
    round: number,
    memberName: string
  ): Promise<PayFlowTransaction> {
    return this.client.transfer({
      fromWalletId: groupWalletId,
      toWalletId: memberWalletId,
      amount,
      description: `ROSCA payout to ${memberName} - Round ${round}`,
      reference: `rosca_payout_${groupId}_r${round}`,
      metadata: {
        type: 'rosca_payout',
        groupId,
        round,
        memberName,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Get group transaction history
   */
  async getGroupTransactionHistory(
    groupWalletId: string,
    limit: number = 50
  ): Promise<PayFlowTransaction[]> {
    return this.client.getWalletTransactions(groupWalletId, { limit });
  }

  /**
   * Get member transaction history for a specific group
   */
  async getMemberGroupTransactions(
    memberWalletId: string,
    groupId: string,
    limit: number = 50
  ): Promise<PayFlowTransaction[]> {
    const transactions = await this.client.getWalletTransactions(memberWalletId, { limit });
    return transactions.filter(
      (tx) => tx.metadata?.groupId === groupId || tx.reference?.includes(`rosca_${groupId}`)
    );
  }

  /**
   * Calculate total contributions for a member in a group
   */
  async calculateMemberContributions(
    memberWalletId: string,
    groupId: string
  ): Promise<{ total: number; count: number; transactions: PayFlowTransaction[] }> {
    const transactions = await this.getMemberGroupTransactions(memberWalletId, groupId);
    const contributions = transactions.filter(
      (tx) => tx.metadata?.type === 'rosca_contribution'
    );

    const total = contributions.reduce((sum, tx) => sum + tx.amount, 0);
    return {
      total,
      count: contributions.length,
      transactions: contributions,
    };
  }
}