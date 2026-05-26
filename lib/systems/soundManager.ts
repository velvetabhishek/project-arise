// lib/systems/soundManager.ts
// Audio-ready infrastructure — centralized sound event system
// NO actual audio files yet. This is the hook/event architecture.
// When audio is added: implement playSound() using Web Audio API or HTMLAudio.

export type SoundEvent =
  | 'level_up'
  | 'rank_up'
  | 'achievement_unlock'
  | 'mission_complete'
  | 'ai_response'
  | 'hydration_success'
  | 'streak_milestone'
  | 'xp_gain'
  | 'button_click'
  | 'notification'
  | 'error'
  | 'daily_reward';

export type SoundCategory = 'ui' | 'progression' | 'ambient' | 'achievement';

interface SoundConfig {
  event: SoundEvent;
  category: SoundCategory;
  priority: number;     // 1-10 (10 = never interrupt)
  description: string;  // What this sound should feel like
  placeholder: string;  // Sound file path placeholder for future
}

// ─── Sound Catalog ────────────────────────────────────────────────────────────
const SOUND_CATALOG: SoundConfig[] = [
  {
    event: 'level_up',
    category: 'progression',
    priority: 10,
    description: 'Epic ascending chime — Solo Leveling system notification style',
    placeholder: '/sounds/level_up.mp3',
  },
  {
    event: 'rank_up',
    category: 'progression',
    priority: 10,
    description: 'Deep dramatic bass hit + reverb tail — major milestone',
    placeholder: '/sounds/rank_up.mp3',
  },
  {
    event: 'achievement_unlock',
    category: 'achievement',
    priority: 9,
    description: 'Satisfying crystalline chime with subtle echo',
    placeholder: '/sounds/achievement.mp3',
  },
  {
    event: 'mission_complete',
    category: 'progression',
    priority: 8,
    description: 'Clean completion tone — positive resolution',
    placeholder: '/sounds/mission_complete.mp3',
  },
  {
    event: 'ai_response',
    category: 'ui',
    priority: 3,
    description: 'Subtle digital blip — IGRIS speaking',
    placeholder: '/sounds/igris_ping.mp3',
  },
  {
    event: 'hydration_success',
    category: 'ui',
    priority: 4,
    description: 'Soft water ripple sound — gentle and rewarding',
    placeholder: '/sounds/hydration.mp3',
  },
  {
    event: 'streak_milestone',
    category: 'achievement',
    priority: 7,
    description: 'Rising tone with warmth — encouragement',
    placeholder: '/sounds/streak.mp3',
  },
  {
    event: 'xp_gain',
    category: 'ui',
    priority: 2,
    description: 'Tiny positive tick — subtle reinforcement',
    placeholder: '/sounds/xp_tick.mp3',
  },
  {
    event: 'button_click',
    category: 'ui',
    priority: 1,
    description: 'Crisp HUD click — tactical UI feedback',
    placeholder: '/sounds/click.mp3',
  },
  {
    event: 'notification',
    category: 'ui',
    priority: 5,
    description: 'System notification ping',
    placeholder: '/sounds/notify.mp3',
  },
  {
    event: 'daily_reward',
    category: 'achievement',
    priority: 6,
    description: 'Daily login reward fanfare — brief and satisfying',
    placeholder: '/sounds/daily_reward.mp3',
  },
  {
    event: 'error',
    category: 'ui',
    priority: 4,
    description: 'Subtle error buzz — non-jarring',
    placeholder: '/sounds/error.mp3',
  },
];

// ─── Sound State ──────────────────────────────────────────────────────────────
let soundEnabled = true;
let volume = 0.7;

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('arise-sound-enabled', String(enabled));
  }
}

export function setSoundVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
}

export function isSoundEnabled(): boolean {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('arise-sound-enabled');
    if (stored !== null) return stored === 'true';
  }
  return soundEnabled;
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
type SoundListener = (event: SoundEvent) => void;
const listeners: Set<SoundListener> = new Set();

export function onSoundEvent(listener: SoundListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ─── Main Trigger Function ────────────────────────────────────────────────────
// Currently logs and notifies listeners.
// TODO: When audio files are added, implement actual playback here.
export function playSound(event: SoundEvent): void {
  if (!isSoundEnabled()) return;

  // Notify all listeners (for future Web Audio API integration)
  listeners.forEach(listener => {
    try { listener(event); } catch { /* ignore */ }
  });

  // Future implementation hook:
  // const config = SOUND_CATALOG.find(c => c.event === event);
  // if (config) { const audio = new Audio(config.placeholder); audio.volume = volume; audio.play().catch(() => {}); }
}

// ─── Convenience Triggers ─────────────────────────────────────────────────────
export const sounds = {
  levelUp:           () => playSound('level_up'),
  rankUp:            () => playSound('rank_up'),
  achievementUnlock: () => playSound('achievement_unlock'),
  missionComplete:   () => playSound('mission_complete'),
  aiResponse:        () => playSound('ai_response'),
  hydrationSuccess:  () => playSound('hydration_success'),
  streakMilestone:   () => playSound('streak_milestone'),
  xpGain:            () => playSound('xp_gain'),
  buttonClick:       () => playSound('button_click'),
  notification:      () => playSound('notification'),
  dailyReward:       () => playSound('daily_reward'),
  error:             () => playSound('error'),
} as const;

// ─── React hook ───────────────────────────────────────────────────────────────
// Import this in components to get typed sound triggers
export function useSounds() {
  return sounds;
}

// Export catalog for dev/debug inspection
export { SOUND_CATALOG };
