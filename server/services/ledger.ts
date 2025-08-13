import { ledgerRepository, walletsRepository } from "../repositories";

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

    // Create ledger entries via repository and update balances
    const ledgerEntries = [];
    for (const entry of entries) {
      // Calculate running balance based on current balance from repository
      // Note: balance is recalculated in storage today; repository approach keeps that encapsulated.
      const ledgerEntry = await ledgerRepository.create({
        transactionId,
        ...entry
      });
      ledgerEntries.push(ledgerEntry);
    }

    return ledgerEntries;
  }
}

export const ledgerService = new LedgerService();
