'use client';
// lib/igris/useIGRISChat.ts
// Client hook for IGRIS AI chat — Gemini backend via SSE
// Handles streaming, abort, memory, context, error states

import { useState, useCallback, useRef } from 'react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useWorkoutStore } from '@/lib/store/useWorkoutStore';
import { buildFullContext, type IGRISState } from './contextBuilder';
import {
  loadMemory,
  getMemorySummaryForPrompt,
  incrementInteractions,
  setBriefing,
  shouldRegenerateBriefing,
} from './memorySystem';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

function genId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useIGRISChat() {
  const { player } = usePlayerStore();
  const { sessions } = useWorkoutStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [igrisState, setIgrisState] = useState<IGRISState>('STANDBY');
  const [briefing, setBriefingText] = useState<string | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const getContext = useCallback(() => {
    const ctx = buildFullContext(player, sessions);
    setIgrisState(ctx.igrisState);
    return ctx;
  }, [player, sessions]);

  const getHistory = useCallback((msgs: ChatMessage[]) => {
    return msgs
      .filter(m => !m.isStreaming && m.content.trim())
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content }));
  }, []);

  const sendMessage = useCallback(async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isStreaming) return;

    setError(null);
    const ctx = getContext();

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const assistantId = genId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setIgrisState('ANALYZING');

    const history = getHistory(messages);
    const memory = loadMemory();
    const memoryNote = getMemorySummaryForPrompt(memory);

    try {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const response = await fetch('/api/igris/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, context: ctx, history, memoryNote }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API ${response.status}: ${errText}`);
      }

      if (!response.body) {
        throw new Error('No response body from server');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      // Read SSE stream
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;

          const data = trimmedLine.slice(6).trim();
          if (data === '[DONE]') {
            // Stream finished — mark complete
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: accumulated || 'Signal unclear. Resend your message.', isStreaming: false }
                  : m
              )
            );
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) {
              accumulated += delta;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantId
                    ? { ...m, content: accumulated, isStreaming: true }
                    : m
                )
              );
            }
          } catch {
            // Malformed JSON chunk — skip silently
          }
        }
      }

      // Ensure message is finalized even if [DONE] was missed
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId && m.isStreaming
            ? { ...m, content: accumulated || 'Transmission incomplete. Retry.', isStreaming: false }
            : m
        )
      );

      if (accumulated) {
        incrementInteractions();
      }
      setIgrisState(ctx.igrisState);

    } catch (err: unknown) {
      const error = err as Error;
      if (error?.name === 'AbortError') {
        // User cancelled — finalize with what we have
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          )
        );
        return;
      }

      console.error('[IGRIS Chat]', error?.message || err);
      setError('IGRIS core link disrupted. Retry your transmission.');
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? {
                ...m,
                content: 'The shadow connection was severed. Stand by and retry.',
                isStreaming: false,
              }
            : m
        )
      );
      setIgrisState(ctx.igrisState);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, messages, getContext, getHistory]);

  const fetchDailyBriefing = useCallback(async (force = false) => {
    const memory = loadMemory();
    if (!force && !shouldRegenerateBriefing(memory)) {
      setBriefingText(memory.lastBriefingText);
      return;
    }

    setBriefingLoading(true);
    setError(null);
    try {
      const ctx = getContext();
      const res = await fetch('/api/igris/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx),
      });

      if (!res.ok) throw new Error(`Briefing API ${res.status}`);

      const data = await res.json();
      const text = data.briefing || 'Stand by for tactical briefing.';
      setBriefingText(text);
      setBriefing(text);
    } catch (err) {
      console.error('[IGRIS Briefing]', err);
      setBriefingText('Briefing systems initializing. Proceed with last known mission parameters.');
    } finally {
      setBriefingLoading(false);
    }
  }, [getContext]);

  const clearMessages = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([]);
    setError(null);
    setIgrisState('STANDBY');
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setIsStreaming(false);
    // Finalize any in-progress message
    setMessages(prev =>
      prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m)
    );
    setIgrisState(buildFullContext(player, sessions).igrisState);
  }, [player, sessions]);

  return {
    messages,
    isStreaming,
    igrisState,
    briefing,
    briefingLoading,
    error,
    sendMessage,
    fetchDailyBriefing,
    clearMessages,
    stopStreaming,
  };
}
