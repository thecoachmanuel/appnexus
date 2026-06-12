"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { UsageStats } from "@/hooks/useCreditHistory";
import { CreditUsageChart } from "./CreditUsageChart";

interface CreditAnalyticsProps {
  stats: UsageStats;
}

// Monochromatic grayscale colors for charts
const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--muted-foreground))",
  "hsl(0 0% 50%)",
  "hsl(0 0% 40%)",
  "hsl(0 0% 60%)",
];

export const CreditAnalytics = ({ stats }: CreditAnalyticsProps) => {
  const pieData = Object.entries(stats.usageByType).map(([name, value]) => ({
    name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
          <div className="flex items-center gap-2 text-accent mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">Total Used</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">
            {stats.totalUsed}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
          <div className="flex items-center gap-2 text-accent/80 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Total Added</span>
          </div>
          <p className="font-display text-2xl font-bold text-accent">
            {stats.totalAdded}
          </p>
        </div>
      </div>

      {/* Usage Over Time */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-accent" />
          <h4 className="font-medium text-foreground">Last 30 Days</h4>
        </div>
        <CreditUsageChart data={stats.dailyUsage} />
      </div>

      {/* Usage by Type */}
      {pieData.length > 0 && (
        <div className="glass-card rounded-xl p-4">
          <h4 className="font-medium text-foreground mb-4">Usage Breakdown</h4>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground flex-1">{entry.name}</span>
                  <span className="font-medium text-foreground">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
