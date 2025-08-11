import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

export function TransactionTable() {
  // For now, since we don't have a global transactions endpoint,
  // we'll show an empty state. In a real app, this would fetch
  // transactions across all user's wallets
  const { data: transactions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/v1/transactions"],
    enabled: false, // Disable for now since endpoint doesn't exist yet
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="transaction-status-completed">Completed</Badge>;
      case 'pending':
        return <Badge className="transaction-status-pending">Pending</Badge>;
      case 'failed':
        return <Badge className="transaction-status-failed">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'credit':
        return <Badge className="transaction-type-credit">Credit</Badge>;
      case 'debit':
        return <Badge className="transaction-type-debit">Debit</Badge>;
      case 'transfer':
        return <Badge className="transaction-type-transfer">Transfer</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions && transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction: any) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">
                    {transaction.id.slice(0, 16)}...
                  </TableCell>
                  <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                  <TableCell className="font-semibold">
                    {transaction.type === 'debit' ? '-' : '+'}$
                    {parseFloat(transaction.amount).toFixed(2)}
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  <TableCell className="text-gray-600">
                    {formatDistanceToNow(new Date(transaction.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No transactions yet
            </h3>
            <p className="text-gray-500">
              Your transactions will appear here once you start using your wallets.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
