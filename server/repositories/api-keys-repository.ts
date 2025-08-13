import { db } from "../db";
import { apiKeys } from "@shared/schema";
import type { ApiKey, InsertApiKey } from "@shared/schema";
import { eq } from "drizzle-orm";

export class ApiKeysRepository {
  async getByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return apiKey || undefined;
  }

  async listByPartner(partnerId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.partnerId, partnerId));
  }

  async create(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const [key] = await db.insert(apiKeys).values(insertApiKey).returning();
    return key;
  }

  async touchLastUsed(id: string): Promise<void> {
    await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, id));
  }

  async deactivate(id: string): Promise<void> {
    await db.update(apiKeys).set({ isActive: false }).where(eq(apiKeys.id, id));
  }
}

export const apiKeysRepository = new ApiKeysRepository();


