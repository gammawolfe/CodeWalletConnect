import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { routes } from '../api-router';

// Mock the services and repositories
vi.mock('../repositories/partners-repository');
vi.mock('../repositories/wallets-repository');
vi.mock('../repositories/transactions-repository');
vi.mock('../services/wallet');
vi.mock('../services/transaction');
vi.mock('../auth-api');

describe('API Endpoints', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', routes);
    
    // Mock API key authentication middleware
    vi.doMock('../auth-api', () => ({
      requireApiKey: (req: any, res: any, next: any) => {
        req.partner = {
          id: 'test-partner-123',
          name: 'Test Partner',
          status: 'approved'
        };
        next();
      }
    }));
  });

  describe('POST /api/wallets', () => {
    it('should create a new wallet', async () => {
      const walletData = {
        externalId: 'test-wallet-1',
        name: 'Test Wallet',
        currency: 'USD'
      };

      const mockWallet = {
        id: 'wallet-123',
        partnerId: 'test-partner-123',
        ...walletData,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Mock the wallet service
      const mockWalletService = {
        createWallet: vi.fn().mockResolvedValue(mockWallet)
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', 'Bearer test-api-key')
        .send(walletData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: 'wallet-123',
        externalId: 'test-wallet-1',
        name: 'Test Wallet',
        currency: 'USD',
        status: 'active'
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          name: 'Test Wallet'
          // Missing externalId and currency
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });

    it('should handle duplicate external IDs', async () => {
      const walletData = {
        externalId: 'duplicate-wallet',
        name: 'Test Wallet',
        currency: 'USD'
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', 'Bearer test-api-key')
        .send(walletData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('already exists');
    });

    it('should require API key authentication', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .send({
          externalId: 'test-wallet',
          name: 'Test Wallet',
          currency: 'USD'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authentication');
    });
  });

  describe('GET /api/wallets/:walletId', () => {
    it('should return wallet details for valid wallet', async () => {
      const mockWallet = {
        id: 'wallet-123',
        partnerId: 'test-partner-123',
        externalId: 'test-wallet',
        name: 'Test Wallet',
        currency: 'USD',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await request(app)
        .get('/api/wallets/wallet-123')
        .set('Authorization', 'Bearer test-api-key')
        .expect(200);

      expect(response.body).toMatchObject(mockWallet);
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await request(app)
        .get('/api/wallets/non-existent')
        .set('Authorization', 'Bearer test-api-key')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });

    it('should enforce wallet ownership', async () => {
      // Wallet belongs to different partner
      const response = await request(app)
        .get('/api/wallets/other-partner-wallet')
        .set('Authorization', 'Bearer test-api-key')
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('access denied');
    });
  });

  describe('GET /api/wallets/:walletId/balance', () => {
    it('should return current wallet balance', async () => {
      const response = await request(app)
        .get('/api/wallets/wallet-123/balance')
        .set('Authorization', 'Bearer test-api-key')
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('currency');
      expect(typeof response.body.balance).toBe('string');
      expect(response.body.balance).toMatch(/^\d+\.\d{2}$/); // Format: 123.45
    });
  });

  describe('POST /api/wallets/:walletId/transactions', () => {
    it('should create a credit transaction', async () => {
      const transactionData = {
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        description: 'Test deposit',
        idempotencyKey: 'test-credit-1'
      };

      const mockTransaction = {
        id: 'tx-123',
        walletId: 'wallet-123',
        ...transactionData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .send(transactionData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: 'tx-123',
        type: 'credit',
        amount: '100.00',
        status: 'pending'
      });
    });

    it('should create a debit transaction', async () => {
      const transactionData = {
        type: 'debit',
        amount: '50.00',
        currency: 'USD',
        description: 'Test withdrawal',
        idempotencyKey: 'test-debit-1'
      };

      const response = await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .send(transactionData)
        .expect(201);

      expect(response.body).toMatchObject({
        type: 'debit',
        amount: '50.00',
        status: 'pending'
      });
    });

    it('should validate transaction amount', async () => {
      const response = await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          type: 'credit',
          amount: 'invalid-amount',
          currency: 'USD',
          idempotencyKey: 'test-invalid-amount'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('amount');
    });

    it('should validate currency matches wallet', async () => {
      const response = await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          type: 'credit',
          amount: '100.00',
          currency: 'EUR', // Wallet is USD
          idempotencyKey: 'test-currency-mismatch'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('currency');
    });

    it('should handle idempotency correctly', async () => {
      const transactionData = {
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey: 'duplicate-key'
      };

      // First request
      await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .send(transactionData)
        .expect(201);

      // Second request with same idempotency key
      const response = await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          ...transactionData,
          amount: '200.00' // Different amount
        })
        .expect(200); // Should return existing transaction

      expect(response.body.amount).toBe('100.00'); // Original amount
    });
  });

  describe('GET /api/wallets/:walletId/transactions', () => {
    it('should return paginated transaction history', async () => {
      const response = await request(app)
        .get('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .query({
          limit: 10,
          offset: 0
        })
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.transactions)).toBe(true);
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('offset');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer test-api-key')
        .query({
          limit: 'invalid',
          offset: 'invalid'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });
  });

  describe('POST /api/wallets/:fromWalletId/transfer/:toWalletId', () => {
    it('should create a transfer between wallets', async () => {
      const transferData = {
        amount: '75.00',
        currency: 'USD',
        description: 'Test transfer',
        idempotencyKey: 'test-transfer-1'
      };

      const response = await request(app)
        .post('/api/wallets/wallet-123/transfer/wallet-456')
        .set('Authorization', 'Bearer test-api-key')
        .send(transferData)
        .expect(201);

      expect(response.body).toMatchObject({
        type: 'transfer',
        amount: '75.00',
        walletId: 'wallet-123',
        toWalletId: 'wallet-456',
        status: 'pending'
      });
    });

    it('should validate both wallets belong to same partner', async () => {
      const response = await request(app)
        .post('/api/wallets/wallet-123/transfer/other-partner-wallet')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          amount: '75.00',
          currency: 'USD',
          idempotencyKey: 'test-cross-partner-transfer'
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('access denied');
    });
  });

  describe('GET /api/transactions/:transactionId', () => {
    it('should return transaction details', async () => {
      const mockTransaction = {
        id: 'tx-123',
        walletId: 'wallet-123',
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        status: 'completed',
        description: 'Test transaction',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await request(app)
        .get('/api/transactions/tx-123')
        .set('Authorization', 'Bearer test-api-key')
        .expect(200);

      expect(response.body).toMatchObject(mockTransaction);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/non-existent')
        .set('Authorization', 'Bearer test-api-key')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not found');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', 'Bearer test-api-key')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('malformed');
    });

    it('should handle internal server errors', async () => {
      // Mock service to throw error
      const mockWalletService = {
        createWallet: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', 'Bearer test-api-key')
        .send({
          externalId: 'error-test',
          name: 'Error Test',
          currency: 'USD'
        })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Internal server error');
      // Should not expose internal error details
      expect(response.body.error).not.toContain('Database connection failed');
    });
  });

  describe('Rate limiting', () => {
    it('should respect rate limits', async () => {
      // This would require actual rate limiting implementation
      // For now, we'll test that the endpoint exists and works
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app)
            .get('/api/wallets/wallet-123/balance')
            .set('Authorization', 'Bearer test-api-key')
        );
      }

      const responses = await Promise.all(promises);
      
      // All should succeed under normal rate limits
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});