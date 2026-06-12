"use client";

import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useThemeStore } from "@/stores/useThemeStore";
import { cn } from "@/lib/utils";

interface ThemeAwareLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Renders the appropriate logo based on the current theme (light/dark).
 * Falls back to default logo or /favicon.png if no logo is configured.
 */
const ThemeAwareLogo = ({ className = "w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl", alt }: ThemeAwareLogoProps) => {
  const { settings } = useSystemSettings();
  const { theme } = useThemeStore();

  const isDark = theme === "dark" || 
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const hasDarkLogo = !!settings.logo_url_dark;
  const logoSrc = isDark && hasDarkLogo
    ? settings.logo_url_dark
    : settings.logo_url || "/favicon.png";

  // Auto-invert logo in light mode when only a single (dark-designed) logo exists
  const shouldAutoInvert = !isDark && !hasDarkLogo;

  return (
    <img
      src={logoSrc}
      alt={alt || `${settings.app_name} Logo`}
      className={cn(
        "flex-shrink-0 object-contain transition-[filter] duration-200",
        shouldAutoInvert && "invert",
        className,
      )}
    />
  );
};

export default ThemeAwareLogo;
