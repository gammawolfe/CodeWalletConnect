import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle,
  AlertTriangle,
  Clock,
  Activity,
  Database,
  CreditCard,
  Zap,
  Globe,
  Shield,
  TrendingUp,
  RefreshCw
} from "lucide-react";

export default function SystemStatus() {
  // Payment gateway status
  const paymentGateways = [
    {
      name: "Stripe",
      status: "operational",
      uptime: "99.98%",
      lastCheck: "< 1 minute ago",
      responseTime: "120ms",
      dailyVolume: "$2.1M",
      endpoints: [
        { name: "Payment Intents", status: "operational" },
        { name: "Webhooks", status: "operational" },
        { name: "Payouts", status: "operational" },
        { name: "Connect", status: "operational" }
      ]
    },
    {
      name: "Mock Gateway",
      status: "operational", 
      uptime: "100%",
      lastCheck: "< 1 minute ago",
      responseTime: "5ms",
      dailyVolume: "$45K",
      endpoints: [
        { name: "Test Payments", status: "operational" },
        { name: "Test Webhooks", status: "operational" }
      ]
    }
  ];

  // System components
  const systemComponents = [
    {
      name: "PostgreSQL Database",
      status: "operational",
      uptime: "99.99%",
      connections: "12/100",
      queryTime: "2.1ms",
      details: "All database operations running normally"
    },
    {
      name: "API Server",
      status: "operational", 
      uptime: "99.97%",
      requests: "1.2K/min",
      responseTime: "85ms",
      details: "All endpoints responding normally"
    },
    {
      name: "Authentication Service",
      status: "operational",
      uptime: "99.98%", 
      sessions: "45 active",
      responseTime: "12ms",
      details: "Session management operating normally"
    },
    {
      name: "Webhook Delivery",
      status: "operational",
      uptime: "99.95%",
      delivered: "98.7%",
      queue: "3 pending",
      details: "Webhook delivery processing normally"
    }
  ];

  // Recent incidents
  const recentIncidents = [
    {
      id: 1,
      title: "Elevated API response times",
      status: "resolved",
      severity: "minor",
      started: "2024-01-15 14:30",
      resolved: "2024-01-15 15:15",
      impact: "Some API requests experienced delays of 200-500ms",
      solution: "Database connection pool optimized"
    },
    {
      id: 2,
      title: "Stripe webhook delivery delays",
      status: "resolved", 
      severity: "minor",
      started: "2024-01-14 09:20",
      resolved: "2024-01-14 10:05",
      impact: "Webhook deliveries delayed by 5-10 minutes",
      solution: "Retry queue cleared and processing resumed"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800'
      case 'degraded': return 'bg-yellow-100 text-yellow-800'
      case 'outage': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-4 w-4" />
      case 'degraded': return <AlertTriangle className="h-4 w-4" />
      case 'outage': return <AlertTriangle className="h-4 w-4" />
      case 'maintenance': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
              <p className="text-gray-600 mt-2">
                Monitor payment gateway connections and system health
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Systems Operational</h2>
                <p className="text-gray-600">Last updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="gateways" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gateways" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Gateways
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System Components
            </TabsTrigger>
            <TabsTrigger value="incidents" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Incidents
            </TabsTrigger>
          </TabsList>

          {/* Payment Gateways Tab */}
          <TabsContent value="gateways" className="space-y-6">
            <div className="grid gap-6">
              {paymentGateways.map((gateway) => (
                <Card key={gateway.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{gateway.name}</CardTitle>
                        <Badge className={`${getStatusColor(gateway.status)} flex items-center gap-1`}>
                          {getStatusIcon(gateway.status)}
                          {gateway.status}
                        </Badge>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>Uptime: {gateway.uptime}</div>
                        <div>Last check: {gateway.lastCheck}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-sm text-gray-600">Response Time</div>
                          <div className="font-medium">{gateway.responseTime}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-sm text-gray-600">Daily Volume</div>
                          <div className="font-medium">{gateway.dailyVolume}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-sm text-gray-600">Security</div>
                          <div className="font-medium">PCI Compliant</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Endpoint Status</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {gateway.endpoints.map((endpoint) => (
                          <div key={endpoint.name} className="flex items-center gap-2 p-2 border rounded">
                            <div className={`w-2 h-2 rounded-full ${endpoint.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="text-sm">{endpoint.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* System Components Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="grid gap-4">
              {systemComponents.map((component) => (
                <Card key={component.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${component.status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div>
                          <h3 className="font-medium text-gray-900">{component.name}</h3>
                          <p className="text-sm text-gray-600">{component.details}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(component.status)}>
                          {component.status}
                        </Badge>
                        <div className="text-sm text-gray-500 mt-1">
                          Uptime: {component.uptime}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Metric 1</div>
                        <div className="font-medium">
                          {component.connections || component.requests || component.sessions || component.delivered}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Response Time</div>
                        <div className="font-medium">{component.responseTime || component.queryTime}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600">Queue</div>
                        <div className="font-medium">{component.queue || 'N/A'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recent Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            <div className="space-y-4">
              {recentIncidents.map((incident) => (
                <Card key={incident.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{incident.title}</h3>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                          <Badge variant="outline" className={
                            incident.severity === 'major' ? 'text-red-600' :
                            incident.severity === 'minor' ? 'text-yellow-600' : 'text-blue-600'
                          }>
                            {incident.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{incident.impact}</p>
                        <p className="text-sm text-gray-800"><strong>Solution:</strong> {incident.solution}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500 ml-4">
                        <div>Started: {incident.started}</div>
                        <div>Resolved: {incident.resolved}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}