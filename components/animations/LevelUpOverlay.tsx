'use client';
// components/animations/LevelUpOverlay.tsx — Phase 3: legendary choreography
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { RANK_DATA } from '@/lib/systems/levelingSystem';

interface LevelUpOverlayProps {
  visible: boolean;
  newLevel: number;
  xpGained: number;
  rankedUp?: boolean;
  newRank?: string;
  onClose: () => void;
}

// Animated XP counter
function XPCounter({ target, active }: { target: number; active: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) return;
    setValue(0);
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, active]);

  return (
    <span style={{
      fontFamily: 'Space Grotesk, monospace',
      fontWeight: 700,
      fontSize: 28,
      color: '#60a5fa',
      textShadow: '0 0 20px rgba(59,130,246,0.8)',
    }}>
      +{value.toLocaleString()}
    </span>
  );
}

// Floating particle
function Particle({ color, style }: { color: string; style: React.CSSProperties }) {
  return (
    <div style={{
      position: 'absolute',
      width: Math.random() > 0.5 ? 5 : 3,
      height: Math.random() > 0.5 ? 5 : 3,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 6px ${color}`,
      pointerEvents: 'none',
      ...style,
    }} />
  );
}

export function LevelUpOverlay({ visible, newLevel, xpGained, rankedUp, newRank, onClose }: LevelUpOverlayProps) {
  const { player } = usePlayerStore();
  const rankData = RANK_DATA[player.rank];
  const [particles, setParticles] = useState<Array<{ id: number; x: string; y: string; tx: string; ty: string; color: string; delay: string }>>([]);
  const [showContent, setShowContent] = useState(false);
  const [energyRings, setEnergyRings] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = useCallback(() => {
    setShowContent(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      setShowContent(false);
      setParticles([]);
      setEnergyRings([]);
      return;
    }

    // Staggered energy rings
    const rings: number[] = [];
    [0, 150, 300, 500].forEach((delay, i) => {
      setTimeout(() => {
        rings.push(i);
        setEnergyRings([...rings]);
      }, delay);
    });

    // Particles
    const ps = Array.from({ length: 28 }, (_, i) => ({
      id: i,
      x: `${15 + Math.random() * 70}%`,
      y: `${15 + Math.random() * 70}%`,
      tx: `${(Math.random() - 0.5) * 240}px`,
      ty: `${-(60 + Math.random() * 160)}px`,
      color: i % 4 === 0 ? '#f59e0b' : i % 3 === 0 ? '#a78bfa' : '#60a5fa',
      delay: `${Math.random() * 0.4}s`,
    }));
    setParticles(ps);

    // Show content after rings
    setTimeout(() => setShowContent(true), 200);

    // Auto-close
    timerRef.current = setTimeout(handleClose, 4200);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, handleClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="levelup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleClose}
          style={{ zIndex: 200 }}
        >
          {/* Screen flash */}
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${rankData.color}25 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Energy rings */}
          {energyRings.map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 3 + i * 0.8, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 200, height: 200,
                borderRadius: '50%',
                border: `1px solid ${rankData.color}`,
                pointerEvents: 'none',
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}

          {/* Floating particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.tx, y: p.ty, opacity: 0, scale: 0 }}
              transition={{ duration: 1.2 + Math.random() * 0.5, delay: parseFloat(p.delay), ease: 'easeOut' }}
              style={{
                position: 'absolute', left: p.x, top: p.y,
                width: 5, height: 5, borderRadius: '50%',
                background: p.color, boxShadow: `0 0 6px ${p.color}`,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Main card */}
          <AnimatePresence>
            {showContent && (
              <motion.div
                className="levelup-card"
                initial={{ scale: 0.65, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'relative', zIndex: 10 }}
              >
                {/* Ambient rank glow */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 20, pointerEvents: 'none',
                  background: `radial-gradient(ellipse at 50% 0%, ${rankData.glowColor} 0%, transparent 55%)`,
                  opacity: 0.5,
                }} />
                {/* Scan beam */}
                <div className="scan-beam" style={{ top: '30%' }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* System label */}
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                      fontSize: 10, fontFamily: 'Space Grotesk, monospace',
                      letterSpacing: '0.3em', textTransform: 'uppercase',
                      color: '#4a5568', marginBottom: 24,
                    }}
                  >
                    ── System Notification ──
                  </motion.div>

                  {/* Level ring */}
                  <motion.div
                    initial={{ scale: 0.4, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 16, delay: 0.1 }}
                    style={{ position: 'relative', display: 'inline-flex', marginBottom: 24 }}
                  >
                    {/* Outer glow rings */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1 + i * 0.18, opacity: 0 }}
                        transition={{ delay: 0.3 + i * 0.15, duration: 0.8, repeat: Infinity, repeatDelay: 1 }}
                        style={{
                          position: 'absolute', inset: -(i * 10 + 8),
                          borderRadius: '50%', border: `1px solid ${rankData.color}`,
                          opacity: 0, pointerEvents: 'none',
                        }}
                      />
                    ))}
                    <div className="levelup-ring" style={{
                      borderColor: rankData.color,
                      boxShadow: `0 0 40px ${rankData.glowColor}, inset 0 0 30px ${rankData.glowColor.replace('0.', '0.05')}`,
                      background: `radial-gradient(circle, ${rankData.color}15 0%, transparent 70%)`,
                    }}>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.25, type: 'spring', stiffness: 300, damping: 14 }}
                        style={{
                          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 54,
                          color: rankData.color, textShadow: `0 0 30px ${rankData.glowColor}`,
                          lineHeight: 1,
                        }}
                      >
                        {newLevel}
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Level Up title */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div style={{
                      fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 34,
                      color: '#f0f4ff', letterSpacing: '0.1em', textTransform: 'uppercase',
                      marginBottom: 6,
                    }}>
                      Level Up
                    </div>

                    {rankedUp && newRank && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.45, type: 'spring', stiffness: 260, damping: 16 }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '5px 16px', borderRadius: 20, marginBottom: 12,
                          color: rankData.color,
                          border: `1px solid ${rankData.color}50`,
                          background: `${rankData.color}12`,
                          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14,
                          letterSpacing: '0.1em', textTransform: 'uppercase',
                          boxShadow: `0 0 16px ${rankData.glowColor}`,
                        }}
                      >
                        ✦ Rank Up · {rankData.label}
                      </motion.div>
                    )}

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      style={{
                        fontFamily: 'Inter, sans-serif', fontSize: 13,
                        color: '#8892b0', fontStyle: 'italic', marginBottom: 20,
                      }}
                    >
                      &ldquo;{rankData.flavorText}&rdquo;
                    </motion.p>
                  </motion.div>

                  {/* XP earned pill */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55 }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 10,
                      padding: '10px 24px', borderRadius: 12, marginBottom: 22,
                      background: 'rgba(59,130,246,0.09)',
                      border: '1px solid rgba(59,130,246,0.22)',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>⚡</span>
                    <XPCounter target={xpGained} active={showContent} />
                    <span style={{ color: '#4a5568', fontSize: 13, fontFamily: 'Space Grotesk, monospace' }}>XP</span>
                  </motion.div>

                  {/* Dismiss hint */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.1em' }}
                  >
                    tap to continue
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
