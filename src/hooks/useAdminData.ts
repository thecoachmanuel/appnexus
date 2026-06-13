"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  adminApi,
  bankTransferApi,
  UserWithDetails,
  Transaction,
  BuildRecord,
  Plugin,
  SystemSetting,
  EmailTemplate,
  SubscriptionPlan,
  ApiConfig,
  Invoice,
  SettingsAuditLog,
  AdminStats,
  CreditPack,
} from "@/lib/api";

export type { SettingsAuditLog };

interface BankTransferRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  plan_id: string | null;
  credit_pack_id: string | null;
  proof_of_payment_url: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { email: string; display_name: string | null } | null;
  subscription_plans?: { name: string } | null;
  credit_packs?: { name: string; credits: number } | null;
}

export const useAdminData = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [builds, setBuilds] = useState<BuildRecord[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [apiConfigs, setApiConfigs] = useState<ApiConfig[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bankTransfers, setBankTransfers] = useState<BankTransferRequest[]>([]);
  const [settingsAuditLog, setSettingsAuditLog] = useState<SettingsAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBuilds: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeBuilds: 0,
    activeSubscriptions: 0,
    revenue: 0,
    newUsersToday: 0,
    buildsToday: 0,
  });

  const fetchUsers = useCallback(async () => {
    const { data, error } = await adminApi.getUsers();
    if (error) {
      console.error("Error fetching users:", error);
      return;
    }
    setUsers(data || []);
  }, []);

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await adminApi.getTransactions();
    if (error) {
      console.error("Error fetching transactions:", error);
      return;
    }
    setTransactions(data || []);
  }, []);

  const fetchBuilds = useCallback(async () => {
    const { data, error } = await adminApi.getBuilds();
    if (error) {
      console.error("Error fetching builds:", error);
      return;
    }
    setBuilds(data || []);
  }, []);

  const fetchPlugins = useCallback(async () => {
    const { data, error } = await adminApi.getPlugins();
    if (error) {
      console.error("Error fetching plugins:", error);
      return;
    }
    setPlugins(data || []);
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await adminApi.getSettings();
    if (error) {
      console.error("Error fetching settings:", error);
      return;
    }
    setSettings(data || []);
  }, []);

  const fetchEmailTemplates = useCallback(async () => {
    const { data, error } = await adminApi.getEmailTemplates();
    if (error) {
      console.error("Error fetching email templates:", error);
      return;
    }
    setEmailTemplates(
      (data || []).map((t: any) => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : [],
      }))
    );
  }, []);

  const fetchPlans = useCallback(async () => {
    const { data, error } = await adminApi.getPlans();
    if (error) {
      console.error("Error fetching plans:", error);
      return;
    }
    setPlans(data || []);
  }, []);

  const fetchCreditPacks = useCallback(async () => {
    const { data, error } = await adminApi.getCreditPacks();
    if (error) {
      console.error("Error fetching credit packs:", error);
      return;
    }
    setCreditPacks(data || []);
  }, []);

  const fetchApiConfigs = useCallback(async () => {
    const { data, error } = await adminApi.getApiConfigs();
    if (error) {
      console.error("Error fetching API configs:", error);
      return;
    }
    setApiConfigs(data || []);
  }, []);

  const fetchInvoices = useCallback(async () => {
    const { data, error } = await adminApi.getInvoices();
    if (error) {
      console.error("Error fetching invoices:", error);
      return;
    }
    setInvoices(data || []);
  }, []);

  const fetchSettingsAuditLog = useCallback(async () => {
    const { data, error } = await adminApi.getSettingsAuditLog();
    if (error) {
      console.error("Error fetching settings audit log:", error);
      return;
    }
    setSettingsAuditLog(data || []);
  }, []);

  const fetchBankTransfers = useCallback(async () => {
    const { data, error } = await bankTransferApi.listAll();
    if (error) {
      console.error("Error fetching bank transfers:", error);
      return;
    }
    setBankTransfers((data || []) as BankTransferRequest[]);
  }, []);

  const fetchStats = useCallback(async () => {
    const { data, error } = await adminApi.getStats();
    if (error) {
      console.error("Error fetching stats:", error);
      return;
    }
    if (data) {
      setStats(data);
    }
  }, []);

  const approveBankTransfer = async (id: string, notes: string) => {
    const { error } = await bankTransferApi.approve(id, notes);
    if (!error) await fetchBankTransfers();
    if (error) throw error;
  };

  const rejectBankTransfer = async (id: string, notes: string) => {
    const { error } = await bankTransferApi.reject(id, notes);
    if (!error) await fetchBankTransfers();
    if (error) throw error;
  };

  const updatePlugin = async (id: string, updates: { is_active?: boolean }) => {
    const { error } = await adminApi.updatePlugin(id, updates);
    if (!error) await fetchPlugins();
    return !error;
  };

  const updateSetting = async (id: string, value: any) => {
    const { error } = await adminApi.updateSetting(id, value);
    if (!error) {
      await fetchSettings();
      await fetchSettingsAuditLog();
    }
    return !error;
  };

  const upsertSetting = async (key: string, value: any, category: string) => {
    const { error } = await adminApi.upsertSetting(key, value, category);
    if (!error) {
      await fetchSettings();
      await fetchSettingsAuditLog();
    }
    return !error;
  };

  const updateEmailTemplate = async (
    id: string,
    updates: { subject?: string; html_content?: string; text_content?: string | null; is_active?: boolean }
  ) => {
    const { error } = await adminApi.updateEmailTemplate(id, updates);
    if (!error) await fetchEmailTemplates();
    return !error;
  };

  const updatePlan = async (
    id: string,
    updates: {
      name?: string;
      price_monthly?: number;
      price_yearly?: number;
      monthly_credits?: number;
      description?: string | null;
      is_active?: boolean;
    }
  ) => {
    const { error } = await adminApi.updatePlan(id, updates);
    if (!error) await fetchPlans();
    return !error;
  };

  const createPlan = async (plan: {
    name: string;
    tier: "free" | "pro" | "enterprise";
    price_monthly: number;
    price_yearly: number;
    monthly_credits: number;
    description: string | null;
    is_active: boolean;
    stripe_price_id?: string | null;
    stripe_yearly_price_id?: string | null;
  }) => {
    const { error } = await adminApi.createPlan({
      ...plan,
      features: {},
    });
    if (!error) await fetchPlans();
    return !error;
  };

  const createCreditPack = async (pack: {
    name: string;
    description: string | null;
    credits: number;
    price: number;
    is_active: boolean;
    stripe_price_id?: string | null;
  }) => {
    const { error } = await adminApi.createCreditPack(pack);
    if (!error) await fetchCreditPacks();
    return !error;
  };

  const updateCreditPack = async (id: string, updates: Partial<CreditPack>) => {
    const { error } = await adminApi.updateCreditPack(id, updates);
    if (!error) await fetchCreditPacks();
    return !error;
  };

  const deleteCreditPack = async (id: string) => {
    const { error } = await adminApi.deleteCreditPack(id);
    if (!error) await fetchCreditPacks();
    return !error;
  };

  const addApiConfig = async (
    config: Omit<ApiConfig, "id" | "created_at" | "usage_count" | "last_used_at">
  ) => {
    const { error } = await adminApi.createApiConfig(config);
    if (!error) await fetchApiConfigs();
    return !error;
  };

  const updateApiConfig = async (id: string, updates: Partial<ApiConfig>) => {
    const { error } = await adminApi.updateApiConfig(id, updates);
    if (!error) await fetchApiConfigs();
    return !error;
  };

  const deleteApiConfig = async (id: string) => {
    const { error } = await adminApi.deleteApiConfig(id);
    if (!error) await fetchApiConfigs();
    return !error;
  };

  const createInvoice = async (
    invoice: Omit<Invoice, "id" | "created_at" | "paid_at" | "user_email">
  ) => {
    const { error } = await adminApi.createInvoice(invoice);
    if (!error) await fetchInvoices();
    return !error;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    const { error } = await adminApi.updateInvoice(id, updates);
    if (!error) await fetchInvoices();
    return !error;
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchTransactions(),
        fetchBuilds(),
        fetchPlugins(),
        fetchSettings(),
        fetchEmailTemplates(),
        fetchPlans(),
        fetchCreditPacks(),
        fetchApiConfigs(),
        fetchInvoices(),
        fetchSettingsAuditLog(),
        fetchBankTransfers(),
      ]);
      setLoading(false);
    };

    loadAll();
  }, [
    fetchStats,
    fetchUsers,
    fetchTransactions,
    fetchBuilds,
    fetchPlugins,
    fetchSettings,
    fetchEmailTemplates,
    fetchPlans,
    fetchCreditPacks,
    fetchApiConfigs,
    fetchInvoices,
    fetchSettingsAuditLog,
    fetchBankTransfers,
  ]);

  // Realtime subscriptions removed for MongoDB migration
  // Polling or WebSockets should be implemented if realtime is needed


  return {
    users,
    transactions,
    builds,
    plugins,
    settings,
    emailTemplates,
    plans,
    creditPacks,
    apiConfigs,
    invoices,
    bankTransfers,
    settingsAuditLog,
    refresh: {
      users: fetchUsers,
      transactions: fetchTransactions,
      builds: fetchBuilds,
      plugins: fetchPlugins,
      settings: fetchSettings,
      emailTemplates: fetchEmailTemplates,
      plans: fetchPlans,
      creditPacks: fetchCreditPacks,
      apiConfigs: fetchApiConfigs,
      invoices: fetchInvoices,
      bankTransfers: fetchBankTransfers,
    },
    stats,
    loading,
    updatePlugin,
    updateSetting,
    upsertSetting,
    updateEmailTemplate,
    updatePlan,
    createPlan,
    createCreditPack,
    updateCreditPack,
    deleteCreditPack,
    addApiConfig,
    updateApiConfig,
    deleteApiConfig,
    createInvoice,
    updateInvoice,
    approveBankTransfer,
    rejectBankTransfer,
    refreshUsers: fetchUsers,
    refreshTransactions: fetchTransactions,
    refreshBuilds: fetchBuilds,
  };
};
