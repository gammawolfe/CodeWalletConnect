// Centralized service exports for B2B PayFlow architecture

export { partnerService, PartnerService } from './partner';
export { walletService, WalletService } from './wallet';
export { ledgerService, LedgerService } from './ledger';
export { paymentGatewayService, PaymentGatewayService } from './payment-gateway';
export { transactionService, TransactionService } from './transaction';

// Service layer provides:
// 1. Partner-scoped operations (all operations validate partner ownership)
// 2. Business logic separation from data access
// 3. Cross-cutting concerns (authentication, authorization, validation)
// 4. External API integration (payment gateways, webhooks)
// 5. Double-entry accounting enforcement