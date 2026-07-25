import { useState } from 'react';
import { useJournal, ENTRY_KINDS } from '../hooks/useJournal';

const FILTERS = [{ id: 'all', label: 'All' }, ...ENTRY_KINDS, { id: 'answered', label: 'Answered' }];

const KIND_LABEL = Object.fromEntries(ENTRY_KINDS.map((k) => [k.id, k.label]));

function when(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function JournalView({ currentDay }) {
  const { entries, addEntry, updateEntry, removeEntry, toggleAnswered } = useJournal();

  const [kind, setKind] = useState('prayer');
  const [text, setText] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  const submit = (e) => {
    e.preventDefault();
    addEntry(kind, text, currentDay);
    setText('');
  };

  const visible = entries.filter((e) => {
    if (filter === 'all') return true;
    if (filter === 'answered') return Boolean(e.answeredAt);
    return e.kind === filter;
  });

  const answeredCount = entries.filter((e) => e.answeredAt).length;

  return (
    <div className="journal-view">
      <form className="journal-compose" onSubmit={submit}>
        <div className="kind-row">
          {ENTRY_KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`chip${kind === k.id ? ' active' : ''}`}
              onClick={() => setKind(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            kind === 'prayer'
              ? 'What are you praying for?'
              : kind === 'praise'
                ? 'What are you thankful for?'
                : 'What stood out to you today?'
          }
          rows={3}
        />
        <div className="journal-compose-actions">
          <button type="submit" className="btn-primary" disabled={!text.trim()}>
            Save entry
          </button>
        </div>
      </form>

      {entries.length > 0 && (
        <>
          <div className="filter-row">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip${filter === f.id ? ' active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                {f.id === 'answered' && answeredCount > 0 ? ` (${answeredCount})` : ''}
              </button>
            ))}
          </div>

          <ul className="journal-list">
            {visible.map((e) => (
              <li key={e.id} className={`journal-card${e.answeredAt ? ' answered' : ''}`}>
                <div className="journal-card-head">
                  <span className={`journal-kind ${e.kind}`}>{KIND_LABEL[e.kind] || e.kind}</span>
                  <span className="journal-date">
                    {when(e.createdAt)}
                    {e.day ? ` · Day ${e.day}` : ''}
                  </span>
                </div>

                {editingId === e.id ? (
                  <>
                    <textarea
                      className="journal-edit"
                      value={draft}
                      onChange={(ev) => setDraft(ev.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="journal-card-actions">
                      <button type="button" className="btn-text" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          updateEntry(e.id, draft);
                          setEditingId(null);
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="journal-text">{e.text}</p>
                    {e.answeredAt && (
                      <span className="answered-badge">Answered {when(e.answeredAt)}</span>
                    )}
                    <div className="journal-card-actions">
                      {e.kind === 'prayer' && (
                        <button
                          type="button"
                          className="btn-text"
                          onClick={() => toggleAnswered(e.id)}
                        >
                          {e.answeredAt ? 'Unmark' : 'Mark answered'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => {
                          setEditingId(e.id);
                          setDraft(e.text);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-text danger"
                        onClick={() => removeEntry(e.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {entries.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3.5h11l3 3v14H5z" />
            <path d="M8.5 9h7M8.5 13h7M8.5 17h4" />
          </svg>
          <p className="empty-title">Your journal is empty</p>
          <p className="empty-sub">
            Write down a prayer, a praise, or a thought from today's reading. Mark prayers answered
            as God moves.
          </p>
        </div>
      )}
    </div>
  );
}
