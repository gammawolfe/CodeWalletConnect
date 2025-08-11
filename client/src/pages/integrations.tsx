import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building,
  CreditCard,
  Users,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  Code,
  TrendingUp,
  Activity,
  Wallet
} from "lucide-react";

export default function Integrations() {
  // System status and external integrations monitoring
  const systemIntegrations = [
    {
      name: "RoSaBank",
      type: "ROSCA Platform",
      description: "Rotating savings and credit association platform for group savings",
      status: "active",
      wallets: 847,
      transactions: "12.4K",
      monthlyVolume: "$2.3M",
      integration: "PayFlow Client SDK",
      lastActivity: "2 minutes ago",
      features: ["Group Wallets", "Member Management", "Automated Contributions", "Payout Distribution"]
    },
    {
      name: "MicroLend Pro", 
      type: "Microfinance Platform",
      description: "Digital lending platform for small business loans",
      status: "active",
      wallets: 523,
      transactions: "8.7K", 
      monthlyVolume: "$1.8M",
      integration: "REST API + Webhooks",
      lastActivity: "5 minutes ago",
      features: ["Loan Disbursement", "Repayment Tracking", "Credit Scoring", "Risk Management"]
    },
    {
      name: "PaySplit",
      type: "Expense Sharing",
      description: "Group expense tracking and bill splitting application",
      status: "development",
      wallets: 34,
      transactions: "156",
      monthlyVolume: "$12K",
      integration: "Node.js SDK",
      lastActivity: "1 hour ago",
      features: ["Expense Splitting", "Group Payments", "Receipt Tracking", "Settlement"]
    }
  ];

  // Payment gateway providers that PayFlow connects to
  const paymentGateways = [
    {
      name: "Stripe",
      type: "Primary Gateway",
      description: "Primary payment processor for card payments and payouts",
      status: "active",
      features: ["Credit Cards", "ACH Transfers", "Instant Payouts", "Webhook Events"],
      uptime: "99.98%",
      lastTransaction: "< 1 minute ago",
      configuration: "Live API Keys",
      monthlyVolume: "$4.1M"
    },
    {
      name: "PayPal",
      type: "Alternative Gateway", 
      description: "PayPal and digital wallet payment processing",
      status: "configured",
      features: ["PayPal Balance", "Venmo", "Pay Later", "Express Checkout"],
      uptime: "99.94%",
      lastTransaction: "Never",
      configuration: "Sandbox Keys",
      monthlyVolume: "$0"
    },
    {
      name: "Flutterwave",
      type: "Regional Gateway",
      description: "African payment gateway for local payment methods",
      status: "planned",
      features: ["Mobile Money", "Bank Transfer", "Local Cards", "USSD"],
      uptime: "N/A",
      lastTransaction: "N/A", 
      configuration: "Not Configured",
      monthlyVolume: "N/A"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "configured":
      case "development":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "planned":
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "configured":
      case "development":
        return "bg-yellow-100 text-yellow-800";
      case "planned":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">App Integrations</h1>
          <p className="text-gray-600 mt-2">
            Manage consumer applications and payment gateway providers integrated with PayFlow infrastructure
          </p>
        </div>

        <Tabs defaultValue="consumer-apps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consumer-apps" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Consumer Applications
            </TabsTrigger>
            <TabsTrigger value="payment-gateways" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Gateways
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consumer-apps" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Consumer Applications</h2>
                <p className="text-gray-600">
                  Applications that use PayFlow as their financial infrastructure backend
                </p>
              </div>
              <Button>
                <Code className="h-4 w-4 mr-2" />
                Integration Guide
              </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Apps</p>
                      <p className="text-2xl font-bold">{consumerApps.length}</p>
                    </div>
                    <Building className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Wallets</p>
                      <p className="text-2xl font-bold">
                        {consumerApps.reduce((sum, app) => sum + app.wallets, 0).toLocaleString()}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Monthly Volume</p>
                      <p className="text-2xl font-bold">$4.1M</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              {consumerApps.map((app) => (
                <Card key={app.name} className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{app.name}</CardTitle>
                          <p className="text-sm text-gray-600">{app.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(app.status)}
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{app.description}</p>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Wallets</p>
                        <p className="text-lg font-semibold text-blue-600">{app.wallets.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Transactions</p>
                        <p className="text-lg font-semibold text-green-600">{app.transactions}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Monthly Volume</p>
                        <p className="text-lg font-semibold text-purple-600">{app.monthlyVolume}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Integration</p>
                        <p className="text-sm font-semibold text-orange-600">{app.integration}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {app.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Last Activity: {app.lastActivity}</span>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payment-gateways" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Payment Gateway Providers</h2>
                <p className="text-gray-600">
                  External payment services that PayFlow connects to for processing transactions
                </p>
              </div>
              <Button>
                <Zap className="h-4 w-4 mr-2" />
                Add Gateway
              </Button>
            </div>

            {/* Gateway Summary */}
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Gateways</p>
                      <p className="text-2xl font-bold">
                        {paymentGateways.filter(g => g.status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Volume</p>
                      <p className="text-2xl font-bold">$4.1M</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Uptime</p>
                      <p className="text-2xl font-bold">99.96%</p>
                    </div>
                    <Activity className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              {paymentGateways.map((gateway) => (
                <Card key={gateway.name} className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{gateway.name}</CardTitle>
                          <p className="text-sm text-gray-600">{gateway.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(gateway.status)}
                        <Badge className={getStatusColor(gateway.status)}>
                          {gateway.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">{gateway.description}</p>
                    
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Uptime</p>
                        <p className="text-lg font-semibold text-blue-600">{gateway.uptime}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Last Transaction</p>
                        <p className="text-sm font-semibold text-green-600">{gateway.lastTransaction}</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Monthly Volume</p>
                        <p className="text-lg font-semibold text-purple-600">{gateway.monthlyVolume}</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Configuration</p>
                        <p className="text-sm font-semibold text-orange-600">{gateway.configuration}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Supported Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {gateway.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          Test Connection
                        </Button>
                      </div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}