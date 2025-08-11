import { storage } from "../storage";

export class LedgerService {
  async createDoubleEntry(
    transactionId: string, 
    entries: Array<{
      walletId: string;
      type: 'debit' | 'credit';
      amount: string;
      currency: string;
      description?: string;
    }>
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
    const debits = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const credits = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + parseFloat(e.amount), 0);

    if (Math.abs(debits - credits) > 0.01) { // Allow for minor rounding differences
      throw new Error('Double-entry validation failed: debits must equal credits');
    }

    return ledgerEntries;
  }

  async getWalletLedger(walletId: string, limit: number = 100, offset: number = 0) {
    // This would be implemented with proper database queries
    // For now, return empty array as it requires complex joins
    return [];
  }

  async auditTransaction(transactionId: string) {
    // Get all ledger entries for a transaction
    // Verify double-entry accounting rules
    // Return audit report
    return {
      transactionId,
      valid: true,
      entries: []
    };
  }
}

export const ledgerService = new LedgerService();
