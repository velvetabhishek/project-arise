// lib/igris/igrisEngine.ts
import type { IGRISContext, IGRISMessageType } from '@/types/igris';
import { IGRIS_RESPONSES } from './igrisResponses';

function getTimeOfDay(): IGRISContext['timeOfDay'] {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getDaysSinceLastWorkout(lastWorkoutDate: string | null): number {
  if (!lastWorkoutDate) return 999;
  const last = new Date(lastWorkoutDate);
  const now = new Date();
  const diff = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return Math.floor(diff);
}

export function buildContext(params: {
  playerLevel: number;
  playerRank: string;
  streak: number;
  lastWorkoutDate: string | null;
  energyLevel?: number;
}): IGRISContext {
  return {
    ...params,
    timeOfDay: getTimeOfDay(),
    daysSinceLastWorkout: getDaysSinceLastWorkout(params.lastWorkoutDate),
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateIGRISMessage(
  type: IGRISMessageType,
  context: IGRISContext
): string {
  const responses = IGRIS_RESPONSES[type];
  if (!responses || responses.length === 0) {
    return 'The shadows watch. Continue.';
  }

  // Apply context-aware selection
  if (type === 'greeting') {
    const timeMap: Record<string, string[]> = {
      morning: [
        'Morning. The day belongs to those who begin it with purpose.',
        'The shadows wake before dawn. So must you.',
        'A new day. Begin before doubt has time to speak.',
        'Dawn. Your mission for today is already assigned.',
      ],
      afternoon: [
        'The afternoon grows heavy. Do not let it consume you.',
        'Half the day remains. It is enough.',
        'I see you have not yet trained today. Correct that.',
      ],
      evening: [
        'Evening. If you have not trained today, now is the time.',
        'The day fades. Do not let it take your workout with it.',
        'Train now. Rest comes after.',
      ],
      night: [
        'Late. Either you have already trained, or you are making an excuse.',
        'Night. Train if you must. Recover if you already have.',
        'The dark is not an obstacle. It is a condition.',
      ],
    };
    const timeResponses = timeMap[context.timeOfDay];
    if (timeResponses && timeResponses.length > 0) {
      return pickRandom(timeResponses);
    }
  }

  if (type === 'streak_warning' && context.daysSinceLastWorkout >= 2) {
    const dangerResponses = IGRIS_RESPONSES.streak_danger;
    if (dangerResponses && dangerResponses.length > 0) {
      return pickRandom(dangerResponses);
    }
  }

  return pickRandom(responses)
    .replace('{level}', String(context.playerLevel))
    .replace('{rank}', context.playerRank)
    .replace('{streak}', String(context.streak))
    .replace('{days}', String(context.daysSinceLastWorkout));
}

export function generateDailyGreeting(context: IGRISContext): string {
  return generateIGRISMessage('greeting', context);
}

export function generatePreWorkoutBrief(context: IGRISContext): string {
  return generateIGRISMessage('pre_workout', context);
}

export function generatePostWorkoutDebrief(context: IGRISContext, xpGained: number): string {
  const base = generateIGRISMessage('post_workout', context);
  return `${base} +${xpGained} XP recorded.`;
}

export function generateStreakWarning(context: IGRISContext): string {
  return generateIGRISMessage('streak_warning', context);
}

export function generateLevelUpMessage(context: IGRISContext): string {
  return generateIGRISMessage('level_up', context);
}

export function generateRankUpMessage(context: IGRISContext): string {
  return generateIGRISMessage('rank_up', context);
}

export function generateRecoveryMessage(context: IGRISContext): string {
  return generateIGRISMessage('recovery', context);
}

export function processUserMessage(
  userMessage: string,
  context: IGRISContext
): string {
  const lower = userMessage.toLowerCase();

  // Keyword pattern matching
  if (lower.includes('tired') || lower.includes('exhausted') || lower.includes('rest')) {
    return generateRecoveryMessage(context);
  }
  if (lower.includes('motivat') || lower.includes('give up') || lower.includes('quit')) {
    return generateIGRISMessage('motivation', context);
  }
  if (lower.includes('workout') || lower.includes('train') || lower.includes('exercise')) {
    return generatePreWorkoutBrief(context);
  }
  if (lower.includes('eat') || lower.includes('food') || lower.includes('nutrition')) {
    return generateIGRISMessage('nutrition', context);
  }
  if (lower.includes('progress') || lower.includes('stats') || lower.includes('level')) {
    return generateIGRISMessage('weekly_analysis', context);
  }

  // Default: contextual motivation
  return generateIGRISMessage('general', context);
}
