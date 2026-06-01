'use client';
// components/layout/Sidebar.tsx — Desktop HUD Dock + Vertical Sidebar
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Dumbbell, BarChart3, Bot,
  Utensils, Shield, BookOpen, Swords, ChevronLeft,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { RANK_DATA, xpProgressPercent } from '@/lib/systems/levelingSystem';

const NAV_ITEMS = [
  { href: '/',           icon: LayoutDashboard, label: 'Command', short: 'Home',    id: 'nav-dashboard' },
  { href: '/training',   icon: Dumbbell,         label: 'Training', short: 'Train',  id: 'nav-training'  },
  { href: '/stats',      icon: BarChart3,         label: 'Stats',    short: 'Stats',  id: 'nav-stats'     },
  { href: '/igris',      icon: Bot,               label: 'IGRIS',    short: 'IGRIS',  id: 'nav-igris'     },
  { href: '/nutrition',  icon: Utensils,           label: 'Nutrition',short: 'Food',   id: 'nav-nutrition' },
  { href: '/rank',       icon: Shield,             label: 'Ranks',    short: 'Rank',   id: 'nav-rank'      },
  { href: '/journal',    icon: BookOpen,           label: 'Journal',  short: 'Log',    id: 'nav-journal'   },
];

// ── VERTICAL DESKTOP SIDEBAR ─────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname();
  const { player } = usePlayerStore();
  const rankData = RANK_DATA[player.rank];
  const xpPct = xpProgressPercent(player.currentXP, player.xpToNextLevel);
  const [collapsed, setCollapsed] = useState(false);

  // Sync CSS --sidebar-width variable via body class
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('sidebar-collapsed', collapsed);
    }
  }, [collapsed]);

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─────────────────────────────────── */}
      <aside
        className="sidebar-desktop"
        style={{
          position: 'fixed', left: 0, top: 0, height: '100%',
          width: collapsed ? 64 : 228,
          display: 'flex', flexDirection: 'column', zIndex: 40,
          background: 'rgba(6,6,10,0.94)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(26,26,46,0.7)',
          transition: 'width 250ms cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Logo / Collapse Toggle */}
        <div style={{
          padding: collapsed ? '22px 0' : '22px 18px',
          borderBottom: '1px solid rgba(26,26,46,0.7)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 12px rgba(59,130,246,0.18)',
                flexShrink: 0,
              }}>
                <Swords size={13} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, monospace', fontSize: 9, color: '#4a5568', letterSpacing: '0.22em', textTransform: 'uppercase' }}>Project</div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 16, color: '#60a5fa', letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1, textShadow: '0 0 12px rgba(59,130,246,0.4)' }}>
                  Arise
                </div>
              </div>
            </Link>
          )}
          {collapsed && (
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Swords size={13} color="#60a5fa" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6, width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#4a5568', transition: 'all 150ms ease', flexShrink: 0,
              marginLeft: collapsed ? 0 : 4,
            }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronLeft size={13} />
            </motion.div>
          </button>
        </div>

        {/* Player Mini Card */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ padding: '16px 18px', margin: '14px 12px 6px', borderRadius: 10, background: '#0a0a12', border: '1px solid #1a1a2e', flexShrink: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 3 }}>Hunter</div>
                  <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 14, color: '#f0f4ff', letterSpacing: '0.04em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100, lineHeight: 1.2 }}>
                    {player.name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Space Grotesk, monospace', fontWeight: 700, fontSize: 22, color: rankData.color, textShadow: `0 0 10px ${rankData.glowColor}`, lineHeight: 1 }}>
                    {player.level}
                  </div>
                  <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.1em' }}>LVL</div>
                </div>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: 20, marginBottom: 10,
                background: `${rankData.color}10`, border: `1px solid ${rankData.color}30`,
                color: rankData.color, fontSize: 9, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                ✦ {rankData.label}
              </div>
              <div style={{ width: '100%', height: 3, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${xpPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #1d4ed8, #60a5fa)', boxShadow: '0 0 6px rgba(59,130,246,0.5)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.04em' }}>{player.currentXP.toLocaleString()} XP</span>
                <span style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.04em' }}>{player.xpToNextLevel.toLocaleString()} XP</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: collapsed ? '8px 8px' : '8px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '12px' : '11px 14px',
                  borderRadius: 8, marginBottom: 3,
                  textDecoration: 'none',
                  background: isActive ? 'rgba(59,130,246,0.08)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(59,130,246,0.2)' : 'transparent'}`,
                  color: isActive ? '#93c5fd' : '#4a5568',
                  transition: 'all 160ms ease',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = 'rgba(255,255,255,0.025)';
                    el.style.color = '#6b7a99';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = 'transparent';
                    el.style.color = '#4a5568';
                  }
                }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        fontFamily: 'Rajdhani, sans-serif', fontWeight: 500,
                        fontSize: 13, letterSpacing: '0.06em',
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    style={{
                      position: 'absolute', left: 0, top: '20%', bottom: '20%',
                      width: 2, borderRadius: 1, background: '#3b82f6',
                      boxShadow: '0 0 6px rgba(59,130,246,0.8)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer quote */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ padding: '16px 20px', borderTop: '1px solid rgba(26,26,46,0.7)', flexShrink: 0 }}
            >
              <div style={{ color: '#2d2d50', fontSize: 10, fontFamily: 'Inter, sans-serif', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.6 }}>
                &ldquo;I alone level up.&rdquo;
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* ─── MOBILE BOTTOM NAV (compact strip) ───────────────── */}
      <nav className="sidebar-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(6,6,10,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(26,26,46,0.8)',
        paddingBottom: 'max(6px, env(safe-area-inset-bottom))',
        paddingTop: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`mobile-${item.id}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, padding: '6px 10px', borderRadius: 8, textDecoration: 'none',
                  color: isActive ? '#60a5fa' : '#4a5568',
                  position: 'relative',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-active-bg"
                    style={{ position: 'absolute', inset: 0, borderRadius: 8, background: 'rgba(59,130,246,0.1)' }}
                  />
                )}
                <Icon size={19} style={{ position: 'relative', zIndex: 1 }} />
                <span style={{
                  fontSize: 9, fontFamily: 'Space Grotesk, monospace',
                  position: 'relative', zIndex: 1, letterSpacing: '0.04em',
                  textShadow: isActive ? '0 0 8px rgba(59,130,246,0.6)' : 'none',
                }}>
                  {item.short}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
