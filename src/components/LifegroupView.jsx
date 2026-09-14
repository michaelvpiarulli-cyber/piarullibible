import { useEffect, useMemo, useState } from 'react';
import { LIFEGROUP_STUDIES, getStudyById } from '../data/lifegroupStudies';

const NOTES_KEY = 'bible-plan-lifegroup-notes';

function loadNotes() {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

/**
 * Lifegroup discussion guides — open questions for shared study.
 */
export default function LifegroupView() {
  const [studyId, setStudyId] = useState(LIFEGROUP_STUDIES[0]?.id || null);
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState(loadNotes);

  const study = useMemo(() => getStudyById(studyId), [studyId]);

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    setOpenId(null);
  }, [studyId]);

  if (!study) {
    return (
      <div className="empty-state">
        <p className="empty-title">No studies yet</p>
        <p className="empty-sub">Lifegroup discussion guides will show up here.</p>
      </div>
    );
  }

  const studyNotes = notes[study.id] || {};

  const setAnswer = (questionId, value) => {
    setNotes((prev) => ({
      ...prev,
      [study.id]: {
        ...(prev[study.id] || {}),
        [questionId]: value,
      },
    }));
  };

  return (
    <div className="lifegroup-view">
      {LIFEGROUP_STUDIES.length > 1 && (
        <div className="filter-row section-switch">
          {LIFEGROUP_STUDIES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`chip${studyId === s.id ? ' active' : ''}`}
              onClick={() => setStudyId(s.id)}
            >
              Ch. {s.chapter}
            </button>
          ))}
        </div>
      )}

      <header className="lifegroup-hero">
        <span className="eyebrow">
          {study.series} · Chapter {study.chapter}
        </span>
        <h2>{study.title}</h2>
        <p className="lifegroup-blurb">{study.blurb}</p>
        <p className="lifegroup-author">Discussion guide · {study.author}</p>
      </header>

      <section className="lifegroup-card">
        <h3 className="lifegroup-card-title">Big idea</h3>
        <p className="lifegroup-card-body">{study.bigIdea}</p>
      </section>

      <section className="lifegroup-card">
        <h3 className="lifegroup-card-title">Scripture to open</h3>
        <ul className="lifegroup-refs">
          {study.scriptureFocus.map((s) => (
            <li key={s.ref}>
              <strong>{s.ref}</strong>
              <span>{s.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="lifegroup-card icebreaker">
        <h3 className="lifegroup-card-title">Icebreaker</h3>
        <p className="lifegroup-card-body">{study.icebreaker}</p>
      </section>

      <ol className="lifegroup-questions">
        {study.questions.map((q, i) => {
          const open = openId === q.id;
          return (
            <li key={q.id} className={`lifegroup-q${open ? ' open' : ''}`}>
              <button
                type="button"
                className="lifegroup-q-toggle"
                onClick={() => setOpenId(open ? null : q.id)}
                aria-expanded={open}
              >
                <span className="lifegroup-q-num">{i + 1}</span>
                <span className="lifegroup-q-prompt">{q.prompt}</span>
                <span className="lifegroup-q-chevron" aria-hidden="true">
                  {open ? '−' : '+'}
                </span>
              </button>

              {open && (
                <div className="lifegroup-q-body">
                  {q.followUp && (
                    <p className="lifegroup-followup">
                      <span>Go deeper</span>
                      {q.followUp}
                    </p>
                  )}
                  <label className="lifegroup-notes-label" htmlFor={`note-${q.id}`}>
                    Your notes (stays on this phone)
                  </label>
                  <textarea
                    id={`note-${q.id}`}
                    className="lifegroup-notes"
                    rows={3}
                    value={studyNotes[q.id] || ''}
                    onChange={(e) => setAnswer(q.id, e.target.value)}
                    placeholder="Jot a thought before or during discussion…"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <section className="lifegroup-card closing">
        <h3 className="lifegroup-card-title">Closing prayer</h3>
        <p className="lifegroup-prayer">{study.closingPrayer}</p>
      </section>
    </div>
  );
}
