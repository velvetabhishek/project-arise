// lib/systems/nutritionEngine.ts
// Core nutrition calculations — calorie targets, protein, hydration, scoring
// Hostel-first: no supplements, no gym equipment, budget-aware

import type { NutritionTargets, NutritionScore, NutritionGrade, DailyNutritionLog } from '@/types/nutrition';

// ─── CALORIE TARGET CALCULATOR ───────────────────────────────────────────────
// Mifflin-St Jeor (simplified for hostel context: moderate activity)
// Profile: Male, ~70kg, ~5'8", 18-25, moderate deficit for fat loss
export function calculateDailyTargets(): NutritionTargets {
  // Base: ~70kg, 173cm, age 21 (hostel student estimate)
  const bmr = 10 * 70 + 6.25 * 173 - 5 * 21 + 5; // ~1740 kcal
  const tdee = Math.round(bmr * 1.375);             // lightly active = ~2390 kcal
  const deficitTarget = Math.round(tdee - 350);     // ~350 kcal deficit for fat loss

  return {
    calories: deficitTarget,           // ~2040 kcal
    proteinG: Math.round(70 * 1.8),   // 1.8g/kg = ~126g protein
    waterMl: 2500,                     // 2.5L daily
    carbsG: Math.round((deficitTarget * 0.40) / 4),  // 40% carbs
    fatG: Math.round((deficitTarget * 0.28) / 9),    // 28% fat
  };
}

// ─── DAILY NUTRITION SCORING ──────────────────────────────────────────────────
export function scoreNutritionDay(log: DailyNutritionLog, targets: NutritionTargets): NutritionScore {
  const totalCal = log.meals.reduce((s, m) => s + m.macros.calories, 0);
  const totalProt = log.meals.reduce((s, m) => s + m.macros.proteinG, 0);
  const totalWater = log.waterLogs.reduce((s, w) => s + w.amountMl, 0);

  // Calorie score: sweet spot 85-105% of target
  const calRatio = totalCal / targets.calories;
  const calorieScore = calRatio < 0.5 ? 40
    : calRatio < 0.8 ? Math.round(40 + (calRatio - 0.5) * 150)
    : calRatio <= 1.05 ? 100
    : calRatio <= 1.2 ? Math.round(100 - (calRatio - 1.05) * 200)
    : Math.max(10, Math.round(70 - (calRatio - 1.2) * 300));

  // Protein score: above 0.9× target = passing
  const protRatio = totalProt / targets.proteinG;
  const proteinScore = protRatio >= 1.0 ? 100
    : protRatio >= 0.85 ? Math.round(75 + (protRatio - 0.85) * 166)
    : protRatio >= 0.6 ? Math.round(40 + (protRatio - 0.6) * 140)
    : Math.round(protRatio * 66);

  // Hydration score
  const waterRatio = totalWater / targets.waterMl;
  const hydrationScore = waterRatio >= 1.0 ? 100
    : waterRatio >= 0.75 ? Math.round(70 + (waterRatio - 0.75) * 120)
    : Math.round(waterRatio * 93);

  // Weighted overall
  const overallScore = Math.round(
    calorieScore * 0.35 + proteinScore * 0.40 + hydrationScore * 0.25
  );

  const grade = scoreToGrade(overallScore);
  const xpBonus = gradeToXP(grade);
  const observations = buildObservations(totalCal, totalProt, totalWater, targets, calRatio, protRatio, waterRatio);
  const recommendations = buildRecommendations(calRatio, protRatio, waterRatio, targets, totalProt, totalWater);

  return {
    grade,
    gradeColor: gradeColor(grade),
    calorieScore,
    proteinScore,
    hydrationScore,
    overallScore,
    xpBonus,
    observations,
    recommendations,
  };
}

// ─── GRADE HELPERS ─────────────────────────────────────────────────────────
function scoreToGrade(score: number): NutritionGrade {
  if (score >= 90) return 'S';
  if (score >= 78) return 'A';
  if (score >= 63) return 'B';
  if (score >= 48) return 'C';
  if (score >= 30) return 'D';
  return 'E';
}

export function gradeColor(grade: NutritionGrade): string {
  const map: Record<NutritionGrade, string> = {
    S: '#f97316', A: '#10b981', B: '#3b82f6',
    C: '#a78bfa', D: '#facc15', E: '#ef4444',
  };
  return map[grade];
}

function gradeToXP(grade: NutritionGrade): number {
  const map: Record<NutritionGrade, number> = {
    S: 80, A: 60, B: 40, C: 25, D: 10, E: 0,
  };
  return map[grade];
}

