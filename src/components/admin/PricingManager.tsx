"use client";

import { useMemo, useState } from "react";
import { PricingPlansManager } from "./PricingPlansManager";
import { CreditPacksManager } from "./CreditPacksManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutList, Coins, Zap } from "lucide-react";
import { toast } from "sonner";

interface PricingManagerProps {
  plans: any;
  creditPacks: any;
  onUpdatePlan: any;
  onCreatePlan: any;
  onUpdateCreditPack: any;
  onCreateCreditPack: any;
  onDeleteCreditPack: any;
  onRefreshPlans: () => void;
  onRefreshCreditPacks: () => void;
  loading?: boolean;
  isDemo?: boolean;
}

export const PricingManager = ({
  plans,
  creditPacks,
  onUpdatePlan,
  onCreatePlan,
  onUpdateCreditPack,
  onCreateCreditPack,
  onDeleteCreditPack,
  onRefreshPlans,
  onRefreshCreditPacks,
  loading,
}: PricingManagerProps) => {
  const stats = useMemo(() => {
    const activePlans = Array.isArray(plans) ? plans.filter((p: any) => p.is_active).length : 0;
    const totalPlans = Array.isArray(plans) ? plans.length : 0;
    return { activePlans, totalPlans };
  }, [plans]);

  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/setup');
      if (!res.ok) throw new Error('Failed to seed defaults');
      toast.success('Successfully seeded default plans and credit packs');
      onRefreshPlans();
      onRefreshCreditPacks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to seed defaults');
    } finally {
      setSeeding(false);
    }
  };

  const handleRefreshAll = () => {
    onRefreshPlans();
    onRefreshCreditPacks();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pricing & Credits</h1>
          <p className="text-muted-foreground text-sm">
            Manage subscription plans, pricing tiers, and credit packs
          </p>
        </div>
        <div className="flex gap-2">
          {stats.totalPlans === 0 && (
            <Button onClick={handleSeed} disabled={seeding} variant="default" size="sm" className="gap-2">
              <Zap className="w-4 h-4" />
              {seeding ? "Seeding..." : "Seed Defaults"}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRefreshAll} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <LayoutList className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.activePlans}</p>
            <p className="text-xs text-muted-foreground">Active Plans</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-accent/10">
            <Coins className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{Array.isArray(creditPacks) ? creditPacks.length : 0}</p>
            <p className="text-xs text-muted-foreground">Credit Packs</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="plans" className="gap-2">
            <LayoutList className="w-4 h-4" />
            Plans
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2">
            <Coins className="w-4 h-4" />
            Credit Packs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="mt-6 border-0 p-0">
          <PricingPlansManager
            plans={plans}
            onUpdate={onUpdatePlan}
            onCreate={onCreatePlan}
            onRefresh={onRefreshPlans}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="credits" className="mt-6 border-0 p-0">
          <CreditPacksManager
            packs={creditPacks || []}
            onUpdate={onUpdateCreditPack}
            onCreate={onCreateCreditPack}
            onDelete={onDeleteCreditPack}
            onRefresh={onRefreshCreditPacks}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
