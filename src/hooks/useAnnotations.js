import { useCallback, useEffect, useState } from 'react';

const HIGHLIGHT_KEY = 'bible-plan-highlights';
const NOTE_KEY = 'bible-plan-notes';

export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', value: '#ffec99' },
  { id: 'green', label: 'Green', value: '#c3ecc9' },
  { id: 'blue', label: 'Blue', value: '#bfe1f6' },
  { id: 'pink', label: 'Pink', value: '#fcc9dd' },
  { id: 'orange', label: 'Orange', value: '#ffd8a8' },
  { id: 'purple', label: 'Purple', value: '#dcd0f7' },
];

export const colorValue = (id) => HIGHLIGHT_COLORS.find((c) => c.id === id)?.value;

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** Verse ids look like "Genesis 1:1" so they're stable and human-readable. */
export const verseId = (book, chapter, verse) => `${book} ${chapter}:${verse}`;

export function useAnnotations() {
  const [highlights, setHighlights] = useState(() => load(HIGHLIGHT_KEY));
  const [notes, setNotes] = useState(() => load(NOTE_KEY));

  useEffect(() => {
    localStorage.setItem(HIGHLIGHT_KEY, JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    localStorage.setItem(NOTE_KEY, JSON.stringify(notes));
  }, [notes]);

  const setHighlight = useCallback((id, color) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (!color || next[id] === color) {
        delete next[id];
      } else {
        next[id] = color;
      }
      return next;
    });
  }, []);

  const setNote = useCallback((id, text) => {
    setNotes((prev) => {
      const next = { ...prev };
      const trimmed = text.trim();
      if (!trimmed) {
        delete next[id];
      } else {
        next[id] = trimmed;
      }
      return next;
    });
  }, []);

  return {
    highlights,
    notes,
    setHighlight,
    setNote,
    highlightCount: Object.keys(highlights).length,
    noteCount: Object.keys(notes).length,
  };
}
