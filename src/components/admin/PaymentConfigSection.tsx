"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, Building2, FileText, Wallet, Bitcoin, TrendingUp, TrendingDown, ListOrdered } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, startOfMonth, subMonths } from "date-fns";
import { PaymentGatewayManager } from "./PaymentGatewayManager";
import { BankTransferManagement } from "./BankTransferManagement";
import { InvoiceManagement } from "./InvoiceManagement";
import { PaymentTracking } from "./PaymentTracking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentConfigSectionProps {
  loading?: boolean;
  isDemo?: boolean;
}

interface RevenueByGateway {
  stripe: number;
  paypal: number;
  bank_transfer: number;
  crypto: number;
  total: number;
  count: number;
}

const GATEWAY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  stripe: { label: "Stripe", icon: CreditCard, color: "text-blue-500" },
  paypal: { label: "PayPal", icon: Wallet, color: "text-amber-500" },
  bank_transfer: { label: "Bank Transfer", icon: Building2, color: "text-emerald-500" },
  crypto: { label: "Crypto", icon: Bitcoin, color: "text-orange-500" },
};

export const PaymentConfigSection = ({ loading = false }: PaymentConfigSectionProps) => {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const { data } = await supabase
      .from("payment_transactions")
      .select("amount, payment_method, status")
      .eq("status", "completed");
    setTransactions(data || []);
  }, []);

  const fetchAllTransactions = useCallback(async () => {
    const { data } = await supabase
      .from("payment_transactions")
      .select("*")
      .order("created_at", { ascending: false });
    setAllTransactions(data || []);
  }, []);

  const fetchTransfers = useCallback(async () => {
    const { data } = await supabase
      .from("bank_transfer_requests")
      .select("*, profiles(email, display_name), subscription_plans(name), credit_packs(name, credits)")
      .order("created_at", { ascending: false });
    setTransfers(data || []);
  }, []);

  const fetchInvoices = useCallback(async () => {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });
    setInvoices(data || []);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, email");
    setUsers((data || []).map((u) => ({ id: u.id, email: u.email || "" })));
  }, []);

  useEffect(() => {
    const load = async () => {
      setDataLoading(true);
      await Promise.all([fetchTransfers(), fetchInvoices(), fetchUsers(), fetchTransactions(), fetchAllTransactions()]);
      setDataLoading(false);
    };
    load();
  }, [fetchTransfers, fetchInvoices, fetchUsers, fetchTransactions, fetchAllTransactions]);

  const revenue = useMemo<RevenueByGateway>(() => {
    const r: RevenueByGateway = { stripe: 0, paypal: 0, bank_transfer: 0, crypto: 0, total: 0, count: 0 };
    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      const method = t.payment_method as string;
      if (method in r) (r as any)[method] += amt;
      r.total += amt;
      r.count++;
    }
    return r;
  }, [transactions]);

  const monthlyRevenueData = useMemo(() => {
    const now = new Date();
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = startOfMonth(subMonths(now, i));
      months[format(d, "yyyy-MM")] = 0;
    }
    for (const t of allTransactions) {
      if (t.status !== "completed") continue;
      const key = format(new Date(t.created_at), "yyyy-MM");
      if (key in months) months[key] += Number(t.amount) || 0;
    }
    return Object.entries(months).map(([month, amount]) => ({
      month: format(new Date(month + "-01"), "MMM yyyy"),
      revenue: Math.round(amount * 100) / 100,
    }));
  }, [allTransactions]);

  const transactionStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthlyRevenue = allTransactions
      .filter(t => t.status === "completed" && new Date(t.created_at) >= monthStart)
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const prevMonthRevenue = allTransactions
      .filter(t => {
        const d = new Date(t.created_at);
        return t.status === "completed" && d >= prevMonthStart && d < monthStart;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const momGrowth = prevMonthRevenue > 0
      ? ((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
      : monthlyRevenue > 0 ? 100 : 0;
    return { totalRevenue: revenue.total, monthlyRevenue, prevMonthRevenue, momGrowth };
  }, [allTransactions, revenue.total]);

  const handleRefreshAll = useCallback(async () => {
    await Promise.all([fetchTransactions(), fetchAllTransactions(), fetchTransfers(), fetchInvoices()]);
  }, [fetchTransactions, fetchAllTransactions, fetchTransfers, fetchInvoices]);

  const handleApprove = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("bank_transfer_requests")
      .update({ status: "approved", admin_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    toast.success("Bank transfer approved");
    await fetchTransfers();
  };

  const handleReject = async (id: string, notes: string) => {
    const { error } = await supabase
      .from("bank_transfer_requests")
      .update({ status: "rejected", admin_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    toast.success("Bank transfer rejected");
    await fetchTransfers();
  };

  const handleCreateInvoice = async (invoice: any) => {
    const { error } = await supabase.from("invoices").insert(invoice);
    if (error) {
      toast.error("Failed to create invoice");
      return false;
    }
    toast.success("Invoice created");
    await fetchInvoices();
    return true;
  };

  const handleUpdateInvoice = async (id: string, updates: any) => {
    const { error } = await supabase.from("invoices").update(updates).eq("id", id);
    if (error) {
      toast.error("Failed to update invoice");
      return false;
    }
    toast.success("Invoice updated");
    await fetchInvoices();
    return true;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Payments</h2>
        <p className="text-muted-foreground mt-1">
          Revenue analytics, transactions, gateways, and invoices
        </p>
      </div>

      {/* Revenue Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="col-span-2 sm:col-span-3 lg:col-span-1 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            {dataLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Total Revenue</p>
                  <p className="text-xl font-bold text-primary">${revenue.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <div className="flex items-center gap-1.5">
                    {transactionStats.momGrowth !== 0 ? (
                      <>
                        {transactionStats.momGrowth > 0 ? (
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-destructive" />
                        )}
                        <span className={`text-xs font-semibold ${transactionStats.momGrowth > 0 ? "text-emerald-500" : "text-destructive"}`}>
                          {transactionStats.momGrowth > 0 ? "+" : ""}{transactionStats.momGrowth.toFixed(1)}%
                        </span>
                        <span className="text-xs text-muted-foreground">vs last month</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">{revenue.count} transactions</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(Object.keys(GATEWAY_META) as Array<keyof typeof GATEWAY_META>).map((key) => {
          const meta = GATEWAY_META[key];
          const Icon = meta.icon;
          const amount = (revenue as any)[key] as number;
          const pct = revenue.total > 0 ? ((amount / revenue.total) * 100).toFixed(1) : "0.0";
          return (
            <Card key={key}>
              <CardContent className="p-4">
                {dataLoading ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground font-medium truncate">{meta.label}</p>
                      <p className="text-lg font-bold text-foreground">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground">{pct}%</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue Trend (Last 12 Months)</h3>
          {dataLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions" className="gap-2">
            <ListOrdered className="w-4 h-4" />
            <span className="hidden sm:inline">Transactions</span>
            <span className="sm:hidden">Txns</span>
          </TabsTrigger>
          <TabsTrigger value="gateways" className="gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Gateways</span>
            <span className="sm:hidden">Gateways</span>
          </TabsTrigger>
          <TabsTrigger value="bank-transfers" className="gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Bank Transfers</span>
            <span className="sm:hidden">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Invoices</span>
            <span className="sm:hidden">Invoices</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="mt-6">
          <PaymentTracking
            transactions={allTransactions}
            stats={transactionStats}
            onRefresh={handleRefreshAll}
            loading={dataLoading || loading}
          />
        </TabsContent>

        <TabsContent value="gateways" className="mt-6">
          <PaymentGatewayManager />
        </TabsContent>

        <TabsContent value="bank-transfers" className="mt-6">
          <BankTransferManagement
            transfers={transfers}
            onRefresh={fetchTransfers}
            onApprove={handleApprove}
            onReject={handleReject}
            loading={dataLoading || loading}
          />
        </TabsContent>

        <TabsContent value="invoices" className="mt-6">
          <InvoiceManagement
            invoices={invoices}
            users={users}
            onCreate={handleCreateInvoice}
            onUpdate={handleUpdateInvoice}
            onRefresh={fetchInvoices}
            loading={dataLoading || loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
