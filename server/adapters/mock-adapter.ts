import { randomUUID } from 'crypto';

export const mockAdapter = {
  async createPaymentIntent(amount: string, currency: string, metadata?: any) {
    return {
      id: `pi_mock_${randomUUID()}`,
      amount: Math.round(parseFloat(amount) * 100),
      currency: currency.toLowerCase(),
      status: 'succeeded',
      client_secret: `pi_mock_${randomUUID()}_secret_mock`,
      metadata
    };
  },

  async capturePayment(paymentIntentId: string) {
    return {
      id: paymentIntentId,
      status: 'succeeded',
      captured: true
    };
  },

  async refundPayment(paymentIntentId: string, amount?: string) {
    return {
      id: `re_mock_${randomUUID()}`,
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(parseFloat(amount) * 100) : null,
      status: 'succeeded'
    };
  },

  async createPayout(destination: any, amount: string, currency: string) {
    return {
      id: `po_mock_${randomUUID()}`,
      amount: Math.round(parseFloat(amount) * 100),
      currency: currency.toLowerCase(),
      status: 'pending',
      destination
    };
  },

  async verifyWebhook(payload: string, signature: string, secret: string) {
    const event = JSON.parse(payload);
    return {
      id: `evt_mock_${randomUUID()}`,
      type: event.type || 'payment_intent.succeeded',
      data: event.data || {}
    };
  }
};
