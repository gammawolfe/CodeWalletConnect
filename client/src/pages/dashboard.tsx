import { Navigation } from "@/components/navigation";
import { WalletOverview } from "@/components/wallet-overview";
import { TransactionTable } from "@/components/transaction-table";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">PayFlow Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor infrastructure wallets and transactions from integrated applications
          </p>
        </div>

        <div className="space-y-8">
          <WalletOverview />
          <TransactionTable />
        </div>
      </div>
    </div>
  );
}
