"use client";

import { useState, useEffect } from "react";
import { creditPacksApi, CreditPack } from "@/lib/api";

export const useCreditPacks = () => {
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCreditPacks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: apiError } = await creditPacksApi.list();

      if (apiError) {
        throw apiError;
      }

      // Filter only active packs
      const activePacks = (data || []).filter((pack: any) => pack.is_active);
      setCreditPacks(activePacks);
    } catch (err) {
      console.error("Error fetching credit packs:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch credit packs"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditPacks();
  }, []);

  return {
    creditPacks,
    loading,
    error,
    refetch: fetchCreditPacks,
  };
};
