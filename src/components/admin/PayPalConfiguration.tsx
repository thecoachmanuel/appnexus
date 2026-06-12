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
  Wallet,
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
import { supabase } from "@/integrations/supabase/client";

interface PayPalConfig {
  client_id: string;
  client_secret: string;
  webhook_id: string;
}

interface GatewayConfig {
  id: string;
  is_enabled: boolean;
  is_test_mode: boolean;
  sandbox_config: PayPalConfig;
  live_config: PayPalConfig;
}

export const PayPalConfiguration = () => {
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [healthStatus, setHealthStatus] = useState<{
    canConnect: boolean;
    lastChecked: Date | null;
    error?: string;
  }>({ canConnect: false, lastChecked: null });

  const [sandboxConfig, setSandboxConfig] = useState<PayPalConfig>({
    client_id: "",
    client_secret: "",
    webhook_id: "",
  });

  const [liveConfig, setLiveConfig] = useState<PayPalConfig>({
    client_id: "",
    client_secret: "",
    webhook_id: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway", "paypal")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setConfig(data as unknown as GatewayConfig);
        const sandboxData = data.sandbox_config as unknown as PayPalConfig | null;
        const liveData = data.live_config as unknown as PayPalConfig | null;
        setSandboxConfig(sandboxData || { client_id: "", client_secret: "", webhook_id: "" });
        setLiveConfig(liveData || { client_id: "", client_secret: "", webhook_id: "" });
      }
    } catch (error) {
      console.error("Error loading PayPal config:", error);
      toast.error("Failed to load PayPal configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("payment_gateway_configs")
        .update({
          is_enabled: config?.is_enabled ?? false,
          is_test_mode: config?.is_test_mode ?? true,
          sandbox_config: JSON.parse(JSON.stringify(sandboxConfig)),
          live_config: JSON.parse(JSON.stringify(liveConfig)),
        })
        .eq("gateway", "paypal");

      if (error) throw error;

      toast.success("PayPal configuration saved");
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
    
    if (!currentConfig.client_id || !currentConfig.client_secret) {
      setHealthStatus({
        canConnect: false,
        lastChecked: new Date(),
        error: "Missing credentials",
      });
      return;
    }

    try {
      // Test by making an OAuth token request
      const baseUrl = config?.is_test_mode
        ? "https://api-m.sandbox.paypal.com"
        : "https://api-m.paypal.com";

      const auth = btoa(`${currentConfig.client_id}:${currentConfig.client_secret}`);

      const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (response.ok) {
        setHealthStatus({
          canConnect: true,
          lastChecked: new Date(),
        });
        toast.success("PayPal connection successful");
      } else {
        const error = await response.text();
        setHealthStatus({
          canConnect: false,
          lastChecked: new Date(),
          error: "Invalid credentials",
        });
        toast.error("PayPal connection failed");
      }
    } catch (error) {
      setHealthStatus({
        canConnect: false,
        lastChecked: new Date(),
        error: "Network error",
      });
      toast.error("Failed to connect to PayPal");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const webhookUrl = `${process.env.VITE_SUPABASE_URL}/functions/v1/paypal-webhook`;

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
  const isConfigured = !!(currentConfig.client_id && currentConfig.client_secret);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0070BA]/10">
                <Wallet className="w-5 h-5 text-[#0070BA]" />
              </div>
              <div>
                <CardTitle>PayPal Configuration</CardTitle>
                <CardDescription>Accept payments via PayPal</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="paypal-enabled" className="text-sm">Enable</Label>
                <Switch
                  id="paypal-enabled"
                  checked={config?.is_enabled ?? false}
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
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              {config?.is_test_mode ? (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              ) : (
                <Shield className="w-5 h-5 text-primary" />
              )}
              <div>
                <p className="font-medium">
                  {config?.is_test_mode ? "Sandbox Mode" : "Live Mode"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {config?.is_test_mode
                    ? "Using PayPal sandbox for testing"
                    : "Processing real payments"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="test-mode" className="text-sm">Test Mode</Label>
              <Switch
                id="test-mode"
                checked={config?.is_test_mode ?? true}
                onCheckedChange={toggleTestMode}
              />
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
                      ? "Connected successfully"
                      : healthStatus.error || "Connection failed"
                    : "Not tested yet"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={testConnection} disabled={!isConfigured}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          </div>

          <Separator />

          {/* Credentials Tabs */}
          <Tabs defaultValue="sandbox" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sandbox">Sandbox Credentials</TabsTrigger>
              <TabsTrigger value="live">Live Credentials</TabsTrigger>
            </TabsList>

            <TabsContent value="sandbox" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={sandboxConfig.client_id}
                    onChange={(e) => setSandboxConfig((prev) => ({ ...prev, client_id: e.target.value }))}
                    placeholder="Sandbox Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["sandbox_secret"] ? "text" : "password"}
                      value={sandboxConfig.client_secret}
                      onChange={(e) => setSandboxConfig((prev) => ({ ...prev, client_secret: e.target.value }))}
                      placeholder="Sandbox Client Secret"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility("sandbox_secret")}
                    >
                      {showSecrets["sandbox_secret"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Webhook ID (Optional)</Label>
                  <Input
                    value={sandboxConfig.webhook_id}
                    onChange={(e) => setSandboxConfig((prev) => ({ ...prev, webhook_id: e.target.value }))}
                    placeholder="Webhook ID for signature verification"
                  />
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
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={liveConfig.client_id}
                    onChange={(e) => setLiveConfig((prev) => ({ ...prev, client_id: e.target.value }))}
                    placeholder="Live Client ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["live_secret"] ? "text" : "password"}
                      value={liveConfig.client_secret}
                      onChange={(e) => setLiveConfig((prev) => ({ ...prev, client_secret: e.target.value }))}
                      placeholder="Live Client Secret"
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
                <div className="space-y-2 sm:col-span-2">
                  <Label>Webhook ID</Label>
                  <Input
                    value={liveConfig.webhook_id}
                    onChange={(e) => setLiveConfig((prev) => ({ ...prev, webhook_id: e.target.value }))}
                    placeholder="Webhook ID for signature verification"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
              Add this URL in PayPal Developer Dashboard → Webhooks
            </p>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" asChild>
              <a
                href={config?.is_test_mode
                  ? "https://developer.paypal.com/dashboard/applications/sandbox"
                  : "https://developer.paypal.com/dashboard/applications/live"}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open PayPal Dashboard
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
          PayPal credentials are stored securely in the database and only accessible by admins.
          Never share your Client Secret publicly.
        </AlertDescription>
      </Alert>
    </div>
  );
};
