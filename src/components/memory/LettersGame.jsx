import { useMemo, useState } from 'react';
import { firstLetters } from './games';

/**
 * The classic memorization technique: every word reduced to its first letter,
 * recited aloud, then revealed to check.
 */
export default function LettersGame({ verse, onGrade, onExit }) {
  const letters = useMemo(() => firstLetters(verse.text), [verse.text]);
  const [revealed, setRevealed] = useState(false);

  return (
    <>
      <p className={`drill-text${revealed ? '' : ' letters'}`}>
        {revealed ? verse.text : letters.join(' ')}
      </p>

      {!revealed && <span className="chunk-note">Say it aloud, then reveal to check.</span>}

      {revealed ? (
        <div className="drill-actions">
          <button type="button" className="btn-secondary" onClick={() => onGrade(false)}>
            Missed it
          </button>
          <button type="button" className="btn-primary" onClick={() => onGrade(true)}>
            Got it
          </button>
        </div>
      ) : (
        <div className="drill-actions">
          <button type="button" className="btn-text" onClick={onExit}>
            Exit
          </button>
          <button type="button" className="btn-primary" onClick={() => setRevealed(true)}>
            Reveal
          </button>
        </div>
      )}
    </>
  );
}
