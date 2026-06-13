"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Building2,
  Bitcoin,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  Shield,
  Copy,
  RefreshCw,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { PayPalConfiguration } from "./PayPalConfiguration";
import { PayPalBillingPlans } from "./PayPalBillingPlans";
import { CoinbaseConfiguration } from "./CoinbaseConfiguration";
import { StripeConfiguration } from "./StripeConfiguration";
import { WebhookEventLogs } from "./WebhookEventLogs";

interface PaymentGateway {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: "active" | "inactive" | "coming_soon";
  configured: boolean;
  testMode: boolean;
}

interface StripeStatus {
  connected: boolean;
  testMode: boolean;
  hasMonthlyPrices: boolean;
  hasYearlyPrices: boolean;
  hasCreditPackPrices: boolean;
  webhookConfigured: boolean;
}

interface PayPalStatus {
  enabled: boolean;
  configured: boolean;
  testMode: boolean;
}

interface CoinbaseStatus {
  enabled: boolean;
  configured: boolean;
  testMode: boolean;
}

interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  iban: string;
}

const DEFAULT_BANK_DETAILS: BankDetails = {
  bankName: "Example Bank",
  accountName: "Your Company Inc.",
  accountNumber: "XXXX-XXXX-1234",
  routingNumber: "XXX-XXX-XXX",
  swiftCode: "EXAMPXXX",
  iban: "XX00 XXXX 0000 0000 0000 00",
};

