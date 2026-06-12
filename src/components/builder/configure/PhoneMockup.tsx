"use client";

import { useState } from "react";
import { Wifi, Battery, Signal, Smartphone, Tablet, Home, Search, User, Menu, Heart, Bell, Settings, ShoppingBag, MessageCircle, Sun, Moon } from "lucide-react";
import type { AppConfig, NavItem } from "@/stores/useAppStore";
import { getIconComponent } from "./NavItemEditor";

type DeviceType = "iphone" | "android" | "tablet";
type PreviewTheme = "light" | "dark";

interface PhoneMockupProps {
  config: AppConfig;
}

const deviceOptions: { value: DeviceType; label: string; icon: typeof Smartphone }[] = [
  { value: "iphone", label: "iPhone", icon: Smartphone },
  { value: "android", label: "Android", icon: Smartphone },
  { value: "tablet", label: "Tablet", icon: Tablet },
];

const PhoneMockup = ({ config }: PhoneMockupProps) => {
  const [device, setDevice] = useState<DeviceType>("iphone");
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>("light");

  const getDefaultNavItems = (): NavItem[] => {
    const category = config.appCategory?.toLowerCase() || "";
    
    if (category.includes("shop") || category.includes("ecommerce") || category.includes("store")) {
      return [
        { icon: "Home", label: "Home" },
        { icon: "Search", label: "Search" },
        { icon: "Heart", label: "Wishlist" },
        { icon: "ShoppingBag", label: "Cart" },
        { icon: "User", label: "Account" },
      ];
    }
    
    if (category.includes("social") || category.includes("chat") || category.includes("community")) {
      return [
        { icon: "Home", label: "Feed" },
        { icon: "Search", label: "Discover" },
        { icon: "MessageCircle", label: "Messages" },
        { icon: "Bell", label: "Alerts" },
        { icon: "User", label: "Profile" },
      ];
    }
    
    if (category.includes("news") || category.includes("blog") || category.includes("content")) {
      return [
        { icon: "Home", label: "Home" },
        { icon: "Search", label: "Search" },
        { icon: "Heart", label: "Saved" },
        { icon: "Bell", label: "Updates" },
        { icon: "User", label: "Profile" },
      ];
    }
    
    return [
      { icon: "Home", label: "Home" },
      { icon: "Search", label: "Search" },
      { icon: "Bell", label: "Alerts" },
      { icon: "Settings", label: "Settings" },
      { icon: "User", label: "Profile" },
    ];
  };

  const getDefaultTabLabels = (): string[] => {
    const category = config.appCategory?.toLowerCase() || "";
    
    if (category.includes("shop") || category.includes("ecommerce") || category.includes("store")) {
      return ["Featured", "Categories", "Deals", "New"];
    }
    if (category.includes("social") || category.includes("chat") || category.includes("community")) {
      return ["For You", "Following", "Trending"];
    }
    if (category.includes("news") || category.includes("blog") || category.includes("content")) {
      return ["Top Stories", "Local", "World"];
    }
    return ["Home", "Explore", "Activity"];
  };

  // Use custom items if defined, otherwise use defaults
  const navItems = config.customNavItems || getDefaultNavItems();
  const tabLabels = config.customTabLabels || getDefaultTabLabels();

  const renderNavigation = () => {
    if (config.navigationStyle === "tabs") {
      return (
        <div 
          className="flex border-b"
          style={{ borderColor: `${config.primaryColor}30` }}
        >
          {tabLabels.map((label, i) => (
            <div 
              key={label}
              className="flex-1 py-2 text-center text-[10px] font-medium transition-colors"
              style={{ 
                color: i === 0 ? config.primaryColor : "#9CA3AF",
                borderBottom: i === 0 ? `2px solid ${config.primaryColor}` : "none"
              }}
            >
              {label}
            </div>
          ))}
        </div>
      );
    }

    if (config.navigationStyle === "drawer") {
      return (
        <div className="flex items-center justify-between px-3 py-2 bg-black/5">
          <Menu className="w-4 h-4" style={{ color: config.primaryColor }} />
          <span className="text-[10px] font-semibold" style={{ color: config.primaryColor }}>
            {config.appName || "My App"}
          </span>
          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: config.accentColor }} />
        </div>
      );
    }

    // bottom-nav (default)
    return null;
  };

  const renderBottomNav = () => {
    if (config.navigationStyle !== "bottom-nav") return null;

    const isDark = previewTheme === "dark";
    const bgClass = isDark ? "bg-zinc-900/95" : "bg-white/90";
    const inactiveColor = isDark ? "#6B7280" : "#9CA3AF";

    return (
      <div 
        className={`flex items-center justify-around py-2 border-t backdrop-blur-sm ${bgClass}`}
        style={{ borderColor: `${config.primaryColor}20` }}
      >
        {navItems.map((item, i) => {
          const Icon = getIconComponent(item.icon);
          return (
            <div key={`${item.label}-${i}`} className="flex flex-col items-center gap-0.5">
              <Icon 
                className="w-4 h-4" 
                style={{ color: i === 0 ? config.primaryColor : inactiveColor }}
                strokeWidth={i === 0 ? 2.5 : 2}
              />
              <span 
                className="text-[7px] font-medium"
                style={{ color: i === 0 ? config.primaryColor : inactiveColor }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderAppIcon = () => {
    if (config.customIcon) {
      return (
        <img 
          src={config.customIcon} 
          alt="App icon" 
          className="w-full h-full object-cover"
        />
      );
    }

    const baseClass = "w-full h-full flex items-center justify-center";
    
    switch (config.iconStyle) {
      case "modern":
        return (
          <div 
            className={baseClass}
            style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }}
          >
            <span className="text-white text-lg font-bold">
              {(config.appName || "A")[0].toUpperCase()}
            </span>
          </div>
        );
      case "gradient":
        return (
          <div 
            className={baseClass}
            style={{ background: `linear-gradient(90deg, ${config.primaryColor}, ${config.accentColor})` }}
          >
            <span className="text-white text-lg font-bold">
              {(config.appName || "A")[0].toUpperCase()}
            </span>
          </div>
        );
      case "outlined":
        return (
          <div 
            className={`${baseClass} border-2`}
            style={{ borderColor: config.primaryColor, backgroundColor: "white" }}
          >
            <span className="text-lg font-bold" style={{ color: config.primaryColor }}>
              {(config.appName || "A")[0].toUpperCase()}
            </span>
          </div>
        );
      default: // classic
        return (
          <div 
            className={baseClass}
            style={{ backgroundColor: config.primaryColor }}
          >
            <span className="text-white text-lg font-bold">
              {(config.appName || "A")[0].toUpperCase()}
            </span>
          </div>
        );
    }
  };

  const renderSplashPreview = () => {
    const isDark = previewTheme === "dark";
    const splashStyle = config.splashScreenStyle;

    // Full Screen - full bleed design with primary color background
    if (splashStyle === "fullscreen" || splashStyle === "gradient") {
      return (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${config.primaryColor}, ${config.accentColor})` }}
        >
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl bg-white/20 backdrop-blur-sm">
            {renderAppIcon()}
          </div>
          <p className="mt-2 text-white text-xs font-medium drop-shadow">
            {config.appName || "My App"}
          </p>
        </div>
      );
    }

    // Minimal - simple & clean with logo at bottom
    if (splashStyle === "minimal") {
      return (
        <div className={`absolute inset-0 flex flex-col items-center justify-end pb-16 ${isDark ? "bg-zinc-900" : "bg-white"}`}>
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
            {renderAppIcon()}
          </div>
        </div>
      );
    }

    // Animated - with loading dots
    if (splashStyle === "animated") {
      return (
        <div className={`absolute inset-0 flex flex-col items-center justify-center ${isDark ? "bg-zinc-900" : "bg-white"}`}>
          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
            {renderAppIcon()}
          </div>
          <p className={`mt-2 text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            {config.appName || "My App"}
          </p>
          <div className="flex gap-1.5 mt-3">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.primaryColor, opacity: 0.8 }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.primaryColor, opacity: 0.5, animationDelay: "0.2s" }} />
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: config.primaryColor, opacity: 0.3, animationDelay: "0.4s" }} />
          </div>
        </div>
      );
    }

    // Default: centered-logo - logo in center
    return (
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${isDark ? "bg-zinc-900" : "bg-white"}`}>
        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg">
          {renderAppIcon()}
        </div>
        <p className={`mt-2 text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
          {config.appName || "My App"}
        </p>
      </div>
    );
  };

  // Device dimensions and styles
  const getDeviceStyles = () => {
    const isLightMode = previewTheme === "light";
    
    switch (device) {
      case "android":
        return {
          width: "w-[200px]",
          height: "h-[400px]",
          outerRadius: "rounded-[28px]",
          innerRadius: "rounded-[24px]",
          screenRadius: "rounded-[20px]",
          shellColor: isLightMode ? "bg-white" : "bg-zinc-900",
          shellShadow: isLightMode ? "shadow-[0_8px_40px_rgba(0,0,0,0.12)]" : "shadow-2xl",
          notch: (
            // Android punch-hole camera
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[6px] h-[6px] rounded-full ${isLightMode ? "bg-gray-300" : "bg-zinc-700"}`} />
          ),
          buttons: (
            <>
              <div className={`absolute -right-0.5 top-20 w-1 h-14 rounded-r ${isLightMode ? "bg-gray-200" : "bg-zinc-700"}`} />
              <div className={`absolute -right-0.5 top-38 w-1 h-8 rounded-r ${isLightMode ? "bg-gray-200" : "bg-zinc-700"}`} />
            </>
          ),
          time: "12:30",
        };
      case "tablet":
        return {
          width: "w-[280px]",
          height: "h-[380px]",
          outerRadius: "rounded-[28px]",
          innerRadius: "rounded-[24px]",
          screenRadius: "rounded-[20px]",
          shellColor: isLightMode ? "bg-white" : "bg-gradient-to-b from-zinc-800 to-zinc-900",
          shellShadow: isLightMode ? "shadow-[0_8px_40px_rgba(0,0,0,0.12)]" : "shadow-2xl",
          notch: (
            // Tablet front camera - centered at top
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[8px] h-[8px] rounded-full ${isLightMode ? "bg-gray-300" : "bg-zinc-700"}`} />
          ),
          buttons: (
            <>
              <div className={`absolute -right-0.5 top-8 w-1 h-10 rounded-r ${isLightMode ? "bg-gray-200" : "bg-zinc-700"}`} />
              <div className={`absolute -top-0.5 right-20 h-1 w-10 rounded-t ${isLightMode ? "bg-gray-200" : "bg-zinc-700"}`} />
            </>
          ),
          time: "9:41",
        };
      default: // iphone
        return {
          width: "w-[200px]",
          height: "h-[400px]",
          outerRadius: "rounded-[36px]",
          innerRadius: "rounded-[30px]",
          screenRadius: "rounded-[26px]",
          shellColor: isLightMode ? "bg-white" : "bg-gradient-to-b from-zinc-800 to-zinc-900",
          shellShadow: isLightMode ? "shadow-[0_8px_40px_rgba(0,0,0,0.12)]" : "shadow-2xl",
          notch: (
            // Small notch - classic iPhone style
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[52px] h-[18px] rounded-full flex items-center justify-center ${isLightMode ? "bg-gray-200/80" : "bg-black"}`}>
              <div className={`w-[5px] h-[5px] rounded-full ${isLightMode ? "bg-gray-400" : "bg-zinc-700"}`} />
            </div>
          ),
          buttons: (
            <>
              <div className={`absolute -left-0.5 top-24 w-1 h-8 rounded-l ${isLightMode ? "bg-gray-200" : "bg-zinc-700"}`} />
              <div className={`absolute -left-0.5 top-36 w-1 h-12 rounded-l ${isLightMode ? "bg-gray-200" : "bg-zinc-700"}`} />
              <div className={`absolute -right-0.5 top-28 w-1 h-10 rounded-r ${isLightMode ? "bg-gray-200" : "bg-zinc-700"}`} />
            </>
          ),
          time: "9:41",
        };
    }
  };

  const styles = getDeviceStyles();

  const isDark = previewTheme === "dark";

  return (
    <div className="flex flex-col items-center">
      {/* Device & Theme Selector */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
          {deviceOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setDevice(option.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  device === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-3 h-3" />
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setPreviewTheme(previewTheme === "light" ? "dark" : "light")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title={`Switch to ${previewTheme === "light" ? "dark" : "light"} preview`}
        >
          {previewTheme === "light" ? (
            <Moon className="w-3.5 h-3.5" />
          ) : (
            <Sun className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">{previewTheme === "light" ? "Dark" : "Light"}</span>
        </button>
      </div>

      {/* Device Frame */}
      <div className="relative">
        {/* Device outer shell */}
        <div className={`${styles.width} ${styles.height} ${styles.shellColor} ${styles.outerRadius} p-3 ${styles.shellShadow} relative`}>
          {/* Notch - positioned on the shell */}
          {styles.notch}
          
          {/* Screen area with subtle border */}
          <div 
            className={`w-full h-full ${styles.screenRadius} overflow-hidden relative transition-colors duration-300 ${isDark ? "bg-zinc-900" : "bg-white"}`}
            style={{ 
              boxShadow: isDark 
                ? 'inset 0 0 0 1px rgba(255,255,255,0.1)' 
                : 'inset 0 0 0 1px rgba(0,0,0,0.06)'
            }}
          >
            {/* Status Bar */}
            <div className={`flex items-center justify-between px-4 pt-2 pb-1 text-[8px] ${isDark ? "text-zinc-400" : "text-gray-400"}`}>
              <span className="font-semibold">{styles.time}</span>
              <div className="flex items-center gap-1">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3" />
              </div>
            </div>

            {/* App Content Area */}
            <div className="flex flex-col h-[calc(100%-24px)]">
              {/* Top Navigation (tabs/drawer) */}
              {renderNavigation()}

              {/* Main Content / Splash Preview */}
              <div 
                className={`flex-1 relative transition-colors duration-300 ${isDark ? "bg-zinc-800" : "bg-white"}`}
              >
                {renderSplashPreview()}
              </div>

              {/* Bottom Navigation */}
              {renderBottomNav()}
            </div>

            {/* Home Indicator */}
            <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full ${isDark ? "bg-zinc-600" : "bg-gray-300"}`} />
          </div>
        </div>

        {/* Side Buttons */}
        {styles.buttons}
      </div>

      {/* App Icon Preview */}
      <div className="mt-6 flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg">
          {renderAppIcon()}
        </div>
        <p className="mt-2 text-xs text-muted-foreground truncate max-w-[120px]">
          {config.appName || "App Name"}
        </p>
      </div>

      {/* Features Badge */}
      {config.suggestedFeatures.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-1 max-w-[180px]">
          {config.suggestedFeatures.slice(0, 3).map((feature) => (
            <span 
              key={feature}
              className="px-2 py-0.5 text-[9px] rounded-full"
              style={{ 
                backgroundColor: `${config.primaryColor}20`,
                color: config.primaryColor
              }}
            >
              {feature}
            </span>
          ))}
          {config.suggestedFeatures.length > 3 && (
            <span className="text-[9px] text-muted-foreground">
              +{config.suggestedFeatures.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PhoneMockup;
