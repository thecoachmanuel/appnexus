import type { AppConfig } from "@/stores/useAppStore";
import type { PlatformId } from "@/types/platforms";

interface BuildTimeEstimate {
  minMinutes: number;
  maxMinutes: number;
  factors: string[];
}

export const estimateBuildTime = (
  config: AppConfig,
  platform: PlatformId,
  storeReady: boolean
): BuildTimeEstimate => {
  let baseTime = 2; // Base build time in minutes
  const factors: string[] = [];

  // Platform-specific base times
  switch (platform) {
    case "android":
      baseTime = storeReady ? 4 : 3;
      factors.push(storeReady ? "Store-ready AAB build" : "Debug APK build");
      break;
    case "ios":
      baseTime = 5;
      factors.push("iOS native compilation");
      break;
    case "pwa":
      baseTime = 1;
      factors.push("Progressive Web App");
      break;
    case "windows":
    case "macos":
    case "linux":
      baseTime = 3;
      factors.push("Desktop Electron build");
      break;
    default:
      baseTime = 3;
  }

  // Feature complexity
  const featureCount = config.suggestedFeatures.length;
  if (featureCount > 5) {
    baseTime += 1;
    factors.push(`${featureCount} features enabled`);
  } else if (featureCount > 0) {
    baseTime += 0.5;
  }

  // Push notifications add complexity
  if (config.suggestedFeatures.includes("Push Notifications")) {
    baseTime += 0.5;
    factors.push("Push notification setup");
  }

  // Biometric login adds complexity
  if (config.suggestedFeatures.includes("Biometric Login")) {
    baseTime += 0.5;
    factors.push("Biometric authentication");
  }

  // Offline mode adds complexity
  if (config.suggestedFeatures.includes("Offline Mode")) {
    baseTime += 0.5;
    factors.push("Offline caching");
  }

  // Custom icon processing
  if (config.customIcon) {
    baseTime += 0.5;
    factors.push("Custom icon processing");
  }

  // Calculate range (±30% variance)
  const variance = baseTime * 0.3;
  const minMinutes = Math.max(1, Math.round(baseTime - variance));
  const maxMinutes = Math.round(baseTime + variance);

  return {
    minMinutes,
    maxMinutes,
    factors: factors.slice(0, 3), // Show top 3 factors
  };
};

export const formatBuildTime = (estimate: BuildTimeEstimate): string => {
  if (estimate.minMinutes === estimate.maxMinutes) {
    return `~${estimate.minMinutes} min`;
  }
  return `${estimate.minMinutes}-${estimate.maxMinutes} min`;
};
