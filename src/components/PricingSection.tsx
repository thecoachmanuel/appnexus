"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Sparkles } from "lucide-react";
import { plansApi } from "@/lib/api";
import Link from "next/link";
import AnimatedSection, { StaggerContainer, StaggerItem } from "@/components/AnimatedSection";

interface DisplayPlan {
  id: string;
  name: string;
  tier: string;
  price_monthly: number;
  price_yearly: number;
  description: string | null;
  features: string[] | Record<string, boolean>;
}

// Fallback plans if API is unavailable
const fallbackPlans: DisplayPlan[] = [
  {
    id: "free",
    name: "Free",
    tier: "free",
    price_monthly: 0,
    price_yearly: 0,
    description: "Perfect for trying out the platform",
    features: [
      "1 App Build per Month",
      "Basic Customization",
      "Browser Preview",
      "Community Support",
      "Watermark on App"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    tier: "pro",
    price_monthly: 19,
    price_yearly: 182,
    description: "For serious app creators",
    features: [
      "10 App Builds per Month",
      "Full Customization",
      "Push Notifications",
      "No Watermark",
      "Priority Support",
      "App Store Ready Builds",
      "Analytics Dashboard"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tier: "enterprise",
    price_monthly: 199,
    price_yearly: 1910,
    description: "For agencies and teams",
    features: [
      "Unlimited App Builds",
      "White-Label Solution",
      "Custom Branding",
      "Dedicated Support",
      "API Access",
      "Team Management",
      "Custom Integrations",
      "SLA Guarantee"
    ]
  }
];

const PricingSection = () => {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await plansApi.list();
      if (error) throw error;
      const activePlans = (data || []).filter((p: any) => p.is_active).map((p: any) => ({
        id: p.id,
        name: p.name,
        tier: p.tier,
        price_monthly: p.price_monthly,
        price_yearly: p.price_yearly,
        description: p.description,
        features: p.features as string[] | Record<string, boolean>,
      }));
      setPlans(activePlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  // Transform features to array
  const getFeatures = (features: unknown): string[] => {
    if (Array.isArray(features)) {
      return features as string[];
    }
    if (typeof features === 'object' && features !== null) {
      return Object.keys(features).filter(key => (features as Record<string, boolean>)[key]);
    }
    return [];
  };

  // Get CTA text based on tier
  const getCTA = (tier: string): string => {
    switch (tier) {
      case "free": return "Get Started";
      case "pro": return "Start Pro Trial";
      case "enterprise": return "Contact Sales";
      default: return "Get Started";
    }
  };

  // Check if plan is popular (pro tier)
  const isPopular = (tier: string): boolean => tier === "pro";

  // Use API plans or fallback
  const displayPlans = plans.length > 0 ? plans : (loading ? [] : fallbackPlans);

  // Skeleton for plan cards
  const PlanCardSkeleton = () => (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="text-center space-y-3">
        <Skeleton className="h-7 w-20 mx-auto" />
        <div className="flex items-baseline justify-center gap-1">
          <Skeleton className="h-12 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  );

  return (
    <section id="pricing" className="py-32 relative">
      <div className="absolute inset-0 bg-muted/20" />
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">Pricing Plans</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-foreground">Simple, Transparent</span>
            <br />
            <span className="text-primary">Pricing</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Start free, upgrade when you need. Cancel anytime
          </p>
        </AnimatedSection>

        {/* Pricing Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto" staggerDelay={0.15}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <PlanCardSkeleton key={i} />)
          ) : (
            displayPlans.map((plan) => {
              const features = getFeatures(plan.features);
              const popular = isPopular(plan.tier);
              
              return (
                <StaggerItem key={plan.id} className="h-full">
                  <div 
                    className={`relative glass-card rounded-3xl p-8 h-full ${popular ? 'border-primary/50 scale-105' : ''} transition-all duration-500 hover:-translate-y-2`}
                  >
                    {/* Popular Badge */}
                    {popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <div className="bg-accent text-accent-foreground text-sm font-semibold px-4 py-1 rounded-full">
                          Most Popular
                        </div>
                      </div>
                    )}

                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <h3 className="font-display text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="font-display text-5xl font-bold text-primary">${plan.price_monthly}</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>
                      <p className="text-muted-foreground mt-2">{plan.description}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-accent" />
                          </div>
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button 
                      variant={popular ? "accent" : "glass"}
                      size="lg"
                      className="w-full"
                      asChild
                    >
                      <Link href="/subscription">
                        {getCTA(plan.tier)}
                      </Link>
                    </Button>
                  </div>
                </StaggerItem>
              );
            })
          )}
        </StaggerContainer>

        {/* Trust Badges */}
        <AnimatedSection delay={0.3} className="flex flex-wrap items-center justify-center gap-8 mt-16 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            <span>14-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-accent" />
            <span>Cancel anytime</span>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default PricingSection;
