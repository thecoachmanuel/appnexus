"use client";

import { format } from "date-fns";
import { Coins, TrendingDown, TrendingUp, Smartphone, Gift, CreditCard, RefreshCw } from "lucide-react";
import { CreditUsageRecord } from "@/hooks/useCreditHistory";
import { cn } from "@/lib/utils";

interface CreditUsageHistoryProps {
  history: CreditUsageRecord[];
}

const actionTypeConfig: Record<string, { icon: typeof Coins; label: string; color: string }> = {
  app_build: { icon: Smartphone, label: "App Build", color: "text-accent" },
  purchase: { icon: CreditCard, label: "Purchase", color: "text-accent" },
  subscription: { icon: RefreshCw, label: "Subscription", color: "text-accent/80" },
  bonus: { icon: Gift, label: "Bonus", color: "text-accent" },
  refund: { icon: TrendingUp, label: "Refund", color: "text-accent/70" },
};

export const CreditUsageHistory = ({ history }: CreditUsageHistoryProps) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Coins className="w-10 h-10 mx-auto mb-3 text-accent/30" />
        <p>No credit activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((record) => {
        const config = actionTypeConfig[record.action_type] || {
          icon: Coins,
          label: record.action_type,
          color: "text-muted-foreground",
        };
        const Icon = config.icon;
        const isAddition = record.amount < 0;

        return (
          <div
            key={record.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className={cn("p-2 rounded-lg bg-background", config.color)}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{config.label}</p>
              {record.description && (
                <p className="text-xs text-muted-foreground truncate">{record.description}</p>
              )}
            </div>

            <div className="text-right">
              <p
                className={cn(
                  "font-semibold text-sm",
                  isAddition ? "text-accent" : "text-foreground"
                )}
              >
                {isAddition ? "+" : "-"}{Math.abs(record.amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date((record as any).createdAt || record.created_at || new Date()), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
