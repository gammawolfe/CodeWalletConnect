import { db } from "../db";
import { partners } from "@shared/schema";
import type { Partner, InsertPartner } from "@shared/schema";
import { eq } from "drizzle-orm";

export class PartnersRepository {
  async getById(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner || undefined;
  }

  async getByName(name: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.name, name));
    return partner || undefined;
  }

  async list(): Promise<Partner[]> {
    return await db.select().from(partners);
  }

  async create(insertPartner: InsertPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values(insertPartner).returning();
    return partner;
  }

  async updateStatus(id: string, status: string): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }

  async updateStripeAccount(id: string, stripeAccountId: string): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({ stripeAccountId, updatedAt: new Date() })
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }

  async updateSettings(id: string, settings: Record<string, any>): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({ settings: settings as any, updatedAt: new Date() })
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }
}

export const partnersRepository = new PartnersRepository();


