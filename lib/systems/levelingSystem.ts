// lib/systems/levelingSystem.ts
import type { Player } from '@/types/player';

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.4));
}

export function addXP(player: Player, xpGained: number): {
  updatedPlayer: Player;
  leveledUp: boolean;
  levelsGained: number;
  rankedUp: boolean;
} {
  let { level, currentXP, totalXP } = player;
  let newCurrentXP = currentXP + xpGained;
  const newTotalXP = totalXP + xpGained;
  let levelsGained = 0;

  let xpNeeded = xpForLevel(level);
  while (newCurrentXP >= xpNeeded) {
    newCurrentXP -= xpNeeded;
    level += 1;
    levelsGained += 1;
    xpNeeded = xpForLevel(level);
  }

  const leveledUp = levelsGained > 0;
  const newRank = getRankForLevel(level);
  const rankedUp = newRank !== player.rank;

  const updatedPlayer: Player = {
    ...player,
    level,
    currentXP: newCurrentXP,
    xpToNextLevel: xpForLevel(level),
    totalXP: newTotalXP,
    rank: newRank,
    title: getTitleForLevel(level),
  };

  return { updatedPlayer, leveledUp, levelsGained, rankedUp };
}

export interface XPBreakdown {
  base: number;
  bonusSets: number;
  streakBonus: number;
  nutritionBonus: number;
  journalBonus: number;
  igrisBonus: number;
  total: number;
}

export function calculateWorkoutXP(params: {
  exercisesCompleted: number;
  setsCompleted: number;
  targetSets: number;
  streak: number;
  loggedNutrition?: boolean;
  loggedJournal?: boolean;
  talkedToIGRIS?: boolean;
}): XPBreakdown {
  const base = params.exercisesCompleted * 100;
  const bonusSets = Math.max(0, params.setsCompleted - params.targetSets) * 25;
  const streakBonus = Math.min(params.streak * 10, 50);
  const nutritionBonus = params.loggedNutrition ? 20 : 0;
  const journalBonus = params.loggedJournal ? 15 : 0;
  const igrisBonus = params.talkedToIGRIS ? 10 : 0;
  const total = base + bonusSets + streakBonus + nutritionBonus + journalBonus + igrisBonus;

  return { base, bonusSets, streakBonus, nutritionBonus, journalBonus, igrisBonus, total };
}

export function getRankForLevel(level: number): Player['rank'] {
  if (level >= 100) return 'Shadow Monarch';
  if (level >= 71) return 'S';
  if (level >= 51) return 'A';
  if (level >= 36) return 'B';
  if (level >= 21) return 'C';
  if (level >= 11) return 'D';
  return 'E';
}

export function getTitleForLevel(level: number): string {
  if (level >= 100) return 'Shadow Monarch';
  if (level >= 71) return 'S-Rank Hunter';
  if (level >= 51) return 'A-Rank Hunter';
  if (level >= 36) return 'B-Rank Hunter';
  if (level >= 21) return 'C-Rank Hunter';
  if (level >= 11) return 'D-Rank Hunter';
  if (level >= 6) return 'E-Rank Hunter';
  if (level >= 3) return 'Awakened One';
  return 'Newly Awakened';
}

export function xpProgressPercent(currentXP: number, xpToNextLevel: number): number {
  if (xpToNextLevel === 0) return 100;
  return Math.min(100, Math.round((currentXP / xpToNextLevel) * 100));
}

export const RANK_DATA: Record<Player['rank'], {
  label: string;
  color: string;
  glowColor: string;
  flavorText: string;
  bgGradient: string;
}> = {
  'E': {
    label: 'E-Rank',
    color: '#8892b0',
    glowColor: 'rgba(136, 146, 176, 0.3)',
    flavorText: 'You have awakened. Begin.',
    bgGradient: 'from-slate-800 to-slate-900',
  },
  'D': {
    label: 'D-Rank',
    color: '#60a5fa',
    glowColor: 'rgba(96, 165, 250, 0.3)',
    flavorText: 'Your shadows stir.',
    bgGradient: 'from-blue-900 to-slate-900',
  },
  'C': {
    label: 'C-Rank',
    color: '#34d399',
    glowColor: 'rgba(52, 211, 153, 0.3)',
    flavorText: 'The gate opens.',
    bgGradient: 'from-emerald-900 to-slate-900',
  },
  'B': {
    label: 'B-Rank',
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.3)',
    flavorText: 'A true hunter emerges.',
    bgGradient: 'from-violet-900 to-slate-900',
  },
  'A': {
    label: 'A-Rank',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    flavorText: 'Few reach this.',
    bgGradient: 'from-amber-900 to-slate-900',
  },
  'S': {
    label: 'S-Rank',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    flavorText: 'You are feared.',
    bgGradient: 'from-red-900 to-slate-900',
  },
  'National': {
    label: 'National Level',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.5)',
    flavorText: 'Nations bow before you.',
    bgGradient: 'from-orange-900 to-slate-900',
  },
  'Shadow Monarch': {
    label: 'Shadow Monarch',
    color: '#7c3aed',
    glowColor: 'rgba(124, 58, 237, 0.6)',
    flavorText: 'I alone level up.',
    bgGradient: 'from-purple-950 to-black',
  },
};
