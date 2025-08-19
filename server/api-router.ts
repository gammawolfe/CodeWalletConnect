import { Router } from 'express';
import { 
  requireApiKey, 
  requirePermission, 
  validateWalletOwnership,
  rateLimit,
  generateApiKeyPair,
  hashApiKey
} from './auth-api';
import { walletService } from './services/wallet';
import { transactionService } from './services/transaction';
import { paymentGatewayService } from './services/payment-gateway';
import { partnersRepository, apiKeysRepository, fundingSessionsRepository } from './repositories';
import { walletsRepository } from './repositories';
import { fundingService } from './services/funding';
import { 
  insertPartnerSchema,
  insertWalletSchema, 
  creditWalletSchema, 
  debitWalletSchema, 
  transferSchema, 
  payoutSchema,
  createFundingSessionSchema
} from '@shared/schema';

const router = Router();

// Health check endpoints
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

router.get('/ready', (req, res) => {
  res.json({ status: 'ready', timestamp: new Date().toISOString() });
});

router.get('/live', (req, res) => {
  res.json({ status: 'live', timestamp: new Date().toISOString() });
});

// Partner API endpoints - require API key authentication
router.get('/partners/profile', requireApiKey, async (req: any, res) => {
  try {
    const partner = await partnersRepository.findById(req.partner.id);
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }
    
    // Mask sensitive fields
    const { ...safePartner } = partner;
    res.json(safePartner);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Wallet Management API
router.post('/wallets', requireApiKey, async (req: any, res) => {
  try {
    const result = insertWalletSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: result.error.issues 
      });
    }

    const walletData = {
      ...result.data,
      partnerId: req.partner.id
    };

    const wallet = await walletService.createWallet(walletData);
    res.status(201).json(wallet);
  } catch (error) {
    if (error instanceof Error && error.message.includes('duplicate')) {
      return res.status(409).json({ error: 'Wallet with this external ID already exists' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/wallets', requireApiKey, async (req: any, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const wallets = await walletService.getWalletsByPartner(req.partner.id, limit, offset);
    res.json({
      wallets,
      pagination: { limit, offset }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/wallets/:walletId', requireApiKey, validateWalletOwnership, async (req: any, res) => {
  try {
    const wallet = await walletsRepository.findById(req.params.walletId);
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }
    
    if (wallet.partnerId !== req.partner.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/wallets/:walletId/balance', requireApiKey, validateWalletOwnership, async (req, res) => {
  try {
    const balance = await walletService.getWalletBalance(req.params.walletId);
    const wallet = await walletsRepository.findById(req.params.walletId);
    
    res.json({
      balance,
      currency: wallet?.currency || 'USD'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transaction Management API
router.post('/wallets/:walletId/transactions', requireApiKey, validateWalletOwnership, async (req: any, res) => {
  try {
    let schema;
    switch (req.body.type) {
      case 'credit':
        schema = creditWalletSchema;
        break;
      case 'debit':
        schema = debitWalletSchema;
        break;
      default:
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: result.error.issues 
      });
    }

    // Validate currency matches wallet
    const wallet = await walletsRepository.findById(req.params.walletId);
    if (wallet && wallet.currency !== result.data.currency) {
      return res.status(400).json({ error: 'Currency mismatch with wallet' });
    }

    const transactionData = {
      ...result.data,
      walletId: req.params.walletId
    };

    const transaction = await transactionService.createTransaction(transactionData);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/wallets/:walletId/transactions', requireApiKey, validateWalletOwnership, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    if (isNaN(limit) || isNaN(offset)) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }
    
    const transactions = await walletService.getWalletHistory(req.params.walletId, limit, offset);
    res.json({
      transactions,
      pagination: { limit, offset }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transfer API
router.post('/wallets/:fromWalletId/transfer/:toWalletId', requireApiKey, async (req: any, res) => {
  try {
    const result = transferSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: result.error.issues 
      });
    }

    // Validate both wallets belong to same partner
    const fromWallet = await walletsRepository.findById(req.params.fromWalletId);
    const toWallet = await walletsRepository.findById(req.params.toWalletId);
    
    if (!fromWallet || !toWallet) {
      return res.status(404).json({ error: 'One or both wallets not found' });
    }
    
    if (fromWallet.partnerId !== req.partner.id || toWallet.partnerId !== req.partner.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const transferData = {
      ...result.data,
      walletId: req.params.fromWalletId,
      toWalletId: req.params.toWalletId,
      type: 'transfer' as const
    };

    const transaction = await transactionService.createTransaction(transferData);
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Transaction details
router.get('/transactions/:transactionId', requireApiKey, async (req: any, res) => {
  try {
    const transaction = await transactionService.getTransactionStatus(req.params.transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Verify transaction belongs to partner's wallet
    const wallet = await walletsRepository.findById(transaction.walletId);
    if (!wallet || wallet.partnerId !== req.partner.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
router.use((error: Error, req: any, res: any, next: any) => {
  console.error('API Error:', error);
  
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

export { router as routes };