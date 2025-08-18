import { partnersRepository, gatewayTransactionsRepository, transactionsRepository, walletsRepository } from "../repositories";
import { paymentGatewayService } from "./payment-gateway";
import { fundingService } from "./funding";
import crypto from 'crypto';

export class WebhookService {
  async handlePartnerWebhook(partnerId: string, event: string, data: any) {
    const partner = await partnersRepository.getById(partnerId);
    if (!partner || !partner.webhookUrl) {
      return; // No webhook configured
    }

    const payload = {
      event,
      data,
      partnerId,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(partner.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PayFlow-Signature': this.generateSignature(JSON.stringify(payload), 'webhook_secret'),
          'PayFlow-Event': event
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.error(`Webhook delivery failed for partner ${partnerId}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Webhook delivery error for partner ${partnerId}:`, error);
    }
  }

  async handleGatewayWebhook(gateway: string, payload: string, signature: string) {
    try {
      // Verify webhook with gateway
      const webhookResult = await paymentGatewayService.handleWebhook(gateway, payload, signature);
      
      // For now, handle basic webhook structure - this would be gateway-specific
      const eventData = JSON.parse(payload);
      
      if (eventData.type === 'payment_intent.succeeded') {
        const paymentIntent = eventData.data.object;
        const metadata = paymentIntent.metadata || {};
        
        // Check if this is a funding session payment
        if (metadata.session_type === 'funding') {
          try {
            // Process funding session success
            await fundingService.processFundingSuccess(paymentIntent.id);
            console.log(`Successfully processed funding for payment intent ${paymentIntent.id}`);
          } catch (error) {
            console.error(`Failed to process funding for payment intent ${paymentIntent.id}:`, error);
            throw error;
          }
        } else {
          // Handle regular transaction completion (existing logic)
          // Update transaction status
          const gatewayTx = await gatewayTransactionsRepository.create({
            gatewayTransactionId: paymentIntent.id,
            gateway,
            status: 'completed',
            amount: (paymentIntent.amount_received / 100).toString(), // Stripe sends amounts in cents
            currency: paymentIntent.currency.toUpperCase(),
            webhookData: eventData,
            transactionId: metadata.transactionId
          });

          // If transaction ID is available, update our transaction
          if (metadata.transactionId) {
            await transactionsRepository.updateStatus(
              metadata.transactionId,
              'completed',
              paymentIntent.id
            );

            // Notify partner via webhook
            const transaction = await transactionsRepository.getById(metadata.transactionId);
            if (transaction) {
              const wallet = transaction.toWalletId 
                ? await walletsRepository.getById(transaction.toWalletId)
                : await walletsRepository.getById(transaction.fromWalletId!);
              
              if (wallet) {
                await this.handlePartnerWebhook(wallet.partnerId, 'transaction.completed', {
                  transactionId: transaction.id,
                  amount: transaction.amount,
                  currency: transaction.currency,
                  walletId: wallet.id,
                  externalWalletId: wallet.externalWalletId
                });
              }
            }
          }
        }
      }

      // Handle payment intent failure for funding sessions
      if (eventData.type === 'payment_intent.payment_failed') {
        const paymentIntent = eventData.data.object;
        const metadata = paymentIntent.metadata || {};
        
        if (metadata.session_type === 'funding') {
          // Find and mark funding session as failed
          try {
            const fundingSessionsRepository = await import("../repositories/funding-sessions-repository");
            const session = await fundingSessionsRepository.fundingSessionsRepository.getByPaymentIntentId(paymentIntent.id);
            if (session) {
              await fundingService.markSessionFailed(session.id);
              console.log(`Marked funding session ${session.id} as failed due to payment failure`);
            }
          } catch (error) {
            console.error(`Failed to mark funding session as failed for payment intent ${paymentIntent.id}:`, error);
          }
        }
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook processing error:', error);
      throw error;
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  async verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

export const webhookService = new WebhookService();