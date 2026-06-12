"use client";

import { Coins, TrendingUp, Sparkles } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

interface CreditDisplayProps {
  variant?: "compact" | "full";
  className?: string;
}

export const CreditDisplay = ({ variant = "compact", className }: CreditDisplayProps) => {
  const { credits, plan, loading, getTotalCredits } = useCredits();

  if (loading) {
    return (
      <div className={cn("animate-pulse bg-muted rounded-lg h-8 w-20", className)} />
    );
  }

  const totalCredits = getTotalCredits();

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent",
          className
        )}
      >
        <Coins className="w-4 h-4" />
        <span className="font-semibold text-sm">{totalCredits}</span>
      </div>
    );
  }

  return (
    <div className={cn("glass-card rounded-2xl p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold text-foreground">Your Credits</h3>
        <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium capitalize">
          {plan?.tier || "Free"} Plan
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
          <div className="flex items-center gap-2 text-accent/70 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Monthly Credits</span>
          </div>
          <p className="font-display text-2xl font-bold text-accent">
            {credits?.monthly_credits ?? 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
          <div className="flex items-center gap-2 text-accent/70 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs">Bonus Credits</span>
          </div>
          <p className="font-display text-2xl font-bold text-accent">
            {credits?.bonus_credits ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-accent/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Available</span>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" />
            <span className="font-display text-xl font-bold text-accent">{totalCredits}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
