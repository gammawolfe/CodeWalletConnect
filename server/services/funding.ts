import { fundingSessionsRepository, walletsRepository } from "../repositories";
import { stripeAdapter } from "../adapters/stripe-adapter";
import { walletService } from "./wallet";
import type { CreateFundingSession, FundingSession } from "@shared/schema";
import crypto from 'crypto';

export class FundingService {
  private generateSessionId(): string {
    return `session_${crypto.randomBytes(16).toString('hex')}`;
  }

  async createFundingSession(
    partnerId: string, 
    walletId: string, 
    data: CreateFundingSession
  ): Promise<FundingSession> {
    // Verify wallet belongs to partner
    const wallet = await walletsRepository.getById(walletId);
    if (!wallet || wallet.partnerId !== partnerId) {
      throw new Error('Wallet not found or access denied');
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripeAdapter.createPaymentIntentFromNumber(
      data.amount,
      data.currency || 'USD',
      {
        wallet_id: walletId,
        partner_id: partnerId,
        session_type: 'funding',
        ...data.metadata
      }
    );

    // Generate session ID and expiration time
    const sessionId = this.generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Store funding session in database
    const session = await fundingSessionsRepository.create({
      id: sessionId,
      walletId,
      paymentIntentId: paymentIntent.id,
      amount: data.amount.toString(),
      currency: data.currency || 'USD',
      status: 'created',
      successUrl: data.successUrl || null,
      cancelUrl: data.cancelUrl || null,
      expiresAt,
      metadata: data.metadata || {}
    });

    return session;
  }

  async getFundingSession(sessionId: string): Promise<FundingSession | null> {
    return await fundingSessionsRepository.getById(sessionId);
  }

  async processFundingSuccess(paymentIntentId: string): Promise<void> {
    // Find the funding session by payment intent ID
    const session = await fundingSessionsRepository.getByPaymentIntentId(paymentIntentId);
    if (!session) {
      console.warn(`No funding session found for payment intent ${paymentIntentId}`);
      return;
    }

    // Get wallet to determine partner
    const wallet = await walletsRepository.getById(session.walletId);
    if (!wallet) {
      console.error(`Wallet ${session.walletId} not found for funding session ${session.id}`);
      return;
    }

    try {
      // Credit the wallet
      await walletService.creditWallet(wallet.partnerId, {
        walletId: session.walletId,
        amount: session.amount,
        currency: session.currency,
        description: 'Wallet funding via payment gateway',
        idempotencyKey: paymentIntentId // Use payment intent ID as idempotency key
      });

      // Update session status to completed
      await fundingSessionsRepository.updateStatus(session.id, 'completed');

      console.log(`Successfully processed funding for wallet ${session.walletId}, amount: ${session.amount} ${session.currency}`);
    } catch (error) {
      console.error(`Failed to process funding for session ${session.id}:`, error);
      
      // Update session status to failed
      await fundingSessionsRepository.updateStatus(session.id, 'failed');
      throw error;
    }
  }

  async markSessionFailed(sessionId: string): Promise<void> {
    await fundingSessionsRepository.updateStatus(sessionId, 'failed');
  }

  // Helper method to get payment URL for frontend
  getPaymentUrl(sessionId: string): string {
    const baseUrl = process.env.PAYFLOW_FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/pay/${sessionId}`;
  }
}

export const fundingService = new FundingService();