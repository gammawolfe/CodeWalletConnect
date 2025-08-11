import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle,
  Clock,
  Code,
  Key,
  Book,
  Zap,
  Shield,
  Users,
  Settings,
  FileText,
  ExternalLink,
  Copy,
  ArrowRight,
  Info
} from "lucide-react";

export default function OnboardingGuide() {
  const onboardingSteps = [
    {
      step: 1,
      title: "Application Registration",
      description: "Register your application and get API credentials",
      duration: "5 minutes",
      status: "required",
      tasks: [
        "Complete application registration form",
        "Provide business/organization details",
        "Submit integration use case description",
        "Receive API keys and sandbox access"
      ]
    },
    {
      step: 2,
      title: "Technical Integration",
      description: "Implement PayFlow SDK and API integration",
      duration: "2-5 days",
      status: "development",
      tasks: [
        "Install PayFlow Client SDK",
        "Configure API authentication",
        "Implement wallet operations",
        "Set up webhook endpoints",
        "Test in sandbox environment"
      ]
    },
    {
      step: 3,
      title: "Security Review",
      description: "Security assessment and compliance verification",
      duration: "3-7 days",
      status: "review",
      tasks: [
        "Submit security questionnaire",
        "API security audit",
        "Webhook security verification",
        "Data handling compliance check",
        "Penetration testing (if required)"
      ]
    },
    {
      step: 4,
      title: "Business Verification",
      description: "Business legitimacy and financial compliance",
      duration: "1-3 days",
      status: "verification",
      tasks: [
        "Business license verification",
        "KYB (Know Your Business) documentation",
        "Financial compliance assessment",
        "Terms of service agreement",
        "SLA and support tier selection"
      ]
    },
    {
      step: 5,
      title: "Production Deployment",
      description: "Go live with production API access",
      duration: "1 day",
      status: "deployment",
      tasks: [
        "Production API keys provisioning",
        "DNS and domain verification",
        "Webhook endpoint validation",
        "Go-live testing and monitoring",
        "Production environment activation"
      ]
    }
  ];

  const integrationOptions = [
    {
      name: "PayFlow Client SDK",
      difficulty: "Easy",
      timeToIntegrate: "1-2 days",
      description: "Complete TypeScript SDK with wallet operations and ROSCA helpers",
      features: ["Wallet Management", "ROSCA Operations", "Transaction Processing", "Type Safety"],
      codeExample: `import { PayFlowClient } from './integration/payflow-client';

const client = new PayFlowClient({
  apiKey: process.env.PAYFLOW_API_KEY,
  baseURL: 'https://api.payflow.dev'
});

// Create a wallet
const wallet = await client.createWallet({
  userId: 'user123',
  currency: 'USD',
  type: 'personal'
});`
    },
    {
      name: "REST API Direct",
      difficulty: "Medium",
      timeToIntegrate: "3-5 days",
      description: "Direct REST API integration with custom implementation",
      features: ["Full API Access", "Custom Implementation", "Flexible Integration", "All Endpoints"],
      codeExample: `// Direct API call example
const response = await fetch('https://api.payflow.dev/v1/wallets', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user123',
    currency: 'USD',
    type: 'personal'
  })
});`
    },
    {
      name: "Webhook Events",
      difficulty: "Advanced",
      timeToIntegrate: "2-3 days",
      description: "Real-time event notifications for wallet and transaction updates",
      features: ["Real-time Updates", "HMAC Verification", "Retry Logic", "Event Filtering"],
      codeExample: `// Webhook handler example
app.post('/payflow-webhook', (req, res) => {
  const signature = req.headers['payflow-signature'];
  const payload = req.body;
  
  if (verifyWebhookSignature(payload, signature)) {
    handlePayFlowEvent(payload);
    res.status(200).send('OK');
  } else {
    res.status(400).send('Invalid signature');
  }
});`
    }
  ];

  const getStepIcon = (status: string) => {
    switch (status) {
      case "required":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "development":
        return <Code className="h-5 w-5 text-purple-500" />;
      case "review":
        return <Shield className="h-5 w-5 text-orange-500" />;
      case "verification":
        return <Users className="h-5 w-5 text-green-500" />;
      case "deployment":
        return <Zap className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Third-Party App Onboarding</h1>
          <p className="text-gray-600 mt-2">
            Complete guide for integrating your application with PayFlow infrastructure
          </p>
        </div>

        <Tabs defaultValue="process" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="process">Onboarding Process</TabsTrigger>
            <TabsTrigger value="integration">Integration Options</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Total onboarding time: 7-16 days depending on complexity and review process.
                Start with sandbox integration while business verification is in progress.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              {onboardingSteps.map((step, index) => (
                <Card key={step.step} className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                          {step.step}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{step.title}</CardTitle>
                          <p className="text-sm text-gray-600">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.status)}
                        <Badge variant="outline" className="text-xs">
                          {step.duration}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {step.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                    
                    {index < onboardingSteps.length - 1 && (
                      <div className="flex justify-center mt-6">
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Ready to Get Started?</h3>
                </div>
                <p className="text-blue-800 mb-4">
                  Begin your PayFlow integration journey. Our team will guide you through each step.
                </p>
                <div className="flex gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Start Application Registration
                  </Button>
                  <Button variant="outline">
                    <Book className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <div className="grid gap-6">
              {integrationOptions.map((option, index) => (
                <Card key={index} className="shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{option.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getDifficultyColor(option.difficulty)}>
                          {option.difficulty}
                        </Badge>
                        <Badge variant="outline">
                          {option.timeToIntegrate}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {option.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Code Example:</p>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100">
                          <code>{option.codeExample}</code>
                        </pre>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <Button variant="outline" size="sm">
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Code
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Full Documentation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requirements" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Technical Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">Infrastructure</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• HTTPS endpoints for webhook delivery</li>
                      <li>• SSL/TLS certificate validation</li>
                      <li>• Webhook signature verification</li>
                      <li>• API rate limiting compliance</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Security</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• API key secure storage</li>
                      <li>• Request/response logging</li>
                      <li>• Error handling and monitoring</li>
                      <li>• Data encryption at rest</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Development</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Node.js 16+ or equivalent runtime</li>
                      <li>• TypeScript support recommended</li>
                      <li>• Automated testing capabilities</li>
                      <li>• CI/CD pipeline integration</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Business Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">Legal Entity</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Registered business entity</li>
                      <li>• Valid business license</li>
                      <li>• Tax identification number</li>
                      <li>• Principal officers identification</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Financial Compliance</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• AML/KYC policy documentation</li>
                      <li>• Financial services licensing (if applicable)</li>
                      <li>• Risk management procedures</li>
                      <li>• Data protection compliance (GDPR/CCPA)</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Use Case</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Clear business model description</li>
                      <li>• Expected transaction volumes</li>
                      <li>• Target customer demographics</li>
                      <li>• Integration timeline and milestones</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Requirements may vary based on your business type, transaction volumes, 
                and jurisdictional regulations. Our compliance team will provide specific guidance during the onboarding process.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}