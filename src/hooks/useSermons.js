import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

/**
 * Sermon notes. Stored in the shared data store so they sync to the account.
 *
 * A sermon is { id, title, speaker, date, passage, notes, takeaway, createdAt }.
 * Only `notes` is really required — everything else is optional so jotting
 * something down mid-service is never blocked by empty fields.
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
          notes: '',
          takeaway: '',
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

  const removeSermon = useCallback(
    (id) => setSermons((prev) => prev.filter((s) => s.id !== id)),
    [setSermons]
  );

  return { sermons, addSermon, updateSermon, removeSermon };
}
