import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, CheckCircle, Settings, CreditCard, Webhook, Key, Globe, Copy, Eye, EyeOff } from "lucide-react";
import { SiStripe, SiPaypal } from "react-icons/si";
import { Navigation } from "@/components/navigation";
import { useToast } from "@/hooks/use-toast";

export default function Integrations() {
  const [apiKeysVisible, setApiKeysVisible] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const { toast } = useToast();

  const paymentGateways = [
    {
      id: 'stripe',
      name: 'Stripe',
      icon: SiStripe,
      status: 'connected',
      description: 'Accept payments worldwide with Stripe\'s robust payment processing platform.',
      features: ['Credit Cards', 'Bank Transfers', 'Digital Wallets', 'Subscriptions'],
      testMode: true,
      lastSync: '2 minutes ago'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: SiPaypal,
      status: 'available',
      description: 'Enable PayPal payments for your customers worldwide.',
      features: ['PayPal Balance', 'Credit Cards', 'Bank Transfers', 'Pay Later'],
      testMode: false,
      lastSync: null
    }
  ];

  const webhookEndpoints = [
    {
      id: 'payment_completed',
      url: 'https://api.payflow.dev/webhooks/stripe/payment-completed',
      events: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
      status: 'active',
      lastDelivery: '5 minutes ago'
    },
    {
      id: 'subscription_updated',
      url: 'https://api.payflow.dev/webhooks/stripe/subscription-updated',
      events: ['customer.subscription.updated', 'customer.subscription.deleted'],
      status: 'active',
      lastDelivery: '1 hour ago'
    }
  ];

  const apiKeys = [
    {
      name: 'Production API Key',
      key: 'pk_live_••••••••••••••••••••••••••••••••',
      type: 'Publishable',
      environment: 'Live',
      created: '2024-01-15'
    },
    {
      name: 'Test API Key',
      key: 'pk_test_••••••••••••••••••••••••••••••••',
      type: 'Publishable',
      environment: 'Test',
      created: '2024-01-15'
    }
  ];

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
      case 'available':
        return <Badge variant="outline">Available</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The text has been copied to your clipboard.",
    });
  };

  const handleGatewayConfig = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    setConfigModalOpen(true);
  };

  const StripeConfigModal = () => {
    const [publishableKey, setPublishableKey] = useState('pk_test_••••••••••••••••••••••••••••••••');
    const [secretKey, setSecretKey] = useState('sk_test_••••••••••••••••••••••••••••••••');
    const [webhookSecret, setWebhookSecret] = useState('whsec_••••••••••••••••••••••••••••••••');

    return (
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <SiStripe className="w-5 h-5" />
            <span>Configure Stripe Integration</span>
          </DialogTitle>
          <DialogDescription>
            Configure your Stripe payment gateway settings and API keys.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="publishable-key">Publishable Key</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="publishable-key"
                  value={publishableKey}
                  onChange={(e) => setPublishableKey(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="pk_test_..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(publishableKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Safe to use in client-side code. Used for tokenizing payment methods.
              </p>
            </div>

            <div>
              <Label htmlFor="secret-key">Secret Key</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="secret-key"
                  type={showSecretKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="sk_test_..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(secretKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Keep this secret! Used for server-side API calls and webhooks.
              </p>
            </div>

            <div>
              <Label htmlFor="webhook-secret">Webhook Endpoint Secret</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="webhook-secret"
                  type={showSecretKey ? "text" : "password"}
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="whsec_..."
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard(webhookSecret)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Used to verify webhook signatures from Stripe.
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Test Mode Settings</Label>
              <div className="flex items-center justify-between mt-2">
                <div>
                  <p className="text-sm text-gray-600">Enable test mode</p>
                  <p className="text-xs text-gray-500">Use test API keys for development</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Webhook URL</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  value="https://api.payflow.dev/webhooks/stripe"
                  readOnly
                  className="bg-gray-50 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyToClipboard("https://api.payflow.dev/webhooks/stripe")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure this URL in your Stripe dashboard webhook settings.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setConfigModalOpen(false)}>
              Cancel
            </Button>
            <div className="space-x-2">
              <Button variant="outline">
                Test Connection
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Configuration saved",
                  description: "Stripe integration has been updated successfully.",
                });
                setConfigModalOpen(false);
              }}>
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Manage your payment gateways, webhooks, and API configurations.
          </p>
        </div>

        <Tabs defaultValue="gateways" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="gateways" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {paymentGateways.map((gateway) => {
                const IconComponent = gateway.icon;
                return (
                  <Card key={gateway.id} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{gateway.name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <StatusBadge status={gateway.status} />
                              {gateway.testMode && (
                                <Badge variant="outline" className="text-xs">Test Mode</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleGatewayConfig(gateway.id)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="mb-4">
                        {gateway.description}
                      </CardDescription>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Supported Features</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {gateway.features.map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {gateway.lastSync && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Last synced: {gateway.lastSync}
                          </div>
                        )}

                        {gateway.status === 'connected' && (
                          <div className="flex space-x-2 pt-2">
                            <Button variant="outline" size="sm">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Test Payment
                            </Button>
                            <Button variant="outline" size="sm">
                              View Logs
                            </Button>
                          </div>
                        )}

                        {gateway.status === 'available' && (
                          <Button className="w-full mt-2">
                            Connect {gateway.name}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure webhook endpoints to receive real-time notifications.
                </p>
              </div>
              <Button>
                <Webhook className="w-4 h-4 mr-2" />
                Add Endpoint
              </Button>
            </div>

            <div className="space-y-4">
              {webhookEndpoints.map((endpoint) => (
                <Card key={endpoint.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{endpoint.url}</h4>
                          <StatusBadge status={endpoint.status} />
                        </div>
                        
                        <div className="space-y-2">
                          <div>
                            <Label className="text-sm">Events</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {endpoint.events.map((event) => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          {endpoint.lastDelivery && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Last delivery: {endpoint.lastDelivery}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Test
                        </Button>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">API Keys</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your API keys for authentication and authorization.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-keys"
                    checked={apiKeysVisible}
                    onCheckedChange={setApiKeysVisible}
                  />
                  <Label htmlFor="show-keys" className="text-sm">Show keys</Label>
                </div>
                <Button>
                  <Key className="w-4 h-4 mr-2" />
                  Generate Key
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {apiKeys.map((apiKey, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{apiKey.name}</h4>
                          <Badge variant="outline">{apiKey.type}</Badge>
                          <Badge 
                            variant={apiKey.environment === 'Live' ? 'default' : 'secondary'}
                            className={apiKey.environment === 'Live' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {apiKey.environment}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Input
                            value={apiKeysVisible ? apiKey.key.replace('••••••••••••••••••••••••••••••••', 'pk_live_1234567890abcdef1234567890abcdef') : apiKey.key}
                            readOnly
                            className="font-mono text-sm bg-gray-50 dark:bg-gray-800"
                          />
                          <Button variant="outline" size="sm">
                            Copy
                          </Button>
                        </div>
                        
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          Created: {apiKey.created}
                        </p>
                      </div>
                      
                      <Button variant="outline" size="sm" className="ml-4">
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Configuration Modal */}
        <Dialog open={configModalOpen} onOpenChange={setConfigModalOpen}>
          {selectedGateway === 'stripe' && <StripeConfigModal />}
        </Dialog>
      </div>
    </div>
  );
}