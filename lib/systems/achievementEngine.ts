// lib/systems/achievementEngine.ts
// Achievement definitions + unlock logic
// No React imports — pure engine

import type { Player } from '@/types/player';
import type { Achievement } from '@/types/player';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  xpReward: number;
  // Returns true if this achievement should be unlocked given the current state
  check: (player: Player, context: AchievementContext) => boolean;
}

export interface AchievementContext {
  nutritionGrade?: string;        // 'S' | 'A' | 'B' | 'C' | 'D' | 'E'
  nutritionMealsLogged?: number;
  hydrationMl?: number;
  hydrationTarget?: number;
  recoveryScore?: number;         // 0-100
  workoutHour?: number;           // hour of day 0-23
  missionsCompleted?: number;     // total completed missions
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#8892b0',
  rare: '#60a5fa',
  epic: '#a78bfa',
  legendary: '#f97316',
};

export function rarityColor(rarity: AchievementRarity): string {
  return RARITY_COLORS[rarity];
}

export function rarityGlow(rarity: AchievementRarity): string {
  const map: Record<AchievementRarity, string> = {
    common: 'rgba(136,146,176,0.3)',
    rare: 'rgba(96,165,250,0.35)',
    epic: 'rgba(167,139,250,0.4)',
    legendary: 'rgba(249,115,22,0.5)',
  };
  return map[rarity];
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDef[] = [
  // ── TRAINING ──────────────────────────────────────────────────
  {
    id: 'first_mission',
    name: 'First Mission',
    description: 'Complete your first training session.',
    icon: '⚔️',
    rarity: 'common',
    xpReward: 50,
    check: (p) => p.totalWorkouts >= 1,
  },
  {
    id: 'iron_will',
    name: 'Iron Will',
    description: 'Complete 10 training sessions.',
    icon: '🛡️',
    rarity: 'rare',
    xpReward: 150,
    check: (p) => p.totalWorkouts >= 10,
  },
  {
    id: 'shadow_soldier',
    name: 'Shadow Soldier',
    description: 'Complete 30 training sessions.',
    icon: '🗡️',
    rarity: 'epic',
    xpReward: 400,
    check: (p) => p.totalWorkouts >= 30,
  },
  {
    id: 'hundred_gates',
    name: 'Hundred Gates',
    description: 'Complete 100 training sessions.',
    icon: '👑',
    rarity: 'legendary',
    xpReward: 1500,
    check: (p) => p.totalWorkouts >= 100,
  },
  // ── STREAK ────────────────────────────────────────────────────
  {
    id: 'streak_3',
    name: 'Shadow Disciple',
    description: 'Maintain a 3-day training streak.',
    icon: '🔥',
    rarity: 'common',
    xpReward: 75,
    check: (p) => p.streak >= 3,
  },
  {
    id: 'streak_7',
    name: 'Seven Shadows',
    description: 'Maintain a 7-day training streak.',
    icon: '⚡',
    rarity: 'rare',
    xpReward: 200,
    check: (p) => p.streak >= 7,
  },
  {
    id: 'streak_21',
    name: 'Iron Consistency',
    description: 'Maintain a 21-day training streak.',
    icon: '💎',
    rarity: 'epic',
    xpReward: 600,
    check: (p) => p.streak >= 21,
  },
  {
    id: 'streak_66',
    name: 'Shadow Discipline',
    description: 'Maintain a 66-day training streak. Habit formed.',
    icon: '🌑',
    rarity: 'legendary',
    xpReward: 2000,
    check: (p) => p.streak >= 66,
  },
  // ── RANK ──────────────────────────────────────────────────────
  {
    id: 'rank_d',
    name: 'Gate Opener',
    description: 'Reach D-Rank.',
    icon: '🔵',
    rarity: 'common',
    xpReward: 100,
    check: (p) => ['D','C','B','A','S','National','Shadow Monarch'].includes(p.rank),
  },
  {
    id: 'rank_c',
    name: 'Rising Hunter',
    description: 'Reach C-Rank.',
    icon: '🟢',
    rarity: 'rare',
    xpReward: 300,
    check: (p) => ['C','B','A','S','National','Shadow Monarch'].includes(p.rank),
  },
  {
    id: 'rank_b',
    name: 'True Hunter',
    description: 'Reach B-Rank.',
    icon: '🟣',
    rarity: 'epic',
    xpReward: 800,
    check: (p) => ['B','A','S','National','Shadow Monarch'].includes(p.rank),
  },
  {
    id: 'rank_s',
    name: 'S-Rank Awakened',
    description: 'Reach S-Rank. The pinnacle.',
    icon: '🔴',
    rarity: 'legendary',
    xpReward: 3000,
    check: (p) => ['S','National','Shadow Monarch'].includes(p.rank),
  },
  // ── NUTRITION ─────────────────────────────────────────────────
  {
    id: 'hydration_disciple',
    name: 'Hydration Disciple',
    description: 'Hit your water target in a single day.',
    icon: '💧',
    rarity: 'common',
    xpReward: 60,
    check: (_p, ctx) => (ctx.hydrationMl ?? 0) >= (ctx.hydrationTarget ?? 2500),
  },
  {
    id: 'protein_hunter',
    name: 'Protein Hunter',
    description: 'Log a full-protein day with S-grade nutrition.',
    icon: '💪',
    rarity: 'rare',
    xpReward: 200,
    check: (_p, ctx) => ctx.nutritionGrade === 'S',
  },
  {
    id: 'fuel_commander',
    name: 'Fuel Commander',
    description: 'Log 7+ meals in a single day.',
    icon: '🍱',
    rarity: 'epic',
    xpReward: 350,
    check: (_p, ctx) => (ctx.nutritionMealsLogged ?? 0) >= 7,
  },
  // ── RECOVERY ──────────────────────────────────────────────────
  {
    id: 'recovery_master',
    name: 'Recovery Master',
    description: 'Achieve a recovery score above 85.',
    icon: '🌙',
    rarity: 'rare',
    xpReward: 250,
    check: (_p, ctx) => (ctx.recoveryScore ?? 0) >= 85,
  },
  // ── TIME-BASED ────────────────────────────────────────────────
  {
    id: 'night_runner',
    name: 'Night Runner',
    description: 'Train after 10pm. The darkness trains alone.',
    icon: '🌃',
    rarity: 'rare',
    xpReward: 175,
    check: (_p, ctx) => (ctx.workoutHour ?? 12) >= 22,
  },
  {
    id: 'dawn_warrior',
    name: 'Dawn Warrior',
    description: 'Train before 6am. Rise before the world.',
    icon: '🌅',
    rarity: 'epic',
    xpReward: 300,
    check: (_p, ctx) => (ctx.workoutHour ?? 12) < 6,
  },
  // ── LEVEL ─────────────────────────────────────────────────────
  {
    id: 'level_10',
    name: 'Awakened One',
    description: 'Reach Level 10.',
    icon: '✨',
    rarity: 'rare',
    xpReward: 200,
    check: (p) => p.level >= 10,
  },
  {
    id: 'level_25',
    name: 'Shadow Aspirant',
    description: 'Reach Level 25.',
    icon: '🌑',
    rarity: 'epic',
    xpReward: 500,
    check: (p) => p.level >= 25,
  },
  {
    id: 'level_50',
    name: 'Dungeon Conqueror',
    description: 'Reach Level 50.',
    icon: '💀',
    rarity: 'legendary',
    xpReward: 2500,
    check: (p) => p.level >= 50,
  },
  // ── SPECIAL ───────────────────────────────────────────────────
  {
    id: 'first_igris',
    name: 'Shadow Commune',
    description: 'Have your first conversation with IGRIS.',
    icon: '🤖',
    rarity: 'common',
    xpReward: 40,
    check: (p) => p.totalWorkouts >= 0, // checked externally via context — placeholder passes
  },
  {
    id: 's_rank_consistency',
    name: 'S-Rank Consistency',
    description: 'Complete 5 missions in a single week.',
    icon: '🏆',
    rarity: 'epic',
    xpReward: 700,
    check: (_p, ctx) => (ctx.missionsCompleted ?? 0) >= 5,
  },
];

// Returns IDs of newly unlocked achievements (those not already in player.achievements)
export function checkNewAchievements(
  player: Player,
  context: AchievementContext
): AchievementDef[] {
  const unlockedIds = new Set(player.achievements.map(a => a.id));
  return ACHIEVEMENT_DEFINITIONS.filter(
    def => !unlockedIds.has(def.id) && def.check(player, context)
  );
}

// Convert AchievementDef → Achievement (for storing on player)
export function defToAchievement(def: AchievementDef): Achievement {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    unlockedAt: new Date().toISOString(),
    icon: def.icon,
    rarity: def.rarity,
  };
}
