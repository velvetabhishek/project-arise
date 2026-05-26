'use client';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { BookOpen, Lock } from 'lucide-react';

export default function JournalPage() {
  return (
    <PageWrapper>
      <div className="mb-6">
        <div className="text-arise-text-dim text-xs font-mono uppercase tracking-widest mb-1">Module</div>
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-arise-text-primary tracking-wide">
          Hunter Journal
        </h1>
        <p className="text-arise-text-secondary text-sm mt-1">
          Workout logs, reflections, and weekly body check-ins.
        </p>
      </div>
      <motion.div
        className="arise-card flex flex-col items-center justify-center py-20 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-arise-shadow/10 border border-arise-shadow/30 flex items-center justify-center mb-4">
          <BookOpen size={32} className="text-arise-shadow-bright" />
        </div>
        <h2 className="font-display font-bold text-2xl text-arise-text-primary mb-2">Journal System</h2>
        <p className="text-arise-text-secondary max-w-md">
          Workout session logs, personal reflections, weekly body check-ins with measurements, and mood tracking.
        </p>
        <div className="mt-6 flex items-center gap-2 text-arise-text-dim text-sm font-mono">
          <Lock size={14} /><span>Phase 2 — Build Next</span>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
