// types/nutrition.ts
// All types for the Nutrition Intelligence System

export type NutritionGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'E';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';

export interface MacroEstimate {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealEntry {
  id: string;
  date: string;              // ISO
  name: string;
  type: MealType;
  macros: MacroEstimate;
  notes?: string;
  aiAnalyzed?: boolean;
}

export interface WaterLog {
  id: string;
  date: string;             // ISO
  amountMl: number;
}

export interface DailyNutritionLog {
  date: string;             // YYYY-MM-DD
  meals: MealEntry[];
  waterLogs: WaterLog[];
  // computed on read
  totalCalories?: number;
  totalProteinG?: number;
  totalWaterMl?: number;
  grade?: NutritionGrade;
}

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  waterMl: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionScore {
  grade: NutritionGrade;
  gradeColor: string;
  calorieScore: number;     // 0-100
  proteinScore: number;     // 0-100
  hydrationScore: number;   // 0-100
  overallScore: number;     // 0-100
  xpBonus: number;
  observations: string[];   // IGRIS-style tactical notes
  recommendations: string[];
}

export interface HostelMeal {
  name: string;
  calories: number;
  proteinG: number;
  costRs: number;           // Indian rupees
  availability: 'always' | 'common' | 'sometimes';
  tags: string[];
  igrisNote: string;
}

// ─── HOSTEL MEAL DATABASE — Pure Vegetarian ────────────────────────────────
// All items are plant-based or dairy. No meat, no fish, no eggs.
export const HOSTEL_MEALS: HostelMeal[] = [
  {
    name: 'Soya Chunks (50g dry)',
    calories: 170, proteinG: 25, costRs: 12,
    availability: 'always',
    tags: ['protein', 'budget', 'fat-loss', 'veg'],
    igrisNote: 'Highest plant protein per rupee. Deploy daily. Non-negotiable.',
  },
  {
    name: 'Dal + Rice (standard plate)',
    calories: 480, proteinG: 14, costRs: 40,
    availability: 'always',
    tags: ['carbs', 'filling', 'budget', 'veg'],
    igrisNote: 'Primary carb + protein base. Reinforce with curd or soya.',
  },
  {
    name: 'Paneer (100g)',
    calories: 265, proteinG: 18, costRs: 55,
    availability: 'common',
    tags: ['protein', 'fat-loss', 'dairy', 'veg'],
    igrisNote: 'High-density dairy protein. Prioritize when available.',
  },
  {
    name: 'Curd / Dahi (200g)',
    calories: 120, proteinG: 8, costRs: 20,
    availability: 'always',
    tags: ['protein', 'recovery', 'gut', 'dairy', 'veg'],
    igrisNote: 'Slow protein + gut health. Optimal post-workout and pre-sleep.',
  },
  {
    name: 'Milk (250ml)',
    calories: 150, proteinG: 8, costRs: 20,
    availability: 'always',
    tags: ['protein', 'recovery', 'calcium', 'dairy', 'veg'],
    igrisNote: 'Pre-sleep: 250ml milk supports overnight muscle recovery.',
  },
  {
    name: 'Roasted Chana (50g)',
    calories: 180, proteinG: 10, costRs: 10,
    availability: 'always',
    tags: ['protein', 'fiber', 'snack', 'budget', 'veg'],
    igrisNote: 'Elite snack. High protein, high fiber, zero cooking required.',
  },
  {
    name: 'Rajma (cooked, 150g)',
    calories: 185, proteinG: 12, costRs: 35,
    availability: 'common',
    tags: ['protein', 'fiber', 'budget', 'veg'],
    igrisNote: 'Sustained plant protein. Pairs with rice for complete amino profile.',
  },
  {
    name: 'Sprouted Moong (100g)',
    calories: 105, proteinG: 9, costRs: 10,
    availability: 'common',
    tags: ['protein', 'fiber', 'fat-loss', 'veg'],
    igrisNote: 'Low calorie, high protein density. Ideal fat-loss fuel.',
  },
  {
    name: 'Peanut Butter (30g) + Bread (2 slices)',
    calories: 340, proteinG: 11, costRs: 25,
    availability: 'common',
    tags: ['protein', 'fat', 'quick', 'veg'],
    igrisNote: 'Calorie-dense quick meal. Control portions during deficit phase.',
  },
  {
    name: 'Oats + Milk (50g oats, 200ml milk)',
    calories: 280, proteinG: 12, costRs: 30,
    availability: 'common',
    tags: ['carbs', 'protein', 'breakfast', 'fiber', 'veg'],
    igrisNote: 'Optimal morning fuel. Slow carbs + protein for sustained energy.',
  },
  {
    name: 'Banana (2)',
    calories: 180, proteinG: 2, costRs: 10,
    availability: 'always',
    tags: ['carbs', 'pre-workout', 'energy', 'veg'],
    igrisNote: 'Pre-training energy spike. Not suitable as a primary protein source.',
  },
  {
    name: 'Roti + Sabzi (2 rotis)',
    calories: 320, proteinG: 8, costRs: 35,
    availability: 'always',
    tags: ['carbs', 'meal', 'standard', 'veg'],
    igrisNote: 'Standard hostel base. Always stack protein source alongside.',
  },
  {
    name: 'Besan Chilla (2 pieces)',
    calories: 220, proteinG: 10, costRs: 20,
    availability: 'sometimes',
    tags: ['protein', 'breakfast', 'quick', 'veg'],
    igrisNote: 'High-protein vegetarian pancake. Excellent breakfast when available.',
  },
  {
    name: 'Chole (cooked, 150g)',
    calories: 200, proteinG: 11, costRs: 35,
    availability: 'common',
    tags: ['protein', 'fiber', 'budget', 'veg'],
    igrisNote: 'Chickpeas: high fiber, moderate protein. Supports satiety in deficit.',
  },
  {
    name: 'Banana + Peanut Butter (1 tbsp)',
    calories: 230, proteinG: 5, costRs: 15,
    availability: 'always',
    tags: ['snack', 'quick', 'pre-workout', 'veg'],
    igrisNote: 'Emergency pre-training fuel. Fast, cheap, always available.',
  },
];
