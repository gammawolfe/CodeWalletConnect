import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import ApiDocs from "@/pages/api-docs";
import Integrations from "@/pages/integrations";
import Partners from "@/pages/partners";
import Onboarding from "@/pages/onboarding";
import Monitoring from "@/pages/monitoring";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/api-docs" component={ApiDocs} />
      <ProtectedRoute path="/integrations" component={Integrations} />
      <ProtectedRoute path="/partners" component={Partners} />
      <ProtectedRoute path="/onboarding" component={Onboarding} />
      <ProtectedRoute path="/monitoring" component={Monitoring} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
