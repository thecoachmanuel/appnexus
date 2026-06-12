"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { AppConfig } from "@/stores/useAppStore";

interface ColorPickerProps {
  config: AppConfig;
  onUpdate: (updates: Partial<AppConfig>) => void;
}

const ColorPicker = ({ config, onUpdate }: ColorPickerProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="space-y-2">
          <Label htmlFor="primaryColor" className="text-muted-foreground text-sm">Primary Color</Label>
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="color"
              id="primaryColor"
              value={config.primaryColor}
              onChange={(e) => onUpdate({ primaryColor: e.target.value })}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg cursor-pointer border-0 flex-shrink-0"
            />
            <Input
              value={config.primaryColor}
              onChange={(e) => onUpdate({ primaryColor: e.target.value })}
              className="bg-secondary/50 border-border/50 font-mono uppercase text-xs sm:text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="accentColor" className="text-muted-foreground text-sm">Accent Color</Label>
          <div className="flex items-center gap-2 sm:gap-3">
            <input
              type="color"
              id="accentColor"
              value={config.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg cursor-pointer border-0 flex-shrink-0"
            />
            <Input
              value={config.accentColor}
              onChange={(e) => onUpdate({ accentColor: e.target.value })}
              className="bg-secondary/50 border-border/50 font-mono uppercase text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker;