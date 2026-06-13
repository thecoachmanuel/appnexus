"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { projectsApi } from "@/lib/api";

export interface AppProject {
  id: string;
  user_id: string;
  app_name: string;
  website_url: string;
  description: string | null;
  app_category: string | null;
  primary_color: string | null;
  accent_color: string | null;
  navigation_style: string | null;
  features: string[];
  icon_style: string | null;
  splash_screen_style: string | null;
  build_status: string | null;
  codemagic_connected: boolean;
  github_connected: boolean;
  created_at: string;
  updated_at: string;
}
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

import PageHeader from "@/components/PageHeader";

import SubscriptionStatusBanner from "@/components/subscription/SubscriptionStatusBanner";
import { CreditUsageWidget } from "@/components/subscription/CreditUsageWidget";
import { DemoModeBanner } from "@/components/DemoModeBanner";
import { DemoTour } from "@/components/DemoTour";
import { useRealtime } from "@/hooks/useRealtime";
import { useLowCreditsWarning } from "@/hooks/useLowCreditsWarning";
import QRDownloadDialog from "@/components/QRDownloadDialog";
import AppPreviewDialog from "@/components/AppPreviewDialog";
import { 
  Plus, 
  Smartphone, 
  Clock, 
  ExternalLink, 
  Trash2, 
  Settings,
  FolderOpen,
  Zap,
  History,
  Images,
  Download,
  QrCode,
  Play,
  Coins
} from "lucide-react";
import CreditPackPurchaseModal from "@/components/subscription/CreditPackPurchaseModal";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useToast } from "@/hooks/use-toast";

