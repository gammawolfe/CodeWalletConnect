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
      </div>
    </div>
  );
}
