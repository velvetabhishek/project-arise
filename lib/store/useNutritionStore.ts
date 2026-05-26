// lib/store/useNutritionStore.ts
// Persistent nutrition state: meals, water logs, daily totals
// Follows exact same pattern as useRecoveryStore

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MealEntry, WaterLog, MealType, MacroEstimate } from '@/types/nutrition';

function genId(): string {
  return `nx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

interface DailyTotals {
  date: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterMl: number;
  mealCount: number;
}

interface NutritionStore {
  meals: MealEntry[];
  waterLogs: WaterLog[];

  // Actions — meals
  addMeal: (data: { name: string; type: MealType; macros: MacroEstimate; notes?: string; aiAnalyzed?: boolean }) => MealEntry;
  removeMeal: (id: string) => void;
  updateMeal: (id: string, updates: Partial<Pick<MealEntry, 'name' | 'macros' | 'notes'>>) => void;

  // Actions — water
  addWater: (amountMl: number) => void;
  removeLastWater: () => void;

  // Queries
  getTodayMeals: () => MealEntry[];
  getTodayWaterMl: () => number;
  getDailyTotals: (dateStr?: string) => DailyTotals;
  getLast7DaysTotals: () => DailyTotals[];
  getProteinStreak: (targetG: number) => number;
  getHydrationStreak: (targetMl: number) => number;
  getTodayMealCount: () => number;

  // Utilities
  clearToday: () => void;
  clearAll: () => void;
}

export const useNutritionStore = create<NutritionStore>()(
  persist(
    (set, get) => ({
      meals: [],
      waterLogs: [],

      // ── Meal actions ────────────────────────────────────────────
      addMeal: (data) => {
        const entry: MealEntry = {
          id: genId(),
          date: new Date().toISOString(),
          ...data,
        };
        set(state => ({
          meals: [...state.meals, entry].slice(-200), // keep last 200 entries
        }));
        return entry;
      },

      removeMeal: (id) =>
        set(state => ({ meals: state.meals.filter(m => m.id !== id) })),

      updateMeal: (id, updates) =>
        set(state => ({
          meals: state.meals.map(m => m.id === id ? { ...m, ...updates } : m),
        })),

      // ── Water actions ───────────────────────────────────────────
      addWater: (amountMl) => {
        const log: WaterLog = { id: genId(), date: new Date().toISOString(), amountMl };
        set(state => ({
          waterLogs: [...state.waterLogs, log].slice(-500),
        }));
      },

      removeLastWater: () =>
        set(state => ({ waterLogs: state.waterLogs.slice(0, -1) })),

      // ── Queries ─────────────────────────────────────────────────
      getTodayMeals: () => {
        const today = todayKey();
        return get().meals.filter(m => m.date.slice(0, 10) === today);
      },

      getTodayWaterMl: () => {
        const today = todayKey();
        return get().waterLogs
          .filter(w => w.date.slice(0, 10) === today)
          .reduce((s, w) => s + w.amountMl, 0);
      },

      getTodayMealCount: () => {
        const today = todayKey();
        return get().meals.filter(m => m.date.slice(0, 10) === today).length;
      },

      getDailyTotals: (dateStr) => {
        const date = dateStr ?? todayKey();
        const { meals, waterLogs } = get();
        const dayMeals = meals.filter(m => m.date.slice(0, 10) === date);
        const dayWater = waterLogs.filter(w => w.date.slice(0, 10) === date);
        return {
          date,
          calories: dayMeals.reduce((s, m) => s + m.macros.calories, 0),
          proteinG: dayMeals.reduce((s, m) => s + m.macros.proteinG, 0),
          carbsG: dayMeals.reduce((s, m) => s + m.macros.carbsG, 0),
          fatG: dayMeals.reduce((s, m) => s + m.macros.fatG, 0),
          waterMl: dayWater.reduce((s, w) => s + w.amountMl, 0),
          mealCount: dayMeals.length,
        };
      },

      getLast7DaysTotals: () => {
        const store = get();
        const result: DailyTotals[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          result.push(store.getDailyTotals(dateStr));
        }
        return result;
      },

      getProteinStreak: (targetG: number) => {
        const store = get();
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const totals = store.getDailyTotals(dateStr);
          if (totals.proteinG >= targetG * 0.85) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },

      getHydrationStreak: (targetMl: number) => {
        const store = get();
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().slice(0, 10);
          const totals = store.getDailyTotals(dateStr);
          if (totals.waterMl >= targetMl * 0.8) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },

      clearToday: () => {
        const today = todayKey();
        set(state => ({
          meals: state.meals.filter(m => m.date.slice(0, 10) !== today),
          waterLogs: state.waterLogs.filter(w => w.date.slice(0, 10) !== today),
        }));
      },

      clearAll: () => set({ meals: [], waterLogs: [] }),
    }),
    {
      name: 'arise-nutrition-store',
      version: 1,
    }
  )
);
