import { stripeAdapter } from "../adapters/stripe-adapter";
import { mockAdapter } from "../adapters/mock-adapter";
import { walletsRepository, transactionsRepository, gatewayTransactionsRepository } from "../repositories";
import type { Payout } from "@shared/schema";

interface PaymentGatewayAdapter {
  createPaymentIntent(amount: string, currency: string, metadata?: any): Promise<any>;
  capturePayment(paymentIntentId: string): Promise<any>;
  refundPayment(paymentIntentId: string, amount?: string): Promise<any>;
  createPayout(destination: any, amount: string, currency: string): Promise<any>;
  verifyWebhook(payload: string, signature: string, secret: string): Promise<any>;
}

export class PaymentGatewayService {
  private adapters: Map<string, PaymentGatewayAdapter> = new Map();

  constructor() {
    this.adapters.set('stripe', stripeAdapter);
    this.adapters.set('mock', mockAdapter);
  }

  getAdapter(gateway: string): PaymentGatewayAdapter {
    const adapter = this.adapters.get(gateway);
    if (!adapter) {
      throw new Error(`Unknown payment gateway: ${gateway}`);
    }
    return adapter;
  }

  async createPayout(gateway: string, data: Payout) {
    const adapter = this.getAdapter(gateway);
    
    // Validate wallet has sufficient balance
    const balance = await walletsRepository.getBalance(data.walletId);
    if (parseFloat(balance) < parseFloat(data.amount)) {
      throw new Error('Insufficient balance for payout');
    }

    // Create payout with gateway
    const gatewayPayout = await adapter.createPayout(
      data.destination,
      data.amount,
      data.currency
    );

    // Create transaction record
    const transaction = await transactionsRepository.create({
      type: 'debit',
      amount: data.amount,
      currency: data.currency,
      description: 'Payout to external account',
      fromWalletId: data.walletId,
      idempotencyKey: data.idempotencyKey
    });

    // Create gateway transaction record
    await gatewayTransactionsRepository.create({
      gatewayTransactionId: gatewayPayout.id,
      gateway,
      status: gatewayPayout.status,
      amount: data.amount,
      currency: data.currency,
      metadata: gatewayPayout,
      transactionId: transaction.id
    });

    return {
      transactionId: transaction.id,
      gatewayPayoutId: gatewayPayout.id,
      status: gatewayPayout.status
    };
  }

  async handleWebhook(gateway: string, payload: string, signature: string) {
    const adapter = this.getAdapter(gateway);
    
    const event = await adapter.verifyWebhook(
      payload, 
      signature, 
      process.env[`${gateway.toUpperCase()}_WEBHOOK_SECRET`] || ''
    );

    // Process webhook event and update transaction status
    // This is a simplified implementation
    console.log(`Webhook received from ${gateway}:`, event.type);
    
    return { processed: true, eventType: event.type };
  }
}

export const paymentGatewayService = new PaymentGatewayService();
