import { useCallback, useEffect, useState } from 'react';

const KEY = 'bible-plan-memory';

/**
 * Spaced repetition. Each correct review promotes a verse a level and pushes
 * the next review further out; a miss knocks it back a level. Levels double as
 * the game's ranks.
 */
export const LEVELS = [
  { level: 0, name: 'New', days: 0 },
  { level: 1, name: 'Learning', days: 1 },
  { level: 2, name: 'Familiar', days: 3 },
  { level: 3, name: 'Solid', days: 7 },
  { level: 4, name: 'Strong', days: 16 },
  { level: 5, name: 'Mastered', days: 35 },
];

export const MAX_LEVEL = LEVELS.length - 1;

const MS_PER_DAY = 86400000;
const todayKey = () => new Date().toISOString().slice(0, 10);

function load() {
  try {
    return (
      JSON.parse(localStorage.getItem(KEY)) || { verses: [], reviewedOn: null, dailyCount: 0 }
    );
  } catch {
    return { verses: [], reviewedOn: null, dailyCount: 0 };
  }
}

export function useMemory() {
  const [state, setState] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota */
    }
  }, [state]);

  const addVerse = useCallback((ref, text) => {
    setState((s) => {
      if (s.verses.some((v) => v.ref === ref)) return s; // no duplicates
      return {
        ...s,
        verses: [
          ...s.verses,
          {
            ref,
            text,
            level: 0,
            dueAt: Date.now(),
            addedAt: Date.now(),
            reviews: 0,
            correct: 0,
            streak: 0,
          },
        ],
      };
    });
  }, []);

  const removeVerse = useCallback((ref) => {
    setState((s) => ({ ...s, verses: s.verses.filter((v) => v.ref !== ref) }));
  }, []);

  /** Grade a review. Correct promotes and schedules further out; a miss demotes. */
  const review = useCallback((ref, correct) => {
    setState((s) => {
      const today = todayKey();
      const rolled = s.reviewedOn === today;
      return {
        ...s,
        reviewedOn: today,
        dailyCount: (rolled ? s.dailyCount : 0) + 1,
        verses: s.verses.map((v) => {
          if (v.ref !== ref) return v;
          const level = correct ? Math.min(v.level + 1, MAX_LEVEL) : Math.max(v.level - 1, 0);
          return {
            ...v,
            level,
            reviews: v.reviews + 1,
            correct: v.correct + (correct ? 1 : 0),
            streak: correct ? v.streak + 1 : 0,
            dueAt: Date.now() + LEVELS[level].days * MS_PER_DAY,
          };
        }),
      };
    });
  }, []);

  const now = Date.now();
  const due = state.verses.filter((v) => v.dueAt <= now);
  const mastered = state.verses.filter((v) => v.level >= MAX_LEVEL).length;

  // Points reward progress, not just volume: deeper levels are worth more.
  const points = state.verses.reduce((sum, v) => sum + v.level * 10 + v.correct * 2, 0);

  return {
    verses: state.verses,
    due,
    mastered,
    points,
    dailyCount: state.reviewedOn === todayKey() ? state.dailyCount : 0,
    addVerse,
    removeVerse,
    review,
  };
}
