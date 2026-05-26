'use client';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { Shield, Lock } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { RANK_DATA } from '@/lib/systems/levelingSystem';

export default function RankPage() {
  const { player } = usePlayerStore();
  const rankData = RANK_DATA[player.rank];

  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="text-arise-text-dim text-xs font-mono uppercase tracking-widest mb-1">Module</div>
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-arise-text-primary tracking-wide">
          Rank System
        </h1>
        <p className="text-arise-text-secondary text-sm mt-1">
          Hunter rank progression, achievements, and milestone unlocks.
        </p>
      </div>
      <motion.div
        className="arise-card text-center py-16"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div
          className="w-24 h-24 rounded-full border-2 flex items-center justify-center mx-auto mb-6"
          style={{
            borderColor: rankData.color,
            background: `${rankData.glowColor}`,
            boxShadow: `0 0 30px ${rankData.glowColor}`,
          }}
        >
          <Shield size={40} style={{ color: rankData.color }} />
        </div>
        <div
          className="font-display font-bold text-4xl mb-2"
          style={{ color: rankData.color, textShadow: `0 0 20px ${rankData.glowColor}` }}
        >
          {rankData.label}
        </div>
        <p className="text-arise-text-secondary italic mb-2">&ldquo;{rankData.flavorText}&rdquo;</p>
        <p className="text-arise-text-secondary max-w-md mx-auto mt-6">
          Full rank system with achievement gallery, milestone tracker, and unlock conditions. Coming next.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-arise-text-dim text-sm font-mono">
          <Lock size={14} /><span>Phase 5 — Build Next</span>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
