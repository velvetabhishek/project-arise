// lib/store/useIGRISStore.ts — Enhanced with AI state support
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IGRISMessageType } from '@/types/igris';
import type { IGRISState } from '@/lib/igris/contextBuilder';

export interface IGRISMessage {
  id: string;
  type: IGRISMessageType;
  content: string;
  timestamp: string;
  isFromUser: boolean;
}

interface IGRISStore {
  messages: IGRISMessage[];
  isTyping: boolean;
  igrisState: IGRISState;
  totalInteractions: number;
  lastMessageTime: string | null;
  // Actions
  addMessage: (content: string, type: IGRISMessageType, isFromUser?: boolean) => void;
  setTyping: (typing: boolean) => void;
  setIGRISState: (state: IGRISState) => void;
  clearMessages: () => void;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useIGRISStore = create<IGRISStore>()(
  persist(
    (set) => ({
      messages: [],
      isTyping: false,
      igrisState: 'STANDBY',
      totalInteractions: 0,
      lastMessageTime: null,

      addMessage: (content, type, isFromUser = false) =>
        set((state) => {
          const newMessage: IGRISMessage = {
            id: generateId(),
            type,
            content,
            timestamp: new Date().toISOString(),
            isFromUser,
          };
          return {
            messages: [...state.messages, newMessage].slice(-100),
            totalInteractions: isFromUser ? state.totalInteractions + 1 : state.totalInteractions,
            lastMessageTime: new Date().toISOString(),
          };
        }),

      setTyping: (typing) => set({ isTyping: typing }),
      setIGRISState: (igrisState) => set({ igrisState }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'arise-igris-store',
      version: 2,
    }
  )
);
