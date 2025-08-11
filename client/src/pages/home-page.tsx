import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "wouter";
import {
  Wallet,
  Book,
  Plug,
  Shield,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  Code,
  Smartphone,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: Wallet,
      title: "Wallet Management",
      description:
        "Complete REST API for wallet operations including balance checks, credits, debits, and transfers with full audit trails.",
    },
    {
      icon: Book,
      title: "Double-Entry Ledger",
      description:
        "Immutable accounting system with double-entry bookkeeping ensuring data integrity and comprehensive financial reporting.",
    },
    {
      icon: Plug,
      title: "Gateway Integration",
      description:
        "Pluggable adapter architecture supporting multiple payment gateways including Stripe with easy extension capabilities.",
    },
    {
      icon: Shield,
      title: "Security & Auth",
      description:
        "OIDC/OAuth2 authentication, API keys, webhook verification, and PCI-compliant security practices built-in.",
    },
    {
      icon: RotateCcw,
      title: "Transaction Orchestration",
      description:
        "Async processing with retry mechanisms, idempotency support, and comprehensive status tracking.",
    },
    {
      icon: TrendingUp,
      title: "Observability",
      description:
        "Structured logging, metrics collection, distributed tracing, and comprehensive health monitoring.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="hero-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                B2B Payment Infrastructure &{" "}
                <span className="text-blue-200">Financial Backend</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Production-ready financial infrastructure powering integrated applications. 
                Complete REST API with double-entry ledger, payment processing, and wallet management. 
                Built for B2B integration and scale.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/dashboard">
                  <Button className="bg-white text-primary px-6 py-3 hover:bg-gray-50 font-semibold">
                    Admin Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/api-docs">
                  <Button
                    variant="outline"
                    className="border-2 border-white text-white px-6 py-3 hover:bg-white hover:text-primary font-semibold"
                  >
                    View Documentation
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:text-right">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400"
                alt="Financial dashboard and development environment"
                className="rounded-xl shadow-2xl w-full max-w-md lg:max-w-lg ml-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Infrastructure Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade financial infrastructure with comprehensive security,
              observability, and B2B integration capabilities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-gray-50 border-none">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="text-white text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              B2B Integration Ready
            </h2>
            <p className="text-xl text-gray-600">
              Complete SDKs and APIs for integrating PayFlow into your applications.
              See our RoSaBank integration as a reference implementation.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Code className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  PayFlow Client SDK
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Complete TypeScript SDK for wallet operations, payments, and ROSCA-specific helpers.
                  Used by RoSaBank and other integrated applications.
                </p>
                <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-800 mb-4">
                  // See integration/payflow-client.ts
                </div>
                <Link href="/integrations">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">
                    View Integration Guide
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  RoSaBank Integration
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Complete reference implementation showing how to integrate PayFlow 
                  into ROSCA applications for group savings and payments.
                </p>
                <div className="space-y-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-800">
                    ROSCA Groups • Members • Contributions
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono text-gray-800">
                    Automated Payouts • Transaction Tracking
                  </div>
                </div>
                <Link href="/integrations">
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    View RoSaBank Integration
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Code className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Webhook Events
                </h3>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Real-time notifications for all wallet operations with HMAC
                  signature verification.
                </p>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span>wallet.balance.updated</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    <span>transaction.completed</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-orange-400" />
                    <span>payout.initiated</span>
                  </div>
                </div>
                <Button className="w-full bg-purple-500 hover:bg-purple-600">
                  Setup Webhooks
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Enterprise Security</h2>
            <p className="text-xl text-gray-300">
              Built with security-first principles and compliance in mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-xl">
              <Shield className="text-3xl text-green-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">PCI Compliance</h3>
              <p className="text-gray-300">
                No card data storage, delegated to gateway providers for PCI
                scope minimization.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <Shield className="text-3xl text-blue-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">TLS Encryption</h3>
              <p className="text-gray-300">
                End-to-end encryption for all API endpoints and data
                transmission.
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <Shield className="text-3xl text-yellow-400 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Secret Management</h3>
              <p className="text-gray-300">
                HashiCorp Vault integration for secure secret storage and
                rotation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