// ─── IGRIS TACTICAL OBSERVATIONS ──────────────────────────────────────────
function buildObservations(
  cal: number, prot: number, water: number,
  targets: NutritionTargets,
  calRatio: number, protRatio: number, waterRatio: number
): string[] {
  const obs: string[] = [];

  if (cal === 0 && prot === 0 && water === 0) {
    obs.push('No nutrition data logged today. Fuel status: unknown.');
    return obs;
  }

  if (protRatio < 0.6) obs.push(`Protein critically low: ${prot}g / ${targets.proteinG}g target. Recovery compromised.`);
  else if (protRatio < 0.85) obs.push(`Protein below threshold: ${prot}g. Increase by ${Math.round(targets.proteinG - prot)}g.`);
  else obs.push(`Protein intake nominal: ${prot}g. Muscle retention active.`);

  if (waterRatio < 0.5) obs.push('Severe hydration deficit. Performance and fat-loss both impaired.');
  else if (waterRatio < 0.75) obs.push(`Hydration below baseline: ${Math.round(water / 1000 * 10) / 10}L. Metabolic efficiency reduced.`);
  else if (waterRatio >= 1.0) obs.push('Hydration optimal. Metabolic efficiency maintained.');

  if (calRatio > 1.15) obs.push(`Calorie surplus detected: +${Math.round(cal - targets.calories)} kcal. Fat-loss rate reduced.`);
  else if (calRatio < 0.7) obs.push('Calorie intake critically low. Risk of muscle catabolism.');
  else if (calRatio >= 0.85 && calRatio <= 1.05) obs.push('Calorie intake in optimal deficit range. Fat-loss proceeding.');

  return obs;
}

function buildRecommendations(
  calRatio: number, protRatio: number, waterRatio: number,
  targets: NutritionTargets, totalProt: number, totalWater: number
): string[] {
  const recs: string[] = [];

  if (waterRatio < 0.75) recs.push(`Drink ${Math.round((targets.waterMl - totalWater) / 250)} more glasses of water now.`);
  if (protRatio < 0.85) recs.push(`Add ${Math.round(targets.proteinG - totalProt)}g protein — soya chunks, curd, or dal.`);
  if (calRatio < 0.8) recs.push('Eat a meal. Sustained deficit without enough food stalls fat loss.');
  if (calRatio > 1.1) recs.push('Avoid heavy meals tonight. Stick to protein and vegetables.');

  if (recs.length === 0) recs.push('Nutrition protocol followed. Maintain consistency tomorrow.');

  return recs;
}

// ─── MACRO ESTIMATOR (from meal name) ────────────────────────────────────
// Simple keyword-based estimator for quick logging without AI
export function estimateMacrosFromName(name: string): { calories: number; proteinG: number; carbsG: number; fatG: number } {
  const n = name.toLowerCase();

  const macroMap: Array<[RegExp, { calories: number; proteinG: number; carbsG: number; fatG: number }]> = [
    [/\bsoy\b|\bsoya|\bsoya.chunk/, { calories: 170, proteinG: 25, carbsG: 10, fatG: 3 }],
    [/\bdal\b|\blentil/, { calories: 120, proteinG: 8, carbsG: 18, fatG: 2 }],
    [/\brice\b/, { calories: 200, proteinG: 4, carbsG: 44, fatG: 0 }],
    [/\broti\b|\bchapati/, { calories: 100, proteinG: 3, carbsG: 20, fatG: 1 }],
    [/\bcurd\b|\bdahi\b|\byogurt/, { calories: 60, proteinG: 4, carbsG: 5, fatG: 2 }],
    [/\bpaneer/, { calories: 265, proteinG: 18, carbsG: 4, fatG: 20 }],
    [/\bchickpea\b|\bchana\b|\bchole/, { calories: 164, proteinG: 9, carbsG: 27, fatG: 3 }],
    [/\bbanana/, { calories: 90, proteinG: 1, carbsG: 23, fatG: 0 }],
    [/\boats\b|\boatmeal/, { calories: 190, proteinG: 6, carbsG: 32, fatG: 4 }],
    [/\bmilk/, { calories: 150, proteinG: 8, carbsG: 12, fatG: 5 }],
    [/\bpeanut/, { calories: 160, proteinG: 7, carbsG: 6, fatG: 14 }],
    [/\brajma|\bkidney.bean/, { calories: 185, proteinG: 12, carbsG: 30, fatG: 2 }],
    [/\bsprout/, { calories: 105, proteinG: 9, carbsG: 18, fatG: 1 }],
    [/\bbesan|\bchilla/, { calories: 110, proteinG: 5, carbsG: 15, fatG: 3 }],
    [/\btofu/, { calories: 80, proteinG: 8, carbsG: 2, fatG: 5 }],
    [/\bpaneer.sandwich|\bsandwich/, { calories: 280, proteinG: 14, carbsG: 30, fatG: 10 }],
  ];

  let calories = 0, proteinG = 0, carbsG = 0, fatG = 0;
  let matched = false;

  for (const [regex, macros] of macroMap) {
    if (regex.test(n)) {
      calories += macros.calories;
      proteinG += macros.proteinG;
      carbsG += macros.carbsG;
      fatG += macros.fatG;
      matched = true;
    }
  }

  // Default estimate if nothing matched
  if (!matched) {
    calories = 300; proteinG = 10; carbsG = 35; fatG = 8;
  }

  return { calories, proteinG, carbsG, fatG };
}

// ─── HYDRATION STREAK CALCULATOR ─────────────────────────────────────────
export function getHydrationStreak(
  logs: Array<{ date: string; totalWaterMl: number }>,
  targetMl: number
): number {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLog = sorted.find(l => l.date === dateStr);
    if (dayLog && dayLog.totalWaterMl >= targetMl * 0.8) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
