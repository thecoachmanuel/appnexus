"use client";

import { Coins, ArrowRight, Star, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CreditPackCardProps {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string | null;
  onPurchase: (packId: string) => void;
  isBestValue?: boolean;
  savingsPercent?: number;
}

export const CreditPackCard = ({
  id,
  name,
  credits,
  price,
  description,
  onPurchase,
  isBestValue = false,
  savingsPercent = 0,
}: CreditPackCardProps) => {
  const pricePerCredit = (price / credits).toFixed(2);

  return (
    <div className={cn(
      "glass-card rounded-2xl p-5 hover:border-accent/30 transition-all duration-300 relative",
      isBestValue && "ring-2 ring-primary border-primary/30"
    )}>
      {isBestValue && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground gap-1 shadow-md">
            <Star className="w-3 h-3" />
            Best Value
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-accent/10">
          <Coins className="w-6 h-6 text-accent" />
        </div>
        <span className="text-xs text-muted-foreground">
          ${pricePerCredit}/credit
        </span>
      </div>

      <h4 className="font-display text-lg font-bold text-foreground mb-1">{name}</h4>
      {description && (
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
      )}

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-display font-bold text-accent">{credits}</span>
        <span className="text-muted-foreground">credits</span>
        {savingsPercent > 0 && (
          <Badge variant="outline" className="ml-auto text-xs gap-1 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
            <TrendingDown className="w-3 h-3" />
            Save {savingsPercent}%
          </Badge>
        )}
      </div>

      <Button
        variant="accent"
        className="w-full group"
        onClick={() => onPurchase(id)}
      >
        <span>Buy for ${price}</span>
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
};