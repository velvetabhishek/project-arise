// lib/systems/titleSystem.ts
// Dynamic player title engine — behavior-driven, IGRIS-aware
// Titles are earned through patterns, not just levels

import type { Player } from '@/types/player';

export interface TitleDef {
  id: string;
  title: string;
  subtitle: string;
  igrisReference: string;   // How IGRIS addresses this title holder
  color: string;
  check: (player: Player, context: TitleContext) => boolean;
  priority: number;         // Higher = shown first
}

export interface TitleContext {
  streak: number;
  workoutHour?: number;     // hour of last workout
  totalWorkouts: number;
  nutritionGrade?: string;
  hydrationStreak?: number;
  recoveryStreak?: number;
  missionsThisWeek?: number;
  daysSinceJoin: number;
}

// All title definitions — highest priority wins
export const TITLE_DEFINITIONS: TitleDef[] = [
  // ── Legendary / Endgame ────────────────────────────────────────────
  {
    id: 'shadow_monarch',
    title: 'Shadow Monarch',
    subtitle: 'Absolute Authority',
    igrisReference: 'My King',
    color: '#7c3aed',
    check: (p) => p.rank === 'Shadow Monarch',
    priority: 100,
  },
  {
    id: 'national_hunter',
    title: 'National Hunter',
    subtitle: 'Beyond Rank',
    igrisReference: 'Commander',
    color: '#f97316',
    check: (p) => p.rank === 'National',
    priority: 90,
  },
  {
    id: 's_rank',
    title: 'S-Rank Hunter',
    subtitle: 'The Feared',
    igrisReference: 'Hunter',
    color: '#ef4444',
    check: (p) => p.rank === 'S',
    priority: 80,
  },

  // ── Streak Titles ──────────────────────────────────────────────────
  {
    id: 'shadow_discipline',
    title: 'Shadow Discipline',
    subtitle: 'Unbroken Chain',
    igrisReference: 'Disciplined One',
    color: '#a78bfa',
    check: (p, ctx) => ctx.streak >= 66,
    priority: 70,
  },
  {
    id: 'iron_consistency',
    title: 'Iron Consistency',
    subtitle: '21-Day Lock',
    igrisReference: 'Consistent Operator',
    color: '#60a5fa',
    check: (p, ctx) => ctx.streak >= 21,
    priority: 60,
  },
  {
    id: 'seven_shadows',
    title: 'Seven Shadows',
    subtitle: '7-Day Streak',
    igrisReference: 'Shadow Trainee',
    color: '#3b82f6',
    check: (p, ctx) => ctx.streak >= 7,
    priority: 50,
  },

  // ── Time-based Titles ─────────────────────────────────────────────
  {
    id: 'night_runner',
    title: 'Night Runner',
    subtitle: 'Trains in Darkness',
    igrisReference: 'Night Operative',
    color: '#6366f1',
    check: (_p, ctx) => (ctx.workoutHour ?? 12) >= 22,
    priority: 45,
  },
  {
    id: 'dawn_warrior',
    title: 'Dawn Warrior',
    subtitle: 'First Light Training',
    igrisReference: 'Early Riser',
    color: '#f59e0b',
    check: (_p, ctx) => (ctx.workoutHour ?? 12) < 6,
    priority: 44,
  },

  // ── Volume Titles ─────────────────────────────────────────────────
  {
    id: 'tactical_survivor',
    title: 'Tactical Survivor',
    subtitle: '30+ Sessions',
    igrisReference: 'Survivor',
    color: '#10b981',
    check: (_p, ctx) => ctx.totalWorkouts >= 30,
    priority: 40,
  },
  {
    id: 'field_operative',
    title: 'Field Operative',
    subtitle: '10+ Sessions',
    igrisReference: 'Operative',
    color: '#34d399',
    check: (_p, ctx) => ctx.totalWorkouts >= 10,
    priority: 30,
  },

  // ── Nutrition Titles ─────────────────────────────────────────────
  {
    id: 'nutrition_sovereign',
    title: 'Nutrition Sovereign',
    subtitle: 'S-Grade Fuel',
    igrisReference: 'Fueled Commander',
    color: '#10b981',
    check: (_p, ctx) => ctx.nutritionGrade === 'S',
    priority: 35,
  },
  {
    id: 'hydration_disciple',
    title: 'Hydration Disciple',
    subtitle: 'System Hydrated',
    igrisReference: 'Hydrated Hunter',
    color: '#60a5fa',
    check: (_p, ctx) => (ctx.hydrationStreak ?? 0) >= 3,
    priority: 25,
  },

  // ── Rank Progression Titles ─────────────────────────────────────
  {
    id: 'discipline_candidate',
    title: 'Discipline Candidate',
    subtitle: 'Under Assessment',
    igrisReference: 'Candidate',
    color: '#a78bfa',
    check: (p) => p.rank === 'B' || p.rank === 'A',
    priority: 20,
  },
  {
    id: 'shadow_trainee',
    title: 'Shadow Trainee',
    subtitle: 'Gate Cleared',
    igrisReference: 'Trainee',
    color: '#8892b0',
    check: (p) => p.rank === 'C' || p.rank === 'D',
    priority: 10,
  },

  // ── Default ─────────────────────────────────────────────────────
  {
    id: 'newly_awakened',
    title: 'Newly Awakened',
    subtitle: 'The System Stirs',
    igrisReference: 'Hunter',
    color: '#8892b0',
    check: () => true,
    priority: 0,
  },
];

// Compute the active title for the current player state
export function computeActiveTitle(player: Player, context: TitleContext): TitleDef {
  const matching = TITLE_DEFINITIONS
    .filter(def => def.check(player, context))
    .sort((a, b) => b.priority - a.priority);
  return matching[0] ?? TITLE_DEFINITIONS[TITLE_DEFINITIONS.length - 1];
}

// Get IGRIS reference for a player
export function getIGRISReference(player: Player, context: TitleContext): string {
  const title = computeActiveTitle(player, context);
  return title.igrisReference;
}

// Build title context from available stores/data
export function buildTitleContext(params: {
  streak: number;
  totalWorkouts: number;
  joinDate: string;
  workoutHour?: number;
  nutritionGrade?: string;
  hydrationStreak?: number;
}): TitleContext {
  return {
    streak: params.streak,
    totalWorkouts: params.totalWorkouts,
    daysSinceJoin: Math.floor((Date.now() - new Date(params.joinDate).getTime()) / 86400000),
    workoutHour: params.workoutHour,
    nutritionGrade: params.nutritionGrade,
    hydrationStreak: params.hydrationStreak,
  };
}
