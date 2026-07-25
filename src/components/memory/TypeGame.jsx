import { useState } from 'react';
import { gradeTyped, words, normalize } from './games';

/** Type the verse from memory; graded word-by-word so it's objective. */
export default function TypeGame({ verse, onGrade, onExit }) {
  const [attempt, setAttempt] = useState('');
  const [result, setResult] = useState(null);

  const check = () => setResult(gradeTyped(attempt, verse.text));

  if (result) {
    const typed = words(attempt).map(normalize).filter(Boolean);
    return (
      <>
        <p className="drill-score">
          {Math.round(result.accuracy * 100)}% — {result.hits} of {result.total} words
        </p>

        <p className="drill-text diff">
          {words(verse.text).map((w, i) => (
            <span key={i} className={typed[i] === normalize(w) ? 'ok' : 'miss'}>
              {w}{' '}
            </span>
          ))}
        </p>

        <div className="drill-actions">
          <button
            type="button"
            className="btn-text"
            onClick={() => {
              setResult(null);
              setAttempt('');
            }}
          >
            Try again
          </button>
          <button type="button" className="btn-primary" onClick={() => onGrade(result.passed)}>
            {result.passed ? 'Nailed it' : 'Continue'}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <textarea
        className="drill-input"
        value={attempt}
        onChange={(e) => setAttempt(e.target.value)}
        placeholder="Type the verse from memory…"
        rows={4}
        autoFocus
      />
      <div className="drill-actions">
        <button type="button" className="btn-text" onClick={onExit}>
          Exit
        </button>
        <button type="button" className="btn-primary" disabled={!attempt.trim()} onClick={check}>
          Check
        </button>
      </div>
    </>
  );
}
