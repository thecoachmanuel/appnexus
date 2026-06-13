"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  // App configuration
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

    try {
      const res = await fetch("/api/admin/setup/health");
      const data = await res.json().catch(() => ({}));

      checks[0] = data.db ? { label: checks[0].label, status: "pass", message: "Connected successfully" } : { label: checks[0].label, status: "fail", message: "Cannot reach database" };
      checks[1] = data.auth ? { label: checks[1].label, status: "pass", message: "Auth service active" } : { label: checks[1].label, status: "fail", message: "Auth service unreachable" };
      checks[2] = { label: checks[2].label, status: "pass", message: "Local storage ready" };
      checks[3] = data.settings ? { label: checks[3].label, status: "pass", message: "Settings table ready" } : { label: checks[3].label, status: "warn", message: "Settings table missing" };
      checks[4] = data.plans ? { label: checks[4].label, status: "pass", message: "Plans ready" } : { label: checks[4].label, status: "warn", message: "No plans found" };
    } catch {
      checks.forEach(c => c.status = "fail");
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
        const { error } = await signUp(email, password, displayName || "Administrator");
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      setSubmitting(false);
      return true;
    } catch (error: any) {
      toast({ title: "Setup failed", description: error.message || "An error occurred.", variant: "destructive" });
      setSubmitting(false);
      return false;
    }
  };

  const handleConfigureSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/admin/setup/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('app_auth_token') || sessionStorage.getItem('app_auth_token')}`
        },
        body: JSON.stringify({
          appName, appDescription, supportEmail, defaultCredits, creditsPerBuild, seedDemoData
        })
      });
      setSubmitting(false);
      return true;
    } catch {
      setSubmitting(false);
      return true;
    }
  };

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
      router.push("/admin");
    }
  };

  const handleBack = () => {
    const prevStep = stepOrder[currentStepIndex - 1];
    if (prevStep && currentStep !== "welcome") {
      setCurrentStep(prevStep);
    }
  };

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
            <div key={step.key} className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${index <= currentStepIndex ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${index < currentStepIndex ? "bg-primary text-primary-foreground" : index === currentStepIndex ? "bg-primary/15 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}`}>
                {index < currentStepIndex ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              <span className="hidden sm:inline">{step.label}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1 text-center">Step {currentStepIndex + 1} of {steps.length}</p>
      </div>

      <Card className="w-full max-w-lg">
        {currentStep === "welcome" && (
          <>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <img src={appLogo.src} alt="Setup" className="h-16 w-auto" />
              </div>
              <CardTitle className="text-2xl">Welcome to Setup</CardTitle>
              <CardDescription>
                Let's get your app ready for production. We'll validate your environment, create your admin account, and configure key settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Server className="w-4 h-4 text-primary" />
                    Environment Check
                  </h3>
                  {envChecksDone && (
                    <Button variant="ghost" size="sm" onClick={runEnvironmentChecks} className="h-7 text-xs text-muted-foreground">
                      <RefreshCw className="mr-1 h-3 w-3" /> Re-run
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
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleNext} className="w-full" size="lg" disabled={!envChecksDone || hasEnvFailures}>
                {!envChecksDone ? <><LoadingSpinner className="mr-2 h-4 w-4" />Checking environment...</> : <>Get Started <ArrowRight className="ml-2 h-4 w-4" /></>}
              </Button>
            </CardContent>
          </>
        )}

        {currentStep === "admin" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Create Super Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Button variant={mode === "signup" ? "default" : "outline"} className="flex-1" onClick={() => setMode("signup")} size="sm">New Account</Button>
                <Button variant={mode === "signin" ? "default" : "outline"} className="flex-1" onClick={() => setMode("signin")} size="sm">Existing Account</Button>
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
                    <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type={showPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={handleNext} className="flex-1" disabled={submitting || !email || !password || (mode === "signup" && password !== confirmPassword)}>
                    {submitting ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === "configure" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Configure Your App</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" placeholder="Your App Name" value={appName} onChange={(e) => setAppName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appDescription">Tagline</Label>
                  <Input id="appDescription" placeholder="Transform any website into a native mobile app" value={appDescription} onChange={(e) => setAppDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" placeholder="support@yourdomain.com" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
                <SectionCard>
                  <div className="space-y-0.5">
                    <Label htmlFor="seedDemo">Seed Demo Data</Label>
                  </div>
                  <Switch id="seedDemo" checked={seedDemoData} onCheckedChange={setSeedDemoData} />
                </SectionCard>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={handleNext} className="flex-1" disabled={submitting}>
                    {submitting ? "Saving..." : "Complete Setup"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {currentStep === "complete" && (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">You're All Set! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={handleNext} className="w-full" size="lg">
                <Rocket className="mr-2 h-4 w-4" /> Launch Admin Panel
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminSetup;
