"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCreditPacks } from "@/hooks/useCreditPacks";
import { stripeApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { usePayPalCheckout } from "@/hooks/usePayPalCheckout";
import { useCoinbaseCheckout } from "@/hooks/useCoinbaseCheckout";
import { Coins, Loader2, CreditCard, Sparkles, ArrowRight, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { BankTransferModal } from "./BankTransferModal";

type PaymentMethod = "stripe" | "paypal" | "crypto" | "bank_transfer";

interface CreditPackPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreditPackPurchaseModal = ({ open, onOpenChange }: CreditPackPurchaseModalProps) => {
  const { creditPacks, loading } = useCreditPacks();
  const { toast } = useToast();
  const { initiatePayPalCheckout, loading: paypalLoading } = usePayPalCheckout();
  const { initiateCoinbaseCheckout, loading: coinbaseLoading } = useCoinbaseCheckout();
  const [purchasing, setPurchasing] = useState(false);

  // Payment method selection state
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showBankTransfer, setShowBankTransfer] = useState(false);
  const [selectedPack, setSelectedPack] = useState<{
    id: string;
    name: string;
    price: number;
  } | null>(null);

  const handleBuyClick = (pack: { id: string; name: string; price: number }) => {
    setSelectedPack(pack);
    setShowPaymentMethods(true);
  };

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    if (!selectedPack) return;

    if (method === "bank_transfer") {
      setShowPaymentMethods(false);
      setShowBankTransfer(true);
      return;
    }

    if (method === "paypal") {
      setShowPaymentMethods(false);
      await initiatePayPalCheckout({
        type: "credits",
        creditPackId: selectedPack.id,
      });
      return;
    }

    if (method === "crypto") {
      setShowPaymentMethods(false);
      await initiateCoinbaseCheckout({
        type: "credits",
        creditPackId: selectedPack.id,
      });
      return;
    }

    // Default: Stripe
    setPurchasing(true);
    setShowPaymentMethods(false);

    try {
      const { data, error } = await stripeApi.createCreditsCheckout(
        selectedPack.id,
        `${window.location.origin}/subscription?success=true`,
        `${window.location.origin}/subscription?canceled=true`
      );

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: "Failed to create checkout session",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
      setSelectedPack(null);
    }
  };

  const getPackHighlight = (credits: number) => {
    if (credits >= 100) return { label: "Best Value", color: "text-accent" };
    if (credits >= 50) return { label: "Popular", color: "text-primary" };
    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Coins className="w-5 h-5 text-accent" />
              Buy Credit Packs
            </DialogTitle>
            <DialogDescription>
              Purchase additional credits to build more apps. Credits never expire.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-16 h-4" />
                    </div>
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            ) : creditPacks.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No credit packs available at the moment.</p>
                <Button variant="outline" className="mt-4" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {creditPacks.map((pack) => {
                  const highlight = getPackHighlight(pack.credits);
                  const pricePerCredit = (pack.price / pack.credits).toFixed(2);

                  return (
                    <div
                      key={pack.id}
                      className="relative rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-accent/50"
                    >
                      {highlight && (
                        <div className="absolute -top-2.5 left-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-background border border-border",
                            highlight.color
                          )}>
                            <Sparkles className="w-3 h-3" />
                            {highlight.label}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-lg bg-accent/10">
                          <Coins className="w-5 h-5 text-accent" />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ${pricePerCredit}/credit
                        </span>
                      </div>

                      <h4 className="font-display text-lg font-bold text-foreground mb-1">
                        {pack.name}
                      </h4>
                      {pack.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {pack.description}
                        </p>
                      )}

                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-display font-bold text-accent">
                          {pack.credits}
                        </span>
                        <span className="text-muted-foreground text-sm">credits</span>
                      </div>

                      <Button
                        variant="accent"
                        className="w-full group"
                        onClick={() => handleBuyClick({ id: pack.id, name: pack.name, price: pack.price })}
                        disabled={purchasing}
                      >
                        {purchasing && selectedPack?.id === pack.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Buy for ${pack.price}
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Secure payment processing. Credits are added instantly after purchase.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Selector */}
      {selectedPack && (
        <PaymentMethodSelector
          open={showPaymentMethods}
          onOpenChange={(open) => {
            setShowPaymentMethods(open);
            if (!open) setSelectedPack(null);
          }}
          onSelect={handlePaymentMethodSelect}
          type="credits"
          itemName={selectedPack.name}
          amount={selectedPack.price}
          loading={purchasing || paypalLoading || coinbaseLoading}
        />
      )}

      {/* Bank Transfer Modal */}
      {selectedPack && (
        <BankTransferModal
          open={showBankTransfer}
          onOpenChange={(open) => {
            setShowBankTransfer(open);
            if (!open) setSelectedPack(null);
          }}
          type="credits"
          itemId={selectedPack.id}
          itemName={selectedPack.name}
          amount={selectedPack.price}
        />
      )}
    </>
  );
};

export default CreditPackPurchaseModal;
