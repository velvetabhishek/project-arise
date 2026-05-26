'use client';
// components/dashboard/StatGrid.tsx — Pure CSS, left-column optimized
import { motion } from 'framer-motion';
import { StatCard } from '@/components/ui/StatCard';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import type { StatKey } from '@/types/workout';

const STAT_ORDER: StatKey[] = ['STR', 'AGI', 'END', 'VIT', 'INT'];

export function StatGrid() {
  const { player } = usePlayerStore();
  const totalStats = Object.values(player.stats).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      id="dashboard-stats"
      className="arise-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.45 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          Hunter Stats
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace' }}>Total</span>
          <span style={{
            fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 14,
            color: '#60a5fa', textShadow: '0 0 8px rgba(59,130,246,0.5)',
          }}>
            {totalStats}
          </span>
        </div>
      </div>

      {/* Stats in a 2-col grid within the card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {STAT_ORDER.map((stat, index) => (
          <StatCard
            key={stat}
            stat={stat}
            value={player.stats[stat]}
            index={index}
          />
        ))}
      </div>
    </motion.div>
  );
}
