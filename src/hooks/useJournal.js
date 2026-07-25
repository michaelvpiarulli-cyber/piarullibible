import { useCallback, useEffect, useState } from 'react';

const KEY = 'bible-plan-journal';

export const ENTRY_KINDS = [
  { id: 'prayer', label: 'Prayer' },
  { id: 'praise', label: 'Praise' },
  { id: 'thought', label: 'Thought' },
];

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * Journal entries: prayers, praises, and reflections.
 *
 * An entry is { id, kind, text, day, createdAt, answeredAt }. Prayers can be
 * marked answered, which is the part people actually treasure looking back on.
 */
export function useJournal() {
  const [entries, setEntries] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(entries));
    } catch {
      /* quota — keep in memory */
    }
  }, [entries]);

  const addEntry = useCallback((kind, text, day) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setEntries((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        kind,
        text: trimmed,
        day,
        createdAt: new Date().toISOString(),
        answeredAt: null,
      },
      ...prev,
    ]);
  }, []);

  const updateEntry = useCallback((id, text) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, text: text.trim() } : e)).filter((e) => e.text)
    );
  }, []);

  const removeEntry = useCallback((id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleAnswered = useCallback((id) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, answeredAt: e.answeredAt ? null : new Date().toISOString() } : e
      )
    );
  }, []);

  return { entries, addEntry, updateEntry, removeEntry, toggleAnswered };
}
