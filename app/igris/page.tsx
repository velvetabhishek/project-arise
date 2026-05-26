'use client';
// app/igris/page.tsx — Full IGRIS AI Command Console
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Bot, Zap, RotateCcw, ChevronDown, Activity, Shield } from 'lucide-react';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { useIGRISChat } from '@/lib/igris/useIGRISChat';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { buildFullContext } from '@/lib/igris/contextBuilder';
import { useWorkoutStore } from '@/lib/store/useWorkoutStore';
import type { IGRISState } from '@/lib/igris/contextBuilder';

// ── State Config ────────────────────────────────────────────────
const STATE_CONFIG: Record<IGRISState, {
  label: string; color: string; glowColor: string; description: string;
}> = {
  STANDBY:          { label: 'Standby',          color: '#10b981', glowColor: 'rgba(16,185,129,0.4)',  description: 'Monitoring hunter status' },
  ANALYZING:        { label: 'Analyzing',         color: '#3b82f6', glowColor: 'rgba(59,130,246,0.5)',  description: 'Processing tactical data' },
  ALERT:            { label: 'Alert',             color: '#ef4444', glowColor: 'rgba(239,68,68,0.5)',   description: 'Consistency disruption detected' },
  RECOVERY:         { label: 'Recovery Mode',     color: '#a78bfa', glowColor: 'rgba(167,139,250,0.4)', description: 'Post-training optimization' },
  SHADOW_COMMANDER: { label: 'Shadow Commander',  color: '#f97316', glowColor: 'rgba(249,115,22,0.5)',  description: 'Peak momentum detected' },
  NIGHT_WATCH:      { label: 'Night Watch',       color: '#60a5fa', glowColor: 'rgba(96,165,250,0.3)',  description: 'Low-intensity monitoring' },
};

const QUICK_PROMPTS = [
  { label: "Today's mission",    icon: '⚔️', query: "What should my mission focus be today?" },
  { label: "Analyze my stats",   icon: '📊', query: "Analyze my current stats and tell me where I'm weakest." },
  { label: "I'm exhausted",      icon: '😮‍💨', query: "I'm exhausted today. What should I do?" },
  { label: "Breathing training", icon: '🫁', query: "Give me a breathing training protocol for my endurance weakness." },
  { label: "Motivate me",        icon: '🔥', query: "I need motivation to train right now." },
  { label: "Fat loss advice",    icon: '⚡', query: "Give me specific fat loss advice for my situation." },
  { label: "Weekly review",      icon: '📈', query: "Review my performance this week." },
  { label: "Hostel nutrition",   icon: '🥗', query: "What should I eat in a hostel for fat loss?" },
];

// ── Typewriter effect for assistant messages ─────────────────────
function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, ++i));
      } else {
        setDone(true);
        clearInterval(iv);
      }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="terminal-cursor" />}
    </span>
  );
}

// ── Single message bubble ────────────────────────────────────────
function MessageBubble({
  content, role, isLatest, isStreaming
}: {
  content: string;
  role: 'user' | 'assistant';
  isLatest: boolean;
  isStreaming: boolean;
}) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: isUser ? 8 : -8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', gap: 10 }}
    >
      {!isUser && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, alignSelf: 'flex-end', marginBottom: 2,
          boxShadow: '0 0 8px rgba(59,130,246,0.2)',
        }}>
          ⚡
        </div>
      )}

      <div style={{
        maxWidth: '78%',
        padding: isUser ? '10px 16px' : '12px 16px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
        background: isUser
          ? 'rgba(59,130,246,0.12)'
          : 'rgba(10,10,20,0.95)',
        border: isUser
          ? '1px solid rgba(59,130,246,0.25)'
          : '1px solid rgba(45,45,80,0.7)',
        fontSize: 14,
        lineHeight: 1.65,
        color: isUser ? '#e2e8ff' : 'rgba(240,244,255,0.9)',
        fontFamily: 'Inter, sans-serif',
        fontStyle: isUser ? 'normal' : 'italic',
        letterSpacing: isUser ? '0' : '0.01em',
      }}>
        {!isUser && isLatest && !isStreaming
          ? <TypewriterText text={content} />
          : content
        }
        {isStreaming && isLatest && (
          <span className="terminal-cursor" style={{ marginLeft: 2 }} />
        )}
      </div>
    </motion.div>
  );
}

