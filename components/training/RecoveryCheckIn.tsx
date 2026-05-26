'use client';
// components/training/RecoveryCheckIn.tsx
// Pre-workout recovery check-in — 5-axis tactical scan
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecoveryStore } from '@/lib/store/useRecoveryStore';
import { calculateRecoveryScore } from '@/lib/systems/recoveryEngine';
import type { RecoveryScore } from '@/types/recovery';

interface SliderProps {
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  value: number;
  onChange: (v: number) => void;
  color: string;
  invert?: boolean; // if true, high value = bad
}

function TacticalSlider({ label, description, lowLabel, highLabel, value, onChange, color, invert }: SliderProps) {
  const displayColor = invert
    ? value <= 2 ? '#10b981' : value <= 3 ? '#f59e0b' : '#ef4444'
    : value >= 4 ? '#10b981' : value >= 3 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14,
            color: '#f0f4ff', letterSpacing: '0.04em',
          }}>
            {label}
          </div>
          <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
            {description}
          </div>
        </div>
        <motion.div
          key={value}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          style={{
            fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 22,
            color: displayColor, textShadow: `0 0 10px ${displayColor}60`,
            minWidth: 28, textAlign: 'right',
          }}
        >
          {value}
        </motion.div>
      </div>

      {/* Custom range slider */}
      <div style={{ position: 'relative', marginBottom: 6 }}>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: 6,
            appearance: 'none',
            background: `linear-gradient(90deg, ${displayColor} ${((value - 1) / 4) * 100}%, rgba(26,26,46,0.9) ${((value - 1) / 4) * 100}%)`,
            borderRadius: 3,
            outline: 'none',
            cursor: 'pointer',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.05em' }}>
          {lowLabel}
        </span>
        <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.05em' }}>
          {highLabel}
        </span>
      </div>
    </div>
  );
}

interface RecoveryCheckInProps {
  onComplete: (score: RecoveryScore) => void;
  onSkip: () => void;
}

