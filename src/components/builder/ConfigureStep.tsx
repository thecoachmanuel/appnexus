"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Sparkles, Globe, RefreshCw, Save, FolderOpen, LayoutGrid, ChevronDown, ChevronUp } from "lucide-react";
import { templatesApi, aiApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AppConfig } from "@/stores/useAppStore";

// Import modular components
import {
  AIBadge,
  
  ColorPicker,
  FeatureSelector,
  IconStyleSelector,
  NavigationStyleSelector,
  ProjectAssetsUploader,
  SplashScreenSelector,
  TemplateItem,
  PhoneMockup,
  presetTemplates,
  templateCategories,
  TemplatesGallery,
  type TemplateCategory,
} from "./configure";
import CollapsibleSection from "./configure/CollapsibleSection";
import { Palette, Image, Navigation, Zap, Sparkles as SparklesIcon, Droplet, PanelBottom, Puzzle, FolderUp, Megaphone } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface Template {
  id: string;
  name: string;
  description: string | null;
  config: AppConfig;
  created_at: string;
}

// AdMob Ads Configuration Component
const AdMobSection = ({ config, onUpdate }: { config: AppConfig; onUpdate: (u: Partial<AppConfig>) => void }) => {
  const { settings } = useSystemSettings();
  const adminEnabled = settings.admob_enabled;

  // If admin hasn't enabled AdMob globally, don't show the section
  if (!adminEnabled) return null;

  const adsEnabled = config.adsEnabled ?? false;

  return (
    <CollapsibleSection
      title="AdMob Ads"
      icon={<Megaphone className="w-4 h-4" />}
      badge={
        adsEnabled ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Enabled</span>
        ) : null
      }
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-foreground">Enable Ads</Label>
            <p className="text-[10px] text-muted-foreground">Monetize your app with AdMob ads</p>
          </div>
          <Switch
            checked={adsEnabled}
            onCheckedChange={(v) => onUpdate({ adsEnabled: v })}
          />
        </div>

        {adsEnabled && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            {/* Banner Ads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Banner Ad</Label>
                <Switch
                  checked={config.adBannerEnabled ?? true}
                  onCheckedChange={(v) => onUpdate({ adBannerEnabled: v })}
                />
              </div>
              {(config.adBannerEnabled ?? true) && (
                <div className="space-y-2 pl-1">
                  <Input
                    placeholder={settings.admob_banner_id || "ca-app-pub-xxxxx/yyyyy"}
                    value={config.adBannerId || ""}
                    onChange={(e) => onUpdate({ adBannerId: e.target.value })}
                    className="bg-secondary/50 border-border/50 text-xs h-8"
                  />
                  <p className="text-[10px] text-muted-foreground">Leave empty to use platform default</p>
                  <div className="flex gap-2">
                    <Button
                      variant={config.adBannerPosition === "top" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7 flex-1"
                      onClick={() => onUpdate({ adBannerPosition: "top" })}
                    >
                      Top
                    </Button>
                    <Button
                      variant={(config.adBannerPosition ?? "bottom") === "bottom" ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7 flex-1"
                      onClick={() => onUpdate({ adBannerPosition: "bottom" })}
                    >
                      Bottom
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Interstitial Ads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Interstitial Ad</Label>
                <Switch
                  checked={config.adInterstitialEnabled ?? false}
                  onCheckedChange={(v) => onUpdate({ adInterstitialEnabled: v })}
                />
              </div>
              {config.adInterstitialEnabled && (
                <div className="pl-1">
                  <Input
                    placeholder={settings.admob_interstitial_id || "ca-app-pub-xxxxx/yyyyy"}
                    value={config.adInterstitialId || ""}
                    onChange={(e) => onUpdate({ adInterstitialId: e.target.value })}
                    className="bg-secondary/50 border-border/50 text-xs h-8"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Shown at app launch or transitions</p>
                </div>
              )}
            </div>

            {/* Rewarded Ads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Rewarded Ad</Label>
                <Switch
                  checked={config.adRewardedEnabled ?? false}
                  onCheckedChange={(v) => onUpdate({ adRewardedEnabled: v })}
                />
              </div>
              {config.adRewardedEnabled && (
                <div className="pl-1">
                  <Input
                    placeholder={settings.admob_rewarded_id || "ca-app-pub-xxxxx/yyyyy"}
                    value={config.adRewardedId || ""}
                    onChange={(e) => onUpdate({ adRewardedId: e.target.value })}
                    className="bg-secondary/50 border-border/50 text-xs h-8"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Users watch to earn rewards</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
};

interface ConfigureStepProps {
  config: AppConfig;
  onUpdate: (updates: Partial<AppConfig>) => void;
  onBack: () => void;
  onNext: () => void;
}

const ConfigureStep = ({ config, onUpdate, onBack, onNext }: ConfigureStepProps) => {
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("All");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    const { data, error } = await templatesApi.list();

    if (!error && data) {
      setTemplates(data as unknown as Template[]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save templates.",
        variant: "destructive",
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const configData = JSON.parse(JSON.stringify(config));
      const { error } = await templatesApi.create({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        config: configData,
      });

      if (error) throw error;

      toast({
        title: "Template Saved!",
        description: `"${templateName}" has been saved to your templates.`,
      });

      setTemplateName("");
      setTemplateDescription("");
      setSaveDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("Save template error:", error);
      toast({
        title: "Save Failed",
        description: "Could not save the template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyTemplate = (template: Template) => {
    onUpdate({
      // Retain AI or User-defined Brand Info, fallback to Template
      appName: config.appName || template.config.appName,
      primaryColor: config.primaryColor || template.config.primaryColor,
      accentColor: config.accentColor || template.config.accentColor,
      hideSelectors: config.hideSelectors || template.config.hideSelectors || "",
      customNavItems: (config.customNavItems && config.customNavItems.length > 0) ? config.customNavItems : template.config.customNavItems,
      
      // Override Structure/Styling with Template Config
      navigationStyle: template.config.navigationStyle,
      suggestedFeatures: template.config.suggestedFeatures,
      appCategory: template.config.appCategory,
      description: template.config.description,
      iconStyle: template.config.iconStyle,
      splashScreenStyle: template.config.splashScreenStyle,
      recommendations: template.config.recommendations || [],
    });

    toast({
      title: "Template Applied!",
      description: `"${template.name}" settings have been applied.`,
    });
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    try {
      const { error } = await templatesApi.delete(templateId);

      if (error) throw error;

      toast({
        title: "Template Deleted",
        description: `"${templateName}" has been removed.`,
      });

      fetchTemplates();
    } catch (error) {
      console.error("Delete template error:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReanalyze = async () => {
    if (!config.websiteUrl) {
      toast({
        title: "No website URL",
        description: "Please go back and enter a website URL first.",
        variant: "destructive",
      });
      return;
    }

    setIsReanalyzing(true);
    
    try {
      const { data, error } = await aiApi.analyzeWebsite(config.websiteUrl);

      if (error) throw error;

      if (data?.config) {
        onUpdate({
          appName: data.config.app_name || config.appName,
          primaryColor: data.config.primary_color || config.primaryColor,
          accentColor: data.config.accent_color || config.accentColor,
          navigationStyle: (data.config.navigation_style as "bottom-nav" | "drawer" | "tabs") || config.navigationStyle,
          suggestedFeatures: data.config.features || config.suggestedFeatures,
          appCategory: data.config.app_category || config.appCategory,
          description: data.config.description || config.description,
          iconStyle: data.config.icon_style || config.iconStyle,
          splashScreenStyle: data.config.splash_screen_style || config.splashScreenStyle,
          recommendations: config.recommendations,
          hideSelectors: data.config.hide_selectors || config.hideSelectors,
          customNavItems: data.config.navigation_items || config.customNavItems,
        });

        toast({
          title: "Settings Refreshed!",
          description: "AI has updated your app configuration with new recommendations.",
        });
      }
    } catch (error) {
      console.error("Re-analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not re-analyze the website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Scroll to section helper
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Small delay then expand the section if it's collapsed
      setTimeout(() => {
        const button = element.querySelector('button[data-state="closed"]');
        if (button) {
          (button as HTMLButtonElement).click();
        }
      }, 300);
    }
  };

  // Count AI-configured items
  const aiConfiguredCount = [
    config.appName,
    config.primaryColor !== "#22D3EE",
    config.accentColor !== "#A855F7",
    config.navigationStyle,
    config.suggestedFeatures.length > 0,
    config.appCategory,
  ].filter(Boolean).length;

  return (
    <div className="glass-card rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12">
      {/* AI Configuration Summary */}
      <div className="mb-6 md:mb-8 bg-accent/10 rounded-xl md:rounded-2xl p-4 md:p-6 border border-accent/20">
        {/* Header Row */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm md:text-base text-foreground">AI Auto-Configuration</h3>
              {config.websiteUrl && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-secondary/50 rounded-full text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  <span className="truncate max-w-[120px]">{new URL(config.websiteUrl).hostname}</span>
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              {aiConfiguredCount} settings configured from your website
            </p>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReanalyze}
            disabled={isReanalyzing || !config.websiteUrl}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReanalyzing ? 'animate-spin' : ''}`} />
            {isReanalyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>

          {/* Save as Template */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <Save className="w-3.5 h-3.5" />
                Save Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save as Template</DialogTitle>
                <DialogDescription>
                  Save this configuration to quickly apply it to future projects.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="templateName">Template Name</Label>
                  <Input
                    id="templateName"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="My Awesome Config"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="templateDesc">Description (optional)</Label>
                  <Input
                    id="templateDesc"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Dark theme with bottom navigation..."
                  />
                </div>
                <Button
                  onClick={handleSaveTemplate}
                  disabled={isSaving || !templateName.trim()}
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Load Template */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                <FolderOpen className="w-3.5 h-3.5" />
                Load Template
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-80 bg-popover z-50">
              {/* Category Filter Tabs */}
              <div className="p-2 border-b border-border">
                <div className="flex gap-1 flex-wrap">
                      {templateCategories.map((category) => {
                        const count = category === "All" 
                          ? presetTemplates.length 
                          : presetTemplates.filter(p => p.category === category).length;
                        return (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-2 py-1 text-xs rounded-full transition-colors ${
                              selectedCategory === category
                                ? "bg-accent text-accent-foreground"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                            }`}
                      >
                        {category} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Scrollable content */}
              <div className="max-h-64 overflow-y-auto">
                {/* Preset Templates */}
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  {selectedCategory === "All" ? "All Presets" : `${selectedCategory} Templates`}
                </DropdownMenuLabel>
                {presetTemplates
                  .filter(p => selectedCategory === "All" || p.category === selectedCategory)
                  .map((preset, index) => (
                    <TemplateItem
                      key={`preset-${index}`}
                      templateConfig={preset.config}
                      name={preset.name}
                      description={preset.description}
                      onApply={() => handleApplyTemplate({ 
                        ...preset, 
                        id: `preset-${index}`, 
                        created_at: "" 
                      })}
                      onDuplicate={() => {
                        handleApplyTemplate({ 
                          ...preset, 
                          id: `preset-${index}`, 
                          created_at: "" 
                        });
                        setTemplateName(`${preset.name} Copy`);
                        setTemplateDescription(preset.description || "");
                        setSaveDialogOpen(true);
                      }}
                    />
                  ))}

                {/* User Templates */}
                {templates.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Your Templates</DropdownMenuLabel>
                    {templates.map((template) => (
                      <TemplateItem
                        key={template.id}
                        templateConfig={template.config}
                        name={template.name}
                        description={template.description}
                        onApply={() => handleApplyTemplate(template)}
                        onDuplicate={() => {
                          handleApplyTemplate(template);
                          setTemplateName(`${template.name} Copy`);
                          setTemplateDescription(template.description || "");
                          setSaveDialogOpen(true);
                        }}
                        onDelete={() => handleDeleteTemplate(template.id, template.name)}
                        showDelete
                      />
                    ))}
                  </>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 md:gap-4 pt-4 border-t border-border/50">
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => scrollToSection('section-brand-colors')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background/50 cursor-pointer hover:bg-background/80 hover:scale-105 transition-all duration-200"
              >
                <div className="relative">
                  <div 
                    className="w-6 h-6 md:w-8 md:h-8 rounded-md border-2 border-background shadow-sm" 
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <Droplet className="w-3 h-3 md:w-4 md:h-4 text-white/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Primary</p>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono text-xs">
              {config.primaryColor?.toUpperCase()} · Click to edit
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => scrollToSection('section-brand-colors')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background/50 cursor-pointer hover:bg-background/80 hover:scale-105 transition-all duration-200"
              >
                <div className="relative">
                  <div 
                    className="w-6 h-6 md:w-8 md:h-8 rounded-md border-2 border-background shadow-sm" 
                    style={{ backgroundColor: config.accentColor }}
                  />
                  <Palette className="w-3 h-3 md:w-4 md:h-4 text-white/80 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Accent</p>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono text-xs">
              {config.accentColor?.toUpperCase()} · Click to edit
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => scrollToSection('section-features')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background/50 cursor-pointer hover:bg-background/80 hover:scale-105 transition-all duration-200"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-md bg-secondary flex items-center justify-center">
                  <Puzzle className="w-3.5 h-3.5 md:w-4 md:h-4 text-foreground" />
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-[10px] md:text-xs font-bold text-foreground">{config.suggestedFeatures.length}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground font-medium">Features</p>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs max-w-[200px]">
              {config.suggestedFeatures.length > 0 
                ? config.suggestedFeatures.slice(0, 3).join(', ') + (config.suggestedFeatures.length > 3 ? '...' : '')
                : 'No features selected'} · Click to edit
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={() => scrollToSection('section-navigation')}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-background/50 cursor-pointer hover:bg-background/80 hover:scale-105 transition-all duration-200"
              >
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-md bg-secondary flex items-center justify-center">
                  <PanelBottom className="w-3.5 h-3.5 md:w-4 md:h-4 text-foreground" />
                </div>
                <p className="text-[10px] md:text-xs text-muted-foreground font-medium capitalize">{config.navigationStyle?.replace('-', ' ') || 'Bottom'}</p>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Navigation: {config.navigationStyle?.replace('-', ' ') || 'Bottom Tab Bar'} · Click to edit
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Templates Gallery Toggle */}
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => setShowGallery(!showGallery)}
          className="w-full flex items-center justify-between p-3 md:p-4 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 md:w-5 md:h-5 text-accent" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-sm md:text-base text-foreground">Browse Template Gallery</h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {presetTemplates.length} pre-configured templates
              </p>
            </div>
          </div>
          {showGallery ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          )}
        </button>
        
        {showGallery && (
          <div className="mt-4 p-4 md:p-6 rounded-xl bg-card/50 border border-border/50">
            <TemplatesGallery
              onApply={(templateConfig, templateName) => {
                onUpdate({
                  appName: templateConfig.appName,
                  primaryColor: templateConfig.primaryColor,
                  accentColor: templateConfig.accentColor,
                  navigationStyle: templateConfig.navigationStyle,
                  suggestedFeatures: templateConfig.suggestedFeatures,
                  appCategory: templateConfig.appCategory,
                  description: templateConfig.description,
                  iconStyle: templateConfig.iconStyle,
                  splashScreenStyle: templateConfig.splashScreenStyle,
                  recommendations: templateConfig.recommendations || [],
                });
                toast({
                  title: "Template Applied!",
                  description: `"${templateName}" settings have been applied.`,
                });
                setShowGallery(false);
              }}
              currentConfig={config}
            />
          </div>
        )}
      </div>

      <div className="text-center mb-6 md:mb-8">
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1 md:mb-2">
          Fine-Tune Your App
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Review AI suggestions and customize as needed
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Left: Configuration Options */}
        <div className="space-y-4 md:space-y-6 flex-1">
          {/* App Name & Category - Always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 p-4 border border-border/50 rounded-xl bg-card/30">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="appName" className="text-sm md:text-base text-foreground">App Name</Label>
                <AIBadge />
              </div>
              <Input
                id="appName"
                value={config.appName}
                onChange={(e) => onUpdate({ appName: e.target.value })}
                className="bg-secondary/50 border-border/50"
                placeholder="My Awesome App"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="category" className="text-sm md:text-base text-foreground">Category</Label>
                <AIBadge />
              </div>
              <Input
                id="category"
                value={config.appCategory}
                onChange={(e) => onUpdate({ appCategory: e.target.value })}
                className="bg-secondary/50 border-border/50"
                placeholder="e.g., News, Business"
              />
            </div>
          </div>

          {/* Collapsible Sections for Mobile */}
          <CollapsibleSection
            id="section-brand-colors"
            title="Brand Colors"
            icon={<Palette className="w-4 h-4" />}
            badge={<AIBadge />}
            defaultOpen={true}
          >
            <ColorPicker config={config} onUpdate={onUpdate} />
          </CollapsibleSection>

          <CollapsibleSection
            title="App Icon Style"
            icon={<Image className="w-4 h-4" />}
            badge={<AIBadge />}
          >
            <IconStyleSelector config={config} onUpdate={onUpdate} />
          </CollapsibleSection>

          <CollapsibleSection
            title="Splash Screen"
            icon={<Image className="w-4 h-4" />}
            badge={<AIBadge />}
          >
            <SplashScreenSelector config={config} onUpdate={onUpdate} />
          </CollapsibleSection>

          <CollapsibleSection
            id="section-navigation"
            title="Navigation Style"
            icon={<Navigation className="w-4 h-4" />}
            badge={<AIBadge />}
          >
            <NavigationStyleSelector config={config} onUpdate={onUpdate} />
          </CollapsibleSection>

          <CollapsibleSection
            id="section-features"
            title="App Features"
            icon={<Zap className="w-4 h-4" />}
            badge={
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                {config.suggestedFeatures.length} selected
              </span>
            }
          >
            <FeatureSelector config={config} onUpdate={onUpdate} />
          </CollapsibleSection>


          <CollapsibleSection
            title="Project Assets"
            icon={<FolderUp className="w-4 h-4" />}
            badge={
              config.projectAssets?.length ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                  {config.projectAssets.length} files
                </span>
              ) : undefined
            }
          >
            <ProjectAssetsUploader config={config} onUpdate={onUpdate} />
          </CollapsibleSection>

          <CollapsibleSection
            title="App Versioning"
            icon={<Puzzle className="w-4 h-4" />}
            badge={
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                v{config.versionName || "1.0"}
              </span>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="versionName" className="text-sm text-foreground">Version Name</Label>
                <Input
                  id="versionName"
                  value={config.versionName || "1.0"}
                  onChange={(e) => onUpdate({ versionName: e.target.value })}
                  className="bg-secondary/50 border-border/50"
                  placeholder="1.0"
                />
                <p className="text-[10px] text-muted-foreground">Displayed to users (e.g. 1.0, 2.1.3)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="versionCode" className="text-sm text-foreground">Version Code</Label>
                <Input
                  id="versionCode"
                  type="number"
                  min={1}
                  value={config.versionCode || 1}
                  onChange={(e) => onUpdate({ versionCode: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="bg-secondary/50 border-border/50"
                  placeholder="1"
                />
                <p className="text-[10px] text-muted-foreground">Internal number, increment for updates</p>
              </div>
            </div>
          </CollapsibleSection>

          {/* AdMob Ads Configuration */}
          <AdMobSection config={config} onUpdate={onUpdate} />

          {/* Advanced Wrapping Settings */}
          <CollapsibleSection
            title="Advanced App Wrapping (CSS)"
            icon={<Globe className="w-4 h-4" />}
            badge={
              config.hideSelectors ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-mono truncate max-w-[120px]">
                  {config.hideSelectors.split(',').length} selectors
                </span>
              ) : undefined
            }
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hideSelectors" className="text-sm text-foreground">Hide Web Elements (CSS Selectors)</Label>
                <textarea
                  id="hideSelectors"
                  value={config.hideSelectors || ""}
                  onChange={(e) => onUpdate({ hideSelectors: e.target.value })}
                  className="w-full min-h-[100px] p-3 text-sm rounded-lg bg-secondary/50 border border-border/50 text-foreground font-mono focus:border-primary outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., header.site-header, div#mobile-nav, footer.site-footer, div.cookie-banner"
                />
                <p className="text-[10px] text-muted-foreground">
                  Provide a comma-separated list of CSS selectors targeting elements (headers, footers, sidebars, cookie banners) to hide from WebView, making your app feel natively integrated.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          {/* AI Recommendations */}
          {config.recommendations.length > 0 && (
            <CollapsibleSection
              title="AI Recommendations"
              icon={<SparklesIcon className="w-4 h-4" />}
              badge={
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  {config.recommendations.length} tips
                </span>
              }
              defaultOpen={true}
            >
              <ul className="space-y-2">
                {config.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Description */}
          {config.description && (
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
              <p className="text-sm text-muted-foreground italic">"{config.description}"</p>
            </div>
          )}
        </div>

        {/* Right: Live Phone Mockup Preview - Hidden on mobile, shown on large screens */}
        <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
          <div className="sticky top-8">
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-foreground">Live Preview</p>
              <p className="text-xs text-muted-foreground">Updates as you customize</p>
            </div>
            <PhoneMockup config={config} />
          </div>
        </div>
      </div>

      {/* Mobile: Full Phone Preview above buttons */}
      <div className="lg:hidden mt-8">
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-foreground">Live Preview</p>
          <p className="text-xs text-muted-foreground">Updates as you customize</p>
        </div>
        <div className="flex justify-center">
          <PhoneMockup config={config} />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-border/50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button variant="ghost" onClick={onBack} size="sm" className="gap-2 order-2 sm:order-1">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <Button 
            variant="accent" 
            onClick={onNext} 
            className="gap-2 shadow-lg lg:shadow-md ring-2 ring-background/50 lg:ring-0 order-1 sm:order-2 w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Preview App</span>
            <span className="sm:hidden">Next</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfigureStep;