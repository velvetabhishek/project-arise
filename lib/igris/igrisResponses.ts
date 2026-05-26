// lib/igris/igrisResponses.ts
// IGRIS speaks in calm, commanding, minimal sentences.
// Never cheerful. Never weak. Always purposeful.

export const IGRIS_RESPONSES: Record<string, string[]> = {
  greeting: [
    'You have returned. The system awaits your command.',
    'Another day. Another opportunity to close the gap.',
    'I have been watching. You are not yet at your limit.',
    'The shadows gather. It is time to work.',
    'Rise, hunter. The gate will not wait for you.',
  ],

  greeting_by_time: {
    morning: [
      'Morning. The day belongs to those who begin it with purpose.',
      'The shadows wake before dawn. So must you.',
      'A new day. Begin before doubt has time to speak.',
      'Dawn. Your mission for today is already assigned.',
    ] as unknown as string[],
    afternoon: [
      'The afternoon grows heavy. Do not let it consume you.',
      'Half the day remains. It is enough.',
      'I see you have not yet trained today. Correct that.',
    ] as unknown as string[],
    evening: [
      'Evening. If you have not trained today, now is the time.',
      'The day fades. Do not let it take your workout with it.',
      'Train now. Rest comes after.',
    ] as unknown as string[],
    night: [
      'Late. Either you have already trained, or you are making an excuse.',
      'Night. Train if you must. Recover if you already have.',
      'The dark is not an obstacle. It is a condition.',
    ] as unknown as string[],
  } as unknown as string[],

  pre_workout: [
    'Today\'s mission is assigned. Begin when ready.',
    'The session awaits. Do not overthink. Start.',
    'Your body knows what to do. Trust the process.',
    'One hour. Full focus. No distractions.',
    'This workout will not complete itself. Move.',
    'Focus. The only thing that matters right now is the next rep.',
    'Sixty minutes. That is all the system asks of you today.',
  ],

  post_workout: [
    'Session complete. The system has recorded your progress.',
    'Done. You are stronger than you were one hour ago.',
    'Workout logged. Recovery begins now.',
    'Another session behind you. The gap closes.',
    'Completed. The shadows grow stronger with you.',
    'The work is done. Rest. Rebuild. Return tomorrow.',
  ],

  streak_warning: [
    'You have not trained in {days} day(s). This is noted.',
    '{days} days since your last session. Do not let the gap grow wider.',
    'Your streak is in danger. One session is all it takes to preserve it.',
    'The system does not forget missed days. Neither should you.',
  ],

  streak_danger: [
    'Two days. You are close to losing what you have built.',
    'The streak hangs by a thread. Train today or start over.',
    'I have seen hunters give up at exactly this point. Do not be one of them.',
  ],

  streak_milestone: [
    'Milestone reached. {streak} consecutive days. This is not luck. This is discipline.',
    '{streak} days without failure. The system acknowledges your consistency.',
    'You have maintained for {streak} days. Most cannot say the same.',
  ],

  level_up: [
    'Level {level}. The system has updated your records.',
    'You have advanced to Level {level}. The gap between you and your old self widens.',
    'Level {level} achieved. The shadows grow stronger.',
    'Rank advancement recorded. Level {level}. Continue.',
  ],

  rank_up: [
    'Your rank has changed. {rank}. The system recognizes your growth.',
    '{rank}. You have earned this. Do not stop here.',
    'New rank: {rank}. The hunters who watch you now see something different.',
    'Rank updated to {rank}. The gate opens wider.',
  ],

  recovery: [
    'Rest is not surrender. It is strategy.',
    'Recovery is part of the mission. Honor it.',
    'The body rebuilds in rest. Do not rob it of that process.',
    'One day of recovery will not undo your progress. Missing it might.',
    'Light movement today. Full training tomorrow. This is the way.',
    'I understand the fatigue. It will pass. You will not.',
  ],

  nutrition: [
    'The hostel food is what it is. Work with it, not against it.',
    'Minimize the oil. Maximize the protein. Fruits are your allies.',
    'You cannot outrun a poor diet. But you can manage it.',
    'Hydration. Fruits. Protein where available. This is your nutrition mission.',
    'Eat to recover. Not to comfort. There is a difference.',
    'The body you are building requires fuel. Choose it wisely.',
  ],

  motivation: [
    'Weakness is not permanent unless you allow it to be.',
    'The person you want to become is not waiting. You are.',
    'Every rep you skip, every meal you ruin — it compounds. So does every good decision.',
    'You started this. That already separates you from most.',
    'Sung Jinwoo did not level up by feeling ready. He leveled up by beginning.',
    'The system does not care about your mood. It only records your actions.',
    'Do not think about the full journey. Think about today\'s mission only.',
    'Pain is temporary. The physique you are building is permanent.',
  ],

  weekly_analysis: [
    'Your stats this week tell a story. Keep writing it.',
    'Progress is rarely linear. But it is always cumulative.',
    'One week of data is the beginning of a trend. Stay consistent.',
    'The numbers improve when the habits do. Focus on the habits.',
    'Your endurance metrics show movement. The breathing will follow.',
  ],

  achievement: [
    'Achievement unlocked. You earned it. Now forget it and move forward.',
    'The system has marked this milestone. It is recorded.',
    'Well done. Now raise the standard again.',
  ],

  general: [
    'What do you need, hunter?',
    'The system is watching. Ask your question.',
    'Speak. I will advise.',
    'Continue. The path forward is clear.',
    'Focus. What is the obstacle?',
    'The answer you need is often simpler than you think.',
    'One step at a time. That is how mountains are climbed.',
  ],
};
