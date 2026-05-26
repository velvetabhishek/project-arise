// types/igris.ts — Updated for Phase 4 AI integration
export type IGRISMessageType =
  | 'greeting'
  | 'pre_workout'
  | 'post_workout'
  | 'streak_warning'
  | 'streak_danger'
  | 'streak_milestone'
  | 'level_up'
  | 'rank_up'
  | 'recovery'
  | 'nutrition'
  | 'weekly_analysis'
  | 'achievement'
  | 'motivation'
  | 'general';

export interface IGRISMessage {
  id: string;
  type: IGRISMessageType;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

// Legacy context — kept for igrisEngine.ts compatibility
export interface IGRISContext {
  playerLevel: number;
  playerRank: string;
  streak: number;
  lastWorkoutDate: string | null;
  energyLevel?: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  daysSinceLastWorkout: number;
}

// Note: IGRISState (the mood union type) is now in lib/igris/contextBuilder.ts
// Import from there: import type { IGRISState } from '@/lib/igris/contextBuilder'
