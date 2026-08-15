import { useCallback, useEffect, useState } from 'react';

const KEY = 'bible-plan-reader-prefs';
const MIN = 15;
const MAX = 28;
const DEFAULT = 18;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    const fontSize = Number(raw.fontSize);
    return {
      fontSize: Number.isFinite(fontSize)
        ? Math.min(MAX, Math.max(MIN, Math.round(fontSize)))
        : DEFAULT,
    };
  } catch {
    return { fontSize: DEFAULT };
  }
}

/** Persisted reading preferences (font size) shared across Read + Today. */
export function useReaderPrefs() {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* ignore */
    }
    document.documentElement.style.setProperty('--reader-size', `${prefs.fontSize}px`);
    document.documentElement.style.setProperty('--reader-lh', `${Math.round(prefs.fontSize * 1.85)}px`);
  }, [prefs]);

  const bumpFont = useCallback((delta) => {
    setPrefs((p) => ({
      ...p,
      fontSize: Math.min(MAX, Math.max(MIN, p.fontSize + delta)),
    }));
  }, []);

  return {
    fontSize: prefs.fontSize,
    canShrink: prefs.fontSize > MIN,
    canGrow: prefs.fontSize < MAX,
    bumpFont,
  };
}
