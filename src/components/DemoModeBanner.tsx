"use client";

import { useAuth } from "@/contexts/AuthContext";
import { FlaskConical, UserCog, User, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { isDemoAccount as checkDemoAccount, isAdminDemoAccount } from "@/lib/demo-mode";

const TOUR_STORAGE_KEY = "demo_tour_completed";

export function DemoModeBanner() {
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  
  const userEmail = user?.email?.toLowerCase();
  const isDemoUser = checkDemoAccount(userEmail, settings.demo_mode);
  const isAdminDemo = isAdminDemoAccount(userEmail, settings.demo_mode);
  
  if (!isDemoUser) return null;

  const handleRestartTour = () => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    window.location.reload();
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Demo Mode Active</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                isAdminDemo 
                  ? "bg-purple-500/20 text-purple-500" 
                  : "bg-blue-500/20 text-blue-500"
              }`}>
                {isAdminDemo ? (
                  <span className="flex items-center gap-1">
                    <UserCog className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    User
                  </span>
                )}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              You're using a demo account ({userEmail}). <strong>Read-only mode</strong> — changes are disabled.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRestartTour}
            className="gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Replay Tour</span>
          </Button>
          
          {isAdminDemo && (
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href="/admin">
                <UserCog className="w-4 h-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
