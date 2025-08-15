# PayFlow B2B Infrastructure Architecture Guide

## Overview

PayFlow has been transformed into a pure B2B infrastructure service that provides financial backend capabilities to third-party applications. This guide explains the architecture, authentication model, and integration patterns.

## Architecture Components

### 1. Partner Management System
- **Partners Table**: Stores B2B client organizations
- **Application Onboarding**: Multi-step approval process
- **Status Management**: Pending → Approved → Active/Suspended
- **Business Information**: Company details, contact info, business type

### 2. API Key Authentication
- **Dual Environment**: Sandbox and Production keys
- **Key Format**: `sk_test_*` for sandbox, `sk_live_*` for production
- **Security**: SHA-256 hashed storage, Bearer token authentication
- **Permissions**: Granular permissions (wallets:read, transactions:write, etc.)
- **Rate Limiting**: Per-partner rate limiting with usage tracking

### 3. Partner-Scoped Operations
- **Wallet Ownership**: All wallets belong to specific partners
- **External ID Mapping**: Partners can map their user/wallet IDs to PayFlow
- **Isolated Data**: Complete data isolation between partners
- **Transaction History**: Partner-scoped transaction access

## Authentication Models

### Admin Interface (PayFlow Team)
```
Session-based authentication + CSRF protection
→ User login with username/password  
→ Express session management
→ Full system access for partner management
```

### Partner APIs (B2B Clients)
```
API Key authentication (Bearer)
→ Bearer token in Authorization header
→ Partner identification via API key
→ Permission-based access control
→ Rate limiting per partner
```

## API Endpoints

### Partner API Endpoints (for B2B clients)
```
POST /api/v1/wallets
GET /api/v1/wallets
GET /api/v1/wallets/:id
GET /api/v1/wallets/:id/balance
GET /api/v1/wallets/:id/transactions
GET /api/v1/wallets/external/:externalId

POST /api/v1/wallets/:id/credit
POST /api/v1/wallets/:id/debit
POST /api/v1/transfers
POST /api/v1/payouts

POST /api/v1/webhooks/stripe
```

### Admin API Endpoints (for PayFlow team)
```
GET /api/admin/partners
POST /api/admin/partners
PATCH /api/admin/partners/:id/status

GET /api/admin/partners/:partnerId/api-keys
POST /api/admin/partners/:partnerId/api-keys
DELETE /api/admin/api-keys/:keyId

GET /api/admin/system/stats
```

## Payment Gateway Strategy

### Single PayFlow Stripe Account
- **Centralized Processing**: One Stripe account serves all partners
- **Transaction Attribution**: Metadata tracks partner ownership
- **Simplified Compliance**: Single PCI compliance scope
- **Shared Infrastructure**: Cost-effective for smaller partners

### Partner-Specific Stripe Connect (Future)
- **Dedicated Accounts**: Partners can use their own Stripe accounts
- **Direct Payouts**: Funds go directly to partner accounts
- **Custom Branding**: Partner-specific payment experiences
- **Compliance Isolation**: Partners handle their own compliance

## Integration Patterns

### 1. Direct API Integration
```javascript
// Partner authenticates with API key
const response = await fetch('https://api.payflow.com/api/v1/wallets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    externalUserId: 'user_123',
    externalWalletId: 'wallet_456',
    name: 'John Doe Main Wallet',
    currency: 'USD'
  })
});
```

### 2. SDK Integration (Planned)
```javascript
// PayFlow Client SDK
import { PayFlowClient } from '@payflow/client-sdk';

const client = new PayFlowClient({
  apiKey: process.env.PAYFLOW_API_KEY,
  environment: 'sandbox' // or 'production'
});

// Create wallet for partner's user
const wallet = await client.wallets.create({
  externalUserId: 'user_123',
  name: 'Main Wallet',
  currency: 'USD'
});
```

### 3. Webhook Integration
```javascript
// Partner receives webhooks for real-time updates
app.post('/payflow/webhook', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'transaction.completed':
      // Update partner's system with transaction status
      break;
    case 'wallet.credited':
      // Notify user of credit
      break;
  }
  
  res.json({ received: true });
});
```

## Data Flow Examples

### RoSaBank ROSCA Integration
```
1. RoSaBank User creates savings group
   ↓
2. RoSaBank → PayFlow API: Create group wallet
   ↓
3. PayFlow returns wallet ID
   ↓
4. Members contribute via RoSaBank interface
   ↓
5. RoSaBank → PayFlow API: Credit member wallets
   ↓
6. PayFlow processes payments via Stripe
   ↓
7. PayFlow → RoSaBank webhook: Transaction completed
   ↓
8. RoSaBank updates member balances
```

### Payout Distribution
```
1. ROSCA cycle completes
   ↓
2. RoSaBank calculates winner
   ↓
3. RoSaBank → PayFlow API: Transfer from group to winner
   ↓
4. PayFlow creates internal transfer
   ↓
5. RoSaBank → PayFlow API: Payout to winner's bank
   ↓
6. PayFlow → Stripe: Create payout
   ↓
7. Stripe → Bank: Funds transfer
   ↓
8. PayFlow → RoSaBank webhook: Payout completed
```

## Security Considerations

### API Key Security
- **Secure Storage**: Hash keys with SHA-256 before database storage
- **Environment Separation**: Separate sandbox/production keys
- **Key Rotation**: Support for key expiration and renewal
- **Audit Trail**: Log all API key usage and authentication attempts

### Data Isolation
- **Partner Scoping**: All database queries filtered by partner ID
- **Access Validation**: Middleware validates wallet ownership
- **Permission Checks**: Granular permission enforcement
- **Rate Limiting**: Prevent abuse and ensure fair usage

### Webhook Security
- Use raw-body verification for Stripe webhooks; do not JSON-parse before signature verification
- Partner outbound webhooks are HMAC signed
### Session Security
- `SESSION_SECRET` required to start server
- Cookies: `httpOnly`, `sameSite=lax`, `secure` in production
- CSRF: `GET /api/csrf-token` issues a token; send `X-CSRF-Token` on auth POSTs
- **Signature Verification**: HMAC signatures for webhook authenticity
- **Retry Logic**: Reliable delivery with exponential backoff
- **Idempotency**: Handle duplicate webhook deliveries gracefully

## Monitoring and Observability

### Partner Metrics
- **Transaction Volume**: Monthly processing volumes per partner
- **API Usage**: Request counts and rate limit utilization
- **Error Rates**: Failed requests and common error patterns
- **Response Times**: API performance monitoring

### System Health
- **Gateway Status**: Payment gateway connectivity and health
- **Database Performance**: Query performance and connection pools
- **Webhook Delivery**: Success rates and retry statistics
- **Security Events**: Failed authentication attempts and anomalies

## Deployment Architecture

### Production Environment
```
Internet → Load Balancer → PayFlow API Servers
                        ↓
                   PostgreSQL Database
                        ↓
                   Payment Gateways (Stripe)
                        ↓
                   Partner Webhooks
```

### Development Environment
```
Local Development → PayFlow API (localhost:3000)
                   ↓
              Local PostgreSQL
                   ↓
              Mock Payment Gateway
                   ↓
              Webhook Testing Tools
```

## Getting Started for Partners

1. **Apply for Partnership**: Submit application with business details
2. **Security Review**: PayFlow team reviews application and business
3. **Technical Integration**: Receive sandbox API keys for testing
4. **Certification**: Complete integration testing and security review
5. **Production Access**: Receive production API keys
6. **Go Live**: Start processing real transactions

This architecture ensures PayFlow can serve as reliable financial infrastructure while maintaining security, scalability, and partner data isolation.