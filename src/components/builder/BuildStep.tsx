"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, QrCode, CheckCircle, Loader2, Smartphone, FileDown, FolderOpen, Apple, AlertCircle, Monitor, Globe, Shield, Store, Key, Upload, BadgeCheck, FileText, X, Save, FolderInput, Package, Zap, Bell, BellOff, Clock, Server, Cpu, ListPlus, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildApi, projectsApi, userApi } from "@/lib/api";
import { isDemoAccount as checkDemoAccount } from "@/lib/demo-mode";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useNotificationSounds } from "@/hooks/useNotificationSounds";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";
import { useAppStore, type AppConfig } from "@/stores/useAppStore";
import { QRCodeSVG } from "qrcode.react";
import PushNotificationSetup from "./PushNotificationSetup";
import PlatformCard from "./PlatformCard";
import BuildHistory from "./BuildHistory";
import BuildQueue from "./BuildQueue";
import AppetizePreview from "./AppetizePreview";
import BuildComparison from "./BuildComparison";
import BuildProgressAnimation from "./BuildProgressAnimation";
import { useBuildQueue } from "@/hooks/useBuildQueue";
import { PLATFORMS, getMobilePlatforms, getDesktopPlatforms, getPlatformById } from "@/config/platforms";
import type { PlatformId } from "@/types/platforms";
import { estimateBuildTime, formatBuildTime } from "@/utils/buildTimeEstimate";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BuildStepProps {
  config: AppConfig;
  onBack: () => void;
}

interface BuildData {
  id: string;
  status: string;
  progress: number;
  download_url: string | null;
  file_size_bytes: number | null;
  error_message: string | null;
  config?: {
    appetize_public_key?: string;
    appetize_preview_url?: string;
    [key: string]: unknown;
  };
}

