'use client';
// app/stats/page.tsx — Phase 5: Full Analytics + Body Tracker + Stamina Evolution
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AmbientBackground } from '@/components/animations/AmbientBackground';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useWorkoutStore } from '@/lib/store/useWorkoutStore';
import { useRecoveryStore } from '@/lib/store/useRecoveryStore';
import { RANK_DATA, xpForLevel } from '@/lib/systems/levelingSystem';
import { STAT_META, statToPercent } from '@/lib/systems/statSystem';
import {
  buildStaminaTimeline, computeBreathingAdaptation,
  computeWeeklyMomentum, getStaminaTrend, getEnduranceLabel,
} from '@/lib/systems/staminaTracker';
import { calculateRecoveryScore } from '@/lib/systems/recoveryEngine';
import { buildFullContext } from '@/lib/igris/contextBuilder';
import type { StatKey } from '@/types/workout';
import type { BodyMeasurement } from '@/types/recovery';
import { Plus, Scale, Ruler, TrendingUp, Activity, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const STAT_KEYS: StatKey[] = ['STR', 'AGI', 'END', 'VIT', 'INT'];

// ─── SVG RADAR CHART ─────────────────────────────────────────────
function RadarChart({ stats }: { stats: Record<StatKey, number> }) {
  const cx = 120, cy = 120, r = 90;
  const levels = [0.25, 0.5, 0.75, 1];
  const getPoint = (angle: number, radius: number) => ({
    x: cx + radius * Math.sin(angle),
    y: cy - radius * Math.cos(angle),
  });
  const statAngles = STAT_KEYS.map((_, i) => (2 * Math.PI * i) / STAT_KEYS.length);
  const statPoints = STAT_KEYS.map((stat, i) => {
    const pct = statToPercent(stats[stat], 200) / 100;
    return getPoint(statAngles[i], r * pct);
  });
  const pathD = statPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';

  return (
    <svg width={240} height={240} viewBox="0 0 240 240" style={{ overflow: 'visible' }}>
      {levels.map((lvl) => {
        const pts = STAT_KEYS.map((_, i) => getPoint(statAngles[i], r * lvl));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + 'Z';
        return <path key={lvl} d={d} fill="none" stroke="rgba(59,130,246,0.12)" strokeWidth={1} />;
      })}
      {STAT_KEYS.map((_, i) => {
        const outer = getPoint(statAngles[i], r);
        return <line key={i} x1={cx} y1={cy} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="rgba(59,130,246,0.1)" strokeWidth={1} />;
      })}
      <motion.path
        d={pathD}
        fill="rgba(59,130,246,0.12)"
        stroke="#3b82f6"
        strokeWidth={1.5}
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
        style={{ transformOrigin: `${cx}px ${cy}px`, filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.4))' }}
      />
      {statPoints.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={4} fill="#3b82f6"
          initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + i * 0.08 }}
          style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.8))' }}
        />
      ))}
      {STAT_KEYS.map((stat, i) => {
        const labelPt = getPoint(statAngles[i], r + 18);
        const meta = STAT_META[stat];
        return (
          <g key={stat}>
            <text x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="central"
              style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 12, fill: meta.color, letterSpacing: '0.08em' }}>
              {stat}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── HEATMAP ─────────────────────────────────────────────────────
function WorkoutHeatmap({ sessions }: { sessions: Array<{ date: string }> }) {
  const weeks = 18;
  const today = new Date();
  const sessionDates = new Set(sessions.map(s => new Date(s.date).toDateString()));
  const cells = useMemo(() => {
    const result = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const weekCells = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(today);
        date.setDate(today.getDate() - w * 7 - (6 - d));
        const hasWorkout = sessionDates.has(date.toDateString());
        const isToday = date.toDateString() === today.toDateString();
        const isFuture = date > today;
        weekCells.push({ date, hasWorkout, isToday, isFuture });
      }
      result.push(weekCells);
    }
    return result;
  }, [sessionDates]); // eslint-disable-line

  const totalWorkouts = sessions.length;
  const thisWeek = sessions.filter(s => {
    const d = new Date(s.date);
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());
    return d >= start;
  }).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff' }}>Consistency Map</div>
          <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Space Grotesk, monospace', marginTop: 2 }}>Last {weeks} weeks</div>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 20, color: '#60a5fa' }}>{totalWorkouts}</div>
            <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 20, color: '#10b981' }}>{thisWeek}</div>
            <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase' }}>This Week</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3, overflowX: 'auto', paddingBottom: 4 }}>
        {cells.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {week.map((cell, di) => (
              <div key={di} className="heatmap-cell"
                title={cell.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                style={{
                  width: 14, height: 14,
                  background: cell.isFuture ? 'rgba(26,26,46,0.3)' :
                    cell.hasWorkout ? cell.isToday ? 'rgba(59,130,246,0.9)' : 'rgba(59,130,246,0.65)' :
                    cell.isToday ? 'rgba(59,130,246,0.2)' : 'rgba(26,26,46,0.9)',
                  boxShadow: cell.hasWorkout ? '0 0 6px rgba(59,130,246,0.4)' : 'none',
                  border: cell.isToday ? '1px solid rgba(59,130,246,0.6)' : '1px solid transparent',
                  opacity: cell.isFuture ? 0.3 : 1,
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>Less</span>
        {['rgba(26,26,46,0.9)', 'rgba(59,130,246,0.25)', 'rgba(59,130,246,0.5)', 'rgba(59,130,246,0.75)', 'rgba(59,130,246,0.95)'].map((bg, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: bg }} />
        ))}
        <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>More</span>
      </div>
    </div>
  );
}

// ─── STAMINA EVOLUTION GRAPH ──────────────────────────────────────
function StaminaEvolutionGraph({ timeline, trend, breathingAdaptation, enduranceLabel }: {
  timeline: ReturnType<typeof buildStaminaTimeline>;
  trend: ReturnType<typeof getStaminaTrend>;
  breathingAdaptation: number;
  enduranceLabel: string;
}) {
  const maxEnd = Math.max(10, ...timeline.map(t => t.endurance));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff' }}>
            Stamina Evolution
          </div>
          <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Space Grotesk, monospace', marginTop: 2 }}>
            Endurance &amp; Breathing Adaptation
          </div>
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: `${trend.color}15`, border: `1px solid ${trend.color}35`,
          color: trend.color, fontSize: 11, fontFamily: 'Space Grotesk, monospace',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <TrendingUp size={11} />
          {trend.label}
          {trend.percentageChange > 0 && ` +${trend.percentageChange}%`}
        </div>
      </div>

      {/* Endurance stage bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>Endurance Stage</span>
          <span style={{ color: '#34d399', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13 }}>{enduranceLabel}</span>
        </div>
        <div style={{ height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (maxEnd / 200) * 100)}%` }}
            transition={{ delay: 0.3, duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
            style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #34d39960, #34d399)', boxShadow: '0 0 8px rgba(52,211,153,0.4)' }}
          />
        </div>
      </div>

      {/* Breathing adaptation */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>Breathing Adaptation</span>
          <span style={{ color: '#60a5fa', fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 13 }}>{breathingAdaptation}%</span>
        </div>
        <div style={{ height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${breathingAdaptation}%` }}
            transition={{ delay: 0.5, duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
            style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #3b82f660, #60a5fa)', boxShadow: '0 0 8px rgba(59,130,246,0.4)' }}
          />
        </div>
      </div>

      {/* Timeline bar chart */}
      {timeline.length > 0 ? (
        <div>
          <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Endurance History
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 60 }}>
            {timeline.map((snap, i) => {
              const pct = Math.max(0.05, snap.endurance / Math.max(1, maxEnd));
              return (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                  title={`${new Date(snap.date).toLocaleDateString()} — END: ${snap.endurance}`}
                  style={{
                    flex: 1, height: `${pct * 100}%`,
                    background: `linear-gradient(180deg, #34d399, #059669)`,
                    borderRadius: '3px 3px 0 0',
                    transformOrigin: 'bottom',
                    boxShadow: '0 0 6px rgba(52,211,153,0.3)',
                    minHeight: 4,
                    cursor: 'default',
                  }}
                />
              );
            })}
          </div>
          <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', marginTop: 6 }}>
            {timeline.length} weeks tracked
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#4a5568', fontSize: 12, fontFamily: 'Inter, sans-serif', padding: '16px 0' }}>
          Complete workouts to build your stamina timeline.
        </div>
      )}

      {/* Observation */}
      <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color: '#34d399', fontSize: 12 }}>—</span>
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
            {trend.observation}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── RECOVERY TREND ───────────────────────────────────────────────
