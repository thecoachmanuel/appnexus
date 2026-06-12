"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import AppleIcon from "@/components/builder/AppleIcon";
import {
  FileCode,
  Image,
  Box,
  Smartphone,
  Package,
  Layers,
  Shield,
  Palette,
  Globe,
  Calendar,
  HardDrive,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Terminal,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Build {
  id: string;
  app_name: string;
  package_name: string;
  website_url: string;
  status: string;
  progress: number;
  download_url: string | null;
  error_message: string | null;
  file_size_bytes: number | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface BuildDetailsDrawerProps {
  build: Build | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getPlatform = (config: Record<string, unknown>): string => {
  return (config?.platform as string) || (config?.targetPlatform as string) || "android";
};

interface ResourceEntry {
  path: string;
  description: string;
  icon: React.ElementType;
  category: string;
}

function getApkResources(build: Build): ResourceEntry[] {
  const platform = getPlatform(build.config);
  if (platform === "ios") {
    return [
      { path: "Payload/App.app/Info.plist", description: "App metadata & configuration", icon: FileCode, category: "Configuration" },
    ];
  }

  const resources: ResourceEntry[] = [
    // Core
    { path: "AndroidManifest.xml", description: "Binary XML manifest with app permissions, activities, and intent filters", icon: FileCode, category: "Core" },
    { path: "classes.dex", description: "Dalvik bytecode with WebView activity, splash screen, and back-button handling", icon: Box, category: "Core" },
    { path: "resources.arsc", description: "Compiled resource table mapping IDs to drawables, mipmaps, and strings", icon: Package, category: "Core" },

    // Standard Icons (5 densities)
    { path: "res/mipmap-mdpi-v4/ic_launcher.png", description: "48×48 standard icon", icon: Image, category: "Standard Icons" },
    { path: "res/mipmap-hdpi-v4/ic_launcher.png", description: "72×72 standard icon", icon: Image, category: "Standard Icons" },
    { path: "res/mipmap-xhdpi-v4/ic_launcher.png", description: "96×96 standard icon", icon: Image, category: "Standard Icons" },
    { path: "res/mipmap-xxhdpi-v4/ic_launcher.png", description: "144×144 standard icon", icon: Image, category: "Standard Icons" },
    { path: "res/mipmap-xxxhdpi-v4/ic_launcher.png", description: "192×192 standard icon", icon: Image, category: "Standard Icons" },

    // Round Icons (5 densities)
    { path: "res/mipmap-mdpi-v4/ic_launcher_round.png", description: "48×48 round icon", icon: Image, category: "Round Icons" },
    { path: "res/mipmap-hdpi-v4/ic_launcher_round.png", description: "72×72 round icon", icon: Image, category: "Round Icons" },
    { path: "res/mipmap-xhdpi-v4/ic_launcher_round.png", description: "96×96 round icon", icon: Image, category: "Round Icons" },
    { path: "res/mipmap-xxhdpi-v4/ic_launcher_round.png", description: "144×144 round icon", icon: Image, category: "Round Icons" },
    { path: "res/mipmap-xxxhdpi-v4/ic_launcher_round.png", description: "192×192 round icon", icon: Image, category: "Round Icons" },

    // Adaptive Icons (Android 8+)
    { path: "res/mipmap-anydpi-v26/ic_launcher.xml", description: "Adaptive icon XML referencing foreground & background layers", icon: Layers, category: "Adaptive Icons (API 26+)" },
    { path: "res/mipmap-anydpi-v26/ic_launcher_round.xml", description: "Adaptive round icon XML for dynamic masking", icon: Layers, category: "Adaptive Icons (API 26+)" },
    { path: "res/drawable/ic_launcher_foreground.png", description: "432×432 foreground layer (66% safe zone)", icon: Palette, category: "Adaptive Icons (API 26+)" },
    { path: "res/drawable/ic_launcher_background.png", description: "432×432 solid-color background layer", icon: Palette, category: "Adaptive Icons (API 26+)" },

    // Splash
    { path: "res/drawable/splash_background.png", description: "480×854 gradient splash screen background", icon: Image, category: "Splash Screen" },

    // Signing
    { path: "META-INF/MANIFEST.MF", description: "JAR manifest with SHA-256 digests for all entries", icon: Shield, category: "JAR Signing (v1)" },
    { path: "META-INF/CERT.SF", description: "Signature file with manifest digest", icon: Shield, category: "JAR Signing (v1)" },
    { path: "META-INF/CERT.RSA", description: "PKCS#7 signed data with self-signed X.509 certificate (RSA-2048)", icon: Shield, category: "JAR Signing (v1)" },
  ];

  return resources;
}

const categoryIcons: Record<string, React.ElementType> = {
  "Core": Box,
  "Standard Icons": Image,
  "Round Icons": Image,
  "Adaptive Icons (API 26+)": Layers,
  "Splash Screen": Image,
  "JAR Signing (v1)": Shield,
  "Configuration": FileCode,
};

const statusMap: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-500", label: "Pending" },
  building: { icon: Loader2, color: "text-blue-500", label: "Building" },
  completed: { icon: CheckCircle2, color: "text-green-500", label: "Completed" },
  complete: { icon: CheckCircle2, color: "text-green-500", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
};

export function BuildDetailsDrawer({ build, open, onOpenChange }: BuildDetailsDrawerProps) {
  if (!build) return null;

  const platform = getPlatform(build.config);
  const resources = getApkResources(build);
  const statusInfo = statusMap[build.status] || statusMap.pending;
  const StatusIcon = statusInfo.icon;

  // Group resources by category
  const grouped = resources.reduce<Record<string, ResourceEntry[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] || []).push(r);
    return acc;
  }, {});

  const config = build.config || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            {platform === "ios" ? <AppleIcon className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            {build.app_name}
          </SheetTitle>
          <SheetDescription className="text-xs">{build.package_name}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          {/* Build Summary */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <div className={cn("flex items-center gap-1.5 text-sm font-medium", statusInfo.color)}>
                <StatusIcon className={cn("w-4 h-4", build.status === "building" && "animate-spin")} />
                {statusInfo.label}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">File Size</div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <HardDrive className="w-4 h-4" />
                {formatFileSize(build.file_size_bytes)}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Platform</div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                {platform === "ios" ? <AppleIcon className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                {platform === "ios" ? "iOS (IPA)" : "Android (APK)"}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-xs text-muted-foreground mb-1">Created</div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Calendar className="w-4 h-4" />
                {format(new Date(build.created_at), "MMM d, yyyy")}
              </div>
            </div>
          </div>

          {/* Config details */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">Build Configuration</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Website URL</span>
                <span className="text-foreground truncate max-w-[200px]">{build.website_url}</span>
              </div>
              {config.primaryColor && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Palette className="w-3.5 h-3.5" /> Primary Color</span>
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: config.primaryColor as string }} />
                    {config.primaryColor as string}
                  </span>
                </div>
              )}
              {config.accentColor && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Palette className="w-3.5 h-3.5" /> Accent Color</span>
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: config.accentColor as string }} />
                    {config.accentColor as string}
                  </span>
                </div>
              )}
              {config.navigationStyle && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Navigation</span>
                  <span className="text-foreground">{config.navigationStyle as string}</span>
                </div>
              )}
              {Array.isArray(config.features) && config.features.length > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground block mb-1.5">Features</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(config.features as string[]).map((f) => (
                      <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Error Details (for failed builds) */}
          {build.status === "failed" && build.error_message && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Build Error
              </h3>
              <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-4 space-y-3">
                {/* Step name */}
                {(config.failedStep || build.error_message.includes("Step:")) && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Failed Step</div>
                    <p className="text-sm font-medium text-red-500">
                      {(config.failedStep as string) || build.error_message.split(" — ")[0]?.replace("Step: ", "")}
                    </p>
                  </div>
                )}
                {/* Error message */}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Error Message</div>
                  <p className="text-sm text-foreground">
                    {(config.failedStepMessage as string) || build.error_message.split(" — ").slice(1).join(" — ") || build.error_message}
                  </p>
                </div>
                {/* Log excerpt */}
                {config.failedStepLog && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      Build Log (last lines)
                    </div>
                    <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded p-3 overflow-x-auto max-h-48 whitespace-pre-wrap font-mono">
                      {config.failedStepLog as string}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator className="mb-6" />

          {/* APK Resources */}
          <div className="pb-6">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              {platform === "ios" ? "IPA Contents" : "APK Resources"}
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              {resources.length} files included in the archive
            </p>

            <div className="space-y-5">
              {Object.entries(grouped).map(([category, entries]) => {
                const CatIcon = categoryIcons[category] || Box;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <CatIcon className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">{category}</h4>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entries.length}</Badge>
                    </div>
                    <div className="space-y-1">
                      {entries.map((entry) => {
                        const EntryIcon = entry.icon;
                        return (
                          <div
                            key={entry.path}
                            className="group rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              <EntryIcon className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-mono text-foreground truncate">{entry.path}</p>
                                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{entry.description}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
