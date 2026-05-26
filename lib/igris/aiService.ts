// lib/igris/aiService.ts
// DEPRECATED — replaced by geminiService.ts
// This file is kept as a shim to prevent import errors during migration.
// All logic has been moved to lib/igris/geminiService.ts

export { generateGeminiText as generateIGRISText } from './geminiService';

// streamIGRISResponse shim — not used anymore, routes use streamGeminiChat directly
export async function streamIGRISResponse(): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"System migrated to Gemini. Please use the updated pipeline."}}]}\n\n'));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}
