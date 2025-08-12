import { users, partners, apiKeys, wallets, transactions, ledgerEntries, gatewayTransactions } from "@shared/schema";
import type { 
  User, InsertUser, 
  Partner, InsertPartner,
  ApiKey, InsertApiKey,
  Wallet, InsertWallet, 
  Transaction, InsertTransaction, 
  LedgerEntry, GatewayTransaction 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Admin user operations (for PayFlow admin interface)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Partner operations (B2B clients)
  getPartner(id: string): Promise<Partner | undefined>;
  getPartnerByName(name: string): Promise<Partner | undefined>;
  getPartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartnerStatus(id: string, status: string): Promise<Partner>;
  updatePartnerStripeAccount(id: string, stripeAccountId: string): Promise<Partner>;

  // API Key operations (for partner authentication)
  getApiKey(keyHash: string): Promise<ApiKey | undefined>;
  getApiKeysByPartnerId(partnerId: string): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey): Promise<ApiKey>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  deactivateApiKey(id: string): Promise<void>;

  // Wallet operations (partner-scoped)
  getWallet(id: string): Promise<Wallet | undefined>;
  getWalletsByPartnerId(partnerId: string): Promise<Wallet[]>;
  getWalletByExternalId(partnerId: string, externalWalletId: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  getWalletBalance(walletId: string): Promise<string>;
  
  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByWallet(walletId: string, limit?: number, offset?: number): Promise<Transaction[]>;
  updateTransactionStatus(id: string, status: string, gatewayTransactionId?: string): Promise<Transaction>;
  getTransactionByIdempotencyKey(key: string): Promise<Transaction | undefined>;
  
  // Ledger operations
  createLedgerEntry(entry: {
    transactionId: string;
    walletId: string;
    type: 'debit' | 'credit';
    amount: string;
    currency: string;
    description?: string;
  }): Promise<LedgerEntry>;
  getLedgerEntriesByWallet(walletId: string, limit?: number, offset?: number): Promise<LedgerEntry[]>;
  getLedgerEntriesByTransaction(transactionId: string): Promise<LedgerEntry[]>;
  
  // Gateway operations
  createGatewayTransaction(gatewayTx: {
    gatewayTransactionId: string;
    gateway: string;
    status: string;
    amount: string;
    currency: string;
    metadata?: any;
    webhookData?: any;
    transactionId?: string;
  }): Promise<GatewayTransaction>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Partner operations
  async getPartner(id: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.id, id));
    return partner || undefined;
  }

  async getPartnerByName(name: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.name, name));
    return partner || undefined;
  }

  async getPartners(): Promise<Partner[]> {
    return await db.select().from(partners);
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [newPartner] = await db
      .insert(partners)
      .values(partner)
      .returning();
    return newPartner;
  }

  async updatePartnerStatus(id: string, status: string): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }

  async updatePartnerStripeAccount(id: string, stripeAccountId: string): Promise<Partner> {
    const [partner] = await db
      .update(partners)
      .set({ stripeAccountId, updatedAt: new Date() })
      .where(eq(partners.id, id))
      .returning();
    return partner;
  }

  // API Key operations
  async getApiKey(keyHash: string): Promise<ApiKey | undefined> {
    const [apiKey] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return apiKey || undefined;
  }

  async getApiKeysByPartnerId(partnerId: string): Promise<ApiKey[]> {
    return await db.select().from(apiKeys).where(eq(apiKeys.partnerId, partnerId));
  }

  async createApiKey(apiKey: InsertApiKey): Promise<ApiKey> {
    const [newApiKey] = await db
      .insert(apiKeys)
      .values(apiKey)
      .returning();
    return newApiKey;
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async deactivateApiKey(id: string): Promise<void> {
    await db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));
  }

  async getWallet(id: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet || undefined;
  }

  async getWalletsByPartnerId(partnerId: string): Promise<Wallet[]> {
    return await db.select().from(wallets).where(eq(wallets.partnerId, partnerId));
  }

  async getWalletByExternalId(partnerId: string, externalWalletId: string): Promise<Wallet | undefined> {
    const [wallet] = await db
      .select()
      .from(wallets)
      .where(
        and(
          eq(wallets.partnerId, partnerId),
          eq(wallets.externalWalletId, externalWalletId)
        )
      );
    return wallet || undefined;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db
      .insert(wallets)
      .values(wallet)
      .returning();
    return newWallet;
  }

  async getWalletBalance(walletId: string): Promise<string> {
    const [result] = await db
      .select({ balance: ledgerEntries.balance })
      .from(ledgerEntries)
      .where(eq(ledgerEntries.walletId, walletId))
      .orderBy(desc(ledgerEntries.createdAt))
      .limit(1);
    
    return result?.balance || '0.00';
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async getTransactionsByWallet(walletId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        or(
          eq(transactions.fromWalletId, walletId),
          eq(transactions.toWalletId, walletId)
        )
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async updateTransactionStatus(id: string, status: string, gatewayTransactionId?: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ 
        status: status as any,
        gatewayTransactionId,
        updatedAt: new Date()
      })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async getTransactionByIdempotencyKey(key: string): Promise<Transaction | undefined> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.idempotencyKey, key));
    return transaction || undefined;
  }

  async createLedgerEntry(entry: {
    transactionId: string;
    walletId: string;
    type: 'debit' | 'credit';
    amount: string;
    currency: string;
    description?: string;
  }): Promise<LedgerEntry> {
    // Calculate new balance
    const currentBalance = await this.getWalletBalance(entry.walletId);
    const currentBalanceNum = parseFloat(currentBalance);
    const amountNum = parseFloat(entry.amount);
    
    const newBalance = entry.type === 'credit' 
      ? currentBalanceNum + amountNum
      : currentBalanceNum - amountNum;

    const [ledgerEntry] = await db
      .insert(ledgerEntries)
      .values({
        ...entry,
        balance: newBalance.toFixed(2)
      })
      .returning();
    
    return ledgerEntry;
  }

  async getLedgerEntriesByWallet(walletId: string, limit: number = 100, offset: number = 0): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.walletId, walletId))
      .orderBy(desc(ledgerEntries.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getLedgerEntriesByTransaction(transactionId: string): Promise<LedgerEntry[]> {
    return await db
      .select()
      .from(ledgerEntries)
      .where(eq(ledgerEntries.transactionId, transactionId))
      .orderBy(ledgerEntries.createdAt);
  }

  async createGatewayTransaction(gatewayTx: {
    gatewayTransactionId: string;
    gateway: string;
    status: string;
    amount: string;
    currency: string;
    metadata?: any;
    webhookData?: any;
    transactionId?: string;
  }): Promise<GatewayTransaction> {
    const [newGatewayTx] = await db
      .insert(gatewayTransactions)
      .values(gatewayTx as any)
      .returning();
    return newGatewayTx;
  }
}

export const storage = new DatabaseStorage();
