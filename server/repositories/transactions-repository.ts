import { db } from "../db";
import { transactions } from "@shared/schema";
import type { Transaction, InsertTransaction } from "@shared/schema";
import { eq, desc, or } from "drizzle-orm";

export class TransactionsRepository {
  async create(data: InsertTransaction): Promise<Transaction> {
    const [tx] = await db.insert(transactions).values(data).returning();
    return tx;
  }

  async getById(id: string): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
    return tx || undefined;
  }

  async listByWallet(walletId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(or(eq(transactions.fromWalletId, walletId), eq(transactions.toWalletId, walletId)))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateStatus(id: string, status: string, gatewayTransactionId?: string): Promise<Transaction> {
    const [tx] = await db
      .update(transactions)
      .set({ status: status as any, gatewayTransactionId, updatedAt: new Date() })
      .where(eq(transactions.id, id))
      .returning();
    return tx;
  }

  async getByIdempotencyKey(key: string): Promise<Transaction | undefined> {
    const [tx] = await db.select().from(transactions).where(eq(transactions.idempotencyKey, key));
    return tx || undefined;
  }
}

export const transactionsRepository = new TransactionsRepository();


