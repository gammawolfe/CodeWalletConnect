import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";

// Stripe will be loaded dynamically
declare global {
  interface Window {
    Stripe?: any;
  }
}

interface FundingSession {
  id: string;
  status: 'created' | 'active' | 'completed' | 'failed' | 'expired';
  amount: number;
  currency: string;
  walletId: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

export default function PaymentPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [, setLocation] = useLocation();
  
  const [session, setSession] = useState<FundingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Load funding session data
  useEffect(() => {
    if (!sessionId) {
      setError('Invalid payment session');
      setLoading(false);
      return;
    }

    fetchSession();
  }, [sessionId]);

  // Load Stripe.js
  useEffect(() => {
    loadStripe();
  }, []);

  // Set up Stripe Elements when we have both Stripe and client secret
  useEffect(() => {
    if (stripe && clientSecret && !elements) {
      // Wait for the DOM element to be available before mounting
      setTimeout(() => {
        const paymentElementContainer = document.getElementById('payment-element');
        if (paymentElementContainer) {
          setupStripeElements();
        }
      }, 100);
    }
  }, [stripe, clientSecret, elements]);

  const fetchSession = async () => {
    try {
      console.log('Fetching session data for:', sessionId);
      const response = await fetch(`/api/public/funding/sessions/${sessionId}`);
      
      console.log('Session API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Session API error:', errorText);
        throw new Error('Session not found or expired');
      }
      
      const sessionData = await response.json();
      console.log('Session data received:', sessionData);
      
      setSession(sessionData);
      setClientSecret(sessionData.clientSecret);
      
      console.log('Session state updated, clientSecret:', !!sessionData.clientSecret);
      
    } catch (err) {
      console.error('fetchSession error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load payment session');
    } finally {
      setLoading(false);
    }
  };

  const loadStripe = async () => {
    // Get Stripe publishable key from environment variables
    const stripePublishableKey = import.meta.env?.VITE_STRIPE_PUBLISHABLE_KEY || 
                                 (typeof process !== 'undefined' && process.env?.VITE_STRIPE_PUBLISHABLE_KEY) ||
                                 'pk_test_51QbNAYQ7j9Mb5amoBqq2y0PpAMgpGneEFyn6TU62PHLr8CDF8A5GONwmaiWpfKRmxh0UFb2GdeVbeps9d1vpPly2004ZtfwdVE'; // fallback for testing

    if (window.Stripe) {
      setStripe(window.Stripe(stripePublishableKey));
      return;
    }

    // Load Stripe.js script
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      setStripe(window.Stripe(stripePublishableKey));
    };
    script.onerror = () => {
      setError('Failed to load Stripe. Please refresh and try again.');
    };
    document.head.appendChild(script);
  };

  const setupStripeElements = () => {
    if (!stripe || !clientSecret) return;

    try {
      const elementsInstance = stripe.elements({
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      });

      // Create and mount the payment element
      const paymentElement = elementsInstance.create('payment');
      
      // Check if the element exists before mounting
      const container = document.getElementById('payment-element');
      if (!container) {
        console.error('Payment element container not found');
        setError('Payment form could not be loaded. Please refresh and try again.');
        return;
      }

      paymentElement.mount('#payment-element');
      setElements(elementsInstance);
      
      // Handle mounting errors
      paymentElement.on('ready', () => {
        console.log('Payment element is ready');
      });
      
      paymentElement.on('change', (event: any) => {
        if (event.error) {
          setError(event.error.message);
        } else {
          setError(null);
        }
      });
      
    } catch (err) {
      console.error('Error setting up Stripe Elements:', err);
      setError('Failed to load payment form. Please refresh and try again.');
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements) return;

    setPaymentStatus('processing');

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message);
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + `/pay/${sessionId}/complete`,
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      setPaymentStatus('success');
      
      // Redirect after success if URLs are provided
      setTimeout(() => {
        if (session?.metadata?.successUrl) {
          window.location.href = session.metadata.successUrl;
        }
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setPaymentStatus('error');
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusIcon = () => {
    switch (session?.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      case 'expired':
        return <Clock className="h-6 w-6 text-orange-500" />;
      default:
        return <CreditCard className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (session?.status) {
      case 'completed':
        return 'Payment completed successfully!';
      case 'failed':
        return 'Payment failed. Please try again.';
      case 'expired':
        return 'This payment session has expired.';
      default:
        return 'Complete your payment below';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg">Loading payment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-red-500" />
              <CardTitle>Payment Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The payment session could not be found or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completed/failed/expired states
  if (session.status !== 'created') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <CardTitle>Payment Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-lg">{getStatusMessage()}</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Amount:</span>
                <span className="font-semibold">{formatCurrency(session.amount, session.currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CreditCard className="h-6 w-6 text-blue-500" />
                <CardTitle>Secure Payment</CardTitle>
              </div>
              <CardDescription>
                Complete your wallet funding payment
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Payment Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span>Amount:</span>
                  <span className="text-2xl font-bold">{formatCurrency(session.amount, session.currency)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Wallet ID:</span>
                  <span className="font-mono">{session.walletId.slice(0, 8)}...</span>
                </div>
              </div>

              <Separator />

              {/* Payment Form */}
              {paymentStatus === 'success' ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-green-700">Payment Successful!</h3>
                  <p className="text-gray-600">Your wallet has been funded successfully.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Stripe Elements will be mounted here */}
                  <div id="payment-element">
                    {/* This will be populated by Stripe Elements */}
                  </div>
                  
                  {error && (
                    <Alert>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={handlePayment}
                    disabled={!stripe || !elements || paymentStatus === 'processing'}
                    className="w-full"
                    size="lg"
                  >
                    {paymentStatus === 'processing' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : !elements ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading payment form...
                      </>
                    ) : (
                      `Pay ${formatCurrency(session.amount, session.currency)}`
                    )}
                  </Button>
                </div>
              )}

              {/* Security Notice */}
              <div className="text-xs text-gray-500 text-center">
                <p>🔒 This is a secure payment processed by Stripe.</p>
                <p>Your payment information is encrypted and secure.</p>
              </div>
            </CardContent>
          </Card>

          {/* Cancel Link */}
          {session.metadata?.cancelUrl && paymentStatus !== 'success' && (
            <div className="text-center mt-4">
              <a
                href={session.metadata.cancelUrl}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Cancel and return
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}