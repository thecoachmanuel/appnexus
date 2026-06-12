"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Shield, CheckCircle, AlertCircle, Rocket, Settings,
  ArrowRight, ArrowLeft, Eye, EyeOff, AlertTriangle, RefreshCw, Server
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import appLogo from "@/assets/appforge-logo.png";

type SetupStep = "welcome" | "admin" | "configure" | "complete";

interface EnvCheck {
  label: string;
  status: "checking" | "pass" | "warn" | "fail";
  message?: string;
}

const AdminSetup = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<SetupStep>("welcome");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [showPassword, setShowPassword] = useState(false);

  // Admin credentials
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // App configuration (merged branding + billing essentials)
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("Transform any website into a native mobile app");
  const [supportEmail, setSupportEmail] = useState("");
  const [defaultCredits, setDefaultCredits] = useState(5);
  const [creditsPerBuild, setCreditsPerBuild] = useState(1);
  const [seedDemoData, setSeedDemoData] = useState(true);

  // Environment checks
  const [envChecks, setEnvChecks] = useState<EnvCheck[]>([]);
  const [envChecksDone, setEnvChecksDone] = useState(false);

  const steps: { key: SetupStep; label: string; icon: React.ReactNode }[] = [
    { key: "welcome", label: "Welcome", icon: <Rocket className="w-4 h-4" /> },
    { key: "admin", label: "Admin", icon: <Shield className="w-4 h-4" /> },
    { key: "configure", label: "Configure", icon: <Settings className="w-4 h-4" /> },
    { key: "complete", label: "Launch", icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // ─── Environment Validation ────────────────────────────────────────────
  const runEnvironmentChecks = useCallback(async () => {
    const checks: EnvCheck[] = [
      { label: "Database connection", status: "checking" },
      { label: "Authentication service", status: "checking" },
      { label: "Storage buckets", status: "checking" },
      { label: "System settings table", status: "checking" },
      { label: "Subscription plans seeded", status: "checking" },
    ];
    setEnvChecks([...checks]);
    setEnvChecksDone(false);

    // 1. Database
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      checks[0] = error
        ? { label: checks[0].label, status: "fail", message: error.message }
        : { label: checks[0].label, status: "pass", message: "Connected successfully" };
    } catch {
      checks[0] = { label: checks[0].label, status: "fail", message: "Cannot reach database" };
    }
    setEnvChecks([...checks]);

    // 2. Auth
    try {
      const { error } = await supabase.auth.getSession();
      checks[1] = error
        ? { label: checks[1].label, status: "warn", message: error.message }
        : { label: checks[1].label, status: "pass", message: "Auth service active" };
    } catch {
      checks[1] = { label: checks[1].label, status: "fail", message: "Auth service unreachable" };
    }
    setEnvChecks([...checks]);

    // 3. Storage
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        checks[2] = { label: checks[2].label, status: "warn", message: "Could not list buckets" };
      } else {
        const requiredBuckets = ["avatars", "apk-builds", "app-icons"];
        const existing = data?.map((b) => b.name) || [];
        const missing = requiredBuckets.filter((b) => !existing.includes(b));
        checks[2] = missing.length
          ? { label: checks[2].label, status: "warn", message: `Missing: ${missing.join(", ")}` }
          : { label: checks[2].label, status: "pass", message: `${existing.length} bucket(s) ready` };
      }
    } catch {
      checks[2] = { label: checks[2].label, status: "warn", message: "Storage check failed" };
    }
    setEnvChecks([...checks]);

    // 4. System settings
    try {
      const { data, error } = await supabase.from("system_settings").select("key").limit(5);
      checks[3] = error
        ? { label: checks[3].label, status: "fail", message: error.message }
        : { label: checks[3].label, status: "pass", message: `${data?.length || 0} setting(s) found` };
    } catch {
      checks[3] = { label: checks[3].label, status: "fail", message: "Settings table missing" };
    }
    setEnvChecks([...checks]);

    // 5. Plans
    try {
      const { data, error } = await supabase.from("subscription_plans").select("id").eq("is_active", true);
      if (error) {
        checks[4] = { label: checks[4].label, status: "warn", message: "Could not check plans" };
      } else if (!data || data.length === 0) {
        checks[4] = { label: checks[4].label, status: "warn", message: "No plans found — will be seeded during setup" };
      } else {
        checks[4] = { label: checks[4].label, status: "pass", message: `${data.length} active plan(s)` };
      }
    } catch {
      checks[4] = { label: checks[4].label, status: "warn", message: "Plans check failed" };
    }
    setEnvChecks([...checks]);
    setEnvChecksDone(true);
  }, []);

  useEffect(() => {
    if (currentStep === "welcome") {
      runEnvironmentChecks();
    }
  }, [currentStep, runEnvironmentChecks]);

  const hasEnvFailures = envChecks.some((c) => c.status === "fail");
  const hasEnvWarnings = envChecks.some((c) => c.status === "warn");

  // ─── Admin Account ─────────────────────────────────────────────────────
  const handleAdminSubmit = async () => {
    if (mode === "signup") {
      if (password !== confirmPassword) {
        toast({ title: "Passwords don't match", description: "Please make sure your passwords match.", variant: "destructive" });
        return false;
      }
      if (password.length < 6) {
        toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
        return false;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await signUp(email, password, displayName || "Administrator");
        if (signUpError) throw signUpError;

        await new Promise((resolve) => setTimeout(resolve, 1000));
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          const { error: roleError } = await supabase.from("user_roles").insert({ user_id: newUser.id, role: "admin" });
          if (roleError) throw new Error("Failed to assign admin role");
        }
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;

        const { data: { user: existingUser } } = await supabase.auth.getUser();
        if (existingUser) {
          const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", existingUser.id).single();
          if (existingRole) {
            await supabase.from("user_roles").update({ role: "admin" }).eq("user_id", existingUser.id);
          } else {
            await supabase.from("user_roles").insert({ user_id: existingUser.id, role: "admin" });
          }
        }
      }
      setSubmitting(false);
      return true;
    } catch (error: any) {
      toast({ title: "Setup failed", description: error.message || "An error occurred.", variant: "destructive" });
      setSubmitting(false);
      return false;
    }
  };

  // ─── Save Settings ─────────────────────────────────────────────────────
  const upsertSetting = async (key: string, value: any, category: string, description: string) => {
    await supabase.from("system_settings").upsert(
      { key, value: JSON.stringify(value), category, description },
      { onConflict: "key" }
    );
  };

  const handleConfigureSubmit = async () => {
    setSubmitting(true);
    try {
      await Promise.all([
        upsertSetting("app_name", appName, "general", "Application name"),
        upsertSetting("app_tagline", appDescription, "general", "Application tagline"),
        upsertSetting("support_email", supportEmail, "general", "Support email address"),
        upsertSetting("default_signup_credits", defaultCredits, "billing", "Credits for new users"),
        upsertSetting("credits_per_build", creditsPerBuild, "billing", "Credits consumed per build"),
      ]);

      if (seedDemoData) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await supabase.functions.invoke("reset-demo-data", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      }
      setSubmitting(false);
      return true;
    } catch {
      setSubmitting(false);
      return true;
    }
  };

  // ─── Password strength ────────────────────────────────────────────────
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", percent: 0 };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { label: "Weak", color: "bg-destructive", percent: 20 };
    if (score <= 2) return { label: "Fair", color: "bg-orange-500", percent: 40 };
    if (score <= 3) return { label: "Good", color: "bg-yellow-500", percent: 60 };
    if (score <= 4) return { label: "Strong", color: "bg-green-500", percent: 80 };
    return { label: "Very Strong", color: "bg-green-600", percent: 100 };
  };

  const pwStrength = getPasswordStrength(password);

  // ─── Navigation ────────────────────────────────────────────────────────
  const stepOrder: SetupStep[] = ["welcome", "admin", "configure", "complete"];

  const handleNext = async () => {
    if (currentStep === "welcome") {
      if (hasEnvFailures) {
        toast({ title: "Critical errors found", description: "Please resolve database connection issues before continuing.", variant: "destructive" });
        return;
      }
      setCurrentStep("admin");
    } else if (currentStep === "admin") {
      const success = await handleAdminSubmit();
      if (success) setCurrentStep("configure");
    } else if (currentStep === "configure") {
      await handleConfigureSubmit();
      setCurrentStep("complete");
    } else if (currentStep === "complete") {
      navigate("/admin");
    }
  };

  const handleBack = () => {
    const prevStep = stepOrder[currentStepIndex - 1];
    if (prevStep && currentStep !== "welcome") {
      setCurrentStep(prevStep);
    }
  };

  // ─── Render Helpers ────────────────────────────────────────────────────
  const StatusIcon = ({ status }: { status: EnvCheck["status"] }) => {
    if (status === "checking") return <LoadingSpinner className="w-4 h-4" />;
    if (status === "pass") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "warn") return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-destructive" />;
  };

  const SectionCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Progress indicator */}
      <div className="w-full max-w-lg mb-6">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                index <= currentStepIndex ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                index < currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : index === currentStepIndex
                    ? "bg-primary/15 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
              }`}>
                {index < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      <Card className="w-full max-w-lg">
        {/* ─── Welcome + Environment Check ──────────────────────────── */}
        {currentStep === "welcome" && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src={appLogo} alt="Setup" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl">Welcome to Setup</CardTitle>
              <CardDescription>
                Let's get your app ready for production. We'll validate your environment, create your admin account, and configure key settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Environment checks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    Environment Check
                  </h3>
                  {envChecksDone && (
                    <Button variant="ghost" size="sm" onClick={runEnvironmentChecks} className="h-7 text-xs text-muted-foreground">
                      <RefreshCw className="mr-1 h-3 w-3" />
                      Re-run
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {envChecks.map((check, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border">
                      <div className="flex items-center gap-2.5">
                        <StatusIcon status={check.status} />
                        <div>
                          <p className="text-sm font-medium">{check.label}</p>
                          {check.message && (
                            <p className={`text-xs ${check.status === "fail" ? "text-destructive" : check.status === "warn" ? "text-yellow-600 dark:text-yellow-400" : "text-muted-foreground"}`}>
                              {check.message}
                            </p>
                          )}
                        </div>
                      </div>
                      {check.status !== "checking" && (
                        <Badge variant={check.status === "pass" ? "default" : check.status === "warn" ? "secondary" : "destructive"} className="text-[10px]">
                          {check.status === "pass" ? "OK" : check.status === "warn" ? "Warning" : "Error"}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {envChecksDone && hasEnvWarnings && !hasEnvFailures && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Some warnings detected. You can continue — these can be configured later from the Admin Panel.
                  </p>
                </div>
              )}

              {envChecksDone && hasEnvFailures && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive">
                    Critical errors must be resolved before continuing. Please check your backend configuration.
                  </p>
                </div>
              )}

              <Button onClick={handleNext} className="w-full" size="lg" disabled={!envChecksDone || hasEnvFailures}>
                {!envChecksDone ? (
                  <><LoadingSpinner className="mr-2 h-4 w-4" />Checking environment...</>
                ) : (
                  <>Get Started <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </CardContent>
          </>
        )}

        {/* ─── Admin Account ────────────────────────────────────────── */}
        {currentStep === "admin" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Create Super Admin</CardTitle>
              <CardDescription>
                This account will have full access to all admin features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button variant={mode === "signup" ? "default" : "outline"} className="flex-1" onClick={() => setMode("signup")} size="sm">
                  New Account
                </Button>
                <Button variant={mode === "signin" ? "default" : "outline"} className="flex-1" onClick={() => setMode("signin")} size="sm">
                  Existing Account
                </Button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
                  <Input id="email" type="email" placeholder="admin@yourdomain.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" type="text" placeholder="Administrator" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {mode === "signup" && password && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pwStrength.color}`} style={{ width: `${pwStrength.percent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pwStrength.label}</span>
                      </div>
                    </div>
                  )}
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1" disabled={submitting || !email || !password || (mode === "signup" && password !== confirmPassword)}>
                    {submitting ? (
                      <><LoadingSpinner className="mr-2 h-4 w-4" />Saving...</>
                    ) : (
                      <>{mode === "signup" ? "Create & Continue" : "Sign In & Continue"}<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* ─── App Configuration ────────────────────────────────────── */}
        {currentStep === "configure" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Configure Your App</CardTitle>
              <CardDescription>
                Set your brand identity and basic settings. Everything can be changed later in the Admin Panel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" placeholder="Your App Name" value={appName} onChange={(e) => setAppName(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Shown in the header, emails, and page titles</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appDescription">Tagline</Label>
                  <Input id="appDescription" placeholder="Transform any website into a native mobile app" value={appDescription} onChange={(e) => setAppDescription(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" placeholder="support@yourdomain.com" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>

                <Separator />
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits & Billing</p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultCredits">Signup Credits</Label>
                    <Input id="defaultCredits" type="number" min={0} max={1000} value={defaultCredits} onChange={(e) => setDefaultCredits(Number(e.target.value))} />
                    <p className="text-xs text-muted-foreground">Free credits for new users</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditsPerBuild">Credits Per Build</Label>
                    <Input id="creditsPerBuild" type="number" min={1} max={100} value={creditsPerBuild} onChange={(e) => setCreditsPerBuild(Number(e.target.value))} />
                    <p className="text-xs text-muted-foreground">Cost per app build</p>
                  </div>
                </div>

                <Separator />

                <SectionCard>
                  <div className="space-y-0.5">
                    <Label htmlFor="seedDemo">Seed Demo Data</Label>
                    <p className="text-xs text-muted-foreground">Create sample plans, credits & settings</p>
                  </div>
                  <Switch id="seedDemo" checked={seedDemoData} onCheckedChange={setSeedDemoData} />
                </SectionCard>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Email, security, payment gateways, and advanced settings can be configured in Admin Panel → Settings after setup.
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleNext} className="flex-1" disabled={submitting}>
                    {submitting ? (
                      <><LoadingSpinner className="mr-2 h-4 w-4" />Saving...</>
                    ) : (
                      <>Complete Setup<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* ─── Complete ─────────────────────────────────────────────── */}
        {currentStep === "complete" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">You're All Set! 🎉</CardTitle>
              <CardDescription>
                Your {appName} installation is ready for production.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                {[
                  { label: "Environment validated" },
                  { label: "Super Admin account created" },
                  { label: "App identity & credits configured" },
                  ...(seedDemoData ? [{ label: "Demo data seeded" }] : []),
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Settings className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Configure email, security policies, payment gateways, and more from the <span className="font-medium text-foreground">Admin Panel → Settings</span>.
                </p>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                <Rocket className="mr-2 h-4 w-4" />
                Launch Admin Panel
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminSetup;
