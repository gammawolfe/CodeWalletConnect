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
    // Get the current balance for this wallet
    const [currentEntry] = await db
      .select({ balance: ledgerEntries.balance })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.walletId, entry.walletId))
      .orderBy(desc(ledgerEntries.createdAt))
      .limit(1);

    // Calculate new balance using precise decimal arithmetic
    const currentBalance = parseFloat(currentEntry?.balance || '0.00');
    const entryAmount = parseFloat(entry.amount);
    const newBalance = entry.type === 'credit' 
      ? currentBalance + entryAmount
      : currentBalance - entryAmount;

    // Create the ledger entry with calculated balance
    const [e] = await db
      .insert(ledgerEntries)
      .values({
        ...entry,
        balance: newBalance.toFixed(2)
      })
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


