// lib/systems/adaptiveMission.ts
// Intelligent mission adaptation layer on top of existing missionSystem
// Does NOT modify missionSystem — wraps it with context-aware modifiers

import { getTodaysMission } from './missionSystem';
import type { DailyMission } from '@/types/workout';
import type { AdaptiveMissionModifiers, RecoveryScore, IntensityLevel } from '@/types/recovery';

interface AdaptiveInput {
  playerLevel: number;
  streak: number;
  daysSinceLastWorkout: number;
  consistencyScore: number;       // 0-100
  hour: number;
  recoveryScore?: RecoveryScore | null;
}

type MissionTier = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

function getMissionTier(streak: number, consistencyScore: number, playerLevel: number): MissionTier {
  const score = streak * 2 + consistencyScore * 0.3 + playerLevel * 0.5;
  if (score >= 80) return 'S';
  if (score >= 60) return 'A';
  if (score >= 45) return 'B';
  if (score >= 30) return 'C';
  if (score >= 15) return 'D';
  return 'E';
}

function buildModifiers(input: AdaptiveInput): AdaptiveMissionModifiers {
  const { streak, daysSinceLastWorkout, consistencyScore, hour, recoveryScore, playerLevel } = input;

  let intensityMultiplier = 1.0;
  let xpMultiplier = 1.0;
  let recommendedType: string | null = null;
  let adaptationNote = '';
  let isReEntry = false;
  let isOverload = false;

  const tier = getMissionTier(streak, consistencyScore, playerLevel);

  // ── Re-entry after skip ────────────────────────────────────────
  if (daysSinceLastWorkout >= 3) {
    intensityMultiplier = 0.65;
    xpMultiplier = 0.8;
    recommendedType = 'CARDIO_CORE'; // gentler re-entry
    adaptationNote = `Re-entry protocol. ${daysSinceLastWorkout}d absence detected. Intensity reduced.`;
    isReEntry = true;
  } else if (daysSinceLastWorkout === 2) {
    intensityMultiplier = 0.80;
    adaptationNote = '2-day gap detected. Moderate re-entry session assigned.';
    isReEntry = true;
  }

  // ── Recovery score override ─────────────────────────────────────
  if (recoveryScore) {
    if (recoveryScore.score < 25) {
      intensityMultiplier = Math.min(intensityMultiplier, 0.5);
      recommendedType = 'RECOVERY_ONLY';
      adaptationNote = 'Recovery-critical state. Active recovery session only.';
    } else if (recoveryScore.score < 40) {
      intensityMultiplier = Math.min(intensityMultiplier, 0.75);
      recommendedType = 'CARDIO_CORE';
      adaptationNote = `Recovery compromised (${recoveryScore.score}/100). Intensity reduced.`;
    } else if (recoveryScore.score >= 85 && !isReEntry) {
      intensityMultiplier = Math.max(intensityMultiplier, 1.15);
      xpMultiplier = 1.2;
      adaptationNote = 'High-output state detected. Progressive overload authorized.';
      isOverload = true;
    }
  }

  // ── Streak momentum ─────────────────────────────────────────────
  if (!isReEntry && streak >= 14) {
    xpMultiplier = Math.max(xpMultiplier, 1.25);
    if (!isOverload) adaptationNote = `${streak}d streak. Elite momentum. Bonus XP active.`;
    isOverload = true;
  } else if (!isReEntry && streak >= 7) {
    xpMultiplier = Math.max(xpMultiplier, 1.15);
    if (!adaptationNote) adaptationNote = `${streak}d streak. Momentum bonus active.`;
  }

  // ── Late night reduction ─────────────────────────────────────────
  if (hour >= 22 || hour < 5) {
    intensityMultiplier *= 0.80;
    recommendedType = recommendedType ?? 'CARDIO_CORE';
    adaptationNote = adaptationNote || 'Night protocol. Reduced intensity + breathing focus.';
  } else if (hour >= 21) {
    intensityMultiplier *= 0.90;
    if (!adaptationNote) adaptationNote = 'Evening session. Moderate intensity recommended.';
  }

  // ── Consistency bonus ─────────────────────────────────────────────
  if (consistencyScore >= 75 && !isReEntry && !adaptationNote) {
    adaptationNote = 'Consistent hunter. Standard parameters. Keep the momentum.';
  }

  if (!adaptationNote) adaptationNote = 'Mission parameters nominal. Execute as assigned.';

  // Clamp multipliers
  intensityMultiplier = Math.max(0.5, Math.min(1.3, intensityMultiplier));
  xpMultiplier = Math.max(0.7, Math.min(1.3, xpMultiplier));

  return {
    intensityMultiplier,
    xpMultiplier,
    recommendedType,
    adaptationNote,
    missionTier: tier,
    isReEntry,
    isOverload,
  };
}

export interface AdaptedMission {
  mission: DailyMission;
  modifiers: AdaptiveMissionModifiers;
  estimatedXP: number;
}

export function getAdaptedMission(input: AdaptiveInput): AdaptedMission {
  let mission = getTodaysMission(input.playerLevel);
  const modifiers = buildModifiers(input);

  // Apply XP multiplier to mission total
  const estimatedXP = Math.round(mission.totalXP * modifiers.xpMultiplier);

  // Modify exercise sets/reps based on intensity multiplier
  if (modifiers.intensityMultiplier !== 1.0) {
    mission = {
      ...mission,
      exercises: mission.exercises.map(ex => ({
        ...ex,
        sets: Math.max(1, Math.round(ex.sets * modifiers.intensityMultiplier)),
        reps: ex.reps ? Math.max(1, Math.round(ex.reps * modifiers.intensityMultiplier)) : undefined,
        duration: ex.duration ? Math.max(10, Math.round(ex.duration * modifiers.intensityMultiplier)) : undefined,
      })),
    };
  }

  // Add tier prefix to mission title
  const tierPrefix = modifiers.missionTier === 'S' ? '⚡ ' :
                     modifiers.missionTier === 'A' ? '🔥 ' : '';
  if (tierPrefix) {
    mission = { ...mission, title: tierPrefix + mission.title };
  }

  return { mission, modifiers, estimatedXP };
}

// Tier color config
export const MISSION_TIER_CONFIG: Record<MissionTier, { color: string; label: string; glow: string }> = {
  E: { color: '#8892b0', label: 'E-Tier Mission', glow: 'rgba(136,146,176,0.3)' },
  D: { color: '#60a5fa', label: 'D-Tier Mission', glow: 'rgba(96,165,250,0.3)' },
  C: { color: '#34d399', label: 'C-Tier Mission', glow: 'rgba(52,211,153,0.3)' },
  B: { color: '#a78bfa', label: 'B-Tier Mission', glow: 'rgba(167,139,250,0.3)' },
  A: { color: '#f59e0b', label: 'A-Tier Mission', glow: 'rgba(245,158,11,0.4)' },
  S: { color: '#ef4444', label: 'S-Tier Mission', glow: 'rgba(239,68,68,0.5)' },
};
