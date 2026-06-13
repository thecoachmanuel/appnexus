"use client";

import { useState } from "react";
import { toast } from "sonner";

interface CoinbaseCheckoutOptions {
  type: "subscription" | "credits" | "invoice";
  planId?: string;
  billingCycle?: "monthly" | "yearly";
  creditPackId?: string;
  invoiceId?: string;
}

export const useCoinbaseCheckout = () => {
  const [loading, setLoading] = useState(false);

  const initiateCoinbaseCheckout = async (options: CoinbaseCheckoutOptions) => {
    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/subscription?payment=success&method=crypto`;
      const cancelUrl = `${window.location.origin}/subscription?payment=cancelled`;

      const token = localStorage.getItem('app_auth_token') || sessionStorage.getItem('app_auth_token');
      const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
      const res = await fetch(`${API_URL}/api/billing/coinbase-checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          type: options.type,
          plan_id: options.planId,
          billing_cycle: options.billingCycle,
          credit_pack_id: options.creditPackId,
          invoice_id: options.invoiceId,
          success_url: successUrl,
          cancel_url: cancelUrl,
        })
      });

      if (!res.ok) {
        throw new Error("Failed to initiate crypto checkout");
      }

      const data = await res.json();
      if (data?.hostedUrl) {
        window.location.href = data.hostedUrl;
      } else {
        toast.error("No checkout URL received");
        setLoading(false);
      }
    } catch (error) {
      console.error("Coinbase checkout error:", error);
      toast.error("Cryptocurrency payments are not available yet.");
      setLoading(false);
    }
  };

  return { initiateCoinbaseCheckout, loading };
};
