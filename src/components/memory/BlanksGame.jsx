import { useMemo, useState } from 'react';
import { blankOut } from './games';

/** Recall the hidden words; difficulty rises with the verse's level. */
export default function BlanksGame({ verse, onGrade, onExit }) {
  const parts = useMemo(() => blankOut(verse.text, verse.level), [verse.text, verse.level]);
  const [revealed, setRevealed] = useState(false);

  return (
    <>
      <p className="drill-text">
        {revealed
          ? verse.text
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
