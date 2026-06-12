"use client";

import { useEffect, useRef } from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

function hexToHSL(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Parse an HSL string "H S% L%" and return [h, s, l] numbers.
 */
function parseHSL(hsl: string): [number, number, number] | null {
  const m = hsl.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Compute a contrasting foreground HSL for a given background HSL.
 * Returns white foreground for dark colors, black foreground for light colors.
 */
function contrastingForeground(hsl: string): string {
  const parsed = parseHSL(hsl);
  if (!parsed) return "0 0% 100%";
  const [h, s, l] = parsed;
  // Use lightness threshold: if bg is light (>55%), use dark fg; otherwise white
  return l > 55 ? `${h} ${s}% 7%` : `${h} ${Math.min(s, 10)}% 100%`;
}

/**
 * Invert the lightness of an HSL color for dark mode.
 * E.g. a dark primary (#000000 = "0 0% 0%") becomes "0 0% 100%" in dark mode.
 */
function invertForDarkMode(hsl: string): string {
  const parsed = parseHSL(hsl);
  if (!parsed) return hsl;
  const [h, s, l] = parsed;
  // Invert lightness: 0% → 100%, 100% → 0%, 30% → 70%
  return `${h} ${s}% ${100 - l}%`;
}

function buildColorOverrides(primary: string, accent: string): string {
  const primaryHSL = hexToHSL(primary);
  const accentHSL = hexToHSL(accent);
  if (!primaryHSL && !accentHSL) return "";

  // --- Light mode overrides ---
  let css = ":root {\n";
  if (primaryHSL) {
    css += `  --primary: ${primaryHSL};\n`;
    css += `  --primary-foreground: ${contrastingForeground(primaryHSL)};\n`;
    css += `  --ring: ${primaryHSL};\n`;
    css += `  --sidebar-primary: ${primaryHSL};\n`;
    css += `  --sidebar-primary-foreground: ${contrastingForeground(primaryHSL)};\n`;
  }
  if (accentHSL) {
    css += `  --accent: ${accentHSL};\n`;
    css += `  --accent-foreground: ${contrastingForeground(accentHSL)};\n`;
    css += `  --sidebar-accent: ${accentHSL};\n`;
  }
  css += "}\n";

  // --- Dark mode overrides (invert lightness so dark colors become light) ---
  const darkPrimaryHSL = primaryHSL ? invertForDarkMode(primaryHSL) : null;
  const darkAccentHSL = accentHSL ? invertForDarkMode(accentHSL) : null;

  css += ".dark {\n";
  if (darkPrimaryHSL) {
    css += `  --primary: ${darkPrimaryHSL};\n`;
    css += `  --primary-foreground: ${contrastingForeground(darkPrimaryHSL)};\n`;
    css += `  --ring: ${darkPrimaryHSL};\n`;
    css += `  --sidebar-primary: ${darkPrimaryHSL};\n`;
    css += `  --sidebar-primary-foreground: ${contrastingForeground(darkPrimaryHSL)};\n`;
  }
  if (darkAccentHSL) {
    css += `  --accent: ${darkAccentHSL};\n`;
    css += `  --accent-foreground: ${contrastingForeground(darkAccentHSL)};\n`;
    css += `  --sidebar-accent: ${darkAccentHSL};\n`;
  }
  css += "}\n";

  return css;
}

const CustomCSSInjector = () => {
  const { settings, loaded } = useSystemSettings();
  const styleRef = useRef<HTMLStyleElement | null>(null);

  // Inject custom CSS and color overrides
  useEffect(() => {
    if (!loaded) return;

    if (!styleRef.current) {
      styleRef.current = document.createElement("style");
      styleRef.current.id = "custom-css-injector";
      document.head.appendChild(styleRef.current);
    }

    const colorCSS = buildColorOverrides(settings.primary_color, settings.accent_color);
    const customCSS = settings.custom_css || "";
    styleRef.current.textContent = colorCSS + customCSS;

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [settings.custom_css, settings.primary_color, settings.accent_color, loaded]);

  // Dynamically update favicon from settings
  useEffect(() => {
    if (!loaded || !settings.favicon_url) return;

    const existingLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (existingLink) {
      existingLink.href = settings.favicon_url;
    } else {
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = settings.favicon_url;
      document.head.appendChild(link);
    }
  }, [settings.favicon_url, loaded]);

  return null;
};

export default CustomCSSInjector;
