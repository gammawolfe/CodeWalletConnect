import { eq, and, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { fundingSessions, type InsertFundingSession, type FundingSession } from "@shared/schema";

export class FundingSessionsRepository {
  async create(data: InsertFundingSession): Promise<FundingSession> {
    const [session] = await db.insert(fundingSessions).values(data).returning();
    return session;
  }

  async getById(sessionId: string): Promise<FundingSession | null> {
    const [session] = await db
      .select()
      .from(fundingSessions)
      .where(eq(fundingSessions.id, sessionId))
      .limit(1);
    
    return session || null;
  }

  async getByPaymentIntentId(paymentIntentId: string): Promise<FundingSession | null> {
    const [session] = await db
      .select()
      .from(fundingSessions)
      .where(eq(fundingSessions.paymentIntentId, paymentIntentId))
      .limit(1);
    
    return session || null;
  }

  async updateStatus(sessionId: string, status: FundingSession['status']): Promise<FundingSession | null> {
    const [session] = await db
      .update(fundingSessions)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(fundingSessions.id, sessionId))
      .returning();
    
    return session || null;
  }

  async updateStatusByPaymentIntentId(paymentIntentId: string, status: FundingSession['status']): Promise<FundingSession | null> {
    const [session] = await db
      .update(fundingSessions)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(fundingSessions.paymentIntentId, paymentIntentId))
      .returning();
    
    return session || null;
  }

  async listByWalletId(walletId: string): Promise<FundingSession[]> {
    return await db
      .select()
      .from(fundingSessions)
      .where(eq(fundingSessions.walletId, walletId))
      .orderBy(fundingSessions.createdAt);
  }

  // Helper to clean up expired sessions (could be run via cron job)
  async markExpiredSessions(): Promise<number> {
    const result = await db
      .update(fundingSessions)
      .set({ 
        status: 'expired' as const,
        updatedAt: new Date() 
      })
      .where(and(
        eq(fundingSessions.status, 'created'),
        // sessions where expires_at is less than current time
        lt(fundingSessions.expiresAt, sql`NOW()`)
      ))
      .returning();
    
    return result.length;
  }
}

export const fundingSessionsRepository = new FundingSessionsRepository();