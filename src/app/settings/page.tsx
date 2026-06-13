"use client";

import { useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useThemeStore } from "@/stores/useThemeStore";
import { useUserPreferencesStore, languageLabels } from "@/stores/useUserPreferencesStore";
import { useAppStore } from "@/stores/useAppStore";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, storageApi } from "@/lib/api";
import { Moon, Sun, Monitor, Bell, Shield, RotateCcw, Languages, Palette, User, Upload, Loader2, Trash2, AlertTriangle, Download, FileText, Camera, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { DemoModeBanner } from "@/components/DemoModeBanner";

const Settings = () => {
  const { theme, setTheme } = useThemeStore();
  const {
    language,
    setLanguage,
    notifications,
    toggleNotification,
    compactMode,
    setCompactMode,
    animationsEnabled,
    setAnimationsEnabled,
    analyticsEnabled,
    setAnalyticsEnabled,
    resetPreferences,
  } = useUserPreferencesStore();
  const { resetBuilder } = useAppStore();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Account deletion state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Data export state
  const [isExportingData, setIsExportingData] = useState(false);

  // Marketing consent state
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await userApi.getProfile();
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!user?.id,
  });

  // Initialize form values when profile loads
  const [initialized, setInitialized] = useState(false);
  if (profile && !initialized) {
    setDisplayName(profile.display_name || "");
    setCompanyName(profile.company_name || "");
    setMarketingConsent((profile as any).marketing_consent || false);
    setInitialized(true);
  }

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { display_name?: string; company_name?: string; avatar_url?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const response = await userApi.updateProfile(updates);
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, WebP, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.${fileExt}`;

      const uploadResult = await storageApi.upload("avatars", filePath, file);
      
      if (uploadResult.error) throw uploadResult.error;

      // Use the URL from upload result directly with cache-busting
      const publicUrl = uploadResult.data?.url || storageApi.getPublicUrl("avatars", filePath);
      await updateProfileMutation.mutateAsync({ avatar_url: `${publicUrl}?t=${timestamp}` });

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been changed.",
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user?.id, toast, updateProfileMutation]);

  const handleRemoveAvatar = useCallback(async () => {
    if (!user?.id || !profile?.avatar_url) return;

    setIsUploading(true);
    try {
      // Update profile to remove avatar URL
      await updateProfileMutation.mutateAsync({ avatar_url: null } as any);

      toast({
        title: "Avatar Removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not remove avatar.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [user?.id, profile?.avatar_url, toast, updateProfileMutation]);

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      display_name: displayName || profile?.display_name,
      company_name: companyName || profile?.company_name,
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await userApi.deleteAccount();
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to delete account");
      }

      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });

      // Sign out and redirect
      await signOut();
      router.push("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteDialog(false);
      setDeleteConfirmText("");
    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const response = await userApi.exportData();
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to export data");
      }

      // Download the data as a JSON file
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wrapcoders-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export data.",
        variant: "destructive",
      });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleMarketingConsentChange = async (checked: boolean) => {
    setIsUpdatingConsent(true);
    try {
      const response = await userApi.updateProfile({
        marketing_consent: checked,
        marketing_consent_date: checked ? new Date().toISOString() : null,
      } as any);

      if (response.error) throw response.error;

      setMarketingConsent(checked);
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });

      toast({
        title: checked ? "Marketing enabled" : "Marketing disabled",
        description: checked 
          ? "You will receive product updates and offers." 
          : "You will no longer receive marketing communications.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update preference.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleResetAll = () => {
    resetPreferences();
    resetBuilder();
    setTheme("dark");
    toast({
      title: "Settings Reset",
      description: "All preferences have been reset to defaults.",
    });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return user?.email?.[0]?.toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8 pt-24 sm:pt-28 pb-24 md:pb-8">
        <DemoModeBanner />
        
        <PageHeader
          title="Settings"
          description="Manage your preferences and account settings"
          className="mb-8"
        />

        <div className="space-y-6">
          {/* Profile */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                <CardTitle>Profile</CardTitle>
              </div>
              <CardDescription>Manage your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <div className="flex items-center gap-4">
                  <Skeleton className="w-20 h-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 border-2 border-accent/30 transition-transform group-hover:scale-105">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-accent/10 text-accent text-2xl">
                          {getInitials(profile?.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Overlay on hover */}
                      <div 
                        className={cn(
                          "absolute inset-0 rounded-full bg-black/60 flex items-center justify-center gap-2 opacity-0 transition-opacity",
                          "group-hover:opacity-100",
                          isUploading && "opacity-100"
                        )}
                      >
                        {isUploading ? (
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-white hover:bg-white/20"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                            {profile?.avatar_url && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-white hover:bg-red-500/50"
                                onClick={handleRemoveAvatar}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <p className="font-semibold text-lg text-foreground">
                        {profile?.display_name || "No name set"}
                      </p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground/70">
                        Hover avatar to change or remove
                      </p>
                    </div>
                  </div>

                  <Separator className="bg-border/50" />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-accent" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      variant={theme === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(value as "light" | "dark" | "system")}
                      className="flex-1"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use denser layouts</p>
                </div>
                <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Animations</Label>
                  <p className="text-sm text-muted-foreground">Enable UI animations</p>
                </div>
                <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-accent" />
                <CardTitle>Language & Region</CardTitle>
              </div>
              <CardDescription>Choose your preferred language</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(languageLabels).map(([code, label]) => (
                      <SelectItem key={code} value={code}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                <CardTitle>Notifications</CardTitle>
              </div>
              <CardDescription>Manage notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(notifications).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</Label>
                    <p className="text-sm text-muted-foreground">
                      {key === "buildComplete" && "Get notified when builds finish"}
                      {key === "errors" && "Receive error notifications"}
                      {key === "updates" && "App updates and announcements"}
                    </p>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={() => toggleNotification(key as keyof typeof notifications)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy & Data */}
          <Card className="glass-card border-white/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <CardTitle>Privacy & Data</CardTitle>
              </div>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Analytics</Label>
                  <p className="text-sm text-muted-foreground">Help improve the app with usage data</p>
                </div>
                <Switch checked={analyticsEnabled} onCheckedChange={setAnalyticsEnabled} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Marketing Communications</Label>
                  <p className="text-sm text-muted-foreground">Receive product updates and offers</p>
                </div>
                <Switch
                  checked={marketingConsent}
                  onCheckedChange={handleMarketingConsentChange}
                  disabled={isUpdatingConsent}
                />
              </div>

              <Separator className="bg-border/50" />

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  disabled={isExportingData}
                  className="w-full sm:w-auto"
                >
                  {isExportingData ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export My Data
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Download a copy of all your data including projects, builds, and preferences.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="glass-card border-destructive/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Reset All Settings</Label>
                  <p className="text-sm text-muted-foreground">Reset all preferences to defaults</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset All Settings?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reset all your preferences to their default values. Your profile and account data will not be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetAll}>Reset</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Separator className="bg-destructive/20" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-destructive">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-4">
                        <p>
                          This action is <strong className="text-destructive">permanent and irreversible</strong>. All your data including:
                        </p>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          <li>Profile information</li>
                          <li>App projects and builds</li>
                          <li>Subscription and credits</li>
                          <li>Chat history</li>
                        </ul>
                        <p>will be permanently deleted.</p>
                        <div className="mt-4">
                          <Label htmlFor="deleteConfirm">Type DELETE to confirm:</Label>
                          <Input
                            id="deleteConfirm"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="DELETE"
                            className="mt-2"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
                      >
                        {isDeletingAccount ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete Account"
                        )}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Settings;
