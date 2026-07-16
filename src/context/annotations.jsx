import { createContext, useContext } from 'react';

/**
 * Highlights, notes, and the verse-tap handler are needed deep inside the
 * reader but nowhere in between, so they ride a context instead of being
 * drilled through every week/reading component.
 */
const AnnotationsContext = createContext(null);

export function AnnotationsProvider({ value, children }) {
  return <AnnotationsContext.Provider value={value}>{children}</AnnotationsContext.Provider>;
}

export function useVerseAnnotations() {
  const ctx = useContext(AnnotationsContext);
  if (!ctx) throw new Error('useVerseAnnotations must be used inside AnnotationsProvider');
  return ctx;
}
