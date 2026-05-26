// lib/igris/memorySystem.ts
// Lightweight IGRIS memory system — persisted via localStorage
// Tracks patterns, struggles, insights over time

export interface IGRISMemory {
  lastBriefingDate: string | null;
  lastBriefingText: string | null;
  skippedWorkoutDates: string[];
  notedWeaknesses: string[];
  positivePatterns: string[];
  lastDiagnosticsDate: string | null;
  totalAIInteractions: number;
  keyInsights: string[]; // up to 10 short insight strings IGRIS has noted
}

const MEMORY_KEY = 'arise-igris-memory';

const DEFAULT_MEMORY: IGRISMemory = {
  lastBriefingDate: null,
  lastBriefingText: null,
  skippedWorkoutDates: [],
  notedWeaknesses: [],
  positivePatterns: [],
  lastDiagnosticsDate: null,
  totalAIInteractions: 0,
  keyInsights: [],
};

export function loadMemory(): IGRISMemory {
  if (typeof window === 'undefined') return DEFAULT_MEMORY;
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return DEFAULT_MEMORY;
    return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_MEMORY;
  }
}

export function saveMemory(memory: IGRISMemory): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // Storage full or unavailable
  }
}

export function updateMemory(updates: Partial<IGRISMemory>): IGRISMemory {
  const current = loadMemory();
  const next: IGRISMemory = { ...current, ...updates };
  saveMemory(next);
  return next;
}

export function recordSkippedWorkout(date: string): void {
  const mem = loadMemory();
  if (!mem.skippedWorkoutDates.includes(date)) {
    updateMemory({
      skippedWorkoutDates: [...mem.skippedWorkoutDates.slice(-29), date],
    });
  }
}

export function addInsight(insight: string): void {
  const mem = loadMemory();
  const existing = mem.keyInsights;
  if (!existing.includes(insight)) {
    updateMemory({
      keyInsights: [...existing.slice(-9), insight],
    });
  }
}

export function setBriefing(text: string): void {
  updateMemory({
    lastBriefingDate: new Date().toDateString(),
    lastBriefingText: text,
  });
}

export function shouldRegenerateBriefing(memory: IGRISMemory): boolean {
  if (!memory.lastBriefingDate) return true;
  return memory.lastBriefingDate !== new Date().toDateString();
}

export function incrementInteractions(): void {
  const mem = loadMemory();
  updateMemory({ totalAIInteractions: mem.totalAIInteractions + 1 });
}

export function getMemorySummaryForPrompt(memory: IGRISMemory): string {
  const parts: string[] = [];

  if (memory.skippedWorkoutDates.length > 0) {
    parts.push(`Hunter has skipped workouts on: ${memory.skippedWorkoutDates.slice(-5).join(', ')}`);
  }
  if (memory.keyInsights.length > 0) {
    parts.push(`Previous observations: ${memory.keyInsights.slice(-3).join('; ')}`);
  }
  if (memory.totalAIInteractions > 0) {
    parts.push(`This hunter has consulted IGRIS ${memory.totalAIInteractions} times.`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No prior observations recorded.';
}
