"use client";

import { useState } from "react";
import { useCredits } from "@/hooks/useCredits";
import { format } from "date-fns";
import { Crown, CreditCard, Calendar, Coins, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import CreditPackPurchaseModal from "./CreditPackPurchaseModal";

export const SubscriptionStatusBanner = () => {
  const { credits, subscription, plan, loading } = useCredits();
  const [showCreditModal, setShowCreditModal] = useState(false);

  if (loading) {
    return (
      <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 sm:h-5 w-24 sm:w-32" />
              <Skeleton className="h-3 sm:h-4 w-32 sm:w-40" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-6">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>
      </div>
    );
  }

  const totalCredits = credits ? credits.monthly_credits + credits.bonus_credits : 0;
  const planName = plan?.name || "Free";
  const renewalDate = subscription?.current_period_end
    ? format(new Date(subscription.current_period_end), "MMM dd, yyyy")
    : null;

  const getPlanIcon = () => {
    switch (plan?.tier) {
      case "pro":
      case "enterprise":
        return <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />;
      default:
        return <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />;
    }
  };

  const getPlanBadgeStyle = () => {
    switch (plan?.tier) {
      case "pro":
        return "bg-accent/10 text-accent border-accent/20";
      case "enterprise":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50">
      <div className="flex flex-col gap-4">
        {/* Top Row: Plan Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${
              plan?.tier === "pro" || plan?.tier === "enterprise" 
                ? "bg-accent/10 border border-accent/20" 
                : "bg-muted border border-border"
            }`}>
              {getPlanIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                  {planName} Plan
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border shrink-0 ${getPlanBadgeStyle()}`}>
                  {subscription?.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              {renewalDate && (
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  Renews {renewalDate}
                </p>
              )}
            </div>
          </div>

          {/* Credits Display - Desktop inline, Mobile stacked */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
            {/* Credits Display */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-accent/5 border border-accent/10">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-accent shrink-0" />
              <div>
                <p className="text-lg sm:text-xl font-bold text-foreground leading-none">{totalCredits}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">Credits remaining</p>
              </div>
            </div>

            {/* Buy Credits Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 sm:h-10 shrink-0"
              onClick={() => setShowCreditModal(true)}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              Buy Credits
            </Button>
          </div>
        </div>

        {/* Bottom Row: Monthly/Bonus Credits & Manage Button */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-4">
            {/* Monthly Credits */}
            {credits && (
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{credits.monthly_credits}</p>
                <p className="text-xs text-muted-foreground">Monthly</p>
              </div>
            )}

            {/* Bonus Credits */}
            {credits && credits.bonus_credits > 0 && (
              <div className="text-center">
                <p className="text-sm font-semibold text-accent">{credits.bonus_credits}</p>
                <p className="text-xs text-muted-foreground">Bonus</p>
              </div>
            )}
          </div>

          {/* Upgrade/Manage Button */}
          <Button variant="accent" size="sm" className="h-9 sm:h-10 shrink-0" asChild>
            <Link href="/subscription">
              {plan?.tier === "free" ? "Upgrade" : "Manage"}
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Credit Pack Purchase Modal */}
      <CreditPackPurchaseModal 
        open={showCreditModal} 
        onOpenChange={setShowCreditModal} 
      />
    </div>
  );
};

export default SubscriptionStatusBanner;
