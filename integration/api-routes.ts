/**
 * Enhanced API Routes for RoSaBank with PayFlow Integration
 * 
 * This file provides the API route implementations that replace the existing
 * wallet service routes with PayFlow-powered functionality.
 */

import type { Express } from "express";
import { z } from "zod";
import { createEnhancedWalletService } from './enhanced-wallet-service';
import type { ContributionRequest, PayoutRequest } from './enhanced-wallet-service';

// Initialize enhanced wallet service
const walletService = createEnhancedWalletService({
  payflowBaseUrl: process.env.PAYFLOW_BASE_URL || 'http://localhost:5000',
  payflowApiKey: process.env.PAYFLOW_API_KEY || '',
  defaultCurrency: 'USD',
  enableRealPayments: process.env.NODE_ENV === 'production',
});

// Validation schemas
const createGroupWalletSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  currency: z.string().default('USD'),
  creatorUserId: z.string(),
});

const createMemberWalletSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  currency: z.string().default('USD'),
});

const contributionSchema = z.object({
  groupId: z.string(),
  memberId: z.string(),
  memberWalletId: z.string(),
  groupWalletId: z.string(),
  amount: z.number().positive(),
  round: z.number().positive(),
  paymentMethodId: z.string().optional(),
});

const payoutSchema = z.object({
  groupId: z.string(),
  groupWalletId: z.string(),
  memberWalletId: z.string(),
  memberId: z.string(),
  memberName: z.string(),
  amount: z.number().positive(),
  round: z.number().positive(),
});

