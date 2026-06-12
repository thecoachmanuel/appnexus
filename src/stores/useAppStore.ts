import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIProvider = "gemini" | "openai";

export interface NavItem {
  icon: string;
  label: string;
}

export interface ProjectAsset {
  id: string;
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
}

export interface AppConfig {
  websiteUrl: string;
  appName: string;
  primaryColor: string;
  accentColor: string;
  navigationStyle: "tabs" | "drawer" | "bottom-nav";
  suggestedFeatures: string[];
  appCategory: string;
  description: string;
  iconStyle: string;
  customIcon?: string;
  customIconPath?: string;
  splashScreenStyle: string;
  customSplashScreen?: string;
  customSplashScreenPath?: string;
  projectAssets?: ProjectAsset[];
  recommendations: string[];
  aiProvider: AIProvider;
  automationWorkflows: string[];
  customNavItems?: NavItem[];
  customDrawerItems?: NavItem[];
  customTabLabels?: string[];
  versionCode?: number;
  versionName?: string;
  // AdMob Ads
  adsEnabled?: boolean;
  adBannerEnabled?: boolean;
  adInterstitialEnabled?: boolean;
  adRewardedEnabled?: boolean;
  adBannerPosition?: "top" | "bottom";
  adBannerId?: string;
  adInterstitialId?: string;
  adRewardedId?: string;
}

const defaultConfig: AppConfig = {
  websiteUrl: "",
  appName: "",
  primaryColor: "#22D3EE",
  accentColor: "#A855F7",
  navigationStyle: "bottom-nav",
  suggestedFeatures: [],
  appCategory: "",
  description: "",
  iconStyle: "modern",
  splashScreenStyle: "centered-logo",
  recommendations: [],
  aiProvider: "gemini",
  automationWorkflows: [],
  versionCode: 1,
  versionName: "1.0",
};

interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Builder State
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToStep: (step: number) => void;
  
  // Builder Config
  config: AppConfig;
  setConfig: (config: AppConfig) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
  resetBuilder: () => void;

  // Analyzing state (not persisted)
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // UI State
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Builder State
      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: step }),
      goToStep: (step) => {
        if (step >= 1 && step <= 4) {
          set({ currentStep: step });
        }
      },

      // Builder Config
      config: defaultConfig,
      setConfig: (config) => set({ config }),
      updateConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),
      resetBuilder: () => set({ config: defaultConfig, currentStep: 1 }),

      // Analyzing state
      isAnalyzing: false,
      setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        config: state.config,
      }),
    }
  )
);
