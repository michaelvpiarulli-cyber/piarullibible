import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

/**
 * Single owner of all per-user data (progress, highlights, notes, start date).
 *
 * Local-first: localStorage is the instant source of truth, so the UI never
 * waits on the network and works offline. When signed in, state is mirrored up
 * to Supabase (debounced) and merged down on login, giving cross-device sync
 * without slowing anything down.
 */

const KEYS = {
  progress: 'bible-plan-progress',
  highlights: 'bible-plan-highlights',
  notes: 'bible-plan-notes',
  startDate: 'bible-plan-start-date',
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadObject(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { available, user } = useAuth();

  const [progress, setProgress] = useState(() => loadObject(KEYS.progress));
  const [highlights, setHighlights] = useState(() => loadObject(KEYS.highlights));
  const [notes, setNotes] = useState(() => loadObject(KEYS.notes));
  const [startDate, setStartDateState] = useState(
    () => localStorage.getItem(KEYS.startDate) || todayISO()
  );

  const [syncState, setSyncState] = useState('idle'); // idle | syncing | synced | error

  // Persist to localStorage on every change — the instant, offline layer.
  useEffect(() => localStorage.setItem(KEYS.progress, JSON.stringify(progress)), [progress]);
  useEffect(() => localStorage.setItem(KEYS.highlights, JSON.stringify(highlights)), [highlights]);
  useEffect(() => localStorage.setItem(KEYS.notes, JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem(KEYS.startDate, startDate), [startDate]);

  // hydratedFor holds the user id we've already pulled+merged for, so changes
  // only start pushing after the initial merge (and never before login).
  const hydratedFor = useRef(null);
  const pushTimer = useRef(null);

  // --- pull + merge on login -------------------------------------------------
  useEffect(() => {
    if (!available || !user) {
      hydratedFor.current = null;
      return;
    }
    if (hydratedFor.current === user.id) return;

    let cancelled = false;
    (async () => {
      setSyncState('syncing');
      const { data, error } = await supabase
        .from('user_data')
        .select('progress, highlights, notes, start_date')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;
      if (error) {
        setSyncState('error');
        return;
      }

      // Merge: union completed readings; local wins per-verse on annotations;
      // remote start date wins when it exists. Merge-only never drops data.
      const merged = {
        progress: { ...(data?.progress || {}), ...progress },
        highlights: { ...(data?.highlights || {}), ...highlights },
        notes: { ...(data?.notes || {}), ...notes },
        startDate: data?.start_date || startDate,
      };

      setProgress(merged.progress);
      setHighlights(merged.highlights);
      setNotes(merged.notes);
      setStartDateState(merged.startDate);

      hydratedFor.current = user.id;

      // Push the merged result up so the remote row is created/reconciled.
      const { error: upErr } = await supabase.from('user_data').upsert({
        user_id: user.id,
        ...merged,
        start_date: merged.startDate,
        updated_at: new Date().toISOString(),
      });
      if (!cancelled) setSyncState(upErr ? 'error' : 'synced');
    })();

    return () => {
      cancelled = true;
    };
    // Intentionally keyed only on identity — we merge the current local state
    // once per login, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, user]);

  // --- debounced push on change ---------------------------------------------
  useEffect(() => {
    if (!available || !user || hydratedFor.current !== user.id) return;

    setSyncState('syncing');
    clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      const { error } = await supabase.from('user_data').upsert({
        user_id: user.id,
        progress,
        highlights,
        notes,
        start_date: startDate,
        updated_at: new Date().toISOString(),
      });
      setSyncState(error ? 'error' : 'synced');
    }, 800);

    return () => clearTimeout(pushTimer.current);
  }, [progress, highlights, notes, startDate, available, user]);

  // --- mutators (same shapes the old hooks exposed) --------------------------
  const toggleProgress = useCallback((id) => {
    setProgress((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      return next;
    });
  }, []);

  const setHighlight = useCallback((id, color) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (!color || next[id] === color) delete next[id];
      else next[id] = color;
      return next;
    });
  }, []);

  const setNote = useCallback((id, text) => {
    setNotes((prev) => {
      const next = { ...prev };
      const trimmed = text.trim();
      if (!trimmed) delete next[id];
      else next[id] = trimmed;
      return next;
    });
  }, []);

  const value = {
    progress,
    highlights,
    notes,
    startDate,
    setStartDate: setStartDateState,
    toggleProgress,
    setHighlight,
    setNote,
    syncState,
    msPerDay: MS_PER_DAY,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
