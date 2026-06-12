"use client";

import { useState } from "react";
import { useCreditHistory } from "@/hooks/useCreditHistory";
import { CreditUsageChart } from "./CreditUsageChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Period = "7d" | "14d" | "30d";

export const CreditUsageWidget = () => {
  const { stats, loading } = useCreditHistory();
  const [period, setPeriod] = useState<Period>("7d");

  const getFilteredData = () => {
    if (!stats?.dailyUsage) return [];
    
    const days = period === "7d" ? 7 : period === "14d" ? 14 : 30;
    return stats.dailyUsage.slice(-days);
  };

  const filteredData = getFilteredData();
  
  // Calculate period stats
  const periodUsed = filteredData.reduce((sum, d) => sum + d.used, 0);
  const periodAdded = filteredData.reduce((sum, d) => sum + d.added, 0);
  
  // Calculate trend (compare first half to second half of period)
  const calculateTrend = () => {
    if (filteredData.length < 2) return 0;
    const midpoint = Math.floor(filteredData.length / 2);
    const firstHalf = filteredData.slice(0, midpoint).reduce((sum, d) => sum + d.used, 0);
    const secondHalf = filteredData.slice(midpoint).reduce((sum, d) => sum + d.used, 0);
    if (firstHalf === 0) return secondHalf > 0 ? 100 : 0;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  };

  const trend = calculateTrend();

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
          Credit Usage
        </h3>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {(["7d", "14d", "30d"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "ghost"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => setPeriod(p)}
            >
              {p === "7d" ? "7 Days" : p === "14d" ? "14 Days" : "30 Days"}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart */}
      {filteredData.length > 0 ? (
        <CreditUsageChart data={filteredData} />
      ) : (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
          No usage data available
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-2 border-t border-border/50">
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Used</p>
          <p className="text-lg sm:text-xl font-bold text-primary">{periodUsed}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Added</p>
          <p className="text-lg sm:text-xl font-bold text-accent">{periodAdded}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-1">Trend</p>
          <div className="flex items-center justify-center gap-1">
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4 text-destructive" />
            ) : trend < 0 ? (
              <TrendingDown className="w-4 h-4 text-accent" />
            ) : (
              <Minus className="w-4 h-4 text-muted-foreground" />
            )}
            <span className={`text-lg sm:text-xl font-bold ${
              trend > 0 ? "text-destructive" : trend < 0 ? "text-accent" : "text-muted-foreground"
            }`}>
              {trend > 0 ? "+" : ""}{trend}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
