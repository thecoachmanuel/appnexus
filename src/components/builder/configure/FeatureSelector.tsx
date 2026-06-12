"use client";

import { Bell, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { AppConfig } from "@/stores/useAppStore";
import AIBadge from "./AIBadge";

interface FeatureSelectorProps {
  config: AppConfig;
  onUpdate: (updates: Partial<AppConfig>) => void;
}

const allFeatures = [
  "Push Notifications",
  "Offline Mode",
  "Share Feature",
  "Dark Mode",
  "Biometric Login",
  "In-App Browser",
  "Pull to Refresh",
  "Search",
];

const FeatureSelector = ({ config, onUpdate }: FeatureSelectorProps) => {
  const toggleFeature = (feature: string) => {
    const features = config.suggestedFeatures.includes(feature)
      ? config.suggestedFeatures.filter((f) => f !== feature)
      : [...config.suggestedFeatures, feature];
    onUpdate({ suggestedFeatures: features });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-primary" />
        <Label className="text-foreground font-semibold">App Features</Label>
        <AIBadge />
      </div>
      <div className="flex flex-wrap gap-3">
        {allFeatures.map((feature) => {
          const isSelected = config.suggestedFeatures.includes(feature);
          return (
            <button
              key={feature}
              onClick={() => toggleFeature(feature)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                isSelected
                  ? "bg-primary/20 text-primary border border-primary/50"
                  : "bg-secondary/50 text-muted-foreground border border-transparent hover:border-border"
              }`}
            >
              {isSelected && <Check className="w-4 h-4" />}
              {feature}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureSelector;