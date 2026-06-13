"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  ExternalLink,
  XCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface StripeConfig {
  secret_key: string;
  publishable_key: string;
  webhook_secret: string;
}

interface GatewayConfig {
  id: string;
  is_enabled: boolean;
  is_test_mode: boolean;
  sandbox_config: StripeConfig;
  live_config: StripeConfig;
}

interface StripeStatus {
  hasMonthlyPrices: boolean;
  hasYearlyPrices: boolean;
  hasCreditPackPrices: boolean;
}

export const StripeConfiguration = () => {
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [priceStatus, setPriceStatus] = useState<StripeStatus>({
    hasMonthlyPrices: false,
    hasYearlyPrices: false,
    hasCreditPackPrices: false,
  });
  const [healthStatus, setHealthStatus] = useState<{
    canConnect: boolean;
    lastChecked: Date | null;
    error?: string;
  }>({ canConnect: false, lastChecked: null });

  const [sandboxConfig, setSandboxConfig] = useState<StripeConfig>({
    secret_key: "",
    publishable_key: "",
    webhook_secret: "",
  });

  const [liveConfig, setLiveConfig] = useState<StripeConfig>({
    secret_key: "",
    publishable_key: "",
    webhook_secret: "",
  });

  useEffect(() => {
    loadConfig();
    checkPriceConfiguration();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway", "stripe")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setConfig(data as unknown as GatewayConfig);
        const sandboxData = data.sandbox_config as unknown as StripeConfig | null;
        const liveData = data.live_config as unknown as StripeConfig | null;
        setSandboxConfig(sandboxData || { secret_key: "", publishable_key: "", webhook_secret: "" });
        setLiveConfig(liveData || { secret_key: "", publishable_key: "", webhook_secret: "" });
      } else {
        // Create default config if doesn't exist
        const { data: newData, error: insertError } = await apiClient
          .from("payment_gateway_configs")
          .insert({
            gateway: "stripe",
            is_enabled: true,
            is_test_mode: true,
            sandbox_config: { secret_key: "", publishable_key: "", webhook_secret: "" },
            live_config: { secret_key: "", publishable_key: "", webhook_secret: "" },
          })
          .select()
          .single();

        if (!insertError && newData) {
          setConfig(newData as unknown as GatewayConfig);
        }
      }
    } catch (error) {
      console.error("Error loading Stripe config:", error);
      toast.error("Failed to load Stripe configuration");
    } finally {
      setLoading(false);
    }
  };

  const checkPriceConfiguration = async () => {
    try {
      const { data: plans } = await apiClient
        .from("subscription_plans")
        .select("stripe_price_id, stripe_yearly_price_id, tier")
        .neq("tier", "free");

      const { data: packs } = await apiClient
        .from("credit_packs")
        .select("stripe_price_id")
        .eq("is_active", true);

      setPriceStatus({
        hasMonthlyPrices: plans?.some((p: any) => p.stripe_price_id) ?? false,
        hasYearlyPrices: plans?.some((p: any) => p.stripe_yearly_price_id) ?? false,
        hasCreditPackPrices: packs?.some((p: any) => p.stripe_price_id) ?? false,
      });
    } catch (error) {
      console.error("Error checking price config:", error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await apiClient
        .from("payment_gateway_configs")
        .update({
          is_enabled: config?.is_enabled ?? true,
          is_test_mode: config?.is_test_mode ?? true,
          sandbox_config: JSON.parse(JSON.stringify(sandboxConfig)),
          live_config: JSON.parse(JSON.stringify(liveConfig)),
        })
        .eq("gateway", "stripe");

      if (error) throw error;

      toast.success("Stripe configuration saved");
      await loadConfig();
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (enabled: boolean) => {
    setConfig((prev) => prev ? { ...prev, is_enabled: enabled } : null);
  };

  const toggleTestMode = async (testMode: boolean) => {
    setConfig((prev) => prev ? { ...prev, is_test_mode: testMode } : null);
  };

  const testConnection = async () => {
    const currentConfig = config?.is_test_mode ? sandboxConfig : liveConfig;
    
    if (!currentConfig.secret_key) {
      setHealthStatus({
        canConnect: false,
        lastChecked: new Date(),
        error: "Missing Secret Key",
      });
      toast.error("Please enter a Secret Key to test the connection");
      return;
    }

    try {
      // We can't directly test Stripe from the frontend due to CORS
      // Instead we check if the key format is valid
      const keyPrefix = currentConfig.secret_key.substring(0, 7);
      const isTestKey = keyPrefix === "sk_test";
      const isLiveKey = keyPrefix === "sk_live";

      if (!isTestKey && !isLiveKey) {
        setHealthStatus({
          canConnect: false,
          lastChecked: new Date(),
          error: "Invalid key format",
        });
        toast.error("Secret key should start with sk_test_ or sk_live_");
        return;
      }

      // Verify mode matches key type
      if (config?.is_test_mode && isLiveKey) {
        toast.warning("You have a live key but test mode is enabled");
      } else if (!config?.is_test_mode && isTestKey) {
        toast.warning("You have a test key but live mode is enabled");
      }

      setHealthStatus({
        canConnect: true,
        lastChecked: new Date(),
      });
      toast.success("Stripe key format is valid");
    } catch (error) {
      setHealthStatus({
        canConnect: false,
        lastChecked: new Date(),
        error: "Validation error",
      });
      toast.error("Failed to validate Stripe key");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/functions/v1/stripe-webhook`;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentConfig = config?.is_test_mode ? sandboxConfig : liveConfig;
  const isConfigured = !!currentConfig.secret_key;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#635BFF]/10">
                <CreditCard className="w-5 h-5 text-[#635BFF]" />
              </div>
              <div>
                <CardTitle>Stripe Configuration</CardTitle>
                <CardDescription>Accept card payments via Stripe</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="stripe-enabled" className="text-sm">Enable</Label>
                <Switch
                  id="stripe-enabled"
                  checked={config?.is_enabled ?? true}
                  onCheckedChange={toggleEnabled}
                />
              </div>
              <Badge className={config?.is_enabled ? "bg-primary/20 text-primary border-0" : "bg-muted text-muted-foreground"}>
                {config?.is_enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mode Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-lg border ${
            config?.is_test_mode 
              ? "bg-amber-500/10 border-amber-500/20" 
              : "bg-primary/10 border-primary/20"
          }`}>
            <div className="flex items-center gap-3">
              {config?.is_test_mode ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <Shield className="w-5 h-5 text-primary" />
              )}
              <div>
                <p className={`font-medium ${config?.is_test_mode ? "text-amber-600 dark:text-amber-400" : "text-primary"}`}>
                  {config?.is_test_mode ? "Test Mode Active" : "Live Mode Active"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config?.is_test_mode
                    ? "Using Stripe sandbox environment for development"
                    : "Processing real payments with live credentials"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={config?.is_test_mode ? "text-amber-500 border-amber-500" : "text-primary border-primary"}>
                {config?.is_test_mode ? "Sandbox" : "Live"}
              </Badge>
              <div className="flex items-center gap-2">
                <Label htmlFor="stripe-test-mode" className="text-sm">Test Mode</Label>
                <Switch
                  id="stripe-test-mode"
                  checked={config?.is_test_mode ?? true}
                  onCheckedChange={toggleTestMode}
                />
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              {healthStatus.canConnect ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : healthStatus.lastChecked ? (
                <XCircle className="w-5 h-5 text-destructive" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium text-sm">Connection Status</p>
                <p className="text-xs text-muted-foreground">
                  {healthStatus.lastChecked
                    ? healthStatus.canConnect
                      ? "Key format validated"
                      : healthStatus.error || "Validation failed"
                    : "Not tested yet"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={testConnection} disabled={!isConfigured}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Validate Key
            </Button>
          </div>

          <Separator />

          {/* Credentials Tabs */}
          <Tabs defaultValue="sandbox" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sandbox">Test Credentials</TabsTrigger>
              <TabsTrigger value="live">Live Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="sandbox" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Publishable Key</Label>
                  <Input
                    value={sandboxConfig.publishable_key}
                    onChange={(e) => setSandboxConfig((prev) => ({ ...prev, publishable_key: e.target.value }))}
                    placeholder="pk_test_..."
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Public key used in frontend checkout forms
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["sandbox_secret"] ? "text" : "password"}
                      value={sandboxConfig.secret_key}
                      onChange={(e) => setSandboxConfig((prev) => ({ ...prev, secret_key: e.target.value }))}
                      placeholder="sk_test_..."
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility("sandbox_secret")}
                    >
                      {showSecrets["sandbox_secret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Private key for server-side API calls
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["sandbox_webhook"] ? "text" : "password"}
                      value={sandboxConfig.webhook_secret}
                      onChange={(e) => setSandboxConfig((prev) => ({ ...prev, webhook_secret: e.target.value }))}
                      placeholder="whsec_..."
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility("sandbox_webhook")}
                    >
                      {showSecrets["sandbox_webhook"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used to verify webhook signatures
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="live" className="space-y-4">
              <Alert className="border-destructive/50 bg-destructive/10">
                <Shield className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  These credentials will process real payments. Double-check before saving.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Publishable Key</Label>
                  <Input
                    value={liveConfig.publishable_key}
                    onChange={(e) => setLiveConfig((prev) => ({ ...prev, publishable_key: e.target.value }))}
                    placeholder="pk_live_..."
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["live_secret"] ? "text" : "password"}
                      value={liveConfig.secret_key}
                      onChange={(e) => setLiveConfig((prev) => ({ ...prev, secret_key: e.target.value }))}
                      placeholder="sk_live_..."
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility("live_secret")}
                    >
                      {showSecrets["live_secret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["live_webhook"] ? "text" : "password"}
                      value={liveConfig.webhook_secret}
                      onChange={(e) => setLiveConfig((prev) => ({ ...prev, webhook_secret: e.target.value }))}
                      placeholder="whsec_..."
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility("live_webhook")}
                    >
                      {showSecrets["live_webhook"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Configuration Status */}
          <div className="space-y-4">
            <h4 className="font-medium">Price Configuration Status</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {priceStatus.hasMonthlyPrices ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <div>
                  <p className="font-medium text-sm">Monthly Plans</p>
                  <p className="text-xs text-muted-foreground">
                    {priceStatus.hasMonthlyPrices ? "Configured" : "Missing"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {priceStatus.hasYearlyPrices ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <div>
                  <p className="font-medium text-sm">Yearly Plans</p>
                  <p className="text-xs text-muted-foreground">
                    {priceStatus.hasYearlyPrices ? "Configured" : "Missing"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {priceStatus.hasCreditPackPrices ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <div>
                  <p className="font-medium text-sm">Credit Packs</p>
                  <p className="text-xs text-muted-foreground">
                    {priceStatus.hasCreditPackPrices ? "Configured" : "Missing"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Webhook URL */}
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(webhookUrl, "Webhook URL")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Add this URL in Stripe Dashboard → Developers → Webhooks
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" asChild>
              <a
                href={config?.is_test_mode
                  ? "https://dashboard.stripe.com/test/dashboard"
                  : "https://dashboard.stripe.com/dashboard"}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Stripe Dashboard
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button onClick={saveConfig} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      <Alert className="border-primary/20 bg-primary/5">
        <Shield className="w-4 h-4 text-primary" />
        <AlertDescription>
          Stripe credentials are stored securely in the database and only accessible by admins.
          Stripe handles all PCI compliance - card data never touches your servers.
        </AlertDescription>
      </Alert>
    </div>
  );
};
