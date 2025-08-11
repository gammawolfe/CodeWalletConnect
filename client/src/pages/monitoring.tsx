import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Server, 
  Database, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap 
} from "lucide-react";

export default function Monitoring() {
  const { data: healthStatus, isLoading } = useQuery({
    queryKey: ["/api/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
    enabled: false, // Will implement when metrics endpoint is ready
  });

  // Mock data for demonstration
  const systemMetrics = {
    uptime: "99.9%",
    responseTime: "145ms",
    throughput: "1,234 req/min",
    errorRate: "0.05%",
    activeConnections: 42,
    queueDepth: 3,
  };

  const integrationStatus = [
    { name: "RoSaBank", status: "healthy", lastSeen: "2 minutes ago" },
    { name: "Stripe", status: "healthy", lastSeen: "1 minute ago" },
    { name: "Database", status: "healthy", lastSeen: "< 1 minute ago" },
    { name: "Redis", status: "warning", lastSeen: "5 minutes ago" },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
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
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="text-gray-600 mt-2">
            Real-time monitoring of PayFlow infrastructure and integrated applications
          </p>
        </div>

        {/* System Status Alert */}
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All systems operational. PayFlow infrastructure is running smoothly.
          </AlertDescription>
        </Alert>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* System Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-green-600">{systemMetrics.uptime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Response Time</p>
                  <p className="text-2xl font-bold">{systemMetrics.responseTime}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Throughput</p>
                  <p className="text-xl font-semibold">{systemMetrics.throughput}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Error Rate</p>
                  <p className="text-xl font-semibold text-green-600">{systemMetrics.errorRate}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU Usage</span>
                  <span>23%</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Memory Usage</span>
                  <span>67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Integration Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {integrationStatus.map((integration) => (
                  <div key={integration.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(integration.status)}
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-xs text-gray-500">Last seen: {integration.lastSeen}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Database Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">Healthy</p>
                <p className="text-sm text-gray-600">All connections active</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Connections</span>
                  <span>{systemMetrics.activeConnections}/100</span>
                </div>
                <Progress value={(systemMetrics.activeConnections / 100) * 100} className="h-2" />
              </div>
              <div className="text-center text-xs text-gray-500">
                Response time: 2ms avg
              </div>
            </CardContent>
          </Card>

          {/* Transaction Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Transaction Queue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{systemMetrics.queueDepth}</p>
                <p className="text-sm text-gray-600">Items in queue</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing Rate</span>
                  <span>98.7%</span>
                </div>
                <Progress value={98.7} className="h-2" />
              </div>
              <div className="text-center text-xs text-gray-500">
                Avg processing: 150ms
              </div>
            </CardContent>
          </Card>

          {/* API Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                API Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">Excellent</p>
                <p className="text-sm text-gray-600">{systemMetrics.responseTime} avg response</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span>99.95%</span>
                </div>
                <Progress value={99.95} className="h-2" />
              </div>
              <div className="text-center text-xs text-gray-500">
                {systemMetrics.throughput} requests/min
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent System Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">RoSaBank integration health check passed</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                <Activity className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">New wallet created via RoSaBank API</p>
                  <p className="text-xs text-gray-500">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Redis connection pool warning threshold reached</p>
                  <p className="text-xs text-gray-500">8 minutes ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}