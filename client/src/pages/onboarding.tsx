import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  FileText,
  Send,
  Building,
  Users,
  Code,
  Shield,
  Zap,
  ExternalLink
} from "lucide-react";

export default function Onboarding() {
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [newApplicationOpen, setNewApplicationOpen] = useState(false);

  // Mock data for onboarding applications
  const applications = [
    {
      id: "app_001",
      name: "RoSaBank",
      company: "RoSa Financial Tech",
      type: "ROSCA Platform",
      status: "approved",
      submittedDate: "2024-01-15",
      approvedDate: "2024-01-22",
      businessModel: "Rotating savings and credit association platform",
      expectedVolume: "$2-5M monthly",
      contact: "tech@rosabank.com",
      currentStep: "production",
      progress: 100,
      apiKeys: {
        sandbox: "pk_test_rosabank_xyz123",
        production: "pk_live_rosabank_abc789"
      }
    },
    {
      id: "app_002", 
      name: "MicroLend Pro",
      company: "African Microfinance Solutions",
      type: "Microfinance Platform",
      status: "security_review",
      submittedDate: "2024-02-10",
      approvedDate: null,
      businessModel: "Digital lending platform for small business loans",
      expectedVolume: "$1-3M monthly",
      contact: "dev@microlend.africa",
      currentStep: "security_review",
      progress: 60,
      apiKeys: {
        sandbox: "pk_test_microlend_def456",
        production: null
      }
    },
    {
      id: "app_003",
      name: "PaySplit", 
      company: "SplitWise Technologies",
      type: "Expense Sharing",
      status: "pending_review",
      submittedDate: "2024-02-18",
      approvedDate: null,
      businessModel: "Group expense tracking and bill splitting",
      expectedVolume: "$100K-500K monthly",
      contact: "api@paysplit.app",
      currentStep: "initial_review",
      progress: 25,
      apiKeys: {
        sandbox: null,
        production: null
      }
    },
    {
      id: "app_004",
      name: "CryptoSave",
      company: "Blockchain Savings Ltd",
      type: "Crypto Savings",
      status: "rejected",
      submittedDate: "2024-02-01",
      approvedDate: null,
      businessModel: "Cryptocurrency savings and DeFi integration",
      expectedVolume: "$5-10M monthly",
      contact: "team@cryptosave.io",
      currentStep: "rejected",
      progress: 0,
      rejectionReason: "Regulatory compliance concerns with cryptocurrency operations"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "security_review":
      case "pending_review":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "security_review":
      case "pending_review":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStepIcon = (step: string) => {
    switch (step) {
      case "initial_review":
        return <FileText className="h-4 w-4" />;
      case "security_review":
        return <Shield className="h-4 w-4" />;
      case "business_verification":
        return <Building className="h-4 w-4" />;
      case "technical_integration":
        return <Code className="h-4 w-4" />;
      case "production":
        return <Zap className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const onboardingSteps = [
    { key: "initial_review", label: "Initial Review", description: "Business model and compliance check" },
    { key: "security_review", label: "Security Review", description: "Technical security assessment" },
    { key: "business_verification", label: "Business Verification", description: "KYB and legal documentation" },
    { key: "technical_integration", label: "Technical Integration", description: "API integration and testing" },
    { key: "production", label: "Production Ready", description: "Live deployment and monitoring" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">App Onboarding Management</h1>
              <p className="text-gray-600 mt-2">
                Manage third-party application onboarding process and API access
              </p>
            </div>
            <Dialog open={newApplicationOpen} onOpenChange={setNewApplicationOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Application
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Review New Application</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="appName">Application Name</Label>
                      <Input id="appName" placeholder="MyFinanceApp" />
                    </div>
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="Finance Corp Ltd" />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="appType">Application Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select application type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rosca">ROSCA Platform</SelectItem>
                        <SelectItem value="microfinance">Microfinance</SelectItem>
                        <SelectItem value="expense">Expense Sharing</SelectItem>
                        <SelectItem value="lending">Digital Lending</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="businessModel">Business Model</Label>
                    <Textarea 
                      id="businessModel" 
                      placeholder="Describe the business model and how PayFlow will be used..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expectedVolume">Expected Monthly Volume</Label>
                      <Input id="expectedVolume" placeholder="$100K - $1M" />
                    </div>
                    <div>
                      <Label htmlFor="contact">Technical Contact</Label>
                      <Input id="contact" placeholder="dev@company.com" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewApplicationOpen(false)}>
                      Cancel
                    </Button>
                    <Button>Submit for Review</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="process">Onboarding Process</TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Applications</p>
                      <p className="text-2xl font-bold">{applications.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {applications.filter(app => app.status === 'approved').length}
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
                      <p className="text-sm text-gray-600">Under Review</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {applications.filter(app => app.status.includes('review')).length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">
                        {applications.filter(app => app.status === 'rejected').length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Applications List */}
            <div className="space-y-4">
              {applications.map((app) => (
                <Card key={app.id} className="shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <Building className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.company} • {app.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(app.status)}
                        <Badge className={getStatusColor(app.status)}>
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Submitted</p>
                        <p className="font-medium">{new Date(app.submittedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Expected Volume</p>
                        <p className="font-medium">{app.expectedVolume}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="font-medium">{app.contact}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Business Model</p>
                      <p className="text-sm">{app.businessModel}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Onboarding Progress</span>
                        <span>{app.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${app.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Current Step */}
                    <div className="flex items-center gap-2 mb-4">
                      {getStepIcon(app.currentStep)}
                      <span className="text-sm font-medium">
                        Current: {onboardingSteps.find(s => s.key === app.currentStep)?.label || app.currentStep}
                      </span>
                    </div>

                    {/* API Keys */}
                    {app.apiKeys?.sandbox && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">API Keys</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Sandbox: </span>
                            <code className="bg-white px-2 py-1 rounded text-xs">{app.apiKeys.sandbox}</code>
                          </div>
                          {app.apiKeys?.production && (
                            <div>
                              <span className="text-gray-600">Production: </span>
                              <code className="bg-white px-2 py-1 rounded text-xs">{app.apiKeys.production}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rejection Reason */}
                    {app.status === 'rejected' && app.rejectionReason && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Rejection Reason:</strong> {app.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        {app.status === 'pending_review' && (
                          <>
                            <Button size="sm" variant="outline">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              <XCircle className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {app.status === 'security_review' && (
                          <Button size="sm" variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            Security Review
                          </Button>
                        )}
                        {app.status === 'approved' && (
                          <Button size="sm" variant="outline">
                            <Code className="h-3 w-3 mr-1" />
                            Manage API Keys
                          </Button>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="process" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Process Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {onboardingSteps.map((step, index) => (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{step.label}</h3>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                      {getStepIcon(step.key)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}