export const PaymentGatewayManager = () => {
  const [stripeStatus, setStripeStatus] = useState<StripeStatus>({
    connected: false,
    testMode: true,
    hasMonthlyPrices: false,
    hasYearlyPrices: false,
    hasCreditPackPrices: false,
    webhookConfigured: false,
  });
  const [paypalStatus, setPaypalStatus] = useState<PayPalStatus>({
    enabled: false,
    configured: false,
    testMode: true,
  });
  const [coinbaseStatus, setCoinbaseStatus] = useState<CoinbaseStatus>({
    enabled: false,
    configured: false,
    testMode: true,
  });
  const [loading, setLoading] = useState(true);
  const [bankDetails, setBankDetails] = useState<BankDetails>(DEFAULT_BANK_DETAILS);
  const [savingBank, setSavingBank] = useState(false);

  // Load bank details from system_settings
  const loadBankDetails = useCallback(async () => {
    try {
      const { data } = await apiClient
        .from("system_settings")
        .select("value")
        .eq("key", "bank_transfer_details")
        .maybeSingle();
      if (data?.value) {
        const parsed = typeof data.value === "string" ? JSON.parse(data.value as string) : data.value;
        setBankDetails(prev => ({ ...prev, ...(parsed as Record<string, string>) }));
      }
    } catch (err) {
      console.error("Failed to load bank details:", err);
    }
  }, []);

  const saveBankDetails = async () => {
    setSavingBank(true);
    try {
      const { data: existing } = await apiClient
        .from("system_settings")
        .select("id")
        .eq("key", "bank_transfer_details")
        .maybeSingle();

      const jsonValue = bankDetails as any;
      if (existing) {
        const { error } = await apiClient
          .from("system_settings")
          .update({ value: jsonValue })
          .eq("key", "bank_transfer_details");
        if (error) throw error;
      } else {
        const { error } = await apiClient
          .from("system_settings")
          .insert([{ key: "bank_transfer_details", value: jsonValue, category: "payments", description: "Bank transfer details for manual payments" }]);
        if (error) throw error;
      }
      toast.success("Bank details saved successfully");
    } catch (err: any) {
      toast.error("Failed to save bank details: " + err.message);
    } finally {
      setSavingBank(false);
    }
  };

  useEffect(() => {
    checkConfiguration();
    loadBankDetails();
  }, [loadBankDetails]);

  const checkConfiguration = async () => {
    setLoading(true);
    await Promise.all([checkStripeConfiguration(), checkPayPalStatus(), checkCoinbaseStatus()]);
    setLoading(false);
  };

  const checkPayPalStatus = async () => {
    try {
      const { data } = await apiClient
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway", "paypal")
        .single();

      if (data) {
        const configData = data.is_test_mode ? data.sandbox_config : data.live_config;
        const hasCredentials = !!(configData as any)?.client_id && !!(configData as any)?.client_secret;
        
        setPaypalStatus({
          enabled: data.is_enabled,
          configured: hasCredentials,
          testMode: data.is_test_mode,
        });
      }
    } catch (error) {
      console.error("Error checking PayPal config:", error);
    }
  };

  const checkCoinbaseStatus = async () => {
    try {
      const { data } = await apiClient
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway", "coinbase")
        .single();

      if (data) {
        const configData = data.is_test_mode ? data.sandbox_config : data.live_config;
        const hasCredentials = !!(configData as any)?.api_key;
        
        setCoinbaseStatus({
          enabled: data.is_enabled ?? false,
          configured: hasCredentials,
          testMode: data.is_test_mode ?? true,
        });
      }
    } catch (error) {
      console.error("Error checking Coinbase config:", error);
    }
  };

  const checkStripeConfiguration = async () => {
    try {
      const { data: stripeConfig } = await apiClient
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway", "stripe")
        .single();

      const { data: plans } = await apiClient
        .from("subscription_plans")
        .select("stripe_price_id, stripe_yearly_price_id, tier")
        .neq("tier", "free");

      const { data: packs } = await apiClient
        .from("credit_packs")
        .select("stripe_price_id")
        .eq("is_active", true);

      const hasMonthlyPrices = plans?.some((p: any) => p.stripe_price_id) ?? false;
      const hasYearlyPrices = plans?.some((p: any) => p.stripe_yearly_price_id) ?? false;
      const hasCreditPackPrices = packs?.some((p: any) => p.stripe_price_id) ?? false;

      const configData = stripeConfig?.is_test_mode ? stripeConfig?.sandbox_config : stripeConfig?.live_config;

      setStripeStatus({
        connected: stripeConfig?.is_enabled ?? true,
        testMode: stripeConfig?.is_test_mode ?? true,
        hasMonthlyPrices,
        hasYearlyPrices,
        hasCreditPackPrices,
        webhookConfigured: !!(configData as any)?.webhook_secret,
      });
    } catch (error) {
      console.error("Error checking Stripe config:", error);
    }
  };

  const gateways: PaymentGateway[] = [
    {
      id: "stripe",
      name: "Stripe",
      description: "Credit/debit cards, Apple Pay, Google Pay",
      icon: CreditCard,
      status: stripeStatus.connected ? "active" : "inactive",
      configured: stripeStatus.hasMonthlyPrices,
      testMode: stripeStatus.testMode,
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "PayPal accounts and credit cards",
      icon: Wallet,
      status: paypalStatus.enabled ? "active" : "inactive",
      configured: paypalStatus.configured,
      testMode: paypalStatus.testMode,
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      description: "Manual wire transfers with verification",
      icon: Building2,
      status: "active",
      configured: true,
      testMode: false,
    },
    {
      id: "crypto",
      name: "Cryptocurrency",
      description: "Bitcoin, Ethereum, and other cryptocurrencies",
      icon: Bitcoin,
      status: coinbaseStatus.enabled ? "active" : "inactive",
      configured: coinbaseStatus.configured,
      testMode: coinbaseStatus.testMode,
    },
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };


  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/functions/v1/stripe-webhook`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Configure credentials, modes, and webhook endpoints</p>
        <Button
          variant="outline"
          size="sm"
          onClick={checkConfiguration}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Gateway Status Summary */}
      <div className="flex flex-wrap gap-2">
        {gateways.map((gateway) => {
          const Icon = gateway.icon;
          return (
            <Badge key={gateway.id} variant="outline" className="gap-1.5 py-1.5 px-3">
              <Icon className="w-3.5 h-3.5" />
              {gateway.name}
              {gateway.status === "active" ? (
                <CheckCircle2 className="w-3 h-3 text-primary" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-muted-foreground" />
              )}
              {gateway.testMode && gateway.status === "active" && (
                <span className="text-xs text-amber-500">Test</span>
              )}
            </Badge>
          );
        })}
      </div>

      <Tabs defaultValue="stripe" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
          <TabsTrigger value="coinbase">Crypto</TabsTrigger>
          <TabsTrigger value="bank">Bank Transfer</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="stripe" className="space-y-4">
          <StripeConfiguration />
        </TabsContent>

        <TabsContent value="paypal" className="space-y-4">
          <PayPalConfiguration />
          <Separator />
          <PayPalBillingPlans />
        </TabsContent>

        <TabsContent value="coinbase" className="space-y-4">
          <CoinbaseConfiguration />
        </TabsContent>

        {/* Bank Transfer Configuration - now persisted */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Bank Transfer Details</CardTitle>
                  <CardDescription>
                    Display these details to customers for manual transfers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={bankDetails.bankName}
                    onChange={e => setBankDetails(p => ({ ...p, bankName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input
                    value={bankDetails.accountName}
                    onChange={e => setBankDetails(p => ({ ...p, accountName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={bankDetails.accountNumber}
                    onChange={e => setBankDetails(p => ({ ...p, accountNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Routing Number</Label>
                  <Input
                    value={bankDetails.routingNumber}
                    onChange={e => setBankDetails(p => ({ ...p, routingNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>SWIFT Code</Label>
                  <Input
                    value={bankDetails.swiftCode}
                    onChange={e => setBankDetails(p => ({ ...p, swiftCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>IBAN</Label>
                  <Input
                    value={bankDetails.iban}
                    onChange={e => setBankDetails(p => ({ ...p, iban: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={loadBankDetails}>Cancel</Button>
                <Button onClick={saveBankDetails} disabled={savingBank}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingBank ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Bank transfers require manual verification. Review pending transfers in the Payments section.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Webhooks Configuration */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Webhook Endpoints</CardTitle>
                  <CardDescription>
                    Configure webhook URLs for payment notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Stripe Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Add this URL in your Stripe Dashboard → Developers → Webhooks
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Required Events</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    "checkout.session.completed",
                    "customer.subscription.created",
                    "customer.subscription.updated",
                    "customer.subscription.deleted",
                    "invoice.payment_succeeded",
                    "invoice.payment_failed",
                  ].map((event) => (
                    <div key={event} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm font-mono">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="truncate">{event}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <Alert className="border-primary/20 bg-primary/5">
                <Shield className="w-4 h-4 text-primary" />
                <AlertDescription>
                  The STRIPE_WEBHOOK_SECRET is configured. Make sure the webhook endpoint in Stripe matches the URL above.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <WebhookEventLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};
