"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { FileUpload } from "@/components/ui/file-upload";
import { 
  RefreshCw, Mail, Brain, CreditCard, Settings, Plug, Eye, EyeOff, 
  Shield, Bell, Globe, Palette, Smartphone, Database, Zap, Lock,
  AlertTriangle, CheckCircle, Info, Plus, Trash2, Save, RotateCcw,
  History, User, Clock, ArrowRight, ChevronLeft, ChevronRight, Wifi, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { apiClient } from "@/lib/api";
import type { SettingsAuditLog } from "@/hooks/useAdminData";
import { StorageSettings } from "@/components/admin/StorageSettings";

interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description: string | null;
}

interface SystemSettingsProps {
  settings: SystemSetting[];
  auditLog?: SettingsAuditLog[];
  onUpdate: (id: string, value: Record<string, unknown> | string | boolean | number) => Promise<boolean>;
  onUpsert?: (key: string, value: unknown, category: string) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
  isDemo?: boolean;
}

// Default settings for categories that might not exist in DB
const defaultSettings = {
  app: {
    app_name: { value: "", label: "Application Name", type: "text" },
    app_tagline: { value: "Convert websites to native apps", label: "Tagline", type: "text" },
    default_signup_credits: { value: 5, label: "Default Signup Credits", type: "number", min: 0, max: 1000, description: "Free credits given to new users on signup" },
    maintenance_mode: { value: false, label: "Maintenance Mode", type: "boolean", description: "Enable to show maintenance page to users" },
    debug_mode: { value: false, label: "Debug Mode", type: "boolean", description: "Enable detailed error logging" },
    max_upload_size: { value: 10, label: "Max Upload Size (MB)", type: "number", min: 1, max: 100 },
    session_timeout: { value: 60, label: "Session Timeout (minutes)", type: "number", min: 5, max: 1440 },
  },
  security: {
    force_https: { value: true, label: "Force HTTPS", type: "boolean" },
    rate_limit_enabled: { value: true, label: "Rate Limiting", type: "boolean" },
    rate_limit_requests: { value: 100, label: "Requests per Minute", type: "number", min: 10, max: 1000 },
    two_factor_required: { value: false, label: "Require 2FA for Admins", type: "boolean" },
    password_min_length: { value: 8, label: "Minimum Password Length", type: "number", min: 6, max: 32 },
    allowed_origins: { value: "*", label: "Allowed Origins (CORS)", type: "text" },
    ip_whitelist: { value: "", label: "IP Whitelist (comma-separated)", type: "textarea" },
  },
  notifications: {
    email_notifications: { value: true, label: "Email Notifications", type: "boolean" },
    push_notifications: { value: true, label: "Push Notifications", type: "boolean" },
    slack_webhook: { value: "", label: "Slack Webhook URL", type: "text", secret: true },
    discord_webhook: { value: "", label: "Discord Webhook URL", type: "text", secret: true },
    notify_new_user: { value: true, label: "Notify on New User", type: "boolean" },
    notify_new_build: { value: true, label: "Notify on New Build", type: "boolean" },
    notify_payment: { value: true, label: "Notify on Payment", type: "boolean" },
  },
  appearance: {
    default_theme: { value: "system", label: "Default Theme", type: "select", options: ["light", "dark", "system"] },
    primary_color: { value: "#8B5CF6", label: "Primary Color", type: "color" },
    accent_color: { value: "#0EA5E9", label: "Accent Color", type: "color" },
    logo_url: { value: "", label: "Logo (Light Mode)", type: "upload", description: "Upload logo for light mode" },
    logo_url_dark: { value: "", label: "Logo (Dark Mode)", type: "upload", description: "Upload logo for dark mode (falls back to light logo)" },
    favicon_url: { value: "", label: "Favicon", type: "upload", description: "Upload a favicon image (PNG, ICO, SVG)" },
    custom_css: { value: "", label: "Custom CSS", type: "textarea" },
  },
  builds: {
    auto_build: { value: true, label: "Auto Build on Submit", type: "boolean" },
    credits_per_build: { value: 1, label: "Credits Per Build", type: "number", min: 1, max: 100, description: "Number of credits consumed per app build" },
    concurrent_builds: { value: 3, label: "Max Concurrent Builds", type: "number", min: 1, max: 10 },
    build_timeout: { value: 30, label: "Build Timeout (minutes)", type: "number", min: 5, max: 120 },
    keep_build_logs: { value: 30, label: "Keep Build Logs (days)", type: "number", min: 7, max: 365 },
    default_android_sdk: { value: "33", label: "Default Android SDK", type: "select", options: ["30", "31", "32", "33", "34"] },
    default_ios_version: { value: "16.0", label: "Default iOS Version", type: "select", options: ["14.0", "15.0", "16.0", "17.0"] },
    enable_code_signing: { value: true, label: "Enable Code Signing", type: "boolean" },
    admob_enabled: { value: false, label: "Enable AdMob Ads", type: "boolean", description: "Enable AdMob ad injection in generated apps" },
    admob_banner_id: { value: "", label: "Default Banner Ad Unit ID", type: "text", description: "AdMob banner ad unit ID (e.g. ca-app-pub-xxxxx/yyyyy)" },
    admob_interstitial_id: { value: "", label: "Default Interstitial Ad Unit ID", type: "text", description: "AdMob interstitial ad unit ID" },
    admob_rewarded_id: { value: "", label: "Default Rewarded Ad Unit ID", type: "text", description: "AdMob rewarded ad unit ID" },
  },
  storage: {
    storage_provider: { value: "mongodb", label: "Storage Provider", type: "select", options: ["mongodb", "s3", "gcs", "cloudflare_r2", "local"] },
    // S3 config
    s3_access_key: { value: "", label: "AWS Access Key ID", type: "text", secret: true, provider: "s3" },
    s3_secret_key: { value: "", label: "AWS Secret Access Key", type: "text", secret: true, provider: "s3" },
    s3_region: { value: "us-east-1", label: "AWS Region", type: "select", options: ["us-east-1", "us-east-2", "us-west-1", "us-west-2", "eu-west-1", "eu-west-2", "eu-central-1", "ap-southeast-1", "ap-northeast-1"], provider: "s3" },
    s3_bucket: { value: "", label: "S3 Bucket Name", type: "text", provider: "s3" },
    s3_endpoint: { value: "", label: "Custom Endpoint (optional)", type: "text", description: "For S3-compatible services", provider: "s3" },
    // GCS config
    gcs_project_id: { value: "", label: "GCP Project ID", type: "text", provider: "gcs" },
    gcs_bucket: { value: "", label: "GCS Bucket Name", type: "text", provider: "gcs" },
    gcs_service_account_key: { value: "", label: "Service Account Key (JSON)", type: "textarea", secret: true, provider: "gcs" },
    // Cloudflare R2 config
    r2_account_id: { value: "", label: "Cloudflare Account ID", type: "text", provider: "cloudflare_r2" },
    r2_access_key: { value: "", label: "R2 Access Key ID", type: "text", secret: true, provider: "cloudflare_r2" },
    r2_secret_key: { value: "", label: "R2 Secret Access Key", type: "text", secret: true, provider: "cloudflare_r2" },
    r2_bucket: { value: "", label: "R2 Bucket Name", type: "text", provider: "cloudflare_r2" },
    // Local config
    local_storage_path: { value: "/uploads", label: "Storage Path", type: "text", description: "Path for local file storage", provider: "local" },
    // Common settings
    max_storage_per_user: { value: 1024, label: "Max Storage per User (MB)", type: "number", min: 100, max: 10240 },
    auto_cleanup: { value: true, label: "Auto Cleanup Old Files", type: "boolean" },
    cleanup_after_days: { value: 90, label: "Cleanup After (days)", type: "number", min: 30, max: 365 },
    compress_uploads: { value: true, label: "Compress Uploads", type: "boolean" },
  },
  limits: {
    max_apps_free: { value: 1, label: "Max Apps (Free Plan)", type: "number", min: 1, max: 10 },
    max_apps_pro: { value: 10, label: "Max Apps (Pro Plan)", type: "number", min: 1, max: 100 },
    max_apps_enterprise: { value: -1, label: "Max Apps (Enterprise)", type: "number", min: -1, max: 1000, description: "-1 for unlimited" },
    max_builds_per_day_free: { value: 3, label: "Daily Builds (Free)", type: "number", min: 1, max: 20 },
    max_builds_per_day_pro: { value: 20, label: "Daily Builds (Pro)", type: "number", min: 1, max: 100 },
    max_file_size_mb: { value: 50, label: "Max APK/IPA Size (MB)", type: "number", min: 10, max: 500 },
  },
};

