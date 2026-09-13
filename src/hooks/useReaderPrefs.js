import { useCallback, useEffect, useMemo, useState } from 'react';

const KEY = 'bible-plan-reader-prefs';

/** Free English Bibles available as the primary reader text. */
export const READER_TRANSLATIONS = [
  { id: 'ENGWEBP', label: 'WEB', name: 'World English Bible' },
  { id: 'BSB', label: 'BSB', name: 'Berean Standard Bible' },
  { id: 'eng_kjv', label: 'KJV', name: 'King James Version' },
  { id: 'eng_asv', label: 'ASV', name: 'American Standard Version' },
];

const SIZE_STEPS = [0.95, 1.05, 1.125, 1.25, 1.4];
const DEFAULT = { translationId: 'ENGWEBP', fontSize: 1.125 };

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { ...DEFAULT };
    const translationId = READER_TRANSLATIONS.some((t) => t.id === raw.translationId)
      ? raw.translationId
      : DEFAULT.translationId;
    const fontSize = SIZE_STEPS.includes(Number(raw.fontSize))
      ? Number(raw.fontSize)
      : DEFAULT.fontSize;
    return { translationId, fontSize };
  } catch {
    return { ...DEFAULT };
  }
}

function applyFontSize(size) {
  document.documentElement.style.setProperty('--reader-size', `${size}rem`);
}

/**
 * Local reading comfort prefs — translation + scripture font size.
 * Kept out of DataProvider so they stay device-local and instant.
 */
export function useReaderPrefs() {
  const [prefs, setPrefs] = useState(load);

  useEffect(() => {
    applyFontSize(prefs.fontSize);
    localStorage.setItem(KEY, JSON.stringify(prefs));
  }, [prefs]);

  const setTranslationId = useCallback((translationId) => {
    if (!READER_TRANSLATIONS.some((t) => t.id === translationId)) return;
    setPrefs((p) => ({ ...p, translationId }));
  }, []);

  const bumpFont = useCallback((dir) => {
    setPrefs((p) => {
      const i = SIZE_STEPS.indexOf(p.fontSize);
      const next = SIZE_STEPS[Math.min(SIZE_STEPS.length - 1, Math.max(0, (i < 0 ? 2 : i) + dir))];
      return { ...p, fontSize: next };
    });
  }, []);

  const translation = useMemo(
    () => READER_TRANSLATIONS.find((t) => t.id === prefs.translationId) || READER_TRANSLATIONS[0],
    [prefs.translationId]
  );

  return {
    translationId: prefs.translationId,
    translationLabel: translation.label,
    translationName: translation.name,
    fontSize: prefs.fontSize,
    canShrink: prefs.fontSize > SIZE_STEPS[0],
    canGrow: prefs.fontSize < SIZE_STEPS[SIZE_STEPS.length - 1],
    setTranslationId,
    bumpFont,
  };
}
