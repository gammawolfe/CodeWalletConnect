import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
});

export const stripeAdapter = {
  async createPaymentIntent(amount: string, currency: string, metadata?: any) {
    return await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata
    });
  },

  async capturePayment(paymentIntentId: string) {
    return await stripe.paymentIntents.capture(paymentIntentId);
  },

  async refundPayment(paymentIntentId: string, amount?: string) {
    const refundData: any = { payment_intent: paymentIntentId };
    if (amount) {
      refundData.amount = Math.round(parseFloat(amount) * 100);
    }
    return await stripe.refunds.create(refundData);
  },

  async createPayout(destination: any, amount: string, currency: string) {
    return await stripe.transfers.create({
      amount: Math.round(parseFloat(amount) * 100),
      currency: currency.toLowerCase(),
      destination: destination.account,
    });
  },

  async verifyWebhook(payload: string, signature: string, secret: string) {
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
};
