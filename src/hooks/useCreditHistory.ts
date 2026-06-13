"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, CreditUsageRecord } from "@/lib/api";

export type { CreditUsageRecord };

export interface UsageStats {
  totalUsed: number;
  totalAdded: number;
  usageByType: Record<string, number>;
  dailyUsage: { date: string; used: number; added: number }[];
}

export const useCreditHistory = (limit = 50) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<CreditUsageRecord[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await userApi.getCreditHistory(limit);

      if (error) throw error;

      const records = data || [];
      setHistory(records);

      // Calculate stats
      const totalUsed = records
        .filter((r: any) => r.amount > 0)
        .reduce((sum: number, r: any) => sum + r.amount, 0);

      const totalAdded = records
        .filter((r: any) => r.amount < 0)
        .reduce((sum: number, r: any) => sum + Math.abs(r.amount), 0);

      const usageByType: Record<string, number> = {};
      records
        .filter((r: any) => r.amount > 0)
        .forEach((r: any) => {
          usageByType[r.action_type] = (usageByType[r.action_type] || 0) + r.amount;
        });

      // Daily usage for the last 30 days
      const last30Days = new Map<string, { used: number; added: number }>();
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split("T")[0];
        last30Days.set(key, { used: 0, added: 0 });
      }

      records.forEach((r: any) => {
        const date = r.created_at.split("T")[0];
        if (last30Days.has(date)) {
          const current = last30Days.get(date)!;
          if (r.amount > 0) {
            current.used += r.amount;
          } else {
            current.added += Math.abs(r.amount);
          }
        }
      });

      const dailyUsage = Array.from(last30Days.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      setStats({ totalUsed, totalAdded, usageByType, dailyUsage });
    } catch (error) {
      console.error("Error fetching credit history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  return {
    history,
    stats,
    loading,
    refreshHistory: fetchHistory,
  };
};
