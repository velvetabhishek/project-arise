'use client';
// components/layout/TopBar.tsx — Enhanced with XP gain flash
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Zap, Star, Swords } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { RANK_DATA } from '@/lib/systems/levelingSystem';
import Link from 'next/link';

export function TopBar() {
  const { player, getXPPercent } = usePlayerStore();
  const rankData = RANK_DATA[player.rank];
  const xpPct = getXPPercent();
  const [prevXP, setPrevXP] = useState(player.totalXP);
  const [xpFlash, setXpFlash] = useState(false);

  // Flash animation when XP changes
  useEffect(() => {
    if (player.totalXP !== prevXP) {
      setXpFlash(true);
      setPrevXP(player.totalXP);
      const t = setTimeout(() => setXpFlash(false), 1000);
      return () => clearTimeout(t);
    }
  }, [player.totalXP, prevXP]);

  const streakActive = player.streak > 0;

  return (
    <header
      className="arise-glass arise-topbar"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        zIndex: 30, height: 64,
        borderBottom: '1px solid rgba(14,14,32,0.75)',
      }}
    >
      {/* Left spacer on desktop (sidebar offset) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', paddingLeft: 16, paddingRight: 16, gap: 8, overflow: 'hidden' }}>

        {/* Mobile logo — hidden on desktop (sidebar shows branding) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 1, minWidth: 0 }} className="topbar-logo-mobile">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 12px rgba(59,130,246,0.2)',
            }}>
              <Swords size={14} color="#60a5fa" />
            </div>
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
              fontSize: 18, color: '#60a5fa', letterSpacing: '0.12em',
              textTransform: 'uppercase', textShadow: '0 0 12px rgba(59,130,246,0.5)',
            }}>
              Arise
            </span>
          </Link>
        </div>

        {/* Desktop: current page context (replaces logo) */}
        <div className="topbar-context-desktop" style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Project Arise · System Online
        </div>

        {/* Right: stats cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

          {/* Streak pill */}
          <motion.div
            id="topbar-streak"
            animate={streakActive ? { scale: [1, 1.04, 1] } : {}}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              background: '#0d0d1a', border: '1px solid #131328', borderRadius: 8,
            }}
          >
            <Flame
              size={15}
              color={streakActive ? '#fb923c' : '#4a5568'}
              style={streakActive ? { filter: 'drop-shadow(0 0 5px rgba(251,146,60,0.7))', animation: 'flame 1.5s ease-in-out infinite' } : undefined}
            />
            <span style={{
              fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 14,
              color: streakActive ? '#fb923c' : '#4a5568',
            }}>
              {player.streak}
            </span>
          </motion.div>

          {/* Rank + Level pill */}
          <div
            id="topbar-level"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              background: `${rankData.color}10`, border: `1px solid ${rankData.color}35`, borderRadius: 8,
            }}
          >
            <Star size={13} color={rankData.color} />
            <span style={{
              fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14,
              color: rankData.color, letterSpacing: '0.06em',
            }}>
              {rankData.label}
            </span>
            <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>
              {player.level}
            </span>
          </div>

          {/* XP bar (desktop only) */}
          <div id="topbar-xp" style={{ flexDirection: 'column', gap: 4, minWidth: 120 }} className="topbar-xp-desktop">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={10} color="#3b82f6" />
                <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>XP</span>
              </div>
              <AnimatePresence>
                {xpFlash && (
                  <motion.span
                    initial={{ opacity: 0, y: 4, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4 }}
                    style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'Space Grotesk, monospace', fontWeight: 700 }}
                  >
                    +XP!
                  </motion.span>
                )}
              </AnimatePresence>
              {!xpFlash && (
                <span style={{ color: '#60a5fa', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
                  {player.currentXP}/{player.xpToNextLevel}
                </span>
              )}
            </div>
            <div style={{ width: '100%', height: 5, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)',
                  boxShadow: '0 0 8px rgba(59,130,246,0.6)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
