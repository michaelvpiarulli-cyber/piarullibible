import { useMemo, useState } from 'react';
import { useMemory, LEVELS, MAX_LEVEL } from '../hooks/useMemory';
import { TRANSLATION, TRANSLATION_LABEL } from './PassageText';

/**
 * Hide a share of the words so recall is active, not just recognition.
 *
 * Words are ranked by a stable pseudo-random score and the lowest-scoring share
 * is hidden. That guarantees the intended proportion actually gets blanked (a
 * modulo test does not — it clumps) while staying deterministic per verse, so
 * the same drill looks the same each time.
 */
function blankOut(text, level) {
  const share = Math.min(0.2 + level * 0.15, 0.85);
  const tokens = text.split(/(\s+)/);

  const candidates = [];
  tokens.forEach((w, i) => {
    if (!/^\s+$/.test(w) && w.replace(/[^A-Za-z]/g, '').length > 2) {
      // cheap stable hash of the word + position
      let h = i * 2654435761;
      for (let c = 0; c < w.length; c++) h = (h ^ w.charCodeAt(c)) * 16777619;
      candidates.push({ i, score: Math.abs(h % 10000) });
    }
  });

  candidates.sort((a, b) => a.score - b.score);
  const hide = new Set(candidates.slice(0, Math.round(candidates.length * share)).map((c) => c.i));

  return tokens.map((w, i) => ({ w, hidden: hide.has(i) }));
}

export default function MemorizeView() {
  const { verses, due, mastered, points, dailyCount, addVerse, removeVerse, review } = useMemory();

  const [ref, setRef] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [drill, setDrill] = useState(null); // { ref, text, level }
  const [revealed, setRevealed] = useState(false);

  const lookup = async (e) => {
    e.preventDefault();
    if (!ref.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const r = await fetch(
        `https://bible-api.com/${encodeURIComponent(ref.trim())}?translation=${TRANSLATION}`
      );
      if (!r.ok) throw new Error('Reference not found');
      const d = await r.json();
      const text = (d.text || '').replace(/\s*\n\s*/g, ' ').trim();
      if (!text) throw new Error('Reference not found');
      addVerse(d.reference || ref.trim(), text);
      setRef('');
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error — try again.' : err.message);
    }
    setAdding(false);
  };

  const parts = useMemo(
    () => (drill ? blankOut(drill.text, drill.level) : []),
    [drill]
  );

  const grade = (correct) => {
    review(drill.ref, correct);
    setDrill(null);
    setRevealed(false);
  };

  return (
    <div className="memorize-view">
      <div className="stat-grid">
        <div className="stat-tile">
          <span className="tile-num">{points}</span>
          <span className="tile-label">Points</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{mastered}</span>
          <span className="tile-label">Mastered</span>
        </div>
        <div className="stat-tile">
          <span className="tile-num">{due.length}</span>
          <span className="tile-label">Due now</span>
        </div>
      </div>

      {dailyCount > 0 && (
        <p className="daily-note">{dailyCount} reviewed today — keep going.</p>
      )}

      {/* --- drill --- */}
      {drill && (
        <section className="drill-card">
          <span className="drill-ref">{drill.ref}</span>
          <p className="drill-text">
            {revealed
              ? drill.text
              : parts.map((p, i) =>
                  p.hidden ? (
                    <span key={i} className="blank">
                      {'_'.repeat(Math.min(p.w.length, 9))}
                    </span>
                  ) : (
                    <span key={i}>{p.w}</span>
                  )
                )}
          </p>

          {revealed ? (
            <div className="drill-actions">
              <button type="button" className="btn-secondary" onClick={() => grade(false)}>
                Missed it
              </button>
              <button type="button" className="btn-primary" onClick={() => grade(true)}>
                Got it
              </button>
            </div>
          ) : (
            <div className="drill-actions">
              <button
                type="button"
                className="btn-text"
                onClick={() => {
                  setDrill(null);
                  setRevealed(false);
                }}
              >
                Exit
              </button>
              <button type="button" className="btn-primary" onClick={() => setRevealed(true)}>
                Reveal
              </button>
            </div>
          )}
        </section>
      )}

      {/* --- add a verse --- */}
      {!drill && (
        <form className="memorize-add" onSubmit={lookup}>
          <input
            type="text"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Add a verse — e.g. John 3:16"
          />
          <button type="submit" className="btn-primary" disabled={adding || !ref.trim()}>
            {adding ? 'Finding…' : 'Add'}
          </button>
        </form>
      )}
      {error && <span className="account-error">{error}</span>}

      {/* --- verse list --- */}
      {!drill && verses.length > 0 && (
        <ul className="verse-list">
          {verses
            .slice()
            .sort((a, b) => a.dueAt - b.dueAt)
            .map((v) => {
              const isDue = v.dueAt <= Date.now();
              return (
                <li key={v.ref} className={`memo-card${v.level >= MAX_LEVEL ? ' mastered' : ''}`}>
                  <div className="memo-head">
                    <span className="memo-ref">{v.ref}</span>
                    <span className={`memo-level lvl-${v.level}`}>{LEVELS[v.level].name}</span>
                  </div>

                  <div className="memo-pips" aria-label={`Level ${v.level} of ${MAX_LEVEL}`}>
                    {LEVELS.slice(1).map((l) => (
                      <span key={l.level} className={`pip${v.level >= l.level ? ' on' : ''}`} />
                    ))}
                  </div>

                  <p className="memo-text">{v.text}</p>

                  <div className="memo-actions">
                    <span className="memo-meta">
                      {isDue
                        ? 'Due now'
                        : `Next in ${Math.max(1, Math.round((v.dueAt - Date.now()) / 86400000))}d`}
                      {v.streak > 1 ? ` · ${v.streak} in a row` : ''}
                    </span>
                    <div>
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => {
                          setDrill({ ref: v.ref, text: v.text, level: v.level });
                          setRevealed(false);
                        }}
                      >
                        Practice
                      </button>
                      <button
                        type="button"
                        className="btn-text danger"
                        onClick={() => removeVerse(v.ref)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
        </ul>
      )}

      {!drill && verses.length === 0 && (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 7.5C10.5 5.5 8 5 4.5 5.5v12C8 17 10.5 17.5 12 19.5c1.5-2 4-2.5 7.5-2v-12C16 5 13.5 5.5 12 7.5Z" />
            <path d="M12 7.5v12" />
          </svg>
          <p className="empty-title">Hide his word in your heart</p>
          <p className="empty-sub">
            Add a verse above. Practice earns points and levels it up — from Learning all the way
            to Mastered ({TRANSLATION_LABEL}).
          </p>
        </div>
      )}
    </div>
  );
}
