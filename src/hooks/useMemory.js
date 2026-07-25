import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

/**
 * Spaced repetition. Each correct review promotes a verse a level and pushes
 * the next review further out; a miss knocks it back a level. Levels double as
 * the game's ranks.
 *
 * State lives in the shared data store, so verses persist to the account.
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

export function useMemory() {
  const { memory, setMemory } = useData();
  const verses = memory.verses || [];

  const addVerse = useCallback(
    (ref, text) => {
      setMemory((s) => {
        const list = s.verses || [];
        if (list.some((v) => v.ref === ref)) return s; // no duplicates
        return {
          ...s,
          verses: [
            ...list,
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
    },
    [setMemory]
  );

  const removeVerse = useCallback(
    (ref) => setMemory((s) => ({ ...s, verses: (s.verses || []).filter((v) => v.ref !== ref) })),
    [setMemory]
  );

  /** Grade a review. Correct promotes and schedules further out; a miss demotes. */
  const review = useCallback(
    (ref, correct) => {
      setMemory((s) => {
        const today = todayKey();
        const rolled = s.reviewedOn === today;
        return {
          ...s,
          reviewedOn: today,
          dailyCount: (rolled ? s.dailyCount || 0 : 0) + 1,
          verses: (s.verses || []).map((v) => {
            if (v.ref !== ref) return v;
            const level = correct ? Math.min(v.level + 1, MAX_LEVEL) : Math.max(v.level - 1, 0);
            return {
              ...v,
              level,
              reviews: (v.reviews || 0) + 1,
              correct: (v.correct || 0) + (correct ? 1 : 0),
              streak: correct ? (v.streak || 0) + 1 : 0,
              dueAt: Date.now() + LEVELS[level].days * MS_PER_DAY,
            };
          }),
        };
      });
    },
    [setMemory]
  );

  const now = Date.now();
  const due = verses.filter((v) => v.dueAt <= now);
  const mastered = verses.filter((v) => v.level >= MAX_LEVEL).length;

  // Points reward progress, not just volume: deeper levels are worth more.
  const points = verses.reduce((sum, v) => sum + v.level * 10 + (v.correct || 0) * 2, 0);

  return {
    verses,
    due,
    mastered,
    points,
    dailyCount: memory.reviewedOn === todayKey() ? memory.dailyCount || 0 : 0,
    addVerse,
    removeVerse,
    review,
  };
}
