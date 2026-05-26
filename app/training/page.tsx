'use client';
// app/training/page.tsx — Phase 5: Adaptive Training + Recovery Integration
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AmbientBackground } from '@/components/animations/AmbientBackground';
import { LevelUpOverlay } from '@/components/animations/LevelUpOverlay';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useWorkoutStore } from '@/lib/store/useWorkoutStore';
import { getAdaptedMission, MISSION_TIER_CONFIG } from '@/lib/systems/adaptiveMission';
import { buildFullContext } from '@/lib/igris/contextBuilder';
import { RANK_DATA } from '@/lib/systems/levelingSystem';
import { getStreakStatus } from '@/lib/systems/streakSystem';
import { RecoveryCheckIn } from '@/components/training/RecoveryCheckIn';
import type { Exercise } from '@/types/workout';
import type { Player } from '@/types/player';
import type { RecoveryScore } from '@/types/recovery';
import { Swords, CheckCheck, SkipForward, Clock, Zap, Wind, ChevronRight, Play, Pause, Activity } from 'lucide-react';

// ─── BREATHING GUIDE VISUAL ──────────────────────────────────────
function BreathingGuide() {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'hold2'>('in');
  const [count, setCount] = useState(4);
  const phases = [
    { key: 'in', label: 'Breathe In', duration: 4, color: '#3b82f6' },
    { key: 'hold', label: 'Hold', duration: 4, color: '#a78bfa' },
    { key: 'out', label: 'Breathe Out', duration: 4, color: '#10b981' },
    { key: 'hold2', label: 'Hold', duration: 4, color: '#a78bfa' },
  ] as const;

  useEffect(() => {
    const idx = phases.findIndex(p => p.key === phase);
    const dur = phases[idx].duration;
    setCount(dur);

    const countIv = setInterval(() => setCount(c => Math.max(0, c - 1)), 1000);
    const next = setTimeout(() => {
      const nextIdx = (idx + 1) % phases.length;
      setPhase(phases[nextIdx].key);
    }, dur * 1000);

    return () => { clearInterval(countIv); clearTimeout(next); };
  }, [phase]); // eslint-disable-line

  const cfg = phases.find(p => p.key === phase)!;
  const isExpanding = phase === 'in';
  const ringScale = isExpanding ? 1.35 : phase === 'out' ? 1 : 1.17;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
      <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 20 }}>
        Box Breathing · 4-4-4-4
      </div>

      <div style={{ position: 'relative', width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer ring */}
        <motion.div
          animate={{ scale: ringScale, opacity: isExpanding ? 0.8 : 0.5 }}
          transition={{ duration: cfg.duration * 0.9, ease: isExpanding ? 'easeIn' : 'easeOut' }}
          style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: `1px solid ${cfg.color}`,
            background: `radial-gradient(circle, ${cfg.color}10 0%, transparent 70%)`,
          }}
        />
        {/* Mid ring */}
        <motion.div
          animate={{ scale: isExpanding ? 1.2 : 0.9 }}
          transition={{ duration: cfg.duration * 0.9, ease: isExpanding ? 'easeIn' : 'easeOut', delay: 0.1 }}
          style={{
            position: 'absolute', inset: 20, borderRadius: '50%',
            border: `1.5px solid ${cfg.color}60`,
          }}
        />
        {/* Inner circle */}
        <motion.div
          animate={{
            scale: isExpanding ? 1.15 : phase === 'out' ? 0.85 : 1,
            background: [`${cfg.color}20`, `${cfg.color}35`],
          }}
          transition={{ duration: cfg.duration * 0.85, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: 40, borderRadius: '50%',
            background: `${cfg.color}20`,
            border: `2px solid ${cfg.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
            boxShadow: `0 0 24px ${cfg.color}40`,
          }}
        >
          <div style={{
            fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 26,
            color: cfg.color, lineHeight: 1, textShadow: `0 0 12px ${cfg.color}80`,
          }}>
            {count}
          </div>
        </motion.div>
      </div>

      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginTop: 20, textAlign: 'center' }}
      >
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18, color: cfg.color, letterSpacing: '0.08em' }}>
          {cfg.label}
        </div>
        <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', marginTop: 4 }}>
          {phase === 'in' ? 'Expand your chest and belly' :
           phase === 'out' ? 'Slow controlled exhale' : 'Stay still, hold steady'}
        </div>
      </motion.div>
    </div>
  );
}

// ─── READINESS RADAR ─────────────────────────────────────────────
function ReadinessRadar({ player }: { player: Player }) {
  const hour = new Date().getHours();
  const optimalHour = hour >= 6 && hour <= 10 || hour >= 16 && hour <= 20;
  const streakBoost = Math.min(20, player.streak * 3);
  const levelBoost = Math.min(20, player.level * 2);
  const readiness = Math.min(100, 60 + (optimalHour ? 20 : 0) + streakBoost / 2 + levelBoost / 2);
  const readinessColor = readiness >= 80 ? '#10b981' : readiness >= 60 ? '#60a5fa' : '#f59e0b';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
      {/* Radar circle */}
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 16 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden' }}>
          <div className="radar-sweep" />
        </div>
        {/* Rings */}
        {[1, 0.75, 0.5, 0.25].map((r, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%',
            border: '1px solid rgba(59,130,246,0.12)',
            inset: `${(1 - r) * 50}%`,
          }} />
        ))}
        {/* Center readiness value */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 250 }}
            style={{
              fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 26,
              color: readinessColor, textShadow: `0 0 12px ${readinessColor}80`,
              lineHeight: 1,
            }}
          >
            {Math.round(readiness)}
          </motion.div>
          <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', marginTop: 2 }}>
            Ready
          </div>
        </div>
      </div>

      {/* Status items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
        {[
          { label: 'Time Window', ok: optimalHour, tip: optimalHour ? 'Optimal' : 'Sub-optimal' },
          { label: 'Streak Momentum', ok: player.streak > 0, tip: `${player.streak}d active` },
          { label: 'Hunter Level', ok: player.level >= 3, tip: `Lv.${player.level}` },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: item.ok ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 6px ${item.ok ? '#10b981' : '#f59e0b'}`,
              }} />
              <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{item.label}</span>
            </div>
            <span style={{ color: item.ok ? '#10b981' : '#f59e0b', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
              {item.tip}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── REST TIMER ──────────────────────────────────────────────────
function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(intervalRef.current!); onDone(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paused, onDone]);

  const pct = ((seconds - remaining) / seconds) * 100;
  const circumference = 2 * Math.PI * 52;
  const strokeDash = circumference - (pct / 100) * circumference;
  const isUrgent = remaining <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ textAlign: 'center', padding: '32px 24px' }}
    >
      <div style={{ fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 24 }}>
        — Rest Period —
      </div>

      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={70} cy={70} r={52} fill="none" stroke="#1a1a2e" strokeWidth={4} />
          <motion.circle
            cx={70} cy={70} r={52}
            fill="none"
            stroke={isUrgent ? '#ef4444' : '#3b82f6'}
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: strokeDash }}
            transition={{ duration: 0.6, ease: 'linear' }}
            style={{ filter: `drop-shadow(0 0 8px ${isUrgent ? 'rgba(239,68,68,0.7)' : 'rgba(59,130,246,0.7)'})` }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <motion.div
            animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 40,
              color: isUrgent ? '#ef4444' : '#60a5fa',
              lineHeight: 1,
              textShadow: isUrgent ? '0 0 16px rgba(239,68,68,0.7)' : '0 0 16px rgba(59,130,246,0.7)',
            }}
          >
            {remaining}
          </motion.div>
          <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', marginTop: 4 }}>secs</div>
        </div>
      </div>

      {/* Breathing during rest */}
      <div style={{ marginBottom: 20, padding: '0 16px' }}>
        <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', marginBottom: 6, letterSpacing: '0.05em' }}>
          Focus your breathing during rest
        </div>
        <div style={{ height: 4, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)', borderRadius: 2 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
          onClick={() => setPaused(p => !p)}
          className="arise-btn-primary magnetic-btn"
          style={{
            padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          onClick={onDone}
          style={{
            background: 'transparent', border: '1px solid #2d2d50', borderRadius: 8,
            padding: '10px 20px', color: '#8892b0',
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 13,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <SkipForward size={14} /> Skip Rest
        </button>
      </div>
    </motion.div>
  );
}

// ─── EXERCISE CARD ───────────────────────────────────────────────
function ExerciseCard({ exercise, index, isActive, isDone, setsCompleted, onCompleteSet, onSkip }: {
  exercise: Exercise; index: number; isActive: boolean; isDone: boolean;
  setsCompleted: number; onCompleteSet: () => void; onSkip: () => void;
}) {
  const catColors: Record<string, string> = {
    PUSH: '#ef4444', PULL: '#a78bfa', LEGS: '#10b981',
    CORE: '#3b82f6', CARDIO: '#f59e0b', RECOVERY: '#8892b0',
  };
  const color = catColors[exercise.category] || '#8892b0';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: isDone ? 1 : 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`workout-exercise-card${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Active glow effect */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 0% 50%, rgba(59,130,246,0.06) 0%, transparent 60%)',
        }} />
      )}

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        {/* Index badge */}
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0, marginTop: 1,
          background: isDone ? 'rgba(16,185,129,0.15)' : isActive ? 'rgba(59,130,246,0.15)' : 'rgba(26,26,46,0.9)',
          border: `1px solid ${isDone ? 'rgba(16,185,129,0.3)' : isActive ? 'rgba(59,130,246,0.35)' : '#2d2d50'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 12,
          color: isDone ? '#10b981' : isActive ? '#60a5fa' : '#4a5568',
          transition: 'all 300ms ease',
        }}>
          {isDone ? '✓' : String(index + 1).padStart(2, '0')}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}70`, flexShrink: 0 }} />
            <span style={{ color, fontSize: 10, fontFamily: 'Space Grotesk, monospace', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {exercise.category}
            </span>
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
            fontSize: isActive ? 20 : 17,
            color: isDone ? '#4a5568' : '#f0f4ff',
            letterSpacing: '0.03em', marginBottom: 4,
            textDecoration: isDone ? 'line-through' : 'none',
            transition: 'font-size 200ms ease',
          }}>
            {exercise.name}
          </div>
          <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Inter, sans-serif', marginBottom: isActive ? 12 : 0 }}>
            {exercise.sets} sets × {exercise.reps ? `${exercise.reps} reps` : `${exercise.duration}s`}
            &nbsp;·&nbsp;<span style={{ color: '#3b82f6' }}>+{exercise.xpReward} XP</span>
          </div>

          {/* Tips - only show when active */}
          <AnimatePresence>
            {isActive && (exercise.breathingTip || exercise.formTip) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}
              >
                {exercise.breathingTip && (
                  <div style={{
                    padding: '7px 11px', borderRadius: 7,
                    background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
                    display: 'flex', gap: 7, alignItems: 'flex-start',
                  }}>
                    <Wind size={12} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                      {exercise.breathingTip}
                    </span>
                  </div>
                )}
                {exercise.formTip && (
                  <div style={{
                    padding: '7px 11px', borderRadius: 7,
                    background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
                    display: 'flex', gap: 7, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>💡</span>
                    <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                      {exercise.formTip}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Set bubbles */}
          {!isDone && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: exercise.sets }).map((_, si) => (
                <div
                  key={si}
                  className={`set-bubble${si < setsCompleted ? ' done' : si === setsCompleted && isActive ? ' active' : ''}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Action buttons - active only */}
        {isActive && !isDone && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            <motion.button
              onClick={onCompleteSet}
              className="arise-btn-primary magnetic-btn tactile"
              whileTap={{ scale: 0.94 }}
              style={{ padding: '10px 14px', fontSize: 12, minWidth: 100 }}
            >
              <CheckCheck size={14} />
              {setsCompleted + 1 < exercise.sets ? `Set ${setsCompleted + 1}` : 'Finish'}
            </motion.button>
            <button
              onClick={onSkip}
              style={{
                background: 'transparent', border: '1px solid #2d2d50', borderRadius: 8,
                padding: '7px 10px', color: '#4a5568',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 11,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                justifyContent: 'center', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}
            >
              <SkipForward size={11} /> Skip
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── SESSION COMPLETE ─────────────────────────────────────────────
function SessionComplete({ xpGained, duration, exercisesCompleted, onClose }: {
  xpGained: number; duration: number; exercisesCompleted: number; onClose: () => void;
}) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const dur = 1200;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      setDisplayed(Math.round(eased * xpGained));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [xpGained]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ textAlign: 'center', padding: '40px 24px' }}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 16 }}
        style={{
          width: 96, height: 96, borderRadius: '50%', margin: '0 auto 28px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.05) 100%)',
          border: '2px solid rgba(16,185,129,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(16,185,129,0.25)',
          animation: 'auraPulse 2.5s ease-in-out infinite',
        }}
      >
        <CheckCheck size={44} color="#10b981" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 8 }}>
          Session Complete
        </div>
        <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 32, color: '#f0f4ff', letterSpacing: '0.06em', marginBottom: 6 }}>
          Mission Accomplished
        </h2>
        <p style={{ color: '#8892b0', fontSize: 13, fontStyle: 'italic', fontFamily: 'Inter, sans-serif', marginBottom: 28 }}>
          &ldquo;The system has recorded your discipline. The shadows grow stronger.&rdquo; — IGRIS
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{
          fontFamily: 'Space Grotesk, monospace', fontWeight: 700,
          fontSize: 52, color: '#60a5fa', lineHeight: 1,
          textShadow: '0 0 30px rgba(59,130,246,0.7)',
        }}>
          +{displayed.toLocaleString()}
        </div>
        <div style={{ color: '#4a5568', fontFamily: 'Space Grotesk, monospace', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 4 }}>
          Experience Points
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#1a1a2e', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}
      >
        {[
          { label: 'Exercises', value: exercisesCompleted, color: '#60a5fa' },
          { label: 'Duration', value: `${duration}m`, color: '#10b981' },
          { label: 'Streak', value: '+1', color: '#f97316' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#0a0a12', padding: '16px 8px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </motion.div>

      <motion.button
        onClick={onClose}
        className="arise-btn-primary magnetic-btn"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}
      >
        Return to Command Center <ChevronRight size={16} />
      </motion.button>
    </motion.div>
  );
}

