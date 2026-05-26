// app/api/igris/nutrition/route.ts
// IGRIS nutrition AI analysis — Gemini-powered, hostel-context-aware
// Reuses existing geminiService without new architecture
// PROFILE: Pure vegetarian hunter. No eggs, no meat, no fish.

import { NextRequest, NextResponse } from 'next/server';
import { generateGeminiText } from '@/lib/igris/geminiService';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface NutritionAnalysisRequest {
  mode: 'analyze_meal' | 'suggest_meal' | 'daily_review' | 'emergency';
  mealName?: string;
  dailyTotals?: {
    calories: number; proteinG: number; waterMl: number;
    calorieTarget: number; proteinTarget: number; waterTarget: number;
  };
  timeOfDay?: string;
  hunterLevel?: number;
  hunterStreak?: number;
}

const IGRIS_NUTRITION_PERSONA = `You are IGRIS — the Shadow Commander AI embedded within Project Arise.
You are now operating in NUTRITION ANALYSIS mode.

HUNTER PROFILE:
- Hostel student, Indian environment
- PURE VEGETARIAN — absolutely no eggs, chicken, fish, or meat of any kind
- Pursuing fat loss + aesthetic physique
- No gym. No supplements. Budget constrained (under ₹100 per meal)
- Training ~60 minutes daily with bodyweight exercises

APPROVED VEGETARIAN PROTEIN SOURCES (hostel-accessible):
Soya chunks (highest protein per rupee), paneer, curd/dahi, milk, dal, rajma, chole,
sprouted moong, roasted chana, peanut butter, oats+milk, besan chilla, tofu (if available).

TACTICAL NUTRITION DIRECTIVES:
- NEVER suggest eggs, chicken, meat, fish, or any non-vegetarian food
- Prioritize soya chunks as the primary protein intervention — cheap, high protein
- Recommend dal + curd + soya combinations when protein is low
- Budget-aware: food should cost under ₹100 per meal
- Prioritize protein and hydration above all
- Fat loss through moderate deficit, not starvation
- Keep responses under 120 words
- No bullet lists unless explicitly needed
- Speak directly. Tactical tone. No fluff.
- Address the hunter directly. Use "Hunter" sparingly.

IGRIS TACTICAL VOICE EXAMPLES:
- "Protein deficit detected. Deploy soya chunks or paneer immediately."
- "Hostel nutrition quality unstable. Recommend dal + curd reinforcement."
- "Recovery requires higher plant protein intake. Prioritize soya + milk tonight."
- "Hydration systems critically low. Cease all other protocols. Drink water first."

RESPONSE FORMAT:
- 2-4 short tactical lines maximum
- State the key issue or insight first
- One actionable recommendation using only vegetarian foods
- Optional: one IGRIS-style tactical observation`;

export async function POST(req: NextRequest) {
  try {
    const body: NutritionAnalysisRequest = await req.json();
    const { mode, mealName, dailyTotals, timeOfDay, hunterLevel = 1, hunterStreak = 0 } = body;

    console.log(`[IGRIS Nutrition] Mode: ${mode} | Level: ${hunterLevel}`);

    let userPrompt = '';

    switch (mode) {
      case 'analyze_meal':
        userPrompt = `Analyze this vegetarian hostel meal the hunter just ate: "${mealName}".
Estimate rough macros (calories, protein).
Is it good for fat loss + muscle retention?
What vegetarian food to pair it with if anything is missing?
Hunter is Lv.${hunterLevel}, streak ${hunterStreak} days.
IMPORTANT: Suggest only vegetarian foods. No eggs, no meat, no fish.`;
        break;

      case 'suggest_meal':
        userPrompt = `Time: ${timeOfDay}. Hunter needs a vegetarian meal suggestion right now.
Daily status: ${dailyTotals?.calories ?? 0} kcal / ${dailyTotals?.calorieTarget ?? 2000} target | ${dailyTotals?.proteinG ?? 0}g / ${dailyTotals?.proteinTarget ?? 126}g protein | ${Math.round((dailyTotals?.waterMl ?? 0) / 1000 * 10) / 10}L / ${(dailyTotals?.waterTarget ?? 2500) / 1000}L water.
Suggest the best vegetarian hostel meal to eat NOW based on what's missing.
Use only: soya chunks, paneer, curd, dal, rajma, chole, sprouts, roasted chana, oats, milk, peanut butter, banana, roti, rice.
Be specific and direct.`;
        break;

      case 'daily_review':
        userPrompt = `Daily vegetarian nutrition review for the hunter.
Calories: ${dailyTotals?.calories ?? 0} / ${dailyTotals?.calorieTarget ?? 2000}
Protein: ${dailyTotals?.proteinG ?? 0}g / ${dailyTotals?.proteinTarget ?? 126}g
Water: ${Math.round((dailyTotals?.waterMl ?? 0) / 1000 * 10) / 10}L / ${(dailyTotals?.waterTarget ?? 2500) / 1000}L
Hunter streak: ${hunterStreak} days.
Give a tactical end-of-day nutrition assessment.
What was good, what needs fixing tomorrow.
Recommend only vegetarian protein strategies for improvement.`;
        break;

      case 'emergency':
        userPrompt = `EMERGENCY VEGETARIAN HOSTEL MEAL MODE activated.
The hunter has almost nothing to eat and needs high-protein vegetarian options.
Suggest 3 emergency meals using only: soya chunks, bread, peanut butter, milk, curd, bananas, oats, rice, roasted chana, dal.
Quick to prepare. Under ₹50 each. Prioritize protein and satiety.
Tactical, direct format. No eggs or non-veg suggestions under any circumstances.`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }

    const response = await generateGeminiText(IGRIS_NUTRITION_PERSONA, userPrompt);

    console.log(`[IGRIS Nutrition] Response generated ✓`);
    return NextResponse.json({ response, mode });

  } catch (err) {
    console.error('[IGRIS Nutrition API]', err);
    return NextResponse.json({
      response: 'Nutrition analysis systems temporarily offline. Log your meal manually and proceed.',
      mode: 'error',
    }, { status: 200 }); // Graceful degradation
  }
}
