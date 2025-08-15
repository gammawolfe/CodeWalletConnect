# Ecosystem Data Flow & Information Architecture

## Overview

This document clearly defines what information is shared between all parties in the Gateway ecosystem: Stripe (payment gateway), Cooper (infrastructure platform), and 3rd party partners (like RoSaBank/SosoBank).

## Data Flow Architecture

```
3rd Party App (RoSaBank) ←→ Cooper Platform ←→ Stripe Payment Gateway
        ↑                           ↑                      ↑
    Partner Data              Central Hub              Payment Data
```

---

## 🏢 Information Gateway Stores

### Partner Information
```typescript
// Partners table - stored in Gateway database
{
  id: "partner_uuid",
  name: "RoSaBank",
  companyName: "Rosa Banking Solutions Inc",
  email: "api@rosabank.com",
  contactPerson: "Jane Smith",
  businessType: "Financial Services",
  status: "approved",
  webhookUrl: "https://api.rosabank.com/webhooks/payflow",
  stripeAccountId: "acct_stripe_connect_123", // Partner's Stripe Connect account
  settings: {
    clearingWalletId: "wallet_uuid",
    fees: { transactionFee: "0.029" }
  },
  metadata: {
    onboardingDate: "2024-08-01",
    complianceStatus: "verified"
  }
}
```

### Wallet Information
```typescript
// Wallets table - partner-scoped data
{
  id: "wallet_payflow_uuid",
  partnerId: "partner_uuid",
  externalUserId: "rosabank_user_456",      // Partner's user ID
  externalWalletId: "rosca_group_123",      // Partner's wallet reference
  name: "Weekly Savings Circle #7",
  currency: "USD",
  status: "active",
  metadata: {
    groupType: "rosca",
    memberCount: 8,
    currentRound: 3,
    totalContributions: 12
  }
}
```

### Transaction Records
```typescript
// Transactions table - financial operations
{
  id: "txn_payflow_uuid",
  idempotencyKey: "partner_provided_unique_key",
  type: "credit",
  status: "completed",
  amount: "50.00",
  currency: "USD",
  description: "ROSCA contribution - Week 3",
  fromWalletId: null,
  toWalletId: "wallet_payflow_uuid",
  gatewayTransactionId: "pi_stripe_payment_123",
  gateway: "stripe",
  metadata: {
    partnerUserId: "rosabank_user_456",
    groupId: "rosca_group_123",
    contributionWeek: 3,
    memberName: "John Doe"
  }
}
```

### Double-Entry Ledger
```typescript
// Ledger entries - balance calculations
{
  id: "ledger_entry_uuid",
  transactionId: "txn_payflow_uuid",
  walletId: "wallet_payflow_uuid",
  type: "credit",
  amount: "50.00",
  currency: "USD",
  balance: "350.00",  // Running balance after this entry
  description: "ROSCA contribution credit"
}
```

### Gateway Transaction Records
```typescript
// Gateway transactions - reconciliation data
{
  id: "gateway_txn_uuid",
  gatewayTransactionId: "pi_stripe_payment_123",
  gateway: "stripe",
  status: "succeeded",
  amount: "50.00",
  currency: "USD",
  metadata: {
    // Stripe's full payment intent object
    customer: "cus_stripe_customer_789",
    payment_method: "pm_card_visa_4242"
  },
  webhookData: {
    // Complete webhook payload from Stripe
    event_type: "payment_intent.succeeded",
    created: 1691234567
  },
  transactionId: "txn_payflow_uuid"
}
```

---

## 💳 Information Stripe Receives

### Payment Intent Creation
```typescript
// Data sent to Stripe when creating payment intent
{
  amount: 5000,  // $50.00 in cents
  currency: "usd",
  customer: "cus_stripe_customer_789",  // Partner's customer in Stripe
  payment_method: "pm_card_visa_4242",
  metadata: {
    // PayFlow tracking data
    payflow_wallet_id: "wallet_payflow_uuid",
    payflow_transaction_id: "txn_payflow_uuid",
    partner_name: "rosabank",
    partner_user_id: "rosabank_user_456",
    partner_reference: "rosca_group_123_contribution_week3"
  }
}
```

### What Stripe NEVER Sees
- ❌ Cooper wallet details or balances
- ❌ Partner's business logic or user relationships
- ❌ ROSCA group membership or structure
- ❌ Partner's internal user management
- ❌ Cooper's double-entry ledger system

### What Stripe DOES Store
- ✅ Payment method details (cards, bank accounts)
- ✅ Customer information (if partner uses Stripe customers)
- ✅ Transaction amounts and status
- ✅ Metadata for reconciliation
- ✅ Fraud detection and compliance data

---

## 🏦 Information 3rd Party Partners Provide

### Required for Wallet Operations
```typescript
// API calls from partner to PayFlow
POST /api/v1/wallets
{
  externalUserId: "rosabank_user_456",     // Partner's user ID
  externalWalletId: "rosca_group_123",     // Partner's wallet reference
  name: "Weekly Savings Circle #7",
  currency: "USD",
  metadata: {
    groupType: "rosca",
    memberCount: 8,
    groupDescription: "Weekly savings group"
  }
}
```

