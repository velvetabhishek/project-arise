'use client';
// components/ui/ProgressBar.tsx
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number;       // 0-100
  max?: number;
  variant?: 'xp' | 'aura' | 'stat' | 'success' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const variantStyles: Record<string, string> = {
  xp: 'from-arise-aura-deep via-arise-aura to-arise-aura-bright',
  aura: 'from-arise-aura-deep to-arise-aura-bright',
  stat: 'from-arise-aura to-arise-shadow',
  success: 'from-emerald-700 to-emerald-400',
  gold: 'from-amber-700 to-amber-400',
};

const sizeStyles: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  max = 100,
  variant = 'xp',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-arise-text-secondary text-xs font-mono uppercase tracking-wider">
              {label}
            </span>
          )}
          <span className="text-arise-aura-glow text-xs font-mono ml-auto">
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div
        className={`arise-progress-track ${sizeStyles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        aria-valuemin={0}
      >
        <motion.div
          className={`arise-progress-fill bg-gradient-to-r ${variantStyles[variant]}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={
            animated
              ? { duration: 0.8, ease: 'easeOut', delay: 0.1 }
              : { duration: 0 }
          }
          style={{
            boxShadow: variant === 'xp' ? '0 0 12px rgba(59, 130, 246, 0.5)' : undefined,
          }}
        />
      </div>
    </div>
  );
}
