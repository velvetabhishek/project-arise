// lib/systems/statSystem.ts
import type { PlayerStats } from '@/types/player';
import type { StatKey } from '@/types/workout';

export const STAT_META: Record<StatKey, {
  label: string;
  fullLabel: string;
  color: string;
  glowColor: string;
  icon: string;
  description: string;
}> = {
  STR: {
    label: 'STR',
    fullLabel: 'Strength',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.4)',
    icon: '⚔️',
    description: 'Raw physical power. Gained from push exercises and resistance work.',
  },
  AGI: {
    label: 'AGI',
    fullLabel: 'Agility',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    icon: '⚡',
    description: 'Speed and coordination. Gained from HIIT, jumps, and dynamic movement.',
  },
  END: {
    label: 'END',
    fullLabel: 'Endurance',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    icon: '🫀',
    description: 'Cardiovascular capacity. Gained from cardio sessions and long-duration work.',
  },
  VIT: {
    label: 'VIT',
    fullLabel: 'Vitality',
    color: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    icon: '🌿',
    description: 'Recovery and health. Gained from sleep quality, nutrition, and rest days.',
  },
  INT: {
    label: 'INT',
    fullLabel: 'Intelligence',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    icon: '🧠',
    description: 'Mental fortitude. Gained from IGRIS interactions and journaling.',
  },
};

export function addStatPoints(
  stats: PlayerStats,
  gains: Partial<Record<StatKey, number>>
): PlayerStats {
  return {
    STR: stats.STR + (gains.STR || 0),
    AGI: stats.AGI + (gains.AGI || 0),
    END: stats.END + (gains.END || 0),
    VIT: stats.VIT + (gains.VIT || 0),
    INT: stats.INT + (gains.INT || 0),
  };
}

export function getTotalStatPoints(stats: PlayerStats): number {
  return stats.STR + stats.AGI + stats.END + stats.VIT + stats.INT;
}

/**
 * Returns a percentage value for radar chart display (0–100)
 * Max stat considered for 100% is 200
 */
export function statToPercent(value: number, max: number = 200): number {
  return Math.min(100, Math.round((value / max) * 100));
}

export function getStatGrade(value: number): string {
  if (value >= 150) return 'S';
  if (value >= 100) return 'A';
  if (value >= 70) return 'B';
  if (value >= 40) return 'C';
  if (value >= 20) return 'D';
  return 'E';
}
