'use client';
// components/dashboard/IGRISPanel.tsx — Real AI powered, compact dashboard widget
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useWorkoutStore } from '@/lib/store/useWorkoutStore';
import { buildFullContext, type IGRISState } from '@/lib/igris/contextBuilder';
import { getMemorySummaryForPrompt, loadMemory, incrementInteractions } from '@/lib/igris/memorySystem';
import { buildSystemPrompt } from '@/lib/igris/promptEngine';

const STATE_COLOR: Record<IGRISState, string> = {
  STANDBY:          '#10b981',
  ANALYZING:        '#3b82f6',
  ALERT:            '#ef4444',
  RECOVERY:         '#a78bfa',
  SHADOW_COMMANDER: '#f97316',
  NIGHT_WATCH:      '#60a5fa',
};

const STATE_LABEL: Record<IGRISState, string> = {
  STANDBY:          'Standby',
  ANALYZING:        'Analyzing',
  ALERT:            'Alert',
  RECOVERY:         'Recovery',
  SHADOW_COMMANDER: 'Commander',
  NIGHT_WATCH:      'Night Watch',
};

const QUICK_PROMPTS = [
  { label: "Today's mission", icon: '⚔️' },
  { label: "I'm tired",       icon: '😮‍💨' },
  { label: 'Motivate me',     icon: '🔥' },
  { label: 'Breathing tips',  icon: '🫁' },
  { label: 'My progress',     icon: '📈' },
];

