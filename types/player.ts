// types/player.ts
export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Shadow Monarch';

export interface PlayerStats {
  STR: number;
  AGI: number;
  END: number;
  VIT: number;
  INT: number;
}

export interface BodyCheckIn {
  date: string;
  weight?: number;
  chest?: number;
  waist?: number;
  thighs?: number;
  arms?: number;
  energyLevel: number;
  breathingRating: number;
  sleepQuality: number;
  motivationLevel: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: string | null;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Player {
  name: string;
  level: number;
  rank: Rank;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  stats: PlayerStats;
  streak: number;
  longestStreak: number;
  lastWorkoutDate: string | null;
  streakFreezes: number;
  streakFreezeUsedThisWeek: boolean;
  joinDate: string;
  totalWorkouts: number;
  achievements: Achievement[];
  checkIns: BodyCheckIn[];
  title: string;
}

export const DEFAULT_PLAYER: Player = {
  name: 'Hunter',
  level: 1,
  rank: 'E',
  currentXP: 0,
  xpToNextLevel: 100,
  totalXP: 0,
  stats: {
    STR: 10,
    AGI: 10,
    END: 10,
    VIT: 10,
    INT: 10,
  },
  streak: 0,
  longestStreak: 0,
  lastWorkoutDate: null,
  streakFreezes: 1,
  streakFreezeUsedThisWeek: false,
  joinDate: new Date().toISOString(),
  totalWorkouts: 0,
  achievements: [],
  checkIns: [],
  title: 'Newly Awakened',
};
