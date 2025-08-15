import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalPartners: number;
  activePartners: number;
  pendingPartners: number;
  suspendedPartners: number;
  totalWallets: number;
  userWallets: number;
  groupWallets: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["/api/admin/system/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}