// ─── PRE-SESSION (Phase 5: Adaptive + Recovery) ──────────────────
function PreSession({ adaptedMission, xpMultiplier, adaptationNote, missionTier, player, onStart }: {
  adaptedMission: ReturnType<typeof getAdaptedMission>['mission'];
  xpMultiplier: number;
  adaptationNote: string;
  missionTier: 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
  player: Player;
  onStart: (recoveryScore: RecoveryScore | null) => void;
}) {
  const rankData = RANK_DATA[player.rank];
  const tierCfg = MISSION_TIER_CONFIG[missionTier];
  const [activeTab, setActiveTab] = useState<'briefing' | 'recovery' | 'breathing' | 'readiness'>('recovery');
  const [recoveryScore, setRecoveryScore] = useState<RecoveryScore | null>(null);

  const handleRecoveryComplete = (score: RecoveryScore) => {
    setRecoveryScore(score);
    setActiveTab('briefing');
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Mission header */}
      <motion.div
        className="arise-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20, position: 'relative', overflow: 'hidden',
          border: `1px solid ${tierCfg.color}30`,
          boxShadow: `0 0 24px ${tierCfg.glow}` }}
      >
        <div className="scan-beam" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                  Today&apos;s Assignment
                </div>
                <div style={{
                  padding: '2px 8px', borderRadius: 10,
                  background: `${tierCfg.color}15`, border: `1px solid ${tierCfg.color}35`,
                  fontSize: 9, color: tierCfg.color,
                  fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  {tierCfg.label}
                </div>
              </div>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 26, color: '#f0f4ff', letterSpacing: '0.03em', marginBottom: 8 }}>
                {adaptedMission.title}
              </h2>
              <p style={{ color: '#8892b0', fontSize: 13, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
                {adaptedMission.description}
              </p>
            </div>
            <div style={{
              width: 56, height: 56, borderRadius: 12, flexShrink: 0,
              background: `${tierCfg.color}15`, border: `1px solid ${tierCfg.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, boxShadow: `0 0 20px ${tierCfg.glow}`,
              animation: 'auraPulse 3s ease-in-out infinite',
            }}>
              ⚔️
            </div>
          </div>

          {/* Adaptation note from IGRIS system */}
          {adaptationNote && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '8px 12px', borderRadius: 8, marginBottom: 12,
              background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)',
            }}>
              <span style={{ color: '#60a5fa', fontSize: 11, flexShrink: 0, marginTop: 1 }}>—</span>
              <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
                {adaptationNote}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="tag tag-blue"><Clock size={10} /> {adaptedMission.duration} min</span>
            <span className="tag tag-gold">
              <Zap size={10} /> +{adaptedMission.totalXP} XP
              {xpMultiplier !== 1 && (
                <span style={{ color: xpMultiplier > 1 ? '#10b981' : '#ef4444', marginLeft: 4 }}>
                  ×{xpMultiplier.toFixed(1)}
                </span>
              )}
            </span>
            <span className="tag tag-purple">🎯 {adaptedMission.exercises.length} exercises</span>
            {recoveryScore && (
              <span style={{
                padding: '3px 8px', borderRadius: 20, fontSize: 11,
                background: `${recoveryScore.color}15`, border: `1px solid ${recoveryScore.color}35`,
                color: recoveryScore.color, fontFamily: 'Space Grotesk, monospace',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Activity size={9} /> Recovery {recoveryScore.score}/100
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: '#0a0a12', borderRadius: 10, padding: 4, border: '1px solid #1a1a2e' }}>
        {[
          { key: 'recovery',  label: 'Recovery', icon: '🧬' },
          { key: 'briefing',  label: 'Mission',  icon: '⚔️' },
          { key: 'breathing', label: 'Breathing',icon: '🫁' },
          { key: 'readiness', label: 'Readiness',icon: '📡' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              flex: 1, padding: '7px 8px', borderRadius: 8, border: 'none',
              background: activeTab === tab.key ? 'rgba(59,130,246,0.18)' : 'transparent',
              color: activeTab === tab.key ? '#60a5fa' : '#4a5568',
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', letterSpacing: '0.03em', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 4, transition: 'all 200ms ease',
            }}
          >
            <span style={{ fontSize: 13 }}>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'recovery' && (
          <motion.div key="recovery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="arise-card" style={{ marginBottom: 16 }}>
              <RecoveryCheckIn
                onComplete={handleRecoveryComplete}
                onSkip={() => setActiveTab('briefing')}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'briefing' && (
          <motion.div key="briefing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="arise-card" style={{ marginBottom: 16 }}>
              <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
                Session Exercises
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {adaptedMission.exercises.map((ex, i) => (
                  <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 11, color: '#3b82f6', flexShrink: 0,
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 15, color: '#f0f4ff' }}>{ex.name}</div>
                      <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
                        {ex.sets}×{ex.reps || ex.duration + 's'} · +{ex.xpReward}xp
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IGRIS brief */}
            <div className="igris-bubble" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>⚡</div>
                <p className="igris-message" style={{ fontSize: 13 }}>
                  &ldquo;{recoveryScore
                    ? recoveryScore.observations[0]
                    : 'Mission parameters loaded. Prioritize controlled breathing throughout. Every rep counts. Do not stop.'}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'breathing' && (
          <motion.div key="breathing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="arise-card" style={{ marginBottom: 16 }}>
              <BreathingGuide />
            </div>
          </motion.div>
        )}

        {activeTab === 'readiness' && (
          <motion.div key="readiness" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="arise-card" style={{ marginBottom: 16 }}>
              <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
                Combat Readiness Scan
              </div>
              <ReadinessRadar player={player} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => onStart(recoveryScore)}
        className="arise-btn-primary magnetic-btn"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ width: '100%', justifyContent: 'center', padding: '15px 24px', fontSize: 16 }}
        id="start-session-btn"
      >
        <Swords size={18} /> Begin Session
      </motion.button>
    </div>
  );
}

// ─── MAIN TRAINING PAGE ──────────────────────────────────────────
type Phase = 'pre' | 'active' | 'rest' | 'complete';

export default function TrainingPage() {
  const { player, gainXP, gainStats, completeWorkout, updateStreak } = usePlayerStore();
  const { startSession, logExercise, completeSession, sessions } = useWorkoutStore();
  const streakStatus = getStreakStatus(player);

  // Build adaptive mission from player context
  const ctx = buildFullContext(player, sessions);
  const { mission: adaptedMission, modifiers, estimatedXP } = getAdaptedMission({
    playerLevel: player.level,
    streak: player.streak,
    daysSinceLastWorkout: ctx.daysSinceLastWorkout,
    consistencyScore: ctx.consistencyScore,
    hour: ctx.hour,
    recoveryScore: null, // updated after check-in
  });
  const [xpMultiplier] = useState(modifiers.xpMultiplier);

  const [phase, setPhase] = useState<Phase>('pre');
  const [activeIdx, setActiveIdx] = useState(0);
  const [exerciseSets, setExerciseSets] = useState<number[]>(new Array(adaptedMission.exercises.length).fill(0));
  const [doneExercises, setDoneExercises] = useState<boolean[]>(new Array(adaptedMission.exercises.length).fill(false));
  const [restTime, setRestTime] = useState(60);
  const [sessionXP, setSessionXP] = useState(0);
  const [sessionStart, setSessionStart] = useState<Date | null>(null);
  const [levelUpData, setLevelUpData] = useState({ visible: false, newLevel: 1, xpGained: 0, rankedUp: false });

  const startWorkout = (_recoveryScore: RecoveryScore | null) => {
    startSession(`session_${Date.now()}`);
    setSessionStart(new Date());
    setPhase('active');
  };

  const finishSession = useCallback((done: boolean[], lastXP: number) => {
    const rawXP = sessionXP + lastXP;
    const totalXP = Math.round(rawXP * xpMultiplier);
    completeSession(totalXP, {});
    completeWorkout();
    if (streakStatus.canWorkoutToday) updateStreak();
    const result = gainXP(totalXP);
    if (result.leveledUp) {
      setLevelUpData({ visible: true, newLevel: player.level + result.levelsGained, xpGained: totalXP, rankedUp: result.rankedUp });
    }
    setPhase('complete');
  }, [sessionXP, xpMultiplier, player.level, gainXP, completeSession, completeWorkout, updateStreak, streakStatus]);

  const completeSet = useCallback(() => {
    const ex = adaptedMission.exercises[activeIdx];
    const newSets = [...exerciseSets];
    newSets[activeIdx] += 1;
    setExerciseSets(newSets);

    if (newSets[activeIdx] >= ex.sets) {
      const newDone = [...doneExercises];
      newDone[activeIdx] = true;
      setDoneExercises(newDone);
      const xp = ex.xpReward;
      setSessionXP(x => x + xp);
      logExercise({ exerciseId: ex.id, exerciseName: ex.name, setsCompleted: ex.sets, repsCompleted: new Array(ex.sets).fill(ex.reps || 0), xpEarned: xp });
      if (ex.statGain) gainStats(ex.statGain);
      if (newDone.every(Boolean)) { finishSession(newDone, xp); return; }
      const nextIdx = newDone.findIndex((d, i) => !d && i > activeIdx);
      if (nextIdx !== -1) {
        setPhase('rest');
        setRestTime(ex.restTime || 60);
        setTimeout(() => { setActiveIdx(nextIdx); setPhase('active'); }, 10);
      }
    } else {
      setPhase('rest');
      setRestTime(ex.restTime || 60);
    }
  }, [activeIdx, exerciseSets, doneExercises, adaptedMission, gainStats, logExercise, finishSession]);

  const skipExercise = useCallback(() => {
    const newDone = [...doneExercises];
    newDone[activeIdx] = true;
    setDoneExercises(newDone);
    const nextIdx = newDone.findIndex(d => !d);
    if (nextIdx !== -1) { setActiveIdx(nextIdx); setPhase('active'); }
    else finishSession(newDone, 0);
  }, [activeIdx, doneExercises, finishSession]);

  const progressPct = doneExercises.filter(Boolean).length / adaptedMission.exercises.length * 100;

  return (
    <PageWrapper>
      <AmbientBackground />
      <LevelUpOverlay
        visible={levelUpData.visible}
        newLevel={levelUpData.newLevel}
        xpGained={levelUpData.xpGained}
        rankedUp={levelUpData.rankedUp}
        onClose={() => setLevelUpData(d => ({ ...d, visible: false }))}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} style={{ marginBottom: 20 }}>
          <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>
            Training Chamber
          </div>
          <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 26, color: '#f0f4ff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            {phase === 'pre' ? 'Mission Briefing' : phase === 'rest' ? 'Recovery Phase' : phase === 'complete' ? 'Debrief' : 'Active Session'}
          </h1>
        </motion.div>

        {/* Session progress bar */}
        <AnimatePresence>
          {(phase === 'active' || phase === 'rest') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
                  {doneExercises.filter(Boolean).length}/{adaptedMission.exercises.length} exercises
                </span>
                <span style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'Space Grotesk, monospace', fontWeight: 700 }}>
                  +{sessionXP} XP
                </span>
              </div>
              <div className="arise-progress-track progress-shimmer" style={{ height: 5 }}>
                <motion.div
                  className="arise-progress-fill"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)', boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase content */}
        <AnimatePresence mode="wait">
          {phase === 'pre' && (
            <motion.div key="pre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}>
              <PreSession
                adaptedMission={adaptedMission}
                xpMultiplier={xpMultiplier}
                adaptationNote={modifiers.adaptationNote}
                missionTier={modifiers.missionTier}
                player={player}
                onStart={startWorkout}
              />
            </motion.div>
          )}

          {phase === 'rest' && (
            <motion.div key="rest" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <div className="arise-card">
                <RestTimer seconds={restTime} onDone={() => setPhase('active')} />
              </div>
            </motion.div>
          )}

          {phase === 'active' && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {adaptedMission.exercises.map((ex, i) => (
                  <ExerciseCard
                    key={ex.id} exercise={ex} index={i}
                    isActive={i === activeIdx}
                    isDone={doneExercises[i]}
                    setsCompleted={exerciseSets[i]}
                    onCompleteSet={completeSet}
                    onSkip={skipExercise}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'complete' && (
            <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="arise-card-success">
                <SessionComplete
                  xpGained={sessionXP}
                  duration={sessionStart ? Math.round((Date.now() - sessionStart.getTime()) / 60000) : 60}
                  exercisesCompleted={doneExercises.filter(Boolean).length}
                  onClose={() => { window.location.href = '/'; }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
