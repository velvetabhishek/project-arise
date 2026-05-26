'use client';
// app/page.tsx — Desktop-First Command Center Dashboard (Balanced Layout)
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { AmbientBackground } from '@/components/animations/AmbientBackground';
import { LevelUpOverlay } from '@/components/animations/LevelUpOverlay';
import { IGRISPanel } from '@/components/dashboard/IGRISPanel';
import { QuestBoard } from '@/components/dashboard/QuestBoard';
import { StreakTracker } from '@/components/dashboard/StreakTracker';
import { StatGrid } from '@/components/dashboard/StatGrid';
import { DailyMission } from '@/components/dashboard/DailyMission';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { RANK_DATA, xpProgressPercent } from '@/lib/systems/levelingSystem';
import { Flame, Zap, TrendingUp, Award, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// ─── Cinematic Hero Panel ────────────────────────────────────────
function CinematicHero() {
  const { player } = usePlayerStore();
  const rankData = RANK_DATA[player.rank];
  const xpPct = xpProgressPercent(player.currentXP, player.xpToNextLevel);
  const dayOnJourney = Math.floor((Date.now() - new Date(player.joinDate).getTime()) / 86400000) + 1;

  return (
    <motion.div
      className="hero-banner"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ position: 'relative' }}
    >
      {/* Rank glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 15% 50%, ${rankData.glowColor} 0%, transparent 65%)`,
        opacity: 0.55,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Name + level orb row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 5 }}>
              Hunter Profile
            </div>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 34, color: '#f0f4ff', letterSpacing: '0.04em', lineHeight: 1, marginBottom: 7 }}>
              {player.name}
            </h1>
            <div className="hero-rank-badge" style={{
              color: rankData.color,
              borderColor: `${rankData.color}40`,
              background: `${rankData.color}10`,
            }}>
              ✦ {player.title}
            </div>
          </div>

          {/* Level orb */}
          <motion.div
            style={{ textAlign: 'center', flexShrink: 0 }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.18, type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: `2px solid ${rankData.color}55`,
              background: `radial-gradient(circle, ${rankData.color}18 0%, transparent 70%)`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 24px ${rankData.glowColor}`,
              animation: 'auraPulse 3s ease-in-out infinite',
            }}>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 36, color: rankData.color, textShadow: `0 0 16px ${rankData.glowColor}`, lineHeight: 1 }}>
                {player.level}
              </div>
              <div style={{ fontFamily: 'Space Grotesk, monospace', fontSize: 8, color: '#4a5568', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Level</div>
            </div>
            <div style={{ marginTop: 6, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: rankData.color }}>
              {rankData.label}
            </div>
          </motion.div>
        </div>

        {/* XP Bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={12} color="#3b82f6" />
              <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Experience</span>
            </div>
            <span style={{ color: '#60a5fa', fontSize: 12, fontFamily: 'Space Grotesk, monospace', fontWeight: 700 }}>
              {player.currentXP.toLocaleString()}
              <span style={{ color: '#4a5568', fontWeight: 400 }}> / {player.xpToNextLevel.toLocaleString()}</span>
            </span>
          </div>
          <div className="arise-progress-track" style={{ height: 7, borderRadius: 4 }}>
            <motion.div
              className="arise-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${xpPct}%` }}
              transition={{ delay: 0.35, duration: 0.9, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa)', boxShadow: '0 0 10px rgba(59,130,246,0.6)' }}
            />
          </div>
          <div style={{ marginTop: 4, textAlign: 'right', color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace' }}>
            {(player.xpToNextLevel - player.currentXP).toLocaleString()} XP to Lv.{player.level + 1}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid rgba(26,26,46,0.8)', paddingTop: 14 }}>
          {[
            { label: 'Total XP',  value: player.totalXP.toLocaleString(), color: '#3b82f6', icon: <Zap size={11} />       },
            { label: 'Workouts',  value: player.totalWorkouts,             color: '#f59e0b', icon: <Award size={11} />     },
            { label: 'Streak',    value: `${player.streak}d`,              color: '#f97316', icon: <Flame size={11} />     },
            { label: 'Day',       value: `#${dayOnJourney}`,               color: '#8892b0', icon: <TrendingUp size={11} /> },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 6px', borderRight: i < 3 ? '1px solid rgba(26,26,46,0.8)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 4, color: s.color }}>
                {s.icon}
                <span style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 15, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Motivational Status Strip ──────────────────────────────────
function StatusStrip() {
  const { player } = usePlayerStore();
  const rankData = RANK_DATA[player.rank];
  const hour = new Date().getHours();
  const timeLabel = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : hour < 21 ? 'Evening' : 'Night';
  const messages = [
    `${timeLabel}, Hunter. The gate is open.`,
    rankData.flavorText,
    `Day ${Math.floor((Date.now() - new Date(player.joinDate).getTime()) / 86400000) + 1} of your transformation.`,
    `Every rep is a vote for the person you are becoming.`,
    `The system is watching. Do not disappoint it.`,
  ];
  const msg = messages[Math.floor(Date.now() / 86400000) % messages.length];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
      style={{
        padding: '10px 18px', borderRadius: 10,
        background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 7px #3b82f6', flexShrink: 0, animation: 'auraPulse 3s ease-in-out infinite' }} />
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#8892b0', fontStyle: 'italic', flex: 1, margin: 0 }}>
        {msg}
      </p>
      <Link href="/training" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <motion.div
          whileHover={{ color: '#60a5fa' }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace',
            letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          Train Now <ChevronRight size={12} />
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function DashboardPage() {
  const [levelUpData, setLevelUpData] = useState<{ visible: boolean; newLevel: number; xpGained: number; rankedUp: boolean }>({
    visible: false, newLevel: 1, xpGained: 0, rankedUp: false,
  });
  const handleLevelUpClose = useCallback(() => setLevelUpData(d => ({ ...d, visible: false })), []);

  return (
    <PageWrapper>
      <AmbientBackground />
      <LevelUpOverlay
        visible={levelUpData.visible}
        newLevel={levelUpData.newLevel}
        xpGained={levelUpData.xpGained}
        rankedUp={levelUpData.rankedUp}
        onClose={handleLevelUpClose}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1440 }}>

        {/* ── PAGE HEADER ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.38 }}
          style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 3 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 26, color: '#f0f4ff', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1 }}>
              Command Center
            </h1>
          </div>
          <Link href="/training" id="header-start-training" style={{ textDecoration: 'none' }}>
            <motion.button
              className="arise-btn-primary"
              whileHover={{ scale: 1.03, boxShadow: '0 0 36px rgba(59,130,246,0.5)' }}
              whileTap={{ scale: 0.97 }}
              style={{ padding: '10px 20px', fontSize: 13 }}
            >
              ⚔️ Begin Training
            </motion.button>
          </Link>
        </motion.div>

        {/* ── STATUS STRIP ─────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <StatusStrip />
        </div>

        {/* ══ DESKTOP 3-COLUMN BALANCED GRID ════════════════════
            LEFT  (hero + stats)  → tall, anchored
            MID   (quests + mission) → dense, scrollable
            RIGHT (IGRIS + streak)   → tall panel + compact card
         */}
        <div className="dashboard-grid">

          {/* LEFT: Hero Profile + Stat Grid */}
          <div className="dashboard-col-left" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <CinematicHero />
            <StatGrid />
          </div>

          {/* MIDDLE: Quest Board + Daily Mission */}
          <div className="dashboard-col-mid" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="arise-card">
              <QuestBoard />
            </div>
            <DailyMission />
          </div>

          {/* RIGHT: IGRIS (tall) + Streak (compact below) */}
          <div className="dashboard-col-right" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <IGRISPanel />
            <StreakTracker />
          </div>

        </div>
      </div>
    </PageWrapper>
  );
}
