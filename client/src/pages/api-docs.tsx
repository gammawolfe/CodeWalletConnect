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
      description: "Create wallet",
      auth: "Bearer Token"
    },
    {
      method: "GET",
      path: "/api/v1/wallets/{id}/balance",
      description: "Get balance",
      auth: "Bearer Token"
    },
    {
      method: "POST",
      path: "/api/v1/wallets/{id}/credit",
      description: "Credit wallet",
      auth: "Bearer Token"
    },
    {
      method: "POST",
      path: "/api/v1/transfers",
      description: "Transfer funds",
      auth: "Bearer Token"
    },
    {
      method: "POST",
      path: "/api/v1/payouts",
      description: "Initiate payout",
      auth: "Bearer Token"
    },
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
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: YOUR_UUID" \\
  -d '{
    "currency": "USD"
  }'

// Response
{
  "id": "wallet_1a2b3c4d5e",
  "userId": "user_abc123", 
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
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive REST API with OpenAPI 3.0 specification
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
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Key className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-700">
                    OIDC/OAuth2 for third-party apps
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-700">
                    API keys for service-to-service
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm text-gray-700">
                    HMAC webhook verification
                  </span>
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
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json',
    'Idempotency-Key': 'YOUR_UUID'
  },
  body: JSON.stringify({
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

response = requests.post(
    'https://api.payflow.dev/v1/wallets',
    headers={
        'Authorization': f'Bearer {JWT_TOKEN}',
        'Content-Type': 'application/json',
        'Idempotency-Key': str(uuid.uuid4())
    },
    json={'currency': 'USD'}
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
