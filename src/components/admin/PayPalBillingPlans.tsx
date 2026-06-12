"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Link2,
  Unlink,
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  price_monthly: number;
  price_yearly: number;
  monthly_credits: number;
  is_active: boolean;
  paypal_product_id?: string | null;
  paypal_plan_id?: string | null;
  paypal_yearly_plan_id?: string | null;
}

export const PayPalBillingPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setPlans((data || []) as unknown as SubscriptionPlan[]);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const syncPlan = async (planId: string) => {
    setSyncing(planId);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-billing", {
        body: { action: "sync_plan", plan_id: planId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("PayPal billing plan created successfully");
        await loadPlans();
      } else {
        throw new Error(data?.error || "Failed to sync plan");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to sync plan with PayPal");
    } finally {
      setSyncing(null);
    }
  };

  const unlinkPlan = async (planId: string) => {
    setUnlinking(planId);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-billing", {
        body: { action: "deactivate_plan", plan_id: planId },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("PayPal billing plan deactivated");
        await loadPlans();
      } else {
        throw new Error(data?.error || "Failed to unlink plan");
      }
    } catch (error) {
      console.error("Unlink error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unlink plan");
    } finally {
      setUnlinking(null);
    }
  };

  const getPlanStatus = (plan: SubscriptionPlan) => {
    const hasMonthly = !!plan.paypal_plan_id;
    const hasYearly = !!plan.paypal_yearly_plan_id;
    const hasProduct = !!plan.paypal_product_id;

    if (hasProduct && hasMonthly && hasYearly) {
      return { status: "synced", label: "Fully Synced", color: "bg-primary/20 text-primary" };
    }
    if (hasProduct || hasMonthly || hasYearly) {
      return { status: "partial", label: "Partially Synced", color: "bg-amber-500/20 text-amber-600" };
    }
    return { status: "unsynced", label: "Not Synced", color: "bg-muted text-muted-foreground" };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#0070BA]/10">
                <CreditCard className="w-5 h-5 text-[#0070BA]" />
              </div>
              <div>
                <CardTitle>PayPal Billing Plans</CardTitle>
                <CardDescription>
                  Sync your subscription plans with PayPal for recurring billing
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadPlans}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-primary/20 bg-primary/5">
            <AlertTriangle className="w-4 h-4 text-primary" />
            <AlertDescription>
              Syncing creates PayPal Products and Billing Plans that enable automatic recurring charges.
              Make sure PayPal is properly configured before syncing.
            </AlertDescription>
          </Alert>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Yearly</TableHead>
                <TableHead>PayPal Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const statusInfo = getPlanStatus(plan);
                return (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{plan.name}</span>
                        <Badge variant="outline" className="capitalize">
                          {plan.tier}
                        </Badge>
                        {!plan.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>${plan.price_monthly}/mo</span>
                        {plan.paypal_plan_id ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>${plan.price_yearly}/yr</span>
                        {plan.paypal_yearly_plan_id ? (
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {statusInfo.status === "unsynced" || statusInfo.status === "partial" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => syncPlan(plan.id)}
                            disabled={syncing === plan.id || !plan.is_active}
                          >
                            {syncing === plan.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Link2 className="w-4 h-4 mr-2" />
                            )}
                            Sync
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => unlinkPlan(plan.id)}
                            disabled={unlinking === plan.id}
                          >
                            {unlinking === plan.id ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Unlink className="w-4 h-4 mr-2" />
                            )}
                            Unlink
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {plans.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No subscription plans found. Create plans first in the Pricing Plans section.
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PayPal Plan IDs Reference</CardTitle>
          <CardDescription>
            These IDs are automatically managed when you sync plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {plans.filter(p => p.paypal_product_id || p.paypal_plan_id).map((plan) => (
              <div key={plan.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium">{plan.name}</p>
                <div className="grid gap-1 text-sm text-muted-foreground font-mono">
                  {plan.paypal_product_id && (
                    <p>Product: {plan.paypal_product_id}</p>
                  )}
                  {plan.paypal_plan_id && (
                    <p>Monthly: {plan.paypal_plan_id}</p>
                  )}
                  {plan.paypal_yearly_plan_id && (
                    <p>Yearly: {plan.paypal_yearly_plan_id}</p>
                  )}
                </div>
              </div>
            ))}
            {plans.filter(p => p.paypal_product_id || p.paypal_plan_id).length === 0 && (
              <p className="text-muted-foreground text-sm">
                No plans synced yet. Sync a plan to see its PayPal IDs.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
