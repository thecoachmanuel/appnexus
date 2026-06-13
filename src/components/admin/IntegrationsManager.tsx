"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { toast } from "sonner";
import { Mail, Smartphone, Brain, Key, Save, Eye, EyeOff, CheckCircle2, XCircle, RefreshCw, Loader2, Server, Send } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface IntegrationKey {
  id?: string;
  name: string;
  provider: string;
  api_key_masked: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
}

const INTEGRATIONS = [
  {
    key: "resend",
    label: "Resend",
    icon: Mail,
    description: "Email delivery service for transactional emails",
    fields: [
      { name: "api_key", label: "API Key", placeholder: "re_xxxxxxxxxx" },
      { name: "from_email", label: "From Email", placeholder: "noreply@yourdomain.com", type: "email" },
    ],
  },
  {
    key: "appetize",
    label: "Appetize.io",
    icon: Smartphone,
    description: "Live mobile app previews in the browser",
    fields: [
      { name: "api_key", label: "API Token", placeholder: "tok_xxxxxxxxxx" },
      { name: "timeout_seconds", label: "Upload Timeout (seconds)", placeholder: "30", type: "number" },
      { name: "max_retries", label: "Max Retries", placeholder: "3", type: "number" },
    ],
  },
  {
    key: "ai",
    label: "OpenAI & Gemini",
    icon: Brain,
    description: "Configure OpenAI and Google Gemini API keys for the AI assistant",
    fields: [
      { name: "openai_api_key", label: "OpenAI API Key", placeholder: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { name: "gemini_api_key", label: "Gemini API Key", placeholder: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
      { name: "model", label: "Default Model", placeholder: "Select a model", options: [
        { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (Preview)" },
        { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro (Preview)" },
        { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
        { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
        { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
        { value: "openai/gpt-5", label: "GPT-5" },
        { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
        { value: "openai/gpt-5-nano", label: "GPT-5 Nano" },
        { value: "openai/gpt-5.2", label: "GPT-5.2" },
      ]},
      { name: "provider", label: "Active Provider", placeholder: "Select provider", options: [
        { value: "gemini", label: "Google Gemini" },
        { value: "openai", label: "OpenAI" },
      ]},
    ],
  },
  {
    key: "github",
    label: "GitHub Actions",
    icon: Server,
    description: "Cloud build pipeline for compiling Android APKs via GitHub Actions",
    fields: [
      { name: "github_pat", label: "Personal Access Token", placeholder: "ghp_xxxxxxxxxxxx" },
      { name: "repo_owner", label: "Repository Owner", placeholder: "e.g., octocat" },
      { name: "repo_name", label: "Repository Name", placeholder: "e.g., hello-world" },
      { name: "workflow_id", label: "Workflow Filename", placeholder: "build-android.yml" },
    ],
  },
] as const;

export const IntegrationsManager = ({ loading = false, isDemo = false }: { loading?: boolean; isDemo?: boolean }) => {
  const { settings } = useSystemSettings();
  const [configs, setConfigs] = useState<Record<string, IntegrationKey>>({});
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [showWizard, setShowWizard] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [syncingAppId, setSyncingAppId] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const { data, error } = await apiClient
      .from("api_configurations")
      .select("*")
      .in("provider", ["resend", "appetize", "ai", "github"]);

    if (error) {
      console.error("Error fetching integration configs:", error);
      return;
    }

    const mapped: Record<string, IntegrationKey> = {};
    const values: Record<string, Record<string, string>> = {};

    (data || []).forEach((row: any) => {
      mapped[row.provider] = {
        id: row.id,
        name: row.name,
        provider: row.provider,
        api_key_masked: row.api_key_masked,
        is_active: row.is_active,
        config: (row.config as Record<string, unknown>) || {},
      };
      const cfg = (row.config as Record<string, string>) || {};
      values[row.provider] = {};
      const integration = INTEGRATIONS.find((i) => i.key === row.provider);
      integration?.fields.forEach((f) => {
        values[row.provider][f.name] = cfg[f.name] || "";
      });
    });

    setConfigs(mapped);
    setFormValues(values);
  };

  const handleFieldChange = (provider: string, field: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [provider]: { ...(prev[provider] || {}), [field]: value },
    }));
  };

  const handleSave = async (providerKey: string) => {
    setSaving(providerKey);
    const integration = INTEGRATIONS.find((i) => i.key === providerKey)!;
    const values = formValues[providerKey] || {};

    const configPayload: Record<string, string> = {};
    integration.fields.forEach((f) => {
      if (values[f.name]) configPayload[f.name] = values[f.name];
    });

    const apiKeyValue = values["api_key"] || "";
    const masked = apiKeyValue
      ? `${"*".repeat(Math.max(0, apiKeyValue.length - 4))}${apiKeyValue.slice(-4)}`
      : null;

    const existing = configs[providerKey];

    if (existing?.id) {
      const { error } = await apiClient
        .from("api_configurations")
        .update({
          config: configPayload,
          api_key_masked: masked,
          is_active: true,
        })
        .eq("id", existing.id);

      if (error) {
        toast.error("Failed to update configuration");
        console.error(error);
      } else {
        toast.success(`${integration.label} configuration updated`);
      }
    } else {
      const { error } = await apiClient.from("api_configurations").insert({
        name: integration.label,
        provider: providerKey,
        config: configPayload,
        api_key_masked: masked,
        is_active: true,
      });

      if (error) {
        toast.error("Failed to save configuration");
        console.error(error);
      } else {
        toast.success(`${integration.label} configuration saved`);
      }
    }

    await fetchConfigs();
    setSaving(null);
  };

  const handleTestConnection = async (providerKey: string) => {
    setTesting(providerKey);
    const values = formValues[providerKey] || {};

    try {
      switch (providerKey) {
        case "resend": {
          const apiKey = values["api_key"];
          if (!apiKey) throw new Error("API Key is required");
          if (!apiKey.startsWith("re_")) throw new Error("Invalid API key format — Resend keys start with 're_'");
          // Resend API blocks browser CORS, so validate format only
          setTestResults((prev) => ({ ...prev, [providerKey]: { success: true, message: "Resend API key format valid. Save to apply." } }));
          toast.success("Resend API key format validated");
          break;
        }
        case "appetize": {
          const apiKey = values["api_key"];
          if (!apiKey) throw new Error("API Token is required");
          const res = await fetch("https://api.appetize.io/v2/apps", {
            headers: { Authorization: `Basic ${btoa(apiKey + ":")}` },
          });
          if (!res.ok) throw new Error("Invalid API token");
          setTestResults((prev) => ({ ...prev, [providerKey]: { success: true, message: "Connected to Appetize.io" } }));
          toast.success("Appetize.io connection successful");
          break;
        }
        case "ai": {
          const activeProvider = (values["provider"] || "gemini").toLowerCase();
          if (activeProvider === "openai") {
            const apiKey = values["openai_api_key"];
            if (!apiKey) throw new Error("OpenAI API Key is required");
            const res = await fetch("https://api.openai.com/v1/models", {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!res.ok) throw new Error("Invalid OpenAI API key");
            setTestResults((prev) => ({ ...prev, [providerKey]: { success: true, message: "Connected to OpenAI" } }));
            toast.success("OpenAI connection successful");
          } else {
            const apiKey = values["gemini_api_key"];
            if (!apiKey) throw new Error("Gemini API Key is required");
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!res.ok) throw new Error("Invalid Gemini API key");
            setTestResults((prev) => ({ ...prev, [providerKey]: { success: true, message: "Connected to Gemini" } }));
            toast.success("Gemini connection successful");
          }
          break;
        }
        case "github": {
          const pat = values["github_pat"];
          if (!pat) throw new Error("Personal Access Token is required");
          const res = await fetch("https://api.github.com/user", {
            headers: { Authorization: `token ${pat}`, "User-Agent": "AppForge-Setup" },
          });
          if (!res.ok) throw new Error(`Invalid GitHub PAT (${res.status})`);
          const data = await res.json();
          setTestResults((prev) => ({ ...prev, [providerKey]: { success: true, message: `Connected as ${data.login}` } }));
          toast.success("GitHub connection successful");
          break;
        }
        default:
          throw new Error("Unknown provider");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      setTestResults((prev) => ({ ...prev, [providerKey]: { success: false, message } }));
      toast.error(message);
    } finally {
      setTesting(null);
    }
  };

  const handleSendTestEmail = async () => {
    const email = testEmailAddress.trim();
    if (!email) {
      toast.error("Please enter a recipient email address");
      return;
    }
    setSendingTestEmail(true);
    try {
      const { data, error } = await apiClient.functions.invoke("send-email", {
        body: {
          to: email,
          templateName: "test_email",
          variables: { app_name: settings.app_name },
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Test email sent to ${email}`);
      } else {
        toast.error(data?.message || data?.error || "Failed to send test email");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send test email";
      toast.error(message);
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const GitHubSetupWizard = lazy(() => import("./GitHubSetupWizard"));

  // Check if GitHub is configured
  const githubConfigured = !!configs["github"]?.id;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Configure API keys for external services used across the app
        </p>
      </div>

      {/* GitHub Setup Wizard Banner */}
      {!githubConfigured && !showWizard && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Build Pipeline Not Configured</p>
                <p className="text-xs text-muted-foreground">Set up GitHub Actions to compile Android APKs</p>
              </div>
            </div>
            <Button size="sm" onClick={() => setShowWizard(true)} disabled={isDemo}>
              Setup Wizard
            </Button>
          </CardContent>
        </Card>
      )}

      {showWizard && (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <GitHubSetupWizard onClose={() => { setShowWizard(false); fetchConfigs(); }} />
        </Suspense>
      )}

      <Tabs defaultValue="resend" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {INTEGRATIONS.map((int) => (
            <TabsTrigger key={int.key} value={int.key} className="gap-2">
              <int.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{int.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {INTEGRATIONS.map((integration) => {
          const config = configs[integration.key];
          const values = formValues[integration.key] || {};
          const isConfigured = !!config?.id;

          return (
            <TabsContent key={integration.key} value={integration.key}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <integration.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.label}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={isConfigured ? "default" : "secondary"} className="gap-1">
                      {isConfigured ? (
                        <><CheckCircle2 className="w-3 h-3" /> Configured</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> Not Set</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {integration.fields.map((field) => {
                    const fieldOptions = (field as any).options as { value: string; label: string }[] | undefined;

                    return (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={`${integration.key}-${field.name}`}>{field.label}</Label>
                        {fieldOptions ? (
                          <Select
                            value={values[field.name] || ""}
                            onValueChange={(val) => handleFieldChange(integration.key, field.name, val)}
                          >
                            <SelectTrigger id={`${integration.key}-${field.name}`} className="bg-background">
                              <SelectValue placeholder={field.placeholder} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {fieldOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="relative">
                            <Input
                              id={`${integration.key}-${field.name}`}
                              type={
                                field.name.includes("key") || field.name.includes("secret")
                                  ? showKeys[`${integration.key}-${field.name}`]
                                    ? "text"
                                    : "password"
                                  : (field as any).type || "text"
                              }
                              placeholder={field.placeholder}
                              value={values[field.name] || ""}
                              onChange={(e) => handleFieldChange(integration.key, field.name, e.target.value)}
                              disabled={(field as any).disabled}
                              className="pr-10"
                            />
                            {(field.name.includes("key") || field.name.includes("secret")) && !(field as any).disabled && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() =>
                                  setShowKeys((prev) => ({
                                    ...prev,
                                    [`${integration.key}-${field.name}`]: !prev[`${integration.key}-${field.name}`],
                                  }))
                                }
                              >
                                {showKeys[`${integration.key}-${field.name}`] ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                        {isConfigured && field.name.includes("key") && config?.api_key_masked && (
                          <p className="text-xs text-muted-foreground">
                            Current: <span className="font-mono">{config.api_key_masked}</span>
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {testResults[integration.key] && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                      testResults[integration.key].success
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {testResults[integration.key].success ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 shrink-0" />
                      )}
                      {testResults[integration.key].message}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleTestConnection(integration.key)}
                      disabled={testing === integration.key || isDemo}
                      className="w-full sm:w-auto"
                    >
                      {testing === integration.key ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      {testing === integration.key ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button
                      onClick={() => handleSave(integration.key)}
                      disabled={saving === integration.key || isDemo}
                      className="w-full sm:w-auto"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving === integration.key ? "Saving..." : isConfigured ? "Update" : "Save"}
                    </Button>
                  </div>

                  {/* GitHub Actions Status Panel */}
                  {integration.key === "github" && isConfigured && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <Label className="text-sm font-semibold">Pipeline Status</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                          <p className="text-xs text-muted-foreground">Repository</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono font-medium text-foreground truncate flex-1">
                              {values["repo_owner"] && values["repo_name"] ? `${values["repo_owner"]}/${values["repo_name"]}` : <span className="text-muted-foreground italic">Not set</span>}
                            </p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                          <p className="text-xs text-muted-foreground">Workflow ID</p>
                          <p className="text-sm font-mono font-medium text-foreground truncate">
                            {values["workflow_id"] || <span className="text-muted-foreground italic">Not set</span>}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                          <p className="text-xs text-muted-foreground">Last Test</p>
                          {testResults["github"] ? (
                            <div className={`flex items-center gap-1.5 text-sm font-medium ${
                              testResults["github"].success ? "text-primary" : "text-destructive"
                            }`}>
                              {testResults["github"].success ? (
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span className="truncate">{testResults["github"].message}</span>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No test run yet</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Send Test Email — Resend only */}
                  {integration.key === "resend" && isConfigured && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <Label>Send Test Email</Label>
                      <p className="text-xs text-muted-foreground">
                        Send a real email to verify your Resend API key and email template delivery.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="email"
                          placeholder="recipient@example.com"
                          value={testEmailAddress}
                          onChange={(e) => setTestEmailAddress(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleSendTestEmail}
                          disabled={sendingTestEmail || isDemo || !testEmailAddress.trim()}
                          className="w-full sm:w-auto"
                        >
                          {sendingTestEmail ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          {sendingTestEmail ? "Sending..." : "Send Test Email"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
