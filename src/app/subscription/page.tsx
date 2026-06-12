"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import PageHeader from "@/components/PageHeader";
import { CreditDisplay } from "@/components/subscription/CreditDisplay";
import { PlanCard } from "@/components/subscription/PlanCard";
import { CreditPackCard } from "@/components/subscription/CreditPackCard";
import { PaymentMethodSelector } from "@/components/subscription/PaymentMethodSelector";
import { BankTransferModal } from "@/components/subscription/BankTransferModal";
import { useCredits } from "@/hooks/useCredits";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useCreditPacks } from "@/hooks/useCreditPacks";
import { usePayPalCheckout } from "@/hooks/usePayPalCheckout";
import { useCoinbaseCheckout } from "@/hooks/useCoinbaseCheckout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { stripeApi } from "@/lib/api";
import { DemoModeBanner } from "@/components/DemoModeBanner";

type PaymentMethod = "stripe" | "paypal" | "crypto" | "bank_transfer";

const Subscription = () => {
  const { toast } = useToast();
  const { subscription, plan: currentPlan, loading: creditsLoading, refreshCredits } = useCredits();
  const { plans, loading: plansLoading } = useSubscriptionPlans();
  const { creditPacks, loading: packsLoading } = useCreditPacks();
  const { initiatePayPalCheckout, loading: paypalLoading } = usePayPalCheckout();
  const { initiateCoinbaseCheckout, loading: coinbaseLoading } = useCoinbaseCheckout();

  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showBankTransfer, setShowBankTransfer] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{
    type: "subscription" | "credits";
    id: string;
    name: string;
    amount: number;
  } | null>(null);

  const loading = creditsLoading || plansLoading;

  const handlePlanSelect = (planId: string, cycle: "monthly" | "yearly") => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const amount = cycle === "monthly" ? plan.price_monthly : plan.price_yearly;
    
    if (amount === 0) {
      toast({
        title: "Free Plan",
        description: "You're already on the free plan or can downgrade from Settings.",
      });
      return;
    }

    setSelectedItem({
      type: "subscription",
      id: planId,
      name: plan.name,
      amount,
    });
    setBillingCycle(cycle);
    setShowPaymentMethods(true);
  };

  const handleCreditPackSelect = (packId: string) => {
    const pack = creditPacks.find((p) => p.id === packId);
    if (!pack) return;

    setSelectedItem({
      type: "credits",
      id: packId,
      name: pack.name,
      amount: pack.price,
    });
    setShowPaymentMethods(true);
  };

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    if (!selectedItem) return;

    if (method === "bank_transfer") {
      setShowPaymentMethods(false);
      setShowBankTransfer(true);
      return;
    }

    if (method === "paypal") {
      setShowPaymentMethods(false);
      await initiatePayPalCheckout({
        type: selectedItem.type === "credits" ? "credits" : "subscription",
        planId: selectedItem.type === "subscription" ? selectedItem.id : undefined,
        creditPackId: selectedItem.type === "credits" ? selectedItem.id : undefined,
        billingCycle: selectedItem.type === "subscription" ? billingCycle : undefined,
      });
      return;
    }

    if (method === "stripe") {
      setPaymentLoading(true);
      try {
        let checkoutResult;
        if (selectedItem.type === "credits") {
          checkoutResult = await stripeApi.createCreditsCheckout(
            selectedItem.id,
            `${window.location.origin}/subscription?success=true`,
            `${window.location.origin}/subscription?canceled=true`
          );
        } else {
          checkoutResult = await stripeApi.createSubscriptionCheckout(
            selectedItem.id,
            billingCycle,
            `${window.location.origin}/subscription?success=true`,
            `${window.location.origin}/subscription?canceled=true`
          );
        }
        if (checkoutResult.error) throw checkoutResult.error;
        if (checkoutResult.data?.url) window.location.href = checkoutResult.data.url;
      } catch (error) {
        console.error("Stripe checkout error:", error);
        toast({
          title: "Payment Error",
          description: error instanceof Error ? error.message : "Failed to initiate checkout",
          variant: "destructive",
        });
      } finally {
        setPaymentLoading(false);
        setShowPaymentMethods(false);
      }
      return;
    }

    if (method === "crypto") {
      setShowPaymentMethods(false);
      await initiateCoinbaseCheckout({
        type: selectedItem.type === "credits" ? "credits" : "subscription",
        planId: selectedItem.type === "subscription" ? selectedItem.id : undefined,
        creditPackId: selectedItem.type === "credits" ? selectedItem.id : undefined,
        billingCycle: selectedItem.type === "subscription" ? billingCycle : undefined,
      });
      return;
    }

    setShowPaymentMethods(false);
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await stripeApi.createPortalSession(
        `${window.location.origin}/subscription`
      );
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error) {
      console.error("Portal session error:", error);
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive",
      });
    }
  };

  // Handle success/canceled query params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get("success") === "true";
    const isCanceled = urlParams.get("canceled") === "true";
    const paymentStatus = urlParams.get("payment");

    if (isSuccess || isCanceled || paymentStatus) {
      window.history.replaceState({}, "", window.location.pathname);
      
      if (isSuccess || paymentStatus === "success") {
        toast({
          title: "Payment Successful!",
          description: "Your subscription has been activated.",
        });
        refreshCredits?.();
      } else if (isCanceled || paymentStatus === "cancelled") {
        toast({
          title: "Payment Canceled",
          description: "Your payment was canceled. No charges were made.",
        });
      }
    }
  }, [toast, refreshCredits]);

  const PlanCardSkeleton = () => (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-4 w-full" />
      <div className="space-y-2 pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg mt-4" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 sm:pt-28 pb-24 md:pb-16">
        <div className="container mx-auto px-6">
          <DemoModeBanner />
          
          <PageHeader
            title="Pricing"
            description="Choose the plan that fits your needs"
            backLink="/dashboard"
          />

          {/* Current Credits */}
          <div className="mb-8">
            <CreditDisplay variant="full" />
          </div>

          {/* Plans Section */}
          <section>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                {subscription && currentPlan && currentPlan.tier !== "free" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManageSubscription}
                    className="gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Subscription
                  </Button>
                )}
                <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}>
                  <TabsList className="bg-secondary/50">
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">
                      Yearly
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
                        Save 20%
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <PlanCardSkeleton key={i} />)
              ) : (
                plans.map((plan) => {
                  const featuresRecord: Record<string, boolean> = {};
                  const featuresData = plan.features;
                  if (Array.isArray(featuresData)) {
                    featuresData.forEach((feature: string) => {
                      featuresRecord[feature] = true;
                    });
                  } else if (typeof featuresData === 'object' && featuresData !== null) {
                    Object.assign(featuresRecord, featuresData);
                  }

                  return (
                    <PlanCard
                      key={plan.id}
                      id={plan.id}
                      name={plan.name}
                      tier={plan.tier}
                      priceMonthly={plan.price_monthly}
                      priceYearly={plan.price_yearly}
                      monthlyCredits={plan.monthly_credits}
                      features={featuresRecord}
                      description={plan.description}
                      isCurrentPlan={currentPlan?.id === plan.id}
                      billingCycle={billingCycle}
                      onSelect={handlePlanSelect}
                    />
                  );
                })
              )}
            </div>
          </section>

          {/* Credit Packs Section */}
          <section className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-accent/10">
                <Coins className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">Credit Packs</h2>
                <p className="text-sm text-muted-foreground">Need more credits? Purchase packs that never expire.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {packsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass-card rounded-2xl p-5 space-y-4">
                    <Skeleton className="h-12 w-12 rounded-xl" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))
              ) : creditPacks.length === 0 ? (
                <p className="text-muted-foreground col-span-full text-center py-8">No credit packs available.</p>
              ) : (
                (() => {
                  const maxCreditsPerDollar = Math.max(...creditPacks.map(p => p.credits / p.price));
                  const baseRate = Math.min(...creditPacks.map(p => p.credits / p.price));

                  return creditPacks.map((pack) => {
                    const rate = pack.credits / pack.price;
                    const isBestValue = rate === maxCreditsPerDollar && creditPacks.length > 1;
                    const savingsPercent = baseRate > 0 ? Math.round((1 - baseRate / rate) * 100) : 0;

                    return (
                      <CreditPackCard
                        key={pack.id}
                        id={pack.id}
                        name={pack.name}
                        credits={pack.credits}
                        price={pack.price}
                        description={pack.description}
                        onPurchase={handleCreditPackSelect}
                        isBestValue={isBestValue}
                        savingsPercent={savingsPercent > 0 ? savingsPercent : undefined}
                      />
                    );
                  });
                })()
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* Payment Method Selector */}
      {selectedItem && (
        <PaymentMethodSelector
          open={showPaymentMethods}
          onOpenChange={setShowPaymentMethods}
          onSelect={handlePaymentMethodSelect}
          type={selectedItem.type}
          itemName={selectedItem.name}
          amount={selectedItem.amount}
          loading={paymentLoading}
        />
      )}

      {/* Bank Transfer Modal */}
      {selectedItem && (
        <BankTransferModal
          open={showBankTransfer}
          onOpenChange={setShowBankTransfer}
          type={selectedItem.type}
          itemId={selectedItem.id}
          itemName={selectedItem.name}
          amount={selectedItem.amount}
        />
      )}

      <MobileBottomNav />
    </div>
  );
};

export default Subscription;
