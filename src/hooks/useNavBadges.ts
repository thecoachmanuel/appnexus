"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { projectsApi, automationApi } from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";

interface NavBadges {
  automations: number;
  dashboard: number;
}

export const useNavBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<NavBadges>({
    automations: 0,
    dashboard: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch automations
      const { data: automationsData } = await automationApi.list();
      const automations = automationsData?.automations || [];
      
      // Count enabled automations that haven't run (potential attention needed)
      const pendingAutomations = automations.filter(
        (a: any) => a.is_enabled && !a.last_run_at
      ).length;

      // Fetch projects
      const { data: projectsData } = await projectsApi.list();
      const projects = projectsData || [];
      
      // Count building projects
      const buildingProjects = projects.filter(
        (p: any) => p.build_status === "building"
      ).length;

      setBadges({
        automations: pendingAutomations,
        dashboard: buildingProjects,
      });
    } catch (error) {
      console.error("Error fetching nav badges:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Real-time updates for automations
  useRealtime({
    table: 'automation_configs',
    onUpdate: () => {
      fetchBadges();
    },
    enabled: !!user?.id,
  });

  // Real-time updates for projects
  useRealtime({
    table: 'app_projects',
    onUpdate: () => {
      fetchBadges();
    },
    enabled: !!user?.id,
  });

  return { badges, loading };
};
