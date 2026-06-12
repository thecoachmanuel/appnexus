"use client";

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAdminData } from "@/hooks/useAdminData";
import { useDemoGuard } from "@/hooks/useDemoGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import type { AdminSection } from "@/components/admin/AdminSidebar";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { UserManagement } from "@/components/admin/UserManagement";
import { PricingManager } from "@/components/admin/PricingManager";
import { BuildMonitoring } from "@/components/admin/BuildMonitoring";
import { IntegrationsManager } from "@/components/admin/IntegrationsManager";
import { PaymentConfigSection } from "@/components/admin/PaymentConfigSection";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { DemoModeBanner } from "@/components/DemoModeBanner";

const Admin = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const adminData = useAdminData();
  const { isDemo, guardAction } = useDemoGuard();

  if (authLoading) {
    return <LoadingSpinner fullScreen />;
  }

  const isDataLoading = adminData.loading;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <AdminOverview stats={adminData.stats} loading={isDataLoading} isDemo={isDemo} />;
      case "users":
        return <UserManagement users={adminData.users} onRefresh={adminData.refresh.users} loading={isDataLoading} isDemo={isDemo} />;
      case "payments":
        return <PaymentConfigSection loading={isDataLoading} isDemo={isDemo} />;
      case "pricing":
        return (
          <PricingManager
            plans={adminData.plans as any}
            creditPacks={[] as any}
            onUpdatePlan={guardAction(adminData.updatePlan as any)}
            onCreatePlan={guardAction(adminData.createPlan as any)}
            onUpdateCreditPack={guardAction(() => {})}
            onCreateCreditPack={guardAction(() => {})}
            onDeleteCreditPack={guardAction(() => {})}
            onRefreshPlans={adminData.refresh.plans}
            onRefreshCreditPacks={() => {}}
            loading={isDataLoading}
            isDemo={isDemo}
          />
        );
      case "builds":
        return (
          <BuildMonitoring
            builds={adminData.builds}
            activeBuilds={adminData.stats.activeBuilds}
            onRefresh={adminData.refresh.builds}
            loading={isDataLoading}
          />
        );
      case "integrations":
        return <IntegrationsManager loading={isDataLoading} isDemo={isDemo} />;
      case "settings":
        return (
          <SystemSettings
            settings={adminData.settings}
            auditLog={adminData.settingsAuditLog}
            onUpdate={guardAction(adminData.updateSetting)}
            onUpsert={guardAction(adminData.upsertSetting)}
            onRefresh={adminData.refresh.settings}
            loading={isDataLoading}
            isDemo={isDemo}
          />
        );
      default:
        return <AdminOverview stats={adminData.stats} isDemo={isDemo} />;
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col lg:flex-row overflow-hidden">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 p-4 pt-20 lg:pt-6 lg:p-6 xl:p-8 overflow-y-auto">
        <DemoModeBanner />
        {renderSection()}
      </main>
    </div>
  );
};

export default Admin;
