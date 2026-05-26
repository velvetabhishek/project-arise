'use client';
// components/ui/StatCard.tsx — Phase 3: count-up, hover glow, stat flash
import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { STAT_META } from '@/lib/systems/statSystem';
import type { StatKey } from '@/types/workout';

interface StatCardProps {
  stat: StatKey;
  value: number;
  index?: number;
  showGain?: number; // flash +N when stat increases
}

const statFillColors: Record<StatKey, string> = {
  STR: 'linear-gradient(90deg, #7f1d1d, #ef4444)',
  AGI: 'linear-gradient(90deg, #064e3b, #10b981)',
  END: 'linear-gradient(90deg, #1e3a5f, #3b82f6)',
  VIT: 'linear-gradient(90deg, #2e1065, #a78bfa)',
  INT: 'linear-gradient(90deg, #78350f, #f59e0b)',
};

function useCountUp(target: number, duration = 800, delay = 0) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(eased * target));
        if (progress < 1) ref.current = setTimeout(tick, 16);
      };
      tick();
    }, delay);
    return () => {
      clearTimeout(t);
      if (ref.current) clearTimeout(ref.current);
    };
  }, [target, duration, delay]);

  return current;
}

export function StatCard({ stat, value, index = 0, showGain }: StatCardProps) {
  const meta = STAT_META[stat];
  const pct = Math.min(100, Math.round((value / 200) * 100));
  const grade = value >= 150 ? 'S' : value >= 100 ? 'A' : value >= 70 ? 'B' : value >= 40 ? 'C' : value >= 20 ? 'D' : 'E';
  const displayValue = useCountUp(value, 700, index * 100 + 200);
  const [flashing, setFlashing] = useState(false);
  const [prevValue, setPrevValue] = useState(value);

  // Flash when value changes
  useEffect(() => {
    if (value !== prevValue) {
      setFlashing(true);
      setPrevValue(value);
      const t = setTimeout(() => setFlashing(false), 700);
      return () => clearTimeout(t);
    }
  }, [value, prevValue]);

  const cardRef = useRef(null);
  const inView = useInView(cardRef, { once: true, margin: '-20px' });

  return (
    <motion.div
      ref={cardRef}
      className={`arise-panel hud-scanlines relative overflow-hidden tactile ${flashing ? 'stat-gain-flash' : ''}`}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.38, ease: 'easeOut' }}
      whileHover={{
        borderColor: meta.color + '50',
        boxShadow: `0 0 20px ${meta.glowColor}`,
        y: -2,
        transition: { duration: 0.2 },
      }}
      style={{ transition: 'border-color 200ms ease, box-shadow 200ms ease' }}
    >
      {/* Ambient stat color glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 100% 0%, ${meta.glowColor.replace('0.4', '0.08')} 0%, transparent 60%)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: meta.glowColor.replace('0.4', '0.12'),
              border: `1px solid ${meta.glowColor.replace('0.4', '0.3')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              {meta.icon}
            </div>
            <div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14,
                letterSpacing: '0.12em', textTransform: 'uppercase', color: meta.color,
                textShadow: `0 0 8px ${meta.glowColor}`,
              }}>
                {meta.label}
              </div>
              <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                {meta.fullLabel}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <motion.div
              key={value}
              animate={flashing ? { scale: [1, 1.22, 1] } : {}}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 22,
                color: meta.color, textShadow: `0 0 12px ${meta.glowColor}`,
                lineHeight: 1,
              }}
            >
              {displayValue}
            </motion.div>
            <div style={{
              fontSize: 11, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              color: meta.color, opacity: 0.6, letterSpacing: '0.06em', marginTop: 2,
            }}>
              {grade}-Grade
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{
          width: '100%', height: 5, background: '#1a1a2e',
          borderRadius: 3, overflow: 'hidden', position: 'relative',
        }}>
          <motion.div
            className="progress-shimmer"
            initial={{ width: 0 }}
            animate={inView ? { width: `${pct}%` } : { width: 0 }}
            transition={{ delay: index * 0.08 + 0.35, duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
            style={{
              height: '100%', borderRadius: 3,
              background: statFillColors[stat],
              boxShadow: `0 0 10px ${meta.glowColor}`,
            }}
          />
        </div>

        {/* XP Gain float indicator */}
        {showGain && showGain > 0 && (
          <div className="xp-float" style={{ top: 0, right: 0 }}>
            +{showGain}
          </div>
        )}
      </div>
    </motion.div>
  );
}
