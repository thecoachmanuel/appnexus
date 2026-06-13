import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Analyze the website URL: ${url}. 
Based on the domain name and likely industry, generate a plausible configuration for a mobile app version of this website. 
Return ONLY a raw JSON object with the following structure (no markdown, no backticks):
{
  "config": {
    "app_name": "string (A clean, short name based on the URL)",
    "primary_color": "string (Hex code for primary brand color, e.g. #3b82f6)",
    "accent_color": "string (Hex code for secondary/accent color)",
    "navigation_style": "string (Must be exactly one of: 'bottom-nav', 'drawer', or 'tabs')",
    "features": ["string", "string", "string"],
    "app_category": "string (e.g. E-commerce, Social, Productivity, Education)",
    "description": "string (A 1-2 sentence description of what the app does)"
  }
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    const text = response.text || '';
    
    // Clean up potential markdown formatting from the response
    const cleanJsonText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let result;
    try {
      result = JSON.parse(cleanJsonText);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', cleanJsonText);
      throw new Error('Failed to parse AI response');
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analyze Website Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
