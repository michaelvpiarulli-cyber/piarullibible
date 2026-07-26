import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

/** Thin view over the shared data store (localStorage + Supabase sync). */
export function useProgress() {
  const { progress, toggleProgress } = useData();

  const isDone = useCallback((id) => Boolean(progress[id]), [progress]);

  // Reading ids look like "d12-t3". Anything underscore-prefixed is reserved
  // bookkeeping (see EXTRAS_KEY) and must never count as a completed reading.
  const doneCount = Object.keys(progress).filter((k) => !k.startsWith('__')).length;

  return { isDone, toggle: toggleProgress, doneCount };
}
