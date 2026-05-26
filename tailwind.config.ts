import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── COLORS ─────────────────────────────────────
      colors: {
        arise: {
          // Background layers
          void: '#050508',
          surface: '#0a0a12',
          raised: '#0f0f1a',
          panel: '#13131f',

          // Borders
          border: '#1a1a2e',
          'border-accent': '#2d2d50',
          'border-bright': '#3d3d6a',

          // Blue Aura (primary)
          aura: '#3b82f6',
          'aura-bright': '#60a5fa',
          'aura-glow': '#93c5fd',
          'aura-deep': '#1d4ed8',
          'aura-dim': '#1e3a5f',

          // Purple Shadow
          shadow: '#7c3aed',
          'shadow-dim': '#4c1d95',
          'shadow-bright': '#a78bfa',

          // Gold Rank
          gold: '#f59e0b',
          'gold-bright': '#fbbf24',

          // Status
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#60a5fa',

          // Text
          'text-primary': '#f0f4ff',
          'text-secondary': '#8892b0',
          'text-dim': '#4a5568',
          'text-accent': '#60a5fa',
          'text-gold': '#fbbf24',
        },
      },

      // ─── FONTS ──────────────────────────────────────
      fontFamily: {
        display: ['var(--font-rajdhani)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-space-grotesk)', 'monospace'],
      },

      // ─── ANIMATIONS ─────────────────────────────────
      animation: {
        'aura-pulse': 'auraPulse 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'flame': 'flame 1.5s ease-in-out infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scan': 'scan 3s linear infinite',
        'level-up': 'levelUp 0.8s cubic-bezier(0.22, 1, 0.36, 1)',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'particle': 'particle 2s ease-out forwards',
      },
      keyframes: {
        auraPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.05)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        flame: {
          '0%, 100%': { transform: 'scale(1) rotate(-3deg)', opacity: '0.9' },
          '50%': { transform: 'scale(1.1) rotate(3deg)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        levelUp: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        particle: {
          '0%': { opacity: '1', transform: 'translate(0, 0) scale(1)' },
          '100%': { opacity: '0', transform: 'translate(var(--tx), var(--ty)) scale(0)' },
        },
      },

      // ─── SPACING ────────────────────────────────────
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },

      // ─── BACKDROP BLUR ──────────────────────────────
      backdropBlur: {
        xs: '2px',
      },

      // ─── BOX SHADOWS ────────────────────────────────
      boxShadow: {
        aura: '0 0 20px rgba(59, 130, 246, 0.3)',
        'aura-lg': '0 0 40px rgba(59, 130, 246, 0.25)',
        'aura-xl': '0 0 60px rgba(59, 130, 246, 0.2)',
        rank: '0 0 30px rgba(124, 58, 237, 0.4)',
        gold: '0 0 20px rgba(245, 158, 11, 0.4)',
        panel: '0 8px 32px rgba(0, 0, 0, 0.6)',
        'panel-lg': '0 16px 48px rgba(0, 0, 0, 0.7)',
        glow: '0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.2)',
        danger: '0 0 20px rgba(239, 68, 68, 0.4)',
        success: '0 0 20px rgba(16, 185, 129, 0.4)',
      },

      // ─── GRADIENTS via BG ───────────────────────────
      backgroundImage: {
        'arise-gradient': 'linear-gradient(135deg, #0a0a12 0%, #050508 100%)',
        'aura-gradient': 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 50%, #60a5fa 100%)',
        'shadow-gradient': 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
        'gold-gradient': 'linear-gradient(135deg, #92400e 0%, #f59e0b 100%)',
        'shimmer-gradient': 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.1) 50%, transparent 100%)',
        'panel-gradient': 'linear-gradient(135deg, rgba(15,15,26,0.9) 0%, rgba(10,10,18,0.95) 100%)',
        'stat-str': 'linear-gradient(90deg, #7f1d1d, #ef4444)',
        'stat-agi': 'linear-gradient(90deg, #064e3b, #10b981)',
        'stat-end': 'linear-gradient(90deg, #1e3a5f, #3b82f6)',
        'stat-vit': 'linear-gradient(90deg, #2e1065, #a78bfa)',
        'stat-int': 'linear-gradient(90deg, #78350f, #f59e0b)',
      },
    },
  },
  plugins: [],
};

export default config;
