// app/api/test-gemini/route.ts
// Quick sanity check — verifies Gemini key + connectivity
// Visit: GET /api/test-gemini

import { NextResponse } from 'next/server';
import { generateGeminiText } from '@/lib/igris/geminiService';

export const runtime = 'nodejs';

export async function GET() {
  const start = Date.now();
  try {
    console.log('[TEST] Pinging Gemini...');
    const response = await generateGeminiText(
      'You are IGRIS, a tactical AI. Respond in one short line.',
      'Say exactly: "System connection established. IGRIS online."'
    );
    const elapsed = Date.now() - start;
    console.log(`[TEST] Gemini responded in ${elapsed}ms`);
    return NextResponse.json({
      ok: true,
      response,
      latencyMs: elapsed,
      model: 'gemini-1.5-flash',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[TEST] Gemini test failed:', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
