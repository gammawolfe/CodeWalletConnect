import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, CheckCircle, Clock, AlertTriangle, Plus, Key, Eye, Copy, Settings } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiRequest, queryClient } from "@/lib/queryClient"
import type { Partner, ApiKey } from "@shared/schema"

export default function Partners() {
  const { toast } = useToast()
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [newApiKey, setNewApiKey] = useState<any>(null)

  // Fetch partners
  const { data: partners = [], isLoading } = useQuery<Partner[]>({
    queryKey: ['/api/admin/partners'],
  })

  // Fetch API keys for selected partner
  const { data: apiKeys = [] } = useQuery<ApiKey[]>({
    queryKey: ['/api/admin/partners', selectedPartner?.id, 'api-keys'],
    enabled: !!selectedPartner?.id,
  })

  // Update partner status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ partnerId, status }: { partnerId: string; status: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/partners/${partnerId}/status`, { status })
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] })
      toast({
        title: "Status Updated",
        description: "Partner status has been updated successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Create API key mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async ({ partnerId, environment, permissions }: { 
      partnerId: string; 
      environment: string; 
      permissions: string[] 
    }) => {
      const res = await apiRequest('POST', `/api/admin/partners/${partnerId}/api-keys`, {
        environment,
        permissions
      })
      return await res.json()
    },
    onSuccess: (data) => {
      setNewApiKey(data)
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partners', selectedPartner?.id, 'api-keys'] })
      toast({
        title: "API Key Created",
        description: "New API key has been generated successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: async (partnerData: {
      name: string;
      companyName: string;
      email: string;
      contactPerson: string;
      businessType: string;
      webhookUrl?: string;
    }) => {
      const res = await apiRequest('POST', '/api/admin/partners', partnerData)
      return await res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/partners'] })
      setShowOnboardingModal(false)
      toast({
        title: "Partner Created",
        description: "New partner has been onboarded successfully",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      case 'rejected': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'suspended': return <AlertTriangle className="h-4 w-4" />
      case 'rejected': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Partner Management</h1>
              <p className="text-gray-600 mt-2">Manage B2B partners and their API integrations</p>
            </div>
            <Button
              onClick={() => setShowOnboardingModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Partner
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Partners List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Partners ({partners.length})
                </CardTitle>
                <CardDescription>
                  B2B clients using PayFlow infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {partners.map((partner) => (
                    <div 
                      key={partner.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPartner?.id === partner.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium text-gray-900">{partner.name}</h3>
                            <Badge className={`${getStatusColor(partner.status)} flex items-center gap-1`}>
                              {getStatusIcon(partner.status)}
                              {partner.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{partner.companyName}</p>
                          <p className="text-sm text-gray-500">{partner.businessType}</p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>Contact: {partner.contactPerson}</div>
                          <div>{partner.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Partner Details */}
          <div>
            {selectedPartner ? (
              <div className="space-y-6">
                {/* Partner Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Partner Details
                      <div className="flex gap-2">
                        <Select
                          value={selectedPartner.status}
                          onValueChange={(status) => 
                            updateStatusMutation.mutate({ 
                              partnerId: selectedPartner.id, 
                              status 
                            })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-gray-600">{selectedPartner.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Business Type</Label>
                      <p className="text-sm text-gray-600">{selectedPartner.businessType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Contact Person</Label>
                      <p className="text-sm text-gray-600">{selectedPartner.contactPerson}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-gray-600">{selectedPartner.email}</p>
                    </div>
                    {selectedPartner.webhookUrl && (
                      <div>
                        <Label className="text-sm font-medium">Webhook URL</Label>
                        <p className="text-sm text-gray-600 font-mono break-all">
                          {selectedPartner.webhookUrl}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* API Keys */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        API Keys ({apiKeys.length})
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setShowApiKeyModal(true)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Generate
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant={key.environment === 'production' ? 'default' : 'secondary'}>
                                  {key.environment}
                                </Badge>
                                <Badge variant={key.isActive ? 'default' : 'destructive'}>
                                  {key.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Created: {new Date(key.createdAt).toLocaleDateString()}
                              </p>
                              {key.lastUsedAt && (
                                <p className="text-xs text-gray-500">
                                  Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Permissions:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {key.permissions.map((perm) => (
                                <Badge key={perm} variant="outline" className="text-xs">
                                  {perm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <p className="text-gray-500">Select a partner to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* API Key Generation Modal */}
        <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for {selectedPartner?.name}
              </DialogDescription>
            </DialogHeader>
            
            {newApiKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 mb-2">
                    ⚠️ Save these keys now - the secret key will not be shown again
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Public Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newApiKey.publicKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newApiKey.publicKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Secret Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newApiKey.secretKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(newApiKey.secretKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setNewApiKey(null)
                      setShowApiKeyModal(false)
                    }}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <ApiKeyForm
                onSubmit={(data) => {
                  if (selectedPartner) {
                    createApiKeyMutation.mutate({
                      partnerId: selectedPartner.id,
                      ...data
                    })
                  }
                }}
                isLoading={createApiKeyMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Partner Onboarding Modal */}
        <Dialog open={showOnboardingModal} onOpenChange={setShowOnboardingModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Onboard New Partner</DialogTitle>
              <DialogDescription>
                Add a new B2B partner to the PayFlow platform
              </DialogDescription>
            </DialogHeader>
            
            <PartnerOnboardingForm
              onSubmit={(data) => createPartnerMutation.mutate(data)}
              isLoading={createPartnerMutation.isPending}
              onCancel={() => setShowOnboardingModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function ApiKeyForm({ 
  onSubmit, 
  isLoading 
}: { 
  onSubmit: (data: { environment: string; permissions: string[] }) => void;
  isLoading: boolean;
}) {
  const [environment, setEnvironment] = useState('sandbox')
  const [permissions, setPermissions] = useState<string[]>([
    'wallets:read', 
    'wallets:write', 
    'transactions:read'
  ])

  const allPermissions = [
    'wallets:read',
    'wallets:write', 
    'transactions:read',
    'transactions:write',
    'payouts:read',
    'payouts:write'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ environment, permissions })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="environment">Environment</Label>
        <Select value={environment} onValueChange={setEnvironment}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sandbox">Sandbox</SelectItem>
            <SelectItem value="production">Production</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Permissions</Label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {allPermissions.map((perm) => (
            <label key={perm} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permissions.includes(perm)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPermissions([...permissions, perm])
                  } else {
                    setPermissions(permissions.filter(p => p !== perm))
                  }
                }}
                className="rounded"
              />
              {perm}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? 'Generating...' : 'Generate API Key'}
        </Button>
      </div>
    </form>
  )
}

function PartnerOnboardingForm({ 
  onSubmit, 
  isLoading,
  onCancel
}: { 
  onSubmit: (data: {
    name: string;
    companyName: string;
    email: string;
    contactPerson: string;
    businessType: string;
    webhookUrl?: string;
  }) => void;
  isLoading: boolean;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    contactPerson: '',
    businessType: '',
    webhookUrl: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.name || !formData.companyName || !formData.email || 
        !formData.contactPerson || !formData.businessType) {
      return
    }

    const submitData = {
      ...formData,
      webhookUrl: formData.webhookUrl || undefined
    }
    
    onSubmit(submitData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Partner Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., RoSaBank"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="companyName">Company Name *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleInputChange('companyName', e.target.value)}
            placeholder="e.g., Rosa Bank Ltd."
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactPerson">Contact Person *</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
            placeholder="John Smith"
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="contact@rosabank.com"
            required
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="businessType">Business Type *</Label>
        <Input
          id="businessType"
          value={formData.businessType}
          onChange={(e) => handleInputChange('businessType', e.target.value)}
          placeholder="e.g., Banking, FinTech, E-commerce"
          required
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
        <Input
          id="webhookUrl"
          type="url"
          value={formData.webhookUrl}
          onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
          placeholder="https://api.rosabank.com/webhooks/payflow"
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          URL where PayFlow will send transaction notifications
        </p>
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading || !formData.name || !formData.companyName || 
                   !formData.email || !formData.contactPerson || !formData.businessType} 
          className="flex-1"
        >
          {isLoading ? 'Creating...' : 'Create Partner'}
        </Button>
      </div>
    </form>
  )
}