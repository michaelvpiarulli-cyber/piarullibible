import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'bible-plan-progress';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function useProgress() {
  const [done, setDone] = useState(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  }, [done]);

  const isDone = useCallback((id) => Boolean(done[id]), [done]);

  const toggle = useCallback((id) => {
    setDone((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  }, []);

  const doneCount = Object.keys(done).length;

  return { isDone, toggle, doneCount };
}
