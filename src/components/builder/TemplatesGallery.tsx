"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Grid3X3, 
  LayoutList, 
  Sparkles,
  ShoppingCart,
  Newspaper,
  Briefcase,
  Utensils,
  Heart,
  Plane,
  Coffee,
  BookOpen,
  X,
  Eye,
  Check,
  Smartphone,
  Tablet,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppConfig } from "@/stores/useAppStore";
import { 
  presetTemplates, 
  templateCategories, 
  type TemplateCategory,
  type PresetTemplate 
} from "./configure/presetTemplates";
import TemplatePreview from "./configure/TemplatePreview";

interface TemplatesGalleryProps {
  onApply: (config: AppConfig, name: string) => void;
  currentConfig?: AppConfig;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "All": Grid3X3,
  "Business": Briefcase,
  "Lifestyle": Heart,
  "Media": Newspaper,
  "Food": Utensils,
};

const templateIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "E-commerce": ShoppingCart,
  "News App": Newspaper,
  "Portfolio": Briefcase,
  "Restaurant": Utensils,
  "Fitness": Heart,
  "Blog": BookOpen,
  "Travel": Plane,
  "Café": Coffee,
};

type DeviceType = "phone" | "tablet" | "desktop";

const deviceConfigs: Record<DeviceType, { width: number; height: number; scale: number; label: string }> = {
  phone: { width: 375, height: 812, scale: 0.55, label: "iPhone" },
  tablet: { width: 768, height: 1024, scale: 0.45, label: "iPad" },
  desktop: { width: 1280, height: 800, scale: 0.35, label: "Desktop" },
};

