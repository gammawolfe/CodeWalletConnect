import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY must be set');
  }
  const apiVersion = (process.env.STRIPE_API_VERSION as any) || '2025-07-30.basil';
  return new Stripe(key, {
    apiVersion,
  });
}

export const stripeAdapter = {
  async createPaymentIntent(amount: string, currency: string, metadata?: any) {
    const stripe = getStripe();
    return await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata
    });
  },

  async createPaymentIntentFromNumber(amount: number, currency: string, metadata?: any) {
    const stripe = getStripe();
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata
    });
  },

  async capturePayment(paymentIntentId: string) {
    const stripe = getStripe();
    return await stripe.paymentIntents.capture(paymentIntentId);
  },

  async refundPayment(paymentIntentId: string, amount?: string) {
    const stripe = getStripe();
    const refundData: any = { payment_intent: paymentIntentId };
    if (amount) {
      refundData.amount = Math.round(parseFloat(amount) * 100);
    }
    return await stripe.refunds.create(refundData);
  },

  async createPayout(destination: any, amount: string, currency: string) {
    const stripe = getStripe();
    return await stripe.transfers.create({
      amount: Math.round(parseFloat(amount) * 100),
      currency: currency.toLowerCase(),
      destination: destination.account,
    });
  },

  async verifyWebhook(payload: string, signature: string, secret: string) {
    const stripe = getStripe();
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
};
