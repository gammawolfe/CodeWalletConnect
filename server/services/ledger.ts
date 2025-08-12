import { storage } from "../storage";
import type { LedgerEntry } from "@shared/schema";

interface LedgerEntryInput {
  walletId: string;
  type: 'debit' | 'credit';
  amount: string;
  currency: string;
  description?: string;
}

export class LedgerService {
  async createDoubleEntry(
    transactionId: string, 
    entries: LedgerEntryInput[]
  ) {
    const ledgerEntries = [];

    for (const entry of entries) {
      const ledgerEntry = await storage.createLedgerEntry({
        transactionId,
        ...entry
      });
      ledgerEntries.push(ledgerEntry);
    }

    // Validate double-entry (debits should equal credits)
    const debits = entries
      .filter((e: LedgerEntryInput) => e.type === 'debit')
      .reduce((sum: number, e: LedgerEntryInput) => sum + parseFloat(e.amount), 0);
    const credits = entries
      .filter((e: LedgerEntryInput) => e.type === 'credit')
      .reduce((sum: number, e: LedgerEntryInput) => sum + parseFloat(e.amount), 0);

    if (Math.abs(debits - credits) > 0.01) { // Allow for minor rounding differences
      throw new Error('Double-entry validation failed: debits must equal credits');
    }

    return ledgerEntries;
  }

  async getWalletLedger(walletId: string, limit: number = 100, offset: number = 0) {
    return await storage.getLedgerEntriesByWallet(walletId, limit, offset);
  }

  async auditTransaction(transactionId: string) {
    const entries = await storage.getLedgerEntriesByTransaction(transactionId);
    
    // Calculate totals
    const debits = entries
      .filter((e: LedgerEntry) => e.type === 'debit')
      .reduce((sum: number, e: LedgerEntry) => sum + parseFloat(e.amount), 0);
    const credits = entries
      .filter((e: LedgerEntry) => e.type === 'credit')
      .reduce((sum: number, e: LedgerEntry) => sum + parseFloat(e.amount), 0);
    
    const isValid = Math.abs(debits - credits) < 0.01; // Allow for minor rounding
    
    return {
      transactionId,
      valid: isValid,
      entries,
      totals: {
        debits: debits.toFixed(2),
        credits: credits.toFixed(2),
        difference: (debits - credits).toFixed(2)
      }
    };
  }

  async getAccountStatement(walletId: string, startDate?: Date, endDate?: Date) {
    const entries = await storage.getLedgerEntriesByWallet(walletId, 1000, 0);
    
    // Filter by date range if provided
    const filteredEntries = entries.filter((entry: LedgerEntry) => {
      if (startDate && entry.createdAt < startDate) return false;
      if (endDate && entry.createdAt > endDate) return false;
      return true;
    });

    // Calculate running balance
    let runningBalance = 0;
    const statement = filteredEntries.map((entry: LedgerEntry) => {
      const amount = parseFloat(entry.amount);
      runningBalance += entry.type === 'credit' ? amount : -amount;
      
      return {
        ...entry,
        runningBalance: runningBalance.toFixed(2)
      };
    });

    return {
      walletId,
      entries: statement,
      finalBalance: runningBalance.toFixed(2),
      period: {
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString()
      }
    };
  }
}

export const ledgerService = new LedgerService();
