'use client';
// components/dashboard/IGRISWidget.tsx
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bot, ChevronRight } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { buildContext, generateDailyGreeting } from '@/lib/igris/igrisEngine';

export function IGRISWidget() {
  const { player } = usePlayerStore();
  const [message, setMessage] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(true);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const context = buildContext({
      playerLevel: player.level,
      playerRank: player.rank,
      streak: player.streak,
      lastWorkoutDate: player.lastWorkoutDate,
    });
    const greeting = generateDailyGreeting(context);
    setMessage(greeting);
  }, [player.level, player.rank, player.streak, player.lastWorkoutDate]);

  // Typewriter effect
  useEffect(() => {
    if (!message) return;
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayedText(message.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 28);
    return () => clearInterval(interval);
  }, [message]);

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((p) => !p);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      id="dashboard-igris"
      className="arise-card relative overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5 }}
    >
      {/* Blue aura border at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-arise-aura to-transparent" />
      <div className="absolute inset-0 rounded-xl opacity-5"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #3b82f6 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-arise-aura/15 border border-arise-aura/40 flex items-center justify-center animate-aura-pulse">
              <Bot size={16} className="text-arise-aura" />
            </div>
            <div>
              <div className="font-display font-bold text-arise-aura tracking-widest text-sm">
                IGRIS
              </div>
              <div className="text-arise-text-dim text-xs font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-arise-success inline-block" />
                Shadow Commander · Online
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="igris-bubble mb-4 min-h-[60px]">
          <p className="igris-message text-sm">
            &ldquo;{displayedText}
            {(isTyping || showCursor) && (
              <span className="inline-block w-0.5 h-4 bg-arise-aura ml-0.5 align-middle" />
            )}
            &rdquo;
          </p>
        </div>

        {/* Link to IGRIS */}
        <Link href="/igris" id="igris-open-btn">
          <motion.div
            className="flex items-center justify-between text-arise-text-secondary hover:text-arise-aura transition-colors duration-200 text-sm font-mono group"
            whileHover={{ x: 2 }}
          >
            <span className="group-hover:text-arise-aura transition-colors">
              Open IGRIS Console →
            </span>
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}
