// app/api/igris/briefing/route.ts
// Daily briefing generator — non-streaming, uses Gemini generateContent

import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiText } from '@/lib/igris/geminiService';
import { buildDailyBriefingPrompt } from '@/lib/igris/promptEngine';
import type { IGRISFullContext } from '@/lib/igris/contextBuilder';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const context: IGRISFullContext = await req.json();

    console.log(`[IGRIS Briefing] Generating for Hunter: Lv.${context.level} | Streak: ${context.streak}d`);

    const systemPrompt = buildDailyBriefingPrompt(context);
    const briefing = await generateGeminiText(
      systemPrompt,
      'Generate today\'s tactical briefing now. Under 120 words. No markdown. No greetings. Tactical lines only.'
    );

    console.log('[IGRIS Briefing] Generated ✓');
    return NextResponse.json({ briefing });
  } catch (err) {
    console.error('[IGRIS Briefing API] Error:', err);
    return NextResponse.json(
      { briefing: 'Systems initializing. Hunter — your training parameters are active. Proceed with today\'s mission.' },
      { status: 200 }
    );
  }
}
