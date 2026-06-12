"use client";

import type { AppConfig } from "@/stores/useAppStore";

interface TemplatePreviewProps {
  templateConfig: AppConfig;
}

const TemplatePreview = ({ templateConfig }: TemplatePreviewProps) => {
  const navStyle = templateConfig.navigationStyle;
  
  return (
    <div className="w-32 h-56 bg-background rounded-xl border-2 border-border overflow-hidden shadow-lg">
      {/* Status bar */}
      <div 
        className="h-5 flex items-center justify-between px-2"
        style={{ backgroundColor: templateConfig.primaryColor }}
      >
        <span className="text-[6px] text-white font-medium">9:41</span>
        <div className="flex gap-0.5">
          <div className="w-2 h-1.5 bg-white/80 rounded-sm" />
          <div className="w-2 h-1.5 bg-white/80 rounded-sm" />
        </div>
      </div>
      
      {/* Top tabs navigation */}
      {navStyle === "tabs" && (
        <div 
          className="h-6 flex items-center gap-1 px-1"
          style={{ backgroundColor: templateConfig.primaryColor }}
        >
          {["Home", "Feed", "Profile"].map((tab, i) => (
            <div 
              key={tab}
              className={`px-1.5 py-0.5 rounded text-[5px] ${i === 0 ? 'bg-white/30 text-white' : 'text-white/70'}`}
            >
              {tab}
            </div>
          ))}
        </div>
      )}
      
      {/* Header */}
      <div 
        className="h-8 flex items-center px-2 border-b border-border/50"
        style={{ backgroundColor: navStyle === "tabs" ? undefined : templateConfig.primaryColor }}
      >
        {navStyle === "drawer" && (
          <div className="flex flex-col gap-0.5 mr-2">
            <div className="w-2.5 h-0.5 bg-white rounded" />
            <div className="w-2.5 h-0.5 bg-white rounded" />
            <div className="w-2.5 h-0.5 bg-white rounded" />
          </div>
        )}
        <span 
          className={`text-[7px] font-bold truncate ${navStyle === "tabs" ? 'text-foreground' : 'text-white'}`}
        >
          {templateConfig.appName || "App Name"}
        </span>
      </div>
      
      {/* Content area */}
      <div className="flex-1 p-2 space-y-1.5 bg-muted/30">
        <div 
          className="h-10 rounded-md opacity-20"
          style={{ backgroundColor: templateConfig.primaryColor }}
        />
        <div className="flex gap-1">
          <div 
            className="flex-1 h-6 rounded opacity-15"
            style={{ backgroundColor: templateConfig.accentColor }}
          />
          <div 
            className="flex-1 h-6 rounded opacity-15"
            style={{ backgroundColor: templateConfig.accentColor }}
          />
        </div>
        <div 
          className="h-8 rounded-md opacity-10"
          style={{ backgroundColor: templateConfig.primaryColor }}
        />
        
        {/* Features badges */}
        <div className="flex flex-wrap gap-0.5 mt-1">
          {templateConfig.suggestedFeatures.slice(0, 3).map((feature, i) => (
            <span 
              key={i}
              className="text-[4px] px-1 py-0.5 rounded-full bg-primary/20 text-primary truncate max-w-[40px]"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
      
      {/* Bottom navigation */}
      {navStyle === "bottom-nav" && (
        <div className="h-7 flex items-center justify-around border-t border-border/50 bg-background">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: i === 0 ? templateConfig.primaryColor : `${templateConfig.primaryColor}40` }}
              />
              <div className="w-4 h-0.5 bg-muted-foreground/30 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplatePreview;