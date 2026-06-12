"use client";

import { useState, useEffect } from "react";
import { adminApi, SubscriptionPlan } from "@/lib/api";

export const useSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    try {
      const plansResult = await adminApi.getPlans();

      if (plansResult.error) {
        console.error("Error fetching plans:", plansResult.error);
      }

      const activePlans = (plansResult.data || []).filter(p => p.is_active);
      setPlans(activePlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    refreshPlans: fetchPlans,
  };
};
