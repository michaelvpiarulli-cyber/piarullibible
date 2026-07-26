import { useMemo, useState } from 'react';
import { useData } from '../context/DataProvider';

/**
 * A short daily review in the Ignatian pattern: notice God's presence, give
 * thanks, face where you fell short, and ask for what tomorrow needs.
 */
export const STEPS = [
  {
    id: 'gratitude',
    title: 'Give thanks',
    prompt: 'What are three good things from today — however small?',
  },
  {
    id: 'presence',
    title: 'Notice',
    prompt: 'Where did you see God at work today, in you or around you?',
  },
  {
    id: 'shortfall',
    title: 'Face it honestly',
    prompt: 'Where did you fall short today? Name it plainly, without excuse.',
  },
  {
    id: 'tomorrow',
    title: 'Ask',
    prompt: 'What do you most need from God tomorrow?',
  },
];

const todayKey = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const pretty = (s) => {
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
};

export default function ExamenView() {
  const { examens, setExamens } = useData();
  const today = todayKey();

  const todays = useMemo(() => examens.find((e) => e.date === today), [examens, today]);

  const [draft, setDraft] = useState(() => {
    const base = { gratitude: '', presence: '', shortfall: '', tomorrow: '' };
    return todays ? { ...base, ...todays } : base;
  });
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(Boolean(todays));

  const save = () => {
    setExamens((prev) => {
      const rest = prev.filter((e) => e.date !== today);
      return [
        {
          id: todays?.id || `${today}-examen`,
          date: today,
          gratitude: draft.gratitude.trim(),
          presence: draft.presence.trim(),
          shortfall: draft.shortfall.trim(),
          tomorrow: draft.tomorrow.trim(),
          createdAt: todays?.createdAt || new Date().toISOString(),
        },
        ...rest,
      ];
    });
    setDone(true);
  };

  const past = examens.filter((e) => e.date !== today);

  // --- already done today ---------------------------------------------------
  if (done) {
    const entry = todays || draft;
    return (
      <div className="examen-view">
        <section className="examen-done">
          <span className="eyebrow">Today’s examen</span>
          <h3>{pretty(today)}</h3>
          {STEPS.map((s) =>
            entry[s.id] ? (
              <div key={s.id} className="examen-answer">
                <span className="examen-q">{s.title}</span>
                <p>{entry[s.id]}</p>
              </div>
            ) : null
          )}
          <button
            type="button"
            className="btn-text"
            onClick={() => {
              setDone(false);
              setStep(0);
            }}
          >
            Edit
          </button>
        </section>

        {past.length > 0 && <PastExamens entries={past} />}
      </div>
    );
  }

  // --- walking the steps ----------------------------------------------------
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="examen-view">
      <section className="examen-card">
        <div className="examen-dots">
          {STEPS.map((s, i) => (
            <span key={s.id} className={`dot${i <= step ? ' on' : ''}`} />
          ))}
        </div>

        <span className="eyebrow">
          Step {step + 1} of {STEPS.length}
        </span>
        <h3 className="examen-title">{current.title}</h3>
        <p className="examen-prompt">{current.prompt}</p>

        <textarea
          value={draft[current.id]}
          onChange={(e) => setDraft({ ...draft, [current.id]: e.target.value })}
          rows={5}
          autoFocus
          placeholder="Take your time…"
        />

        <div className="examen-actions">
          {step > 0 && (
            <button type="button" className="btn-text" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {isLast ? (
            <button type="button" className="btn-primary" onClick={save}>
              Finish
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => setStep(step + 1)}>
              Next
            </button>
          )}
        </div>
      </section>

      {past.length > 0 && <PastExamens entries={past} />}
    </div>
  );
}

function PastExamens({ entries }) {
  const [openId, setOpenId] = useState(null);
  return (
    <>
      <h3 className="section-title">Past examens</h3>
      <ul className="journal-list">
        {entries.map((e) => {
          const open = openId === e.id;
          return (
            <li key={e.id} className="journal-card">
              <button
                type="button"
                className="examen-past-head"
                onClick={() => setOpenId(open ? null : e.id)}
              >
                <span className="journal-date">{pretty(e.date)}</span>
                <span className="examen-peek">{e.gratitude || e.presence || '—'}</span>
              </button>
              {open && (
                <div className="examen-past-body">
                  {STEPS.map((s) =>
                    e[s.id] ? (
                      <div key={s.id} className="examen-answer">
                        <span className="examen-q">{s.title}</span>
                        <p>{e[s.id]}</p>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
