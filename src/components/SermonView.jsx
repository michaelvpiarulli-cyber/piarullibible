import { useMemo, useRef, useState } from 'react';
import { useSermons } from '../hooks/useSermons';
import { useVerseAnnotations } from '../context/annotations';
import { parsePassage } from '../data/bookRefs';
import {
  extractSubsplashHid,
  fetchSubsplashPage,
  pageToSermonFields,
  textToSermonFields,
} from '../lib/subsplash';
import SketchPad from './ink/SketchPad';
import InkPreview from './ink/InkPreview';

const BLANK = {
  title: '',
  speaker: '',
  date: '',
  passage: '',
  series: '',
  church: '',
  tagsText: '',
  notes: '',
  takeaway: '',
  ink: [],
  starred: false,
  sourceUrl: '',
};

const NOTE_SNIPPETS = [
  { id: 'quote', label: 'Quote', text: 'Quote:\n“”\n\n' },
  { id: 'apply', label: 'Apply', text: 'Application:\n\n' },
  { id: 'pray', label: 'Pray', text: 'Prayer:\n\n' },
];

function pretty(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseTags(text) {
  return (text || '')
    .split(/[,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function tagsToText(tags) {
  return Array.isArray(tags) ? tags.join(', ') : '';
}

function sermonToClipboard(s) {
  const lines = [
    s.title || 'Untitled sermon',
    [pretty(s.date), s.speaker, s.church].filter(Boolean).join(' · '),
    s.series ? `Series: ${s.series}` : '',
    s.passage ? `Passage: ${s.passage}` : '',
    s.tags?.length ? `Tags: ${s.tags.join(', ')}` : '',
    '',
    s.notes || '',
    s.takeaway ? `\nTakeaway: ${s.takeaway}` : '',
    s.ink?.length ? '\n(Also has handwritten notes in the app.)' : '',
  ];
  return lines.filter((line, i) => line || i === 0).join('\n').trim();
}

export default function SermonView() {
  const { sermons, addSermon, updateSermon, toggleStar, removeSermon } = useSermons();
  const { onOpenPassage } = useVerseAnnotations();

  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ ...BLANK, date: new Date().toISOString().slice(0, 10) });
  const [editingId, setEditingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all | starred | series:<name>
  const [mode, setMode] = useState('type'); // which pane is focused: write | type
  const [copiedId, setCopiedId] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState(null);
  const fileRef = useRef(null);

  const field = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const applyImport = (fields) => {
    setForm({ ...BLANK, ...fields, ink: fields.ink || [] });
    setEditingId(null);
    setMode('type');
    setComposing(true);
    setImporting(false);
    setImportUrl('');
    setImportError(null);
  };

  const seriesList = useMemo(() => {
    const set = new Set();
    sermons.forEach((s) => {
      if (s.series?.trim()) set.add(s.series.trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [sermons]);

  const startNew = () => {
    setForm({ ...BLANK, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setMode('type');
    setComposing(true);
  };

  const startEdit = (s) => {
    setForm({
      title: s.title || '',
      speaker: s.speaker || '',
      date: s.date || '',
      passage: s.passage || '',
      series: s.series || '',
      church: s.church || '',
      tagsText: tagsToText(s.tags),
      notes: s.notes || '',
      takeaway: s.takeaway || '',
      ink: s.ink || [],
      starred: Boolean(s.starred),
      sourceUrl: s.sourceUrl || '',
    });
    setMode((s.ink || []).length && !s.notes ? 'write' : 'type');
    setEditingId(s.id);
    setComposing(true);
  };

  const importFromSubsplash = async (e) => {
    e?.preventDefault?.();
    const hid = extractSubsplashHid(importUrl);
    if (!hid) {
      setImportError('Paste a Subsplash notes link (notes.subsplash.com/…?doc=…).');
      return;
    }
    setImportBusy(true);
    setImportError(null);
    try {
      const page = await fetchSubsplashPage(hid);
      applyImport(pageToSermonFields(page));
    } catch (err) {
      setImportError(err.message || 'Import failed.');
    }
    setImportBusy(false);
  };

  const importFromFile = async (file) => {
    if (!file) return;
    setImportBusy(true);
    setImportError(null);
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error('That file looks empty.');
      applyImport(textToSermonFields(text, { filename: file.name }));
    } catch (err) {
      setImportError(err.message || 'Couldn’t read that file.');
    }
    setImportBusy(false);
  };

  const save = (e) => {
    e.preventDefault();
    const hasSomething =
      form.notes.trim() || form.title.trim() || form.takeaway.trim() || (form.ink && form.ink.length > 0);
    if (!hasSomething) return;

    const payload = {
      title: form.title,
      speaker: form.speaker,
      date: form.date,
      passage: form.passage,
      series: form.series.trim(),
      church: form.church.trim(),
      tags: parseTags(form.tagsText),
      notes: form.notes,
      takeaway: form.takeaway,
      ink: form.ink || [],
      starred: Boolean(form.starred),
      sourceUrl: form.sourceUrl || '',
    };

    if (editingId) updateSermon(editingId, payload);
    else addSermon(payload);
    setComposing(false);
    setEditingId(null);
  };

  const insertSnippet = (snippet) => {
    setMode('type');
    setForm((f) => ({
      ...f,
      notes: f.notes ? `${f.notes.replace(/\s*$/, '')}\n\n${snippet.text}` : snippet.text,
    }));
  };

  const openPassage = (passage) => {
    const parsed = parsePassage(passage);
    if (parsed) onOpenPassage?.(parsed);
  };

  const copySermon = async (s) => {
    try {
      await navigator.clipboard.writeText(sermonToClipboard(s));
      setCopiedId(s.id);
      setTimeout(() => setCopiedId((id) => (id === s.id ? null : id)), 1600);
    } catch {
      /* clipboard may be denied */
    }
  };

  const q = query.trim().toLowerCase();
  const visible = sermons.filter((s) => {
    if (filter === 'starred' && !s.starred) return false;
    if (filter.startsWith('series:')) {
      const name = filter.slice(7);
      if ((s.series || '').trim() !== name) return false;
    }
    if (!q) return true;
    return [s.title, s.speaker, s.passage, s.notes, s.takeaway, s.series, s.church, ...(s.tags || [])]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const starredCount = sermons.filter((s) => s.starred).length;

  return (
    <div className="sermon-view">
      {composing ? (
        <form className="sermon-form" onSubmit={save}>
          <div className="sermon-form-head">
            <p className="account-form-title">
              {editingId ? 'Edit notes' : form.sourceUrl ? 'Imported sermon notes' : 'New sermon notes'}
            </p>
            <button
              type="button"
              className={`sermon-star-btn${form.starred ? ' on' : ''}`}
              onClick={() => setForm((f) => ({ ...f, starred: !f.starred }))}
              aria-pressed={form.starred}
              aria-label={form.starred ? 'Unstar sermon' : 'Star sermon'}
              title={form.starred ? 'Starred' : 'Star'}
            >
              <svg viewBox="0 0 24 24" fill={form.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                <path d="m12 3.5 2.7 5.5 6 .9-4.4 4.3 1 6L12 17.3 6.7 20.2l1-6L3.3 9.9l6-.9Z" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {form.sourceUrl && (
            <p className="sermon-import-credit">
              Built from{' '}
              <a href={form.sourceUrl} target="_blank" rel="noreferrer">
                Subsplash notes
              </a>
              . Edit anything before saving.
            </p>
          )}

          <div className="sermon-fields">
            <input
              type="text"
              value={form.title}
              onChange={field('title')}
              placeholder="Sermon title"
              autoFocus
            />
            <input
              type="text"
              value={form.speaker}
              onChange={field('speaker')}
              placeholder="Speaker"
            />
            <input type="date" value={form.date} onChange={field('date')} />
            <input
              type="text"
              value={form.passage}
              onChange={field('passage')}
              placeholder="Passage — e.g. Romans 8:1–11"
            />
            <input
              type="text"
              value={form.series}
              onChange={field('series')}
              placeholder="Series (optional)"
              list="sermon-series-list"
            />
            <input
              type="text"
              value={form.church}
              onChange={field('church')}
              placeholder="Church / gathering"
            />
          </div>
          <datalist id="sermon-series-list">
            {seriesList.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <input
            type="text"
            value={form.tagsText}
            onChange={field('tagsText')}
            placeholder="Tags — e.g. grace, Advent, prayer"
          />

          <div className="mode-switch">
            <button
              type="button"
              className={`chip${mode === 'type' ? ' active' : ''}`}
              onClick={() => setMode('type')}
            >
              Type
            </button>
            <button
              type="button"
              className={`chip${mode === 'write' ? ' active' : ''}`}
              onClick={() => setMode('write')}
            >
              Handwrite
            </button>
          </div>

          {mode === 'type' && (
            <>
              <div className="note-snippets">
                {NOTE_SNIPPETS.map((snip) => (
                  <button
                    key={snip.id}
                    type="button"
                    className="snippet-chip"
                    onClick={() => insertSnippet(snip)}
                  >
                    + {snip.label}
                  </button>
                ))}
              </div>
              <textarea
                value={form.notes}
                onChange={field('notes')}
                placeholder="Notes — quotes, outline, what the Spirit pressed on you…"
                rows={10}
              />
            </>
          )}

          {mode === 'write' && (
            <SketchPad
              strokes={form.ink || []}
              onChange={(ink) => setForm((f) => ({ ...f, ink }))}
            />
          )}

          {(form.ink?.length > 0 || form.notes.trim()) && mode === 'type' && form.ink?.length > 0 && (
            <p className="sermon-dual-hint">Handwritten page saved with these notes.</p>
          )}
          {mode === 'write' && form.notes.trim() && (
            <p className="sermon-dual-hint">Typed notes are kept when you switch to handwriting.</p>
          )}

          <input
            type="text"
            value={form.takeaway}
            onChange={field('takeaway')}
            placeholder="One takeaway to carry into the week"
          />

          <div className="sermon-form-actions">
            <button
              type="button"
              className="btn-text"
              onClick={() => {
                setComposing(false);
                setEditingId(null);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save notes
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="sermon-top">
            <button type="button" className="btn-primary" onClick={startNew}>
              New sermon notes
            </button>
            <button
              type="button"
              className={`btn-secondary${importing ? ' active' : ''}`}
              onClick={() => {
                setImporting(!importing);
                setImportError(null);
              }}
            >
              Import Subsplash
            </button>
            {sermons.length > 0 && (
              <input
                type="search"
                className="sermon-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes…"
              />
            )}
          </div>

          {importing && (
            <div className="sermon-import">
              <p className="sermon-import-title">Import your pastor’s Subsplash notes</p>
              <p className="sermon-import-sub">
                Paste the Fill-In Notes link from your church app, or upload a .txt / .md export.
                We’ll fill title, speaker, passage, and the outline (blanks included).
              </p>

              <form className="sermon-import-row" onSubmit={importFromSubsplash}>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://notes.subsplash.com/fill-in/view?doc=…"
                  autoFocus
                />
                <button type="submit" className="btn-primary" disabled={importBusy || !importUrl.trim()}>
                  {importBusy ? 'Building…' : 'Build notes'}
                </button>
              </form>

              <div className="sermon-import-or">
                <span>or</span>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.markdown,.html,.htm,text/plain,text/markdown,text/html"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  importFromFile(file);
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                disabled={importBusy}
                onClick={() => fileRef.current?.click()}
              >
                Upload a notes file
              </button>

              {importError && <p className="account-error">{importError}</p>}
            </div>
          )}

          {sermons.length > 0 && (
            <div className="filter-row sermon-filters">
              <button
                type="button"
                className={`chip${filter === 'all' ? ' active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                type="button"
                className={`chip${filter === 'starred' ? ' active' : ''}`}
                onClick={() => setFilter('starred')}
                disabled={starredCount === 0}
              >
                Starred{starredCount ? ` (${starredCount})` : ''}
              </button>
              {seriesList.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`chip${filter === `series:${name}` ? ' active' : ''}`}
                  onClick={() => setFilter(`series:${name}`)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {!composing && sermons.length > 0 && (
        <ul className="sermon-list">
          {visible.map((s) => {
            const open = openId === s.id;
            const passageTarget = parsePassage(s.passage);
            return (
              <li key={s.id} className={`sermon-card${open ? ' open' : ''}${s.starred ? ' starred' : ''}`}>
                <div className="sermon-head-row">
                  <button
                    type="button"
                    className={`sermon-star-btn${s.starred ? ' on' : ''}`}
                    onClick={() => toggleStar(s.id)}
                    aria-pressed={Boolean(s.starred)}
                    aria-label={s.starred ? 'Unstar' : 'Star'}
                  >
                    <svg viewBox="0 0 24 24" fill={s.starred ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
                      <path d="m12 3.5 2.7 5.5 6 .9-4.4 4.3 1 6L12 17.3 6.7 20.2l1-6L3.3 9.9l6-.9Z" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="sermon-head"
                    onClick={() => setOpenId(open ? null : s.id)}
                  >
                    <div className="sermon-head-main">
                      <span className="sermon-title">{s.title || 'Untitled'}</span>
                      <span className="sermon-meta">
                        {[pretty(s.date), s.speaker, s.church, s.series].filter(Boolean).join(' · ')}
                        {s.ink?.length > 0 && <span className="ink-badge">handwritten</span>}
                      </span>
                      {!open && s.takeaway && (
                        <span className="sermon-takeaway-preview">{s.takeaway}</span>
                      )}
                      {!open && s.tags?.length > 0 && (
                        <span className="sermon-tag-row">
                          {s.tags.map((t) => (
                            <span key={t} className="sermon-tag">
                              {t}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={open ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
                    </svg>
                  </button>
                </div>

                {open && (
                  <div className="sermon-body">
                    {s.passage && (
                      <div className="sermon-passage-row">
                        {passageTarget ? (
                          <button
                            type="button"
                            className="sermon-passage-link"
                            onClick={() => openPassage(s.passage)}
                          >
                            {s.passage}
                            <span>Open in Read</span>
                          </button>
                        ) : (
                          <span className="sermon-passage-plain">{s.passage}</span>
                        )}
                      </div>
                    )}

                    {s.sourceUrl && (
                      <p className="sermon-import-credit">
                        From{' '}
                        <a href={s.sourceUrl} target="_blank" rel="noreferrer">
                          Subsplash
                        </a>
                      </p>
                    )}

                    {s.tags?.length > 0 && (
                      <div className="sermon-tag-row open">
                        {s.tags.map((t) => (
                          <span key={t} className="sermon-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {s.ink?.length > 0 && <InkPreview strokes={s.ink} />}
                    {s.notes && <p className="sermon-notes">{s.notes}</p>}
                    {s.takeaway && (
                      <div className="sermon-takeaway">
                        <span className="takeaway-label">Takeaway</span>
                        <p>{s.takeaway}</p>
                      </div>
                    )}
                    <div className="sermon-card-actions">
                      <button type="button" className="btn-text" onClick={() => copySermon(s)}>
                        {copiedId === s.id ? 'Copied' : 'Copy'}
                      </button>
                      <button type="button" className="btn-text" onClick={() => startEdit(s)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-text danger"
                        onClick={() => removeSermon(s.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}

          {visible.length === 0 && (
            <li className="sermon-none">
              {q
                ? `No notes match “${query}”.`
                : filter === 'starred'
                  ? 'No starred sermons yet — tap the star on a note.'
                  : 'No sermons in this series.'}
            </li>
          )}
        </ul>
      )}

      {!composing && sermons.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4h9l4 4v12H6z" />
            <path d="M14.5 4v4.5H19" />
            <path d="M9 12h6M9 16h4" />
          </svg>
          <p className="empty-title">No sermon notes yet</p>
          <p className="empty-sub">
            Capture the title, speaker, passage, and what stood out — then keep one takeaway for
            the week.
          </p>
        </div>
      )}
    </div>
  );
}
