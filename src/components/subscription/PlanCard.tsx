"use client";

import { Check, Star, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  id: string;
  name: string;
  tier: "free" | "pro" | "enterprise";
  priceMonthly: number;
  priceYearly: number;
  monthlyCredits: number;
  features: Record<string, boolean>;
  description: string | null;
  isCurrentPlan?: boolean;
  billingCycle: "monthly" | "yearly";
  onSelect: (planId: string, billingCycle: "monthly" | "yearly") => void;
}

const tierIcons = {
  free: Zap,
  pro: Star,
  enterprise: Building2,
};

const tierColors = {
  free: "from-accent/20 to-accent/10",
  pro: "from-accent to-accent/70",
  enterprise: "from-accent/80 to-accent/50",
};

export const PlanCard = ({
  id,
  name,
  tier,
  priceMonthly,
  priceYearly,
  monthlyCredits,
  features,
  description,
  isCurrentPlan,
  billingCycle,
  onSelect,
}: PlanCardProps) => {
  const TierIcon = tierIcons[tier];
  const price = billingCycle === "monthly" ? priceMonthly : priceYearly;
  const isPopular = tier === "pro";

  const enabledFeatures = Object.entries(features || {})
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);

  const disabledFeatures = Object.entries(features || {})
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => feature);

  return (
    <div
        className={cn(
          "relative glass-card rounded-2xl p-6 transition-all duration-300",
          isPopular && "ring-2 ring-accent",
          isCurrentPlan && "bg-accent/5"
        )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-6">
        <div
          className={cn(
            "w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br",
            tierColors[tier]
          )}
        >
          <TierIcon className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-display text-xl font-bold text-foreground">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {/* Pricing */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl font-display font-bold text-accent">
            ${price}
          </span>
          <span className="text-muted-foreground">
            /{billingCycle === "monthly" ? "mo" : "yr"}
          </span>
        </div>
        <p className="text-sm text-accent/80 mt-2">
          {monthlyCredits} credits/month
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6">
        {enabledFeatures.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm">
            <Check className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="text-foreground">{feature}</span>
          </li>
        ))}
        {disabledFeatures.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm opacity-40">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="text-muted-foreground line-through">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button
        variant={isCurrentPlan ? "outline" : isPopular ? "accent" : "glass"}
        className="w-full"
        disabled={isCurrentPlan}
        onClick={() => onSelect(id, billingCycle)}
      >
        {isCurrentPlan ? "Current Plan" : tier === "free" ? "Get Started" : "Subscribe"}
      </Button>
    </div>
  );
};
