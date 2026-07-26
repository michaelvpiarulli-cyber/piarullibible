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
  journal: 'bible-plan-journal',
  memory: 'bible-plan-memory',
  sermons: 'bible-plan-sermons',
  examens: 'bible-plan-examens',
  rule: 'bible-plan-rule',
};

const EMPTY_MEMORY = { verses: [], reviewedOn: null, dailyCount: 0 };
const EMPTY_RULE = { habits: [] };

/**
 * Journal, memory, and sermon notes are stored inside the `progress` jsonb
 * column under this reserved key, so they sync to the account on the schema as
 * it stands (no extra columns needed). Reading ids look like "d12-t3", so the
 * key can't collide.
 *
 * If dedicated columns are added later, these two helpers are the only place
 * that needs to change.
 */
const EXTRAS_KEY = '__extras';

/** Split a stored progress blob into real progress plus the extras payload. */
function unpackExtras(stored) {
  const raw = stored || {};
  const { [EXTRAS_KEY]: extras, ...progress } = raw;
  return {
    progress,
    journal: Array.isArray(extras?.journal) ? extras.journal : [],
    memory: extras?.memory && typeof extras.memory === 'object' ? extras.memory : EMPTY_MEMORY,
    sermons: Array.isArray(extras?.sermons) ? extras.sermons : [],
    examens: Array.isArray(extras?.examens) ? extras.examens : [],
    rule: extras?.rule && typeof extras.rule === 'object' ? extras.rule : EMPTY_RULE,
  };
}

/** Recombine for writing. Progress keys stay top-level so nothing else breaks. */
function packExtras(progress, extras) {
  const { [EXTRAS_KEY]: _drop, ...clean } = progress || {};
  return { ...clean, [EXTRAS_KEY]: extras };
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function loadObject(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
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
  const [journal, setJournal] = useState(() => loadObject(KEYS.journal, []));
  const [memory, setMemory] = useState(() => loadObject(KEYS.memory, EMPTY_MEMORY));
  const [sermons, setSermons] = useState(() => loadObject(KEYS.sermons, []));
  const [examens, setExamens] = useState(() => loadObject(KEYS.examens, []));
  const [rule, setRule] = useState(() => loadObject(KEYS.rule, EMPTY_RULE));

  const [syncState, setSyncState] = useState('idle'); // idle | syncing | synced | error

  // Persist to localStorage on every change — the instant, offline layer.
  useEffect(() => localStorage.setItem(KEYS.progress, JSON.stringify(progress)), [progress]);
  useEffect(() => localStorage.setItem(KEYS.highlights, JSON.stringify(highlights)), [highlights]);
  useEffect(() => localStorage.setItem(KEYS.notes, JSON.stringify(notes)), [notes]);
  useEffect(() => localStorage.setItem(KEYS.startDate, startDate), [startDate]);
  useEffect(() => localStorage.setItem(KEYS.journal, JSON.stringify(journal)), [journal]);
  useEffect(() => localStorage.setItem(KEYS.memory, JSON.stringify(memory)), [memory]);
  useEffect(() => localStorage.setItem(KEYS.sermons, JSON.stringify(sermons)), [sermons]);
  useEffect(() => localStorage.setItem(KEYS.examens, JSON.stringify(examens)), [examens]);
  useEffect(() => localStorage.setItem(KEYS.rule, JSON.stringify(rule)), [rule]);

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

      // Journal, memory, and sermons ride inside the progress column under a
      // reserved key (see EXTRAS_KEY) so they sync without needing extra
      // columns. unpackExtras keeps them out of the reading-progress map.
      const remote = unpackExtras(data?.progress);

      // Merge: union completed readings; local wins per-verse on annotations;
      // remote start date wins when it exists. Merge-only never drops data.
      const mergedProgress = { ...remote.progress, ...progress };
      const mergedHighlights = { ...(data?.highlights || {}), ...highlights };
      const mergedNotes = { ...(data?.notes || {}), ...notes };
      const mergedStart = data?.start_date || startDate;

      // Journal is a list: union by id, newest first, so entries written on one
      // device don't overwrite another's.
      const byId = new Map();
      [...remote.journal, ...journal].forEach((e) => e && e.id && byId.set(e.id, e));
      const mergedJournal = [...byId.values()].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Sermon notes merge the same way — union by id, newest first.
      const sermonById = new Map();
      [...remote.sermons, ...sermons].forEach((s) => s && s.id && sermonById.set(s.id, s));
      const mergedSermons = [...sermonById.values()].sort(
        (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
      );

      // Memory verses: union by ref, keeping whichever copy is further along.
      const byRef = new Map();
      [...(remote.memory.verses || []), ...(memory.verses || [])].forEach((v) => {
        if (!v || !v.ref) return;
        const prev = byRef.get(v.ref);
        if (!prev || (v.reviews || 0) >= (prev.reviews || 0)) byRef.set(v.ref, v);
      });
      const mergedMemory = {
        verses: [...byRef.values()],
        reviewedOn: memory.reviewedOn || remote.memory.reviewedOn || null,
        dailyCount: Math.max(memory.dailyCount || 0, remote.memory.dailyCount || 0),
      };

      // Examens: one per date, union by id.
      const examById = new Map();
      [...remote.examens, ...examens].forEach((e) => e && e.id && examById.set(e.id, e));
      const mergedExamens = [...examById.values()].sort((a, b) => (a.date < b.date ? 1 : -1));

      // Rule of life: union habits by id, unioning their checked days.
      const habitById = new Map();
      [...(remote.rule.habits || []), ...(rule.habits || [])].forEach((h) => {
        if (!h || !h.id) return;
        const prev = habitById.get(h.id);
        habitById.set(h.id, prev ? { ...h, days: { ...prev.days, ...h.days } } : h);
      });
      const mergedRule = { habits: [...habitById.values()] };

      setProgress(mergedProgress);
      setHighlights(mergedHighlights);
      setNotes(mergedNotes);
      setStartDateState(mergedStart);
      setJournal(mergedJournal);
      setMemory(mergedMemory);
      setSermons(mergedSermons);
      setExamens(mergedExamens);
      setRule(mergedRule);

      hydratedFor.current = user.id;

      // Push the merged result up so the remote row is created/reconciled.
      const { error: upErr } = await supabase.from('user_data').upsert({
        user_id: user.id,
        progress: packExtras(mergedProgress, {
          journal: mergedJournal,
          memory: mergedMemory,
          sermons: mergedSermons,
          examens: mergedExamens,
          rule: mergedRule,
        }),
        highlights: mergedHighlights,
        notes: mergedNotes,
        start_date: mergedStart,
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
        progress: packExtras(progress, { journal, memory, sermons, examens, rule }),
        highlights,
        notes,
        start_date: startDate,
        updated_at: new Date().toISOString(),
      });
      setSyncState(error ? 'error' : 'synced');
    }, 800);

    return () => clearTimeout(pushTimer.current);
  }, [progress, highlights, notes, startDate, journal, memory, sermons, examens, rule, available, user]);

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
    journal,
    memory,
    sermons,
    examens,
    rule,
    setStartDate: setStartDateState,
    setJournal,
    setMemory,
    setSermons,
    setExamens,
    setRule,
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
