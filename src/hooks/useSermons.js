import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

/**
 * Sermon notes. Stored in the shared data store so they sync to the account.
 *
 * A sermon is {
 *   id, title, speaker, date, passage, series, church, tags[],
 *   notes, takeaway, ink[], starred, createdAt
 * }.
 * Only some text or ink is required — empty fields never block a quick jot.
 */
export function useSermons() {
  const { sermons, setSermons } = useData();

  const addSermon = useCallback(
    (fields) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setSermons((prev) => [
        {
          id,
          title: '',
          speaker: '',
          passage: '',
          series: '',
          church: '',
          tags: [],
          notes: '',
          takeaway: '',
          ink: [],
          starred: false,
          date: new Date().toISOString().slice(0, 10),
          createdAt: new Date().toISOString(),
          ...fields,
        },
        ...prev,
      ]);
      return id;
    },
    [setSermons]
  );

  const updateSermon = useCallback(
    (id, fields) => {
      setSermons((prev) => prev.map((s) => (s.id === id ? { ...s, ...fields } : s)));
    },
    [setSermons]
  );

  const toggleStar = useCallback(
    (id) => {
      setSermons((prev) =>
        prev.map((s) => (s.id === id ? { ...s, starred: !s.starred } : s))
      );
    },
    [setSermons]
  );

  const removeSermon = useCallback(
    (id) => setSermons((prev) => prev.filter((s) => s.id !== id)),
    [setSermons]
  );

  return { sermons, addSermon, updateSermon, toggleStar, removeSermon };
}
