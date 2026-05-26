'use client';
// components/dashboard/StreakTracker.tsx — Clean premium streak panel
import { motion } from 'framer-motion';
import { Flame, Trophy, ShieldCheck } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { getStreakStatus, STREAK_MILESTONES } from '@/lib/systems/streakSystem';

export function StreakTracker() {
  const { player } = usePlayerStore();
  const { streak, longestStreak, streakFreezes } = player;
  const status   = getStreakStatus(player);
  const alive    = streak > 0;

  // Find next milestone and compute progress toward it
  const prevMilestone = [...STREAK_MILESTONES].reverse().find(m => m.days <= streak);
  const nextMilestone = STREAK_MILESTONES.find(m => m.days > streak);
  const base     = prevMilestone?.days ?? 0;
  const cap      = nextMilestone?.days ?? STREAK_MILESTONES[STREAK_MILESTONES.length - 1].days;
  const milePct  = cap > base ? Math.round(((streak - base) / (cap - base)) * 100) : 100;

  // First 5 milestone dots for display
  const milestoneDots = STREAK_MILESTONES.slice(0, 6);

  const flameColor = status.inDanger ? '#f59e0b' : alive ? '#fb923c' : '#4a5568';
  const flameGlow  = status.inDanger
    ? 'drop-shadow(0 0 12px rgba(245,158,11,0.8))'
    : alive
    ? 'drop-shadow(0 0 14px rgba(251,146,60,0.75))'
    : 'none';

  return (
    <motion.div
      id="dashboard-streak"
      className="arise-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.45 }}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle orange ambient when active */}
      {alive && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 12,
          background: 'radial-gradient(ellipse at 0% 0%, rgba(251,146,60,0.06) 0%, transparent 60%)',
        }} />
      )}

      {/* ── SECTION LABEL ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          Streak System
        </div>
        {streakFreezes > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
            background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)',
            borderRadius: 20, color: '#60a5fa', fontSize: 10, fontFamily: 'Space Grotesk, monospace',
          }}>
            <ShieldCheck size={11} />
            {streakFreezes} freeze{streakFreezes > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── HERO: FLAME + COUNT ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        {/* Animated flame */}
        <motion.div
          animate={alive ? {
            scale: [1, 1.07, 1],
            filter: [
              'drop-shadow(0 0 8px rgba(251,146,60,0.5))',
              'drop-shadow(0 0 18px rgba(251,146,60,0.85))',
              'drop-shadow(0 0 8px rgba(251,146,60,0.5))',
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ flexShrink: 0 }}
        >
          <Flame
            size={56}
            color={flameColor}
            style={{ filter: alive ? undefined : 'none' }}
          />
        </motion.div>

        {/* Count + label */}
        <div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 52,
            color: alive ? '#fb923c' : '#4a5568',
            lineHeight: 1,
            textShadow: alive ? '0 0 20px rgba(251,146,60,0.45)' : 'none',
          }}>
            {streak}
          </div>
          <div style={{
            fontFamily: 'Space Grotesk, monospace', fontSize: 11,
            color: alive ? '#8892b0' : '#4a5568',
            textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 3,
          }}>
            {alive ? `Day${streak !== 1 ? 's' : ''} Active` : 'No Active Streak'}
          </div>
          {/* Status badge */}
          {status.inDanger && (
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 20, fontSize: 10, fontFamily: 'Space Grotesk, monospace',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                color: '#f59e0b',
              }}
            >
              ⚠ Streak at Risk
            </motion.div>
          )}
        </div>
      </div>

      {/* ── MILESTONE PROGRESS ──────────────────────────────────── */}
      {nextMilestone && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
              Next: <span style={{ color: '#fb923c' }}>{nextMilestone.title}</span>
            </span>
            <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
              {streak} / {nextMilestone.days}d
              <span style={{ color: '#f59e0b', marginLeft: 8 }}>+{nextMilestone.xpBonus} XP</span>
            </span>
          </div>
          {/* Progress track */}
          <div style={{ width: '100%', height: 5, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${milePct}%` }}
              transition={{ delay: 0.5, duration: 0.85, ease: 'easeOut' }}
              style={{
                height: '100%', borderRadius: 3,
                background: 'linear-gradient(90deg, #92400e, #fb923c)',
                boxShadow: '0 0 8px rgba(251,146,60,0.4)',
              }}
            />
          </div>
        </div>
      )}

      {/* ── MILESTONE DOTS ──────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#2d2d50', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
          Milestones
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {milestoneDots.map(m => {
            const reached = streak >= m.days;
            return (
              <div
                key={m.days}
                title={`${m.title} — ${m.days}d`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  borderRadius: 20, border: `1px solid ${reached ? 'rgba(251,146,60,0.35)' : 'rgba(26,26,46,0.9)'}`,
                  background: reached ? 'rgba(251,146,60,0.08)' : 'transparent',
                  transition: 'all 300ms ease',
                }}
              >
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: reached ? '#fb923c' : '#2d2d50',
                  boxShadow: reached ? '0 0 5px rgba(251,146,60,0.7)' : 'none',
                }} />
                <span style={{
                  fontSize: 10, fontFamily: 'Space Grotesk, monospace',
                  color: reached ? '#fb923c' : '#4a5568',
                  letterSpacing: '0.02em',
                }}>
                  {m.days}d
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOTTOM: BEST + STATUS ───────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 1, background: 'rgba(26,26,46,0.5)', borderRadius: 8, overflow: 'hidden',
      }}>
        <div style={{ background: '#0a0a12', padding: '12px 16px' }}>
          <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
            Best Streak
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={13} color="#f59e0b" />
            <span style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 16, color: '#f59e0b' }}>
              {longestStreak}d
            </span>
          </div>
        </div>
        <div style={{ background: '#0a0a12', padding: '12px 16px' }}>
          <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
            Status
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: alive ? '#10b981' : '#4a5568',
              boxShadow: alive ? '0 0 6px #10b981' : 'none',
            }} />
            <span style={{
              fontFamily: 'Space Grotesk, monospace', fontSize: 12, fontWeight: 600,
              color: alive ? '#10b981' : '#4a5568',
            }}>
              {alive ? 'Active' : 'Idle'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
