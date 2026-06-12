"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle2, XCircle, Check } from "lucide-react";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import appLogo from '@/assets/appforge-logo.png';
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email address").max(255, "Email too long");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long");
const displayNameSchema = z.string().trim().max(50, "Display name too long").optional();

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

// Magic Link Icon Component
const MagicLinkIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

type AuthView = 'login' | 'signup' | 'forgot-password' | 'magic-link' | 'verify-email';

const Auth = () => {
  const { settings } = useSystemSettings();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; displayName?: string }>({});
  const [signupEmail, setSignupEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { signIn, signUp, signInWithGoogle, signInWithMagicLink, resendVerificationEmail, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const isLogin = authView === 'login';
  const isForgotPassword = authView === 'forgot-password';
  const isMagicLink = authView === 'magic-link';
  const isVerifyEmail = authView === 'verify-email';

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = useCallback(async () => {
    if (resendCooldown > 0 || !signupEmail) return;
    
    setIsResending(true);
    try {
      const { error } = await resendVerificationEmail(signupEmail);
      if (error) {
        toast({ title: "Failed to Resend", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Email Sent!", description: "Verification email has been resent." });
        setResendCooldown(60); // 60 second cooldown
      }
    } finally {
      setIsResending(false);
    }
  }, [resendCooldown, signupEmail, resendVerificationEmail, toast]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string; displayName?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    if (!isForgotPassword) {
      try {
        passwordSchema.parse(password);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.password = e.errors[0].message;
        }
      }

      // Validate password confirmation for signup
      if (!isLogin) {
        if (!confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (password !== confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }

      if (!isLogin && displayName) {
        try {
          displayNameSchema.parse(displayName);
        } catch (e) {
          if (e instanceof z.ZodError) {
            newErrors.displayName = e.errors[0].message;
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password, rememberMe);
        if (error) {
          toast({ title: "Login Failed", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Welcome back!", description: "You have successfully signed in." });
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast({ title: "Sign Up Failed", description: error.message, variant: "destructive" });
        } else {
          setSignupEmail(email);
          setAuthView('verify-email');
          toast({ title: "Account Created!", description: "Please check your email to verify your account." });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({ title: "Google Sign In Failed", description: error.message, variant: "destructive" });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!email.trim()) {
      setErrors({ email: "Please enter your email address" });
      return;
    }
    
    const newErrors: { email?: string } = {};
    try { emailSchema.parse(email); } catch (err) {
      if (err instanceof z.ZodError) newErrors.email = err.errors[0].message;
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsMagicLinkLoading(true);
    setMagicLinkSent(false);
    try {
      const { error } = await signInWithMagicLink(email);
      if (error) {
        toast({ title: "Magic Link Failed", description: error.message, variant: "destructive" });
      } else {
        setMagicLinkSent(true);
        toast({ title: "Magic Link Sent!", description: "Check your inbox for a sign-in link." });
      }
    } finally {
      setIsMagicLinkLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string } = {};
    try { emailSchema.parse(email); } catch (err) {
      if (err instanceof z.ZodError) newErrors.email = err.errors[0].message;
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsResetLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast({ title: "Reset Failed", description: error.message, variant: "destructive" });
      } else {
        setResetEmailSent(true);
        toast({ title: "Email Sent", description: "Check your inbox for a password reset link." });
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4 ${isMagicLink || isVerifyEmail ? 'bg-primary' : ''}`}>
               {isMagicLink ? (
                 <Mail className="w-6 h-6 text-primary-foreground" />
               ) : isVerifyEmail ? (
                 <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
               ) : (
                <img src={appLogo} alt={settings.app_name} className="w-12 h-12 object-contain" />
              )}
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {isMagicLink ? "Passwordless Sign In" : isVerifyEmail ? "Verify Your Email" : settings.app_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isForgotPassword 
                ? "Reset your password" 
                : isMagicLink 
                  ? "Enter your email to receive a magic sign-in link" 
                  : isVerifyEmail
                    ? "One more step to complete your registration"
                    : "Build amazing mobile apps"}
            </p>
          </div>

          {isVerifyEmail ? (
            <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                 <Mail className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Check your inbox</h3>
                <p className="text-muted-foreground text-sm">
                  We've sent a verification link to<br />
                  <strong className="text-foreground">{signupEmail}</strong>
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <p className="text-sm font-medium text-foreground">What's next?</p>
                <ul className="text-sm text-muted-foreground space-y-1.5">
                   <li className="flex items-start gap-2">
                     <span className="text-primary mt-0.5">✓</span>
                     <span>Open the email from {settings.app_name}</span>
                   </li>
                   <li className="flex items-start gap-2">
                     <span className="text-primary mt-0.5">✓</span>
                     <span>Click the verification link</span>
                   </li>
                   <li className="flex items-start gap-2">
                     <span className="text-primary mt-0.5">✓</span>
                     <span>Start building your app!</span>
                   </li>
                </ul>
              </div>
              <div className="space-y-3">
                   <Button 
                   onClick={handleResendVerification}
                   disabled={resendCooldown > 0 || isResending}
                   className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90"
                 >
                  {isResending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <><Mail className="w-4 h-4 mr-2" />Resend Verification Email</>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setAuthView('login'); setSignupEmail(''); setResendCooldown(0); }} 
                  className="w-full"
                >
                  Back to Sign In
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Check your spam folder if you don't see the email
                </p>
              </div>
            </div>
          ) : isMagicLink ? (
            magicLinkSent ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Check your email</h3>
                  <p className="text-muted-foreground text-sm">We've sent a magic link to <strong>{email}</strong></p>
                </div>
                <Button variant="outline" onClick={() => { setAuthView('login'); setMagicLinkSent(false); }} className="w-full">
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLinkSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="magic-email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="magic-email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-11" 
                    disabled={isMagicLinkLoading} 
                    required 
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isMagicLinkLoading}>
                  {isMagicLinkLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</>
                  ) : (
                    <><Mail className="w-4 h-4 mr-2" />Send Magic Link</>
                  )}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setAuthView('login')} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : isForgotPassword ? (
            resetEmailSent ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-foreground" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">Check your email</h3>
                  <p className="text-muted-foreground text-sm">We've sent a password reset link to <strong>{email}</strong></p>
                </div>
                <Button variant="outline" onClick={() => { setAuthView('login'); setResetEmailSent(false); }} className="w-full">
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-11" 
                    disabled={isResetLoading} 
                    required 
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>
                <Button type="submit" className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isResetLoading}>
                  {isResetLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : "Send Reset Link"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setAuthView('login')} className="text-muted-foreground hover:text-foreground text-sm inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </button>
                </div>
              </form>
            )
          ) : (
            <>
              {/* Tab Switcher */}
              <div className="flex border border-border rounded-lg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    isLogin 
                      ? 'bg-muted text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView('signup')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    !isLogin 
                      ? 'bg-muted text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="display-name" className="text-sm font-medium">Display Name</Label>
                    <Input 
                      id="display-name" 
                      type="text" 
                      placeholder="John Doe" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      className="h-11" 
                      disabled={isLoading} 
                    />
                    {errors.displayName && <p className="text-destructive text-sm">{errors.displayName}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-11" 
                    disabled={isLoading} 
                    required 
                  />
                  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    {isLogin && (
                      <button 
                        type="button" 
                        onClick={() => setAuthView('forgot-password')} 
                        className="text-sm text-muted-foreground hover:text-foreground"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="h-11 pr-10" 
                      disabled={isLoading} 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
                  {!isLogin && <PasswordStrengthIndicator password={password} />}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
                      {confirmPassword && (
                        <span className={`text-xs flex items-center gap-1 ${password === confirmPassword ? 'text-primary' : 'text-destructive'}`}>
                          {password === confirmPassword ? (
                            <><Check className="w-3 h-3" /> Passwords match</>
                          ) : (
                            <><XCircle className="w-3 h-3" /> Passwords don't match</>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input 
                        id="confirm-password" 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className={`h-11 pr-10 ${confirmPassword ? (password === confirmPassword ? 'border-primary focus-visible:ring-primary' : 'border-destructive focus-visible:ring-destructive') : ''}`}
                        disabled={isLoading} 
                        required 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
                  </div>
                )}

                {isLogin && (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe} 
                      onCheckedChange={(checked) => setRememberMe(checked === true)}
                    />
                    <Label htmlFor="remember-me" className="text-sm font-normal text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                )}

                <Button 
                   type="submit" 
                   className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90" 
                   disabled={isLoading}
                 >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />{isLogin ? "Signing in..." : "Creating account..."}</>
                  ) : (
                    isLogin ? "Sign In" : "Sign Up"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground uppercase tracking-wide">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-11" 
                  onClick={handleGoogleSignIn} 
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  <span className="ml-2">Google</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-11" 
                  onClick={() => setAuthView('magic-link')}
                >
                  <MagicLinkIcon />
                  <span className="ml-2">Magic Link</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
