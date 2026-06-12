"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, DollarSign, Hammer, TrendingUp, RotateCcw, Loader2, CreditCard, UserPlus, Activity, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AdminOverviewProps {
  stats: {
    totalUsers: number;
    totalBuilds: number;
    totalRevenue: number;
    activeBuilds: number;
    monthlyRevenue: number;
    activeSubscriptions?: number;
    mrr?: number;
    newUsersToday?: number;
    buildsToday?: number;
  };
  loading?: boolean;
  isDemo?: boolean;
}

export const AdminOverview = ({ stats, loading = false, isDemo = false }: AdminOverviewProps) => {
  const [resetting, setResetting] = useState(false);

  const handleResetDemoData = async () => {
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-demo-data");
      if (error) throw error;
      toast({
        title: "Demo data reset",
        description: data.message || "Demo accounts have been reset successfully.",
      });
    } catch (error: unknown) {
      console.error("Reset demo data error:", error);
      toast({
        title: "Reset failed",
        description: error instanceof Error ? error.message : "Failed to reset demo data.",
        variant: "destructive",
      });
    } finally {
      setResetting(false);
    }
  };

  const primaryCards = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      description: "Registered accounts",
    },
    {
      title: "Active Subscribers",
      value: (stats.activeSubscriptions || 0).toLocaleString(),
      icon: CreditCard,
      description: "Active subscriptions",
      highlight: true,
    },
    {
      title: "Monthly Recurring Revenue",
      value: `$${(stats.mrr || stats.monthlyRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      description: "MRR from subscriptions",
      highlight: true,
    },
    {
      title: "Active Builds",
      value: stats.activeBuilds.toString(),
      icon: Hammer,
      description: "Currently processing",
    },
  ];

  const analyticsCards = [
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      description: "All-time earnings",
    },
    {
      title: "Total Builds",
      value: stats.totalBuilds.toLocaleString(),
      icon: BarChart3,
      description: "All-time app builds",
    },
    {
      title: "New Users Today",
      value: (stats.newUsersToday || 0).toString(),
      icon: UserPlus,
      description: "Signed up today",
    },
    {
      title: "Builds Today",
      value: (stats.buildsToday || 0).toString(),
      icon: Activity,
      description: "Started today",
    },
  ];

  const renderCards = (cards: typeof primaryCards) =>
    cards.map((stat) => (
      <Card key={stat.title} className={(stat as any).highlight ? "border-primary/50 bg-primary/5" : ""}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
          <div className={`p-2 rounded-lg ${(stat as any).highlight ? "bg-primary/20" : "bg-accent/10"}`}>
            <stat.icon className={`w-4 h-4 ${(stat as any).highlight ? "text-primary" : "text-accent"}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${(stat as any).highlight ? "text-primary" : "text-foreground"}`}>{stat.value}</div>
          <p className="text-xs text-muted-foreground">{stat.description}</p>
        </CardContent>
      </Card>
    ));

  const renderSkeletons = (count: number) =>
    Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-1" />
          <Skeleton className="h-3 w-28" />
        </CardContent>
      </Card>
    ));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Monitor your platform's performance</p>
        </div>

        {!isDemo && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-amber-500/50 text-amber-600 hover:bg-amber-500/10">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Demo Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Demo Data</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset all data for demo accounts (admin@demo.com and user@demo.com):
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Delete all projects and builds</li>
                    <li>Reset credits to default values</li>
                    <li>Clear automation configs and logs</li>
                    <li>Create sample demo projects</li>
                    <li>Reset user roles to defaults</li>
                  </ul>
                  <span className="block mt-2 font-medium">This action cannot be undone.</span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleResetDemoData}
                  disabled={resetting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {resetting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</>
                  ) : (
                    "Reset Demo Data"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? renderSkeletons(4) : renderCards(primaryCards)}
      </div>

      {/* Analytics Summary */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Quick Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? renderSkeletons(4) : renderCards(analyticsCards)}
        </div>
      </div>
    </div>
  );
};
