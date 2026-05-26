// lib/igris/contextBuilder.ts
// Builds a rich, structured context object from all player/workout data
// This is the single source of truth for what IGRIS knows about the hunter

import type { Player } from '@/types/player';
import type { WorkoutSession } from '@/types/workout';

export interface IGRISFullContext {
  // Identity
  hunterName: string;
  level: number;
  rank: string;
  title: string;

  // Progression
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  totalWorkouts: number;

  // Stats
  stats: { STR: number; AGI: number; END: number; VIT: number; INT: number };
  weakestStat: string;
  strongestStat: string;

  // Streak & Consistency
  streak: number;
  longestStreak: number;
  daysSinceLastWorkout: number;
  consistencyScore: number; // 0-100
  lastWorkoutDate: string | null;

  // Session history
  sessionsThisWeek: number;
  sessionsLastWeek: number;
  recentSessionDates: string[];
  avgXPPerSession: number;

  // Time context
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  hour: number;
  dayOfWeek: string;

  // Physical context (fixed player profile)
  environment: 'hostel - no equipment';
  primaryGoal: 'fat loss + aesthetic physique';
  weaknesses: 'stamina, breathing endurance';
  trainingDuration: '~60 minutes daily';
  transformationPhase: string; // based on days since join

  // AI state
  igrisState: IGRISState;
}

export type IGRISState =
  | 'STANDBY'
  | 'ANALYZING'
  | 'ALERT'
  | 'RECOVERY'
  | 'SHADOW_COMMANDER'
  | 'NIGHT_WATCH';

function getTimeOfDay(hour: number): IGRISFullContext['timeOfDay'] {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

function getDaysSinceLastWorkout(lastDate: string | null): number {
  if (!lastDate) return 999;
  return Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000);
}

function getConsistencyScore(player: Player, sessions: WorkoutSession[]): number {
  const daysSinceJoin = Math.max(1, Math.floor(
    (Date.now() - new Date(player.joinDate).getTime()) / 86400000
  ));
  const completedSessions = sessions.filter(s => s.completed).length;
  return Math.min(100, Math.round((completedSessions / daysSinceJoin) * 100));
}

function getTransformationPhase(joinDate: string): string {
  const days = Math.floor((Date.now() - new Date(joinDate).getTime()) / 86400000);
  if (days < 7)  return 'Initiation (Week 1)';
  if (days < 30) return 'Foundation (Month 1)';
  if (days < 90) return 'Development (Months 1-3)';
  if (days < 180) return 'Transformation (Months 3-6)';
  return 'Mastery (6+ months)';
}

function getWeekSessions(sessions: WorkoutSession[], weeksAgo = 0): WorkoutSession[] {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay() - weeksAgo * 7);
  startOfThisWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfThisWeek);
  endOfWeek.setDate(startOfThisWeek.getDate() + 7);

  return sessions.filter(s => {
    const d = new Date(s.date);
    return s.completed && d >= startOfThisWeek && d < endOfWeek;
  });
}

function deriveIGRISState(
  daysSince: number,
  streak: number,
  hour: number,
  consistencyScore: number
): IGRISState {
  if (hour >= 22 || hour < 5) return 'NIGHT_WATCH';
  if (daysSince >= 2) return 'ALERT';
  if (streak >= 7 && consistencyScore >= 60) return 'SHADOW_COMMANDER';
  if (daysSince === 0 && consistencyScore >= 40) return 'RECOVERY';
  return 'STANDBY';
}

export function buildFullContext(
  player: Player,
  sessions: WorkoutSession[]
): IGRISFullContext {
  const now = new Date();
  const hour = now.getHours();
  const daysSince = getDaysSinceLastWorkout(player.lastWorkoutDate);
  const consistencyScore = getConsistencyScore(player, sessions);
  const thisWeekSessions = getWeekSessions(sessions, 0);
  const lastWeekSessions = getWeekSessions(sessions, 1);
  const recentSessions = sessions.filter(s => s.completed).slice(0, 5);
  const totalXPFromSessions = sessions.filter(s => s.completed).reduce((a, s) => a + s.totalXP, 0);
  const completedCount = sessions.filter(s => s.completed).length;

  const statEntries = Object.entries(player.stats) as [string, number][];
  const weakestStat = statEntries.reduce((a, b) => b[1] < a[1] ? b : a)[0];
  const strongestStat = statEntries.reduce((a, b) => b[1] > a[1] ? b : a)[0];

  const igrisState = deriveIGRISState(daysSince, player.streak, hour, consistencyScore);

  return {
    hunterName: player.name,
    level: player.level,
    rank: player.rank,
    title: player.title,
    currentXP: player.currentXP,
    xpToNextLevel: player.xpToNextLevel,
    totalXP: player.totalXP,
    totalWorkouts: player.totalWorkouts,
    stats: player.stats,
    weakestStat,
    strongestStat,
    streak: player.streak,
    longestStreak: player.longestStreak,
    daysSinceLastWorkout: daysSince,
    consistencyScore,
    lastWorkoutDate: player.lastWorkoutDate,
    sessionsThisWeek: thisWeekSessions.length,
    sessionsLastWeek: lastWeekSessions.length,
    recentSessionDates: recentSessions.map(s => s.date),
    avgXPPerSession: completedCount > 0 ? Math.round(totalXPFromSessions / completedCount) : 0,
    timeOfDay: getTimeOfDay(hour),
    hour,
    dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
    environment: 'hostel - no equipment',
    primaryGoal: 'fat loss + aesthetic physique',
    weaknesses: 'stamina, breathing endurance',
    trainingDuration: '~60 minutes daily',
    transformationPhase: getTransformationPhase(player.joinDate),
    igrisState,
  };
}