function RecoveryTrendPanel({ checkIns }: { checkIns: import('@/types/recovery').RecoveryCheckIn[] }) {
  const last14 = checkIns.slice(-14);
  const scores = last14.map(c => calculateRecoveryScore(c));
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length) : 0;
  const maxScore = Math.max(1, ...scores.map(s => s.score));

  if (scores.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#4a5568', fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '24px 0' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>🧬</div>
        Complete a recovery check-in before training to see trends here.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff' }}>Recovery Trend</div>
          <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Space Grotesk, monospace', marginTop: 2 }}>
            Last {last14.length} check-ins
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 20,
            color: avgScore >= 60 ? '#10b981' : avgScore >= 40 ? '#f59e0b' : '#ef4444',
          }}>
            {avgScore}/100
          </div>
          <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase' }}>Avg Score</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 64, marginBottom: 8 }}>
        {scores.map((s, i) => {
          const pct = s.score / 100;
          return (
            <motion.div
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.1 + i * 0.04, duration: 0.35, ease: 'easeOut' }}
              title={`${s.label}: ${s.score}/100`}
              style={{
                flex: 1, height: `${Math.max(0.08, pct) * 100}%`,
                background: s.color,
                borderRadius: '3px 3px 0 0',
                transformOrigin: 'bottom',
                boxShadow: `0 0 6px ${s.color}50`,
                minHeight: 4, cursor: 'default', opacity: 0.85,
              }}
            />
          );
        })}
      </div>
      <div style={{ height: 1, background: 'rgba(59,130,246,0.1)', marginBottom: 12 }} />

      {/* Latest observations */}
      {scores.length > 0 && scores[scores.length - 1].observations.slice(0, 2).map((obs, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
          <span style={{ color: '#60a5fa', fontSize: 12, flexShrink: 0 }}>—</span>
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>{obs}</span>
        </div>
      ))}
    </div>
  );
}

