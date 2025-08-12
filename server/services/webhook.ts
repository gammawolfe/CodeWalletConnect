import { storage } from "../storage";
import { paymentGatewayService } from "./payment-gateway";
import crypto from 'crypto';

export class WebhookService {
  async handlePartnerWebhook(partnerId: string, event: string, data: any) {
    const partner = await storage.getPartner(partnerId);
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
      
      if (eventData.type === 'payment_intent.succeeded' || eventData.type === 'charge.succeeded') {
        // Update transaction status
        const gatewayTx = await storage.createGatewayTransaction({
          gatewayTransactionId: eventData.data.object.id,
          gateway,
          status: 'completed',
          amount: (eventData.data.object.amount / 100).toString(), // Stripe sends amounts in cents
          currency: eventData.data.object.currency.toUpperCase(),
          webhookData: eventData,
          transactionId: eventData.data.object.metadata?.transactionId
        });

        // If transaction ID is available, update our transaction
        if (eventData.data.object.metadata?.transactionId) {
          await storage.updateTransactionStatus(
            eventData.data.object.metadata.transactionId,
            'completed',
            eventData.data.object.id
          );

          // Notify partner via webhook
          const transaction = await storage.getTransaction(eventData.data.object.metadata.transactionId);
          if (transaction) {
            const wallet = transaction.toWalletId 
              ? await storage.getWallet(transaction.toWalletId)
              : await storage.getWallet(transaction.fromWalletId!);
            
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