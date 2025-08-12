import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Key, Lock, Shield } from "lucide-react";

export default function ApiDocs() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/v1/wallets",
      description: "Create a wallet for your user",
      auth: "API Key",
      permissions: "wallets:write"
    },
    {
      method: "GET", 
      path: "/api/v1/wallets",
      description: "List all your wallets",
      auth: "API Key",
      permissions: "wallets:read"
    },
    {
      method: "GET",
      path: "/api/v1/wallets/{id}",
      description: "Get wallet details",
      auth: "API Key", 
      permissions: "wallets:read"
    },
    {
      method: "GET",
      path: "/api/v1/wallets/{id}/balance",
      description: "Get wallet balance",
      auth: "API Key",
      permissions: "wallets:read"
    },
    {
      method: "GET",
      path: "/api/v1/wallets/external/{externalId}",
      description: "Get wallet by your external ID",
      auth: "API Key",
      permissions: "wallets:read"
    },
    {
      method: "POST",
      path: "/api/v1/wallets/{id}/credit",
      description: "Credit funds to wallet",
      auth: "API Key",
      permissions: "transactions:write"
    },
    {
      method: "POST",
      path: "/api/v1/wallets/{id}/debit", 
      description: "Debit funds from wallet",
      auth: "API Key",
      permissions: "transactions:write"
    },
    {
      method: "POST",
      path: "/api/v1/transfers",
      description: "Transfer between wallets",
      auth: "API Key",
      permissions: "transactions:write"
    },
    {
      method: "POST",
      path: "/api/v1/payouts",
      description: "Initiate bank payout",
      auth: "API Key",
      permissions: "payouts:write"
    },
    {
      method: "GET",
      path: "/api/v1/wallets/{id}/transactions",
      description: "Get wallet transaction history", 
      auth: "API Key",
      permissions: "transactions:read"
    }
  ];

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'GET':
        return <Badge className="api-endpoint-get">GET</Badge>;
      case 'POST':
        return <Badge className="api-endpoint-post">POST</Badge>;
      case 'PUT':
        return <Badge className="api-endpoint-put">PUT</Badge>;
      case 'DELETE':
        return <Badge className="api-endpoint-delete">DELETE</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  const exampleRequest = `curl -X POST https://api.payflow.dev/v1/wallets \\
  -H "Authorization: Bearer sk_test_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: wallet_create_$(uuidgen)" \\
  -d '{
    "externalUserId": "user_123_in_your_system",
    "externalWalletId": "wallet_456_in_your_system", 
    "name": "John Doe Main Wallet",
    "currency": "USD"
  }'

// Response
{
  "id": "wallet_1a2b3c4d5e",
  "partnerId": "partner_your_company",
  "externalUserId": "user_123_in_your_system",
  "externalWalletId": "wallet_456_in_your_system",
  "name": "John Doe Main Wallet",
  "currency": "USD",
  "status": "active",
  "createdAt": "2024-01-15T10:30:00Z"
}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Partner API Documentation</h1>
          <p className="text-gray-600 mt-2">
            Integrate PayFlow's financial infrastructure into your application. All operations are scoped to your partner account.
          </p>
        </div>

        <Tabs defaultValue="getting-started" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="getting-started" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Getting Started
            </TabsTrigger>
            <TabsTrigger value="endpoints" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              API Reference
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Integration Guide
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Code Examples
            </TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Partner Onboarding Process</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Submit Partnership Application</h3>
                      <p className="text-sm text-gray-600">Contact PayFlow team with your business details, integration requirements, and use case.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Business & Security Review</h3>
                      <p className="text-sm text-gray-600">PayFlow team reviews your application, conducts security assessment, and validates business requirements.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Receive Sandbox Credentials</h3>
                      <p className="text-sm text-gray-600">Get sandbox API keys and access to testing environment for development and integration.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Integration Development</h3>
                      <p className="text-sm text-gray-600">Build and test your integration using sandbox environment and documentation.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">5</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Certification & Testing</h3>
                      <p className="text-sm text-gray-600">Complete integration testing with PayFlow team and pass security certification.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">6</div>
                    <div>
                      <h3 className="font-medium text-gray-900">Production Access</h3>
                      <p className="text-sm text-gray-600">Receive production API keys and go live with real transactions.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Required Information for Application</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Company name and business registration details</li>
                    <li>• Integration use case and expected transaction volume</li>
                    <li>• Technical contact information and development team details</li>
                    <li>• Compliance and security certification documents</li>
                    <li>• Webhook endpoint URL for receiving notifications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication & Environment Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Sandbox Environment</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• API Key Format: <code className="bg-gray-100 px-1 rounded">sk_test_*</code></li>
                      <li>• Base URL: <code className="bg-gray-100 px-1 rounded">https://sandbox-api.payflow.dev</code></li>
                      <li>• Test payment gateway (no real money)</li>
                      <li>• Full feature access for development</li>
                    </ul>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Production Environment</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• API Key Format: <code className="bg-gray-100 px-1 rounded">sk_live_*</code></li>
                      <li>• Base URL: <code className="bg-gray-100 px-1 rounded">https://api.payflow.dev</code></li>
                      <li>• Real payment processing via Stripe</li>
                      <li>• Rate limits and monitoring enforced</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Security Best Practices</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Store API keys securely in environment variables</li>
                    <li>• Never expose API keys in client-side code or logs</li>
                    <li>• Implement proper webhook signature verification</li>
                    <li>• Use HTTPS for all API communications</li>
                    <li>• Implement idempotency keys for critical operations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Reference Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-8">
          {/* API Endpoints List */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Core Endpoints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-3">
                      {getMethodBadge(endpoint.method)}
                      <span className="font-mono text-sm">{endpoint.path}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {endpoint.description}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-primary" />
                    <span className="text-sm text-gray-700">
                      <strong>API Keys:</strong> Use Bearer tokens for partner authentication
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="text-sm text-gray-700">
                      <strong>Environments:</strong> Separate sandbox (sk_test_) and production (sk_live_) keys
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm text-gray-700">
                      <strong>Permissions:</strong> Granular permissions (wallets:read, transactions:write, etc.)
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Partner Scoped:</strong> All operations are automatically scoped to your partner account. 
                    You can only access wallets and transactions belonging to your organization.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Code Example */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Example Request</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(exampleRequest)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="curl">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
                        <code>{exampleRequest}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="javascript">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
                        <code>{`const response = await fetch('https://api.payflow.dev/v1/wallets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_your_api_key_here',
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({
    externalUserId: 'user_123_in_your_system',
    externalWalletId: 'wallet_456_in_your_system',
    name: 'John Doe Main Wallet',
    currency: 'USD'
  })
});

