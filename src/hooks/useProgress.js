import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

/** Thin view over the shared data store (localStorage + Supabase sync). */
export function useProgress() {
  const { progress, toggleProgress } = useData();

  const isDone = useCallback((id) => Boolean(progress[id]), [progress]);

  return { isDone, toggle: toggleProgress, doneCount: Object.keys(progress).length };
}