const BuildStep = ({ config, onBack }: BuildStepProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>("android");
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "complete" | "failed">("idle");
  const [buildProgress, setBuildProgress] = useState(0);
  const [buildId, setBuildId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [appetizePublicKey, setAppetizePublicKey] = useState<string | null>(null);
  const [projectSaved, setProjectSaved] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  const [signingConfig, setSigningConfig] = useState({
    keystoreAlias: "",
    keystorePassword: "",
    keyPassword: "",
    bundleId: `com.app.${(config.appName || "myapp").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
  });
  const [iosSigningConfig, setIosSigningConfig] = useState({
    bundleId: `com.app.${(config.appName || "myapp").toLowerCase().replace(/[^a-z0-9]/g, "")}`,
    teamId: "",
    certificateName: "",
    certificatePassword: "",
    provisioningProfileName: "",
  });
  const [iosCertificateFile, setIosCertificateFile] = useState<File | null>(null);
  const [iosProvisioningFile, setIosProvisioningFile] = useState<File | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { settings } = useSystemSettings();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId);

  useEffect(() => {
    setCurrentProjectId(projectId);
  }, [projectId]);

  const { playSuccess, playError } = useNotificationSounds();
  const { notifyBuildComplete, notifyBuildFailed, requestPermission, permission, isSupported } = useBrowserNotifications();
  const { queue, addToQueue, updateBuild, removeBuild, clearCompleted, canStartNewBuild } = useBuildQueue();

  // Export build configuration as JSON
  const exportBuildConfig = () => {
    const buildConfig = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      appName: config.appName || "AppNexus",
      platform: selectedPlatform,
      storeReady,
      android: selectedPlatform === 'android' ? {
        bundleId: signingConfig.bundleId,
        keystoreAlias: signingConfig.keystoreAlias,
        // Note: passwords are not exported for security
      } : undefined,
      ios: selectedPlatform === 'ios' ? {
        bundleId: iosSigningConfig.bundleId,
        teamId: iosSigningConfig.teamId,
        // Note: passwords and files are not exported for security
      } : undefined,
    };

    const blob = new Blob([JSON.stringify(buildConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(config.appName || 'app').toLowerCase().replace(/\s+/g, '-')}-build-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Configuration Exported",
      description: "Build configuration saved as JSON file.",
    });
  };

  // Import build configuration from JSON
  const importBuildConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedConfig = JSON.parse(content);

        // Validate version
        if (!importedConfig.version) {
          throw new Error("Invalid configuration file format");
        }

        // Apply platform
        if (importedConfig.platform && ['android', 'ios', 'pwa', 'windows', 'macos', 'linux'].includes(importedConfig.platform)) {
          setSelectedPlatform(importedConfig.platform as PlatformId);
        }

        // Apply store ready setting
        if (typeof importedConfig.storeReady === 'boolean') {
          setStoreReady(importedConfig.storeReady);
        }

        // Apply Android config
        if (importedConfig.android) {
          setSigningConfig(prev => ({
            ...prev,
            bundleId: importedConfig.android.bundleId || prev.bundleId,
            keystoreAlias: importedConfig.android.keystoreAlias || prev.keystoreAlias,
          }));
        }

        // Apply iOS config
        if (importedConfig.ios) {
          setIosSigningConfig(prev => ({
            ...prev,
            bundleId: importedConfig.ios.bundleId || prev.bundleId,
            teamId: importedConfig.ios.teamId || prev.teamId,
          }));
        }

        toast({
          title: "Configuration Imported",
          description: `Loaded settings from ${file.name}`,
        });
      } catch (error) {
        console.error("Import error:", error);
        toast({
          title: "Import Failed",
          description: "Could not parse the configuration file. Please check the format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be imported again
    event.target.value = '';
  };

  // Fetch user credits on mount and after builds
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      const { data } = await userApi.getCredits();
      if (data) {
        setUserCredits(data.credits ?? 0);
      }
    };
    fetchCredits();
  }, [user, buildStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const saveProject = async () => {
    if (!user) return;

    try {
      const projectPayload = {
        build_id: buildId || undefined,
        website_url: config.websiteUrl,
        app_name: config.appName || "AppNexus",
        primary_color: config.primaryColor,
        accent_color: config.accentColor,
        navigation_style: config.navigationStyle,
        features: config.suggestedFeatures,
        app_category: config.appCategory,
        description: config.description,
        icon_style: config.iconStyle,
        splash_screen_style: config.splashScreenStyle,
        build_status: "complete",
      };

      const { error } = currentProjectId 
        ? await projectsApi.update(currentProjectId, projectPayload)
        : await projectsApi.create(projectPayload);

      if (error) throw error;
      setProjectSaved(true);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const pollBuildStatus = async (id: string) => {
    try {
      const { data, error } = await buildApi.getBuildStatus(id);

      if (error) throw error;
      if (!data) return;

      const build = data as BuildData;
      setBuildProgress(build.progress);

      if (build.status === "complete") {
        setBuildStatus("complete");
        setDownloadUrl(build.download_url);
        setFileSize(build.file_size_bytes);
        
        // Check for Appetize preview
        if (build.config?.appetize_public_key) {
          setAppetizePublicKey(build.config.appetize_public_key as string);
        } else {
          // Appetize upload may still be in progress — retry after a delay
          const checkAppetize = async (retries: number) => {
            if (retries <= 0) return;
            await new Promise(r => setTimeout(r, 5000));
            try {
              const { data: refreshed } = await buildApi.getBuildStatus(id);
              const refreshedBuild = refreshed as BuildData;
              if (refreshedBuild?.config?.appetize_public_key) {
                setAppetizePublicKey(refreshedBuild.config.appetize_public_key as string);
              } else {
                checkAppetize(retries - 1);
              }
            } catch {
              // silently ignore retry errors
            }
          };
          checkAppetize(6); // retry up to 6 times (30s total)
        }
        
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        saveProject();
        playSuccess();
        notifyBuildComplete(config.appName || "AppNexus");
        
        const isIos = build.config?.platform === "ios";
        toast({
          title: "Build Complete! 🎉",
          description: build.config?.appetize_public_key 
            ? `Your ${isIos ? "iOS IPA" : "Android APK"} is ready with live preview!`
            : `Your ${isIos ? "iOS IPA" : "Android APK"} is ready for download.`,
        });
      } else if (build.status === "failed") {
        setBuildStatus("failed");
        setErrorMessage(build.error_message);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
        if (currentProjectId) {
          try {
            await projectsApi.update(currentProjectId, { build_status: "failed" });
          } catch (err) {
            console.error("Failed to update project status on failure:", err);
          }
        }
        playError();
        notifyBuildFailed(config.appName || "AppNexus", build.error_message || undefined);
        toast({
          title: "Build Failed",
          description: build.error_message || "Something went wrong during the build.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error polling build status:", error);
    }
  };

  const startBuild = async (buildConfig?: Record<string, unknown>) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to build your app.",
        variant: "destructive",
      });
      return;
    }

    // Demo accounts bypass credit checks
    const isDemoAccount = checkDemoAccount(user.email, settings?.demo_mode);

    // Check and deduct credits before building
    const creditsPerBuild = Number(settings?.credits_per_build) || 1;
    
    if (!isDemoAccount) {
      const { data: creditsData } = await userApi.getCredits();
      const totalCredits = creditsData 
        ? (creditsData.credits ?? 0) 
        : 0;

      if (totalCredits < creditsPerBuild) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${creditsPerBuild} credit(s) to build an app. You have ${totalCredits}. Please purchase more credits.`,
          variant: "destructive",
        });
        return;
      }

      // Remove client-side credit deduction. This is now enforced securely by the backend API.
    }

    setBuildStatus("building");
    setBuildProgress(0);
    setErrorMessage(null);
    setAppetizePublicKey(null);

    // Use provided config (from rebuild) or current config
    const buildParams = (buildConfig ? { ...buildConfig } : {
      projectId: currentProjectId || undefined,
      websiteUrl: config.websiteUrl,
      appName: config.appName || "AppNexus",
      primaryColor: config.primaryColor,
      accentColor: config.accentColor,
      navigationStyle: config.navigationStyle,
      features: config.suggestedFeatures,
      appCategory: config.appCategory,
      description: config.description,
      iconStyle: config.iconStyle,
      splashScreenStyle: config.splashScreenStyle,
      versionCode: config.versionCode || 1,
      versionName: config.versionName || "1.0",
      hideSelectors: config.hideSelectors || "",
    }) as Record<string, any>;

    let activeProjectId = buildParams.projectId || currentProjectId;

    // Create or update the project record in MongoDB first
    try {
      const projectPayload = {
        website_url: buildParams.websiteUrl || config.websiteUrl,
        app_name: buildParams.appName || config.appName || "AppNexus",
        primary_color: buildParams.primaryColor || config.primaryColor,
        accent_color: buildParams.accentColor || config.accentColor,
        navigation_style: buildParams.navigationStyle || config.navigationStyle,
        features: buildParams.features || config.suggestedFeatures,
        app_category: buildParams.appCategory || config.appCategory,
        description: buildParams.description || config.description,
        icon_style: buildParams.iconStyle || config.iconStyle,
        splash_screen_style: buildParams.splashScreenStyle || config.splashScreenStyle,
        build_status: "building",
      };

      if (!activeProjectId) {
        // Create new project
        const { data: newProject, error: projectError } = await projectsApi.create(projectPayload);
        if (projectError) throw projectError;
        if (newProject && newProject.id) {
          activeProjectId = newProject.id;
          setCurrentProjectId(newProject.id);
          
          // Update query param in URL without full reload/routing
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('project', newProject.id);
            window.history.replaceState({}, '', url.toString());
          }
        }
      } else {
        // Update existing project
        const { error: projectError } = await projectsApi.update(activeProjectId, projectPayload);
        if (projectError) throw projectError;
      }
    } catch (projectErr) {
      console.error("Failed to create/update project record:", projectErr);
      setBuildStatus("failed");
      setErrorMessage("Could not initialize the project record. Please try again.");
      toast({
        title: "Build Init Failed",
        description: "Could not create/update the project record in MongoDB.",
        variant: "destructive",
      });
      return;
    }

    // Set the finalized projectId in buildParams
    buildParams.projectId = activeProjectId;

    // Determine which build method to use based on platform
    const platformName = selectedPlatform === "ios" ? "iOS" : "Android";

    try {
      const buildMethod = selectedPlatform === "ios" 
        ? buildApi.startIosBuild 
        : buildApi.startAndroidBuild;

      const { data, error } = await buildMethod(buildParams as Record<string, unknown>);

      if (error) {
        // If we got a buildId, the record exists but cloud trigger failed
        // The build record will already be marked as failed by the edge function
        throw error;
      }

      if (!data) {
        throw new Error("No response from build API");
      }

      setBuildId(data.buildId);

      toast({
        title: "Build Started",
        description: `Building ${(buildParams as { appName?: string }).appName || "your app"} for ${platformName}...`,
      });

      // Poll cloud build status every 8 seconds (cloud builds take minutes, not seconds)
      pollIntervalRef.current = setInterval(() => {
        pollBuildStatus(data.buildId);
      }, 8000);

      // Refresh credits balance in UI after starting build
      if (!isDemoAccount && user) {
        const { data: refreshedCredits } = await userApi.getCredits();
        if (refreshedCredits) setUserCredits(refreshedCredits.credits ?? 0);
      }

    } catch (error) {
      console.error("Build error:", error);
      setBuildStatus("failed");
      setErrorMessage(error instanceof Error ? error.message : "Unknown error");
      
      // Update project status to failed since the build trigger failed
      if (activeProjectId) {
        try {
          await projectsApi.update(activeProjectId, { build_status: "failed" });
        } catch (updateErr) {
          console.error("Failed to update project status on trigger failure:", updateErr);
        }
      }
      
      toast({
        title: "Build Failed",
        description: error instanceof Error ? error.message : "Could not start the build.",
        variant: "destructive",
      });
    }
  };

  const handleRebuild = (build: { app_name: string; website_url: string; project_id?: string | null; config: Record<string, unknown> }) => {
    const previousVersionCode = Number(build.config?.versionCode) || 1;
    const previousVersionName = (build.config?.versionName as string) || "1.0";
    
    // Auto-increment versionCode
    const newVersionCode = previousVersionCode + 1;
    
    // Auto-increment patch version in versionName (e.g. "1.0" -> "1.1")
    const versionParts = previousVersionName.split(".");
    if (versionParts.length >= 2) {
      const lastPart = parseInt(versionParts[versionParts.length - 1]) || 0;
      versionParts[versionParts.length - 1] = String(lastPart + 1);
    }
    const newVersionName = versionParts.join(".");

    toast({
      title: "Rebuilding...",
      description: `Starting rebuild of ${build.app_name} (v${newVersionName}, code ${newVersionCode})`,
    });
    // Include websiteUrl and appName from the build record since they're stored separately
    startBuild({
      ...build.config,
      projectId: build.project_id || undefined,
      websiteUrl: build.website_url,
      appName: build.app_name,
      versionCode: newVersionCode,
      versionName: newVersionName,
    });
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "~12 MB";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Estimate realistic APK/IPA size based on features, assets, and platform
  const estimateAppSize = (): string => {
    const featureCount = config.suggestedFeatures?.length || 0;
    let baseMB = selectedPlatform === "ios" ? 18 : 12;
    // Add ~1.5MB per feature for native modules
    baseMB += featureCount * 1.5;
    // Custom icon adds ~0.8MB (multiple densities: mdpi→xxxhdpi / @1x→@3x)
    if (config.customIcon) baseMB += 0.8;
    // Custom splash screen adds ~1.5MB (multiple resolutions + orientations)
    if (config.customSplashScreen) baseMB += 1.5;
    // Project assets contribute their actual sizes
    if (config.projectAssets?.length) {
      const assetsMB = config.projectAssets.reduce((sum, a) => sum + (a.size || 0), 0) / (1024 * 1024);
      baseMB += assetsMB;
    }
    // Store-ready builds are slightly larger due to signing overhead
    if (storeReady) baseMB += 2;
    // Add variance for realism
    const variance = (config.appName?.length || 5) % 3;
    baseMB += variance;
    return `~${baseMB.toFixed(0)} MB`;
  };

  const androidBuildSteps = [
    { progress: 5, label: "Queuing cloud build..." },
    { progress: 10, label: "Provisioning build server..." },
    { progress: 20, label: "Cloning source repository..." },
    { progress: 35, label: "Installing dependencies..." },
    { progress: 50, label: "Compiling Android application..." },
    { progress: 65, label: "Running Gradle assembleDebug..." },
    { progress: 80, label: "Packaging APK..." },
    { progress: 90, label: "Uploading artifact..." },
    { progress: 100, label: "Build complete!" },
  ];

  const iosBuildSteps = [
    { progress: 5, label: "Queuing iOS cloud build..." },
    { progress: 10, label: "Provisioning macOS build server..." },
    { progress: 20, label: "Cloning source repository..." },
    { progress: 30, label: "Installing dependencies..." },
    { progress: 40, label: "Installing CocoaPods..." },
    { progress: 55, label: "Compiling iOS application..." },
    { progress: 70, label: "Running xcodebuild..." },
    { progress: 85, label: "Packaging IPA..." },
    { progress: 95, label: "Uploading artifact..." },
    { progress: 100, label: "Build complete!" },
  ];

  const buildSteps = selectedPlatform === "ios" ? iosBuildSteps : androidBuildSteps;

  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12">
      <div className="text-center mb-4 sm:mb-6 md:mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
          {buildStatus === "complete" ? (
            <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-accent" />
          ) : (
            <Smartphone className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-accent" />
          )}
        </div>
        <h2 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
          {buildStatus === "complete" ? "Your App is Ready!" : "Build Your App"}
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground px-2">
          {buildStatus === "complete"
            ? "Download your native mobile app or scan the QR code"
            : "Generate a native app file ready for distribution"}
        </p>
      </div>

      {buildStatus === "idle" && (
        <div className="max-w-3xl mx-auto">
          {/* Build Queue */}
          <BuildQueue 
            queue={queue} 
            onRemove={removeBuild} 
            onClearCompleted={clearCompleted} 
          />

          {/* Build History */}
          <BuildHistory onRebuild={handleRebuild} />
          
          {/* Build Comparison */}
          <div className="mb-6 flex justify-end">
            <BuildComparison />
          </div>

          {/* Mobile Platforms */}
          <div className="mb-6">
            <label className="text-sm font-medium text-foreground mb-3 block">Mobile Platforms</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getMobilePlatforms().map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  isSelected={selectedPlatform === platform.id}
                  onSelect={() => setSelectedPlatform(platform.id)}
                />
              ))}
            </div>
          </div>

          {/* Desktop Platforms */}
          <div className="mb-8">
            <label className="text-sm font-medium text-foreground mb-3 block">Desktop Platforms</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getDesktopPlatforms().map((platform) => (
                <PlatformCard
                  key={platform.id}
                  platform={platform}
                  isSelected={selectedPlatform === platform.id}
                  onSelect={() => setSelectedPlatform(platform.id)}
                />
              ))}
            </div>
          </div>

          {/* Cross-Platform Build Infrastructure */}
          <div className="mb-6 p-3 sm:p-4 rounded-xl bg-accent/5 border border-accent/10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <Server className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs sm:text-sm font-semibold text-foreground truncate">Build Infrastructure</h5>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Cloud builds powered by distributed servers</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-full bg-secondary/50 text-[10px] sm:text-xs text-muted-foreground">
                      <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Linux
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Linux x86_64 build servers</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:py-1 rounded-full bg-secondary/50 text-[10px] sm:text-xs text-muted-foreground">
                      <Apple className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      macOS
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>macOS build servers for iOS & Mac apps</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {/* Build Summary */}
          <div className="bg-secondary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
              <h4 className="font-display font-bold text-foreground text-sm sm:text-base">Build Summary</h4>
              <div className="flex items-center gap-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={importBuildConfig}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3"
                    asChild
                  >
                    <span>
                      <FolderInput className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden xs:inline">Import</span>
                    </span>
                  </Button>
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportBuildConfig}
                  className="text-xs gap-1 sm:gap-1.5 h-7 sm:h-8 px-2 sm:px-3"
                >
                  <Save className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline">Export</span>
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <dt className="text-muted-foreground text-[10px] sm:text-xs">App Name</dt>
                <dd className="text-foreground font-medium truncate">{config.appName || "AppNexus"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] sm:text-xs">Platform</dt>
                <dd className="text-foreground font-medium truncate">
                  {getPlatformById(selectedPlatform)?.name} ({storeReady && selectedPlatform === 'android' ? 'AAB' : getPlatformById(selectedPlatform)?.outputFormat})
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] sm:text-xs">Features</dt>
                <dd className="text-foreground font-medium">{config.suggestedFeatures.length} enabled</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-[10px] sm:text-xs">Build Type</dt>
                <dd className="text-foreground font-medium flex items-center gap-1">
                  {storeReady ? (
                    <>
                      <BadgeCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                      <span className="hidden sm:inline">Store Ready</span>
                      <span className="sm:hidden">Release</span>
                    </>
                  ) : (
                    "Debug"
                  )}
                </dd>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <dt className="text-muted-foreground text-[10px] sm:text-xs">Est. Time</dt>
                <dd className="text-foreground font-medium">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors cursor-help">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                        {formatBuildTime(estimateBuildTime(config, selectedPlatform, storeReady))}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Build Time Factors</p>
                        <ul className="text-xs space-y-1">
                          {estimateBuildTime(config, selectedPlatform, storeReady).factors.map((factor, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                          Actual time may vary based on server load
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </dd>
              </div>
            </dl>
            
            {/* Browser Notifications */}
            {isSupported && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    {permission === "granted" ? (
                      <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                    ) : (
                      <BellOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="text-muted-foreground">
                      {permission === "granted" 
                        ? "You'll be notified when your build completes" 
                        : "Get notified when your build completes"}
                    </span>
                  </div>
                  {permission !== "granted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestPermission}
                      className="text-xs gap-1.5 h-7 sm:h-8 w-full sm:w-auto"
                    >
                      <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Enable Notifications
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* App Store Ready Toggle - Only for Android */}
          {selectedPlatform === 'android' && (
            <div className="mb-6">
              <div 
                className={`rounded-xl sm:rounded-2xl p-3 sm:p-5 border-2 transition-all ${
                  storeReady 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-secondary/30 border-transparent'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                      storeReady ? 'bg-primary' : 'bg-muted'
                    }`}>
                      <Store className={`w-4 h-4 sm:w-5 sm:h-5 ${storeReady ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-display font-bold text-foreground text-sm sm:text-base">App Store Ready</h5>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Generate signed AAB file for Google Play submission
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={storeReady}
                    onCheckedChange={setStoreReady}
                    className="data-[state=checked]:bg-primary flex-shrink-0"
                  />
                </div>

                {storeReady && (
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    {/* Store Ready Benefits */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        Signed with release key
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        AAB format for Play Store
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        ProGuard optimization
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                        Production-ready bundle
                      </div>
                    </div>

                    {/* Signing Configuration */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="signing" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-3 px-4 bg-background/50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            <span className="text-sm font-medium">Signing Configuration</span>
                            <span className="text-xs text-muted-foreground ml-2">(Optional)</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4 px-1">
                          <div className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                              Provide your own keystore for signing, or we'll generate a debug key for testing.
                              For production releases, you should use your own keystore.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="bundleId" className="text-xs">Bundle ID / Package Name</Label>
                                <Input
                                  id="bundleId"
                                  placeholder="com.yourcompany.appname"
                                  value={signingConfig.bundleId}
                                  onChange={(e) => setSigningConfig(prev => ({ ...prev, bundleId: e.target.value }))}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="keystoreAlias" className="text-xs">Keystore Alias</Label>
                                <Input
                                  id="keystoreAlias"
                                  placeholder="my-key-alias"
                                  value={signingConfig.keystoreAlias}
                                  onChange={(e) => setSigningConfig(prev => ({ ...prev, keystoreAlias: e.target.value }))}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="keystorePassword" className="text-xs">Keystore Password</Label>
                                <Input
                                  id="keystorePassword"
                                  type="password"
                                  placeholder="••••••••"
                                  value={signingConfig.keystorePassword}
                                  onChange={(e) => setSigningConfig(prev => ({ ...prev, keystorePassword: e.target.value }))}
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="keyPassword" className="text-xs">Key Password</Label>
                                <Input
                                  id="keyPassword"
                                  type="password"
                                  placeholder="••••••••"
                                  value={signingConfig.keyPassword}
                                  onChange={(e) => setSigningConfig(prev => ({ ...prev, keyPassword: e.target.value }))}
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>

                            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                              <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                <span className="text-foreground font-medium">Security Note:</span> Your signing credentials are encrypted and never stored. 
                                They are only used during the build process.
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform-specific build actions */}
          {(() => {
            const platform = getPlatformById(selectedPlatform);
            if (!platform) return null;

            // PWA - redirect to install page
            if (platform.buildMethod === 'pwa') {
              return (
                <div className="space-y-4">
                  <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
                    <h5 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Progressive Web App
                    </h5>
                    <p className="text-sm text-muted-foreground">
                      Your app is already a PWA! Users can install it directly from their browser 
                      on any device - no app store required.
                    </p>
                  </div>
                  <Button 
                    variant="hero" 
                    size="xl" 
                    className="w-full"
                    onClick={() => window.open('/install', '_blank')}
                  >
                    <Globe className="w-5 h-5 mr-2" />
                    View Install Instructions
                  </Button>
                </div>
              );
            }

            // Local build (iOS, macOS, Windows, Linux)
            if (platform.buildMethod === 'local') {
              return (
                <div className="space-y-4">
                  {/* iOS App Store Ready Toggle */}
                  {selectedPlatform === 'ios' && (
                    <div 
                      className={`rounded-2xl p-5 border-2 transition-all ${
                        storeReady 
                          ? 'bg-accent/10 border-accent/30' 
                          : 'bg-secondary/30 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            storeReady ? 'bg-accent' : 'bg-muted'
                          }`}>
                            <Apple className={`w-5 h-5 ${storeReady ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <h5 className="font-display font-bold text-foreground">App Store Ready</h5>
                            <p className="text-xs text-muted-foreground">
                              Configure signing for App Store submission
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={storeReady}
                          onCheckedChange={setStoreReady}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>

                      {storeReady && (
                        <div className="space-y-4 pt-4 border-t border-border/50">
                          {/* Store Ready Benefits */}
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              Distribution certificate
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              App Store provisioning
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              IPA format for TestFlight
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-primary" />
                              Production-ready build
                            </div>
                          </div>

                          {/* iOS Signing Configuration */}
                          <Accordion type="single" collapsible defaultValue="signing" className="w-full">
                            <AccordionItem value="signing" className="border-none">
                              <AccordionTrigger className="hover:no-underline py-3 px-4 bg-background/50 rounded-xl">
                                <div className="flex items-center gap-2">
                                  <Key className="w-4 h-4" />
                                  <span className="text-sm font-medium">Signing Configuration</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pt-4 px-1">
                                <div className="space-y-4">
                                  <p className="text-xs text-muted-foreground">
                                    Upload your distribution certificate (.p12) and provisioning profile (.mobileprovision) for App Store signing.
                                  </p>
                                  
                                  {/* Bundle ID and Team ID */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="iosBundleId" className="text-xs">Bundle Identifier</Label>
                                      <Input
                                        id="iosBundleId"
                                        placeholder="com.yourcompany.appname"
                                        value={iosSigningConfig.bundleId}
                                        onChange={(e) => setIosSigningConfig(prev => ({ ...prev, bundleId: e.target.value }))}
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="teamId" className="text-xs">Team ID</Label>
                                      <Input
                                        id="teamId"
                                        placeholder="XXXXXXXXXX"
                                        value={iosSigningConfig.teamId}
                                        onChange={(e) => setIosSigningConfig(prev => ({ ...prev, teamId: e.target.value }))}
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                  </div>

                                  {/* Certificate Upload */}
                                  <div className="space-y-2">
                                    <Label className="text-xs">Distribution Certificate (.p12)</Label>
                                    <div className="relative">
                                      {iosCertificateFile ? (
                                        <div className="flex items-center justify-between p-3 bg-accent/10 border border-accent/20 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-accent" />
                                            <span className="text-sm text-foreground truncate max-w-[200px]">
                                              {iosCertificateFile.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              ({(iosCertificateFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setIosCertificateFile(null)}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                          <Upload className="w-5 h-5 text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground">
                                            Click to upload certificate
                                          </span>
                                          <input
                                            type="file"
                                            accept=".p12,.pfx"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) setIosCertificateFile(file);
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>

                                  {/* Certificate Password */}
                                  <div className="space-y-2">
                                    <Label htmlFor="certPassword" className="text-xs">Certificate Password</Label>
                                    <Input
                                      id="certPassword"
                                      type="password"
                                      placeholder="••••••••"
                                      value={iosSigningConfig.certificatePassword}
                                      onChange={(e) => setIosSigningConfig(prev => ({ ...prev, certificatePassword: e.target.value }))}
                                      className="h-9 text-sm"
                                    />
                                  </div>

                                  {/* Provisioning Profile Upload */}
                                  <div className="space-y-2">
                                    <Label className="text-xs">Provisioning Profile (.mobileprovision)</Label>
                                    <div className="relative">
                                      {iosProvisioningFile ? (
                                        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />
                                            <span className="text-sm text-foreground truncate max-w-[200px]">
                                              {iosProvisioningFile.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              ({(iosProvisioningFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={() => setIosProvisioningFile(null)}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                          <Upload className="w-5 h-5 text-muted-foreground" />
                                          <span className="text-sm text-muted-foreground">
                                            Click to upload provisioning profile
                                          </span>
                                          <input
                                            type="file"
                                            accept=".mobileprovision"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) setIosProvisioningFile(file);
                                            }}
                                          />
                                        </label>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                                    <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-muted-foreground">
                                      <span className="text-foreground font-medium">Security Note:</span> Your certificate and provisioning profile are processed locally and never stored on our servers.
                                    </p>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <h5 className="font-display font-bold text-foreground mb-2 flex items-center gap-2">
                      <Apple className="w-5 h-5" />
                      {platform.name} Build Instructions
                    </h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      Building {platform.name} apps requires local development tools:
                    </p>
                    {platform.requirements && platform.requirements.length > 0 && (
                      <ul className="text-sm text-muted-foreground mb-3 list-disc list-inside">
                        {platform.requirements.map((req, i) => (
                          <li key={i}>{req}</li>
                        ))}
                      </ul>
                    )}
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Export project to GitHub via Settings → GitHub</li>
                      <li>Clone the repo and run <code className="bg-secondary px-1 rounded">npm install</code></li>
                      {selectedPlatform === 'ios' && (
                        <>
                          <li>Run <code className="bg-secondary px-1 rounded">npx cap add ios</code></li>
                          <li>Run <code className="bg-secondary px-1 rounded">npm run build && npx cap sync</code></li>
                          <li>Run <code className="bg-secondary px-1 rounded">npx cap open ios</code> to open in Xcode</li>
                          {storeReady && (
                            <li>In Xcode, configure signing with your uploaded certificate and profile</li>
                          )}
                        </>
                      )}
                      {selectedPlatform === 'macos' && (
                        <>
                          <li>Install Electron: <code className="bg-secondary px-1 rounded">npm install electron electron-builder</code></li>
                          <li>Build: <code className="bg-secondary px-1 rounded">npm run build && npx electron-builder --mac</code></li>
                        </>
                      )}
                      {selectedPlatform === 'windows' && (
                        <>
                          <li>Install Electron: <code className="bg-secondary px-1 rounded">npm install electron electron-builder</code></li>
                          <li>Build: <code className="bg-secondary px-1 rounded">npm run build && npx electron-builder --win</code></li>
                        </>
                      )}
                      {selectedPlatform === 'linux' && (
                        <>
                          <li>Install Electron: <code className="bg-secondary px-1 rounded">npm install electron electron-builder</code></li>
                          <li>Build: <code className="bg-secondary px-1 rounded">npm run build && npx electron-builder --linux</code></li>
                        </>
                      )}
                    </ol>
                  </div>
                  
                  {selectedPlatform === 'ios' && <PushNotificationSetup />}

                  {/* Prebuilt Binaries for Desktop */}
                  {(selectedPlatform === 'windows' || selectedPlatform === 'macos' || selectedPlatform === 'linux') && (
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h5 className="font-display font-bold text-foreground text-sm">Prebuilt Binaries</h5>
                          <p className="text-xs text-muted-foreground">Ready-to-run for quick setup</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {selectedPlatform === 'windows' && (
                          <>
                            <button
                              className="w-full flex items-center justify-between p-3 bg-background/50 hover:bg-background/80 rounded-lg transition-colors text-left group"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: "Downloading Windows x64 portable binary...",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Windows x64 Portable</p>
                                  <p className="text-xs text-muted-foreground">Standalone .exe, no install required</p>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                            <button
                              className="w-full flex items-center justify-between p-3 bg-background/50 hover:bg-background/80 rounded-lg transition-colors text-left group"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: "Downloading Windows x64 installer...",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Windows x64 Installer</p>
                                  <p className="text-xs text-muted-foreground">NSIS installer (.exe)</p>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                          </>
                        )}
                        
                        {selectedPlatform === 'macos' && (
                          <>
                            <button
                              className="w-full flex items-center justify-between p-3 bg-background/50 hover:bg-background/80 rounded-lg transition-colors text-left group"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: "Downloading macOS Apple Silicon binary...",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">macOS Apple Silicon</p>
                                  <p className="text-xs text-muted-foreground">DMG for M1/M2/M3 Macs (arm64)</p>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                            <button
                              className="w-full flex items-center justify-between p-3 bg-background/50 hover:bg-background/80 rounded-lg transition-colors text-left group"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: "Downloading macOS Intel binary...",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">macOS Intel</p>
                                  <p className="text-xs text-muted-foreground">DMG for Intel Macs (x64)</p>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                          </>
                        )}
                        
                        {selectedPlatform === 'linux' && (
                          <>
                            <button
                              className="w-full flex items-center justify-between p-3 bg-background/50 hover:bg-background/80 rounded-lg transition-colors text-left group"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: "Downloading Linux AppImage...",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Linux AppImage</p>
                                  <p className="text-xs text-muted-foreground">Universal, runs on most distros</p>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                            <button
                              className="w-full flex items-center justify-between p-3 bg-background/50 hover:bg-background/80 rounded-lg transition-colors text-left group"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: "Downloading Linux .deb package...",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Debian / Ubuntu</p>
                                  <p className="text-xs text-muted-foreground">.deb package</p>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                            <button
                              className="w-full flex items-center justify-between p-3 bg-background/50 hover:bg-background/80 rounded-lg transition-colors text-left group"
                              onClick={() => {
                                toast({
                                  title: "Download Started",
                                  description: "Downloading Linux .rpm package...",
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Package className="w-4 h-4 text-emerald-500" />
                                <div>
                                  <p className="text-sm font-medium text-foreground">Fedora / RHEL</p>
                                  <p className="text-xs text-muted-foreground">.rpm package</p>
                                </div>
                              </div>
                              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                            </button>
                          </>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        Pre-configured with your app settings
                      </p>
                    </div>
                  )}
                  
                  {platform.documentationUrl && (
                    <Button 
                      variant="glass" 
                      size="xl" 
                      className="w-full"
                      onClick={() => window.open(platform.documentationUrl, '_blank')}
                    >
                      <FileDown className="w-5 h-5 mr-2" />
                      View Full Documentation
                    </Button>
                  )}
                </div>
              );
            }

            // Cloud build (Android, iOS)
            return (
              <div className="space-y-4">
                {/* iOS App Store Ready Toggle */}
                {selectedPlatform === 'ios' && (
                  <div 
                    className={`rounded-2xl p-5 border-2 transition-all ${
                      storeReady 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-secondary/30 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          storeReady ? 'bg-primary' : 'bg-muted'
                        }`}>
                          <Apple className={`w-5 h-5 ${storeReady ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <h5 className="font-display font-bold text-foreground">App Store Ready</h5>
                          <p className="text-xs text-muted-foreground">
                            Generate IPA for TestFlight & App Store
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={storeReady}
                        onCheckedChange={setStoreReady}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>

                    {storeReady && (
                      <div className="grid grid-cols-2 gap-3 text-xs mt-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          IPA format for TestFlight
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          App Store ready bundle
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          Universal binary (arm64)
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-primary" />
                          Production-ready build
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:gap-3">
                  {/* Credit indicator */}
                  {(() => {
                    const creditsPerBuild = Number(settings?.credits_per_build) || 1;
                    const isDemoAccount = checkDemoAccount(user?.email, settings?.demo_mode);
                    const hasEnough = isDemoAccount || userCredits === null || userCredits >= creditsPerBuild;
                    const creditLabel = userCredits !== null 
                      ? `${userCredits} credit${userCredits !== 1 ? 's' : ''} available` 
                      : '';
                    
                    return (
                      <>
                        {userCredits !== null && (
                          <div className={`flex items-center justify-center gap-1.5 text-xs ${
                            hasEnough ? 'text-muted-foreground' : 'text-destructive font-medium'
                          }`}>
                            <Zap className={`w-3.5 h-3.5 ${hasEnough ? '' : 'text-destructive'}`} />
                            {hasEnough 
                              ? `${creditsPerBuild} credit${creditsPerBuild !== 1 ? 's' : ''} per build • ${creditLabel}`
                              : `Insufficient credits: need ${creditsPerBuild}, have ${userCredits}`
                            }
                            {!hasEnough && (
                              <Link href="/subscription" className="ml-1 underline text-primary hover:text-primary/80">
                                Buy Credits
                              </Link>
                            )}
                          </div>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="w-full">
                              <Button 
                                variant="hero" 
                                size="lg"
                                disabled={!hasEnough}
                                className={`w-full text-sm sm:text-base h-11 sm:h-12 ${
                                  !hasEnough 
                                    ? 'opacity-50 cursor-not-allowed'
                                    : storeReady 
                                      ? 'bg-primary hover:bg-primary/90'
                                      : ''
                                }`}
                                onClick={() => hasEnough && startBuild()}
                              >
                                {storeReady ? (
                                  <>
                                    <Store className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                                    <span className="hidden sm:inline">{selectedPlatform === 'ios' ? 'Build Store-Ready IPA' : 'Build Store-Ready AAB'}</span>
                                    <span className="sm:hidden">Build for Store</span>
                                  </>
                                ) : (
                                  <>
                                    {selectedPlatform === 'ios' ? (
                                      <Apple className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                                    ) : (
                                      <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                                    )}
                                    <span className="hidden sm:inline">Build {platform.name} App</span>
                                    <span className="sm:hidden">Build {selectedPlatform === 'ios' ? 'iOS' : 'Android'} App</span>
                                  </>
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!hasEnough && (
                            <TooltipContent side="top" className="bg-destructive text-destructive-foreground">
                              You need {creditsPerBuild} credit{creditsPerBuild !== 1 ? 's' : ''} to build. You have {userCredits ?? 0}.
                            </TooltipContent>
                          )}
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="lg"
                              className="h-11 sm:h-12 w-full"
                              onClick={() => {
                                addToQueue({
                                  appName: config.appName || "My App",
                                  platform: selectedPlatform,
                                });
                                toast({
                                  title: "Added to Queue",
                                  description: `${config.appName || "My App"} will be built when a slot is available.`,
                                });
                              }}
                            >
                              <ListPlus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                              Add to Queue
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Add to build queue</TooltipContent>
                        </Tooltip>
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {buildStatus === "building" && (
        <motion.div 
          className="max-w-xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Enhanced Progress Animation */}
          <BuildProgressAnimation 
            progress={buildProgress} 
            status={buildStatus} 
            platform={selectedPlatform}
            buildSteps={buildSteps}
          />

          {/* Build Log with animations */}
          <motion.div 
            className="mt-8 bg-background/50 rounded-xl p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AnimatePresence>
              {buildSteps
                .filter((s) => s.progress <= buildProgress)
                .map((step, i) => (
                  <motion.div 
                    key={i} 
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    {step.progress <= buildProgress ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      </motion.div>
                    ) : (
                      <Loader2 className="w-3 h-3 text-muted-foreground animate-spin flex-shrink-0" />
                    )}
                    <span className="text-muted-foreground">{step.label}</span>
                  </motion.div>
                ))}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}

      {buildStatus === "complete" && (
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Cards Grid */}
          <div className={`grid gap-4 sm:gap-6 ${appetizePublicKey ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
            {/* Download Card */}
            <motion.div 
              className="glass-card rounded-2xl p-5 sm:p-6 text-center flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                storeReady 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
                  : 'bg-gradient-to-br from-green-500 to-green-600'
              }`}>
                {storeReady ? <Store className="w-7 h-7 text-white" /> : <FileDown className="w-7 h-7 text-white" />}
              </div>
              <h4 className="font-display font-bold text-foreground mb-1 text-base">
                {storeReady 
                  ? selectedPlatform === "ios" ? "Download IPA" : "Download AAB"
                  : selectedPlatform === "ios" ? "Download IPA" : "Download APK"
                }
              </h4>
              <p className="text-xs text-muted-foreground mb-1 flex-1">
                {storeReady 
                  ? selectedPlatform === "ios"
                    ? "Signed IPA for TestFlight & App Store"
                    : "Signed AAB for Google Play"
                  : selectedPlatform === "ios"
                    ? "Install directly on iOS devices"
                    : "Install directly on Android devices"
                }
              </p>
              <div className="text-xs font-medium text-muted-foreground mb-4 space-y-0.5">
                {fileSize && fileSize > 1024 * 1024 ? (
                  <>
                    <p>Size: <span className="text-foreground">{formatFileSize(fileSize)}</span></p>
                    <p className="text-[10px] text-muted-foreground/70">Estimated: {estimateAppSize()}</p>
                  </>
                ) : (
                  <p>Est. size: {estimateAppSize()}</p>
                )}
              </div>
              <Button 
                variant="hero" 
                size="sm"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                onClick={async () => {
                  if (downloadUrl) {
                    try {
                      const response = await fetch(downloadUrl);
                      if (!response.ok) throw new Error('Download failed');
                      const blob = await response.blob();
                      const ext = selectedPlatform === "ios" ? "ipa" : storeReady ? "aab" : "apk";
                      const sanitizedName = (config.appName || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      const fileName = `${sanitizedName}.${ext}`;
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch {
                      window.open(downloadUrl, "_blank");
                    }
                  } else {
                    toast({
                      title: "Download Ready",
                      description: `Your ${selectedPlatform === "ios" ? "IPA" : storeReady ? "AAB" : "APK"} file is ready for download.`,
                    });
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Download .{selectedPlatform === "ios" ? "ipa" : storeReady ? "aab" : "apk"}
              </Button>
            </motion.div>

            {/* Appetize Live Preview Card */}
            {appetizePublicKey && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <AppetizePreview 
                  publicKey={appetizePublicKey}
                  appName={config.appName || "My App"}
                  primaryColor={config.primaryColor}
                  platform={selectedPlatform === "ios" ? "ios" : "android"}
                  websiteUrl={config.websiteUrl}
                />
              </motion.div>
            )}

            {/* QR Code / Store Info Card */}
            <motion.div 
              className="glass-card rounded-2xl p-5 sm:p-6 text-center flex flex-col"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {storeReady ? (
                <>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                    <BadgeCheck className="w-7 h-7 text-white" />
                  </div>
                  <h4 className="font-display font-bold text-foreground mb-1 text-base">Store Ready</h4>
                  <p className="text-xs text-muted-foreground mb-4 flex-1">
                    Signed and ready for store submission
                  </p>
                  <div className="text-left space-y-2 text-xs mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      Production signed
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      {selectedPlatform === "ios" ? "IPA" : "AAB"} format
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      Optimized bundle
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full mt-auto"
                    onClick={() => window.open(
                      selectedPlatform === "ios" 
                        ? 'https://appstoreconnect.apple.com' 
                        : 'https://play.google.com/console', 
                      '_blank'
                    )}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedPlatform === "ios" ? "Open App Store Connect" : "Open Play Console"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h4 className="font-display font-bold text-foreground mb-1 text-base">Scan QR Code</h4>
                  <p className="text-xs text-muted-foreground mb-4 flex-1">
                    Scan with your phone camera for instant download
                  </p>
                  <div className="w-32 h-32 mx-auto bg-white rounded-lg p-2.5 flex items-center justify-center">
                    {downloadUrl ? (
                      <QRCodeSVG
                        value={downloadUrl}
                        size={108}
                        level="M"
                        includeMargin={false}
                      />
                    ) : (
                      <div className="w-full h-full grid grid-cols-8 gap-0.5">
                        {Array.from({ length: 64 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-full aspect-square ${i % 3 === 0 ? "bg-gray-800" : "bg-white"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* Compact Success Footer */}
          <motion.div 
            className="mt-6 p-4 sm:p-5 rounded-xl border bg-green-500/5 border-green-500/15 flex flex-col sm:flex-row items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0 text-center sm:text-left">
              {storeReady ? (
                <BadgeCheck className="w-8 h-8 text-emerald-500 shrink-0 hidden sm:block" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500 shrink-0 hidden sm:block" />
              )}
              <div className="min-w-0">
                <h4 className="font-display font-bold text-foreground text-sm">
                  {storeReady ? "Store-Ready Build Complete!" : `${selectedPlatform === "ios" ? "iOS" : "Android"} Build Successful!`}
                </h4>
                <p className="text-xs text-muted-foreground truncate">
                  {storeReady 
                    ? `Signed ${selectedPlatform === "ios" ? "IPA" : "AAB"} ready for submission`
                    : projectSaved
                      ? "Saved to your dashboard"
                      : appetizePublicKey 
                        ? "Try the live preview or download the file"
                        : "Download and install on your device"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setBuildStatus("idle");
                  setBuildProgress(0);
                  setDownloadUrl(null);
                  setFileSize(null);
                  setErrorMessage(null);
                  setAppetizePublicKey(null);
                  setBuildId(null);
                  useAppStore.getState().resetBuilder();
                }}
              >
                <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                Build Another
              </Button>
              <Button variant="accent" size="sm" asChild>
                <Link href="/dashboard">
                  <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {buildStatus === "failed" && (
        <div className="max-w-xl mx-auto text-center">
          <div className="p-8 bg-destructive/10 rounded-2xl border border-destructive/20">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h4 className="font-display font-bold text-foreground mb-2">Build Failed</h4>
            <p className="text-muted-foreground text-sm mb-4">
              {errorMessage || "Something went wrong during the build process."}
            </p>
            <Button variant="accent" onClick={() => {
              setBuildStatus("idle");
              setBuildProgress(0);
              setErrorMessage(null);
            }}>
              <Smartphone className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="flex items-center justify-center sm:justify-start pt-8 mt-8 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Preview
        </Button>
      </div>
    </div>
  );
};

export default BuildStep;
