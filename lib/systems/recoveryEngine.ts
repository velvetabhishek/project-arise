// lib/systems/recoveryEngine.ts
// Recovery scoring + intensity recommendations
// Pure functions — no React, no side effects

import type { RecoveryCheckIn, RecoveryScore, IntensityLevel } from '@/types/recovery';

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  RECOVERY: 'Recovery Protocol',
  LIGHT:    'Light Session',
  MODERATE: 'Moderate Training',
  STANDARD: 'Standard Session',
  INTENSE:  'Intense Protocol',
  PEAK:     'Peak Performance',
};

/**
 * Calculate a 0-100 recovery score from a check-in
 * Weights: sleep 30%, soreness 25% (inverted), fatigue 25% (inverted),
 *          breathing 10%, motivation 10%
 */
export function calculateRecoveryScore(checkIn: RecoveryCheckIn): RecoveryScore {
  const { sleepQuality, sorenessLevel, fatigueLevel, breathingDifficulty, motivationState } = checkIn;

  // Normalize to 0-1, invert negative metrics
  const sleepNorm     = (sleepQuality - 1) / 4;           // higher = better
  const sorenessNorm  = 1 - ((sorenessLevel - 1) / 4);   // lower soreness = better
  const fatigueNorm   = 1 - ((fatigueLevel - 1) / 4);    // lower fatigue = better
  const breathingNorm = 1 - ((breathingDifficulty - 1) / 4); // lower difficulty = better
  const motivNorm     = (motivationState - 1) / 4;

  const raw =
    sleepNorm    * 0.30 +
    sorenessNorm * 0.25 +
    fatigueNorm  * 0.25 +
    breathingNorm * 0.10 +
    motivNorm    * 0.10;

  const score = Math.round(raw * 100);

  // Determine label and intensity
  let label: string;
  let color: string;
  let recommendedIntensity: IntensityLevel;
  let missionModifier: number;

  if (score >= 85) {
    label = 'Optimal'; color = '#10b981'; recommendedIntensity = 'PEAK'; missionModifier = 1.2;
  } else if (score >= 70) {
    label = 'High Output'; color = '#60a5fa'; recommendedIntensity = 'INTENSE'; missionModifier = 1.1;
  } else if (score >= 55) {
    label = 'Good'; color = '#3b82f6'; recommendedIntensity = 'STANDARD'; missionModifier = 1.0;
  } else if (score >= 40) {
    label = 'Moderate'; color = '#f59e0b'; recommendedIntensity = 'MODERATE'; missionModifier = 0.9;
  } else if (score >= 25) {
    label = 'Compromised'; color = '#f97316'; recommendedIntensity = 'LIGHT'; missionModifier = 0.75;
  } else {
    label = 'Critical'; color = '#ef4444'; recommendedIntensity = 'RECOVERY'; missionModifier = 0.5;
  }

  const observations = buildObservations(checkIn, score);

  return { score, label, color, recommendedIntensity, observations, missionModifier };
}

function buildObservations(c: RecoveryCheckIn, score: number): string[] {
  const obs: string[] = [];

  if (c.sleepQuality <= 2) obs.push('Sleep deficit detected. Neural recovery incomplete.');
  if (c.sorenessLevel >= 4) obs.push('High muscular load detected. Reduce impact exercises.');
  if (c.fatigueLevel >= 4)  obs.push('Energy reserves critically low. Shorten session if needed.');
  if (c.breathingDifficulty >= 4) obs.push('Breathing instability detected. Prioritize box breathing.');
  if (c.motivationState <= 2) obs.push('Motivation signal weak. Start with breathing to anchor focus.');
  if (score >= 80)           obs.push('High-output state confirmed. Progressive overload authorized.');
  if (score >= 60 && score < 80) obs.push('Stable recovery profile. Standard mission parameters engaged.');
  if (obs.length === 0)      obs.push('Recovery diagnostics complete. Proceed with current protocol.');

  return obs;
}

export function getIntensityLabel(intensity: IntensityLevel): string {
  return INTENSITY_LABELS[intensity];
}

/**
 * Get a quick recovery estimate without a full check-in
 * Uses player data heuristics
 */
export function estimateRecovery(params: {
  daysSinceLastWorkout: number;
  streak: number;
  hour: number;
  consistencyScore: number;
}): Pick<RecoveryScore, 'score' | 'label' | 'color' | 'missionModifier' | 'recommendedIntensity'> {
  const { daysSinceLastWorkout, streak, hour, consistencyScore } = params;

  let score = 60; // baseline

  // Rest days boost recovery
  if (daysSinceLastWorkout === 1) score += 10;
  if (daysSinceLastWorkout === 2) score += 20;
  if (daysSinceLastWorkout >= 3) score += 15; // over-rested (momentum lost)

  // Streak suggests momentum
  if (streak >= 3) score -= 5;   // accumulated fatigue
  if (streak >= 7) score -= 10;
  if (streak >= 14) score -= 15;

  // Late night penalty
  if (hour >= 22 || hour < 5) score -= 15;
  if (hour >= 21) score -= 5;

  // Consistency bonus
  if (consistencyScore >= 70) score += 5;

  score = Math.max(10, Math.min(100, score));

  if (score >= 85) return { score, label: 'Optimal',      color: '#10b981', missionModifier: 1.2, recommendedIntensity: 'PEAK' };
  if (score >= 70) return { score, label: 'High Output',  color: '#60a5fa', missionModifier: 1.1, recommendedIntensity: 'INTENSE' };
  if (score >= 55) return { score, label: 'Good',         color: '#3b82f6', missionModifier: 1.0, recommendedIntensity: 'STANDARD' };
  if (score >= 40) return { score, label: 'Moderate',     color: '#f59e0b', missionModifier: 0.9, recommendedIntensity: 'MODERATE' };
  if (score >= 25) return { score, label: 'Compromised',  color: '#f97316', missionModifier: 0.75, recommendedIntensity: 'LIGHT' };
  return                 { score, label: 'Critical',      color: '#ef4444', missionModifier: 0.5, recommendedIntensity: 'RECOVERY' };
}
