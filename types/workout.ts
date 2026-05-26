// types/workout.ts
export type WorkoutCategory = 'PUSH' | 'PULL' | 'LEGS' | 'CORE' | 'CARDIO' | 'RECOVERY';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type StatKey = 'STR' | 'AGI' | 'END' | 'VIT' | 'INT';
export type StatGain = Partial<Record<StatKey, number>>;

export interface Exercise {
  id: string;
  name: string;
  category: WorkoutCategory;
  difficulty: DifficultyLevel;
  sets: number;
  reps?: number;
  duration?: number;
  restTime: number;
  statGain: StatGain;
  xpReward: number;
  description: string;
  breathingTip?: string;
  formTip?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  setsCompleted: number;
  repsCompleted: number[];
  xpEarned: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: CompletedExercise[];
  totalXP: number;
  totalDuration: number;
  statGains: Partial<Record<StatKey, number>>;
  completed: boolean;
  igrisDebrief?: string;
  notes?: string;
}

export interface DailyMission {
  date: string;
  title: string;
  description: string;
  exercises: Exercise[];
  totalXP: number;
  duration: number;
  focusArea: string;
  completed: boolean;
}
