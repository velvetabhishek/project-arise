'use client';
// components/dashboard/QuestBoard.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, Zap } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  tag: string;
  tagClass: string;
  iconBg: string;
}

const DAILY_QUESTS: Quest[] = [
  {
    id: 'q_workout',
    title: 'Complete Daily Workout',
    description: '60 min full session — no skips.',
    icon: '⚔️',
    xp: 100,
    tag: 'Primary',
    tagClass: 'tag-blue',
    iconBg: 'rgba(59,130,246,0.12)',
  },
  {
    id: 'q_breathing',
    title: 'Breathing Training',
    description: '5 min box breathing — 4-4-4-4 cycles.',
    icon: '🫁',
    xp: 15,
    tag: 'VIT',
    tagClass: 'tag-purple',
    iconBg: 'rgba(124,58,237,0.12)',
  },
  {
    id: 'q_water',
    title: 'Hydration Protocol',
    description: 'Drink 8+ glasses of water today.',
    icon: '💧',
    xp: 10,
    tag: 'Recovery',
    tagClass: 'tag-green',
    iconBg: 'rgba(16,185,129,0.08)',
  },
  {
    id: 'q_steps',
    title: 'Shadow Walk',
    description: 'Walk 5,000+ steps outside the hostel.',
    icon: '👣',
    xp: 20,
    tag: 'AGI',
    tagClass: 'tag-green',
    iconBg: 'rgba(16,185,129,0.08)',
  },
  {
    id: 'q_igris',
    title: 'IGRIS Check-In',
    description: 'Consult IGRIS and receive your briefing.',
    icon: '🤖',
    xp: 10,
    tag: 'INT',
    tagClass: 'tag-gold',
    iconBg: 'rgba(245,158,11,0.08)',
  },
  {
    id: 'q_stretch',
    title: 'Recovery Protocol',
    description: 'Full body stretch — 10 min post-workout.',
    icon: '🌿',
    xp: 15,
    tag: 'VIT',
    tagClass: 'tag-purple',
    iconBg: 'rgba(124,58,237,0.12)',
  },
];

export function QuestBoard() {
  const { gainXP, gainStats } = usePlayerStore();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [justCompleted, setJustCompleted] = useState<string | null>(null);

  const totalXP = DAILY_QUESTS.reduce((s, q) => s + q.xp, 0);
  const earnedXP = DAILY_QUESTS.filter(q => completed.has(q.id)).reduce((s, q) => s + q.xp, 0);
  const completedCount = completed.size;

  const toggleQuest = (quest: Quest) => {
    if (completed.has(quest.id)) return; // can't un-complete
    const next = new Set(completed);
    next.add(quest.id);
    setCompleted(next);
    setJustCompleted(quest.id);
    gainXP(quest.xp);
    // Grant a small stat depending on tag
    if (quest.tag === 'AGI') gainStats({ AGI: 1 });
    else if (quest.tag === 'VIT') gainStats({ VIT: 1 });
    else if (quest.tag === 'INT') gainStats({ INT: 1 });
    else if (quest.tag === 'Primary') gainStats({ STR: 1, END: 1 });
    setTimeout(() => setJustCompleted(null), 700);
  };

  return (
    <motion.div
      id="quest-board"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
            Daily Quests
          </div>
          <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22, color: '#f0f4ff', letterSpacing: '0.03em' }}>
            Mission Board
          </h2>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 20,
            color: '#60a5fa', textShadow: '0 0 12px rgba(59,130,246,0.5)',
          }}>
            {earnedXP}<span style={{ color: '#4a5568', fontSize: 14 }}>/{totalXP}</span>
          </div>
          <div style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>XP Available</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#8892b0', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>
            {completedCount}/{DAILY_QUESTS.length} completed
          </span>
          <span style={{ color: '#60a5fa', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>
            {Math.round((completedCount / DAILY_QUESTS.length) * 100)}%
          </span>
        </div>
        <div className="arise-progress-track" style={{ height: 6 }}>
          <motion.div
            className="arise-progress-fill"
            animate={{ width: `${(completedCount / DAILY_QUESTS.length) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)',
              boxShadow: '0 0 8px rgba(59,130,246,0.5)',
            }}
          />
        </div>
      </div>

      {/* Quest List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {DAILY_QUESTS.map((quest, i) => {
          const isDone = completed.has(quest.id);
          const isJust = justCompleted === quest.id;
          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className={`quest-card${isDone ? ' completed' : ''}`}
              onClick={() => toggleQuest(quest)}
              id={`quest-${quest.id}`}
              style={{ userSelect: 'none' }}
            >
              {/* Completion flash */}
              <AnimatePresence>
                {isJust && (
                  <motion.div
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      position: 'absolute', inset: 0, borderRadius: 12,
                      background: 'rgba(16,185,129,0.15)',
                      pointerEvents: 'none',
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <div className="quest-icon" style={{ background: quest.iconBg }}>
                {quest.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{
                    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: 15,
                    color: isDone ? '#8892b0' : '#f0f4ff',
                    textDecoration: isDone ? 'line-through' : 'none',
                    letterSpacing: '0.02em',
                  }}>
                    {quest.title}
                  </span>
                  <span className={`tag ${quest.tagClass}`}>{quest.tag}</span>
                </div>
                <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
                  {quest.description}
                </div>
              </div>

              {/* XP + Check */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={11} color="#60a5fa" />
                  <span style={{
                    fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 13,
                    color: isDone ? '#4a5568' : '#60a5fa',
                  }}>
                    +{quest.xp}
                  </span>
                </div>
                <motion.div
                  className={`quest-check${isDone ? ' done' : ''}`}
                  animate={isJust ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.35 }}
                >
                  {isDone && <CheckCheck size={13} color="white" />}
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* All complete banner */}
      <AnimatePresence>
        {completedCount === DAILY_QUESTS.length && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 16, padding: '14px 20px', borderRadius: 12,
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: '#10b981', letterSpacing: '0.05em' }}>
              ✦ All Quests Complete
            </div>
            <div style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 4, fontStyle: 'italic' }}>
              &ldquo;The shadows acknowledge your discipline.&rdquo; — IGRIS
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
