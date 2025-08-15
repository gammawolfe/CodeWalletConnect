import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { Wallet, Users, Building } from "lucide-react";

export function DashboardMetrics() {
  console.log('DashboardMetrics component rendering');
  const { data: stats, isLoading, error } = useDashboardStats();
  console.log('Dashboard stats:', { stats, isLoading, error });
  console.log('Raw stats object:', JSON.stringify(stats, null, 2));

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">Failed to load dashboard metrics</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
        <p>No stats data available - component rendered but no data returned</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Wallets</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.totalWallets || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Across all partners
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">User Wallets</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.userWallets || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Individual customer wallets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Group Wallets</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.groupWallets || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Shared business wallets
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Partners</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activePartners || 0}</div>
          <p className="text-xs text-muted-foreground">
            Of {stats.totalPartners || 0} total partners
          </p>
        </CardContent>
      </Card>
    </div>
  );
}