import { useState } from 'react';
import { useMemory, LEVELS, MAX_LEVEL } from '../hooks/useMemory';
import { TRANSLATION, TRANSLATION_LABEL } from './PassageText';
import { GAMES } from './memory/games';
import BlanksGame from './memory/BlanksGame';
import TypeGame from './memory/TypeGame';
import ScrambleGame from './memory/ScrambleGame';
import LettersGame from './memory/LettersGame';

const GAME_COMPONENTS = {
  blanks: BlanksGame,
  type: TypeGame,
  scramble: ScrambleGame,
  letters: LettersGame,
};

export default function MemorizeView() {
  const { verses, due, mastered, points, dailyCount, addVerse, removeVerse, review } = useMemory();

  const [ref, setRef] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [game, setGame] = useState('blanks');
  const [drill, setDrill] = useState(null); // the verse being practised

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

  const grade = (correct) => {
    review(drill.ref, correct);
    setDrill(null);
  };

  const GameComponent = GAME_COMPONENTS[game];

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

      {dailyCount > 0 && <p className="daily-note">{dailyCount} reviewed today — keep going.</p>}

      {/* --- active drill --- */}
      {drill && (
        <section className="drill-card">
          <span className="drill-ref">{drill.ref}</span>
          <GameComponent verse={drill} onGrade={grade} onExit={() => setDrill(null)} />
        </section>
      )}

      {/* --- game picker --- */}
      {!drill && verses.length > 0 && (
        <>
          <h3 className="section-title">Game</h3>
          <div className="game-grid">
            {GAMES.map((g) => (
              <button
                key={g.id}
                type="button"
                className={`game-card${game === g.id ? ' active' : ''}`}
                onClick={() => setGame(g.id)}
              >
                <span className="game-name">{g.label}</span>
                <span className="game-blurb">{g.blurb}</span>
              </button>
            ))}
          </div>
        </>
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
                      <button type="button" className="btn-text" onClick={() => setDrill(v)}>
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
            Add a verse above, then practise it four ways — fill the blanks, type it out, unscramble
            it, or recite from first letters ({TRANSLATION_LABEL}).
          </p>
        </div>
      )}
    </div>
  );
}
