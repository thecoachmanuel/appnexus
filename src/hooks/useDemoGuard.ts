"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { isDemoAccount } from "@/lib/demo-mode";
import { toast } from "@/hooks/use-toast";
import { useCallback } from "react";

/**
 * Hook that provides demo mode read-only guard.
 * When demo mode is active and user is a demo account,
 * all mutations are blocked with a toast notification.
 */
export function useDemoGuard() {
  const { user } = useAuth();
  const { settings } = useSystemSettings();

  const isDemo = isDemoAccount(user?.email, settings.demo_mode);

  const guardAction = useCallback(
    <T extends (...args: any[]) => any>(fn: T): T => {
      if (!isDemo) return fn;
      return ((...args: any[]) => {
        toast({
          title: "Demo Mode — Read Only",
          description: "This action is disabled in demo mode. Switch to production for full access.",
          variant: "destructive",
        });
      }) as unknown as T;
    },
    [isDemo]
  );

  return { isDemo, guardAction };
}
