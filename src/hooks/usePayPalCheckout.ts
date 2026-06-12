"use client";

import { useState } from "react";
import { toast } from "sonner";

interface PayPalCheckoutOptions {
  type: "subscription" | "credits" | "invoice";
  planId?: string;
  billingCycle?: "monthly" | "yearly";
  creditPackId?: string;
  invoiceId?: string;
}

export const usePayPalCheckout = () => {
  const [loading, setLoading] = useState(false);

  const initiatePayPalCheckout = async (options: PayPalCheckoutOptions) => {
    setLoading(true);
    try {
      const successUrl = `${window.location.origin}/subscription?payment=success`;
      const cancelUrl = `${window.location.origin}/subscription?payment=cancelled`;

      const token = localStorage.getItem('app_auth_token') || sessionStorage.getItem('app_auth_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/billing/paypal-checkout`, {
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
        throw new Error("Failed to initiate PayPal checkout");
      }

      const data = await res.json();
      if (data?.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        toast.error("No approval URL received");
        setLoading(false);
      }
    } catch (error) {
      console.error("PayPal checkout error:", error);
      toast.error("PayPal payments are not available yet.");
      setLoading(false);
    }
  };

  return { initiatePayPalCheckout, loading };
};
