import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, requireAuth, requireApiKey } from "./auth";
import { walletService } from "./services/wallet";
import { paymentGatewayService } from "./services/payment-gateway";
import { storage } from "./storage";
import { 
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

  // Wallet management routes (require authentication)
  app.post("/api/v1/wallets", requireAuth, async (req: any, res, next) => {
    try {
      const { currency, metadata } = insertWalletSchema.parse(req.body);
      const wallet = await walletService.createWallet(
        req.user.id, 
        currency || 'USD', 
        metadata
      );
      res.status(201).json(wallet);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/wallets", requireAuth, async (req: any, res, next) => {
    try {
      const wallets = await storage.getWalletsByUserId(req.user.id);
      res.json(wallets);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/wallets/:id/balance", requireAuth, async (req: any, res, next) => {
    try {
      const { id } = req.params;
      
      // Verify wallet belongs to user
      const wallet = await storage.getWallet(id);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const balance = await walletService.getWalletBalance(id);
      res.json(balance);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/wallets/:id/transactions", requireAuth, async (req: any, res, next) => {
    try {
      const { id } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      // Verify wallet belongs to user
      const wallet = await storage.getWallet(id);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const transactions = await walletService.getTransactionHistory(
        id, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      res.json(transactions);
    } catch (error) {
      next(error);
    }
  });

  // Transaction routes (require authentication)
  app.post("/api/v1/wallets/:id/credit", requireAuth, async (req: any, res, next) => {
    try {
      const { id } = req.params;
      
      // Verify wallet belongs to user
      const wallet = await storage.getWallet(id);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const data = creditWalletSchema.parse({ ...req.body, walletId: id });
      const transaction = await walletService.creditWallet(data);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/wallets/:id/debit", requireAuth, async (req: any, res, next) => {
    try {
      const { id } = req.params;
      
      // Verify wallet belongs to user
      const wallet = await storage.getWallet(id);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const data = debitWalletSchema.parse({ ...req.body, walletId: id });
      const transaction = await walletService.debitWallet(data);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/transfers", requireAuth, async (req: any, res, next) => {
    try {
      const data = transferSchema.parse(req.body);
      
      // Verify both wallets belong to user (or implement proper authorization)
      const fromWallet = await storage.getWallet(data.fromWalletId);
      const toWallet = await storage.getWallet(data.toWalletId);
      
      if (!fromWallet || fromWallet.userId !== req.user.id) {
        return res.status(404).json({ message: 'Source wallet not found' });
      }
      
      if (!toWallet) {
        return res.status(404).json({ message: 'Destination wallet not found' });
      }

      const transaction = await walletService.transferBetweenWallets(data);
      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  });

  // Payout routes (require authentication)
  app.post("/api/v1/payouts", requireAuth, async (req: any, res, next) => {
    try {
      const data = payoutSchema.parse(req.body);
      const gateway = req.body.gateway || 'stripe';
      
      // Verify wallet belongs to user
      const wallet = await storage.getWallet(data.walletId);
      if (!wallet || wallet.userId !== req.user.id) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      const payout = await paymentGatewayService.createPayout(gateway, data);
      res.status(201).json(payout);
    } catch (error) {
      next(error);
    }
  });

  // Webhook endpoints (require API key or webhook signature)
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

  app.post("/api/v1/webhooks/mock", requireApiKey, async (req, res, next) => {
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

  // Admin/service routes (require API key)
  app.get("/api/v1/admin/wallets", requireApiKey, async (req, res, next) => {
    try {
      // Admin endpoint to list all wallets
      // In a real implementation, add proper pagination and filtering
      res.json({ message: 'Admin endpoint - not implemented in demo' });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