export function RecoveryCheckIn({ onComplete, onSkip }: RecoveryCheckInProps) {
  const { addCheckIn, getTodaysCheckIn } = useRecoveryStore();

  const [sleep, setSleep] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [breathing, setBreathing] = useState(3);
  const [motivation, setMotivation] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<RecoveryScore | null>(null);

  const todaysCheckIn = getTodaysCheckIn();

  const handleSubmit = useCallback(() => {
    const checkIn = addCheckIn({
      sleepQuality: sleep,
      sorenessLevel: soreness,
      fatigueLevel: fatigue,
      breathingDifficulty: breathing,
      motivationState: motivation,
    });
    const score = calculateRecoveryScore(checkIn);
    setResult(score);
    setSubmitted(true);
  }, [sleep, soreness, fatigue, breathing, motivation, addCheckIn]);

  if (submitted && result) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        {/* Score reveal */}
        <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
          <div style={{
            fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.22em',
            textTransform: 'uppercase', color: '#4a5568', marginBottom: 12,
          }}>
            Recovery Diagnostics Complete
          </div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
            style={{
              width: 90, height: 90, borderRadius: '50%', margin: '0 auto 16px',
              background: `radial-gradient(circle, ${result.color}20, transparent 70%)`,
              border: `2px solid ${result.color}50`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 30px ${result.color}30`,
            }}
          >
            <div style={{
              fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 28,
              color: result.color, lineHeight: 1,
            }}>
              {result.score}
            </div>
            <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase' }}>
              /100
            </div>
          </motion.div>

          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20,
            color: result.color, letterSpacing: '0.08em', marginBottom: 6,
          }}>
            {result.label}
          </div>
          <div style={{
            color: '#4a5568', fontSize: 12, fontFamily: 'Space Grotesk, monospace',
            letterSpacing: '0.06em', marginBottom: 20,
          }}>
            Recommended: {result.recommendedIntensity.replace('_', ' ')}
          </div>
        </div>

        {/* IGRIS observations */}
        <div style={{
          background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(45,45,80,0.7)',
          borderRadius: 10, padding: '14px 16px', marginBottom: 20,
        }}>
          <div style={{
            color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace',
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            IGRIS · Tactical Observations
          </div>
          {result.observations.map((obs, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.12 }}
              style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                marginBottom: i < result.observations.length - 1 ? 8 : 0,
              }}
            >
              <span style={{ color: result.color, fontSize: 12, flexShrink: 0, marginTop: 1 }}>—</span>
              <span style={{
                color: 'rgba(240,244,255,0.8)', fontSize: 12,
                fontFamily: 'Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.6,
              }}>
                {obs}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.button
          onClick={() => onComplete(result)}
          whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${result.color}40` }}
          whileTap={{ scale: 0.97 }}
          style={{
            width: '100%', padding: '14px 24px',
            background: result.color,
            border: 'none', borderRadius: 10,
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16,
            color: 'white', cursor: 'pointer',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            boxShadow: `0 0 16px ${result.color}40`,
          }}
        >
          Begin Mission
        </motion.button>
      </motion.div>
    );
  }

  // Already checked in today — show cached result
  if (todaysCheckIn && !submitted) {
    const score = calculateRecoveryScore(todaysCheckIn);
    return (
      <div>
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: `${score.color}08`, border: `1px solid ${score.color}25`,
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: `${score.color}15`, border: `1px solid ${score.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 16,
            color: score.color,
          }}>
            {score.score}
          </div>
          <div>
            <div style={{ color: score.color, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 15 }}>
              {score.label} · Already scanned today
            </div>
            <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
              Recovery: {score.score}/100 · {score.recommendedIntensity}
            </div>
          </div>
        </div>
        <button
          onClick={() => onComplete(score)}
          className="arise-btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Continue to Mission
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{
        fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.22em',
        textTransform: 'uppercase', color: '#4a5568', marginBottom: 4,
      }}>
        System Diagnostic
      </div>
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 18,
        color: '#f0f4ff', marginBottom: 20,
      }}>
        Recovery Scan
      </div>

      <TacticalSlider
        label="Sleep Quality"
        description="How rested do you feel?"
        lowLabel="Terrible"
        highLabel="Excellent"
        value={sleep}
        onChange={setSleep}
        color="#a78bfa"
      />
      <TacticalSlider
        label="Soreness Level"
        description="Muscle soreness from previous sessions"
        lowLabel="No soreness"
        highLabel="Very sore"
        value={soreness}
        onChange={setSoreness}
        color="#ef4444"
        invert
      />
      <TacticalSlider
        label="Fatigue Level"
        description="Overall energy reserves"
        lowLabel="Fully rested"
        highLabel="Exhausted"
        value={fatigue}
        onChange={setFatigue}
        color="#f59e0b"
        invert
      />
      <TacticalSlider
        label="Breathing"
        description="How easy is deep breathing right now?"
        lowLabel="Easy"
        highLabel="Difficult"
        value={breathing}
        onChange={setBreathing}
        color="#3b82f6"
        invert
      />
      <TacticalSlider
        label="Motivation"
        description="Mental drive to train"
        lowLabel="Low"
        highLabel="High"
        value={motivation}
        onChange={setMotivation}
        color="#10b981"
      />

      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <motion.button
          onClick={handleSubmit}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="arise-btn-primary"
          style={{ flex: 1, justifyContent: 'center', padding: '13px 20px' }}
        >
          Run Diagnostics
        </motion.button>
        <button
          onClick={onSkip}
          style={{
            background: 'transparent', border: '1px solid #2d2d50',
            borderRadius: 8, padding: '13px 16px',
            color: '#4a5568', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
            fontSize: 13, cursor: 'pointer', letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Skip
        </button>
      </div>
    </motion.div>
  );
}
