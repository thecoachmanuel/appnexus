"use client";

import { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Smartphone, RotateCcw, ExternalLink, Loader2, RefreshCw, Tablet, Monitor, ChevronDown, Camera, Play, X, Maximize2, Home, ArrowLeftCircle, Shield, AlertTriangle, LayoutGrid, Minimize2, ZoomIn, ZoomOut, Lock, Unlock, Sun, Moon } from "lucide-react";
import { proxyApi } from "@/lib/api";
import ShimmerSkeleton from "./configure/ShimmerSkeleton";
import DeviceComparisonMode from "./DeviceComparisonMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { AppConfig } from "@/stores/useAppStore";
import { useUserPreferencesStore } from "@/stores/useUserPreferencesStore";

interface PreviewStepProps {
  config: AppConfig;
  onBack: () => void;
  onNext: () => void;
}

interface DevicePreset {
  id: string;
  name: string;
  type: "phone" | "tablet" | "desktop";
  width: number;
  height: number;
  scale: number;
  notch: boolean;
  dynamicIsland?: boolean;
  borderRadius: number;
}

const devicePresets: DevicePreset[] = [
  // iPhones
  { id: "iphone-15-pro-max", name: "iPhone 15 Pro Max", type: "phone", width: 430, height: 932, scale: 0.32, notch: false, dynamicIsland: true, borderRadius: 55 },
  { id: "iphone-15-pro", name: "iPhone 15 Pro", type: "phone", width: 393, height: 852, scale: 0.35, notch: false, dynamicIsland: true, borderRadius: 55 },
  { id: "iphone-15", name: "iPhone 15", type: "phone", width: 393, height: 852, scale: 0.35, notch: false, dynamicIsland: true, borderRadius: 55 },
  { id: "iphone-14", name: "iPhone 14", type: "phone", width: 390, height: 844, scale: 0.35, notch: true, borderRadius: 47 },
  { id: "iphone-se", name: "iPhone SE", type: "phone", width: 375, height: 667, scale: 0.42, notch: false, borderRadius: 20 },
  
  // Android Phones
  { id: "galaxy-s24-ultra", name: "Samsung Galaxy S24 Ultra", type: "phone", width: 480, height: 1016, scale: 0.28, notch: false, borderRadius: 40 },
  { id: "galaxy-s24", name: "Samsung Galaxy S24", type: "phone", width: 412, height: 915, scale: 0.32, notch: false, borderRadius: 40 },
  { id: "pixel-8-pro", name: "Google Pixel 8 Pro", type: "phone", width: 448, height: 998, scale: 0.30, notch: false, borderRadius: 45 },
  { id: "pixel-8", name: "Google Pixel 8", type: "phone", width: 412, height: 915, scale: 0.32, notch: false, borderRadius: 45 },
  
  // Tablets
  { id: "ipad-pro-12", name: "iPad Pro 12.9\"", type: "tablet", width: 1024, height: 1366, scale: 0.28, notch: false, borderRadius: 24 },
  { id: "ipad-pro-11", name: "iPad Pro 11\"", type: "tablet", width: 834, height: 1194, scale: 0.34, notch: false, borderRadius: 24 },
  { id: "ipad-air", name: "iPad Air", type: "tablet", width: 820, height: 1180, scale: 0.34, notch: false, borderRadius: 24 },
  { id: "ipad-mini", name: "iPad Mini", type: "tablet", width: 744, height: 1133, scale: 0.36, notch: false, borderRadius: 20 },
  { id: "galaxy-tab-s9", name: "Samsung Galaxy Tab S9", type: "tablet", width: 753, height: 1205, scale: 0.34, notch: false, borderRadius: 20 },
  
  // Desktop
  { id: "macbook-pro-14", name: "MacBook Pro 14\"", type: "desktop", width: 1512, height: 982, scale: 0.35, notch: true, borderRadius: 12 },
  { id: "desktop-1080p", name: "Desktop 1080p", type: "desktop", width: 1920, height: 1080, scale: 0.28, notch: false, borderRadius: 8 },
  { id: "desktop-1440p", name: "Desktop 1440p", type: "desktop", width: 2560, height: 1440, scale: 0.21, notch: false, borderRadius: 8 },
];

// Sites known to block iframe embedding
const IFRAME_BLOCKED_DOMAINS = [
  "google.com", "google.", "youtube.com", "facebook.com", "fb.com",
  "instagram.com", "twitter.com", "x.com", "linkedin.com", "tiktok.com",
  "amazon.com", "netflix.com", "spotify.com", "apple.com", "microsoft.com",
  "bbc.com", "bbc.co.uk", "cnn.com", "nytimes.com", "washingtonpost.com",
  "paypal.com", "stripe.com", "chase.com", "wellsfargo.com",
  "dropbox.com", "onedrive.com", "icloud.com", "outlook.com", "gmail.com",
  "whatsapp.com", "telegram.org", "discord.com", "slack.com", "zoom.us",
  "ebay.com", "aliexpress.com", "alibaba.com", "walmart.com", "target.com",
];

const checkIfBlocked = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return IFRAME_BLOCKED_DOMAINS.some(domain => 
      hostname.includes(domain) || hostname.endsWith(domain.replace(".", ""))
    );
  } catch {
    return false;
  }
};

