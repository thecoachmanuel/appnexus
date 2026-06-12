"use client";

import { useState } from "react";
import { Home, Search, User, Bell, Settings, Heart, ShoppingBag, MessageCircle, Pencil, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppConfig, NavItem } from "@/stores/useAppStore";
import NavItemEditor, { getIconComponent } from "./NavItemEditor";

interface NavigationStyleSelectorProps {
  config: AppConfig;
  onUpdate: (updates: Partial<AppConfig>) => void;
}

const navigationOptions = [
  { value: "bottom-nav", label: "Bottom Navigation", description: "Modern tab bar at bottom" },
  { value: "drawer", label: "Drawer Menu", description: "Slide-out side menu" },
  { value: "tabs", label: "Top Tabs", description: "Swipeable tabs at top" },
];

const getNavIconsForCategory = (category: string | undefined): NavItem[] => {
  const cat = category?.toLowerCase() || "";
  
  if (cat.includes("shop") || cat.includes("ecommerce") || cat.includes("store")) {
    return [
      { icon: "Home", label: "Home" },
      { icon: "Search", label: "Search" },
      { icon: "Heart", label: "Wishlist" },
      { icon: "ShoppingBag", label: "Cart" },
      { icon: "User", label: "Account" },
    ];
  }
  
  if (cat.includes("social") || cat.includes("chat") || cat.includes("community")) {
    return [
      { icon: "Home", label: "Feed" },
      { icon: "Search", label: "Discover" },
      { icon: "MessageCircle", label: "Messages" },
      { icon: "Bell", label: "Alerts" },
      { icon: "User", label: "Profile" },
    ];
  }
  
  if (cat.includes("news") || cat.includes("blog") || cat.includes("content")) {
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

const getDrawerMenuForCategory = (category: string | undefined): NavItem[] => {
  const cat = category?.toLowerCase() || "";
  
  if (cat.includes("shop") || cat.includes("ecommerce") || cat.includes("store")) {
    return [
      { icon: "Home", label: "Home" },
      { icon: "Search", label: "Browse Products" },
      { icon: "Heart", label: "Wishlist" },
      { icon: "ShoppingBag", label: "My Orders" },
      { icon: "User", label: "Account" },
      { icon: "Settings", label: "Settings" },
    ];
  }
  
  if (cat.includes("social") || cat.includes("chat") || cat.includes("community")) {
    return [
      { icon: "Home", label: "Home Feed" },
      { icon: "User", label: "My Profile" },
      { icon: "MessageCircle", label: "Messages" },
      { icon: "Bell", label: "Notifications" },
      { icon: "Heart", label: "Saved Posts" },
      { icon: "Settings", label: "Settings" },
    ];
  }
  
  if (cat.includes("news") || cat.includes("blog") || cat.includes("content")) {
    return [
      { icon: "Home", label: "Latest News" },
      { icon: "Search", label: "Explore Topics" },
      { icon: "Heart", label: "Saved Articles" },
      { icon: "Bell", label: "Notifications" },
      { icon: "User", label: "Profile" },
      { icon: "Settings", label: "Settings" },
    ];
  }
  
  return [
    { icon: "Home", label: "Home" },
    { icon: "Search", label: "Search" },
    { icon: "Bell", label: "Notifications" },
    { icon: "Heart", label: "Favorites" },
    { icon: "User", label: "Profile" },
    { icon: "Settings", label: "Settings" },
  ];
};

const getTopTabsForCategory = (category: string | undefined): NavItem[] => {
  const cat = category?.toLowerCase() || "";
  
  if (cat.includes("shop") || cat.includes("ecommerce") || cat.includes("store")) {
    return [
      { icon: "", label: "Featured" },
      { icon: "", label: "Categories" },
      { icon: "", label: "Deals" },
      { icon: "", label: "New Arrivals" },
    ];
  }
  
  if (cat.includes("social") || cat.includes("chat") || cat.includes("community")) {
    return [
      { icon: "", label: "For You" },
      { icon: "", label: "Following" },
      { icon: "", label: "Trending" },
      { icon: "", label: "Live" },
    ];
  }
  
  if (cat.includes("news") || cat.includes("blog") || cat.includes("content")) {
    return [
      { icon: "", label: "Top Stories" },
      { icon: "", label: "Local" },
      { icon: "", label: "World" },
      { icon: "", label: "Opinion" },
    ];
  }
  
  return [
    { icon: "", label: "Home" },
    { icon: "", label: "Explore" },
    { icon: "", label: "Activity" },
    { icon: "", label: "More" },
  ];
};

const NavigationStyleSelector = ({ config, onUpdate }: NavigationStyleSelectorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const defaultNavItems = getNavIconsForCategory(config.appCategory);
  const defaultDrawerItems = getDrawerMenuForCategory(config.appCategory);
  const defaultTabLabels = getTopTabsForCategory(config.appCategory);
  
  const navItems = config.customNavItems || defaultNavItems;
  const drawerItems = config.customDrawerItems || defaultDrawerItems;
  const tabLabels = config.customTabLabels?.map(l => ({ icon: "", label: l })) || defaultTabLabels;

  const handleResetToDefaults = () => {
    if (config.navigationStyle === "bottom-nav") {
      onUpdate({ customNavItems: undefined });
    } else if (config.navigationStyle === "drawer") {
      onUpdate({ customDrawerItems: undefined });
    } else if (config.navigationStyle === "tabs") {
      onUpdate({ customTabLabels: undefined });
    }
  };

  const hasCustomItems = 
    (config.navigationStyle === "bottom-nav" && config.customNavItems) ||
    (config.navigationStyle === "drawer" && config.customDrawerItems) ||
    (config.navigationStyle === "tabs" && config.customTabLabels);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        {/* Bottom Nav Icons Preview */}
        {config.navigationStyle === "bottom-nav" && (
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">
                Navigation icons for <span className="text-foreground">{config.appCategory || "Standard App"}</span>:
              </p>
              <div className="flex gap-1">
                {hasCustomItems && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleResetToDefaults}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant={isEditing ? "secondary" : "ghost"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-6 px-2 text-xs gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  {isEditing ? "Done" : "Customize"}
                </Button>
              </div>
            </div>
            
            {isEditing ? (
              <NavItemEditor
                items={navItems}
                onChange={(items) => onUpdate({ customNavItems: items })}
                primaryColor={config.primaryColor}
                maxItems={5}
                type="bottom-nav"
              />
            ) : (
              <div className="flex items-center justify-around bg-background/80 rounded-lg py-3 px-2">
                {navItems.map((item, i) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <IconComponent 
                        className="w-5 h-5" 
                        style={{ color: i === 0 ? config.primaryColor : "hsl(var(--muted-foreground))" }}
                        strokeWidth={i === 0 ? 2.5 : 2}
                      />
                      <span 
                        className="text-[10px] font-medium"
                        style={{ color: i === 0 ? config.primaryColor : "hsl(var(--muted-foreground))" }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Drawer Menu Preview */}
        {config.navigationStyle === "drawer" && (
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">
                Menu items for <span className="text-foreground">{config.appCategory || "Standard App"}</span>:
              </p>
              <div className="flex gap-1">
                {hasCustomItems && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleResetToDefaults}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant={isEditing ? "secondary" : "ghost"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-6 px-2 text-xs gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  {isEditing ? "Done" : "Customize"}
                </Button>
              </div>
            </div>
            
            {isEditing ? (
              <NavItemEditor
                items={drawerItems}
                onChange={(items) => onUpdate({ customDrawerItems: items })}
                primaryColor={config.primaryColor}
                maxItems={6}
                type="drawer"
              />
            ) : (
              <div className="bg-background/80 rounded-lg py-2 px-3 space-y-1">
                {drawerItems.map((item, i) => {
                  const IconComponent = getIconComponent(item.icon);
                  return (
                    <div 
                      key={i} 
                      className="flex items-center gap-3 py-2 px-2 rounded-md transition-colors"
                      style={{ 
                        backgroundColor: i === 0 ? `${config.primaryColor}15` : "transparent"
                      }}
                    >
                      <IconComponent 
                        className="w-4 h-4" 
                        style={{ color: i === 0 ? config.primaryColor : "hsl(var(--muted-foreground))" }}
                        strokeWidth={i === 0 ? 2.5 : 2}
                      />
                      <span 
                        className="text-xs font-medium"
                        style={{ color: i === 0 ? config.primaryColor : "hsl(var(--foreground))" }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Top Tabs Preview */}
        {config.navigationStyle === "tabs" && (
          <div className="bg-secondary/30 rounded-xl p-4 border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">
                Tab labels for <span className="text-foreground">{config.appCategory || "Standard App"}</span>:
              </p>
              <div className="flex gap-1">
                {hasCustomItems && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleResetToDefaults}
                    className="h-6 px-2 text-xs gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant={isEditing ? "secondary" : "ghost"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-6 px-2 text-xs gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  {isEditing ? "Done" : "Customize"}
                </Button>
              </div>
            </div>
            
            {isEditing ? (
              <NavItemEditor
                items={tabLabels}
                onChange={(items) => onUpdate({ customTabLabels: items.map(i => i.label) })}
                primaryColor={config.primaryColor}
                maxItems={4}
                type="tabs"
              />
            ) : (
              <div className="bg-background/80 rounded-lg py-2 px-1 flex items-center justify-around">
                {tabLabels.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-md relative"
                  >
                    <span 
                      className="text-xs font-medium"
                      style={{ color: i === 0 ? config.primaryColor : "hsl(var(--muted-foreground))" }}
                    >
                      {item.label}
                    </span>
                    {i === 0 && (
                      <div 
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-0.5 rounded-full"
                        style={{ backgroundColor: config.primaryColor }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border/50" />
          <span className="text-xs text-muted-foreground font-medium">Choose a navigation pattern</span>
          <div className="flex-1 h-px bg-border/50" />
        </div>

        {/* Navigation Styles Grid - 2 columns with horizontal layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navigationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onUpdate({ navigationStyle: option.value as AppConfig["navigationStyle"] });
                setIsEditing(false);
              }}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] flex items-center gap-4 ${
                config.navigationStyle === option.value
                  ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary/20"
                  : "border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/40"
              }`}
            >
              {/* Phone Mockup */}
              <div className="w-14 h-28 rounded-[0.875rem] relative overflow-hidden shadow-lg border-2 border-border/40 bg-white flex-shrink-0">
                {/* Dynamic Island / Notch */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-5 h-1 bg-gray-800 rounded-full z-10" />
                
                {/* Screen Content */}
                <div className="absolute inset-[2px] rounded-[0.75rem] overflow-hidden bg-gray-100">
                  {option.value === "bottom-nav" && (
                    <>
                      {/* Content area */}
                      <div className="absolute inset-x-1 top-4 bottom-5 bg-white rounded-md" />
                      {/* Bottom nav bar */}
                      <div className="absolute bottom-1.5 inset-x-1 h-3 bg-white rounded-md flex items-center justify-around px-1 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: config.primaryColor }} />
                        <div className="w-1.5 h-1.5 rounded-sm bg-gray-300" />
                        <div className="w-1.5 h-1.5 rounded-sm bg-gray-300" />
                        <div className="w-1.5 h-1.5 rounded-sm bg-gray-300" />
                      </div>
                    </>
                  )}
                  {option.value === "drawer" && (
                    <>
                      {/* Drawer panel */}
                      <div className="absolute left-0 top-4 bottom-1.5 w-5 bg-white rounded-r-md shadow-sm flex flex-col items-center gap-1 py-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: config.primaryColor }} />
                        <div className="w-2.5 h-0.5 rounded-sm bg-gray-300" />
                        <div className="w-2.5 h-0.5 rounded-sm bg-gray-300" />
                        <div className="w-2.5 h-0.5 rounded-sm bg-gray-300" />
                      </div>
                      {/* Content area */}
                      <div className="absolute left-6 right-1 top-4 bottom-1.5 bg-white rounded-md" />
                    </>
                  )}
                  {option.value === "tabs" && (
                    <>
                      {/* Top tabs */}
                      <div className="absolute top-4 inset-x-1 h-3 bg-white rounded-md flex items-center justify-around px-1 shadow-sm">
                        <div className="w-2.5 h-1.5 rounded-sm" style={{ backgroundColor: config.primaryColor }} />
                        <div className="w-2.5 h-1.5 rounded-sm bg-gray-300" />
                        <div className="w-2.5 h-1.5 rounded-sm bg-gray-300" />
                      </div>
                      {/* Content area */}
                      <div className="absolute inset-x-1 top-8 bottom-1.5 bg-white rounded-md" />
                    </>
                  )}
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-foreground/40 rounded-full" />
              </div>
              
              {/* Text Content - Left aligned */}
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-foreground text-sm">{option.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavigationStyleSelector;