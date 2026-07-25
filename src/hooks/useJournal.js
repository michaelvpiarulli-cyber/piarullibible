import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

export const ENTRY_KINDS = [
  { id: 'prayer', label: 'Prayer' },
  { id: 'praise', label: 'Praise' },
  { id: 'thought', label: 'Thought' },
];

/**
 * Prayers, praises, and reflections. State lives in the shared data store, so
 * entries persist to the account and follow you across devices.
 *
 * An entry is { id, kind, text, day, createdAt, answeredAt }. Prayers can be
 * marked answered, which is the part people actually treasure looking back on.
 */
export function useJournal() {
  const { journal, setJournal } = useData();

  const addEntry = useCallback(
    (kind, text, day) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setJournal((prev) => [
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
    },
    [setJournal]
  );

  const updateEntry = useCallback(
    (id, text) => {
      setJournal((prev) =>
        prev.map((e) => (e.id === id ? { ...e, text: text.trim() } : e)).filter((e) => e.text)
      );
    },
    [setJournal]
  );

  const removeEntry = useCallback(
    (id) => setJournal((prev) => prev.filter((e) => e.id !== id)),
    [setJournal]
  );

  const toggleAnswered = useCallback(
    (id) => {
      setJournal((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, answeredAt: e.answeredAt ? null : new Date().toISOString() } : e
        )
      );
    },
    [setJournal]
  );

  return { entries: journal, addEntry, updateEntry, removeEntry, toggleAnswered };
}
