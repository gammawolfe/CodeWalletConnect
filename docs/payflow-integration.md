# RoSaBank + PayFlow Integration Guide

## Overview

This document outlines the integration between RoSaBank (ROSCA app) and PayFlow (Payment Gateway Aggregator + Wallet Service) to provide secure, production-ready financial operations for rotating savings groups.

## Integration Architecture

### Current State (RoSaBank)
- Basic wallet service integration via REST API
- In-memory storage for development
- Group wallet creation and balance tracking
- Simple transaction logging

### Target State (RoSaBank + PayFlow)
- Production-ready payment processing via Stripe
- Double-entry ledger for accurate financial tracking
- Automated contribution collection and payout distribution
- Real-time transaction monitoring and notifications
- Multi-currency support with proper exchange rate handling
- PCI-compliant payment security

## Integration Components

### 1. PayFlow Client SDK
Create a PayFlow client SDK for RoSaBank that wraps all wallet operations:
- Wallet creation and management
- Payment processing (contributions, payouts)
- Transaction history and reporting
- Balance inquiries and transfers

### 2. Enhanced Group Wallet Management
Replace current basic wallet integration with PayFlow wallets:
- Automatic group wallet creation on PayFlow
- Real-time balance synchronization
- Transaction history with full audit trail
- Multi-member wallet permissions

### 3. Automated Payment Flows
Implement automated ROSCA business logic:
- Scheduled contribution collection
- Automatic payout distribution to current turn member
- Payment failure handling and retry logic
- Notification system for payment events

### 4. Enhanced Financial Reporting
Leverage PayFlow's ledger system for comprehensive reporting:
- Detailed transaction history per group
- Member contribution tracking
- Automated reconciliation
- Export capabilities for accounting

## Implementation Plan

### Phase 1: PayFlow Client Integration
1. Create PayFlow client SDK
2. Replace basic wallet service calls
3. Update environment configuration
4. Test wallet creation and balance queries

## Recent Changes and Requirements

- Clearing wallet for double-entry:
  - Credit/debit operations are now modeled as transfers involving a partner "Clearing" wallet.
  - The clearing wallet is auto-created on first use and stored in `partners.settings.clearingWalletId`.

- API authentication:
  - Use header `Authorization: Bearer sk_...` with partner secret API key.
  - Permissions and environment (`sandbox`/`production`) are enforced per key.

- Stripe webhook:
  - The endpoint `/api/v1/webhooks/stripe` requires raw body handling. Do not send prettified or altered JSON.
  - Signature header `Stripe-Signature` must be included.

- Session auth security:
  - `SESSION_SECRET` is required to start the server; session cookie has `httpOnly`, `sameSite=lax`, and `secure` in production.
  - CSRF is enforced on `/api/login`, `/api/register`, `/api/logout` via an `X-CSRF-Token` header.
  - Obtain a token from `GET /api/csrf-token` and reflect it in subsequent requests.

- CORS and security headers:
  - Server sets Helmet defaults and CORS with `credentials: true`.
  - Set `CORS_ORIGIN` to your frontend origin when deploying.

- Rate limiting:
  - Global API RPM can be configured via `RATE_LIMIT_RPM` (default 1000).

- Required environment variables:
  - `DATABASE_URL` (Neon Postgres)
  - `SESSION_SECRET`
  - `CORS_ORIGIN`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - Optional: `STRIPE_API_VERSION`, `RATE_LIMIT_RPM`

### Phase 2: Payment Processing
1. Integrate Stripe payment collection
2. Implement automated contribution flow
3. Add payout distribution logic
4. Handle payment failures and retries

### Phase 3: Advanced Features
1. Add transaction notifications
2. Implement payment scheduling
3. Enhanced reporting dashboard
4. Multi-currency optimization

### Phase 4: Production Deployment
1. Security audit and compliance check
2. Performance optimization
3. Monitoring and alerting setup
4. User migration and training

## Benefits of Integration

### For Users
- **Real Money Transactions**: Actual Stripe payment processing instead of simulation
- **Enhanced Security**: PCI-compliant payment handling
- **Better Reliability**: Production-grade infrastructure with failover
- **Detailed History**: Complete transaction audit trail

### For Developers
- **Reduced Complexity**: Leverage PayFlow's financial infrastructure
- **Better Maintainability**: Separation of concerns between ROSCA logic and payment processing
- **Scalability**: Built-in support for high transaction volumes
- **Compliance**: Automatic adherence to financial regulations

### For Business
- **Production Ready**: Enterprise-grade financial infrastructure
- **Cost Effective**: Shared infrastructure across multiple applications
- **Regulatory Compliance**: Built-in compliance features
- **Analytics**: Advanced financial reporting and insights

## Next Steps

1. **Environment Setup**: Configure PayFlow instance for RoSaBank integration
2. **API Key Generation**: Create dedicated API keys for RoSaBank service
3. **SDK Implementation**: Build PayFlow client SDK for seamless integration
4. **Testing**: Comprehensive testing with real Stripe transactions
5. **Migration**: Gradual migration of existing groups to PayFlow wallets