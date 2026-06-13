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
  Bitcoin,
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

interface CoinbaseConfig {
  api_key: string;
  webhook_secret: string;
}

interface GatewayConfig {
  id: string;
  is_enabled: boolean;
  is_test_mode: boolean;
  sandbox_config: CoinbaseConfig;
  live_config: CoinbaseConfig;
}

export const CoinbaseConfiguration = () => {
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [healthStatus, setHealthStatus] = useState<{
    canConnect: boolean;
    lastChecked: Date | null;
    error?: string;
  }>({ canConnect: false, lastChecked: null });

  const [sandboxConfig, setSandboxConfig] = useState<CoinbaseConfig>({
    api_key: "",
    webhook_secret: "",
  });

  const [liveConfig, setLiveConfig] = useState<CoinbaseConfig>({
    api_key: "",
    webhook_secret: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient
        .from("payment_gateway_configs")
        .select("*")
        .eq("gateway", "coinbase")
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setConfig(data as unknown as GatewayConfig);
        const sandboxData = data.sandbox_config as unknown as CoinbaseConfig | null;
        const liveData = data.live_config as unknown as CoinbaseConfig | null;
        setSandboxConfig(sandboxData || { api_key: "", webhook_secret: "" });
        setLiveConfig(liveData || { api_key: "", webhook_secret: "" });
      }
    } catch (error) {
      console.error("Error loading Coinbase config:", error);
      toast.error("Failed to load Coinbase configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const { error } = await apiClient
        .from("payment_gateway_configs")
        .update({
          is_enabled: config?.is_enabled ?? false,
          is_test_mode: config?.is_test_mode ?? true,
          sandbox_config: JSON.parse(JSON.stringify(sandboxConfig)),
          live_config: JSON.parse(JSON.stringify(liveConfig)),
        })
        .eq("gateway", "coinbase");

      if (error) throw error;

      toast.success("Coinbase configuration saved");
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
    
    if (!currentConfig.api_key) {
      setHealthStatus({
        canConnect: false,
        lastChecked: new Date(),
        error: "Missing API key",
      });
      return;
    }

    try {
      // Test by fetching charges (empty list is fine)
      const response = await fetch("https://api.commerce.coinbase.com/charges", {
        method: "GET",
        headers: {
          "X-CC-Api-Key": currentConfig.api_key,
          "X-CC-Version": "2018-03-22",
        },
      });

      if (response.ok) {
        setHealthStatus({
          canConnect: true,
          lastChecked: new Date(),
        });
        toast.success("Coinbase Commerce connection successful");
      } else {
        const error = await response.text();
        setHealthStatus({
          canConnect: false,
          lastChecked: new Date(),
          error: "Invalid API key",
        });
        toast.error("Coinbase Commerce connection failed");
      }
    } catch (error) {
      setHealthStatus({
        canConnect: false,
        lastChecked: new Date(),
        error: "Network error",
      });
      toast.error("Failed to connect to Coinbase Commerce");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_URL}/functions/v1/coinbase-webhook`;

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
  const isConfigured = !!currentConfig.api_key;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0052FF]/10">
                <Bitcoin className="w-5 h-5 text-[#0052FF]" />
              </div>
              <div>
                <CardTitle>Coinbase Commerce</CardTitle>
                <CardDescription>Accept cryptocurrency payments</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="coinbase-enabled" className="text-sm">Enable</Label>
                <Switch
                  id="coinbase-enabled"
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
                    ? "Using Coinbase Commerce sandbox for testing"
                    : "Processing real cryptocurrency payments"}
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
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["sandbox_key"] ? "text" : "password"}
                      value={sandboxConfig.api_key}
                      onChange={(e) => setSandboxConfig((prev) => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Sandbox API Key"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility("sandbox_key")}
                    >
                      {showSecrets["sandbox_key"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Webhook Shared Secret (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["sandbox_secret"] ? "text" : "password"}
                      value={sandboxConfig.webhook_secret}
                      onChange={(e) => setSandboxConfig((prev) => ({ ...prev, webhook_secret: e.target.value }))}
                      placeholder="Webhook shared secret for signature verification"
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
              </div>
            </TabsContent>

            <TabsContent value="live" className="space-y-4">
              <Alert className="border-destructive/50 bg-destructive/10">
                <Shield className="w-4 h-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  These credentials will process real cryptocurrency payments. Double-check before saving.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["live_key"] ? "text" : "password"}
                      value={liveConfig.api_key}
                      onChange={(e) => setLiveConfig((prev) => ({ ...prev, api_key: e.target.value }))}
                      placeholder="Live API Key"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleSecretVisibility("live_key")}
                    >
                      {showSecrets["live_key"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Webhook Shared Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showSecrets["live_secret"] ? "text" : "password"}
                      value={liveConfig.webhook_secret}
                      onChange={(e) => setLiveConfig((prev) => ({ ...prev, webhook_secret: e.target.value }))}
                      placeholder="Webhook shared secret for signature verification"
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
              Add this URL in Coinbase Commerce Dashboard → Settings → Webhook subscriptions
            </p>
          </div>

          {/* Supported Cryptocurrencies */}
          <div className="space-y-2">
            <Label>Supported Cryptocurrencies</Label>
            <div className="flex flex-wrap gap-2">
              {["Bitcoin (BTC)", "Ethereum (ETH)", "Litecoin (LTC)", "Dogecoin (DOGE)", "Bitcoin Cash (BCH)", "USDC", "DAI"].map((crypto) => (
                <Badge key={crypto} variant="secondary" className="text-xs">
                  {crypto}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button variant="outline" asChild>
              <a
                href="https://commerce.coinbase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Coinbase Dashboard
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
          Coinbase Commerce credentials are stored securely in the database and only accessible by admins.
          Cryptocurrency payments are non-reversible once confirmed on the blockchain.
        </AlertDescription>
      </Alert>
    </div>
  );
};
