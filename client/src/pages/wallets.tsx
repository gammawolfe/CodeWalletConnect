import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Wallet, Users, Building, ChevronLeft, ChevronRight, Eye } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  companyName: string;
  status: string;
}

interface WalletData {
  id: string;
  partnerId: string;
  externalUserId: string | null;
  externalWalletId: string | null;
  name: string | null;
  currency: string;
  status: string;
  createdAt: string;
  partner?: Partner;
  balance?: string;
}

interface WalletApiResponse {
  wallets: WalletData[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalWallets: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  counts: {
    all: number;
    user: number;
    group: number;
  };
}

async function fetchPartners(): Promise<Partner[]> {
  const response = await fetch('/api/admin/partners', {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch partners');
  }
  return response.json();
}

async function fetchWallets(
  page: number,
  pageSize: number,
  search: string,
  partnerId: string,
  type: string
): Promise<WalletApiResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search,
    partnerId,
    type,
  });


  const response = await fetch(`/api/admin/wallets?${params}`, {
    credentials: 'include',
  });
  
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch wallets: ${response.status} ${errorText}`);
  }
  
  // Check if response is actually JSON
  const responseText = await response.text();
  
  if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
    throw new Error('Authentication required - received HTML instead of JSON');
  }
  
  try {
    const data = JSON.parse(responseText);
    return data;
  } catch (parseError) {
    throw new Error('Invalid JSON response from server');
  }
}

export default function Wallets() {
  const [selectedPartner, setSelectedPartner] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: fetchPartners,
  });

  const { data: walletsData, isLoading: walletsLoading, error } = useQuery({
    queryKey: ['wallets', currentPage, pageSize, searchTerm, selectedPartner, activeTab],
    queryFn: () => fetchWallets(currentPage, pageSize, searchTerm, selectedPartner, activeTab),
    placeholderData: (previousData) => previousData, // Keep showing previous data while fetching new data
  });


  const wallets = walletsData?.wallets || [];
  const pagination = walletsData?.pagination;
  const walletCounts = walletsData?.counts || { all: 0, user: 0, group: 0 };
  const totalWallets = pagination?.totalWallets || 0;
  const totalPages = pagination?.totalPages || 1;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePartnerChange = (value: string) => {
    setSelectedPartner(value);
    setCurrentPage(1); // Reset to first page when changing partner
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1); // Reset to first page when changing tab
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wallet Management</h1>
          <p className="text-gray-600 mt-2">
            View and manage all wallets across partner organizations
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by wallet name, external ID, or user ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedPartner} onValueChange={handlePartnerChange}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select partner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Partners</SelectItem>
              {partners.map((partner) => (
                <SelectItem key={partner.id} value={partner.id}>
                  {partner.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Wallet Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              All Wallets ({walletCounts.all})
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Wallets ({walletCounts.user})
            </TabsTrigger>
            <TabsTrigger value="group" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Group Wallets ({walletCounts.group})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {totalWallets.toLocaleString()} Wallets Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                {walletsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                    <p className="text-gray-600">Loading wallets...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="text-red-500 mb-4">
                      <Wallet className="h-12 w-12" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading wallets</h3>
                    <p className="text-gray-600 text-center">
                      {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </p>
                  </div>
                ) : totalWallets === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Wallet className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No wallets found</h3>
                    <p className="text-gray-600 text-center">
                      {searchTerm || selectedPartner !== "all" 
                        ? "Try adjusting your filters to see more results."
                        : "No wallets have been created yet."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table */}
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>External ID</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {wallets.map((wallet) => (
                            <TableRow key={wallet.id}>
                              <TableCell className="font-medium">
                                {wallet.name || 'Unnamed Wallet'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {wallet.externalUserId ? (
                                    <Users className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <Building className="h-4 w-4 text-purple-500" />
                                  )}
                                  {wallet.externalUserId ? 'User' : 'Group'}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(wallet.status)}>
                                  {wallet.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono">
                                ${wallet.balance} {wallet.currency}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {wallet.externalWalletId || '-'}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {wallet.externalUserId || '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(wallet.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between space-x-2 py-4">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-700">
                          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalWallets)} of {totalWallets} results
                        </p>
                        <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-700">per page</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {currentPage > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                            >
                              1
                            </Button>
                          )}
                          
                          {currentPage > 3 && <span className="text-gray-500">...</span>}
                          
                          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                            const startPage = Math.max(1, currentPage - 1);
                            const pageNumber = startPage + i;
                            
                            if (pageNumber > totalPages) return null;
                            
                            return (
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNumber)}
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                          
                          {currentPage < totalPages - 2 && <span className="text-gray-500">...</span>}
                          
                          {currentPage < totalPages && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                            >
                              {totalPages}
                            </Button>
                          )}
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}