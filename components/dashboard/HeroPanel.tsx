'use client';
// components/dashboard/HeroPanel.tsx
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { RANK_DATA, xpProgressPercent } from '@/lib/systems/levelingSystem';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Zap, TrendingUp, Award } from 'lucide-react';

export function HeroPanel() {
  const { player } = usePlayerStore();
  const rankData = RANK_DATA[player.rank];
  const xpPct = xpProgressPercent(player.currentXP, player.xpToNextLevel);

  return (
    <motion.div
      id="dashboard-hero"
      className="arise-card relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 opacity-10 rounded-xl"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${rankData.color}40 0%, transparent 70%)`,
        }}
      />

      {/* Scanline effect */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div
          className="absolute w-full h-[1px] opacity-20"
          style={{
            background: `linear-gradient(90deg, transparent, ${rankData.color}, transparent)`,
            animation: 'scan 4s linear infinite',
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-arise-text-dim text-xs font-mono uppercase tracking-widest mb-1">
              Hunter Profile
            </div>
            <h1 className="font-display font-bold text-3xl lg:text-4xl text-arise-text-primary tracking-wide">
              {player.name}
            </h1>
            <p
              className="font-display text-sm tracking-widest mt-1"
              style={{ color: rankData.color }}
            >
              {player.title}
            </p>
          </div>

          {/* Level display */}
          <div className="text-right">
            <div className="text-arise-text-dim text-xs font-mono uppercase tracking-widest mb-1">
              Level
            </div>
            <motion.div
              className="font-display font-bold text-5xl lg:text-6xl text-glow-aura"
              style={{ color: rankData.color, textShadow: `0 0 30px ${rankData.glowColor}` }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            >
              {player.level}
            </motion.div>
            <div
              className="font-display font-bold text-sm tracking-widest mt-1 px-3 py-0.5 rounded-full border inline-block"
              style={{
                color: rankData.color,
                borderColor: `${rankData.color}50`,
                background: `${rankData.color}10`,
              }}
            >
              {rankData.label}
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-arise-aura" />
              <span className="text-arise-text-secondary text-sm font-mono uppercase tracking-wider">
                Experience Points
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-arise-aura-glow font-mono text-sm font-bold">
                {player.currentXP.toLocaleString()}
              </span>
              <span className="text-arise-text-dim font-mono text-xs">
                / {player.xpToNextLevel.toLocaleString()}
              </span>
            </div>
          </div>
          <ProgressBar value={xpPct} variant="xp" size="lg" animated />
          <div className="text-arise-text-dim text-xs font-mono mt-1 text-right">
            {player.xpToNextLevel - player.currentXP} XP to Level {player.level + 1}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-arise-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-arise-aura" />
              <span className="text-arise-text-dim text-xs font-mono uppercase tracking-wider">
                Total XP
              </span>
            </div>
            <div className="font-mono font-bold text-arise-aura">
              {player.totalXP.toLocaleString()}
            </div>
          </div>
          <div className="text-center border-x border-arise-border">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Award size={12} className="text-arise-gold" />
              <span className="text-arise-text-dim text-xs font-mono uppercase tracking-wider">
                Workouts
              </span>
            </div>
            <div className="font-mono font-bold text-arise-gold">
              {player.totalWorkouts}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-xs">📅</span>
              <span className="text-arise-text-dim text-xs font-mono uppercase tracking-wider">
                Day
              </span>
            </div>
            <div className="font-mono font-bold text-arise-text-primary">
              {Math.floor((Date.now() - new Date(player.joinDate).getTime()) / 86400000) + 1}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
