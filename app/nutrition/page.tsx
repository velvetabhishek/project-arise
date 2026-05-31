'use client';
// app/nutrition/page.tsx
// ARISE Nutrition Intelligence System — desktop-first HUD
// Sections: Overview → Meal Log → Water → AI Analysis → Hostel Database → 7-Day Chart

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils, Droplets, Plus, Trash2, Bot, AlertTriangle,
  Star, ChevronDown, ChevronUp, Activity,
} from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AmbientBackground } from '@/components/animations/AmbientBackground';
import { useNutritionStore } from '@/lib/store/useNutritionStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import {
  calculateDailyTargets, scoreNutritionDay, gradeColor, estimateMacrosFromName,
} from '@/lib/systems/nutritionEngine';
import { HOSTEL_MEALS } from '@/types/nutrition';
import type { MealType, NutritionGrade } from '@/types/nutrition';

// ─── Constants ────────────────────────────────────────────────────────────────
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout'];
const WATER_QUICK_OPTIONS = [150, 250, 350, 500];

const GRADE_LABELS: Record<NutritionGrade, string> = {
  S: 'SHADOW TIER', A: 'ELITE', B: 'STANDARD', C: 'DEVELOPING', D: 'COMPROMISED', E: 'CRITICAL',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ label, value, max, color, unit = '' }: {
  label: string; value: number; max: number; color: string; unit?: string;
}) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ color: '#f0f4ff', fontSize: 13, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
          {Math.round(value)}{unit}
          <span style={{ color: '#4a5568', fontSize: 11 }}> / {Math.round(max)}{unit}</span>
        </span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: 3,
            background: pct >= 85 ? color : pct >= 60 ? '#facc15' : '#ef4444',
            boxShadow: `0 0 6px ${color}60`,
          }}
        />
      </div>
      <div style={{ fontSize: 10, color: pct >= 85 ? color : '#ef4444', fontFamily: 'Space Grotesk, monospace', textAlign: 'right' }}>
        {pct}%
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: NutritionGrade }) {
  const color = gradeColor(grade);
  return (
    <motion.div
      animate={{ boxShadow: [`0 0 12px ${color}40`, `0 0 28px ${color}60`, `0 0 12px ${color}40`] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{
        width: 72, height: 72, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        border: `2px solid ${color}50`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 900, fontSize: 28, color, lineHeight: 1 }}>{grade}</div>
      <div style={{ fontSize: 8, color: '#4a5568', fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.08em' }}>GRADE</div>
    </motion.div>
  );
}

function MacroRing({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  const r = 28; const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={68} height={68}>
        <circle cx={34} cy={34} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
        <motion.circle
          cx={34} cy={34} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform="rotate(-90 34 34)"
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
        <text x={34} y={38} textAnchor="middle" fill="#f0f4ff" fontSize={11} fontFamily="Rajdhani, sans-serif" fontWeight="700">
          {Math.round(value)}
        </text>
      </svg>
      <div style={{ fontSize: 9, color: '#4a5568', fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function WaterBar({ current, target }: { current: number; target: number }) {
  const pct = Math.min(100, (current / target) * 100);
  const glasses = Math.round(current / 250);
  const targetGlasses = Math.round(target / 250);

  return (
    <div style={{
      background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.15)',
      borderRadius: 12, padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Droplets size={14} color="#60a5fa" />
          <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Hydration Status
          </span>
        </div>
        <div style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#facc15' : '#ef4444', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
          {Math.round(current / 1000 * 10) / 10}L / {target / 1000}L
        </div>
      </div>

      {/* Animated fill bar */}
      <div style={{ position: 'relative', height: 20, borderRadius: 10, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 10 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: 10,
            background: `linear-gradient(90deg, #3b82f6, #60a5fa)`,
            boxShadow: '0 0 12px rgba(59,130,246,0.4)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
            style={{
              position: 'absolute', inset: 0, width: '40%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }}
          />
        </motion.div>
      </div>

      {/* Glass indicators */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {Array.from({ length: targetGlasses }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8 }}
            animate={{ scale: i < glasses ? 1 : 0.8 }}
            style={{
              width: 14, height: 18, borderRadius: 3,
              background: i < glasses ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${i < glasses ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── IGRIS AI Nutrition Panel ─────────────────────────────────────────────────
function IGRISNutritionAI({
  dailyTotals, targets, hunterLevel, hunterStreak,
}: {
  dailyTotals: { calories: number; proteinG: number; waterMl: number };
  targets: { calories: number; proteinG: number; waterMl: number };
  hunterLevel: number;
  hunterStreak: number;
}) {
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [mealInput, setMealInput] = useState('');

  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  const callAI = useCallback(async (mode: string, mealName?: string) => {
    setLoading(true);
    setActiveMode(mode);
    setResponse(null);
    try {
      const res = await fetch('/api/igris/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          mealName,
          dailyTotals: {
            calories: dailyTotals.calories,
            proteinG: dailyTotals.proteinG,
            waterMl: dailyTotals.waterMl,
            calorieTarget: targets.calories,
            proteinTarget: targets.proteinG,
            waterTarget: targets.waterMl,
          },
          timeOfDay,
          hunterLevel,
          hunterStreak,
        }),
      });
      const data = await res.json();
      setResponse(data.response);
    } catch {
      setResponse('Nutrition analysis offline. Log your meal and proceed, Hunter.');
    } finally {
      setLoading(false);
    }
  }, [dailyTotals, targets, timeOfDay, hunterLevel, hunterStreak]);

  const buttons = [
    { mode: 'suggest_meal', label: 'What to eat now?', icon: '⚔️' },
    { mode: 'daily_review', label: 'Daily review', icon: '📊' },
    { mode: 'emergency', label: 'Emergency meals', icon: '🚨' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(10,10,20,0.98) 100%)',
      border: '1px solid rgba(59,130,246,0.18)', borderRadius: 14, padding: '20px 22px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Bot size={13} color="#60a5fa" />
        <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          IGRIS · Nutrition Intelligence
        </span>
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 8px', borderRadius: 12,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 4, height: 4, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#10b981', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.1em' }}>GEMINI</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        {buttons.map(b => (
          <motion.button
            key={b.mode}
            onClick={() => callAI(b.mode)}
            disabled={loading}
            whileHover={{ scale: 1.02, borderColor: 'rgba(59,130,246,0.4)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: activeMode === b.mode && response ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${activeMode === b.mode && response ? 'rgba(59,130,246,0.35)' : '#1a1a2e'}`,
              borderRadius: 20, padding: '5px 14px',
              color: '#4a5568', fontSize: 12, fontFamily: 'Inter, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              opacity: loading ? 0.5 : 1, transition: 'all 150ms',
            }}
          >
            <span style={{ fontSize: 12 }}>{b.icon}</span> {b.label}
          </motion.button>
        ))}
      </div>

      {/* Analyze a specific meal */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={mealInput}
          onChange={e => setMealInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && mealInput.trim()) callAI('analyze_meal', mealInput.trim()); }}
          placeholder="Type a meal to analyze — e.g. soya chunk bowl or dal + paneer"
          disabled={loading}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 8, padding: '8px 12px', color: '#f0f4ff',
            fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none',
          }}
        />
        <motion.button
          onClick={() => { if (mealInput.trim()) callAI('analyze_meal', mealInput.trim()); }}
          disabled={loading || !mealInput.trim()}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 8, padding: '8px 14px', color: '#60a5fa',
            fontSize: 11, fontFamily: 'Space Grotesk, monospace', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading || !mealInput.trim() ? 0.4 : 1, whiteSpace: 'nowrap', letterSpacing: '0.04em',
          }}
        >
          Analyze
        </motion.button>
      </div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}
          >
            {[0, 0.15, 0.3].map((d, i) => (
              <motion.span key={i}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: d }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', display: 'block' }}
              />
            ))}
            <span style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.06em' }}>
              Analyzing nutrition data...
            </span>
          </motion.div>
        )}
        {response && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(59,130,246,0.1)',
              borderRadius: 10, padding: '14px 16px',
            }}
          >
            <div style={{
              color: 'rgba(240,244,255,0.85)', fontSize: 13, fontFamily: 'Inter, sans-serif',
              lineHeight: 1.75, fontStyle: 'italic', whiteSpace: 'pre-wrap',
            }}>
              {response}
            </div>
            <div style={{ marginTop: 10, color: '#2d2d50', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.08em' }}>
              — IGRIS · NUTRITION COMMAND
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Meal Logger ──────────────────────────────────────────────────────────────
function MealLogger({ onAdd }: { onAdd: (name: string, type: MealType, calories: number, proteinG: number, carbsG: number, fatG: number) => void }) {
  const [mealName, setMealName] = useState('');
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName.trim()) return;

    const estimated = estimateMacrosFromName(mealName);
    onAdd(
      mealName.trim(),
      mealType,
      calories ? parseInt(calories) : estimated.calories,
      protein ? parseInt(protein) : estimated.proteinG,
      carbs ? parseInt(carbs) : estimated.carbsG,
      fat ? parseInt(fat) : estimated.fatG,
    );
    setMealName(''); setCalories(''); setProtein(''); setCarbs(''); setFat('');
  }, [mealName, mealType, calories, protein, carbs, fat, onAdd]);

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,130,246,0.15)',
    borderRadius: 8, padding: '9px 12px', color: '#f0f4ff', fontSize: 13,
    fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%',
    transition: 'border-color 150ms',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 8 }}>
        <input
          value={mealName}
          onChange={e => setMealName(e.target.value)}
          placeholder="Meal name (e.g. Dal Rice, Paneer Sabzi, Soya Bowl)"
          style={inputStyle}
          required
        />
        <select
          value={mealType}
          onChange={e => setMealType(e.target.value as MealType)}
          style={{ ...inputStyle, cursor: 'pointer', appearance: 'none' }}
        >
          {MEAL_TYPES.map(t => (
            <option key={t} value={t} style={{ background: '#0d0d1a' }}>
              {t.replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input value={calories} onChange={e => setCalories(e.target.value)} placeholder="Calories (auto-estimated)" type="number" min={0} style={inputStyle} />
        <input value={protein} onChange={e => setProtein(e.target.value)} placeholder="Protein g (auto-estimated)" type="number" min={0} style={inputStyle} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button type="button" onClick={() => setShowAdvanced(v => !v)}
          style={{ background: 'none', border: 'none', color: '#4a5568', fontSize: 11, cursor: 'pointer', fontFamily: 'Space Grotesk, monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
          {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Advanced macros
        </button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.1))',
            border: '1px solid rgba(59,130,246,0.35)', borderRadius: 8,
            padding: '8px 20px', color: '#93c5fd', fontSize: 12,
            fontFamily: 'Space Grotesk, monospace', cursor: 'pointer', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <Plus size={13} /> Log Meal
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, overflow: 'hidden' }}>
            <input value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="Carbs g" type="number" min={0} style={inputStyle} />
            <input value={fat} onChange={e => setFat(e.target.value)} placeholder="Fat g" type="number" min={0} style={inputStyle} />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}

// ─── Hostel Meal Card ──────────────────────────────────────────────────────
function HostelMealCard({ meal, onAdd }: {
  meal: typeof HOSTEL_MEALS[0];
  onAdd: (name: string, type: MealType, calories: number, proteinG: number, carbsG: number, fatG: number) => void;
}) {
  const [added, setAdded] = useState(false);
  const availColor = meal.availability === 'always' ? '#10b981' : meal.availability === 'common' ? '#facc15' : '#4a5568';

  return (
    <motion.div
      whileHover={{ borderColor: 'rgba(59,130,246,0.3)', y: -2 }}
      style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
        transition: 'all 150ms',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ color: '#e2e8ff', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{meal.name}</div>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: availColor, flexShrink: 0, marginTop: 4 }} title={meal.availability} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        <span style={{ color: '#facc15', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{meal.calories} kcal</span>
        <span style={{ color: '#10b981', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{meal.proteinG}g P</span>
        <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>₹{meal.costRs}</span>
      </div>

      <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Inter, sans-serif', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
        &ldquo;{meal.igrisNote}&rdquo;
      </div>

      <motion.button
        onClick={() => {
          onAdd(meal.name, 'lunch', meal.calories, meal.proteinG, Math.round((meal.calories * 0.4) / 4), Math.round((meal.calories * 0.25) / 9));
          setAdded(true);
          setTimeout(() => setAdded(false), 2000);
        }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: added ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${added ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 6, padding: '4px 12px',
          color: added ? '#10b981' : '#4a5568', fontSize: 11,
          fontFamily: 'Space Grotesk, monospace', cursor: 'pointer',
          transition: 'all 200ms',
        }}
      >
        {added ? '✓ Logged' : '+ Log'}
      </motion.button>
    </motion.div>
  );
}

// ─── 7-Day Mini Chart ─────────────────────────────────────────────────────────
function WeeklyChart({ data, targetCalories, targetProtein }: {
  data: Array<{ date: string; calories: number; proteinG: number }>;
  targetCalories: number;
  targetProtein: number;
}) {
  const maxCal = Math.max(targetCalories * 1.3, ...data.map(d => d.calories));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {data.map((d, i) => {
          const pct = maxCal > 0 ? (d.calories / maxCal) * 100 : 0;
          const isTarget = d.calories >= targetCalories * 0.85 && d.calories <= targetCalories * 1.1;
          const dayLabel = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
          const isToday = d.date === new Date().toISOString().slice(0, 10);

          return (
            <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                style={{
                  width: '100%', maxWidth: 32, borderRadius: '4px 4px 2px 2px',
                  background: d.calories === 0 ? 'rgba(255,255,255,0.04)'
                    : isTarget ? 'rgba(16,185,129,0.5)' : 'rgba(59,130,246,0.4)',
                  border: isToday ? '1px solid rgba(59,130,246,0.6)' : '1px solid transparent',
                  boxShadow: isToday ? '0 0 8px rgba(59,130,246,0.3)' : 'none',
                  alignSelf: 'flex-end',
                }}
              />
              <span style={{ fontSize: 9, color: isToday ? '#60a5fa' : '#4a5568', fontFamily: 'Space Grotesk, monospace' }}>
                {dayLabel}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(16,185,129,0.5)' }} />
          <span style={{ fontSize: 9, color: '#4a5568', fontFamily: 'Space Grotesk, monospace' }}>Target range</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(59,130,246,0.4)' }} />
          <span style={{ fontSize: 9, color: '#4a5568', fontFamily: 'Space Grotesk, monospace' }}>Off target</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function NutritionPage() {
  const { player, gainXP } = usePlayerStore();
  const {
    getTodayMeals, getTodayWaterMl, getDailyTotals, getLast7DaysTotals,
    addMeal, removeMeal, addWater, getHydrationStreak, getProteinStreak, getTodayMealCount,
  } = useNutritionStore();

  const targets = useMemo(() => calculateDailyTargets(), []);
  const todayMeals = getTodayMeals();
  const todayWaterMl = getTodayWaterMl();
  const todayTotals = getDailyTotals();
  const weekData = getLast7DaysTotals();
  const hydrationStreak = getHydrationStreak(targets.waterMl);
  const proteinStreak = getProteinStreak(targets.proteinG);

  const todayLog = useMemo(() => ({
    date: new Date().toISOString().slice(0, 10),
    meals: todayMeals,
    waterLogs: [],
  }), [todayMeals]);

  const nutritionScore = useMemo(() => scoreNutritionDay(
    { ...todayLog, waterLogs: [{ id: 'w', date: new Date().toISOString(), amountMl: todayWaterMl }] },
    targets
  ), [todayLog, todayWaterMl, targets]);

  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'database' | 'igris'>('overview');
  const [showMealLogger, setShowMealLogger] = useState(false);

  // ── Award nutrition XP once per day when grade ≥ B (score ≥ 63) ──────────
  const awardNutritionXP = useCallback(() => {
    const key = `arise-nutrition-xp-${new Date().toISOString().slice(0, 10)}`;
    if (typeof window !== 'undefined' && !localStorage.getItem(key) && nutritionScore.xpBonus > 0) {
      gainXP(nutritionScore.xpBonus);
      localStorage.setItem(key, '1');
    }
  }, [gainXP, nutritionScore.xpBonus]);

  const handleAddMeal = useCallback((
    name: string, type: MealType, calories: number, proteinG: number, carbsG: number, fatG: number
  ) => {
    addMeal({ name, type, macros: { calories, proteinG, carbsG, fatG } });
    setShowMealLogger(false);
  }, [addMeal]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'log', label: 'Meal Log', icon: Utensils },
    { id: 'database', label: 'Hostel DB', icon: Star },
    { id: 'igris', label: 'IGRIS AI', icon: Bot },
  ] as const;

  const gradeCol = gradeColor(nutritionScore.grade);

  return (
    <PageWrapper>
      <AmbientBackground />

      {/* ── PAGE HEADER ──────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 5 }}>
          Fuel Intelligence System
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 30, color: '#f0f4ff', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>
            Nutrition Protocol
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '5px 12px', borderRadius: 8, background: `${gradeCol}10`, border: `1px solid ${gradeCol}30`, fontSize: 11, color: gradeCol, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.08em' }}>
              {GRADE_LABELS[nutritionScore.grade]}
            </div>
            <div style={{ padding: '5px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', fontSize: 11, color: '#60a5fa', fontFamily: 'Space Grotesk, monospace' }}>
              {player.name} · Lv.{player.level}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── SUMMARY STRIP ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="nutri-summary-strip" style={{ display: 'grid', gap: 10, marginBottom: 24 }}
      >
        {[
          { label: 'Calories', value: todayTotals.calories, max: targets.calories, unit: '', color: '#facc15', suffix: 'kcal' },
          { label: 'Protein', value: todayTotals.proteinG, max: targets.proteinG, unit: 'g', color: '#10b981', suffix: '' },
          { label: 'Water', value: Math.round(todayWaterMl / 100) / 10, max: targets.waterMl / 1000, unit: 'L', color: '#60a5fa', suffix: '' },
          { label: 'Hydration Streak', value: hydrationStreak, max: 30, unit: 'd', color: '#3b82f6', suffix: '' },
          { label: 'Protein Streak', value: proteinStreak, max: 30, unit: 'd', color: '#10b981', suffix: '' },
        ].map(({ label, value, max, unit, color, suffix }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ color, fontSize: 20, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, lineHeight: 1 }}>
              {value}{unit}
              <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', marginLeft: 2 }}>{suffix}</span>
            </div>
            <div style={{ marginTop: 6, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ height: '100%', borderRadius: 1, width: `${Math.min(100, max > 0 ? (value / max) * 100 : 0)}%`, background: color, transition: 'width 800ms ease' }} />
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── TABS ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 0 }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6,
              color: activeTab === id ? '#60a5fa' : '#4a5568',
              fontSize: 12, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.06em',
              borderBottom: `2px solid ${activeTab === id ? '#3b82f6' : 'transparent'}`,
              transition: 'all 150ms',
            }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="nutri-main-grid" style={{ display: 'grid', gap: 20, alignItems: 'start' }}
          >
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Macro progress */}
              <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Macro Status
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <StatPill label="Calories" value={todayTotals.calories} max={targets.calories} color="#facc15" unit=" kcal" />
                  <StatPill label="Protein" value={todayTotals.proteinG} max={targets.proteinG} color="#10b981" unit="g" />
                  <StatPill label="Carbs" value={todayTotals.carbsG} max={targets.carbsG} color="#a78bfa" unit="g" />
                  <StatPill label="Fat" value={todayTotals.fatG} max={targets.fatG} color="#f97316" unit="g" />
                </div>
              </div>

              {/* Water tracker */}
              <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Hydration Matrix
                </div>
                <WaterBar current={todayWaterMl} target={targets.waterMl} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {WATER_QUICK_OPTIONS.map(ml => (
                    <motion.button key={ml}
                      onClick={() => addWater(ml)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                      style={{
                        background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 8, padding: '6px 14px', color: '#60a5fa',
                        fontSize: 12, fontFamily: 'Space Grotesk, monospace', cursor: 'pointer',
                      }}
                    >
                      +{ml}ml
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* IGRIS Observations */}
              {nutritionScore.observations.length > 0 && (
                <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                    <AlertTriangle size={12} color="#facc15" />
                    <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      IGRIS Observations
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {nutritionScore.observations.map((obs, i) => (
                      <div key={i} style={{ color: 'rgba(240,244,255,0.75)', fontSize: 12, fontFamily: 'Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6, paddingLeft: 10, borderLeft: '2px solid rgba(59,130,246,0.25)' }}>
                        {obs}
                      </div>
                    ))}
                  </div>
                  {nutritionScore.recommendations.length > 0 && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ color: '#2d2d50', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Next Actions
                      </div>
                      {nutritionScore.recommendations.map((r, i) => (
                        <div key={i} style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'Space Grotesk, monospace', marginBottom: 4 }}>
                          → {r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Grade + Macro rings */}
              <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '20px 22px' }}>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                  Daily Grade
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
                  <GradeBadge grade={nutritionScore.grade} />
                  <div>
                    <div style={{ color: gradeCol, fontSize: 16, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{GRADE_LABELS[nutritionScore.grade]}</div>
                    <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', marginTop: 2 }}>Score: {nutritionScore.overallScore}/100</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ color: '#facc15', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>+{nutritionScore.xpBonus} XP</span>
                      {nutritionScore.xpBonus > 0 && (
                        <motion.button
                          onClick={awardNutritionXP}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={{
                            background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.3)',
                            borderRadius: 6, padding: '3px 10px', color: '#facc15',
                            fontSize: 10, fontFamily: 'Space Grotesk, monospace', cursor: 'pointer', letterSpacing: '0.06em',
                          }}
                        >
                          Claim XP
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                  <MacroRing label="Calories" value={nutritionScore.calorieScore} max={100} color="#facc15" />
                  <MacroRing label="Protein" value={nutritionScore.proteinScore} max={100} color="#10b981" />
                  <MacroRing label="Hydration" value={nutritionScore.hydrationScore} max={100} color="#60a5fa" />
                </div>
              </div>

              {/* 7-day chart */}
              <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
                  7-Day Calorie History
                </div>
                <WeeklyChart data={weekData} targetCalories={targets.calories} targetProtein={targets.proteinG} />
              </div>

              {/* Meal count today */}
              <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Meals Today</div>
                    <div style={{ color: '#f0f4ff', fontSize: 24, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{getTodayMealCount()}</div>
                  </div>
                  <div>
                    <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Remaining Calories</div>
                    <div style={{ color: Math.max(0, targets.calories - todayTotals.calories) > 0 ? '#10b981' : '#ef4444', fontSize: 22, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                      {Math.max(0, targets.calories - todayTotals.calories)} kcal
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Protein Needed</div>
                    <div style={{ color: Math.max(0, targets.proteinG - todayTotals.proteinG) > 0 ? '#facc15' : '#10b981', fontSize: 22, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                      {Math.max(0, targets.proteinG - todayTotals.proteinG)}g
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* MEAL LOG TAB */}
        {activeTab === 'log' && (
          <motion.div key="log" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="nutri-main-grid" style={{ display: 'grid', gap: 20, alignItems: 'start' }}
          >
            {/* Meal list */}
            <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  Today&apos;s Meals — {todayMeals.length} logged
                </span>
                <motion.button
                  onClick={() => setShowMealLogger(v => !v)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  style={{
                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 8, padding: '6px 14px', color: '#60a5fa',
                    fontSize: 11, fontFamily: 'Space Grotesk, monospace', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <Plus size={12} /> Add Meal
                </motion.button>
              </div>

              <AnimatePresence>
                {showMealLogger && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', marginBottom: 16 }}>
                    <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 10, padding: '16px' }}>
                      <MealLogger onAdd={handleAddMeal} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {todayMeals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#2d2d50', fontSize: 13, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
                  No meals logged today. The system is watching, Hunter.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <AnimatePresence>
                    {todayMeals.map((meal) => (
                      <motion.div key={meal.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 10, padding: '12px 16px', gap: 12,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ color: '#e2e8ff', fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 500, marginBottom: 3 }}>{meal.name}</div>
                          <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {meal.type} · {new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
                          <span style={{ color: '#facc15', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>{meal.macros.calories} kcal</span>
                          <span style={{ color: '#10b981', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>{meal.macros.proteinG}g P</span>
                        </div>
                        <motion.button onClick={() => removeMeal(meal.id)}
                          whileHover={{ color: '#ef4444' }} whileTap={{ scale: 0.9 }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d2d50', padding: 4, flexShrink: 0 }}>
                          <Trash2 size={13} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Totals sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Today&apos;s Totals
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Calories', value: todayTotals.calories, target: targets.calories, color: '#facc15', unit: 'kcal' },
                    { label: 'Protein', value: todayTotals.proteinG, target: targets.proteinG, color: '#10b981', unit: 'g' },
                    { label: 'Carbs', value: todayTotals.carbsG, target: targets.carbsG, color: '#a78bfa', unit: 'g' },
                    { label: 'Fat', value: todayTotals.fatG, target: targets.fatG, color: '#f97316', unit: 'g' },
                  ].map(({ label, value, target, color, unit }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{label}</span>
                      <span style={{ color, fontSize: 14, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                        {Math.round(value)}{unit}
                        <span style={{ color: '#2d2d50', fontSize: 10 }}> / {target}{unit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add water */}
              <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Quick Water Log
                </div>
                <WaterBar current={todayWaterMl} target={targets.waterMl} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {WATER_QUICK_OPTIONS.map(ml => (
                    <motion.button key={ml} onClick={() => addWater(ml)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}
                      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '6px 14px', color: '#60a5fa', fontSize: 12, fontFamily: 'Space Grotesk, monospace', cursor: 'pointer' }}>
                      +{ml}ml
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* HOSTEL DATABASE TAB */}
        {activeTab === 'database' && (
          <motion.div key="database" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6, padding: '12px 16px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 10 }}>
                &ldquo;These are your available fuel sources, Hunter. Every meal here is accessible in a hostel environment. Green dot = always available. Yellow = common. Grey = sometimes.&rdquo;
              </div>
            </div>
            <div className="nutri-hostel-grid" style={{ display: 'grid', gap: 12 }}>
              {HOSTEL_MEALS.filter(m => !m.tags.includes('hydration')).map(meal => (
                <HostelMealCard key={meal.name} meal={meal} onAdd={handleAddMeal} />
              ))}
            </div>
          </motion.div>
        )}

        {/* IGRIS AI TAB */}
        {activeTab === 'igris' && (
          <motion.div key="igris" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="nutri-main-grid" style={{ display: 'grid', gap: 20, alignItems: 'start' }}
          >
            <IGRISNutritionAI
              dailyTotals={{ calories: todayTotals.calories, proteinG: todayTotals.proteinG, waterMl: todayWaterMl }}
              targets={{ calories: targets.calories, proteinG: targets.proteinG, waterMl: targets.waterMl }}
              hunterLevel={player.level}
              hunterStreak={player.streak}
            />

            {/* Context sidebar */}
            <div style={{ background: '#0a0a12', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 14, padding: '18px 20px' }}>
              <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                What IGRIS Knows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Hunter Level', value: `Lv.${player.level}` },
                  { label: 'Active Streak', value: `${player.streak} days` },
                  { label: 'Today Calories', value: `${todayTotals.calories} / ${targets.calories} kcal` },
                  { label: 'Today Protein', value: `${todayTotals.proteinG}g / ${targets.proteinG}g` },
                  { label: 'Hydration', value: `${Math.round(todayWaterMl / 100) / 10}L / ${targets.waterMl / 1000}L` },
                  { label: 'Today Grade', value: nutritionScore.grade },
                  { label: 'Meals Logged', value: `${getTodayMealCount()}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{label}</span>
                    <span style={{ color: '#e2e8ff', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: '12px', background: 'rgba(59,130,246,0.04)', borderRadius: 8, fontSize: 11, color: '#4a5568', fontFamily: 'Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6 }}>
                Context is automatically injected into IGRIS. The AI knows your exact nutrition status before responding.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
