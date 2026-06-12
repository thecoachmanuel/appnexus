"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import type { AppConfig } from "@/stores/useAppStore";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";

interface SplashScreenSelectorProps {
  config: AppConfig;
  onUpdate: (updates: Partial<AppConfig>) => void;
}

const splashStyles = [
  { value: "centered-logo", label: "Centered Logo", description: "Logo in center" },
  { value: "fullscreen", label: "Full Screen", description: "Full bleed design" },
  { value: "minimal", label: "Minimal", description: "Simple & clean" },
  { value: "animated", label: "Animated", description: "With loading animation" },
];

const SplashScreenSelector = ({ config, onUpdate }: SplashScreenSelectorProps) => {
  const { upload, remove, isUploading } = useStorage();
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    const result = await upload(file, {
      bucket: "splash-screens",
      maxSizeMB: 10,
      allowedTypes: ["image/png", "image/jpeg", "image/webp"],
    });

    if (result.error) {
      return;
    }

    onUpdate({ 
      customSplashScreen: result.url, 
      customSplashScreenPath: result.path,
      splashScreenStyle: "custom" 
    });
  }, [upload, onUpdate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveCustomSplash = async () => {
    if (config.customSplashScreenPath) {
      await remove("splash-screens", config.customSplashScreenPath);
    }
    onUpdate({ 
      customSplashScreen: undefined, 
      customSplashScreenPath: undefined, 
      splashScreenStyle: "centered-logo" 
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Custom Upload Option */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="splash-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="splash-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full p-4 rounded-xl border-2 border-dashed text-left transition-all hover:scale-[1.01] flex items-center gap-4 cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : config.splashScreenStyle === "custom"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30"
            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            {/* Preview Phone */}
            <div className={`w-12 h-24 sm:w-14 sm:h-28 rounded-[0.75rem] sm:rounded-[0.875rem] relative overflow-hidden shadow-md border-2 flex-shrink-0 transition-colors ${
              isDragging ? "border-primary bg-primary/20" : config.splashScreenStyle === "custom" ? "border-primary/50" : "border-border/60 bg-background"
            }`}>
              <div className="absolute top-1 sm:top-1.5 left-1/2 -translate-x-1/2 w-4 sm:w-5 h-1 bg-foreground/80 rounded-full z-10" />
              <div className="absolute inset-[2px] rounded-[0.625rem] sm:rounded-[0.75rem] overflow-hidden bg-muted flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : config.customSplashScreen ? (
                  <img
                    src={config.customSplashScreen}
                    alt="Custom splash"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Upload className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 sm:w-6 h-0.5 bg-foreground/40 rounded-full" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">
                {isUploading ? "Uploading..." : "Upload Custom Splash Screen"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isUploading ? "Please wait..." : "Drag & drop or click (PNG, JPG, WebP - max 10MB)"}
              </p>
            </div>
          </label>
          {config.customSplashScreen && !isUploading && (
            <button
              onClick={handleRemoveCustomSplash}
              className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground font-medium">or choose a layout</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Preset Styles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {splashStyles.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ 
                splashScreenStyle: option.value, 
                customSplashScreen: undefined, 
                customSplashScreenPath: undefined 
              })}
              className={`p-3 sm:p-4 rounded-xl border-2 transition-all hover:scale-[1.02] flex items-center gap-3 sm:gap-4 ${
                config.splashScreenStyle === option.value && !config.customSplashScreen
                  ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
                  : "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/40"
              }`}
            >
              {/* Phone Mockup */}
              <div className="w-12 h-24 sm:w-14 sm:h-28 rounded-[0.75rem] sm:rounded-[0.875rem] relative overflow-hidden shadow-md border-2 border-border/60 bg-background flex-shrink-0">
                <div className="absolute top-1 sm:top-1.5 left-1/2 -translate-x-1/2 w-4 sm:w-5 h-1 bg-foreground/80 rounded-full z-10" />
                <div 
                  className="absolute inset-[2px] rounded-[0.625rem] sm:rounded-[0.75rem] overflow-hidden"
                  style={{ backgroundColor: option.value === "fullscreen" ? config.primaryColor : undefined }}
                >
                  {option.value === "centered-logo" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-muted/50 to-muted">
                      <div 
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      />
                    </div>
                  )}
                  {option.value === "fullscreen" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-white/30 shadow-sm" />
                    </div>
                  )}
                  {option.value === "minimal" && (
                    <div className="absolute inset-0 flex items-end justify-center pb-2 sm:pb-3 bg-background">
                      <div 
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-md shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      />
                    </div>
                  )}
                  {option.value === "animated" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-b from-muted/50 to-muted">
                      <div 
                        className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg shadow-sm"
                        style={{ backgroundColor: config.primaryColor }}
                      />
                      <div className="flex gap-0.5 sm:gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/60 animate-pulse" />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary/20 animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 sm:w-6 h-0.5 bg-foreground/40 rounded-full" />
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-foreground text-xs sm:text-sm">{option.label}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SplashScreenSelector;
