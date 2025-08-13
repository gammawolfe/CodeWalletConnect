import { db } from "../db";
import { gatewayTransactions } from "@shared/schema";
import type { GatewayTransaction } from "@shared/schema";

export class GatewayTransactionsRepository {
  async create(gatewayTx: {
    gatewayTransactionId: string;
    gateway: string;
    status: string;
    amount: string;
    currency: string;
    metadata?: any;
    webhookData?: any;
    transactionId?: string;
  }): Promise<GatewayTransaction> {
    const [gt] = await db.insert(gatewayTransactions).values(gatewayTx as any).returning();
    return gt;
  }
}

export const gatewayTransactionsRepository = new GatewayTransactionsRepository();


