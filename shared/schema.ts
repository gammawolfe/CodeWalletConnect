import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, uuid, jsonb, pgEnum, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed', 'cancelled']);
export const transactionTypeEnum = pgEnum('transaction_type', ['credit', 'debit', 'transfer']);
export const walletStatusEnum = pgEnum('wallet_status', ['active', 'suspended', 'closed']);
export const paymentGatewayEnum = pgEnum('payment_gateway', ['stripe', 'mock']);
export const ledgerEntryTypeEnum = pgEnum('ledger_entry_type', ['debit', 'credit']);
export const partnerStatusEnum = pgEnum('partner_status', ['pending', 'approved', 'suspended', 'rejected']);
export const apiKeyEnvironmentEnum = pgEnum('api_key_environment', ['sandbox', 'production']);
export const fundingSessionStatusEnum = pgEnum('funding_session_status', ['created', 'active', 'completed', 'failed', 'expired']);

// Admin users table (for PayFlow admin interface)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('admin'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Partners table (B2B clients like RoSaBank)
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  companyName: text("company_name").notNull(),
  email: text("email").notNull(),
  contactPerson: text("contact_person").notNull(),
  businessType: text("business_type").notNull(),
  status: partnerStatusEnum("status").notNull().default('pending'),
  webhookUrl: text("webhook_url"),
  stripeAccountId: text("stripe_account_id"), // Partner's own Stripe Connect account
  settings: jsonb("settings"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// API Keys table (for partner authentication)
export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: 'cascade' }),
  keyHash: text("key_hash").notNull(), // Hashed API key for security
  environment: apiKeyEnvironmentEnum("environment").notNull(),
  permissions: text("permissions").array().notNull().default(['wallets:read', 'wallets:write', 'transactions:read']),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Wallets table (now partner-scoped, not user-scoped)
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id, { onDelete: 'cascade' }),
  externalUserId: text("external_user_id"), // Partner's user ID in their system
  externalWalletId: text("external_wallet_id"), // Partner's wallet ID in their system
  name: text("name"), // Human-readable wallet name
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

// Funding sessions for wallet funding flow
export const fundingSessions = pgTable("payment_funding_sessions", {
  id: varchar("id").primaryKey(),
  walletId: varchar("wallet_id").notNull().references(() => wallets.id),
  paymentIntentId: text("payment_intent_id").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default('USD'),
  status: fundingSessionStatusEnum("status").notNull().default('created'),
  successUrl: text("success_url"),
  cancelUrl: text("cancel_url"),
  expiresAt: timestamp("expires_at").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const partnersRelations = relations(partners, ({ many }) => ({
  wallets: many(wallets),
  apiKeys: many(apiKeys),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  partner: one(partners, {
    fields: [apiKeys.partnerId],
    references: [partners.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  partner: one(partners, {
    fields: [wallets.partnerId],
    references: [partners.id],
  }),
  ledgerEntries: many(ledgerEntries),
  transactionsFrom: many(transactions, {
    relationName: "fromWallet",
  }),
  transactionsTo: many(transactions, {
    relationName: "toWallet",
  }),
  fundingSessions: many(fundingSessions),
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

export const fundingSessionsRelations = relations(fundingSessions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [fundingSessions.walletId],
    references: [wallets.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
});

export const insertPartnerSchema = createInsertSchema(partners).pick({
  name: true,
  companyName: true,
  email: true,
  contactPerson: true,
  businessType: true,
  webhookUrl: true,
  settings: true,
  metadata: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).pick({
  partnerId: true,
  keyHash: true,
  environment: true,
  permissions: true,
  expiresAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).pick({
  partnerId: true,
  externalUserId: true,
  externalWalletId: true,
  name: true,
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

export const createFundingSessionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  metadata: z.record(z.any()).optional(),
});

export const insertFundingSessionSchema = createInsertSchema(fundingSessions).pick({
  id: true,
  walletId: true,
  paymentIntentId: true,
  amount: true,
  currency: true,
  status: true,
  successUrl: true,
  cancelUrl: true,
  expiresAt: true,
  metadata: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
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
export type CreateFundingSession = z.infer<typeof createFundingSessionSchema>;
export type InsertFundingSession = z.infer<typeof insertFundingSessionSchema>;
export type FundingSession = typeof fundingSessions.$inferSelect;
