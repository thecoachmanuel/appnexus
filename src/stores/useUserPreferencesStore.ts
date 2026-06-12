import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Language = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  marketing: boolean;
  buildUpdates: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  soundVolume: number; // 0-100
}

interface DevicePreviewPreferences {
  selectedDeviceId: string;
  isRotated: boolean;
  mockupSize: 'small' | 'medium' | 'large';
  isOrientationLocked: boolean;
}

interface UserPreferences {
  // Language
  language: Language;
  setLanguage: (language: Language) => void;

  // Notifications
  notifications: NotificationPreferences;
  setNotifications: (notifications: Partial<NotificationPreferences>) => void;
  toggleNotification: (key: keyof NotificationPreferences) => void;

  // Display
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;

  // Privacy
  analyticsEnabled: boolean;
  setAnalyticsEnabled: (enabled: boolean) => void;

  // Device Preview Preferences
  devicePreview: DevicePreviewPreferences;
  setDevicePreview: (prefs: Partial<DevicePreviewPreferences>) => void;

  // Reset
  resetPreferences: () => void;
}

const defaultNotifications: NotificationPreferences = {
  email: true,
  push: true,
  marketing: false,
  buildUpdates: true,
  weeklyDigest: false,
  soundEnabled: true,
  soundVolume: 50,
};

const defaultDevicePreview: DevicePreviewPreferences = {
  selectedDeviceId: 'iphone-15-pro',
  isRotated: false,
  mockupSize: 'medium',
  isOrientationLocked: false,
};

const defaultPreferences = {
  language: 'en' as Language,
  notifications: defaultNotifications,
  compactMode: false,
  animationsEnabled: true,
  analyticsEnabled: true,
  devicePreview: defaultDevicePreview,
};

export const useUserPreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      // Language
      language: defaultPreferences.language,
      setLanguage: (language) => set({ language }),

      // Notifications
      notifications: defaultPreferences.notifications,
      setNotifications: (updates) =>
        set((state) => ({
          notifications: { ...state.notifications, ...updates },
        })),
      toggleNotification: (key) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: !state.notifications[key],
          },
        })),

      // Display
      compactMode: defaultPreferences.compactMode,
      setCompactMode: (compactMode) => set({ compactMode }),

      animationsEnabled: defaultPreferences.animationsEnabled,
      setAnimationsEnabled: (animationsEnabled) => set({ animationsEnabled }),

      // Privacy
      analyticsEnabled: defaultPreferences.analyticsEnabled,
      setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),

      // Device Preview
      devicePreview: defaultPreferences.devicePreview,
      setDevicePreview: (updates) =>
        set((state) => ({
          devicePreview: { ...state.devicePreview, ...updates },
        })),

      // Reset
      resetPreferences: () => set(defaultPreferences),
    }),
    {
      name: 'app-user-preferences',
    }
  )
);

// Language labels for UI
export const languageLabels: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ja: '日本語',
  zh: '中文',
};
