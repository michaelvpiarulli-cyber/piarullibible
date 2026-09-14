import { useEffect, useMemo, useState } from 'react';
import {
  LIFEGROUP_STUDIES,
  getStudyById,
  getCurrentStudy,
} from '../data/lifegroupStudies';
import { parsePassage } from '../data/bookRefs';

const NOTES_KEY = 'bible-plan-lifegroup-notes';
const STUDY_KEY = 'bible-plan-lifegroup-study';

function loadNotes() {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTES_KEY) || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function initialStudyId() {
  try {
    const saved = localStorage.getItem(STUDY_KEY);
    if (saved && getStudyById(saved)) return saved;
  } catch {
    /* ignore */
  }
  return getCurrentStudy()?.id || LIFEGROUP_STUDIES[0]?.id || null;
}

/** Turn a study ref into a Read jump target (multi-chapter ranges expanded). */
function jumpFromRef(ref) {
  const parsed = parsePassage(ref);
  if (!parsed) return null;
  return {
    book: parsed.book,
    chapter: parsed.chapter,
    verse: parsed.verse,
    chapters: parsed.chapters || [{ book: parsed.book, chapter: parsed.chapter }],
    label: ref,
    fullscreen: true,
    returnTab: 'lifegroup',
  };
}

/**
 * Lifegroup discussion guides — open questions for shared study.
 */
export default function LifegroupView({ onOpenPassage }) {
  const [studyId, setStudyId] = useState(initialStudyId);
  const [openId, setOpenId] = useState(null);
  const [notes, setNotes] = useState(loadNotes);

  const study = useMemo(() => getStudyById(studyId), [studyId]);
  const current = getCurrentStudy();

  useEffect(() => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (studyId) localStorage.setItem(STUDY_KEY, studyId);
  }, [studyId]);

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
  const isThisWeek = study.id === current?.id;

  const setAnswer = (questionId, value) => {
    setNotes((prev) => ({
      ...prev,
      [study.id]: {
        ...(prev[study.id] || {}),
        [questionId]: value,
      },
    }));
  };

  const openRef = (ref) => {
    const jump = jumpFromRef(ref);
    if (jump) onOpenPassage?.(jump);
  };

  return (
    <div className="lifegroup-view">
      {LIFEGROUP_STUDIES.length > 1 && (
        <div className="filter-row section-switch lifegroup-weeks" role="tablist" aria-label="Study week">
          {LIFEGROUP_STUDIES.map((s) => {
            const active = studyId === s.id;
            const thisWeek = s.id === current?.id;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`chip${active ? ' active' : ''}${thisWeek ? ' this-week' : ''}`}
                onClick={() => setStudyId(s.id)}
              >
                {thisWeek ? 'This week' : `Ch. ${s.chapter}`}
              </button>
            );
          })}
        </div>
      )}

      <header className="lifegroup-hero">
        <span className="eyebrow">
          {isThisWeek ? 'This week · ' : 'Past week · '}
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
          {study.scriptureFocus.map((s) => {
            const canOpen = Boolean(onOpenPassage && jumpFromRef(s.ref));
            return (
              <li key={s.ref}>
                {canOpen ? (
                  <button
                    type="button"
                    className="lifegroup-ref-btn"
                    onClick={() => openRef(s.ref)}
                  >
                    <span className="lifegroup-ref-main">
                      <strong>{s.ref}</strong>
                      <span className="lifegroup-ref-open" aria-hidden="true">
                        Open →
                      </span>
                    </span>
                    <span className="lifegroup-ref-note">{s.note}</span>
                  </button>
                ) : (
                  <>
                    <strong>{s.ref}</strong>
                    <span>{s.note}</span>
                  </>
                )}
              </li>
            );
          })}
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
