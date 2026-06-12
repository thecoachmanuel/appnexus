"use client";

import { useEffect, useRef } from "react";
import { useCredits } from "./useCredits";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { isDemoAccount as checkDemoAccount } from "@/lib/demo-mode";
import { toast } from "@/hooks/use-toast";

const LOW_CREDITS_THRESHOLD = 10;
const WARNING_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export const useLowCreditsWarning = () => {
  const { credits, loading } = useCredits();
  const { user } = useAuth();
  const { settings } = useSystemSettings();
  const lastWarningTime = useRef<number>(0);

  const isDemoUser = checkDemoAccount(user?.email, settings.demo_mode);

  useEffect(() => {
    if (loading || !credits || isDemoUser) return;

    const totalCredits = credits.monthly_credits + credits.bonus_credits;
    const now = Date.now();
    const timeSinceLastWarning = now - lastWarningTime.current;

    if (totalCredits <= LOW_CREDITS_THRESHOLD && timeSinceLastWarning > WARNING_COOLDOWN_MS) {
      lastWarningTime.current = now;
      localStorage.setItem("lastLowCreditsWarning", now.toString());

      if (totalCredits === 0) {
        toast({
          title: "No credits remaining",
          description: "You've run out of credits. Purchase more to continue using the app.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Low credits warning",
          description: `You have ${totalCredits} credit${totalCredits === 1 ? "" : "s"} remaining. Consider purchasing more.`,
          variant: "destructive",
        });
      }
    }
  }, [credits, loading, isDemoUser]);

  useEffect(() => {
    const stored = localStorage.getItem("lastLowCreditsWarning");
    if (stored) {
      lastWarningTime.current = parseInt(stored, 10);
    }
  }, []);

  return {
    isLowCredits: isDemoUser ? false : (credits ? (credits.monthly_credits + credits.bonus_credits) <= LOW_CREDITS_THRESHOLD : false),
    totalCredits: credits ? credits.monthly_credits + credits.bonus_credits : 0,
  };
};
