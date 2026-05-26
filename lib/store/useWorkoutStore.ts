// lib/store/useWorkoutStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkoutSession, CompletedExercise } from '@/types/workout';

interface WorkoutStore {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  // Actions
  startSession: (sessionId: string) => void;
  logExercise: (exercise: CompletedExercise) => void;
  completeSession: (xpEarned: number, statGains: Record<string, number>) => WorkoutSession | null;
  cancelSession: () => void;
  getSessionsThisWeek: () => WorkoutSession[];
  getTotalWorkouts: () => number;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,

      startSession: (sessionId) =>
        set({
          activeSession: {
            id: sessionId,
            date: new Date().toISOString(),
            exercises: [],
            totalXP: 0,
            totalDuration: 0,
            statGains: {},
            completed: false,
          },
        }),

      logExercise: (exercise) =>
        set((state) => {
          if (!state.activeSession) return state;
          return {
            activeSession: {
              ...state.activeSession,
              exercises: [...state.activeSession.exercises, exercise],
            },
          };
        }),

      completeSession: (xpEarned, statGains) => {
        const { activeSession, sessions } = get();
        if (!activeSession) return null;

        const completedSession: WorkoutSession = {
          ...activeSession,
          totalXP: xpEarned,
          statGains,
          completed: true,
        };

        set({
          sessions: [completedSession, ...sessions].slice(0, 365), // keep up to 1 year
          activeSession: null,
        });

        return completedSession;
      },

      cancelSession: () => set({ activeSession: null }),

      getSessionsThisWeek: () => {
        const { sessions } = get();
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        return sessions.filter((s) => new Date(s.date) >= startOfWeek && s.completed);
      },

      getTotalWorkouts: () => {
        return get().sessions.filter((s) => s.completed).length;
      },
    }),
    {
      name: 'arise-workout-store',
      version: 1,
    }
  )
);