const wallet = await response.json();
console.log(wallet);`}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="python">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
                        <code>{`import requests
import uuid

response = requests.post(
    'https://api.payflow.dev/v1/wallets',
    headers={
        'Authorization': 'Bearer sk_test_your_api_key_here',
        'Content-Type': 'application/json',
        'Idempotency-Key': str(uuid.uuid4())
    },
    json={
        'externalUserId': 'user_123_in_your_system',
        'externalWalletId': 'wallet_456_in_your_system',
        'name': 'John Doe Main Wallet',
        'currency': 'USD'
    }
)

wallet = response.json()
print(wallet)`}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Idempotency supported</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Rate limiting: 1000 req/min</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Webhook notifications</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>OpenAPI Specification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Download the complete OpenAPI 3.0 specification for integration with your tools.
                </p>
                <div className="flex space-x-3">
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download OpenAPI Spec
                  </Button>
                  <Button variant="outline">
                    View Swagger UI
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Integration Guide Tab */}
      <TabsContent value="integration" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Integration Patterns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Common Integration Scenarios</h3>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">🏦 ROSCA Platform (like RoSaBank)</h4>
                  <p className="text-sm text-gray-600 mb-3">Enable rotating savings and credit associations with automatic payouts.</p>
                  <div className="text-sm text-gray-700">
                    <strong>Workflow:</strong> Create group wallet → Members contribute → Automatic distribution → Bank payouts
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">💳 Lending Platform</h4>
                  <p className="text-sm text-gray-600 mb-3">Manage loan disbursements and repayment collections.</p>
                  <div className="text-sm text-gray-700">
                    <strong>Workflow:</strong> Create borrower wallet → Disburse loan → Track repayments → Handle collections
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">🛒 E-commerce Marketplace</h4>
                  <p className="text-sm text-gray-600 mb-3">Handle escrow payments and seller payouts.</p>
                  <div className="text-sm text-gray-700">
                    <strong>Workflow:</strong> Hold buyer payment → Release on delivery → Transfer to seller → Platform fees
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Webhook Integration</h3>
              <div className="p-4 bg-gray-50 border rounded-lg">
                <p className="text-sm text-gray-600 mb-3">PayFlow sends real-time webhooks for important events:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• <code>transaction.completed</code> - Payment processing finished</li>
                  <li>• <code>wallet.credited</code> - Funds added to wallet</li>
                  <li>• <code>wallet.debited</code> - Funds removed from wallet</li>
                  <li>• <code>transfer.completed</code> - Wallet-to-wallet transfer finished</li>
                  <li>• <code>payout.completed</code> - Bank payout processed</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Error Handling</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">HTTP Status Codes</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <code>200</code> - Success</li>
                    <li>• <code>400</code> - Bad Request</li>
                    <li>• <code>401</code> - Unauthorized</li>
                    <li>• <code>403</code> - Forbidden</li>
                    <li>• <code>429</code> - Rate Limited</li>
                    <li>• <code>500</code> - Server Error</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Retry Strategy</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Use exponential backoff</li>
                    <li>• Maximum 3 retry attempts</li>
                    <li>• Include idempotency keys</li>
                    <li>• Handle webhook duplicates</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Code Examples Tab */}
      <TabsContent value="examples" className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Move existing code example section here */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Example Request</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(exampleRequest)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="curl" className="w-full">
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="curl">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
                        <code>{exampleRequest}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="javascript">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
                        <code>{`const response = await fetch('https://api.payflow.dev/v1/wallets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_test_your_api_key_here',
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({
    externalUserId: 'user_123_in_your_system',
    externalWalletId: 'wallet_456_in_your_system',
    name: 'John Doe Main Wallet',
    currency: 'USD'
  })
});

