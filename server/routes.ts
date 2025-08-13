import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth } from "./auth";
import { 
  requireApiKey, 
  requirePermission, 
  validateWalletOwnership,
  rateLimit,
  generateApiKeyPair,
  hashApiKey
} from "./auth-api";
import { walletService } from "./services/wallet";
import { transactionService } from "./services/transaction";
import { paymentGatewayService } from "./services/payment-gateway";
import { storage } from "./storage";
import { 
  insertPartnerSchema,
  insertWalletSchema, 
  creditWalletSchema, 
  debitWalletSchema, 
  transferSchema, 
  payoutSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Health check endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/api/ready", (req, res) => {
    res.json({ status: "ready", timestamp: new Date().toISOString() });
  });

  app.get("/api/live", (req, res) => {
    res.json({ status: "live", timestamp: new Date().toISOString() });
  });

  // Test Stripe connection endpoint
  app.post("/api/v1/test-stripe-connection", requireAuth, async (req: any, res, next) => {
    try {
      const { secretKey } = req.body;
      
      if (!secretKey || secretKey.includes('••••')) {
        return res.status(400).json({ 
          message: "Valid secret key is required to test connection" 
        });
      }

      // Import Stripe dynamically since it's already imported elsewhere
      const Stripe = require('stripe');
      
      // Create a temporary Stripe instance with the provided key
      const testStripe = new Stripe(secretKey, {
        apiVersion: "2023-10-16",
      });

      // Test the connection by retrieving account information
      const account = await testStripe.accounts.retrieve();
      
      res.json({ 
        success: true, 
        account: {
          id: account.id,
          display_name: account.display_name || account.business_profile?.name || 'Stripe Account',
          country: account.country,
          type: account.type
        }
      });
    } catch (error: any) {
      console.error('Stripe connection test failed:', error);
      
      let message = "Failed to connect to Stripe";
      if (error.type === 'StripeAuthenticationError') {
        message = "Invalid API key. Please check your secret key.";
      } else if (error.type === 'StripePermissionError') {
        message = "API key doesn't have sufficient permissions.";
      } else if (error.message) {
        message = error.message;
      }

      res.status(400).json({ 
        success: false, 
        message 
      });
    }
  });

  // =====================================
  // B2B Partner API Routes (API Key Auth)
  // =====================================

  // Apply rate limiting to all API routes
  app.use('/api/v1', rateLimit(1000)); // 1000 requests per minute

  // Partner Wallet Management
  app.post("/api/v1/wallets", 
    requireApiKey, 
    requirePermission('wallets:write'), 
    async (req: any, res, next) => {
      try {
        const walletData = insertWalletSchema.parse({
          ...req.body,
          partnerId: req.partner.id
        });
        
        const wallet = await storage.createWallet(walletData);
        res.status(201).json(wallet);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get("/api/v1/wallets", 
    requireApiKey, 
    requirePermission('wallets:read'), 
    async (req: any, res, next) => {
      try {
        const wallets = await storage.getWalletsByPartnerId(req.partner.id);
        res.json(wallets);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get("/api/v1/wallets/:id", 
    requireApiKey, 
    requirePermission('wallets:read'), 
    validateWalletOwnership,
    async (req: any, res, next) => {
      try {
        res.json(req.wallet);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get("/api/v1/wallets/:id/balance", 
    requireApiKey, 
    requirePermission('wallets:read'), 
    validateWalletOwnership,
    async (req: any, res, next) => {
      try {
        const result = await walletService.getWalletBalance(req.partner.id, req.params.id);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get("/api/v1/wallets/:id/transactions", 
    requireApiKey, 
    requirePermission('transactions:read'), 
    validateWalletOwnership,
    async (req: any, res, next) => {
      try {
        const { limit = 50, offset = 0 } = req.query;
        const transactions = await transactionService.getPartnerTransactions(
          req.partner.id,
          req.params.id,
          parseInt(limit as string),
          parseInt(offset as string)
        );
        res.json(transactions);
      } catch (error) {
        next(error);
      }
    }
  );

  // Find wallet by external ID (partner-specific)
  app.get("/api/v1/wallets/external/:externalId", 
    requireApiKey, 
    requirePermission('wallets:read'), 
    async (req: any, res, next) => {
      try {
        const { externalId } = req.params;
        const wallet = await storage.getWalletByExternalId(req.partner.id, externalId);
        
        if (!wallet) {
          return res.status(404).json({ error: 'Wallet not found' });
        }
        
        res.json(wallet);
      } catch (error) {
        next(error);
      }
    }
  );

  // Transaction routes (API Key auth)
  app.post("/api/v1/wallets/:id/credit", 
    requireApiKey, 
    requirePermission('transactions:write'), 
    validateWalletOwnership,
    async (req: any, res, next) => {
      try {
        const data = creditWalletSchema.parse({ 
          ...req.body, 
          walletId: req.params.id 
        });
        const transaction = await walletService.creditWallet(req.partner.id, data);
        res.status(201).json(transaction);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/v1/wallets/:id/debit", 
    requireApiKey, 
    requirePermission('transactions:write'), 
    validateWalletOwnership,
    async (req: any, res, next) => {
      try {
        const data = debitWalletSchema.parse({ 
          ...req.body, 
          walletId: req.params.id 
        });
        const transaction = await walletService.debitWallet(req.partner.id, data);
        res.status(201).json(transaction);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/v1/transfers", 
    requireApiKey, 
    requirePermission('transactions:write'), 
    async (req: any, res, next) => {
      try {
        const data = transferSchema.parse(req.body);
        
        // Verify both wallets belong to the partner
        const fromWallet = await storage.getWallet(data.fromWalletId);
        const toWallet = await storage.getWallet(data.toWalletId);
        
        if (!fromWallet || fromWallet.partnerId !== req.partner.id) {
          return res.status(404).json({ error: 'Source wallet not found or not accessible' });
        }
        
        if (!toWallet || toWallet.partnerId !== req.partner.id) {
          return res.status(404).json({ error: 'Destination wallet not found or not accessible' });
        }

        const transaction = await walletService.transferBetweenWallets(req.partner.id, data);
        res.status(201).json(transaction);
      } catch (error) {
        next(error);
      }
    }
  );

  // Payout routes (API Key auth)
  app.post("/api/v1/payouts", 
    requireApiKey, 
    requirePermission('payouts:write'), 
    async (req: any, res, next) => {
      try {
        const data = payoutSchema.parse(req.body);
        const gateway = req.body.gateway || 'stripe';
        
        // Verify wallet belongs to partner
        const wallet = await storage.getWallet(data.walletId);
        if (!wallet || wallet.partnerId !== req.partner.id) {
          return res.status(404).json({ error: 'Wallet not found or not accessible' });
        }

        const payout = await paymentGatewayService.createPayout(gateway, data);
        res.status(201).json(payout);
      } catch (error) {
        next(error);
      }
    }
  );

  // =====================================
  // Webhook Endpoints
  // =====================================

  app.post("/api/v1/webhooks/stripe", async (req, res, next) => {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const result = await paymentGatewayService.handleWebhook(
        'stripe', 
        JSON.stringify(req.body), 
        signature
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/webhooks/mock", async (req, res, next) => {
    try {
      const result = await paymentGatewayService.handleWebhook(
        'mock', 
        JSON.stringify(req.body), 
        'mock-signature'
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  // =====================================
  // Admin Routes (Web App Authentication)
  // =====================================

  // Partner Management (for PayFlow admin interface)
  app.get("/api/admin/partners", requireAuth, async (req, res, next) => {
    try {
      const partners = await storage.getPartners();
      res.json(partners);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/partners", requireAuth, async (req, res, next) => {
    try {
      const partnerData = insertPartnerSchema.parse(req.body);
      const partner = await storage.createPartner(partnerData);
      res.status(201).json(partner);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/admin/partners/:id/status", requireAuth, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const partner = await storage.updatePartnerStatus(id, status);
      res.json(partner);
    } catch (error) {
      next(error);
    }
  });

  // API Key Management (for PayFlow admin interface)
  app.get("/api/admin/partners/:partnerId/api-keys", requireAuth, async (req, res, next) => {
    try {
      const { partnerId } = req.params;
      const apiKeys = await storage.getApiKeysByPartnerId(partnerId);
      
      // Don't return the actual key hashes for security
      const sanitizedKeys = apiKeys.map(key => ({
        ...key,
        keyHash: undefined
      }));
      
      res.json(sanitizedKeys);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/admin/partners/:partnerId/api-keys", requireAuth, async (req, res, next) => {
    try {
      const { partnerId } = req.params;
      const { environment, permissions } = req.body;
      
      // Generate new API key pair
      const { publicKey, secretKey, keyHash } = generateApiKeyPair(partnerId, environment);
      
      // Store hashed version in database
      const apiKey = await storage.createApiKey({
        partnerId,
        keyHash,
        environment: environment as any,
        permissions: permissions || ['wallets:read', 'wallets:write', 'transactions:read']
      });
      
      // Return the keys (only time the secret is visible)
      res.status(201).json({
        ...apiKey,
        publicKey,
        secretKey,
        keyHash: undefined // Don't return the hash
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/admin/api-keys/:keyId", requireAuth, async (req, res, next) => {
    try {
      const { keyId } = req.params;
      await storage.deactivateApiKey(keyId);
      res.json({ message: 'API key deactivated' });
    } catch (error) {
      next(error);
    }
  });

  // System monitoring (for PayFlow admin interface)
  app.get("/api/admin/system/stats", requireAuth, async (req, res, next) => {
    try {
      // Get system statistics
      const partners = await storage.getPartners();
      const activePartners = partners.filter(p => p.status === 'approved').length;
      
      res.json({
        totalPartners: partners.length,
        activePartners,
        pendingPartners: partners.filter(p => p.status === 'pending').length,
        suspendedPartners: partners.filter(p => p.status === 'suspended').length,
        // Add more metrics as needed
      });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