### Required for Transactions
```typescript
// Credit wallet request
POST /api/v1/wallets/{id}/credit
{
  amount: "50.00",
  currency: "USD",
  description: "ROSCA contribution - Week 3",
  idempotencyKey: "rosabank_unique_key_123",
  metadata: {
    partnerUserId: "rosabank_user_456",
    groupId: "rosca_group_123",
    contributionWeek: 3,
    memberName: "John Doe"
  }
}
```

### What Partners MUST Provide
- ✅ API authentication (Bearer token)
- ✅ Unique idempotency keys for transactions
- ✅ External user/wallet IDs for mapping
- ✅ Transaction descriptions and metadata
- ✅ Webhook endpoint for real-time updates

### What Partners NEVER Need to Provide
- ❌ Credit card or payment method details (handled by Stripe)
- ❌ PCI compliance infrastructure
- ❌ Payment gateway integrations
- ❌ Financial reconciliation systems
- ❌ Double-entry bookkeeping logic

---

## 🔄 Information Exchange Flows

### 1. Wallet Creation Flow
```
Partner → Cooper:
- External user/wallet IDs
- Wallet name and metadata
- Currency preference

Cooper → Database:
- Creates wallet record
- Associates with partner ID
- No external API calls

Stripe:
- No involvement in wallet creation
```

### 2. Wallet Funding Flow
```
Partner → Cooper:
- Credit request with amount
- Idempotency key
- User context and metadata

Cooper → Stripe:
- Payment intent creation
- Amount in cents
- Tracking metadata

Stripe → Cooper (webhook):
- Payment confirmation
- Gateway transaction ID
- Status updates

Cooper → Partner (webhook):
- Transaction completed
- Updated wallet balance
- Reference IDs for mapping
```

### 3. Wallet Transfer Flow
```
Partner → Cooper:
- From/to wallet IDs
- Transfer amount
- Description and metadata

Cooper Internal:
- Balance validation
- Double-entry ledger updates
- Transaction recording

No External Gateways:
- Internal transfers don't involve Stripe
- Instant settlement within Cooper
```

### 4. Wallet Withdrawal Flow
```
Partner → Cooper:
- Payout request with amount
- Destination account details
- Idempotency key

Cooper → Stripe:
- Transfer/payout creation
- Destination routing
- Amount and metadata

Stripe → Bank Network:
- ACH/wire transfer
- Settlement processing

Stripe → Cooper (webhook):
- Payout status updates
- Settlement confirmation
```

---

## 🛡️ Data Security & Privacy

### Cooper Security Measures
- **API Keys**: Hashed and scoped by partner
- **Encryption**: All data encrypted at rest and in transit
- **Audit Trails**: Complete transaction history
- **Access Control**: Role-based permissions
- **Data Isolation**: Partner data strictly separated

### Stripe Security Measures
- **PCI DSS Level 1**: Highest security certification
- **Card Data**: Tokenized and encrypted
- **Fraud Detection**: Machine learning algorithms
- **3D Secure**: Additional authentication when required

### Partner Security Requirements
- **API Authentication**: Secure Bearer token usage
- **Webhook Verification**: HMAC signature validation
- **HTTPS Only**: Encrypted communication required
- **Key Rotation**: Regular API key updates

---

## 📊 Data Retention & Compliance

### Cooper Data Retention
- **Transaction Records**: 7 years (regulatory requirement)
- **Wallet Data**: While active + 3 years
- **Audit Logs**: 10 years
- **Partner Metadata**: Business relationship duration

### Stripe Data Retention
- **Payment Data**: Per Stripe's retention policy
- **Customer Data**: Managed by partner's Stripe account
- **Compliance Data**: Regulatory requirements

### Partner Data Control
- **Own Customer Data**: Partners control their user data
- **Wallet Metadata**: Can be updated via API
- **Transaction References**: Partner-defined identifiers
- **Data Export**: Available via API for partner systems

---

## 🔗 Integration Patterns

### RESTful API Design
```
GET    /api/v1/wallets           # List partner's wallets
POST   /api/v1/wallets           # Create new wallet
GET    /api/v1/wallets/{id}      # Get wallet details
PATCH  /api/v1/wallets/{id}      # Update wallet metadata
POST   /api/v1/wallets/{id}/credit   # Add funds
POST   /api/v1/wallets/{id}/debit    # Remove funds
POST   /api/v1/transfers         # Transfer between wallets
```

### Webhook Event Types
```typescript
// Cooper → Partner webhooks
{
  "wallet.funds_added": {
    walletId: string,
    amount: string,
    transactionId: string,
    externalWalletId: string
  },
  "transaction.completed": {
    transactionId: string,
    walletId: string,
    amount: string,
    status: string
  },
  "payout.processed": {
    payoutId: string,
    amount: string,
    status: string,
    gatewayReference: string
  }
}
```

---

This architecture ensures clear separation of concerns: partners focus on their business logic, Cooper handles financial infrastructure, and Stripe manages payment processing. Each party only receives the data necessary for their specific responsibilities.