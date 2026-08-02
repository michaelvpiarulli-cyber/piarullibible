import { useCallback } from 'react';
import { useData } from '../context/DataProvider';

/**
 * Sermon notes + folders. Stored in the shared data store so they sync.
 *
 * A sermon is {
 *   id, title, speaker, date, passage, series, church, tags[], folderId,
 *   notes, takeaway, ink[], inkPages, starred, sourceUrl, createdAt
 * }.
 * A folder is { id, name, createdAt }.
 */
export function useSermons() {
  const { sermons, setSermons, sermonFolders, setSermonFolders } = useData();

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
          folderId: '',
          notes: '',
          takeaway: '',
          ink: [],
          inkPages: 1,
          starred: false,
          sourceUrl: '',
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

  const addFolder = useCallback(
    (name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return null;
      const existing = sermonFolders.find(
        (f) => f.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) return existing.id;

      const id = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setSermonFolders((prev) =>
        [...prev, { id, name: trimmed, createdAt: new Date().toISOString() }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      return id;
    },
    [sermonFolders, setSermonFolders]
  );

  const renameFolder = useCallback(
    (id, name) => {
      const trimmed = (name || '').trim();
      if (!trimmed) return;
      setSermonFolders((prev) =>
        prev
          .map((f) => (f.id === id ? { ...f, name: trimmed } : f))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    },
    [setSermonFolders]
  );

  const removeFolder = useCallback(
    (id) => {
      setSermonFolders((prev) => prev.filter((f) => f.id !== id));
      // Sermons stay; they just become unfiled.
      setSermons((prev) =>
        prev.map((s) => (s.folderId === id ? { ...s, folderId: '' } : s))
      );
    },
    [setSermonFolders, setSermons]
  );

  const moveToFolder = useCallback(
    (sermonId, folderId) => {
      setSermons((prev) =>
        prev.map((s) => (s.id === sermonId ? { ...s, folderId: folderId || '' } : s))
      );
    },
    [setSermons]
  );

  return {
    sermons,
    folders: sermonFolders,
    addSermon,
    updateSermon,
    toggleStar,
    removeSermon,
    addFolder,
    renameFolder,
    removeFolder,
    moveToFolder,
  };
}
