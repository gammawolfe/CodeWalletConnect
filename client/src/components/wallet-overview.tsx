import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function WalletOverview() {
  const { data: wallets, isLoading } = useQuery<any[]>({
    queryKey: ["/api/v1/wallets"],
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/v1/metrics"],
    enabled: false, // Disable for now since endpoint doesn't exist yet
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-12 w-32 mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="metric-card-gradient-primary text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-100 text-sm">Total Volume</p>
                <p className="text-2xl font-bold">$0</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-200" />
            </div>
            <p className="text-xs text-blue-200 mt-2">+0% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="metric-card-gradient-secondary text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-green-100 text-sm">Transactions</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Activity className="h-5 w-5 text-green-200" />
            </div>
            <p className="text-xs text-green-200 mt-2">+0% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="metric-card-gradient-purple text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-purple-100 text-sm">Active Wallets</p>
                <p className="text-2xl font-bold">{wallets?.length || 0}</p>
              </div>
              <Wallet className="h-5 w-5 text-purple-200" />
            </div>
            <p className="text-xs text-purple-200 mt-2">+0% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="metric-card-gradient-accent text-white">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-orange-100 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">100%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-orange-200" />
            </div>
            <p className="text-xs text-orange-200 mt-2">+0% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Wallets List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Your Wallets</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {wallets && wallets.length > 0 ? (
            <div className="space-y-4">
              {wallets.map((wallet: any) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{wallet.id}</h3>
                      <p className="text-sm text-gray-500">
                        Created {new Date(wallet.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">$0.00</p>
                    <Badge variant="secondary" className="text-xs">
                      {wallet.currency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No wallets yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first wallet to get started with transactions.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Wallet
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
