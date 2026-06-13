"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  HardDrive, FolderOpen, Shield, Globe, Lock, RefreshCw,
  Cloud, Database, Settings, BarChart3, FileImage, FileArchive, File,
  Eye, EyeOff, Plus, AlertTriangle, ImageIcon, Zap, Link2, Copy,
  Clock, Download, Users, Gauge, Timer, CheckCircle2,
} from "lucide-react";

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  created_at: string;
  updated_at: string;
  fileCount?: number;
  totalSize?: number;
}

interface StorageSettingsProps {
  loading?: boolean;
}

const PROVIDER_OPTIONS = [
  { value: "apiClient", label: "Cloud Storage", description: "Built-in managed storage (default)" },
  { value: "s3", label: "Amazon S3", description: "AWS S3 compatible storage" },
  { value: "gcs", label: "Google Cloud Storage", description: "GCS bucket storage" },
  { value: "r2", label: "Cloudflare R2", description: "S3-compatible edge storage" },
  { value: "local", label: "Local Storage", description: "Self-hosted local file system" },
];

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

function getFileIcon(mimeTypes: string[] | null) {
  if (!mimeTypes || mimeTypes.length === 0) return <File className="w-5 h-5" />;
  const first = mimeTypes[0];
  if (first.startsWith("image/")) return <FileImage className="w-5 h-5" />;
  if (first.includes("zip") || first.includes("archive")) return <FileArchive className="w-5 h-5" />;
  return <File className="w-5 h-5" />;
}

export function StorageSettings({ loading: externalLoading }: StorageSettingsProps) {
  const { toast } = useToast();
  const [buckets, setBuckets] = useState<BucketInfo[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [provider, setProvider] = useState("apiClient");
  const [providerConfig, setProviderConfig] = useState({
    endpoint: "",
    region: "",
    accessKey: "",
    secretKey: "",
    bucket: "",
    projectId: "",
    serviceAccountKey: "",
    accountId: "",
    storagePath: "",
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newBucket, setNewBucket] = useState({
    name: "",
    isPublic: true,
    fileSizeLimit: "",
  });

  // Image processing settings
  const [imageProcessing, setImageProcessing] = useState({
    autoOptimize: true,
    autoThumbnails: true,
    thumbnailSize: 200,
    maxUploadWidth: 1920,
    maxUploadHeight: 1920,
    defaultQuality: 80,
    defaultFormat: "webp" as "webp" | "jpeg" | "png",
    stripMetadata: true,
    autoWebp: true,
  });

  // CDN & caching settings
  const [cdnSettings, setCdnSettings] = useState({
    enableCdn: true,
    cacheControl: "public, max-age=31536000",
    immutableAssets: true,
    edgeLocations: "auto",
    customDomain: "",
    enableCompression: true,
    lazyLoadDefault: true,
    preloadCritical: true,
  });

  // Access control settings  
  const [accessControl, setAccessControl] = useState({
    defaultSignedUrlExpiry: 3600,
    maxSignedUrlExpiry: 86400,
    enableDownloadTracking: true,
    enableHotlinkProtection: false,
    allowedOrigins: "*",
    requireAuth: true,
    enableVersioning: false,
  });

  // Quota settings
  const [quotaSettings, setQuotaSettings] = useState({
    enableQuotas: true,
    freeQuotaMB: 100,
    proQuotaMB: 5120,
    enterpriseQuotaMB: 51200,
    alertThreshold: 80,
    enableAlerts: true,
    maxFileCount: 1000,
    enablePerUserTracking: true,
  });

  // Signed URL generator state
  const [signedUrlBucket, setSignedUrlBucket] = useState("");
  const [signedUrlPath, setSignedUrlPath] = useState("");
  const [signedUrlExpiry, setSignedUrlExpiry] = useState(3600);
  const [generatedUrl, setGeneratedUrl] = useState("");

  // ── Persistence: Load settings from system_settings ──
  const loadPersistedSettings = useCallback(async () => {
    try {
      const { data, error } = await apiClient
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "storage_image_processing",
          "storage_cdn",
          "storage_access_control",
          "storage_quotas",
          "storage_provider",
        ]);
      if (error) throw error;
      if (!data) return;

      for (const row of data) {
        const parsed = typeof row.value === "string" ? JSON.parse(row.value as string) : row.value;
        switch (row.key) {
          case "storage_image_processing":
            setImageProcessing(prev => ({ ...prev, ...(parsed as Record<string, unknown>) }));
            break;
          case "storage_cdn":
            setCdnSettings(prev => ({ ...prev, ...(parsed as Record<string, unknown>) }));
            break;
          case "storage_access_control":
            setAccessControl(prev => ({ ...prev, ...(parsed as Record<string, unknown>) }));
            break;
          case "storage_quotas":
            setQuotaSettings(prev => ({ ...prev, ...(parsed as Record<string, unknown>) }));
            break;
          case "storage_provider":
            if ((parsed as Record<string, unknown>).provider) setProvider((parsed as Record<string, unknown>).provider as string);
            if ((parsed as Record<string, unknown>).config) setProviderConfig(prev => ({ ...prev, ...((parsed as Record<string, unknown>).config as Record<string, string>) }));
            break;
        }
      }
    } catch (err) {
      console.error("Failed to load storage settings:", err);
    }
  }, []);

  useEffect(() => {
    loadPersistedSettings();
  }, [loadPersistedSettings]);

  const persistSetting = useCallback(async (key: string, value: unknown, sectionLabel: string) => {
    try {
      // Try update first, then insert if not found
      const { data: existing } = await apiClient
        .from("system_settings")
        .select("id")
        .eq("key", key)
        .maybeSingle();

      const jsonValue = value as any;
      if (existing) {
        const { error } = await apiClient
          .from("system_settings")
          .update({ value: jsonValue })
          .eq("key", key);
        if (error) throw error;
      } else {
        const { error } = await apiClient
          .from("system_settings")
          .insert([{ key, value: jsonValue, category: "storage", description: `Storage: ${sectionLabel}` }]);
        if (error) throw error;
      }
      toast({ title: "Settings Saved", description: `${sectionLabel} settings saved successfully` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Save Failed", description: message, variant: "destructive" });
    }
  }, [toast]);

  const handleCreateBucket = async () => {
    if (!newBucket.name.trim()) {
      toast({ title: "Error", description: "Bucket name is required", variant: "destructive" });
      return;
    }

    const sanitized = newBucket.name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    setCreating(true);
    try {
      const fileSizeLimitBytes = newBucket.fileSizeLimit
        ? parseInt(newBucket.fileSizeLimit, 10) * 1024 * 1024
        : undefined;

      const { data: { session } } = await apiClient.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/functions/v1/storage-admin?action=create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            name: sanitized,
            isPublic: newBucket.isPublic,
            fileSizeLimit: fileSizeLimitBytes,
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create bucket");

      toast({ title: "Bucket Created", description: `"${sanitized}" bucket created successfully` });
      setCreateDialogOpen(false);
      setNewBucket({ name: "", isPublic: true, fileSizeLimit: "" });
      await fetchBuckets();
    } catch (err: any) {
      toast({ title: "Failed to create bucket", description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const fetchBuckets = useCallback(async () => {
    try {
      const { data: { session } } = await apiClient.auth.getSession();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/functions/v1/storage-admin?action=list`,
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch buckets");

      setBuckets(data as BucketInfo[]);
    } catch (err) {
      console.error("Failed to fetch buckets:", err);
      toast({ title: "Error", description: "Failed to load storage buckets", variant: "destructive" });
    } finally {
      setLoadingBuckets(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBuckets();
    setRefreshing(false);
    toast({ title: "Refreshed", description: "Storage data updated" });
  };

  const handleGenerateSignedUrl = async () => {
    if (!signedUrlBucket || !signedUrlPath) {
      toast({ title: "Error", description: "Bucket and file path are required", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await apiClient.storage
        .from(signedUrlBucket)
        .createSignedUrl(signedUrlPath, signedUrlExpiry);
      if (error) throw error;
      setGeneratedUrl(data.signedUrl);
      toast({ title: "URL Generated", description: `Signed URL valid for ${Math.round(signedUrlExpiry / 60)} minutes` });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "URL copied to clipboard" });
  };

  const handleSaveSettings = (section: string) => {
    switch (section) {
      case "Image Processing":
        persistSetting("storage_image_processing", imageProcessing, section);
        break;
      case "CDN & Caching":
        persistSetting("storage_cdn", cdnSettings, section);
        break;
      case "Access Control":
        persistSetting("storage_access_control", accessControl, section);
        break;
      case "Quota":
        persistSetting("storage_quotas", quotaSettings, section);
        break;
      default:
        toast({ title: "Settings Saved", description: `${section} settings saved successfully` });
    }
  };

  const totalFiles = buckets.reduce((acc, b) => acc + (b.fileCount || 0), 0);
  const totalStorage = buckets.reduce((acc, b) => acc + (b.totalSize || 0), 0);
  const publicBuckets = buckets.filter(b => b.public).length;
  const privateBuckets = buckets.filter(b => !b.public).length;

  const isLoading = externalLoading || loadingBuckets;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-primary" />
            Storage Settings
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage storage buckets, image processing, CDN, access control, and quotas
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="buckets" className="space-y-4">
        <TabsList className="flex flex-wrap w-full max-w-2xl">
          <TabsTrigger value="buckets" className="gap-1.5">
            <FolderOpen className="w-4 h-4" />
            Buckets
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-1.5">
            <ImageIcon className="w-4 h-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="cdn" className="gap-1.5">
            <Zap className="w-4 h-4" />
            CDN
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-1.5">
            <Shield className="w-4 h-4" />
            Access
          </TabsTrigger>
          <TabsTrigger value="quotas" className="gap-1.5">
            <Gauge className="w-4 h-4" />
            Quotas
          </TabsTrigger>
          <TabsTrigger value="provider" className="gap-1.5">
            <Cloud className="w-4 h-4" />
            Provider
          </TabsTrigger>
        </TabsList>

        {/* ── Buckets Tab ── */}
        <TabsContent value="buckets" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{buckets.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Buckets</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{totalFiles}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Files</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{formatBytes(totalStorage)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Used</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/50">
                <p className="text-lg font-bold">{publicBuckets}/{privateBuckets}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pub/Priv</p>
              </div>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Bucket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Storage Bucket</DialogTitle>
                  <DialogDescription>
                    Add a new storage bucket. Names can only contain lowercase letters, numbers, and hyphens.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="bucket-name">Bucket Name</Label>
                    <Input
                      id="bucket-name"
                      placeholder="e.g. user-uploads"
                      value={newBucket.name}
                      onChange={e => setNewBucket(p => ({ ...p, name: e.target.value }))}
                    />
                    {newBucket.name && (
                      <p className="text-xs text-muted-foreground">
                        Will be created as: <code className="bg-muted px-1 rounded">{newBucket.name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-")}</code>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <Label htmlFor="bucket-public" className="cursor-pointer">Public Access</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {newBucket.isPublic
                          ? "Files will be publicly readable via URL"
                          : "Files require signed URLs to access"}
                      </p>
                    </div>
                    <Switch
                      id="bucket-public"
                      checked={newBucket.isPublic}
                      onCheckedChange={v => setNewBucket(p => ({ ...p, isPublic: v }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bucket-limit">Max File Size (MB)</Label>
                    <Input
                      id="bucket-limit"
                      type="number"
                      placeholder="Leave empty for no limit"
                      min={1}
                      value={newBucket.fileSizeLimit}
                      onChange={e => setNewBucket(p => ({ ...p, fileSizeLimit: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateBucket} disabled={creating || !newBucket.name.trim()}>
                    {creating ? "Creating..." : "Create Bucket"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-5 w-32 bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded mt-2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-full bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {buckets.map((bucket) => (
                <Card key={bucket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(bucket.allowed_mime_types)}
                        <CardTitle className="text-base">{bucket.name}</CardTitle>
                      </div>
                      <Badge variant={bucket.public ? "default" : "secondary"} className="text-xs">
                        {bucket.public ? (
                          <><Globe className="w-3 h-3 mr-1" /> Public</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1" /> Private</>
                        )}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Created {new Date(bucket.createdAt || bucket.created_at || new Date()).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Files</p>
                        <p className="font-medium">{bucket.fileCount || 0}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Size</p>
                        <p className="font-medium">{formatBytes(bucket.totalSize || 0)}</p>
                      </div>
                    </div>

                    {bucket.file_size_limit && (
                      <div className="text-xs text-muted-foreground">
                        Max file: {formatBytes(bucket.file_size_limit)}
                      </div>
                    )}

                    {bucket.allowed_mime_types && bucket.allowed_mime_types.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {bucket.allowed_mime_types.slice(0, 3).map(mime => (
                          <Badge key={mime} variant="outline" className="text-[10px] px-1.5 py-0">
                            {mime.split("/")[1]}
                          </Badge>
                        ))}
                        {bucket.allowed_mime_types.length > 3 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            +{bucket.allowed_mime_types.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Shield className="w-3 h-3" />
                        RLS Enabled
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Image Processing Tab ── */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Auto-Optimization
              </CardTitle>
              <CardDescription>
                Automatically resize, compress, and process images on upload
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Enable Auto-Optimization</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically optimize images when uploaded to any bucket
                  </p>
                </div>
                <Switch
                  checked={imageProcessing.autoOptimize}
                  onCheckedChange={v => setImageProcessing(p => ({ ...p, autoOptimize: v }))}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Max Width (px)</Label>
                  <Input
                    type="number"
                    value={imageProcessing.maxUploadWidth}
                    onChange={e => setImageProcessing(p => ({ ...p, maxUploadWidth: parseInt(e.target.value) || 1920 }))}
                    disabled={!imageProcessing.autoOptimize}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Height (px)</Label>
                  <Input
                    type="number"
                    value={imageProcessing.maxUploadHeight}
                    onChange={e => setImageProcessing(p => ({ ...p, maxUploadHeight: parseInt(e.target.value) || 1920 }))}
                    disabled={!imageProcessing.autoOptimize}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Compression Quality</Label>
                  <span className="text-sm font-medium text-muted-foreground">{imageProcessing.defaultQuality}%</span>
                </div>
                <Slider
                  value={[imageProcessing.defaultQuality]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={([v]) => setImageProcessing(p => ({ ...p, defaultQuality: v }))}
                  disabled={!imageProcessing.autoOptimize}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Smaller files</span>
                  <span>Higher quality</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select
                  value={imageProcessing.defaultFormat}
                  onValueChange={(v: "webp" | "jpeg" | "png") => setImageProcessing(p => ({ ...p, defaultFormat: v }))}
                  disabled={!imageProcessing.autoOptimize}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP (recommended — best compression)</SelectItem>
                    <SelectItem value="jpeg">JPEG (wide compatibility)</SelectItem>
                    <SelectItem value="png">PNG (lossless, larger files)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Strip EXIF Metadata</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Remove GPS, camera, and other metadata from uploads for privacy
                  </p>
                </div>
                <Switch
                  checked={imageProcessing.stripMetadata}
                  onCheckedChange={v => setImageProcessing(p => ({ ...p, stripMetadata: v }))}
                  disabled={!imageProcessing.autoOptimize}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Auto-Convert to WebP</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Convert JPEG/PNG uploads to WebP for smaller file sizes
                  </p>
                </div>
                <Switch
                  checked={imageProcessing.autoWebp}
                  onCheckedChange={v => setImageProcessing(p => ({ ...p, autoWebp: v }))}
                  disabled={!imageProcessing.autoOptimize}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="w-5 h-5" />
                Thumbnail Generation
              </CardTitle>
              <CardDescription>
                Auto-generate preview thumbnails for uploaded images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Enable Auto-Thumbnails</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Generate thumbnail previews automatically on upload
                  </p>
                </div>
                <Switch
                  checked={imageProcessing.autoThumbnails}
                  onCheckedChange={v => setImageProcessing(p => ({ ...p, autoThumbnails: v }))}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Thumbnail Size</Label>
                  <span className="text-sm font-medium text-muted-foreground">{imageProcessing.thumbnailSize}px</span>
                </div>
                <Slider
                  value={[imageProcessing.thumbnailSize]}
                  min={50}
                  max={500}
                  step={25}
                  onValueChange={([v]) => setImageProcessing(p => ({ ...p, thumbnailSize: v }))}
                  disabled={!imageProcessing.autoThumbnails}
                />
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Preview Sizes:</strong> Thumbnails will be generated at {imageProcessing.thumbnailSize}×{imageProcessing.thumbnailSize}px 
                  using center-crop. Original images are preserved alongside thumbnails in a <code className="bg-muted px-1 rounded">/thumbs/</code> subfolder.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Image Processing")}>
                  Save Image Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CDN & Caching Tab ── */}
        <TabsContent value="cdn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                CDN & Edge Delivery
              </CardTitle>
              <CardDescription>
                Configure content delivery, caching, and edge optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Enable CDN</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Serve files through a global content delivery network
                  </p>
                </div>
                <Switch
                  checked={cdnSettings.enableCdn}
                  onCheckedChange={v => setCdnSettings(p => ({ ...p, enableCdn: v }))}
                />
              </div>

              {cdnSettings.enableCdn && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-foreground/80">
                    CDN is active. Files are served through edge locations worldwide for fastest delivery.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Cache-Control Header</Label>
                <Select
                  value={cdnSettings.cacheControl}
                  onValueChange={v => setCdnSettings(p => ({ ...p, cacheControl: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public, max-age=31536000">Aggressive (1 year) — static assets</SelectItem>
                    <SelectItem value="public, max-age=86400">Standard (24 hours)</SelectItem>
                    <SelectItem value="public, max-age=3600">Short (1 hour) — dynamic content</SelectItem>
                    <SelectItem value="no-cache, no-store">No Cache — always fresh</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Controls how long browsers and CDN edges cache your files
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Immutable Assets</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mark assets as immutable for aggressive caching (content-hashed filenames)
                  </p>
                </div>
                <Switch
                  checked={cdnSettings.immutableAssets}
                  onCheckedChange={v => setCdnSettings(p => ({ ...p, immutableAssets: v }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Enable Compression</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Serve files with gzip/brotli compression for faster transfers
                  </p>
                </div>
                <Switch
                  checked={cdnSettings.enableCompression}
                  onCheckedChange={v => setCdnSettings(p => ({ ...p, enableCompression: v }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Edge Locations</Label>
                <Select
                  value={cdnSettings.edgeLocations}
                  onValueChange={v => setCdnSettings(p => ({ ...p, edgeLocations: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (all regions)</SelectItem>
                    <SelectItem value="us-eu">US & Europe</SelectItem>
                    <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                    <SelectItem value="global">Global Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Custom Domain (optional)</Label>
                <Input
                  placeholder="cdn.yourdomain.com"
                  value={cdnSettings.customDomain}
                  onChange={e => setCdnSettings(p => ({ ...p, customDomain: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Use a custom domain for your storage URLs. Requires DNS configuration.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Client Delivery Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Lazy Load by Default</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Images use lazy loading unless explicitly set to eager
                  </p>
                </div>
                <Switch
                  checked={cdnSettings.lazyLoadDefault}
                  onCheckedChange={v => setCdnSettings(p => ({ ...p, lazyLoadDefault: v }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Preload Critical Assets</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add preload hints for above-the-fold images and icons
                  </p>
                </div>
                <Switch
                  checked={cdnSettings.preloadCritical}
                  onCheckedChange={v => setCdnSettings(p => ({ ...p, preloadCritical: v }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("CDN & Caching")}>
                  Save CDN Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Access Control Tab ── */}
        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Signed URL Generator
              </CardTitle>
              <CardDescription>
                Generate time-limited signed URLs for private files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Bucket</Label>
                  <Select value={signedUrlBucket} onValueChange={setSignedUrlBucket}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bucket" />
                    </SelectTrigger>
                    <SelectContent>
                      {buckets.map(b => (
                        <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expiry</Label>
                  <Select value={String(signedUrlExpiry)} onValueChange={v => setSignedUrlExpiry(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="300">5 minutes</SelectItem>
                      <SelectItem value="900">15 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                      <SelectItem value="604800">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>File Path</Label>
                <Input
                  placeholder="e.g. user-id/documents/file.pdf"
                  value={signedUrlPath}
                  onChange={e => setSignedUrlPath(e.target.value)}
                />
              </div>
              <Button onClick={handleGenerateSignedUrl} disabled={!signedUrlBucket || !signedUrlPath}>
                <Link2 className="w-4 h-4 mr-2" />
                Generate Signed URL
              </Button>

              {generatedUrl && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires in {Math.round(signedUrlExpiry / 60)} minutes
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generatedUrl)}>
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs font-mono break-all text-foreground/80">{generatedUrl}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Access Policies
              </CardTitle>
              <CardDescription>
                Configure default access controls and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Signed URL Expiry</Label>
                  <Select
                    value={String(accessControl.defaultSignedUrlExpiry)}
                    onValueChange={v => setAccessControl(p => ({ ...p, defaultSignedUrlExpiry: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="900">15 minutes</SelectItem>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Signed URL Expiry</Label>
                  <Select
                    value={String(accessControl.maxSignedUrlExpiry)}
                    onValueChange={v => setAccessControl(p => ({ ...p, maxSignedUrlExpiry: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3600">1 hour</SelectItem>
                      <SelectItem value="86400">24 hours</SelectItem>
                      <SelectItem value="604800">7 days</SelectItem>
                      <SelectItem value="2592000">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Download Tracking</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Track download counts and access patterns for files
                  </p>
                </div>
                <Switch
                  checked={accessControl.enableDownloadTracking}
                  onCheckedChange={v => setAccessControl(p => ({ ...p, enableDownloadTracking: v }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Hotlink Protection</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Prevent external sites from directly embedding your files
                  </p>
                </div>
                <Switch
                  checked={accessControl.enableHotlinkProtection}
                  onCheckedChange={v => setAccessControl(p => ({ ...p, enableHotlinkProtection: v }))}
                />
              </div>

              {accessControl.enableHotlinkProtection && (
                <div className="space-y-2">
                  <Label>Allowed Origins</Label>
                  <Input
                    placeholder="https://yourdomain.com, https://app.yourdomain.com"
                    value={accessControl.allowedOrigins}
                    onChange={e => setAccessControl(p => ({ ...p, allowedOrigins: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of allowed origins. Use * for any origin.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Require Authentication</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Require user authentication for private bucket access
                  </p>
                </div>
                <Switch
                  checked={accessControl.requireAuth}
                  onCheckedChange={v => setAccessControl(p => ({ ...p, requireAuth: v }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">File Versioning</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Keep previous versions of overwritten files
                  </p>
                </div>
                <Switch
                  checked={accessControl.enableVersioning}
                  onCheckedChange={v => setAccessControl(p => ({ ...p, enableVersioning: v }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Access Control")}>
                  Save Access Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Quotas Tab ── */}
        <TabsContent value="quotas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Storage Quotas
              </CardTitle>
              <CardDescription>
                Set storage limits per subscription tier and monitor usage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label className="cursor-pointer">Enable Storage Quotas</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Enforce per-user storage limits based on subscription plan
                  </p>
                </div>
                <Switch
                  checked={quotaSettings.enableQuotas}
                  onCheckedChange={v => setQuotaSettings(p => ({ ...p, enableQuotas: v }))}
                />
              </div>

              {quotaSettings.enableQuotas && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Free</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Storage Limit (MB)</Label>
                        <Input
                          type="number"
                          value={quotaSettings.freeQuotaMB}
                          onChange={e => setQuotaSettings(p => ({ ...p, freeQuotaMB: parseInt(e.target.value) || 100 }))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(quotaSettings.freeQuotaMB * 1024 * 1024)}</p>
                    </div>
                    <div className="space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <div className="flex items-center gap-2">
                        <Badge>Pro</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Storage Limit (MB)</Label>
                        <Input
                          type="number"
                          value={quotaSettings.proQuotaMB}
                          onChange={e => setQuotaSettings(p => ({ ...p, proQuotaMB: parseInt(e.target.value) || 5120 }))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(quotaSettings.proQuotaMB * 1024 * 1024)}</p>
                    </div>
                    <div className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Enterprise</Badge>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Storage Limit (MB)</Label>
                        <Input
                          type="number"
                          value={quotaSettings.enterpriseQuotaMB}
                          onChange={e => setQuotaSettings(p => ({ ...p, enterpriseQuotaMB: parseInt(e.target.value) || 51200 }))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{formatBytes(quotaSettings.enterpriseQuotaMB * 1024 * 1024)}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Max Files Per User</Label>
                    <Input
                      type="number"
                      value={quotaSettings.maxFileCount}
                      onChange={e => setQuotaSettings(p => ({ ...p, maxFileCount: parseInt(e.target.value) || 1000 }))}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Usage Alert Threshold</Label>
                      <span className="text-sm font-medium text-muted-foreground">{quotaSettings.alertThreshold}%</span>
                    </div>
                    <Slider
                      value={[quotaSettings.alertThreshold]}
                      min={50}
                      max={95}
                      step={5}
                      onValueChange={([v]) => setQuotaSettings(p => ({ ...p, alertThreshold: v }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Alert users when they reach {quotaSettings.alertThreshold}% of their storage quota
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <Label className="cursor-pointer">Enable Quota Alerts</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Send email alerts when users approach their storage limit
                      </p>
                    </div>
                    <Switch
                      checked={quotaSettings.enableAlerts}
                      onCheckedChange={v => setQuotaSettings(p => ({ ...p, enableAlerts: v }))}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <Label className="cursor-pointer">Per-User Usage Tracking</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Track storage usage per user for detailed analytics
                      </p>
                    </div>
                    <Switch
                      checked={quotaSettings.enablePerUserTracking}
                      onCheckedChange={v => setQuotaSettings(p => ({ ...p, enablePerUserTracking: v }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Current Usage Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{buckets.length}</p>
                  <p className="text-xs text-muted-foreground">Total Buckets</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{totalFiles}</p>
                  <p className="text-xs text-muted-foreground">Total Files</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{formatBytes(totalStorage)}</p>
                  <p className="text-xs text-muted-foreground">Storage Used</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">{publicBuckets} / {privateBuckets}</p>
                  <p className="text-xs text-muted-foreground">Public / Private</p>
                </div>
              </div>

              {buckets.map(bucket => {
                const pct = totalStorage > 0
                  ? Math.min(((bucket.totalSize || 0) / totalStorage) * 100, 100)
                  : 0;
                return (
                  <div key={bucket.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {bucket.public ? (
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        <span className="font-medium">{bucket.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {formatBytes(bucket.totalSize || 0)} · {bucket.fileCount || 0} files
                      </span>
                    </div>
                    <Progress value={pct || 0.5} className="h-2" />
                  </div>
                );
              })}

              <div className="flex justify-end">
                <Button onClick={() => handleSaveSettings("Quota")}>
                  Save Quota Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Provider Tab ── */}
        <TabsContent value="provider" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Storage Provider Configuration
              </CardTitle>
              <CardDescription>
                Configure your primary storage provider. Cloud Storage is recommended for most use cases.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Active Provider</Label>
                <Select value={provider} onValueChange={(v) => { setProvider(v); setConnectionTestResult(null); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDER_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col">
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {PROVIDER_OPTIONS.find(p => p.value === provider)?.description}
                </p>
              </div>

              {provider === "apiClient" ? (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
                    <Cloud className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Cloud Storage Active</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Your files are stored securely using the built-in cloud storage.
                        No additional configuration needed. RLS policies protect your data automatically.
                      </p>
                    </div>
                  </div>

                  {connectionTestResult && (
                    <div className={`rounded-lg border p-3 flex items-start gap-2 ${
                      connectionTestResult.success
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}>
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                        connectionTestResult.success ? "text-green-500" : "text-destructive"
                      }`} />
                      <div>
                        <p className={`text-xs font-medium ${
                          connectionTestResult.success ? "text-green-500" : "text-destructive"
                        }`}>
                          {connectionTestResult.message}
                        </p>
                        {connectionTestResult.details && (
                          <p className="text-xs text-muted-foreground mt-0.5">{connectionTestResult.details}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      disabled={testingConnection}
                      onClick={async () => {
                        setTestingConnection(true);
                        setConnectionTestResult(null);
                        try {
                          const { data: { session } } = await apiClient.auth.getSession();
                          const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/functions/v1/test-storage-connection`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session?.access_token}`,
                              },
                              body: JSON.stringify({ provider: "apiClient", config: {} }),
                            }
                          );
                          const result = await res.json();
                          setConnectionTestResult(result);
                        } catch (err: any) {
                          setConnectionTestResult({ success: false, message: err.message });
                        } finally {
                          setTestingConnection(false);
                        }
                      }}
                    >
                      {testingConnection ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <p className="text-xs text-destructive">
                      External storage providers require additional configuration and secrets.
                      Contact support for enterprise setup assistance.
                    </p>
                  </div>

                  {/* S3 fields */}
                  {provider === "s3" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Endpoint URL</Label>
                        <Input
                          placeholder="https://s3.amazonaws.com"
                          value={providerConfig.endpoint}
                          onChange={e => setProviderConfig(p => ({ ...p, endpoint: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Region</Label>
                        <Input
                          placeholder="us-east-1"
                          value={providerConfig.region}
                          onChange={e => setProviderConfig(p => ({ ...p, region: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Access Key ID</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            placeholder="AKIA..."
                            value={providerConfig.accessKey}
                            onChange={e => setProviderConfig(p => ({ ...p, accessKey: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Access Key</Label>
                        <Input
                          type={showSecrets ? "text" : "password"}
                          placeholder="••••••••"
                          value={providerConfig.secretKey}
                          onChange={e => setProviderConfig(p => ({ ...p, secretKey: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Bucket Name</Label>
                        <Input
                          placeholder="my-app-storage"
                          value={providerConfig.bucket}
                          onChange={e => setProviderConfig(p => ({ ...p, bucket: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* GCS fields */}
                  {provider === "gcs" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Project ID</Label>
                        <Input
                          placeholder="my-gcp-project"
                          value={providerConfig.projectId}
                          onChange={e => setProviderConfig(p => ({ ...p, projectId: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bucket Name</Label>
                        <Input
                          placeholder="my-app-storage"
                          value={providerConfig.bucket}
                          onChange={e => setProviderConfig(p => ({ ...p, bucket: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Service Account Key (JSON)</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            placeholder='{"type":"service_account","project_id":"..."}'
                            value={providerConfig.serviceAccountKey}
                            onChange={e => setProviderConfig(p => ({ ...p, serviceAccountKey: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Region (optional)</Label>
                        <Input
                          placeholder="us-central1"
                          value={providerConfig.region}
                          onChange={e => setProviderConfig(p => ({ ...p, region: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* R2 fields */}
                  {provider === "r2" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Account ID</Label>
                        <Input
                          placeholder="your-cloudflare-account-id"
                          value={providerConfig.accountId}
                          onChange={e => setProviderConfig(p => ({ ...p, accountId: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Bucket Name</Label>
                        <Input
                          placeholder="my-r2-bucket"
                          value={providerConfig.bucket}
                          onChange={e => setProviderConfig(p => ({ ...p, bucket: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Access Key ID</Label>
                        <div className="relative">
                          <Input
                            type={showSecrets ? "text" : "password"}
                            placeholder="Access key..."
                            value={providerConfig.accessKey}
                            onChange={e => setProviderConfig(p => ({ ...p, accessKey: e.target.value }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                            onClick={() => setShowSecrets(!showSecrets)}
                          >
                            {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Access Key</Label>
                        <Input
                          type={showSecrets ? "text" : "password"}
                          placeholder="••••••••"
                          value={providerConfig.secretKey}
                          onChange={e => setProviderConfig(p => ({ ...p, secretKey: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Endpoint URL</Label>
                        <Input
                          placeholder="https://<account-id>.r2.cloudflarestorage.com"
                          value={providerConfig.endpoint}
                          onChange={e => setProviderConfig(p => ({ ...p, endpoint: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Local Storage fields */}
                  {provider === "local" && (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-start gap-3">
                        <HardDrive className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">Self-Hosted Local Storage</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Store files directly on your server's file system. Ensure the directory exists and has appropriate write permissions.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Storage Path</Label>
                        <Input
                          placeholder="/var/www/storage/uploads"
                          value={providerConfig.storagePath}
                          onChange={e => setProviderConfig(p => ({ ...p, storagePath: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Absolute path on the server where files will be stored. Must start with "/".
                        </p>
                      </div>
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Local storage does not provide built-in CDN, redundancy, or automatic backups. Recommended only for development or self-hosted deployments with their own backup strategy.
                        </p>
                      </div>
                    </div>
                  )}

                  {connectionTestResult && (
                    <div className={`rounded-lg border p-3 flex items-start gap-2 ${
                      connectionTestResult.success
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}>
                      <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${
                        connectionTestResult.success ? "text-green-500" : "text-destructive"
                      }`} />
                      <div>
                        <p className={`text-xs font-medium ${
                          connectionTestResult.success ? "text-green-500" : "text-destructive"
                        }`}>
                          {connectionTestResult.message}
                        </p>
                        {connectionTestResult.details && (
                          <p className="text-xs text-muted-foreground mt-0.5">{connectionTestResult.details}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setProvider("apiClient")}>
                      Cancel
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={testingConnection}
                      onClick={async () => {
                        setTestingConnection(true);
                        setConnectionTestResult(null);
                        try {
                          const configPayload: Record<string, string> = {};
                          if (provider === "s3") {
                            configPayload.s3_access_key = providerConfig.accessKey;
                            configPayload.s3_secret_key = providerConfig.secretKey;
                            configPayload.s3_region = providerConfig.region;
                            configPayload.s3_bucket = providerConfig.bucket;
                            configPayload.s3_endpoint = providerConfig.endpoint;
                          } else if (provider === "gcs") {
                            configPayload.gcs_project_id = providerConfig.projectId;
                            configPayload.gcs_bucket = providerConfig.bucket;
                            configPayload.gcs_service_account_key = providerConfig.serviceAccountKey;
                          } else if (provider === "r2" || provider === "cloudflare_r2") {
                            configPayload.r2_account_id = providerConfig.accountId;
                            configPayload.r2_access_key = providerConfig.accessKey;
                            configPayload.r2_secret_key = providerConfig.secretKey;
                            configPayload.r2_bucket = providerConfig.bucket;
                          } else if (provider === "local") {
                            configPayload.local_storage_path = providerConfig.storagePath;
                          }
                          const { data: { session } } = await apiClient.auth.getSession();
                          const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/functions/v1/test-storage-connection`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${session?.access_token}`,
                              },
                              body: JSON.stringify({
                                provider: provider === "r2" ? "cloudflare_r2" : provider,
                                config: configPayload,
                              }),
                            }
                          );
                          const result = await res.json();
                          setConnectionTestResult(result);
                        } catch (err: any) {
                          setConnectionTestResult({ success: false, message: err.message });
                        } finally {
                          setTestingConnection(false);
                        }
                      }}
                    >
                      {testingConnection ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      Test Connection
                    </Button>
                    <Button onClick={() => persistSetting("storage_provider", { provider, config: providerConfig }, "Provider")}>
                      Save Configuration
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Default Limits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Default Upload Limits
              </CardTitle>
              <CardDescription>
                Configure default file size limits and allowed types per bucket
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { bucket: "avatars", maxSize: "5 MB", types: "JPEG, PNG, WebP, GIF" },
                  { bucket: "app-icons", maxSize: "10 MB", types: "PNG, JPEG, WebP, SVG" },
                  { bucket: "splash-screens", maxSize: "10 MB", types: "PNG, JPEG, WebP" },
                  { bucket: "apk-builds", maxSize: "500 MB", types: "APK, ZIP" },
                  { bucket: "project-assets", maxSize: "50 MB", types: "Images, PDF, JSON" },
                ].map((item) => (
                  <div key={item.bucket} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium text-sm">{item.bucket}</p>
                      <p className="text-xs text-muted-foreground">{item.types}</p>
                    </div>
                    <Badge variant="outline">{item.maxSize}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
