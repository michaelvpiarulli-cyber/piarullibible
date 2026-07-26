import { useState } from 'react';
import { useData } from '../context/DataProvider';

/** Starter disciplines — a rule of life is personal, so these are only seeds. */
const SUGGESTIONS = [
  'Morning prayer',
  'Scripture reading',
  'Confession',
  'Generosity',
  'Serve someone',
  'Fasting',
  'Sabbath rest',
  'Call a friend',
  'No phone before prayer',
];

const dayKey = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/** The last `n` days, oldest first. */
function recentDays(n) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d);
  }
  return out;
}

/** Consecutive days ending today (or yesterday, so today isn't yet a break). */
function streakOf(days) {
  let count = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    if (days?.[key]) count++;
    else if (i > 0) break; // today not done yet doesn't end the streak
  }
  return count;
}

export default function RuleView() {
  const { rule, setRule } = useData();
  const habits = rule.habits || [];

  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  const today = dayKey(new Date());
  const week = recentDays(7);

  const addHabit = (label) => {
    const trimmed = (label || '').trim();
    if (!trimmed) return;
    setRule((r) => ({
      ...r,
      habits: [
        ...(r.habits || []),
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: trimmed, days: {} },
      ],
    }));
    setName('');
    setAdding(true); // stay open so several can be added in one sitting
  };

  const toggle = (id, key) => {
    setRule((r) => ({
      ...r,
      habits: (r.habits || []).map((h) => {
        if (h.id !== id) return h;
        const days = { ...h.days };
        if (days[key]) delete days[key];
        else days[key] = true;
        return { ...h, days };
      }),
    }));
  };

  const remove = (id) =>
    setRule((r) => ({ ...r, habits: (r.habits || []).filter((h) => h.id !== id) }));

  const doneToday = habits.filter((h) => h.days?.[today]).length;

  return (
    <div className="rule-view">
      {habits.length > 0 && (
        <div className="stat-grid">
          <div className="stat-tile">
            <span className="tile-num">
              {doneToday}/{habits.length}
            </span>
            <span className="tile-label">Today</span>
          </div>
          <div className="stat-tile">
            <span className="tile-num">{habits.length}</span>
            <span className="tile-label">Practices</span>
          </div>
          <div className="stat-tile">
            <span className="tile-num">{Math.max(0, ...habits.map((h) => streakOf(h.days)))}</span>
            <span className="tile-label">Best streak</span>
          </div>
        </div>
      )}

      {habits.length > 0 && (
        <ul className="habit-list">
          {habits.map((h) => {
            const streak = streakOf(h.days);
            return (
              <li key={h.id} className="habit-card">
                <div className="habit-head">
                  <button
                    type="button"
                    className={`check${h.days?.[today] ? ' checked' : ''}`}
                    onClick={() => toggle(h.id, today)}
                    aria-label={`Mark ${h.name} done today`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12.5 4.5 4.5L19 7.5" />
                    </svg>
                  </button>
                  <div className="habit-body">
                    <span className="habit-name">{h.name}</span>
                    <span className="habit-meta">
                      {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} running` : 'Not started'}
                    </span>
                  </div>
                  <button type="button" className="btn-text danger" onClick={() => remove(h.id)}>
                    Remove
                  </button>
                </div>

                <div className="habit-week">
                  {week.map((d) => {
                    const key = dayKey(d);
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`habit-day${h.days?.[key] ? ' on' : ''}${key === today ? ' today' : ''}`}
                        onClick={() => toggle(h.id, key)}
                        title={d.toLocaleDateString()}
                      >
                        {d.toLocaleDateString(undefined, { weekday: 'narrow' })}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {habits.length === 0 && (
        <p className="empty-sub rule-intro">
          A rule of life is the set of practices you return to — not a burden, a trellis. Start with
          two or three.
        </p>
      )}

      {adding || habits.length === 0 ? (
        <div className="rule-adder">
          <form
            className="rule-add"
            onSubmit={(e) => {
              e.preventDefault();
              addHabit(name);
            }}
          >
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name a practice…"
            />
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              Add
            </button>
            {habits.length > 0 && (
              <button type="button" className="btn-text" onClick={() => setAdding(false)}>
                Done
              </button>
            )}
          </form>

          {/* Suggestions stay put so several can be added in a row. */}
          <div className="filter-row suggestions">
            {SUGGESTIONS.filter((s) => !habits.some((h) => h.name === s)).map((s) => (
              <button key={s} type="button" className="chip" onClick={() => addHabit(s)}>
                + {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button type="button" className="btn-primary rule-add-btn" onClick={() => setAdding(true)}>
          Add a practice
        </button>
      )}
    </div>
  );
}
