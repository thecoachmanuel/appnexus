"use client";

import { useState, useEffect, useMemo } from "react";
import { buildApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppleIcon from "@/components/builder/AppleIcon";
import { 
  Smartphone, 
  ArrowLeftRight, 
  Clock, 
  HardDrive, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BarChart3,
  X,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow, differenceInSeconds } from "date-fns";

interface Build {
  id: string;
  app_name: string;
  status: string;
  download_url: string | null;
  file_size_bytes: number | null;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface ComparisonMetric {
  label: string;
  android: string | number;
  ios: string | number;
  winner: "android" | "ios" | "tie";
  icon: React.ReactNode;
}

const BuildComparison = () => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAndroidBuild, setSelectedAndroidBuild] = useState<string>("");
  const [selectedIosBuild, setSelectedIosBuild] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    if (user && isOpen) {
      fetchBuilds();
    }
  }, [user, isOpen]);

  const fetchBuilds = async () => {
    if (!user) return;

    try {
      const response = await buildApi.listBuilds(50);
      const data = response.data || [];
      // Filter to only completed builds
      const completedBuilds = data.filter((b: any) => b.status === "complete");
      setBuilds((completedBuilds as Build[]) || []);
      
      // Auto-select the latest builds for each platform
      const typedData = data as Build[] || [];
      const androidBuilds = typedData.filter((b) => {
        const config = b.config as Record<string, unknown> | null;
        return !config?.platform || config?.platform === "android";
      });
      const iosBuilds = typedData.filter((b) => {
        const config = b.config as Record<string, unknown> | null;
        return config?.platform === "ios";
      });
      
      if (androidBuilds.length > 0 && !selectedAndroidBuild) {
        setSelectedAndroidBuild(androidBuilds[0].id);
      }
      if (iosBuilds.length > 0 && !selectedIosBuild) {
        setSelectedIosBuild(iosBuilds[0].id);
      }
    } catch (error) {
      console.error("Error fetching builds:", error);
    } finally {
      setLoading(false);
    }
  };

  const androidBuilds = useMemo(() => 
    builds.filter(b => {
      const config = b.config as Record<string, unknown> | null;
      return !config?.platform || config?.platform === "android";
    }),
    [builds]
  );

  const iosBuilds = useMemo(() => 
    builds.filter(b => {
      const config = b.config as Record<string, unknown> | null;
      return config?.platform === "ios";
    }),
    [builds]
  );

  const selectedAndroid = useMemo(() => 
    builds.find(b => b.id === selectedAndroidBuild),
    [builds, selectedAndroidBuild]
  );

  const selectedIos = useMemo(() => 
    builds.find(b => b.id === selectedIosBuild),
    [builds, selectedIosBuild]
  );

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "—";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatFileSizeRaw = (bytes: number | null): number => {
    if (!bytes) return 0;
    return bytes / (1024 * 1024);
  };

  const calculateBuildTime = (build: Build): number => {
    // Estimate based on created_at to updated_at difference
    // For builds that completed, this gives approximate build time
    const created = new Date(build.created_at);
    const updated = new Date(build.updated_at);
    return Math.max(differenceInSeconds(updated, created), 1);
  };

  const formatBuildTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const comparisonMetrics: ComparisonMetric[] = useMemo(() => {
    if (!selectedAndroid || !selectedIos) return [];

    const androidSize = selectedAndroid.file_size_bytes || 0;
    const iosSize = selectedIos.file_size_bytes || 0;
    const androidTime = calculateBuildTime(selectedAndroid);
    const iosTime = calculateBuildTime(selectedIos);

    const sizeWinner = androidSize < iosSize ? "android" : iosSize < androidSize ? "ios" : "tie";
    const timeWinner = androidTime < iosTime ? "android" : iosTime < androidTime ? "ios" : "tie";

    const sizeDiff = Math.abs(formatFileSizeRaw(androidSize) - formatFileSizeRaw(iosSize));
    const sizeDiffPercent = androidSize && iosSize 
      ? Math.round((Math.abs(androidSize - iosSize) / Math.max(androidSize, iosSize)) * 100)
      : 0;

    const timeDiff = Math.abs(androidTime - iosTime);
    const timeDiffPercent = androidTime && iosTime
      ? Math.round((timeDiff / Math.max(androidTime, iosTime)) * 100)
      : 0;

    return [
      {
        label: "File Size",
        android: formatFileSize(androidSize),
        ios: formatFileSize(iosSize),
        winner: sizeWinner,
        icon: <HardDrive className="w-4 h-4" />,
      },
      {
        label: "Build Time",
        android: formatBuildTime(androidTime),
        ios: formatBuildTime(iosTime),
        winner: timeWinner,
        icon: <Clock className="w-4 h-4" />,
      },
      {
        label: "Size Difference",
        android: sizeWinner === "android" ? `${sizeDiffPercent}% smaller` : "—",
        ios: sizeWinner === "ios" ? `${sizeDiffPercent}% smaller` : "—",
        winner: "tie",
        icon: <BarChart3 className="w-4 h-4" />,
      },
      {
        label: "Speed Difference",
        android: timeWinner === "android" ? `${timeDiffPercent}% faster` : "—",
        ios: timeWinner === "ios" ? `${timeDiffPercent}% faster` : "—",
        winner: "tie",
        icon: <TrendingUp className="w-4 h-4" />,
      },
    ];
  }, [selectedAndroid, selectedIos]);

  const hasBuildsForComparison = androidBuilds.length > 0 && iosBuilds.length > 0;

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={loading}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Compare Builds
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Build Comparison
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !hasBuildsForComparison ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No builds to compare</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Complete at least one Android and one iOS build to compare their file sizes and build times.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Build Selectors */}
            <div className="grid grid-cols-2 gap-4">
              {/* Android Build Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5 text-primary" />
                  </div>
                  Android Build
                </label>
                <Select 
                  value={selectedAndroidBuild} 
                  onValueChange={setSelectedAndroidBuild}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Android build" />
                  </SelectTrigger>
                  <SelectContent>
                    {androidBuilds.map((build) => (
                      <SelectItem key={build.id} value={build.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{build.app_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(build.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* iOS Build Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <div className="w-6 h-6 rounded-md bg-gray-500/10 flex items-center justify-center">
                    <AppleIcon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  iOS Build
                </label>
                <Select 
                  value={selectedIosBuild} 
                  onValueChange={setSelectedIosBuild}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select iOS build" />
                  </SelectTrigger>
                  <SelectContent>
                    {iosBuilds.map((build) => (
                      <SelectItem key={build.id} value={build.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[150px]">{build.app_name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(build.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comparison Table */}
            {selectedAndroid && selectedIos && (
              <div className="bg-secondary/30 rounded-xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-3 gap-4 p-4 border-b border-border/50 bg-secondary/50">
                  <div className="text-sm font-medium text-muted-foreground">Metric</div>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-primary">
                    <Smartphone className="w-4 h-4" />
                    Android
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600">
                    <AppleIcon className="w-4 h-4" />
                    iOS
                  </div>
                </div>

                {/* Metrics */}
                <div className="divide-y divide-border/30">
                  {comparisonMetrics.map((metric, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 p-4 items-center">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <span className="text-muted-foreground">{metric.icon}</span>
                        {metric.label}
                      </div>
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                          metric.winner === "android" 
                            ? "bg-primary/10 text-primary" 
                            : "bg-secondary text-foreground"
                        }`}>
                          {metric.android}
                          {metric.winner === "android" && (
                            <TrendingUp className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                          metric.winner === "ios" 
                            ? "bg-primary/10 text-primary" 
                            : "bg-secondary text-foreground"
                        }`}>
                          {metric.ios}
                          {metric.winner === "ios" && (
                            <TrendingUp className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Build Details */}
            {selectedAndroid && selectedIos && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {selectedAndroid.app_name}
                    </span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Format</dt>
                      <dd className="font-medium text-foreground">APK</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Built</dt>
                      <dd className="font-medium text-foreground">
                        {formatDistanceToNow(new Date(selectedAndroid.created_at), { addSuffix: true })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Features</dt>
                      <dd className="font-medium text-foreground">
                        {((selectedAndroid.config as Record<string, unknown> | null)?.features as string[] | undefined)?.length || 0}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="p-4 bg-gray-500/5 rounded-xl border border-gray-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AppleIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground truncate">
                      {selectedIos.app_name}
                    </span>
                  </div>
                  <dl className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Format</dt>
                      <dd className="font-medium text-foreground">IPA</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Built</dt>
                      <dd className="font-medium text-foreground">
                        {formatDistanceToNow(new Date(selectedIos.created_at), { addSuffix: true })}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Features</dt>
                      <dd className="font-medium text-foreground">
                        {((selectedIos.config as Record<string, unknown> | null)?.features as string[] | undefined)?.length || 0}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuildComparison;
