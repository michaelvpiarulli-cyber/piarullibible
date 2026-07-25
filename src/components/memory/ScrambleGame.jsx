import { useMemo, useState } from 'react';
import { words, shuffle } from './games';

/**
 * Tap words back into order. Long verses are chunked so the tile bank stays
 * playable on a phone.
 */
const CHUNK = 12;

export default function ScrambleGame({ verse, onGrade, onExit }) {
  const all = useMemo(() => words(verse.text), [verse.text]);
  const [chunkIdx, setChunkIdx] = useState(0);

  const chunks = useMemo(() => {
    const out = [];
    for (let i = 0; i < all.length; i += CHUNK) out.push(all.slice(i, i + CHUNK));
    return out;
  }, [all]);

  const target = chunks[chunkIdx] || [];
  const seed = useMemo(
    () => verse.ref.split('').reduce((a, c) => a + c.charCodeAt(0), chunkIdx * 31 + 7),
    [verse.ref, chunkIdx]
  );

  const [placed, setPlaced] = useState([]);
  const [wrong, setWrong] = useState(null);

  const bank = useMemo(() => {
    const pool = target.map((w, i) => ({ w, i }));
    return shuffle(pool, seed);
  }, [target, seed]);

  const remaining = bank.filter((t) => !placed.some((p) => p.i === t.i));
  const done = placed.length === target.length && target.length > 0;
  const lastChunk = chunkIdx >= chunks.length - 1;

  const tap = (tile) => {
    if (tile.i === placed.length) {
      setPlaced([...placed, tile]);
      setWrong(null);
    } else {
      setWrong(tile.i);
      setTimeout(() => setWrong(null), 400);
    }
  };

  const nextChunk = () => {
    setPlaced([]);
    setChunkIdx(chunkIdx + 1);
  };

  return (
    <>
      {chunks.length > 1 && (
        <span className="chunk-note">
          Part {chunkIdx + 1} of {chunks.length}
        </span>
      )}

      <p className="drill-text assembled">
        {placed.map((p) => p.w).join(' ') || <span className="placeholder">Tap the words in order…</span>}
      </p>

      {!done && (
        <div className="tile-bank">
          {remaining.map((t) => (
            <button
              key={t.i}
              type="button"
              className={`word-tile${wrong === t.i ? ' wrong' : ''}`}
              onClick={() => tap(t)}
            >
              {t.w}
            </button>
          ))}
        </div>
      )}

      <div className="drill-actions">
        <button type="button" className="btn-text" onClick={onExit}>
          Exit
        </button>
        {placed.length > 0 && !done && (
          <button type="button" className="btn-text" onClick={() => setPlaced([])}>
            Reset
          </button>
        )}
        {done &&
          (lastChunk ? (
            <button type="button" className="btn-primary" onClick={() => onGrade(true)}>
              Complete
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={nextChunk}>
              Next part
            </button>
          ))}
      </div>
    </>
  );
}
