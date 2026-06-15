"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Globe, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  Palette, 
  Layout, 
  Tag, 
  FileText, 
  Lightbulb,
  Check,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeWebsite } from "@/lib/api/analyze-website";
import type { AppConfig } from "@/stores/useAppStore";

// Sites known to block iframe embedding
const IFRAME_BLOCKED_DOMAINS = [
  "google.com", "google.", "youtube.com", "facebook.com", "fb.com",
  "instagram.com", "twitter.com", "x.com", "linkedin.com", "tiktok.com",
  "amazon.com", "netflix.com", "spotify.com", "apple.com", "microsoft.com",
  "bbc.com", "bbc.co.uk", "cnn.com", "nytimes.com", "washingtonpost.com",
  "paypal.com", "stripe.com", "bank", "chase.com", "wellsfargo.com",
  "dropbox.com", "onedrive.com", "icloud.com", "outlook.com", "gmail.com",
  "whatsapp.com", "telegram.org", "discord.com", "slack.com", "zoom.us",
  "ebay.com", "aliexpress.com", "alibaba.com", "walmart.com", "target.com",
];

const checkIframeBlocked = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return IFRAME_BLOCKED_DOMAINS.some(domain => 
      hostname.includes(domain) || hostname.endsWith(domain.replace(".", ""))
    );
  } catch {
    return false;
  }
};

interface AnalysisResult {
  appName: string;
  primaryColor: string;
  accentColor: string;
  navigationStyle: "tabs" | "drawer" | "bottom-nav";
  suggestedFeatures: string[];
  appCategory: string;
  description: string;
  iconStyle: string;
  splashScreenStyle: string;
  recommendations: string[];
  hideSelectors?: string;
  customNavItems?: { label: string; url: string; icon: string }[];
}

interface UrlInputStepProps {
  websiteUrl: string;
  onSubmit: (url: string) => void;
  onNext: () => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (value: boolean) => void;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

const UrlInputStep = ({
  websiteUrl,
  onSubmit,
  onNext,
  isAnalyzing,
  setIsAnalyzing,
  updateConfig,
}: UrlInputStepProps) => {
  const [url, setUrl] = useState(websiteUrl);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState<string>("");
  const { toast } = useToast();

  // Check if current URL is known to block iframes
  const iframeWarning = useMemo(() => {
    if (!url.trim()) return null;
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }
    try {
      return checkIframeBlocked(normalizedUrl);
    } catch {
      return false;
    }
  }, [url]);

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleAnalyze = async () => {
    let normalizedUrl = url.trim();
    
    // Add https:// if no protocol specified
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = "https://" + normalizedUrl;
    }

