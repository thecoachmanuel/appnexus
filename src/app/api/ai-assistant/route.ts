import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, conversationHistory } = body;

    // Use Gemini API Key (fallback to Lovable API key if necessary)
    const apiKey = process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format conversation history for Gemini if needed
    // For simplicity we just prepend it to the message here
    const historyContext = conversationHistory 
      ? conversationHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')
      : '';
    
    const prompt = `${historyContext}\nuser: ${message}`;

    const stream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.text) {
            const data = JSON.stringify({ choices: [{ delta: { content: chunk.text } }] });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
