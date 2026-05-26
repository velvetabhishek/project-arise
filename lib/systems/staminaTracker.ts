// lib/systems/staminaTracker.ts
// Endurance evolution + breathing adaptation tracking
// Derives trends from existing workout sessions and player stat history

import type { WorkoutSession } from '@/types/workout';
import type { StaminaSnapshot } from '@/types/recovery';

export interface StaminaTrend {
  direction: 'improving' | 'stable' | 'declining';
  label: string;
  color: string;
  percentageChange: number;
  observation: string;
}

export interface EnduranceMetrics {
  currentEndurance: number;     // END stat
  breathingAdaptation: number;  // 0-100 derived metric
  sessionCompletionRate: number; // % of exercises not skipped
  weeklyMomentum: number;       // sessions this week vs last
  recoverySpeed: string;        // 'fast' | 'moderate' | 'slow'
}

/**
 * Compute the breathing adaptation score
 * Based on consistency + endurance stat progression
 */
export function computeBreathingAdaptation(params: {
  endStat: number;
  totalWorkouts: number;
  consistencyScore: number;
}): number {
  const { endStat, totalWorkouts, consistencyScore } = params;
  // More workouts + higher END + consistency = better breathing adaptation
  const baseAdaptation = Math.min(100, (endStat / 200) * 50 + (totalWorkouts / 100) * 30 + consistencyScore * 0.2);
  return Math.round(baseAdaptation);
}

/**
 * Compute weekly momentum: sessions this week vs last week
 */
export function computeWeeklyMomentum(sessions: WorkoutSession[]): {
  thisWeek: number; lastWeek: number; ratio: number;
} {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

  const completed = sessions.filter(s => s.completed);
  const thisWeek = completed.filter(s => new Date(s.date) >= startOfThisWeek).length;
  const lastWeek = completed.filter(s => {
    const d = new Date(s.date);
    return d >= startOfLastWeek && d < startOfThisWeek;
  }).length;

  const ratio = lastWeek === 0 ? (thisWeek > 0 ? 1.5 : 1) : thisWeek / lastWeek;
  return { thisWeek, lastWeek, ratio };
}

/**
 * Derive stamina trend from sessions (compare last 2 weeks)
 */
export function getStaminaTrend(sessions: WorkoutSession[], endStat: number): StaminaTrend {
  const { ratio } = computeWeeklyMomentum(sessions);

  if (ratio >= 1.3) {
    return {
      direction: 'improving',
      label: 'Improving',
      color: '#10b981',
      percentageChange: Math.round((ratio - 1) * 100),
      observation: 'Endurance trajectory is positive. Breathing adaptation progressing.',
    };
  }
  if (ratio <= 0.7) {
    return {
      direction: 'declining',
      label: 'Declining',
      color: '#ef4444',
      percentageChange: Math.round((1 - ratio) * 100),
      observation: 'Consistency drop detected. Stamina adaptation may regress.',
    };
  }
  return {
    direction: 'stable',
    label: 'Stable',
    color: '#60a5fa',
    percentageChange: 0,
    observation: 'Training volume stable. Maintain current frequency to advance.',
  };
}

/**
 * Get endurance label from END stat value
 */
export function getEnduranceLabel(endStat: number): string {
  if (endStat >= 150) return 'Elite Endurance';
  if (endStat >= 100) return 'Advanced';
  if (endStat >= 70)  return 'Developing';
  if (endStat >= 40)  return 'Building Base';
  if (endStat >= 20)  return 'Early Stage';
  return 'Initializing';
}

/**
 * Build a timeline of stamina snapshots from session history
 * Groups sessions by week and tracks XP/consistency
 */
export function buildStaminaTimeline(
  sessions: WorkoutSession[],
  currentEnd: number,
  currentVit: number
): StaminaSnapshot[] {
  const completed = sessions.filter(s => s.completed).slice().reverse(); // oldest first
  if (completed.length === 0) return [];

  // Group by week number (last 8 weeks)
  const weeks: Map<string, WorkoutSession[]> = new Map();
  completed.forEach(s => {
    const d = new Date(s.date);
    const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}-${d.getMonth()}`;
    if (!weeks.has(weekKey)) weeks.set(weekKey, []);
    weeks.get(weekKey)!.push(s);
  });

  const result: StaminaSnapshot[] = [];
  let cumulativeWorkouts = 0;

  weeks.forEach((weekSessions, weekKey) => {
    cumulativeWorkouts += weekSessions.length;
    const avgXP = Math.round(weekSessions.reduce((a, s) => a + s.totalXP, 0) / weekSessions.length);
    const consistency = Math.min(100, Math.round((weekSessions.length / 7) * 100));

    // Estimate END stat progression (simple linear from base 10)
    const estimatedEnd = Math.min(currentEnd, 10 + Math.floor(cumulativeWorkouts * 0.8));

    result.push({
      date: weekSessions[weekSessions.length - 1].date,
      endurance: estimatedEnd,
      vitality: Math.min(currentVit, 10 + Math.floor(cumulativeWorkouts * 0.5)),
      totalWorkouts: cumulativeWorkouts,
      consistencyScore: consistency,
      avgSessionXP: avgXP,
    });
  });

  return result.slice(-8); // last 8 data points
}
