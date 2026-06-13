"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Plus, Settings, CreditCard, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavBadges } from "@/hooks/useNavBadges";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badgeKey?: "dashboard";
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/dashboard", badgeKey: "dashboard" },
  { icon: CreditCard, label: "Credits", path: "/subscription" },
  { icon: Plus, label: "Build", path: "/builder", isCenter: true },
  { icon: HelpCircle, label: "Help", path: "/help" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MobileBottomNav = () => {
  const pathname = usePathname();
  const { badges } = useNavBadges();

  const getBadgeCount = (badgeKey?: "dashboard") => {
    if (!badgeKey) return 0;
    return badges[badgeKey] || 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          const badgeCount = getBadgeCount(item.badgeKey);

          if (item.isCenter) {
            return (
              <Link
                key={item.path}
                href={item.path}
                className="relative -mt-5 flex flex-col items-center"
              >
                <div className={cn(
                  "w-13 h-13 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
                  isActive
                    ? "bg-primary scale-110 shadow-primary/30"
                    : "bg-primary/90 hover:bg-primary"
                )}>
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium mt-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all duration-200",
                    isActive && "scale-110"
                  )}
                />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-primary text-primary-foreground rounded-full animate-in zoom-in-50 duration-200">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
