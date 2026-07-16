import { useData } from '../context/DataProvider';

export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow', value: '#ffec99' },
  { id: 'green', label: 'Green', value: '#c3ecc9' },
  { id: 'blue', label: 'Blue', value: '#bfe1f6' },
  { id: 'pink', label: 'Pink', value: '#fcc9dd' },
  { id: 'orange', label: 'Orange', value: '#ffd8a8' },
  { id: 'purple', label: 'Purple', value: '#dcd0f7' },
];

export const colorValue = (id) => HIGHLIGHT_COLORS.find((c) => c.id === id)?.value;

/** Verse ids look like "Genesis 1:1" so they're stable and human-readable. */
export const verseId = (book, chapter, verse) => `${book} ${chapter}:${verse}`;

/** Thin view over the shared data store (localStorage + Supabase sync). */
export function useAnnotations() {
  const { highlights, notes, setHighlight, setNote } = useData();

  return {
    highlights,
    notes,
    setHighlight,
    setNote,
    highlightCount: Object.keys(highlights).length,
    noteCount: Object.keys(notes).length,
  };
}