const PreviewStep = ({ config, onBack, onNext }: PreviewStepProps) => {
  const { devicePreview, setDevicePreview } = useUserPreferencesStore();
  
  // Find the device from presets based on saved ID
  const getDeviceById = (id: string) => devicePresets.find(d => d.id === id) || devicePresets[1];
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRotated, setIsRotated] = useState(devicePreview.isRotated);
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(getDeviceById(devicePreview.selectedDeviceId));
  const [iframeKey, setIframeKey] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testModeLoading, setTestModeLoading] = useState(true);
  const [testModeIframeKey, setTestModeIframeKey] = useState(0);
  const [testModeTheme, setTestModeTheme] = useState<"light" | "dark">("light");
  const [testModeRotated, setTestModeRotated] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [proxyLoading, setProxyLoading] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [mockupSize, setMockupSize] = useState<"small" | "medium" | "large">(devicePreview.mockupSize);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFullscreenLoading, setIsFullscreenLoading] = useState(true);
  const [fullscreenIframeKey, setFullscreenIframeKey] = useState(0);
  const [isOrientationLocked, setIsOrientationLocked] = useState(devicePreview.isOrientationLocked);
  const deviceFrameRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Persist preferences when they change
  useEffect(() => {
    setDevicePreview({
      selectedDeviceId: selectedDevice.id,
      isRotated,
      mockupSize,
      isOrientationLocked,
    });
  }, [selectedDevice.id, isRotated, mockupSize, isOrientationLocked, setDevicePreview]);

  // Check if URL is likely to be blocked and auto-enable proxy
  const isLikelyBlocked = config.websiteUrl ? checkIfBlocked(config.websiteUrl) : false;

  // Generate proxy URL when needed
  useEffect(() => {
    if (useProxy && config.websiteUrl) {
      setProxyLoading(true);
      setProxyUrl(null);
      
      const fetchProxiedContent = async () => {
        try {
          console.log('Fetching proxied content for:', config.websiteUrl);
          const { data, error } = await proxyApi.fetchPreview(config.websiteUrl);
          
          if (error) {
            console.error('Proxy API error:', error);
            throw error;
          }
          
          console.log('Proxy response:', data);
          
          // Handle JSON response with HTML content
          const responseData = data as { success?: boolean; html?: string; error?: string } | null;
          if (responseData && responseData.success && responseData.html) {
            const blob = new Blob([responseData.html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setProxyUrl(url);
            setIsLoading(false);
          } else if (responseData && responseData.success === false) {
            throw new Error(responseData.error || 'Proxy failed');
          } else {
            throw new Error('Unexpected response format');
          }
        } catch (err) {
          console.error('Proxy error:', err);
          toast({
            title: "Proxy Failed",
            description: "Could not load proxied preview. Some sites may still block access.",
            variant: "destructive"
          });
          setUseProxy(false);
          setIframeError(true);
        } finally {
          setProxyLoading(false);
        }
      };
      
      fetchProxiedContent();
    }
    
    // Cleanup blob URL
    return () => {
      if (proxyUrl) {
        URL.revokeObjectURL(proxyUrl);
      }
    };
  }, [useProxy, config.websiteUrl, iframeKey]);

  // Add timeout for loading state to prevent infinite loading
  useEffect(() => {
    if (isLoading && !proxyLoading) {
      const timeout = setTimeout(() => {
        setIsLoading(false);
        // Don't set error if iframe might have loaded silently
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isLoading, proxyLoading, iframeKey]);

  const handleEnableProxy = () => {
    setUseProxy(true);
    setIframeError(false);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeError(false);
    if (useProxy) {
      setProxyUrl(null);
      setProxyLoading(true);
      // Re-trigger the effect by incrementing key
    }
    setIframeKey((prev) => prev + 1);
  };

  const handleRotate = () => {
    if (!isOrientationLocked) {
      setIsRotated((prev) => !prev);
    }
  };

  const handleOpenExternal = () => {
    if (config.websiteUrl) {
      window.open(config.websiteUrl, "_blank");
    }
  };

  const handleDeviceChange = (device: DevicePreset) => {
    setSelectedDevice(device);
    setIsLoading(true);
    setIframeError(false);
    // Keep proxy state - don't reset when just changing device
    // Only reset proxy URL to force re-fetch if proxy is active
    if (useProxy) {
      setProxyUrl(null);
    }
    setIframeKey((prev) => prev + 1);
  };

  const handleFullscreenDeviceChange = (device: DevicePreset) => {
    setSelectedDevice(device);
    setIsFullscreenLoading(true);
    setFullscreenIframeKey((prev) => prev + 1);
  };

  const handleFullscreenIframeLoad = () => {
    setIsFullscreenLoading(false);
  };

  // Reset fullscreen loading when dialog opens
  useEffect(() => {
    if (isFullscreen) {
      setIsFullscreenLoading(true);
      setFullscreenIframeKey((prev) => prev + 1);
    }
  }, [isFullscreen]);

  const handleScreenshot = async () => {
    if (!deviceFrameRef.current) return;

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(deviceFrameRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${config.appName || "app"}-${selectedDevice.id}-preview.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);

          toast({
            title: "Screenshot Saved!",
            description: `Preview saved as ${config.appName || "app"}-${selectedDevice.id}-preview.png`,
          });
        }
      }, "image/png");
    } catch (error) {
      console.error("Screenshot error:", error);
      toast({
        title: "Screenshot Failed",
        description: "Could not capture the preview. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  // Calculate mockup dimensions based on selected device and size preference
  const deviceWidth = isRotated ? selectedDevice.height : selectedDevice.width;
  const deviceHeight = isRotated ? selectedDevice.width : selectedDevice.height;
  
  // Size scale factors - different for device types
  const getScaleForDevice = () => {
    const baseScales = {
      small: { phone: 0.45, tablet: 0.3, desktop: 0.25 },
      medium: { phone: 0.6, tablet: 0.4, desktop: 0.35 },
      large: { phone: 0.75, tablet: 0.55, desktop: 0.45 },
    };
    return baseScales[mockupSize][selectedDevice.type];
  };
  
  const mockupScale = isFullscreen ? 0.85 : getScaleForDevice();
  const mockupWidth = deviceWidth * mockupScale;
  const mockupHeight = deviceHeight * mockupScale;

  const phoneDevices = devicePresets.filter(d => d.type === "phone");
  const tabletDevices = devicePresets.filter(d => d.type === "tablet");
  const desktopDevices = devicePresets.filter(d => d.type === "desktop");

  const DeviceIcon = selectedDevice.type === "phone" ? Smartphone : selectedDevice.type === "tablet" ? Tablet : Monitor;

  // Check if device is an iPhone (for side button positioning)
  const isIPhone = selectedDevice.id.includes("iphone");
  const isAndroid = selectedDevice.type === "phone" && !isIPhone;

  return (
    <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 min-h-[300px]">
      <div className="text-center mb-4 sm:mb-6 md:mb-8">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-xl sm:rounded-2xl bg-accent flex items-center justify-center mx-auto mb-3 sm:mb-4 md:mb-6">
          <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-accent-foreground" />
        </div>
        <h2 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-1 sm:mb-2">
          Preview Your App
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground px-2">
          Interact with your website on real device dimensions
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Mockup Size Controls */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Size:</span>
            <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
              <Button
                variant={mockupSize === "small" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setMockupSize("small")}
              >
                <ZoomOut className="w-3 h-3 mr-1" />
                S
              </Button>
              <Button
                variant={mockupSize === "medium" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setMockupSize("medium")}
              >
                M
              </Button>
              <Button
                variant={mockupSize === "large" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setMockupSize("large")}
              >
                <ZoomIn className="w-3 h-3 mr-1" />
                L
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => setIsFullscreen(true)}
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            Fullscreen
          </Button>
        </div>

        {/* Device Mockup with Live Preview - Centered at top */}
        <div className="relative flex items-center justify-center py-4 overflow-x-auto">
          {/* Device Frame Container with Side Buttons */}
          <div 
            className="relative transition-all duration-300 flex-shrink-0"
            style={{
              width: mockupWidth,
              height: mockupHeight,
              maxWidth: selectedDevice.type === "desktop" ? "100%" : undefined,
            }}
          >
            {/* Side Buttons - iPhone style */}
            {selectedDevice.type === "phone" && isIPhone && !isRotated && (
              <>
                {/* Left - Silent switch */}
                <div className="absolute -left-[4px] top-[18%] w-[4px] h-[4%] bg-white rounded-l-[2px]" />
                {/* Left - Volume Up */}
                <div className="absolute -left-[4px] top-[24%] w-[4px] h-[7%] bg-white rounded-l-[2px]" />
                {/* Left - Volume Down */}
                <div className="absolute -left-[4px] top-[33%] w-[4px] h-[7%] bg-white rounded-l-[2px]" />
                {/* Right - Power */}
                <div className="absolute -right-[4px] top-[26%] w-[4px] h-[9%] bg-white rounded-r-[2px]" />
              </>
            )}

            {/* Side Buttons - Android style */}
            {selectedDevice.type === "phone" && isAndroid && !isRotated && (
              <>
                {/* Right - Volume */}
                <div className="absolute -right-[4px] top-[20%] w-[4px] h-[10%] bg-white rounded-r-[2px]" />
                {/* Right - Power */}
                <div className="absolute -right-[4px] top-[34%] w-[4px] h-[6%] bg-white rounded-r-[2px]" />
              </>
            )}

            {/* Tablet Side Buttons - Portrait */}
            {selectedDevice.type === "tablet" && !isRotated && (
              <>
                {/* Right - Power */}
                <div className="absolute -right-[4px] top-[12%] w-[4px] h-[5%] bg-white rounded-r-[2px]" />
                {/* Top - Volume Up */}
                <div className="absolute -top-[4px] right-[18%] h-[4px] w-[6%] bg-white rounded-t-[2px]" />
                {/* Top - Volume Down */}
                <div className="absolute -top-[4px] right-[26%] h-[4px] w-[6%] bg-white rounded-t-[2px]" />
              </>
            )}

            {/* Tablet Side Buttons - Landscape (rotated) */}
            {selectedDevice.type === "tablet" && isRotated && (
              <>
                {/* Top - Power */}
                <div className="absolute -top-[4px] left-[12%] h-[4px] w-[4%] bg-white rounded-t-[2px]" />
                {/* Right - Volume Up */}
                <div className="absolute -right-[4px] top-[18%] w-[4px] h-[5%] bg-white rounded-r-[2px]" />
                {/* Right - Volume Down */}
                <div className="absolute -right-[4px] top-[26%] w-[4px] h-[5%] bg-white rounded-r-[2px]" />
              </>
            )}
            {/* Device Frame - Premium white mockup */}
            <div 
              ref={deviceFrameRef}
              className="absolute inset-0 bg-gradient-to-br from-white via-[#f8f8f8] to-[#f0f0f0] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25),0_30px_60px_-30px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(0,0,0,0.05)] transition-all duration-300"
              style={{ 
                borderRadius: selectedDevice.borderRadius * mockupScale * 0.9,
                padding: selectedDevice.type === "phone" ? 8 : selectedDevice.type === "tablet" ? 12 : 6,
              }}
            >
              {/* Inner bezel highlight */}
              <div 
                className="absolute inset-[2px] pointer-events-none opacity-60"
                style={{
                  borderRadius: selectedDevice.borderRadius * mockupScale * 0.85,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)',
                }}
              />
              
              {/* Screen Area with Edge Highlight */}
              <div 
                className="w-full h-full bg-background overflow-hidden relative"
                style={{ 
                  borderRadius: selectedDevice.borderRadius * mockupScale * 0.7,
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08), inset 0 1px 2px rgba(0,0,0,0.06), inset 0 -1px 1px rgba(255,255,255,0.1)',
                }}
              >
                {/* Screen Bezel Edge Highlight */}
                <div 
                  className="absolute inset-0 pointer-events-none z-30"
                  style={{
                    borderRadius: selectedDevice.borderRadius * mockupScale * 0.7,
                    boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }}
                />
                {/* Screen Gloss/Reflection Effect */}
                {selectedDevice.type === "phone" && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-30"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 25%, transparent 45%, transparent 100%)',
                      borderRadius: selectedDevice.borderRadius * mockupScale * 0.7,
                    }}
                  />
                )}
              {/* Dynamic Island (iPhone 15+) with Camera */}
              {selectedDevice.dynamicIsland && !isRotated && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[25%] max-w-24 h-[3%] min-h-5 bg-black rounded-full z-20 flex items-center justify-start pl-1.5">
                  {/* Front Camera Lens */}
                  <div className="w-2 h-2 rounded-full bg-[#1a1a2e] border border-[#2a2a3e] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#3a3a5e]" />
                  </div>
                </div>
              )}
              
              {/* Notch (older iPhones) with Camera */}
              {selectedDevice.notch && selectedDevice.type === "phone" && !isRotated && !selectedDevice.dynamicIsland && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[35%] max-w-32 h-[3.5%] min-h-6 bg-black rounded-b-2xl z-20 flex items-center justify-center gap-2">
                  {/* Speaker */}
                  <div className="w-8 h-1 rounded-full bg-[#2a2a2a]" />
                  {/* Front Camera */}
                  <div className="w-2 h-2 rounded-full bg-[#1a1a2e] border border-[#2a2a3e] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-[#3a3a5e]" />
                  </div>
                </div>
              )}

              {/* MacBook Notch */}
              {selectedDevice.notch && selectedDevice.type === "desktop" && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-lg z-20" />
              )}
              
              {/* Status Bar (mobile only) */}
              {selectedDevice.type !== "desktop" && (
                <div 
                  className="h-6 flex items-center justify-between px-4 relative z-10" 
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <span className="text-[8px] font-medium text-white">9:41</span>
                  <span className="text-[8px] font-medium text-white">●●●● 100%</span>
                </div>
              )}

              {/* App Header (mobile only) */}
              {selectedDevice.type !== "desktop" && (
                <div className="px-3 py-1.5 relative z-10" style={{ backgroundColor: config.primaryColor }}>
                  <h3 className="text-xs font-bold text-white truncate">{config.appName || "AppNexus"}</h3>
                </div>
              )}

              {/* Live Website Iframe */}
              <div 
                className="relative" 
                style={{ 
                  height: selectedDevice.type === "desktop" 
                    ? "100%" 
                    : `calc(100% - 42px - ${config.navigationStyle === "bottom-nav" ? "36px" : "0px"})` 
                }}
              >
                <AnimatePresence>
                  {(isLoading || proxyLoading) && !iframeError && (
                    <motion.div 
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute inset-0 bg-background z-10 overflow-hidden"
                    >
                      {/* Device-specific Website Skeleton */}
                      <div className="w-full h-full flex flex-col">
                        
                        {/* Mobile Skeleton */}
                        {selectedDevice.type === "phone" && (
                          <>
                            {/* Mobile Header */}
                            <div className="h-8 bg-muted/50 flex items-center px-3 gap-2">
                              <ShimmerSkeleton className="w-4 h-4 rounded-full" />
                              <ShimmerSkeleton className="h-3 w-20" />
                              <div className="flex-1" />
                              <ShimmerSkeleton className="w-4 h-4 rounded" />
                            </div>
                            
                            {/* Mobile Hero */}
                            <div className="p-3 space-y-2">
                              <ShimmerSkeleton className="h-24 w-full rounded-lg" />
                              <ShimmerSkeleton className="h-4 w-3/4 mx-auto" />
                              <ShimmerSkeleton className="h-3 w-1/2 mx-auto" />
                            </div>
                            
                            {/* Mobile Content */}
                            <div className="px-3 space-y-3 flex-1">
                              <div className="flex gap-2">
                                <ShimmerSkeleton className="h-6 w-16 rounded-full" />
                                <ShimmerSkeleton className="h-6 w-20 rounded-full" />
                                <ShimmerSkeleton className="h-6 w-14 rounded-full" />
                              </div>
                              
                              {/* Mobile Cards (stacked) */}
                              <div className="space-y-2">
                                {[1, 2].map((i) => (
                                  <div key={i} className="flex gap-2 p-2 bg-muted/20 rounded-lg">
                                    <ShimmerSkeleton className="w-14 h-14 rounded-lg flex-shrink-0" />
                                    <div className="flex-1 space-y-1.5 py-1">
                                      <ShimmerSkeleton className="h-3 w-3/4" />
                                      <ShimmerSkeleton className="h-2 w-full" />
                                      <ShimmerSkeleton className="h-2 w-1/2" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Mobile Bottom Nav */}
                            <div className="h-10 bg-muted/30 flex items-center justify-around px-4 mt-auto">
                              {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col items-center gap-0.5">
                                  <ShimmerSkeleton className="w-4 h-4 rounded" />
                                  <ShimmerSkeleton className="w-6 h-1.5 rounded" />
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Tablet Skeleton */}
                        {selectedDevice.type === "tablet" && (
                          <>
                            {/* Tablet Header */}
                            <div className="h-10 bg-muted/50 flex items-center px-4 gap-3">
                              <ShimmerSkeleton className="w-6 h-6 rounded-lg" />
                              <ShimmerSkeleton className="h-4 w-32" />
                              <div className="flex-1" />
                              <ShimmerSkeleton className="h-6 w-24 rounded-full" />
                              <ShimmerSkeleton className="w-6 h-6 rounded-full" />
                            </div>
                            
                            <div className="flex flex-1">
                              {/* Tablet Sidebar */}
                              <div className="w-16 bg-muted/30 p-2 space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <ShimmerSkeleton key={i} className="w-10 h-10 rounded-lg mx-auto" />
                                ))}
                              </div>
                              
                              {/* Tablet Main Content */}
                              <div className="flex-1 p-4 space-y-4">
                                <ShimmerSkeleton className="h-32 w-full rounded-xl" />
                                <div className="grid grid-cols-3 gap-3">
                                  {[1, 2, 3].map((i) => (
                                    <div key={i} className="space-y-2">
                                      <ShimmerSkeleton className="h-20 w-full rounded-lg" />
                                      <ShimmerSkeleton className="h-3 w-3/4" />
                                      <ShimmerSkeleton className="h-2 w-1/2" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Desktop Skeleton */}
                        {selectedDevice.type === "desktop" && (
                          <>
                            {/* Desktop Header */}
                            <div className="h-12 bg-muted/50 flex items-center px-6 gap-4">
                              <ShimmerSkeleton className="w-8 h-8 rounded-lg" />
                              <ShimmerSkeleton className="h-4 w-24" />
                              <div className="flex-1 flex items-center justify-center gap-6">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <ShimmerSkeleton key={i} className="h-3 w-16" />
                                ))}
                              </div>
                              <ShimmerSkeleton className="h-8 w-24 rounded-full" />
                              <ShimmerSkeleton className="w-8 h-8 rounded-full" />
                            </div>
                            
                            {/* Desktop Hero */}
                            <div className="p-8">
                              <ShimmerSkeleton className="h-48 w-full rounded-2xl" />
                            </div>
                            
                            {/* Desktop Content Grid */}
                            <div className="px-8 pb-8">
                              <div className="grid grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                  <div key={i} className="space-y-3">
                                    <ShimmerSkeleton className="h-32 w-full rounded-xl" />
                                    <ShimmerSkeleton className="h-4 w-3/4" />
                                    <ShimmerSkeleton className="h-3 w-1/2" />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {iframeError && !useProxy && (
                  <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center p-4 text-center z-10">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">This site blocks embedding</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={handleEnableProxy}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Try Proxy
                    </Button>
                  </div>
                )}

                {iframeError && useProxy && (
                  <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center p-4 text-center z-10">
                    <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
                    <p className="text-xs text-muted-foreground mb-2">Preview unavailable</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={handleOpenExternal}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open Site
                    </Button>
                  </div>
                )}

                {config.websiteUrl && (
                  <div className="w-full h-full overflow-hidden">
                    <iframe
                      key={iframeKey}
                      src={useProxy && proxyUrl ? proxyUrl : config.websiteUrl}
                      className="border-0"
                      title="Website Preview"
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      style={{ 
                        width: deviceWidth,
                        height: deviceHeight,
                        transform: `scale(${mockupScale})`,
                        transformOrigin: "top left",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Bottom Navigation Preview (mobile only) */}
              {selectedDevice.type !== "desktop" && config.navigationStyle === "bottom-nav" && (
                <div className="h-9 flex items-center justify-around px-4 bg-card border-t border-border">
                  {["Home", "Search", "Profile", "Menu"].map((item, i) => (
                    <div key={item} className="flex flex-col items-center gap-0.5">
                      <div 
                        className="w-4 h-4 rounded-sm" 
                        style={{ backgroundColor: i === 0 ? config.primaryColor : "hsl(var(--muted))" }}
                      />
                      <span 
                        className="text-[6px]" 
                        style={{ color: i === 0 ? config.primaryColor : "hsl(var(--muted-foreground))" }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Home Indicator - iPhone style */}
              {selectedDevice.type === "phone" && !isRotated && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[35%] max-w-32 h-1.5 bg-foreground/80 rounded-full z-20" />
              )}
              {/* Home Indicator - Phone Landscape */}
              {selectedDevice.type === "phone" && isRotated && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[20%] max-w-24 h-1 bg-foreground/80 rounded-full z-20" />
              )}
              {/* Home Indicator - Tablet Portrait (iPad-style) */}
              {selectedDevice.type === "tablet" && !isRotated && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[25%] max-w-40 h-1.5 bg-foreground/70 rounded-full z-20" />
              )}
              {/* Home Indicator - Tablet Landscape (iPad-style) */}
              {selectedDevice.type === "tablet" && isRotated && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[15%] max-w-32 h-1.5 bg-foreground/70 rounded-full z-20" />
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Info Cards - 2 column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto w-full">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Device Selector Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h4 className="font-display font-semibold text-foreground text-sm">Device</h4>
              </div>
              <div className="p-4 space-y-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-11">
                      <div className="flex items-center gap-2.5">
                        <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{selectedDevice.name}</span>
                      </div>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" /> Phones
                    </DropdownMenuLabel>
                    {phoneDevices.map((device) => (
                      <DropdownMenuItem 
                        key={device.id} 
                        onClick={() => handleDeviceChange(device)}
                        className={selectedDevice.id === device.id ? "bg-primary/10" : ""}
                      >
                        {device.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {device.width}×{device.height}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Tablet className="w-4 h-4" /> Tablets
                    </DropdownMenuLabel>
                    {tabletDevices.map((device) => (
                      <DropdownMenuItem 
                        key={device.id} 
                        onClick={() => handleDeviceChange(device)}
                        className={selectedDevice.id === device.id ? "bg-primary/10" : ""}
                      >
                        {device.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {device.width}×{device.height}
                        </span>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" /> Desktop
                    </DropdownMenuLabel>
                    {desktopDevices.map((device) => (
                      <DropdownMenuItem 
                        key={device.id} 
                        onClick={() => handleDeviceChange(device)}
                        className={selectedDevice.id === device.id ? "bg-primary/10" : ""}
                      >
                        {device.name}
                        <span className="ml-auto text-xs text-muted-foreground">
                          {device.width}×{device.height}
                        </span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Device Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>{selectedDevice.width} × {selectedDevice.height}px</span>
                  <span className="capitalize px-2 py-0.5 bg-muted rounded-full">{selectedDevice.type}</span>
                </div>
              </div>
            </div>

            {/* App Configuration Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h4 className="font-display font-semibold text-foreground text-sm">Configuration</h4>
              </div>
              <div className="p-4">
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Website</dt>
                    <dd className="text-foreground font-medium truncate max-w-[180px] text-right">{config.websiteUrl}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="text-foreground font-medium capitalize">{config.appCategory || "General"}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Navigation</dt>
                    <dd className="text-foreground font-medium capitalize">{config.navigationStyle?.replace("-", " ") || "Bottom Nav"}</dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">Splash Style</dt>
                    <dd className="text-foreground font-medium capitalize">{config.splashScreenStyle?.replace("-", " ") || "Centered Logo"}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Colors</dt>
                    <dd className="flex gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-border shadow-sm" 
                        style={{ backgroundColor: config.primaryColor }} 
                        title="Primary Color"
                      />
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-border shadow-sm" 
                        style={{ backgroundColor: config.accentColor }} 
                        title="Accent Color"
                      />
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Enabled Features Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h4 className="font-display font-semibold text-foreground text-sm">Features</h4>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {config.suggestedFeatures.length > 0 ? (
                    config.suggestedFeatures.slice(0, 5).map((feature) => (
                      <span 
                        key={feature} 
                        className="px-2.5 py-1 bg-muted text-foreground text-xs font-medium rounded-full border border-border"
                      >
                        {feature}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-sm">No features selected</span>
                  )}
                  {config.suggestedFeatures.length > 5 && (
                    <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      +{config.suggestedFeatures.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* App Identity Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <h4 className="font-display font-semibold text-foreground text-sm">App Identity</h4>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-4">
                  {/* App Icon Preview */}
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ 
                      background: config.iconStyle === "gradient" 
                        ? `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})`
                        : config.primaryColor 
                    }}
                  >
                    <span className="text-2xl font-bold text-white">
                      {(config.appName || "A")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-foreground text-lg mb-1">{config.appName || "AppNexus"}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{config.iconStyle || "Modern"} icon style</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{config.splashScreenStyle?.replace("-", " ") || "Centered"} splash</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Proxy Mode Warning */}
            {isLikelyBlocked && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-500">Site May Block Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This site typically blocks iframe embedding. 
                    {useProxy ? " Proxy mode is active." : " Try proxy mode for a preview."}
                  </p>
                  {!useProxy && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-xs h-7"
                      onClick={handleEnableProxy}
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Enable Proxy Mode
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions - 2 column at bottom */}
        <div className="max-w-3xl mx-auto w-full">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 space-y-3">
              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="default" 
                  size="lg"
                  className="h-12 font-medium"
                  onClick={() => {
                    setIsTestMode(true);
                    setTestModeLoading(true);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Test App
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="h-12 font-medium"
                  onClick={handleScreenshot} 
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 mr-2" />
                  )}
                  Screenshot
                </Button>
              </div>

              {/* Secondary Actions */}
              <div className="grid grid-cols-5 gap-1 pt-2 border-t border-border">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-12 flex-col gap-1 px-1 rounded-xl hover:bg-muted ${isOrientationLocked ? "opacity-50 cursor-not-allowed" : ""}`} 
                  onClick={handleRotate}
                  disabled={isOrientationLocked}
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Rotate</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`h-12 flex-col gap-1 px-1 rounded-xl hover:bg-muted ${isOrientationLocked ? "bg-primary/10" : ""}`} 
                  onClick={() => setIsOrientationLocked(!isOrientationLocked)}
                >
                  {isOrientationLocked ? (
                    <Lock className="w-4 h-4 text-primary" />
                  ) : (
                    <Unlock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={`text-[10px] ${isOrientationLocked ? "text-primary" : "text-muted-foreground"}`}>
                    {isOrientationLocked ? "Locked" : "Lock"}
                  </span>
                </Button>
                <Button variant="ghost" size="sm" className="h-12 flex-col gap-1 px-1 rounded-xl hover:bg-muted" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Refresh</span>
                </Button>
                {useProxy ? (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-12 flex-col gap-1 px-1 rounded-xl hover:bg-muted"
                    onClick={() => {
                      setUseProxy(false);
                      setProxyUrl(null);
                      setIframeError(false);
                      setIsLoading(true);
                      setIframeKey(prev => prev + 1);
                    }}
                  >
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Direct</span>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="h-12 flex-col gap-1 px-1 rounded-xl hover:bg-muted" onClick={handleOpenExternal}>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Open</span>
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-12 flex-col gap-1 px-1 rounded-xl hover:bg-muted" onClick={() => setIsComparisonMode(true)}>
                  <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Compare</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Comparison Mode */}
      {isComparisonMode && (
        <DeviceComparisonMode
          config={config}
          devicePresets={devicePresets}
          onClose={() => setIsComparisonMode(false)}
        />
      )}

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 gap-0 bg-zinc-950/95 border-zinc-800 backdrop-blur-xl overflow-auto">
          {/* Fullscreen Header */}
          <div className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }}
              >
                <span className="text-white text-sm font-bold">
                  {(config.appName || "A")[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">{config.appName || "App Preview"}</h3>
                <p className="text-zinc-400 text-xs">{selectedDevice.name} • {deviceWidth}×{deviceHeight}px</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8">
                    <DeviceIcon className="w-4 h-4 mr-2" />
                    {selectedDevice.name}
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Phones</DropdownMenuLabel>
                  {phoneDevices.map((device) => (
                    <DropdownMenuItem key={device.id} onClick={() => handleFullscreenDeviceChange(device)}>
                      <Smartphone className="w-4 h-4 mr-2" />
                      {device.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Tablets</DropdownMenuLabel>
                  {tabletDevices.map((device) => (
                    <DropdownMenuItem key={device.id} onClick={() => handleFullscreenDeviceChange(device)}>
                      <Tablet className="w-4 h-4 mr-2" />
                      {device.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Desktop</DropdownMenuLabel>
                  {desktopDevices.map((device) => (
                    <DropdownMenuItem key={device.id} onClick={() => handleFullscreenDeviceChange(device)}>
                      <Monitor className="w-4 h-4 mr-2" />
                      {device.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white h-8"
                onClick={() => setIsFullscreen(false)}
              >
                <Minimize2 className="w-4 h-4 mr-1" />
                Exit
              </Button>
            </div>
          </div>
          
          {/* Fullscreen Preview Content */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div 
              className="relative bg-gradient-to-br from-white via-[#f8f8f8] to-[#f0f0f0] shadow-2xl transition-all duration-300"
              style={{
                width: Math.min(mockupWidth, window.innerWidth - 100),
                height: Math.min(mockupHeight, window.innerHeight - 150),
                borderRadius: selectedDevice.borderRadius * mockupScale * 0.9,
                padding: selectedDevice.type === "phone" ? 8 : selectedDevice.type === "tablet" ? 12 : 6,
              }}
            >
              <div 
                className="w-full h-full bg-background overflow-hidden relative"
                style={{ borderRadius: selectedDevice.borderRadius * mockupScale * 0.7 }}
              >
                {/* Loading Overlay */}
                <AnimatePresence>
                  {isFullscreenLoading && (
                    <motion.div
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0 z-10 bg-background flex flex-col items-center justify-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading preview...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {config.websiteUrl && (
                  <div className="w-full h-full overflow-hidden">
                    <iframe
                      key={fullscreenIframeKey}
                      src={useProxy && proxyUrl ? proxyUrl : config.websiteUrl}
                      className="border-0"
                      title="Fullscreen Preview"
                      onLoad={handleFullscreenIframeLoad}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      style={{
                        width: deviceWidth,
                        height: deviceHeight,
                        transform: `scale(${mockupScale})`,
                        transformOrigin: "top left",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Browser App Test Mode Dialog */}
      <Dialog open={isTestMode} onOpenChange={setIsTestMode}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 gap-0 bg-zinc-950 border-zinc-800">
          {/* Test Mode Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-4 py-3 border-b border-zinc-800 bg-zinc-900">
            {/* App Info */}
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }}
                >
                  <span className="text-white text-sm font-bold">
                    {(config.appName || "A")[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-sm truncate">{config.appName || "App Preview"}</h3>
                  <p className="text-xs text-zinc-400 hidden sm:block">Browser App Test Mode</p>
                </div>
              </div>
              {/* Close button - mobile only, in top row */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:text-white sm:hidden"
                onClick={() => setIsTestMode(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Controls Row */}
            <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 overflow-x-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white text-xs sm:text-sm px-2 sm:px-3 h-8">
                    <Smartphone className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{selectedDevice.name}</span>
                    <span className="sm:hidden max-w-[80px] truncate">{selectedDevice.name.split(" ").pop()}</span>
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel>Select Device</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {devicePresets.map((device) => (
                    <DropdownMenuItem 
                      key={device.id} 
                      onClick={() => {
                        setSelectedDevice(device);
                        setTestModeLoading(true);
                        setTestModeIframeKey((prev) => prev + 1);
                      }}
                      className={selectedDevice.id === device.id ? "bg-primary/10" : ""}
                    >
                      {device.type === "phone" ? <Smartphone className="w-3 h-3 mr-2" /> : 
                       device.type === "tablet" ? <Tablet className="w-3 h-3 mr-2" /> : 
                       <Monitor className="w-3 h-3 mr-2" />}
                      {device.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white h-8 w-8 p-0"
                onClick={() => setTestModeRotated(!testModeRotated)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white h-8 w-8 p-0"
                onClick={() => setTestModeTheme(testModeTheme === "light" ? "dark" : "light")}
              >
                {testModeTheme === "light" ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
              </Button>
              {/* Close button - desktop only */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 hover:text-white hidden sm:flex h-8 w-8 p-0"
                onClick={() => setIsTestMode(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Test Mode Content */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 overflow-auto">
            {/* Device Frame */}
            <div 
              className={`relative p-3 shadow-2xl transition-all duration-300 ${
                testModeTheme === "light" 
                  ? "bg-gradient-to-b from-white via-zinc-100 to-zinc-200" 
                  : "bg-gradient-to-b from-zinc-700 to-zinc-800"
              }`}
              style={{ 
                width: Math.min(
                  (testModeRotated ? selectedDevice.height : selectedDevice.width) * 0.8, 
                  window.innerWidth * 0.7
                ),
                height: Math.min(
                  (testModeRotated ? selectedDevice.width : selectedDevice.height) * 0.8, 
                  window.innerHeight * 0.75
                ),
                borderRadius: selectedDevice.borderRadius * 0.8,
              }}
            >
              {/* Inner bezel */}
              <div 
                className={`w-full h-full relative overflow-hidden transition-colors duration-300 ${
                  testModeTheme === "light" ? "bg-zinc-100" : "bg-black"
                }`}
                style={{ borderRadius: selectedDevice.borderRadius * 0.7 }}
              >
                {/* Dynamic Island / Notch - only show in portrait */}
                {selectedDevice.dynamicIsland && !testModeRotated && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-30 border border-zinc-800" />
                )}
                {selectedDevice.notch && selectedDevice.type === "phone" && !selectedDevice.dynamicIsland && !testModeRotated && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-8 bg-black rounded-b-3xl z-30" />
                )}

                {/* Status Bar - hide in landscape */}
                {selectedDevice.type !== "desktop" && !testModeRotated && (
                  <div 
                    className="absolute top-0 left-0 right-0 h-10 flex items-end justify-between px-6 pb-1 z-20"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <span className="text-xs font-medium text-white">9:41</span>
                    <div className="flex items-center gap-1 text-white">
                      <span className="text-[10px]">●●●●</span>
                      <span className="text-[10px]">📶</span>
                      <span className="text-[10px]">🔋</span>
                    </div>
                  </div>
                )}

                {/* App Header - hide in landscape */}
                {selectedDevice.type !== "desktop" && !testModeRotated && (
                  <div 
                    className="absolute left-0 right-0 h-12 flex items-center justify-between px-4 z-20"
                    style={{ 
                      top: 40,
                      backgroundColor: config.primaryColor 
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowLeftCircle className="w-5 h-5 text-white/70" />
                      <span className="font-semibold text-white">{config.appName || "AppNexus"}</span>
                    </div>
                    <Home className="w-5 h-5 text-white/70" />
                  </div>
                )}

                {/* Loading State */}
                {testModeLoading && (
                  <div className={`absolute inset-0 flex items-center justify-center z-40 transition-colors duration-300 ${
                    testModeTheme === "light" ? "bg-zinc-100" : "bg-black"
                  }`}>
                    <div className="text-center">
                      <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
                      <p className={`text-sm ${testModeTheme === "light" ? "text-zinc-600" : "text-zinc-400"}`}>
                        Loading app preview...
                      </p>
                    </div>
                  </div>
                )}

                {/* Live iframe */}
                {config.websiteUrl && (
                  <iframe
                    key={testModeIframeKey}
                    src={config.websiteUrl}
                    className="w-full h-full border-0"
                    onLoad={() => setTestModeLoading(false)}
                    title="App Test Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                    style={{
                      paddingTop: selectedDevice.type !== "desktop" && !testModeRotated ? 92 : 0,
                      paddingBottom: config.navigationStyle === "bottom-nav" && selectedDevice.type !== "desktop" && !testModeRotated ? 56 : 0,
                    }}
                  />
                )}

                {/* Bottom Navigation - hide in landscape */}
                {selectedDevice.type !== "desktop" && config.navigationStyle === "bottom-nav" && !testModeRotated && (
                  <div 
                    className={`absolute bottom-0 left-0 right-0 h-14 flex items-center justify-around px-4 z-20 transition-colors duration-300 ${
                      testModeTheme === "light" 
                        ? "bg-white border-t border-zinc-200" 
                        : "bg-zinc-900 border-t border-zinc-700"
                    }`}
                  >
                    {["🏠", "🔍", "❤️", "👤"].map((icon, i) => (
                      <button 
                        key={i}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                          testModeTheme === "light" ? "hover:bg-zinc-100" : "hover:bg-zinc-800"
                        }`}
                      >
                        <span className="text-lg">{icon}</span>
                        <span 
                          className="text-[9px]"
                          style={{ color: i === 0 ? config.primaryColor : testModeTheme === "light" ? "#9CA3AF" : "#6B7280" }}
                        >
                          {["Home", "Search", "Saved", "Profile"][i]}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Home Indicator (iOS) - adjust for landscape */}
                {selectedDevice.type === "phone" && (
                  <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full z-30 ${
                    testModeRotated ? "w-24 h-1" : "w-32 h-1"
                  } ${
                    testModeTheme === "light" ? "bg-black/20" : "bg-white/30"
                  }`} />
                )}
              </div>
            </div>
          </div>

          {/* Test Mode Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-3 border-t border-zinc-800 bg-zinc-900">
            <p className="text-[10px] sm:text-xs text-zinc-500 text-center sm:text-left">
              Interactive preview • Touch and scroll to test
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 text-xs h-8 px-2 sm:px-3"
                onClick={() => {
                  setTestModeLoading(true);
                  setTestModeIframeKey((prev) => prev + 1);
                }}
              >
                <RefreshCw className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Reload</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-400 text-xs h-8 px-2 sm:px-3"
                onClick={handleOpenExternal}
              >
                <Maximize2 className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Fullscreen</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 sm:pt-6 md:pt-8 mt-4 sm:mt-6 md:mt-8 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="w-full sm:w-auto order-2 sm:order-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configure
        </Button>
        <Button variant="accent" onClick={onNext} className="w-full sm:w-auto order-1 sm:order-2">
          Build App
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PreviewStep;
