import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

/**
 * Per-reading quiz results. Stored in the shared data store under extras so
 * scores sync with the account the same way journal/memory do.
 */
export function useQuizzes() {
  const { quizzes, setQuizzes } = useData();

  const resultFor = useCallback((readingId) => quizzes?.[readingId] || null, [quizzes]);

  const saveResult = useCallback(
    (readingId, result) => {
      setQuizzes((prev) => ({
        ...(prev || {}),
        [readingId]: {
          score: result.score,
          total: result.total,
          passedAt: result.passedAt || new Date().toISOString(),
          label: result.label || null,
        },
      }));
    },
    [setQuizzes]
  );

  const clearResult = useCallback(
    (readingId) => {
      setQuizzes((prev) => {
        const next = { ...(prev || {}) };
        delete next[readingId];
        return next;
      });
    },
    [setQuizzes]
  );

  return { quizzes: quizzes || {}, resultFor, saveResult, clearResult };
}
