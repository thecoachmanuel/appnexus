"use client";

import { useState, useEffect, useCallback } from "react";
import { buildApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, Smartphone, Monitor, Globe, RotateCcw, RefreshCw, AlertTriangle, Loader2, Timer } from "lucide-react";
import AppleIcon from "@/components/builder/AppleIcon";
import { formatDistanceToNow, differenceInDays, differenceInHours, addDays } from "date-fns";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Build {
  id: string;
  app_name: string;
  website_url: string;
  status: string;
  download_url: string | null;
  file_size_bytes: number | null;
  config: Record<string, unknown>;
  created_at: string;
  error_message: string | null;
}

interface BuildHistoryProps {
  onRebuild?: (build: Build) => void;
}

interface DownloadState {
  [buildId: string]: {
    retrying: boolean;
    retryCount: number;
    error: string | null;
  };
}

// Build downloads expire after 7 days by default
const BUILD_EXPIRATION_DAYS = 7;
const EXPIRATION_WARNING_DAYS = 2;

const BuildHistory = ({ onRebuild }: BuildHistoryProps) => {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [downloadStates, setDownloadStates] = useState<DownloadState>({});
  const [rebuildConfirmOpen, setRebuildConfirmOpen] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const { user } = useAuth();

  const getExpirationInfo = useCallback((createdAt: string) => {
    const createdDate = new Date(createdAt);
    const expirationDate = addDays(createdDate, BUILD_EXPIRATION_DAYS);
    const now = new Date();
    
    const daysRemaining = differenceInDays(expirationDate, now);
    const hoursRemaining = differenceInHours(expirationDate, now);
    
    const isExpired = hoursRemaining <= 0;
    const isExpiringSoon = daysRemaining <= EXPIRATION_WARNING_DAYS && !isExpired;
    
    let expirationText = "";
    if (isExpired) {
      expirationText = "Expired";
    } else if (hoursRemaining < 24) {
      expirationText = `Expires in ${hoursRemaining}h`;
    } else {
      expirationText = `Expires in ${daysRemaining}d`;
    }
    
    return {
      expirationDate,
      daysRemaining,
      hoursRemaining,
      isExpired,
      isExpiringSoon,
      expirationText,
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchBuilds();
    }
  }, [user]);

  const fetchBuilds = async () => {
    if (!user) return;

    try {
      const response = await buildApi.listBuilds(10);
      const data = response.data || [];
      setBuilds((data as Build[]) || []);
    } catch (error) {
      console.error("Error fetching builds:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-primary" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPlatformIcon = (config: Record<string, unknown>) => {
    const platform = config?.platform as string || "android";
    switch (platform) {
      case "ios":
        return <AppleIcon className="w-4 h-4" />;
      case "pwa":
        return <Globe className="w-4 h-4" />;
      case "windows":
      case "macos":
      case "linux":
        return <Monitor className="w-4 h-4" />;
      default:
        return <Smartphone className="w-4 h-4" />;
    }
  };

  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes("404") || error.message.includes("not found")) {
        return "File not found. The build may have expired or been deleted.";
      }
      if (error.message.includes("network") || error.message.includes("fetch")) {
        return "Network error. Please check your connection and try again.";
      }
      if (error.message.includes("timeout")) {
        return "Download timed out. Please try again.";
      }
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  };

  const handleDownload = useCallback(async (build: Build, isRetry = false) => {
    if (!build.download_url) {
      toast.error("Download URL not available");
      return;
    }

    const currentState = downloadStates[build.id] || { retrying: false, retryCount: 0, error: null };
    
    if (isRetry && currentState.retryCount >= 3) {
      toast.error("Maximum retry attempts reached. Please try rebuilding the app.");
      return;
    }

    setDownloadStates(prev => ({
      ...prev,
      [build.id]: {
        retrying: true,
        retryCount: isRetry ? currentState.retryCount + 1 : 0,
        error: null,
      }
    }));

    try {
      // First, check if the file is accessible
      const response = await fetch(build.download_url, { method: 'HEAD' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Download with a proper filename based on app name
      const downloadResponse = await fetch(build.download_url);
      if (!downloadResponse.ok) {
        throw new Error(`HTTP ${downloadResponse.status}: ${downloadResponse.statusText}`);
      }
      const blob = await downloadResponse.blob();
      const sanitizedName = build.app_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
      const fileName = `${sanitizedName}.apk`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setDownloadStates(prev => ({
        ...prev,
        [build.id]: { retrying: false, retryCount: 0, error: null }
      }));
      
      toast.success(`Downloading ${build.app_name} as ${fileName}...`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      
      setDownloadStates(prev => ({
        ...prev,
        [build.id]: {
          retrying: false,
          retryCount: isRetry ? currentState.retryCount + 1 : 1,
          error: errorMessage,
        }
      }));
      
      toast.error(errorMessage);
    }
  }, [downloadStates]);

  const handleRebuildClick = (build: Build) => {
    setSelectedBuild(build);
    setRebuildConfirmOpen(true);
  };

  const confirmRebuild = () => {
    if (selectedBuild && onRebuild) {
      onRebuild(selectedBuild);
    }
    setRebuildConfirmOpen(false);
    setSelectedBuild(null);
  };

  if (loading) {
    return (
      <div className="bg-secondary/30 rounded-2xl p-5 mb-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        
        {/* Build record skeletons */}
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-background/50 rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status and platform icons */}
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="w-4 h-4 rounded" />
                </div>
                {/* App name and metadata */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              {/* Action buttons */}
              <div className="flex items-center gap-1 ml-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (builds.length === 0) {
    return null;
  }

  const displayedBuilds = expanded ? builds : builds.slice(0, 3);

  return (
    <TooltipProvider>
      <div className="bg-secondary/30 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-display font-bold text-foreground text-sm">Build History</h4>
          <span className="text-xs text-muted-foreground">{builds.length} builds</span>
        </div>

        <div className="space-y-2">
          {displayedBuilds.map((build) => {
            const downloadState = downloadStates[build.id];
            const hasDownloadError = downloadState?.error;
            const isRetrying = downloadState?.retrying;
            const retryCount = downloadState?.retryCount || 0;
            const expirationInfo = build.status === "complete" ? getExpirationInfo(build.created_at) : null;

            return (
              <div key={build.id} className="space-y-1">
                <div
                  className={`flex items-center justify-between p-3 bg-background/50 rounded-xl hover:bg-background/80 transition-colors ${hasDownloadError ? 'ring-1 ring-destructive/30' : ''} ${expirationInfo?.isExpired ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(build.status)}
                      {getPlatformIcon(build.config)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {build.app_name}
                        </p>
                        {/* Expiration Badge */}
                        {expirationInfo && (
                          expirationInfo.isExpired ? (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                              <Timer className="w-2.5 h-2.5 mr-0.5" />
                              Expired
                            </Badge>
                          ) : expirationInfo.isExpiringSoon ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-muted text-muted-foreground shrink-0">
                              <Timer className="w-2.5 h-2.5 mr-0.5" />
                              {expirationInfo.expirationText}
                            </Badge>
                          ) : null
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {formatDistanceToNow(new Date(build.created_at), { addSuffix: true })}
                        {build.file_size_bytes && ` • ${formatFileSize(build.file_size_bytes)}`}
                        {expirationInfo && !expirationInfo.isExpired && !expirationInfo.isExpiringSoon && (
                          <span className="text-muted-foreground/60"> • {expirationInfo.expirationText}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {/* Rebuild Button */}
                    {onRebuild && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRebuildClick(build)}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rebuild with same config</p>
                        </TooltipContent>
                      </Tooltip>
                    )}

                    {/* Download Button with retry and expiration handling */}
                    {build.status === "complete" && build.download_url ? (
                      expirationInfo?.isExpired ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                              <Timer className="w-3 h-3" />
                              Expired
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">This build has expired. Please rebuild to get a new download link.</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : hasDownloadError ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => handleDownload(build, true)}
                              disabled={isRetrying}
                            >
                              {isRetrying ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Retry download ({retryCount}/3 attempts)</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDownload(build)}
                              disabled={isRetrying}
                            >
                              {isRetrying ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    ) : build.status === "failed" ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1 text-xs text-destructive cursor-help">
                            <AlertTriangle className="w-3 h-3" />
                            Failed
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">{build.error_message || "Build failed. Try rebuilding with different settings."}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : build.status !== "complete" ? (
                      <span className="text-xs text-muted-foreground capitalize">
                        {build.status}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Download Error Alert */}
                {hasDownloadError && (
                  <Alert variant="destructive" className="py-2 px-3">
                    <AlertTriangle className="h-3 w-3" />
                    <AlertDescription className="text-xs ml-2 flex items-center justify-between gap-2">
                      <span className="truncate">{downloadState.error}</span>
                      {retryCount >= 3 && onRebuild && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs underline shrink-0"
                          onClick={() => handleRebuildClick(build)}
                        >
                          Rebuild instead
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            );
          })}
        </div>

        {/* Rebuild Confirmation Dialog */}
        <AlertDialog open={rebuildConfirmOpen} onOpenChange={setRebuildConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rebuild this app?</AlertDialogTitle>
              <AlertDialogDescription>
                This will start a new build for <span className="font-medium text-foreground">{selectedBuild?.app_name}</span> using the same configuration. This action will use your build credits.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRebuild}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rebuild
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {builds.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                Show {builds.length - 3} More
              </>
            )}
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
};

export default BuildHistory;