// ── Briefing Panel ────────────────────────────────────────────────
function BriefingPanel({ text, loading, onRefresh }: {
  text: string | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(10,10,20,0.98) 100%)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top edge line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={13} color="#60a5fa" />
          <span style={{
            color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace',
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            Daily Tactical Briefing
          </span>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={{
            background: 'transparent', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            color: '#4a5568', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontFamily: 'Space Grotesk, monospace', opacity: loading ? 0.5 : 1,
          }}
        >
          <RotateCcw size={11} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
          <div style={{
            display: 'flex', gap: 4,
          }}>
            {[0, 0.15, 0.3].map((d, i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                transition={{ duration: 1, repeat: Infinity, delay: d }}
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#3b82f6', display: 'block',
                }}
              />
            ))}
          </div>
          <span style={{ color: '#4a5568', fontSize: 12, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.06em' }}>
            Generating tactical briefing...
          </span>
        </div>
      ) : (
        <p style={{
          color: 'rgba(240,244,255,0.8)', fontSize: 13, fontFamily: 'Inter, sans-serif',
          lineHeight: 1.7, fontStyle: 'italic', margin: 0,
        }}>
          {text || 'Briefing systems initializing...'}
        </p>
      )}
    </motion.div>
  );
}

// ── Status Header Bar ────────────────────────────────────────────
function IGRISStatusBar({ state, isStreaming }: { state: IGRISState; isStreaming: boolean }) {
  const cfg = STATE_CONFIG[state];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 24px',
      background: 'linear-gradient(90deg, rgba(59,130,246,0.06) 0%, transparent 100%)',
      borderBottom: '1px solid rgba(59,130,246,0.12)',
    }}>
      {/* Left: Avatar + identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <motion.div
            animate={{
              boxShadow: [
                `0 0 12px ${cfg.glowColor}`,
                `0 0 28px ${cfg.glowColor}`,
                `0 0 12px ${cfg.glowColor}`,
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: `radial-gradient(circle, ${cfg.color}22 0%, transparent 70%)`,
              border: `2px solid ${cfg.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Bot size={22} color={cfg.color} />
          </motion.div>
          {/* Pulse ring when analyzing */}
          {isStreaming && (
            <motion.div
              animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                position: 'absolute', inset: -5, borderRadius: '50%',
                border: `1px solid ${cfg.color}`,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 22,
            color: cfg.color, letterSpacing: '0.2em', textTransform: 'uppercase',
            textShadow: `0 0 20px ${cfg.glowColor}`,
            lineHeight: 1,
          }}>
            IGRIS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <motion.div
              animate={{ opacity: isStreaming ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 0.8, repeat: isStreaming ? Infinity : 0 }}
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: cfg.color, boxShadow: `0 0 6px ${cfg.color}`,
              }}
            />
            <span style={{
              color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace',
              letterSpacing: '0.05em',
            }}>
              {isStreaming ? 'Processing...' : cfg.label} · {cfg.description}
            </span>
          </div>
        </div>
      </div>

      {/* Right: State badge */}
      <div style={{
        padding: '6px 14px', borderRadius: 20,
        background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`,
        fontSize: 10, color: cfg.color,
        fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.12em', textTransform: 'uppercase',
      }}>
        {state.replace('_', ' ')}
      </div>
    </div>
  );
}

// ── Processing overlay (while streaming) ─────────────────────────
function ProcessingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div style={{ height: 2, background: '#0a0a12', overflow: 'hidden' }}>
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          height: '100%', width: '40%',
          background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
        }}
      />
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function IGRISPage() {
  const { player } = usePlayerStore();
  const { sessions } = useWorkoutStore();

  const {
    messages, isStreaming, igrisState, briefing, briefingLoading, error,
    sendMessage, fetchDailyBriefing, clearMessages, stopStreaming,
  } = useIGRISChat();

  const [input, setInput] = useState('');
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  const ctx = buildFullContext(player, sessions);
  const stateCfg = STATE_CONFIG[igrisState];

  // Fetch briefing on mount
  useEffect(() => {
    fetchDailyBriefing();
  }, []); // eslint-disable-line

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    setShowQuickPrompts(false);
    await sendMessage(text);
    inputRef.current?.focus();
  }, [input, isStreaming, sendMessage]);

  const handleQuickPrompt = useCallback(async (query: string) => {
    setShowQuickPrompts(false);
    setInput('');
    await sendMessage(query);
  }, [sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <PageWrapper>
      {/* ── PAGE HEADER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24 }}
      >
        <div style={{
          color: '#4a5568', fontSize: 10, fontFamily: 'Space Grotesk, monospace',
          letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 5,
        }}>
          AI Shadow Commander
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 32,
            color: stateCfg.color, letterSpacing: '0.18em', textTransform: 'uppercase',
            textShadow: `0 0 24px ${stateCfg.glowColor}`, lineHeight: 1,
          }}>
            IGRIS
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Hunter
              </div>
              <div style={{ color: '#f0f4ff', fontSize: 14, fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                {player.name} · Lv.{player.level}
              </div>
            </div>
            <div style={{
              padding: '6px 14px', borderRadius: 8,
              background: `${stateCfg.color}10`, border: `1px solid ${stateCfg.color}30`,
              fontSize: 12, color: stateCfg.color,
              fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.06em',
            }}>
              {ctx.streak}d streak
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── DAILY BRIEFING ──────────────────────────────────── */}
      <BriefingPanel
        text={briefing}
        loading={briefingLoading}
        onRefresh={() => fetchDailyBriefing(true)}
      />

      {/* ── MAIN CONSOLE ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Chat console */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'linear-gradient(135deg, #0a0a12 0%, #0d0d1a 100%)',
            border: `1px solid ${isStreaming ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.15)'}`,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: isStreaming ? '0 0 30px rgba(59,130,246,0.1)' : '0 0 20px rgba(0,0,0,0.4)',
            transition: 'border-color 400ms ease, box-shadow 400ms ease',
          }}
        >
          {/* Status header */}
          <IGRISStatusBar state={igrisState} isStreaming={isStreaming} />
          <ProcessingBar active={isStreaming} />

          {/* Message area */}
          <div
            ref={chatAreaRef}
            style={{
              height: 420,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              scrollBehavior: 'smooth',
            }}
          >
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{ textAlign: 'center', padding: '40px 20px' }}
              >
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                  style={{ fontSize: 34, marginBottom: 14, filter: 'drop-shadow(0 0 10px rgba(59,130,246,0.5))' }}
                >⚡</motion.div>
                <div style={{
                  color: 'rgba(240,244,255,0.55)', fontSize: 13, fontFamily: 'Inter, sans-serif',
                  fontStyle: 'italic', lineHeight: 1.8, marginBottom: 12,
                }}>
                  &ldquo;The shadows are ready. Your briefing is above.<br />
                  Transmit your inquiry, Hunter.&rdquo;
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                }}>
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }}
                  />
                  <span style={{ color: '#10b981', fontSize: 10, fontFamily: 'Space Grotesk, monospace', letterSpacing: '0.1em' }}>
                    GEMINI · LIVE
                  </span>
                </div>
              </motion.div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  content={msg.content}
                  role={msg.role}
                  isLatest={i === messages.length - 1}
                  isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    padding: '10px 14px', borderRadius: 8,
                    background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  }}
                >
                  <span style={{ color: '#ef4444', fontSize: 12, fontFamily: 'Space Grotesk, monospace' }}>
                    ⚠ {error}
                  </span>
                  <button
                    onClick={() => inputRef.current?.focus()}
                    style={{
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                      borderRadius: 6, padding: '3px 10px', color: '#ef4444',
                      fontSize: 10, fontFamily: 'Space Grotesk, monospace', cursor: 'pointer',
                      letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
                    }}
                  >
                    Retry
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          <AnimatePresence>
            {showQuickPrompts && messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  padding: '0 24px 16px',
                  borderTop: '1px solid rgba(26,26,46,0.8)',
                }}
              >
                <div style={{
                  color: '#2d2d50', fontSize: 9, fontFamily: 'Space Grotesk, monospace',
                  letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10, paddingTop: 14,
                }}>
                  Quick Transmissions
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {QUICK_PROMPTS.map(p => (
                    <motion.button
                      key={p.label}
                      onClick={() => handleQuickPrompt(p.query)}
                      disabled={isStreaming}
                      whileHover={{ scale: 1.02, borderColor: 'rgba(59,130,246,0.4)', color: '#93c5fd' }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a2e',
                        borderRadius: 20, padding: '5px 12px',
                        color: '#4a5568', fontSize: 12, fontFamily: 'Inter, sans-serif',
                        cursor: isStreaming ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: 5,
                        opacity: isStreaming ? 0.4 : 1,
                        transition: 'color 150ms ease',
                      }}
                    >
                      <span style={{ fontSize: 13 }}>{p.icon}</span> {p.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick prompt toggle when chat has messages */}
          {messages.length > 0 && (
            <div style={{ padding: '8px 24px 0', borderTop: '1px solid rgba(26,26,46,0.6)' }}>
              <button
                onClick={() => setShowQuickPrompts(v => !v)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: '#2d2d50', fontSize: 10, fontFamily: 'Space Grotesk, monospace',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <ChevronDown size={11} style={{ transform: showQuickPrompts ? 'rotate(180deg)' : 'none', transition: '200ms' }} />
                Quick Commands
              </button>
              <AnimatePresence>
                {showQuickPrompts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', paddingTop: 10 }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, paddingBottom: 12 }}>
                      {QUICK_PROMPTS.map(p => (
                        <motion.button
                          key={p.label}
                          onClick={() => handleQuickPrompt(p.query)}
                          disabled={isStreaming}
                          whileHover={{ scale: 1.02, color: '#93c5fd' }}
                          whileTap={{ scale: 0.97 }}
                          style={{
                            background: 'rgba(255,255,255,0.02)', border: '1px solid #1a1a2e',
                            borderRadius: 20, padding: '4px 11px',
                            color: '#4a5568', fontSize: 11, fontFamily: 'Inter, sans-serif',
                            cursor: isStreaming ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4,
                            opacity: isStreaming ? 0.4 : 1,
                          }}
                        >
                          <span style={{ fontSize: 12 }}>{p.icon}</span> {p.label}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Input area */}
          <div style={{
            borderTop: '1px solid rgba(59,130,246,0.1)',
            padding: '16px 20px',
            display: 'flex', gap: 10, alignItems: 'center',
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Transmit to IGRIS..."
              disabled={isStreaming}
              id="igris-console-input"
              autoComplete="off"
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid #1a1a2e',
                borderRadius: 10,
                padding: '12px 18px',
                color: '#f0f4ff',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 200ms ease, box-shadow 200ms ease',
                opacity: isStreaming ? 0.6 : 1,
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(59,130,246,0.4)';
                e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.1)';
              }}
              onBlur={e => {
                e.target.style.borderColor = '#1a1a2e';
                e.target.style.boxShadow = 'none';
              }}
            />

            {isStreaming ? (
              <motion.button
                onClick={stopStreaming}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}
              >
                <Square size={16} color="#ef4444" />
              </motion.button>
            ) : (
              <motion.button
                onClick={handleSend}
                disabled={!input.trim()}
                whileHover={{ scale: 1.06, boxShadow: '0 0 16px rgba(59,130,246,0.4)' }}
                whileTap={{ scale: 0.93 }}
                id="igris-send-btn"
                style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: input.trim() ? '#3b82f6' : '#1a1a2e',
                  border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  transition: 'background 200ms ease',
                  flexShrink: 0,
                  boxShadow: input.trim() ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                <Send size={16} color={input.trim() ? 'white' : '#4a5568'} />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* RIGHT: Context panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Hunter Status card */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="arise-card"
            style={{ padding: 20 }}
          >
            <div style={{
              color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace',
              letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14,
            }}>
              Hunter Status
            </div>

            {[
              { label: 'Level',       value: `${ctx.level}`, color: '#60a5fa' },
              { label: 'Rank',        value: ctx.rank,        color: '#a78bfa' },
              { label: 'Streak',      value: `${ctx.streak}d`, color: '#fb923c' },
              { label: 'Consistency', value: `${ctx.consistencyScore}%`, color: ctx.consistencyScore >= 60 ? '#10b981' : ctx.consistencyScore >= 30 ? '#f59e0b' : '#ef4444' },
              { label: 'Phase',       value: ctx.transformationPhase.split(' ')[0], color: '#8892b0' },
            ].map((row, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0',
                borderBottom: i < 4 ? '1px solid rgba(26,26,46,0.6)' : 'none',
              }}>
                <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
                  {row.label}
                </span>
                <span style={{ color: row.color, fontSize: 13, fontFamily: 'Space Grotesk, monospace', fontWeight: 700 }}>
                  {row.value}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Stats card */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="arise-card"
            style={{ padding: 20 }}
          >
            <div style={{
              color: '#4a5568', fontSize: 9, fontFamily: 'Space Grotesk, monospace',
              letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14,
            }}>
              Attributes
            </div>
            {Object.entries(ctx.stats).map(([k, v]) => {
              const COLORS: Record<string, string> = {
                STR: '#ef4444', AGI: '#10b981', END: '#3b82f6', VIT: '#a78bfa', INT: '#f59e0b',
              };
              const c = COLORS[k] || '#8892b0';
              const pct = Math.min(100, Math.round((v / 200) * 100));
              return (
                <div key={k} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: c, fontSize: 10, fontFamily: 'Space Grotesk, monospace', fontWeight: 700, letterSpacing: '0.08em' }}>{k}</span>
                    <span style={{ color: '#8892b0', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>{v}</span>
                  </div>
                  <div style={{ height: 3, background: '#1a1a2e', borderRadius: 2, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + Object.keys(ctx.stats).indexOf(k) * 0.08, duration: 0.7 }}
                      style={{ height: '100%', background: c, borderRadius: 2, boxShadow: `0 0 6px ${c}60` }}
                    />
                  </div>
                </div>
              );
            })}
          </motion.div>

          {/* Clear conversation */}
          {messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={clearMessages}
              whileHover={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
              style={{
                background: 'transparent',
                border: '1px solid #1a1a2e',
                borderRadius: 8,
                padding: '10px 16px',
                color: '#4a5568',
                fontFamily: 'Space Grotesk, monospace',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                transition: 'all 200ms ease',
              }}
            >
              <Shield size={11} /> Clear Session
            </motion.button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
