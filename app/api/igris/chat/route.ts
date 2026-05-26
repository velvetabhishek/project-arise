// app/api/igris/chat/route.ts
// Gemini-powered streaming chat endpoint
// Converts Gemini async generator → SSE stream to client

import { NextRequest, NextResponse } from 'next/server';
import { streamGeminiChat } from '@/lib/igris/geminiService';
import { buildSystemPrompt } from '@/lib/igris/promptEngine';
import type { IGRISFullContext } from '@/lib/igris/contextBuilder';

export const runtime = 'nodejs';
export const maxDuration = 45;

interface ChatRequestBody {
  message: string;
  context: IGRISFullContext;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  memoryNote?: string;
}

// Default context used if partial/missing fields are received
function sanitizeContext(ctx: Partial<IGRISFullContext>): IGRISFullContext {
  const now = new Date();
  const hour = now.getHours();
  return {
    hunterName: ctx.hunterName ?? 'Hunter',
    level: ctx.level ?? 1,
    rank: ctx.rank ?? 'E',
    title: ctx.title ?? 'Novice Hunter',
    currentXP: ctx.currentXP ?? 0,
    xpToNextLevel: ctx.xpToNextLevel ?? 1000,
    totalXP: ctx.totalXP ?? 0,
    totalWorkouts: ctx.totalWorkouts ?? 0,
    stats: ctx.stats ?? { STR: 10, AGI: 10, END: 10, VIT: 10, INT: 10 },
    weakestStat: ctx.weakestStat ?? 'END',
    strongestStat: ctx.strongestStat ?? 'STR',
    streak: ctx.streak ?? 0,
    longestStreak: ctx.longestStreak ?? 0,
    daysSinceLastWorkout: ctx.daysSinceLastWorkout ?? 999,
    consistencyScore: ctx.consistencyScore ?? 0,
    lastWorkoutDate: ctx.lastWorkoutDate ?? null,
    sessionsThisWeek: ctx.sessionsThisWeek ?? 0,
    sessionsLastWeek: ctx.sessionsLastWeek ?? 0,
    recentSessionDates: ctx.recentSessionDates ?? [],
    avgXPPerSession: ctx.avgXPPerSession ?? 0,
    timeOfDay: ctx.timeOfDay ?? (hour >= 5 && hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 22 ? 'evening' : 'night'),
    hour: ctx.hour ?? hour,
    dayOfWeek: ctx.dayOfWeek ?? now.toLocaleDateString('en-US', { weekday: 'long' }),
    environment: 'hostel - no equipment',
    primaryGoal: 'fat loss + aesthetic physique',
    weaknesses: 'stamina, breathing endurance',
    trainingDuration: '~60 minutes daily',
    transformationPhase: ctx.transformationPhase ?? 'Foundation',
    igrisState: ctx.igrisState ?? 'STANDBY',
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { message, context, history = [], memoryNote } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    // Sanitize context — ensures no undefined crashes in promptEngine
    const safeCtx = sanitizeContext(context ?? {});

    // Build system prompt with full player context + memory
    let systemPrompt = buildSystemPrompt(safeCtx);
    if (memoryNote) {
      systemPrompt += `\n\n═══════════════════════════════════════════════\nIGRIS MEMORY LOG\n═══════════════════════════════════════════════\n${memoryNote}`;
    }

    console.log(`[IGRIS Chat] "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}" | Lv.${safeCtx.level} | ${safeCtx.streak}d streak`);

    // Build SSE stream from Gemini generator
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamGeminiChat(systemPrompt, history, message);

          for await (const chunk of generator) {
            const payload = JSON.stringify({
              choices: [{ delta: { content: chunk } }],
            });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          console.log('[IGRIS Chat] Stream complete ✓');
        } catch (err) {
          console.error('[IGRIS Chat] Stream controller error:', err);
          const errorPayload = JSON.stringify({
            choices: [{ delta: { content: ' Connection disrupted. The system persists.' } }],
          });
          controller.enqueue(encoder.encode(`data: ${errorPayload}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    console.error('[IGRIS Chat API] Fatal error:', err);
    return NextResponse.json(
      { error: 'IGRIS core unavailable.' },
      { status: 500 }
    );
  }
}
