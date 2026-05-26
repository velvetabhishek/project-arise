// lib/store/useRecoveryStore.ts
// Recovery check-ins, body measurements, stamina history
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecoveryCheckIn, BodyMeasurement } from '@/types/recovery';

interface RecoveryStore {
  checkIns: RecoveryCheckIn[];
  bodyMeasurements: BodyMeasurement[];
  lastCheckInDate: string | null;

  // Actions
  addCheckIn: (data: Omit<RecoveryCheckIn, 'id' | 'date'>) => RecoveryCheckIn;
  addBodyMeasurement: (data: Omit<BodyMeasurement, 'id' | 'date'>) => void;
  getLatestCheckIn: () => RecoveryCheckIn | null;
  getTodaysCheckIn: () => RecoveryCheckIn | null;
  getCheckInStreak: () => number;
  clearAll: () => void;
}

function genId(): string {
  return `rc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const useRecoveryStore = create<RecoveryStore>()(
  persist(
    (set, get) => ({
      checkIns: [],
      bodyMeasurements: [],
      lastCheckInDate: null,

      addCheckIn: (data) => {
        const checkIn: RecoveryCheckIn = {
          ...data,
          id: genId(),
          date: new Date().toISOString(),
        };
        set(state => ({
          checkIns: [...state.checkIns, checkIn].slice(-90), // keep 90 days
          lastCheckInDate: checkIn.date,
        }));
        return checkIn;
      },

      addBodyMeasurement: (data) => {
        const measurement: BodyMeasurement = {
          ...data,
          id: genId(),
          date: new Date().toISOString(),
        };
        set(state => ({
          bodyMeasurements: [...state.bodyMeasurements, measurement].slice(-52), // keep 52 entries
        }));
      },

      getLatestCheckIn: () => {
        const { checkIns } = get();
        return checkIns.length > 0 ? checkIns[checkIns.length - 1] : null;
      },

      getTodaysCheckIn: () => {
        const { checkIns } = get();
        const todayStr = new Date().toDateString();
        return checkIns.find(c => new Date(c.date).toDateString() === todayStr) ?? null;
      },

      getCheckInStreak: () => {
        const { checkIns } = get();
        if (checkIns.length === 0) return 0;
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const str = d.toDateString();
          if (checkIns.some(c => new Date(c.date).toDateString() === str)) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      },

      clearAll: () => set({ checkIns: [], bodyMeasurements: [], lastCheckInDate: null }),
    }),
    {
      name: 'arise-recovery-store',
      version: 1,
    }
  )
);