const wallet = await response.json();
console.log(wallet);`}</code>
                      </pre>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="python">
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-300">
                        <code>{`import requests
import uuid

response = requests.post(
    'https://api.payflow.dev/v1/wallets',
    headers={
        'Authorization': 'Bearer sk_test_your_api_key_here',
        'Content-Type': 'application/json',
        'Idempotency-Key': str(uuid.uuid4())
    },
    json={
        'externalUserId': 'user_123_in_your_system',
        'externalWalletId': 'wallet_456_in_your_system',
        'name': 'John Doe Main Wallet',
        'currency': 'USD'
    }
)

wallet = response.json()
print(wallet)`}</code>
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Idempotency supported</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Rate limiting: 1000 req/min</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-gray-600">Webhook notifications</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>OpenAPI Specification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Download the complete OpenAPI 3.0 specification for integration with your tools.
                </p>
                <div className="flex space-x-3">
                  <Button>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Download OpenAPI Spec
                  </Button>
                  <Button variant="outline">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Postman Collection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Examples */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ROSCA Implementation Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-300">
                    <code>{`// 1. Create group wallet for ROSCA
const groupWallet = await fetch('/api/v1/wallets', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + apiKey },
  body: JSON.stringify({
    externalUserId: 'rosca_group_001',
    name: 'Monthly Savings Circle - Jan 2024',
    currency: 'USD'
  })
});

// 2. Member contributes to group
const contribution = await fetch('/api/v1/wallets/' + groupWallet.id + '/credit', {
  method: 'POST', 
  headers: { 'Authorization': 'Bearer ' + apiKey },
  body: JSON.stringify({
    amount: 100.00,
    description: 'Monthly contribution - Member Alice',
    idempotencyKey: 'contrib_alice_jan_2024'
  })
});

// 3. Distribute to winner
const payout = await fetch('/api/v1/payouts', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + apiKey },
  body: JSON.stringify({
    walletId: groupWallet.id,
    amount: 1000.00,
    bankAccount: {
      accountNumber: 'xxx1234',
      routingNumber: 'xxx5678'
    },
    description: 'ROSCA payout - Cycle 1 winner'
  })
});`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Handling Example</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-300">
                    <code>{`// Express.js webhook endpoint
app.post('/payflow/webhook', (req, res) => {
  const { event, data } = req.body;
  
  // Verify webhook signature (recommended)
  const signature = req.headers['payflow-signature'];
  if (!verifyWebhookSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  switch (event) {
    case 'transaction.completed':
      // Update your database with transaction status
      await updateTransactionStatus(data.transactionId, 'completed');
      // Notify user
      await notifyUser(data.userId, 'Payment completed');
      break;
      
    case 'wallet.credited':
      // Update user balance in your system
      await updateUserBalance(data.externalUserId, data.amount);
      break;
      
    case 'payout.completed':
      // Mark payout as completed
      await markPayoutCompleted(data.payoutId);
      break;
  }
  
  res.json({ received: true });
});`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
      </div>
    </div>
  );
}