// ─── BODY TRACKER ─────────────────────────────────────────────────
function BodyTracker({ measurements, onAdd }: {
  measurements: BodyMeasurement[];
  onAdd: (data: Omit<BodyMeasurement, 'id' | 'date'>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [weight, setWeight] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arms, setArms] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = useCallback(() => {
    onAdd({
      weight: weight ? parseFloat(weight) : undefined,
      waistCm: waist ? parseFloat(waist) : undefined,
      chestCm: chest ? parseFloat(chest) : undefined,
      armsCm: arms ? parseFloat(arms) : undefined,
      notes: notes || undefined,
    });
    setWeight(''); setWaist(''); setChest(''); setArms(''); setNotes('');
    setShowForm(false);
  }, [weight, waist, chest, arms, notes, onAdd]);

  const latest = measurements[measurements.length - 1];
  const prev = measurements[measurements.length - 2];

  const inputStyle = {
    flex: 1, background: '#0a0a12', border: '1px solid #2d2d50',
    borderRadius: 8, padding: '10px 12px', color: '#f0f4ff',
    fontFamily: 'Space Grotesk, monospace', fontSize: 13, outline: 'none',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff' }}>
            Body Evolution
          </div>
          <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Space Grotesk, monospace', marginTop: 2 }}>
            {measurements.length > 0 ? `${measurements.length} check-in${measurements.length !== 1 ? 's' : ''} logged` : 'No data yet'}
          </div>
        </div>
        <motion.button
          onClick={() => setShowForm(f => !f)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#60a5fa', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {showForm ? <ChevronUp size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Log Check-in'}
        </motion.button>
      </div>

      {/* Latest metrics */}
      {latest && (
        <div className="stats-body-grid" style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
          {[
            { key: 'weight', label: 'Weight', value: latest.weight, unit: 'kg', prevValue: prev?.weight, icon: <Scale size={14} /> },
            { key: 'waist', label: 'Waist', value: latest.waistCm, unit: 'cm', prevValue: prev?.waistCm, icon: <Ruler size={14} /> },
            { key: 'chest', label: 'Chest', value: latest.chestCm, unit: 'cm', prevValue: prev?.chestCm, icon: <Activity size={14} /> },
            { key: 'arms', label: 'Arms', value: latest.armsCm, unit: 'cm', prevValue: prev?.armsCm, icon: <Zap size={14} /> },
          ].map((m) => {
            const diff = m.value !== undefined && m.prevValue !== undefined ? m.value - m.prevValue : null;
            const isGood = m.key === 'weight' || m.key === 'waist' ? (diff !== null && diff < 0) : (diff !== null && diff > 0);
            return (
              <motion.div
                key={m.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#0a0a12', border: '1px solid #1a1a2e', borderRadius: 10,
                  padding: '12px 14px', textAlign: 'center',
                }}
              >
                <div style={{ color: '#4a5568', fontSize: 18, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 17, color: '#f0f4ff' }}>
                  {m.value !== undefined ? m.value : '—'}
                  {m.value !== undefined && <span style={{ fontSize: 10, color: '#4a5568' }}> {m.unit}</span>}
                </div>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', marginTop: 2 }}>
                  {m.label}
                </div>
                {diff !== null && (
                  <div style={{
                    fontSize: 10, fontFamily: 'Space Grotesk, monospace', marginTop: 4,
                    color: isGood ? '#10b981' : '#ef4444',
                  }}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} {m.unit}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Log form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ background: 'rgba(10,10,18,0.95)', border: '1px solid #1a1a2e', borderRadius: 12, padding: '20px', marginBottom: 16 }}>
              <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                New Body Check-in
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace', display: 'block', marginBottom: 4 }}>Weight (kg)</label>
                  <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                    placeholder="70.5" step="0.1" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace', display: 'block', marginBottom: 4 }}>Waist (cm)</label>
                  <input type="number" value={waist} onChange={e => setWaist(e.target.value)}
                    placeholder="85" step="0.5" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace', display: 'block', marginBottom: 4 }}>Chest (cm)</label>
                  <input type="number" value={chest} onChange={e => setChest(e.target.value)}
                    placeholder="95" step="0.5" style={inputStyle} />
                </div>
                <div>
                  <label style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace', display: 'block', marginBottom: 4 }}>Arms (cm)</label>
                  <input type="number" value={arms} onChange={e => setArms(e.target.value)}
                    placeholder="32" step="0.5" style={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace', display: 'block', marginBottom: 4 }}>Notes (optional)</label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="How do you feel today?" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <motion.button
                onClick={handleSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="arise-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Log Check-in
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timeline */}
      {measurements.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: '#4a5568', fontSize: 13, fontFamily: 'Inter, sans-serif', padding: '24px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⚖️</div>
          Log your first body check-in to start tracking your transformation.
        </div>
      )}

      {measurements.length > 1 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Timeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {measurements.slice().reverse().slice(0, 8).map((m, i) => (
              <div key={m.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', background: '#0a0a12', borderRadius: 8, border: '1px solid #1a1a2e',
              }}>
                <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
                  {new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {m.weight && <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{m.weight}kg</span>}
                  {m.waistCm && <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>W:{m.waistCm}cm</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── STAT BREAKDOWN ───────────────────────────────────────────────
function StatBreakdown({ stats }: { stats: Record<StatKey, number> }) {
  const total = STAT_KEYS.reduce((s, k) => s + stats[k], 0);
  return (
    <div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff', marginBottom: 16 }}>Attribute Breakdown</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {STAT_KEYS.map((stat, i) => {
          const meta = STAT_META[stat];
          const pct = statToPercent(stats[stat]);
          const grade = stats[stat] >= 150 ? 'S' : stats[stat] >= 100 ? 'A' : stats[stat] >= 70 ? 'B' : stats[stat] >= 40 ? 'C' : stats[stat] >= 20 ? 'D' : 'E';
          return (
            <motion.div key={stat} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 + 0.2, duration: 0.35 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{meta.icon}</span>
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: meta.color }}>{meta.fullLabel}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{grade}-Grade</span>
                  <span style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 16, color: meta.color }}>{stats[stat]}</span>
                </div>
              </div>
              <div style={{ height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.07 + 0.4, duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
                  style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${meta.color}60, ${meta.color})`, boxShadow: `0 0 8px ${meta.glowColor}` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#8892b0', fontSize: 13, fontFamily: 'Space Grotesk, monospace' }}>Total Attribute Points</span>
        <span style={{ color: '#f0f4ff', fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 16 }}>{total}</span>
      </div>
    </div>
  );
}

// ─── RANK TIMELINE ────────────────────────────────────────────────
function RankTimeline({ level }: { level: number }) {
  const milestones = [
    { rank: 'E', level: 1, color: '#8892b0', achieved: level >= 1 },
    { rank: 'D', level: 11, color: '#60a5fa', achieved: level >= 11 },
    { rank: 'C', level: 21, color: '#34d399', achieved: level >= 21 },
    { rank: 'B', level: 36, color: '#a78bfa', achieved: level >= 36 },
    { rank: 'A', level: 51, color: '#f59e0b', achieved: level >= 51 },
    { rank: 'S', level: 71, color: '#ef4444', achieved: level >= 71 },
    { rank: '★', level: 100, color: '#7c3aed', achieved: level >= 100 },
  ];

  return (
    <div>
      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff', marginBottom: 20 }}>Rank Timeline</div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, left: 20, right: 20, height: 2, background: '#1a1a2e' }} />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, ((level - 1) / 99) * 100)}%` }}
          transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
          style={{ position: 'absolute', top: 20, left: 20, height: 2, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', boxShadow: '0 0 8px rgba(59,130,246,0.6)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', paddingTop: 8 }}>
          {milestones.map((m, i) => (
            <motion.div key={m.rank} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.09, type: 'spring', stiffness: 300 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: m.achieved ? m.color : '#1a1a2e',
                border: `2px solid ${m.achieved ? m.color : '#2d2d50'}`,
                boxShadow: m.achieved ? `0 0 12px ${m.color}70` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1, position: 'relative',
              }}>
                {m.achieved && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', opacity: 0.9 }} />}
              </div>
              <div style={{ fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, color: m.achieved ? m.color : '#2d2d50', textAlign: 'center' }}>{m.rank}</div>
              <div style={{ fontSize: 9, fontFamily: 'Space Grotesk, monospace', color: '#4a5568', textAlign: 'center' }}>{m.level}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── WEEKLY SUMMARY ───────────────────────────────────────────────
function WeeklySummary({ sessions }: { sessions: Array<{ date: string; totalXP: number }> }) {
  const today = new Date();
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const thisWeekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    const hasSession = sessions.some(s => new Date(s.date).toDateString() === d.toDateString());
    const xp = sessions.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((a, s) => a + s.totalXP, 0);
    return { day: dayNames[i], hasSession, xp, isToday: d.toDateString() === today.toDateString(), isPast: d < today };
  });
  const weeklyXP = thisWeekDays.reduce((a, d) => a + d.xp, 0);
  const workoutsThisWeek = thisWeekDays.filter(d => d.hasSession).length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff' }}>This Week</div>
        <span style={{ color: '#60a5fa', fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 15 }}>{workoutsThisWeek}/7 days</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginBottom: 8 }}>
        {thisWeekDays.map((day, i) => (
          <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.4, ease: 'easeOut' }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', transformOrigin: 'bottom' }}>
            <div style={{
              width: '100%', flex: 1,
              background: day.hasSession ? day.isToday ? 'linear-gradient(180deg, #60a5fa, #1d4ed8)' : 'rgba(59,130,246,0.55)' : day.isPast ? 'rgba(26,26,46,0.9)' : 'rgba(26,26,46,0.4)',
              borderRadius: 4, minHeight: day.hasSession ? 40 : day.isPast ? 12 : 6, maxHeight: 64,
              boxShadow: day.hasSession ? '0 0 8px rgba(59,130,246,0.4)' : 'none',
              border: day.isToday ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
            }} />
          </motion.div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {thisWeekDays.map((day, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Space Grotesk, monospace', color: day.isToday ? '#60a5fa' : '#4a5568', fontWeight: day.isToday ? 700 : 400 }}>{day.day}</div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>Weekly XP earned</span>
          <span style={{ color: '#60a5fa', fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 16 }}>+{weeklyXP.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN STATS PAGE ─────────────────────────────────────────────
export default function StatsPage() {
  const { player } = usePlayerStore();
  const { sessions } = useWorkoutStore();
  const { checkIns, bodyMeasurements, addBodyMeasurement } = useRecoveryStore();

  const completedSessions = sessions.filter(s => s.completed);
  const rankData = RANK_DATA[player.rank];

  // Stamina analytics
  const ctx = buildFullContext(player, sessions);
  const staminaTimeline = useMemo(() => buildStaminaTimeline(completedSessions, player.stats.END, player.stats.VIT), [completedSessions, player.stats]);
  const staminaTrend = useMemo(() => getStaminaTrend(completedSessions, player.stats.END), [completedSessions, player.stats.END]);
  const breathingAdaptation = useMemo(() => computeBreathingAdaptation({
    endStat: player.stats.END,
    totalWorkouts: player.totalWorkouts,
    consistencyScore: ctx.consistencyScore,
  }), [player.stats.END, player.totalWorkouts, ctx.consistencyScore]);
  const enduranceLabel = getEnduranceLabel(player.stats.END);
  const { thisWeek, lastWeek } = useMemo(() => computeWeeklyMomentum(completedSessions), [completedSessions]);

  const cardDelay = (i: number) => ({ delay: i * 0.1, duration: 0.45, ease: 'easeOut' as const });

  return (
    <PageWrapper>
      <AmbientBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>Analytics</div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 28, color: '#f0f4ff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Stats &amp; Progression
          </h1>
        </motion.div>

        {/* Top Summary Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(0)}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}
          className="stats-summary-grid"
        >
          {[
            { label: 'Level', value: player.level, color: rankData.color, sub: rankData.label },
            { label: 'Total XP', value: player.totalXP.toLocaleString(), color: '#60a5fa', sub: 'accumulated' },
            { label: 'Workouts', value: player.totalWorkouts, color: '#10b981', sub: 'completed' },
            { label: 'Streak', value: `${player.streak}d`, color: '#f97316', sub: 'current' },
            { label: 'Consistency', value: `${ctx.consistencyScore}%`, color: '#a78bfa', sub: 'last 30d' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 + 0.1, duration: 0.35 }}
              style={{ background: '#0a0a12', border: '1px solid #1a1a2e', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}
              whileHover={{ borderColor: `${s.color}40`, y: -2 }}>
              <div style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 20, color: s.color, textShadow: `0 0 10px ${s.color}60` }}>{s.value}</div>
              <div style={{ color: '#f0f4ff', fontSize: 12, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.05em', marginTop: 2 }}>{s.label}</div>
              <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', marginTop: 1 }}>{s.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main grid */}
        <div style={{ display: 'grid', gap: 20 }}>

          {/* ROW 1: Radar + Stats */}
          <div className="stats-grid-row" style={{ display: 'grid', gap: 20 }}>
            <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(1)}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: '#f0f4ff', marginBottom: 20 }}>Hunter Stats Radar</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', width: 240, height: 240, pointerEvents: 'none' }}>
                    <div className="radar-sweep" />
                  </div>
                  <RadarChart stats={player.stats} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {STAT_KEYS.map(stat => {
                    const meta = STAT_META[stat];
                    return (
                      <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.glowColor}`, flexShrink: 0 }} />
                        <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Space Grotesk, monospace', minWidth: 80 }}>{meta.fullLabel}</span>
                        <span style={{ color: meta.color, fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 14 }}>{player.stats[stat]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(2)}>
                <StatBreakdown stats={player.stats} />
              </motion.div>
            </div>
          </div>

          {/* ROW 2: Heatmap + Weekly */}
          <div className="stats-grid-row-wide" style={{ display: 'grid', gap: 20 }}>
            <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(3)}>
              <WorkoutHeatmap sessions={completedSessions} />
            </motion.div>
            <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(4)}>
              <WeeklySummary sessions={completedSessions} />
            </motion.div>
          </div>

          {/* ROW 3: Stamina Evolution + Recovery Trend */}
          <div className="stats-grid-row" style={{ display: 'grid', gap: 20 }}>
            <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(5)}>
              <StaminaEvolutionGraph
                timeline={staminaTimeline}
                trend={staminaTrend}
                breathingAdaptation={breathingAdaptation}
                enduranceLabel={enduranceLabel}
              />
            </motion.div>
            <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(6)}>
              <RecoveryTrendPanel checkIns={checkIns} />
            </motion.div>
          </div>

          {/* ROW 4: Rank Timeline */}
          <motion.div className="analytics-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(7)}>
            <RankTimeline level={player.level} />
          </motion.div>

          {/* ROW 5: Body Tracker (full width) */}
          <motion.div
            className="analytics-card"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={cardDelay(8)}
            style={{ borderColor: 'rgba(124,58,237,0.2)' }}
          >
            <BodyTracker measurements={bodyMeasurements} onAdd={addBodyMeasurement} />
          </motion.div>

        </div>
      </div>
    </PageWrapper>
  );
}