    if (!isValidUrl(normalizedUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid website URL",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    onSubmit(normalizedUrl);

    try {
      const response = await analyzeWebsite(normalizedUrl);

      if (response.error) {
        throw response.error;
      }

      if (response.data?.config) {
        const data = response.data;
        const result: AnalysisResult = {
          appName: data.config.app_name || "",
          primaryColor: data.config.primary_color || "#22D3EE",
          accentColor: data.config.accent_color || "#A855F7",
          navigationStyle: (data.config.navigation_style || "bottom-nav") as "tabs" | "drawer" | "bottom-nav",
          suggestedFeatures: data.config.features || [],
          appCategory: data.config.app_category || "",
          description: data.config.description || "",
          iconStyle: data.config.icon_style || "modern",
          splashScreenStyle: data.config.splash_screen_style || "centered-logo",
          recommendations: [],
          hideSelectors: data.config.hide_selectors || "",
          customNavItems: data.config.navigation_items || [],
        };
        
        setAnalysisResult(result);
        setAnalyzedUrl(normalizedUrl);

        toast({
          title: "Analysis Complete!",
          description: "Review the detected settings below.",
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMsg = error instanceof Error ? error.message : "Could not analyze the website.";
      const isCredits = errorMsg.toLowerCase().includes("credit");
      const isRateLimit = errorMsg.toLowerCase().includes("rate limit");
      toast({
        title: isCredits ? "AI Credits Exhausted" : isRateLimit ? "Rate Limited" : "Analysis Failed",
        description: isCredits
          ? "AI credits have been exhausted. Please add credits to your workspace to continue."
          : isRateLimit
          ? "Too many requests. Please wait a moment and try again."
          : errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAndContinue = () => {
    if (analysisResult) {
      updateConfig({
        websiteUrl: analyzedUrl,
        ...analysisResult,
      });
      onNext();
    }
  };

  const handleReanalyze = () => {
    setAnalysisResult(null);
    setAnalyzedUrl("");
  };

  const getNavigationLabel = (style: string) => {
    const labels: Record<string, string> = {
      "bottom-nav": "Bottom Navigation",
      "drawer": "Drawer Menu",
      "tabs": "Top Tabs",
    };
    return labels[style] || style;
  };

  // Show analysis results if available
  if (analysisResult) {
    return (
      <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-accent-foreground" />
          </div>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
            AI Analysis Complete
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here's what we detected from <span className="text-accent font-medium">{new URL(analyzedUrl).hostname}</span>
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          {/* App Identity */}
          <div className="bg-secondary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50 min-h-[300px]">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <h3 className="font-semibold text-sm sm:text-base text-foreground">App Identity</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">App Name</p>
                <p className="font-medium text-sm sm:text-base text-foreground">{analysisResult.appName || "Not detected"}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Category</p>
                <p className="font-medium text-sm sm:text-base text-foreground capitalize">{analysisResult.appCategory || "General"}</p>
              </div>
            </div>
            {analysisResult.description && (
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border/50">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-xs sm:text-sm text-muted-foreground italic">"{analysisResult.description}"</p>
              </div>
            )}
          </div>

          {/* Brand Colors */}
          <div className="bg-secondary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <h3 className="font-semibold text-sm sm:text-base text-foreground">Brand Colors Detected</h3>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border-2 border-white/20"
                  style={{ backgroundColor: analysisResult.primaryColor }}
                />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Primary</p>
                  <p className="font-mono text-xs sm:text-sm font-medium text-foreground uppercase">{analysisResult.primaryColor}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl shadow-lg border-2 border-white/20"
                  style={{ backgroundColor: analysisResult.accentColor }}
                />
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Accent</p>
                  <p className="font-mono text-xs sm:text-sm font-medium text-foreground uppercase">{analysisResult.accentColor}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Layout & Navigation */}
          <div className="bg-secondary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Layout className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <h3 className="font-semibold text-sm sm:text-base text-foreground">Recommended Layout</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Navigation Style</p>
                <p className="font-medium text-sm sm:text-base text-foreground">{getNavigationLabel(analysisResult.navigationStyle)}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">Icon Style</p>
                <p className="font-medium text-sm sm:text-base text-foreground capitalize">{analysisResult.iconStyle}</p>
              </div>
            </div>
          </div>

          {/* Suggested Features */}
          {analysisResult.suggestedFeatures.length > 0 && (
            <div className="bg-secondary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                <h3 className="font-semibold text-sm sm:text-base text-foreground">Suggested Features ({analysisResult.suggestedFeatures.length})</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {analysisResult.suggestedFeatures.map((feature, i) => (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-accent/10 text-accent text-xs sm:text-sm font-medium border border-accent/20"
                  >
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {analysisResult.recommendations.length > 0 && (
            <div className="bg-accent/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-accent/20">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                <h3 className="font-semibold text-sm sm:text-base text-foreground">AI Recommendations</h3>
              </div>
              <ul className="space-y-2">
                {analysisResult.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-accent flex-shrink-0 mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-4">
            <Button
              onClick={handleReanalyze}
              variant="outline"
              className="w-full sm:flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Different URL
            </Button>
            <Button
              onClick={handleApplyAndContinue}
              variant="accent"
              className="w-full sm:flex-1"
            >
              Apply & Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Globe className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-accent-foreground" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
          Enter Your Website URL
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground px-2">
          Our AI will analyze your website and suggest the perfect mobile app settings
        </p>
      </div>

      <div className="max-w-xl mx-auto space-y-4 sm:space-y-6">
        <div className="relative">
          <Globe className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://yourwebsite.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10 sm:pl-12 h-12 sm:h-14 text-base sm:text-lg bg-secondary/50 border-border/50 focus:border-primary"
            disabled={isAnalyzing}
          />
        </div>

        {/* Iframe Warning */}
        {iframeWarning && (
          <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-accent/10 border border-accent/30 rounded-lg sm:rounded-xl animate-fade-in">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-accent">Preview May Be Limited</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                This site typically blocks iframe embedding. AI analysis will still work, but the browser preview may show an error. Your built app will function normally.
              </p>
            </div>
          </div>
        )}

        <Button
          onClick={handleAnalyze}
          disabled={!url.trim() || isAnalyzing}
          variant="accent"
          size="lg"
          className="w-full h-12 sm:h-14 text-sm sm:text-base"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              Analyzing Website...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              Analyze with AI
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </>
          )}
        </Button>

        {/* What AI Detects */}
        {isAnalyzing && (
          <div className="bg-secondary/30 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-border/50 animate-fade-in">
            <p className="text-xs sm:text-sm text-muted-foreground text-center mb-2 sm:mb-3">AI is analyzing...</p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
              {[
                { icon: Palette, label: "Colors" },
                { icon: Layout, label: "Layout" },
                { icon: FileText, label: "Features" },
                { icon: Lightbulb, label: "Tips" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-0.5 sm:gap-1">
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-accent animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example URLs */}
        <div className="pt-4 sm:pt-6 border-t border-border/30">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 text-center">
            Try with these preview-compatible examples:
          </p>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
            {[
              { url: "wikipedia.org", label: "Wikipedia", desc: "Encyclopedia" },
              { url: "github.com", label: "GitHub", desc: "Developer platform" },
              { url: "reddit.com", label: "Reddit", desc: "Community forums" },
              { url: "stackoverflow.com", label: "Stack Overflow", desc: "Q&A for developers" },
              { url: "producthunt.com", label: "Product Hunt", desc: "Tech products" },
              { url: "dev.to", label: "DEV Community", desc: "Developer blog" },
            ].map((example) => (
              <button
                key={example.url}
                onClick={() => setUrl(`https://${example.url}`)}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left bg-secondary/30 hover:bg-secondary/50 rounded-lg sm:rounded-xl border border-border/30 hover:border-accent/30 transition-all group"
                disabled={isAnalyzing}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors flex-shrink-0">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{example.label}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{example.desc}</p>
                </div>
              </button>
            ))}
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground text-center mt-3 sm:mt-4">
            ⚠️ Some sites (BBC, Google, Facebook) block iframe preview but will work in the final app
          </p>
        </div>
      </div>
    </div>
  );
};

export default UrlInputStep;
