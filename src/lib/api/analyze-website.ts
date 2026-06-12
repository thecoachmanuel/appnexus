/**
 * Website Analysis API
 * Uses custom backend endpoint for AI-powered website analysis with Gemini
 */

export interface WebsiteAnalysisConfig {
  app_name?: string;
  appName?: string;
  primary_color?: string;
  primaryColor?: string;
  accent_color?: string;
  accentColor?: string;
  navigation_style?: "tabs" | "drawer" | "bottom-nav" | "bottom_tabs" | "top_tabs";
  navigationStyle?: string;
  features?: string[];
  app_category?: string;
  appCategory?: string;
  description?: string;
  icon_style?: string;
  iconStyle?: string;
  splash_screen_style?: string;
}

export interface AnalysisResponse {
  data: { config: WebsiteAnalysisConfig } | null;
  error: Error | null;
}

/**
 * Normalize config field names from various response formats
 */
function normalizeConfig(data: Record<string, unknown>): WebsiteAnalysisConfig {
  // Handle nested config object if present
  const raw = (data.config as Record<string, unknown>) || data;
  return {
    app_name: (raw.appName || raw.app_name) as string | undefined,
    primary_color: (raw.primaryColor || raw.primary_color || "#3B82F6") as string,
    accent_color: (raw.accentColor || raw.accent_color || "#10B981") as string,
    navigation_style: (raw.navigationStyle || raw.navigation_style || "bottom_tabs") as WebsiteAnalysisConfig["navigation_style"],
    features: (raw.features || []) as string[],
    app_category: (raw.appCategory || raw.app_category || "utilities") as string,
    description: (raw.description || "") as string,
    icon_style: (raw.iconStyle || raw.icon_style || "rounded") as string,
    splash_screen_style: (raw.splash_screen_style || "gradient") as string,
  };
}

/**
 * Analyze a website using the custom Express backend with Gemini API
 */
export async function analyzeWebsite(websiteUrl: string): Promise<AnalysisResponse> {
  try {
    console.log("[analyzeWebsite] Using custom Express backend with Gemini");
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/ai/analyze-website`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ websiteUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData.error || response.statusText || "AI analysis failed";
      
      if (response.status === 402) {
        return { data: null, error: new Error("AI credits exhausted.") };
      }
      if (response.status === 429) {
        return { data: null, error: new Error("Rate limit exceeded.") };
      }
      
      return { data: null, error: new Error(msg) };
    }

    const data = await response.json();

    if (!data) {
      return {
        data: null,
        error: new Error("No response from AI service"),
      };
    }

    return { data: { config: normalizeConfig(data) }, error: null };
  } catch (error) {
    console.error("[analyzeWebsite] Error:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Analysis failed"),
    };
  }
}
