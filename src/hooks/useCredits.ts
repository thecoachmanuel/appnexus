"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, UserCredits, UserSubscription, SubscriptionPlan } from "@/lib/api";

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch user credits
      const { data: creditsData, error: creditsError } = await userApi.getCredits();

      if (creditsError) {
        console.error("Error fetching credits:", creditsError);
      }
      
      if (creditsData) {
        setCredits({
          ...creditsData,
          credits: creditsData.credits ?? 0,
          monthly_credits: creditsData.monthly_credits ?? (creditsData.credits ?? 0),
          bonus_credits: creditsData.bonus_credits ?? 0
        });
      } else {
        setCredits(null);
      }

      // Fetch user subscription with plan details
      const { data: subData, error: subError } = await userApi.getSubscription();

      if (subError) {
        console.error("Error fetching subscription:", subError);
      }

      if (subData) {
        setSubscription(subData);
        setPlan(subData.plan || null);
      }
    } catch (error) {
      console.error("Error in fetchCredits:", error);
    } finally {
      setLoading(false);
    }
  };

  const useCreditsAmount = async (amount: number): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await userApi.useCredits(amount);

    if (error) {
      console.error("Error using credits:", error);
      return false;
    }

    // Refresh credits after use
    await fetchCredits();
    return data?.success ?? false;
  };

  const getTotalCredits = (): number => {
    if (!credits) return 0;
    const monthly = typeof credits.monthly_credits === "number" ? credits.monthly_credits : (typeof credits.credits === "number" ? credits.credits : 0);
    const bonus = typeof credits.bonus_credits === "number" ? credits.bonus_credits : 0;
    return monthly + bonus;
  };

  useEffect(() => {
    fetchCredits();
  }, [user]);

  return {
    credits,
    subscription,
    plan,
    loading,
    useCredits: useCreditsAmount,
    getTotalCredits,
    refreshCredits: fetchCredits,
  };
};
