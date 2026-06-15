import { NextResponse } from 'next/server';

function cleanHtml(html: string): string {
  // Strip scripts, styles, and SVG blocks to keep context small and structural
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
  
  // Return the first 35,000 characters to cover header metadata, main layout tags, nav, and body wrapper
  return cleaned.slice(0, 35000);
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Attempt to fetch the website HTML content on the server
    let htmlContent = '';
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        next: { revalidate: 3600 } // cache for 1 hour
      });
      if (response.ok) {
        htmlContent = await response.text();
      }
    } catch (fetchErr) {
      console.warn(`Failed to fetch remote HTML for ${url}:`, fetchErr);
      // Fall back to analysis without HTML if site is unreachable or blocked
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY;
    
    // If no API key, return a smart mock based on the URL
    if (!apiKey) {
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      const name = domain.split('.')[0];
      const appName = name.charAt(0).toUpperCase() + name.slice(1);
      return NextResponse.json({
        config: {
          app_name: appName,
          primary_color: '#007bff',
          accent_color: '#6c757d',
          navigation_style: 'bottom-nav',
          features: ['Push Notifications', 'Offline Mode', 'Pull to Refresh'],
          app_category: 'Productivity',
          description: `${appName} mobile app – fast, native experience for your users.`,
          hide_selectors: 'header, footer, nav, .header, .footer, .navbar'
        }
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const cleanedHtml = htmlContent ? cleanHtml(htmlContent) : '';

    const prompt = `Analyze the website URL: ${url}.
${cleanedHtml ? `Here is a structural snippet of the website's HTML:\n${cleanedHtml}\n` : ''}
Based on the website ${cleanedHtml ? 'HTML, meta tags, and tag classes' : 'domain name and purpose'}, generate a highly optimized mobile app wrapper configuration.

Specifically, analyze:
1. Brand colors: intelligently identify the site's primary color theme. Look for 'theme-color' meta tags, dominant background colors in CSS headers, primary button colors, or CSS variables (like --primary). Return exactly two colors: a primary_color and an accent_color.
2. Layout header and footer: identify the CSS classes or IDs used for the main website navigation headers, mobile menus, site footers, cookie prompts, or promotional banners.
3. App category, name, and descriptions.

Return ONLY a raw JSON object with the following structure (no markdown, no backticks, no text wrap):
{
  "config": {
    "app_name": "string (A clean, short native app name)",
    "primary_color": "string (Hex code for primary brand color, e.g. #3b82f6)",
    "accent_color": "string (Hex code for secondary brand color)",
    "navigation_style": "string (Must be exactly one of: 'bottom-nav', 'drawer', or 'tabs')",
    "features": ["string", "string", "string"],
    "app_category": "string (e.g. E-commerce, Social, Productivity, Education, Healthcare)",
    "description": "string (A 1-2 sentence description of what the app does)",
    "hide_selectors": "string (A comma-separated list of CSS selectors that target headers, footers, cookie banners, navigation menus, and banners to hide them from WebView, e.g. 'header.site-header, div#mobile-nav, footer.site-footer, div.cookie-banner')",
    "navigation_items": [
      {
        "label": "string (Short menu label like 'Home', 'Shop', 'Profile', max 4 items)",
        "url": "string (The URL path, e.g., '/' or '/shop' or '/about')",
        "icon": "string (A generic material icon name, e.g., 'home', 'shopping_cart', 'person', 'settings')"
      }
    ]
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    const text = response.text || '';
    const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(cleanJsonText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', cleanJsonText);
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      const name = domain.split('.')[0];
      const appName = name.charAt(0).toUpperCase() + name.slice(1);
      result = {
        config: {
          app_name: appName,
          primary_color: '#007bff',
          accent_color: '#6c757d',
          navigation_style: 'bottom-nav',
          features: ['Push Notifications', 'Offline Mode', 'Pull to Refresh'],
          app_category: 'Productivity',
          description: `${appName} mobile app.`,
          hide_selectors: 'header, footer, nav, .header, .footer, .navbar',
          navigation_items: [
            { label: 'Home', url: '/', icon: 'home' },
            { label: 'Back', url: 'javascript:window.history.back()', icon: 'arrow_back' },
            { label: 'Forward', url: 'javascript:window.history.forward()', icon: 'arrow_forward' },
            { label: 'Reload', url: 'javascript:window.location.reload()', icon: 'refresh' }
          ]
        }
      };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analyze Website Error:', error);
    try {
      const { url } = await req.clone().json().catch(() => ({ url: 'app' }));
      const domain = (url || 'app').replace(/https?:\/\//, '').split('/')[0];
      const name = domain.split('.')[0] || 'App';
      const appName = name.charAt(0).toUpperCase() + name.slice(1);
      return NextResponse.json({
        config: {
          app_name: appName,
          primary_color: '#007bff',
          accent_color: '#6c757d',
          navigation_style: 'bottom-nav',
          features: ['Push Notifications', 'Offline Mode', 'Pull to Refresh'],
          app_category: 'Productivity',
          description: `${appName} mobile app.`,
          hide_selectors: 'header, footer, nav, .header, .footer, .navbar',
          navigation_items: [
            { label: 'Home', url: '/', icon: 'home' },
            { label: 'Back', url: 'javascript:window.history.back()', icon: 'arrow_back' },
            { label: 'Forward', url: 'javascript:window.history.forward()', icon: 'arrow_forward' },
            { label: 'Reload', url: 'javascript:window.location.reload()', icon: 'refresh' }
          ]
        }
      });
    } catch {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
}
