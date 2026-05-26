// types/recovery.ts
// All types for the recovery, stamina, and body tracking systems

export type IntensityLevel = 'RECOVERY' | 'LIGHT' | 'MODERATE' | 'STANDARD' | 'INTENSE' | 'PEAK';

export interface RecoveryCheckIn {
  id: string;
  date: string;                // ISO string
  sleepQuality: number;        // 1-5
  sorenessLevel: number;       // 1-5 (1=no soreness, 5=very sore)
  fatigueLevel: number;        // 1-5 (1=fresh, 5=exhausted)
  breathingDifficulty: number; // 1-5 (1=easy, 5=very hard)
  motivationState: number;     // 1-5
  notes?: string;
}

export interface RecoveryScore {
  score: number;               // 0-100
  label: string;               // "Compromised" | "Low" | "Moderate" | "Good" | "Optimal"
  color: string;
  recommendedIntensity: IntensityLevel;
  observations: string[];      // IGRIS-style tactical notes
  missionModifier: number;     // 0.5-1.2 multiplier
}

export interface StaminaSnapshot {
  date: string;
  endurance: number;           // END stat value at this point
  vitality: number;            // VIT stat value
  totalWorkouts: number;       // cumulative workout count
  consistencyScore: number;    // 0-100
  avgSessionXP: number;
}

export interface BodyMeasurement {
  id: string;
  date: string;
  weight?: number;             // kg
  waistCm?: number;
  chestCm?: number;
  armsCm?: number;
  notes?: string;
}

export interface AdaptiveMissionModifiers {
  intensityMultiplier: number;    // 0.5 to 1.3
  xpMultiplier: number;
  recommendedType: string | null; // override session type if needed
  adaptationNote: string;         // shown to user in HUD
  missionTier: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  isReEntry: boolean;
  isOverload: boolean;
}
