"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Smartphone, Menu, X, LogOut, Settings, Coins, Shield, Plus, ChevronDown, ChevronLeft, ChevronRight, FolderOpen, Trash2, Wrench, HelpCircle } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminExists } from "@/hooks/useAdminExists";
import { ThemeToggle } from "@/components/ThemeToggle";
import { userApi, projectsApi } from "@/lib/api";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import ThemeAwareLogo from "@/components/ThemeAwareLogo";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
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
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const navSections = ['features', 'how-it-works', 'pricing', 'platforms'] as const;

const PROJECTS_PER_PAGE = 5;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [projectPage, setProjectPage] = useState(0);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { hasAdmin } = useAdminExists();
  const { settings } = useSystemSettings();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Track active section with IntersectionObserver
  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection(null);
      return;
    }

    const observers: IntersectionObserver[] = [];
    
    navSections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveSection(sectionId);
              }
            });
          },
          { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [pathname]);

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    const scrollToElement = () => {
      const element = document.getElementById(targetId);
      if (element) {
        const navbarHeight = 80;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: elementPosition - navbarHeight,
          behavior: 'smooth'
        });
      }
    };

    // If we're not on the home page, navigate first then scroll
    if (pathname !== '/') {
      router.push('/');
      setTimeout(scrollToElement, 100);
    } else {
      scrollToElement();
    }
    
    setIsOpen(false);
  }, [pathname, router]);

  const getNavLinkClass = (sectionId: string) => 
    cn(
      "transition-colors cursor-pointer relative",
      activeSection === sectionId 
        ? "text-primary font-medium" 
        : "text-muted-foreground hover:text-foreground"
    );

  // Fetch user profile for avatar
  const { data: profile } = useQuery({
    queryKey: ["navbar-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await userApi.getProfile();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch all projects for builder dropdown
  const { data: allProjects } = useQuery({
    queryKey: ["recent-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await projectsApi.list();
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalProjectPages = Math.max(1, Math.ceil((allProjects?.length || 0) / PROJECTS_PER_PAGE));
  const paginatedProjects = useMemo(() => {
    if (!allProjects) return [];
    const start = projectPage * PROJECTS_PER_PAGE;
    return allProjects.slice(start, start + PROJECTS_PER_PAGE);
  }, [allProjects, projectPage]);

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await projectsApi.delete(projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-projects"] });
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("Failed to delete project");
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, project: { id: string; app_name: string }) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete({ id: project.id, name: project.app_name });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProjectMutation.mutate(projectToDelete.id);
    }
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

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <ThemeAwareLogo />
            <span className="font-display text-base sm:text-xl font-bold text-foreground truncate">{settings.app_name}</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            <a href="/#features" onClick={(e) => handleSmoothScroll(e, 'features')} className={getNavLinkClass('features')}>Features</a>
            <a href="/#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className={getNavLinkClass('how-it-works')}>How It Works</a>
            <a href="/#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className={getNavLinkClass('pricing')}>Pricing</a>
            <a href="/#platforms" onClick={(e) => handleSmoothScroll(e, 'platforms')} className={getNavLinkClass('platforms')}>Platforms</a>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                    pathname === '/builder'
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  Try to Build
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/builder" className="cursor-pointer flex items-center gap-2 font-medium">
                    <Plus className="w-4 h-4" />
                    New App
                  </Link>
                </DropdownMenuItem>
                {allProjects && allProjects.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center justify-between">
                      <span>Recent Projects ({allProjects.length})</span>
                      {totalProjectPages > 1 && (
                        <span className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProjectPage(p => Math.max(0, p - 1)); }}
                            disabled={projectPage === 0}
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] tabular-nums">{projectPage + 1}/{totalProjectPages}</span>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setProjectPage(p => Math.min(totalProjectPages - 1, p + 1)); }}
                            disabled={projectPage >= totalProjectPages - 1}
                            className="p-0.5 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )}
                    </DropdownMenuLabel>
                    {paginatedProjects.map((project: any) => (
                      <DropdownMenuItem key={project.id} className="p-0">
                        <div className="flex items-center justify-between w-full">
                          <Link 
                            href={`/builder`} 
                            className="flex-1 px-2 py-1.5 cursor-pointer flex flex-col items-start gap-0.5"
                          >
                            <span className="font-medium truncate max-w-[160px]">{project.app_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(project.updatedAt || project.updated_at || new Date()), { addSuffix: true })}
                            </span>
                          </Link>
                          <button
                            onClick={(e) => handleDeleteClick(e, project)}
                            className="p-1.5 mr-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer flex items-center gap-2 text-muted-foreground">
                        <FolderOpen className="w-4 h-4" />
                        View All Projects
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="glass" className="gap-2">
                    <Avatar className="w-7 h-7 border border-primary/20">
                      <AvatarImage src={profile?.avatar_url || undefined} alt="Avatar" />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                        {getInitials(profile?.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate">
                      {displayName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <Smartphone className="w-4 h-4 mr-2" />
                      My Projects
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/subscription" className="cursor-pointer">
                      <Coins className="w-4 h-4 mr-2" />
                      Plans & Credits
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/help" className="cursor-pointer">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help Center
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center justify-between w-full">
                        <span className="flex items-center">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </span>
                        <Badge variant="destructive" className="ml-2 text-[10px] px-1.5 py-0 h-4">
                          Admin
                        </Badge>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                {hasAdmin === false && (
                  <Button variant="outline" size="sm" asChild className="border-destructive/50 text-destructive hover:bg-destructive/10">
                    <Link href="/setup">
                      <Wrench className="w-4 h-4 mr-2" />
                      Setup Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" asChild>
                  <Link href="/auth">Sign In</Link>
                </Button>
                <Button variant="hero" size="lg" asChild>
                  <Link href="/auth">Start Free</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden pt-4 pb-2 space-y-4 animate-fade-in">
            <a href="/#features" onClick={(e) => handleSmoothScroll(e, 'features')} className={cn("block py-2 cursor-pointer", getNavLinkClass('features'))}>Features</a>
            <a href="/#how-it-works" onClick={(e) => handleSmoothScroll(e, 'how-it-works')} className={cn("block py-2 cursor-pointer", getNavLinkClass('how-it-works'))}>How It Works</a>
            <a href="/#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className={cn("block py-2 cursor-pointer", getNavLinkClass('pricing'))}>Pricing</a>
            <a href="/#platforms" onClick={(e) => handleSmoothScroll(e, 'platforms')} className={cn("block py-2 cursor-pointer", getNavLinkClass('platforms'))}>Platforms</a>
            <div className="py-2">
              <ThemeToggle />
            </div>
            <Link href="/builder" 
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-2 py-2 cursor-pointer",
                pathname === '/builder'
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Plus className="w-4 h-4" />
              New App
            </Link>
            <Link href="/dashboard" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 py-2 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <FolderOpen className="w-4 h-4" />
              My Projects
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              {user ? (
                <>
                  <Button variant="glass" className="w-full" asChild>
                    <Link href="/dashboard">My Projects</Link>
                  </Button>
                  <Button variant="glass" className="w-full" asChild>
                    <Link href="/subscription">Plans & Credits</Link>
                  </Button>
                  <Button variant="glass" className="w-full" asChild>
                    <Link href="/settings">Settings</Link>
                  </Button>
                  <Button variant="glass" className="w-full" asChild>
                    <Link href="/help">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Help Center
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="glass" className="w-full justify-between" asChild>
                      <Link href="/admin">
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Admin Panel
                        </span>
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                          Admin
                        </Badge>
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  {hasAdmin === false && (
                    <Button variant="outline" className="w-full border-destructive/50 text-destructive hover:bg-destructive/10" asChild>
                      <Link href="/setup">
                        <Wrench className="w-4 h-4 mr-2" />
                        Setup Admin
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/auth">Sign In</Link>
                  </Button>
                  <Button variant="hero" className="w-full" asChild>
                    <Link href="/auth">Start Free</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};

export default Navbar;
