// lib/systems/streakSystem.ts
import { differenceInCalendarDays, parseISO, isToday, isYesterday } from 'date-fns';
import type { Player } from '@/types/player';

export interface StreakStatus {
  isActive: boolean;
  canWorkoutToday: boolean;
  daysSinceLast: number;
  inDanger: boolean; // worked out yesterday but not today and it's evening
  broken: boolean;
}

export function getStreakStatus(player: Player): StreakStatus {
  const now = new Date();
  const { lastWorkoutDate, streak } = player;

  if (!lastWorkoutDate) {
    return {
      isActive: false,
      canWorkoutToday: true,
      daysSinceLast: 999,
      inDanger: false,
      broken: false,
    };
  }

  const lastDate = parseISO(lastWorkoutDate);
  const daysSinceLast = differenceInCalendarDays(now, lastDate);

  const workedOutToday = isToday(lastDate);
  const workedOutYesterday = isYesterday(lastDate);

  // Streak is broken if missed more than 1 day (without freeze)
  const broken = daysSinceLast > 1 && streak > 0;

  // In danger if it's past 6pm and haven't worked out today
  const currentHour = now.getHours();
  const inDanger = !workedOutToday && workedOutYesterday && currentHour >= 18;

  return {
    isActive: streak > 0 && !broken,
    canWorkoutToday: !workedOutToday,
    daysSinceLast,
    inDanger,
    broken,
  };
}

export function incrementStreak(player: Player): Player {
  const newStreak = player.streak + 1;
  const longestStreak = Math.max(newStreak, player.longestStreak);

  return {
    ...player,
    streak: newStreak,
    longestStreak,
    lastWorkoutDate: new Date().toISOString(),
  };
}

export function breakStreak(player: Player): Player {
  return {
    ...player,
    streak: 0,
    lastWorkoutDate: player.lastWorkoutDate,
  };
}

export function useStreakFreeze(player: Player): Player | null {
  if (player.streakFreezes <= 0 || player.streakFreezeUsedThisWeek) {
    return null; // Can't freeze
  }

  return {
    ...player,
    streakFreezes: player.streakFreezes - 1,
    streakFreezeUsedThisWeek: true,
    lastWorkoutDate: new Date().toISOString(), // Counts as "active" day
  };
}

export interface StreakMilestone {
  days: number;
  xpBonus: number;
  title: string;
  igrisMessage: string;
  badgeId: string;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  {
    days: 7,
    xpBonus: 50,
    title: 'Consistent',
    igrisMessage: 'Seven days. The foundation is set. Do not mistake this for the destination.',
    badgeId: 'streak_7',
  },
  {
    days: 14,
    xpBonus: 100,
    title: 'Disciplined',
    igrisMessage: 'Two weeks without failure. Your shadows are awakening.',
    badgeId: 'streak_14',
  },
  {
    days: 30,
    xpBonus: 250,
    title: 'Shadow Disciple',
    igrisMessage: 'A month of war. The system has acknowledged your will.',
    badgeId: 'streak_30',
  },
  {
    days: 60,
    xpBonus: 500,
    title: 'Iron Willed',
    igrisMessage: 'Sixty days. Most hunters fall before this. You have not.',
    badgeId: 'streak_60',
  },
  {
    days: 90,
    xpBonus: 1000,
    title: 'Shadow Commander',
    igrisMessage: 'Ninety days. The transformation is no longer potential. It is fact.',
    badgeId: 'streak_90',
  },
  {
    days: 180,
    xpBonus: 2500,
    title: 'Monarch\'s Guard',
    igrisMessage: 'Six months. You are no longer the person who started. The shadows bow to you.',
    badgeId: 'streak_180',
  },
  {
    days: 365,
    xpBonus: 10000,
    title: 'Shadow Monarch',
    igrisMessage: 'A full year. The system has no more tests for you. You are the system.',
    badgeId: 'streak_365',
  },
];

export function checkStreakMilestone(streak: number): StreakMilestone | null {
  return STREAK_MILESTONES.find(m => m.days === streak) || null;
}