// Extended type to include latest build info
interface ProjectWithBuild extends AppProject {
  latestBuild?: {
    id: string;
    download_url: string | null;
    status: string;
  } | null;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [projectsWithBuilds, setProjectsWithBuilds] = useState<ProjectWithBuild[]>([]);
  const { toast } = useToast();
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [qrDialog, setQrDialog] = useState<{ open: boolean; url: string; appName: string }>({
    open: false,
    url: "",
    appName: "",
  });
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; url: string; appName: string }>({
    open: false,
    url: "",
    appName: "",
  });
  
  // Monitor for low credits and show warning notification
  const { isLowCredits, totalCredits } = useLowCreditsWarning();

  useEffect(() => {
    fetchProjects();
  }, []);

  // Real-time updates for app builds (project status changes)
  useRealtime({
    table: 'app_builds',
    onUpdate: (data) => {
      // When a build completes, refresh projects to show updated status
      if (data.status === 'completed' || data.status === 'failed') {
        fetchProjects();
      }
    },
  });

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await projectsApi.list();

      if (projectsError) throw projectsError;
      
      const projects: AppProject[] = projectsData || [];
      setProjects(projects);

      // Fetch latest build for each project
      const projectsWithBuildData: ProjectWithBuild[] = await Promise.all(
        projects.map(async (project) => {
          const { data: builds } = await projectsApi.getBuilds(project.id);
          const latestBuild = builds && builds.length > 0 ? {
            id: builds[0].id,
            download_url: builds[0].download_url,
            status: builds[0].status,
          } : null;
          return { ...project, latestBuild };
        })
      );
      
      setProjectsWithBuilds(projectsWithBuildData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load your projects.";
      console.error("Error fetching projects:", error);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await projectsApi.delete(id);

      if (error) throw error;

      setProjects(projects.filter((p) => p.id !== id));
      toast({
        title: "Project Deleted",
        description: "Your app project has been removed.",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete the project.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "complete":
        return "bg-accent/10 text-accent border border-accent/20";
      case "building":
        return "bg-accent/5 text-accent/80 border border-accent/10";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Stats skeleton component
  const StatsSkeleton = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card rounded-xl p-3 sm:p-4 space-y-2">
          <Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
          <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" />
          <Skeleton className="h-2.5 sm:h-3 w-20 sm:w-24" />
        </div>
      ))}
    </div>
  );

  const PAGE_SIZE = 6;

  // Calculate stats
  const stats = {
    total: projects.length,
    complete: projects.filter((p: any) => p.build_status === 'complete').length,
    building: projects.filter((p: any) => p.build_status === 'building').length,
    draft: projects.filter((p: any) => p.build_status === 'draft').length,
  };

  const totalPages = Math.max(1, Math.ceil(projectsWithBuilds.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedProjects = projectsWithBuilds.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-24 md:pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <PageHeader
            title="My App Projects"
            description="Manage and build your mobile applications"
          >
            <Button variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/build-history">
                <History className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Build History
              </Link>
            </Button>
            <Button 
              variant={isLowCredits ? "destructive" : "outline"} 
              className={`w-full sm:w-auto relative ${isLowCredits ? "animate-pulse" : ""}`} 
              onClick={() => setShowCreditModal(true)}
            >
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Buy Credits
              {isLowCredits && (
                <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold border-2 border-background">
                  {totalCredits}
                </span>
              )}
            </Button>
            <Button variant="accent" className="w-full sm:w-auto" asChild>
              <Link href="/builder">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                New App
              </Link>
            </Button>
          </PageHeader>

          {/* Demo Mode Banner */}
          <DemoModeBanner />

          {/* Subscription Status Banner & Credit Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <SubscriptionStatusBanner />
            <CreditUsageWidget />
          </div>

          {/* Stats Section */}
          {loading ? (
            <StatsSkeleton />
          ) : projects.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="glass-card rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Projects</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">All apps</p>
              </div>
              <div className="glass-card rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
                <p className="text-xl sm:text-2xl font-bold text-accent">{stats.complete}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Ready to download</p>
              </div>
              <div className="glass-card rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Building</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.building}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">In progress</p>
              </div>
              <div className="glass-card rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-muted-foreground">Drafts</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.draft}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Not started</p>
              </div>
            </div>
          )}

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
                    <Skeleton className="w-14 sm:w-16 h-5 sm:h-6 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 sm:h-5 w-2/3" />
                    <Skeleton className="h-3 sm:h-4 w-full" />
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <Skeleton className="h-3 sm:h-4 w-20" />
                    <Skeleton className="h-3 sm:h-4 w-24" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 sm:h-9 flex-1 rounded" />
                    <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded" />
                    <Skeleton className="h-8 sm:h-9 w-8 sm:w-9 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="glass-card rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <FolderOpen className="w-8 h-8 sm:w-10 sm:h-10 text-accent" />
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground mb-2">
                No Projects Yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md mx-auto">
                Create your first mobile app by entering a website URL. Our AI will configure everything automatically.
              </p>
              <Button variant="accent" asChild>
                <Link href="/builder">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First App
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/30 transition-all duration-300 group"
                  >
                    {/* App Icon Preview */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center bg-accent/10 border border-accent/20">
                        <Smartphone className="w-5 h-5 sm:w-7 sm:h-7 text-accent" />
                      </div>
                      <span
                        className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize ${getStatusColor(
                          project.build_status
                        )}`}
                      >
                        {project.build_status || 'draft'}
                      </span>
                    </div>

                    {/* App Info */}
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-1 truncate">
                      {project.app_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate mb-3 sm:mb-4">
                      {project.website_url}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent/70" />
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                      {project.app_category && (
                        <span className="capitalize text-accent/80 truncate">{project.app_category}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-3 sm:pt-4 border-t border-border/50">
                      <Button
                        variant="glass"
                        size="sm"
                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                        asChild
                      >
                        <Link href={`/builder?project=${project.id}`}>
                          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden xs:inline">Edit</span>
                        </Link>
                      </Button>
                      
                      <Button 
                        variant="glass" 
                        size="sm" 
                        className="flex-1 h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                        onClick={() => setPreviewDialog({
                          open: true,
                          url: project.website_url,
                          appName: project.app_name,
                        })}
                      >
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                        <span className="hidden xs:inline">Preview</span>
                      </Button>

                      {project.latestBuild?.download_url && project.build_status === 'complete' && (
                        <>
                          <Button 
                            variant="accent" 
                            size="sm" 
                            className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                            asChild
                          >
                            <a 
                              href={project.latestBuild.download_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                              <span className="hidden xs:inline">Download</span>
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                            onClick={() => setQrDialog({
                              open: true,
                              url: project.latestBuild!.download_url!,
                              appName: project.app_name,
                            })}
                            title="Show QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <PaginationControls
                currentPage={safePage}
                totalPages={totalPages}
                totalItems={projectsWithBuilds.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </main>

      {/* QR Download Dialog */}
      <QRDownloadDialog
        open={qrDialog.open}
        onOpenChange={(open) => setQrDialog((prev) => ({ ...prev, open }))}
        downloadUrl={qrDialog.url}
        appName={qrDialog.appName}
      />

      {/* App Preview Dialog */}
      <AppPreviewDialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog((prev) => ({ ...prev, open }))}
        websiteUrl={previewDialog.url}
        appName={previewDialog.appName}
      />


      {/* Credit Pack Purchase Modal */}
      <CreditPackPurchaseModal
        open={showCreditModal}
        onOpenChange={setShowCreditModal}
      />

      {/* Demo Tour for demo accounts */}
      <DemoTour />

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Dashboard;
