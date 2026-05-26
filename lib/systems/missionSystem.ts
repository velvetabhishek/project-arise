// lib/systems/missionSystem.ts
import type { DailyMission } from '@/types/workout';
import { EXERCISE_DATABASE } from '@/lib/data/workouts';

type SessionType = 'PUSH_CORE' | 'CARDIO_CORE' | 'LEGS_CORE' | 'HIIT_FULL';

const SESSION_ROTATIONS: SessionType[] = [
  'PUSH_CORE',
  'CARDIO_CORE',
  'LEGS_CORE',
  'HIIT_FULL',
];

/**
 * Generate daily mission based on day of week rotation
 */
export function generateDailyMission(dayIndex: number, playerLevel: number): DailyMission {
  const sessionType = SESSION_ROTATIONS[dayIndex % SESSION_ROTATIONS.length];
  const difficulty = playerLevel >= 20 ? 'advanced' : playerLevel >= 10 ? 'intermediate' : 'beginner';

  let exercises;
  let title;
  let description;
  let focusArea;

  const allExercises = EXERCISE_DATABASE.filter(
    (e) => e.difficulty === 'beginner' || e.difficulty === difficulty
  );

  switch (sessionType) {
    case 'PUSH_CORE': {
      const pushExercises = allExercises.filter((e) => e.category === 'PUSH').slice(0, 3);
      const coreExercises = allExercises.filter((e) => e.category === 'CORE').slice(0, 3);
      const cardioWarmup = allExercises.filter((e) => e.category === 'CARDIO').slice(0, 1);
      const recovery = allExercises.filter((e) => e.category === 'RECOVERY').slice(0, 1);
      exercises = [...cardioWarmup, ...pushExercises, ...coreExercises, ...recovery];
      title = 'Push Day + Core Fortress';
      description = 'Upper body strength with core finisher. Fat-burning circuit included.';
      focusArea = 'Chest, Triceps, Shoulders, Core';
      break;
    }
    case 'CARDIO_CORE': {
      const cardioExercises = allExercises.filter((e) => e.category === 'CARDIO').slice(0, 3);
      const coreExercises = allExercises.filter((e) => e.category === 'CORE').slice(0, 3);
      const recovery = allExercises.filter((e) => e.category === 'RECOVERY').slice(0, 1);
      exercises = [...cardioExercises, ...coreExercises, ...recovery];
      title = 'Shadow Run + Core Burn';
      description = 'Cardio circuit for fat loss. Breathing improvement focus. Core finisher.';
      focusArea = 'Cardio, Core, Stamina';
      break;
    }
    case 'LEGS_CORE': {
      const legExercises = allExercises.filter((e) => e.category === 'LEGS').slice(0, 3);
      const coreExercises = allExercises.filter((e) => e.category === 'CORE').slice(0, 2);
      const cardioWarmup = allExercises.filter((e) => e.category === 'CARDIO').slice(0, 1);
      const recovery = allExercises.filter((e) => e.category === 'RECOVERY').slice(0, 1);
      exercises = [...cardioWarmup, ...legExercises, ...coreExercises, ...recovery];
      title = 'Leg Forge + Core Strike';
      description = 'Lower body strength for thigh and glute transformation. Core integrated.';
      focusArea = 'Thighs, Glutes, Core';
      break;
    }
    case 'HIIT_FULL': {
      const cardioExercises = allExercises.filter((e) => e.category === 'CARDIO');
      const pushExercises = allExercises.filter((e) => e.category === 'PUSH').slice(0, 2);
      const legExercises = allExercises.filter((e) => e.category === 'LEGS').slice(0, 1);
      const coreExercises = allExercises.filter((e) => e.category === 'CORE').slice(0, 2);
      const recovery = allExercises.filter((e) => e.category === 'RECOVERY').slice(0, 1);
      exercises = [...cardioExercises.slice(0, 2), ...pushExercises, ...legExercises, ...coreExercises, ...recovery];
      title = 'Shadow HIIT Protocol';
      description = 'Full-body fat-burn day. Maximum calorie expenditure. Warrior intensity.';
      focusArea = 'Full Body, Fat Loss, Stamina';
      break;
    }
    default:
      exercises = allExercises.slice(0, 5);
      title = 'Daily Mission';
      description = 'Complete your daily mission.';
      focusArea = 'Full Body';
  }

  const totalXP = exercises.reduce((sum, e) => sum + e.xpReward, 0);
  const totalDuration = 60; // Always 60 minutes

  return {
    date: new Date().toISOString().split('T')[0],
    title,
    description,
    exercises,
    totalXP,
    duration: totalDuration,
    focusArea,
    completed: false,
  };
}

export function getTodaysMission(playerLevel: number): DailyMission {
  const dayOfWeek = new Date().getDay(); // 0 = Sunday
  return generateDailyMission(dayOfWeek, playerLevel);
}
