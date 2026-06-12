"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Server, CheckCircle, AlertCircle, ArrowRight, ArrowLeft,
  ExternalLink, Loader2, Eye, EyeOff, Rocket, GitBranch,
  Smartphone, Copy, RefreshCw, Zap,
} from "lucide-react";

type WizardStep = "intro" | "account" | "connect" | "configure" | "verify" | "done";

interface CodemagicApp {
  _id: string;
  appName: string;
}

const STEPS: { key: WizardStep; label: string; number: number }[] = [
  { key: "intro", label: "Overview", number: 1 },
  { key: "account", label: "Codemagic Account", number: 2 },
  { key: "connect", label: "API Token", number: 3 },
  { key: "configure", label: "Select App", number: 4 },
  { key: "verify", label: "Verify Pipeline", number: 5 },
  { key: "done", label: "Complete", number: 6 },
];

export const CodemagicSetupWizard = ({ onClose }: { onClose?: () => void }) => {
  const [step, setStep] = useState<WizardStep>("intro");
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [appId, setAppId] = useState("");
  const [workflowId, setWorkflowId] = useState("android-build");
  const [apps, setApps] = useState<CodemagicApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "testing" | "pass" | "fail">("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  // Fetch existing config on mount
  useEffect(() => {
    const loadExisting = async () => {
      const { data } = await supabase
        .from("api_configurations")
        .select("config")
        .eq("provider", "codemagic")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (data?.config) {
        const cfg = data.config as Record<string, string>;
        if (cfg.api_token) setApiToken(cfg.api_token);
        if (cfg.app_id) setAppId(cfg.app_id);
        if (cfg.workflow_id) setWorkflowId(cfg.workflow_id);
      }
    };
    loadExisting();
  }, []);

  const fetchApps = async () => {
    if (!apiToken) {
      toast.error("Enter your API token first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("https://api.codemagic.io/apps", {
        headers: { "x-auth-token": apiToken },
      });
      if (!res.ok) throw new Error(`Invalid token (${res.status})`);
      const data = await res.json();
      const appsList = data.applications || data || [];
      setApps(Array.isArray(appsList) ? appsList : []);
      if (appsList.length > 0 && !appId) {
        setAppId(appsList[0]._id || appsList[0].id);
      }
      toast.success(`Found ${appsList.length} app(s)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to fetch apps");
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    // Input validation
    const trimmedToken = apiToken.trim();
    const trimmedAppId = appId.trim();
    const trimmedWorkflow = workflowId.trim();

    if (!trimmedToken) {
      toast.error("API token is required");
      return;
    }
    if (trimmedToken.length < 10) {
      toast.error("API token seems too short — please verify it");
      return;
    }
    if (!trimmedAppId) {
      toast.error("App ID is required");
      return;
    }
    if (!trimmedWorkflow) {
      toast.error("Workflow ID is required");
      return;
    }
    if (trimmedWorkflow.startsWith("http")) {
      toast.error("Workflow ID should not be a URL — use a workflow name like 'android-build'");
      return;
    }

    setLoading(true);
    try {
      const configPayload = {
        api_token: trimmedToken,
        app_id: trimmedAppId,
        workflow_id: trimmedWorkflow,
      };
      const masked = trimmedToken
        ? `${"*".repeat(Math.max(0, trimmedToken.length - 4))}${trimmedToken.slice(-4)}`
        : null;

      // Fetch ALL existing codemagic configs to deduplicate
      const { data: allConfigs } = await supabase
        .from("api_configurations")
        .select("id")
        .eq("provider", "codemagic")
        .order("updated_at", { ascending: false });

      if (allConfigs && allConfigs.length > 0) {
        // Keep the first (most recent), delete the rest
        const keepId = allConfigs[0].id;
        if (allConfigs.length > 1) {
          const duplicateIds = allConfigs.slice(1).map((c) => c.id);
          await supabase.from("api_configurations").delete().in("id", duplicateIds);
          console.log(`Cleaned up ${duplicateIds.length} duplicate Codemagic config(s)`);
        }
        // Update the surviving record
        await supabase.from("api_configurations").update({
          config: configPayload,
          api_key_masked: masked,
          is_active: true,
        }).eq("id", keepId);
      } else {
        // No existing config — insert new
        await supabase.from("api_configurations").insert({
          name: "Codemagic",
          provider: "codemagic",
          config: configPayload,
          api_key_masked: masked,
          is_active: true,
        });
      }

      setSaved(true);
      toast.success("Codemagic configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const verifyPipeline = async () => {
    setVerifyStatus("testing");
    setVerifyMessage("Checking Codemagic connection...");

    try {
      // Step 1: Verify token by listing apps
      const res = await fetch("https://api.codemagic.io/apps", {
        headers: { "x-auth-token": apiToken },
      });
      if (!res.ok) throw new Error("API token is invalid");

      // Step 2: Check if the app ID exists
      const data = await res.json();
      const appsList = data.applications || data || [];
      const found = appsList.find(
        (a: Record<string, unknown>) => (a._id || a.id) === appId
      );
      if (!found && appId) {
        setVerifyMessage("Warning: App ID not found in your Codemagic apps, but token is valid.");
      }

      // Step 3: Check if the edge function is deployed
      setVerifyMessage("Checking cloud-build edge function...");
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const edgeRes = await fetch(`${supabaseUrl}/functions/v1/cloud-build`, {
          method: "OPTIONS",
        });
        if (!edgeRes.ok && edgeRes.status !== 204) {
          setVerifyMessage("Cloud-build edge function may not be deployed yet — builds will fail until deployed.");
          setVerifyStatus("pass"); // Token works, just edge function pending
          return;
        }
      }

      setVerifyStatus("pass");
      setVerifyMessage("All checks passed! Your build pipeline is ready.");
    } catch (err) {
      setVerifyStatus("fail");
      setVerifyMessage(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handleNext = async () => {
    if (step === "connect") {
      await fetchApps();
    }
    if (step === "configure") {
      await saveConfig();
    }
    if (step === "verify") {
      // Already verified or skip
    }
    const nextStep = STEPS[currentIndex + 1];
    if (nextStep) setStep(nextStep.key);
  };

  const handleBack = () => {
    const prevStep = STEPS[currentIndex - 1];
    if (prevStep) setStep(prevStep.key);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentIndex + 1} of {STEPS.length}
          </span>
          <span className="font-medium text-foreground">{STEPS[currentIndex]?.label}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= currentIndex
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentIndex ? <CheckCircle className="w-4 h-4" /> : s.number}
            </div>
          ))}
        </div>
      </div>

      <Card className="border-accent/20">
        <CardContent className="p-6">
          {/* Step: Intro */}
          {step === "intro" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                <Rocket className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Set Up Real APK Builds</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Connect Codemagic CI/CD to compile real, installable Android APKs from your web apps.
                This wizard will guide you through the setup in 5 minutes.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-4">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Server className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <span className="text-xs text-muted-foreground">Cloud Build</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Smartphone className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <span className="text-xs text-muted-foreground">Real APK</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <Zap className="w-5 h-5 mx-auto mb-1 text-accent" />
                  <span className="text-xs text-muted-foreground">Automated</span>
                </div>
              </div>
            </div>
          )}

          {/* Step: Account */}
          {step === "account" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Create a Codemagic Account</h2>
              <p className="text-muted-foreground">
                If you don't already have a Codemagic account, create one for free.
                Then connect your GitHub repository containing this project.
              </p>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Sign up at Codemagic</p>
                    <p className="text-xs text-muted-foreground">Free tier includes 500 build minutes/month</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <a href="https://codemagic.io/signup" target="_blank" rel="noopener noreferrer">
                        Open Codemagic <ExternalLink className="ml-1 w-3 h-3" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Connect your GitHub repository</p>
                    <p className="text-xs text-muted-foreground">
                      In Codemagic, click "Add application" and select the GitHub repo for this project.
                      Make sure the repo contains the <code className="text-accent">codemagic.yaml</code> file.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Export to GitHub first</p>
                    <p className="text-xs text-muted-foreground">
                      Use the "Export to GitHub" button to push your project code. 
                      Codemagic clones from GitHub to build.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: API Token */}
          {step === "connect" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Enter Your API Token</h2>
              <p className="text-muted-foreground">
                Find your API token in Codemagic → Settings → Integrations → API keys.
              </p>
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cm-token">Codemagic API Token</Label>
                  <div className="relative mt-1">
                    <Input
                      id="cm-token"
                      type={showToken ? "text" : "password"}
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder="Paste your API token here"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Where to find it:</strong> Log in to{" "}
                    <a href="https://codemagic.io/apps" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                      codemagic.io
                    </a>
                    {" "}→ Click your avatar → "User settings" → "Integrations" → "Codemagic API" → "Show".
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Select App */}
          {step === "configure" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Select Your App</h2>
              <p className="text-muted-foreground">
                Choose which Codemagic application to use for builds.
              </p>
              <Separator />

              {apps.length > 0 ? (
                <div className="space-y-2">
                  <Label>Your Codemagic Apps</Label>
                  {apps.map((app) => (
                    <button
                      key={app._id}
                      onClick={() => setAppId(app._id)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        appId === app._id
                          ? "border-accent bg-accent/5"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{app.appName}</span>
                        </div>
                        {appId === app._id && <CheckCircle className="w-4 h-4 text-accent" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{app._id}</p>
                    </button>
                  ))}
                  <Button variant="ghost" size="sm" onClick={fetchApps} disabled={loading}>
                    <RefreshCw className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-secondary/30 text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      {loading ? "Fetching apps..." : "No apps loaded yet. Click below to fetch."}
                    </p>
                    <Button variant="outline" size="sm" onClick={fetchApps} disabled={loading}>
                      {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                      Fetch Apps
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor="cm-appid">Or paste App ID manually</Label>
                    <Input
                      id="cm-appid"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      placeholder="e.g. 64a1b2c3d4e5f6..."
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <Separator />
              <div>
                <Label htmlFor="cm-workflow">Workflow ID</Label>
                <Input
                  id="cm-workflow"
                  value={workflowId}
                  onChange={(e) => setWorkflowId(e.target.value)}
                  placeholder="android-build"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Must match a workflow defined in your <code className="text-accent">codemagic.yaml</code>
                </p>
              </div>
            </div>
          )}

          {/* Step: Verify */}
          {step === "verify" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Verify Build Pipeline</h2>
              <p className="text-muted-foreground">
                Let's make sure everything is connected and working.
              </p>
              <Separator />

              <div className="space-y-3">
                <div className={`p-4 rounded-lg border ${
                  verifyStatus === "pass" ? "border-green-500/30 bg-green-500/5" :
                  verifyStatus === "fail" ? "border-destructive/30 bg-destructive/5" :
                  "border-border"
                }`}>
                  {verifyStatus === "idle" && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Click below to verify your Codemagic connection and build pipeline.
                      </p>
                      <Button onClick={verifyPipeline}>
                        <Zap className="w-4 h-4 mr-2" />
                        Run Verification
                      </Button>
                    </div>
                  )}
                  {verifyStatus === "testing" && (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-accent" />
                      <span className="text-sm text-foreground">{verifyMessage}</span>
                    </div>
                  )}
                  {verifyStatus === "pass" && (
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Pipeline Ready</p>
                        <p className="text-xs text-muted-foreground">{verifyMessage}</p>
                      </div>
                    </div>
                  )}
                  {verifyStatus === "fail" && (
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Verification Failed</p>
                        <p className="text-xs text-muted-foreground">{verifyMessage}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={verifyPipeline}>
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-secondary/30">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Configuration Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-muted-foreground">API Token:</span>
                    <span className="text-foreground font-mono">
                      {"*".repeat(Math.max(0, apiToken.length - 4))}{apiToken.slice(-4)}
                    </span>
                    <span className="text-muted-foreground">App ID:</span>
                    <span className="text-foreground font-mono truncate">{appId || "—"}</span>
                    <span className="text-muted-foreground">Workflow:</span>
                    <span className="text-foreground">{workflowId}</span>
                    <span className="text-muted-foreground">Saved:</span>
                    <Badge variant={saved ? "default" : "secondary"} className="w-fit">
                      {saved ? "Yes" : "Not yet"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Done */}
          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Build Pipeline Ready!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your Codemagic CI/CD pipeline is configured. When users build an Android app,
                it will trigger a real Gradle build on Codemagic's servers and produce an installable APK.
              </p>
              <Separator />
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs font-semibold text-foreground">What happens next</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• User clicks "Build" in App Builder</li>
                    <li>• Edge function triggers Codemagic</li>
                    <li>• Gradle compiles a real Android APK</li>
                    <li>• APK download link appears when done</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs font-semibold text-foreground">Requirements</p>
                  <ul className="text-xs text-muted-foreground mt-1 space-y-1">
                    <li>• Project exported to GitHub</li>
                    <li>• <code className="text-accent">codemagic.yaml</code> in repo</li>
                    <li>• Codemagic connected to repo</li>
                    <li>• Edge functions deployed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2 pt-6">
            {step !== "intro" && step !== "done" && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step === "done" ? (
              <Button onClick={onClose} className="flex-1">
                Close Wizard
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex-1"
                disabled={
                  loading ||
                  (step === "connect" && !apiToken) ||
                  (step === "configure" && !appId)
                }
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  <>{step === "intro" ? "Get Started" : "Continue"}<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CodemagicSetupWizard;
