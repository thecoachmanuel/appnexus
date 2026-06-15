import { GoogleGenAI } from '@google/genai';

const TEMPLATES = [
  "Education / LMS", "E-Commerce", "Social Media", "Blog / News", 
  "Dashboard / SaaS", "Real Estate", "Fitness / Workout", "Delivery / Restaurant", 
  "Dating", "Travel / Booking", "Music / Audio", "Video Streaming", 
  "Finance / Wallet", "Health / Telemed", "Forum / Community", "Directory / Listings", 
  "Job Board", "Booking / Ticketing", "Portfolios", "On-Demand Services"
];

export async function analyzeWebsite(url, apiKey) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for AI analysis.');
  }

  const ai = new GoogleGenAI({ apiKey });

  let htmlContext = '';
  try {
    const response = await fetch(url);
    const html = await response.text();
    // Grab a snippet to give the AI context about class names and structure
    htmlContext = html.substring(0, 15000); 
  } catch (error) {
    console.warn(`Could not fetch HTML for ${url}. Proceeding with URL context only.`);
  }

  const prompt = `
You are an expert mobile app UI/UX engineer and developer.
Your task is to analyze the following website URL and its partial HTML structure, and determine which of our 20 native app templates it best fits.
Once you classify it, you must generate the exact Custom CSS and Custom JavaScript required to restructure the webview into that native app template.

The 20 Templates are:
${TEMPLATES.join(', ')}

URL: ${url}
HTML Snippet:
${htmlContext}

Instructions:
1. Determine the single best template from the list above.
2. Provide a 'customCSS' string that forces the website into this template's layout (e.g., hiding desktop headers, forcing bottom padding, sticky elements).
3. Provide a 'customJS' string that mutates the DOM to fit the template (e.g., moving search bars, extracting course lists, building a floating cart button).
4. Extract the primary and accent colors from the website's CSS/HTML.
5. Extract the 3-5 most important main navigation links from the website (e.g., Home, Courses, Profile, Cart). For 'icon', choose a standard Android material icon name (e.g., 'ic_menu_compass', 'ic_menu_manage', 'ic_menu_view'). Note: the icon must be a valid standard Android drawable name. If unsure, use 'ic_menu_info_details'.

Respond ONLY with a valid JSON object in the following format:
{
  "recommendedTemplate": "Name of template",
  "reasoning": "Short explanation of why",
  "customCSS": "body { ... }",
  "customJS": "document.addEventListener('DOMContentLoaded', () => { ... });",
  "extractedColors": {
    "primary": "#HEX",
    "accent": "#HEX"
  },
  "extractedNavigation": [
    { "label": "Home", "icon": "ic_menu_compass", "url": "/home" }
  ]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const text = response.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error('AI returned invalid JSON: ' + text);
  }
}
