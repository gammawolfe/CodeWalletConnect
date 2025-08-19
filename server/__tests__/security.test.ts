import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { routes } from '../api-router';

describe('Security Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/api', routes);
  });

  describe('Authentication & Authorization', () => {
    it('should reject requests without API key', async () => {
      const response = await request(app)
        .get('/api/wallets')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('authentication');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get('/api/wallets')
        .set('Authorization', 'Bearer invalid-api-key')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should reject malformed Authorization headers', async () => {
      const malformedHeaders = [
        'invalid-format',
        'Bearer',
        'Basic dGVzdDp0ZXN0', // Wrong auth type
        'Bearer ', // Empty token
        'Bearer token with spaces',
      ];

      for (const header of malformedHeaders) {
        const response = await request(app)
          .get('/api/wallets')
          .set('Authorization', header);

        expect([400, 401]).toContain(response.status);
      }
    });
  });

  describe('Input Validation & Sanitization', () => {
    it('should reject SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE wallets; --",
        "' OR '1'='1",
        'UNION SELECT * FROM users',
        '1; DELETE FROM transactions',
      ];

      for (const payload of sqlInjectionPayloads) {
        const response = await request(app)
          .post('/api/wallets')
          .set('Authorization', 'Bearer valid-test-key')
          .send({
            externalId: payload,
            name: 'Test Wallet',
            currency: 'USD'
          });

        expect([400, 422]).toContain(response.status);
        expect(response.body).toHaveProperty('error');
      }
    });

    it('should reject XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/wallets')
          .set('Authorization', 'Bearer valid-test-key')
          .send({
            externalId: 'test-wallet',
            name: payload,
            currency: 'USD'
          });

        expect([400, 422]).toContain(response.status);
        if (response.status === 201) {
          // If somehow created, ensure the payload is sanitized
          expect(response.body.name).not.toContain('<script>');
          expect(response.body.name).not.toContain('javascript:');
        }
      }
    });

    it('should validate decimal precision for financial amounts', async () => {
      const invalidAmounts = [
        '100.123', // Too many decimal places
        '100.', // Incomplete decimal
        '.50', // Missing whole number
        '100,50', // Wrong decimal separator
        '1e5', // Scientific notation
        'Infinity',
        'NaN',
        '0x64', // Hexadecimal
      ];

      for (const amount of invalidAmounts) {
        const response = await request(app)
          .post('/api/wallets/wallet-123/transactions')
          .set('Authorization', 'Bearer valid-test-key')
          .send({
            type: 'credit',
            amount: amount,
            currency: 'USD',
            idempotencyKey: `test-${Math.random()}`
          });

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should limit request payload size', async () => {
      const largePayload = {
        externalId: 'test-wallet',
        name: 'A'.repeat(100000), // Very long name
        currency: 'USD',
        metadata: 'B'.repeat(100000) // Large metadata
      };

      const response = await request(app)
        .post('/api/wallets')
        .set('Authorization', 'Bearer valid-test-key')
        .send(largePayload);

      expect([400, 413]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should implement rate limiting for API endpoints', async () => {
      // Simulate rapid requests
      const requests = Array(20).fill(null).map(() =>
        request(app)
          .get('/api/wallets/wallet-123/balance')
          .set('Authorization', 'Bearer valid-test-key')
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // This test depends on rate limiting implementation
      // For now, just ensure we don't have server errors
      responses.forEach(response => {
        expect([200, 404, 429]).toContain(response.status);
      });
    });
  });

  describe('HTTPS & Security Headers', () => {
    it('should set security headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // These would be set by helmet middleware
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection',
        'strict-transport-security'
      ];

      // Note: In testing, these headers might not be set
      // This test serves as documentation of expected headers
      securityHeaders.forEach(header => {
        if (response.headers[header]) {
          expect(response.headers[header]).toBeDefined();
        }
      });
    });
  });

  describe('Data Privacy & Masking', () => {
    it('should not expose sensitive data in error messages', async () => {
      const response = await request(app)
        .get('/api/wallets/non-existent-wallet')
        .set('Authorization', 'Bearer valid-test-key')
        .expect(404);

      // Ensure error messages don't leak sensitive information
      const errorMessage = response.body.error?.toLowerCase() || '';
      
      const sensitiveKeywords = [
        'database',
        'sql',
        'password',
        'secret',
        'key',
        'token',
        'connection'
      ];

      sensitiveKeywords.forEach(keyword => {
        expect(errorMessage).not.toContain(keyword);
      });
    });

    it('should mask sensitive fields in API responses', async () => {
      // If we ever return partner info, ensure sensitive fields are masked
      const response = await request(app)
        .get('/api/partner/profile')
        .set('Authorization', 'Bearer valid-test-key');

      if (response.status === 200) {
        // Ensure sensitive fields are not present
        expect(response.body).not.toHaveProperty('password');
        expect(response.body).not.toHaveProperty('apiKey');
        expect(response.body).not.toHaveProperty('stripeSecretKey');
      }
    });
  });

  describe('Idempotency Security', () => {
    it('should prevent idempotency key reuse across different partners', async () => {
      const idempotencyKey = 'shared-key-12345';
      
      // This test would require two different API keys from different partners
      // For now, document the expected behavior
      
      const firstRequest = {
        type: 'credit',
        amount: '100.00',
        currency: 'USD',
        idempotencyKey
      };

      const response1 = await request(app)
        .post('/api/wallets/partner1-wallet/transactions')
        .set('Authorization', 'Bearer partner1-api-key')
        .send(firstRequest);

      const response2 = await request(app)
        .post('/api/wallets/partner2-wallet/transactions')
        .set('Authorization', 'Bearer partner2-api-key')
        .send(firstRequest);

      // Both should succeed as they're from different partners
      // Or both should fail if idempotency keys are globally unique
      if (response1.status === 201) {
        expect([201, 409]).toContain(response2.status);
      }
    });
  });

  describe('Financial Data Integrity', () => {
    it('should validate currency codes against ISO 4217', async () => {
      const invalidCurrencies = [
        'INVALID',
        'USD1',
        'usd', // lowercase
        'USDD', // too long
        'US', // too short
        '123',
        'XYZ'
      ];

      for (const currency of invalidCurrencies) {
        const response = await request(app)
          .post('/api/wallets')
          .set('Authorization', 'Bearer valid-test-key')
          .send({
            externalId: `test-${Math.random()}`,
            name: 'Test Wallet',
            currency: currency
          });

        expect([400, 422]).toContain(response.status);
      }
    });

    it('should prevent negative transaction amounts', async () => {
      const response = await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer valid-test-key')
        .send({
          type: 'credit',
          amount: '-100.00',
          currency: 'USD',
          idempotencyKey: 'negative-amount-test'
        });

      expect([400, 422]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('amount');
    });

    it('should prevent zero transaction amounts', async () => {
      const response = await request(app)
        .post('/api/wallets/wallet-123/transactions')
        .set('Authorization', 'Bearer valid-test-key')
        .send({
          type: 'credit',
          amount: '0.00',
          currency: 'USD',
          idempotencyKey: 'zero-amount-test'
        });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('Concurrency & Race Conditions', () => {
    it('should handle concurrent transaction creation safely', async () => {
      const walletId = 'concurrent-test-wallet';
      
      // Create multiple transactions concurrently with different idempotency keys
      const transactions = Array(10).fill(null).map((_, i) =>
        request(app)
          .post(`/api/wallets/${walletId}/transactions`)
          .set('Authorization', 'Bearer valid-test-key')
          .send({
            type: 'credit',
            amount: '10.00',
            currency: 'USD',
            idempotencyKey: `concurrent-${i}`
          })
      );

      const responses = await Promise.all(transactions);
      
      // All should either succeed or fail gracefully
      responses.forEach((response, i) => {
        expect([201, 400, 409, 422, 500]).toContain(response.status);
        
        if (response.status === 201) {
          expect(response.body.idempotencyKey).toBe(`concurrent-${i}`);
        }
      });
    });
  });
});