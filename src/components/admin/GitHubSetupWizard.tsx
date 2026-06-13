"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import {
  Server, CheckCircle, AlertCircle, ArrowRight, ArrowLeft,
  ExternalLink, Loader2, Eye, EyeOff, Rocket, GitBranch,
  Smartphone, Zap, Github
} from "lucide-react";

type WizardStep = "intro" | "token" | "repo" | "verify" | "done";

const STEPS: { key: WizardStep; label: string; number: number }[] = [
  { key: "intro", label: "Overview", number: 1 },
  { key: "token", label: "Access Token", number: 2 },
  { key: "repo", label: "Repository", number: 3 },
  { key: "verify", label: "Verify", number: 4 },
  { key: "done", label: "Complete", number: 5 },
];

export const GitHubSetupWizard = ({ onClose }: { onClose?: () => void }) => {
  const [step, setStep] = useState<WizardStep>("intro");
  const [githubPat, setGithubPat] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [repoOwner, setRepoOwner] = useState("");
  const [repoName, setRepoName] = useState("");
  const [workflowId, setWorkflowId] = useState("build-android.yml");
  const [loading, setLoading] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<"idle" | "testing" | "pass" | "fail">("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    const loadExisting = async () => {
      const { data } = await apiClient
        .from("api_configurations")
        .select("config")
        .eq("provider", "github")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (data?.config) {
        const cfg = data.config as Record<string, string>;
        if (cfg.github_pat) setGithubPat(cfg.github_pat);
        if (cfg.repo_owner) setRepoOwner(cfg.repo_owner);
        if (cfg.repo_name) setRepoName(cfg.repo_name);
        if (cfg.workflow_id) setWorkflowId(cfg.workflow_id);
      }
    };
    loadExisting();
  }, []);

  const saveConfig = async () => {
    const trimmedPat = githubPat.trim();
    const trimmedOwner = repoOwner.trim();
    const trimmedRepo = repoName.trim();
    const trimmedWorkflow = workflowId.trim();

    if (!trimmedPat || !trimmedOwner || !trimmedRepo || !trimmedWorkflow) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    try {
      const configPayload = {
        github_pat: trimmedPat,
        repo_owner: trimmedOwner,
        repo_name: trimmedRepo,
        workflow_id: trimmedWorkflow,
      };
      const masked = trimmedPat
        ? `${"*".repeat(Math.max(0, trimmedPat.length - 4))}${trimmedPat.slice(-4)}`
        : null;

      const { data: existing } = await apiClient
        .from("api_configurations")
        .select("id")
        .eq("provider", "github")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        await apiClient.from("api_configurations").update({
          config: configPayload,
          api_key_masked: masked,
          is_active: true,
        }).eq("id", existing[0].id);
      } else {
        await apiClient.from("api_configurations").insert({
          name: "GitHub Actions",
          provider: "github",
          config: configPayload,
          api_key_masked: masked,
          is_active: true,
        });
      }

      setSaved(true);
      toast.success("GitHub Actions configuration saved");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const verifyPipeline = async () => {
    setVerifyStatus("testing");
    setVerifyMessage("Checking GitHub connection...");

    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${githubPat}`, "User-Agent": "AppForge-Setup" },
      });
      if (!res.ok) throw new Error("GitHub PAT is invalid");

      setVerifyMessage("Checking repository access...");
      const repoRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}`, {
        headers: { Authorization: `token ${githubPat}`, "User-Agent": "AppForge-Setup" },
      });
      if (!repoRes.ok) throw new Error(`Cannot access repository ${repoOwner}/${repoName}`);

      setVerifyStatus("pass");
      setVerifyMessage("All checks passed! Your build pipeline is ready.");
    } catch (err) {
      setVerifyStatus("fail");
      setVerifyMessage(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handleNext = async () => {
    if (step === "repo") {
      await saveConfig();
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
          {step === "intro" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
                <Github className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Set Up GitHub Actions</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Connect your GitHub repository to compile real, installable Android APKs using GitHub Actions.
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

          {step === "token" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Enter GitHub PAT</h2>
              <p className="text-muted-foreground">
                You need a GitHub Personal Access Token (classic) with `repo` scope to trigger actions.
              </p>
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="gh-token">GitHub Personal Access Token</Label>
                  <div className="relative mt-1">
                    <Input
                      id="gh-token"
                      type={showToken ? "text" : "password"}
                      value={githubPat}
                      onChange={(e) => setGithubPat(e.target.value)}
                      placeholder="ghp_..."
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
              </div>
            </div>
          )}

          {step === "repo" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Repository Details</h2>
              <p className="text-muted-foreground">
                Specify the repository that contains your GitHub Actions workflow.
              </p>
              <Separator />
              <div className="space-y-3">
                <div>
                  <Label htmlFor="gh-owner">Repository Owner</Label>
                  <Input
                    id="gh-owner"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                    placeholder="e.g. octocat"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gh-repo">Repository Name</Label>
                  <Input
                    id="gh-repo"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="e.g. hello-world"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="gh-workflow">Workflow Filename</Label>
                  <Input
                    id="gh-workflow"
                    value={workflowId}
                    onChange={(e) => setWorkflowId(e.target.value)}
                    placeholder="build-android.yml"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground">Verify Pipeline</h2>
              <p className="text-muted-foreground">
                Let's verify that the token is valid and the repository exists.
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
                        Click below to verify your GitHub connection.
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
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Build Pipeline Ready!</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Your GitHub Actions pipeline is configured. When users build an Android app,
                it will trigger a workflow dispatch on your repository.
              </p>
            </div>
          )}

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
                  (step === "token" && !githubPat) ||
                  (step === "repo" && (!repoOwner || !repoName))
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

export default GitHubSetupWizard;
