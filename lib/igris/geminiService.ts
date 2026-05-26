// lib/igris/geminiService.ts
// Gemini AI backend for IGRIS — server-side only
// Uses @google/generative-ai with gemini-2.0-flash
// Includes: 429 fast-fail, timeout wrapper, graceful fallback

import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Client singleton ─────────────────────────────────────────────
function getGeminiClient(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('[IGRIS] GEMINI_API_KEY is not set in .env.local');
  return new GoogleGenerativeAI(key);
}

const MODEL_NAME = 'gemini-2.0-flash';
const FALLBACK_MODEL_NAME = 'gemini-2.5-flash';

// ─── Generation configs ───────────────────────────────────────────
const GENERATION_CONFIG = {
  maxOutputTokens: 512,
  temperature: 0.85,
  topP: 0.9,
  topK: 40,
};

const BRIEFING_CONFIG = {
  maxOutputTokens: 256,
  temperature: 0.75,
  topP: 0.85,
  topK: 32,
};

// ─── Timeout helper ───────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[IGRIS] ${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

// ─── 429 detection ────────────────────────────────────────────────
function isRateLimitError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate');
}

// ─── Message type ─────────────────────────────────────────────────
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// ─── Convert chat history to Gemini format ────────────────────────
export function convertHistoryToGemini(
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): GeminiMessage[] {
  return history
    .filter(m => m.content.trim())
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
}

// ─── STREAMING CHAT ───────────────────────────────────────────────
export async function* streamGeminiChat(
  systemPrompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string
): AsyncGenerator<string> {
  console.log('[IGRIS] Stream start →', userMessage.slice(0, 50));
  const client = getGeminiClient();
  const geminiHistory = convertHistoryToGemini(history);

  // ── Primary: gemini-2.0-flash ───────────────────────────────────
  try {
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
      generationConfig: GENERATION_CONFIG,
    });

    const chat = model.startChat({ history: geminiHistory });
    // 25s timeout on the initial stream request
    const result = await withTimeout(
      chat.sendMessageStream(userMessage),
      25000,
      'stream init'
    );

    let hasContent = false;
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        hasContent = true;
        yield text;
      }
    }

    if (hasContent) {
      console.log('[IGRIS] Stream complete ✓ (gemini-2.0-flash)');
      return;
    }
    console.warn('[IGRIS] Empty response from primary model');
  } catch (err: unknown) {
    if (isRateLimitError(err)) {
      console.warn('[IGRIS] 429 rate limit on primary — fast-failing to fallback');
    } else {
      console.error('[IGRIS] Primary stream error:', String(err).slice(0, 200));
    }
  }

  // ── Fallback: gemini-2.5-flash ──────────────────────────────────
  try {
    console.log('[IGRIS] Trying fallback:', FALLBACK_MODEL_NAME);
    const fallbackModel = client.getGenerativeModel({
      model: FALLBACK_MODEL_NAME,
      systemInstruction: systemPrompt,
      generationConfig: GENERATION_CONFIG,
    });
    const chat = fallbackModel.startChat({ history: geminiHistory });
    const result = await withTimeout(
      chat.sendMessageStream(userMessage),
      20000,
      'fallback stream init'
    );
    let hasContent = false;
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) { hasContent = true; yield text; }
    }
    if (hasContent) {
      console.log('[IGRIS] Fallback stream complete ✓');
      return;
    }
  } catch (fallbackErr: unknown) {
    if (isRateLimitError(fallbackErr)) {
      console.warn('[IGRIS] 429 on fallback model too — using static response');
    } else {
      console.error('[IGRIS] Fallback error:', String(fallbackErr).slice(0, 200));
    }
  }

  // ── Static fallback ─────────────────────────────────────────────
  console.warn('[IGRIS] Both models failed — yielding static fallback');
  yield* fallbackStream();
}

// ─── NON-STREAMING TEXT (briefing, diagnostics) ───────────────────
export async function generateGeminiText(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  console.log('[IGRIS] Generating text...');
  const client = getGeminiClient();

  // ── Primary ─────────────────────────────────────────────────────
  try {
    const model = client.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemPrompt,
      generationConfig: BRIEFING_CONFIG,
    });

    const result = await withTimeout(
      model.generateContent(userPrompt),
      20000,
      'text generation'
    );
    const text = result.response.text().trim();
    if (text) {
      console.log(`[IGRIS] Text generated ✓ ${text.length} chars`);
      return text;
    }
    console.warn('[IGRIS] Empty text from primary');
  } catch (err: unknown) {
    if (isRateLimitError(err)) {
      console.warn('[IGRIS] 429 on text generation primary — trying fallback');
    } else {
      console.error('[IGRIS] Text generation error:', String(err).slice(0, 200));
    }
  }

  // ── Fallback ─────────────────────────────────────────────────────
  try {
    console.log('[IGRIS] Text fallback:', FALLBACK_MODEL_NAME);
    const fallbackModel = client.getGenerativeModel({
      model: FALLBACK_MODEL_NAME,
      systemInstruction: systemPrompt,
      generationConfig: BRIEFING_CONFIG,
    });
    const result = await withTimeout(
      fallbackModel.generateContent(userPrompt),
      15000,
      'text fallback'
    );
    const text = result.response.text().trim();
    if (text) {
      console.log('[IGRIS] Fallback text ✓');
      return text;
    }
  } catch (fallbackErr: unknown) {
    console.error('[IGRIS] Fallback text failed:', String(fallbackErr).slice(0, 200));
  }

  // ── Static fallback ─────────────────────────────────────────────
  console.warn('[IGRIS] Both text models failed — returning static fallback');
  return FALLBACK_BRIEFING;
}

// ─── Fallback stream ──────────────────────────────────────────────
async function* fallbackStream(): AsyncGenerator<string> {
  const msg = STATIC_FALLBACKS[Math.floor(Math.random() * STATIC_FALLBACKS.length)];
  const words = msg.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield (i === 0 ? '' : ' ') + words[i];
    await new Promise(r => setTimeout(r, 30));
  }
}

const STATIC_FALLBACKS = [
  'Signal disrupted. The system persists. Continue your training, Hunter.',
  'Connection unstable. Your mission parameters remain unchanged. Proceed.',
  'Shadow layer interference. Trust your last directive. Adapt and train.',
  'Core link fragmented. The directive is simple: do not stop.',
  'Tactical systems recovering. Your streak is logged. Keep moving forward.',
];

const FALLBACK_BRIEFING =
  'Systems initializing. Hunter — your training parameters are active. The path forward is the same: train, adapt, evolve. Do not pause your progression.';
