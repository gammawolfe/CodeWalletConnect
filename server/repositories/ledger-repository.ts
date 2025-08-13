import { db } from "../db";
import { ledgerEntries } from "@shared/schema";
import type { LedgerEntry } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export class LedgerRepository {
  async create(entry: {
    transactionId: string;
    walletId: string;
    type: 'debit' | 'credit';
    amount: string;
    currency: string;
    description?: string;
  }): Promise<LedgerEntry> {
    const [e] = await db
      .insert(ledgerEntries)
      .values(entry as any)
      .returning();
    return e;
  }

  async listByWallet(walletId: string, limit: number = 100, offset: number = 0): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.walletId, walletId))
      .orderBy(desc(ledgerEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async listByTransaction(transactionId: string): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.transactionId, transactionId))
      .orderBy(ledgerEntries.createdAt);
  }
}

export const ledgerRepository = new LedgerRepository();


