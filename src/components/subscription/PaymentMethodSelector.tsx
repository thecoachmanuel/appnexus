"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCard, Bitcoin, Building2, ArrowRight, Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type PaymentMethod = "stripe" | "paypal" | "crypto" | "bank_transfer";

interface PaymentMethodSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (method: PaymentMethod) => void;
  type: "subscription" | "credits";
  itemName: string;
  amount: number;
  loading?: boolean;
}

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
  badge: string | null;
}

export const PaymentMethodSelector = ({
  open,
  onOpenChange,
  onSelect,
  type,
  itemName,
  amount,
  loading = false,
}: PaymentMethodSelectorProps) => {
  const [selected, setSelected] = useState<PaymentMethod | null>("stripe");
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [cryptoEnabled, setCryptoEnabled] = useState(false);

  useEffect(() => {
    checkPaymentGatewayStatus();
  }, []);

  const checkPaymentGatewayStatus = async () => {
    try {
      const { data } = await supabase
        .from("payment_gateway_configs")
        .select("gateway, is_enabled")
        .in("gateway", ["paypal", "coinbase"]);

      if (data) {
        const paypal = data.find(g => g.gateway === "paypal");
        const coinbase = data.find(g => g.gateway === "coinbase");
        
        if (paypal?.is_enabled) {
          setPaypalEnabled(true);
        }
        if (coinbase?.is_enabled) {
          setCryptoEnabled(true);
        }
      }
    } catch {
      // Gateways not configured
    }
  };

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: "stripe",
      name: "Card Payment",
      description: "Pay securely with credit/debit card",
      icon: CreditCard,
      available: true,
      badge: "Recommended",
    },
    {
      id: "paypal",
      name: "PayPal",
      description: "Fast & secure payments",
      icon: Wallet,
      available: paypalEnabled,
      badge: paypalEnabled ? null : "Coming Soon",
    },
    {
      id: "crypto",
      name: "Cryptocurrency",
      description: "Pay with Bitcoin, ETH, & more",
      icon: Bitcoin,
      available: cryptoEnabled,
      badge: cryptoEnabled ? null : "Coming Soon",
    },
    {
      id: "bank_transfer",
      name: "Bank Transfer",
      description: "Wire transfer (manual verification)",
      icon: Building2,
      available: true,
      badge: null,
    },
  ];

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
          <DialogDescription>
            {type === "subscription" ? "Subscribe to" : "Purchase"} {itemName} for ${amount}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                disabled={!method.available || loading}
                onClick={() => setSelected(method.id)}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all duration-200 text-left",
                  "flex items-center gap-4",
                  selected === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50",
                  (!method.available || loading) && "opacity-50 cursor-not-allowed"
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    selected === method.id ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{method.name}</span>
                    {method.badge && (
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs",
                        method.badge === "Recommended" 
                          ? "bg-accent/20 text-accent" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {method.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          variant="hero"
          className="w-full"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
