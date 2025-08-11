import { users, wallets, transactions, ledgerEntries, gatewayTransactions } from "@shared/schema";
import type { User, InsertUser, Wallet, InsertWallet, Transaction, InsertTransaction, LedgerEntry, GatewayTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;

  // Wallet operations
  getWallet(id: string): Promise<Wallet | undefined>;
  getWalletsByUserId(userId: string): Promise<Wallet[]>;
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

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getWallet(id: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet || undefined;
  }

  async getWalletsByUserId(userId: string): Promise<Wallet[]> {
    return await db.select().from(wallets).where(eq(wallets.userId, userId));
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
        and(
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
