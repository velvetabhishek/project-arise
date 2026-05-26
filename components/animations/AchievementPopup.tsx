'use client';
// components/animations/AchievementPopup.tsx
// Slide-in achievement notification HUD — desktop top-right

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAchievementStore } from '@/lib/store/useAchievementStore';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { rarityColor, rarityGlow } from '@/lib/systems/achievementEngine';
import type { AchievementDef } from '@/lib/systems/achievementEngine';
import { defToAchievement } from '@/lib/systems/achievementEngine';

export function AchievementPopup() {
  const { dequeueAchievement } = useAchievementStore();
  const { gainXP, player } = usePlayerStore();
  const [current, setCurrent] = useState<AchievementDef | null>(null);
  const [visible, setVisible] = useState(false);

  const showNext = useCallback(() => {
    const next = dequeueAchievement();
    if (next) {
      setCurrent(next);
      setVisible(true);
      // Award XP + record on player
      gainXP(next.xpReward);
      // Record in player achievements via localStorage side-channel
      // (Player store's achievements[] is updated separately)
    }
  }, [dequeueAchievement, gainXP]);

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(showNext, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, showNext]);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!current) return null;

  const color = rarityColor(current.rarity);
  const glow = rarityGlow(current.rarity);
  const rarityLabel = current.rarity.toUpperCase();

  return (
    <div style={{
      position: 'fixed', top: 80, right: 24, zIndex: 500,
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={current.id}
            initial={{ x: 120, opacity: 0, scale: 0.92 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 120, opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{
              width: 320,
              background: 'linear-gradient(135deg, rgba(10,10,20,0.97) 0%, rgba(14,14,28,0.98) 100%)',
              border: `1px solid ${color}40`,
              borderRadius: 14,
              padding: '16px 18px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 24px ${glow}`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            }} />

            {/* Ambient glow */}
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 120, height: 120,
              background: `radial-gradient(circle at top right, ${glow} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <motion.div
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{ fontSize: 26, lineHeight: 1 }}
                >
                  {current.icon}
                </motion.div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#4a5568', fontSize: 9,
                    fontFamily: 'Space Grotesk, monospace',
                    letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 2,
                  }}>
                    Achievement Unlocked
                  </div>
                  <div style={{
                    color: '#f0f4ff', fontSize: 14,
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                    letterSpacing: '0.04em', lineHeight: 1,
                  }}>
                    {current.name}
                  </div>
                </div>
                <div style={{
                  padding: '2px 8px', borderRadius: 6,
                  background: `${color}12`,
                  border: `1px solid ${color}35`,
                  color, fontSize: 9,
                  fontFamily: 'Space Grotesk, monospace',
                  letterSpacing: '0.08em',
                }}>
                  {rarityLabel}
                </div>
              </div>

              {/* Description */}
              <div style={{
                color: 'rgba(240,244,255,0.6)', fontSize: 12,
                fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
                marginBottom: 10, fontStyle: 'italic',
              }}>
                {current.description}
              </div>

              {/* XP reward */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 8,
                    background: 'rgba(59,130,246,0.08)',
                    border: '1px solid rgba(59,130,246,0.2)',
                  }}
                >
                  <span style={{ fontSize: 12 }}>⚡</span>
                  <span style={{
                    color: '#60a5fa', fontSize: 12,
                    fontFamily: 'Space Grotesk, monospace', fontWeight: 700,
                  }}>
                    +{current.xpReward} XP
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Progress bar auto-dismiss */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3.8, ease: 'linear', delay: 0.2 }}
              style={{
                position: 'absolute', bottom: 0, left: 0,
                height: 2, width: '100%',
                background: color,
                transformOrigin: 'left',
                borderRadius: '0 0 14px 14px',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
