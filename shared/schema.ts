import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'cancelled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['credit', 'debit', 'transfer']);
export const walletStatusEnum = pgEnum('wallet_status', ['active', 'suspended', 'closed']);
export const paymentGatewayEnum = pgEnum('payment_gateway', ['stripe', 'mock']);
export const ledgerEntryTypeEnum = pgEnum('ledger_entry_type', ['debit', 'credit']);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallets table
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  currency: text("currency").notNull().default('USD'),
  status: walletStatusEnum("status").notNull().default('active'),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  idempotencyKey: text("idempotency_key").unique(),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default('pending'),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('USD'),
  description: text("description"),
  metadata: jsonb("metadata"),
  fromWalletId: varchar("from_wallet_id").references(() => wallets.id),
  toWalletId: varchar("to_wallet_id").references(() => wallets.id),
  gatewayTransactionId: text("gateway_transaction_id"),
  gateway: paymentGatewayEnum("gateway"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Double-entry ledger table
export const ledgerEntries = pgTable("ledger_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  type: ledgerEntryTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('USD'),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Gateway transactions for reconciliation
export const gatewayTransactions = pgTable("gateway_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  gatewayTransactionId: text("gateway_transaction_id").notNull(),
  gateway: paymentGatewayEnum("gateway").notNull(),
  status: text("status").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('USD'),
  metadata: jsonb("metadata"),
  webhookData: jsonb("webhook_data"),
  transactionId: varchar("transaction_id").references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  wallets: many(wallets),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  ledgerEntries: many(ledgerEntries),
  transactionsFrom: many(transactions, {
    relationName: "fromWallet",
  }),
  transactionsTo: many(transactions, {
    relationName: "toWallet",
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  fromWallet: one(wallets, {
    fields: [transactions.fromWalletId],
    references: [wallets.id],
    relationName: "fromWallet",
  }),
  toWallet: one(wallets, {
    fields: [transactions.toWalletId],
    references: [wallets.id],
    relationName: "toWallet",
  }),
  ledgerEntries: many(ledgerEntries),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  transaction: one(transactions, {
    fields: [ledgerEntries.transactionId],
    references: [transactions.id],
  }),
  wallet: one(wallets, {
    fields: [ledgerEntries.walletId],
    references: [wallets.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  userId: true,
  currency: true,
  metadata: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  type: true,
  amount: true,
  currency: true,
  description: true,
  metadata: true,
  fromWalletId: true,
  toWalletId: true,
  idempotencyKey: true,
});

export const creditWalletSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  idempotencyKey: z.string().uuid(),
});

export const debitWalletSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  idempotencyKey: z.string().uuid(),
});

export const transferSchema = z.object({
  fromWalletId: z.string().uuid(),
  toWalletId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  idempotencyKey: z.string().uuid(),
});

export const payoutSchema = z.object({
  walletId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().default('USD'),
  destination: z.object({
    type: z.enum(['bank_account', 'card']),
    account: z.string(),
  }),
  idempotencyKey: z.string().uuid(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type GatewayTransaction = typeof gatewayTransactions.$inferSelect;
export type CreditWallet = z.infer<typeof creditWalletSchema>;
export type DebitWallet = z.infer<typeof debitWalletSchema>;
export type Transfer = z.infer<typeof transferSchema>;
export type Payout = z.infer<typeof payoutSchema>;
