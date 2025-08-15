import { db } from "../db";
import { wallets, ledgerEntries } from "@shared/schema";
import type { Wallet, InsertWallet } from "@shared/schema";
import { eq, desc, and, count, isNull, isNotNull } from "drizzle-orm";

export class WalletsRepository {
  async getById(id: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet || undefined;
  }

  async listByPartnerId(partnerId: string): Promise<Wallet[]> {
    return await db.select().from(wallets).where(eq(wallets.partnerId, partnerId));
  }

  async getByExternalId(partnerId: string, externalWalletId: string): Promise<Wallet | undefined> {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(and(eq(wallets.partnerId, partnerId), eq(wallets.externalWalletId, externalWalletId)));
    return wallet || undefined;
  }

  async create(insertWallet: InsertWallet): Promise<Wallet> {
    const [wallet] = await db.insert(wallets).values(insertWallet).returning();
    return wallet;
  }

  async getBalance(walletId: string): Promise<string> {
    const [result] = await db
      .select({ balance: ledgerEntries.balance })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.walletId, walletId))
      .orderBy(desc(ledgerEntries.createdAt))
      .limit(1);
    return result?.balance || '0.00';
  }

  async getStatsByPartnerId(partnerId: string): Promise<{
    totalWallets: number;
    userWallets: number;
    groupWallets: number;
  }> {
    const [totalResult] = await db
      .select({ count: count() })
      .from(wallets)
      .where(eq(wallets.partnerId, partnerId));

    const [userResult] = await db
      .select({ count: count() })
      .from(wallets)
      .where(and(eq(wallets.partnerId, partnerId), isNotNull(wallets.externalUserId)));

    const [groupResult] = await db
      .select({ count: count() })
      .from(wallets)
      .where(and(eq(wallets.partnerId, partnerId), isNull(wallets.externalUserId)));

    return {
      totalWallets: totalResult?.count || 0,
      userWallets: userResult?.count || 0,
      groupWallets: groupResult?.count || 0,
    };
  }
}

export const walletsRepository = new WalletsRepository();


