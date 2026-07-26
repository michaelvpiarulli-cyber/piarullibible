import { useState } from 'react';
import { useSermons } from '../hooks/useSermons';
import SketchPad from './ink/SketchPad';
import InkPreview from './ink/InkPreview';

const BLANK = {
  title: '',
  speaker: '',
  date: '',
  passage: '',
  notes: '',
  takeaway: '',
  ink: [],
};

function pretty(dateStr) {
  if (!dateStr) return '';
  const d = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SermonView() {
  const { sermons, addSermon, updateSermon, removeSermon } = useSermons();

  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ ...BLANK, date: new Date().toISOString().slice(0, 10) });
  const [editingId, setEditingId] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('write'); // write (Pencil) | type

  const field = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const startNew = () => {
    setForm({ ...BLANK, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setComposing(true);
  };

  const startEdit = (s) => {
    setForm({
      title: s.title || '',
      speaker: s.speaker || '',
      date: s.date || '',
      passage: s.passage || '',
      notes: s.notes || '',
      takeaway: s.takeaway || '',
      ink: s.ink || [],
    });
    setMode((s.ink || []).length && !s.notes ? 'write' : s.notes ? 'type' : 'write');
    setEditingId(s.id);
    setComposing(true);
  };

  const save = (e) => {
    e.preventDefault();
    const hasSomething =
      form.notes.trim() || form.title.trim() || (form.ink && form.ink.length > 0);
    if (!hasSomething) return;
    if (editingId) updateSermon(editingId, form);
    else addSermon(form);
    setComposing(false);
    setEditingId(null);
  };

  const q = query.trim().toLowerCase();
  const visible = q
    ? sermons.filter((s) =>
        [s.title, s.speaker, s.passage, s.notes, s.takeaway]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      )
    : sermons;

  return (
    <div className="sermon-view">
      {composing ? (
        <form className="sermon-form" onSubmit={save}>
          <p className="account-form-title">{editingId ? 'Edit notes' : 'New sermon notes'}</p>

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
          </div>

          <div className="mode-switch">
            <button
              type="button"
              className={`chip${mode === 'write' ? ' active' : ''}`}
              onClick={() => setMode('write')}
            >
              Handwrite
            </button>
            <button
              type="button"
              className={`chip${mode === 'type' ? ' active' : ''}`}
              onClick={() => setMode('type')}
            >
              Type
            </button>
          </div>

          {mode === 'write' ? (
            <SketchPad
              strokes={form.ink || []}
              onChange={(ink) => setForm((f) => ({ ...f, ink }))}
            />
          ) : (
            <textarea
              value={form.notes}
              onChange={field('notes')}
              placeholder="Notes…"
              rows={10}
            />
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
        <div className="sermon-top">
          <button type="button" className="btn-primary" onClick={startNew}>
            New sermon notes
          </button>
          {sermons.length > 1 && (
            <input
              type="search"
              className="sermon-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
            />
          )}
        </div>
      )}

      {!composing && sermons.length > 0 && (
        <ul className="sermon-list">
          {visible.map((s) => {
            const open = openId === s.id;
            return (
              <li key={s.id} className={`sermon-card${open ? ' open' : ''}`}>
                <button
                  type="button"
                  className="sermon-head"
                  onClick={() => setOpenId(open ? null : s.id)}
                >
                  <div className="sermon-head-main">
                    <span className="sermon-title">{s.title || 'Untitled'}</span>
                    <span className="sermon-meta">
                      {[pretty(s.date), s.speaker, s.passage].filter(Boolean).join(' · ')}
                      {s.ink?.length > 0 && <span className="ink-badge">handwritten</span>}
                    </span>
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

                {open && (
                  <div className="sermon-body">
                    {s.ink?.length > 0 && <InkPreview strokes={s.ink} />}
                    {s.notes && <p className="sermon-notes">{s.notes}</p>}
                    {s.takeaway && (
                      <div className="sermon-takeaway">
                        <span className="takeaway-label">Takeaway</span>
                        <p>{s.takeaway}</p>
                      </div>
                    )}
                    <div className="sermon-card-actions">
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
            <li className="sermon-none">No notes match “{query}”.</li>
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
