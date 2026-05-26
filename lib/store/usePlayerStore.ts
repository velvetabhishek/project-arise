// lib/store/usePlayerStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Player, PlayerStats } from '@/types/player';
import { DEFAULT_PLAYER } from '@/types/player';
import { addXP, getRankForLevel, getTitleForLevel, xpForLevel } from '@/lib/systems/levelingSystem';
import { addStatPoints } from '@/lib/systems/statSystem';
import type { StatKey } from '@/types/workout';

interface PlayerStore {
  player: Player;
  // Actions
  setPlayerName: (name: string) => void;
  gainXP: (amount: number) => { leveledUp: boolean; rankedUp: boolean; levelsGained: number };
  gainStats: (gains: Partial<Record<StatKey, number>>) => void;
  completeWorkout: () => void;
  updateStreak: () => void;
  breakStreak: () => void;
  resetPlayer: () => void;
  // Derived helpers
  getXPPercent: () => number;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      player: DEFAULT_PLAYER,

      setPlayerName: (name) =>
        set((state) => ({
          player: { ...state.player, name },
        })),

      gainXP: (amount) => {
        const { player } = get();
        const { updatedPlayer, leveledUp, levelsGained, rankedUp } = addXP(player, amount);
        set({ player: updatedPlayer });
        return { leveledUp, rankedUp, levelsGained };
      },

      gainStats: (gains) =>
        set((state) => ({
          player: {
            ...state.player,
            stats: addStatPoints(state.player.stats, gains),
          },
        })),

      completeWorkout: () =>
        set((state) => ({
          player: {
            ...state.player,
            totalWorkouts: state.player.totalWorkouts + 1,
            lastWorkoutDate: new Date().toISOString(),
          },
        })),

      updateStreak: () =>
        set((state) => {
          const { player } = state;
          const newStreak = player.streak + 1;
          return {
            player: {
              ...player,
              streak: newStreak,
              longestStreak: Math.max(newStreak, player.longestStreak),
              lastWorkoutDate: new Date().toISOString(),
            },
          };
        }),

      breakStreak: () =>
        set((state) => ({
          player: { ...state.player, streak: 0 },
        })),

      resetPlayer: () => set({ player: DEFAULT_PLAYER }),

      getXPPercent: () => {
        const { player } = get();
        if (player.xpToNextLevel === 0) return 100;
        return Math.min(100, Math.round((player.currentXP / player.xpToNextLevel) * 100));
      },
    }),
    {
      name: 'arise-player-store',
      version: 1,
    }
  )
);
