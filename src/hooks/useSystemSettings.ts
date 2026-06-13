"use client";

import { useEffect, useState, useCallback } from "react";

interface SystemSettingRow {
  key: string;
  value: unknown;
  category: string;
}

interface SystemSettings {
  // General
  app_name: string;
  app_tagline: string;
  maintenance_mode: boolean;
  demo_mode: boolean;
  default_signup_credits: number;
  // Appearance
  default_theme: "light" | "dark" | "system";
  primary_color: string;
  accent_color: string;
  logo_url: string;
  logo_url_dark: string;
  favicon_url: string;
  custom_css: string;
  // Notifications
  enable_notifications: boolean;
  enable_email_notifications: boolean;
  // Contact
  support_email: string;
  // Limits
  max_builds_per_day: number;
  default_build_timeout: number;
  // Builds
  credits_per_build: number;
  // AdMob
  admob_banner_id: string;
  admob_interstitial_id: string;
  admob_rewarded_id: string;
  admob_enabled: boolean;
}

const DEFAULTS: SystemSettings = {
  app_name: "My App",
  app_tagline: "Convert websites to native apps",
  maintenance_mode: false,
  demo_mode: false,
  default_signup_credits: 5,
  default_theme: "system",
  primary_color: "#8B5CF6",
  accent_color: "#0EA5E9",
  logo_url: "",
  logo_url_dark: "",
  favicon_url: "",
  custom_css: "",
  enable_notifications: true,
  enable_email_notifications: true,
  support_email: "",
  max_builds_per_day: 100,
  default_build_timeout: 300,
  credits_per_build: 1,
  admob_banner_id: "",
  admob_interstitial_id: "",
  admob_rewarded_id: "",
  admob_enabled: false,
};

// Global cache so multiple components share the same data
let globalSettings: SystemSettings = { ...DEFAULTS };
let globalLoaded = false;
let globalListeners: Array<() => void> = [];

function notifyListeners() {
  globalListeners.forEach((fn) => fn());
}

function parseValue(raw: unknown): unknown {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

async function fetchSettings() {
  const API_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL || '');
  
  try {
    const res = await fetch(`${API_URL}/api/settings`);
    if (!res.ok) return;
    
    const data = await res.json();

  const merged = { ...DEFAULTS };
  for (const row of data as SystemSettingRow[]) {
    const parsed = parseValue(row.value);
    if (row.key in merged) {
      (merged as Record<string, unknown>)[row.key] = parsed;
    }
  }

  globalSettings = merged;
  globalLoaded = true;
  notifyListeners();
  } catch (error) {
    console.error("Failed to fetch settings", error);
  }
}

let fetchStarted = false;

/**
 * Hook to access system settings across the app.
 * Settings are fetched once and cached globally.
 */
export function useSystemSettings() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!fetchStarted && typeof window !== 'undefined') {
      fetchStarted = true;
      fetchSettings();
    }
    const listener = () => forceUpdate((n) => n + 1);
    globalListeners.push(listener);
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
    };
  }, []);

  const refresh = useCallback(() => {
    fetchSettings();
  }, []);

  return {
    settings: globalSettings,
    loaded: globalLoaded,
    refresh,
  };
}