function TypewriterText({ text, speed = 20 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const iv = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else { setDone(true); clearInterval(iv); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return <span>{displayed}{!done && <span className="terminal-cursor" />}</span>;
}

interface CompactMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  isStreaming?: boolean;
}

function genId() {
  return `cm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function IGRISPanel() {
  const { player } = usePlayerStore();
  const { sessions } = useWorkoutStore();

  const [messages, setMessages] = useState<CompactMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [igrisState, setIgrisState] = useState<IGRISState>('STANDBY');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Derive state on mount
  useEffect(() => {
    const ctx = buildFullContext(player, sessions);
    setIgrisState(ctx.igrisState);
  }, [player, sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const ctx = buildFullContext(player, sessions);
    setIgrisState('ANALYZING');

    const userMsg: CompactMessage = { id: genId(), content: trimmed, isFromUser: true };
    const assistantId = genId();
    const assistantMsg: CompactMessage = { id: assistantId, content: '', isFromUser: false, isStreaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setInput('');

    const history = messages
      .filter(m => !m.isStreaming && m.content.trim())
      .slice(-6)
      .map(m => ({ role: (m.isFromUser ? 'user' : 'assistant') as 'user' | 'assistant', content: m.content }));

    const memory = loadMemory();
    const memoryNote = getMemorySummaryForPrompt(memory);

    try {
      const abort = new AbortController();
      abortRef.current = abort;

      const res = await fetch('/api/igris/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context: ctx, history, memoryNote }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) throw new Error(`API ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;
          const data = trimmedLine.slice(6).trim();
          if (data === '[DONE]') {
            setMessages(prev => prev.map(m =>
              m.id === assistantId && m.isStreaming
                ? { ...m, content: accumulated || 'Signal lost.', isStreaming: false }
                : m
            ));
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              accumulated += delta;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulated, isStreaming: true } : m
              ));
            }
          } catch { /* malformed chunk */ }
        }
      }

      // Finalize if [DONE] was not received
      setMessages(prev => prev.map(m =>
        m.id === assistantId && m.isStreaming
          ? { ...m, content: accumulated || 'Signal lost.', isStreaming: false }
          : m
      ));
      if (accumulated) incrementInteractions();
      setIgrisState(ctx.igrisState);
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return;
      const fallbacks = [
        'Connection to shadow layer disrupted. Your training continues regardless.',
        'Signal interference. The directive is simple: train today.',
        'The link is unstable. Trust your last briefing, Hunter.',
      ];
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: fallbacks[Math.floor(Math.random() * fallbacks.length)], isStreaming: false }
          : m
      ));
      setIgrisState(ctx.igrisState);
    } finally {
      setIsStreaming(false);
    }
  }, [player, sessions, messages, isStreaming]);

  const stateColor = STATE_COLOR[igrisState];
  const recentMessages = messages.slice(-8);

  return (
    <motion.div
      id="igris-panel"
      className="igris-panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
    >
      {/* Header */}
      <div className="igris-panel-header">
        <div style={{ position: 'relative' }}>
          <motion.div
            className="igris-avatar"
            animate={{ boxShadow: [`0 0 12px ${stateColor}50`, `0 0 24px ${stateColor}80`, `0 0 12px ${stateColor}50`] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{ border: `1.5px solid ${stateColor}50` }}
          >
            <Bot size={22} color={stateColor} />
          </motion.div>
          {isStreaming && (
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                border: `1px solid ${stateColor}`, pointerEvents: 'none',
              }}
            />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 17,
            color: stateColor, letterSpacing: '0.15em', textTransform: 'uppercase',
            textShadow: `0 0 14px ${stateColor}80`,
          }}>
            IGRIS
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <motion.div
              className="igris-status-dot"
              animate={{ opacity: isStreaming ? [1, 0.3, 1] : 1 }}
              transition={{ duration: 0.8, repeat: isStreaming ? Infinity : 0 }}
              style={{ background: stateColor, boxShadow: `0 0 8px ${stateColor}` }}
            />
            <span style={{ color: '#4a5568', fontSize: 11, fontFamily: 'Space Grotesk, monospace' }}>
              {isStreaming ? 'Processing...' : STATE_LABEL[igrisState]} · AI Active
            </span>
          </div>
        </div>

        {/* Open full console */}
        <Link href="/igris" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ color: stateColor }}
            style={{ color: '#2d2d50', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          >
            <ExternalLink size={13} />
          </motion.div>
        </Link>
      </div>

      {/* Processing bar */}
      <AnimatePresence>
        {isStreaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ height: 2, background: '#0a0a12', overflow: 'hidden' }}>
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ height: '100%', width: '40%', background: `linear-gradient(90deg, transparent, ${stateColor}, transparent)` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div
        className="igris-message-area"
        style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {recentMessages.length === 0 && (
          <div style={{
            color: '#4a5568', fontSize: 12, fontStyle: 'italic', textAlign: 'center',
            padding: '20px 0', fontFamily: 'Inter, sans-serif',
          }}>
            <span className="terminal-cursor" />&nbsp;Awaiting transmission...
          </div>
        )}
        <AnimatePresence initial={false}>
          {recentMessages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6, x: msg.isFromUser ? 4 : -4 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'flex', justifyContent: msg.isFromUser ? 'flex-end' : 'flex-start' }}
            >
              {!msg.isFromUser && (
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, flexShrink: 0, alignSelf: 'flex-end', marginRight: 8, marginBottom: 2,
                }}>⚡</div>
              )}
              <div style={{
                maxWidth: '82%', padding: '9px 13px',
                borderRadius: msg.isFromUser ? '11px 11px 3px 11px' : '11px 11px 11px 3px',
                background: msg.isFromUser ? 'rgba(59,130,246,0.14)' : 'rgba(15,15,26,0.95)',
                border: msg.isFromUser ? '1px solid rgba(59,130,246,0.22)' : '1px solid rgba(45,45,80,0.8)',
                fontSize: 13, lineHeight: 1.55,
                color: msg.isFromUser ? '#e2e8ff' : 'rgba(240,244,255,0.85)',
                fontFamily: 'Inter, sans-serif',
                fontStyle: msg.isFromUser ? 'normal' : 'italic',
              }}>
                {!msg.isFromUser && i === recentMessages.length - 1 && !isStreaming
                  ? <TypewriterText text={msg.content} />
                  : msg.content
                }
                {msg.isStreaming && i === recentMessages.length - 1 && (
                  <span className="terminal-cursor" style={{ marginLeft: 2 }} />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div style={{ padding: '0 24px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        {QUICK_PROMPTS.map(p => (
          <button
            key={p.label}
            onClick={() => sendMessage(p.label)}
            disabled={isStreaming}
            style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid #1a1a2e',
              borderRadius: 20, padding: '4px 11px', color: '#4a5568',
              fontSize: 11, fontFamily: 'Inter, sans-serif',
              cursor: isStreaming ? 'not-allowed' : 'pointer',
              opacity: isStreaming ? 0.4 : 1, transition: 'all 160ms ease',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            onMouseEnter={e => { if (!isStreaming) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.35)'; (e.currentTarget as HTMLButtonElement).style.color = '#93c5fd'; } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a1a2e'; (e.currentTarget as HTMLButtonElement).style.color = '#4a5568'; }}
          >
            <span style={{ fontSize: 12 }}>{p.icon}</span> {p.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="igris-input-area">
        <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} style={{ display: 'flex', gap: 10, flex: 1 }}>
          <input
            className="igris-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Speak to IGRIS..."
            autoComplete="off"
            id="igris-dashboard-input"
            disabled={isStreaming}
            style={{ opacity: isStreaming ? 0.6 : 1 }}
          />
          <motion.button
            type="submit"
            className="igris-send-btn"
            disabled={!input.trim() || isStreaming}
            id="igris-send-btn"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
            aria-label="Send message"
          >
            <Send size={15} color="white" />
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
