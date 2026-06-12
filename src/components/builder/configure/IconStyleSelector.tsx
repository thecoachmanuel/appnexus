"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import type { AppConfig } from "@/stores/useAppStore";
import { useStorage } from "@/hooks/useStorage";
import { toast } from "sonner";

interface IconStyleSelectorProps {
  config: AppConfig;
  onUpdate: (updates: Partial<AppConfig>) => void;
}

const iconStyles = [
  { value: "modern", label: "Modern", description: "Clean, minimal design" },
  { value: "classic", label: "Classic", description: "Traditional app icon" },
  { value: "gradient", label: "Gradient", description: "Vibrant color blend" },
  { value: "outlined", label: "Outlined", description: "Line-based design" },
];

const IconStyleSelector = ({ config, onUpdate }: IconStyleSelectorProps) => {
  const { upload, remove, isUploading } = useStorage();
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const result = await upload(file, {
      bucket: "app-icons",
      maxSizeMB: 5,
      allowedTypes: ["image/png", "image/jpeg", "image/webp", "image/svg+xml"],
    });

    if (result.error) {
      return; // Error already shown by hook
    }

    onUpdate({ 
      customIcon: result.url, 
      customIconPath: result.path,
      iconStyle: "custom" 
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

  const handleRemoveCustomIcon = async () => {
    if (config.customIconPath) {
      await remove("app-icons", config.customIconPath);
    }
    onUpdate({ customIcon: undefined, customIconPath: undefined, iconStyle: "modern" });
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
            id="icon-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="icon-upload"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full p-4 rounded-xl border-2 border-dashed text-left transition-all hover:scale-[1.01] flex items-center gap-4 cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : config.iconStyle === "custom"
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-border/60 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30"
            } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center border-2 border-dashed overflow-hidden transition-colors ${
              isDragging ? "border-primary bg-primary/20" : config.iconStyle === "custom" ? "border-primary/50 bg-primary/10" : "border-muted-foreground/30 bg-muted/30"
            }`}>
              {isUploading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : config.customIcon ? (
                <img
                  src={config.customIcon}
                  alt="Custom icon"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Upload className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">
                {isUploading ? "Uploading..." : "Upload Custom Icon"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isUploading ? "Please wait..." : "Drag & drop or click to upload (PNG, JPG, WebP, SVG)"}
              </p>
            </div>
          </label>
          {config.customIcon && !isUploading && (
            <button
              onClick={handleRemoveCustomIcon}
              className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors shadow-sm"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground font-medium">or choose a style</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Preset Styles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {iconStyles.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ iconStyle: option.value, customIcon: undefined, customIconPath: undefined })}
              className={`p-3 sm:p-4 rounded-xl border-2 transition-all hover:scale-[1.02] flex items-center gap-3 sm:gap-4 ${
                config.iconStyle === option.value && !config.customIcon
                  ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
                  : "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/40"
              }`}
            >
              <div 
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex-shrink-0 flex items-center justify-center shadow-md ${
                  option.value === "modern" ? "bg-gradient-to-br" :
                  option.value === "gradient" ? "bg-gradient-to-r" :
                  option.value === "outlined" ? "border-2 bg-background" : ""
                }`}
                style={{ 
                  backgroundColor: option.value === "classic" ? config.primaryColor : undefined,
                  backgroundImage: option.value === "modern" ? `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` :
                                  option.value === "gradient" ? `linear-gradient(90deg, ${config.primaryColor}, ${config.accentColor})` : undefined,
                  borderColor: option.value === "outlined" ? config.primaryColor : undefined,
                }}
              >
                {option.value === "outlined" && (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg" style={{ backgroundColor: config.primaryColor }} />
                )}
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

export default IconStyleSelector;