const categoryConfig: Record<string, { icon: typeof Settings; label: string; description: string }> = {
  app: { icon: Settings, label: "General", description: "Basic application settings" },
  general: { icon: Settings, label: "General", description: "Basic application settings" },
  security: { icon: Shield, label: "Security", description: "Security and access controls" },
  notifications: { icon: Bell, label: "Notifications", description: "Notification preferences" },
  appearance: { icon: Palette, label: "Appearance", description: "Theme and branding" },
  builds: { icon: Smartphone, label: "Builds", description: "Build configuration" },
  storage: { icon: Database, label: "Storage", description: "File storage settings" },
  limits: { icon: Zap, label: "Limits", description: "Plan limits and quotas" },
  email: { icon: Mail, label: "Email", description: "Email configuration" },
  ai: { icon: Brain, label: "AI", description: "AI features" },
  payment: { icon: CreditCard, label: "Payment", description: "Payment settings" },
  integrations: { icon: Plug, label: "Integrations", description: "Third-party integrations" },
};

// Map category aliases to canonical names
const categoryAliases: Record<string, string> = {
  general: "app",
};

// Reverse map: UI category → DB category
const dbCategoryMap: Record<string, string> = {
  app: "general",
};

export const SystemSettings = ({ settings, auditLog = [], onUpdate, onUpsert, onRefresh, loading }: SystemSettingsProps) => {
  const [editedValues, setEditedValues] = useState<Record<string, Record<string, unknown> | string | boolean | number>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [localDefaults, setLocalDefaults] = useState<Record<string, Record<string, unknown>>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{ success: boolean; message: string; details?: string } | null>(null);
  const tabsScrollRef = useState<HTMLDivElement | null>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsScrollRef[0];
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const isSecretField = (key: string) => {
    return key.toLowerCase().includes('api_key') || 
           key.toLowerCase().includes('secret') || 
           key.toLowerCase().includes('webhook') ||
           key.toLowerCase().includes('password') ||
           key.toLowerCase().includes('token');
  };

  const handleSimpleValueChange = (settingId: string, value: string | boolean | number) => {
    setEditedValues((prev) => ({
      ...prev,
      [settingId]: value,
    }));
  };

  const handleLocalDefaultChange = (category: string, field: string, value: unknown) => {
    setLocalDefaults((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value,
      },
    }));
  };

  const handleFieldChange = (settingId: string, field: string, value: unknown) => {
    const setting = settings.find((s) => s.id === settingId);
    if (!setting) return;

    const currentValue = editedValues[settingId] || setting.value;
    if (typeof currentValue === 'object' && currentValue !== null) {
      setEditedValues((prev) => ({
        ...prev,
        [settingId]: {
          ...(prev[settingId] as Record<string, unknown> || setting.value as Record<string, unknown>),
          [field]: value,
        },
      }));
    }
  };

  const handleSave = async (setting: SystemSetting) => {
    setSavingIds((prev) => new Set(prev).add(setting.id));
    const newValue = editedValues[setting.id] ?? setting.value;
    const success = await onUpdate(setting.id, newValue as Record<string, unknown> | string | boolean | number);
    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(setting.id);
      return next;
    });
    if (success) {
      toast.success(`${setting.key.replace(/_/g, " ")} updated successfully`);
      setEditedValues((prev) => {
        const copy = { ...prev };
        delete copy[setting.id];
        return copy;
      });
    } else {
      toast.error("Failed to update setting");
    }
  };

  const handleResetToDefault = (settingId: string) => {
    setEditedValues((prev) => {
      const copy = { ...prev };
      delete copy[settingId];
      return copy;
    });
    toast.info("Changes reverted");
  };

  const getValue = (setting: SystemSetting, field?: string) => {
    const editedValue = editedValues[setting.id];
    if (editedValue !== undefined) {
      if (field && typeof editedValue === 'object' && editedValue !== null) {
        return (editedValue as Record<string, unknown>)[field];
      }
      return editedValue;
    }
    if (field && typeof setting.value === 'object' && setting.value !== null) {
      return (setting.value as Record<string, unknown>)[field];
    }
    return setting.value;
  };

  const getLocalValue = (category: string, field: string, defaultValue: unknown) => {
    // Check local edits first
    if (localDefaults[category]?.[field] !== undefined) {
      return localDefaults[category][field];
    }
    // Then check if this field exists in DB settings
    const dbSetting = settings.find((s) => s.key === field);
    if (dbSetting) {
      return dbSetting.value;
    }
    return defaultValue;
  };

  const hasChanges = (settingId: string) => editedValues[settingId] !== undefined;
  const hasLocalChanges = (category: string) => Object.keys(localDefaults[category] || {}).length > 0;

  const handleTestStorageConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    const provider = getLocalValue('storage', 'storage_provider', 'mongodb') as string;
    
    // Gather provider-specific config
    const requiredKeys: Record<string, string[]> = {
      mongodb: [],
      s3: ['s3_access_key', 's3_secret_key', 's3_bucket'],
      gcs: ['gcs_project_id', 'gcs_bucket'],
      cloudflare_r2: ['r2_account_id', 'r2_access_key', 'r2_secret_key', 'r2_bucket'],
      local: ['local_storage_path'],
    };
    const allKeys: Record<string, string[]> = {
      mongodb: [],
      s3: ['s3_access_key', 's3_secret_key', 's3_region', 's3_bucket', 's3_endpoint'],
      gcs: ['gcs_project_id', 'gcs_bucket', 'gcs_service_account_key'],
      cloudflare_r2: ['r2_account_id', 'r2_access_key', 'r2_secret_key', 'r2_bucket'],
      local: ['local_storage_path'],
    };

    const config: Record<string, unknown> = {};
    for (const key of (allKeys[provider] || [])) {
      config[key] = getLocalValue('storage', key, '');
    }

    // Client-side validation: check required fields before calling the edge function
    const missing = (requiredKeys[provider] || []).filter(k => !config[k] || String(config[k]).trim() === '');
    if (missing.length > 0 && provider !== 'mongodb') {
      const labels = missing.map(k => k.replace(/^(s3_|gcs_|r2_|local_)/, '').replace(/_/g, ' '));
      setConnectionTestResult({ success: false, message: `Please fill in required fields: ${labels.join(', ')}` });
      setTestingConnection(false);
      return;
    }

    try {
      const { data, error } = await apiClient.functions.invoke('test-storage-connection', {
        body: { provider, config },
      });

      if (data && typeof data === 'object' && 'message' in data) {
        setConnectionTestResult(data as { success: boolean; message: string; details?: string });
      } else if (error) {
        // For non-2xx responses, try to parse the error context
        const errObj = error as any;
        try {
          const errorBody = errObj.context ? await errObj.context.json() : null;
          if (errorBody?.message) {
            setConnectionTestResult({ success: false, message: errorBody.message, details: errorBody.details });
          } else {
            setConnectionTestResult({ success: false, message: errObj.message || 'Connection test failed' });
          }
        } catch {
          setConnectionTestResult({ success: false, message: errObj.message || 'Connection test failed' });
        }
      } else {
        setConnectionTestResult({ success: false, message: 'Unexpected response from server' });
      }
    } catch (err: any) {
      setConnectionTestResult({ success: false, message: err.message || 'Unexpected error' });
    } finally {
      setTestingConnection(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const config = categoryConfig[category as keyof typeof categoryConfig];
    if (config) {
      const IconComponent = config.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <Settings className="w-4 h-4" />;
  };

  const getCategoryLabel = (category: string) => {
    return categoryConfig[category as keyof typeof categoryConfig]?.label || category;
  };

  // Merge DB settings with defaults, normalizing category names
  const normalizeCategory = (cat: string) => categoryAliases[cat] || cat;
  const existingCategories = Array.from(new Set(settings.map((s) => normalizeCategory(s.category))));
  const allCategories = Array.from(new Set([...Object.keys(defaultSettings), ...existingCategories]));

  const renderField = (
    fieldKey: string, 
    config: { value: unknown; label: string; type: string; description?: string; options?: string[]; min?: number; max?: number; secret?: boolean },
    category: string,
    isLocal: boolean = true
  ) => {
    const currentValue = isLocal ? getLocalValue(category, fieldKey, config.value) : config.value;
    const isSecret = config.secret || isSecretField(fieldKey);
    const showSecret = showSecrets[`${category}-${fieldKey}`];

    return (
      <div key={fieldKey} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">{config.label}</Label>
          {config.description && (
            <span className="text-xs text-muted-foreground">{config.description}</span>
          )}
        </div>
        
        {config.type === "boolean" && (
          <div className="flex items-center gap-3">
            <Switch
              checked={currentValue as boolean}
              onCheckedChange={(checked) => handleLocalDefaultChange(category, fieldKey, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {currentValue ? "Enabled" : "Disabled"}
            </span>
          </div>
        )}

        {config.type === "text" && (
          <div className="flex items-center gap-2">
            <Input
              type={isSecret && !showSecret ? "password" : "text"}
              value={(currentValue as string) || ""}
              onChange={(e) => handleLocalDefaultChange(category, fieldKey, e.target.value)}
              placeholder={`Enter ${config.label.toLowerCase()}...`}
              className="font-mono text-sm"
            />
            {isSecret && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSecrets(prev => ({ 
                  ...prev, 
                  [`${category}-${fieldKey}`]: !prev[`${category}-${fieldKey}`] 
                }))}
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
          </div>
        )}

        {config.type === "number" && (
          <div className="flex items-center gap-4">
            <Input
              type="number"
              value={currentValue as number}
              onChange={(e) => handleLocalDefaultChange(category, fieldKey, Number(e.target.value))}
              min={config.min}
              max={config.max}
              className="w-32"
            />
            {config.min !== undefined && config.max !== undefined && (
              <Slider
                value={[currentValue as number]}
                onValueChange={(values) => handleLocalDefaultChange(category, fieldKey, values[0])}
                min={config.min}
                max={config.max}
                step={1}
                className="flex-1"
              />
            )}
          </div>
        )}

        {config.type === "select" && config.options && (
          <Select
            value={currentValue as string}
            onValueChange={(value) => handleLocalDefaultChange(category, fieldKey, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {config.options.map((option) => (
                <SelectItem key={option} value={option} className="capitalize">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {config.type === "color" && (
          <div className="flex items-center gap-3">
            <Input
              type="color"
              value={currentValue as string}
              onChange={(e) => handleLocalDefaultChange(category, fieldKey, e.target.value)}
              className="w-16 h-10 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={currentValue as string}
              onChange={(e) => handleLocalDefaultChange(category, fieldKey, e.target.value)}
              className="font-mono text-sm flex-1"
              placeholder="#000000"
            />
          </div>
        )}

        {config.type === "textarea" && (
          <Textarea
            value={(currentValue as string) || ""}
            onChange={(e) => handleLocalDefaultChange(category, fieldKey, e.target.value)}
            placeholder={`Enter ${config.label.toLowerCase()}...`}
            className="font-mono text-sm min-h-[100px]"
          />
        )}

        {config.type === "upload" && (
          <div className="space-y-3">
            {(currentValue as string) && (
              <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
                <img
                  src={currentValue as string}
                  alt={config.label}
                  className="w-8 h-8 rounded object-contain"
                />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {currentValue as string}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={() => handleLocalDefaultChange(category, fieldKey, "")}
                >
                  Remove
                </Button>
              </div>
            )}
            <FileUpload
              bucket="app-icons"
              accept={fieldKey.includes('favicon') 
                ? "image/png,image/x-icon,image/svg+xml,image/ico,image/vnd.microsoft.icon" 
                : "image/png,image/jpeg,image/webp,image/svg+xml"}
              maxSizeMB={fieldKey.includes('favicon') ? 2 : 5}
              placeholder={fieldKey.includes('favicon') 
                ? "Upload favicon (PNG, ICO, SVG)" 
                : `Upload ${config.label.toLowerCase()} (PNG, JPG, WebP, SVG)`}
              showPreview={true}
              enableOptimization={!fieldKey.includes('favicon')}
              onUploadComplete={(url) => {
                handleLocalDefaultChange(category, fieldKey, url);
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Configure your platform settings and controls</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs sm:text-sm">
            <CheckCircle className="w-3 h-3 text-green-500" />
            {settings.length} configured
          </Badge>
          <Button 
            variant={showAuditLog ? "default" : "outline"} 
            size="sm" 
            onClick={() => setShowAuditLog(!showAuditLog)}
            className="text-xs sm:text-sm"
          >
            <History className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Audit Log</span>
            {auditLog.length > 0 && (
              <Badge variant="secondary" className="ml-1 sm:ml-2 h-4 sm:h-5 px-1 sm:px-1.5 text-[10px] sm:text-xs">
                {auditLog.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh} className="text-xs sm:text-sm">
            <RefreshCw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Audit Log Panel */}
      {showAuditLog && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5" />
              Settings Change History
            </CardTitle>
            <CardDescription>
              Track all changes made to system settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLog.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No changes recorded yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px] sm:h-[400px] pr-2 sm:pr-4">
                <div className="space-y-3 sm:space-y-4">
                  {auditLog.map((log) => (
                    <div 
                      key={log.id} 
                      className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                            <Badge variant="outline" className="capitalize text-[10px] sm:text-xs">
                              {log.change_type}
                            </Badge>
                            <span className="font-medium text-xs sm:text-sm truncate">
                              {log.setting_key.replace(/_/g, " ")}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span className="truncate max-w-[120px] sm:max-w-none">{log.changed_by_email || "Unknown"}</span>
                            </span>
                            <span className="hidden sm:inline text-muted-foreground/50">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span>{format(new Date(log.created_at), "MMM d, h:mm a")}</span>
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm">
                            {log.old_value && (
                              <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                                <span className="text-xs font-medium text-red-600 dark:text-red-400 block mb-1">
                                  Previous Value
                                </span>
                                <code className="text-xs break-all">
                                  {typeof log.old_value === 'object' 
                                    ? JSON.stringify(log.old_value, null, 2)
                                    : String(log.old_value)
                                  }
                                </code>
                              </div>
                            )}
                            <div className="bg-green-500/10 border border-green-500/20 rounded p-2">
                              <span className="text-xs font-medium text-green-600 dark:text-green-400 block mb-1">
                                New Value
                              </span>
                              <code className="text-xs break-all">
                                {typeof log.new_value === 'object' 
                                  ? JSON.stringify(log.new_value, null, 2)
                                  : String(log.new_value)
                                }
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-28 rounded-md" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Tabs defaultValue={allCategories[0]} className="space-y-6">
          <div className="relative flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={() => scrollTabs('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div 
              ref={(el) => { tabsScrollRef[0] = el; }}
              className="overflow-x-auto scrollbar-hide flex-1"
            >
              <TabsList className="inline-flex h-auto gap-1 p-1 w-max">
                {allCategories.map((category) => (
                  <TabsTrigger key={category} value={category} className="gap-2 whitespace-nowrap">
                    {getCategoryIcon(category)}
                    <span className="hidden sm:inline">{getCategoryLabel(category)}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 h-9 w-9"
              onClick={() => scrollTabs('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {allCategories.map((category) => {
            const dbSettings = settings.filter((s) => normalizeCategory(s.category) === category);
            const defaultConfig = defaultSettings[category as keyof typeof defaultSettings];
            const categoryInfo = categoryConfig[category as keyof typeof categoryConfig];

            // For storage category, render the full StorageSettings component
            if (category === 'storage') {
              return (
                <TabsContent key={category} value={category} className="space-y-6">
                  <StorageSettings loading={loading} />
                </TabsContent>
              );
            }

            return (
              <TabsContent key={category} value={category} className="space-y-6">
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                      {getCategoryIcon(category)}
                      {getCategoryLabel(category)} Settings
                    </h2>
                    {categoryInfo?.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{categoryInfo.description}</p>
                    )}
                  </div>
                  {hasLocalChanges(category) && (
                    <Button 
                      onClick={async () => {
                        if (!onUpsert) {
                          toast.error("Save not available");
                          return;
                        }
                        setSavingCategory(category);
                        const changedFields = localDefaults[category] || {};
                        const dbCategory = dbCategoryMap[category] || category;
                        let allSuccess = true;
                        for (const [fieldKey, fieldValue] of Object.entries(changedFields)) {
                          const success = await onUpsert(fieldKey, fieldValue, dbCategory);
                          if (!success) {
                            allSuccess = false;
                            toast.error(`Failed to save ${fieldKey.replace(/_/g, " ")}`);
                            break;
                          }
                        }
                        setSavingCategory(null);
                        if (allSuccess) {
                          toast.success("Settings saved successfully");
                          setLocalDefaults((prev) => {
                            const copy = { ...prev };
                            delete copy[category];
                            return copy;
                          });
                          onRefresh();
                        }
                      }}
                      className="gap-2 w-full sm:w-auto"
                      size="sm"
                      disabled={savingCategory === category}
                    >
                      {savingCategory === category ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Default Settings from Config */}
                {defaultConfig && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configuration
                      </CardTitle>
                      <CardDescription>
                        Manage {getCategoryLabel(category).toLowerCase()} configuration options
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        {Object.entries(defaultConfig).map(([fieldKey, config]) => {
                          const fieldConfig = config as any;
                          // Filter provider-specific fields based on selected storage provider
                          if (fieldConfig.provider && category === 'storage') {
                            const selectedProvider = getLocalValue('storage', 'storage_provider', 'mongodb') as string;
                            if (fieldConfig.provider !== selectedProvider) return null;
                          }
                          return renderField(fieldKey, fieldConfig, category);
                        })}
                      </div>
                      
                      {/* Test Connection Button for Storage */}
                      {category === 'storage' && (
                        <div className="mt-6 pt-4 border-t border-border">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              onClick={handleTestStorageConnection}
                              disabled={testingConnection}
                              className="gap-2"
                            >
                              {testingConnection ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wifi className="w-4 h-4" />
                              )}
                              {testingConnection ? "Testing..." : "Test Connection"}
                            </Button>
                            {connectionTestResult && (
                              <div className={`flex items-start gap-2 p-3 rounded-lg flex-1 ${
                                connectionTestResult.success 
                                  ? 'bg-green-500/10 border border-green-500/20' 
                                  : 'bg-destructive/10 border border-destructive/20'
                              }`}>
                                {connectionTestResult.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                                )}
                                <div className="text-sm">
                                  <p className={connectionTestResult.success ? 'text-green-500' : 'text-destructive'}>
                                    {connectionTestResult.message}
                                  </p>
                                  {connectionTestResult.details && (
                                    <p className="text-muted-foreground text-xs mt-1">{connectionTestResult.details}</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Appearance Live Preview */}
                {category === 'appearance' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Live Preview
                      </CardTitle>
                      <CardDescription>
                        Preview how your branding changes will look across the app
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const previewPrimary = (getLocalValue('appearance', 'primary_color', '#8B5CF6') as string);
                        const previewAccent = (getLocalValue('appearance', 'accent_color', '#0EA5E9') as string);
                        const previewLogo = (getLocalValue('appearance', 'logo_url', '') as string) || '/favicon.png';
                        const previewLogoDark = (getLocalValue('appearance', 'logo_url_dark', '') as string);

                        return (
                          <div className="space-y-4">
                            {/* Color Swatches */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-10 h-10 rounded-lg border border-border shadow-sm" 
                                  style={{ backgroundColor: previewPrimary }}
                                />
                                <span className="text-xs text-muted-foreground">Primary</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-10 h-10 rounded-lg border border-border shadow-sm" 
                                  style={{ backgroundColor: previewAccent }}
                                />
                                <span className="text-xs text-muted-foreground">Accent</span>
                              </div>
                            </div>

                            {/* Navbar Preview */}
                            <div className="rounded-lg border border-border overflow-hidden">
                              <div className="bg-background/95 backdrop-blur p-3 flex items-center justify-between border-b border-border/50">
                                <div className="flex items-center gap-2">
                                  <img src={previewLogo} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
                                  <span className="font-bold text-sm text-foreground">
                                    {getLocalValue('appearance', 'app_name', 'My App') as string || 'My App'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">Features</span>
                                  <span className="text-xs text-muted-foreground">Pricing</span>
                                  <button 
                                    className="px-3 py-1 rounded-full text-xs text-white font-medium"
                                    style={{ backgroundColor: previewPrimary }}
                                  >
                                    Get Started
                                  </button>
                                </div>
                              </div>
                              <div className="p-6 bg-background text-center space-y-3">
                                <h3 className="text-lg font-bold" style={{ color: previewPrimary }}>
                                  Build Amazing Apps
                                </h3>
                                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                  Convert any website into a native mobile application in minutes.
                                </p>
                                <div className="flex justify-center gap-2">
                                  <button
                                    className="px-4 py-1.5 rounded-lg text-xs text-white font-medium"
                                    style={{ backgroundColor: previewPrimary }}
                                  >
                                    Start Building
                                  </button>
                                  <button
                                    className="px-4 py-1.5 rounded-lg text-xs font-medium border"
                                    style={{ borderColor: previewAccent, color: previewAccent }}
                                  >
                                    Learn More
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Logo variants */}
                            {previewLogoDark && (
                              <div className="flex items-center gap-6">
                                <div className="text-center">
                                  <div className="w-16 h-16 rounded-xl bg-white border border-border flex items-center justify-center p-2">
                                    <img src={previewLogo} alt="Light logo" className="max-w-full max-h-full object-contain" />
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-1 block">Light</span>
                                </div>
                                <div className="text-center">
                                  <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-border flex items-center justify-center p-2">
                                    <img src={previewLogoDark} alt="Dark logo" className="max-w-full max-h-full object-contain" />
                                  </div>
                                  <span className="text-xs text-muted-foreground mt-1 block">Dark</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}

                {/* Database Settings */}
                {dbSettings.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Saved Configurations ({dbSettings.length})
                      </span>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      {dbSettings.map((setting) => {
                        const settingValue = setting.value;
                        const isSimpleValue = typeof settingValue !== 'object' || settingValue === null;
                        const isSaving = savingIds.has(setting.id);
                        
                        return (
                          <Card key={setting.id} className={hasChanges(setting.id) ? "ring-2 ring-primary/20" : ""}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-base capitalize flex items-center gap-2">
                                    {setting.key.replace(/_/g, " ")}
                                    {hasChanges(setting.id) && (
                                      <Badge variant="secondary" className="text-xs">Modified</Badge>
                                    )}
                                  </CardTitle>
                                  {setting.description && (
                                    <CardDescription className="mt-1">{setting.description}</CardDescription>
                                  )}
                                </div>
                                {hasChanges(setting.id) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleResetToDefault(setting.id)}
                                    title="Revert changes"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {isSimpleValue ? (
                                <div className="space-y-2">
                                  {typeof settingValue === 'boolean' || settingValue === 'true' || settingValue === 'false' ? (
                                    <div className="flex items-center gap-3">
                                      <Switch
                                        checked={getValue(setting) === true || getValue(setting) === 'true'}
                                        onCheckedChange={(checked) =>
                                          handleSimpleValueChange(setting.id, checked)
                                        }
                                      />
                                      <span className="text-sm text-muted-foreground">
                                        {getValue(setting) === true || getValue(setting) === 'true' ? 'Enabled' : 'Disabled'}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type={isSecretField(setting.key) && !showSecrets[setting.id] ? "password" : "text"}
                                        value={(getValue(setting) as string) || ""}
                                        onChange={(e) =>
                                          handleSimpleValueChange(setting.id, e.target.value)
                                        }
                                        placeholder={isSecretField(setting.key) ? "Enter API key..." : "Enter value..."}
                                        className="font-mono text-sm"
                                      />
                                      {isSecretField(setting.key) && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => setShowSecrets(prev => ({ ...prev, [setting.id]: !prev[setting.id] }))}
                                        >
                                          {showSecrets[setting.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {Object.entries(settingValue as Record<string, unknown>).map(([field, defaultValue]) => (
                                    <div key={field} className="space-y-2">
                                      <Label className="capitalize text-sm">{field.replace(/_/g, " ")}</Label>
                                      {typeof defaultValue === "boolean" ? (
                                        <div className="flex items-center gap-3">
                                          <Switch
                                            checked={getValue(setting, field) as boolean}
                                            onCheckedChange={(checked) =>
                                              handleFieldChange(setting.id, field, checked)
                                            }
                                          />
                                          <span className="text-sm text-muted-foreground">
                                            {getValue(setting, field) ? 'Enabled' : 'Disabled'}
                                          </span>
                                        </div>
                                      ) : typeof defaultValue === "number" ? (
                                        <Input
                                          type="number"
                                          value={getValue(setting, field) as number}
                                          onChange={(e) =>
                                            handleFieldChange(setting.id, field, Number(e.target.value))
                                          }
                                          className="text-sm"
                                        />
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type={isSecretField(field) && !showSecrets[`${setting.id}-${field}`] ? "password" : "text"}
                                            value={(getValue(setting, field) as string) || ""}
                                            onChange={(e) =>
                                              handleFieldChange(setting.id, field, e.target.value)
                                            }
                                            className="font-mono text-sm"
                                          />
                                          {isSecretField(field) && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => setShowSecrets(prev => ({ 
                                                ...prev, 
                                                [`${setting.id}-${field}`]: !prev[`${setting.id}-${field}`] 
                                              }))}
                                            >
                                              {showSecrets[`${setting.id}-${field}`] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {hasChanges(setting.id) && (
                                <Button 
                                  onClick={() => handleSave(setting)} 
                                  className="w-full mt-4"
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                      Saving...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4 mr-2" />
                                      Save Changes
                                    </>
                                  )}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!defaultConfig && dbSettings.length === 0 && (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Info className="w-12 h-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No settings configured</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        This category doesn't have any settings yet.
                      </p>
                      <Button variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Setting
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
};
