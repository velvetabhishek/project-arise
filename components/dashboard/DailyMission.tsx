'use client';
// components/dashboard/DailyMission.tsx — Phase 4: Clean hierarchy + progressive disclosure
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Swords, Clock, Zap, ChevronRight, Wind, ChevronDown } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { getTodaysMission } from '@/lib/systems/missionSystem';

const CAT_COLOR: Record<string, string> = {
  PUSH: '#ef4444', PULL: '#a78bfa', LEGS: '#10b981',
  CORE: '#3b82f6', CARDIO: '#f59e0b', RECOVERY: '#8892b0',
};
const CAT_ICON: Record<string, string> = {
  PUSH: '💪', PULL: '🔗', LEGS: '🦵',
  CORE: '🎯', CARDIO: '🏃', RECOVERY: '🌿',
};

// Compact single exercise row — only shows extra info on expand
function ExerciseRow({ ex, index, isExpanded, onToggle }: {
  ex: ReturnType<typeof getTodaysMission>['exercises'][0];
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = CAT_COLOR[ex.category] || '#8892b0';
  const hasExtra = !!(ex.breathingTip || ex.formTip);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.28 }}
    >
      {/* Main row */}
      <div
        onClick={hasExtra ? onToggle : undefined}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 0',
          cursor: hasExtra ? 'pointer' : 'default',
          borderBottom: '1px solid rgba(26,26,46,0.6)',
        }}
        onMouseEnter={e => { if (hasExtra) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.01)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
      >
        {/* Category dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: color, boxShadow: `0 0 5px ${color}80`,
        }} />

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 14,
            color: '#e2e8ff', letterSpacing: '0.02em',
          }}>
            {ex.name}
          </span>
        </div>

        {/* Sets × reps */}
        <span style={{
          color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace',
          flexShrink: 0,
        }}>
          {ex.sets}&times;{ex.reps ? ex.reps : `${ex.duration}s`}
        </span>

        {/* XP pill */}
        <span style={{
          color: '#3b82f6', fontSize: 11, fontFamily: 'Space Grotesk, monospace',
          fontWeight: 600, flexShrink: 0, minWidth: 44, textAlign: 'right',
        }}>
          +{ex.xpReward}
        </span>

        {/* Expand arrow */}
        {hasExtra && (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: '#2d2d50', flexShrink: 0 }}
          >
            <ChevronDown size={13} />
          </motion.div>
        )}
      </div>

      {/* Expanded tips — progressive disclosure */}
      <AnimatePresence initial={false}>
        {isExpanded && hasExtra && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '8px 0 10px 19px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ex.breathingTip && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '7px 12px', borderRadius: 7,
                  background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)',
                }}>
                  <Wind size={11} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
                    {ex.breathingTip}
                  </span>
                </div>
              )}
              {ex.formTip && (
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  padding: '7px 12px', borderRadius: 7,
                  background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)',
                }}>
                  <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>💡</span>
                  <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
                    {ex.formTip}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function DailyMission() {
  const { player } = usePlayerStore();
  const mission = useMemo(() => getTodaysMission(player.level), [player.level]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visibleExercises = showAll ? mission.exercises : mission.exercises.slice(0, 5);
  const hiddenCount = mission.exercises.length - 5;

  const toggle = (i: number) => setExpandedIdx(prev => prev === i ? null : i);

  return (
    <motion.div
      id="dashboard-mission"
      className="arise-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.45 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle top edge glow */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent)',
        pointerEvents: 'none',
      }} />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(59,130,246,0.15)',
          }}>
            <Swords size={17} color="#60a5fa" />
          </div>
          <div>
            <div style={{
              color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace',
              letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 3,
            }}>
              Daily Mission
            </div>
            <h2 style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 20,
              color: '#f0f4ff', letterSpacing: '0.03em', lineHeight: 1.1,
            }}>
              {mission.title}
            </h2>
          </div>
        </div>

        {/* XP badge */}
        <div style={{
          padding: '6px 14px', borderRadius: 20,
          background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
          display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
        }}>
          <Zap size={12} color="#60a5fa" />
          <span style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 14, color: '#60a5fa' }}>
            +{mission.totalXP}
          </span>
          <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace' }}>XP</span>
        </div>
      </div>

      {/* ── DESCRIPTION ────────────────────────────────────────── */}
      <p style={{
        color: '#8892b0', fontSize: 13, fontFamily: 'Inter, sans-serif',
        lineHeight: 1.65, marginBottom: 20,
        fontStyle: 'italic',
      }}>
        {mission.description}
      </p>

      {/* ── META ROW ────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
        paddingBottom: 16, borderBottom: '1px solid rgba(26,26,46,0.8)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={12} color="#4a5568" />
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>{mission.duration} min</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12 }}>🎯</span>
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>{mission.exercises.length} exercises</span>
        </div>
        <div style={{
          marginLeft: 'auto', padding: '3px 10px', borderRadius: 20,
          background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)',
          fontSize: 10, color: '#60a5fa', fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.05em',
        }}>
          {mission.focusArea}
        </div>
      </div>

      {/* ── EXERCISE LIST ───────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        {/* Column headers */}
        <div style={{
          display: 'flex', gap: 12, padding: '0 0 6px 19px',
          borderBottom: '1px solid rgba(26,26,46,0.6)',
          marginBottom: 0,
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: '#2d2d50', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Exercise
            </span>
          </div>
          <span style={{ color: '#2d2d50', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sets</span>
          <span style={{ color: '#2d2d50', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: 44, textAlign: 'right' }}>XP</span>
          <div style={{ width: 13 }} />
        </div>

        <div>
          {visibleExercises.map((ex, i) => (
            <ExerciseRow
              key={ex.id}
              ex={ex}
              index={i}
              isExpanded={expandedIdx === i}
              onToggle={() => toggle(i)}
            />
          ))}
        </div>

        {/* Show more toggle */}
        {hiddenCount > 0 && !showAll && (
          <motion.button
            onClick={() => setShowAll(true)}
            style={{
              width: '100%', background: 'transparent', border: 'none',
              padding: '10px 0', cursor: 'pointer',
              color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              letterSpacing: '0.06em',
            }}
            whileHover={{ color: '#8892b0' }}
          >
            <ChevronDown size={13} /> +{hiddenCount} more exercises
          </motion.button>
        )}
      </div>

      {/* ── CATEGORY LEGEND ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
        padding: '14px 0 18px', borderTop: '1px solid rgba(26,26,46,0.6)',
      }}>
        {Array.from(new Set(mission.exercises.map(e => e.category))).map(cat => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: CAT_COLOR[cat] || '#8892b0' }} />
            <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace' }}>{cat}</span>
          </div>
        ))}
      </div>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <Link href="/training" id="mission-start-btn" style={{ display: 'block', textDecoration: 'none' }}>
        <motion.div
          className="arise-btn-primary"
          whileHover={{ scale: 1.015, boxShadow: '0 0 40px rgba(59,130,246,0.45)' }}
          whileTap={{ scale: 0.97 }}
          style={{ width: '100%', justifyContent: 'center', padding: '13px 24px', fontSize: 14 }}
        >
          <Swords size={15} />
          Begin Mission
          <ChevronRight size={15} />
        </motion.div>
      </Link>
    </motion.div>
  );
}