export const TemplatesGallery = ({ onApply, currentConfig }: TemplatesGalleryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<PresetTemplate | null>(null);
  const [previewDevice, setPreviewDevice] = useState<DeviceType>("phone");

  const filteredTemplates = presetTemplates.filter((template) => {
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.config.appCategory?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: TemplateCategory) => {
    if (category === "All") return presetTemplates.length;
    return presetTemplates.filter(t => t.category === category).length;
  };

  const handlePreview = (template: PresetTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
  };

  const handleApplyFromPreview = () => {
    if (previewTemplate) {
      onApply(previewTemplate.config, previewTemplate.name);
      setPreviewTemplate(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Template Gallery
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose a pre-configured template to get started quickly
          </p>
        </div>
        
        {/* View Toggle & Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-border/50"
            />
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list" 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 sm:gap-2 flex-wrap">
        {templateCategories.map((category) => {
          const IconComponent = categoryIcons[category] || Grid3X3;
          const count = getCategoryCount(category);
          const isActive = selectedCategory === category;
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{category}</span>
              <span className="xs:hidden">{category === "All" ? "All" : category.slice(0, 3)}</span>
              <span className={cn(
                "text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full",
                isActive ? "bg-primary-foreground/20" : "bg-border"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid/List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedCategory}-${viewMode}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-3"
          )}
        >
          {filteredTemplates.map((template, index) => (
            <TemplateCard
              key={`${template.name}-${index}`}
              template={template}
              viewMode={viewMode}
              isHovered={hoveredTemplate === template.name}
              onHover={() => setHoveredTemplate(template.name)}
              onLeave={() => setHoveredTemplate(null)}
              onApply={() => onApply(template.config, template.name)}
              onPreview={(e) => handlePreview(template, e)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-foreground mb-1">No templates found</h4>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or category filter
          </p>
        </div>
      )}

      {/* Full-Screen Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-6xl h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Modal Header */}
            <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {previewTemplate && (
                    <>
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: previewTemplate.config.primaryColor }}
                      >
                        {(() => {
                          const Icon = templateIcons[previewTemplate.name] || Sparkles;
                          return <Icon className="w-5 h-5 text-white" />;
                        })()}
                      </div>
                      <div>
                        <DialogTitle className="text-lg font-semibold">
                          {previewTemplate.name}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                          {previewTemplate.description}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Device Switcher */}
                <div className="flex items-center gap-2">
                  <div className="flex border border-border rounded-lg overflow-hidden mr-4">
                    {(["phone", "tablet", "desktop"] as DeviceType[]).map((device) => {
                      const icons = { phone: Smartphone, tablet: Tablet, desktop: Monitor };
                      const Icon = icons[device];
                      return (
                        <button
                          key={device}
                          onClick={() => setPreviewDevice(device)}
                          className={cn(
                            "p-2 transition-colors",
                            previewDevice === device 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                          )}
                          title={deviceConfigs[device].label}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                  
                  <Button onClick={handleApplyFromPreview} className="gap-2">
                    <Check className="w-4 h-4" />
                    Apply Template
                  </Button>
                </div>
              </div>
            </DialogHeader>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-muted/20 p-8">
              <div className="flex items-center justify-center h-full">
                <AnimatePresence mode="wait">
                  {previewTemplate && (
                    <motion.div
                      key={previewDevice}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <FullScreenDeviceMockup 
                        config={previewTemplate.config} 
                        device={previewDevice}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer with Template Details */}
            {previewTemplate && (
              <div className="px-6 py-4 border-t border-border bg-card/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Colors */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Colors:</span>
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-background shadow-sm" 
                          style={{ backgroundColor: previewTemplate.config.primaryColor }}
                          title={`Primary: ${previewTemplate.config.primaryColor}`}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-background shadow-sm" 
                          style={{ backgroundColor: previewTemplate.config.accentColor }}
                          title={`Accent: ${previewTemplate.config.accentColor}`}
                        />
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Navigation:</span>
                      <Badge variant="secondary" className="capitalize">
                        {previewTemplate.config.navigationStyle?.replace("-", " ")}
                      </Badge>
                    </div>

                    {/* Category */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Category:</span>
                      <Badge variant="outline">{previewTemplate.category}</Badge>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Features:</span>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.config.suggestedFeatures?.slice(0, 4).map((feature) => (
                        <span 
                          key={feature}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {feature}
                        </span>
                      ))}
                      {(previewTemplate.config.suggestedFeatures?.length || 0) > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          +{(previewTemplate.config.suggestedFeatures?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Full-screen device mockup component
interface FullScreenDeviceMockupProps {
  config: AppConfig;
  device: DeviceType;
}

const FullScreenDeviceMockup = ({ config, device }: FullScreenDeviceMockupProps) => {
  const deviceConfig = deviceConfigs[device];
  const navStyle = config.navigationStyle;

  return (
    <div 
      className={cn(
        "relative bg-background rounded-[2.5rem] border-[8px] border-foreground/90 shadow-2xl overflow-hidden",
        device === "phone" && "rounded-[2.5rem]",
        device === "tablet" && "rounded-[1.5rem]",
        device === "desktop" && "rounded-lg border-[4px]"
      )}
      style={{ 
        width: deviceConfig.width * deviceConfig.scale,
        height: deviceConfig.height * deviceConfig.scale,
      }}
    >
      {/* Desktop Top Bar */}
      {device === "desktop" && (
        <div className="h-6 bg-foreground/90 flex items-center px-3 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
      )}

      {/* Device Frame */}
      <div className="w-full h-full overflow-hidden" style={{ 
        height: device === "desktop" ? `calc(100% - 24px)` : "100%" 
      }}>
        {/* Status bar */}
        <div 
          className="h-7 flex items-center justify-between px-4"
          style={{ backgroundColor: config.primaryColor }}
        >
          <span className="text-[10px] text-white font-medium">9:41</span>
          <div className="flex gap-1">
            <div className="w-4 h-2.5 bg-white/80 rounded-sm" />
            <div className="w-4 h-2.5 bg-white/80 rounded-sm" />
          </div>
        </div>
        
        {/* Top tabs navigation */}
        {navStyle === "tabs" && (
          <div 
            className="h-10 flex items-center gap-2 px-3"
            style={{ backgroundColor: config.primaryColor }}
          >
            {["Home", "Feed", "Explore", "Profile"].map((tab, i) => (
              <div 
                key={tab}
                className={`px-3 py-1.5 rounded text-xs ${i === 0 ? 'bg-white/30 text-white font-medium' : 'text-white/70'}`}
              >
                {tab}
              </div>
            ))}
          </div>
        )}
        
        {/* Header */}
        <div 
          className="h-12 flex items-center px-4 border-b border-border/50"
          style={{ backgroundColor: navStyle === "tabs" ? undefined : config.primaryColor }}
        >
          {navStyle === "drawer" && (
            <div className="flex flex-col gap-1 mr-3">
              <div className="w-5 h-0.5 bg-white rounded" />
              <div className="w-5 h-0.5 bg-white rounded" />
              <div className="w-5 h-0.5 bg-white rounded" />
            </div>
          )}
          <span 
            className={`text-sm font-bold truncate ${navStyle === "tabs" ? 'text-foreground' : 'text-white'}`}
          >
            {config.appName || "App Name"}
          </span>
        </div>
        
        {/* Content area */}
        <div className="flex-1 p-4 space-y-3 bg-muted/30" style={{ 
          height: navStyle === "bottom-nav" ? "calc(100% - 7rem - 12px - 3rem)" : "calc(100% - 7rem - 12px)" 
        }}>
          {/* Hero Card */}
          <div 
            className="h-24 rounded-xl opacity-30 flex items-center justify-center"
            style={{ backgroundColor: config.primaryColor }}
          >
            <span className="text-white/80 text-xs font-medium">Featured Content</span>
          </div>
          
          {/* Grid Items */}
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="h-16 rounded-lg opacity-20 flex items-center justify-center"
                style={{ backgroundColor: i % 2 === 0 ? config.accentColor : config.primaryColor }}
              >
                <span className="text-white/60 text-[10px]">Item {i}</span>
              </div>
            ))}
          </div>
          
          {/* List Items */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="h-10 rounded-lg opacity-15 flex items-center px-3"
                style={{ backgroundColor: config.primaryColor }}
              >
                <div className="w-6 h-6 rounded-full bg-white/30 mr-2" />
                <div className="flex-1 h-2 bg-white/30 rounded" />
              </div>
            ))}
          </div>
          
          {/* Features badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {config.suggestedFeatures?.slice(0, 5).map((feature, i) => (
              <span 
                key={i}
                className="text-[10px] px-2 py-1 rounded-full bg-primary/20 text-primary"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
        
        {/* Bottom navigation */}
        {navStyle === "bottom-nav" && (
          <div className="absolute bottom-0 left-0 right-0 h-14 flex items-center justify-around border-t border-border/50 bg-background">
            {["Home", "Search", "Add", "Inbox", "Profile"].map((item, i) => (
              <div key={item} className="flex flex-col items-center gap-1">
                <div 
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: i === 0 ? config.primaryColor : `${config.primaryColor}30` }}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-sm",
                    i === 0 ? "bg-white" : "bg-muted-foreground/50"
                  )} />
                </div>
                <span className={cn(
                  "text-[8px]",
                  i === 0 ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phone Notch */}
      {device === "phone" && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground/90 rounded-b-2xl" />
      )}
    </div>
  );
};

interface TemplateCardProps {
  template: PresetTemplate;
  viewMode: "grid" | "list";
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onApply: () => void;
  onPreview: (e: React.MouseEvent) => void;
}

const TemplateCard = ({ 
  template, 
  viewMode, 
  isHovered, 
  onHover, 
  onLeave, 
  onApply,
  onPreview
}: TemplateCardProps) => {
  const IconComponent = templateIcons[template.name] || Sparkles;

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          "flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
          "hover:border-primary/50 hover:bg-card transition-all cursor-pointer group"
        )}
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
      >
        {/* Color Preview */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden relative">
          <div 
            className="absolute inset-0" 
            style={{ backgroundColor: template.config.primaryColor }}
          />
          <div 
            className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-lg" 
            style={{ backgroundColor: template.config.accentColor }}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <IconComponent className="w-4 h-4 text-muted-foreground" />
            <h4 className="font-medium text-foreground">{template.name}</h4>
            <Badge variant="secondary" className="text-xs">
              {template.category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {template.description}
          </p>
        </div>

        {/* Features Count */}
        <div className="flex-shrink-0 text-right">
          <div className="text-sm font-medium text-foreground">
            {template.config.suggestedFeatures?.length || 0}
          </div>
          <div className="text-xs text-muted-foreground">features</div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button 
            size="sm" 
            variant="outline"
            onClick={onPreview}
            className="gap-1"
          >
            <Eye className="w-3 h-3" />
            Preview
          </Button>
          <Button 
            size="sm"
            onClick={onApply}
          >
            Apply
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden",
        "hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer group"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Preview */}
      <div className="p-3 bg-muted/30">
        <div className="relative aspect-[9/16] max-h-36 mx-auto">
          <div className="absolute inset-0 scale-[0.4] origin-top">
            <TemplatePreview templateConfig={template.config} />
          </div>
          
          {/* Overlay on hover */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center gap-2"
          >
            <Button 
              size="sm" 
              variant="secondary" 
              className="shadow-lg gap-1 h-8 text-xs"
              onClick={onPreview}
            >
              <Eye className="w-3 h-3" />
              Preview
            </Button>
            <Button size="sm" className="shadow-lg h-8 text-xs" onClick={onApply}>
              Apply
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 pt-2.5 space-y-2">
        {/* Header with icon, name, category and colors */}
        <div className="flex items-center gap-2">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: template.config.primaryColor }}
          >
            <IconComponent className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground text-sm leading-tight truncate">{template.name}</h4>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 mt-0.5">
              {template.category}
            </Badge>
          </div>
          {/* Color dots */}
          <div className="flex gap-0.5 flex-shrink-0">
            <div 
              className="w-3 h-3 rounded-full border border-background shadow-sm" 
              style={{ backgroundColor: template.config.primaryColor }}
            />
            <div 
              className="w-3 h-3 rounded-full border border-background shadow-sm" 
              style={{ backgroundColor: template.config.accentColor }}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
          {template.description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-1 pt-1 border-t border-border/30">
          {template.config.suggestedFeatures?.slice(0, 2).map((feature) => (
            <span 
              key={feature} 
              className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground"
            >
              {feature}
            </span>
          ))}
          {(template.config.suggestedFeatures?.length || 0) > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              +{(template.config.suggestedFeatures?.length || 0) - 2} more
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TemplatesGallery;
