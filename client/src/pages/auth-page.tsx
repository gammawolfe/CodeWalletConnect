import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wallet, Shield, TrendingUp, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  if (user) {
    return <Redirect to="/" />;
  }

  const onLogin = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: RegisterData) => {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  const features = [
    {
      icon: Wallet,
      title: "Wallet Management",
      description: "Complete API for wallet operations with full audit trails"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "OIDC authentication and PCI-compliant security practices"
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Comprehensive monitoring and observability tools"
    },
    {
      icon: Users,
      title: "Multi-tenant Support",
      description: "Built for scale with comprehensive third-party integration"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left side - Auth Forms */}
        <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Wallet className="text-white text-lg" />
                </div>
                <span className="text-2xl font-bold text-gray-900">PayFlow</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome to PayFlow
              </h2>
              <p className="mt-2 text-gray-600">
                Production-ready payment gateway aggregator and wallet service
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          {...loginForm.register("email")}
                        />
                        {loginForm.formState.errors.email && (
                          <p className="text-sm text-red-600 mt-1">
                            {loginForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          {...loginForm.register("password")}
                        />
                        {loginForm.formState.errors.password && (
                          <p className="text-sm text-red-600 mt-1">
                            {loginForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Choose a username"
                          {...registerForm.register("username")}
                        />
                        {registerForm.formState.errors.username && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.username.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="Enter your email"
                          {...registerForm.register("email")}
                        />
                        {registerForm.formState.errors.email && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="Create a password"
                          {...registerForm.register("password")}
                        />
                        {registerForm.formState.errors.password && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          {...registerForm.register("confirmPassword")}
                        />
                        {registerForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right side - Hero Section */}
        <div className="hidden lg:block relative hero-gradient text-white">
          <div className="flex flex-col justify-center h-full px-8 lg:px-12">
            <div className="max-w-lg">
              <h1 className="text-4xl font-bold mb-6">
                Payment Gateway Aggregator & Wallet Service
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Production-ready REST API with double-entry ledger, OIDC authentication, 
                and pluggable payment gateway adapters.
              </p>
              
              <div className="grid grid-cols-1 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-blue-100 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