const transferSchema = z.object({
  fromWalletId: z.string(),
  toWalletId: z.string(),
  amount: z.number().positive(),
  description: z.string(),
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Register enhanced wallet routes with PayFlow integration
 */
export function registerPayFlowWalletRoutes(app: Express): void {
  
  // Health check for PayFlow service
  app.get('/api/payflow/health', async (req, res) => {
    try {
      const isAvailable = await walletService.isServiceAvailable();
      res.json({ 
        status: isAvailable ? 'healthy' : 'unavailable',
        service: 'payflow',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({ 
        status: 'error',
        service: 'payflow',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Create group wallet
  app.post('/api/wallets/groups', async (req, res) => {
    try {
      const data = createGroupWalletSchema.parse(req.body);
      const wallet = await walletService.createGroupWallet(
        data.groupId,
        data.groupName,
        data.currency,
        data.creatorUserId
      );
      res.status(201).json(wallet);
    } catch (error) {
      console.error('Error creating group wallet:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ 
        error: 'Failed to create group wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create member wallet
  app.post('/api/wallets/members', async (req, res) => {
    try {
      const data = createMemberWalletSchema.parse(req.body);
      const wallet = await walletService.createMemberWallet(
        data.userId,
        data.userName,
        data.currency
      );
      res.status(201).json(wallet);
    } catch (error) {
      console.error('Error creating member wallet:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ 
        error: 'Failed to create member wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get group wallet
  app.get('/api/wallets/groups/:groupId', async (req, res) => {
    try {
      const { groupId } = req.params;
      const { walletId } = req.query;
      
      if (!walletId) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }

      const wallet = await walletService.getGroupWallet(walletId as string, groupId);
      if (!wallet) {
        return res.status(404).json({ error: 'Group wallet not found' });
      }

      res.json(wallet);
    } catch (error) {
      console.error('Error fetching group wallet:', error);
      res.status(500).json({ 
        error: 'Failed to fetch group wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get group wallet balance
  app.get('/api/wallets/groups/:groupId/balance', async (req, res) => {
    try {
      const { walletId } = req.query;
      
      if (!walletId) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }

      const balance = await walletService.getWalletBalance(walletId as string);
      res.json(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ 
        error: 'Failed to fetch wallet balance',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Process contribution
  app.post('/api/wallets/contributions', async (req, res) => {
    try {
      const data = contributionSchema.parse(req.body);
      const transaction = await walletService.processContribution(data);
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error processing contribution:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ 
        error: 'Failed to process contribution',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Distribute payout
  app.post('/api/wallets/payouts', async (req, res) => {
    try {
      const data = payoutSchema.parse(req.body);
      const transaction = await walletService.distributePayout(data);
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error distributing payout:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ 
        error: 'Failed to distribute payout',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get group transaction history
  app.get('/api/wallets/groups/:groupId/transactions', async (req, res) => {
    try {
      const { groupId } = req.params;
      const { walletId, limit = '50' } = req.query;
      
      if (!walletId) {
        return res.status(400).json({ error: 'Wallet ID is required' });
      }

      const transactions = await walletService.getGroupTransactionHistory(
        walletId as string,
        groupId,
        parseInt(limit as string)
      );
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching group transactions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch group transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get member transaction history for a group
  app.get('/api/wallets/members/:memberId/groups/:groupId/transactions', async (req, res) => {
    try {
      const { memberId, groupId } = req.params;
      const { walletId, limit = '50' } = req.query;
      
      if (!walletId) {
        return res.status(400).json({ error: 'Member wallet ID is required' });
      }

      const transactions = await walletService.getMemberTransactionHistory(
        walletId as string,
        groupId,
        parseInt(limit as string)
      );
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching member transactions:', error);
      res.status(500).json({ 
        error: 'Failed to fetch member transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get member statistics for a group
  app.get('/api/wallets/members/:memberId/groups/:groupId/statistics', async (req, res) => {
    try {
      const { memberId, groupId } = req.params;
      const { walletId } = req.query;
      
      if (!walletId) {
        return res.status(400).json({ error: 'Member wallet ID is required' });
      }

      const statistics = await walletService.getMemberGroupStatistics(
        walletId as string,
        groupId
      );
      res.json(statistics);
    } catch (error) {
      console.error('Error calculating member statistics:', error);
      res.status(500).json({ 
        error: 'Failed to calculate member statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Transfer funds between wallets
  app.post('/api/wallets/transfers', async (req, res) => {
    try {
      const data = transferSchema.parse(req.body);
      const transaction = await walletService.transferFunds(data);
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error transferring funds:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ 
        error: 'Failed to transfer funds',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Deposit to wallet (for testing/admin purposes)
  app.post('/api/wallets/:walletId/deposit', async (req, res) => {
    try {
      const { walletId } = req.params;
      const { amount, description } = req.body;

      if (!amount || !description) {
        return res.status(400).json({ error: 'Amount and description are required' });
      }

      const transaction = await walletService.depositToWallet(
        walletId,
        parseFloat(amount),
        description
      );
      res.status(201).json(transaction);
    } catch (error) {
      console.error('Error depositing to wallet:', error);
      res.status(500).json({ 
        error: 'Failed to deposit to wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Validate wallet
  app.get('/api/wallets/:walletId/validate', async (req, res) => {
    try {
      const { walletId } = req.params;
      const isValid = await walletService.validateWallet(walletId);
      res.json({ walletId, isValid });
    } catch (error) {
      console.error('Error validating wallet:', error);
      res.status(500).json({ 
        error: 'Failed to validate wallet',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Legacy compatibility routes (maintain existing RoSaBank API)
  
  // Get group wallet balance (legacy route)
  app.get('/api/wallet/groups/:groupId/wallet/balance', async (req, res) => {
    try {
      const { groupId } = req.params;
      // For legacy compatibility, we'll need to look up the wallet ID from the group
      // This would require integration with your existing group storage
      
      // For now, return a placeholder response to maintain compatibility
      res.json({ 
        balance: 0, 
        currency: 'USD',
        message: 'Please upgrade to use /api/wallets/groups/:groupId/balance with walletId parameter'
      });
    } catch (error) {
      console.error('Error in legacy balance route:', error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  });
}

/**
 * Middleware to check PayFlow service availability
 */
export async function checkPayFlowAvailability(req: any, res: any, next: any): Promise<void> {
  try {
    const isAvailable = await walletService.isServiceAvailable();
    if (!isAvailable) {
      return res.status(503).json({ 
        error: 'PayFlow service is currently unavailable',
        service: 'payflow',
        timestamp: new Date().toISOString(),
      });
    }
    next();
  } catch (error) {
    console.error('PayFlow availability check failed:', error);
    res.status(503).json({ 
      error: 'Failed to check PayFlow service availability',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}