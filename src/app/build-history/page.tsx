"use client";

import { useState } from "react";
import { BuildDetailsDrawer } from "@/components/builder/BuildDetailsDrawer";
import AppleIcon from "@/components/builder/AppleIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, buildApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PaginationControls } from "@/components/ui/pagination-controls";
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
import { 
  Download, 
  Search, 
  Filter,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  FileDown,
  Calendar,
  HardDrive,
  RotateCcw,
  Info,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DemoModeBanner } from "@/components/DemoModeBanner";

type BuildStatus = "pending" | "building" | "completed" | "complete" | "failed";

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

const statusConfig: Record<BuildStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-yellow-500 bg-yellow-500/10", label: "Pending" },
  building: { icon: Loader2, color: "text-blue-500 bg-blue-500/10", label: "Building" },
  completed: { icon: CheckCircle2, color: "text-green-500 bg-green-500/10", label: "Completed" },
  complete: { icon: CheckCircle2, color: "text-green-500 bg-green-500/10", label: "Completed" },
  failed: { icon: XCircle, color: "text-red-500 bg-red-500/10", label: "Failed" },
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getPlatformFromConfig = (config: Record<string, unknown>): string => {
  if (config?.platform) return config.platform as string;
  if (config?.targetPlatform) return config.targetPlatform as string;
  return "android"; // default
};

const BuildHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [buildToRetry, setBuildToRetry] = useState<Build | null>(null);
  const [retryingBuildId, setRetryingBuildId] = useState<string | null>(null);
  const [detailsBuild, setDetailsBuild] = useState<Build | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: builds, isLoading } = useQuery({
    queryKey: ["build-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await projectsApi.getBuilds();
      if (error) throw error;
      return (data || []) as Build[];
    },
    enabled: !!user?.id,
  });

  // Retry build mutation
  const retryBuildMutation = useMutation({
    mutationFn: async (build: Build) => {
      // Trigger the build process via API - pass the entire config
      const platform = getPlatformFromConfig(build.config as Record<string, unknown>);
      const buildConfig = {
        ...build.config,
        websiteUrl: build.website_url,
        appName: build.app_name,
      };
      
      if (platform === "ios") {
        const { error } = await buildApi.startIosBuild(buildConfig);
        if (error) throw error;
      } else {
        const { error } = await buildApi.startAndroidBuild(buildConfig);
        if (error) throw error;
      }

      return build.id;
    },
    onMutate: (build) => {
      setRetryingBuildId(build.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["build-history"] });
      toast.success("Build restarted", {
        description: "Your build has been queued and will start shortly.",
      });
      setRetryDialogOpen(false);
      setBuildToRetry(null);
    },
    onError: (error) => {
      console.error("Retry build error:", error);
      toast.error("Failed to restart build", {
        description: error instanceof Error ? error.message : "Please try again later.",
      });
      queryClient.invalidateQueries({ queryKey: ["build-history"] });
    },
    onSettled: () => {
      setRetryingBuildId(null);
    },
  });

  const handleRetryClick = (build: Build) => {
    setBuildToRetry(build);
    setRetryDialogOpen(true);
  };

  const confirmRetry = () => {
    if (buildToRetry) {
      retryBuildMutation.mutate(buildToRetry);
    }
  };

  const filteredBuilds = builds?.filter((build) => {
    const matchesSearch = 
      build.app_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.package_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      build.website_url.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || build.status === statusFilter || (statusFilter === "completed" && build.status === "complete");
    
    const platform = getPlatformFromConfig(build.config as Record<string, unknown>);
    const matchesPlatform = platformFilter === "all" || platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  }) || [];

  const totalPages = Math.max(1, Math.ceil(filteredBuilds.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedBuilds = filteredBuilds.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = {
    total: builds?.length || 0,
    completed: builds?.filter((b: any) => b.status === "completed" || b.status === "complete").length || 0,
    failed: builds?.filter((b: any) => b.status === "failed").length || 0,
    pending: builds?.filter((b: any) => b.status === "pending" || b.status === "building").length || 0,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 pt-24">
        {/* Demo Mode Banner */}
        <DemoModeBanner />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Build History
          </h1>
          <p className="text-muted-foreground">
            View and manage all your past app builds
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Builds</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-card/50 border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by app name, package, or URL..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={(v) => { setPlatformFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-[140px]">
                    <Smartphone className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="android">Android</SelectItem>
                    <SelectItem value="ios">iOS</SelectItem>
                    <SelectItem value="pwa">PWA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Build List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : filteredBuilds.length === 0 ? (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <FileDown className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {builds?.length === 0 ? "No builds yet" : "No matching builds"}
              </h3>
              <p className="text-muted-foreground">
                {builds?.length === 0 
                  ? "Start building apps to see your history here"
                  : "Try adjusting your filters or search query"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {paginatedBuilds.map((build, index) => {
                  const status = (build.status as BuildStatus) || "pending";
                  const StatusIcon = statusConfig[status]?.icon || Clock;
                  const platform = getPlatformFromConfig(build.config as Record<string, unknown>);
                  
                  return (
                    <motion.div
                      key={build.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* App Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-foreground truncate">
                                  {build.app_name}
                                </h3>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "shrink-0",
                                    statusConfig[status]?.color
                                  )}
                                >
                                  <StatusIcon className={cn(
                                    "w-3 h-3 mr-1",
                                    status === "building" && "animate-spin"
                                  )} />
                                  {statusConfig[status]?.label || status}
                                </Badge>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  {platform === "ios" ? (
                                    <AppleIcon className="w-3.5 h-3.5" />
                                  ) : (
                                    <Smartphone className="w-3.5 h-3.5" />
                                  )}
                                  {platform.toUpperCase()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {format(new Date(build.created_at), "MMM d, yyyy")}
                                </span>
                                {build.file_size_bytes && (
                                  <span className="flex items-center gap-1">
                                    <HardDrive className="w-3.5 h-3.5" />
                                    {formatFileSize(build.file_size_bytes)}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {build.package_name} • {build.website_url}
                              </p>

                              {build.error_message && (
                                <div className="mt-2 rounded-md bg-red-500/5 border border-red-500/20 p-2.5">
                                  {build.error_message.includes("Step:") ? (
                                    <>
                                      <p className="text-xs font-semibold text-red-500 mb-0.5">
                                        {build.error_message.split(" — ")[0]}
                                      </p>
                                      <p className="text-xs text-red-400 line-clamp-2">
                                        {build.error_message.split(" — ").slice(1).join(" — ")}
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-xs text-red-500 line-clamp-2">
                                      {build.error_message}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {build.status === "failed" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                                  onClick={() => handleRetryClick(build)}
                                  disabled={retryingBuildId === build.id}
                                >
                                  {retryingBuildId === build.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-4 h-4" />
                                  )}
                                  <span className="hidden sm:inline">Retry</span>
                                </Button>
                              )}
                              {build.download_url && build.status === "completed" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="gap-2"
                                  asChild
                                >
                                  <a 
                                    href={build.download_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    download
                                  >
                                    <Download className="w-4 h-4" />
                                    Download
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => setDetailsBuild(build)}
                              >
                                <Info className="w-4 h-4" />
                                <span className="hidden sm:inline">Details</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                asChild
                              >
                                <a 
                                  href={build.website_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="hidden sm:inline">View Site</span>
                                </a>
                              </Button>
                            </div>
                          </div>

                          {/* Progress bar for in-progress builds */}
                          {(status === "building" || status === "pending") && build.progress > 0 && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>Building...</span>
                                <span>{build.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${build.progress}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <PaginationControls
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredBuilds.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              className="mt-6"
            />
          </>
        )}
      </main>

      <Footer />

      {/* Retry Confirmation Dialog */}
      <AlertDialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retry Build?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restart the build for <span className="font-semibold">{buildToRetry?.app_name}</span>. 
              The previous error will be cleared and the build process will start fresh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={retryBuildMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRetry}
              disabled={retryBuildMutation.isPending}
              className="gap-2"
            >
              {retryBuildMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Retry Build
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BuildDetailsDrawer
        build={detailsBuild}
        open={!!detailsBuild}
        onOpenChange={(open) => !open && setDetailsBuild(null)}
      />
    </div>
  );
};

export default BuildHistory;
