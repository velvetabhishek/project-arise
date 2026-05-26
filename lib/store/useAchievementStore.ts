// lib/store/useAchievementStore.ts
// Achievement unlock queue + popup state
// Separate from player store to avoid circular deps

import { create } from 'zustand';
import type { AchievementDef } from '@/lib/systems/achievementEngine';

interface AchievementStore {
  // Queue of achievements to display as popups
  pendingPopups: AchievementDef[];
  // Total XP bonus pending from unlocks
  pendingXP: number;
  
  // Actions
  queueAchievement: (def: AchievementDef) => void;
  dequeueAchievement: () => AchievementDef | null;
  clearQueue: () => void;
}

export const useAchievementStore = create<AchievementStore>()((set, get) => ({
  pendingPopups: [],
  pendingXP: 0,

  queueAchievement: (def) =>
    set(state => ({
      pendingPopups: [...state.pendingPopups, def],
      pendingXP: state.pendingXP + def.xpReward,
    })),

  dequeueAchievement: () => {
    const { pendingPopups } = get();
    if (pendingPopups.length === 0) return null;
    const [first, ...rest] = pendingPopups;
    set({ pendingPopups: rest });
    return first;
  },

  clearQueue: () => set({ pendingPopups: [], pendingXP: 0 }),
}));
